import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CONTRACTS, deployDirectly } from "../utils/utils";

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    await deployDirectly(hre, CONTRACTS.WA0GI);
};

deploy.tags = [CONTRACTS.WA0GI.name, "test"];
deploy.dependencies = [];
export default deploy;
