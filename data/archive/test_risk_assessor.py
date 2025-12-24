"""
Tests for ML/AI Risk Assessment Models
"""
import pytest
from backend.kinetic.ml_models.risk_assessor import RiskAssessor


@pytest.fixture
def risk_assessor():
    """Create risk assessor instance"""
    return RiskAssessor()


class TestInvestmentRiskAssessment:
    """Test investment risk assessment"""
    
    @pytest.mark.asyncio
    async def test_low_risk_investment(self, risk_assessor):
        """Test low-risk investment assessment"""
        investment = {
            "amount": 10000,
            "duration_months": 12,
            "business_sector": "healthcare",
            "credit_score": 800,
            "sharia_certified": True,
            "has_sharia_board": True
        }
        
        result = await risk_assessor.assess_investment_risk(investment)
        
        assert result["risk_level"] == "low"
        assert result["overall_risk_score"] < 0.3
        assert "market_risk" in result
        assert "credit_risk" in result
    
    @pytest.mark.asyncio
    async def test_high_risk_investment(self, risk_assessor):
        """Test high-risk investment assessment"""
        investment = {
            "amount": 100000,
            "duration_months": 60,
            "business_sector": "cryptocurrency",
            "credit_score": 400,
            "sharia_certified": False
        }
        
        result = await risk_assessor.assess_investment_risk(investment)
        
        assert result["risk_level"] in ["high", "very_high"]
        assert result["overall_risk_score"] > 0.7
        assert len(result["recommendations"]) > 0
    
    @pytest.mark.asyncio
    async def test_medium_risk_investment(self, risk_assessor):
        """Test medium-risk investment assessment"""
        investment = {
            "amount": 50000,
            "duration_months": 24,
            "business_sector": "technology",
            "credit_score": 650,
            "sharia_certified": True
        }
        
        result = await risk_assessor.assess_investment_risk(investment)
        
        assert result["risk_level"] == "medium"
        assert 0.3 <= result["overall_risk_score"] <= 0.7


class TestMarketRiskAnalysis:
    """Test market risk analysis"""
    
    @pytest.mark.asyncio
    async def test_volatile_sector_risk(self, risk_assessor):
        """Test risk in volatile sector"""
        investment = {
            "business_sector": "cryptocurrency",
            "amount": 50000,
            "duration_months": 12
        }
        
        result = await risk_assessor.assess_investment_risk(investment)
        
        assert result["market_risk"] > 0.7
    
    @pytest.mark.asyncio
    async def test_stable_sector_risk(self, risk_assessor):
        """Test risk in stable sector"""
        investment = {
            "business_sector": "utilities",
            "amount": 50000,
            "duration_months": 12
        }
        
        result = await risk_assessor.assess_investment_risk(investment)
        
        assert result["market_risk"] < 0.4


class TestCreditRiskAnalysis:
    """Test credit risk analysis"""
    
    @pytest.mark.asyncio
    async def test_excellent_credit_score(self, risk_assessor):
        """Test with excellent credit score"""
        investment = {
            "amount": 50000,
            "credit_score": 850,
            "business_sector": "technology"
        }
        
        result = await risk_assessor.assess_investment_risk(investment)
        
        assert result["credit_risk"] < 0.2
    
    @pytest.mark.asyncio
    async def test_poor_credit_score(self, risk_assessor):
        """Test with poor credit score"""
        investment = {
            "amount": 50000,
            "credit_score": 350,
            "business_sector": "technology"
        }
        
        result = await risk_assessor.assess_investment_risk(investment)
        
        assert result["credit_risk"] > 0.8


class TestShariaComplianceRisk:
    """Test Sharia compliance risk factor"""
    
    @pytest.mark.asyncio
    async def test_sharia_certified_lower_risk(self, risk_assessor):
        """Test that Sharia certification reduces risk"""
        investment_certified = {
            "amount": 50000,
            "business_sector": "technology",
            "sharia_certified": True,
            "has_sharia_board": True
        }
        
        investment_not_certified = {
            "amount": 50000,
            "business_sector": "technology",
            "sharia_certified": False
        }
        
        result_certified = await risk_assessor.assess_investment_risk(investment_certified)
        result_not_certified = await risk_assessor.assess_investment_risk(investment_not_certified)
        
        assert result_certified["sharia_compliance_risk"] < result_not_certified["sharia_compliance_risk"]


class TestRecommendations:
    """Test risk mitigation recommendations"""
    
    @pytest.mark.asyncio
    async def test_recommendations_for_high_risk(self, risk_assessor):
        """Test that recommendations are provided for high-risk investments"""
        investment = {
            "amount": 100000,
            "duration_months": 60,
            "business_sector": "speculative",
            "credit_score": 400
        }
        
        result = await risk_assessor.assess_investment_risk(investment)
        
        assert len(result["recommendations"]) > 0
        assert any("diversify" in rec.lower() or "reduce" in rec.lower() 
                  for rec in result["recommendations"])
    
    @pytest.mark.asyncio
    async def test_no_recommendations_for_low_risk(self, risk_assessor):
        """Test that low-risk investments have fewer recommendations"""
        investment = {
            "amount": 10000,
            "duration_months": 12,
            "business_sector": "healthcare",
            "credit_score": 800,
            "sharia_certified": True
        }
        
        result = await risk_assessor.assess_investment_risk(investment)
        
        assert len(result["recommendations"]) <= 2
