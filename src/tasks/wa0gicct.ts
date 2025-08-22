import { parseEther } from "ethers";
import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { WA0GICCT, WrappedA0GI } from "../../typechain-types";
import { CONTRACTS, getTypedContract } from "../utils/utils";

const WRAPPED_A0GI = "0x1Cd0690fF9a693f5EF2dD976660a8dAFc81A109c";

async function printSupply(hre: HardhatRuntimeEnvironment, wa0gicct: WA0GICCT, account: string) {
    const res = await wa0gicct.minterSupply(account);
    console.log(`mint cap of ${account}: ${hre.ethers.formatEther(res[0])}`);
    console.log(`mint inital supply of ${account}: ${hre.ethers.formatEther(res[1])}`);
    console.log(`mint supply of ${account}: ${hre.ethers.formatEther(res[2])}`);
}

async function printBalance(hre: HardhatRuntimeEnvironment, wa0gicct: WA0GICCT, account: string) {
    const signer = await hre.ethers.getSigner((await hre.getNamedAccounts()).deployer);
    const wa0gi: WrappedA0GI = await hre.ethers.getContractAt("WrappedA0GI", WRAPPED_A0GI, signer);
    console.log(`wa0gi balance of ${account}: ${hre.ethers.formatEther(await wa0gi.balanceOf(account))}`);
    console.log(`wa0gicct balance of ${account}: ${hre.ethers.formatEther(await wa0gicct.balanceOf(account))}`);
    console.log(
        `wa0gi balance of wa0gicct: ${hre.ethers.formatEther(await wa0gi.balanceOf(await wa0gicct.getAddress()))}`
    );
    console.log(
        `balance of wa0gi contract: ${hre.ethers.formatEther(
            await hre.ethers.provider.getBalance(await wa0gi.getAddress())
        )}`
    );
}

task("wa0gicct:grantminter", "grant minter role")
    .addParam("account", "account", undefined, types.string, false)
    .addParam("cap", "cap", undefined, types.string, false)
    .addParam("initialsupply", "initialsupply", undefined, types.string, false)
    .setAction(async (taskArgs: { account: string; cap: string; initialsupply: string }, hre) => {
        const wa0gicct = await getTypedContract(hre, CONTRACTS.WA0GICCT);
        await (await wa0gicct.grantRole(await wa0gicct.MINTER_ROLE(), taskArgs.account)).wait();
        await (
            await wa0gicct.setMinterCap(taskArgs.account, parseEther(taskArgs.cap), parseEther(taskArgs.initialsupply))
        ).wait();
    });

task("wa0gicct:mint", "mint")
    .addParam("account", "account", undefined, types.string, false)
    .addParam("amount", "amount", undefined, types.string, false)
    .setAction(async (taskArgs: { account: string; amount: string }, hre) => {
        const wa0gicct = await getTypedContract(hre, CONTRACTS.WA0GICCT);
        await (await wa0gicct.mint(taskArgs.account, hre.ethers.parseEther(taskArgs.amount))).wait();
        await printSupply(hre, wa0gicct, taskArgs.account);
        await printBalance(hre, wa0gicct, taskArgs.account);
    });

task("wa0gicct:burn", "burn")
    .addParam("account", "account", undefined, types.string, false)
    .addParam("amount", "amount", undefined, types.string, false)
    .setAction(async (taskArgs: { account: string; amount: string }, hre) => {
        const wa0gicct = await getTypedContract(hre, CONTRACTS.WA0GICCT);
        await (await wa0gicct.burnFrom(taskArgs.account, hre.ethers.parseEther(taskArgs.amount))).wait();
        await printSupply(hre, wa0gicct, taskArgs.account);
        await printBalance(hre, wa0gicct, taskArgs.account);
    });

task("wa0gicct:deposit", "deposit")
    .addParam("amount", "amount", undefined, types.string, false)
    .setAction(async (taskArgs: { account: string; amount: string }, hre) => {
        const { getNamedAccounts } = hre;
        const { deployer } = await getNamedAccounts();
        const signer = await hre.ethers.getSigner((await hre.getNamedAccounts()).deployer);
        const wa0gi: WrappedA0GI = await hre.ethers.getContractAt("WrappedA0GI", WRAPPED_A0GI, signer);
        const wa0gicct = await getTypedContract(hre, CONTRACTS.WA0GICCT);
        await (await wa0gi.approve(await wa0gicct.getAddress(), hre.ethers.parseEther(taskArgs.amount))).wait();
        await (await wa0gicct.deposit(hre.ethers.parseEther(taskArgs.amount))).wait();
        await printSupply(hre, wa0gicct, deployer);
        await printBalance(hre, wa0gicct, deployer);
    });

task("wa0gicct:withdraw", "withdraw")
    .addParam("amount", "amount", undefined, types.string, false)
    .setAction(async (taskArgs: { account: string; amount: string }, hre) => {
        const { getNamedAccounts } = hre;
        const { deployer } = await getNamedAccounts();
        const wa0gicct = await getTypedContract(hre, CONTRACTS.WA0GICCT);
        await (await wa0gicct.withdraw(hre.ethers.parseEther(taskArgs.amount))).wait();
        await printSupply(hre, wa0gicct, deployer);
        await printBalance(hre, wa0gicct, deployer);
    });
