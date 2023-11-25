require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    /*     testnet: {
      url: "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
      chainId: 97,
      gasPrice: 20000000000,
      accounts: [
        "b93830f0fe9386e405870afe8939e3a00c3ab01151b86d476674dfe2783c9358",
      ], // private key of wallet
    }, */
    sepolia: {
      url: "https://sepolia.infura.io/v3/6759026d07124b1dab6dcadcb0281545",
      chainId: 11155111,
      accounts: [
        "b6cd70fa932c284923eab07530da0608f8f0d9cbbd7b1b0d4f61193dca1b52a0",
      ],
    },
  },
  paths: {
    artifacts: "./artifacts",
    sources: "./contracts",
    cache: "./cache",
    tests: "./test",
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://bscscan.com/
    apiKey: "Q6VCV88RXHEB32M1K1GY9U55TMQJ4NXUDH", // api bscscan
  },
};
