import { ethers, network } from 'hardhat';
import { BigNumberish } from '@ethersproject/bignumber';

const advanceToFuture = async (seconds?: number) => {
    await network.provider.send('evm_increaseTime', [seconds ?? 3600]);
    await network.provider.send('evm_mine');
};

const toEth = (wei: string) => {
    return ethers.utils.parseEther(wei);
};

const toDecimals = (wei: BigNumberish): number => {
    return parseFloat(ethers.utils.formatUnits(wei, 18));
};

export { advanceToFuture, toEth, toDecimals };
