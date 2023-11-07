import { ethers } from 'hardhat';

////////// there are no transaction for start and end of periods, there are updated through setNewPeriod() //////////
//
// 1698691473 - deployment
//
// 1698692920 - period 1 at | start: 1698694200 | end: 1698753600       // set up 1,447s after deployment (24m 7s) | starts 1,280s after set up (21m 20s) | ends 59,400s after start (16h 30m)
// Serhat stake at: 1698695348                                          // stake 2,428s after set up (40m 28s)
//
// 1698756395 - period 2 at | start: 1698756600 | end: 1698764400       // set up 61,047 after Serhat stakes (16h 57m 27s) | starts 205s after set up (40m 28s) | ends 7,800s after start (2h 10m)
// Serhat renew at: 1698760054                                          // renew 3,659s after setup (1h 1m 59s)
// Julia stake at: 1698762839                                           // stake 2,785s after renew (46m 25s)
//
// 1698767536 - period 3 at | start: 1698768000 | end: 1698778800       // set up 4,697s after Julia stakes (1h 18m 17s) | starts 464s after set up (7m 44s) | ends 10,800s after start (3h)
// Serhat renew at: 1698770699                                          // renew 3,163s after set up (52m 43s)
// Bruno stake at: 1698772050                                           // stake 1,351s after renew (22m 31s)
// Serhat claim at: 1698775949                                          // claim 3,899s after Bruno stakes (1h 4m 59s)
// Bruno claim at: 1698776179                                           // claim 230 after Serhat claims (3m 50s)
//
// 1698780101 - period 4 at | start: 1698780600 | end: 1698791400       // set up 3,922s after Bruno claims (1h 5m 22s) | starts 499s after set up (8m 19s) | ends 10,800s after start (3h)
// Serhat renew at: 1698780820                                          // renew 719s after set up (11m 59s)
// Bruno stake at: 1698787130                                           // stake 6,310s after renew (1h 45m 10s)

const deploymentTimestamp = 1698691473;
//////////////////////////////////////////////////////////////////////////////////////////////
////////////////// timestamp are relative to previous on-chain transactions //////////////////
//////////////////////////////////////////////////////////////////////////////////////////////

//////////////// Period 1 transaction details ////////////////
const periodOne = {
    at: 1447,
    rewardAmount: ethers.BigNumber.from('15000000000000000000'),
    start: 1280,
    end: 59400,
    lockDuration: 1,
};
const periodOneUserAction = {
    serhat: {
        stake: {
            amount: ethers.BigNumber.from('19499439399175780'),
            at: 2428,
        },
    },
};

//////////////// Period 2 transaction details ////////////////
const periodTwo = {
    at: 61047,
    rewardAmount: ethers.BigNumber.from('4000000000000000000'),
    start: 205,
    end: 7800,
    lockDuration: 1,
};
const periodTwoUserAction = {
    serhat: {
        renew: {
            rewardsAmount: ethers.BigNumber.from('14710101009675194901'),
            at: 3659,
        },
    },
    julia: {
        stake: {
            amount: ethers.BigNumber.from('10000000000000000'),
            at: 2785,
        },
    },
};

//////////////// Period 3 transaction details ////////////////
const periodThree = {
    at: 4697,
    rewardAmount: ethers.BigNumber.from('950000000000000000'),
    start: 464,
    end: 10800,
    lockDuration: 1,
};
const periodThreeUserAction = {
    serhat: {
        renew: {
            rewardsAmount: ethers.BigNumber.from('0'),
            at: 3163,
        },
        claim: {
            received: ethers.BigNumber.from('461771235767807234'),
            at: 3899,
        },
    },
    bruno: {
        stake: {
            amount: ethers.BigNumber.from('1949943940539'),
            at: 1351,
        },
        claim: {
            received: ethers.BigNumber.from('36316272683742'),
            at: 230,
        },
    },
};

//////////////// Period 4 transaction details ////////////////
const periodFour = {
    at: 3922,
    rewardAmount: ethers.BigNumber.from('5000000000000000000'),
    start: 499,
    end: 10800,
    lockDuration: 1,
};
const periodFourUserAction = {
    serhat: {
        renew: {
            rewardsAmount: ethers.BigNumber.from('250757311330929363'),
            at: 719,
        },
    },
    bruno: {
        stake: {
            amount: ethers.BigNumber.from('1949943940539'),
            at: 6310,
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
