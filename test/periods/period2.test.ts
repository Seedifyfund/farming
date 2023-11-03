import { time } from '@nomicfoundation/hardhat-network-helpers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { BigNumber } from '@ethersproject/bignumber';

import { SMD_v5, Token_Mock, SMD_v5_Mock } from '../../typechain-types';
import { toEth, toDecimals } from '../fixtures/BlockchainUtils';
import {
    deployContracts,
    verifyNotEmptyStruct,
    verifyEmptyStruct,
} from '../fixtures/TestUtils';
import { wholePeriodOne } from '../fixtures/wholePeriods';
import {
    periodTwo,
    periodThree,
    periodTwoUserAction,
} from '../fixtures/periods';

describe('simulating mainnet period 2 locally', () => {
    let deployer: SignerWithAddress;
    let serhat: SignerWithAddress;
    let julia: SignerWithAddress;
    let bruno: SignerWithAddress;
    let rewardsToken: Token_Mock;
    let stakingToken: Token_Mock;
    let farmingContract: SMD_v5 | SMD_v5_Mock;
    let farmingContractMock: SMD_v5_Mock;

    beforeEach(async () => {
        const isMock: boolean = true;
        ({
            deployer,
            serhat,
            julia,
            bruno,
            rewardsToken,
            stakingToken,
            farmingContract,
        } = await deployContracts(isMock));

        farmingContractMock = farmingContract as SMD_v5_Mock;
    });

    it('verifies, renew() call does save current opened period detailed as if it was closed', async () => {
        await wholePeriodOne(time, farmingContractMock, serhat);
        await time.increaseTo(periodTwo.at);
        await farmingContractMock.setNewPeriod(
            periodTwo.rewardAmount,
            periodTwo.start,
            periodTwo.end,
            periodTwo.lockDuration
        );

        // jump to serhat renewal timetsamp
        await time.increaseTo(periodTwoUserAction.serhat.renew.at);
        // Serhat renews - does get 14.7 rewards
        await farmingContractMock.connect(serhat).renew();

        expect(verifyNotEmptyStruct(await farmingContractMock.endAccShare(2)));
    });

    it('uses SMD_v5_Mock and reproduces 2nd period, until it is closed by 3rd period opening', async () => {
        await wholePeriodOne(time, farmingContractMock, serhat);
        await time.increaseTo(periodTwo.at);
        await farmingContractMock.setNewPeriod(
            periodTwo.rewardAmount,
            periodTwo.start,
            periodTwo.end,
            periodTwo.lockDuration
        );
        expect(await farmingContractMock.periodCounter()).eq(2);

        ////////// user action //////////
        // jump to serhat renewal timetsamp
        await time.increaseTo(periodTwoUserAction.serhat.renew.at);
        const toReceive = await farmingContractMock.viewOldRewards(
            serhat.address
        );
        // Serhat renews - does get 14.7 rewards
        await farmingContractMock.connect(serhat).workaround_renew();

        expect(await rewardsToken.balanceOf(serhat.address)).eq(toReceive);
        expect(toDecimals(toReceive)).to.be.closeTo(14.7, 0.1);

        // jump to julia stake timestamp
        await time.increaseTo(periodTwoUserAction.julia.stake.at);
        const oldAccShare = await farmingContractMock.accShare();
        console.log('oldAccShare', toDecimals(oldAccShare));
        const oldTotalStaked = await farmingContractMock.totalStaked();
        // Julia stakes
        await farmingContractMock
            .connect(julia)
            .stake(periodTwoUserAction.julia.stake.amount);

        // accShare and total staked should be updated
        const newAccShare = await farmingContractMock.accShare();
        console.log('accShare AFTER Julia stake', toDecimals(newAccShare));
        // accumulated shared should be increased as time pass between new stakes
        expect(newAccShare).to.be.gt(oldAccShare);
        expect(await farmingContractMock.totalStaked()).to.be.gt(
            oldTotalStaked
        );

        ////////// closed by period 3 opening //////////
        await time.increaseTo(periodThree.at);
        //// period detailed not saved yet as no function called {__saveOldPeriod} yet
        verifyEmptyStruct(await farmingContractMock.endAccShare(2));
    });
});
