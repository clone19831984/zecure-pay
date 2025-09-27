"use client";

import { useTab } from "@/contexts/TabContext";
import { useFhevmContext } from "../contexts/FhevmContext";
import { useInMemoryStorage } from "../hooks/useInMemoryStorage";
import { usePayroll } from "../hooks/usePayroll";

export const TabNavigation = () => {
  const { activeTab, setActiveTab } = useTab();
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    instance: fhevmInstance,
    ethersSigner,
    ethersReadonlyProvider,
    chainId,
  } = useFhevmContext();

  const { isOwner } = usePayroll({
    fhevmInstance,
    ethersSigner,
    ethersReadonlyProvider,
    chainId,
    fhevmDecryptionSignatureStorage,
  });
  
  return (
    <div className="flex gap-1">
      {isOwner && (
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`font-bold py-2 px-4 rounded transition-colors min-w-[120px] ${
            activeTab === "dashboard"
              ? "zama-yellow text-black"
              : "text-gray hover:bg-[#ffb243]"
          }`}
        >
          Dashboard
        </button>
      )}
      <button
        onClick={() => setActiveTab("payment")}
        className={`font-bold py-2 px-4 rounded transition-colors min-w-[120px] ${
          activeTab === "payment"
            ? "zama-yellow text-black"
            : "text-gray hover:bg-[#ffb243]"
        }`}
      >
        Payment
      </button>
      <button
        onClick={() => setActiveTab("faucet")}
        className={`font-bold py-2 px-4 rounded transition-colors min-w-[120px] ${
          activeTab === "faucet"
            ? "zama-yellow text-black"
            : "text-gray hover:bg-[#ffb243]"
        }`}
      >
        Faucet
      </button>
    </div>
  );
};
