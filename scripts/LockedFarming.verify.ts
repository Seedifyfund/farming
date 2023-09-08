const hre = require("hardhat");
import * as dotenv from "dotenv";
dotenv.config();

// npx hardhat run scripts/LockedFarming.verify.ts --network bscTest
async function main() {
  await hre.run("verify:verify", {
    address: "0xE9f459266ac5f254d287FA7E9F6803749995e668",
    // see: https://hardhat.org/hardhat-runner/plugins/nomiclabs-hardhat-etherscan#using-programmatically
    constructorArguments: [process.env.TOKEN_ADDR, process.env.REW_TOKEN_ADDR],
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
