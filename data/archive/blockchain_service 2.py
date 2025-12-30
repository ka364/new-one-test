"""
Blockchain Integration Service
Web3 integration for ERC-3643 Security Tokens
"""

from web3 import Web3
from web3.middleware import geth_poa_middleware
from eth_account import Account
from typing import Dict, Optional, Tuple
import json
import logging

from backend.core.config import settings

logger = logging.getLogger(__name__)


class BlockchainService:
    """
    خدمة تكامل البلوكتشين
    Blockchain Integration Service for HaderOS Platform
    """
    
    def __init__(self):
        # Initialize Web3 connections
        self.w3_eth = Web3(Web3.HTTPProvider(settings.ETH_RPC_URL))
        self.w3_polygon = Web3(Web3.HTTPProvider(settings.POLYGON_RPC_URL))
        
        # Add PoA middleware for Polygon
        self.w3_polygon.middleware_onion.inject(geth_poa_middleware, layer=0)
        
        # Load contract owner account
        if settings.CONTRACT_OWNER_PRIVATE_KEY:
            self.owner_account = Account.from_key(settings.CONTRACT_OWNER_PRIVATE_KEY)
        else:
            self.owner_account = None
            logger.warning("Contract owner private key not set")
        
        # Contract ABIs (simplified for example)
        self.token_abi = self._load_token_abi()
        
        # Contract addresses
        self.token_address_eth = None  # Set after deployment
        self.token_address_polygon = None  # Set after deployment
        
    def _load_token_abi(self) -> list:
        """Load contract ABI"""
        # Simplified ABI - in production, load from compiled contract
        return [
            {
                "inputs": [
                    {"name": "to", "type": "address"},
                    {"name": "amount", "type": "uint256"}
                ],
                "name": "transfer",
                "outputs": [{"name": "", "type": "bool"}],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"name": "account", "type": "address"}],
                "name": "balanceOf",
                "outputs": [{"name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {"name": "_investor", "type": "address"},
                    {"name": "_kycVerified", "type": "bool"},
                    {"name": "_accredited", "type": "bool"},
                    {"name": "_maxInvestment", "type": "uint256"},
                    {"name": "_country", "type": "string"},
                    {"name": "_shariaCompliant", "type": "bool"}
                ],
                "name": "registerInvestor",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {"name": "from", "type": "address"},
                    {"name": "to", "type": "address"},
                    {"name": "amount", "type": "uint256"}
                ],
                "name": "checkTransferCompliance",
                "outputs": [{"name": "", "type": "bool"}],
                "stateMutability": "view",
                "type": "function"
            }
        ]
    
    async def register_investor(
        self,
        investor_address: str,
        kyc_verified: bool,
        accredited: bool,
        max_investment: float,
        country: str,
        sharia_compliant: bool,
        network: str = "polygon"
    ) -> Tuple[bool, Optional[str]]:
        """
        تسجيل مستثمر على البلوكتشين
        Register investor on blockchain
        
        Args:
            investor_address: Investor's wallet address
            kyc_verified: KYC verification status
            accredited: Accredited investor status
            max_investment: Maximum investment amount
            country: Investor's country
            sharia_compliant: Sharia compliance status
            network: Blockchain network (eth or polygon)
            
        Returns:
            Tuple of (success, transaction_hash)
        """
        try:
            # Select network
            w3 = self.w3_polygon if network == "polygon" else self.w3_eth
            token_address = self.token_address_polygon if network == "polygon" else self.token_address_eth
            
            if not token_address:
                logger.error(f"Token contract not deployed on {network}")
                return False, None
            
            # Create contract instance
            contract = w3.eth.contract(
                address=Web3.to_checksum_address(token_address),
                abi=self.token_abi
            )
            
            # Convert max_investment to Wei
            max_investment_wei = w3.to_wei(max_investment, 'ether')
            
            # Build transaction
            tx = contract.functions.registerInvestor(
                Web3.to_checksum_address(investor_address),
                kyc_verified,
                accredited,
                max_investment_wei,
                country,
                sharia_compliant
            ).build_transaction({
                'from': self.owner_account.address,
                'nonce': w3.eth.get_transaction_count(self.owner_account.address),
                'gas': 200000,
                'gasPrice': w3.eth.gas_price
            })
            
            # Sign transaction
            signed_tx = w3.eth.account.sign_transaction(tx, self.owner_account.key)
            
            # Send transaction
            tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            
            # Wait for receipt
            receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
            
            if receipt['status'] == 1:
                logger.info(f"Investor registered: {investor_address}, tx: {tx_hash.hex()}")
                return True, tx_hash.hex()
            else:
                logger.error(f"Transaction failed: {tx_hash.hex()}")
                return False, tx_hash.hex()
                
        except Exception as e:
            logger.error(f"Error registering investor: {str(e)}")
            return False, None
    
    async def transfer_tokens(
        self,
        from_address: str,
        to_address: str,
        amount: float,
        network: str = "polygon"
    ) -> Tuple[bool, Optional[str]]:
        """
        تحويل الرموز
        Transfer tokens between addresses
        
        Args:
            from_address: Sender address
            to_address: Recipient address
            amount: Amount to transfer
            network: Blockchain network
            
        Returns:
            Tuple of (success, transaction_hash)
        """
        try:
            # Select network
            w3 = self.w3_polygon if network == "polygon" else self.w3_eth
            token_address = self.token_address_polygon if network == "polygon" else self.token_address_eth
            
            if not token_address:
                logger.error(f"Token contract not deployed on {network}")
                return False, None
            
            # Create contract instance
            contract = w3.eth.contract(
                address=Web3.to_checksum_address(token_address),
                abi=self.token_abi
            )
            
            # Convert amount to Wei
            amount_wei = w3.to_wei(amount, 'ether')
            
            # Check compliance first
            is_compliant = contract.functions.checkTransferCompliance(
                Web3.to_checksum_address(from_address),
                Web3.to_checksum_address(to_address),
                amount_wei
            ).call()
            
            if not is_compliant:
                logger.warning(f"Transfer not compliant: {from_address} -> {to_address}")
                return False, None
            
            # Build transaction
            tx = contract.functions.transfer(
                Web3.to_checksum_address(to_address),
                amount_wei
            ).build_transaction({
                'from': Web3.to_checksum_address(from_address),
                'nonce': w3.eth.get_transaction_count(from_address),
                'gas': 150000,
                'gasPrice': w3.eth.gas_price
            })
            
            # Note: In production, user should sign this transaction
            # For now, we'll use owner account as example
            signed_tx = w3.eth.account.sign_transaction(tx, self.owner_account.key)
            
            # Send transaction
            tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            
            # Wait for receipt
            receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
            
            if receipt['status'] == 1:
                logger.info(f"Transfer successful: {amount} tokens, tx: {tx_hash.hex()}")
                return True, tx_hash.hex()
            else:
                logger.error(f"Transfer failed: {tx_hash.hex()}")
                return False, tx_hash.hex()
                
        except Exception as e:
            logger.error(f"Error transferring tokens: {str(e)}")
            return False, None
    
    async def get_balance(
        self,
        address: str,
        network: str = "polygon"
    ) -> Optional[float]:
        """
        الحصول على رصيد المحفظة
        Get wallet balance
        
        Args:
            address: Wallet address
            network: Blockchain network
            
        Returns:
            Balance in tokens (or None if error)
        """
        try:
            # Select network
            w3 = self.w3_polygon if network == "polygon" else self.w3_eth
            token_address = self.token_address_polygon if network == "polygon" else self.token_address_eth
            
            if not token_address:
                logger.error(f"Token contract not deployed on {network}")
                return None
            
            # Create contract instance
            contract = w3.eth.contract(
                address=Web3.to_checksum_address(token_address),
                abi=self.token_abi
            )
            
            # Get balance
            balance_wei = contract.functions.balanceOf(
                Web3.to_checksum_address(address)
            ).call()
            
            # Convert to tokens
            balance = w3.from_wei(balance_wei, 'ether')
            
            return float(balance)
            
        except Exception as e:
            logger.error(f"Error getting balance: {str(e)}")
            return None
    
    async def get_transaction_status(
        self,
        tx_hash: str,
        network: str = "polygon"
    ) -> Optional[Dict]:
        """
        الحصول على حالة المعاملة
        Get transaction status
        
        Args:
            tx_hash: Transaction hash
            network: Blockchain network
            
        Returns:
            Transaction receipt dictionary
        """
        try:
            # Select network
            w3 = self.w3_polygon if network == "polygon" else self.w3_eth
            
            # Get receipt
            receipt = w3.eth.get_transaction_receipt(tx_hash)
            
            return {
                "transaction_hash": tx_hash,
                "status": "success" if receipt['status'] == 1 else "failed",
                "block_number": receipt['blockNumber'],
                "gas_used": receipt['gasUsed'],
                "from": receipt['from'],
                "to": receipt['to']
            }
            
        except Exception as e:
            logger.error(f"Error getting transaction status: {str(e)}")
            return None
    
    def is_connected(self, network: str = "polygon") -> bool:
        """Check if connected to blockchain"""
        w3 = self.w3_polygon if network == "polygon" else self.w3_eth
        return w3.is_connected()


# Global instance
blockchain_service = BlockchainService()
