"use client";

import { useTab } from "@/contexts/TabContext";
import { useFhevmContext } from "../contexts/FhevmContext";
import { useInMemoryStorage } from "../hooks/useInMemoryStorage";
import { usePayrollUSDT } from "../hooks/usePayrollETH";
import { FundContract } from "@/components/FundContract";
import { TokenFaucetDemo } from "@/components/TokenFaucetDemo";
import { Payment } from "@/components/Payment";
import { useEffect } from "react";

export default function Home() {
  const { activeTab, setActiveTab } = useTab();
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    instance: fhevmInstance,
    ethersSigner,
    ethersReadonlyProvider,
    chainId,
  } = useFhevmContext();

  const { isOwner } = usePayrollUSDT({
    fhevmInstance,
    ethersSigner,
    ethersReadonlyProvider,
    chainId,
    fhevmDecryptionSignatureStorage,
  });

  // Redirect non-owners away from dashboard
  useEffect(() => {
    if (!isOwner && activeTab === "dashboard") {
      setActiveTab("payment");
    }
  }, [isOwner, activeTab, setActiveTab]);

  return (
    <main className="w-full px-3 md:px-0">
      {/* Tab Content */}
      <div className="w-full max-w-4xl mx-auto">
        {activeTab === "dashboard" && isOwner && <FundContract />}
        {activeTab === "faucet" && <TokenFaucetDemo />}
        {activeTab === "payment" && <Payment />}
      </div>
    </main>
  );
}
