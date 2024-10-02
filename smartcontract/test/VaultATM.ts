import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";
import { parseEther } from "ethers";

describe("VaultATM", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployOneYearLockFixture() {
 
    const [owner, userWithdraw, userDeposit, userRecipient] = await hre.ethers.getSigners();

    const VaultATM = await hre.ethers.getContractFactory("VaultATM");
    const vaultATM = await VaultATM.deploy(owner.address);

    const MockToken = await hre.ethers.getContractFactory("MockToken");
    const mockToken = await MockToken.deploy();

    await vaultATM.connect(owner).setToken(mockToken.getAddress());

    return { vaultATM, mockToken, owner, userWithdraw, userDeposit, userRecipient };

  }
  describe("Deployment", function () {
    it("Should deploy the contract", async function () {
      const { vaultATM, mockToken, owner } = await loadFixture(deployOneYearLockFixture);
      expect(await vaultATM.owner()).to.equal(owner.address);
      //check MockToken deploy exist
      expect(await mockToken.getAddress()).to.properAddress;
      
    });

  });
  describe("Happy Path", function () {
    it("Should deposit successfully", async function () {
      const { vaultATM, mockToken, owner, userWithdraw, userDeposit } = await loadFixture(deployOneYearLockFixture);
      await mockToken.mint(userDeposit.address, parseEther((1 * 10**6).toString()));
      const vaultAddress = await vaultATM.getAddress();
      const userDepositBalance = await mockToken.balanceOf(userDeposit.address);

      const depositAmount = parseEther((500 * 10**3).toString());
      const playerId = 1;

      await mockToken.connect(userDeposit).approve(vaultAddress, depositAmount);
      await vaultATM.connect(userDeposit).deposit(depositAmount, playerId);
      expect(await mockToken.balanceOf(vaultAddress)).to.equal(depositAmount);
    });

    it("Should withdraw successfully", async function () {
      const { vaultATM, mockToken, owner, userWithdraw, userDeposit, userRecipient } = await loadFixture(deployOneYearLockFixture);



      //Grant withdrawer role to withDrawer
      let WITHDRAWER_ROLE = hre.ethers.keccak256(Buffer.from("WITHDRAWER_ROLE")).toString();
      await vaultATM.grantRole(WITHDRAWER_ROLE,userWithdraw.address);

      //setter vaultATM funds
      await vaultATM.connect(owner).setMaxWithdrawalAmount(parseEther((1 * 10**6).toString()));
      await vaultATM.connect(owner).setWithdrawalEnabled(true);
      await vaultATM.connect(owner).setWithdrawFees(0);
      
      // User deposits funds in vaultATM
      await mockToken.mint(userDeposit.address, parseEther((1 * 10**6).toString()));
      await mockToken.connect(userDeposit).approve(vaultATM.getAddress(), await mockToken.balanceOf(userDeposit.address));
      const playerId = 1;
      await vaultATM.connect(userDeposit).deposit(parseEther((500 * 10**3).toString()),playerId);

      // User withdraws funds from vaultATM
      await vaultATM.connect(userWithdraw).withdraw(parseEther((300 * 10**3).toString()),playerId,userRecipient.address);

      expect(await mockToken.balanceOf(vaultATM.getAddress())).to.equal(parseEther((200 * 10**3).toString()));
      expect(await mockToken.balanceOf(userRecipient.address)).to.equal(parseEther((300 * 10**3).toString()));

    });
  });
  describe("Unhappy Path", function () {
     //deposit
     it("Should not deposit, Insufficient allowance", async function () {
      const { vaultATM, mockToken, userDeposit } = await loadFixture(deployOneYearLockFixture);
      await mockToken.mint(userDeposit.address, parseEther((1 * 10**6).toString()));
      const vaultAddress = await vaultATM.getAddress();
      const userDepositBalance = await mockToken.balanceOf(userDeposit.address);
      const userDepositAllowance = parseEther((1.5 * 10**6).toString());
      const playerId = 1;
      await mockToken.connect(userDeposit).approve(vaultAddress, userDepositBalance);
      await expect(vaultATM.connect(userDeposit).deposit(userDepositAllowance,playerId)).to.be.revertedWith( "Insufficient balance");
    });
    it("Should not deposit, Invalid player id", async function () {
      const { vaultATM, mockToken, userDeposit } = await loadFixture(deployOneYearLockFixture);
      await mockToken.mint(userDeposit.address, parseEther((1 * 10**6).toString()));
      const vaultAddress = await vaultATM.getAddress();
      const userDepositBalance = await mockToken.balanceOf(userDeposit.address);
      const userDepositAllowance = parseEther((500 * 10**3).toString());
      const playerId = 0;
      await mockToken.connect(userDeposit).approve(vaultAddress, userDepositBalance);
      await expect(vaultATM.connect(userDeposit).deposit(userDepositAllowance,playerId)).to.be.revertedWith( "Invalid player id");
    });

    //withdraw
    it("Should not withdraw, Withdrawal is disabled", async function () {
      const { vaultATM, mockToken,owner,userWithdraw,userDeposit } = await loadFixture(deployOneYearLockFixture);

      //Grant withdrawer role to withDrawer
      let WITHDRAWER_ROLE = hre.ethers.keccak256(Buffer.from("WITHDRAWER_ROLE")).toString();
      await vaultATM.grantRole(WITHDRAWER_ROLE,userWithdraw.address);

      //setter vault funds
      await vaultATM.connect(owner).setMaxWithdrawalAmount(parseEther((1 * 10**6).toString()));
      await vaultATM.connect(owner).setWithdrawalEnabled(false);
      await vaultATM.connect(owner).setWithdrawFees(0);
      
      // User deposits funds in vault
      await mockToken.mint(userDeposit.address, parseEther((1 * 10**6).toString()));
      await mockToken.connect(userDeposit).approve(vaultATM.getAddress(), await mockToken.balanceOf(userDeposit.address));
      const playerId = 1;
      await vaultATM.connect(userDeposit).deposit(parseEther((500 * 10**3).toString()),playerId);

      // User withdraws funds from vault
      await expect(vaultATM.connect(userWithdraw).withdraw(parseEther((300 * 10**3).toString()),playerId,userDeposit.address)).to.be.revertedWith( "Withdrawal is disabled");
    });
    it("Should not withdraw, Exceeds max withdrawal amount", async function () {
      const { vaultATM, mockToken,owner,userWithdraw,userDeposit } = await loadFixture(deployOneYearLockFixture);

      //Grant withdrawer role to withDrawer
      let WITHDRAWER_ROLE = hre.ethers.keccak256(Buffer.from("WITHDRAWER_ROLE")).toString();
      await vaultATM.grantRole(WITHDRAWER_ROLE,userWithdraw.address);

      //setter vault funds
      await vaultATM.connect(owner).setMaxWithdrawalAmount(parseEther((1 * 10**6).toString()));
      await vaultATM.connect(owner).setWithdrawalEnabled(true);
      await vaultATM.connect(owner).setWithdrawFees(0);
      
      // User deposits funds in vault
      await mockToken.mint(userDeposit.address, parseEther((2 * 10**6).toString()));
      await mockToken.connect(userDeposit).approve(vaultATM.getAddress(), await mockToken.balanceOf(userDeposit.address));
      const playerId = 1;
      await vaultATM.connect(userDeposit).deposit(parseEther((1.5 * 10**6).toString()),playerId);

      // User withdraws funds from vault
      await expect(vaultATM.connect(userWithdraw).withdraw(parseEther((1.5 * 10**6).toString()),playerId,userDeposit.address)).to.be.revertedWith( "Exceeds max withdrawal amount");
    });
    it("Should not withdraw, Invalid player id", async function () {
      const { vaultATM, mockToken,owner,userWithdraw,userDeposit } = await loadFixture(deployOneYearLockFixture);

      //Grant withdrawer role to withDrawer
      let WITHDRAWER_ROLE = hre.ethers.keccak256(Buffer.from("WITHDRAWER_ROLE")).toString();
      await vaultATM.grantRole(WITHDRAWER_ROLE,userWithdraw.address);

      //setter vault funds
      await vaultATM.connect(owner).setMaxWithdrawalAmount(parseEther((1 * 10**6).toString()));
      await vaultATM.connect(owner).setWithdrawalEnabled(true);
      await vaultATM.connect(owner).setWithdrawFees(0);
      
      // User deposits funds in vault
      await mockToken.mint(userDeposit.address, parseEther((1 * 10**6).toString()));
      await mockToken.connect(userDeposit).approve(vaultATM.getAddress(), await mockToken.balanceOf(userDeposit.address));
      const playerId = 1;
      await vaultATM.connect(userDeposit).deposit(parseEther((500 * 10**3).toString()),playerId);

      // User withdraws funds from vault
      await expect(vaultATM.connect(userWithdraw).withdraw(parseEther((300 * 10**3).toString()),0,userDeposit.address)).to.be.revertedWith( "Invalid player id");
    });
  });
});

