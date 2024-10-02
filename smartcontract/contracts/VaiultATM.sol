// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.26;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract VaultATM is Ownable, AccessControl {
     using SafeERC20 for IERC20;

    IERC20 public token;
    uint256 public MAX_WITHDRAWAL_AMOUNT  = 100 ether; // 100 tokens
    bool public IS_WITHDRAWAL_ENABLED = true;
    bytes32 public constant WITHDRAWER_ROLE = keccak256("WITHDRAWER_ROLE");
    uint256 public WITHDRAWAL_FEE_PERCENTAGE = 1; // 0.01% = 1 basis point

    event Deposit(
        uint256 playerId,
        address indexed from,
        uint256 amount
    );
    event Withdraw(
        uint256 playerId,
        address indexed to,
        uint256 amount
    );
    constructor(
        address initialOwner
    ) 
        Ownable(initialOwner) 
    {
        _grantRole(WITHDRAWER_ROLE, initialOwner);
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
    }

    function deposit(
        uint256 _amount,
        uint256 _playerId
    ) external {
        require(
            token.balanceOf(msg.sender) >= _amount,
            "Insufficient balance"
        );
        require(_playerId != 0, "Invalid player id");
        token.safeTransferFrom(msg.sender, address(this), _amount);
        emit Deposit(_playerId, msg.sender, _amount);
    }

    function withdraw(
        uint256 _amount,
        uint256 _playerId,
        address _to
    ) external onlyWithdrawer {
        require(IS_WITHDRAWAL_ENABLED, "Withdrawal is disabled");
        require(_amount <= MAX_WITHDRAWAL_AMOUNT, "Exceeds max withdrawal amount");
        require(_playerId != 0, "Invalid player id");
        uint256 amountAfterFee = 0;
        if(WITHDRAWAL_FEE_PERCENTAGE > 0){
            uint256 fee = (_amount * WITHDRAWAL_FEE_PERCENTAGE) / 10000;
            amountAfterFee = _amount - fee;
        }
        else{
            amountAfterFee = _amount;
        }
        token.safeTransfer(_to, amountAfterFee);
        emit Withdraw(_playerId, _to, amountAfterFee);
    }
    function setMaxWithdrawalAmount(
        uint256 _maxWithdrawalAmount
    ) external onlyOwner {
        MAX_WITHDRAWAL_AMOUNT = _maxWithdrawalAmount;
    }

    function setWithdrawalEnabled(
        bool _isWithdrawalEnabled
    ) external onlyOwner {
        IS_WITHDRAWAL_ENABLED = _isWithdrawalEnabled;
    }

    function setToken(
        address _token
    ) external onlyOwner {
        token = IERC20(_token);
    }
    function setWithdrawFees(uint256 _fee) external onlyOwner {
       WITHDRAWAL_FEE_PERCENTAGE = _fee;
    }
    //modifier
    modifier onlyWithdrawer() {
        require(owner() == msg.sender || hasRole(WITHDRAWER_ROLE, msg.sender), "Caller is not a withdrawer");
        _;
    }
}
