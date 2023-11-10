import { time } from '@nomicfoundation/hardhat-network-helpers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { BigNumber } from '@ethersproject/bignumber';

import { SMD_v5, Token_Mock, SMD_v5_Mock } from '../../typechain-types';
import { toDecimals } from '../fixtures/BlockchainUtils';
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
    periodOneUserAction,
} from '../fixtures/periods';

describe.skip('simulating mainnet period 2 locally', () => {
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

    it('verifies issue, renew() call does save current opened period detailed as if it was closed', async () => {
        await wholePeriodOne(time, farmingContractMock, serhat);
        await time.increase(periodTwo.at);
        let currentTime = await time.latest();
        await farmingContractMock.setNewPeriod(
            periodTwo.rewardAmount,
            currentTime + periodTwo.start,
            currentTime + periodTwo.end,
            periodTwo.lockDuration
        );

        // jump to serhat renewal timetsamp
        await time.increase(periodTwoUserAction.serhat.renew.at);
        // Simulate Serhat renew - this should not save the current period number 2 at all
        await farmingContractMock.connect(serhat).renew();
        // here it has saved period number 2 details
        expect(verifyNotEmptyStruct(await farmingContractMock.endAccShare(2)));
    });

    it('verifies issue, withdraw() call does save current opened period detailed as if it was closed', async () => {
        await wholePeriodOne(time, farmingContractMock, serhat);
        await time.increase(periodTwo.at);
        let currentTime = await time.latest();
        await farmingContractMock.setNewPeriod(
            periodTwo.rewardAmount,
            currentTime + periodTwo.start,
            currentTime + periodTwo.end,
            periodTwo.lockDuration
        );

        // jump to serhat renewal timetsamp
        await time.increase(periodTwoUserAction.serhat.renew.at);
        // Simulate Serhat withdrawl - this should not save the current period number 2 at all
        await farmingContract
            .connect(serhat)
            .withdraw(periodOneUserAction.serhat.stake.amount);
        // here it has saved period number 2 details
        expect(verifyNotEmptyStruct(await farmingContractMock.endAccShare(2)));
    });

    it('verifies issue, claimOldRewards() call does save current opened period detailed as if it was closed', async () => {
        await wholePeriodOne(time, farmingContractMock, serhat);
        await time.increase(periodTwo.at);
        let currentTime = await time.latest();
        await farmingContractMock.setNewPeriod(
            periodTwo.rewardAmount,
            currentTime + periodTwo.start,
            currentTime + periodTwo.end,
            periodTwo.lockDuration
        );

        // jump to serhat renewal timetsamp
        await time.increase(periodTwoUserAction.serhat.renew.at);
        // Simulate Serhat claim old rewards - this should not save the current period number 2 at all
        await farmingContract.connect(serhat).claimOldRewards();
        // here it has saved period number 2 details
        expect(verifyNotEmptyStruct(await farmingContractMock.endAccShare(2)));
    });

    it('corrects 2nd period behaviours - __saveOldPeriod fix', async () => {
        await wholePeriodOne(time, farmingContractMock, serhat);
        await time.increase(periodTwo.at);
        let currentTime = await time.latest();
        console.log('currentTime', currentTime);
        console.log('start', currentTime + periodTwo.start);
        console.log('end', currentTime + periodTwo.end);
        await farmingContractMock.setNewPeriod(
            periodTwo.rewardAmount,
            currentTime + periodTwo.start,
            currentTime + periodTwo.end,
            periodTwo.lockDuration
        );
        expect(await farmingContractMock.periodCounter()).eq(2);

        ////////// user action //////////
        // jump to serhat renewal timetsamp
        await time.increase(periodTwoUserAction.serhat.renew.at);
        const toReceive = await farmingContractMock.viewOldRewards(
            serhat.address
        );
        // Serhat renews - does get 14.7 rewards
        await farmingContractMock.connect(serhat).workaround_renew();
        // verify renew() does not save the current period 2 details at all
        verifyEmptyStruct(await farmingContractMock.endAccShare(2));
        // Verify Serhat received rewards
        expect(await rewardsToken.balanceOf(serhat.address)).eq(toReceive);
        expect(toDecimals(toReceive)).to.be.closeTo(14.7, 0.1);

        // jump to julia stake timestamp
        await time.increase(periodTwoUserAction.julia.stake.at);
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
        // accShare and userDeposits(julia.address).accShare should be equal
        const juliaDeposit = await farmingContractMock.userDeposits(
            julia.address
        );
        expect(juliaDeposit.userAccShare).eq(newAccShare);
        // accumulated shared should be increased as time pass between new stakes
        expect(newAccShare).to.be.gt(oldAccShare);
        expect(await farmingContractMock.totalStaked()).to.be.gt(
            oldTotalStaked
        );

        ////////// closed by period 3 opening //////////
        await time.increase(periodThree.at);
        //// period detailed not saved yet as no function called {__saveOldPeriod} yet
        verifyEmptyStruct(await farmingContractMock.endAccShare(2));
        currentTime = await time.latest();
        await farmingContractMock.setNewPeriod(
            periodThree.rewardAmount,
            currentTime + periodThree.start,
            currentTime + periodThree.end,
            periodThree.lockDuration
        );
        // verify opening period 3, saved details of period 2 in `endAccShare`
        expect(verifyNotEmptyStruct(await farmingContractMock.endAccShare(2)));
    });

    it('reproduces 2nd period issues, until it is closed by 4th period opening - __saveOldPeriod()', async () => {
        await wholePeriodOne(time, farmingContract, serhat);
        await time.increase(periodTwo.at);
        let currentTime = await time.latest();
        await farmingContract.setNewPeriod(
            periodTwo.rewardAmount,
            currentTime + periodTwo.start,
            currentTime + periodTwo.end,
            periodTwo.lockDuration
        );
        expect(await farmingContract.periodCounter()).eq(2);

        ////////// user action //////////
        ////// jump to serhat renewal timetsamp
        await time.increase(periodTwoUserAction.serhat.renew.at);
        // Serhat renews - does get 14.7 rewards
        await farmingContract.connect(serhat).renew();

        const oldAccShare = await farmingContract.accShare();
        console.log('oldAccShare', oldAccShare.toString());

        // verify renew() creates issue - save the current period 2 details before its end
        const periodTwoEndAccShare = await farmingContract.endAccShare(2);
        verifyNotEmptyStruct(periodTwoEndAccShare);
        // as period 2 is saved, `accShare` must be eq `endAccShare.accShare`
        expect(oldAccShare).eq(periodTwoEndAccShare.accShare);

        ////// jump to julia stake timestamp
        await time.increase(periodTwoUserAction.julia.stake.at);
        // Julia stakes
        await farmingContract
            .connect(julia)
            .stake(periodTwoUserAction.julia.stake.amount);

        const juliaDeposit = await farmingContract.userDeposits(julia.address);
        console.log(
            'juliaDeposit.userAccShare',
            juliaDeposit.userAccShare.toString()
        );
        /* console.log('juliaDeposit.amount', toDecimals(juliaDeposit.amount));
        console.log(
            'juliaDeposit.latestStakeAt',
            juliaDeposit.latestStakeAt
        );
        console.log(
            'juliaDeposit.latestClaimAt',
            juliaDeposit.latestClaimAt
        ); 
         console.log(
             'juliaDeposit.currentPeriod',
             juliaDeposit.currentPeriod.toString()
         ); */

        // accShare and total staked should be updated
        const newAccShare = await farmingContract.accShare();
        console.log('accShare AFTER Julia stake', newAccShare.toString());
        // accumulated shared should be increased as time pass between new stakes
        expect(newAccShare).to.be.gt(oldAccShare);

        ////////// closed by period 3 opening //////////
        await time.increase(periodThree.at);
        //// period detailed saved due to {__saveOldPeriod} bug
        verifyNotEmptyStruct(await farmingContract.endAccShare(2));
        currentTime = await time.latest();
        await farmingContract.setNewPeriod(
            periodThree.rewardAmount,
            currentTime + periodThree.start,
            currentTime + periodThree.end,
            periodThree.lockDuration
        );
    });
});
