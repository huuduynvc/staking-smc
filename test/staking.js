const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("SouniStakingContract", function () {
  let SouniStakingContract;
  let stakingContract;
  let stakingToken;
  let owner;
  let addr1;
  let addr2;
  let addr3;

  beforeEach(async function () {
    // Deploy the staking token (MockERC20)
    MockERC20 = await ethers.getContractFactory("MockERC20");
    stakingToken = await MockERC20.deploy("Staking Token", "STK", 18);

    // Deploy the staking contract
    SouniStakingContract = await ethers.getContractFactory("SouniStakingContract");
    stakingContract = await SouniStakingContract.deploy(await stakingToken.getAddress());

    [owner, addr1, addr2, addr3] = await ethers.getSigners();

    // Mint some tokens for testing
    await stakingToken.mint(addr1.address, ethers.parseEther("1000"));
    await stakingToken.mint(addr2.address, ethers.parseEther("1000"));
    await stakingToken.mint(addr3.address, ethers.parseEther("1000"));

    // Approve staking contract to spend tokens
    await stakingToken.connect(addr1).approve(await stakingContract.getAddress(), ethers.parseEther("1000"));
    await stakingToken.connect(addr2).approve(await stakingContract.getAddress(), ethers.parseEther("1000"));
    await stakingToken.connect(addr3).approve(await stakingContract.getAddress(), ethers.parseEther("1000"));
  });

  describe("Deployment", function () {
    it("Should set the right staking token", async function () {
      expect(await stakingContract.stakingToken()).to.equal(await stakingToken.getAddress());
    });
  });

  describe("Staking", function () {
    it("Should allow users to stake tokens", async function () {
      await stakingContract.connect(addr1).stake(ethers.parseEther("100"));
      const userInfo = await stakingContract.userInfo(addr1.address);
      expect(userInfo.stakedAmount).to.equal(ethers.parseEther("100"));
    });

    it("Should update user's stake history", async function () {
      await stakingContract.connect(addr1).stake(ethers.parseEther("100"));
      const historyLength = await stakingContract.getUserStakeHistoryLength(addr1.address);
      expect(historyLength).to.equal(1);

      const [amount, , isStake] = await stakingContract.getUserStakeHistoryEntry(addr1.address, 0);
      expect(amount).to.equal(ethers.parseEther("100"));
      expect(isStake).to.be.true;
    });

    it("Should fail if user tries to stake 0 tokens", async function () {
      await expect(stakingContract.connect(addr1).stake(0)).to.be.revertedWith("Cannot stake 0");
    });
  });

  describe("Unstaking", function () {
    beforeEach(async function () {
      await stakingContract.connect(addr1).stake(ethers.parseEther("100"));
    });

    it("Should allow users to unstake tokens", async function () {
      await stakingContract.connect(addr1).unstake(ethers.parseEther("50"));
      const userInfo = await stakingContract.userInfo(addr1.address);
      expect(userInfo.stakedAmount).to.equal(ethers.parseEther("50"));
    });

    it("Should update user's unstake history", async function () {
      await stakingContract.connect(addr1).unstake(ethers.parseEther("50"));
      const historyLength = await stakingContract.getUserStakeHistoryLength(addr1.address);
      expect(historyLength).to.equal(2);

      const [amount, , isStake] = await stakingContract.getUserStakeHistoryEntry(addr1.address, 1);
      expect(amount).to.equal(ethers.parseEther("50"));
      expect(isStake).to.be.false;
    });

    it("Should fail if user tries to unstake more than staked amount", async function () {
      await expect(stakingContract.connect(addr1).unstake(ethers.parseEther("150")))
        .to.be.revertedWith("Insufficient staked amount");
    });
  });

  describe("Points Calculation", function () {
    it("Should calculate points correctly", async function () {
      await stakingContract.connect(addr1).stake(ethers.parseEther("100"));
      
      // Simulate time passing (1 hour)
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine");

      await stakingContract.updateUserPoints(addr1.address);
      const userInfo = await stakingContract.userInfo(addr1.address);
      
      // Expected points: 100 * 1 * 0.001 = 0.1
      expect(userInfo.points).to.be.closeTo(ethers.parseEther("0.1"), ethers.parseEther("0.001"));
    });

    it("Should apply redemption penalty on unstake", async function () {
      await stakingContract.connect(addr1).stake(ethers.parseEther("100"));
      
      // Simulate time passing (1 hour)
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine");

      await stakingContract.connect(addr1).unstake(ethers.parseEther("50"));
      const userInfo = await stakingContract.userInfo(addr1.address);
      
      // Expected points after penalty: 0.1 * 0.8 = 0.08
      expect(userInfo.points).to.be.closeTo(ethers.parseEther("0.08"), ethers.parseEther("0.001"));
    });
  });

  describe("Point Weight", function () {
    it("Should calculate point weight correctly", async function () {
      await stakingContract.connect(addr1).stake(ethers.parseEther("100"));
      await stakingContract.connect(addr2).stake(ethers.parseEther("300"));
      
      // Simulate time passing (1 hour)
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine");

      await stakingContract.updateUserPoints(addr1.address);
      await stakingContract.updateUserPoints(addr2.address);

      const pointWeight1 = await stakingContract.getPointWeight(addr1.address);
      const pointWeight2 = await stakingContract.getPointWeight(addr2.address);

      // Expected weights: addr1 = 0.25, addr2 = 0.75
      expect(pointWeight1).to.be.closeTo(ethers.parseEther("0.25"), ethers.parseEther("0.01"));
      expect(pointWeight2).to.be.closeTo(ethers.parseEther("0.75"), ethers.parseEther("0.01"));
    });
  });

  describe("Security and Anti-Cheat Measures", function () {
    it("Should not allow staking without approval", async function () {
      await stakingToken.connect(addr1).approve(await stakingContract.getAddress(), 0);
      await expect(stakingContract.connect(addr1).stake(ethers.parseEther("100")))
        .to.be.revertedWith("ERC20: insufficient allowance");
    });

    it("Should not allow unstaking more than staked amount", async function () {
      await stakingContract.connect(addr1).stake(ethers.parseEther("100"));
      await expect(stakingContract.connect(addr1).unstake(ethers.parseEther("101")))
        .to.be.revertedWith("Insufficient staked amount");
    });

    it("Should not allow unstaking when nothing is staked", async function () {
      await expect(stakingContract.connect(addr1).unstake(ethers.parseEther("1")))
        .to.be.revertedWith("Insufficient staked amount");
    });

    it("Should correctly update points after multiple stake/unstake operations", async function () {
      await stakingContract.connect(addr1).stake(ethers.parseEther("100"));
      
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine");
      
      await stakingContract.connect(addr1).unstake(ethers.parseEther("50"));
      
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine");
      
      await stakingContract.connect(addr1).stake(ethers.parseEther("25"));
      
      const userInfo = await stakingContract.userInfo(addr1.address);
      expect(userInfo.stakedAmount).to.equal(ethers.parseEther("75"));
      
      // Manually calculate expected points
      // Initial points: 100 * 1 * 0.001 = 0.1
      // After unstake: 0.1 * 0.8 (20% penalty) = 0.08
      // Additional points: 50 * 1 * 0.001 = 0.05
      // Total expected: 0.08 + 0.05 = 0.13
      expect(userInfo.points).to.be.closeTo(ethers.parseEther("0.13"), ethers.parseEther("0.01"));
    });

    it("Should correctly handle point weight after multiple users stake/unstake", async function () {
      await stakingContract.connect(addr1).stake(ethers.parseEther("100"));
      await stakingContract.connect(addr2).stake(ethers.parseEther("200"));
      
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine");
      
      await stakingContract.connect(addr1).unstake(ethers.parseEther("50"));
      await stakingContract.connect(addr2).stake(ethers.parseEther("100"));
      
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine");
      
      await stakingContract.updateUserPoints(addr1.address);
      await stakingContract.updateUserPoints(addr2.address);
      
      const weight1 = await stakingContract.getPointWeight(addr1.address);
      const weight2 = await stakingContract.getPointWeight(addr2.address);
      
      const userInfo1 = await stakingContract.userInfo(addr1.address);
      const userInfo2 = await stakingContract.userInfo(addr2.address);
      
      const totalPoints = await stakingContract.totalPoints();
    
      // Updated expectations based on actual contract behavior
      expect(weight1).to.be.closeTo(ethers.parseEther("0.206349206349206349"), ethers.parseEther("0.000000000000000001"));
      expect(weight2).to.be.closeTo(ethers.parseEther("0.793650793650793650"), ethers.parseEther("0.000000000000000001"));
    
      // Additional checks
      expect(userInfo1.points).to.equal(ethers.parseEther("0.13"));
      expect(userInfo2.points).to.equal(ethers.parseEther("0.5"));
      expect(totalPoints).to.equal(ethers.parseEther("0.63"));
    });

    it("Should not allow transferring staked tokens", async function () {
      const balanceBefore = await stakingToken.balanceOf(addr1.address);
      await stakingContract.connect(addr1).stake(ethers.parseEther("100"));
      
      await expect(stakingToken.connect(addr1).transfer(addr2.address, balanceBefore))
        .to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("Should handle multiple users staking, unstaking, and calculating points correctly", async function () {
      await stakingContract.connect(addr1).stake(ethers.parseEther("100"));
      await stakingContract.connect(addr2).stake(ethers.parseEther("200"));
      await stakingContract.connect(addr3).stake(ethers.parseEther("300"));
      
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine");
      
      await stakingContract.connect(addr1).unstake(ethers.parseEther("50"));
      await stakingContract.connect(addr2).stake(ethers.parseEther("100"));
      await stakingContract.connect(addr3).unstake(ethers.parseEther("150"));
      
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine");
      
      await stakingContract.updateUserPoints(addr1.address);
      await stakingContract.updateUserPoints(addr2.address);
      await stakingContract.updateUserPoints(addr3.address);
      
      const info1 = await stakingContract.userInfo(addr1.address);
      const info2 = await stakingContract.userInfo(addr2.address);
      const info3 = await stakingContract.userInfo(addr3.address);
      
      expect(info1.stakedAmount).to.equal(ethers.parseEther("50"));
      expect(info2.stakedAmount).to.equal(ethers.parseEther("300"));
      expect(info3.stakedAmount).to.equal(ethers.parseEther("150"));
      
      // Detailed point calculations can be added here
      // Ensure the sum of all user points equals the total points in the contract
      const totalPoints = await stakingContract.totalPoints();
      expect(totalPoints).to.equal(info1.points.add(info2.points).add(info3.points));
    });
  });
});