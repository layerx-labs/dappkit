pragma solidity >=0.6.0 <=8.0.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "../math/SafePercentMath.sol";
import "../utils/Governed.sol";
import "./BountyToken.sol";
import "./INetwork_v2.sol";
import "./Network_Registry.sol";


contract Network_v2 is Governed {
    using SafeMath for uint256;

    uint256 constant MAX_PERCENT = 100000000;

    uint256 constant MAX_MERGE_CREATOR_FEE_SHARE = 10000000;
    uint256 constant MAX_PROPOSER_FEE_SHARE = 10000000;
    uint256 constant MAX_PERCENTAGE_NEEDED_FOR_DISPUTE = 51000000;

    uint256 constant MAX_DISPUTABLE_TIME = 20 days;
    uint256 constant MIN_DISPUTABLE_TIME = 1 minutes;

    uint256 constant MAX_DRAFT_TIME = 20 days;
    uint256 constant MIN_DRAFT_TIME = 1 minutes;

    uint256 constant MIN_CANCELABLE_TIME = 180 days;

    uint256 constant MAX_COUNCIL_AMOUNT = 50000000;
    uint256 constant MIN_COUNCIL_AMOUNT = 1;

    uint256 public DIVISOR = 1000000; // public because userland uses this to convert values to send

    ERC20 public networkToken;
    BountyToken public nftToken;
    Network_Registry public registry;

    uint256 public totalNetworkToken = 0; // TVL essentially

    uint256 public oracleExchangeRate = 1000000; // 1:1
    uint256 public oraclesDistributed = 0; // essentially, the converted math of TVL

    uint256 public closedBounties = 0;
    uint256 public canceledBounties = 0;

    uint256 public mergeCreatorFeeShare = 500000; // 0.5%
    uint256 public proposerFeeShare = 2000000; // 2%
    uint256 public percentageNeededForDispute = 3000000; // 3%

    uint256 public disputableTime = 3 days;
    uint256 public draftTime = 1 days;
    uint256 public cancelableTime = 183 days;

    uint256 public councilAmount = 25000000*10**18; // 25M * 10 to the power of 18 (decimals)

    uint256 public bountiesIndex = 0;
    mapping(uint256 => INetwork_v2.Bounty) bounties;
    mapping(address => uint256[]) bountiesOfAddress;
    mapping(string => uint256) public cidBountyId;
    mapping(address => INetwork_v2.Oracle) public oracles;
    mapping(address => INetwork_v2.Delegation[]) delegations;
    mapping(address => mapping(bytes32 => uint256)) public disputes;

    event BountyCreated(uint256 id, string cid, address indexed creator);
    event BountyCanceled(uint256 indexed id);
    event BountyFunded(uint256 indexed id, bool indexed funded, address benefactor, int256 amount);
    event BountyClosed(uint256 indexed id, uint256 proposalId);
    event BountyPullRequestCreated(uint256 indexed bountyId, uint256 pullRequestId);
    event BountyPullRequestReadyForReview(uint256 indexed bountyId, uint256 pullRequestId);
    event BountyPullRequestCanceled(uint256 indexed bountyId, uint256 pullRequestId);
    event BountyProposalCreated(uint256 indexed bountyId, uint256 prId, uint256 proposalId);
    event BountyProposalDisputed(uint256 indexed bountyId, uint256 prId, uint256 proposalId, uint256 weight, bool overflow);
    event BountyProposalRefused(uint256 indexed bountyId, uint256 prId, uint256 proposalId);
    event BountyAmountUpdated(uint256 indexed id, uint256 amount);
    event OraclesChanged(address indexed actor, int256 indexed actionAmount, uint256 indexed newLockedTotal);

    constructor(address _networkToken, address _registry) Governed() {
        networkToken = ERC20(_networkToken);
        registry = Network_Registry(_registry);
    }



    function _isBountyOwner(uint256 id) internal view {
        require(bounties[id].creator == msg.sender, "OW1");
    }

    function _bountyExists(uint256 id) internal view {
        require(bounties[id].creator != address(0), "BE");
    }

    function _isFundingRequest(uint256 id, bool shouldBe) internal view {
        require((bounties[id].fundingAmount > 0) == shouldBe, "BF1");
    }

    function _isFunded(uint256 id, bool shouldBe) internal view {
        require(bounties[id].funded == shouldBe, "RF");
    }

    function _isInDraft(uint256 id, bool shouldBe) internal view {
        _bountyExists(id);
        require((block.timestamp < bounties[id].creationDate.add(draftTime)) == shouldBe, "BDT1");
    }

    function _isNotCanceled(uint256 id) internal view {
        require(bounties[id].canceled == false, "B1");
    }

    function _isOpen(uint256 id) internal view {
        require(bounties[id].closed == false, "B3");
    }

    function _proposalExists(uint256 _bountyId, uint256 _proposalId) internal view {
        require(_proposalId <= bounties[_bountyId].proposals.length - 1, "DBP0");
    }

    function _lessThan20MoreThan1(uint256 value) internal {
        require(value <= 20 days, "T1");
        require(value >= 1 minutes, "T2");
    }

    function _amountGT0(uint256 _amount) internal view {
        require(_amount > 0, "L0");
    }

    function _cancelFundingRequest(uint256 id) internal {
        INetwork_v2.Bounty storage bounty = bounties[id];

        for (uint256 i = 0; i <= bounty.funding.length - 1; i++) {
            INetwork_v2.Benefactor storage x = bounty.funding[i];
            if (x.amount > 0) {
                x.amount = 0;
                require(ERC20(bounty.transactional).transfer(x.benefactor, x.amount), "C4");
            }
        }

        bounty.canceled = true;
        canceledBounties = canceledBounties.add(1);

        emit BountyCanceled(id);

        require(ERC20(bounty.rewardToken).transfer(msg.sender, bounty.rewardAmount), "C5");
    }

    function _cancelBounty(uint256 id) internal {
        INetwork_v2.Bounty storage bounty = bounties[id];
        ERC20 erc20 = ERC20(bounty.transactional);

        bounty.canceled = true;

        uint256 returnAmount = bounty.tokenAmount;
        if (address(registry) != address(0)) {
            if (registry.treasury() != address(0)) {
                uint256 treasuryFee = _toPercent(bounty.tokenAmount, registry.cancelFeePercentage());
                returnAmount = returnAmount.sub(treasuryFee);
                require(erc20.transfer(registry.treasury(), treasuryFee), "C3");
            }
        }

        require(erc20.transfer(bounty.creator, returnAmount), "C2");

        canceledBounties = canceledBounties.add(1);

        emit BountyCanceled(id);
    }

    function _toPercent(uint256 a, uint256 b) internal returns (uint256) {
        return (a.mul(b)).div(MAX_PERCENT);
    }

    function getBounty(uint256 id) external view returns (INetwork_v2.Bounty memory) {
        return bounties[id];
    }

    function getDelegationsFor(address _address) external view returns (INetwork_v2.Delegation[] memory) {
        return delegations[_address];
    }

    function getBountiesOfAddress(address owner) external view returns (uint256[] memory) {
        return bountiesOfAddress[owner];
    }

    function treasuryInfo() external view returns(address, uint256, uint256) {
        if (address(registry) != address(0))
            return (registry.treasury(), registry.closeFeePercentage(), registry.cancelFeePercentage());
        return (address(0), 0, 0);
    }

    function changeNetworkParameter(uint256 _parameter, uint256 _value) public onlyGovernor {
        if (_parameter == uint256(INetwork_v2.Params.councilAmount)) {
            require(_value >= MIN_COUNCIL_AMOUNT * 10 ** networkToken.decimals(), "C1");
            require(_value <= MAX_COUNCIL_AMOUNT * 10 ** networkToken.decimals(), "C2");
            councilAmount = _value;
        } else if (_parameter == uint256(INetwork_v2.Params.draftTime)) {
            require(_value >= MIN_DRAFT_TIME && _value <= MAX_DRAFT_TIME, "C3");
            draftTime = _value;
        } else if (_parameter == uint256(INetwork_v2.Params.disputableTime)) {
            require(_value >= MIN_DISPUTABLE_TIME && _value <= MAX_DISPUTABLE_TIME, "C4");
            disputableTime = _value;
        } else if (_parameter == uint256(INetwork_v2.Params.percentageNeededForDispute)) {
            require(_value >= 0 && _value <= MAX_PERCENTAGE_NEEDED_FOR_DISPUTE, "C5");
            percentageNeededForDispute = _value;
        } else if (_parameter == uint256(INetwork_v2.Params.mergeCreatorFeeShare)) {
            require(_value >= 0 && _value <= MAX_MERGE_CREATOR_FEE_SHARE, "C6");
            mergeCreatorFeeShare = _value;
        } else if (_parameter == uint256(INetwork_v2.Params.proposerFeeShare)) {
            require(_value >= 0 && _value <= MAX_PROPOSER_FEE_SHARE);
            proposerFeeShare = _value;
        } else if (_parameter == uint256(INetwork_v2.Params.oracleExchangeRate)) {
            require(_value >= 0, "EX0");
            require(totalNetworkToken == 0, "EX1");
            oracleExchangeRate = _value;
        } else if (_parameter == uint256(INetwork_v2.Params.cancelableTime)) {
            require(_value >= MIN_CANCELABLE_TIME, "C3");
            cancelableTime = _value;
        }
    }

    /*
     * Lock or Unlock tokens into this smart contract by applying a exchange rate configured in {@oracleExchangeRate}
     */
    function manageOracles(bool lock, uint256 amount) external {
        require(amount > 0, "M03");
        uint256 exchanged = 0;
        if (lock) {
            exchanged = amount.mul(oracleExchangeRate.div(DIVISOR));
            oracles[msg.sender].locked = oracles[msg.sender].locked.add(exchanged);
            require(networkToken.transferFrom(msg.sender, address(this), amount), "MO0");
            totalNetworkToken = totalNetworkToken.add(amount);
            oraclesDistributed = oraclesDistributed.add(exchanged);
        } else {
            exchanged = amount.div(oracleExchangeRate.div(DIVISOR)); // We are unlocking POINTS not tokens
            require(amount <= oracles[msg.sender].locked, "MO1");
            require(networkToken.transfer(msg.sender, exchanged), "MO2");
            oracles[msg.sender].locked = oracles[msg.sender].locked.sub(amount);
            totalNetworkToken = totalNetworkToken.sub(exchanged);
            oraclesDistributed = oraclesDistributed.sub(amount);

        }

        emit OraclesChanged(msg.sender, int256(lock ? amount : -amount), oracles[msg.sender].locked.add(oracles[msg.sender].byOthers));
    }

    /*
     * allocate voting power from the mapper of one address to another
     */
    function delegateOracles(uint256 amount, address toAddress) external {
        require(amount > 0, "M03");
        require(amount <= oracles[msg.sender].locked, "MD0");
        oracles[msg.sender].locked = oracles[msg.sender].locked.sub(amount);
        oracles[msg.sender].toOthers = oracles[msg.sender].toOthers.add(amount);
        oracles[toAddress].byOthers = oracles[toAddress].byOthers.add(amount);
        delegations[msg.sender].push(INetwork_v2.Delegation(msg.sender, toAddress, amount));

        emit OraclesChanged(msg.sender, int256(-amount), oracles[msg.sender].locked.add(oracles[msg.sender].byOthers));
        emit OraclesChanged(toAddress, int256(amount), oracles[toAddress].locked.add(oracles[toAddress].byOthers));
    }

    /*
     * return voting power given to another address
     */
    function takeBackOracles(uint256 entryId) external {
        require(delegations[msg.sender][entryId].amount > 0, "MD1");
        uint256 amount = delegations[msg.sender][entryId].amount;
        address delegated = delegations[msg.sender][entryId].to;
        oracles[msg.sender].locked = oracles[msg.sender].locked.add(amount);
        oracles[msg.sender].toOthers = oracles[msg.sender].toOthers.sub(amount);
        oracles[delegated].byOthers = oracles[delegated].byOthers.sub(amount);
        delegations[msg.sender][entryId].amount = 0;

        emit OraclesChanged(msg.sender, int256(amount), oracles[msg.sender].locked.add(oracles[msg.sender].byOthers));
        emit OraclesChanged(delegated, int256(-amount), oracles[delegated].locked.add(oracles[delegated].byOthers));
    }

    /*
     * Create a new bounty entry
     * Transfer tokens (transactional or reward) to the smart contract
     * If a registry exists, check that the tokens are allowed
     * Assert rules,
     *  A bounty can't have a funding amount
     *  A funding request can't have tokenAmount
     * emit event
     */
    function openBounty(
        uint256 tokenAmount,
        address transactional,
        address rewardToken,
        uint256 rewardAmount,
        uint256 fundingAmount,
        string memory cid,
        string memory title,
        string memory repoPath,
        string memory branch,
        string memory githubUser
    ) external {
        bountiesIndex = bountiesIndex.add(1);

        bounties[bountiesIndex].id = bountiesIndex;
        bounties[bountiesIndex].cid = cid;
        bounties[bountiesIndex].title = title;
        bounties[bountiesIndex].repoPath = repoPath;
        bounties[bountiesIndex].branch = branch;
        bounties[bountiesIndex].githubUser = githubUser;
        bounties[bountiesIndex].creator = msg.sender;
        bounties[bountiesIndex].creationDate = block.timestamp;
        bounties[bountiesIndex].transactional = transactional;

        bounties[bountiesIndex].closed = false;
        bounties[bountiesIndex].canceled = false;

        if (address(registry) != address(0)) {
            if (registry.treasury() != address(0)) {
                require(registry.isAllowedToken(transactional, true) == true, "O6");
                if (fundingAmount > 0 && address(0) != rewardToken) {
                    require(registry.isAllowedToken(rewardToken, false) == true, "O7");
                }
            }
        }

        if (address(0) != rewardToken) {
            require(tokenAmount == 0, "O1");
            _amountGT0(rewardAmount);
            _amountGT0(fundingAmount);
            require(ERC20(rewardToken).transferFrom(msg.sender, address(this), rewardAmount));

            bounties[bountiesIndex].rewardAmount = rewardAmount;
            bounties[bountiesIndex].rewardToken = rewardToken;
            bounties[bountiesIndex].fundingAmount = fundingAmount;
            bounties[bountiesIndex].tokenAmount = 0;
        } else {
            require(fundingAmount > 0 && tokenAmount == 0 || fundingAmount == 0 && tokenAmount > 0, "O5");

            if (fundingAmount > 0) {
                bounties[bountiesIndex].fundingAmount = fundingAmount;
                bounties[bountiesIndex].tokenAmount = 0;
            } else {
                bounties[bountiesIndex].tokenAmount = tokenAmount;
                require(ERC20(transactional).transferFrom(msg.sender, address(this), tokenAmount), "O4");
            }
        }

        cidBountyId[cid] = bounties[bountiesIndex].id;
        bountiesOfAddress[msg.sender].push(bounties[bountiesIndex].id);

        emit BountyCreated(bounties[bountiesIndex].id, bounties[bountiesIndex].cid, msg.sender);
    }

    /*
     * Allow a network owner to cancel a bounty entry if X time has passed
     * Assert rules,
     *   sender is governor
     *   if bounty entry has proposals, require that all are disputed
     */
    function hardCancel(uint256 id) external {
        require(bounties[id].creator != address(0), "HC1");
        require(msg.sender == _governor, "HC2");
        require(block.timestamp.sub(bounties[id].creationDate) >= cancelableTime, "HCV3");

        if (bounties[id].proposals.length > 0) {
            for (uint256 i = 0; i <= bounties[id].proposals.length - 1; i++) {
                INetwork_v2.Proposal memory proposal = bounties[id].proposals[i];
                require((proposal.disputeWeight >= _toPercent(oraclesDistributed, percentageNeededForDispute)) || proposal.refusedByBountyOwner == true, "HC4");
            }
        }

        if (bounties[id].fundingAmount == 0) {
            _cancelBounty(id);
        } else {
            _cancelFundingRequest(id);
        }
    }

    /*
     * Allow a bounty owner to cancel the created bounty
     * Assert rules,
     *  only bounty owner
     *  is in draft
     *  is still open
     *  is not a funding request
     */
    function cancelBounty(uint256 id) external {
        _isBountyOwner(id);
        _isInDraft(id, true);
        _isNotCanceled(id);
        _isFundingRequest(id, false);
        _cancelBounty(id);
    }

    /*
     * Allow a bounty owner to cancel the funding request
     * Assert rules,
     *  only bounty owner
     *  is in draft
     *    funding requests are in draft until 100%
     *  is still open
     *  is a funding request
     */
    function cancelFundRequest(uint256 id) external {
        _isBountyOwner(id);
        _isFundingRequest(id, true);
        require(bounties[id].funded == false, "");
        _isNotCanceled(id);
        _cancelFundingRequest(id);
    }

    /*
     * Update the amount of the bounty entry;
     *  If new amount is bigger transfer from sender
     *  otherwise return the difference
     *
     * Assert rules,
     *   only bounty owner
     *   still in draft
     *   is not funding request
     */
    function updateBountyAmount(uint256 id, uint256 newTokenAmount) external {
        _isBountyOwner(id);
        _isInDraft(id, true);
        _isFundingRequest(id, false);
        require(newTokenAmount > 0 && (bounties[id].tokenAmount != newTokenAmount) , "U1");

        INetwork_v2.Bounty storage bounty = bounties[id];
        ERC20 erc20 = ERC20(bounty.transactional);

        bounty.tokenAmount = newTokenAmount;

        emit BountyAmountUpdated(id, newTokenAmount);

        if (newTokenAmount > bounty.tokenAmount) {
            require(erc20.transferFrom(msg.sender, address(this), newTokenAmount.sub(bounty.tokenAmount)), "U2");
        } else {
            require(erc20.transfer(bounty.creator, bounty.tokenAmount.sub(newTokenAmount)), "U3");
        }
    }

    /*
     * Add a funding entry to the funding request;
     *  transfer the amount of tokens to the smart contract
     *
     * Assert rules,
     *   is funding request
     *   is not funded
     *   is open
     */
    function fundBounty(uint256 id, uint256 fundingAmount) external {
        _isFundingRequest(id, true);
        _isFunded(id, false);
        _isNotCanceled(id);

        INetwork_v2.Bounty storage bounty = bounties[id];
        require(bounty.tokenAmount.add(fundingAmount) <= bounty.fundingAmount, "F3");

        bounty.funding.push(INetwork_v2.Benefactor(msg.sender, fundingAmount, block.timestamp));

        bounty.tokenAmount = bounty.tokenAmount.add(fundingAmount);
        bounty.funded = bounty.fundingAmount == bounty.tokenAmount;

        emit BountyFunded(id, bounty.funded, msg.sender, int256(fundingAmount));

        require(ERC20(bounty.transactional).transferFrom(msg.sender, address(this), fundingAmount), "F3");
    }

    /*
     * Retracts an array of funding ids -- Retracting a funding can on
     *
     * Assert rules,
     *  bounty is still in draft
     *  bounty is funding request
     *  bounty is not canceled
     *  Benefactor entry must match msg.sender
     */
    function retractFunds(uint256 id, uint256[] calldata fundingIds) external {
        _isInDraft(id, true);
        _isFundingRequest(id, true);
        _isNotCanceled(id);

        INetwork_v2.Bounty storage bounty = bounties[id];

        for (uint256 i = 0; i <= fundingIds.length - 1; i++) {
            INetwork_v2.Benefactor storage x = bounty.funding[fundingIds[i]];
            require(x.benefactor == msg.sender, "RF1");
            _amountGT0(x.amount);

            bounty.tokenAmount = bounty.tokenAmount.sub(x.amount);
            x.amount = 0;

            require(ERC20(bounty.transactional).transfer(msg.sender, x.amount), "RF3");
        }

        bounty.funded = bounty.tokenAmount == bounty.fundingAmount;
        emit BountyFunded(id, bounty.funded, msg.sender, int256(bounty.tokenAmount - bounty.fundingAmount));
    }

    /*
     * Create a pull request entry associated with a bounty
     *
     * Assert rules,
     *  bounty is not closed
     *  bounty is not canceled
     *  bounty is not in draft
     */
    function createPullRequest(
        uint256 forBountyId,
        string memory originRepo,
        string memory originBranch,
        string memory originCID,
        string memory userRepo,
        string memory userBranch,
        uint256 cid
    ) external {
        _isOpen(forBountyId);
        _isNotCanceled(forBountyId);
        _isInDraft(forBountyId, false);

        INetwork_v2.Bounty storage bounty = bounties[forBountyId];

        INetwork_v2.PullRequest memory pullRequest;
        pullRequest.cid = cid;
        pullRequest.id = bounty.pullRequests.length;

        pullRequest.userBranch = userBranch;
        pullRequest.userRepo = userRepo;

        pullRequest.originBranch = originBranch;
        pullRequest.originRepo = originRepo;
        pullRequest.originCID = originCID;
        pullRequest.creator = msg.sender;

        bounty.pullRequests.push(pullRequest);

        emit BountyPullRequestCreated(forBountyId, pullRequest.id);
    }

    /*
     * Allows for a PR entry to be deleted by its creator
     * Assert rules,
     *   bounty is open, not closed and not in draft
     *   PR entry must exist
     *   PR creator must be sender
     *   PR can't have been used in a proposal
     */
    function cancelPullRequest(uint256 ofBounty, uint256 prId) public {
        _isOpen(ofBounty);
        _isInDraft(ofBounty, false);
        _isNotCanceled(ofBounty);

        require(prId <= bounties[ofBounty].pullRequests.length - 1, "CPR1");
        require(bounties[ofBounty].pullRequests[prId].canceled == false, "CPR2");
        require(bounties[ofBounty].pullRequests[prId].creator == msg.sender, "CPR3");

//        We should check that the PR is not canceled on the other side - The owner of the PR should know better than the proposer
//        for (uint256 i = 0; i < bounties[ofBounty].proposals.length; i++) {
//            require(bounties[ofBounty].proposals[i].prId != prId, "CPR4");
//        }

        bounties[ofBounty].pullRequests[prId].canceled = true;

        emit BountyPullRequestCanceled(ofBounty, prId);
    }

    /*
     * Mark a PR entry as being ready for review so proposals can be created from it
     *
     * Assert rules,
     *   bounty is open, not closed and not in draft
     *   PR can't have been previously marked as ready
     *   PR creator must match sender
     *   PR has to exist
     */
    function markPullRequestReadyForReview(uint256 bountyId, uint256 pullRequestId) public {
        _isInDraft(bountyId, false);
        _isNotCanceled(bountyId);
        _isOpen(bountyId);

        require(pullRequestId <= bounties[bountyId].pullRequests.length - 1, "PRR1");
        require(bounties[bountyId].pullRequests[pullRequestId].ready == false, "PRR2");
        require(bounties[bountyId].pullRequests[pullRequestId].creator == msg.sender, "PRR3");
        require(bounties[bountyId].pullRequests[pullRequestId].canceled == false, "PRR4");

        bounties[bountyId].pullRequests[pullRequestId].ready = true;

        emit BountyPullRequestReadyForReview(bountyId, pullRequestId);
    }

    /*
     * Create a proposal entry by using a combination of a bounty id with a pr id that has been marked as ready
     * and providing the distribution for this payment
     *
     * Assert rules,
     *   bounty is open, not closed and not in draft
     *   sender must be council member
     *   pr id must exist and be ready
     *   the total distribution matches 100 (100% percent)
     */
    function createBountyProposal(
        uint256 id,
        uint256 prId,
        address[] calldata recipients,
        uint256[] calldata percentages
    ) public {
        _isInDraft(id, false);
        _isOpen(id);
        _isNotCanceled(id);

        require(oracles[msg.sender].locked.add(oracles[msg.sender].byOthers) >= councilAmount, "OW0");
        require(prId <= bounties[id].pullRequests.length - 1, "CBP0");
        require(bounties[id].pullRequests[prId].ready == true, "CBP1");
        require(bounties[id].pullRequests[prId].canceled == false, "CBP2");

        INetwork_v2.Bounty storage bounty = bounties[id];

        bounty.proposals.push();
        INetwork_v2.Proposal storage proposal = bounty.proposals[bounty.proposals.length - 1];

        proposal.id = bounty.proposals.length - 1;
        proposal.prId = prId;
        proposal.creationDate = block.timestamp;
        proposal.creator = msg.sender;

        uint256 _total = 0;

        for (uint i = 0; i < recipients.length; i++) {
            _total = _total.add(bounty.tokenAmount.div(100).mul(percentages[i]));
            proposal.details.push();
            proposal.details[i].recipient = recipients[i];
            proposal.details[i].percentage = percentages[i];
        }

        require(_total == bounty.tokenAmount, "CBP1");

        emit BountyProposalCreated(id, prId, proposal.id);
    }

    /*
     * Dispute a proposal by using oracles (voting points), this can only be done once per proposal by each sender
     *  !these can be reused and aren't locked until a proposal is accepted or disputed!
     *
     * Assert rules,
     *   bounty is open, not closed and not in draft
     *   proposal exists
     *   sender hasn't disputed before
     *   sender weight (total of oracles) must be higher than 0
     */
    function disputeBountyProposal(uint256 bountyId, uint256 proposalId) external {
        _isInDraft(bountyId, false);
        _isOpen(bountyId);
        _isNotCanceled(bountyId);
        _proposalExists(bountyId, proposalId);

        bytes32 b32 = keccak256(abi.encodePacked(bountyId, proposalId));

        require(disputes[msg.sender][b32] == 0, "DBP1");

        uint256 weight = oracles[msg.sender].locked.add(oracles[msg.sender].byOthers);

        _amountGT0(weight);

        INetwork_v2.Proposal storage proposal = bounties[bountyId].proposals[proposalId];

        proposal.disputeWeight = proposal.disputeWeight.add(weight);
        disputes[msg.sender][b32] = weight;

        emit BountyProposalDisputed(bountyId, proposal.prId, proposalId, proposal.disputeWeight, proposal.disputeWeight >= _toPercent(oraclesDistributed, percentageNeededForDispute));
    }

    /*
     * Allows bounty creators to refuse a proposal
     *
     * Assert rules,
     *   bounty is open, not closed and not in draft
     *   is bounty owner
     *   proposal exists
     */
    function refuseBountyProposal(uint256 bountyId, uint256 proposalId) external {
        _isInDraft(bountyId, false);
        _isNotCanceled(bountyId);
        _isOpen(bountyId);
        _isBountyOwner(bountyId);
        _proposalExists(bountyId, proposalId);

        bounties[bountyId].proposals[proposalId].refusedByBountyOwner = true;

        emit BountyProposalRefused(bountyId, bounties[bountyId].proposals[proposalId].prId, proposalId);
    }

    /*
     * Close and distribute a bounty entry, anyone can use this function and will be rewarded for it
     *  ! if bounty is a funding request, and rewards exist, also distribute the rewards for benefactors
     *  ! if a registry, or a nftToken, exists - award a bounty token for each participant
     *
     * Assert rules,
     *   bounty is open, not closed and not in draft
     *   proposal exists
     */
    function closeBounty(uint256 id, uint256 proposalId, string memory ipfsUri) external {
        _isOpen(id);
        _isNotCanceled(id);
        _isInDraft(id, false);
        _proposalExists(id, proposalId);

        INetwork_v2.Bounty storage bounty = bounties[id];
        ERC20 erc20 = ERC20(bounty.transactional);
        INetwork_v2.Proposal storage proposal = bounty.proposals[proposalId];

        require(block.timestamp >= bounty.proposals[proposalId].creationDate.add(disputableTime), "CB2");
        require(proposal.disputeWeight < _toPercent(oraclesDistributed, percentageNeededForDispute), "CB3");
        require(proposal.refusedByBountyOwner == false, "CB7");

        uint256 returnAmount = bounty.tokenAmount;
        uint256 treasuryAmount = 0;

        if (address(registry) != address(0)) {
            if (registry.treasury() != address(0)) {
                treasuryAmount = _toPercent(bounty.tokenAmount, registry.closeFeePercentage());
                returnAmount = returnAmount.sub(treasuryAmount);
            }
        }

        uint256 mergerFee = _toPercent(returnAmount, mergeCreatorFeeShare);
        uint256 proposerFee = _toPercent(returnAmount.sub(mergerFee), proposerFeeShare);
        uint256 proposalAmount = returnAmount.sub(mergerFee).sub(proposerFee);

        bounty.closed = true;
        bounty.closedDate = block.timestamp;
        closedBounties = closedBounties.add(1);

        emit BountyClosed(id, proposalId);

        for (uint256 i = 0; i <= proposal.details.length - 1; i++) {
            INetwork_v2.ProposalDetail memory detail = proposal.details[i];
            INetwork_v2.BountyConnector memory award = INetwork_v2.BountyConnector(address(this), bounty.id, detail.percentage, "dev");

            if (address(registry) != address(0)) {
                if (address(registry.bountyToken()) != address(0)) {
                    registry.awardBounty(detail.recipient, ipfsUri, award);
                }
            } else {
                if (address(nftToken) != address(0)) {
                    nftToken.awardBounty(detail.recipient, ipfsUri, award);
                }
            }

            require(erc20.transfer(detail.recipient, proposalAmount.div(100).mul(detail.percentage)), "CB5");
        }

        if (bounties[id].rewardToken != address(0)) {
            ERC20 rewardToken = ERC20(bounty.rewardToken);
            for (uint256 i = 0; i <= bounty.funding.length - 1; i++) {
                INetwork_v2.Benefactor storage x = bounty.funding[i];
                if (x.amount > 0) {
                    uint256 rewardAmount = x.amount.div(bounty.fundingAmount).mul(bounty.rewardAmount);
                    x.amount = 0;
                    require(rewardToken.transfer(x.benefactor, rewardAmount), "CB6");
                }
            }
        }

        require(erc20.transfer(msg.sender, mergerFee), "CB4");
        require(erc20.transfer(proposal.creator, proposerFee), "CB4");
        if (treasuryAmount > 0) {
            require(erc20.transfer(registry.treasury(), treasuryAmount), "C3");
        }
    }
}
