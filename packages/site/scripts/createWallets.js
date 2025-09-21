const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Script tạo ví và lưu vào file
function createWallets() {
  console.log('🔐 Wallet Generator');
  console.log('==================\n');
  
  // Lấy số lượng từ command line argument
  const count = process.argv[2] ? parseInt(process.argv[2]) : 5;
  
  if (isNaN(count) || count <= 0) {
    console.log('❌ Invalid number. Please provide a positive number.');
    console.log('Usage: node createWallets.js [number]');
    console.log('Example: node createWallets.js 10');
    return;
  }
  
  console.log(`Generating ${count} wallets...\n`);
  
  const wallets = [];
  
  for (let i = 0; i < count; i++) {
    const wallet = ethers.Wallet.createRandom();
    
    wallets.push({
      index: i + 1,
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic?.phrase || 'N/A'
    });
    
    console.log(`✅ Wallet ${i + 1} created`);
  }
  
  // Tạo nội dung file
  const fileContent = `# WALLETS GENERATED - ${new Date().toISOString()}
# Total: ${count} wallets

${wallets.map(wallet => 
`## Wallet ${wallet.index}
Address:    ${wallet.address}
Private Key: ${wallet.privateKey}
Mnemonic:   ${wallet.mnemonic}
`).join('\n')}

⚠️  IMPORTANT SECURITY NOTES:
- Keep private keys SECRET and NEVER share them
- Store private keys in a secure location
- Never commit private keys to version control
- Use these wallets only for testing on Sepolia testnet
`;

  // Lưu file
  const fileName = `wallets_${count}_${Date.now()}.txt`;
  const filePath = path.join(__dirname, fileName);
  fs.writeFileSync(filePath, fileContent);
  
  console.log(`\n📄 Wallets saved to: ${fileName}`);
  console.log(`📁 Full path: ${filePath}`);
  console.log(`\n⚠️  IMPORTANT: Keep the private keys SECRET!`);
  
  return wallets;
}

// Chạy script
createWallets();
