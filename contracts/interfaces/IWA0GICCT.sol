// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.0;

import {IA0GI} from "./IA0GI.sol";

interface IWA0GICCT is IA0GI {
    event Deposit(address indexed dst, uint wad);
    event Withdrawal(address indexed src, uint wad);

    function getCCIPAdmin() external view returns (address);

    function deposit(uint amount) external;

    function withdraw(uint amount) external;
}
