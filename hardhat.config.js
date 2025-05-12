
require("@openzeppelin/hardhat-upgrades");
require("@nomicfoundation/hardhat-toolbox");
// require("@nomicfoundation/hardhat-ethers");
/** @type import('hardhat/config').HardhatUserConfig */

require("dotenv").config();

module.exports = {
  solidity: "0.8.19",
  networks: {
    hardhat: {},
    ganache: {
      url: "http://127.0.0.1:9545/", // Ganache RPC URL
      accounts: {
        mnemonic: "fat rhythm vintage child ladder submit coral double finger flip develop candy",
      },
    },
  },
};

