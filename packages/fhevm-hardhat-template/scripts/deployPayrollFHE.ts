import { ethers } from "hardhat";

async function main() {
  // ⚠️ Đặt địa chỉ ConfidentialToken bạn đã deploy ở đây
  const CONF_TOKEN_ADDRESS = "0x26D3d5Ec01bfEb3ae023b4729Ae338143d8C81c2";

  // 1. Deploy Payroll và gắn với token đã có
  const Payroll = await ethers.getContractFactory("Payroll");
  const payroll = await Payroll.deploy(CONF_TOKEN_ADDRESS);
  await payroll.waitForDeployment();

  const payrollAddr = await payroll.getAddress();
  console.log("✅ Payroll deployed to:", payrollAddr);
  console.log("🔗 Using ConfidentialToken at:", CONF_TOKEN_ADDRESS);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
