import { ethers } from "hardhat";
import { expect } from "chai";

describe("SimpleFHEVoting manual vote test", function () {
  it("should submit a vote and tally should increase", async function () {
    const [deployer, voter] = await ethers.getSigners();

    // 1. Deploy contract với 3 ứng viên
    const SimpleFHEVoting = await ethers.getContractFactory("SimpleFHEVoting");
    const contract = await SimpleFHEVoting.deploy(["Alice", "Bob", "Charlie"]);
    await contract.waitForDeployment();
    const addr = await contract.getAddress();
    console.log("Voting contract deployed at:", addr);

    // 2. Init tally và open voting
    await (await contract.initTallies()).wait();
    await (await contract.open()).wait();

    // ⭐ quan trọng: dynamic import vì SDK là ESM
    const sdk = await import("@zama-fhe/relayer-sdk");
    const fhevm = await sdk.createInstance({ ...sdk.SepoliaConfig });
    const caller = voter.address;

    // 4. Tạo encrypted input (chọn Bob = index 1)
    const input = fhevm.createEncryptedInput(addr, caller);
    input.add8(1);
    const enc = await input.encrypt();

    console.log("Encrypted vote handles:", enc.handles);
    console.log("Encrypted vote proof:", enc.inputProof);

    // 5. Submit vote
    const contractAsVoter = contract.connect(voter);
    const tx = await contractAsVoter.submitVote(enc.handles[0], enc.inputProof);
    await tx.wait();
    console.log("Vote submitted by:", voter.address);

    // 6. Close và make tallies public
    await (await contract.close()).wait();
    await (await contract.makeTalliesPublic()).wait();

    // 7. Lấy tally encrypted và decrypt
    const tallyBob = await contract.getEncryptedTally(1);
    console.log("Encrypted tally for Bob:", tallyBob);

    const result = await fhevm.publicDecrypt([tallyBob]);
    console.log("Decrypted tally for Bob:", result);

    // Expect tally = 1
    const parsed = Array.isArray(result) ? Number(result[0]) : Number(result);
    expect(parsed).to.equal(1);
  });
});
