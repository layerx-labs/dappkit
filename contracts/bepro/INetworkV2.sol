pragma solidity >=0.8.0;
pragma abicoder v2;

import "./token/ERC721/BountyToken.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./NetworkRegistry.sol";

interface INetworkV2 {

    struct BountyConnector {
        address originNetwork;
        uint256 bountyId;
        uint percentage; // 0 - 100
        string kind; // proposer, dev, closer, [reviewer?]
    }

    struct PullRequest {
        string originRepo;
        string originCID;
        string originBranch;
        string userRepo;
        string userBranch;
        bool ready;
        bool canceled;
        address creator;
        uint256 cid; // pr id on git
        uint256 id;
    }

    struct ProposalDetail {
        address recipient;
        uint256 percentage;
    }

    struct Oracle {
        uint256 locked;
        uint256 toOthers;
        uint256 byOthers;
    }

    struct Delegation {
        address from;
        address to;
        uint256 amount;
    }

    struct Proposal {
        uint256 id;
        uint256 creationDate;
        uint256 oracles;
        uint256 disputeWeight;
        uint256 prId;
        bool refusedByBountyOwner;
        address creator;
        ProposalDetail[] details;
    }

    struct Benefactor {
        address benefactor;
        uint256 amount;
        uint256 creationDate;
    }

    struct Bounty {
        uint256 id;
        uint256 creationDate;
        uint256 tokenAmount;

        address creator;
        address transactional; // 1,000 -> dev, merge creater, distribution proposer
        address rewardToken; // ERC20
        uint256 rewardAmount; // 2000
        uint256 fundingAmount; // 1,000

        bool closed;
        bool canceled;
        bool funded;

        string title;
        string repoPath;
        string branch;
        string cid;
        string githubUser;

        uint256 closedDate;

        PullRequest[] pullRequests;
        Proposal[] proposals;
        Benefactor[] funding;
    }

    enum Params {
        councilAmount,
        disputableTime,
        draftTime,
        oracleExchangeRate,
        mergeCreatorFeeShare,
        percentageNeededForDispute,
        cancelFee,
        cancelableTime,
        proposerFeeShare
    }

    function networkToken() external view returns (ERC20);
    function nftToken() external view returns (BountyToken);
    function registry() external view returns (NetworkRegistry);

    function bountyNftUri() external view returns (string memory);

    function totalNetworkToken() external view returns (uint256);

    function oracleExchangeRate() external view returns (uint256);
    function oraclesDistributed() external view returns (uint256);

    function closedBounties() external view returns (uint256);
    function canceledBounties() external view returns (uint256);

    function mergeCreatorFeeShare() external view returns (uint256);
    function proposerFeeShare() external view returns (uint256);
    function percentageNeededForDispute() external view returns (uint256);

    function disputableTime() external view returns (uint256);
    function draftTime() external view returns (uint256);
    function cancelableTime() external view returns (uint256);

    function councilAmount() external view returns (uint256);

    function _governor() external view returns (address);
    function bountiesIndex() external view returns (uint256);

    function bounties(uint256 id) external view returns (Bounty memory);
    function bountiesOfAddress(address owner) external view returns (uint256[] memory);
    function cidBountyId(uint256 cid) external view returns (uint256);
    function oracles(address _address) external view returns (Oracle memory);
    function delegations(address _address) external view returns (Delegation[] memory);
    function disputes(address _address, bytes32 _bytes) external view returns (uint256);

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
    event NetworkParamChanged (uint256 param, uint256 newvalue, uint256 oldvalue);
    event OraclesChanged(address indexed actor, int256 indexed actionAmount, uint256 indexed newLockedTotal);

    function getBounty(uint256 id) external view returns (Bounty memory);
    function getDelegationsFor(address _address) external view returns (Delegation[] memory);
    function getBountiesOfAddress(address owner) external view returns (uint256[] memory);
    function treasuryInfo() external view returns(address, uint256, uint256);
    function changeNetworkParameter(uint256 _parameter, uint256 _value) external;

    function manageOracles(bool lock, uint256 amount) external;
    function delegateOracles(uint256 amount, address toAddress) external;
    function takeBackOracles(uint256 entryId) external;

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
    ) external;

    function hardCancel(uint256 id) external;
    function cancelBounty(uint256 id) external;
    function cancelFundRequest(uint256 id) external;
    function updateBountyAmount(uint256 id, uint256 newTokenAmount) external;
    function fundBounty(uint256 id, uint256 fundingAmount) external;
    function retractFunds(uint256 id, uint256[] calldata fundingIds) external;

    function createPullRequest(
        uint256 forBountyId,
        string memory originRepo,
        string memory originBranch,
        string memory originCID,
        string memory userRepo,
        string memory userBranch,
        uint256 cid
    ) external;

    function cancelPullRequest(uint256 ofBounty, uint256 prId) external;
    function markPullRequestReadyForReview(uint256 bountyId, uint256 pullRequestId) external;
    function createBountyProposal(
        uint256 id,
        uint256 prId,
        address[] calldata recipients,
        uint256[] calldata percentages
    ) external;

    function disputeBountyProposal(uint256 bountyId, uint256 proposalId) external;
    function refuseBountyProposal(uint256 bountyId, uint256 proposalId) external;
    function closeBounty(uint256 id, uint256 proposalId) external;
}