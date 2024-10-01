// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract StakingContract is ReentrancyGuard {
    using SafeMath for uint256;

    IERC20 public stakingToken; // SON token
    
    struct UserInfo {
        uint256 stakedAmount;
        uint256 lastUpdateTime;
        uint256 points;
    }

    struct StakeAction {
        uint256 amount;
        uint256 timestamp;
        bool isStake; // true for stake, false for unstake
    }

    mapping(address => UserInfo) public userInfo;
    mapping(address => StakeAction[]) public userStakeHistory;

    uint256 public totalPoints;
    uint256 public constant POINTS_DECIMALS = 1e18;
    uint256 public constant GROWTH_RATE = 1e15; // 0.001 * POINTS_DECIMALS
    uint256 public constant REDEMPTION_PENALTY = 80; // 80% (100% - 20% penalty)
    uint256 public lastGlobalUpdateTime;

    event Staked(address indexed user, uint256 amount, uint256 timestamp);
    event Unstaked(address indexed user, uint256 amount, uint256 pointsPenalty, uint256 timestamp);
    event PointsUpdated(address indexed user, uint256 newPoints);

    constructor(IERC20 _stakingToken) {
        stakingToken = _stakingToken;
        lastGlobalUpdateTime = block.timestamp;
    }

    function stake(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Cannot stake 0");
        updateGlobalPoints();
        updateUserPoints(msg.sender);

        UserInfo storage user = userInfo[msg.sender];
        user.stakedAmount = user.stakedAmount.add(_amount);
        user.lastUpdateTime = block.timestamp;

        // Record stake action in history
        userStakeHistory[msg.sender].push(StakeAction({
            amount: _amount,
            timestamp: block.timestamp,
            isStake: true
        }));

        require(stakingToken.transferFrom(msg.sender, address(this), _amount), "Transfer failed");

        emit Staked(msg.sender, _amount, block.timestamp);
    }

    function unstake(uint256 _amount) external nonReentrant {
        UserInfo storage user = userInfo[msg.sender];
        require(user.stakedAmount >= _amount, "Insufficient staked amount");

        updateGlobalPoints();
        updateUserPoints(msg.sender);

        uint256 pointsPenalty = user.points.mul(20).div(100); // 20% penalty
        user.points = user.points.sub(pointsPenalty);
        totalPoints = totalPoints.sub(pointsPenalty);

        user.stakedAmount = user.stakedAmount.sub(_amount);
        user.lastUpdateTime = block.timestamp;

        // Record unstake action in history
        userStakeHistory[msg.sender].push(StakeAction({
            amount: _amount,
            timestamp: block.timestamp,
            isStake: false
        }));

        require(stakingToken.transfer(msg.sender, _amount), "Transfer failed");

        emit Unstaked(msg.sender, _amount, pointsPenalty, block.timestamp);
    }

    function updateGlobalPoints() public {
        uint256 elapsedHours = (block.timestamp - lastGlobalUpdateTime) / 1 hours;
        if (elapsedHours > 0) {
            lastGlobalUpdateTime = block.timestamp;
        }
    }

    function updateUserPoints(address _user) public {
        UserInfo storage user = userInfo[_user];
        uint256 elapsedHours = (block.timestamp - user.lastUpdateTime) / 1 hours;
        
        if (elapsedHours > 0) {
            uint256 newPoints = user.stakedAmount
                .mul(elapsedHours)
                .mul(GROWTH_RATE)
                .div(POINTS_DECIMALS);

            user.points = user.points.add(newPoints);
            totalPoints = totalPoints.add(newPoints);
            user.lastUpdateTime = block.timestamp;

            emit PointsUpdated(_user, user.points);
        }
    }

    function getPointWeight(address _user) public view returns (uint256) {
        if (totalPoints == 0) return 0;
        return userInfo[_user].points.mul(POINTS_DECIMALS).div(totalPoints);
    }

    function getUserInfo(address _user) external view returns (
        uint256 stakedAmount,
        uint256 points,
        uint256 pointWeight
    ) {
        UserInfo storage user = userInfo[_user];
        return (
            user.stakedAmount,
            user.points,
            getPointWeight(_user)
        );
    }

    function getUserStakeHistoryLength(address _user) external view returns (uint256) {
        return userStakeHistory[_user].length;
    }

    function getUserStakeHistoryEntry(address _user, uint256 _index) external view returns (
        uint256 amount,
        uint256 timestamp,
        bool isStake
    ) {
        require(_index < userStakeHistory[_user].length, "Index out of bounds");
        StakeAction memory action = userStakeHistory[_user][_index];
        return (action.amount, action.timestamp, action.isStake);
    }
}