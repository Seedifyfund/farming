import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { SMD_v5, Token_Mock } from '../../typechain-types';
import {
    periodOne,
    periodTwo,
    periodThree,
    periodFour,
    periodOneUserAction,
    periodTwoUserAction,
    periodThreeUserAction,
    periodFourUserAction,
} from './periods';

async function wholePeriodOne(
    time: any,
    farmingContract: SMD_v5,
    serhat: SignerWithAddress
) {
    time.increaseTo(periodOne.at);
    await farmingContract.setNewPeriod(
        periodOne.rewardAmount,
        periodOne.start,
        periodOne.end,
        periodOne.lockDuration
    );

    // Serhat stakes
    await time.increaseTo(periodOneUserAction.serhat.stake.at);
    await farmingContract
        .connect(serhat)
        .stake(periodOneUserAction.serhat.stake.amount);
}

export { wholePeriodOne };
