import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CONTRACTS, deployInBeaconProxy, getTypedContract } from "../utils/utils";

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    await deployInBeaconProxy(hre, CONTRACTS.WA0GICCT, []);

    const wa0gicct = await getTypedContract(hre, CONTRACTS.WA0GICCT);
    await (
        await wa0gicct["initialize(string,string,address)"](
            "Wrapped 0G CCT",
            "W0GCCT",
            "0x1cd0690ff9a693f5ef2dd976660a8dafc81a109c"
        )
    ).wait();
};

deploy.tags = [CONTRACTS.WA0GICCT.name, "prod"];
deploy.dependencies = [];
export default deploy;
