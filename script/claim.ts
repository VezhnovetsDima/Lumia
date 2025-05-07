import { ethers } from "hardhat";
import { MerkleTree } from "merkletreejs";

import {Participant, readParticipantsFromCSV} from "./utils.ts"

async function getCampaignParticipants(filePath: string, campaignId: number): Promise<Participant[]> {
    const allParticipants = await readParticipantsFromCSV(filePath);
    return allParticipants.filter(p => p.campaignId === campaignId);
  }

async function buildMerkleTree(participants: Participant[]): Promise<MerkleTree> {
  const leaves = participants.map(p => 
    ethers.keccak256(
      ethers.solidityPacked(
        ["address", "uint256"],
        [p.address, p.amount]
      )
    )
  );
  
  return new MerkleTree(leaves, ethers.keccak256, { sort: true });
}

async function claimTokens(
    contractAddress: string,
    userAddress: string,
    privateKey: string,  
    campaignId: number,
    csvFilePath: string,
    gasLimit: number 
  ) {
    try {
      const provider = ethers.provider;
      const wallet = new ethers.Wallet(privateKey, provider);
      const participants = await getCampaignParticipants(csvFilePath, campaignId);
      const participant = participants.find(p => 
        p.address.toLowerCase() === userAddress.toLowerCase()
      );
      
      if (!participant) {
        throw new Error(`No allocation found for ${userAddress} in campaign ${campaignId}`);
      }

      const tree = await buildMerkleTree(participants);
      
      const leaf = ethers.keccak256(
        ethers.solidityPacked(
          ["address", "uint256"],
          [participant.address, participant.amount]
        )
      );
      const proof = tree.getHexProof(leaf);
  
      const airdrop = new ethers.Contract(
        contractAddress,
        [
          "function claim(uint256 _airdropId, uint256 _amount, bytes32[] calldata _proof) external",
          "function hasClaimed(uint256, address) external view returns (bool)"
        ],
        wallet
      );
  
      console.log(`\nClaiming for ${userAddress} in campaign ${campaignId}...`);
      console.log(`Allocated amount: ${participant.amount.toString()}`);
  
      const tx = await airdrop.claim(
        campaignId,
        participant.amount,
        proof,
        { gasLimit }
      );
      
      console.log(`Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
      
      const claimed = await airdrop.hasClaimed(campaignId, userAddress);
      console.log(`Claim status: ${claimed ? "Success" : "Failed"}`);
      
      return true;
    } catch (error) {
      console.error(`Failed to claim for ${userAddress}:`, error);
      return false;
    }
  }

claimTokens(
  "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", 
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  1,                                             
  "script/test.csv",                             
  500000                                         
);