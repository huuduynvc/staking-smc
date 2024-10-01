require("@nomiclabs/hardhat-ganache");
require("@nomiclabs/hardhat-ethers");
require("@nomicfoundation/hardhat-verify");
require("@nomicfoundation/hardhat-chai-matchers");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();

module.exports = {
  defaultNetwork: "ganache",
  solidity: {
    compilers: [
      {
        version: "0.5.16",
      },
      {
        version: "0.8.0",
      },
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
      {
        version: "0.8.4",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
      {
        version: "0.8.19",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
    ],
  },

  networks: {
    ganache: {
      url: "http://ganache:8545",
      accounts: {
        mnemonic:
          "tail actress very wool broom rule frequent ocean nice cricket extra snap",
        path: " m/44'/60'/0'/0/",
        initialIndex: 0,
        count: 20,
      },
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [`${process.env.PRIVATE_KEY}`],
      chainId: 11155111,
    },
    linea_goerli: {
      url: process.env.LINEA_GOERLI_INFURA_RPC,
      accounts: [`${process.env.PRIVATE_KEY}`],
    },
    linea_mainnet: {
      url: process.env.LINEA_MAINNET_INFURA_RPC,
      accounts: [`${process.env.PRIVATE_KEY}`],
    },
    base_mainnet: {
      url: "https://mainnet.base.org",
      accounts: [`${process.env.PRIVATE_KEY}`],
      gasPrice: 1000000000,
    },
    base_sepolia: {
      url: "https://public.stackup.sh/api/v1/node/base-sepolia",
      accounts: [`${process.env.PRIVATE_KEY}`],
      gasPrice: 1000000000,
    },
    linea_sepolia: {
      url: "https://linea-sepolia.infura.io/v3/a4b52b1122854f89a37329648bb52626",
      accounts: [`${process.env.PRIVATE_KEY}`],
      gasPrice: 1000000000,
    },
    bsct: {
      url: `https://data-seed-prebsc-2-s1.binance.org:8545/`,
      accounts: [`${process.env.PRIVATE_KEY}`],
      gas: 8100000,
      gasPrice: 8000000000,
    },
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY,
      linea_testnet: process.env.LINEASCAN_API_KEY,
      linea_sepolia: process.env.LINEASCAN_API_KEY,
      linea_mainnet: process.env.LINEASCAN_API_KEY,
      base_sepolia: process.env.BASESCAN_API_KEY,
      bscTestnet: process.env.BSCSCAN_API_KEY,
    },
    customChains: [
      {
        network: "linea_testnet",
        chainId: 59140,
        urls: {
          apiURL: "https://api-testnet.lineascan.build/api",
          browserURL: "https://goerli.lineascan.build/",
        },
      },
      {
        network: "linea_mainnet",
        chainId: 59144,
        urls: {
          apiURL: "https://api.lineascan.build/api",
          browserURL: "https://lineascan.build/",
        },
      },
      {
        network: "base_sepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://public.stackup.sh/api/v1/node/base-sepolia",
          browserURL: "https://sepolia.basescan.org/",
        },
      },
      {
        network: "linea_sepolia",
          chainId: 59141,
          urls: {
            apiURL: "https://linea-sepolia.infura.io/v3/a4b52b1122854f89a37329648bb52626",
            browserURL: "https://sepolia.linea.build",
        }
      }
    ]
  }
};
