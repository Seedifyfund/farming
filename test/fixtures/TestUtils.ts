import { time } from '@nomicfoundation/hardhat-network-helpers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import {
    SMD_v5,
    SMD_v5__factory,
    Token_Mock,
    Token_Mock__factory,
} from '../../typechain-types';

import { deploymentTimestamp } from './periods';
import { toEth } from './BlockchainUtils';

async function deployContracts() {
    let deployer: SignerWithAddress;
    let serhat: SignerWithAddress;
    let julia: SignerWithAddress;
    let bruno: SignerWithAddress;
    let rewardsToken: Token_Mock;
    let stakingToken: Token_Mock;
    let farmingContract: SMD_v5;

    await time.increaseTo(deploymentTimestamp);

    [deployer, serhat, julia, bruno] = await ethers.getSigners();
    stakingToken = await new Token_Mock__factory(deployer).deploy();
    rewardsToken = await new Token_Mock__factory(deployer).deploy();
    farmingContract = await new SMD_v5__factory(deployer).deploy(
        stakingToken.address,
        rewardsToken.address
    );

    await rewardsToken.mint(deployer.address, toEth('1000000'));
    await stakingToken.mint(serhat.address, toEth('100000'));
    await stakingToken.mint(julia.address, toEth('100000'));
    await stakingToken.mint(bruno.address, toEth('100000'));
    await rewardsToken
        .connect(deployer)
        .approve(farmingContract.address, toEth('1000000'));
    await stakingToken
        .connect(serhat)
        .approve(farmingContract.address, toEth('1000000'));
    await stakingToken
        .connect(bruno)
        .approve(farmingContract.address, toEth('1000000'));

    return {
        deployer,
        serhat,
        julia,
        bruno,
        rewardsToken,
        stakingToken,
        farmingContract,
    };
}

const verifyEmptyStruct = (struct: any) => {
    for (let i = 0; i < struct.length; i++) {
        expect(struct[i]).eq(ethers.BigNumber.from('0'));
    }
};

export { deployContracts, verifyEmptyStruct };
