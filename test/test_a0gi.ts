import { expect } from "chai";
import { Signer } from "ethers";
import hre, { deployments } from "hardhat";
import { CONTRACTS, getTypedContract, MINTER_ROLE } from "../src/utils/utils";
import { A0GI } from "../typechain-types";

describe("pool", () => {
    let deployer: Signer;
    let minter: Signer;
    let a0gi: A0GI;

    before(async () => {
        [deployer, minter] = await hre.ethers.getSigners();
        await deployments.fixture([CONTRACTS.A0GI.name]);
        a0gi = await getTypedContract(hre, CONTRACTS.A0GI, deployer);
        await a0gi.initialize("A0GI", "A0GI");

        await a0gi.grantRole(MINTER_ROLE, await minter.getAddress());
        await a0gi.grantRole(MINTER_ROLE, await deployer.getAddress());
        await a0gi.setMinterCap(await deployer.getAddress(), hre.ethers.parseEther("10"), hre.ethers.parseEther("5"));
    });

    it("set minter cap #1", async () => {
        await a0gi.setMinterCap(await minter.getAddress(), hre.ethers.parseEther("10"), hre.ethers.parseEther("6"));
        let supply = await a0gi.minterSupply(await minter.getAddress());
        expect(supply.cap).to.deep.eq(hre.ethers.parseEther("10"));
        expect(supply.initialSupply).to.deep.eq(hre.ethers.parseEther("6"));
        expect(supply.supply).to.deep.eq(hre.ethers.parseEther("6"));

        await a0gi.setMinterCap(await minter.getAddress(), hre.ethers.parseEther("10"), hre.ethers.parseEther("5"));
        supply = await a0gi.minterSupply(await minter.getAddress());
        expect(supply.cap).to.deep.eq(hre.ethers.parseEther("10"));
        expect(supply.initialSupply).to.deep.eq(hre.ethers.parseEther("5"));
        expect(supply.supply).to.deep.eq(hre.ethers.parseEther("5"));
    });

    it("deployer mint to minter", async () => {
        await a0gi.connect(deployer).mint(await minter.getAddress(), hre.ethers.parseEther("1"));
        const supply = await a0gi.minterSupply(await deployer.getAddress());
        expect(supply.cap).to.deep.eq(hre.ethers.parseEther("10"));
        expect(supply.initialSupply).to.deep.eq(hre.ethers.parseEther("5"));
        expect(supply.supply).to.deep.eq(hre.ethers.parseEther("6"));
        expect(await a0gi.balanceOf(await minter.getAddress())).to.deep.eq(hre.ethers.parseEther("1"));
        expect(await a0gi.totalSupply()).to.deep.eq(hre.ethers.parseEther("1"));
    });

    it("minter burn", async () => {
        await a0gi.connect(minter)["burn(address,uint256)"](await minter.getAddress(), hre.ethers.parseEther("1"));
        const supply = await a0gi.minterSupply(await minter.getAddress());
        expect(supply.cap).to.deep.eq(hre.ethers.parseEther("10"));
        expect(supply.initialSupply).to.deep.eq(hre.ethers.parseEther("5"));
        expect(supply.supply).to.deep.eq(hre.ethers.parseEther("4"));
        expect(await a0gi.balanceOf(await minter.getAddress())).to.deep.eq(hre.ethers.parseEther("0"));
        expect(await a0gi.totalSupply()).to.deep.eq(hre.ethers.parseEther("0"));
    });

    it("set minter cap #2", async () => {
        await a0gi
            .connect(deployer)
            .setMinterCap(await deployer.getAddress(), hre.ethers.parseEther("20"), hre.ethers.parseEther("10"));
        const supply = await a0gi.minterSupply(await deployer.getAddress());
        expect(supply.cap).to.deep.eq(hre.ethers.parseEther("20"));
        expect(supply.initialSupply).to.deep.eq(hre.ethers.parseEther("10"));
        expect(supply.supply).to.deep.eq(hre.ethers.parseEther("11"));
    });

    it("set minter cap #3", async () => {
        await a0gi
            .connect(deployer)
            .setMinterCap(await minter.getAddress(), hre.ethers.parseEther("20"), hre.ethers.parseEther("10"));
        const supply = await a0gi.minterSupply(await minter.getAddress());
        expect(supply.cap).to.deep.eq(hre.ethers.parseEther("20"));
        expect(supply.initialSupply).to.deep.eq(hre.ethers.parseEther("10"));
        expect(supply.supply).to.deep.eq(hre.ethers.parseEther("9"));
    });

    it("set minter cap #4", async () => {
        await a0gi
            .connect(deployer)
            .setMinterCap(await minter.getAddress(), hre.ethers.parseEther("20"), hre.ethers.parseEther("0.5"));
        const supply = await a0gi.minterSupply(await minter.getAddress());
        expect(supply.cap).to.deep.eq(hre.ethers.parseEther("20"));
        expect(supply.initialSupply).to.deep.eq(hre.ethers.parseEther("0.5"));
        expect(supply.supply).to.deep.eq(hre.ethers.parseEther("0"));
    });
});
