"""
KAIA Theology Engine - Compliance Checker
محرك الامتثال الشرعي الآلي
"""

from typing import Dict, List, Optional, Tuple
from datetime import datetime
import logging

from backend.kernel.theology.models import (
    ComplianceStatus,
    ProhibitedElement,
    TransactionValidation,
    RibaDetectionLog,
    GhararAnalysisLog
)

logger = logging.getLogger(__name__)


class ComplianceChecker:
    """
    محرك التحقق من الامتثال الشرعي
    Sharia Compliance Validation Engine
    """
    
    def __init__(self):
        self.riba_threshold = 0.01  # Any interest > 0.01% is riba
        self.gharar_threshold = 30.0  # Uncertainty > 30% is excessive
        
    async def validate_transaction(
        self,
        transaction_data: Dict
    ) -> Tuple[bool, ComplianceStatus, Dict]:
        """
        التحقق الشامل من المعاملة
        Comprehensive transaction validation
        
        Args:
            transaction_data: Dictionary containing transaction details
            
        Returns:
            Tuple of (is_compliant, status, details)
        """
        start_time = datetime.now()
        
        # Initialize validation results
        violations = []
        warnings = []
        recommendations = []
        
        # 1. Check for Riba (Interest)
        riba_detected, riba_details = await self.check_riba(transaction_data)
        if riba_detected:
            violations.append({
                "type": "riba",
                "severity": "critical",
                "message_ar": "تم اكتشاف ربا في المعاملة",
                "message_en": "Interest (Riba) detected in transaction",
                "details": riba_details
            })
        
        # 2. Check for Gharar (Excessive Uncertainty)
        gharar_detected, gharar_details = await self.check_gharar(transaction_data)
        if gharar_detected:
            violations.append({
                "type": "gharar",
                "severity": "high",
                "message_ar": "غرر مفرط في شروط العقد",
                "message_en": "Excessive uncertainty (Gharar) in contract terms",
                "details": gharar_details
            })
        
        # 3. Check for Maysir (Gambling)
        maysir_detected, maysir_details = await self.check_maysir(transaction_data)
        if maysir_detected:
            violations.append({
                "type": "maysir",
                "severity": "critical",
                "message_ar": "عنصر مقامرة في المعاملة",
                "message_en": "Gambling element (Maysir) detected",
                "details": maysir_details
            })
        
        # 4. Check for Haram Activities
        haram_detected, haram_details = await self.check_haram_activity(transaction_data)
        if haram_detected:
            violations.append({
                "type": "haram_activity",
                "severity": "critical",
                "message_ar": "تمويل نشاط محرم",
                "message_en": "Financing of prohibited (Haram) activity",
                "details": haram_details
            })
        
        # 5. Calculate compliance score
        compliance_score = self._calculate_compliance_score(violations, warnings)
        
        # 6. Determine status
        if len(violations) == 0:
            status = ComplianceStatus.APPROVED
            is_compliant = True
        elif any(v["severity"] == "critical" for v in violations):
            status = ComplianceStatus.REJECTED
            is_compliant = False
        else:
            status = ComplianceStatus.REVIEW_REQUIRED
            is_compliant = False
        
        # 7. Generate recommendations
        if not is_compliant:
            recommendations = self._generate_recommendations(violations)
        
        # Calculate validation duration
        duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        
        # Prepare result
        result = {
            "is_compliant": is_compliant,
            "status": status.value,
            "compliance_score": compliance_score,
            "violations": violations,
            "warnings": warnings,
            "recommendations": recommendations,
            "validation_duration_ms": duration_ms,
            "requires_scholar_review": status == ComplianceStatus.REVIEW_REQUIRED
        }
        
        logger.info(
            f"Transaction validation complete: {status.value}, "
            f"score: {compliance_score}, duration: {duration_ms}ms"
        )
        
        return is_compliant, status, result
    
    async def check_riba(self, transaction_data: Dict) -> Tuple[bool, Dict]:
        """
        كشف الربا في المعاملة
        Detect interest (Riba) in transaction
        """
        interest_rate = transaction_data.get("interest_rate", 0.0)
        interest_amount = transaction_data.get("interest_amount", 0.0)
        payment_terms = transaction_data.get("payment_terms", {})
        
        # Check for any interest
        has_interest = interest_rate > self.riba_threshold or interest_amount > 0
        
        if has_interest:
            details = {
                "interest_rate": interest_rate,
                "interest_amount": interest_amount,
                "is_fixed": payment_terms.get("fixed_interest", False),
                "is_variable": payment_terms.get("variable_interest", False),
                "detection_type": self._classify_riba_type(interest_rate, payment_terms),
                "explanation_ar": "الربا محرم في الإسلام بنص القرآن والسنة",
                "explanation_en": "Interest (Riba) is prohibited in Islam by Quran and Sunnah",
                "quran_reference": "البقرة 275-279",
                "alternative_ar": "استخدم عقود المشاركة أو المرابحة الإسلامية",
                "alternative_en": "Use Musharakah or Murabaha Islamic contracts"
            }
            return True, details
        
        return False, {}
    
    async def check_gharar(self, transaction_data: Dict) -> Tuple[bool, Dict]:
        """
        تحليل الغرر في العقد
        Analyze uncertainty (Gharar) in contract
        """
        contract_terms = transaction_data.get("contract_terms", {})
        
        # Calculate uncertainty level
        uncertainty_factors = []
        
        # Check for unclear terms
        if not contract_terms.get("delivery_date"):
            uncertainty_factors.append("missing_delivery_date")
        
        if not contract_terms.get("price_specified"):
            uncertainty_factors.append("unspecified_price")
        
        if not contract_terms.get("quantity_specified"):
            uncertainty_factors.append("unspecified_quantity")
        
        if contract_terms.get("conditional_terms"):
            uncertainty_factors.append("excessive_conditions")
        
        # Calculate uncertainty level (0-100)
        uncertainty_level = len(uncertainty_factors) * 25.0
        
        is_excessive = uncertainty_level > self.gharar_threshold
        
        if is_excessive:
            details = {
                "uncertainty_level": uncertainty_level,
                "uncertainty_factors": uncertainty_factors,
                "explanation_ar": "الغرر المفرط يؤدي إلى النزاع والظلم",
                "explanation_en": "Excessive uncertainty leads to disputes and injustice",
                "hadith_reference": "نهى رسول الله عن بيع الغرر",
                "solution_ar": "حدد جميع شروط العقد بوضوح",
                "solution_en": "Specify all contract terms clearly"
            }
            return True, details
        
        return False, {}
    
    async def check_maysir(self, transaction_data: Dict) -> Tuple[bool, Dict]:
        """
        كشف عنصر المقامرة
        Detect gambling element (Maysir)
        """
        transaction_type = transaction_data.get("transaction_type", "")
        business_sector = transaction_data.get("business_sector", "")
        contract_terms = transaction_data.get("contract_terms", {})
        
        # Check for gambling characteristics
        is_speculative = contract_terms.get("highly_speculative", False)
        is_lottery = "lottery" in transaction_type.lower()
        is_gambling = "gambling" in business_sector.lower()
        has_chance_element = contract_terms.get("outcome_based_on_chance", False)
        
        detected = is_speculative or is_lottery or is_gambling or has_chance_element
        
        if detected:
            details = {
                "detected_factors": [],
                "explanation_ar": "الميسر (المقامرة) محرم لأنه يعتمد على الحظ لا العمل",
                "explanation_en": "Gambling (Maysir) is prohibited as it depends on chance not work",
                "quran_reference": "المائدة 90-91",
                "alternative_ar": "استثمر في أنشطة إنتاجية حقيقية",
                "alternative_en": "Invest in real productive activities"
            }
            
            if is_speculative:
                details["detected_factors"].append("highly_speculative")
            if is_lottery:
                details["detected_factors"].append("lottery_based")
            if is_gambling:
                details["detected_factors"].append("gambling_sector")
            if has_chance_element:
                details["detected_factors"].append("chance_based_outcome")
            
            return True, details
        
        return False, {}
    
    async def check_haram_activity(self, transaction_data: Dict) -> Tuple[bool, Dict]:
        """
        فحص الأنشطة المحرمة
        Check for prohibited (Haram) activities
        """
        business_sector = transaction_data.get("business_sector", "").lower()
        use_of_funds = transaction_data.get("use_of_funds", "").lower()
        
        # List of prohibited sectors
        prohibited_sectors = [
            "alcohol", "خمور", "كحول",
            "gambling", "قمار", "مقامرة",
            "pork", "خنزير", "لحم خنزير",
            "adult entertainment", "محتوى إباحي",
            "weapons", "أسلحة", "سلاح",
            "tobacco", "تبغ", "دخان"
        ]
        
        # Check if sector is prohibited
        detected = any(sector in business_sector or sector in use_of_funds 
                      for sector in prohibited_sectors)
        
        if detected:
            matched_sectors = [
                sector for sector in prohibited_sectors 
                if sector in business_sector or sector in use_of_funds
            ]
            
            details = {
                "prohibited_sectors": matched_sectors,
                "explanation_ar": "تمويل الأنشطة المحرمة غير جائز شرعاً",
                "explanation_en": "Financing prohibited activities is not permissible",
                "principle": "الأصل في المعاملات الحل إلا ما حرمه الشرع",
                "alternative_ar": "استثمر في القطاعات الحلال (تكنولوجيا، صحة، تعليم)",
                "alternative_en": "Invest in Halal sectors (technology, healthcare, education)"
            }
            return True, details
        
        return False, {}
    
    def _classify_riba_type(self, interest_rate: float, payment_terms: Dict) -> str:
        """تصنيف نوع الربا"""
        if payment_terms.get("deferred_payment"):
            return "riba_nasiah"  # ربا النسيئة
        else:
            return "riba_fadl"  # ربا الفضل
    
    def _calculate_compliance_score(
        self,
        violations: List[Dict],
        warnings: List[Dict]
    ) -> float:
        """
        حساب درجة الامتثال
        Calculate compliance score (0-100)
        """
        if len(violations) == 0 and len(warnings) == 0:
            return 100.0
        
        # Deduct points for violations
        score = 100.0
        for violation in violations:
            if violation["severity"] == "critical":
                score -= 40.0
            elif violation["severity"] == "high":
                score -= 25.0
            elif violation["severity"] == "medium":
                score -= 15.0
        
        # Deduct points for warnings
        score -= len(warnings) * 5.0
        
        return max(0.0, score)
    
    def _generate_recommendations(self, violations: List[Dict]) -> List[Dict]:
        """
        توليد توصيات للامتثال
        Generate compliance recommendations
        """
        recommendations = []
        
        for violation in violations:
            if violation["type"] == "riba":
                recommendations.append({
                    "type": "alternative_contract",
                    "title_ar": "استخدم عقود التمويل الإسلامية",
                    "title_en": "Use Islamic financing contracts",
                    "options": ["Murabaha", "Musharakah", "Mudarabah", "Ijarah"]
                })
            
            elif violation["type"] == "gharar":
                recommendations.append({
                    "type": "clarify_terms",
                    "title_ar": "وضح شروط العقد",
                    "title_en": "Clarify contract terms",
                    "required_fields": ["delivery_date", "price", "quantity", "quality_specs"]
                })
            
            elif violation["type"] == "haram_activity":
                recommendations.append({
                    "type": "change_sector",
                    "title_ar": "غير القطاع إلى نشاط حلال",
                    "title_en": "Change to Halal business sector",
                    "suggested_sectors": ["Technology", "Healthcare", "Education", "Manufacturing"]
                })
        
        return recommendations
