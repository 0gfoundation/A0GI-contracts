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
    /// @dev Address of the WrappedA0GIBase stateful precompile. This is NOT a regular
    /// contract: it is implemented in the 0G execution layer (Go in 0g-geth, Rust in
    /// revm), so from the EVM's perspective the address has ZERO bytecode
    /// (extcodesize == 0). Every interaction below therefore uses a low-level `.call()`
    /// on purpose — Solidity's high-level/interface calls insert an `extcodesize > 0`
    /// check and would revert against a code-less precompile. There is intentionally no
    /// setter, so the value is effectively fixed after deployment. (Kept as a storage
    /// variable rather than `constant` to preserve the deployed bytecode of the live,
    /// non-upgradeable W0G contract.)
    /// SAFETY: this contract is only sound on a chain whose execution layer provides
    /// this precompile — see the invariant documented on `mint` below.
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
     * @dev This function is permissionless at the Solidity layer by design; minting
     * authority is enforced entirely inside the 0x1002 precompile, which (1) requires the
     * calling contract to be the registered WrappedA0GI address and (2) checks that the
     * minter — `msg.sender`, forwarded as the first argument below — stays within its
     * configured minter cap. A caller with no cap reverts, so an arbitrary `mint()` call
     * cannot create tokens. The low-level `.call()` deliberately targets the code-less
     * precompile (see WRAPPED_A0GI_BASE).
     *
     * DEPLOYMENT INVARIANT: this safety holds only on a chain that actually implements the
     * precompile. A `CALL` to a code-less address returns success with empty returndata, so
     * on a chain WITHOUT the precompile `require(success)` would pass and tokens would be
     * minted unbacked. No in-contract guard can distinguish the real precompile from an
     * empty address (the precompile has no code and returns no data on success), so this is
     * enforced operationally: W0G is deployed solely on 0G chain via deterministic
     * pre-EIP-155 raw txs; other chains use the cross-chain bridge token instead. Never
     * deploy this contract on a chain where the 0x1002 precompile is absent.
     */
    function mint(address recipient, uint wad) external {
        (bool success, ) = address(WRAPPED_A0GI_BASE).call(
            abi.encodeWithSignature("mint(address,uint256)", msg.sender, wad)
        );
        require(success, "wrapped a0gi base mint failed");
        balanceOf[recipient] += wad;
        emit Mint(msg.sender, recipient, wad);
    }

    /// @dev As with `mint`, burn authority is enforced inside the 0x1002 precompile (the
    /// caller must be the registered WrappedA0GI address and have sufficient minted
    /// supply); the low-level `.call()` again targets the code-less precompile, and the
    /// same deployment invariant documented on `mint` applies.
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
