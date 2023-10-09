// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;

import {IERC20} from "openzeppelin-contracts/token/ERC20/IERC20.sol";

import {SafeERC20} from "openzeppelin-contracts/token/ERC20/utils/SafeERC20.sol";
import {SafeMath} from "openzeppelin-contracts/utils/math/SafeMath.sol";

import {Context} from "openzeppelin-contracts/utils/Context.sol";
import {Ownable} from "openzeppelin-contracts/access/Ownable.sol";

/**
 * @title Farming
 * @notice Seedify's farming contract: stake LP token and earn rewards.
 */
contract SMD_v5 is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    uint256 public constant SECONDS_PER_HOUR = 3600; // 60 * 60

    /// @notice LP token address to deposit to earn rewards.
    address public tokenAddress;
    /// @notice token address to in which rewards will be paid in.
    address public rewardTokenAddress;
    /// @notice total amount of {tokenAddress} staked in the contract over its whole existence.
    uint256 public stakedTotal;
    /// @notice should be the amount of {tokenAddress} staked in the contract for the current period.
    uint256 public stakedBalance;
    /// @notice should be the amount of rewards available in the contract accross all periods.
    uint256 public rewardBalance;
    /// @notice should be the amount of rewards for current period.
    uint256 public totalReward;

    /**
     * @notice start date of current period.
     * @dev expressed in UNIX timestamp. Will be compareed to block.timestamp.
     */
    uint256 public startingDate;
    /**
     * @notice end date of current period.
     * @dev expressed in UNIX timestamp. Will be compareed to block.timestamp.
     */
    uint256 public endingDate;
    /**
     * @notice periodCounter is used to keep track of the farming periods, which allow participants to
     *         earn a certain amount of rewards by staking their LP for a certain period of time. Then,
     *         a new period can be opened with a different or equal amount to earn.
     * @dev counts the amount of farming periods.
     */
    uint256 public periodCounter;
    /**
     * @notice should be the amount of rewards per wei of deposited LP token {tokenAddress} for current
     *         period.
     */
    uint256 public accShare;
    /// @notice timestamp of at which shares have been updated at last, expressed in UNIX timestamp.
    uint256 public lastSharesUpdateTime;
    /**
     * @notice amount of participant in current period.
     * @dev {setNewPeriod} will reset this value to 0.
     */
    uint256 public totalParticipants;
    /// @dev expressed in hours, e.g. 7 days = 24 * 7 = 168.
    uint256 public lockDuration;
    /// @notice whether the farming contract is paused or not.
    /// @dev does prevent wallets from retrieving rewards, stake, withdraw, renew and see old rewards.
    bool public isPaused;

    /// @notice should be the last transfered token which is either {tokenAddress} or {rewardTokenAddress}.
    IERC20 internal _erc20Interface;

    /**
     * @notice struct which should represent the deposit made by a wallet based on all period if the wallet
     *         called {renew}.
     *
     * @param amount amount of LP {tokenAddress} deposited accross all period.
     * @param initialStake should be the timestamp at which the wallet renewed their stake for new periods.
     * @param latestClaim latest timestamp at which the wallet claimed their rewards.
     * @param userAccShare should be the amount of rewards per wei of deposited LP token {tokenAddress}
     *        accross all periods.
     * @param currentPeriod should be the lastest periodCounter at which the wallet participated.
     */
    struct Deposits {
        uint256 amount;
        uint256 initialStake;
        uint256 latestClaim;
        uint256 userAccShare;
        uint256 currentPeriod;
    }

    /**
     * @notice struct which should represent the details of ended periods.
     * @dev period 0 should contain nullish values.
     *
     * @param periodCounter counter to track the period id.
     * @param accShare should be the amount of rewards per wei of deposited LP token {tokenAddress} for
                       this ended period.
     * @param rewPerSecond should be the amount of rewards per second for this ended period.
     * @param startingDate should be the start date of this ended period.
     * @param endingDate should be the end date of this ended period.
     * @param rewards should be the total amount of rewards left until this ended period, which might
     *        include previous rewards from previous closed periods.
     */
    struct PeriodDetails {
        uint256 periodCounter;
        uint256 accShare;
        uint256 rewPerSecond;
        uint256 startingDate;
        uint256 endingDate;
        uint256 rewards;
    }

    /// @notice should be the deposit data made by a wallet for accorss period if the wallet called {renew}.
    mapping(address => Deposits) private deposits;

    /// @notice whether a wallet has staked or not.
    mapping(address => bool) public isPaid;
    /// @notice whether a wallet has staked some LP {tokenAddress} or not.
    mapping(address => bool) public hasStaked;
    /// @notice should be the details of ended periods.
    mapping(uint256 => PeriodDetails) public endAccShare;

    event NewPeriodSet(
        uint256 periodCounter,
        uint256 startDate,
        uint256 endDate,
        uint256 lockDuration,
        uint256 rewardAmount
    );
    event PeriodExtended(
        uint256 periodCounter,
        uint256 endDate,
        uint256 rewards
    );
    event Staked(
        address indexed token,
        address indexed staker_,
        uint256 stakedAmount_
    );
    event PaidOut(
        address indexed token,
        address indexed rewardToken,
        address indexed staker_,
        uint256 amount_,
        uint256 reward_
    );

    /**
     * @notice by default the contract is paused, so the owner can set the first period without anyone
     *         staking before it opens.
     * @param _tokenAddress LP token address to deposit to earn rewards.
     * @param _rewardTokenAddress token address into which rewards will be paid in.
     */
    constructor(address _tokenAddress, address _rewardTokenAddress) Ownable() {
        require(_tokenAddress != address(0), "Zero token address");
        tokenAddress = _tokenAddress;
        require(
            _rewardTokenAddress != address(0),
            "Zero reward token address"
        );
        rewardTokenAddress = _rewardTokenAddress;
        isPaused = true;
    }

    /**
     * @notice set start and end date using UNIX timestamp.
     * @dev also increase period counter/id and resume farming.
     *
     * @param _start Seconds at which the period starts - in UNIX timestamp.
     * @param _end Seconds at which the period ends - in UNIX timestamp.
     */
    function __setStartEnd(uint256 _start, uint256 _end) private {
        require(totalReward > 0, "Add rewards for this periodCounter");
        startingDate = _start;
        endingDate = _end;
        periodCounter++;
        isPaused = false;
        lastSharesUpdateTime = _start;
    }

    /// @notice Add rewards to the contract and transfer them in it.
    function __addReward(
        uint256 _rewardAmount
    )
        private
        hasAllowance(msg.sender, _rewardAmount, rewardTokenAddress)
        returns (bool)
    {
        totalReward = totalReward.add(_rewardAmount);
        rewardBalance = rewardBalance.add(_rewardAmount);
        if (!__payMe(msg.sender, _rewardAmount, rewardTokenAddress)) {
            return false;
        }
        return true;
    }

    /// @notice save the last period details, reset the contract at the end of period and pause farming.
    function __reset() private {
        require(block.timestamp > endingDate, "Wait till end of this period");
        __updateShare();
        endAccShare[periodCounter] = PeriodDetails(
            periodCounter,
            accShare,
            rewPerSecond(),
            startingDate,
            endingDate,
            rewardBalance
        );
        totalReward = 0;
        stakedBalance = 0;
        isPaused = true;
    }

    /**
     * @notice set the start and end timestamp for the new period and add rewards to be
     *         earned within this period. Previous period must have ended, otherwise use
     *         {extendCurrentPeriod} to update current period.
     *         also calls {__addReward} to add rewards to this contract so be sure to approve this contract
     *         to spend your ERC20 before calling this function.
     *
     * @param _rewardAmount Amount of rewards to be earned within this period.
     * @param _start Seconds at which the period starts - in UNIX timestamp.
     * @param _end Seconds at which the period ends - in UNIX timestamp.
     * @param _lockDuration Duration in hours to wait before being able to withdraw.
     */
    function setNewPeriod(
        uint256 _rewardAmount,
        uint256 _start,
        uint256 _end,
        uint256 _lockDuration
    ) external onlyOwner returns (bool) {
        require(
            _start > block.timestamp,
            "Start should be more than block.timestamp"
        );
        require(_end > _start, "End block should be greater than start");
        require(_rewardAmount > 0, "Reward must be positive");
        __reset();
        bool rewardAdded = __addReward(_rewardAmount);
        require(rewardAdded, "Rewards error");
        __setStartEnd(_start, _end);
        lockDuration = _lockDuration;
        totalParticipants = 0;
        emit NewPeriodSet(
            periodCounter,
            _start,
            _end,
            _lockDuration,
            _rewardAmount
        );
        return true;
    }

    /// @notice update {accShare} and {lastSharesUpdateTime} for current period.
    function __updateShare() private {
        if (block.timestamp <= lastSharesUpdateTime) {
            return;
        }
        if (stakedBalance == 0) {
            lastSharesUpdateTime = block.timestamp;
            return;
        }

        uint256 secSinceLastPeriod;

        if (block.timestamp >= endingDate) {
            secSinceLastPeriod = endingDate.sub(lastSharesUpdateTime);
        } else {
            secSinceLastPeriod = block.timestamp.sub(lastSharesUpdateTime);
        }

        uint256 rewards = secSinceLastPeriod.mul(rewPerSecond());

        accShare = accShare.add((rewards.mul(1e6).div(stakedBalance)));
        if (block.timestamp >= endingDate) {
            lastSharesUpdateTime = endingDate;
        } else {
            lastSharesUpdateTime = block.timestamp;
        }
    }

    /// @notice calculate rewards to get per second for current period.
    function rewPerSecond() public view returns (uint256) {
        if (totalReward == 0 || rewardBalance == 0) return 0;
        uint256 rewardPerSecond = totalReward.div(
            (endingDate.sub(startingDate))
        );
        return (rewardPerSecond);
    }

    function stake(
        uint256 amount
    ) external hasAllowance(msg.sender, amount, tokenAddress) returns (bool) {
        require(!isPaused, "Contract is paused");
        require(
            block.timestamp >= startingDate && block.timestamp < endingDate,
            "No active pool (time)"
        );
        require(amount > 0, "Can't stake 0 amount");
        return (__stake(msg.sender, amount));
    }

    function __stake(address from, uint256 amount) private returns (bool) {
        __updateShare();
        // if never staked, create new deposit
        if (!hasStaked[from]) {
            deposits[from] = Deposits({
                amount: amount,
                initialStake: block.timestamp,
                latestClaim: block.timestamp,
                userAccShare: accShare,
                currentPeriod: periodCounter
            });
            totalParticipants = totalParticipants.add(1);
            hasStaked[from] = true;
        }
        // otherwise update deposit details and claim pending rewards
        else {
            // if user has staked in previous period, renew and claim rewards from previous period
            if (deposits[from].currentPeriod != periodCounter) {
                bool renew_ = __renew(from);
                require(renew_, "Error renewing");
            }
            // otherwise on each new stake claim pending rewards of current period
            else {
                bool claim = __claimRewards(from);
                require(claim, "Error paying rewards");
            }

            uint256 userAmount = deposits[from].amount;

            deposits[from] = Deposits({
                amount: userAmount.add(amount),
                initialStake: block.timestamp,
                latestClaim: block.timestamp,
                userAccShare: accShare,
                currentPeriod: periodCounter
            });
        }
        stakedBalance = stakedBalance.add(amount);
        stakedTotal = stakedTotal.add(amount);
        if (!__payMe(from, amount, tokenAddress)) {
            return false;
        }
        emit Staked(tokenAddress, from, amount);
        return true;
    }

    /// @notice get user deposit details
    function userDeposits(
        address from
    ) external view returns (uint256, uint256, uint256, uint256) {
        if (hasStaked[from]) {
            return (
                deposits[from].amount,
                deposits[from].initialStake,
                deposits[from].latestClaim,
                deposits[from].currentPeriod
            );
        } else {
            return (0, 0, 0, 0);
        }
    }

    /// @custom:audit seems like a duplicate of {hasStaked}.
    function fetchUserShare(address from) public view returns (uint256) {
        require(hasStaked[from], "No stakes found for user");
        if (stakedBalance == 0) {
            return 0;
        }
        require(
            deposits[from].currentPeriod == periodCounter,
            "Please renew in the active valid periodCounter"
        );
        uint256 userAmount = deposits[from].amount;
        require(userAmount > 0, "No stakes available for user"); //extra check
        return 1;
    }

    /// @dev claim pending rewards of current period.
    function claimRewards() public returns (bool) {
        require(fetchUserShare(msg.sender) > 0, "No stakes found for user");
        return (__claimRewards(msg.sender));
    }

    function __claimRewards(address from) private returns (bool) {
        uint256 userAccShare = deposits[from].userAccShare;
        __updateShare();
        uint256 amount = deposits[from].amount;
        uint256 rewDebt = amount.mul(userAccShare).div(1e6);
        uint256 rew = (amount.mul(accShare).div(1e6)).sub(rewDebt);
        require(rew > 0, "No rewards generated");
        require(rew <= rewardBalance, "Not enough rewards in the contract");
        deposits[from].userAccShare = accShare;
        deposits[from].latestClaim = block.timestamp;
        rewardBalance = rewardBalance.sub(rew);
        bool payRewards = __payDirect(from, rew, rewardTokenAddress);
        require(payRewards, "Rewards transfer failed");
        emit PaidOut(tokenAddress, rewardTokenAddress, from, amount, rew);
        return true;
    }

    /**
     * @notice Should take into account farming rewards and LP staked from previous periods into the new
     *         current period.
     */
    function renew() public returns (bool) {
        require(!isPaused, "Contract paused");
        require(hasStaked[msg.sender], "No stakings found, please stake");
        require(
            deposits[msg.sender].currentPeriod != periodCounter,
            "Already renewed"
        );
        require(
            block.timestamp > startingDate && block.timestamp < endingDate,
            "Wrong time"
        );
        return (__renew(msg.sender));
    }

    function __renew(address from) private returns (bool) {
        __updateShare();
        if (viewOldRewards(from) > 0) {
            bool claimed = claimOldRewards();
            require(claimed, "Error paying old rewards");
        }
        deposits[from].currentPeriod = periodCounter;
        deposits[from].initialStake = block.timestamp;
        deposits[from].latestClaim = block.timestamp;
        deposits[from].userAccShare = accShare;
        stakedBalance = stakedBalance.add(deposits[from].amount);
        totalParticipants = totalParticipants.add(1);
        return true;
    }

    /// @notice get rewards from previous periods for `from` wallet.
    function viewOldRewards(address from) public view returns (uint256) {
        require(!isPaused, "Contract paused");
        require(hasStaked[from], "No stakings found, please stake");

        if (deposits[from].currentPeriod == periodCounter) {
            return 0;
        }

        uint256 userPeriod = deposits[from].currentPeriod;

        uint256 accShare1 = endAccShare[userPeriod].accShare;
        uint256 userAccShare = deposits[from].userAccShare;

        if (deposits[from].latestClaim >= endAccShare[userPeriod].endingDate)
            return 0;
        uint256 amount = deposits[from].amount;
        uint256 rewDebt = amount.mul(userAccShare).div(1e6);
        uint256 rew = (amount.mul(accShare1).div(1e6)).sub(rewDebt);

        require(rew <= rewardBalance, "Not enough rewards");

        return (rew);
    }

    /// @notice should claim pending rewards from previous periods.
    function claimOldRewards() public returns (bool) {
        require(!isPaused, "Contract paused");
        require(hasStaked[msg.sender], "No stakings found, please stake");
        require(
            deposits[msg.sender].currentPeriod != periodCounter,
            "Already renewed"
        );

        uint256 userPeriod = deposits[msg.sender].currentPeriod;

        uint256 accShare1 = endAccShare[userPeriod].accShare;
        uint256 userAccShare = deposits[msg.sender].userAccShare;

        require(
            deposits[msg.sender].latestClaim <
                endAccShare[userPeriod].endingDate,
            "Already claimed old rewards"
        );
        uint256 amount = deposits[msg.sender].amount;
        uint256 rewDebt = amount.mul(userAccShare).div(1e6);
        uint256 rew = (amount.mul(accShare1).div(1e6)).sub(rewDebt);

        require(rew <= rewardBalance, "Not enough rewards");
        deposits[msg.sender].latestClaim = endAccShare[userPeriod].endingDate;
        rewardBalance = rewardBalance.sub(rew);
        bool paidOldRewards = __payDirect(msg.sender, rew, rewardTokenAddress);
        require(paidOldRewards, "Error paying");
        emit PaidOut(
            tokenAddress,
            rewardTokenAddress,
            msg.sender,
            amount,
            rew
        );
        return true;
    }

    /// @notice should calculate current pending rewards for `from` wallet for current period.
    function calculate(address from) public view returns (uint256) {
        if (fetchUserShare(from) == 0) return 0;
        return (__calculate(from));
    }

    function __calculate(address from) private view returns (uint256) {
        uint256 userAccShare = deposits[from].userAccShare;
        uint256 currentAccShare = accShare;
        //Simulating __updateShare() to calculate rewards
        if (block.timestamp <= lastSharesUpdateTime) {
            return 0;
        }
        if (stakedBalance == 0) {
            return 0;
        }

        uint256 secSinceLastPeriod;

        if (block.timestamp >= endingDate) {
            secSinceLastPeriod = endingDate.sub(lastSharesUpdateTime);
        } else {
            secSinceLastPeriod = block.timestamp.sub(lastSharesUpdateTime);
        }

        uint256 rewards = secSinceLastPeriod.mul(rewPerSecond());

        uint256 newAccShare = currentAccShare.add(
            (rewards.mul(1e6).div(stakedBalance))
        );
        uint256 amount = deposits[from].amount;
        uint256 rewDebt = amount.mul(userAccShare).div(1e6);
        uint256 rew = (amount.mul(newAccShare).div(1e6)).sub(rewDebt);
        return (rew);
    }

    function emergencyWithdraw() external returns (bool) {
        require(
            block.timestamp >
                deposits[msg.sender].initialStake.add(
                    lockDuration.mul(SECONDS_PER_HOUR)
                ),
            "Can't withdraw before lock duration"
        );
        require(hasStaked[msg.sender], "No stakes available for user");
        require(!isPaid[msg.sender], "Already Paid");
        return (__withdraw(msg.sender, deposits[msg.sender].amount));
    }

    function __withdraw(address from, uint256 amount) private returns (bool) {
        __updateShare();
        deposits[from].amount = deposits[from].amount.sub(amount);
        if (!isPaused && deposits[from].currentPeriod == periodCounter) {
            stakedBalance = stakedBalance.sub(amount);
        }
        bool paid = __payDirect(from, amount, tokenAddress);
        require(paid, "Error during withdraw");
        if (deposits[from].amount == 0) {
            isPaid[from] = true;
            hasStaked[from] = false;
            if (deposits[from].currentPeriod == periodCounter) {
                totalParticipants = totalParticipants.sub(1);
            }
            delete deposits[from];
        }
        return true;
    }

    function withdraw(uint256 amount) external returns (bool) {
        require(
            block.timestamp >
                deposits[msg.sender].initialStake.add(
                    lockDuration.mul(SECONDS_PER_HOUR)
                ),
            "Can't withdraw before lock duration"
        );
        require(amount <= deposits[msg.sender].amount, "Wrong value");
        if (deposits[msg.sender].currentPeriod == periodCounter) {
            if (calculate(msg.sender) > 0) {
                bool rewardsPaid = claimRewards();
                require(rewardsPaid, "Error paying rewards");
            }
        }

        if (viewOldRewards(msg.sender) > 0) {
            bool oldRewardsPaid = claimOldRewards();
            require(oldRewardsPaid, "Error paying old rewards");
        }
        return (__withdraw(msg.sender, amount));
    }

    /**
     * @notice add rewards to current period and extend its runing time.
     * @dev running should be updated based on the amount of rewards added and current rewards per second,
     *      e.g.: 1000 rewards per second, then if we add 1000 rewards then we increase running time by
     *      1 second.
     */
    function extendCurrentPeriod(
        uint256 rewardsToBeAdded
    ) external onlyOwner returns (bool) {
        require(
            block.timestamp > startingDate && block.timestamp < endingDate,
            "No active pool (time)"
        );
        require(rewardsToBeAdded > 0, "Zero rewards");
        bool addedRewards = __payMe(
            msg.sender,
            rewardsToBeAdded,
            rewardTokenAddress
        );
        require(addedRewards, "Error adding rewards");
        endingDate = endingDate.add(rewardsToBeAdded.div(rewPerSecond()));
        totalReward = totalReward.add(rewardsToBeAdded);
        rewardBalance = rewardBalance.add(rewardsToBeAdded);
        emit PeriodExtended(periodCounter, endingDate, rewardsToBeAdded);
        return true;
    }

    /// @notice deposit rewards to this farming contract.
    function __payMe(
        address payer,
        uint256 amount,
        address token
    ) private returns (bool) {
        return __payTo(payer, address(this), amount, token);
    }

    /// @notice should transfer rewards to farming contract.
    function __payTo(
        address allower,
        address receiver,
        uint256 amount,
        address token
    ) private returns (bool) {
        // Request to transfer amount from the contract to receiver.
        // contract does not own the funds, so the allower must have added allowance to the contract
        // Allower is the original owner.
        _erc20Interface = IERC20(token);
        _erc20Interface.safeTransferFrom(allower, receiver, amount);
        return true;
    }

    /// @notice should pay rewards to `to` wallet and in certain case withdraw deposited LP token.
    function __payDirect(
        address to,
        uint256 amount,
        address token
    ) private returns (bool) {
        require(
            token == tokenAddress || token == rewardTokenAddress,
            "Invalid token address"
        );
        _erc20Interface = IERC20(token);
        _erc20Interface.safeTransfer(to, amount);
        return true;
    }

    /// @notice check whether `allower` has approved this contract to spend at least `amount` of `token`.
    modifier hasAllowance(
        address allower,
        uint256 amount,
        address token
    ) {
        // Make sure the allower has provided the right allowance.
        require(
            token == tokenAddress || token == rewardTokenAddress,
            "Invalid token address"
        );
        _erc20Interface = IERC20(token);
        uint256 ourAllowance = _erc20Interface.allowance(
            allower,
            address(this)
        );
        require(amount <= ourAllowance, "Make sure to add enough allowance");
        _;
    }
}
