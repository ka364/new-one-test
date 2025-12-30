"""
Sharia Compliance API Endpoints
واجهات برمجة الامتثال الشرعي
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime

from backend.kernel.theology.compliance_checker import ComplianceChecker
from backend.kernel.theology.models import ComplianceStatus

router = APIRouter()
compliance_checker = ComplianceChecker()


class ShariaValidationRequest(BaseModel):
    """طلب التحقق الشرعي"""
    transaction_type: str
    amount: float
    currency: str = "USD"
    parties_involved: List[str]
    contract_terms: Dict
    business_sector: str
    use_of_funds: Optional[str] = ""
    interest_rate: Optional[float] = 0.0
    interest_amount: Optional[float] = 0.0
    payment_terms: Optional[Dict] = {}


class ShariaValidationResponse(BaseModel):
    """استجابة التحقق الشرعي"""
    transaction_id: str
    is_compliant: bool
    status: str
    compliance_score: float
    violations: List[Dict]
    warnings: List[Dict]
    recommendations: List[Dict]
    validation_duration_ms: int
    requires_scholar_review: bool
    validated_at: str


@router.post("/validate", response_model=ShariaValidationResponse)
async def validate_transaction(request: ShariaValidationRequest):
    """
    التحقق الشرعي من المعاملة
    Validate transaction for Sharia compliance
    
    This endpoint checks for:
    - Riba (Interest)
    - Gharar (Excessive Uncertainty)
    - Maysir (Gambling)
    - Haram Activities
    """
    try:
        # Prepare transaction data
        transaction_data = {
            "transaction_type": request.transaction_type,
            "amount": request.amount,
            "currency": request.currency,
            "parties_involved": request.parties_involved,
            "contract_terms": request.contract_terms,
            "business_sector": request.business_sector,
            "use_of_funds": request.use_of_funds,
            "interest_rate": request.interest_rate,
            "interest_amount": request.interest_amount,
            "payment_terms": request.payment_terms
        }
        
        # Validate transaction
        is_compliant, status, result = await compliance_checker.validate_transaction(
            transaction_data
        )
        
        # Generate transaction ID
        transaction_id = f"TX-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        return ShariaValidationResponse(
            transaction_id=transaction_id,
            is_compliant=is_compliant,
            status=status.value,
            compliance_score=result["compliance_score"],
            violations=result["violations"],
            warnings=result["warnings"],
            recommendations=result["recommendations"],
            validation_duration_ms=result["validation_duration_ms"],
            requires_scholar_review=result["requires_scholar_review"],
            validated_at=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/fatwa/{fatwa_id}")
async def get_fatwa(fatwa_id: str):
    """
    الحصول على فتوى
    Get fatwa by ID
    """
    # In production, query from database
    return {
        "fatwa_id": fatwa_id,
        "title_ar": "حكم الاستثمار في الأسهم",
        "title_en": "Ruling on Stock Investment",
        "scholar": "الشيخ محمد الصديق",
        "date_issued": "2024-01-15",
        "answer_ar": "يجوز الاستثمار في الأسهم بشرط أن تكون الشركة لا تتعامل بالربا...",
        "answer_en": "Stock investment is permissible provided the company does not deal with interest..."
    }


@router.post("/query")
async def sharia_query(question: str):
    """
    استشارة شرعية
    Submit Sharia query
    """
    return {
        "query_id": f"Q-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "question": question,
        "status": "pending",
        "estimated_response_time": "24-48 hours",
        "message": "Your query has been submitted to our Sharia board"
    }


@router.get("/compliance-report")
async def get_compliance_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """
    تقرير الامتثال الشرعي
    Get Sharia compliance report
    """
    return {
        "report_id": f"RPT-{datetime.now().strftime('%Y%m%d')}",
        "period": {
            "start": start_date or "2024-01-01",
            "end": end_date or datetime.now().strftime('%Y-%m-%d')
        },
        "summary": {
            "total_transactions": 1250,
            "compliant_transactions": 1180,
            "rejected_transactions": 45,
            "pending_review": 25,
            "compliance_rate": 94.4
        },
        "violations_breakdown": {
            "riba": 30,
            "gharar": 10,
            "haram_activity": 5
        },
        "generated_at": datetime.now().isoformat()
    }
