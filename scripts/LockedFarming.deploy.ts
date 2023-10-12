import { ethers } from 'hardhat';
import * as dotenv from 'dotenv';
dotenv.config();

const TOKEN_ADDR = process.env.TOKEN_ADDR;
const REW_TOKEN_ADDR = process.env.REW_TOKEN_ADDR;

// npx hardhat run scripts/LockedFarming.deploy.ts --network bscTest
async function main() {
    const farming = await ethers.deployContract('SMD_v5', [
        TOKEN_ADDR,
        REW_TOKEN_ADDR,
    ]);

    console.log(`LockedFarming deployed to ${farming.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
