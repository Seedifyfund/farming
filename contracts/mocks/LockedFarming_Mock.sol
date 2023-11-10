// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

/* import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";

import {SMD_v5} from "../LockedFarming.sol";

contract SMD_v5_Mock is SMD_v5 {
    using SafeMath for uint256;

    constructor(
        address _tokenAddress,
        address _rewardTokenAddress
    ) SMD_v5(_tokenAddress, _rewardTokenAddress) {}

    function workaround_claimOldRewards() public returns (bool) {
        require(!isPaused, "Contract paused");
        require(hasStaked[msg.sender], "No stakings found, please stake");
        require(
            deposits[msg.sender].currentPeriod != periodCounter,
            "Already renewed"
        );

        workaround__saveOldPeriod_OnlyWhenEnded(); // CHANGED

        uint256 userPeriod = deposits[msg.sender].currentPeriod;

        uint256 accShare1 = endAccShare[userPeriod].accShare;
        uint256 userAccShare = deposits[msg.sender].userAccShare;

        require(
            deposits[msg.sender].latestClaimAt <
                endAccShare[userPeriod].endingDate,
            "Already claimed old rewards"
        );
        uint256 amount = deposits[msg.sender].amount;
        uint256 rewDebt = amount.mul(userAccShare).div(1e6);
        uint256 rew = (amount.mul(accShare1).div(1e6)).sub(rewDebt);

        require(rew <= rewardBalance, "Not enough rewards");
        deposits[msg.sender].latestClaimAt = endAccShare[userPeriod]
            .endingDate;
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

    function workaround_renew() public returns (bool) {
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
        return (workaround__renew_savePeriod_OnlyWhenEnded(msg.sender)); // CHANGED
    }

    function workaround_withdraw(uint256 amount) external returns (bool) {
        require(!isPaused, "Contract paused");
        require(
            block.timestamp >
                deposits[msg.sender].latestStakeAt.add(
                    lockDuration.mul(SECONDS_PER_HOUR)
                ),
            "Can't withdraw before lock duration"
        );
        require(amount <= deposits[msg.sender].amount, "Wrong value");
        if (deposits[msg.sender].currentPeriod == periodCounter) {
            if (calculate(msg.sender) > 0) {
                bool rewardsPaid = workaround_claimOldRewards(); // CHANGED
                require(rewardsPaid, "Error paying rewards");
            }
        }

        if (_viewOldRewards(msg.sender) > 0) {
            bool oldRewardsPaid = claimOldRewards();
            require(oldRewardsPaid, "Error paying old rewards");
        }
        return (__withdraw(msg.sender, amount));
    }

    function workaround__renew_savePeriod_OnlyWhenEnded(
        address from
    ) private returns (bool) {
        __updateShare();
        if (_viewOldRewards(from) > 0) {
            bool claimed = workaround_claimOldRewards(); // CHANGED
            require(claimed, "Error paying old rewards");
        }
        deposits[from].currentPeriod = periodCounter;
        deposits[from].latestStakeAt = block.timestamp;
        deposits[from].latestClaimAt = block.timestamp;
        deposits[from].userAccShare = accShare;
        stakedBalanceCurrPeriod = stakedBalanceCurrPeriod.add(
            deposits[from].amount
        );
        totalParticipants = totalParticipants.add(1);
        return true;
    }

    function workaround__saveOldPeriod_OnlyWhenEnded() public {
        if (
            block.timestamp > endingDate && // CHANGED
            endAccShare[periodCounter].startingDate == 0
        ) {
            endAccShare[periodCounter] = PeriodDetails(
                periodCounter,
                accShare,
                rewPerSecond(),
                startingDate,
                endingDate,
                rewardBalance
            );
        }
    }
}
 */
