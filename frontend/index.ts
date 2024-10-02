
import { ethers } from "ethers";

async function main() {
    const url_rpc = "https://data-seed-prebsc-2-s3.bnbchain.org:8545";
    const vaultAddress = "0xa23C3a26a2e4eE8F0D9A66AEA79E31e1609b289c";
    const vaultContractABI = [
        "function token() view returns (address)",
        "function deposit(uint256 _amount,uint256 _playerId) external",
    ];
    const tokenERC20ABI = [
        "function decimals() view returns (uint8)",
        "function approve(address _spender, uint256 _value) public returns (bool)",
    ];


    const provider = new ethers.JsonRpcProvider(url_rpc);

    const wallet = new ethers.Wallet("c243e17813446c73b0e006c5bbd4997f0fe713621d43a47d906a8d1226312bd5", provider);

    const vaultContract = new ethers.Contract(vaultAddress, vaultContractABI, wallet);

    const tokenERCContract = await vaultContract.token();
    const contractERC20 = new ethers.Contract(tokenERCContract, tokenERC20ABI, wallet);
    const decimals = await contractERC20.decimals();
    const playerId = 1;
    const amount = ethers.parseUnits("10000", decimals);

    console.log("Approving the vault to spend tokens...");
    const approve = await contractERC20.approve(vaultAddress, amount);

    console.log("Deposit tokens to the vault...");
    const tx = await vaultContract.deposit(amount, playerId);
    console.log(`Transaction hash: https://testnet.bscscan.com/tx/${tx.hash}`);

    console.log("Waiting for the transaction to be mined...");
    const receipt =  await tx.wait();
    console.log("Transaction mined in block " + receipt.blockNumber);

    console.log("Done! 🎉");
    console.log(`Deposit ${ethers.formatUnits(amount, decimals)} tokens to the vault`);
}

main().catch(console.error);