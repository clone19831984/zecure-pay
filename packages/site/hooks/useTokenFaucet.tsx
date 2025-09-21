"use client";

import { ethers, Contract } from "ethers";
import {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";

// ABI và addresses được import từ genabi script
import { ConfidentialTokenAddresses } from "@/abi/ConfidentialTokenAddresses";
import { ConfidentialTokenABI } from "@/abi/ConfidentialTokenABI";

export type ClearValueType = {
  handle: string;
  clear: string | bigint | boolean;
};

type TokenInfoType = {
  abi: typeof ConfidentialTokenABI.abi;
  address?: `0x${string}`;
  chainId?: number;
  chainName?: string;
};

/**
 * Lấy thông tin ConfidentialToken contract từ chainId
 */
function getConfidentialTokenByChainId(
  chainId: number | undefined
): TokenInfoType {
  if (!chainId) {
    return { abi: ConfidentialTokenABI.abi };
  }

  const entry =
    ConfidentialTokenAddresses[chainId.toString() as keyof typeof ConfidentialTokenAddresses];

  if (!entry || !("address" in entry) || entry.address === ethers.ZeroAddress) {
    return { abi: ConfidentialTokenABI.abi, chainId };
  }

  return {
    address: entry?.address as `0x${string}` | undefined,
    chainId: entry?.chainId ?? chainId,
    chainName: entry?.chainName,
    abi: ConfidentialTokenABI.abi,
  };
}

/**
 * Hook để quản lý ConfidentialToken
 * Cho phép user mint token với FHE encryption
 */
export const useTokenFaucet = (parameters: {
  instance: FhevmInstance | undefined;
  fhevmDecryptionSignatureStorage: GenericStringStorage;
  eip1193Provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
}) => {
  const {
    instance,
    fhevmDecryptionSignatureStorage,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
  } = parameters;

  //////////////////////////////////////////////////////////////////////////////
  // States + Refs
  //////////////////////////////////////////////////////////////////////////////

  const [balance, setBalance] = useState<bigint | undefined>(undefined);
  const [decryptedBalance, setDecryptedBalance] = useState<string | null>(null);
  const [isMinting, setIsMinting] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  const isRefreshingRef = useRef<boolean>(isRefreshing);
  const isMintingRef = useRef<boolean>(isMinting);

  //////////////////////////////////////////////////////////////////////////////
  // Contract Info
  //////////////////////////////////////////////////////////////////////////////

  const token = useMemo(() => {
    const tokenInfo = getConfidentialTokenByChainId(chainId);
    if (!tokenInfo.address) {
      setMessage(`ConfidentialToken deployment not found for chainId=${chainId}.`);
    }
    return tokenInfo;
  }, [chainId]);

  const isDeployed = useMemo(() => {
    return Boolean(token.address);
  }, [token.address]);

  const canMint = useMemo(() => {
    return (
      token.address &&
      instance &&
      ethersSigner &&
      !isRefreshing &&
      !isMinting
    );
  }, [
    token.address,
    instance,
    ethersSigner,
    isRefreshing,
    isMinting,
  ]);

  //////////////////////////////////////////////////////////////////////////////
  // Get Balance
  //////////////////////////////////////////////////////////////////////////////

  const refreshBalance = useCallback(() => {
    if (isRefreshingRef.current) {
      return;
    }

    if (!token.address || !ethersReadonlyProvider || !ethersSigner) {
      setBalance(undefined);
      return;
    }

    isRefreshingRef.current = true;
    setIsRefreshing(true);

    const thisTokenAddress = token.address;
    const thisEthersSigner = ethersSigner;

    // Tạo contract instance để gọi balanceOf
    const tokenContract = new ethers.Contract(
      thisTokenAddress,
      token.abi,
      ethersReadonlyProvider
    );

    tokenContract
      .confidentialBalanceOf(thisEthersSigner.address)
      .then((value) => {
        if (thisTokenAddress === token.address) {
          // confidentialBalanceOf trả về encrypted data, không thể hiển thị trực tiếp
          // Chỉ cần biết có balance hay không (không phải 0)
          setBalance(value ? BigInt(1) : BigInt(0));
        }

        isRefreshingRef.current = false;
        setIsRefreshing(false);
      })
      .catch((e) => {
        setMessage("Token balance check failed! error=" + e);

        isRefreshingRef.current = false;
        setIsRefreshing(false);
      });
  }, [token.address, token.abi, ethersReadonlyProvider, ethersSigner, chainId]);

  //////////////////////////////////////////////////////////////////////////////
  // Decrypt Balance
  //////////////////////////////////////////////////////////////////////////////

  const decryptBalance = useCallback(async () => {
    if (!instance || !ethersSigner || !token.address) {
      setMessage("Không thể decrypt: thiếu thông tin cần thiết");
      return;
    }

    try {
      setMessage("Đang decrypt balance...");
      
      // Lấy địa chỉ user hiện tại
      const userAddr = await ethersSigner.getAddress();
      
      // Tạo contract instance với signer để có thể gọi write functions
      const contractWithSigner = new Contract(token.address, token.abi, ethersSigner);
      const contractReadOnly = new Contract(token.address, token.abi, ethersReadonlyProvider);
      
      // Bước 1: Allow decrypt cho chính mình
      setMessage("Đang cho phép decrypt...");
      const allowTx = await contractWithSigner.allowSelfBalanceDecrypt();
      await allowTx.wait();
      
      // Bước 2: Lấy balance encrypted từ contract
      setMessage("Đang lấy encrypted balance...");
      const balanceEncrypted = await contractReadOnly.confidentialBalanceOf(userAddr);
      
      // Lấy handle từ ciphertext
      const handle = balanceEncrypted?.handle || balanceEncrypted;
      if (!handle) {
        setMessage("Không thể lấy encrypted balance");
        return;
      }

      // Tạo keypair để ký yêu cầu decrypt
      const { privateKey, publicKey } = instance.generateKeypair();
      
      // Chuẩn bị EIP-712 và ký
      const startTimeStamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = "10";
      const contractAddresses = [token.address];
      
      const eip712 = instance.createEIP712(
        publicKey,
        contractAddresses,
        startTimeStamp,
        durationDays
      );
      
      const signature = await (ethersSigner as any).signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message
      );
      
      // Bước 3: Gọi userDecrypt
      setMessage("Đang decrypt...");
      const result = await instance.userDecrypt(
        [{ handle, contractAddress: token.address }],
        privateKey,
        publicKey,
        signature.replace("0x", ""),
        contractAddresses,
        userAddr,
        startTimeStamp,
        durationDays
      );
      
      const weiBn = result[handle];
      const formattedBalance = ethers.formatUnits(weiBn, 6); // 6 decimals
      setDecryptedBalance(formattedBalance);
      setMessage(`✅ Balance đã được decrypt: ${formattedBalance} tokens`);
      
    } catch (error: any) {
      console.error("Decrypt balance error:", error);
      setMessage(`Decrypt thất bại: ${error.message}`);
    }
  }, [instance, ethersSigner, token.address, token.abi, ethersReadonlyProvider]);

  // Auto refresh balance
  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  //////////////////////////////////////////////////////////////////////////////
  // AirDrop Token (User claim)
  //////////////////////////////////////////////////////////////////////////////

  /**
   * AirDrop token với FHE encryption (User claim tokens)
   */
  const airDropToken = useCallback((amount: bigint) => {
    if (isRefreshingRef.current || isMintingRef.current) {
      return;
    }

    if (!token.address || !instance || !ethersSigner) {
      return;
    }

    const thisChainId = chainId;
    const thisTokenAddress = token.address;
    const thisEthersSigner = ethersSigner;

    isMintingRef.current = true;
    setIsMinting(true);
    setMessage("Đang chuẩn bị airdrop token...");

    const run = async () => {
      const isStale = () =>
        thisTokenAddress !== token.address;

      try {
        // Tạo encrypted input cho airdrop amount
        const input = instance.createEncryptedInput(
          thisTokenAddress,
          thisEthersSigner.address
        );
        
        // Thêm airdrop amount
        input.add64(amount);

        setMessage("Đang mã hóa dữ liệu...");

        // Mã hóa input
        const enc = await input.encrypt();

        if (isStale()) {
          setMessage("Bỏ qua airdrop token");
          return;
        }

        setMessage("Đang gửi transaction airdrop...");

        // Tạo contract instance với user signer
        const tokenContract = new ethers.Contract(
          thisTokenAddress,
          token.abi,
          thisEthersSigner
        );

        // Gọi airDrop function (user claim)
        const tx: ethers.TransactionResponse = await tokenContract.airDrop(
          enc.handles[0],
          enc.inputProof
        );

        setMessage("Đang chờ transaction confirm...");
        await tx.wait();

        if (isStale()) {
          setMessage("Bỏ qua airdrop token");
          return;
        }

        setMessage("✅ AirDrop token thành công!");
        
        // Refresh lại balance sau khi airdrop
        refreshBalance();
      } catch (error: any) {
        setMessage(`Airdrop thất bại: ${error.message}`);
      } finally {
        isMintingRef.current = false;
        setIsMinting(false);
      }
    };

    run();
  }, [
    token.address,
    token.abi,
    instance,
    ethersSigner,
    chainId,
    refreshBalance,
  ]);

  //////////////////////////////////////////////////////////////////////////////
  // Mint Token (Owner only)
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Mint token với FHE encryption (Owner mint cho user)
   */
  const mintToken = useCallback((amount: bigint) => {
    if (isRefreshingRef.current || isMintingRef.current) {
      return;
    }

    if (!token.address || !instance || !ethersSigner) {
      return;
    }

    const thisChainId = chainId;
    const thisTokenAddress = token.address;
    const thisEthersSigner = ethersSigner;

    isMintingRef.current = true;
    setIsMinting(true);
    setMessage("Đang chuẩn bị mint token...");

    const run = async () => {
      const isStale = () =>
        thisTokenAddress !== token.address;

      try {
        // Tạo encrypted input cho mint amount
        const input = instance.createEncryptedInput(
          thisTokenAddress,
          thisEthersSigner.address
        );
        
        // Thêm mint amount
        input.add64(amount);

        setMessage("Đang mã hóa dữ liệu...");

        // Mã hóa input
        const enc = await input.encrypt();

        if (isStale()) {
          setMessage("Bỏ qua mint token");
          return;
        }

        setMessage("Đang gửi transaction mint...");

        // Tạo contract instance để gọi mintConfidential
        const tokenContract = new ethers.Contract(
          thisTokenAddress,
          token.abi,
          thisEthersSigner
        );

        // Gọi mintConfidential function
        const tx: ethers.TransactionResponse = await tokenContract.mintConfidential(
          thisEthersSigner.address,
          enc.handles[0],
          enc.inputProof
        );

        setMessage(`Đang chờ transaction: ${tx.hash}...`);

        const receipt = await tx.wait();

        setMessage(`Mint token thành công! Status: ${receipt?.status}`);

        if (isStale()) {
          setMessage("Bỏ qua mint token");
          return;
        }

        // Refresh lại balance
        refreshBalance();
      } catch (error: any) {
        setMessage(`Mint token thất bại: ${error.message}`);
      } finally {
        isMintingRef.current = false;
        setIsMinting(false);
      }
    };

    run();
  }, [
    token.address,
    token.abi,
    instance,
    ethersSigner,
    chainId,
    refreshBalance,
  ]);

  return {
    contractAddress: token.address,
    canMint,
    airDropToken,
    mintToken,
    refreshBalance,
    decryptBalance,
    balance,
    decryptedBalance,
    message,
    isMinting,
    isRefreshing,
    isDeployed,
  };
};