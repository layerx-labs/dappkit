pragma abicoder v2;

import "./BountyToken.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./Network_Registry.sol";

interface INetwork_v2 {

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
        cancelableTime
    }

    function totalNetworkToken() external view returns (uint256);

    function closedBounties() external view returns (uint256);
    function canceledBounties() external view returns (uint256);
    function _governor() external view returns (address);
    function bountiesIndex() external view returns (uint256);

    function getBounty(uint256 id) external view returns (Bounty memory);
    function getDelegationsFor(address _address) external view returns (Delegation[] memory);
    function getBountiesOfAddress(address owner) external view returns (uint256[] memory);
    function treasuryInfo() external view returns(address, uint256, uint256);

    function changeNetworkParameter(uint256 _parameter, uint256 _value) external;
    function updateTresuryAddress(address _address) external;
    function manageOracles(bool lock, uint256 amount) external;
    function delegateOracles(uint256 amount, address toAddress) external;
    function takeBackOracles(uint256 entryId) external;
    function registry() external view returns (address);

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