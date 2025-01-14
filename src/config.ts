export interface NetworkConfigs {}

export const DefaultConfig: NetworkConfigs = {};

export const GlobalConfig: { [key: string]: NetworkConfigs } = {};

export function getConfig(network: string) {
    if (network in GlobalConfig) return GlobalConfig[network];
    if (network === "hardhat") {
        return DefaultConfig;
    }
    throw new Error(`network ${network} non-exist`);
}
