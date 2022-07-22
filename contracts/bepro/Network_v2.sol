pragma solidity >=0.6.0 <=8.0.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import "../math/SafePercentMath.sol";
import "../utils/Governed.sol";
import "./BountyToken.sol";
import "./INetwork_v2.sol";
import "./Network_Registry.sol";


contract Network_v2 is Governed, ReentrancyGuard {
    using SafeMath for uint256;

    constructor(
        address _settlerToken,
        address _nftTokenAddress,
        string memory _bountyNftUri,
//        address _treasuryAddress,
//        uint256 _cancelFee,
//        uint256 _closeFee,
        address _registry
    ) Governed() ReentrancyGuard() {
        networkToken = ERC20(_settlerToken);
        nftToken = BountyToken(_nftTokenAddress);
        bountyNftUri = _bountyNftUri;
        registry = Network_Registry(_registry);
//        closeFee = _closeFee;
//        cancelFee = _cancelFee;
//        treasury = _treasuryAddress;
    }

    ERC20 public networkToken;
    BountyToken public nftToken;
    Network_Registry public registry;

    string public bountyNftUri = "";

    uint256 public totalNetworkToken = 0; // TVL essentially

    uint256 public oracleExchangeRate = 10000; // 10,000 = 1:1 ; parts per 10K
    uint256 public oraclesDistributed = 0; // essentially, the converted math of TVL

    uint256 public closedBounties = 0;
    uint256 public canceledBounties = 0;

    uint256 public mergeCreatorFeeShare = 30000; // 3%; parts per 10,000
    uint256 public proposerFeeShare = 30000; // 3%; parts per 10,000
    uint256 public percentageNeededForDispute = 30000; // 3% parts per 10,000

    uint256 public disputableTime = 3 days;
    uint256 public draftTime = 1 days;
    uint256 public cancelableTime = 183 days;

    uint256 public councilAmount = 25000000*10**18; // 25M * 10 to the power of 18 (decimals)

//    address treasury = address(0);
//    uint256 closeFee = 50000;
//    uint256 cancelFee = 10000;

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
    // event Log(uint256 bountyId, uint256 mergerValue, uint256 proposerValue, uint256 distributionValue);
    // event LogTransfer(uint256 bountyId, address to, uint256 distributionValue);

    function _isBountyOwner(uint256 id) internal view {
        require(bounties[id].creator == msg.sender, "OW1");
    }

    function _isFundingRequest(uint256 id, bool shouldBe) internal view {
        require((bounties[id].rewardToken != address(0)) == shouldBe, "BF1");
    }

    function _isInDraft(uint256 id, bool shouldBe) internal view {
        require(bounties[id].creator != address(0), "B0");
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
            return (registry.treasury(), registry.closeFee(), registry.cancelFee());
        return (address(0), 0, 0);
    }

    function lessThan20MoreThan1(uint256 value) internal {
        require(value <= 20 days, "T1");
        require(value >= 1 minutes, "T2");
    }

    function changeNetworkParameter(uint256 _parameter, uint256 _value) public payable onlyGovernor {
        if (_parameter == uint256(INetwork_v2.Params.councilAmount)) {
            require(_value >= 1 * 10 ** networkToken.decimals(), "C1");
            require(_value <= 50000000 * 10 ** networkToken.decimals(), "C2");
            councilAmount = _value;
        } else if (_parameter == uint256(INetwork_v2.Params.draftTime)) {
            lessThan20MoreThan1(_value);
            draftTime = _value;
        } else if (_parameter == uint256(INetwork_v2.Params.disputableTime)) {
            lessThan20MoreThan1(_value);
            disputableTime = _value;
        } else if (_parameter == uint256(INetwork_v2.Params.percentageNeededForDispute)) {
            require(_value >= 0, "D1");
            percentageNeededForDispute = _value;
        } else if (_parameter == uint256(INetwork_v2.Params.mergeCreatorFeeShare)) {
            require(_value >= 0 && _value.div(10000) <= 10, "M1");
            mergeCreatorFeeShare = _value;
        } else if (_parameter == uint256(INetwork_v2.Params.oracleExchangeRate)) {
            require(_value >= 0, "EX0");
            require(totalNetworkToken == 0, "EX1");
            oracleExchangeRate = _value;
        }

        else if (_parameter == uint256(INetwork_v2.Params.cancelableTime)) {
            require(_value >= 180 days, "C3");
            cancelableTime = _value;
        }
    }

    function amountGT0(uint256 _amount) internal view {
        require(_amount > 0, "L0");
    }

    function manageOracles(bool lock, uint256 amount) external payable {
        uint256 exchanged = 0;
        if (lock) {
            exchanged = amount.mul(oracleExchangeRate.div(10000));
            oracles[msg.sender].locked = oracles[msg.sender].locked.add(exchanged);
            require(networkToken.transferFrom(msg.sender, address(this), amount), "MO0");
            totalNetworkToken = totalNetworkToken.add(amount);
            oraclesDistributed = oraclesDistributed.add(exchanged);
        } else {
            exchanged = amount.div(oracleExchangeRate.div(10000));
            require(amount <= oracles[msg.sender].locked, "MO1");
            require(networkToken.transfer(msg.sender, exchanged), "MO2");
            oracles[msg.sender].locked = oracles[msg.sender].locked.sub(amount);
            totalNetworkToken = totalNetworkToken.sub(exchanged);
            oraclesDistributed = oraclesDistributed.sub(amount);

        }

        emit OraclesChanged(msg.sender, int256(lock ? amount : -amount), oracles[msg.sender].locked);
    }

    function delegateOracles(uint256 amount, address toAddress) external payable {
        require(amount <= oracles[msg.sender].locked, "MD0");
        oracles[msg.sender].locked = oracles[msg.sender].locked.sub(amount);
        oracles[msg.sender].toOthers = oracles[msg.sender].toOthers.add(amount);
        oracles[toAddress].byOthers = oracles[toAddress].byOthers.add(amount);
        delegations[msg.sender].push(INetwork_v2.Delegation(msg.sender, toAddress, amount));
    }

    function takeBackOracles(uint256 entryId) external payable {
        require(delegations[msg.sender][entryId].amount > 0, "MD1");
        uint256 amount = delegations[msg.sender][entryId].amount;
        address delegated = delegations[msg.sender][entryId].to;
        oracles[msg.sender].locked = oracles[msg.sender].locked.add(amount);
        oracles[msg.sender].toOthers = oracles[msg.sender].toOthers.sub(amount);
        oracles[delegated].byOthers = oracles[delegated].byOthers.sub(amount);
        delegations[msg.sender][entryId].amount = 0;
    }

    /// @dev create a bounty
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
    ) external payable {
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
                require(registry.allowedTransactionalTokens(transactional) != address(0), "O6");
                if (fundingAmount > 0 && address(0) != rewardToken) {
                    require(registry.allowedRewardTokens(rewardToken) != address(0), "O7");
                }
            }
        }

        if (address(0) != rewardToken) {
            require(tokenAmount == 0, "O1");
            amountGT0(rewardAmount);
            amountGT0(fundingAmount);
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

    function _cancelFundingRequest(uint256 id) internal {
        INetwork_v2.Bounty storage bounty = bounties[id];

        for (uint256 i = 0; i <= bounty.funding.length - 1; i++) {
            INetwork_v2.Benefactor storage x = bounty.funding[i];
            if (x.amount > 0) {
                require(ERC20(bounty.transactional).transfer(x.benefactor, x.amount), "C4");
                x.amount = 0;
            }
        }

        bounty.canceled = true;

        canceledBounties = canceledBounties.add(1);

        require(ERC20(bounty.rewardToken).transfer(msg.sender, bounty.rewardAmount), "C5");

        emit BountyCanceled(id);
    }

    function _cancelBounty(uint256 id) internal {
        INetwork_v2.Bounty storage bounty = bounties[id];
        ERC20 erc20 = ERC20(bounty.transactional);

        bounty.canceled = true;

        uint256 returnAmount = bounty.tokenAmount;
        if (address(registry) != address(0)) {
            if (registry.treasury() != address(0)) {
                uint256 treasuryFee = bounty.tokenAmount.div(100).mul(registry.cancelFee().div(10000));
                returnAmount = returnAmount.sub(treasuryFee);
                require(erc20.transfer(registry.treasury(), treasuryFee), "C3");
            }
        }

        require(erc20.transfer(bounty.creator, returnAmount), "C2");

        canceledBounties = canceledBounties.add(1);

        emit BountyCanceled(id);
    }

    function hardCancel(uint256 id) external payable {
        require(bounties[id].creator != address(0), "HC1");
        require(msg.sender == _governor, "HC2");
        require(bounties[id].creationDate.add(block.timestamp) >= cancelableTime, "HC3");

        if (bounties[id].proposals.length > 0) {
            for (uint256 i = 0; i <= bounties[id].proposals.length - 1; i++) {
                INetwork_v2.Proposal memory proposal = bounties[id].proposals[i];
                require((proposal.disputeWeight >= oraclesDistributed.mul(percentageNeededForDispute).div(10000)) || proposal.refusedByBountyOwner == true, "HC4");
            }
        }

        if (bounties[id].fundingAmount == 0) {
            _cancelBounty(id);
        } else {
            _cancelFundingRequest(id);
        }
    }

    /// @dev cancel a bounty
    function cancelBounty(uint256 id) external payable {
        // _bountyExists(id);
        _isBountyOwner(id);
        _isInDraft(id, true);
        _isNotCanceled(id);
        _isFundingRequest(id, false);
        _cancelBounty(id);
    }

    /// @dev cancel funding
    function cancelFundRequest(uint256 id) external payable {
        _isBountyOwner(id);
        _isInDraft(id, true);
        _isNotCanceled(id);
        _isFundingRequest(id, true);
        _cancelFundingRequest(id);

    }

    /// @dev update the value of a bounty with a new amount
    function updateBountyAmount(uint256 id, uint256 newTokenAmount) external payable {
        // _bountyExists(id);
        _isBountyOwner(id);
        _isInDraft(id, true);
        _isFundingRequest(id, false);

        INetwork_v2.Bounty storage bounty = bounties[id];
        ERC20 erc20 = ERC20(bounty.transactional);

        require(newTokenAmount > 0 && (bounty.tokenAmount != newTokenAmount) , "U1");

        if (newTokenAmount > bounty.tokenAmount) {
            uint256 giveAmount = newTokenAmount.sub(bounty.tokenAmount);
            require(erc20.transferFrom(msg.sender, address(this), giveAmount), "U2");
        } else {
            uint256 retrieveAmount = bounty.tokenAmount.sub(newTokenAmount);
            require(erc20.transfer(bounty.creator, retrieveAmount), "U3");
        }

        bounty.tokenAmount = newTokenAmount;

        emit BountyAmountUpdated(id, newTokenAmount);
    }

    /// @dev enable users to fund a bounty
    function fundBounty(uint256 id, uint256 fundingAmount) external payable {

        _isFundingRequest(id, true);
        _isInDraft(id, true);
        _isNotCanceled(id);

        INetwork_v2.Bounty storage bounty = bounties[id];
        require(bounty.funded == false, "F1");
        require(bounty.tokenAmount < bounty.fundingAmount, "F2");
        require(bounty.tokenAmount.add(fundingAmount) <= bounty.fundingAmount, "F3");

        bounty.funding.push(INetwork_v2.Benefactor(msg.sender, fundingAmount, block.timestamp));

        bounty.tokenAmount = bounty.tokenAmount.add(fundingAmount);
        bounty.funded = bounty.fundingAmount == bounty.tokenAmount;

        require(ERC20(bounty.transactional).transferFrom(msg.sender, address(this), fundingAmount), "F3");
        emit BountyFunded(id, bounty.funded, msg.sender, int256(fundingAmount));
    }

    /// @dev enable users to retract their funding
    function retractFunds(uint256 id, uint256[] calldata fundingIds) external payable {
        _isInDraft(id, true);
        _isFundingRequest(id, true);
        _isNotCanceled(id);

        INetwork_v2.Bounty storage bounty = bounties[id];

        for (uint256 i = 0; i <= fundingIds.length - 1; i++) {
            INetwork_v2.Benefactor storage x = bounty.funding[fundingIds[i]];
            require(x.benefactor == msg.sender, "RF1");
            amountGT0(x.amount);
            require(ERC20(bounty.transactional).transfer(msg.sender, x.amount), "RF3");
            bounty.tokenAmount = bounty.tokenAmount.sub(x.amount);
            x.amount = 0;
        }

        bounty.funded = bounty.tokenAmount == bounty.fundingAmount;
        emit BountyFunded(id, bounty.funded, msg.sender, int256(bounty.tokenAmount - bounty.fundingAmount));
    }

    /// @dev create pull request for bounty id
    function createPullRequest(
        uint256 forBountyId,
        string memory originRepo,
        string memory originBranch,
        string memory originCID,
        string memory userRepo,
        string memory userBranch,
        uint256 cid
    ) external payable {
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

    function cancelPullRequest(uint256 ofBounty, uint256 prId) public payable {
        _isOpen(ofBounty);
        _isInDraft(ofBounty, false);
        _isNotCanceled(ofBounty);

        require(prId <= bounties[ofBounty].pullRequests.length - 1, "CPR1");
        require(bounties[ofBounty].pullRequests[prId].canceled == false, "CPR2");
        require(bounties[ofBounty].pullRequests[prId].creator == msg.sender, "CPR3");
        
        for (uint256 i = 0; i < bounties[ofBounty].proposals.length; i++) {
            require(bounties[ofBounty].proposals[i].prId != prId, "CPR4");
        }

        bounties[ofBounty].pullRequests[prId].canceled = true;

        emit BountyPullRequestCanceled(ofBounty, prId);
    }

    /// @dev mark a PR ready for review
    function markPullRequestReadyForReview(uint256 bountyId, uint256 pullRequestId) public payable {
        _isInDraft(bountyId, false);
        _isNotCanceled(bountyId);
        _isOpen(bountyId);

        require(pullRequestId <= bounties[bountyId].pullRequests.length - 1, "PRR1");
        require(bounties[bountyId].pullRequests[pullRequestId].ready == false, "PRR2");
        require(bounties[bountyId].pullRequests[pullRequestId].creator == msg.sender, "PRR3");

        bounties[bountyId].pullRequests[pullRequestId].ready = true;

        emit BountyPullRequestReadyForReview(bountyId, pullRequestId);
    }

    /// @dev create a proposal with a pull request for a bounty
    function createBountyProposal(
        uint256 id,
        uint256 prId,
        address[] calldata recipients,
        uint256[] calldata percentages
    ) public payable {
        _isInDraft(id, false);
        _isOpen(id);
        _isNotCanceled(id);

        require(oracles[msg.sender].locked.add(oracles[msg.sender].byOthers) >= councilAmount, "OW0");
        require(prId <= bounties[id].pullRequests.length - 1, "CBP0");
        require(bounties[id].pullRequests[prId].ready == true, "CBP1");

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

    /// @dev dispute a proposal for a bounty
    function disputeBountyProposal(uint256 bountyId, uint256 proposalId) external payable {
        _isInDraft(bountyId, false);
        _isOpen(bountyId);
        _isNotCanceled(bountyId);
        _proposalExists(bountyId, proposalId);

        bytes32 b32 = keccak256(abi.encodePacked(bountyId, proposalId));

        require(disputes[msg.sender][b32] == 0, "DBP1");

        uint256 weight = oracles[msg.sender].locked.add(oracles[msg.sender].byOthers);

        amountGT0(weight);

        INetwork_v2.Proposal storage proposal = bounties[bountyId].proposals[proposalId];

        proposal.disputeWeight = proposal.disputeWeight.add(weight);
        disputes[msg.sender][b32] = weight;

        emit BountyProposalDisputed(bountyId, proposal.prId, proposalId, proposal.disputeWeight, proposal.disputeWeight >= oraclesDistributed.mul(percentageNeededForDispute).div(10000));
    }

    function refuseBountyProposal(uint256 bountyId, uint256 proposalId) external payable {
        _isInDraft(bountyId, false);
        _isNotCanceled(bountyId);
        _isOpen(bountyId);
        _isBountyOwner(bountyId);
        _proposalExists(bountyId, proposalId);

        bounties[bountyId].proposals[proposalId].refusedByBountyOwner = true;

        emit BountyProposalRefused(bountyId, bounties[bountyId].proposals[proposalId].prId, proposalId);
    }

    /// @dev close bounty with the selected proposal id
    function closeBounty(uint256 id, uint256 proposalId) external payable {
        _isOpen(id);
        _isNotCanceled(id);
        _isInDraft(id, false);
        _proposalExists(id, proposalId);

        INetwork_v2.Bounty storage bounty = bounties[id];
        ERC20 erc20 = ERC20(bounty.transactional);
        INetwork_v2.Proposal storage proposal = bounty.proposals[proposalId];

        require(block.timestamp >= bounty.proposals[proposalId].creationDate.add(disputableTime), "CB2");
        require(proposal.disputeWeight < oraclesDistributed.mul(percentageNeededForDispute).div(10000), "CB3");
        require(proposal.refusedByBountyOwner == false, "CB7");

        uint256 returnAmount = bounty.tokenAmount;

        if (address(registry) != address(0)) {
            if (registry.treasury() != address(0)) {
                uint256 treasuryAmount = bounty.tokenAmount.div(100).mul(registry.closeFee().div(10000));
                returnAmount = returnAmount.sub(treasuryAmount);
                require(erc20.transfer(registry.treasury(), treasuryAmount), "C3");
            }
        }

        uint256 mergerFee = returnAmount.div(100).mul(mergeCreatorFeeShare.div(10000));
        uint256 proposerFee = returnAmount.sub(mergerFee).div(100).mul(proposerFeeShare.div(10000));
        uint256 proposalAmount = returnAmount.sub(mergerFee).sub(proposerFee);

        // emit Log(id, mergerFee, proposerFee, proposalAmount);

        require(erc20.transfer(msg.sender, mergerFee), "CB4");
        require(erc20.transfer(proposal.creator, proposerFee), "CB4");

        for (uint256 i = 0; i <= proposal.details.length - 1; i++) {
            INetwork_v2.ProposalDetail memory detail = proposal.details[i];
            require(erc20.transfer(detail.recipient, proposalAmount.div(100).mul(detail.percentage)), "CB5");
            // emit LogTransfer(id, detail.recipient, proposalAmount.div(100).mul(detail.percentage));
            nftToken.awardBounty(detail.recipient, bountyNftUri, bounty.id, detail.percentage);
        }

        if (bounties[id].rewardToken != address(0)) {
            ERC20 rewardToken = ERC20(bounty.rewardToken);
            for (uint256 i = 0; i <= bounty.funding.length - 1; i++) {
                INetwork_v2.Benefactor storage x = bounty.funding[i];
                if (x.amount > 0) {
                    uint256 rewardAmount = x.amount.div(bounty.fundingAmount).mul(bounty.rewardAmount);
                    require(rewardToken.transfer(x.benefactor, rewardAmount), "CB6");
                    x.amount = 0;
                }
            }
        }

        bounty.closed = true;
        bounty.closedDate = block.timestamp;
        closedBounties = closedBounties.add(1);

        emit BountyClosed(id, proposalId);
    }
}
