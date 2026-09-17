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
    transact,
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

/**
 * Hands both W0G agency ownership slots to a multisig:
 *
 *   - the beacon owner, which is the upgrade key for the agency implementation
 *   - the proxy owner, which is the only account that can call setMinterCap
 *
 * The addresses are fixed rather than read from deployment records: the agency was deployed from
 * pre-signed chainId-less raw transactions, so it has no hardhat-deploy artifacts, lands at the
 * same address on every 0G chain, and the proxy address is compiled into the execution layer as
 * the only caller the 0x1002 precompile accepts for setMinterCap. The proxy must therefore never
 * be redeployed - only its owner moves.
 *
 * Because those addresses are identical on every 0G chain, --expect-chain-id is required and
 * checked against the connected endpoint: not every network entry pins a chain id, so without it
 * a misdirected RPC would irreversibly transfer the agency on the wrong chain.
 *
 * Ownable transfer is a single irreversible step with no acceptance handshake, hence the
 * pre-flight checks and the default `--execute false` dry run, which prints the calldata for a
 * multisig to execute instead of sending anything. The dry run deliberately resolves no signer,
 * so producing that calldata does not require the owner's key to be present at all.
 */
task("wa0gi:agencytransfer", "transfer W0G agency ownership (beacon + proxy) to a multisig")
    .addParam("to", "new owner, normally a multisig", undefined, types.string, false)
    .addParam("expectChainId", "chain id this transfer is intended for", undefined, types.int, false)
    .addParam("execute", "settle transactions on chain", false, types.boolean, true)
    .addParam("allowEoa", "permit a new owner that has no contract code", false, types.boolean, true)
    .setAction(async (taskArgs: { to: string; expectChainId: number; execute: boolean; allowEoa: boolean }, hre) => {
        const newOwner = ethers.getAddress(taskArgs.to);
        if (newOwner === ethers.ZeroAddress) {
            throw new Error("new owner is the zero address");
        }

        const chainId = (await hre.ethers.provider.getNetwork()).chainId;
        if (chainId !== BigInt(taskArgs.expectChainId)) {
            throw new Error(`connected to chain id ${chainId}, expected ${taskArgs.expectChainId}`);
        }

        if (!taskArgs.allowEoa && (await hre.ethers.provider.getCode(newOwner)) === "0x") {
            throw new Error(
                `${newOwner} has no contract code on this chain; a multisig would. Pass --allow-eoa true to override.`
            );
        }

        // Read-only handles: no signer, so a dry run works without the owner's key on the machine.
        const beacon: UpgradeableBeacon = await hre.ethers.getContractAt(UPGRADEABLE_BEACON, WA0GI_AGENCY_BEACON);
        const agency: WrappedA0GIBaseAgency = await hre.ethers.getContractAt(
            "WrappedA0GIBaseAgency",
            WA0GI_AGENCY_PROXY
        );

        const implementation = await beacon.implementation();
        console.log(`chain id: ${chainId}`);
        console.log(`new owner: ${newOwner}`);
        console.log(`beacon implementation: ${implementation}`);
        if (implementation.toLowerCase() !== WA0GI_AGENCY_IMPLEMENTATION) {
            console.log(`  warning: differs from the recorded implementation ${WA0GI_AGENCY_IMPLEMENTATION}`);
        }

        const signer = taskArgs.execute ? await hre.ethers.getSigner((await hre.getNamedAccounts()).deployer) : null;
        if (signer) {
            console.log(`signer: ${signer.address}`);
        }

        // The beacon is transferred first on purpose. It is the stronger key - its owner can swap
        // the implementation and reach setMinterCap regardless of the proxy owner - so if the run
        // stops in between, the multisig already holds effective control rather than the reverse.
        for (const slot of [
            { label: "beacon", address: WA0GI_AGENCY_BEACON, owner: await beacon.owner() },
            { label: "agency proxy", address: WA0GI_AGENCY_PROXY, owner: await agency.owner() },
        ]) {
            console.log(`${slot.label} owner: ${slot.owner}`);
            if (slot.owner.toLowerCase() !== WA0GI_AGENCY_OWNER) {
                console.log(`  warning: differs from the recorded owner ${WA0GI_AGENCY_OWNER}`);
            }
            if (slot.owner === newOwner) {
                console.log("  already transferred, skipping");
                continue;
            }
            if (signer) {
                if (slot.owner !== signer.address) {
                    throw new Error(`${slot.label} is owned by ${slot.owner}, not by the signer ${signer.address}`);
                }
                const contract = slot.label === "beacon" ? beacon.connect(signer) : agency.connect(signer);
                await transact(contract, "transferOwnership", [newOwner], true);
            } else {
                console.log(`  calldata below must be executed from ${slot.owner}`);
                await transact(slot.label === "beacon" ? beacon : agency, "transferOwnership", [newOwner], false);
            }
        }

        if (taskArgs.execute) {
            console.log(`beacon owner is now: ${await beacon.owner()}`);
            console.log(`agency proxy owner is now: ${await agency.owner()}`);
        }
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
        await (
            await agency.setMinterCap(taskArgs.account, parseEther(taskArgs.cap), parseEther(taskArgs.initialsupply))
        ).wait();
    });
