import hre, { ethers } from "hardhat";

// ⚠️ Địa chỉ thật
const PAYROLL_ADDRESS = "0x8D3bF8a82d90EcbB18da9800054930B0F3D81BCF";
const TOKEN_ADDRESS   = "0xecce49A1A20930B13fDB4f8917bd5F078FD167E6";
const OWNER_ADDRESS   = "0x88F39a4E934C9B655645d9b29E53c11245506186";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // 🔑 Init FHE plugin
  await hre.fhevm.initializeCLIApi();

  // B1: Tạo encrypted input (500 zUSD chẳng hạn)
  // 👉 Quan trọng: contractAddr phải là TOKEN_ADDRESS (ConfidentialToken)
  const input = hre.fhevm.createEncryptedInput(TOKEN_ADDRESS, OWNER_ADDRESS);
  input.add64(500n * 10n ** 6n); // 500.000000
  const enc = await input.encrypt();

  // B2: Gọi fundFromWallet (owner → Payroll)
  const payroll = await ethers.getContractAt("Payroll", PAYROLL_ADDRESS, deployer);
  const tx = await payroll.fundFromWallet(enc.handles[0], enc.inputProof);
  await tx.wait();

  console.log("✅ Đã nạp 500 zUSD từ ví owner vào Payroll");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
