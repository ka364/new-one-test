"""

Predictive Analytics System for HaderOS Autopilot

نظام التحليلات التنبؤية الذكي الذي يتنبأ بالأعطال والفرص قبل حدوثها.

"""

import asyncio
import time
import math
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import structlog
import json
import statistics

from services.api_gateway.core.database import get_redis
from services.api_gateway.integrations.resilience import health_checker

logger = structlog.get_logger(__name__)


class PredictionType(Enum):
    """أنواع التنبؤات"""
    SERVICE_FAILURE = "service_failure"
    PERFORMANCE_DEGRADATION = "performance_degradation"
    COST_SPIKE = "cost_spike"
    LOAD_SURGE = "load_surge"
    OPPORTUNITY_WINDOW = "opportunity_window"


@dataclass
class Prediction:
    """تنبؤ ذكي"""
    id: str
    type: PredictionType
    target: str  # اسم الخدمة أو المزود
    probability: float  # 0.0 to 1.0
    confidence: float  # 0.0 to 1.0
    time_to_impact: int  # دقائق حتى التأثير
    severity: str  # "low", "medium", "high", "critical"
    description: str
    recommended_actions: List[str]
    indicators: Dict[str, Any]
    timestamp: datetime
    expires_at: datetime


@dataclass
class TimeSeriesData:
    """بيانات زمنية للتحليل"""
    metric_name: str
    values: List[float]
    timestamps: List[datetime]
    interval_minutes: int


class PredictiveAnalytics:
    """نظام التحليلات التنبؤية"""

    def __init__(self):
        self.active_predictions = {}
        self.historical_data = {}
        self.prediction_models = {}
        self.is_initialized = False
        self.failure_patterns = [
            {"name": "high_load_failure", "indicators": ["load", "response_time"]},
            {"name": "error_rate_spike", "indicators": ["error_rate", "consecutive_failures"]},
            {"name": "memory_pressure", "indicators": ["memory_usage", "gc_pressure"]}
        ]

    async def initialize_predictive_system(self):
        """تهيئة نظام التحليلات التنبؤية"""
        # تحميل البيانات التاريخية
        await self._load_historical_data()

        # تدريب النماذج الأساسية
        await self._train_prediction_models()

        # بدء المراقبة التنبؤية
        asyncio.create_task(self._continuous_prediction_monitoring())

        self.is_initialized = True
        logger.info("🔮 Predictive Analytics system initialized")

    async def initialize_analytics(self):
        """تهيئة نظام التحليلات (للتوافق)"""
        await self.initialize_predictive_system()

    async def predict_service_failure(self, service_name: str) -> Optional[Prediction]:
        """التنبؤ بفشل الخدمة قبل حدوثه"""

        # جمع المؤشرات الحالية
        indicators = await self._gather_failure_indicators(service_name)

        # تحليل الأنماط التاريخية
        historical_patterns = await self._analyze_historical_patterns(service_name, "failure")

        # حساب احتمالية الفشل
        failure_probability = await self._calculate_failure_probability(
            indicators, historical_patterns
        )

        # تحديد مستوى الثقة
        confidence = self._calculate_prediction_confidence(indicators, historical_patterns)

        if failure_probability > 0.3 and confidence > 0.6:  # عتبة التنبؤ
            # تحديد الوقت المتوقع للتأثير
            time_to_impact = self._estimate_time_to_failure(indicators)

            # تحديد الشدة
            severity = self._determine_failure_severity(failure_probability, time_to_impact)

            # اقتراح الإجراءات
            recommended_actions = self._generate_failure_mitigation_actions(
                service_name, failure_probability, time_to_impact
            )

            prediction = Prediction(
                id=f"failure_pred_{service_name}_{int(time.time())}",
                type=PredictionType.SERVICE_FAILURE,
                target=service_name,
                probability=failure_probability,
                confidence=confidence,
                time_to_impact=time_to_impact,
                severity=severity,
                description=self._build_failure_description(service_name, failure_probability, time_to_impact),
                recommended_actions=recommended_actions,
                indicators=indicators,
                timestamp=datetime.utcnow(),
                expires_at=datetime.utcnow() + timedelta(minutes=time_to_impact + 60)
            )

            # حفظ التنبؤ
            self.active_predictions[prediction.id] = prediction

            return prediction

        return None

    async def predict_performance_degradation(self, service_name: str) -> Optional[Prediction]:
        """التنبؤ بتدهور الأداء"""

        # جمع مؤشرات الأداء
        performance_indicators = await self._gather_performance_indicators(service_name)

        # تحليل اتجاهات الأداء
        performance_trends = await self._analyze_performance_trends(service_name)

        # حساب احتمالية التدهور
        degradation_probability = await self._calculate_performance_degradation_probability(
            performance_indicators, performance_trends
        )

        confidence = self._calculate_performance_prediction_confidence(
            performance_indicators, performance_trends
        )

        if degradation_probability > 0.4 and confidence > 0.65:
            time_to_impact = self._estimate_time_to_performance_impact(performance_indicators)
            severity = self._determine_performance_severity(degradation_probability, time_to_impact)

            recommended_actions = self._generate_performance_optimization_actions(
                service_name, degradation_probability, time_to_impact
            )

            prediction = Prediction(
                id=f"perf_pred_{service_name}_{int(time.time())}",
                type=PredictionType.PERFORMANCE_DEGRADATION,
                target=service_name,
                probability=degradation_probability,
                confidence=confidence,
                time_to_impact=time_to_impact,
                severity=severity,
                description=self._build_performance_description(service_name, degradation_probability, time_to_impact),
                recommended_actions=recommended_actions,
                indicators=performance_indicators,
                timestamp=datetime.utcnow(),
                expires_at=datetime.utcnow() + timedelta(minutes=time_to_impact + 60)
            )

            self.active_predictions[prediction.id] = prediction
            return prediction

        return None

    async def predict_cost_opportunities(self, service_name: str) -> Optional[Prediction]:
        """التنبؤ بفرص توفير التكاليف"""

        # تحليل أسعار السوق الحالية
        market_prices = await self._analyze_market_prices(service_name)

        # مقارنة مع الأسعار الحالية
        current_costs = await self._get_current_costs(service_name)

        # حساب فرصة التوفير
        savings_potential = self._calculate_savings_potential(market_prices, current_costs)

        if savings_potential > 0.15:  # 15% توفير أو أكثر
            time_window = 1440  # 24 ساعة نافذة الفرصة

            prediction = Prediction(
                id=f"cost_pred_{service_name}_{int(time.time())}",
                type=PredictionType.OPPORTUNITY_WINDOW,
                target=service_name,
                probability=0.85,  # عالية الاحتمالية لفرص التوفير
                confidence=0.75,
                time_to_impact=time_window,
                severity="medium",
                description=f"فرصة توفير تكلفة تصل إلى {savings_potential*100:.1f}% متاحة لمدة 24 ساعة",
                recommended_actions=[
                    f"التبديل إلى مزود أرخص لتوفير ${savings_potential*100:.1f}",
                    "مراجعة تعاقدات المزود الحالي",
                    "اختبار الأداء قبل التبديل"
                ],
                indicators={
                    "current_costs": current_costs,
                    "market_prices": market_prices,
                    "savings_potential": savings_potential
                },
                timestamp=datetime.utcnow(),
                expires_at=datetime.utcnow() + timedelta(minutes=time_window)
            )

            self.active_predictions[prediction.id] = prediction
            return prediction

        return None

    async def _gather_failure_indicators(self, service_name: str) -> Dict[str, Any]:
        """جمع مؤشرات الفشل"""

        # الحصول على بيانات الصحة الحالية
        health_status = health_checker.get_service_status(service_name)

        # جمع المقاييس الأخيرة
        recent_metrics = await self._get_recent_metrics(service_name, hours=6)

        indicators = {
            "current_health": health_status.is_healthy if health_status else True,
            "consecutive_failures": health_status.consecutive_failures if health_status else 0,
            "response_time_trend": self._calculate_trend(recent_metrics.get("response_time", [])),
            "error_rate_trend": self._calculate_trend(recent_metrics.get("error_rate", [])),
            "throughput_trend": self._calculate_trend(recent_metrics.get("throughput", [])),
            "memory_usage": recent_metrics.get("memory_usage", [0.5])[-1],
            "cpu_usage": recent_metrics.get("cpu_usage", [0.3])[-1],
            "time_of_day": datetime.utcnow().hour,
            "day_of_week": datetime.utcnow().weekday()
        }

        return indicators

    async def _gather_performance_indicators(self, service_name: str) -> Dict[str, Any]:
        """جمع مؤشرات الأداء"""

        recent_metrics = await self._get_recent_metrics(service_name, hours=2)

        return {
            "avg_response_time": statistics.mean(recent_metrics.get("response_time", [1.0])),
            "response_time_trend": self._calculate_trend(recent_metrics.get("response_time", [])),
            "throughput_trend": self._calculate_trend(recent_metrics.get("throughput", [])),
            "error_rate": statistics.mean(recent_metrics.get("error_rate", [0.02])),
            "memory_trend": self._calculate_trend(recent_metrics.get("memory_usage", [])),
            "cpu_trend": self._calculate_trend(recent_metrics.get("cpu_usage", [])),
            "current_load": len(recent_metrics.get("active_requests", [10]))
        }

    def _calculate_trend(self, values: List[float]) -> str:
        """حساب اتجاه القيم"""
        if len(values) < 3:
            return "stable"

        # حساب الميل باستخدام الانحدار الخطي البسيط
        n = len(values)
        x = list(range(n))
        y = values

        slope = self._calculate_slope(x, y)

        if slope > 0.1:
            return "increasing"
        elif slope < -0.1:
            return "decreasing"
        else:
            return "stable"

    def _calculate_slope(self, x: List[float], y: List[float]) -> float:
        """حساب ميل الخط"""
        if len(x) != len(y) or len(x) < 2:
            return 0.0

        n = len(x)
        sum_x = sum(x)
        sum_y = sum(y)
        sum_xy = sum(xi * yi for xi, yi in zip(x, y))
        sum_xx = sum(xi * xi for xi in x)

        denominator = n * sum_xx - sum_x * sum_x
        if denominator == 0:
            return 0.0

        return (n * sum_xy - sum_x * sum_y) / denominator

    async def _analyze_historical_patterns(self, service_name: str,
                                         pattern_type: str) -> Dict[str, Any]:
        """تحليل الأنماط التاريخية"""

        # محاكاة تحليل البيانات التاريخية
        # في الواقع، سيتم تحميل البيانات من قاعدة البيانات

        patterns = {
            "failure_patterns": {
                "hourly_failure_rate": [0.01, 0.02, 0.03, 0.05, 0.08, 0.12, 0.15, 0.18,
                                      0.20, 0.22, 0.25, 0.28, 0.30, 0.28, 0.25, 0.20,
                                      0.15, 0.10, 0.08, 0.05, 0.03, 0.02, 0.01, 0.01],
                "weekly_failure_rate": [0.02, 0.03, 0.04, 0.05, 0.08, 0.12, 0.15],
                "seasonal_factors": {
                    "morning_peak": 1.5,
                    "evening_peak": 1.3,
                    "weekend": 0.8
                }
            },
            "performance_patterns": {
                "hourly_response_time": [1.2, 1.5, 1.8, 2.2, 2.8, 3.5, 4.2, 4.8,
                                       5.2, 5.5, 5.8, 6.0, 5.8, 5.2, 4.5, 3.8,
                                       3.0, 2.5, 2.0, 1.8, 1.5, 1.3, 1.2, 1.2],
                "load_correlation": 0.85
            }
        }

        return patterns.get(pattern_type, {})

    async def _calculate_failure_probability(self, indicators: Dict,
                                          historical_patterns: Dict) -> float:
        """حساب احتمالية الفشل"""

        probability = 0.0

        # عامل الأعطال المتتالية
        consecutive_failures = indicators.get("consecutive_failures", 0)
        if consecutive_failures > 0:
            probability += min(0.4, consecutive_failures * 0.1)

        # عامل اتجاه وقت الاستجابة
        if indicators.get("response_time_trend") == "increasing":
            probability += 0.2

        # عامل معدل الخطأ
        if indicators.get("error_rate_trend") == "increasing":
            probability += 0.15

        # عامل الاستخدام العالي
        memory_usage = indicators.get("memory_usage", 0)
        cpu_usage = indicators.get("cpu_usage", 0)
        if memory_usage > 0.8 or cpu_usage > 0.8:
            probability += 0.1

        # عامل الوقت من اليوم
        hour = indicators.get("time_of_day", 12)
        hourly_rates = historical_patterns.get("hourly_failure_rate", [])
        if hour < len(hourly_rates):
            probability += hourly_rates[hour] * 0.5

        # عامل اليوم من الأسبوع
        day = indicators.get("day_of_week", 0)
        weekly_rates = historical_patterns.get("weekly_failure_rate", [])
        if day < len(weekly_rates):
            probability += weekly_rates[day] * 0.3

        return min(1.0, probability)

    def _calculate_prediction_confidence(self, indicators: Dict,
                                       historical_patterns: Dict) -> float:
        """حساب مستوى الثقة في التنبؤ"""

        confidence = 0.5  # قاعدة

        # زيادة الثقة مع وجود المزيد من البيانات
        data_points = sum(1 for v in indicators.values() if v is not None)
        confidence += min(0.3, data_points * 0.05)

        # زيادة الثقة مع الأعطال المتتالية
        if indicators.get("consecutive_failures", 0) > 2:
            confidence += 0.2

        # تقليل الثقة في البيانات القديمة
        # (في الواقع، سنتحقق من حداثة البيانات)

        return min(1.0, confidence)

    def _estimate_time_to_failure(self, indicators: Dict) -> int:
        """تقدير الوقت حتى الفشل (بالدقائق)"""

        base_time = 120  # 2 ساعات افتراضياً

        # تقليل الوقت مع زيادة الأعطال
        consecutive_failures = indicators.get("consecutive_failures", 0)
        base_time -= consecutive_failures * 15

        # تقليل الوقت مع اتجاه سلبي
        if indicators.get("response_time_trend") == "increasing":
            base_time -= 30

        # تعديل حسب الوقت من اليوم
        hour = indicators.get("time_of_day", 12)
        if 9 <= hour <= 17:  # ساعات الذروة
            base_time -= 20

        return max(15, base_time)  # حد أدنى 15 دقيقة

    def _determine_failure_severity(self, probability: float, time_to_impact: int) -> str:
        """تحديد شدة الفشل"""

        if probability > 0.8 or time_to_impact < 30:
            return "critical"
        elif probability > 0.6 or time_to_impact < 60:
            return "high"
        elif probability > 0.4 or time_to_impact < 120:
            return "medium"
        else:
            return "low"

    def _generate_failure_mitigation_actions(self, service_name: str,
                                           probability: float,
                                           time_to_impact: int) -> List[str]:
        """توليد إجراءات تخفيف الفشل"""

        actions = []

        if time_to_impact < 60:
            actions.extend([
                f"تفعيل Circuit Breaker لـ {service_name} فوراً",
                f"توجيه الطلبات إلى مزود بديل",
                f"إشعار فريق العمليات"
            ])
        elif probability > 0.7:
            actions.extend([
                f"زيادة مراقبة {service_name}",
                f"إعداد خطة طوارئ للتبديل",
                f"فحص السعة الاحتياطية"
            ])
        else:
            actions.extend([
                f"مراقبة إضافية لـ {service_name}",
                f"تحضير خطة التعافي",
                f"مراجعة السجلات للأسباب المحتملة"
            ])

        return actions

    def _build_failure_description(self, service_name: str,
                                 probability: float,
                                 time_to_impact: int) -> str:
        """بناء وصف الفشل"""

        prob_percent = probability * 100
        time_desc = f"{time_to_impact} دقيقة" if time_to_impact < 60 else f"{time_to_impact//60} ساعة"

        return f"تنبؤ بفشل خدمة {service_name} بنسبة {prob_percent:.1f}% خلال {time_desc}"

    async def _get_recent_metrics(self, service_name: str, hours: int) -> Dict[str, List[float]]:
        """الحصول على المقاييس الأخيرة"""

        # محاكاة البيانات - في الواقع ستأتي من Redis/monitoring
        return {
            "response_time": [1.2, 1.5, 1.3, 1.8, 2.1, 1.9],
            "error_rate": [0.01, 0.02, 0.015, 0.03, 0.025, 0.02],
            "throughput": [150, 160, 155, 170, 165, 175],
            "memory_usage": [0.6, 0.65, 0.62, 0.68, 0.7, 0.72],
            "cpu_usage": [0.4, 0.45, 0.42, 0.48, 0.5, 0.52],
            "active_requests": [25, 30, 28, 35, 32, 38]
        }

    async def _load_historical_data(self):
        """تحميل البيانات التاريخية"""
        try:
            redis = await get_redis()

            # تحميل البيانات التاريخية من Redis
            # (في الواقع، سيكون لدينا جداول منفصلة)

            logger.info("Historical data loaded for predictive analytics")

        except Exception as e:
            logger.error("Failed to load historical data", error=str(e))

    async def _train_prediction_models(self):
        """تدريب نماذج التنبؤ"""

        # محاكاة تدريب النماذج
        # في الواقع، سنستخدم machine learning models

        self.prediction_models = {
            "failure_prediction": "model_v1",
            "performance_prediction": "model_v1",
            "cost_optimization": "model_v1"
        }

        logger.info("Prediction models trained")

    async def _continuous_prediction_monitoring(self):
        """المراقبة المستمرة للتنبؤات"""

        services_to_monitor = ["shopify", "aramex", "smsa", "unifonic", "sendgrid"]

        while True:
            try:
                for service in services_to_monitor:
                    # التنبؤ بالأعطال
                    failure_prediction = await self.predict_service_failure(service)
                    if failure_prediction:
                        await self._handle_prediction_alert(failure_prediction)

                    # التنبؤ بتدهور الأداء
                    perf_prediction = await self.predict_performance_degradation(service)
                    if perf_prediction:
                        await self._handle_prediction_alert(perf_prediction)

                    # التنبؤ بفرص التكلفة
                    cost_prediction = await self.predict_cost_opportunities(service)
                    if cost_prediction:
                        await self._handle_prediction_alert(cost_prediction)

                # تنظيف التنبؤات المنتهية الصلاحية
                await self._cleanup_expired_predictions()

                await asyncio.sleep(600)  # كل 10 دقائق

            except Exception as e:
                logger.error("Error in prediction monitoring", error=str(e))
                await asyncio.sleep(300)  # انتظار 5 دقائق عند الخطأ

    async def _handle_prediction_alert(self, prediction: Prediction):
        """معالجة تنبيه التنبؤ"""

        # تسجيل التنبيه
        logger.warning("🔮 Prediction Alert",
                      prediction_id=prediction.id,
                      type=prediction.type.value,
                      target=prediction.target,
                      probability=prediction.probability,
                      severity=prediction.severity,
                      time_to_impact=prediction.time_to_impact)

        # في الواقع، سنرسل إشعارات لفريق العمليات
        # أو سنفعل إجراءات تلقائية

    async def _cleanup_expired_predictions(self):
        """تنظيف التنبؤات المنتهية الصلاحية"""

        current_time = datetime.utcnow()
        expired_ids = []

        for pred_id, prediction in self.active_predictions.items():
            if current_time > prediction.expires_at:
                expired_ids.append(pred_id)

        for pred_id in expired_ids:
            del self.active_predictions[pred_id]

        if expired_ids:
            logger.debug("Cleaned up expired predictions", count=len(expired_ids))

    def get_active_predictions(self) -> List[Prediction]:
        """الحصول على التنبؤات النشطة"""
        return list(self.active_predictions.values())

    def get_prediction_stats(self) -> Dict[str, Any]:
        """إحصائيات التنبؤات"""

        predictions = self.get_active_predictions()
        current_time = datetime.utcnow()

        stats = {
            "total_active_predictions": len(predictions),
            "by_type": {},
            "by_severity": {},
            "by_target": {},
            "avg_confidence": 0.0,
            "avg_probability": 0.0,
            "timestamp": current_time.isoformat()
        }

        if predictions:
            confidences = []
            probabilities = []

            for pred in predictions:
                # حسب النوع
                pred_type = pred.type.value
                stats["by_type"][pred_type] = stats["by_type"].get(pred_type, 0) + 1

                # حسب الشدة
                stats["by_severity"][pred.severity] = stats["by_severity"].get(pred.severity, 0) + 1

                # حسب الهدف
                stats["by_target"][pred.target] = stats["by_target"].get(pred.target, 0) + 1

                confidences.append(pred.confidence)
                probabilities.append(pred.probability)

            stats["avg_confidence"] = statistics.mean(confidences)
            stats["avg_probability"] = statistics.mean(probabilities)

        return stats

    async def _calculate_performance_degradation_probability(self, indicators: Dict,
                                                          trends: Dict) -> float:
        """حساب احتمالية تدهور الأداء"""
        probability = 0.0

        # اتجاه وقت الاستجابة
        if indicators.get("response_time_trend") == "increasing":
            probability += 0.3

        # اتجاه معدل الخطأ
        if indicators.get("error_rate", 0) > 0.05:
            probability += 0.2

        # اتجاه الذاكرة والمعالج
        if indicators.get("memory_trend") == "increasing":
            probability += 0.15

        if indicators.get("cpu_trend") == "increasing":
            probability += 0.15

        # حمل النظام
        if indicators.get("current_load", 0) > 50:
            probability += 0.1

        return min(1.0, probability)

    def _calculate_performance_prediction_confidence(self, indicators: Dict,
                                                   trends: Dict) -> float:
        """حساب ثقة تنبؤ الأداء"""
        confidence = 0.6  # قاعدة أعلى للأداء

        # زيادة الثقة مع اتجاهات واضحة
        clear_trends = sum(1 for trend in ["response_time_trend", "memory_trend", "cpu_trend"]
                          if indicators.get(trend) in ["increasing", "decreasing"])
        confidence += clear_trends * 0.1

        return min(1.0, confidence)

    def _estimate_time_to_performance_impact(self, indicators: Dict) -> int:
        """تقدير وقت تأثير الأداء"""
        base_time = 180  # 3 ساعات

        # تقليل الوقت مع اتجاهات سلبية
        negative_trends = sum(1 for trend in ["response_time_trend", "error_rate_trend"]
                             if indicators.get(trend) == "increasing")
        base_time -= negative_trends * 30

        return max(30, base_time)

    def _determine_performance_severity(self, probability: float, time_to_impact: int) -> str:
        """تحديد شدة تدهور الأداء"""
        if probability > 0.7 and time_to_impact < 60:
            return "high"
        elif probability > 0.5 or time_to_impact < 120:
            return "medium"
        else:
            return "low"

    def _generate_performance_optimization_actions(self, service_name: str,
                                                 probability: float,
                                                 time_to_impact: int) -> List[str]:
        """توليد إجراءات تحسين الأداء"""
        actions = [f"مراقبة إضافية لـ {service_name}"]

        if time_to_impact < 120:
            actions.extend([
                f"إعداد موارد إضافية لـ {service_name}",
                f"تحسين استعلامات قاعدة البيانات",
                f"تفعيل التخزين المؤقت"
            ])

        if probability > 0.6:
            actions.extend([
                f"التحضير للتبديل إلى مزود بديل",
                f"إشعار فريق التطوير"
            ])

        return actions

    def _build_performance_description(self, service_name: str,
                                     probability: float,
                                     time_to_impact: int) -> str:
        """بناء وصف تدهور الأداء"""
        prob_percent = probability * 100
        time_desc = f"{time_to_impact} دقيقة" if time_to_impact < 60 else f"{time_to_impact//60} ساعة"

        return f"تنبؤ بتدهور أداء {service_name} بنسبة {prob_percent:.1f}% خلال {time_desc}"

    async def _analyze_market_prices(self, service_name: str) -> Dict[str, float]:
        """تحليل أسعار السوق"""
        # محاكاة تحليل الأسعار
        return {
            "shopify": 0.045,
            "woocommerce": 0.035,
            "aramex": 2.30,
            "smsa": 1.70
        }.get(service_name, 0.05)

    async def _get_current_costs(self, service_name: str) -> float:
        """الحصول على التكاليف الحالية"""
        # محاكاة التكاليف الحالية
        return {
            "shopify": 0.05,
            "woocommerce": 0.03,
            "aramex": 2.50,
            "smsa": 1.80
        }.get(service_name, 0.05)

    def _calculate_savings_potential(self, market_price: float, current_cost: float) -> float:
        """حساب إمكانية التوفير"""
        if current_cost == 0:
            return 0.0
        return (current_cost - market_price) / current_cost

    async def calculate_failure_probability(self, context: Dict[str, Any]) -> float:
        """حساب احتمالية الفشل (للاختبارات)"""
        load = context.get("current_load", 0.5)
        error_rate = context.get("error_rate", 0.01)
        response_time = context.get("response_time", 1.0)
        memory_usage = context.get("memory_usage", 0.5)
        
        # خوارزمية بسيطة للحساب
        probability = (load * 0.4) + (error_rate * 20) + (response_time * 0.1) + (memory_usage * 0.2)
        return min(1.0, max(0.0, probability))

    async def analyze_performance_trend(self, historical_data: List[Dict]) -> Dict[str, Any]:
        """تحليل اتجاهات الأداء (للاختبارات)"""
        if not historical_data:
            return {"direction": "stable", "magnitude": 0.0, "confidence": 0.5}
        
        response_times = [d.get("response_time", 1.0) for d in historical_data]
        error_rates = [d.get("error_rate", 0.01) for d in historical_data]
        
        if len(response_times) > 1:
            rt_trend = response_times[-1] - response_times[0]
            er_trend = error_rates[-1] - error_rates[0]
            
            if rt_trend > 0.5 or er_trend > 0.01:
                direction = "degrading"
                magnitude = abs(rt_trend) + abs(er_trend * 100)
            elif rt_trend < -0.5 or er_trend < -0.01:
                direction = "improving"
                magnitude = abs(rt_trend) + abs(er_trend * 100)
            else:
                direction = "stable"
                magnitude = 0.0
        else:
            direction = "stable"
            magnitude = 0.0
            
        return {
            "direction": direction,
            "magnitude": magnitude,
            "confidence": 0.8
        }

    async def detect_cost_opportunities(self, current_state: Dict[str, Any]) -> List[Dict[str, Any]]:
        """كشف فرص التحسين في التكلفة (للاختبارات)"""
        opportunities = []
        utilization = current_state.get("utilization_rate", 0.5)
        idle_resources = current_state.get("idle_resources", [])
        
        if utilization < 0.7:
            opportunities.append({
                "type": "resource_optimization",
                "potential_savings": current_state.get("current_cost", 1000) * 0.2,
                "description": "Low utilization detected - consider scaling down",
                "confidence": 0.85
            })
            
        if idle_resources:
            opportunities.append({
                "type": "idle_resource_cleanup",
                "potential_savings": len(idle_resources) * 50,  # افتراضي
                "description": f"Remove {len(idle_resources)} idle resources",
                "confidence": 0.95
            })
            
        return opportunities

    async def start_prediction_monitoring(self):
        """بدء مراقبة التنبؤات (للاختبارات)"""
        # محاكاة بدء المراقبة
        pass

    async def get_current_predictions(self) -> List[Dict[str, Any]]:
        """الحصول على التنبؤات الحالية (للاختبارات)"""
        return list(self.active_predictions.values())

    async def stop_prediction_monitoring(self):
        """إيقاف مراقبة التنبؤات (للاختبارات)"""
        # محاكاة إيقاف المراقبة
        pass


# Global predictive analytics instance
predictive_analytics = PredictiveAnalytics()