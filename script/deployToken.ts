import {ethers} from "hardhat";


//ONLY FOR LOCAL DEVELOPMENT
async function deploy(owner: string) {
    try {
        const user = await ethers.getImpersonatedSigner(owner)

        const TokenFactory = await ethers.getContractFactory("TestToken", user);
        const token = await TokenFactory.deploy("TestToken", "TTK", 18);
        await token.waitForDeployment();

        await token.mint(user, ethers.parseEther("10000"));

        console.log(`contract address: ${await token.getAddress()}`)
    } catch (error) {
        console.log(error)
    }
}

deploy("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");