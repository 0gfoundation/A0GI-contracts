// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.0;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract WrappedA0GIBaseAgency is OwnableUpgradeable {
    address public constant WRAPPED_A0GI_BASE = 0x0000000000000000000000000000000000001002;

    /*
    /// @custom:storage-location erc7201:0g.storage.WrappedA0GIBaseAgency
    struct WrappedA0GIBaseAgencyStorage {
    }

    // keccak256(abi.encode(uint(keccak256("0g.storage.WrappedA0GIBaseAgency")) - 1)) & ~bytes32(uint(0xff))
    bytes32 private constant WrappedA0GIBaseAgencyStorageLocation = 0xc13b49f2ecee15f82cab0106bcdbecd1e90aed6f5b0f1320d5fb5c1c4ab97d00;

    function _getWrappedA0GIBaseAgencyStorage() private pure returns (WrappedA0GIBaseAgencyStorage storage $) {
        assembly {
            $.slot := WrappedA0GIBaseAgencyStorageLocation
        }
    }
    */

    /// @dev Locks the implementation so its `initialize()` cannot be called directly.
    /// This contract is only ever used behind an UpgradeableBeacon/BeaconProxy (it is not
    /// UUPS and contains no selfdestruct/delegatecall), so initializing the bare
    /// implementation is already harmless — `initialize()` hard-codes the owner, so an
    /// attacker gains nothing, and the precompile only recognizes the proxy address. Added
    /// for consistency with OpenZeppelin's standard recommendation to disable initializers
    /// on every upgradeable implementation. Note: this changes the implementation bytecode,
    /// so the deterministic raw deploy tx for the impl must be regenerated on next deploy.
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() external initializer {
        __Ownable_init(0x20f33CE90A13a4b5E7697E3544c3083B8F8A51D4);
    }

    /// @dev Forwards to the 0x1002 stateful precompile via a low-level `.call()` for the
    /// same reason as WrappedA0GI.mint/burn: the precompile is implemented in the execution
    /// layer and has no EVM bytecode, so a high-level call would revert on the inserted
    /// extcodesize check. Authority is doubly gated — `onlyOwner` here, and the precompile
    /// itself only accepts setMinterCap from the registered agency proxy address. The same
    /// deployment invariant applies: this is only sound on a chain that provides the precompile.
    function setMinterCap(address minter, uint256 cap, uint256 initialSupply) external onlyOwner {
        (bool success, ) = address(WRAPPED_A0GI_BASE).call(
            abi.encodeWithSignature("setMinterCap(address,uint256,uint256)", minter, cap, initialSupply)
        );
        require(success, "wrapped a0gi base setMinterCap failed");
    }
}
