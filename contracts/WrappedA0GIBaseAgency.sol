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

    function initialize() external initializer {
        __Ownable_init(0x2D7F2d2286994477Ba878f321b17A7e40E52cDa4);
    }

    function setMinterCap(address minter, uint256 cap, uint256 initialSupply) external onlyOwner {
        (bool success, ) = address(WRAPPED_A0GI_BASE).call(
            abi.encodeWithSignature("setMinterCap(address,uint256,uint256)", minter, cap, initialSupply)
        );
        require(success, "wrapped a0gi base setMinterCap failed");
    }
}
