import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.27",
  etherscan: {
    apiKey: {
      sepolia: "7BCR28R35WQI5I1TD57WR5IV33YZB5A4DA",
      bscTestnet:"SPBE4S8W27FDJYPSD2FA7VY16U5PWBJJ4G"
    }
  },
  networks: {
    sepolia: {  
      url: "https://eth-sepolia.public.blastapi.io",
      accounts: ["c243e17813446c73b0e006c5bbd4997f0fe713621d43a47d906a8d1226312bd5"]
    },
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      accounts: ["1cfc396df6ff23f8b20ad1014d44c75449ccddb8bc26966c683145ef4bac7050"] 
    }
  }
};

export default config;
