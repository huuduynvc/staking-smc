# NFT Poker Card

# Local Development

The following assumes the use of `node@>=14` and `npm@>=6`.

## Install Dependencies

`npm install --save-dev hardhat`

`npm install ganache-cli`

## Compile Contracts

`npx hardhat compile`

## Run Ganache-cli

`npx hardhat node`

## Run Tests

### Localhost

`npx hardhat --network localhost test` or `yarn test`

## Network

### Deploy linea Test Net

`npx hardhat run --network linea_goerli deploy/linea/deploy-dino.js`

### Deploy linea Test Net Proxy

`npx hardhat run --network linea_goerli deploy/linea/deploy-marketplace-proxy.js`

### Verify + public source code on ftmscan test net

1. Create new constructor params file in arguments folder
2.

```bash
npx hardhat --network linea_goerli verify --constructor-args ./args/linea/dino.js 0x1dD872A2956670882E1C8bEDc444244bfeC04F78
```

### Get verify network hardhat support

`npx hardhat verify --list-networks`


npx hardhat run --network sepolia deploy/sepolia/deploy-card.js
npx hardhat --network sepolia verify --constructor-args ./args/sepolia/nft-card.js 0x19ce9dc53AA037DBF092BE3A0A5F9b9980fb744A