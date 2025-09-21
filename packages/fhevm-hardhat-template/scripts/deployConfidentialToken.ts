import hre from "hardhat";

async function main() {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Step 1: Deploy token using hardhat-deploy
  const deployedToken = await deploy("ConfidentialToken", {
    from: deployer,
    args: [], // constructor không nhận tham số
    log: true,
  });

  console.log(`✅ ConfidentialToken deployed at: ${deployedToken.address}`);

  // Step 2: Initialize FHEVM CLI API
  await hre.fhevm.initializeCLIApi();
  const decimals = 6;
  const scale = 10n ** BigInt(decimals);

  // Step 3: Tạo input bí mật 1000 * 10^6
  const input = hre.fhevm.createEncryptedInput(deployedToken.address, deployer);
  input.add64(1000n * scale);

  const enc = await input.encrypt();
  const handle = enc.handles[0];
  const proof = enc.inputProof;

  // Step 4: Gọi mintConfidential để mint cho deployer
  const tokenContract = await hre.ethers.getContractAt("ConfidentialToken", deployedToken.address);
  const tx = await tokenContract.mintConfidential(deployer, handle, proof);
  await tx.wait();
  console.log("✅ Minted 1000 confidential tokens to deployer");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
