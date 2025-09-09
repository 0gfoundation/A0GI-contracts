import { parseEther } from "ethers";
import { task, types } from "hardhat/config";
import { CONTRACTS, getTypedContract } from "../utils/utils";

task("a0gi:grantminter", "grant minter role")
    .addParam("account", "account", undefined, types.string, false)
    .addParam("cap", "cap", undefined, types.string, false)
    .addParam("initialsupply", "initialsupply", undefined, types.string, false)
    .setAction(async (taskArgs: { account: string; cap: string; initialsupply: string }, hre) => {
        const a0gi = await getTypedContract(hre, CONTRACTS.A0GI);
        await (await a0gi.grantRole(await a0gi.MINTER_ROLE(), taskArgs.account)).wait();
        await (
            await a0gi.setMinterCap(taskArgs.account, parseEther(taskArgs.cap), parseEther(taskArgs.initialsupply))
        ).wait();
    });

task("a0gi:mint", "mint")
    .addParam("account", "account", undefined, types.string, false)
    .addParam("amount", "amount", undefined, types.string, false)
    .setAction(async (taskArgs: { account: string; amount: string }, hre) => {
        const a0gi = await getTypedContract(hre, CONTRACTS.A0GI);
        await (await a0gi.mint(taskArgs.account, hre.ethers.parseEther(taskArgs.amount))).wait();
    });

task("a0gi:burn", "burn")
    .addParam("account", "account", undefined, types.string, false)
    .addParam("amount", "amount", undefined, types.string, false)
    .setAction(async (taskArgs: { account: string; amount: string }, hre) => {
        const a0gi = await getTypedContract(hre, CONTRACTS.A0GI);
        await (await a0gi.burnFrom(taskArgs.account, hre.ethers.parseEther(taskArgs.amount))).wait();
    });
