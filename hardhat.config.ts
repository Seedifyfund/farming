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
        },
        testnet: {
            url: `https://eth-sepolia.g.alchemy.com/v2/${secrets.alchemy.apiKey}`,
            accounts: [secrets.accounts.deployer],
        },
    },
    etherscan: {
        apiKey: {
            polygon: secrets?.verification?.polygonscan,
            polygonMumbai: secrets?.verification?.polygonscan,
            sepolia: secrets?.verification?.etherscan,
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
