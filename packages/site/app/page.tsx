"use client";

import { useTab } from "@/contexts/TabContext";
import { useFhevmContext } from "../contexts/FhevmContext";
import { useInMemoryStorage } from "../hooks/useInMemoryStorage";
import { usePayroll } from "../hooks/usePayroll";
import { FundContract } from "@/components/FundContract";
import { Faucet } from "@/components/Faucet";
import { SalaryPayment } from "@/components/SalaryPayment";
import { SubmitPayrollForm } from "@/components/SubmitPayrollForm";
import { useEffect, useState } from "react";

export default function Home() {
  const { activeTab, setActiveTab } = useTab();
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    instance: fhevmInstance,
    ethersSigner,
    ethersReadonlyProvider,
    chainId,
    isConnected,
  } = useFhevmContext();

  const { isOwner } = usePayroll({
    fhevmInstance,
    ethersSigner,
    ethersReadonlyProvider,
    chainId,
    fhevmDecryptionSignatureStorage,
  });

  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [hasShownForm, setHasShownForm] = useState(false);

  // Redirect non-owners away from dashboard
  useEffect(() => {
    if (!isOwner && activeTab === "dashboard") {
      setActiveTab("payment");
    }
  }, [isOwner, activeTab, setActiveTab]);

  // Show register form when user connects wallet (only once, unless user chose not to show again)
  useEffect(() => {
    const dontShowForm = localStorage.getItem('payroll-form-dont-show') === 'true';
    
    if (isConnected && !hasShownForm && !dontShowForm) {
      setShowRegisterForm(true);
      setHasShownForm(true);
    }
  }, [isConnected, hasShownForm]);

  return (
    <main className="w-full px-3 md:px-0">
      {/* Tab Content */}
      <div className="w-full max-w-4xl mx-auto">
        {activeTab === "dashboard" && isOwner && <FundContract />}
        {activeTab === "faucet" && <Faucet />}
        {activeTab === "payment" && <SalaryPayment />}
      </div>
      
      {/* Register Form Popup */}
      <SubmitPayrollForm 
        isOpen={showRegisterForm} 
        onClose={() => setShowRegisterForm(false)} 
      />
    </main>
  );
}
