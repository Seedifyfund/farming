import { network } from 'hardhat';

const advanceToFuture = async (seconds?: number) => {
    await network.provider.send('evm_increaseTime', [seconds ?? 3600]);
    await network.provider.send('evm_mine');
};

export { advanceToFuture };
