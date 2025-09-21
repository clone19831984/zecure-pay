"use client";

import { useFhevm } from "../fhevm/useFhevm";
import { useInMemoryStorage } from "../hooks/useInMemoryStorage";
import { useWagmiEthersSigner } from "../hooks/useWagmiEthersSigner";
import { useFHESimpleVoting } from "@/hooks/useFHESimpleVoting";

export const FHESimpleVoting = () => {
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    provider,
    chainId,
    isConnected,
    ethersSigner,
    ethersReadonlyProvider,
  } = useWagmiEthersSigner();

  const {
    instance: fhevmInstance,
    status: fhevmStatus,
    error: fhevmError,
  } = useFhevm({
    provider,
    chainId,
    enabled: true,
  });

  const {
    status: fheVotingStatus,
    error: fheVotingError,
    vote,
    getResults,
    decryptPublicResults,
    candidates,
    results,
    decryptedResults,
    openVoting,
    closeVoting,
    initTallies,
    makeTalliesPublic,
    phase,
    isOwner,
  } = useFHESimpleVoting({
    fhevmInstance,
    ethersSigner,
    ethersReadonlyProvider,
    chainId,
    fhevmDecryptionSignatureStorage,
  });

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <h2 className="text-2xl font-bold mb-4">Please connect your wallet to continue</h2>
        <p className="text-gray-600">Use the wallet button above to connect</p>
      </div>
    );
  }

  if (fhevmStatus === "error") {
    return <p className="text-red-600">FHEVM Error: {fhevmError}</p>;
  }

  if (fheVotingStatus === "error") {
    return <p className="text-red-600">Voting Error: {fheVotingError}</p>;
  }

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <h2 className="text-3xl font-bold mb-8">FHE Voting System</h2>

      {/* Candidates List */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Candidates</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {candidates.map((candidate, index) => (
            <div key={index} className="bg-gray-100 p-4 rounded-lg text-center">
              <span className="font-medium">{candidate}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Voting Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Cast Your Vote</h3>
        <div className="flex flex-wrap gap-2 justify-center">
          {candidates.map((candidate, index) => (
            <button
              key={index}
              onClick={() => vote(index)}
              disabled={phase !== 1 || fheVotingStatus === "loading"}
              className="bg-green-500 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded mr-2 mb-2"
            >
              Vote for {candidate}
            </button>
          ))}
        </div>
      </div>

      {/* Owner Controls */}
      {isOwner && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-center">Owner Controls</h3>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={initTallies}
              disabled={phase !== 0 || fheVotingStatus === "loading"}
              className="bg-yellow-500 hover:bg-yellow-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
            >
              Initialize Tallies
            </button>

            <button
              onClick={openVoting}
              disabled={phase !== 0 || fheVotingStatus === "loading"}
              className="bg-green-500 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
            >
              Open Voting
            </button>

            <button
              onClick={closeVoting}
              disabled={phase !== 1 || fheVotingStatus === "loading"}
              className="bg-red-500 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
            >
              Close Voting
            </button>

            <button
              onClick={makeTalliesPublic}
              disabled={phase !== 2 || fheVotingStatus === "loading"}
              className="bg-orange-500 hover:bg-orange-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
            >
              Make Tallies Public
            </button>
          </div>
        </div>
      )}

      {/* Results Section */}
      <div className="flex flex-wrap gap-4 justify-center mb-8">
        <button
          onClick={getResults}
          disabled={phase !== 2 || fheVotingStatus === "loading"}
          className="bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
        >
          Get Results
        </button>

        <button
          onClick={decryptPublicResults}
          disabled={phase !== 2 || fheVotingStatus === "loading" || !results}
          className="bg-purple-500 hover:bg-purple-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
        >
          Decrypt Results
        </button>
      </div>

      {/* Results Display */}
      {decryptedResults && (
        <div className="bg-green-100 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Voting Results:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {decryptedResults.map((count, index) => (
              <div key={index} className="flex justify-between">
                <span>{candidates[index]}:</span>
                <span className="font-bold">{count} votes</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
