// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title ConfidentialToken
 * @dev PoC: số dư/amount ở dạng euint64; nhận input kiểu externalEuint64 + proof
 *      Tính toán bằng FHE; không reveal plaintext. Đã clamp transfer để tránh underflow.
 *      Thêm faucet/airdrop tích hợp trong contract.
 */
contract ConfidentialToken is Ownable, SepoliaConfig {
    // Event chỉ log hash/handle để tránh lộ amount
    event ConfidentialMint(address indexed to, bytes32 indexed encHash);
    event ConfidentialTransfer(address indexed from, address indexed to, bytes32 indexed encHash);
    event ConfidentialAirdrop(address indexed user, bytes32 indexed encHash);

    // Metadata: gợi ý dùng 6 dp cho demo
    string public name;
    string public symbol;
    uint8  public decimals;

    // Trạng thái
    mapping(address => bool)    private _initialized;
    mapping(address => euint64) private _balances;

    // Đánh dấu user nào đã claim faucet
    mapping(address => bool) public hasClaimed;

    constructor()
        Ownable(msg.sender)
        SepoliaConfig() // cấu hình coprocessor + decryption oracle cho Sepolia
    {
        name = "Zama USD";
        symbol = "zUSD";
        decimals = 6; // khớp UI: add64(amount * 10^6)
    }

    // ------------------------
    // Helpers (không lộ amount)
    // ------------------------

    function _persistBalance(address who) internal {
        FHE.allowThis(_balances[who]);       // cho contract tái dùng ciphertext
        FHE.allow(_balances[who], who);      // cho chính chủ ví được decrypt
    }

    function _ensureInit(address who) internal {
        if (!_initialized[who]) {
            _initialized[who] = true;
            _balances[who] = FHE.asEuint64(0);
            _persistBalance(who);
        }
    }

    function allowSelfBalanceDecrypt() external {
        _ensureInit(msg.sender);
        euint64 bal = _balances[msg.sender];
        FHE.allow(bal, msg.sender);
    }

    function getEncryptedBalance(address account) external view returns (euint64) {
        return _balances[account];
    }

    function confidentialBalanceOf(address account) external view returns (euint64) {
        return _balances[account];
    }

    function isInitialized(address account) external view returns (bool) {
        return _initialized[account];
    }

    function initializeAddress(address account) external {
        require(!_initialized[account], "Already initialized");
        _ensureInit(account);
    }

    // ------------------------
    // Mint (owner)
    // ------------------------

    function mintConfidential(
        address to,
        externalEuint64 encAmount,
        bytes calldata proof
    ) external onlyOwner {
        _ensureInit(to);

        euint64 amt = FHE.fromExternal(encAmount, proof);

        _balances[to] = FHE.add(_balances[to], amt);
        _persistBalance(to);

        emit ConfidentialMint(to, keccak256(abi.encode(encAmount)));
    }

    // ------------------------
    // Transfer
    // ------------------------

    function transferConfidential(
        address to,
        externalEuint64 encAmount,
        bytes calldata proof
    ) external {
        _ensureInit(msg.sender);
        _ensureInit(to);

        euint64 amt = FHE.fromExternal(encAmount, proof);

        euint64 fromBal = _balances[msg.sender];
        euint64 toBal   = _balances[to];

        ebool lt = FHE.lt(fromBal, amt);
        euint64 delta = FHE.select(lt, fromBal, amt);

        _balances[msg.sender] = FHE.sub(fromBal, delta);
        _balances[to]         = FHE.add(toBal,   delta);

        _persistBalance(msg.sender);
        _persistBalance(to);

        emit ConfidentialTransfer(msg.sender, to, keccak256(abi.encode(encAmount)));
    }

    // ------------------------
    // Faucet / Airdrop
    // ------------------------

    /**
     * @notice Người dùng claim token 1 lần qua SDK
     * @param encAmount externalEuint64 (handle từ createEncryptedInput)
     * @param proof chứng minh từ SDK
     */
    function airDrop(
        externalEuint64 encAmount,
        bytes calldata proof
    ) external {
        require(!hasClaimed[msg.sender], "Already claimed");
        hasClaimed[msg.sender] = true;

        _ensureInit(msg.sender);

        euint64 amt = FHE.fromExternal(encAmount, proof);

        _balances[msg.sender] = FHE.add(_balances[msg.sender], amt);
        _persistBalance(msg.sender);

        emit ConfidentialAirdrop(msg.sender, keccak256(abi.encode(encAmount)));
    }
}
