const hre = require("hardhat");
import * as dotenv from "dotenv";
dotenv.config();

// npx hardhat run scripts/Token_Mock.verify.ts --network sepolia
async function main() {
  await hre.run("verify:verify", {
    address: "0x394847038eE56af38f3c73b227961a52f0b92b87",
    // see: https://hardhat.org/hardhat-runner/plugins/nomiclabs-hardhat-etherscan#using-programmatically
    constructorArguments: [],
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
