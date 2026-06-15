import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { UpgradeableBeacon } from "../../typechain-types";
import { CONTRACTS, validateError } from "../utils/utils";

export async function getProxyInfo(hre: HardhatRuntimeEnvironment) {
    const proxied = new Set<string>();
    for (const contractMeta of Object.values(CONTRACTS)) {
        const name = contractMeta.name;
        try {
            await hre.ethers.getContract(`${name}Beacon`);
            proxied.add(name);
        } catch (e) {
            validateError(e, "No Contract deployed with name");
        }
    }
    return proxied;
}

task("access:upgrade", "transfer beacon ownership to timelock")
    .addParam("timelock", "timelock address", undefined, types.string, false)
    .setAction(async (taskArgs: { timelock: string }, hre) => {
        const { getNamedAccounts } = hre;
        const { deployer } = await getNamedAccounts();
        const proxied = await getProxyInfo(hre);
        for (const name of Array.from(proxied)) {
            const beacon: UpgradeableBeacon = await hre.ethers.getContract(`${name}Beacon`, deployer);
            if ((await beacon.owner()).toLowerCase() === deployer.toLowerCase()) {
                console.log(`transfer ownership of ${name}Beacon..`);
                await (await beacon.transferOwnership(taskArgs.timelock)).wait();
            }
        }
    });
