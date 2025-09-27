import { useState, useCallback, useEffect } from "react";
import { Contract, ethers } from "ethers";
import { FhevmDecryptionSignature } from "../fhevm/FhevmDecryptionSignature";

import { PayrollABI } from "@/abi/PayrollABI"; // ABI của Payroll
import { PayrollAddresses } from "@/abi/PayrollAddresses"; // Addresses của Payroll
import { PublicTokenABI } from "@/abi/PublicTokenABI"; // ABI của PublicToken (USDT)
import { PublicTokenAddresses } from "@/abi/PublicTokenAddresses"; // Addresses của PublicToken

interface UsePayrollProps {
  fhevmInstance: any;
  ethersSigner: ethers.Signer | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  chainId: number | undefined;
  fhevmDecryptionSignatureStorage: any;
}

export function usePayroll({
  fhevmInstance,
  ethersSigner,
  ethersReadonlyProvider,
  chainId,
  fhevmDecryptionSignatureStorage,
}: UsePayrollProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [error, setError] = useState<string | null>(null);
  
  // Separate states for different operations
  const [depositStatus, setDepositStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [withdrawStatus, setWithdrawStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [balanceStatus, setBalanceStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [payrollStatus, setPayrollStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [allowDecryptStatus, setAllowDecryptStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [decryptedBalance, setDecryptedBalance] = useState<string | undefined>();
  const [users, setUsers] = useState<string[]>([]);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [contractBalance, setContractBalance] = useState<string>("0");

  // Lấy địa chỉ contract từ Sepolia network
  const CONTRACT_ADDRESS = PayrollAddresses["11155111"].address;
  const TOKEN_ADDRESS = PublicTokenAddresses["11155111"].address;

  const getContract = useCallback(() => {
    if (!ethersSigner && !ethersReadonlyProvider) return null;
    return new Contract(CONTRACT_ADDRESS, PayrollABI.abi, ethersSigner || ethersReadonlyProvider);
  }, [ethersSigner, ethersReadonlyProvider]);

  const getTokenContract = useCallback(() => {
    if (!ethersSigner && !ethersReadonlyProvider) return null;
    return new Contract(TOKEN_ADDRESS, PublicTokenABI.abi, ethersSigner || ethersReadonlyProvider);
  }, [ethersSigner, ethersReadonlyProvider]);

  /// Owner nạp USDT vào contract (chưa phân bổ)
  const depositToContract = useCallback(
    async (amountUsdt: string) => {
      if (!ethersSigner) return;
      try {
        setDepositStatus("loading");
        setError(null);

        const contract = getContract();
        const tokenContract = getTokenContract();
        if (!contract || !tokenContract) throw new Error("Contract not available");

        const amount = ethers.parseUnits(amountUsdt, 6); // USDT có 6 decimals

        // Bước 1: Approve token cho contract
        const approveTx = await tokenContract.approve(CONTRACT_ADDRESS, amount);
        await approveTx.wait();

        // Bước 2: Fund contract
        const tx = await contract.fundContract(amount);
        await tx.wait();

        setDepositStatus("success");
      } catch (err: any) {
        console.error(err);
        setError(err.message);
        setDepositStatus("error");
      }
    },
    [ethersSigner, getContract, getTokenContract, CONTRACT_ADDRESS]
  );

  /// Owner trả lương (sendToUser)
  const deposit = useCallback(
    async (user: string, amountUsdt: string) => {
      if (!fhevmInstance || !ethersSigner || !chainId) return;
      try {
        setPayrollStatus("loading");
        setError(null);

        const contract = getContract();
        if (!contract) throw new Error("Contract not available");

        // chuẩn bị encrypted input
        const parsedAmount = ethers.parseUnits(amountUsdt, 6); // USDT có 6 decimals
        
        const input = fhevmInstance.createEncryptedInput(CONTRACT_ADDRESS, await ethersSigner.getAddress());
        input.add128(parsedAmount);
        const encryptedAmount = await input.encrypt();

        const tx = await contract.sendToUser(user, encryptedAmount.handles[0], encryptedAmount.inputProof);
        await tx.wait();

        setPayrollStatus("success");
        // Refresh contract balance sau khi trả lương
        await getContractBalance();
      } catch (err: any) {
        console.error(err);
        setError(err.message);
        setPayrollStatus("error");
      }
    },
    [fhevmInstance, ethersSigner, chainId, getContract]
  );

  /// Owner trả lương cho nhiều user cùng lúc
  const depositToManyUsers = useCallback(
    async (recipients: string[], amounts: string[]) => {
      
      if (!fhevmInstance || !ethersSigner || !chainId) {
        console.error("Missing required dependencies:", { fhevmInstance: !!fhevmInstance, ethersSigner: !!ethersSigner, chainId });
        return;
      }
      
      try {
        setPayrollStatus("loading");
        setError(null);

        const contract = getContract();
        if (!contract) {
          console.error("Contract not available");
          throw new Error("Contract not available");
        }

        if (recipients.length !== amounts.length) {
          console.error("Length mismatch:", recipients.length, amounts.length);
          throw new Error("Recipients and amounts length mismatch");
        }

        // Tạo 1 encrypted input duy nhất cho tất cả amounts
        const input = fhevmInstance.createEncryptedInput(CONTRACT_ADDRESS, await ethersSigner.getAddress());
        
        // Add tất cả amounts vào cùng 1 input
        for (let i = 0; i < amounts.length; i++) {
          input.add128(ethers.parseUnits(amounts[i], 6)); // USDT có 6 decimals
        }
        
        // Encrypt 1 lần duy nhất để có 1 proof cho tất cả
        const encrypted = await input.encrypt();
        
        // Tạo mảng handles cho contract (mỗi user 1 handle)
        const encryptedAmounts = encrypted.handles;

        
        // Kiểm tra contract balance trước khi gọi
        try {
          const tokenContract = getTokenContract();
          if (tokenContract) {
            const balance = await tokenContract.balanceOf(CONTRACT_ADDRESS);
          }
        } catch (err) {
          console.warn("Could not check contract balance:", err);
        }
        
        // Gọi contract với tất cả encrypted amounts và 1 proof duy nhất
        const tx = await contract.sendToManyUsers(recipients, encryptedAmounts, encrypted.inputProof);
        await tx.wait();

        setPayrollStatus("success");
        // Refresh contract balance sau khi trả lương
        if (ethersSigner) {
          try {
            const tokenContract = getTokenContract();
            if (tokenContract) {
              const balance = await tokenContract.balanceOf(CONTRACT_ADDRESS);
              setContractBalance(ethers.formatUnits(balance, 6));
            }
          } catch (err) {
            console.error("Error refreshing balance:", err);
          }
        }
      } catch (err: any) {
        console.error("Error in depositToManyUsers:", err);
        setError(err.message);
        setPayrollStatus("error");
      }
    },
    [fhevmInstance, ethersSigner, chainId, getContract, getTokenContract, CONTRACT_ADDRESS]
  );

  /// User rút USDT
  const withdraw = useCallback(
    async (amountUsdt: string) => {
      if (!fhevmInstance || !ethersSigner || !chainId) return;
      try {
        setWithdrawStatus("loading");
        setError(null);

        const contract = getContract();
        if (!contract) throw new Error("Contract not available");

        const parsedAmount = ethers.parseUnits(amountUsdt, 6); // USDT có 6 decimals
        
        const input = fhevmInstance.createEncryptedInput(CONTRACT_ADDRESS, await ethersSigner.getAddress());
        input.add128(parsedAmount);
        const encryptedAmount = await input.encrypt();

        const tx = await contract.withdraw(
          parsedAmount, // USDT có 6 decimals
          encryptedAmount.handles[0],
          encryptedAmount.inputProof
        );
        await tx.wait();

        setWithdrawStatus("success");
      } catch (err: any) {
        console.error(err);
        setError(err.message);
        setWithdrawStatus("error");
      }
    },
    [fhevmInstance, ethersSigner, chainId, getContract]
  );

  /// User cho phép decrypt balance
  const allowDecryptForMe = useCallback(async () => {
    if (!ethersSigner) return;
    try {
      setAllowDecryptStatus("loading");
      const contract = getContract();
      if (!contract) throw new Error("Contract not available");

      const tx = await contract.allowDecryptForMe();
      await tx.wait();
      setAllowDecryptStatus("success");
    } catch (err) {
      console.error(err);
      setAllowDecryptStatus("error");
    }
  }, [ethersSigner, getContract]);

  /// Owner cho phép decrypt balance của user
  const allowDecryptForOwner = useCallback(async (user: string) => {
    if (!ethersSigner) return;
    try {
      const contract = getContract();
      if (!contract) throw new Error("Contract not available");

      const tx = await contract.allowDecryptForOwner(user);
      await tx.wait();
    } catch (err) {
      console.error(err);
    }
  }, [ethersSigner, getContract]);

  /// Giải mã số dư (userDecrypt) - cần gọi allowDecryptForMe() TRƯỚC đó
  const fetchBalance = useCallback(
    async () => {
      if (!fhevmInstance || !ethersSigner || !chainId) return;
      try {
        setBalanceStatus("loading");
        setError(null);

        const contract = getContract();
        if (!contract) throw new Error("Contract not available");

        // Lấy địa chỉ người dùng hiện tại từ signer (ethers v6)
        const userAddr = await ethersSigner.getAddress();

        // 1) Lấy ciphertext từ contract (euint128)
        const balanceEncrypted = await contract.getBalance(userAddr);

        // Một số provider trả về object có .handle, một số trả thẳng handle
        const handle =
          (balanceEncrypted?.handle as string | undefined) ??
          (balanceEncrypted as unknown as string);

        if (!handle) throw new Error("Invalid ciphertext handle");

        // 2) Tạo keypair tạm thời để ký yêu cầu userDecrypt
        const { privateKey, publicKey } = fhevmInstance.generateKeypair();

        // 3) Chuẩn bị EIP-712 và ký
        const startTimeStamp = Math.floor(Date.now() / 1000).toString();
        const durationDays = "10"; // string
        const contractAddresses = [CONTRACT_ADDRESS];

        const eip712 = fhevmInstance.createEIP712(
          publicKey,
          contractAddresses,
          startTimeStamp,
          durationDays
        );

        // ethers v6: signTypedData(domain, types, value)
        const signature = await (ethersSigner as any).signTypedData(
          eip712.domain,
          { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
          eip712.message
        );

        // 4) Gọi userDecrypt với đầy đủ tham số
        const result = await fhevmInstance.userDecrypt(
          [{ handle, contractAddress: CONTRACT_ADDRESS }],
          privateKey,
          publicKey,
          signature.replace("0x", ""),
          contractAddresses,
          userAddr,
          startTimeStamp,
          durationDays
        );

        const weiBn = result[handle]; // giá trị wei dạng BigInt/string
        if (typeof weiBn === 'boolean') {
          setError("Invalid balance value");
          setBalanceStatus("error");
          return;
        }
        setDecryptedBalance(ethers.formatUnits(weiBn, 6)); // USDT có 6 decimals
        setBalanceStatus("success");
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to fetch balance");
        setBalanceStatus("error");
      }
    },
    [fhevmInstance, ethersSigner, chainId, getContract]
  );

  /// Lấy danh sách users
  const getUsers = useCallback(async () => {
    if (!ethersSigner) return;
    try {
      const contract = getContract();
      if (!contract) throw new Error("Contract not available");

      const usersList = await contract.getUsers();
      setUsers(usersList);
    } catch (err) {
      console.error(err);
    }
  }, [ethersSigner, getContract]);

  /// Kiểm tra xem user hiện tại có phải owner không
  const checkIsOwner = useCallback(async () => {
    if (!ethersSigner) return;
    try {
      const contract = getContract();
      if (!contract) throw new Error("Contract not available");

      const owner = await contract.owner();
      const userAddress = await ethersSigner.getAddress();
      setIsOwner(owner.toLowerCase() === userAddress.toLowerCase());
    } catch (err) {
      console.error(err);
      setIsOwner(false);
    }
  }, [ethersSigner, getContract]);

  /// Owner rút USDT từ contract về ví
  const ownerWithdraw = useCallback(
    async (amountUsdt: string) => {
      if (!ethersSigner) return;
      try {
        setWithdrawStatus("loading");
        setError(null);

        const contract = getContract();
        if (!contract) throw new Error("Contract not available");

        const tx = await contract.ownerWithdraw(ethers.parseUnits(amountUsdt, 6)); // USDT có 6 decimals
        await tx.wait();

        setWithdrawStatus("success");
        // Refresh contract balance sau khi withdraw
        await getContractBalance();
      } catch (err: any) {
        console.error(err);
        setError(err.message);
        setWithdrawStatus("error");
      }
    },
    [ethersSigner, getContract]
  );

  /// Lấy tổng số USDT trong contract
  const getContractBalance = useCallback(async () => {
    if (!ethersSigner) {
      return;
    }
    try {
      setBalanceStatus("loading");
      const tokenContract = getTokenContract();
      if (!tokenContract) throw new Error("Token contract not available");

      const balance = await tokenContract.balanceOf(CONTRACT_ADDRESS);
      const formattedBalance = ethers.formatUnits(balance, 6);
      setContractBalance(formattedBalance);
      setBalanceStatus("success");
    } catch (err) {
      console.error("Error in getContractBalance:", err);
      setBalanceStatus("error");
      setError(err instanceof Error ? err.message : "Failed to fetch balance");
    }
  }, [ethersSigner, getTokenContract, CONTRACT_ADDRESS]);

  /// Effect để check owner khi signer thay đổi
  useEffect(() => {
    if (ethersSigner) {
      checkIsOwner();
      if (isOwner) {
        getContractBalance();
      }
    } else {
      setIsOwner(false);
      setContractBalance("0");
    }
  }, [ethersSigner, checkIsOwner, isOwner, getContractBalance]);

  return {
    status,
    error,
    depositStatus,
    withdrawStatus,
    balanceStatus,
    payrollStatus,
    allowDecryptStatus,
    depositToContract,
    deposit,
    depositToManyUsers,
    withdraw,
    allowDecryptForMe,
    allowDecryptForOwner,
    fetchBalance,
    decryptedBalance,
    getUsers,
    isOwner,
    users,
    ownerWithdraw,
    getContractBalance,
    contractBalance,
  };
}
