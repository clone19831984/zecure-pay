"use client";

import { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import { useFhevmContext } from "../contexts/FhevmContext";

/*
 * Main Faucet React component
 * - "Mint USDT" button: allows user to mint USDT tokens
 * - Shows ETH and USDT balance
 */
export const Faucet = () => {
  const [mounted, setMounted] = useState(false);
  const [ethBalance, setEthBalance] = useState<string>("0");
  const [usdtBalance, setUsdtBalance] = useState<string>("0");
  const [, setMessage] = useState<string>("");
  const [isMintingUsdt, setIsMintingUsdt] = useState<boolean>(false);
  const {
    status: fhevmStatus,
    error: fhevmError,
    isConnected,
    ethersSigner,
    ethersReadonlyProvider,
  } = useFhevmContext();


  useEffect(() => {
    setMounted(true);
  }, []);

  // Function để check ETH balance
  const checkEthBalance = useCallback(async () => {
    if (!ethersSigner) return;
    
    try {
      const balance = await ethersReadonlyProvider?.getBalance(ethersSigner.address);
      if (balance) {
        const ethBalanceWei = ethers.formatEther(balance);
        const ethBalanceFormatted = Number(ethBalanceWei).toLocaleString('en-US', {
          minimumFractionDigits: 4,
          maximumFractionDigits: 4
        });
        setEthBalance(ethBalanceFormatted);
        setMessage(`ETH Balance: ${ethBalanceFormatted} ETH`);
      }
    } catch (error) {
      console.error('Error checking ETH balance:', error);
      setMessage('Error checking ETH balance');
    }
  }, [ethersSigner, ethersReadonlyProvider]);

  // Function để check USDT balance
  const checkUsdtBalance = useCallback(async () => {
    if (!ethersSigner || !ethersReadonlyProvider) return;
    
    try {
      // Import USDT contract ABI và address
      const { PublicTokenABI } = await import("@/abi/PublicTokenABI");
      const { PublicTokenAddresses } = await import("@/abi/PublicTokenAddresses");
      
      const usdtAddress = PublicTokenAddresses["11155111"]?.address;
      if (!usdtAddress) {
        setMessage('USDT contract not deployed on Sepolia');
        return;
      }

      const usdtContract = new ethers.Contract(usdtAddress, PublicTokenABI.abi, ethersReadonlyProvider);
      const balance = await usdtContract.balanceOf(ethersSigner.address);
      const usdtBalanceFormatted = ethers.formatUnits(balance, 6); // USDT có 6 decimals
      const formattedWithCommas = Number(usdtBalanceFormatted).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      setUsdtBalance(formattedWithCommas);
      setMessage(`USDT Balance: ${formattedWithCommas} USDT`);
    } catch (error) {
      console.error('Error checking USDT balance:', error);
      setMessage('Error checking USDT balance');
    }
  }, [ethersSigner, ethersReadonlyProvider]);

  // Function để mint USDT cho user
  const mintUsdt = async () => {
    if (!ethersSigner || isMintingUsdt) return;
    
    try {
      setIsMintingUsdt(true);
      setMessage("Đang mint USDT...");
      
      // Import USDT contract ABI và address
      const { PublicTokenABI } = await import("@/abi/PublicTokenABI");
      const { PublicTokenAddresses } = await import("@/abi/PublicTokenAddresses");
      
      const usdtAddress = PublicTokenAddresses["11155111"]?.address;
      if (!usdtAddress) {
        setMessage('USDT contract not deployed on Sepolia');
        return;
      }

      const usdtContract = new ethers.Contract(usdtAddress, PublicTokenABI.abi, ethersSigner);
      
      // Gọi userMint function (1000 USDT)
      const tx = await usdtContract.userMint();
      setMessage("Đang chờ transaction confirm...");
      await tx.wait();
      
      setMessage("✅ Mint USDT thành công! (1000 USDT)");
      
      // Refresh balance
      await checkUsdtBalance();
    } catch (error: unknown) {
      console.error('Error minting USDT:', error);
      setMessage(`Mint USDT thất bại: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsMintingUsdt(false);
    }
  };

  // Tự động check ETH và USDT balance khi có signer
  useEffect(() => {
    if (ethersSigner && mounted) {
      checkEthBalance();
      checkUsdtBalance();
    }
  }, [ethersSigner, mounted, checkEthBalance, checkUsdtBalance]);

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="text-center">
          <p className="text-lg">Loading Token Faucet...</p>
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


  return (
    <div className="flex flex-col items-center justify-center p-8">
      {/* Token Faucet Card */}
      <div className="mb-8 w-full max-w-2xl border border-gray-300 rounded-lg p-6 bg-white shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Token Faucet</h2>
        
        {/* Single Column Layout - chỉ hiển thị ERC20 Token */}
        <div className="w-full max-w-md mx-auto">
          {/* Your ERC20 Token */}
          <div>
            <button className="bg-gray-500 text-white font-bold py-2 px-3 rounded w-full text-sm mb-3">
              Your ERC20 Token
            </button>
            <div className="flex gap-2 mb-4">
              <button
                disabled
                className="bg-gray-100 text-gray-800 font-bold py-2 px-4 rounded flex-1 cursor-default"
              >
                ETH
              </button>
              <button
                onClick={checkEthBalance}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded flex-1"
                title="Check ETH balance in wallet"
              >
                {ethBalance}
              </button>
            </div>
            <div className="flex gap-2 mb-4">
              <button
                disabled
                className="bg-gray-100 text-gray-800 font-bold py-2 px-4 rounded flex-1 cursor-default"
              >
                USDT
              </button>
              <button
                onClick={checkUsdtBalance}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded flex-1"
                title="Check USDT balance in wallet"
              >
                {usdtBalance}
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={mintUsdt}
                disabled={isMintingUsdt}
                className="zama-yellow disabled:bg-gray-400 text-black font-bold py-2 px-4 rounded flex-1"
              >
                {isMintingUsdt ? 'Minting...' : 'Mint USDT'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
