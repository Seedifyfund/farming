const hre = require('hardhat');
import { ethers, network } from 'hardhat';
import * as dotenv from 'dotenv';
dotenv.config();
import * as fs from 'fs';

const deployments = JSON.parse(fs.readFileSync('deployments.json', 'utf8'));

const owner = '0x58Ed38ed63F72DAe99e59d4790789309727DDcbf';

// npx hardhat run scripts/LockedFarming.deploy.ts --network arb
async function main() {
    const LP: string = deployments.contracts[hre.network.name].lpToken;
    const SFUND: string = deployments.contracts.sfund;
    let currentBlock: number;

    console.log(
        `Deploying LockedFarming to ${network.name}, using LP: ${LP} and SFUND: ${SFUND}`
    );

    const farming = await ethers.deployContract('SMD_v5', [LP, SFUND]);

    console.log(`LockedFarming deployed to ${farming.address}`);

    console.log('Waiting for 5 blocks before verifying...');
    currentBlock = await ethers.provider.getBlockNumber();
    while (currentBlock + 5 > (await ethers.provider.getBlockNumber())) {}

    await hre.run('verify:verify', {
        address: farming.address,
        constructorArguments: [LP, SFUND],
    });

    console.log(`Transferring ownership to ${owner}`);
    await farming.transferOwnership(owner);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
