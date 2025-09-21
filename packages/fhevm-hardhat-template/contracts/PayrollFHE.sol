// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import "./ConfidentialToken.sol";

contract PayrollFHE is SepoliaConfig {
    address public owner;
    ConfidentialToken public token;

    constructor(address _token) {
        owner = msg.sender;
        token = ConfidentialToken(_token);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    /// 🚀 Cách 1: Mint trực tiếp vào Payroll (dùng cho token riêng bạn deploy)
    function fundPayroll(
        externalEuint64 encAmount,
        bytes calldata proof
    ) external onlyOwner {
        token.mintConfidential(address(this), encAmount, proof);
    }

    /// 🚀 Cách 2: Nạp quỹ từ ví owner (dùng cho token cộng đồng, vd ZUSD)
    function fundFromWallet(
        externalEuint64 encAmount,
        bytes calldata proof
    ) external onlyOwner {
        token.transferConfidential(address(this), encAmount, proof);
    }

    /// Trả lương 1 user
    function paySalary(
        address user,
        externalEuint64 encAmount,
        bytes calldata proof
    ) external onlyOwner {
        token.transferConfidential(user, encAmount, proof);
    }

    /// Trả lương nhiều user 1 lần
    function paySalaries(
        address[] calldata users,
        externalEuint64[] calldata encAmounts,
        bytes[] calldata proofs
    ) external onlyOwner {
        require(users.length == encAmounts.length, "Length mismatch");
        require(users.length == proofs.length, "Length mismatch");

        for (uint256 i = 0; i < users.length; i++) {
            token.transferConfidential(users[i], encAmounts[i], proofs[i]);
        }
    }

    /// Xem số dư encrypted của Payroll
    function getPayrollBalance() external view onlyOwner returns (euint64) {
        return token.getEncryptedBalance(address(this));
    }
}
