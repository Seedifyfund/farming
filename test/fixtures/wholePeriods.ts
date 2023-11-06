import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { SMD_v5, SMD_v5_Mock } from '../../typechain-types';
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
    farmingContract: SMD_v5 | SMD_v5_Mock,
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

async function wholePeriodTwo(
    time: any,
    farmingContract: SMD_v5 | SMD_v5_Mock,
    serhat: SignerWithAddress,
    julia: SignerWithAddress
) {
    time.increaseTo(periodTwo.at);
    await farmingContract.setNewPeriod(
        periodTwo.rewardAmount,
        periodTwo.start,
        periodTwo.end,
        periodTwo.lockDuration
    );

    // Serhat renews
    await time.increaseTo(periodTwoUserAction.serhat.renew.at);
    isMock(farmingContract)
        ? await farmingContract.connect(serhat).workaround_renew()
        : await farmingContract.connect(serhat).renew();
    // Juia stakes
    await time.increaseTo(periodTwoUserAction.julia.stake.at);
    await farmingContract
        .connect(julia)
        .stake(periodTwoUserAction.julia.stake.amount);
}

function isMock(object: any): object is SMD_v5_Mock {
    return 'workaround_renew' in object;
}

export { wholePeriodOne, wholePeriodTwo };
