// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title StudySchedule - Encrypted Study Schedule System
/// @notice Allows users to record daily study goals and progress with full encryption
/// @dev Uses FHE to store encrypted data, calculations performed client-side
contract StudySchedule is SepoliaConfig {
    struct DailySchedule {
        euint32 encryptedTargetGoals;      // Number of study goals for the day (encrypted)
        euint32 encryptedCompletedGoals;    // Number of completed goals (encrypted)
        euint32 encryptedTotalPriority;     // Sum of all priorities (encrypted)
        euint32 encryptedPriorityCount;     // Number of goals with priority (encrypted)
        uint256 date;                       // Unix timestamp of the day
        bool exists;
    }

    // Mapping: user address => date (day timestamp) => DailySchedule
    mapping(address => mapping(uint256 => DailySchedule)) private _schedules;

    // Mapping: user address => array of dates they have schedules
    mapping(address => uint256[]) private _userDates;

    // Mapping: user address => date => has schedule (for quick lookup)
    mapping(address => mapping(uint256 => bool)) private _hasSchedule;

    event ScheduleCreated(address indexed user, uint256 indexed date);
    event ScheduleUpdated(address indexed user, uint256 indexed date);
    event ScheduleDecrypted(address indexed user, uint256 indexed date, uint256 completionRate, uint256 avgPriority);

    /// @notice Create or update a daily study schedule
    /// @param date Unix timestamp of the day (should be normalized to start of day)
    /// @param encryptedTargetGoals Encrypted number of study goals for the day
    /// @param encryptedCompletedGoals Encrypted number of completed goals
    /// @param encryptedPriority Encrypted priority value (1-3)
    /// @param inputProof The FHE input proof
    function createOrUpdateSchedule(
        uint256 date,
        externalEuint32 encryptedTargetGoals,
        externalEuint32 encryptedCompletedGoals,
        externalEuint32 encryptedPriority,
        bytes calldata inputProof
    ) external {
        // Convert external encrypted values to internal euint32
        euint32 targetGoals = FHE.fromExternal(encryptedTargetGoals, inputProof);
        euint32 completedGoals = FHE.fromExternal(encryptedCompletedGoals, inputProof);
        euint32 priority = FHE.fromExternal(encryptedPriority, inputProof);

        DailySchedule storage schedule = _schedules[msg.sender][date];
        
        if (!schedule.exists) {
            // Create new schedule
            schedule.encryptedTargetGoals = targetGoals;
            schedule.encryptedCompletedGoals = completedGoals;
            schedule.encryptedTotalPriority = priority;
            schedule.encryptedPriorityCount = FHE.asEuint32(1);
            schedule.date = date;
            schedule.exists = true;
            
            // Track this date for the user
            if (!_hasSchedule[msg.sender][date]) {
                _userDates[msg.sender].push(date);
                _hasSchedule[msg.sender][date] = true;
            }
            
            emit ScheduleCreated(msg.sender, date);
        } else {
            // Update existing schedule - replace values
            schedule.encryptedTargetGoals = targetGoals;
            schedule.encryptedCompletedGoals = completedGoals;
            schedule.encryptedTotalPriority = priority;
            schedule.encryptedPriorityCount = FHE.asEuint32(1);
            
            emit ScheduleUpdated(msg.sender, date);
        }

        // Grant decryption permissions to the user
        FHE.allowThis(schedule.encryptedTargetGoals);
        FHE.allow(schedule.encryptedTargetGoals, msg.sender);
        FHE.allowThis(schedule.encryptedCompletedGoals);
        FHE.allow(schedule.encryptedCompletedGoals, msg.sender);
        FHE.allowThis(schedule.encryptedTotalPriority);
        FHE.allow(schedule.encryptedTotalPriority, msg.sender);
        FHE.allowThis(schedule.encryptedPriorityCount);
        FHE.allow(schedule.encryptedPriorityCount, msg.sender);
    }

    /// @notice Get encrypted target goals for a specific date
    /// @param user The user address
    /// @param date Unix timestamp of the day
    /// @return encryptedTargetGoals The encrypted number of target goals
    function getEncryptedTargetGoals(address user, uint256 date)
        external
        view
        returns (euint32 encryptedTargetGoals)
    {
        require(_schedules[user][date].exists, "Schedule does not exist");
        return _schedules[user][date].encryptedTargetGoals;
    }

    /// @notice Get encrypted completed goals for a specific date
    /// @param user The user address
    /// @param date Unix timestamp of the day
    /// @return encryptedCompletedGoals The encrypted number of completed goals
    function getEncryptedCompletedGoals(address user, uint256 date)
        external
        view
        returns (euint32 encryptedCompletedGoals)
    {
        require(_schedules[user][date].exists, "Schedule does not exist");
        return _schedules[user][date].encryptedCompletedGoals;
    }

    /// @notice Get encrypted total priority for a specific date
    /// @param user The user address
    /// @param date Unix timestamp of the day
    /// @return encryptedTotalPriority The encrypted sum of priorities
    function getEncryptedTotalPriority(address user, uint256 date)
        external
        view
        returns (euint32 encryptedTotalPriority)
    {
        require(_schedules[user][date].exists, "Schedule does not exist");
        return _schedules[user][date].encryptedTotalPriority;
    }

    /// @notice Get encrypted priority count for a specific date
    /// @param user The user address
    /// @param date Unix timestamp of the day
    /// @return encryptedPriorityCount The encrypted number of goals with priority
    function getEncryptedPriorityCount(address user, uint256 date)
        external
        view
        returns (euint32 encryptedPriorityCount)
    {
        require(_schedules[user][date].exists, "Schedule does not exist");
        return _schedules[user][date].encryptedPriorityCount;
    }

    /// @notice Get encrypted values needed for completion rate calculation
    /// @param user The user address
    /// @param date Unix timestamp of the day
    /// @return completedGoals The encrypted number of completed goals
    /// @return targetGoals The encrypted number of target goals
    function getEncryptedCompletionRateData(address user, uint256 date)
        external
        view
        returns (euint32 completedGoals, euint32 targetGoals)
    {
        require(_schedules[user][date].exists, "Schedule does not exist");
        DailySchedule storage schedule = _schedules[user][date];

        return (schedule.encryptedCompletedGoals, schedule.encryptedTargetGoals);
    }

    /// @notice Get encrypted values needed for average priority calculation
    /// @param user The user address
    /// @param date Unix timestamp of the day
    /// @return totalPriority The encrypted sum of all priorities
    /// @return priorityCount The encrypted number of goals with priority
    function getEncryptedAveragePriorityData(address user, uint256 date)
        external
        view
        returns (euint32 totalPriority, euint32 priorityCount)
    {
        require(_schedules[user][date].exists, "Schedule does not exist");
        DailySchedule storage schedule = _schedules[user][date];

        return (schedule.encryptedTotalPriority, schedule.encryptedPriorityCount);
    }

    /// @notice Check if a schedule exists for a user and date
    /// @param user The user address
    /// @param date Unix timestamp of the day
    /// @return exists Whether the schedule exists
    function scheduleExists(address user, uint256 date) external view returns (bool exists) {
        return _schedules[user][date].exists;
    }

    /// @notice Get the date of a schedule (for verification)
    /// @param user The user address
    /// @param date Unix timestamp of the day
    /// @return scheduleDate The date stored in the schedule
    function getScheduleDate(address user, uint256 date) external view returns (uint256 scheduleDate) {
        require(_schedules[user][date].exists, "Schedule does not exist");
        return _schedules[user][date].date;
    }

    /// @notice Get all dates for a user
    /// @param user The user address
    /// @return dates Array of dates (Unix timestamps) for which the user has schedules
    function getUserDates(address user) external view returns (uint256[] memory dates) {
        return _userDates[user];
    }

    /// @notice Get the count of schedules for a user
    /// @param user The user address
    /// @return count The number of schedules created by the user
    function getUserScheduleCount(address user) external view returns (uint256 count) {
        return _userDates[user].length;
    }
}

