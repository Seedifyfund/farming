const hre = require('hardhat');
import * as dotenv from 'dotenv';
dotenv.config();

import * as secrets from '../secrets.json';
import * as deployments from './deployments.json';

// npx hardhat run scripts/LockedFarming.verify.ts --network arb
async function main() {
    await hre.run('verify:verify', {
        address: '0x55560FBfF60FB3409d21Dd86dF9eD364bEA39fbf',
        // see: https://hardhat.org/hardhat-runner/plugins/nomiclabs-hardhat-etherscan#using-programmatically
        constructorArguments: [
            secrets.LP_TOKEN[network.name],
            deployments.SFUND[network.name],
        ],
    });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
