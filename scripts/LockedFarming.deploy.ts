const hre = require('hardhat');
import { ethers, network } from 'hardhat';
import * as dotenv from 'dotenv';
dotenv.config();

import * as secrets from '../secrets.json';
import * as deployments from './deployments.json';

// npx hardhat run scripts/LockedFarming.deploy.ts --network arb
async function main() {
    const LP: string = secrets.LP_TOKEN[network.name];
    const SFUND: string = deployments.SFUND[network.name];

    console.log(
        `Deploying LockedFarming to ${network.name}, using LP: ${LP} and SFUND: ${SFUND}`
    );

    const farming = await ethers.deployContract('SMD_v5', [LP, SFUND]);

    console.log(`LockedFarming deployed to ${farming.address}`);

    console.log('Waiting for LockedFarming to be verified...');
    await farming.wait();
    await hre.run('verify:verify', {
        address: farming.address,
        constructorArguments: [LP, SFUND],
    });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
