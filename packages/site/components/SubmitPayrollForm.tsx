"use client";

import { useEffect, useState } from "react";
import { useFhevmContext } from "../contexts/FhevmContext";

interface SubmitPayrollFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubmitPayrollForm = ({ isOpen, onClose }: SubmitPayrollFormProps) => {
  const [wallet, setWallet] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const { isConnected, ethersSigner } = useFhevmContext();

  useEffect(() => {
    async function getWallet() {
      if (ethersSigner) {
        try {
          const address = await ethersSigner.getAddress();
          setWallet(address);
          const base =
            "https://docs.google.com/forms/d/e/1FAIpQLSelTThEAyDwMDy5lHrV64wbl9EPKyNQqeqSJuoM0fCmmgpOow/viewform";
          const url = `${base}?entry.2005620554=${encodeURIComponent(address)}`;
          setFormUrl(url);
        } catch {
          // Silent error handling
        }
      }
    }

    if (isConnected && ethersSigner) {
      getWallet();
    }
  }, [isConnected, ethersSigner]);

  const handleOpenForm = () => {
    if (!formUrl) return;
    setLoading(true);
    window.open(formUrl, "_blank");
    
    // Save to localStorage if user checked "don't show again"
    if (dontShowAgain) {
      localStorage.setItem('payroll-form-dont-show', 'true');
    }
    
    // Close popup after opening form
    setTimeout(() => {
      setLoading(false);
      onClose();
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Payroll Test Registration</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Rewards will be sent within 4-8 hours, Please come back to explore Zama&apos;s FHE tech in action.
        </p>
        
        {wallet && (
          <div className="mb-4 p-3 bg-gray-50 rounded border">
            <p className="text-xs text-gray-500">Connected wallet:</p>
            <p className="text-sm font-mono text-gray-800">{wallet}</p>
          </div>
        )}
        
        <button
          onClick={handleOpenForm}
          disabled={!formUrl || loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded transition-colors"
        >
          {loading ? "Opening Form..." : "Submit Wallet to Payroll Form"}
        </button>
        
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="dontShowAgain"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="dontShowAgain" className="text-sm text-gray-700 font-medium cursor-pointer">
              Don&apos;t show this form again
            </label>
          </div>
        </div>
        
        {!isConnected && (
          <p className="text-xs text-red-500 mt-2">
            Please connect your wallet first
          </p>
        )}
      </div>
    </div>
  );
};
