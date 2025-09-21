import hre from "hardhat";

async function main() {
  // 👉 Địa chỉ PublicToken (USDT) đã deploy trước đó
  const PUBLIC_TOKEN_ADDRESS = "0x26D3d5Ec01bfEb3ae023b4729Ae338143d8C81c2";

  console.log("🚀 Deploying Payroll with token:", PUBLIC_TOKEN_ADDRESS);

  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Deploy Payroll sử dụng hardhat-deploy
  const deployedPayroll = await deploy("Payroll", {
    from: deployer,
    args: [PUBLIC_TOKEN_ADDRESS], // truyền token address vào constructor
    log: true,
  });

  console.log("✅ Payroll deployed to:", deployedPayroll.address);
  console.log("🔗 Linked to PublicToken (USDT) at:", PUBLIC_TOKEN_ADDRESS);
}

// Run script
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
