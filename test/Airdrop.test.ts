import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import "@nomicfoundation/hardhat-chai-matchers";
import { MerkleTree } from "merkletreejs";

describe("Airdrop (Merkle Tree Version)", function () {
  async function deployAirdropFixture() {
    const [owner, user1, user2, user3] = await ethers.getSigners();

    const TokenFactory = await ethers.getContractFactory("TestToken", owner);
    const token = await TokenFactory.deploy("TestToken", "TTK", 18);
    await token.waitForDeployment();

    await token.mint(owner.address, ethers.parseEther("10000"));

    const AirdropFactory = await ethers.getContractFactory("Airdrop", owner);
    const airdrop = await AirdropFactory.deploy(owner.address);
    await airdrop.waitForDeployment();

    return { owner, user1, user2, user3, token, airdrop };
  }

  function createMerkleTree(recipients: {address: string, amount: bigint}[]) {
    const leaves = recipients.map(r => 
        ethers.keccak256(
            ethers.solidityPacked(
                ["address", "uint256"],
                [r.address, r.amount]
            )
        )
    );
    
    const tree = new MerkleTree(leaves, ethers.keccak256, { sort: true });
    return { 
        tree, 
        root: tree.getHexRoot(),
        getProof: (address: string, amount: bigint) => {
            const leaf = ethers.keccak256(
                ethers.solidityPacked(
                    ["address", "uint256"],
                    [address, amount]
                )
            );
            return tree.getHexProof(leaf);
        }
    };
}

  describe("Start Campaign", function () {
    it("should start a new campaign", async function () {
      const { token, airdrop } = await loadFixture(deployAirdropFixture);

      const totalAllocated = ethers.parseEther("1000");
      await token.approve(await airdrop.getAddress(), totalAllocated);

      await expect(airdrop.startCampaign(await token.getAddress(), totalAllocated))
        .to.emit(airdrop, "StartAirdrop");

      const campaign = await airdrop.campaigns(1);
      expect(campaign.token).to.equal(await token.getAddress());
      expect(campaign.finalized).to.be.false;
    });

    it("should revert with empty address", async function () {
      const { airdrop } = await loadFixture(deployAirdropFixture);

      await expect(
        airdrop.startCampaign(ethers.ZeroAddress, ethers.parseEther("1000"))
      ).to.be.revertedWithCustomError(airdrop, "EmptyAddress");
    });
  });

  describe("Finalize Campaign", function () {
    it("should finalize a campaign with merkle root", async function () {
      const { user1, user2, token, airdrop } = await loadFixture(deployAirdropFixture);

      const totalAllocated = ethers.parseEther("1000");
      await token.approve(await airdrop.getAddress(), totalAllocated);
      await airdrop.startCampaign(await token.getAddress(), totalAllocated);

      const recipients = [
        { address: user1.address, amount: ethers.parseEther("300") },
        { address: user2.address, amount: ethers.parseEther("700") }
      ];
      const { root } = await createMerkleTree(recipients);

      const vestingStart = (await ethers.provider.getBlock('latest'))!.timestamp + 100;
      const duration = 30; 
      await expect(airdrop.finalizeCampaign(1, vestingStart, duration, root))
        .to.emit(airdrop, "CampaignFinalized");

      const campaign = await airdrop.campaigns(1);
      expect(campaign.finalized).to.be.true;
      expect(campaign.merkleRoot).to.equal(root);
    });

    it("should revert if finalizing already finalized campaign", async function () {
      const { token, airdrop } = await loadFixture(deployAirdropFixture);

      const totalAllocated = ethers.parseEther("1000");
      await token.approve(await airdrop.getAddress(), totalAllocated);
      await airdrop.startCampaign(await token.getAddress(), totalAllocated);

      const vestingStart = (await ethers.provider.getBlock('latest'))!.timestamp + 100;
      await airdrop.finalizeCampaign(1, vestingStart, 30, ethers.ZeroHash);

      await expect(
        airdrop.finalizeCampaign(1, vestingStart, 30, ethers.ZeroHash)
      ).to.be.revertedWithCustomError(airdrop, "CampaignAlreadyFinalized");
    });

    it("should revert if vesting starts in past", async function () {
      const { token, airdrop } = await loadFixture(deployAirdropFixture);

      await token.approve(await airdrop.getAddress(), ethers.parseEther("1000"));
      await airdrop.startCampaign(await token.getAddress(), ethers.parseEther("1000"));

      const pastTime = (await ethers.provider.getBlock('latest'))!.timestamp - 100;
      await expect(
        airdrop.finalizeCampaign(1, pastTime, 30, ethers.ZeroHash)
      ).to.be.revertedWithCustomError(airdrop, "NotAllowedStartCampaignInPast");
    });
  });

  describe("Claim Tokens", function () {
    it("should calculate correct vested amount during vesting period", async function () {
      const { user1, token, airdrop } = await loadFixture(deployAirdropFixture);
    
      const amount = ethers.parseEther("1000");
      await token.approve(await airdrop.getAddress(), amount);
      await airdrop.startCampaign(await token.getAddress(), amount);
    
      const recipients = [{ address: user1.address, amount }];
      const { root, getProof } = createMerkleTree(recipients);
      const proof = getProof(user1.address, amount);
    
      const now = (await ethers.provider.getBlock("latest"))!.timestamp;
      await airdrop.finalizeCampaign(1, now + 1, 10, root);
    
      await ethers.provider.send("evm_increaseTime", [5 * 86400]);
      await ethers.provider.send("evm_mine");
    
      await airdrop.connect(user1).claim(1, amount, proof);
      const expectedAmount = amount / 2n;
      expect(await token.balanceOf(user1.address)).to.be.closeTo(
        expectedAmount,
        expectedAmount / 100n 
      );
    });

    it("should not allow multiple claims during vesting", async function () {
      const { user1, token, airdrop } = await loadFixture(deployAirdropFixture);
    
      const amount = ethers.parseEther("1000");
      await token.approve(await airdrop.getAddress(), amount);
      await airdrop.startCampaign(await token.getAddress(), amount);
    
      const recipients = [{ address: user1.address, amount }];
      const { root, getProof } = createMerkleTree(recipients);
      const proof = getProof(user1.address, amount);
    
      const now = (await ethers.provider.getBlock("latest"))!.timestamp;
      await airdrop.finalizeCampaign(1, now + 1, 10, root);
    
      await ethers.provider.send("evm_increaseTime", [2 * 86400]);
      await ethers.provider.send("evm_mine");
    
      await airdrop.connect(user1).claim(1, amount, proof);
    
      await expect(airdrop.connect(user1).claim(1, amount, proof)).to.be.revertedWithCustomError(airdrop, "AlreadyClaimed")
    });

    it("should revert if claiming before vesting starts", async function () {
      const { user1, token, airdrop } = await loadFixture(deployAirdropFixture);
    
      const amount = ethers.parseEther("500");
      await token.approve(await airdrop.getAddress(), amount);
      await airdrop.startCampaign(await token.getAddress(), amount);
    
      const recipients = [{ address: user1.address, amount }];
      const { root, getProof } = createMerkleTree(recipients);
      const proof = getProof(user1.address, amount);
    
      const now = (await ethers.provider.getBlock("latest"))!.timestamp;
      await airdrop.finalizeCampaign(1, now + 86400, 1, root);
    
      await expect(
        airdrop.connect(user1).claim(1, amount, proof)
      ).to.be.revertedWithCustomError(airdrop, "CampaignNotAllowed");
    });

    it("should revert if campaign not finalized", async function () {
      const { user1, token, airdrop } = await loadFixture(deployAirdropFixture);
    
      const amount = ethers.parseEther("500");
      await token.approve(await airdrop.getAddress(), amount);
      await airdrop.startCampaign(await token.getAddress(), amount);
    
      const recipients = [{ address: user1.address, amount }];
      const { getProof } = createMerkleTree(recipients);
      const proof = getProof(user1.address, amount);
    
      await expect(
        airdrop.connect(user1).claim(1, amount, proof)
      ).to.be.revertedWithCustomError(airdrop, "CampaignNotAllowed");
    });

    it("should allow claiming full amount after vesting ends", async function () {
      const { user1, token, airdrop } = await loadFixture(deployAirdropFixture);
    
      const amount = ethers.parseEther("500");
      await token.approve(await airdrop.getAddress(), amount);
      await airdrop.startCampaign(await token.getAddress(), amount);
    
      const recipients = [{ address: user1.address, amount }];
      const { root, getProof } = createMerkleTree(recipients);
      const proof = getProof(user1.address, amount);
    
      const now = (await ethers.provider.getBlock("latest"))!.timestamp;
      await airdrop.finalizeCampaign(1, now + 1, 1, root);
    
      await ethers.provider.send("evm_increaseTime", [86400 + 1]);
      await ethers.provider.send("evm_mine");
    
      await expect(airdrop.connect(user1).claim(1, amount, proof))
        .to.emit(airdrop, "TokensClaimed")
        .withArgs(1, user1.address, amount);
    
      expect(await airdrop.hasClaimed(1, user1.address)).to.be.true;
      expect(await token.balanceOf(user1.address)).to.equal(amount);
    });

    it("should allow partial claim during vesting", async function () {
      const { user1, token, airdrop } = await loadFixture(deployAirdropFixture);

      const amount = ethers.parseEther("1000");
      await token.approve(await airdrop.getAddress(), amount);
      await airdrop.startCampaign(await token.getAddress(), amount);

      const recipients = [{ address: user1.address, amount }];
      const { root, getProof } = createMerkleTree(recipients);
      const proof = getProof(user1.address, amount);

      const now = (await ethers.provider.getBlock("latest"))!.timestamp;
      await airdrop.finalizeCampaign(1, now + 1, 1, root);
    
      await ethers.provider.send("evm_increaseTime", [86400 + 1]);
      await ethers.provider.send("evm_mine");

      const expectedAmount = amount
      await expect(airdrop.connect(user1).claim(1, amount, proof))
        .to.emit(airdrop, "TokensClaimed")
        .withArgs(1, user1.address, expectedAmount);

      expect(await airdrop.hasClaimed(1, user1.address)).to.be.true;
      expect(await token.balanceOf(user1.address)).to.equal(expectedAmount);
    });

    it("should revert with invalid proof", async function () {
      const { user1, user2, token, airdrop } = await loadFixture(deployAirdropFixture);

      const amount = ethers.parseEther("500");
      await token.approve(await airdrop.getAddress(), amount);
      await airdrop.startCampaign(await token.getAddress(), amount);

      const recipients = [{ address: user1.address, amount }];
      const { root, getProof } = createMerkleTree(recipients);
      const proof = getProof(user1.address, amount);

      const now = (await ethers.provider.getBlock("latest"))!.timestamp;
      await airdrop.finalizeCampaign(1, now + 1, 1, root);
    
      await ethers.provider.send("evm_increaseTime", [86400 + 1]);
      await ethers.provider.send("evm_mine");

      await expect(
        airdrop.connect(user2).claim(1, amount, proof)
      ).to.be.revertedWithCustomError(airdrop, "NonValidProof");
    });

    it("should revert if already claimed", async function () {
      const { user1, token, airdrop } = await loadFixture(deployAirdropFixture);

      const amount = ethers.parseEther("500");
      await token.approve(await airdrop.getAddress(), amount);
      await airdrop.startCampaign(await token.getAddress(), amount);

      const recipients = [{ address: user1.address, amount }];
      const { root, getProof } = createMerkleTree(recipients);
      const proof = getProof(user1.address, amount);

      const now = (await ethers.provider.getBlock("latest"))!.timestamp;
      await airdrop.finalizeCampaign(1, now + 1, 1, root);
    
      await ethers.provider.send("evm_increaseTime", [86400 + 1]);
      await ethers.provider.send("evm_mine");

      await airdrop.connect(user1).claim(1, amount, proof);

      await expect(
        airdrop.connect(user1).claim(1, amount, proof)
      ).to.be.revertedWithCustomError(airdrop, "AlreadyClaimed");
    });
  });

  describe("Withdraw Unclaimed", function () {
    it("should withdraw correct unclaimed amount after partial claims", async function () {
      const { owner, user1, user2, token, airdrop } = await loadFixture(deployAirdropFixture);

      const totalAmount = ethers.parseEther("1000");
      await token.approve(await airdrop.getAddress(), totalAmount);
      await airdrop.startCampaign(await token.getAddress(), totalAmount);

      const recipients = [
        { address: user1.address, amount: ethers.parseEther("300") },
        { address: user2.address, amount: ethers.parseEther("700") }
      ];
      const { root, getProof } = createMerkleTree(recipients);

      const now = (await ethers.provider.getBlock("latest"))!.timestamp;
      await airdrop.finalizeCampaign(1, now + 1, 1, root);

      const user1Proof = getProof(user1.address, recipients[0].amount);
      await ethers.provider.send("evm_increaseTime", [43200]); 
      await ethers.provider.send("evm_mine");
      await airdrop.connect(user1).claim(1, recipients[0].amount, user1Proof);
    
      await ethers.provider.send("evm_increaseTime", [43200 + 1]);
      await ethers.provider.send("evm_mine");

      const ownerBalanceBefore = await token.balanceOf(owner.address);
      await airdrop.withdrawUnclaimed(1);
      const ownerBalanceAfter = await token.balanceOf(owner.address);

      const expectedWithdrawn = ethers.parseEther("850");
      expect(ownerBalanceAfter - ownerBalanceBefore).to.be.closeTo(
        expectedWithdrawn,
        expectedWithdrawn / 100n 
      );
    });

    it("should revert if non-owner tries to withdraw", async function () {
      const { user1, token, airdrop } = await loadFixture(deployAirdropFixture);

      const amount = ethers.parseEther("500");
      await token.approve(await airdrop.getAddress(), amount);
      await airdrop.startCampaign(await token.getAddress(), amount);

      const now = (await ethers.provider.getBlock("latest"))!.timestamp;
      await airdrop.finalizeCampaign(1, now + 1, 1, ethers.ZeroHash);

      await ethers.provider.send("evm_increaseTime", [86400 + 1]);
      await ethers.provider.send("evm_mine");

      await expect(
        airdrop.connect(user1).withdrawUnclaimed(1)
      ).to.be.revertedWithCustomError(airdrop, "OwnableUnauthorizedAccount");
    });

    it("should allow owner to withdraw unclaimed tokens after vesting", async function () {
      const { owner, user1, user2, token, airdrop } = await loadFixture(deployAirdropFixture);

      const totalAmount = ethers.parseEther("1000");
      await token.approve(await airdrop.getAddress(), totalAmount);
      await airdrop.startCampaign(await token.getAddress(), totalAmount);

      const recipients = [
        { address: user1.address, amount: ethers.parseEther("300") },
        { address: user2.address, amount: ethers.parseEther("700") }
      ];
      const { root, getProof } = createMerkleTree(recipients);

      const now = (await ethers.provider.getBlock("latest"))!.timestamp;
      await airdrop.finalizeCampaign(1, now + 1, 1, root);

      const user1Proof = getProof(user1.address, recipients[0].amount);
      await airdrop.connect(user1).claim(1, recipients[0].amount, user1Proof);
    
      await ethers.provider.send("evm_increaseTime", [86400 + 1]);
      await ethers.provider.send("evm_mine");

      const ownerBalanceBefore = await token.balanceOf(owner.address);
      await airdrop.withdrawUnclaimed(1);
      const ownerBalanceAfter = await token.balanceOf(owner.address);

      expect(ownerBalanceAfter).to.greaterThan(ownerBalanceBefore);
    });

    it("should revert if vesting not ended", async function () {
      const { token, airdrop } = await loadFixture(deployAirdropFixture);

      const amount = ethers.parseEther("500");
      await token.approve(await airdrop.getAddress(), amount);
      await airdrop.startCampaign(await token.getAddress(), amount);

      const now = (await ethers.provider.getBlock("latest"))!.timestamp;
      await airdrop.finalizeCampaign(1, now + 1, 4, ethers.ZeroHash);

      await ethers.provider.send("evm_increaseTime", [86400 + 1]);
      await ethers.provider.send("evm_mine");

      await expect(
        airdrop.withdrawUnclaimed(1)
      ).to.be.revertedWithCustomError(airdrop, "VestingPeriodNotEnded");
    });
  });

  describe("Edge Cases", function () {
    it("should handle very small allocations correctly", async function () {
      const { user1, token, airdrop } = await loadFixture(deployAirdropFixture);
    
      const amount = ethers.parseEther("0.000001");
      await token.approve(await airdrop.getAddress(), amount);
      await airdrop.startCampaign(await token.getAddress(), amount);
    
      const recipients = [{ address: user1.address, amount }];
      const { root, getProof } = createMerkleTree(recipients);
      const proof = getProof(user1.address, amount);
    
      const now = (await ethers.provider.getBlock("latest"))!.timestamp;
      await airdrop.finalizeCampaign(1, now + 1, 1, root);
    
      await ethers.provider.send("evm_increaseTime", [86400 + 1]);
      await ethers.provider.send("evm_mine");
    
      await expect(airdrop.connect(user1).claim(1, amount, proof))
        .to.emit(airdrop, "TokensClaimed")
        .withArgs(1, user1.address, amount);
    
      expect(await token.balanceOf(user1.address)).to.equal(amount);
    });

    it("should handle very large allocations correctly", async function () {
      const { owner, user1, token, airdrop } = await loadFixture(deployAirdropFixture);
    
      const amount = ethers.parseEther("1000000");
      await token.mint(owner.address, amount);
      await token.approve(await airdrop.getAddress(), amount);
      await airdrop.startCampaign(await token.getAddress(), amount);
    
      const recipients = [{ address: user1.address, amount }];
      const { root, getProof } = createMerkleTree(recipients);
      const proof = getProof(user1.address, amount);
    
      const now = (await ethers.provider.getBlock("latest"))!.timestamp;
      await airdrop.finalizeCampaign(1, now + 1, 1, root);
    
      await ethers.provider.send("evm_increaseTime", [86400 + 1]);
      await ethers.provider.send("evm_mine");
    
      await expect(airdrop.connect(user1).claim(1, amount, proof))
        .to.emit(airdrop, "TokensClaimed")
        .withArgs(1, user1.address, amount);
    
      expect(await token.balanceOf(user1.address)).to.equal(amount);
    });

    it("should handle very long vesting periods correctly", async function () {
      const { user1, token, airdrop } = await loadFixture(deployAirdropFixture);
    
      const amount = ethers.parseEther("1000");
      await token.approve(await airdrop.getAddress(), amount);
      await airdrop.startCampaign(await token.getAddress(), amount);
    
      const recipients = [{ address: user1.address, amount }];
      const { root, getProof } = createMerkleTree(recipients);
      const proof = getProof(user1.address, amount);
    
      const now = (await ethers.provider.getBlock("latest"))!.timestamp;
      await airdrop.finalizeCampaign(1, now + 1, 365, root);
    
      await ethers.provider.send("evm_increaseTime", [30 * 86400]);
      await ethers.provider.send("evm_mine");
    
      await airdrop.connect(user1).claim(1, amount, proof);
      const expectedAmount = amount * 30n / 365n;
      expect(await token.balanceOf(user1.address)).to.be.closeTo(
        expectedAmount,
        expectedAmount / 100n
      );
    });
  });
});