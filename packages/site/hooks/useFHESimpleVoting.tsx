"use client";
import { useCallback, useState, useEffect, useMemo } from "react";
import { ethers } from "ethers";
import { SimpleFHEVotingABI } from "../abi/SimpleFHEVotingABI";
import { SimpleFHEVotingAddresses } from "../abi/SimpleFHEVotingAddresses";

type Status = "idle" | "loading" | "success" | "error";

interface UseFHESimpleVotingProps {
  fhevmInstance: any;                // instance từ @zama-fhe/relayer-sdk
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.Provider | null;
  chainId: number;
}

export const useFHESimpleVoting = ({
  fhevmInstance,
  ethersSigner,
  ethersReadonlyProvider,
  chainId,
}: UseFHESimpleVotingProps) => {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const [candidates, setCandidates] = useState<string[]>([]);
  const [phase, setPhase] = useState<number>(0);
  const [owner, setOwner] = useState<string>("");
  const [isOwner, setIsOwner] = useState<boolean>(false);

  const [results, setResults] = useState<string[] | null>(null);
  const [decryptedResults, setDecryptedResults] = useState<number[] | null>(null);
  const [lastTx, setLastTx] = useState<string | null>(null);

  const contractAddress =
    chainId ? SimpleFHEVotingAddresses[chainId.toString() as keyof typeof SimpleFHEVotingAddresses]?.address : undefined;

  const contract = useMemo(() => {
    if (!contractAddress || !ethersReadonlyProvider) return null;
    return new ethers.Contract(contractAddress, SimpleFHEVotingABI.abi, ethersReadonlyProvider);
  }, [contractAddress, ethersReadonlyProvider]);

  const contractWithSigner = useMemo(() => {
    if (!contractAddress || !ethersSigner) return undefined;
    return new ethers.Contract(contractAddress, SimpleFHEVotingABI.abi, ethersSigner);
  }, [contractAddress, ethersSigner]);

  const refreshPhaseAndOwner = useCallback(async () => {
    if (!contract) return;
    const [p, o] = await Promise.all([contract.phase(), contract.owner()]);
    setPhase(Number(p));
    setOwner(String(o).toLowerCase());
    const me = (await ethersSigner?.getAddress())?.toLowerCase();
    setIsOwner(!!me && me === String(o).toLowerCase());
  }, [contract, ethersSigner]);

  const getCandidates = useCallback(async () => {
    if (!contract) return;
    try {
      const n = await contract.candidateCount();
      const list: string[] = [];
      for (let i = 0; i < Number(n); i++) {
        list.push(await contract.candidates(i));
      }
      setCandidates(list);
    } catch (err: any) {
      console.error("Error getting candidates:", err);
      setError(err.message || "Failed to get candidates");
      setStatus("error");
    }
  }, [contract]);

  const initTallies = useCallback(async () => {
    if (!contractWithSigner) throw new Error("No signer or contract");
    setStatus("loading"); setError(null);
    try {
      const tx = await contractWithSigner.initTallies();
      setLastTx(tx.hash);
      await tx.wait();
      setStatus("success");
      await refreshPhaseAndOwner();
    } catch (e: any) {
      setError(e.message || "initTallies failed"); setStatus("error");
    }
  }, [contractWithSigner, refreshPhaseAndOwner]);

  const openVoting = useCallback(async () => {
    if (!contractWithSigner) throw new Error("No signer or contract");
    setStatus("loading"); setError(null);
    try {
      const tx = await contractWithSigner.open();
      setLastTx(tx.hash);
      await tx.wait();
      setStatus("success");
      await refreshPhaseAndOwner();
    } catch (e: any) {
      setError(e.message || "open failed"); setStatus("error");
    }
  }, [contractWithSigner, refreshPhaseAndOwner]);

  const closeVoting = useCallback(async () => {
    if (!contractWithSigner) throw new Error("No signer or contract");
    setStatus("loading"); setError(null);
    try {
      const tx = await contractWithSigner.close();
      setLastTx(tx.hash);
      await tx.wait();
      setStatus("success");
      await refreshPhaseAndOwner();
    } catch (e: any) {
      setError(e.message || "close failed"); setStatus("error");
    }
  }, [contractWithSigner, refreshPhaseAndOwner]);

  const makeTalliesPublic = useCallback(async () => {
    if (!contractWithSigner) throw new Error("No signer or contract");
    setStatus("loading"); setError(null);
    try {
      const tx = await contractWithSigner.makeTalliesPublic();
      setLastTx(tx.hash);
      await tx.wait();
      setStatus("success");
    } catch (e: any) {
      setError(e.message || "makeTalliesPublic failed"); setStatus("error");
    }
  }, [contractWithSigner]);

  const vote = useCallback(async (candidateIndex: number) => {
    if (!fhevmInstance) throw new Error("FHEVM instance not ready");
    if (!ethersSigner) throw new Error("No signer");
    if (!contractAddress) throw new Error("No contract address");

    setStatus("loading"); setError(null);

    try {
      const caller = await ethersSigner.getAddress();
      const input = fhevmInstance.createEncryptedInput(contractAddress, caller);
      input.add8(candidateIndex);
      const enc = await input.encrypt(); // { handles: [externalEuint8], inputProof: bytes, extraData?: bytes }
      

      const c = new ethers.Contract(contractAddress, SimpleFHEVotingABI.abi, ethersSigner);
      const tx = await c.submitVote(enc.handles[0], enc.inputProof);
      setLastTx(tx.hash);
      await tx.wait();

      setStatus("success");
    } catch (e: any) {
      console.error("Vote failed:", e);
      setError(e.message || "Failed to vote");
      setStatus("error");
    }
  }, [fhevmInstance, ethersSigner, contractAddress]);

  const getResults = useCallback(async () => {
    if (!contract) throw new Error("Readonly contract missing");
    setStatus("loading"); setError(null);

    try {
      const n = await contract.candidateCount();
      const list: string[] = [];
      for (let i = 0; i < Number(n); i++) {
        const tally = await contract.getEncryptedTally(i);
        list.push(tally);
      }
      setResults(list);
      setStatus("success");
    } catch (e: any) {
      console.error("getResults error:", e);
      setError(e.message || "Failed to get results");
      setStatus("error");
    }
  }, [contract]);

  const decryptPublicResults = useCallback(async () => {
    if (!results) throw new Error("No results to decrypt");
    if (!fhevmInstance) throw new Error("FHEVM instance not ready");
    setStatus("loading"); setError(null);

    try {
      const out: number[] = [];
      for (const handle of results) {
        const vals = await fhevmInstance.publicDecrypt([handle]);
        
        // ✅ SDK trả về object {handle: value} thay vì array
        let val = vals[handle] || vals[0] || vals;
        
        // ✅ Robust parsing để tránh NaN
        let parsed: number;
        if (typeof val === "bigint") {
          parsed = Number(val);
        } else if (typeof val === "string" && /^\d+$/.test(val)) {
          parsed = parseInt(val, 10);
        } else if (typeof val === "string" && val.startsWith("0x")) {
          parsed = parseInt(val, 16);
        } else {
          console.warn("Unexpected decrypt result:", val);
          parsed = 0;
        }
        
        out.push(parsed);
      }
      setDecryptedResults(out);
      setStatus("success");
    } catch (e: any) {
      console.error("❌ Error decrypting results:", e);
      setError(e.message || "Failed to decrypt results");
      setStatus("error");
    }
  }, [results, fhevmInstance]);

  useEffect(() => {
    (async () => {
      if (!contract || !ethersReadonlyProvider || !contractAddress) return;
      try {
        const code = await ethersReadonlyProvider.getCode(contractAddress);
        if (!code || code === "0x") {
          setError("Contract not deployed at this address"); setStatus("error");
          return;
        }
        await Promise.all([refreshPhaseAndOwner(), getCandidates()]);
      } catch (e: any) {
        setError(e.message ?? String(e)); setStatus("error");
      }
    })();
  }, [contract, ethersReadonlyProvider, contractAddress, refreshPhaseAndOwner, getCandidates]);

  return {
    status, error, candidates, phase, owner, isOwner,
    results, decryptedResults, lastTx,
    initTallies, openVoting, closeVoting, makeTalliesPublic,
    vote, getResults, decryptPublicResults, getCandidates, refreshPhaseAndOwner,
  };
};
