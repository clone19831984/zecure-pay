"use client";

import { useState, useEffect } from "react";
import { useFhevmContext } from "../contexts/FhevmContext";
import { useInMemoryStorage } from "../hooks/useInMemoryStorage";
import { usePayroll } from "../hooks/usePayroll";

export const FundContract = () => {
  const [mounted, setMounted] = useState(false);
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    instance: fhevmInstance,
    status: fhevmStatus,
    error: fhevmError,
    chainId,
    isConnected,
    ethersSigner,
    ethersReadonlyProvider,
  } = useFhevmContext();

  const {
    status,
    error,
    depositStatus,
    withdrawStatus,
    balanceStatus,
    depositToContract,
    isOwner,
    ownerWithdraw,
    getContractBalance,
    contractBalance,
  } = usePayroll({
    fhevmInstance,
    ethersSigner,
    ethersReadonlyProvider,
    chainId,
    fhevmDecryptionSignatureStorage,
  });

  const [contractDepositAmount, setContractDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="text-center">
          <p className="text-lg">Loading Salary Fund...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <h2 className="text-2xl font-bold mb-4">Please connect your wallet</h2>
        <p className="text-gray-600">Use the wallet button above</p>
      </div>
    );
  }

  if (fhevmStatus === "error") {
    return <p className="text-red-600">FHEVM Error: {fhevmError?.message || "Unknown error"}</p>;
  }

  if (status === "error") {
    return <p className="text-red-600">Payroll Error: {error}</p>;
  }

  return (
    <div className="flex flex-col items-center justify-center p-8">
      {/* Fund Contract Card */}
      {isOwner && (
        <div className="mb-8 w-full max-w-4xl border border-gray-300 rounded-lg p-6 bg-white shadow-md">
          <h2 className="text-2xl font-bold mb-4 text-center">Salary Fund</h2>
          
          {/* Top Row: All 3 sections in one row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Owner: Contract Balance */}
            <div>
              <button className="bg-gray-500 text-white font-bold py-2 px-3 rounded w-full text-sm mb-3">
                Balance
              </button>
              <div className="border p-2 rounded w-full mb-3 text-sm bg-white h-10 flex items-center justify-center">
                <p className="text-base font-bold">
                  <span className="text-blue-600">{Number(contractBalance).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} USDT</span>
                </p>
              </div>
              <button
                onClick={() => getContractBalance()}
                disabled={balanceStatus === "loading"}
                className="zama-yellow text-black font-bold py-2 px-3 rounded w-full disabled:opacity-50 text-sm"
              >
                {balanceStatus === "loading" ? "Loading..." : "Refresh"}
              </button>
              {balanceStatus === "loading" && (
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 zama-yellow text-black text-xs py-1 px-2 rounded"
                >
                  Reset if Stuck
                </button>
              )}
            </div>

            {/* Owner: Deposit to Contract */}
            <div>
              <button className="bg-gray-500 text-white font-bold py-2 px-3 rounded w-full text-sm mb-3">
                Deposit
              </button>
              <input
                type="text"
                placeholder="Amount"
                value={contractDepositAmount ? Number(contractDepositAmount).toLocaleString('en-US') : ""}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/,/g, '');
                  if (!isNaN(Number(numericValue)) || numericValue === '') {
                    setContractDepositAmount(numericValue);
                  }
                }}
                className="p-2 border border-gray-300 rounded text-sm h-10 w-full mb-3 text-center font-bold"
              />
              <button
                onClick={() => depositToContract(contractDepositAmount)}
                disabled={depositStatus === "loading"}
                className="zama-yellow text-black font-bold py-2 px-3 rounded w-full text-sm"
              >
                {depositStatus === "loading" ? "Processing..." : "Deposit"}
              </button>
            </div>

            {/* Owner: Withdraw from Contract */}
            <div>
              <button className="bg-gray-500 text-white font-bold py-2 px-3 rounded w-full text-sm mb-3">
                Withdraw
              </button>
              <input
                type="text"
                placeholder="Amount"
                value={withdrawAmount ? Number(withdrawAmount).toLocaleString('en-US') : ""}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/,/g, '');
                  if (!isNaN(Number(numericValue)) || numericValue === '') {
                    setWithdrawAmount(numericValue);
                  }
                }}
                className="p-2 border border-gray-300 rounded text-sm h-10 w-full mb-3 text-center font-bold"
              />
              <button
                onClick={() => ownerWithdraw(withdrawAmount)}
                disabled={withdrawStatus === "loading"}
                className="zama-yellow text-black font-bold py-2 px-3 rounded w-full text-sm"
              >
                {withdrawStatus === "loading" ? "Processing..." : "Withdraw"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
