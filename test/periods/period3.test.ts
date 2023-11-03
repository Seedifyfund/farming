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
    periodThree,
    periodFour,
    periodThreeUserAction,
} from '../fixtures/periods';

describe.skip('simulating mainnet period 3 locally', () => {
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

    it('reproduces 3rd period, until it is closed by 4th period opening', async () => {
        await wholePeriodOne(time, farmingContract, serhat);
        // await wholePeriodTwo();
        // open period 3

        ////////// user action //////////
        // Serhat renews - does not get any rewards
        // Bruno stakes
        // Serhat claims
        // Bruno claims

        // closed by period 4 opening
    });
});
