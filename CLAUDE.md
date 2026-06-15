# A0GI-contracts (WrappedA0GI)

W0G (Wrapped 0G) token contracts. Hardhat + hardhat-deploy project.
Upstream repo: `0glabs/WrappedA0GI` (local checkout on branch `main`).

Branch semantics: `main` is the production source — `WrappedA0GIBaseAgency.initialize()` hardcodes the mainnet governance owner `0x2D7F2d2286994477Ba878f321b17A7e40E52cDa4`; `chain-test` swaps that for the devnet test owner `0x20f33CE90A13a4b5E7697E3544c3083B8F8A51D4` (known key, used by integration tests). Since the owner is baked into init code, the two branches produce different agency-impl deploy bytecode and therefore different signed raw txs (see below).

## Contracts (`contracts/`)

| Contract | Type | Purpose |
|----------|------|---------|
| `WrappedA0GI.sol` | non-upgradeable | **W0G** — WETH9 variant. `deposit`/`withdraw` wrap native 0G; extra `mint`/`burn` backed by the WrappedA0GIBase stateful precompile at `0x...1002`. Deployed at the deterministic address `0x1Cd0690fF9a693f5EF2dD976660a8dAFc81A109c` (hardcoded in tasks). |
| `WrappedA0GIBaseAgency.sol` | beacon proxy | Ownable admin shim: forwards `setMinterCap(minter, cap, initialSupply)` to the `0x1002` precompile (the precompile recognizes the agency proxy as its admin). |

`contracts/interfaces/` — `IWrappedA0GI`, `IWrappedA0GIBase` (precompile interface).
`contracts/proxy/` — vendored OpenZeppelin `BeaconProxy` / `UpgradeableBeacon` (vendored so raw-tx deployment bytecode is pinned).

## Layout

- `src/deploy/` — hardhat-deploy scripts: `deploy_wa0gi.ts` (direct deploy, tag `test`)
- `src/tasks/` — hardhat tasks: `wa0gi.ts` (mint/burn/deposit, raw-tx generation, agency admin), `upgrade.ts` (beacon `upgradeTo` + OZ storage-layout validation), `access.ts` (transfer beacon ownership to timelock)
- `src/utils/utils.ts` — `CONTRACTS` registry (typechain factories), `deployDirectly` / `deployInBeaconProxy`, `getRawDeployment` (signs pre-EIP-155 raw deploy txs)
- `deployments/` — hardhat-deploy records (gitignored, generated per network)
- `run.sh` — local smoke flow: starts a node via `../0g-precompiles/run.sh`, then exercises agency initialize / setMinterCap / mint / burn against the `0x1002` precompile
- `abis/`, `typechain-types/`, `build/` — generated artifacts

## Build / test

```bash
yarn build         # hardhat compile
yarn test          # hardhat test
yarn fmt:sol       # prettier contracts
yarn fmt:ts        # prettier src/test
```

Solidity 0.8.20, evmVersion `istanbul`, optimizer 200 runs.
Networks (`hardhat.config.ts`): `local` (`RPC_URL`, default `127.0.0.1:8545`), `zg` (`evmrpc-testnet.0g.ai`), `sepolia`. Deployer key via `DEPLOYER_KEY` env (dotenv).

## W0G deployment model (raw, pre-EIP-155 txs)

W0G and its precompile admin are deployed with hand-signed **type-0 raw txs with `chainId = 0`** (no replay protection), so the same signed tx can be replayed on any 0G chain and—given a fresh one-time deployer key—yields the same contract address everywhere. Fixed `gasPrice = 100 gwei`, `gasLimit = 1,000,000`; the deployer address must be pre-funded.

Four raw txs total, from two task commands:

1. `wa0gi:raw --key <pk>` — **1 tx** (nonce 0): deploy `WrappedA0GI` → `0x1Cd0690fF9a693f5EF2dD976660a8dAFc81A109c`
2. `wa0gi:agencyraw --key <pk>` — **3 txs** (separate deployer key, nonces 0/1/2):
   - nonce 0: `WrappedA0GIBaseAgency` implementation → `0xcc46de259693c7ca0a776903381fd9b30f797368`
   - nonce 1: `UpgradeableBeacon(impl, owner)` → `0x357f0f6bff45b51bd84121aab517c63c3c9d003a`
   - nonce 2: `BeaconProxy(beacon, "")` → `0xe1a5162f99e075f8c6681ae28191ab3ac250b468`

Raw txs are submitted manually via `eth_sendRawTransaction` (curl). Follow-up calls (`wa0gi:agencyinitialize`, `wa0gi:setmintercap`) are normal signed txs, not raw. The agency owner is hardcoded to `0x20f33CE90A13a4b5E7697E3544c3083B8F8A51D4` in `WrappedA0GIBaseAgency.initialize()`.

The tasks only print the signed txs; the canonical pre-signed copies live in the chain repos as ready-to-curl scripts: `tests/resources/wa0gi_precompile_raw.sh` (identical copies in `0g-chain-v2`, `0g-chain-ng`, and the satellite checkouts; `da_precompile_raw.sh` is the DASigners analog). Consumers: each repo's `tests/wrapped_0g_precompile_test.py` and the workspace `integration-tests/scripts/deploy-w0g.sh`, which funds the two ephemeral deployers (`0x873c...c0b6` for W0G, `0x3504...1c5b` for the agency) and broadcasts all four in nonce order.

Version note: the chain-repo copies are the **devnet (chain-test) version** — the agency-impl tx bakes the test owner `0x20f33CE9...` into init code. Both versions live in `0g-precompiles/` (the canonical home): `run.sh` is the **mainnet set** (W0G 4 txs + DA registry 3 txs, owner `0x2D7F...cDa4`), `run_test_wa0gi.sh` is the devnet W0G set (byte-identical to the chain-repo copies), `run_da.sh` the devnet DA set. Only the impl tx differs between versions — the W0G tx, beacon tx (owner constructor arg is `0x2D7F...` in both), and proxy tx are byte-identical, and addresses match everywhere since they depend only on deployer + nonce. The bridge contracts follow the same two-profile scheme: `0g-restaking-contracts/deployments/bridge-raw-{devnet,prod}-0.json`, generated by `script/deploy/BridgeRawTxs.s.sol` (`BRIDGE_OWNER`/`BRIDGE_RAW_PROFILE` env), broadcast by `integration-tests/scripts/deploy-bridge-raw.sh <RPC> [profile]`.

## Cross-repo links

- The `0x1002` **WrappedA0GIBase** stateful precompile is implemented in `0g-geth` (Go) and `revm` (Rust); see workspace `docs/evm-customizations.md`.
- The agency proxy address must match the admin expected by the precompile implementation on the chain side.
