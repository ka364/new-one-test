"""
Tests for KAIA Theology Engine Compliance Checker
"""
import pytest
from backend.kernel.theology.compliance_checker import ComplianceChecker


@pytest.fixture
def compliance_checker():
    """Create compliance checker instance"""
    return ComplianceChecker()


class TestRibaDetection:
    """Test Riba (Interest) detection"""
    
    @pytest.mark.asyncio
    async def test_detect_explicit_interest(self, compliance_checker):
        """Test detection of explicit interest"""
        transaction = {
            "transaction_type": "loan",
            "amount": 10000,
            "interest_rate": 5.0,
            "interest_amount": 500
        }
        
        riba_detected, details = await compliance_checker.check_riba(transaction)
        
        assert riba_detected is True
        assert details["interest_rate"] == 5.0
        assert details["interest_amount"] == 500
        assert "riba" in details["detection_type"].lower()
    
    @pytest.mark.asyncio
    async def test_no_interest_transaction(self, compliance_checker):
        """Test transaction without interest"""
        transaction = {
            "transaction_type": "murabaha",
            "amount": 10000,
            "interest_rate": 0.0,
            "interest_amount": 0
        }
        
        riba_detected, details = await compliance_checker.check_riba(transaction)
        
        assert riba_detected is False
    
    @pytest.mark.asyncio
    async def test_hidden_interest_detection(self, compliance_checker):
        """Test detection of hidden interest (late fees)"""
        transaction = {
            "transaction_type": "sale",
            "amount": 10000,
            "interest_rate": 0.0,
            "late_fees": 500,
            "penalty_charges": 200
        }
        
        riba_detected, details = await compliance_checker.check_riba(transaction)
        
        assert riba_detected is True
        assert details["hidden_interest_indicators"] > 0


class TestGhararDetection:
    """Test Gharar (Uncertainty) detection"""
    
    @pytest.mark.asyncio
    async def test_high_uncertainty_transaction(self, compliance_checker):
        """Test transaction with high uncertainty"""
        transaction = {
            "contract_terms": {
                "delivery_date": None,
                "price_specified": False,
                "quantity_specified": False,
                "quality_specified": False
            }
        }
        
        gharar_detected, details = await compliance_checker.check_gharar(transaction)
        
        assert gharar_detected is True
        assert details["uncertainty_level"] > 50.0
    
    @pytest.mark.asyncio
    async def test_low_uncertainty_transaction(self, compliance_checker):
        """Test transaction with low uncertainty"""
        transaction = {
            "contract_terms": {
                "delivery_date": "2025-01-01",
                "price_specified": True,
                "quantity_specified": True,
                "quality_specified": True
            }
        }
        
        gharar_detected, details = await compliance_checker.check_gharar(transaction)
        
        assert gharar_detected is False
        assert details["uncertainty_level"] < 30.0


class TestMaysirDetection:
    """Test Maysir (Gambling) detection"""
    
    @pytest.mark.asyncio
    async def test_gambling_transaction(self, compliance_checker):
        """Test gambling-like transaction"""
        transaction = {
            "transaction_type": "speculative_trade",
            "risk_level": "very_high",
            "outcome_dependent_on_chance": True
        }
        
        maysir_detected, details = await compliance_checker.check_maysir(transaction)
        
        assert maysir_detected is True
    
    @pytest.mark.asyncio
    async def test_legitimate_trade(self, compliance_checker):
        """Test legitimate trade transaction"""
        transaction = {
            "transaction_type": "asset_purchase",
            "risk_level": "low",
            "outcome_dependent_on_chance": False
        }
        
        maysir_detected, details = await compliance_checker.check_maysir(transaction)
        
        assert maysir_detected is False


class TestHaramActivities:
    """Test Haram activities screening"""
    
    @pytest.mark.asyncio
    async def test_prohibited_sector(self, compliance_checker):
        """Test prohibited business sector"""
        transaction = {
            "business_sector": "gambling",
            "activities": ["casino_operations"]
        }
        
        haram_detected, details = await compliance_checker.check_haram_activities(transaction)
        
        assert haram_detected is True
        assert "gambling" in details["prohibited_sectors"]
    
    @pytest.mark.asyncio
    async def test_halal_sector(self, compliance_checker):
        """Test halal business sector"""
        transaction = {
            "business_sector": "technology",
            "activities": ["software_development"]
        }
        
        haram_detected, details = await compliance_checker.check_haram_activities(transaction)
        
        assert haram_detected is False


class TestComplianceScoring:
    """Test overall compliance scoring"""
    
    @pytest.mark.asyncio
    async def test_fully_compliant_transaction(self, compliance_checker):
        """Test fully compliant transaction"""
        transaction = {
            "transaction_type": "murabaha",
            "amount": 10000,
            "interest_rate": 0.0,
            "business_sector": "technology",
            "contract_terms": {
                "delivery_date": "2025-01-01",
                "price_specified": True,
                "quantity_specified": True
            }
        }
        
        is_compliant, status, result = await compliance_checker.validate_transaction(transaction)
        
        assert is_compliant is True
        assert result["compliance_score"] == 100.0
        assert len(result["violations"]) == 0
        assert status == "approved"
    
    @pytest.mark.asyncio
    async def test_non_compliant_transaction(self, compliance_checker):
        """Test non-compliant transaction"""
        transaction = {
            "transaction_type": "loan",
            "amount": 10000,
            "interest_rate": 5.0,
            "business_sector": "gambling"
        }
        
        is_compliant, status, result = await compliance_checker.validate_transaction(transaction)
        
        assert is_compliant is False
        assert result["compliance_score"] < 50.0
        assert len(result["violations"]) > 0
        assert status == "rejected"
    
    @pytest.mark.asyncio
    async def test_partial_compliance(self, compliance_checker):
        """Test partially compliant transaction"""
        transaction = {
            "transaction_type": "sale",
            "amount": 10000,
            "interest_rate": 0.0,
            "business_sector": "technology",
            "contract_terms": {
                "delivery_date": None,  # Some uncertainty
                "price_specified": True,
                "quantity_specified": True
            }
        }
        
        is_compliant, status, result = await compliance_checker.validate_transaction(transaction)
        
        assert result["compliance_score"] > 50.0
        assert result["compliance_score"] < 100.0
        assert len(result["recommendations"]) > 0


class TestRecommendations:
    """Test recommendation generation"""
    
    @pytest.mark.asyncio
    async def test_recommendations_for_violations(self, compliance_checker):
        """Test that recommendations are provided for violations"""
        transaction = {
            "transaction_type": "loan",
            "amount": 10000,
            "interest_rate": 5.0
        }
        
        is_compliant, status, result = await compliance_checker.validate_transaction(transaction)
        
        assert len(result["recommendations"]) > 0
        assert any("murabaha" in rec.lower() or "mudarabah" in rec.lower() 
                  for rec in result["recommendations"])
