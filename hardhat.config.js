/** @type import('hardhat/config').HardhatUserConfig */

require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const { task } = require("hardhat/config");

const {
  API_URL_ETH_SEPOLIA,
  API_URL_MUMBAI,
  API_URL_ARBITRUM,
  API_URL_OPTIMISM,
  PRIVATE_KEY,
} = process.env;

const account = [PRIVATE_KEY];

task(
  "account",
  "return nonce and balance for specified address on multiple networks"
)
  .addParam("address")
  .setAction(async (address) => {
    const web3ETHSepolia = createAlchemyWeb3(API_URL_ETH_SEPOLIA);
    //const web3Mumbai = createAlchemyWeb3(API_URL_MUMBAI);
    const web3ARBSepolia = createAlchemyWeb3(API_URL_ARBITRUM);
    const web3OPSepolia = createAlchemyWeb3(API_URL_OPTIMISM);

    const networkIDArr = [
      "Ethereum Sepolia:",
      "Arbitrum Sepolia:",
      "Optimisim Sepolia:",
    ];
    const providerArr = [web3ETHSepolia, web3ARBSepolia, web3OPSepolia];

    const resultArr = [];

    for (let i = 0; i < providerArr.length; i++) {
      const nonce = await providerArr[i].eth.getTransactionCount(
        address.address,
        "latest"
      );
      const balance = await providerArr[i].eth.getBalance(address.address);
      resultArr.push([
        networkIDArr[i],
        nonce,
        parseFloat(providerArr[i].utils.fromWei(balance, "ether")).toFixed(2) +
          "ETH",
      ]);
    }
    resultArr.unshift(["|NETWORK|  |NONCE|  |BALANCE|"]);
    console.log(resultArr);
  });

module.exports = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },

  allowUnlimitedContractSize: true,

  networks: {
    ethsepolia: {
      url: API_URL_ETH_SEPOLIA,
      accounts: account,
    },
    mumbai: {
      url: API_URL_MUMBAI,
      accounts: account,
    },
    arbsepolia: {
      url: API_URL_ARBITRUM,
      acccounts: account,
    },
    opsepolia: {
      url: API_URL_OPTIMISM,
      accounts: account,
    },
  },
};
