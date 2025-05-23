"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Airdrop__factory = void 0;
/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
const ethers_1 = require("ethers");
const _abi = [
    {
        inputs: [
            {
                internalType: "address",
                name: "_owner",
                type: "address",
            },
        ],
        stateMutability: "nonpayable",
        type: "constructor",
    },
    {
        inputs: [],
        name: "AlreadyClaimed",
        type: "error",
    },
    {
        inputs: [],
        name: "CampaignFinalized",
        type: "error",
    },
    {
        inputs: [],
        name: "CampaignNotFinalized",
        type: "error",
    },
    {
        inputs: [],
        name: "EmptyAddress",
        type: "error",
    },
    {
        inputs: [],
        name: "EmptyDestibutionArray",
        type: "error",
    },
    {
        inputs: [],
        name: "NotAllowedStartCampaignInPast",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "owner",
                type: "address",
            },
        ],
        name: "OwnableInvalidOwner",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "account",
                type: "address",
            },
        ],
        name: "OwnableUnauthorizedAccount",
        type: "error",
    },
    {
        inputs: [],
        name: "ReentrancyGuardReentrantCall",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "token",
                type: "address",
            },
        ],
        name: "SafeERC20FailedOperation",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "availableAmount",
                type: "uint256",
            },
        ],
        name: "TooManyForWitdraw",
        type: "error",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "participant",
                type: "address",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "amount",
                type: "uint256",
            },
        ],
        name: "DestributionChanged",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "user",
                type: "address",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "amount",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "campaignId",
                type: "uint256",
            },
        ],
        name: "NewAirdropParticipants",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "previousOwner",
                type: "address",
            },
            {
                indexed: true,
                internalType: "address",
                name: "newOwner",
                type: "address",
            },
        ],
        name: "OwnershipTransferred",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "uint256",
                name: "id",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "address",
                name: "token",
                type: "address",
            },
        ],
        name: "StartAirdrop",
        type: "event",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        name: "airdropHistory",
        outputs: [
            {
                internalType: "uint256",
                name: "vestingStart",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "vestingEnd",
                type: "uint256",
            },
            {
                internalType: "address",
                name: "token",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "totalAllocated",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "totalDistributed",
                type: "uint256",
            },
            {
                internalType: "bool",
                name: "finalized",
                type: "bool",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        name: "campaignDistribution",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "_airdropId",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "_amountToWitdraw",
                type: "uint256",
            },
        ],
        name: "claim",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "_campaignId",
                type: "uint256",
            },
        ],
        name: "finalizeCampaign",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "owner",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "renounceOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "_token",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "_vestingStart",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "_durationInDays",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "_totalAllocated",
                type: "uint256",
            },
        ],
        name: "startCompaign",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "newOwner",
                type: "address",
            },
        ],
        name: "transferOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                components: [
                    {
                        internalType: "address",
                        name: "user",
                        type: "address",
                    },
                    {
                        internalType: "uint256",
                        name: "amount",
                        type: "uint256",
                    },
                    {
                        internalType: "uint256",
                        name: "campaignId",
                        type: "uint256",
                    },
                ],
                internalType: "struct Airdrop.AirdropParticipant[]",
                name: "_tokenDestribution",
                type: "tuple[]",
            },
        ],
        name: "uploadParticipants",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
];
const _bytecode = "0x608060405234801561001057600080fd5b50604051611447380380611447833981810160405281019061003291906101e9565b80600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16036100a55760006040517f1e4fbdf700000000000000000000000000000000000000000000000000000000815260040161009c9190610225565b60405180910390fd5b6100b4816100c260201b60201c565b506001808190555050610240565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050816000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006101b68261018b565b9050919050565b6101c6816101ab565b81146101d157600080fd5b50565b6000815190506101e3816101bd565b92915050565b6000602082840312156101ff576101fe610186565b5b600061020d848285016101d4565b91505092915050565b61021f816101ab565b82525050565b600060208201905061023a6000830184610216565b92915050565b6111f88061024f6000396000f3fe608060405234801561001057600080fd5b50600436106100935760003560e01c8063c349026311610066578063c349026314610111578063cc5cf4e01461012d578063ce6ea1ca14610149578063d640b12514610165578063f2fde38b1461019557610093565b80636b5ca27d14610098578063715018a6146100b457806386fdf1c9146100be5780638da5cb5b146100f3575b600080fd5b6100b260048036038101906100ad9190610d47565b6101b1565b005b6100bc61023a565b005b6100d860048036038101906100d39190610d47565b61024e565b6040516100ea96959493929190610ddf565b60405180910390f35b6100fb6102b7565b6040516101089190610e40565b60405180910390f35b61012b60048036038101906101269190610e5b565b6102e0565b005b61014760048036038101906101429190610f00565b6104e9565b005b610163600480360381019061015e9190610f79565b61078f565b005b61017f600480360381019061017a9190610fe0565b610999565b60405161018c9190611020565b60405180910390f35b6101af60048036038101906101aa919061103b565b6109be565b005b6101b9610a44565b60006003600083815260200190815260200160002090508060050160009054906101000a900460ff1615610219576040517f22c38fe600000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b60018160050160006101000a81548160ff0219169083151502179055505050565b610242610a44565b61024c6000610acb565b565b60036020528060005260406000206000915090508060000154908060010154908060020160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16908060030154908060040154908060050160009054906101000a900460ff16905086565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b6102e8610b8f565b600060036000848152602001908152602001600020905080600101544210158061032057508060050160009054906101000a900460ff165b610356576040517fe07f7ab300000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b60006002600085815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050600081116103e5576040517f646cf55800000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b82811115819061042b576040517ffa93f38a0000000000000000000000000000000000000000000000000000000081526004016104229190611020565b60405180910390fd5b5082816104389190611097565b6002600086815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055506104db33848460020160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16610bd59092919063ffffffff16565b50506104e5610c54565b5050565b6104f1610a44565b600082829050905060008111610533576040517fd3e51b7a00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b60005b818110156107895736848483818110610552576105516110cb565b5b905060600201905060006003600083604001358152602001908152602001600020905080600101544211158061059757508060050160009054906101000a900460ff16155b6105cd576040517f22c38fe600000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b6000600260008460400135815260200190815260200160002060008460000160208101906105fb919061103b565b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205411156106a15781600001602081019061064f919061103b565b73ffffffffffffffffffffffffffffffffffffffff167f822440c69d796d9ecfc2f1b71058063448d4fb157b8938317ed7694440dc918f83602001356040516106989190611020565b60405180910390a25b8160200135600260008460400135815260200190815260200160002060008460000160208101906106d2919061103b565b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550816000016020810190610723919061103b565b73ffffffffffffffffffffffffffffffffffffffff167fca41b9f546e416796c96543b3954b1e3f74a7b1f922e76385f6cb43d36b246ed836020013584604001356040516107729291906110fa565b60405180910390a250508080600101915050610536565b50505050565b610797610a44565b600073ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff16036107fd576040517f7138356f00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b42831015610837576040517fd19aee6800000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b600082620151806108489190611123565b846108539190611165565b905060016004546108649190611165565b6004819055506040518060c001604052808581526020018281526020018673ffffffffffffffffffffffffffffffffffffffff1681526020018381526020016000815260200160001515815250600360006004548152602001908152602001600020600082015181600001556020820151816001015560408201518160020160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550606082015181600301556080820151816004015560a08201518160050160006101000a81548160ff0219169083151502179055509050506004547f684cbce472b0cc6cdfdc1514b10293a807a0648766ed9cb85f2163b2bbfd32688660405161098a9190610e40565b60405180910390a25050505050565b6002602052816000526040600020602052806000526040600020600091509150505481565b6109c6610a44565b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1603610a385760006040517f1e4fbdf7000000000000000000000000000000000000000000000000000000008152600401610a2f9190610e40565b60405180910390fd5b610a4181610acb565b50565b610a4c610c5d565b73ffffffffffffffffffffffffffffffffffffffff16610a6a6102b7565b73ffffffffffffffffffffffffffffffffffffffff1614610ac957610a8d610c5d565b6040517f118cdaa7000000000000000000000000000000000000000000000000000000008152600401610ac09190610e40565b60405180910390fd5b565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050816000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b600260015403610bcb576040517f3ee5aeb500000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b6002600181905550565b610c4f838473ffffffffffffffffffffffffffffffffffffffff1663a9059cbb8585604051602401610c08929190611199565b604051602081830303815290604052915060e01b6020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff8381831617835250505050610c65565b505050565b60018081905550565b600033905090565b600080602060008451602086016000885af180610c88576040513d6000823e3d81fd5b3d925060005191505060008214610ca3576001811415610cbf565b60008473ffffffffffffffffffffffffffffffffffffffff163b145b15610d0157836040517f5274afe7000000000000000000000000000000000000000000000000000000008152600401610cf89190610e40565b60405180910390fd5b50505050565b600080fd5b600080fd5b6000819050919050565b610d2481610d11565b8114610d2f57600080fd5b50565b600081359050610d4181610d1b565b92915050565b600060208284031215610d5d57610d5c610d07565b5b6000610d6b84828501610d32565b91505092915050565b610d7d81610d11565b82525050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000610dae82610d83565b9050919050565b610dbe81610da3565b82525050565b60008115159050919050565b610dd981610dc4565b82525050565b600060c082019050610df46000830189610d74565b610e016020830188610d74565b610e0e6040830187610db5565b610e1b6060830186610d74565b610e286080830185610d74565b610e3560a0830184610dd0565b979650505050505050565b6000602082019050610e556000830184610db5565b92915050565b60008060408385031215610e7257610e71610d07565b5b6000610e8085828601610d32565b9250506020610e9185828601610d32565b9150509250929050565b600080fd5b600080fd5b600080fd5b60008083601f840112610ec057610ebf610e9b565b5b8235905067ffffffffffffffff811115610edd57610edc610ea0565b5b602083019150836060820283011115610ef957610ef8610ea5565b5b9250929050565b60008060208385031215610f1757610f16610d07565b5b600083013567ffffffffffffffff811115610f3557610f34610d0c565b5b610f4185828601610eaa565b92509250509250929050565b610f5681610da3565b8114610f6157600080fd5b50565b600081359050610f7381610f4d565b92915050565b60008060008060808587031215610f9357610f92610d07565b5b6000610fa187828801610f64565b9450506020610fb287828801610d32565b9350506040610fc387828801610d32565b9250506060610fd487828801610d32565b91505092959194509250565b60008060408385031215610ff757610ff6610d07565b5b600061100585828601610d32565b925050602061101685828601610f64565b9150509250929050565b60006020820190506110356000830184610d74565b92915050565b60006020828403121561105157611050610d07565b5b600061105f84828501610f64565b91505092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b60006110a282610d11565b91506110ad83610d11565b92508282039050818111156110c5576110c4611068565b5b92915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b600060408201905061110f6000830185610d74565b61111c6020830184610d74565b9392505050565b600061112e82610d11565b915061113983610d11565b925082820261114781610d11565b9150828204841483151761115e5761115d611068565b5b5092915050565b600061117082610d11565b915061117b83610d11565b925082820190508082111561119357611192611068565b5b92915050565b60006040820190506111ae6000830185610db5565b6111bb6020830184610d74565b939250505056fea2646970667358221220a8da161fc0ccfc772fb87922983280abd76333563171bac7bd1ea4e0a11c3e1d64736f6c634300081c0033";
const isSuperArgs = (xs) => xs.length > 1;
class Airdrop__factory extends ethers_1.ContractFactory {
    constructor(...args) {
        if (isSuperArgs(args)) {
            super(...args);
        }
        else {
            super(_abi, _bytecode, args[0]);
        }
    }
    getDeployTransaction(_owner, overrides) {
        return super.getDeployTransaction(_owner, overrides || {});
    }
    deploy(_owner, overrides) {
        return super.deploy(_owner, overrides || {});
    }
    connect(runner) {
        return super.connect(runner);
    }
    static createInterface() {
        return new ethers_1.Interface(_abi);
    }
    static connect(address, runner) {
        return new ethers_1.Contract(address, _abi, runner);
    }
}
exports.Airdrop__factory = Airdrop__factory;
Airdrop__factory.bytecode = _bytecode;
Airdrop__factory.abi = _abi;
