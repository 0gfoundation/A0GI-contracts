// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.0;

interface IA0GI {
    struct Supply {
        uint cap; // Maximum tokens the minter can mint
        uint initialSupply; // Initial supply
        uint supply; // Total minted tokens by the minter
    }

    /**
     * @dev Emitted when a minter's cap is updated.
     * @param minter The address of the minter
     * @param cap The new cap for the minter
     * @param initialSupply The new initial supply for the minter
     */
    event MinterCapUpdated(address indexed minter, uint cap, uint initialSupply);

    /**
     * @notice Mint new tokens.
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint
     */
    function mint(address to, uint amount) external;

    /**
     * @notice Get the minting supply information for a minter.
     * @param minter The address of the minter
     * @return A `Supply` struct containing the total minted and the cap
     */
    function minterSupply(address minter) external view returns (Supply memory);

    /**
     * @notice Set the maximum minting cap for a minter.
     * @param minter The address of the minter
     * @param cap The new cap for the minter
     * @param initialSupply The new initial supply for the minter
     */
    function setMinterCap(address minter, uint cap, uint initialSupply) external;

    /**
     * @notice Burn tokens from the sender's account.
     * @param amount The amount of tokens to burn
     */
    function burn(uint amount) external;

    /**
     * @notice Burn tokens from another account.
     * @param account The account to burn tokens from
     * @param amount The amount of tokens to burn
     */
    function burn(address account, uint amount) external;

    /**
     * @notice Burn tokens from another account and refund the minter's supply.
     * @param account The account to burn tokens from
     * @param amount The amount of tokens to burn
     */
    function burnFrom(address account, uint amount) external;

    /**
     * @dev Pauses all token transfers.
     * Requires the caller to have the `PAUSER_ROLE`.
     */
    function pause() external;

    /**
     * @dev Unpauses all token transfers.
     * Requires the caller to have the `PAUSER_ROLE`.
     */
    function unpause() external;
}
