import { ethers, parseEther } from "ethers";
import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { UpgradeableBeacon, WrappedA0GI, WrappedA0GIBaseAgency } from "../../typechain-types";
import {
    BEACON_PROXY,
    CONTRACTS,
    Factories,
    getRawDeployment,
    getTypedContract,
    UPGRADEABLE_BEACON,
} from "../utils/utils";

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
    const signer = await hre.ethers.getSigner((await hre.getNamedAccounts()).deployer);
    const wa0gi: WrappedA0GI = await hre.ethers.getContractAt("WrappedA0GI", WRAPPED_A0GI, signer);
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

const WRAPPED_A0GI = "0x1Cd0690fF9a693f5EF2dD976660a8dAFc81A109c";

task("wa0gi:mint", "mint")
    .addParam("account", "account", undefined, types.string, false)
    .addParam("amount", "amount", undefined, types.string, false)
    .setAction(async (taskArgs: { account: string; amount: string }, hre) => {
        const { getNamedAccounts } = hre;
        const { deployer } = await getNamedAccounts();
        const signer = await hre.ethers.getSigner((await hre.getNamedAccounts()).deployer);
        const wa0gi: WrappedA0GI = await hre.ethers.getContractAt("WrappedA0GI", WRAPPED_A0GI, signer);
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
        const signer = await hre.ethers.getSigner((await hre.getNamedAccounts()).deployer);
        const wa0gi: WrappedA0GI = await hre.ethers.getContractAt("WrappedA0GI", WRAPPED_A0GI, signer);
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

const WA0GI_AGENCY_OWNER = "0x2d7f2d2286994477ba878f321b17a7e40e52cda4";
const WA0GI_AGENCY_IMPLEMENTATION = "0xcc46de259693c7ca0a776903381fd9b30f797368";
const WA0GI_AGENCY_BEACON = "0x357f0f6bff45b51bd84121aab517c63c3c9d003a";
const WA0GI_AGENCY_PROXY = "0xe1a5162f99e075f8c6681ae28191ab3ac250b468";

task("wa0gi:agencyraw", "get raw transaction")
    .addParam("key", "private key", undefined, types.string, false)
    .setAction(async (taskArgs: { key: string; owner: string }, hre) => {
        // implementation
        console.log(
            `implementation raw tx: ${await getRawDeployment(
                hre,
                CONTRACTS.WrappedA0GIBaseAgency.name,
                taskArgs.key,
                [],
                0
            )}`
        );
        // beacon
        console.log(
            `beacon raw tx: ${await getRawDeployment(
                hre,
                UPGRADEABLE_BEACON,
                taskArgs.key,
                [WA0GI_AGENCY_IMPLEMENTATION, WA0GI_AGENCY_OWNER],
                1
            )}`
        );
        // proxy
        console.log(
            `proxy raw tx: ${await getRawDeployment(hre, BEACON_PROXY, taskArgs.key, [WA0GI_AGENCY_BEACON, "0x"], 2)}`
        );
    });

task("wa0gi:agencyinitialize", "check wa0gi agency status").setAction(async (_taskArgs, hre) => {
    const signer = await hre.ethers.getSigner((await hre.getNamedAccounts()).deployer);
    const agency: WrappedA0GIBaseAgency = await hre.ethers.getContractAt(
        "WrappedA0GIBaseAgency",
        WA0GI_AGENCY_PROXY,
        signer
    );
    await (await agency.initialize()).wait();
});

task("wa0gi:agencycheck", "check wa0gi agency status").setAction(async (_taskArgs, hre) => {
    const beacon: UpgradeableBeacon = await hre.ethers.getContractAt(UPGRADEABLE_BEACON, WA0GI_AGENCY_BEACON);
    console.log(`beacon owner: ${await beacon.owner()}`);
    console.log(`beacon implementation: ${await beacon.implementation()} / ${WA0GI_AGENCY_IMPLEMENTATION}`);
    const agency: WrappedA0GIBaseAgency = await hre.ethers.getContractAt("WrappedA0GIBaseAgency", WA0GI_AGENCY_PROXY);
    console.log(`agency owner: ${await agency.owner()}`);
});

task("wa0gi:setmintercap", "set minter cap")
    .addParam("account", "account", undefined, types.string, false)
    .addParam("cap", "cap", undefined, types.string, false)
    .addParam("initialsupply", "initialsupply", undefined, types.string, false)
    .setAction(async (taskArgs: { account: string; cap: string; initialsupply: string }, hre) => {
        const signer = await hre.ethers.getSigner((await hre.getNamedAccounts()).deployer);
        const agency: WrappedA0GIBaseAgency = await hre.ethers.getContractAt(
            "WrappedA0GIBaseAgency",
            WA0GI_AGENCY_PROXY,
            signer
        );
        const receipt = await (
            await agency.setMinterCap(taskArgs.account, parseEther(taskArgs.cap), parseEther(taskArgs.initialsupply))
        ).wait();
        console.log(receipt);
    });
