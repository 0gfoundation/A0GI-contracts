// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.0;

import "./interfaces/IWrappedA0GI.sol";

/**
 * @title Wrapped A0GI
 * @notice WrappedA0GI is a variant of WETH9, with mint and burn functionality implemented via precompile.
 */
contract WrappedA0GI is IWrappedA0GI {
    string public name = "Wrapped 0G";
    string public symbol = "W0G";
    uint8 public decimals = 18;
    address public WRAPPED_A0GI_BASE = 0x0000000000000000000000000000000000001002;

    mapping(address => uint) public balanceOf;
    mapping(address => mapping(address => uint)) public allowance;

    receive() external payable {
        deposit();
    }

    function deposit() public payable {
        balanceOf[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    function withdraw(uint wad) public {
        balanceOf[msg.sender] -= wad;
        payable(msg.sender).transfer(wad);
        emit Withdrawal(msg.sender, wad);
    }

    function totalSupply() public view returns (uint) {
        return address(this).balance;
    }

    function approve(address guy, uint wad) public returns (bool) {
        allowance[msg.sender][guy] = wad;
        emit Approval(msg.sender, guy, wad);
        return true;
    }

    function transfer(address dst, uint wad) public returns (bool) {
        return transferFrom(msg.sender, dst, wad);
    }

    function transferFrom(address src, address dst, uint wad) public returns (bool) {
        require(balanceOf[src] >= wad, "src insufficient balance");

        if (src != msg.sender && allowance[src][msg.sender] != type(uint).max) {
            require(allowance[src][msg.sender] >= wad, "insufficient allowance");
            allowance[src][msg.sender] -= wad;
        }

        balanceOf[src] -= wad;
        balanceOf[dst] += wad;

        emit Transfer(src, dst, wad);

        return true;
    }

    /**
     * @notice mint wad a0gi to this contract and mint corresponding WA0GI to recipient.
     * @param recipient recipient address
     * @param wad amount to mint
     */
    function mint(address recipient, uint wad) external {
        (bool success, ) = address(WRAPPED_A0GI_BASE).call(
            abi.encodeWithSignature("mint(address,uint256)", msg.sender, wad)
        );
        require(success, "wrapped a0gi base mint failed");
        balanceOf[recipient] += wad;
        emit Mint(msg.sender, recipient, wad);
    }

    function _burnFrom(address src, uint wad) internal {
        (bool success, ) = address(WRAPPED_A0GI_BASE).call(
            abi.encodeWithSignature("burn(address,uint256)", msg.sender, wad)
        );
        require(success, "wrapped a0gi base burn failed");
        if (src != msg.sender && allowance[src][msg.sender] != type(uint).max) {
            require(allowance[src][msg.sender] >= wad, "insufficient allowance");
            allowance[src][msg.sender] -= wad;
        }
        balanceOf[src] -= wad;
        emit Burn(msg.sender, src, wad);
    }

    /**
     * @notice burn wad a0gi in this contract and burn corresponding WA0GI from sender.
     * @param wad amount to burn
     */
    function burn(uint wad) external {
        _burnFrom(msg.sender, wad);
    }

    /**
     * @notice alternative burn function for minter contract integration
     */
    function burn(address src, uint wad) external {
        _burnFrom(src, wad);
    }

    /**
     * @notice alternative burn function for minter contract integration
     */
    function burnFrom(address src, uint wad) external {
        _burnFrom(src, wad);
    }
}
