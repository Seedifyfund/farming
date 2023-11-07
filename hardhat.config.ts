import '@nomicfoundation/hardhat-toolbox';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-ethers';
import { HardhatUserConfig } from 'hardhat/types';

import * as secrets from './secrets.json';

// use .env vars
import * as dotenv from 'dotenv';
dotenv.config();

const config: HardhatUserConfig = {
    defaultNetwork: 'hardhat',
    networks: {
        hardhat: {
            chainId: 1337,
            initialDate: '01 Jan 1970 00:00:00 GMT', // timestamp at 0
        },
        testnet: {
            url: `https://eth-sepolia.g.alchemy.com/v2/${secrets.alchemy.apiKey.sepolia}`,
            accounts: [secrets.accounts.deployer],
        },
        eth: {
            url: `https://eth-mainnet.g.alchemy.com/v2/${secrets.alchemy.apiKey.ethereum}`,
            accounts: [secrets.accounts.deployer],
        },
        arb: {
            url: `https://arb-mainnet.g.alchemy.com/v2/${secrets.alchemy.apiKey.arbitrum}`,
            accounts: [secrets.accounts.deployer],
        },
    },
    etherscan: {
        apiKey: {
            polygon: secrets?.verification?.polygonscan,
            polygonMumbai: secrets?.verification?.polygonscan,
            sepolia: secrets?.verification?.etherscan,
            arbitrumOne: secrets?.verification?.arbiscan,
            ethereum: secrets?.verification?.etherscan,
        },
    },
    solidity: {
        compilers: [
            {
                version: '0.8.9',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 20000,
                    },
                },
            },
            {
                version: '0.8.19',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 20000,
                    },
                },
            },
        ],
    },
    paths: {
        sources: './contracts',
        tests: './test',
        cache: './cache',
        artifacts: './artifacts',
    },
    mocha: {
        timeout: 20000,
    },
};

export default config;
