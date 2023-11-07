import { time } from '@nomicfoundation/hardhat-network-helpers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { BigNumber } from '@ethersproject/bignumber';

import { SMD_v5, Token_Mock, SMD_v5_Mock } from '../../typechain-types';
import { toEth, toDecimals } from '../fixtures/BlockchainUtils';
import {
    deployContracts,
    verifyEmptyStruct,
    verifyNotEmptyStruct,
} from '../fixtures/TestUtils';
import { wholePeriodOne, wholePeriodTwo } from '../fixtures/wholePeriods';
import {
    periodThree,
    periodFour,
    periodThreeUserAction,
} from '../fixtures/periods';

describe('simulating mainnet period 3 locally', () => {
    let deployer: SignerWithAddress;
    let serhat: SignerWithAddress;
    let julia: SignerWithAddress;
    let bruno: SignerWithAddress;
    let rewardsToken: Token_Mock;
    let stakingToken: Token_Mock;
    let farmingContract: SMD_v5 | SMD_v5_Mock;
    let farmingContractMock: SMD_v5_Mock;

    it('reproduces 3rd period issues, until it is closed by 4th period opening - __saveOldPeriod()', async () => {
        const isMock: boolean = false;
        ({
            deployer,
            serhat,
            julia,
            bruno,
            rewardsToken,
            stakingToken,
            farmingContract,
        } = await deployContracts(isMock));

        await wholePeriodOne(time, farmingContract, serhat);
        await wholePeriodTwo(time, farmingContract, serhat, julia);
        // open period 3
        await time.increase(periodThree.at);
        let currentTime = await time.latest();
        await farmingContract.setNewPeriod(
            periodThree.rewardAmount,
            currentTime + periodThree.start,
            currentTime + periodThree.end,
            periodThree.lockDuration
        );
        expect(await farmingContract.periodCounter()).eq(3);
        // previous period 2 is saved
        expect(verifyNotEmptyStruct(await farmingContract.endAccShare(2)));

        ////////// user action //////////
        const oldSerhatBalance = await rewardsToken.balanceOf(serhat.address);
        const oldBrunoBalance = await rewardsToken.balanceOf(bruno.address);
        // Serhat renews - does not get any rewards
        await time.increase(periodThreeUserAction.serhat.renew.at);
        // renew will not save the previous period 3 BUT only because Serhat's rewards from period 2 are lost forever
        await farmingContract.connect(serhat).renew();
        // Serhat should have received rewards BUT does not
        expect(await rewardsToken.balanceOf(serhat.address)).eq(
            oldSerhatBalance
        );

        // Julia tries to renew BUT it fails due to underflow in _viewOldRewards(), `uint256 rew = ...`, line 518
        await expect(farmingContract.connect(julia).renew()).to.be.reverted;

        // Bruno stakes
        await time.increase(periodThreeUserAction.bruno.stake.at);
        await farmingContract
            .connect(bruno)
            .stake(periodThreeUserAction.bruno.stake.amount);
        // Serhat claims
        await time.increase(periodThreeUserAction.serhat.claim.at);
        await farmingContract.connect(serhat).claimRewards();
        const serhatNewBalance = toDecimals(
            oldSerhatBalance.add(periodThreeUserAction.serhat.claim.received)
        );
        expect(
            toDecimals(await rewardsToken.balanceOf(serhat.address))
        ).to.be.eq(serhatNewBalance);

        // Bruno claims
        await time.increase(periodThreeUserAction.bruno.claim.at);
        await farmingContract.connect(bruno).claimRewards();
        const brunoNewBalance = toDecimals(
            oldBrunoBalance.add(periodThreeUserAction.bruno.claim.received)
        );
        expect(
            toDecimals(await rewardsToken.balanceOf(bruno.address))
        ).to.be.closeTo(brunoNewBalance, 0.00000000000000001);

        // closed by period 4 opening
        await time.increase(periodFour.at);
        currentTime = await time.latest();
        await farmingContract.setNewPeriod(
            periodFour.rewardAmount,
            currentTime + periodFour.start,
            currentTime + periodFour.end,
            periodFour.lockDuration
        );
        expect(await farmingContract.periodCounter()).eq(4);
    });

    it('corrects 3rd period behaviours - __saveOldPeriod fix', async () => {
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

        await wholePeriodOne(time, farmingContractMock, serhat);
        await wholePeriodTwo(time, farmingContractMock, serhat, julia);
        // open period 3
        await time.increase(periodThree.at);
        let currentTime = await time.latest();
        await farmingContractMock.setNewPeriod(
            periodThree.rewardAmount,
            currentTime + periodThree.start,
            currentTime + periodThree.end,
            periodThree.lockDuration
        );
        expect(await farmingContractMock.periodCounter()).eq(3);
        // previous period 2 is saved
        expect(verifyNotEmptyStruct(await farmingContractMock.endAccShare(2)));

        ////////// user action //////////
        let oldSerhatBalance = await rewardsToken.balanceOf(serhat.address);
        const oldBrunoBalance = await rewardsToken.balanceOf(bruno.address);
        //// Serhat renews - get rewards from period 2
        await time.increase(periodThreeUserAction.serhat.renew.at);
        await farmingContractMock.connect(serhat).workaround_renew();
        // renew has saved not the previous period 3 as it should
        expect(verifyEmptyStruct(await farmingContract.endAccShare(3)));
        // Serhat received rewards
        expect(await rewardsToken.balanceOf(serhat.address)).gt(
            oldSerhatBalance
        );
        // update Serhat rewards again
        oldSerhatBalance = await rewardsToken.balanceOf(serhat.address);
        //// Bruno stakes
        await time.increase(periodThreeUserAction.bruno.stake.at);
        await farmingContractMock
            .connect(bruno)
            .stake(periodThreeUserAction.bruno.stake.amount);
        // Serhat claims
        await time.increase(periodThreeUserAction.serhat.claim.at);
        await farmingContractMock.connect(serhat).claimRewards();
        const serhatNewBalance = toDecimals(
            oldSerhatBalance.add(periodThreeUserAction.serhat.claim.received)
        );
        expect(
            toDecimals(await rewardsToken.balanceOf(serhat.address))
        ).to.be.eq(serhatNewBalance);

        // Bruno claims
        await time.increase(periodThreeUserAction.bruno.claim.at);
        await farmingContractMock.connect(bruno).claimRewards();
        const brunoNewBalance = toDecimals(
            oldBrunoBalance.add(periodThreeUserAction.bruno.claim.received)
        );
        expect(
            toDecimals(await rewardsToken.balanceOf(bruno.address))
        ).to.be.closeTo(brunoNewBalance, 0.00000000000000001);

        // closed by period 4 opening
        await time.increase(periodFour.at);
        currentTime = await time.latest();
        await farmingContractMock.setNewPeriod(
            periodFour.rewardAmount,
            currentTime + periodFour.start,
            currentTime + periodFour.end,
            periodFour.lockDuration
        );
        expect(await farmingContractMock.periodCounter()).eq(4);
    });
});
