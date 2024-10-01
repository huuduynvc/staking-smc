const hre = require("hardhat");

async function main() {
  // deploy test token
  const souniStakingContract = await hre.ethers.getContractFactory("StakingContract");
  const deployTokenContract = await souniStakingContract.deploy(
    "0x5af78CC17C30aD6D8113C77454ed55DEA4A60EFb"
  );
  await deployTokenContract.waitForDeployment();
  console.log("Staking contract :", await deployTokenContract.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
