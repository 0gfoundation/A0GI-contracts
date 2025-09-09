import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CONTRACTS, deployInBeaconProxy, getTypedContract } from "../utils/utils";

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    await deployInBeaconProxy(hre, CONTRACTS.A0GI, []);

    const a0gi = await getTypedContract(hre, CONTRACTS.A0GI);
    await (await a0gi.initialize("Zero Gravity", "0G")).wait();
};

deploy.tags = [CONTRACTS.A0GI.name, "prod"];
deploy.dependencies = [];
export default deploy;
