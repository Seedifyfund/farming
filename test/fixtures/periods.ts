import { ethers } from 'hardhat';

const deploymentTimestamp = 1698691473;
const periodOne = {
    at: 1698692920,
    rewardAmount: ethers.BigNumber.from('15000000000000000000'),
    start: 1698694200,
    end: 1698753600,
    lockDuration: 1,
};
const periodTwo = {
    at: 1698756395,
    rewardAmount: ethers.BigNumber.from('4000000000000000000'),
    start: 1698756600,
    end: 1698764400,
    lockDuration: 1,
};
const periodThree = {
    at: 1698767536,
    rewardAmount: ethers.BigNumber.from('950000000000000000'),
    start: 1698768000,
    end: 1698778800,
    lockDuration: 1,
};
const periodFour = {
    at: 1698780101,
    rewardAmount: ethers.BigNumber.from('5000000000000000000'),
    start: 1698780600,
    end: 1698791400,
    lockDuration: 1,
};

const periodOneUserAction = {
    serhat: {
        stake: {
            amount: ethers.BigNumber.from('19499439399175780'),
            at: 1698695348,
        },
    },
};
const periodTwoUserAction = {
    serhat: {
        renew: {
            rewardsAmount: ethers.BigNumber.from('14710101009675194901'),
            at: 1698760054,
        },
    },
    julia: {
        stake: {
            amount: ethers.BigNumber.from('10000000000000000'),
            at: 1698762839,
        },
    },
};
const periodThreeUserAction = {
    serhat: {
        renew: {
            rewardsAmount: ethers.BigNumber.from('0'),
            at: 1698770699,
        },
        claim: {
            received: ethers.BigNumber.from('461771235767807234'),
            at: 1698775949,
        },
    },
    bruno: {
        stake: {
            amount: ethers.BigNumber.from('1949943940539'),
            at: 1698772050,
        },
        claim: {
            received: ethers.BigNumber.from('36316272683742'),
            at: 1698776179,
        },
    },
};
const periodFourUserAction = {
    serhat: {
        renew: {
            rewardsAmount: ethers.BigNumber.from('250757311330929363'),
            at: 1698780820,
        },
    },
    bruno: {
        stake: {
            amount: ethers.BigNumber.from('1949943940539'),
            at: 1698787130,
        },
    },
};

export {
    deploymentTimestamp,
    periodOne,
    periodTwo,
    periodThree,
    periodFour,
    periodOneUserAction,
    periodTwoUserAction,
    periodThreeUserAction,
    periodFourUserAction,
};
