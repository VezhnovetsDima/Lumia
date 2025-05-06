import { ethers } from "hardhat";
import { MerkleTree } from "merkletreejs";
import {Participant, readParticipantsFromCSV } from "./utils.ts"

function createMerkleTree(participants: Participant[]): {
  tree: MerkleTree;
  root: string;
  getProof: (address: string, amount: bigint) => string[];
} {
  const leaves = participants.map((p) =>
    ethers.keccak256(
      ethers.solidityPacked(
        ["address", "uint256"],
        [p.address, p.amount]
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
    },
  };
}



async function finalizeCampaigns(
  contractAddress: string,
  vestingStartDelay: number,
  durationInDays: number,
  csvFilePath: string,
  gasLimit: number,
  campaignIds: number[] 
): Promise<void> {
  try {
    const [owner] = await ethers.getSigners();
    console.log(`Owner address: ${owner.address}`);

    console.log(`Reading participants from CSV: ${csvFilePath}`);
    const allParticipants = await readParticipantsFromCSV(csvFilePath);
    
    const participantsByCampaign = allParticipants.reduce((acc, participant) => {
      if (!acc[participant.campaignId]) {
        acc[participant.campaignId] = [];
      }
      acc[participant.campaignId].push(participant);
      return acc;
    }, {} as Record<number, Participant[]>);

    if (campaignIds.length === 0) {
      throw new Error("No campaignIds specified");
    }

    const campaignsToProcess = campaignIds.filter(id => participantsByCampaign[id])

    if (campaignsToProcess.length === 0) {
      throw new Error("No valid campaigns to finalize");
    }

    console.log(`Processing campaigns: ${campaignsToProcess.join(', ')}`);

    const airdrop = await ethers.getContractAt("Airdrop", contractAddress);
    console.log(`Connected to Airdrop contract: ${await airdrop.getAddress()}`);

    const currentBlock = await ethers.provider.getBlock("latest");
    const vestingStart = currentBlock!.timestamp + vestingStartDelay;

    for (const campaignId of campaignsToProcess) {
      const participants = participantsByCampaign[campaignId];
      console.log(`\nProcessing campaign ${campaignId} with ${participants.length} participants...`);

      const { root } = createMerkleTree(participants);
      console.log(`Merkle root generated: ${root}`);

      console.log(`Finalizing campaign ${campaignId}...`);
      const tx = await airdrop.finalizeCampaign(
        campaignId,
        vestingStart,
        durationInDays,
        root,
        { gasLimit: gasLimit }
      );

      const receipt = await tx.wait();
      console.log(`Campaign ${campaignId} finalized in tx: ${receipt?.hash}`);

      const campaign = await airdrop.campaigns(campaignId);
      console.log(`Campaign ${campaignId} details:`);
      console.log(`- Finalized: ${campaign.finalized}`);
      console.log(`- Vesting Start: ${campaign.vestingStart}`);
      console.log(`- Vesting End: ${campaign.vestingEnd}`);
      console.log(`- Token: ${campaign.token}`);
      console.log(`- Total Allocated: ${ethers.formatEther(campaign.totalAllocated)}`);
      console.log(`- Merkle Root: ${campaign.merkleRoot}`);
    }

    console.log("\nAll campaigns processed successfully!");

  } catch (error) {
    console.error("Error finalizing campaigns:", error);
    process.exitCode = 1;
  }
}


finalizeCampaigns(
  "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  40,
  30,
  "script/test.csv",
  8000000,
  [1, 2]                                     
);