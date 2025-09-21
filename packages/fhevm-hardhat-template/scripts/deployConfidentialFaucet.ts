// scripts/deployConfidentialFaucet.ts
import hre, { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // 🔑 Initialize FHEVM plugin
  await hre.fhevm.initializeCLIApi();

  // Step 1: Deploy token
  const Token = await ethers.getContractFactory("ConfidentialToken");
  const token = await Token.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("Token deployed at:", tokenAddress);

  // Step 2: Deploy faucet
  const Faucet = await ethers.getContractFactory("ConfidentialFaucet");
  const faucet = await Faucet.deploy(tokenAddress);
  await faucet.waitForDeployment();
  const faucetAddress = await faucet.getAddress();
  console.log("Faucet deployed at:", faucetAddress);

  // Step 3: Transfer ownership of token to faucet
  console.log("Transferring token ownership to faucet...");
  const tx1 = await token.transferOwnership(faucetAddress);
  await tx1.wait();
  console.log("✅ Token ownership transferred to faucet");

  // Step 4: Mint 1000 tokens to deployer using faucet
  const decimals = 6;
  const scale = 10n ** BigInt(decimals);

  const input = hre.fhevm.createEncryptedInput(tokenAddress, deployer.address);
  input.add64(1000n * scale);

  const enc = await input.encrypt();
  const handle = enc.handles[0];
  const proof = enc.inputProof;

  const faucetWithSigner = await ethers.getContractAt("ConfidentialFaucet", faucetAddress, deployer);
  console.log("Calling faucet.claim...");
  const tx2 = await faucetWithSigner.claim(handle, proof);
  await tx2.wait();
  console.log("✅ Minted 1000 tokens to deployer (confidentially)");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
