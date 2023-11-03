import { time } from '@nomicfoundation/hardhat-network-helpers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { BigNumber } from '@ethersproject/bignumber';

import { SMD_v5, Token_Mock } from '../../typechain-types';
import { toEth, toDecimals } from '../fixtures/BlockchainUtils';
import { deployContracts, verifyEmptyStruct } from '../fixtures/TestUtils';
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
    let farmingContract: SMD_v5;

    beforeEach(async () => {
        ({
            deployer,
            serhat,
            julia,
            bruno,
            rewardsToken,
            stakingToken,
            farmingContract,
        } = await deployContracts());
    });

    it('reproduces 2nd period, until it is closed by 3rd period opening', async () => {
        await wholePeriodOne(time, farmingContract, serhat);
        await time.increaseTo(periodTwo.at);
        await farmingContract.setNewPeriod(
            periodTwo.rewardAmount,
            periodTwo.start,
            periodTwo.end,
            periodTwo.lockDuration
        );

        ////////// user action //////////
        // Serhat renews - does get 14.7 rewards
        await time.increaseTo(periodTwoUserAction.serhat.renew.at);
        const toReceive = farmingContract.viewOldRewards(serhat.address);
        await farmingContract.connect(serhat).renew();
        expect(await rewardsToken.balanceOf(serhat.address)).eq(toReceive);
        // Julia stakes

        // closed by period 3 opening
    });
});
