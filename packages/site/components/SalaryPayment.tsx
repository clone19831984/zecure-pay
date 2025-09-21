"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useFhevmContext } from "../contexts/FhevmContext";
import { useInMemoryStorage } from "../hooks/useInMemoryStorage";
import { usePayrollUSDT } from "../hooks/usePayrollETH";
import { groups, getAllUsers, getGroupByUser, getEmployeeCode } from "../groups";

export const SalaryPayment = () => {
  const [mounted, setMounted] = useState(false);
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    instance: fhevmInstance,
    status: fhevmStatus,
    error: fhevmError,
    provider,
    chainId,
    isConnected,
    ethersSigner,
    ethersReadonlyProvider,
  } = useFhevmContext();

  const {
    status,
    error,
    deposit,
    depositToManyUsers,
    withdraw,
    allowDecryptForMe,
    fetchBalance,
    decryptedBalance,
    isOwner,
  } = usePayrollUSDT({
    fhevmInstance,
    ethersSigner,
    ethersReadonlyProvider,
    chainId,
    fhevmDecryptionSignatureStorage,
  });

  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [publicBalance, setPublicBalance] = useState<string>("0");
  
  // State cho gửi lương nhiều user
  const [bulkRecipients, setBulkRecipients] = useState("");
  const [bulkAmounts, setBulkAmounts] = useState("");
  
  // State cho dropdown chọn user
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userAmounts, setUserAmounts] = useState<Record<string, string>>({});
  
  // State cho chọn từng user riêng lẻ
  const [selectedIndividualUsers, setSelectedIndividualUsers] = useState<string[]>([]);
  const [individualUserAmounts, setIndividualUserAmounts] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
    // Reset states để tránh hardcode data
    setSelectedIndividualUsers([]);
    setIndividualUserAmounts({});
    setSelectedGroup("");
    setSelectedUsers([]);
    setUserAmounts({});
  }, []);

  // Load USDT public balance when component mounts
  useEffect(() => {
    const loadUsdtBalance = async () => {
      if (ethersReadonlyProvider && ethersSigner) {
        try {
          // Import USDT contract addresses and ABI
          const { PublicTokenAddresses } = await import("../abi/PublicTokenAddresses");
          const { PublicTokenABI } = await import("../abi/PublicTokenABI");
          
          const usdtAddress = PublicTokenAddresses["11155111"]?.address;
          if (!usdtAddress) {
            setPublicBalance("0");
            return;
          }

          const usdtContract = new ethers.Contract(usdtAddress, PublicTokenABI.abi, ethersReadonlyProvider);
          const balance = await usdtContract.balanceOf(ethersSigner.address);
          const usdtBalanceFormatted = ethers.formatUnits(balance, 6); // USDT có 6 decimals
          const formattedWithCommas = Number(usdtBalanceFormatted).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });
          setPublicBalance(formattedWithCommas);
        } catch (error) {
          console.error("Error loading USDT balance:", error);
          setPublicBalance("0");
        }
      }
    };

    loadUsdtBalance();
  }, [ethersReadonlyProvider, ethersSigner]);

  // Function để xử lý bulk deposit
  const handleBulkDeposit = () => {
    const recipients = bulkRecipients.split(',').map(addr => addr.trim()).filter(addr => addr);
    const amounts = bulkAmounts.split(',').map(amount => amount.trim()).filter(amount => amount);
    
    if (recipients.length === 0 || amounts.length === 0) {
      alert("Please enter recipients and amounts");
      return;
    }
    
    if (recipients.length !== amounts.length) {
      alert("Number of recipients must match number of amounts");
      return;
    }
    
    depositToManyUsers(recipients, amounts);
  };

  // Function để xử lý chọn group
  const handleGroupSelect = (groupName: string) => {
    setSelectedGroup(groupName);
    if (groupName && groups[groupName]) {
      setSelectedUsers(groups[groupName]);
      // Reset amounts khi chọn group mới
      setUserAmounts({});
    } else {
      setSelectedUsers([]);
      setUserAmounts({});
    }
  };

  // Function để gửi lương cho group đã chọn
  const handleGroupPayroll = () => {
    console.log("handleGroupPayroll called");
    console.log("selectedUsers:", selectedUsers);
    console.log("teamAmount:", userAmounts['teamAmount']);
    
    if (selectedUsers.length === 0) {
      alert("Please select a group first");
      return;
    }

    const teamAmount = userAmounts['teamAmount'];
    if (!teamAmount || teamAmount === "" || Number(teamAmount) <= 0) {
      alert("Please enter a valid amount for all team members");
      return;
    }

    // Tạo cùng 1 số tiền cho tất cả user trong team
    const amounts = selectedUsers.map(() => teamAmount);
    
    console.log("Calling depositToManyUsers with:", selectedUsers, amounts);
    depositToManyUsers(selectedUsers, amounts);
  };

  // Function để thêm user vào danh sách khi chọn từ dropdown
  const handleUserSelect = (userAddress: string) => {
    if (userAddress && !selectedIndividualUsers.includes(userAddress)) {
      setSelectedIndividualUsers([...selectedIndividualUsers, userAddress]);
    }
  };

  // Function để xóa user khỏi danh sách
  const handleRemoveUser = (userAddress: string) => {
    setSelectedIndividualUsers(selectedIndividualUsers.filter(u => u !== userAddress));
    const newAmounts = { ...individualUserAmounts };
    delete newAmounts[userAddress];
    setIndividualUserAmounts(newAmounts);
  };

  // Function để gửi lương cho các user đã chọn
  const handleIndividualPayroll = () => {
    console.log("handleIndividualPayroll called");
    console.log("selectedIndividualUsers:", selectedIndividualUsers);
    console.log("individualUserAmounts:", individualUserAmounts);
    
    if (selectedIndividualUsers.length === 0) {
      alert("Please select at least one user");
      return;
    }

    const amounts = selectedIndividualUsers.map(user => individualUserAmounts[user] || "0");
    console.log("amounts:", amounts);
    
    // Kiểm tra validation cho từng amount
    const invalidAmounts = amounts.filter(amount => {
      const numAmount = Number(amount);
      return amount === "" || numAmount <= 0 || isNaN(numAmount);
    });
    
    if (invalidAmounts.length > 0) {
      alert("Please enter valid amounts (greater than 0) for all selected users");
      return;
    }
    
    const validUsers = selectedIndividualUsers.filter((user, index) => amounts[index] && amounts[index] !== "0");
    const validAmounts = amounts.filter(amount => amount && amount !== "0");
    
    console.log("validUsers:", validUsers);
    console.log("validAmounts:", validAmounts);

    if (validUsers.length === 0) {
      alert("Please enter amounts for at least one user");
      return;
    }

    console.log("Calling depositToManyUsers with:", validUsers, validAmounts);
    depositToManyUsers(validUsers, validAmounts);
  };

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="text-center">
          <p className="text-lg">Loading Salary Payment...</p>
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
      {/* Salary Payment Card */}
      {isOwner && (
        <div className="mb-8 w-full max-w-4xl border border-gray-300 rounded-lg p-6 bg-white shadow-md">
          <h2 className="text-2xl font-bold mb-4 text-center">Salary Payment</h2>
          
          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Individual User Payments */}
            <div>
              {/* Pay Salary Section */}
              <div className="mb-6">
                <button className="bg-gray-500 text-white font-bold py-2 px-4 rounded w-full text-sm mb-3">
                  Pay Salary
                </button>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Select User:</label>
                  <select
                    value=""
                    onChange={(e) => handleUserSelect(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded h-10"
                  >
                    <option value="">-- Choose user --</option>
                    {getAllUsers()
                      .filter(user => !selectedIndividualUsers.includes(user))
                      .map((user) => (
                      <option key={user} value={user}>
                        {getEmployeeCode(user)} - {user.slice(0, 6)}...{user.slice(-4)}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedIndividualUsers.length > 0 && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-medium text-blue-800">Set Salaries for Users </h4>
                      <button
                        onClick={() => {
                          setSelectedIndividualUsers([]);
                          setIndividualUserAmounts({});
                        }}
                        className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="space-y-3">
                      {selectedIndividualUsers.map((user) => (
                        <div key={user} className="p-3 bg-white rounded border relative">
                          <button
                            onClick={() => handleRemoveUser(user)}
                            className="absolute top-2 right-2 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            ×
                          </button>
                          <div className="flex items-center justify-between pr-8">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-blue-600">
                                {getEmployeeCode(user)}
                              </div>
                              <div className="text-xs text-gray-500 font-mono">
                                {user.slice(0, 6)}...{user.slice(-4)}
                              </div>
                              <div className="text-xs text-gray-400">
                                {getGroupByUser(user) || "No group"}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-sm text-gray-600">Amount:</label>
                              <input
                                type="number"
                                placeholder="0"
                                min="0"
                                step="0.01"
                                value={individualUserAmounts[user] || ""}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  // Chỉ cho phép số dương và tối đa 2 chữ số thập phân
                                  if (value === "" || (Number(value) >= 0 && /^\d*\.?\d{0,2}$/.test(value))) {
                                    setIndividualUserAmounts({ 
                                      ...individualUserAmounts, 
                                      [user]: value 
                                    });
                                  }
                                }}
                                className="w-20 p-2 text-sm border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedIndividualUsers.length > 0 && (
                  <div className="mb-4">
                    <button
                      onClick={handleIndividualPayroll}
                      disabled={status === "loading"}
                      className="zama-yellow text-black font-bold py-2 px-4 rounded w-full text-sm"
                    >
                      {status === "loading" ? "Processing..." : `Pay Salaries to ${selectedIndividualUsers.length} Users`}
                    </button>
                  </div>
                )}

                <div className="mb-2">
                  <label className="block text-sm font-medium mb-2">Select Other:</label>
                  <input
                    type="text"
                    placeholder="Recipient address"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="border p-2 rounded w-full text-sm font-bold h-10"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Amount in USDT"
                  value={amount || ""}
                  onChange={(e) => setAmount(e.target.value)}
                  className="border p-2 rounded w-full mb-3 text-sm font-bold h-10"
                />
                <button
                  onClick={() => deposit(recipient, amount)}
                  disabled={status === "loading"}
                  className="zama-yellow text-black font-bold py-2 px-4 rounded w-full text-sm"
                >
                  {status === "loading" ? "Processing..." : "Pay Salary"}
                </button>
              </div>
            </div>

            {/* Right Column: Group Payments */}
            <div>
              {/* Group Salary Payment Section */}
              <div className="mb-2">
                <button className="bg-gray-500 text-white font-bold py-2 px-4 rounded w-full text-sm mb-3">
                  Group Salary Payment
                </button>
                
                <div className="mb-2">
                  <label className="block text-sm font-medium mb-2">Select Group:</label>
                  <select
                    value={selectedGroup}
                    onChange={(e) => handleGroupSelect(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded mb-2 h-10"
                  >
                    <option value="">-- Choose a group --</option>
                    {Object.keys(groups).map((groupName) => (
                      <option key={groupName} value={groupName}>
                        {groupName} ({groups[groupName].length} members)
                      </option>
                    ))}
                  </select>
                </div>

                {selectedUsers.length > 0 && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-medium text-blue-800">Members of {selectedGroup}</h4>
                    </div>
                    <div className="space-y-3">
                      {selectedUsers.map((user, index) => (
                        <div key={user} className="p-3 bg-white rounded border relative">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-blue-600">
                                {getEmployeeCode(user)}
                              </div>
                              <div className="text-xs text-gray-500 font-mono">
                                {user.slice(0, 6)}...{user.slice(-4)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Single amount input for all team members */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium mb-2">Amount for all members (USDT):</label>
                      <input
                        type="number"
                        placeholder="Enter amount for all team members"
                        min="0"
                        step="0.01"
                        value={userAmounts['teamAmount'] || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Chỉ cho phép số dương và tối đa 2 chữ số thập phân
                          if (value === "" || (Number(value) >= 0 && /^\d*\.?\d{0,2}$/.test(value))) {
                            setUserAmounts({ ...userAmounts, teamAmount: value });
                          }
                        }}
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {selectedUsers.length > 0 && (
                  <button
                    onClick={handleGroupPayroll}
                    disabled={status === "loading"}
                    className="zama-yellow text-black font-bold py-2 px-4 rounded w-full text-sm"
                  >
                    {status === "loading" ? "Processing..." : `Pay Salaries to ${selectedGroup}`}
                  </button>
                )}
              </div>

              {/* Bulk Salary Payment Section */}
              <div className="mb-6">
                <div className="mb-0 mt-0">
                  <label className="block text-sm font-medium mb-2">Select Other:</label>
                  <textarea
                    placeholder="0x123..., 0x456..., 0x789..."
                    value={bulkRecipients}
                    onChange={(e) => setBulkRecipients(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded mb-0 text-sm h-[88px]"
                    rows={3}
                  />
                </div>
                
                <div className="mb-0">
                  <label className="block text-sm font-medium mb-2">Amounts (USDT):</label>
                  <textarea
                    placeholder="100, 200, 150"
                    value={bulkAmounts}
                    onChange={(e) => setBulkAmounts(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded mb-2 text-sm h-20"
                    rows={2}
                  />
                </div>
                
                <button
                  onClick={handleBulkDeposit}
                  disabled={status === "loading"}
                  className="zama-yellow text-black font-bold py-2 px-4 rounded w-full text-sm"
                >
                  {status === "loading" ? "Processing..." : "Pay Salaries to All"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User: Your Salary - chỉ hiện khi không phải owner */}
      {!isOwner && (
        <div className="mb-8 w-full max-w-4xl">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Your Salary</h3>
            
            {/* Two Row Layout for first 2 columns, then Withdraw column */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Column 1 & 2: Original structure */}
              <div className="md:col-span-2">
                <div className="flex gap-6 mb-4">
                  <button
                    disabled
                    className="bg-gray-100 text-gray-800 font-bold py-2 px-4 rounded flex-1 cursor-default"
                  >
                    USDT
                  </button>
                  <button
                    disabled
                    className="bg-gray-100 text-gray-800 font-bold py-2 px-4 rounded flex-1 cursor-default"
                  >
                    {decryptedBalance !== undefined ? Number(decryptedBalance).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }) : "Encrypted"}
                  </button>
                </div>
                <div className="flex gap-6">
                  <button
                    onClick={allowDecryptForMe}
                    disabled={status === "loading"}
                    className="zama-yellow disabled:bg-gray-400 text-black font-bold py-2 px-4 rounded flex-1"
                  >
                    Allow Decrypt
                  </button>
                  <button
                    onClick={() => fetchBalance()}
                    disabled={status === "loading"}
                    className="zama-yellow disabled:bg-gray-400 text-black font-bold py-2 px-4 rounded flex-1"
                  >
                    {status === "loading" ? "Loading..." : "Fetch Balance"}
                  </button>
                </div>
              </div>

              {/* Column 3: Withdraw */}
              <div>
                <input
                  type="text"
                  placeholder="Amount in USDT"
                  value={amount || ""}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-sm h-10 mb-4"
                />
                <button
                  onClick={() => withdraw(amount)}
                  disabled={status === "loading"}
                  className="zama-yellow disabled:bg-gray-400 text-black font-bold py-2 px-4 rounded w-full"
                >
                  {status === "loading" ? "Processing..." : "Withdraw USDT"}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-600 text-sm mt-4">{error}</p>
            )}
          </div>
        </div>
      )}

      {/* User: Transfer - chỉ hiện khi không phải owner */}
      {!isOwner && (
        <div className="mb-8 w-full max-w-4xl">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Your Portfolio</h3>
            
            {/* Three Column Layout: Balance, Public Transfer & FHE Transfer */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Balance */}
              <div>
                <button className="bg-gray-500 text-white font-bold py-2 px-4 rounded w-full text-sm mb-3">
                  Balance
                </button>
                <button
                  disabled
                  className="bg-gray-100 text-gray-800 font-bold py-2 px-4 rounded w-full cursor-default mb-4"
                >
                  USDT
                </button>
                <button
                  disabled
                  className="bg-gray-100 text-gray-800 font-bold py-2 px-4 rounded w-full cursor-default"
                >
                  {publicBalance}
                </button>
              </div>

              {/* Middle Column: Public Transfer */}
              <div>
                <button className="bg-gray-500 text-white font-bold py-2 px-4 rounded w-full text-sm mb-3">
                  Public Transfer
                </button>
                <div className="flex gap-1 mb-4">
                  <input
                    type="text"
                    placeholder="Address"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded text-sm h-10"
                  />
                  <input
                    type="text"
                    placeholder="Amount"
                    value={amount ? Number(amount).toLocaleString('en-US') : ""}
                    onChange={(e) => {
                      const numericValue = e.target.value.replace(/,/g, '');
                      if (!isNaN(Number(numericValue)) || numericValue === '') {
                        setAmount(numericValue);
                      }
                    }}
                    className="w-12 p-2 border border-gray-300 rounded text-sm h-10"
                  />
                </div>
                <button
                  onClick={() => deposit(recipient, amount)}
                  disabled={status === "loading"}
                  className="zama-yellow disabled:bg-gray-400 text-black font-bold py-2 px-4 rounded w-full"
                >
                  {status === "loading" ? "Processing..." : "Transfer Public"}
                </button>
              </div>

              {/* Right Column: FHE Transfer */}
              <div>
                <button className="bg-gray-500 text-white font-bold py-2 px-4 rounded w-full text-sm mb-3">
                  Transfer FHE
                </button>
                <div className="flex gap-1 mb-4">
                  <input
                    type="text"
                    placeholder="Address"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded text-sm h-10"
                  />
                  <input
                    type="text"
                    placeholder="Amount"
                    value={amount ? Number(amount).toLocaleString('en-US') : ""}
                    onChange={(e) => {
                      const numericValue = e.target.value.replace(/,/g, '');
                      if (!isNaN(Number(numericValue)) || numericValue === '') {
                        setAmount(numericValue);
                      }
                    }}
                    className="w-12 p-2 border border-gray-300 rounded text-sm h-10"
                  />
                </div>
                <button
                  onClick={() => deposit(recipient, amount)}
                  disabled={status === "loading"}
                  className="zama-yellow disabled:bg-gray-400 text-black font-bold py-2 px-4 rounded w-full"
                >
                  {status === "loading" ? "Processing..." : "Transfer FHE"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
