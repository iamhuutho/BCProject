const { ethers, artifacts } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Get the ContractFatories and Signers here
  const StandardNFT = await ethers.getContractFactory("StandardNFT");
  const SpecialNFT = await ethers.getContractFactory("SpecialNFT");
  const Marketplace = await ethers.getContractFactory("Marketplace");
  // deploy contract
  const standardnft = await StandardNFT.deploy();
  const specialnft = await SpecialNFT.deploy();
  standardnft.waitForDeployment();
  specialnft.waitForDeployment();

  const market = await Marketplace.deploy(2); // feePercent : 1%
  market.waitForDeployment();

  saveToFrontendFile(standardnft, "StandardNFT");
  saveToFrontendFile(specialnft, "SpecialNFT");
  saveToFrontendFile(market, "Marketplace");
}

async function saveToFrontendFile(contract, name) {
  const fs = require("fs");

  const contractsDir = __dirname + "/../../contracstData";

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    contractsDir + `/${name}-address.json`,
    JSON.stringify(
      {
        address: await contract.getAddress(),
      },
      null,
      2
    )
  );

  const contractAtifact = artifacts.readArtifactSync(name);
  fs.writeFileSync(
    contractsDir + `/${name}.json`,
    JSON.stringify(contractAtifact, null, 2)
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
