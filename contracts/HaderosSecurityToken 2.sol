// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title HaderosSecurityToken
 * @dev ERC-3643 Compliant Security Token for HaderOS Platform
 * @notice This token implements regulatory compliance and Sharia compliance checks
 */
contract HaderosSecurityToken is ERC20, Ownable, Pausable {
    
    // Compliance Registry
    address public complianceRegistry;
    
    // Identity Registry
    address public identityRegistry;
    
    // Token Information
    string private _tokenName;
    string private _tokenSymbol;
    uint8 private _tokenDecimals;
    
    // Investor Structure
    struct Investor {
        bool kycVerified;
        bool accredited;
        uint256 maxInvestment;
        uint256 holdingPeriod;
        uint256 investmentDate;
        bool canTransfer;
        string country;
        bool shariaCompliant;
    }
    
    // Mappings
    mapping(address => Investor) public investors;
    mapping(address => bool) public frozenAccounts;
    mapping(address => bool) public sanctionedAddresses;
    
    // Events
    event InvestorVerified(address indexed investor, bool kycVerified, bool accredited);
    event ComplianceChecked(address indexed investor, bool passed, string rule);
    event TransferBlocked(address indexed from, address indexed to, uint256 amount, string reason);
    event AccountFrozen(address indexed account, string reason);
    event AccountUnfrozen(address indexed account);
    event ShariaComplianceChecked(address indexed investor, bool compliant);
    
    // Modifiers
    modifier onlyCompliant(address _address) {
        require(investors[_address].kycVerified, "KYC verification required");
        require(!frozenAccounts[_address], "Account is frozen");
        require(!sanctionedAddresses[_address], "Address is sanctioned");
        _;
    }
    
    modifier onlyShariaCompliant(address _address) {
        require(investors[_address].shariaCompliant, "Must be Sharia compliant");
        _;
    }
    
    /**
     * @dev Constructor
     * @param name_ Token name
     * @param symbol_ Token symbol
     * @param initialSupply Initial token supply
     */
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply
    ) ERC20(name_, symbol_) {
        _tokenName = name_;
        _tokenSymbol = symbol_;
        _tokenDecimals = 18;
        _mint(msg.sender, initialSupply * 10**decimals());
    }
    
    /**
     * @dev Register investor with KYC and compliance data
     * @param _investor Investor address
     * @param _kycVerified KYC verification status
     * @param _accredited Accredited investor status
     * @param _maxInvestment Maximum investment amount
     * @param _country Investor country
     * @param _shariaCompliant Sharia compliance status
     */
    function registerInvestor(
        address _investor,
        bool _kycVerified,
        bool _accredited,
        uint256 _maxInvestment,
        string memory _country,
        bool _shariaCompliant
    ) external onlyOwner {
        investors[_investor] = Investor({
            kycVerified: _kycVerified,
            accredited: _accredited,
            maxInvestment: _maxInvestment,
            holdingPeriod: 0,
            investmentDate: block.timestamp,
            canTransfer: true,
            country: _country,
            shariaCompliant: _shariaCompliant
        });
        
        emit InvestorVerified(_investor, _kycVerified, _accredited);
        emit ShariaComplianceChecked(_investor, _shariaCompliant);
    }
    
    /**
     * @dev Check if transfer is compliant
     * @param from Sender address
     * @param to Recipient address
     * @param amount Transfer amount
     * @return bool Compliance status
     */
    function checkTransferCompliance(
        address from,
        address to,
        uint256 amount
    ) public view returns (bool) {
        // Check sender compliance
        if (!investors[from].kycVerified) return false;
        if (frozenAccounts[from]) return false;
        if (sanctionedAddresses[from]) return false;
        if (!investors[from].canTransfer) return false;
        
        // Check recipient compliance
        if (!investors[to].kycVerified) return false;
        if (frozenAccounts[to]) return false;
        if (sanctionedAddresses[to]) return false;
        
        // Check holding period
        if (block.timestamp < investors[from].investmentDate + investors[from].holdingPeriod) {
            return false;
        }
        
        // Check investment limits
        if (balanceOf(to) + amount > investors[to].maxInvestment) {
            return false;
        }
        
        // Check Sharia compliance
        if (!investors[from].shariaCompliant || !investors[to].shariaCompliant) {
            return false;
        }
        
        return true;
    }
    
    /**
     * @dev Override transfer function with compliance checks
     */
    function transfer(
        address to,
        uint256 amount
    ) public override whenNotPaused onlyCompliant(msg.sender) onlyCompliant(to) returns (bool) {
        if (!checkTransferCompliance(msg.sender, to, amount)) {
            emit TransferBlocked(msg.sender, to, amount, "Compliance check failed");
            revert("Transfer not compliant");
        }
        
        emit ComplianceChecked(msg.sender, true, "Transfer approved");
        return super.transfer(to, amount);
    }
    
    /**
     * @dev Override transferFrom function with compliance checks
     */
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public override whenNotPaused onlyCompliant(from) onlyCompliant(to) returns (bool) {
        if (!checkTransferCompliance(from, to, amount)) {
            emit TransferBlocked(from, to, amount, "Compliance check failed");
            revert("Transfer not compliant");
        }
        
        emit ComplianceChecked(from, true, "Transfer approved");
        return super.transferFrom(from, to, amount);
    }
    
    /**
     * @dev Freeze account
     * @param _account Account to freeze
     * @param _reason Reason for freezing
     */
    function freezeAccount(address _account, string memory _reason) external onlyOwner {
        frozenAccounts[_account] = true;
        emit AccountFrozen(_account, _reason);
    }
    
    /**
     * @dev Unfreeze account
     * @param _account Account to unfreeze
     */
    function unfreezeAccount(address _account) external onlyOwner {
        frozenAccounts[_account] = false;
        emit AccountUnfrozen(_account);
    }
    
    /**
     * @dev Add address to sanctions list
     * @param _address Address to sanction
     */
    function addToSanctionsList(address _address) external onlyOwner {
        sanctionedAddresses[_address] = true;
    }
    
    /**
     * @dev Remove address from sanctions list
     * @param _address Address to remove
     */
    function removeFromSanctionsList(address _address) external onlyOwner {
        sanctionedAddresses[_address] = false;
    }
    
    /**
     * @dev Update investor Sharia compliance status
     * @param _investor Investor address
     * @param _compliant Compliance status
     */
    function updateShariaCompliance(
        address _investor,
        bool _compliant
    ) external onlyOwner {
        investors[_investor].shariaCompliant = _compliant;
        emit ShariaComplianceChecked(_investor, _compliant);
    }
    
    /**
     * @dev Pause token transfers
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause token transfers
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Mint new tokens (only owner)
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyOwner onlyCompliant(to) {
        _mint(to, amount);
    }
    
    /**
     * @dev Burn tokens
     * @param amount Amount to burn
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
    
    /**
     * @dev Get investor information
     * @param _investor Investor address
     * @return Investor struct
     */
    function getInvestorInfo(address _investor) external view returns (Investor memory) {
        return investors[_investor];
    }
}
