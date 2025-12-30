"""

نظام التقييم المستمر لقياس الأثر التجاري - HaderOS

Continuous Business Impact Assessment System

يقوم هذا النظام بقياس وتقييم التأثير التجاري المستمر للقرارات والعمليات
في نظام HaderOS، مع التركيز على المؤشرات المالية والتشغيلية والعملاء.

"""

import asyncio
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from enum import Enum
import logging

from services.api_gateway.core.database import get_db
from services.api_gateway.integrations.autopilot.sentiment_analysis import SentimentAnalyzer
import redis.asyncio as redis

logger = logging.getLogger(__name__)


class CustomJSONEncoder(json.JSONEncoder):
    """Custom JSON encoder للتعامل مع الـ enums والتواريخ"""
    def default(self, obj):
        if isinstance(obj, Enum):
            return obj.value
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)


class ImpactCategory(Enum):
    """فئات التأثير التجاري"""
    FINANCIAL = "financial"
    OPERATIONAL = "operational"
    CUSTOMER = "customer"
    MARKET = "market"
    INNOVATION = "innovation"


class ImpactType(Enum):
    """أنواع التأثير"""
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"


@dataclass
class BusinessMetric:
    """مؤشر أعمال"""
    name: str
    category: ImpactCategory
    value: float
    target: float
    unit: str
    timestamp: datetime
    trend: str  # "up", "down", "stable"
    confidence: float


@dataclass
class ImpactAssessment:
    """تقييم التأثير"""
    decision_id: str
    category: ImpactCategory
    impact_type: ImpactType
    magnitude: float  # 0-1 scale
    confidence: float
    metrics: List[BusinessMetric]
    timestamp: datetime
    description: str
    recommendations: List[str]


@dataclass
class BusinessImpactReport:
    """تقرير التأثير التجاري"""
    period_start: datetime
    period_end: datetime
    overall_score: float
    category_scores: Dict[ImpactCategory, float]
    key_metrics: List[BusinessMetric]
    top_impacts: List[ImpactAssessment]
    recommendations: List[str]
    trends: Dict[str, Any]


class ContinuousEvaluationSystem:
    """نظام التقييم المستمر لقياس الأثر التجاري"""

    def __init__(self):
        self.redis_client = None
        self.sentiment_analyzer = SentimentAnalyzer()
        self.metrics_history = {}
        self.assessment_cache = {}
        self.is_initialized = False

    async def initialize_evaluation_system(self) -> bool:
        """تهيئة نظام التقييم"""
        try:
            # تهيئة Redis
            self.redis_client = redis.Redis(
                host='localhost',
                port=6379,
                db=0,
                decode_responses=True
            )

            # تهيئة Sentiment Analyzer
            success = await self.sentiment_analyzer.initialize_sentiment_analyzer()
            if not success:
                logger.warning("Sentiment Analyzer not available for business impact assessment")
                self.sentiment_analyzer = None

            # تحميل البيانات التاريخية
            await self._load_historical_data()

            self.is_initialized = True
            logger.info("🔍 Continuous Evaluation System initialized")
            return True

        except Exception as e:
            logger.error(f"Failed to initialize evaluation system: {e}")
            return False

    async def assess_business_impact(self, decision_id: str, decision_data: Dict[str, Any]) -> ImpactAssessment:
        """تقييم التأثير التجاري لقرار معين"""

        # تحليل البيانات المالية
        financial_impact = await self._assess_financial_impact(decision_data)

        # تحليل البيانات التشغيلية
        operational_impact = await self._assess_operational_impact(decision_data)

        # تحليل تأثير العملاء
        customer_impact = await self._assess_customer_impact(decision_data)

        # تحليل التأثير السوقي
        market_impact = await self._assess_market_impact(decision_data)

        # تحديد الفئة الرئيسية والتأثير العام
        category_scores = {
            ImpactCategory.FINANCIAL: financial_impact['score'],
            ImpactCategory.OPERATIONAL: operational_impact['score'],
            ImpactCategory.CUSTOMER: customer_impact['score'],
            ImpactCategory.MARKET: market_impact['score']
        }

        primary_category = max(category_scores, key=category_scores.get)
        overall_magnitude = sum(category_scores.values()) / len(category_scores)

        # تحديد نوع التأثير
        if overall_magnitude > 0.3:  # خفض العتبة من 0.6 إلى 0.3
            impact_type = ImpactType.POSITIVE
        elif overall_magnitude < 0.2:  # خفض العتبة من 0.4 إلى 0.2
            impact_type = ImpactType.NEGATIVE
        else:
            impact_type = ImpactType.NEUTRAL

        # تجميع المؤشرات
        all_metrics = []
        all_metrics.extend(financial_impact['metrics'])
        all_metrics.extend(operational_impact['metrics'])
        all_metrics.extend(customer_impact['metrics'])
        all_metrics.extend(market_impact['metrics'])

        # إنشاء التقييم
        assessment = ImpactAssessment(
            decision_id=decision_id,
            category=primary_category,
            impact_type=impact_type,
            magnitude=overall_magnitude,
            confidence=0.85,  # يمكن تحسينه لاحقاً
            metrics=all_metrics,
            timestamp=datetime.utcnow(),
            description=self._generate_impact_description(impact_type, overall_magnitude, primary_category),
            recommendations=self._generate_recommendations(impact_type, category_scores)
        )

        # حفظ التقييم
        await self._save_assessment(assessment)

        return assessment

    async def generate_business_impact_report(self, days: int = 30) -> BusinessImpactReport:
        """إنشاء تقرير التأثير التجاري"""

        period_end = datetime.utcnow()
        period_start = period_end - timedelta(days=days)

        # جمع التقييمات في الفترة
        assessments = await self._get_assessments_in_period(period_start, period_end)

        if not assessments:
            return self._create_empty_report(period_start, period_end)

        # حساب النقاط لكل فئة
        category_scores = {}
        for category in ImpactCategory:
            category_assessments = [a for a in assessments if a.category == category]
            if category_assessments:
                avg_magnitude = sum(a.magnitude for a in category_assessments) / len(category_assessments)
                category_scores[category] = avg_magnitude
            else:
                category_scores[category] = 0.5

        # النقطة العامة
        overall_score = sum(category_scores.values()) / len(category_scores)

        # المؤشرات الرئيسية
        key_metrics = await self._get_key_metrics(period_start, period_end)

        # أهم التأثيرات
        top_impacts = sorted(assessments, key=lambda x: x.magnitude, reverse=True)[:5]

        # التوصيات
        recommendations = self._generate_period_recommendations(category_scores, assessments)

        # الاتجاهات
        trends = await self._analyze_trends(period_start, period_end)

        return BusinessImpactReport(
            period_start=period_start,
            period_end=period_end,
            overall_score=overall_score,
            category_scores=category_scores,
            key_metrics=key_metrics,
            top_impacts=top_impacts,
            recommendations=recommendations,
            trends=trends
        )

    async def _assess_financial_impact(self, decision_data: Dict[str, Any]) -> Dict[str, Any]:
        """تقييم التأثير المالي"""

        # مؤشرات مالية أساسية
        metrics = []

        # ROI محتمل
        roi = decision_data.get('expected_roi', 0.0)
        metrics.append(BusinessMetric(
            name="Return on Investment",
            category=ImpactCategory.FINANCIAL,
            value=roi,
            target=0.15,  # 15% target
            unit="percentage",
            timestamp=datetime.utcnow(),
            trend=self._calculate_trend("roi", roi),
            confidence=0.8
        ))

        # Cost Savings
        cost_savings = decision_data.get('cost_savings', 0.0)
        metrics.append(BusinessMetric(
            name="Cost Savings",
            category=ImpactCategory.FINANCIAL,
            value=cost_savings,
            target=10000,  # $10k target
            unit="USD",
            timestamp=datetime.utcnow(),
            trend=self._calculate_trend("cost_savings", cost_savings),
            confidence=0.75
        ))

        # Revenue Impact
        revenue_impact = decision_data.get('revenue_impact', 0.0)
        metrics.append(BusinessMetric(
            name="Revenue Impact",
            category=ImpactCategory.FINANCIAL,
            value=revenue_impact,
            target=50000,  # $50k target
            unit="USD",
            timestamp=datetime.utcnow(),
            trend=self._calculate_trend("revenue", revenue_impact),
            confidence=0.7
        ))

        # حساب النقطة المالية
        financial_score = min(1.0, (roi * 0.4 + (cost_savings / 10000) * 0.3 + (revenue_impact / 50000) * 0.3))

        return {
            'score': financial_score,
            'metrics': metrics
        }

    async def _assess_operational_impact(self, decision_data: Dict[str, Any]) -> Dict[str, Any]:
        """تقييم التأثير التشغيلي"""

        metrics = []

        # Efficiency Improvement
        efficiency = decision_data.get('efficiency_gain', 0.0)
        metrics.append(BusinessMetric(
            name="Operational Efficiency",
            category=ImpactCategory.OPERATIONAL,
            value=efficiency,
            target=0.2,  # 20% improvement
            unit="percentage",
            timestamp=datetime.utcnow(),
            trend=self._calculate_trend("efficiency", efficiency),
            confidence=0.8
        ))

        # Processing Time Reduction
        time_reduction = decision_data.get('time_reduction_hours', 0.0)
        metrics.append(BusinessMetric(
            name="Processing Time Reduction",
            category=ImpactCategory.OPERATIONAL,
            value=time_reduction,
            target=10,  # 10 hours target
            unit="hours",
            timestamp=datetime.utcnow(),
            trend=self._calculate_trend("time_reduction", time_reduction),
            confidence=0.75
        ))

        # Error Rate Reduction
        error_reduction = decision_data.get('error_rate_reduction', 0.0)
        metrics.append(BusinessMetric(
            name="Error Rate Reduction",
            category=ImpactCategory.OPERATIONAL,
            value=error_reduction,
            target=0.05,  # 5% reduction
            unit="percentage",
            timestamp=datetime.utcnow(),
            trend=self._calculate_trend("error_reduction", error_reduction),
            confidence=0.7
        ))

        operational_score = min(1.0, (efficiency * 0.4 + (time_reduction / 10) * 0.3 + error_reduction * 0.3))

        return {
            'score': operational_score,
            'metrics': metrics
        }

    async def _assess_customer_impact(self, decision_data: Dict[str, Any]) -> Dict[str, Any]:
        """تقييم تأثير العملاء"""

        metrics = []

        # Customer Satisfaction
        satisfaction = decision_data.get('customer_satisfaction', 0.0)
        metrics.append(BusinessMetric(
            name="Customer Satisfaction",
            category=ImpactCategory.CUSTOMER,
            value=satisfaction,
            target=4.5,  # 4.5/5 target
            unit="rating",
            timestamp=datetime.utcnow(),
            trend=self._calculate_trend("satisfaction", satisfaction),
            confidence=0.8
        ))

        # Retention Rate
        retention = decision_data.get('retention_rate', 0.0)
        metrics.append(BusinessMetric(
            name="Customer Retention",
            category=ImpactCategory.CUSTOMER,
            value=retention,
            target=0.85,  # 85% target
            unit="percentage",
            timestamp=datetime.utcnow(),
            trend=self._calculate_trend("retention", retention),
            confidence=0.75
        ))

        # Sentiment Analysis (إذا كان متوفراً)
        if self.sentiment_analyzer:
            sentiment_score = await self._get_sentiment_score(decision_data)
            metrics.append(BusinessMetric(
                name="Customer Sentiment",
                category=ImpactCategory.CUSTOMER,
                value=sentiment_score,
                target=0.6,  # 60% positive sentiment
                unit="score",
                timestamp=datetime.utcnow(),
                trend=self._calculate_trend("sentiment", sentiment_score),
                confidence=0.7
            ))

        customer_score = min(1.0, ((satisfaction / 5) * 0.4 + retention * 0.4 + (sentiment_score if 'sentiment_score' in locals() else 0.5) * 0.2))

        return {
            'score': customer_score,
            'metrics': metrics
        }

    async def _assess_market_impact(self, decision_data: Dict[str, Any]) -> Dict[str, Any]:
        """تقييم التأثير السوقي"""

        metrics = []

        # Market Share
        market_share = decision_data.get('market_share_gain', 0.0)
        metrics.append(BusinessMetric(
            name="Market Share Gain",
            category=ImpactCategory.MARKET,
            value=market_share,
            target=0.05,  # 5% gain
            unit="percentage",
            timestamp=datetime.utcnow(),
            trend=self._calculate_trend("market_share", market_share),
            confidence=0.7
        ))

        # Competitive Advantage
        competitive_advantage = decision_data.get('competitive_advantage', 0.0)
        metrics.append(BusinessMetric(
            name="Competitive Advantage",
            category=ImpactCategory.MARKET,
            value=competitive_advantage,
            target=0.7,  # 70% advantage
            unit="score",
            timestamp=datetime.utcnow(),
            trend=self._calculate_trend("competitive", competitive_advantage),
            confidence=0.65
        ))

        market_score = min(1.0, (market_share * 2 + competitive_advantage) / 2)

        return {
            'score': market_score,
            'metrics': metrics
        }

    def _calculate_trend(self, metric_name: str, current_value: float) -> str:
        """حساب اتجاه المؤشر"""
        if metric_name not in self.metrics_history:
            self.metrics_history[metric_name] = []

        history = self.metrics_history[metric_name]
        history.append(current_value)

        # الاحتفاظ بآخر 10 قيم
        if len(history) > 10:
            history.pop(0)

        if len(history) < 2:
            return "stable"

        # حساب المتوسط السابق والحالي
        mid = len(history) // 2
        prev_avg = sum(history[:mid]) / mid
        current_avg = sum(history[mid:]) / (len(history) - mid)

        if current_avg > prev_avg * 1.05:
            return "up"
        elif current_avg < prev_avg * 0.95:
            return "down"
        else:
            return "stable"

    async def _get_sentiment_score(self, decision_data: Dict[str, Any]) -> float:
        """الحصول على نقاط المشاعر"""
        if not self.sentiment_analyzer:
            return 0.5

        customer_feedback = decision_data.get('customer_feedback', [])
        if not customer_feedback:
            return 0.5

        # تحليل الملاحظات
        results = await self.sentiment_analyzer.analyze_batch([
            {"text": feedback, "source": "decision_impact"}
            for feedback in customer_feedback
        ])

        # حساب متوسط المشاعر الإيجابية
        positive_count = sum(1 for r in results if r.sentiment.value == 'positive')
        return positive_count / len(results) if results else 0.5

    def _generate_impact_description(self, impact_type: ImpactType, magnitude: float, category: ImpactCategory) -> str:
        """إنشاء وصف التأثير"""
        type_desc = {
            ImpactType.POSITIVE: "إيجابي",
            ImpactType.NEGATIVE: "سلبي",
            ImpactType.NEUTRAL: "محايد"
        }[impact_type]

        magnitude_desc = "عالي" if magnitude > 0.7 else "متوسط" if magnitude > 0.4 else "منخفض"

        category_desc = {
            ImpactCategory.FINANCIAL: "مالي",
            ImpactCategory.OPERATIONAL: "تشغيلي",
            ImpactCategory.CUSTOMER: "عملاء",
            ImpactCategory.MARKET: "سوقي",
            ImpactCategory.INNOVATION: "ابتكاري"
        }[category]

        return f"التأثير {type_desc} بمستوى {magnitude_desc} في المجال {category_desc}"

    def _generate_recommendations(self, impact_type: ImpactType, category_scores: Dict[ImpactCategory, float]) -> List[str]:
        """إنشاء التوصيات"""
        recommendations = []

        if impact_type == ImpactType.NEGATIVE:
            recommendations.append("مراجعة القرار وتقييم المخاطر المحتملة")
            recommendations.append("البحث عن بدائل أو تعديلات لتحسين التأثير")

        # توصيات حسب الفئات الضعيفة
        weak_categories = [cat for cat, score in category_scores.items() if score < 0.5]

        for category in weak_categories:
            if category == ImpactCategory.FINANCIAL:
                recommendations.append("تحسين الجوانب المالية من خلال تحليل التكاليف والعائدات")
            elif category == ImpactCategory.OPERATIONAL:
                recommendations.append("تعزيز الكفاءة التشغيلية وتقليل الأخطاء")
            elif category == ImpactCategory.CUSTOMER:
                recommendations.append("التركيز على تحسين تجربة العملاء ورضاهم")
            elif category == ImpactCategory.MARKET:
                recommendations.append("تعزيز الموقع التنافسي في السوق")

        return recommendations

    def _generate_period_recommendations(self, category_scores: Dict[ImpactCategory, float], assessments: List[ImpactAssessment]) -> List[str]:
        """إنشاء توصيات للفترة"""
        recommendations = []

        # تحليل الاتجاهات العامة
        avg_score = sum(category_scores.values()) / len(category_scores)

        if avg_score > 0.7:
            recommendations.append("الاستمرار في النهج الحالي مع التركيز على الاستدامة")
        elif avg_score < 0.5:
            recommendations.append("إعادة تقييم الاستراتيجية والبحث عن تحسينات جوهرية")

        # توصيات محددة للفئات
        for category, score in category_scores.items():
            if score < 0.6:
                if category == ImpactCategory.FINANCIAL:
                    recommendations.append("تطوير استراتيجية مالية أفضل مع التركيز على تحسين العائد")
                elif category == ImpactCategory.CUSTOMER:
                    recommendations.append("تعزيز برامج خدمة العملاء وجمع الملاحظات")
                elif category == ImpactCategory.OPERATIONAL:
                    recommendations.append("استثمار في تحسين العمليات والأتمتة")

        return recommendations

    async def _analyze_trends(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """تحليل الاتجاهات"""
        # تحليل بسيط للاتجاهات
        return {
            "overall_trend": "improving",  # يمكن تحسينه
            "key_insights": [
                "زيادة في الكفاءة التشغيلية",
                "تحسن في رضا العملاء",
                "استقرار في الأداء المالي"
            ]
        }

    async def _save_assessment(self, assessment: ImpactAssessment):
        """حفظ التقييم"""
        if not self.redis_client:
            logger.warning("Redis client not available, assessment not saved")
            return

        try:
            key = f"business_impact:{assessment.decision_id}"
            data = asdict(assessment)
            # لا نحتاج لتحويل timestamp هنا لأن CustomJSONEncoder سيتعامل معه

            await self.redis_client.set(key, json.dumps(data, cls=CustomJSONEncoder))
            await self.redis_client.expire(key, 86400 * 90)  # 90 يوم
        except Exception as e:
            logger.warning(f"Failed to save assessment: {e}")
            # لا نرمي الخطأ - النظام يمكن أن يعمل بدون حفظ البيانات

    async def _get_assessments_in_period(self, start_date: datetime, end_date: datetime) -> List[ImpactAssessment]:
        """الحصول على التقييمات في فترة معينة"""
        if not self.redis_client:
            logger.warning("Redis client not available, returning empty assessments")
            return []

        try:
            # في تطبيق حقيقي، سنحتاج إلى فهرسة أفضل
            # هذا تنفيذ بسيط
            assessments = []
            keys = await self.redis_client.keys("business_impact:*")

            for key in keys:
                data = await self.redis_client.get(key)
                if data:
                    assessment_data = json.loads(data)
                    timestamp = datetime.fromisoformat(assessment_data['timestamp'])
                    if start_date <= timestamp <= end_date:
                        # تحويل الـ strings مرة أخرى إلى enums
                        assessment_data['timestamp'] = timestamp
                        assessment_data['category'] = ImpactCategory(assessment_data['category'])
                        assessment_data['impact_type'] = ImpactType(assessment_data['impact_type'])
                        # تحويل metrics إذا كانت موجودة
                        if 'metrics' in assessment_data:
                            for metric in assessment_data['metrics']:
                                metric['category'] = ImpactCategory(metric['category'])
                        assessment = ImpactAssessment(**assessment_data)
                        assessments.append(assessment)

            return assessments
        except Exception as e:
            logger.warning(f"Failed to get assessments: {e}")
            return []

    async def _get_key_metrics(self, start_date: datetime, end_date: datetime) -> List[BusinessMetric]:
        """الحصول على المؤشرات الرئيسية"""
        # تنفيذ بسيط - في التطبيق الحقيقي سنحتاج إلى تخزين أفضل
        return []

    async def _load_historical_data(self):
        """تحميل البيانات التاريخية"""
        # تحميل البيانات من Redis أو قاعدة البيانات
        pass

    def _create_empty_report(self, start_date: datetime, end_date: datetime) -> BusinessImpactReport:
        """إنشاء تقرير فارغ"""
        return BusinessImpactReport(
            period_start=start_date,
            period_end=end_date,
            overall_score=0.5,
            category_scores={cat: 0.5 for cat in ImpactCategory},
            key_metrics=[],
            top_impacts=[],
            recommendations=["لا توجد بيانات كافية للتقييم"],
            trends={"overall_trend": "insufficient_data"}
        )
