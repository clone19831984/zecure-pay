// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint128, externalEuint128} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title Payroll
/// @notice Owner quản lý quỹ USDT (PublicToken) trong contract, gửi lương cho user.
///         User có thể xem số dư (mã hoá) và rút USDT về ví riêng.
contract Payroll is SepoliaConfig {
    address public owner;
    IERC20 public token; // PublicToken (USDT)

    mapping(address => euint128) private balances;
    mapping(address => bool) private _hasUser;
    address[] private users;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address tokenAddress) {
        owner = msg.sender;
        token = IERC20(tokenAddress);
    }

    /// -----------------------------------------------------------------------
    /// OWNER FUNCTIONS
    /// -----------------------------------------------------------------------

    /// @notice Owner nạp USDT vào contract (cần approve trước)
    function fundContract(uint256 amount) external onlyOwner {
        require(amount > 0, "Must send tokens");
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
    }

    /// @notice Owner gửi lương cho 1 user
    function sendToUser(
        address user,
        externalEuint128 inputEuint,
        bytes calldata proof
    ) public onlyOwner {
        euint128 encryptedAmount = FHE.fromExternal(inputEuint, proof);

        if (!_hasUser[user]) {
            users.push(user);
            _hasUser[user] = true;
        }

        balances[user] = FHE.add(balances[user], encryptedAmount);

        FHE.allowThis(balances[user]);
        FHE.allow(balances[user], user);
    }


    /// @notice Owner gửi lương cho nhiều user
    function sendToManyUsers(
        address[] calldata recipients,
        externalEuint128[] calldata inputEuints,
        bytes calldata proof
    ) external onlyOwner {
        require(recipients.length == inputEuints.length, "Length mismatch");

        for (uint256 i = 0; i < recipients.length; i++) {
            euint128 encryptedAmount = FHE.fromExternal(inputEuints[i], proof);

            if (!_hasUser[recipients[i]]) {
                users.push(recipients[i]);
                _hasUser[recipients[i]] = true;
            }

            balances[recipients[i]] = FHE.add(balances[recipients[i]], encryptedAmount);

            FHE.allowThis(balances[recipients[i]]);
            FHE.allow(balances[recipients[i]], recipients[i]);
        }
    }

    /// @notice Owner rút USDT từ contract
    function ownerWithdraw(uint256 amount) external onlyOwner {
        require(token.transfer(owner, amount), "Withdraw failed");
    }

    /// @notice Owner cho phép decrypt số dư user
    function allowDecryptForOwner(address user) external onlyOwner {
        FHE.allow(balances[user], owner);
    }

    /// @notice Owner lấy danh sách user đã nhận lương
    function getUsers() external view onlyOwner returns (address[] memory) {
        return users;
    }

    /// -----------------------------------------------------------------------
    /// USER FUNCTIONS
    /// -----------------------------------------------------------------------

    /// @notice User cho phép tự mình giải mã số dư
    function allowDecryptForMe() external {
        FHE.allow(balances[msg.sender], msg.sender);
    }

    /// @notice User lấy encrypted balance của chính mình
    function getBalance(address user) external view returns (euint128) {
        return balances[user];
    }

    /// @notice User rút USDT về ví
    function withdraw(
        uint256 clearAmount,
        externalEuint128 inputEuint,
        bytes calldata proof
    ) external {
        euint128 encryptedAmount = FHE.fromExternal(inputEuint, proof);

        balances[msg.sender] = FHE.sub(balances[msg.sender], encryptedAmount);

        require(token.transfer(msg.sender, clearAmount), "Withdraw failed");

        FHE.allowThis(balances[msg.sender]);
        FHE.allow(balances[msg.sender], msg.sender);
    }
}
