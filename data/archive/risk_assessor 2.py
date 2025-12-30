"""
Risk Assessment ML Model
تقييم المخاطر باستخدام الذكاء الاصطناعي
"""

import numpy as np
from typing import Dict, List, Tuple
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class RiskAssessor:
    """
    محرك تقييم المخاطر
    Risk Assessment Engine using ML
    """
    
    def __init__(self):
        self.risk_factors = {
            "market_volatility": 0.3,
            "credit_risk": 0.25,
            "liquidity_risk": 0.2,
            "operational_risk": 0.15,
            "sharia_compliance_risk": 0.1
        }
    
    async def assess_investment_risk(
        self,
        investment_data: Dict
    ) -> Dict:
        """
        تقييم مخاطر الاستثمار
        Assess investment risk
        
        Args:
            investment_data: Investment details
            
        Returns:
            Risk assessment report
        """
        # Extract features
        amount = investment_data.get("amount", 0)
        duration_months = investment_data.get("duration_months", 12)
        business_sector = investment_data.get("business_sector", "")
        historical_performance = investment_data.get("historical_performance", {})
        
        # Calculate individual risk scores
        market_risk = self._calculate_market_risk(business_sector, historical_performance)
        credit_risk = self._calculate_credit_risk(investment_data)
        liquidity_risk = self._calculate_liquidity_risk(duration_months, amount)
        operational_risk = self._calculate_operational_risk(investment_data)
        sharia_risk = self._calculate_sharia_risk(investment_data)
        
        # Calculate weighted overall risk
        overall_risk = (
            market_risk * self.risk_factors["market_volatility"] +
            credit_risk * self.risk_factors["credit_risk"] +
            liquidity_risk * self.risk_factors["liquidity_risk"] +
            operational_risk * self.risk_factors["operational_risk"] +
            sharia_risk * self.risk_factors["sharia_compliance_risk"]
        )
        
        # Determine risk level
        risk_level = self._classify_risk_level(overall_risk)
        
        # Generate recommendations
        recommendations = self._generate_risk_recommendations(
            overall_risk,
            market_risk,
            credit_risk,
            liquidity_risk,
            operational_risk,
            sharia_risk
        )
        
        return {
            "overall_risk_score": round(overall_risk, 2),
            "risk_level": risk_level,
            "risk_breakdown": {
                "market_risk": round(market_risk, 2),
                "credit_risk": round(credit_risk, 2),
                "liquidity_risk": round(liquidity_risk, 2),
                "operational_risk": round(operational_risk, 2),
                "sharia_compliance_risk": round(sharia_risk, 2)
            },
            "recommendations": recommendations,
            "assessed_at": datetime.now().isoformat()
        }
    
    def _calculate_market_risk(
        self,
        sector: str,
        historical_performance: Dict
    ) -> float:
        """حساب مخاطر السوق - Calculate market risk"""
        # Sector risk mapping
        sector_risks = {
            "technology": 0.6,
            "healthcare": 0.4,
            "finance": 0.7,
            "real_estate": 0.5,
            "manufacturing": 0.5,
            "retail": 0.6,
            "energy": 0.7
        }
        
        base_risk = sector_risks.get(sector.lower(), 0.5)
        
        # Adjust based on historical volatility
        if historical_performance:
            volatility = historical_performance.get("volatility", 0.5)
            base_risk = (base_risk + volatility) / 2
        
        return min(base_risk, 1.0)
    
    def _calculate_credit_risk(self, investment_data: Dict) -> float:
        """حساب مخاطر الائتمان - Calculate credit risk"""
        credit_score = investment_data.get("credit_score", 500)
        debt_to_income = investment_data.get("debt_to_income_ratio", 0.5)
        
        # Normalize credit score (300-850 range)
        normalized_score = (850 - credit_score) / 550
        
        # Combine factors
        credit_risk = (normalized_score + debt_to_income) / 2
        
        return min(credit_risk, 1.0)
    
    def _calculate_liquidity_risk(
        self,
        duration_months: int,
        amount: float
    ) -> float:
        """حساب مخاطر السيولة - Calculate liquidity risk"""
        # Longer duration = higher liquidity risk
        duration_risk = min(duration_months / 60, 1.0)  # Max 60 months
        
        # Larger amount = higher liquidity risk
        amount_risk = min(amount / 1000000, 1.0)  # Max 1M
        
        liquidity_risk = (duration_risk + amount_risk) / 2
        
        return liquidity_risk
    
    def _calculate_operational_risk(self, investment_data: Dict) -> float:
        """حساب المخاطر التشغيلية - Calculate operational risk"""
        company_age_years = investment_data.get("company_age_years", 0)
        employee_count = investment_data.get("employee_count", 0)
        has_insurance = investment_data.get("has_insurance", False)
        
        # Newer companies = higher risk
        age_risk = max(0, 1 - (company_age_years / 10))
        
        # Smaller companies = higher risk
        size_risk = max(0, 1 - (employee_count / 100))
        
        # No insurance = higher risk
        insurance_risk = 0 if has_insurance else 0.3
        
        operational_risk = (age_risk + size_risk + insurance_risk) / 3
        
        return min(operational_risk, 1.0)
    
    def _calculate_sharia_risk(self, investment_data: Dict) -> float:
        """حساب مخاطر الامتثال الشرعي - Calculate Sharia compliance risk"""
        sharia_certified = investment_data.get("sharia_certified", False)
        has_sharia_board = investment_data.get("has_sharia_board", False)
        business_sector = investment_data.get("business_sector", "").lower()
        
        # Prohibited sectors
        prohibited_sectors = ["alcohol", "gambling", "pork", "weapons"]
        is_prohibited = any(sector in business_sector for sector in prohibited_sectors)
        
        if is_prohibited:
            return 1.0  # Maximum risk
        
        # Calculate based on certification
        if sharia_certified and has_sharia_board:
            return 0.1  # Low risk
        elif sharia_certified:
            return 0.3  # Medium-low risk
        elif has_sharia_board:
            return 0.4  # Medium risk
        else:
            return 0.6  # Medium-high risk
    
    def _classify_risk_level(self, risk_score: float) -> str:
        """تصنيف مستوى المخاطر - Classify risk level"""
        if risk_score < 0.3:
            return "low"
        elif risk_score < 0.5:
            return "medium"
        elif risk_score < 0.7:
            return "high"
        else:
            return "very_high"
    
    def _generate_risk_recommendations(
        self,
        overall_risk: float,
        market_risk: float,
        credit_risk: float,
        liquidity_risk: float,
        operational_risk: float,
        sharia_risk: float
    ) -> List[Dict]:
        """توليد توصيات - Generate recommendations"""
        recommendations = []
        
        if overall_risk > 0.7:
            recommendations.append({
                "type": "warning",
                "title_ar": "مخاطر عالية جداً",
                "title_en": "Very High Risk",
                "message_ar": "ننصح بعدم المتابعة مع هذا الاستثمار",
                "message_en": "We advise against proceeding with this investment"
            })
        
        if market_risk > 0.6:
            recommendations.append({
                "type": "diversification",
                "title_ar": "تنويع المحفظة",
                "title_en": "Portfolio Diversification",
                "message_ar": "قم بتنويع استثماراتك عبر قطاعات مختلفة",
                "message_en": "Diversify your investments across different sectors"
            })
        
        if credit_risk > 0.6:
            recommendations.append({
                "type": "credit_check",
                "title_ar": "فحص ائتماني إضافي",
                "title_en": "Additional Credit Check",
                "message_ar": "يُنصح بإجراء فحص ائتماني شامل",
                "message_en": "Comprehensive credit check recommended"
            })
        
        if liquidity_risk > 0.6:
            recommendations.append({
                "type": "liquidity",
                "title_ar": "احتفظ بسيولة كافية",
                "title_en": "Maintain Sufficient Liquidity",
                "message_ar": "احتفظ بنسبة 20% من المحفظة سائلة",
                "message_en": "Keep 20% of portfolio liquid"
            })
        
        if sharia_risk > 0.5:
            recommendations.append({
                "type": "sharia_review",
                "title_ar": "مراجعة شرعية",
                "title_en": "Sharia Review",
                "message_ar": "يُنصح بمراجعة عالم شرعي قبل الاستثمار",
                "message_en": "Consult a Sharia scholar before investing"
            })
        
        return recommendations


# Global instance
risk_assessor = RiskAssessor()
