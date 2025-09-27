# ZecurePay - Secure Payroll Platform

ZecurePay is a secure payroll platform built on Zama's Fully Homomorphic Encryption (FHE) technology, enabling private processing of sensitive financial data on the Ethereum blockchain.

## 📋 Table of Contents

- [Part 1: Introduction to ZecurePay](#part-1-introduction-to-zecurepay)
- [Part 2: Deployment Guide](#part-2-deployment-guide)
- [Part 3: Frontend Guide](#part-3-frontend-guide)
- [Project Structure](#project-structure)
- [References](#references)

---

## Part 1: Introduction to ZecurePay

### 🔐 Zama's FHE Technology

**Fully Homomorphic Encryption (FHE)** is an advanced encryption technology that allows computations to be performed on encrypted data without needing to decrypt it. This means:

- ✅ **Absolute Privacy**: Data remains encrypted even during processing
- ✅ **Strong Security**: No one can view the data content, including validator nodes
- ✅ **Secure Computation**: Complex calculations can be performed on encrypted data
- ✅ **Transparent Auditing**: All transactions are recorded on blockchain while data remains protected

### 💼 How ZecurePay Works

ZecurePay uses FHE to protect employee salary information:

#### **1. Team Management**
```
Manager Team (2 people) → MGR1, MGR2
Dev Team (5 people)     → DEV1-DEV5  
Marketing Team (7 people) → MAR1-MAR7
```

#### **2. Payroll Process**

**Step 1: Contract Setup**
- Owner deploys `Payroll.sol` smart contract on Sepolia
- Funds contract with USDT for payroll

**Step 2: Salary Transfer (Owner)**
- **Public Transfer**: Transparent salary transfer (amount visible)
- **FHE Transfer**: Private salary transfer (amount encrypted)

**Step 3: Salary Withdrawal (Employee)**
- Employees can view encrypted salary balance
- Request decryption to see actual amount
- Withdraw funds to personal wallet

#### **3. Security Features**

- 🔒 **Encrypted Salaries**: Only owner and corresponding employee can decrypt
- 🔄 **Auto-refresh**: Balance automatically updates every 30 seconds
- 👥 **Team Management**: Easy employee grouping by teams
- 📊 **Dashboard**: Monitor contract status and transactions

---

## Part 2: Deployment Guide

### 🚀 System Requirements

- Node.js >= 18.0.0
- npm or yarn
- MetaMask browser extension
- Git

### 📦 Installation

#### **Step 1: Clone Repository**

```bash
git clone https://github.com/clone19831984/zecure-pay
cd zecure-pay
```

#### **Step 2: Install Dependencies**

```bash
# Install dependencies for entire monorepo
npm install

# Or use yarn
yarn install
```

#### **Step 3: Environment Configuration**

Create `.env` file in `packages/site` directory:

```bash
# Sepolia Network Configuration
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# Contract Addresses (will be updated after deployment)
NEXT_PUBLIC_PUBLIC_TOKEN_ADDRESS=
NEXT_PUBLIC_PAYROLL_ADDRESS=
NEXT_PUBLIC_RELAYER_ADDRESS=
```

#### **Step 4: Deploy Smart Contracts**

```bash
# Navigate to contracts directory
cd packages/contracts

# Deploy to Sepolia network
npx hardhat deploy --network sepolia

# Or deploy to local network for testing
npx hardhat deploy --network localhost
```

#### **Step 5: Update Contract Addresses**

After deployment, update contract addresses in `.env` file:

```bash
NEXT_PUBLIC_PUBLIC_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_PAYROLL_ADDRESS=0x...
NEXT_PUBLIC_RELAYER_ADDRESS=0x...
```

### 🌐 MetaMask Configuration

#### **Add Sepolia Network:**

1. Open MetaMask
2. Click network dropdown
3. Select "Add network"
4. Enter information:
   - **Network Name**: Sepolia Testnet
   - **RPC URL**: https://sepolia.infura.io/v3/YOUR_INFURA_KEY
   - **Chain ID**: 11155111
   - **Currency Symbol**: ETH

#### **Add Local Network (for testing):**

- **Network Name**: Hardhat Local
- **RPC URL**: http://127.0.0.1:8545
- **Chain ID**: 31337
- **Currency Symbol**: ETH

---

## Part 3: Frontend Guide

### 🎯 Running the Application

#### **Development Mode:**

```bash
# From packages/site directory
npm run dev

# Or
yarn dev
```

Access: `http://localhost:3000`

#### **Production Build:**

```bash
# Build application
npm run build

# Run production server
npm start
```

### 🔧 Component Structure

#### **Core Components:**

- **`TabNavigation.tsx`**: Navigation between tabs
- **`FundContract.tsx`**: Contract fund management (Owner only)
- **`SalaryPayment.tsx`**: Salary payment and withdrawal
- **`Faucet.tsx`**: Get test USDT
- **`SubmitPayrollForm.tsx`**: Payroll registration form

#### **Hooks:**

- **`usePayroll.tsx`**: Manages all smart contract interactions
- **`useFhevmContext.tsx`**: Context for FHEVM operations

### 👤 User Guide

#### **For Owner (Management):**

1. **Connect Wallet**: Click "Connect Wallet" in top right corner
2. **Dashboard**: 
   - Deposit USDT into contract
   - Withdraw USDT from contract
   - View contract balance
3. **Salary Payment**:
   - Select employee from dropdown
   - Enter amount
   - Choose "Public Transfer" or "FHE Transfer"

#### **For Employee:**

1. **Connect Wallet**: Ensure wallet is registered in the system
2. **View Salary**: 
   - "Salary Payment" tab shows salary balance
   - Click "Allow Decrypt" to view actual amount
3. **Withdraw Salary**:
   - Enter amount to withdraw
   - Click "Withdraw"

#### **Faucet (Test USDT):**

1. Connect wallet
2. Click "Get Test USDT" to receive 1000 test USDT

### 🐛 Troubleshooting

#### **Common Issues:**

1. **"Nonce mismatch"**: 
   - Open MetaMask → Settings → Advanced → Clear Activity Tab

2. **"Contract not found"**:
   - Check contract addresses in `.env`
   - Ensure contracts are deployed

3. **"Insufficient balance"**:
   - Use Faucet to get test USDT
   - Check balance in MetaMask

4. **"Network error"**:
   - Check RPC URL
   - Ensure connected to correct network

---

## Project Structure

```
zecure-pay/
├── packages/
│   ├── site/                    # Frontend React app
│   │   ├── app/                # Next.js app directory
│   │   ├── components/         # React components
│   │   ├── hooks/             # Custom hooks
│   │   ├── public/            # Static assets
│   │   └── scripts/           # Utility scripts
│   ├── contracts/             # Smart contracts
│   │   ├── contracts/         # Solidity files
│   │   ├── deploy/           # Deployment scripts
│   │   └── hardhat.config.js  # Hardhat configuration
│   └── shared/               # Shared utilities
├── package.json              # Root package.json
└── README.md                # This file
```

### 📁 Key Files:

- **`groups.ts`**: Defines employee groups
- **`company.txt`**: Employee wallet list with private keys
- **`Payroll.sol`**: Main payroll smart contract
- **`PublicToken.sol`**: USDT token contract

---

## References

### 📚 Zama Documentation:
- [FHEVM Documentation](https://docs.zama.ai/protocol/solidity-guides/)
- [FHEVM Hardhat Guide](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat)
- [Relayer SDK](https://docs.zama.ai/protocol/relayer-sdk-guides/)

### 🔗 External Resources:
- [MetaMask Documentation](https://docs.metamask.io/)
- [Ethereum Sepolia Testnet](https://sepolia.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

### 💬 Community:
- [Zama Discord](https://discord.com/invite/zama)
- [GitHub Issues](https://github.com/clone19831984/zecure-pay/issues)

### 🌐 Live Demo:
- **ZecurePay App**: [https://zecurepay.vercel.app/](https://zecurepay.vercel.app/)
- **GitHub Repository**: [https://github.com/clone19831984/zecure-pay](https://github.com/clone19831984/zecure-pay)

---

## 📄 License

This project is licensed under the BSD-3-Clause-Clear License - see the LICENSE file for details.

---

**ZecurePay** - Secure payroll and private payments powered by Zama's FHE technology.
