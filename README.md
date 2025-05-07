# Airdrop Smart Contract System

## How to use for checking person

1) It is not gpt comments, It is NatSpec docs. It is standart for solidity programming (https://docs.soliditylang.org/en/latest/natspec-format.html). Structure fields got description for better understanding what each field means.


3) how to deploy locally
3.1)npm i - install dependencies
3.2)npx hardhat node - start local blockchain, there are 20 test addresses and their private keys
3.3)deploy our contract in local testnet. Just use specially prepared script in script package. To use it run this command npx hardhat run script/deploy.ts --network localhost. if you want to deploy to mainnet you need to specify --network ethereum. As a result you will see the deployed contract address. If you deploy in localhost there is a special TestToken contract.

3.4)Start new campaign - npx hardhat run .\script\initCampaign.ts --network localhost. We need to specify: address of deployed contract, address of token, amount of tokens for airdrop campaign.

3.5)Finalize campaign npx hardhat run .\script\finalizeCampaign.ts --network localhost. 

Parameters: airdrop contract address, vestingStartDelay(if it is zero vestings starts right now), durationInDays length of vesting period from start date,gasLimit: gasLimit, campaignIds - campaign ids we want to finalize, csvPath - path to csv file with participants. 

Includes: read multiple participants csv, build merkleProof(can finalize many campaigns in one call), then write the execution results in console.

3.6)Claim airdrop to user npx hardhat run .\script\claim.ts --network localhost. Paremeter: contractAddress - airdrop contract address, userAddress - address of user who claimin, privateKey - user private key, campaignId - campaign user wants to claim, csvFilePath - path to csv(can be changed to sql database iterraction or something else) to evaluate proofs for user, gasLimit - gasLimit for transaction. Includes: building tree and counting proofs, sending transaction, output result

3.7)withdrawUnclaimed //todo функция дополнительная, задумался что может быть полезной, если нужно напишу скрипт


## 1. Overview
We are developing a reusable Airdrop Smart Contract designed to manage multiple token distribution campaigns (airdrops).

The system must support:
- Bulk uploading of recipient addresses and token amounts
- Campaign finalization
- Allowing eligible users to claim their allocated tokens
- Multiple campaigns, each tied to a specific ERC-20 (or compatible) token

## 2. Key Requirements

### 2.1 Smart Contract Features

#### 2.1.1 Campaign Creation
- Start a new airdrop campaign with a unique identifier
- Each campaign must be linked to a specific ERC-20 token address

#### 2.1.2 Bulk Data Upload
- Allow bulk uploading of allocations:
  - Input format: Address → Token amount
  - Multiple records should be uploaded in a single transaction (batch upload support)
  - Avoid uploading one address at a time for better scalability and gas efficiency

#### 2.1.3 Finalize Campaign
- After uploading all recipient data, the campaign must be finalized
- For each AirDrop campaign:
  - A vesting period (in days) will be defined at finalization
  - Optional vesting start time can delay the beginning of claims
  - Vesting period ranges from zero to any positive number of days
  - During vesting, claimable amount increases linearly over time
  - Users may claim available rewards at any moment (limited to vested amount)
- Finalization locks the campaign and marks it as ready for claiming
- No further modifications or uploads allowed post-finalization

#### 2.1.4 Claiming
- Only addresses included in the finalized campaign can claim
- The contract must securely transfer the allocated amount of tokens to the claimer

#### 2.1.5 Repeatable & Multi-Campaign Support
- Support multiple campaigns running in parallel or sequentially
- Each campaign can distribute a different ERC-20 token
- Addresses may appear across different campaigns with different allocations

## 3. Data Input Format
Input data will be provided as a CSV file with the following structure:

wallet_address,token_amount
0xabc123...,100
0xdef456...,250
...


This CSV file will be parsed and uploaded to the smart contract in batch transactions using a helper script.

### 3.1 Visual Example
In an example campaign for the ABC token:

0xAbC…123 → 100 ABC
0xDef…456 → 102 ABC
0xBbc…789 → 1200 BBC
0xCcd…321 → 90 ABC
0xEfg…654 → 500 BBC


This shows a real-world setup where different addresses receive allocations in different tokens as part of the same or parallel campaigns.

## 4. Deployment Tools

### 4.1 Helper Script (Command Line Tool)
A CLI tool (preferably in Node.js or Python) should be developed to:
- Accept a CSV file as input
- Interact with the smart contract to:
  - Start a new campaign
  - Upload all allocations in batches
  - Finalize the campaign

**Optional Enhancements:**
- Validate wallet addresses
- Estimate and optimize gas usage for batch uploads
- Display upload progress and error handling

## 5. Security Considerations
- Protect against reentrancy and double-claims
- Ensure only the admin (owner) can create, upload to, and finalize campaigns
- Optimize gas usage, especially for large datasets
- Use appropriate access control mechanisms

## 6. Workflow Example
Example sequence of operations:
1. Admin deploys the smart contract
2. Admin starts a new campaign for Token ABC
3. Admin uses the CLI tool to upload the address–amount list from CSV in batches
4. Admin finalizes the campaign
5. Eligible recipients claim their ABC tokens
6. Admin starts another campaign for token XYZ, repeating the process

## 7. Notes
- Each campaign operates independently
- Claims must be restricted to one-time per address per campaign
- Batch uploads should be gas-optimized to handle large recipient lists efficiently


