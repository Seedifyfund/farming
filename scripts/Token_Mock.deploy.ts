import { ethers } from 'hardhat';
import * as dotenv from 'dotenv';
dotenv.config();

const TOKEN_ADDR = process.env.TOKEN_ADDR;
const REW_TOKEN_ADDR = process.env.REW_TOKEN_ADDR;

// npx hardhat run scripts/Token_Mock.deploy.ts --network sepolia
async function main() {
    const farming = await ethers.deployContract('Token_Mock', []);

    console.log(`Token_Mock deployed to ${farming.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
