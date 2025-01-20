import { ethers } from "ethers";
import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CONTRACTS, Factories, getTypedContract } from "../utils/utils";

async function printSupply(hre: HardhatRuntimeEnvironment, account: string) {
    const base = Factories.IWrappedA0GIBase__factory.connect(
        "0x0000000000000000000000000000000000001002",
        (await hre.ethers.getSigners())[0]
    );
    const res = await base.minterSupply(account);
    console.log(`mint cap of ${account}: ${hre.ethers.formatEther(res[0])}`);
    console.log(`mint inital supply of ${account}: ${hre.ethers.formatEther(res[1])}`);
    console.log(`mint supply of ${account}: ${hre.ethers.formatEther(res[2])}`);
}

async function printBalance(hre: HardhatRuntimeEnvironment, account: string) {
    const wa0gi = await getTypedContract(hre, CONTRACTS.WA0GI);
    const res = await wa0gi.balanceOf(account);
    console.log(`balance of ${account}: ${hre.ethers.formatEther(res)}`);
    console.log(
        `balance of wa0gi contract: ${hre.ethers.formatEther(
            await hre.ethers.provider.getBalance(await wa0gi.getAddress())
        )}`
    );
}

task("wa0gibase:mintersupply", "get minter supply")
    .addParam("account", "account", undefined, types.string, false)
    .setAction(async (taskArgs: { account: string }, hre) => {
        await printSupply(hre, taskArgs.account);
    });

task("wa0gibase:get", "get wa0gi address").setAction(async (_taskArgs, hre) => {
    const base = Factories.IWrappedA0GIBase__factory.connect(
        "0x0000000000000000000000000000000000001002",
        (await hre.ethers.getSigners())[0]
    );
    console.log(await base.getWA0GI());
});

task("wa0gi:mint", "mint")
    .addParam("account", "account", undefined, types.string, false)
    .addParam("amount", "amount", undefined, types.string, false)
    .setAction(async (taskArgs: { account: string; amount: string }, hre) => {
        const { getNamedAccounts } = hre;
        const { deployer } = await getNamedAccounts();
        const wa0gi = await getTypedContract(hre, CONTRACTS.WA0GI);
        const receipt = await (await wa0gi.mint(taskArgs.account, hre.ethers.parseEther(taskArgs.amount))).wait();
        if (receipt) {
            console.log(`transaction succeed: ${JSON.stringify(receipt, null, 2)}`);
        } else {
            throw new Error("no receipt");
        }
        await printSupply(hre, deployer);
        await printBalance(hre, taskArgs.account);
    });

task("wa0gi:burn", "mint")
    .addParam("account", "account", undefined, types.string, false)
    .addParam("amount", "amount", undefined, types.string, false)
    .setAction(async (taskArgs: { account: string; amount: string }, hre) => {
        const { getNamedAccounts } = hre;
        const { deployer } = await getNamedAccounts();
        const wa0gi = await getTypedContract(hre, CONTRACTS.WA0GI);
        /*
        const receipt = await (
            await wa0gi["burn(address,uint256)"](taskArgs.account, hre.ethers.parseEther(taskArgs.amount))
        ).wait();
        */
        const receipt = await (await wa0gi.burnFrom(taskArgs.account, hre.ethers.parseEther(taskArgs.amount))).wait();
        if (receipt) {
            console.log(`transaction succeed: ${JSON.stringify(receipt, null, 2)}`);
        } else {
            throw new Error("no receipt");
        }
        await printSupply(hre, deployer);
        await printBalance(hre, taskArgs.account);
    });

task("wa0gi:selfburn", "mint")
    .addParam("amount", "amount", undefined, types.string, false)
    .setAction(async (taskArgs: { amount: string }, hre) => {
        const { getNamedAccounts } = hre;
        const { deployer } = await getNamedAccounts();
        const wa0gi = await getTypedContract(hre, CONTRACTS.WA0GI);
        const receipt = await (await wa0gi["burn(uint256)"](hre.ethers.parseEther(taskArgs.amount))).wait();
        if (receipt) {
            console.log(`transaction succeed: ${JSON.stringify(receipt, null, 2)}`);
        } else {
            throw new Error("no receipt");
        }
        await printSupply(hre, deployer);
        await printBalance(hre, deployer);
    });

task("wa0gi:approve", "mint")
    .addParam("account", "account", undefined, types.string, false)
    .addParam("amount", "amount", undefined, types.string, false)
    .setAction(async (taskArgs: { account: string; amount: string }, hre) => {
        const wa0gi = await getTypedContract(hre, CONTRACTS.WA0GI);
        await (await wa0gi.approve(taskArgs.account, hre.ethers.parseEther(taskArgs.amount))).wait();
    });

task("wa0gi:deposit", "mint")
    .addParam("amount", "amount", undefined, types.string, false)
    .setAction(async (taskArgs: { account: string; amount: string }, hre) => {
        const { getNamedAccounts } = hre;
        const { deployer } = await getNamedAccounts();
        const wa0gi = await getTypedContract(hre, CONTRACTS.WA0GI);
        await (await wa0gi.deposit({ value: hre.ethers.parseEther(taskArgs.amount) })).wait();
        await printSupply(hre, deployer);
        await printBalance(hre, deployer);
    });

task("wa0gi:raw", "get raw transaction")
    .addParam("key", "private key", undefined, types.string, false)
    .setAction(async (taskArgs: { key: string }, hre) => {
        const wa0gi = await hre.ethers.getContractFactory("WrappedA0GI");
        const data = (await wa0gi.getDeployTransaction()).data;

        const wallet = new ethers.Wallet(taskArgs.key);

        const tx = {
            type: 0,
            nonce: 0,
            gasPrice: ethers.parseUnits("100", "gwei"),
            gasLimit: 1000000n,
            to: null,
            value: 0,
            data: data,
            chainId: 0n,
        };

        const signedTx = await wallet.signTransaction(ethers.Transaction.from(tx));

        console.log("Raw Transaction (without chainId):", signedTx);
        /**
  curl RPC_URL \
  -X POST \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_sendRawTransaction","params":["signedTx"],"id":1}'

     */
    });
