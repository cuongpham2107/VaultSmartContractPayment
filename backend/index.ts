import { ethers, formatUnits } from "ethers";


const url = "https://data-seed-prebsc-2-s1.bnbchain.org:8545";
const vaultAddress = "0xa23C3a26a2e4eE8F0D9A66AEA79E31e1609b289c";
const vaultContractABI = [
    "function token() public view returns (address)",
    "event Deposit( uint256 playerId,  address indexed from,uint256 amount)"
];

const provider = new ethers.JsonRpcProvider(url);
const vaultContract = new ethers.Contract(vaultAddress, vaultContractABI, provider);
console.log("Setting up event listener for Deposit event");
vaultContract.on("Deposit", (_playerId, _from, _amount, event) => {
    console.log("Deposit event received!");
    const amount = formatUnits(_amount, 18)
    console.log(`${_playerId} - ${_from}: ${amount}`);
});
