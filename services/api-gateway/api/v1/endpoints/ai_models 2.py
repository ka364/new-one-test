"""
AI Models API Endpoints
واجهات برمجة نماذج الذكاء الاصطناعي
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional

from backend.kinetic.ml_models.risk_assessor import risk_assessor

router = APIRouter()


class RiskAssessmentRequest(BaseModel):
    """طلب تقييم المخاطر"""
    amount: float
    duration_months: int
    business_sector: str
    credit_score: Optional[int] = 500
    debt_to_income_ratio: Optional[float] = 0.5
    company_age_years: Optional[int] = 0
    employee_count: Optional[int] = 0
    has_insurance: Optional[bool] = False
    sharia_certified: Optional[bool] = False
    has_sharia_board: Optional[bool] = False
    historical_performance: Optional[Dict] = {}


class RiskAssessmentResponse(BaseModel):
    """استجابة تقييم المخاطر"""
    overall_risk_score: float
    risk_level: str
    risk_breakdown: Dict[str, float]
    recommendations: List[Dict]
    assessed_at: str


@router.post("/risk-assessment", response_model=RiskAssessmentResponse)
async def assess_risk(request: RiskAssessmentRequest):
    """
    تقييم مخاطر الاستثمار
    Assess investment risk using ML
    """
    try:
        # Prepare investment data
        investment_data = request.model_dump()
        
        # Assess risk
        result = await risk_assessor.assess_investment_risk(investment_data)
        
        return RiskAssessmentResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict")
async def predict_market():
    """
    تنبؤات السوق
    Market predictions using ML
    """
    # Simplified - in production, use actual ML model
    return {
        "predictions": {
            "next_month": {
                "trend": "bullish",
                "confidence": 0.75,
                "expected_return": 5.2
            },
            "next_quarter": {
                "trend": "neutral",
                "confidence": 0.65,
                "expected_return": 3.8
            }
        },
        "factors": [
            "Market sentiment positive",
            "Economic indicators stable",
            "Sector performance strong"
        ]
    }


@router.get("/recommendations")
async def get_recommendations(
    user_id: str,
    risk_tolerance: str = "medium"
):
    """
    توصيات استثمارية
    Investment recommendations
    """
    # Simplified - in production, use ML recommendation engine
    recommendations = [
        {
            "investment_id": "INV-001",
            "name": "Halal Tech Fund",
            "sector": "Technology",
            "expected_return": 8.5,
            "risk_level": "medium",
            "sharia_compliant": True,
            "confidence": 0.85
        },
        {
            "investment_id": "INV-002",
            "name": "Islamic Healthcare REIT",
            "sector": "Healthcare",
            "expected_return": 6.2,
            "risk_level": "low",
            "sharia_compliant": True,
            "confidence": 0.90
        }
    ]
    
    return {
        "user_id": user_id,
        "risk_tolerance": risk_tolerance,
        "recommendations": recommendations,
        "generated_at": "2024-12-19T10:00:00Z"
    }
