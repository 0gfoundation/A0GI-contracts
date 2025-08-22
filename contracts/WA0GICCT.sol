// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.0;

import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {A0GI} from "./A0GI.sol";
import {IWA0GICCT} from "./interfaces/IWA0GICCT.sol";
import {IWrappedA0GI} from "./interfaces/IWrappedA0GI.sol";

contract WA0GICCT is IWA0GICCT, A0GI {
    using SafeERC20 for IERC20;

    /// @custom:storage-location erc7201:0g.storage.A0GICCT
    struct A0GICCTStorage {
        address CCIPAdmin;
        address WA0GI;
    }

    // keccak256(abi.encode(uint(keccak256("0g.storage.A0GICCT")) - 1)) & ~bytes32(uint(0xff))
    bytes32 private constant A0GICCTStorageLocation =
        0x9b80c77b62413a30282254ac843564eab308193b2ea61fae5b76c3176f2f4700;

    function _getA0GICCTStorage() private pure returns (A0GICCTStorage storage $) {
        assembly {
            $.slot := A0GICCTStorageLocation
        }
    }

    function initialize(string memory _name, string memory _symbol, address WA0GI) external initializer {
        _A0GI_init(_name, _symbol);

        A0GICCTStorage storage $ = _getA0GICCTStorage();
        $.CCIPAdmin = msg.sender;
        $.WA0GI = WA0GI;
    }

    function setCCIPAdmin(address CCIPAdmin) external onlyRole(DEFAULT_ADMIN_ROLE) {
        A0GICCTStorage storage $ = _getA0GICCTStorage();
        $.CCIPAdmin = CCIPAdmin;
    }

    /*=== CCIP standard ===*/

    function getCCIPAdmin() external view override returns (address) {
        A0GICCTStorage storage $ = _getA0GICCTStorage();
        return $.CCIPAdmin;
    }

    /*=== mint&burn hooks ===*/

    function _afterMint(address, uint256 value) internal override {
        // wa0gi delegation
        A0GICCTStorage storage $ = _getA0GICCTStorage();
        IWrappedA0GI($.WA0GI).mint(address(this), value);
    }

    function _beforeBurn(address, uint256 value) internal override {
        // wa0gi delegation
        A0GICCTStorage storage $ = _getA0GICCTStorage();
        IWrappedA0GI($.WA0GI).burn(value);
    }

    /*=== WA0GI deposit/withdraw ===*/

    function deposit(uint amount) external override {
        A0GICCTStorage storage $ = _getA0GICCTStorage();
        IERC20($.WA0GI).safeTransferFrom(msg.sender, address(this), amount);
        _update(address(0), msg.sender, amount);
        emit Deposit(msg.sender, amount);
    }

    function withdraw(uint amount) external override {
        _update(msg.sender, address(0), amount);

        A0GICCTStorage storage $ = _getA0GICCTStorage();
        IERC20($.WA0GI).safeTransfer(msg.sender, amount);
        emit Withdrawal(msg.sender, amount);
    }
}
