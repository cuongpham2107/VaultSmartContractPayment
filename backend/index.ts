import { ethers, formatUnits } from "ethers";

async function main() {
    const wws_rpc = "wss://bsc-testnet-rpc.publicnode.com";
    const vaultAddress = "0xa23C3a26a2e4eE8F0D9A66AEA79E31e1609b289c";
    const vaultContractABI = [
        "event Deposit( uint256 playerId,  address indexed from,uint256 amount)"
    ];
    
    const provider = new ethers.WebSocketProvider(wws_rpc);
    const vaultContract = new ethers.Contract(vaultAddress, vaultContractABI, provider);
    // Begin listening for any Transfer event
    vaultContract.on("Deposit", (_playerId, _from, _amount, event) => {
        const amount = formatUnits(_amount, 18)
        console.log(`${ _playerId } - ${ _from }: ${ amount }`);
        console.log(event);
    });

}
main().catch(console.error);