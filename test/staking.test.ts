import { time } from '@nomicfoundation/hardhat-network-helpers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import {
    SMD_v5,
    SMD_v5__factory,
    Token_Mock,
    Token_Mock__factory,
} from '../typechain-types';
import { advanceToFuture } from './fixtures/BlockchainUtils';

describe('when staking funds', () => {
    let deployer: SignerWithAddress;
    let user: SignerWithAddress;
    let tokenContract: Token_Mock;
    let farmingContract: SMD_v5;

    //Simulate the blockchain is 60s in future to prevent timestamp issues running time-based tests
    const offset = 60;

    beforeEach(async () => {
        [deployer, user] = await ethers.getSigners();
        tokenContract = await new Token_Mock__factory(deployer).deploy();
        farmingContract = await new SMD_v5__factory(deployer).deploy(
            tokenContract.address,
            tokenContract.address
        );

        await tokenContract.mint(deployer.address, 10000);
        await tokenContract.mint(user.address, 10000);
        await tokenContract.mint(farmingContract.address, 1000000);
        await tokenContract
            .connect(deployer)
            .approve(farmingContract.address, 10000);
        await tokenContract
            .connect(user)
            .approve(farmingContract.address, 10000);
    });

    it('then should not be able to stake before period starts', async () => {
        const currentTime = await time.latest();
        const periodDuration = 3 * 60 * 60; //3 hours
        const lockDuration = 1;
        await farmingContract.setNewPeriod(
            1000,
            currentTime + offset,
            currentTime + periodDuration + offset,
            lockDuration
        );

        const tx = farmingContract.connect(user).stake(1000);

        await expect(tx).to.be.revertedWith('No active pool (time)');
    });

    it('then should be able to stake after period starts', async () => {
        const currentTime = await time.latest();
        const periodDuration = 3 * 60 * 60; //3 hours
        const lockDuration = 1;
        await farmingContract.setNewPeriod(
            1000,
            currentTime + offset,
            currentTime + offset + periodDuration,
            lockDuration
        );

        await advanceToFuture(offset + 30);

        const tx = farmingContract.connect(user).stake(1000);

        await expect(tx).not.to.be.reverted;
    });

    it('then my balance should go down', async () => {
        let currentTime = await time.latest();
        const periodDuration = 3 * 60 * 60; //3 hours
        const lockDuration = 1;
        const stakeAmount = 1000;
        await farmingContract.setNewPeriod(
            1000,
            currentTime + offset,
            currentTime + offset + periodDuration,
            lockDuration
        );
        const originalBalance = await tokenContract.balanceOf(user.address);

        await advanceToFuture(offset + 30);
        await farmingContract.connect(user).stake(stakeAmount);
        await advanceToFuture(lockDuration);

        const newBalance = await tokenContract.balanceOf(user.address);
        expect(newBalance).to.be.eq(originalBalance.sub(stakeAmount));
    });
});
