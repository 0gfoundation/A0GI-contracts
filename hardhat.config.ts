import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-abi-exporter";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import { HardhatUserConfig, HttpNetworkUserConfig } from "hardhat/types";

// environment configs
import dotenv from "dotenv";
dotenv.config();
const { NODE_URL, DEPLOYER_KEY, ETHERSCAN_API_KEY } = process.env;

import "./src/tasks/access";
import "./src/tasks/upgrade";
import "./src/tasks/wa0gi";

const userConfig: HttpNetworkUserConfig = {
    accounts: DEPLOYER_KEY ? [DEPLOYER_KEY] : [],
};

const config: HardhatUserConfig = {
    paths: {
        artifacts: "build/artifacts",
        cache: "build/cache",
        sources: "contracts",
        deploy: "src/deploy",
    },
    solidity: {
        compilers: [
            {
                version: "0.8.20",
                settings: {
                    evmVersion: "istanbul",
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],
    },
    networks: {
        hardhat: {
            allowUnlimitedContractSize: true,
            allowBlocksWithSameTimestamp: true,
            blockGasLimit: 100000000,
            gas: 100000000,
        },
        local: {
            ...userConfig,
            url: "http://127.0.0.1:8545",
        },
    },
    namedAccounts: {
        deployer: 0,
    },
    mocha: {
        timeout: 2000000,
    },
    verify: {
        etherscan: {
            apiKey: ETHERSCAN_API_KEY,
        },
    },
    gasReporter: {
        enabled: process.env.REPORT_GAS ? true : false,
    },
    abiExporter: {
        path: "./abis",
        runOnCompile: true,
        clear: true,
        flat: true,
        format: "json",
    },
};
if (NODE_URL && config.networks) {
    config.networks.custom = {
        ...userConfig,
        url: NODE_URL,
    };
}
export default config;
