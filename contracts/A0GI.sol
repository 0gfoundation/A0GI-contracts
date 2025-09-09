// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.0;

import {ERC20PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import {AccessControlEnumerableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/extensions/AccessControlEnumerableUpgradeable.sol";
import "./interfaces/IA0GI.sol";

contract A0GI is IA0GI, ERC20PausableUpgradeable, AccessControlEnumerableUpgradeable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /// @custom:storage-location erc7201:0g.storage.A0GI
    struct A0GIStorage {
        mapping(address => Supply) minterSupply;
        address CCIPAdmin;
    }

    // keccak256(abi.encode(uint(keccak256("0g.storage.A0GI")) - 1)) & ~bytes32(uint(0xff))
    bytes32 private constant A0GIStorageLocation = 0x85564ca65afe3149da79fa8a284634414820c29801f5b1f6e8c38565f0c97100;

    function _getA0GIStorage() private pure returns (A0GIStorage storage $) {
        assembly {
            $.slot := A0GIStorageLocation
        }
    }

    function initialize(string memory _name, string memory _symbol) external initializer {
        _A0GI_init(_name, _symbol);
    }

    function _A0GI_init(string memory _name, string memory _symbol) internal {
        __ERC20Pausable_init();
        __ERC20_init(_name, _symbol);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);

        A0GIStorage storage $ = _getA0GIStorage();
        $.CCIPAdmin = msg.sender;
    }

    function getCCIPAdmin() external view virtual returns (address) {
        A0GIStorage storage $ = _getA0GIStorage();
        return $.CCIPAdmin;
    }

    /**
     * @dev Creates `amount` new tokens for `to`.
     *
     * See {ERC20-_mint}.
     *
     * Requirements:
     *
     * - the caller must have the `MINTER_ROLE`.
     */
    function mint(address to, uint amount) external onlyRole(MINTER_ROLE) {
        A0GIStorage storage $ = _getA0GIStorage();
        Supply storage s = $.minterSupply[msg.sender];
        s.supply += amount;
        require(s.supply <= s.cap, "A0GI: minter cap exceeded");
        _mint(to, amount);
        _afterMint(to, amount);
    }

    function _afterMint(address to, uint amount) internal virtual {}

    function minterSupply(address minter) external view returns (Supply memory) {
        A0GIStorage storage $ = _getA0GIStorage();
        return $.minterSupply[minter];
    }

    function setMinterCap(address minter, uint cap, uint initialSupply) external onlyRole(DEFAULT_ADMIN_ROLE) {
        A0GIStorage storage $ = _getA0GIStorage();

        Supply storage s = $.minterSupply[minter];
        s.cap = cap;
        if (initialSupply > s.initialSupply) {
            s.supply += initialSupply - s.initialSupply;
        } else {
            uint difference = s.initialSupply - initialSupply;
            if (difference > s.supply) {
                s.supply = 0;
            } else {
                s.supply -= difference;
            }
        }
        s.initialSupply = initialSupply;
        emit MinterCapUpdated(minter, cap, initialSupply);
    }

    function _burnFrom(address account, uint amount) internal {
        A0GIStorage storage $ = _getA0GIStorage();
        Supply storage s = $.minterSupply[_msgSender()];
        require(s.supply >= amount, "A0GI: burn amount exceeds minter total supply");
        unchecked {
            s.supply -= amount;
        }
        if (account != _msgSender()) {
            _spendAllowance(account, _msgSender(), amount);
        }
        _beforeBurn(account, amount);
        _burn(account, amount);
    }

    function _beforeBurn(address to, uint amount) internal virtual {}

    /**
     * @notice burn from another account and refund minter's supply
     * @param account account to burn
     * @param amount amount to burn
     */
    function burnFrom(address account, uint amount) external onlyRole(MINTER_ROLE) {
        _burnFrom(account, amount);
    }

    /**
     * @notice alternative burn function for minter contract integration
     */
    function burn(uint amount) public onlyRole(MINTER_ROLE) {
        _burnFrom(_msgSender(), amount);
    }

    /**
     * @notice alternative burn function for minter contract integration
     */
    function burn(address account, uint amount) external onlyRole(MINTER_ROLE) {
        _burnFrom(account, amount);
    }

    /**
     * @dev Pauses all token transfers.
     *
     * See {ERC20Pausable} and {Pausable-_pause}.
     *
     * Requirements:
     *
     * - the caller must have the `PAUSER_ROLE`.
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpauses all token transfers.
     *
     * See {ERC20Pausable} and {Pausable-_unpause}.
     *
     * Requirements:
     *
     * - the caller must have the `PAUSER_ROLE`.
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
}
