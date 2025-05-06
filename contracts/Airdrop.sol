// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

error NotAllowedStartCampaignInPast();
error EmptyAddress();
error CampaignAlreadyFinalized();
error CampaignNotAllowed();
error AlreadyClaimed();
error DurationMustBeNotNull();
error NonValidProof();
error VestingPeriodNotEnded();

/**
 * @title Airdrop
 * @notice This contract manages multiple airdrop campaigns with linear vesting schedules.
 * @dev Only the contract owner can create, upload, and finalize campaigns. Users can claim their vested tokens based on their allocations.
 */
contract Airdrop is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Represents an airdrop campaign configuration.
    struct Campaign {
        uint128 vestingStart;       // Timestamp when vesting begins
        uint128 vestingEnd;         // Timestamp when vesting ends
        address token;          // ERC20 token address for distribution
        uint totalAllocated;     // Total tokens allocated for the campaign
        bytes32 merkleRoot;      // Merkle root of the distribution
        bool finalized;         // Whether the campaign is finalized
    }

    /// @notice Mapping: campaign ID => user address => whether they've claimed
    mapping(uint => mapping(address => bool)) public hasClaimed;

    /// @notice Mapping: campaign ID => Campaign metadata.
    mapping(uint => Campaign) public campaigns;

    /// @notice Counter for campaign IDs.
    uint public id;

    /// @notice Constant representing number of seconds in one day.
    uint private constant SECONDS_IN_DAY = 86400;

    /// @notice Emitted when a new airdrop campaign is started.
    event StartAirdrop(uint indexed id, address token);

    /// @notice Emitted when a campaign is finalized with its Merkle root.
    event CampaignFinalized(uint indexed id);

    event TokensClaimed(uint indexed id, address indexed user, uint amount);

    /**
     * @notice Constructor to set the initial contract owner.
     * @param _owner Address of the owner.
     */
    constructor(address _owner) Ownable(_owner) {}

    /**
     * @notice Starts a new airdrop campaign by transferring tokens to the contract.
     * @dev Only callable by the contract owner.
     * @param _token The ERC20 token address to be distributed.
     * @param _totalAllocated Total amount of tokens to allocate for the campaign.
     */
    function startCampaign(
        address _token,
        uint _totalAllocated
    ) public onlyOwner {
        require(_token != address(0), EmptyAddress());

        IERC20(_token).safeTransferFrom(msg.sender, address(this), _totalAllocated);

        campaigns[++id] = Campaign({
            token: _token,
            vestingStart: 0,
            vestingEnd: 0,
            totalAllocated: _totalAllocated,
            merkleRoot: bytes32(0),
            finalized: false
        });

        emit StartAirdrop(id, _token);
    }

    /**
     * @notice Finalizes a campaign by setting vesting parameters.
     * @dev Only callable by the contract owner. Vesting must start now or later.
     * @param _campaignId The ID of the campaign to finalize.
     * @param _vestingStart Timestamp when vesting starts.
     * @param _durationInDays Duration of vesting period in days.
     */
    function finalizeCampaign(
        uint256 _campaignId,
        uint128 _vestingStart,
        uint _durationInDays,
        bytes32 _merkleRoot
    ) external onlyOwner {
        Campaign storage campaign = campaigns[_campaignId];
        require(!campaign.finalized, CampaignAlreadyFinalized());
        require(_vestingStart >= block.timestamp, NotAllowedStartCampaignInPast());
        require(_durationInDays > 0, DurationMustBeNotNull());

        uint128 vestingEnd = uint128(_vestingStart + (SECONDS_IN_DAY * _durationInDays));

        campaign.finalized = true;
        campaign.vestingStart = _vestingStart;
        campaign.vestingEnd = vestingEnd;
        campaign.merkleRoot = _merkleRoot;

        emit CampaignFinalized(_campaignId);
    }

    /**
     * @notice Claims vested tokens from a specific airdrop campaign using Merkle proof.
     * @dev Users can only claim up to their vested, unclaimed amount.
     * @param _airdropId The ID of the airdrop campaign.
     * @param _amount The amount of tokens allocated to the user.
     * @param _proof The Merkle proof verifying the user's allocation.
     */
    function claim(
        uint _airdropId,
        uint _amount,
        bytes32[] calldata _proof
    ) public nonReentrant {
        Campaign storage current = campaigns[_airdropId];

        require(block.timestamp >= current.vestingStart && current.finalized, CampaignNotAllowed());
        require(!hasClaimed[_airdropId][msg.sender], AlreadyClaimed());

        require(MerkleProof.verify(_proof, current.merkleRoot, keccak256(abi.encodePacked(msg.sender, _amount))), NonValidProof());

        uint vestedAmount;
        if (block.timestamp >= current.vestingEnd) {
            vestedAmount = _amount;
        } else {
            vestedAmount = (_amount * (block.timestamp - current.vestingStart)) / (current.vestingEnd - current.vestingStart);
        }

        hasClaimed[_airdropId][msg.sender] = true;
        IERC20(current.token).safeTransfer(msg.sender, vestedAmount);

        emit TokensClaimed(_airdropId, msg.sender, vestedAmount);
    }

    /**
     * @notice Allows the owner to withdraw unclaimed tokens after vesting ends.
     * @dev Only callable by the owner after the campaign vesting period has ended.
     * @param _campaignId The ID of the campaign to withdraw from.
     */
    function withdrawUnclaimed(uint _campaignId) external onlyOwner {
        Campaign storage campaign = campaigns[_campaignId];
        require(block.timestamp > campaign.vestingEnd, VestingPeriodNotEnded());
        
        uint balance = IERC20(campaign.token).balanceOf(address(this));
        IERC20(campaign.token).safeTransfer(owner(), balance);
    }
}
