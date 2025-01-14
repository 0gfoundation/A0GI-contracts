import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CONTRACTS, deployInBeaconProxy } from "../utils/utils";

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    await deployInBeaconProxy(hre, CONTRACTS.A0GI, [], false);
};

deploy.tags = [CONTRACTS.A0GI.name, "prod"];
deploy.dependencies = [];
export default deploy;
