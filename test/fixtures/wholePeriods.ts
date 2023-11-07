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
    await time.increase(periodOne.at);
    let currentTime = await time.latest();
    await farmingContract.setNewPeriod(
        periodOne.rewardAmount,
        currentTime + periodOne.start,
        currentTime + periodOne.end,
        periodOne.lockDuration
    );

    // Serhat stakes
    await time.increase(periodOneUserAction.serhat.stake.at);
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
    await time.increase(periodTwo.at);
    let currentTime = await time.latest();
    await farmingContract.setNewPeriod(
        periodTwo.rewardAmount,
        currentTime + periodTwo.start,
        currentTime + periodTwo.end,
        periodTwo.lockDuration
    );

    // Serhat renews
    await time.increase(periodTwoUserAction.serhat.renew.at);
    isMock(farmingContract)
        ? await farmingContract.connect(serhat).workaround_renew()
        : await farmingContract.connect(serhat).renew();
    // Juia stakes
    await time.increase(periodTwoUserAction.julia.stake.at);
    await farmingContract
        .connect(julia)
        .stake(periodTwoUserAction.julia.stake.amount);
}

function isMock(object: any): object is SMD_v5_Mock {
    return 'workaround_renew' in object;
}

export { wholePeriodOne, wholePeriodTwo };
