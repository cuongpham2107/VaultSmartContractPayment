
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const VaultATMModule = buildModule("Deploy", (m) => {
  const owner = "0x587E72BD9810057B093d36d026f7aF9312edf4f2"
  const vaultATM = m.contract("VaultATM",
  [
    owner
  ]);

  return { vaultATM };
});

export default VaultATMModule;
