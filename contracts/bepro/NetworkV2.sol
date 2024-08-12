pragma solidity >=0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

import "../access/Governed.sol";
import "./token/ERC721/BountyToken.sol";
import "./INetworkV2.sol";
import "./NetworkRegistry.sol";

/*
 * Network contract is responsible for the record-keeping of bounties, and its related information (PRs, Proposals, etc),
 * along with the management of voting power (dubbed "Oracles") and the payment (or return, in case of cancelation) of
 * funds upon completion
 */
contract NetworkV2 is Governed, ReentrancyGuard {
    using Math for uint256;

    uint256 public DIVISOR = 1000000; // public because userland uses this to convert values to send

    ERC20 public networkToken;
    BountyToken public nftToken;
    NetworkRegistry public registry;

    uint256 public totalNetworkToken = 0; // TVL essentially

    uint256 public oracleExchangeRate = 1000000; // 1:1
    uint256 public oraclesDistributed = 0; // essentially, the converted math of TVL

    uint256 public mergeCreatorFeeShare = 50000; // 0.05%
    uint256 public proposerFeeShare = 2000000; // 2%
    uint256 public percentageNeededForDispute = 3000000; // 3%

    uint256 public disputableTime = 3 days;
    uint256 public draftTime = 1 days;
    uint256 public cancelableTime = 183 days;

    uint256 public councilAmount = 25000000*10**18; // 25M * 10 to the power of 18 (decimals)

    uint256 public bountiesIndex = 0;
    mapping(uint256 => INetworkV2.Bounty) bounties;
//    mapping(address => uint256[]) bountiesOfAddress;
    mapping(string => uint256) public cidBountyId;
    mapping(address => INetworkV2.Oracle) public oracles;
    mapping(address => INetworkV2.Delegation[]) delegations;
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
    event NetworkParamChanged (uint256 param, uint256 newvalue);
    event OraclesChanged(address indexed actor, int256 indexed actionAmount, uint256 indexed newLockedTotal);
    event OraclesTransfer(address indexed from, address indexed to, uint256 indexed amount);

    constructor(address _networkToken, address _registry) public Governed() ReentrancyGuard() {
        networkToken = ERC20(_networkToken);
        registry = NetworkRegistry(_registry);
    }

    function _isBountyOwner(uint256 id) internal view {
        require(bounties[id].creator == msg.sender, "1");
    }

    function _bountyExists(uint256 id) internal view {
        require(bounties[id].creator != address(0), "B");
    }

    function _isFundingRequest(uint256 id, bool shouldBe) internal view {
        require((bounties[id].fundingAmount > 0) == shouldBe, "1");
    }

    function _isFunded(uint256 id, bool shouldBe) internal view {
        require(bounties[id].funded == shouldBe, "R");
    }

    function _isInDraft(uint256 id, bool shouldBe) internal view {
        _bountyExists(id);
        require((block.timestamp < bounties[id].creationDate + draftTime) == shouldBe, "1");
    }

    function _isNotCanceled(uint256 id) internal view {
        require(bounties[id].canceled == false, "1");
    }

    function _isOpen(uint256 id) internal view {
        require(bounties[id].closed == false, "3");
    }

    function _proposalExists(uint256 _bountyId, uint256 _proposalId) internal view {
        require(_proposalId <= bounties[_bountyId].proposals.length - 1, "0");
    }

    function _amountGT0(uint256 _amount) internal pure {
        require(_amount > 0, "0");
    }

    function _cancelFundingRequest(uint256 id) internal {
        INetworkV2.Bounty storage bounty = bounties[id];

        if (bounty.funding.length > 0) {
            for (uint256 i = 0; i <= bounty.funding.length - 1; i++) {
                INetworkV2.Benefactor storage x = bounty.funding[i];
                if (x.amount > 0) {
                    require(ERC20(bounty.transactional).transfer(x.benefactor, x.amount), "4");
                    x.amount = 0;
                }
            }
        }

        bounty.canceled = true;

        if (bounty.rewardAmount > 0) {
            require(ERC20(bounty.rewardToken).transfer(msg.sender, bounty.rewardAmount), "5");
        }

        emit BountyCanceled(id);
    }

    function _cancelBounty(uint256 id) internal {
        INetworkV2.Bounty storage bounty = bounties[id];
        ERC20 erc20 = ERC20(bounty.transactional);

        bounty.canceled = true;

        uint256 returnAmount = bounty.tokenAmount;
        if (address(registry) != address(0)) {
            if (registry.treasury() != address(0) && registry.cancelFeePercentage() > 0) {
                uint256 treasuryFee = _toPercent(bounty.tokenAmount, registry.cancelFeePercentage());
                returnAmount = returnAmount - treasuryFee;
                require(erc20.transfer(registry.treasury(), treasuryFee), "3");
            }
        }

        require(erc20.transfer(bounty.creator, returnAmount), "2");

        emit BountyCanceled(id);
    }

    function _toPercent(uint256 a, uint256 b) internal pure returns (uint256) {
        return a.mulDiv(b, 100000000);
    }

    function _senderWeight() internal view returns (uint256) {
        return oracles[msg.sender].locked + oracles[msg.sender].byOthers;
    }

    function getBounty(uint256 id) external view returns (INetworkV2.Bounty memory) {
        return bounties[id];
    }

    function getDelegationsFor(address _address) external view returns (INetworkV2.Delegation[] memory) {
        return delegations[_address];
    }

//    function getBountiesOfAddress(address owner) external view returns (uint256[] memory) {
//        return bountiesOfAddress[owner];
//    }

//    function treasuryInfo() external view returns(address, uint256, uint256) {
//        if (address(registry) != address(0))
//            return (registry.treasury(), registry.closeFeePercentage(), registry.cancelFeePercentage());
//        return (address(0), 0, 0);
//    }

    /*
     * Enables a network Governor Change a network parameter
     * Assert rules,
     *   _value **must** 0 or higher (because uint256)
     *
     *   - for councilAmount,
     *     _value must be higher than @MIN_COUNCIL_AMOUNT and lower than @MAX_COUNCIL_AMOUNT
     *
     *   - for draftTime,
     *     _value must be higher than @MIN_DRAFT_TIME and lower than @MAX_DRAFT_TIME
     *
     *   - for disputableTime,
     *     _value must be higher than @MIN_DISPUTABLE_TIME and lower than @MAX_DISPUTABLE_TIME
     *
     *   - for percentageNeededForDispute,
     *     _value must be lower than @MAX_PERCENTAGE_NEEDED_FOR_DISPUTE
     *
     *   - for mergeCreatorFeeShare,
     *     _value must be lower than @MAX_MERGE_CREATOR_FEE_SHARE
     *
     *   - for proposerFeeShare,
     *     _value must be lower than @MAX_PROPOSER_FEE_SHARE
     *
     *   - for oracleExchangeRate,
     *     TVL must be 0
     *
     *   - for cancelableTime,
     *     _value must be higher than @MIN_CANCELABLE_TIME
     */
    function changeNetworkParameter(uint256 _parameter, uint256 _value) external onlyGovernor {
        if (_parameter == uint256(INetworkV2.Params.councilAmount)) {
            require(_value >= 1 * 10 ** networkToken.decimals(), "1");
            require(_value <= 100000000000 * 10 ** networkToken.decimals(), "2");
            councilAmount = _value;
        } else if (_parameter == uint256(INetworkV2.Params.draftTime)) {
            require(_value >= 1 minutes && _value <= 20 days, "3");
            draftTime = _value;
        } else if (_parameter == uint256(INetworkV2.Params.disputableTime)) {
            require(_value >= 1 minutes && _value <= 20 days, "4");
            disputableTime = _value;
        } else if (_parameter == uint256(INetworkV2.Params.percentageNeededForDispute)) {
            require(_value <= 51000000, "5");
            percentageNeededForDispute = _value;
        } else if (_parameter == uint256(INetworkV2.Params.mergeCreatorFeeShare)) {
            require(_value <= 10000000, "6");
            mergeCreatorFeeShare = _value;
        } else if (_parameter == uint256(INetworkV2.Params.proposerFeeShare)) {
            require(_value <= 10000000);
            proposerFeeShare = _value;
        } else if (_parameter == uint256(INetworkV2.Params.oracleExchangeRate)) {
            require(totalNetworkToken == 0, "1");
            oracleExchangeRate = _value;
        } else if (_parameter == uint256(INetworkV2.Params.cancelableTime)) {
            require(_value >= 180 days, "3");
            cancelableTime = _value;
        }

        emit NetworkParamChanged(_parameter, _value);
    }

    /*
     * Lock or Unlock tokens into this smart contract by applying a exchange rate configured in {@oracleExchangeRate}
     */
    function manageOracles(bool lock, uint256 amount) nonReentrant external {
        _amountGT0(amount);




        if (lock) {
            uint256 exchanged = amount.mulDiv(oracleExchangeRate, DIVISOR);
            (, uint256 newLocked) = oracles[msg.sender].locked.tryAdd(exchanged);
            oracles[msg.sender].locked = newLocked;
            require(networkToken.transferFrom(msg.sender, address(this), amount), "0");
            (, uint256 newTotalNetworkToken) = totalNetworkToken.tryAdd(amount);
            (, uint256 newOraclesDistributedValue) = oraclesDistributed.tryAdd(exchanged);
            totalNetworkToken = newTotalNetworkToken;
            oraclesDistributed = newOraclesDistributedValue;
        } else {
            (, uint256 exchangeRate) = oracleExchangeRate.tryDiv(DIVISOR);
            (, uint256 exchanged) = amount.tryDiv(exchangeRate); // We are unlocking POINTS not tokens
            require(amount <= oracles[msg.sender].locked, "1");
            require(networkToken.transfer(msg.sender, exchanged), "2");
            (, uint256 newLocked) = oracles[msg.sender].locked.trySub(amount);
            (, uint256 newTotalNetworkToken) = totalNetworkToken.trySub(exchanged);
            (, uint256 newOraclesDistributed) = oraclesDistributed.trySub(amount);
            oracles[msg.sender].locked = newLocked;
            totalNetworkToken = newTotalNetworkToken;
            oraclesDistributed = newOraclesDistributed;
        }

        int256 _amount = int256(amount);
        emit OraclesChanged(msg.sender, int256(lock ? _amount : -_amount), _senderWeight());
    }

    /*
     * allocate voting power from the mapper of one address to another
     */
    function delegateOracles(uint256 amount, address toAddress) external {
        _amountGT0(amount);
        require(amount <= oracles[msg.sender].locked, "0");
        (bool sLocked, uint256 locked) = oracles[msg.sender].locked.trySub(amount);
        (bool sToOthers, uint256 toOthers) = oracles[msg.sender].toOthers.tryAdd(amount);
        (bool sByOthers, uint256 byOthers) = oracles[toAddress].byOthers.tryAdd(amount);

        oracles[msg.sender].locked = locked;
        oracles[msg.sender].toOthers = toOthers;
        oracles[toAddress].byOthers = byOthers;
        delegations[msg.sender].push(INetworkV2.Delegation(msg.sender, toAddress, amount));

        require(sLocked && sToOthers && sByOthers, "1");

        emit OraclesTransfer(msg.sender, toAddress, amount);
    }

    /*
     * return voting power given to another address
     */
    function takeBackOracles(uint256 entryId) external {
        _amountGT0(delegations[msg.sender][entryId].amount);
        uint256 amount = delegations[msg.sender][entryId].amount;
        address delegated = delegations[msg.sender][entryId].to;

        (bool sLocked, uint256 locked) = oracles[msg.sender].locked.tryAdd(amount);
        (bool sToOthers, uint256 toOthers) = oracles[msg.sender].toOthers.trySub(amount);
        (bool sByOthers, uint256 byOthers) = oracles[delegated].byOthers.trySub(amount);

        oracles[msg.sender].locked = locked;
        oracles[msg.sender].toOthers = toOthers;
        oracles[delegated].byOthers = byOthers;
        delegations[msg.sender][entryId].amount = 0;

        require(sLocked && sToOthers && sByOthers, "TB1");

        emit OraclesTransfer(delegated, msg.sender, amount);
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
    ) nonReentrant external {
        bountiesIndex = bountiesIndex + 1;

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
                require(registry.isAllowedToken(transactional, true) == true, "6");
                if (fundingAmount > 0 && address(0) != rewardToken) {
                    require(registry.isAllowedToken(rewardToken, false) == true, "7");
                }
            }
        }

        if (address(0) != rewardToken) {
            require(tokenAmount == 0, "1");
            _amountGT0(rewardAmount);
            _amountGT0(fundingAmount);
            require(ERC20(rewardToken).transferFrom(msg.sender, address(this), rewardAmount));

            bounties[bountiesIndex].rewardAmount = rewardAmount;
            bounties[bountiesIndex].rewardToken = rewardToken;
            bounties[bountiesIndex].fundingAmount = fundingAmount;
            bounties[bountiesIndex].tokenAmount = 0;
        } else {
            require(fundingAmount > 0 && tokenAmount == 0 || fundingAmount == 0 && tokenAmount > 0, "5");

            if (fundingAmount > 0) {
                bounties[bountiesIndex].fundingAmount = fundingAmount;
                bounties[bountiesIndex].tokenAmount = 0;
            } else {
                bounties[bountiesIndex].tokenAmount = tokenAmount;
                require(ERC20(transactional).transferFrom(msg.sender, address(this), tokenAmount), "4");
            }
        }

        cidBountyId[cid] = bounties[bountiesIndex].id;
//        bountiesOfAddress[msg.sender].push(bounties[bountiesIndex].id);

        emit BountyCreated(bounties[bountiesIndex].id, bounties[bountiesIndex].cid, msg.sender);
    }

    /*
     * Allow a network owner to cancel a bounty entry if X time has passed
     * Assert rules,
     *   sender is governor
     *   if bounty entry has proposals, require that all are disputed
     */
    function hardCancel(uint256 id) nonReentrant onlyGovernor external {
        require(bounties[id].creator != address(0), "1");
        (, uint256 timestamp) = block.timestamp.trySub(bounties[id].creationDate);
        require(timestamp >= cancelableTime, "3");

        if (bounties[id].proposals.length > 0) {
            for (uint256 i = 0; i <= bounties[id].proposals.length - 1; i++) {
                INetworkV2.Proposal memory proposal = bounties[id].proposals[i];
                require((proposal.disputeWeight >= _toPercent(oraclesDistributed, percentageNeededForDispute)) || proposal.refusedByBountyOwner == true, "4");
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
    function cancelBounty(uint256 id) nonReentrant external {
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
    function cancelFundRequest(uint256 id) nonReentrant external {
        _isBountyOwner(id);
        _isFundingRequest(id, true);
        _isFunded(id, false);
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
    function updateBountyAmount(uint256 id, uint256 newTokenAmount) nonReentrant external {
        _isBountyOwner(id);
        _isInDraft(id, true);
        _isFundingRequest(id, false);

        INetworkV2.Bounty storage bounty = bounties[id];
        ERC20 erc20 = ERC20(bounty.transactional);

        require(newTokenAmount > 0 && (bounty.tokenAmount != newTokenAmount) , "1");

        if (newTokenAmount > bounty.tokenAmount) {
            (, uint256 giveAmount) = newTokenAmount.trySub(bounty.tokenAmount);
            require(erc20.transferFrom(msg.sender, address(this), giveAmount), "2");
        } else {
            (, uint256 retrieveAmount) = bounty.tokenAmount.trySub(newTokenAmount);
            require(erc20.transfer(bounty.creator, retrieveAmount), "3");
        }

        bounty.tokenAmount = newTokenAmount;

        emit BountyAmountUpdated(id, newTokenAmount);
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
    function fundBounty(uint256 id, uint256 fundingAmount) nonReentrant external {
        _isFundingRequest(id, true);
        _isFunded(id, false);
        _isNotCanceled(id);

        INetworkV2.Bounty storage bounty = bounties[id];
        require(bounty.funded == false, "1");
        require(bounty.tokenAmount < bounty.fundingAmount, "2");
        (, uint256 newTokenAmount) = bounty.tokenAmount.tryAdd(fundingAmount);
        require(newTokenAmount <= bounty.fundingAmount, "3");

        bounty.funding.push(INetworkV2.Benefactor(msg.sender, fundingAmount, block.timestamp));
        bounty.tokenAmount = newTokenAmount;
        bounty.funded = bounty.fundingAmount == bounty.tokenAmount;

        require(ERC20(bounty.transactional).transferFrom(msg.sender, address(this), fundingAmount), "3");
        emit BountyFunded(id, bounty.funded, msg.sender, int256(fundingAmount));
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
    function retractFunds(uint256 id, uint256 fundingId) nonReentrant external {
        _isInDraft(id, true);
        _isFundingRequest(id, true);
        _isNotCanceled(id);

        require(fundingId < bounties[id].funding.length, "R0");

        INetworkV2.Bounty storage bounty = bounties[id];
        INetworkV2.Benefactor storage funding = bounty.funding[fundingId];

        require(funding.benefactor == msg.sender, "R1");
        _amountGT0(funding.amount);

        require(ERC20(bounty.transactional).transfer(msg.sender, funding.amount), "R3");
        bounty.tokenAmount = bounty.tokenAmount - funding.amount;
        funding.amount = 0;

        bounty.funded = bounty.tokenAmount == bounty.fundingAmount;
        unchecked {
            int256 newAmount = int256(bounty.tokenAmount - bounty.fundingAmount);
            emit BountyFunded(id, bounty.funded, msg.sender, newAmount);
        }
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

        INetworkV2.Bounty storage bounty = bounties[forBountyId];

        INetworkV2.PullRequest memory pullRequest;
        pullRequest.cid = cid;
        pullRequest.id = bounty.pullRequests.length;

        pullRequest.userBranch = userBranch;
        pullRequest.userRepo = userRepo;

        pullRequest.originBranch = originBranch;
        pullRequest.originRepo = originRepo;
        pullRequest.originCID = originCID;
        pullRequest.creator = msg.sender;
        pullRequest.ready = true;

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
    function cancelPullRequest(uint256 ofBounty, uint256 prId) external {
        _isOpen(ofBounty);
        _isInDraft(ofBounty, false);
        _isNotCanceled(ofBounty);

        require(prId <= bounties[ofBounty].pullRequests.length - 1, "1");
        require(bounties[ofBounty].pullRequests[prId].canceled == false, "2");
        require(bounties[ofBounty].pullRequests[prId].creator == msg.sender, "3");

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
//    function markPullRequestReadyForReview(uint256 bountyId, uint256 pullRequestId) external {
//        _isInDraft(bountyId, false);
//        _isNotCanceled(bountyId);
//        _isOpen(bountyId);
//
//        require(pullRequestId <= bounties[bountyId].pullRequests.length - 1, "1");
//        require(bounties[bountyId].pullRequests[pullRequestId].ready == false, "2");
//        require(bounties[bountyId].pullRequests[pullRequestId].creator == msg.sender, "3");
//        require(bounties[bountyId].pullRequests[pullRequestId].canceled == false, "4");
//
//        bounties[bountyId].pullRequests[pullRequestId].ready = true;
//
//        emit BountyPullRequestReadyForReview(bountyId, pullRequestId);
//    }

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
    ) external {
        _isInDraft(id, false);
        _isOpen(id);
        _isNotCanceled(id);

        require(_senderWeight() >= councilAmount, "0");
        require(prId <= bounties[id].pullRequests.length - 1, "0");
        require(bounties[id].pullRequests[prId].ready == true, "1");
        require(bounties[id].pullRequests[prId].canceled == false, "C2");
        require((recipients.length + percentages.length) <= 20 * 2, "C3");
        require(recipients.length == percentages.length, "C4");

        INetworkV2.Bounty storage bounty = bounties[id];

        bounty.proposals.push();
        INetworkV2.Proposal storage proposal = bounty.proposals[bounty.proposals.length - 1];

        proposal.id = bounty.proposals.length - 1;
        proposal.prId = prId;
        proposal.creationDate = block.timestamp;
        proposal.creator = msg.sender;

        uint256 _total = 0;

        for (uint i = 0; i < recipients.length; i++) {
            (bool tryAddSuccess, uint256 addMulDivResult) = _total.tryAdd(bounty.tokenAmount.mulDiv(percentages[i], 100));
            _total = addMulDivResult; // we require later on that _total === bounty.tokenAmount so we don't need to worry with tryAddSuccess now
            proposal.details.push();
            proposal.details[i].recipient = recipients[i];
            proposal.details[i].percentage = percentages[i];
        }

        require(_total == bounty.tokenAmount, "1");

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

        require(disputes[msg.sender][b32] == 0, "1");
        require(bounties[bountyId].pullRequests[bounties[bountyId].proposals[proposalId].prId].canceled == false, "2");

        uint256 weight = _senderWeight();

        _amountGT0(weight);

        INetworkV2.Proposal storage proposal = bounties[bountyId].proposals[proposalId];
        (, uint256 newDisputeWeight) = proposal.disputeWeight.tryAdd(weight);
        proposal.disputeWeight = newDisputeWeight;
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
    function closeBounty(uint256 id, uint256 proposalId, string memory ipfsUri) nonReentrant external {
        _isOpen(id);
        _isNotCanceled(id);
        _isInDraft(id, false);
        _proposalExists(id, proposalId);

        INetworkV2.Bounty storage bounty = bounties[id];
        ERC20 erc20 = ERC20(bounty.transactional);
        INetworkV2.Proposal storage proposal = bounty.proposals[proposalId];
        (, uint256 timestamp) = bounty.proposals[proposalId].creationDate.tryAdd(disputableTime);
        require(block.timestamp >= timestamp, "2");
        require(proposal.disputeWeight < _toPercent(oraclesDistributed, percentageNeededForDispute), "3");
        require(proposal.refusedByBountyOwner == false, "7");
        require(bounties[id].pullRequests[proposal.prId].canceled == false, "8");


        uint256 returnAmount = bounty.tokenAmount;

        if (address(registry) != address(0)) {
            if (registry.treasury() != address(0)) {
                uint256 treasuryAmount = _toPercent(bounty.tokenAmount, registry.closeFeePercentage());
                (, uint256 returnAmountSubTreasuryAmount) = returnAmount.trySub(treasuryAmount);
                returnAmount = returnAmountSubTreasuryAmount;
                require(erc20.transfer(registry.treasury(), treasuryAmount), "6");
            }
        }

        uint256 mergerFee = _toPercent(returnAmount, mergeCreatorFeeShare);
        (, uint256 returnAmountSubMergerFee) = returnAmount.trySub(mergerFee);
        uint256 proposerFee = _toPercent(returnAmountSubMergerFee, proposerFeeShare);
        (, uint256 proposalAmount) = returnAmountSubMergerFee.trySub(proposerFee);

        require(erc20.transfer(msg.sender, mergerFee), "4");
        require(erc20.transfer(proposal.creator, proposerFee), "9");

        for (uint256 i = 0; i <= proposal.details.length - 1; i++) {
            INetworkV2.ProposalDetail memory detail = proposal.details[i];
            INetworkV2.BountyConnector memory award = INetworkV2.BountyConnector(address(this), bounty.id, detail.percentage, "dev");
            require(erc20.transfer(detail.recipient, proposalAmount.mulDiv(detail.percentage, 100)), "5");

            if (address(registry) != address(0)) {
                if (address(registry.bountyToken()) != address(0)) {
                    registry.awardBounty(detail.recipient, ipfsUri, award);
                }
            } else {
                if (address(nftToken) != address(0)) {
                    nftToken.awardBounty(detail.recipient, ipfsUri, award);
                }
            }
        }

        bounty.closed = true;
        bounty.closedDate = block.timestamp;

        emit BountyClosed(id, proposalId);
    }

    /*
     * Enable benefactor to withdraw the reward for a funding entry
     * Assert rules,
     *   bounty exists
     *   bounty has a reward token
     *   bounty is closed
     *   fundingId is within bounds
     *   reward transfer is successful
     */
    function withdrawFundingReward(uint256 id, uint256 fundingId) external {
        _bountyExists(id);
        require(bounties[id].rewardToken != address(0), "W0");
        require(bounties[id].closed == true, "W1");
        require(bounties[id].funding.length > fundingId, "W2");
        _amountGT0(bounties[id].funding[fundingId].amount);

        uint256 rewardAmount = bounties[id].funding[fundingId].amount.mulDiv(bounties[id].rewardAmount, bounties[id].fundingAmount);

        bounties[id].funding[fundingId].amount = 0;

        require(ERC20(bounties[id].rewardToken).transfer(bounties[id].funding[fundingId].benefactor, rewardAmount), "W5");
    }

}
