"""

Continuous Learning System for HaderOS Autopilot

نظام التعلم المستمر الذي يحسن من أداء النظام بناءً على النتائج السابقة.

"""

import asyncio
import json
import statistics
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import structlog

from services.api_gateway.core.database import get_redis
from services.api_gateway.integrations.autopilot.decision_engine import DecisionOutcome

logger = structlog.get_logger(__name__)


class LearningMetric(Enum):
    """مقاييس التعلم"""
    DECISION_ACCURACY = "decision_accuracy"
    COST_OPTIMIZATION = "cost_optimization"
    PERFORMANCE_IMPACT = "performance_impact"
    RELIABILITY_IMPROVEMENT = "reliability_improvement"
    USER_SATISFACTION = "user_satisfaction"


@dataclass
class LearningPattern:
    """نمط تعلم"""
    pattern_id: str
    pattern_type: str
    conditions: Dict[str, Any]
    action: str
    confidence: float
    success_rate: float
    times_applied: int
    last_updated: datetime
    performance_impact: float


@dataclass
class LearningFeedback:
    """تغذية راجعة للتعلم"""
    feedback_id: str
    decision_id: str
    metric: LearningMetric
    value: float
    context: Dict[str, Any]
    timestamp: datetime
    weight: float  # أهمية التغذية الراجعة


class ContinuousLearningSystem:
    """نظام التعلم المستمر"""

    def __init__(self):
        self.learning_patterns = {}
        self.feedback_history = []
        self.performance_metrics = {}
        self.is_learning_enabled = True

    async def initialize_learning_system(self):
        """تهيئة نظام التعلم"""
        # تحميل الأنماط الموجودة
        await self._load_learning_patterns()

        # تحميل البيانات التاريخية
        await self._load_historical_feedback()

        # بدء عملية التعلم
        asyncio.create_task(self._continuous_learning_loop())

        logger.info("🧠 Continuous Learning system initialized")

    async def learn_from_decision_outcome(self, outcome: DecisionOutcome):
        """التعلم من نتيجة قرار"""

        # تحليل النتيجة
        analysis = await self._analyze_decision_outcome(outcome)

        # استخراج الأنماط
        patterns = await self._extract_learning_patterns(outcome, analysis)

        # تحديث النماذج
        await self._update_learning_models(patterns, outcome)

        # تسجيل التعلم
        await self._log_learning_event(outcome, analysis, patterns)

        logger.info("🧠 Learned from decision outcome",
                   decision_id=outcome.decision_id,
                   feedback_score=outcome.feedback_score,
                   patterns_learned=len(patterns))

    async def provide_learning_feedback(self, metric: LearningMetric,
                                      value: float, context: Dict[str, Any],
                                      weight: float = 1.0) -> str:
        """تقديم تغذية راجعة للتعلم"""

        feedback = LearningFeedback(
            feedback_id=f"feedback_{int(datetime.utcnow().timestamp())}_{hash(str(context))}",
            decision_id=context.get('decision_id', 'unknown'),
            metric=metric,
            value=value,
            context=context,
            timestamp=datetime.utcnow(),
            weight=weight
        )

        # حفظ التغذية الراجعة
        await self._store_feedback(feedback)

        # تطبيق التعلم الفوري
        await self._apply_immediate_learning(feedback)

        logger.info("📚 Learning feedback received",
                   metric=metric.value,
                   value=value,
                   weight=weight)

        return feedback.feedback_id
    async def _apply_immediate_learning(self, feedback: LearningFeedback):
        """تطبيق التعلم الفوري (للاختبارات)"""
        # محاكاة التعلم الفوري
        pass
    async def _store_feedback(self, feedback: LearningFeedback):
        """حفظ التغذية الراجعة (للاختبارات)"""
        self.feedback_history.append(feedback)
        # محاكاة الحفظ الناجح
        return True

    async def get_learning_recommendations(self, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """الحصول على توصيات التعلم"""

        recommendations = []

        # البحث عن أنماط مشابهة
        matching_patterns = await self._find_matching_patterns(context)

        for pattern in matching_patterns:
            if pattern.confidence > 0.7 and pattern.success_rate > 0.8:
                recommendations.append({
                    "pattern_id": pattern.pattern_id,
                    "recommendation": pattern.action,
                    "confidence": pattern.confidence,
                    "expected_impact": pattern.performance_impact,
                    "reasoning": f"Pattern matched with {pattern.success_rate*100:.1f}% success rate"
                })

        # ترتيب حسب الثقة والتأثير
        recommendations.sort(key=lambda x: (x['confidence'], x['expected_impact']), reverse=True)

        return recommendations[:5]  # أفضل 5 توصيات

    def get_learning_stats(self) -> Dict[str, Any]:
        """إحصائيات التعلم"""

        total_patterns = len(self.learning_patterns)
        total_feedback = len(self.feedback_history)

        # حساب معدلات النجاح
        success_rates = {}
        for pattern in self.learning_patterns.values():
            success_rates[pattern.pattern_type] = pattern.success_rate

        # مقاييس الأداء
        performance_trends = self._calculate_performance_trends()

        return {
            "total_patterns": total_patterns,
            "total_feedback": total_feedback,
            "success_rates": success_rates,
            "performance_trends": performance_trends,
            "learning_enabled": self.is_learning_enabled,
            "last_updated": datetime.utcnow().isoformat()
        }

    async def _analyze_decision_outcome(self, outcome: DecisionOutcome) -> Dict[str, Any]:
        """تحليل نتيجة القرار"""

        analysis = {
            "success_score": outcome.feedback_score,
            "cost_efficiency": 0.0,
            "performance_gain": 0.0,
            "reliability_improvement": 0.0,
            "lessons_learned": []
        }

        # تحليل الكفاءة في التكلفة
        if outcome.actual_cost > 0:
            # في الواقع، سنقارن مع التكلفة المتوقعة
            analysis["cost_efficiency"] = outcome.feedback_score

        # تحليل تحسن الأداء
        if outcome.actual_performance > 0:
            analysis["performance_gain"] = outcome.feedback_score

        # استخراج الدروس المستفادة
        if outcome.success:
            analysis["lessons_learned"].append("positive_outcome")
        else:
            analysis["lessons_learned"].extend([
                "negative_outcome",
                f"error: {outcome.error_message}" if outcome.error_message else "unknown_error"
            ])

        # تحليل الوقت
        if outcome.execution_time < 1.0:  # أقل من ثانية
            analysis["lessons_learned"].append("fast_execution")
        elif outcome.execution_time > 5.0:  # أكثر من 5 ثوان
            analysis["lessons_learned"].append("slow_execution")

        return analysis

    async def _extract_learning_patterns(self, outcome: DecisionOutcome,
                                       analysis: Dict[str, Any]) -> List[LearningPattern]:
        """استخراج أنماط التعلم"""

        patterns = []

        # نمط نجاح/فشل القرار
        success_pattern = LearningPattern(
            pattern_id=f"success_pattern_{outcome.decision_id}",
            pattern_type="decision_success",
            conditions={
                "feedback_score_range": self._categorize_score(outcome.feedback_score),
                "execution_time_range": self._categorize_time(outcome.execution_time)
            },
            action="maintain_similar_decisions" if outcome.success else "avoid_similar_decisions",
            confidence=abs(outcome.feedback_score - 0.5) * 2,  # ثقة أعلى للنتائج الواضحة
            success_rate=outcome.feedback_score,
            times_applied=1,
            last_updated=datetime.utcnow(),
            performance_impact=outcome.feedback_score - 0.5
        )
        patterns.append(success_pattern)

        # نمط الكفاءة في التكلفة
        if analysis["cost_efficiency"] > 0.7:
            cost_pattern = LearningPattern(
                pattern_id=f"cost_pattern_{outcome.decision_id}",
                pattern_type="cost_optimization",
                conditions={
                    "cost_efficiency": "high",
                    "success": outcome.success
                },
                action="prioritize_cost_savings",
                confidence=analysis["cost_efficiency"],
                success_rate=analysis["cost_efficiency"],
                times_applied=1,
                last_updated=datetime.utcnow(),
                performance_impact=analysis["cost_efficiency"]
            )
            patterns.append(cost_pattern)

        # نمط تحسن الأداء
        if analysis["performance_gain"] > 0.6:
            perf_pattern = LearningPattern(
                pattern_id=f"perf_pattern_{outcome.decision_id}",
                pattern_type="performance_optimization",
                conditions={
                    "performance_gain": "significant",
                    "execution_time": "reasonable"
                },
                action="optimize_for_performance",
                confidence=analysis["performance_gain"],
                success_rate=analysis["performance_gain"],
                times_applied=1,
                last_updated=datetime.utcnow(),
                performance_impact=analysis["performance_gain"]
            )
            patterns.append(perf_pattern)

        return patterns

    async def _update_learning_models(self, patterns: List[LearningPattern],
                                    outcome: DecisionOutcome):
        """تحديث نماذج التعلم"""

        for pattern in patterns:
            # البحث عن أنماط مشابهة موجودة
            existing_pattern = await self._find_similar_pattern(pattern)

            if existing_pattern:
                # تحديث النمط الموجود
                await self._merge_patterns(existing_pattern, pattern)
            else:
                # إضافة نمط جديد
                self.learning_patterns[pattern.pattern_id] = pattern
                await self._persist_pattern(pattern)

    async def _find_similar_pattern(self, new_pattern: LearningPattern) -> Optional[LearningPattern]:
        """البحث عن نمط مشابه"""

        for existing in self.learning_patterns.values():
            if existing.pattern_type == new_pattern.pattern_type:
                # مقارنة الشروط
                if self._patterns_similar(existing.conditions, new_pattern.conditions):
                    return existing

        return None

    def _patterns_similar(self, conditions1: Dict[str, Any],
                         conditions2: Dict[str, Any]) -> bool:
        """فحص تشابه الأنماط"""

        # مقارنة بسيطة - في الواقع سنستخدم خوارزميات أكثر تعقيداً
        common_keys = set(conditions1.keys()) & set(conditions2.keys())

        if not common_keys:
            return False

        matches = 0
        for key in common_keys:
            if conditions1[key] == conditions2[key]:
                matches += 1

        return (matches / len(common_keys)) > 0.7

    async def _merge_patterns(self, existing: LearningPattern, new: LearningPattern):
        """دمج نمطين مشابهين"""

        # حساب المتوسط المرجح
        total_applications = existing.times_applied + new.times_applied

        existing.success_rate = (
            (existing.success_rate * existing.times_applied) +
            (new.success_rate * new.times_applied)
        ) / total_applications

        existing.confidence = (
            (existing.confidence * existing.times_applied) +
            (new.confidence * new.times_applied)
        ) / total_applications

        existing.performance_impact = (
            (existing.performance_impact * existing.times_applied) +
            (new.performance_impact * new.times_applied)
        ) / total_applications

        existing.times_applied = total_applications
        existing.last_updated = datetime.utcnow()

        # حفظ التحديث
        await self._persist_pattern(existing)

    async def _persist_pattern(self, pattern: LearningPattern):
        """حفظ النمط في Redis"""
        try:
            redis = await get_redis()
            key = f"learning_pattern:{pattern.pattern_id}"

            await redis.setex(key, 86400 * 30, json.dumps(asdict(pattern)))  # 30 يوم

        except Exception as e:
            logger.error("Failed to persist learning pattern", error=str(e))

    async def _store_feedback(self, feedback: LearningFeedback):
        """حفظ التغذية الراجعة"""
        try:
            redis = await get_redis()
            key = f"learning_feedback:{feedback.feedback_id}"

            await redis.setex(key, 86400 * 7, json.dumps(asdict(feedback)))  # أسبوع

            # إضافة إلى التاريخ
            self.feedback_history.append(feedback)

            # الحفاظ على حجم محدود للتاريخ
            if len(self.feedback_history) > 1000:
                self.feedback_history = self.feedback_history[-500:]  # احتفظ بآخر 500

        except Exception as e:
            logger.error("Failed to store learning feedback", error=str(e))

    async def _apply_immediate_learning(self, feedback: LearningFeedback):
        """تطبيق التعلم الفوري"""

        # تحديث المقاييس
        metric_key = f"{feedback.metric.value}_trend"
        if metric_key not in self.performance_metrics:
            self.performance_metrics[metric_key] = []

        self.performance_metrics[metric_key].append({
            "value": feedback.value,
            "timestamp": feedback.timestamp,
            "weight": feedback.weight
        })

        # الحفاظ على آخر 100 قيمة
        if len(self.performance_metrics[metric_key]) > 100:
            self.performance_metrics[metric_key] = self.performance_metrics[metric_key][-50:]

    async def _find_matching_patterns(self, context: Dict[str, Any]) -> List[LearningPattern]:
        """البحث عن الأنماط المطابقة"""

        matching_patterns = []

        for pattern in self.learning_patterns.values():
            match_score = self._calculate_pattern_match(pattern, context)

            if match_score > 0.6:  # عتبة المطابقة
                # نسخة مع تحديث الثقة بناءً على المطابقة
                matched_pattern = LearningPattern(
                    pattern_id=pattern.pattern_id,
                    pattern_type=pattern.pattern_type,
                    conditions=pattern.conditions,
                    action=pattern.action,
                    confidence=pattern.confidence * match_score,
                    success_rate=pattern.success_rate,
                    times_applied=pattern.times_applied,
                    last_updated=pattern.last_updated,
                    performance_impact=pattern.performance_impact
                )
                matching_patterns.append(matched_pattern)

        return matching_patterns

    def _calculate_pattern_match(self, pattern: LearningPattern, context: Dict[str, Any]) -> float:
        """حساب درجة مطابقة النمط"""

        if not pattern.conditions:
            return 0.0

        matches = 0
        total_conditions = len(pattern.conditions)

        for condition_key, condition_value in pattern.conditions.items():
            context_value = context.get(condition_key)

            if context_value is not None:
                if isinstance(condition_value, str):
                    # مطابقة نصية
                    if context_value == condition_value:
                        matches += 1
                elif isinstance(condition_value, (int, float)):
                    # مطابقة رقمية تقريبية
                    if abs(context_value - condition_value) / max(abs(condition_value), 1) < 0.2:
                        matches += 1
                elif isinstance(condition_value, dict):
                    # مطابقة معقدة
                    if self._complex_match(condition_value, context_value):
                        matches += 1

        return matches / total_conditions if total_conditions > 0 else 0.0

    def _complex_match(self, pattern_condition: Dict[str, Any], context_value: Any) -> bool:
        """مطابقة معقدة للشروط"""
        # منطق مطابقة بسيط - يمكن توسيعه
        if isinstance(context_value, dict):
            return all(k in context_value and context_value[k] == v
                      for k, v in pattern_condition.items())
        return False

    async def _log_learning_event(self, outcome: DecisionOutcome, analysis: Dict[str, Any], patterns: List[LearningPattern]):
        """تسجيل حدث التعلم (للاختبارات)"""
        # محاكاة تسجيل الحدث
        pass

    async def _continuous_learning_loop(self):
        """حلقة التعلم المستمر"""

        while self.is_learning_enabled:
            try:
                # تحليل الأداء التراكمي
                await self._analyze_cumulative_performance()

                # تحديث النماذج بناءً على البيانات الجديدة
                await self._update_models_from_new_data()

                # تنظيف البيانات القديمة
                await self._cleanup_old_learning_data()

                await asyncio.sleep(3600)  # كل ساعة

            except Exception as e:
                logger.error("Error in learning loop", error=str(e))
                await asyncio.sleep(300)  # انتظار 5 دقائق عند الخطأ

    async def _analyze_cumulative_performance(self):
        """تحليل الأداء التراكمي"""

        # حساب اتجاهات الأداء
        for metric_name, data_points in self.performance_metrics.items():
            if len(data_points) >= 10:
                recent_values = [p["value"] for p in data_points[-10:]]
                trend = self._calculate_trend(recent_values)

                logger.info("📊 Performance trend analyzed",
                           metric=metric_name,
                           trend=trend,
                           data_points=len(recent_values))

    async def _update_models_from_new_data(self):
        """تحديث النماذج بناءً على البيانات الجديدة"""

        # إعادة تقييم الأنماط بناءً على البيانات الأحدث
        for pattern in list(self.learning_patterns.values()):
            # فحص ما إذا كان النمط لا يزال صالحاً
            if await self._is_pattern_still_valid(pattern):
                # تحديث معدلات النجاح
                updated_success_rate = await self._recalculate_pattern_success_rate(pattern)
                pattern.success_rate = updated_success_rate
                pattern.last_updated = datetime.utcnow()

                await self._persist_pattern(pattern)
            else:
                # إزالة النمط إذا لم يعد صالحاً
                if pattern.pattern_id in self.learning_patterns:
                    del self.learning_patterns[pattern.pattern_id]
                    logger.info("🗑️ Removed invalid learning pattern",
                               pattern_id=pattern.pattern_id)

    async def _cleanup_old_learning_data(self):
        """تنظيف البيانات القديمة"""

        cutoff_date = datetime.utcnow() - timedelta(days=30)

        # تنظيف التغذية الراجعة القديمة
        self.feedback_history = [
            f for f in self.feedback_history
            if f.timestamp > cutoff_date
        ]

        # تنظيف نقاط البيانات القديمة
        for metric_name in self.performance_metrics:
            self.performance_metrics[metric_name] = [
                p for p in self.performance_metrics[metric_name]
                if p["timestamp"] > cutoff_date
            ]

    async def _is_pattern_still_valid(self, pattern: LearningPattern) -> bool:
        """فحص ما إذا كان النمط لا يزال صالحاً"""

        # النمط صالح إذا تم تطبيقه مؤخراً ولديه معدل نجاح جيد
        days_since_update = (datetime.utcnow() - pattern.last_updated).days

        # النمط قديم جداً
        if days_since_update > 30:
            return False

        # معدل نجاح منخفض جداً
        if pattern.success_rate < 0.3:
            return False

        # لم يتم تطبيقه كثيراً
        if pattern.times_applied < 3:
            return days_since_update < 7  # أعطِ فرصة أكبر للأنماط الجديدة

        return True

    async def _recalculate_pattern_success_rate(self, pattern: LearningPattern) -> float:
        """إعادة حساب معدل نجاح النمط"""

        # في الواقع، سنبحث في قاعدة البيانات عن جميع التطبيقات الأخيرة
        # هنا سنستخدم محاكاة بسيطة

        # افتراض أن معدل النجاح يتحسن قليلاً مع الوقت (التعلم)
        improvement_factor = min(0.1, pattern.times_applied * 0.01)

        return min(1.0, pattern.success_rate + improvement_factor)

    def _calculate_trend(self, values: List[float]) -> str:
        """حساب الاتجاه من القيم"""
        if len(values) < 3:
            return "insufficient_data"

        # حساب الميل باستخدام الانحدار الخطي البسيط
        n = len(values)
        x = list(range(n))
        y = values

        slope = self._calculate_slope(x, y)

        if slope > 0.05:
            return "improving"
        elif slope < -0.05:
            return "degrading"
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

    def _categorize_score(self, score: float) -> str:
        """تصنيف الدرجة"""
        if score >= 0.8:
            return "excellent"
        elif score >= 0.6:
            return "good"
        elif score >= 0.4:
            return "fair"
        else:
            return "poor"

    def _categorize_time(self, execution_time: float) -> str:
        """تصنيف الوقت"""
        if execution_time < 1.0:
            return "fast"
        elif execution_time < 5.0:
            return "normal"
        else:
            return "slow"

    async def _load_learning_patterns(self):
        """تحميل أنماط التعلم من Redis"""
        try:
            redis = await get_redis()
            pattern_keys = await redis.keys("learning_pattern:*")

            for key in pattern_keys:
                pattern_data = await redis.get(key)
                if pattern_data:
                    pattern_dict = json.loads(pattern_data)
                    pattern_dict['last_updated'] = datetime.fromisoformat(pattern_dict['last_updated'])
                    pattern = LearningPattern(**pattern_dict)
                    self.learning_patterns[pattern.pattern_id] = pattern

            logger.info("Loaded learning patterns", count=len(self.learning_patterns))

        except Exception as e:
            logger.error("Failed to load learning patterns", error=str(e))

    async def _load_historical_feedback(self):
        """تحميل التغذية الراجعة التاريخية"""
        try:
            redis = await get_redis()
            feedback_keys = await redis.keys("learning_feedback:*")

            for key in feedback_keys:
                feedback_data = await redis.get(key)
                if feedback_data:
                    feedback_dict = json.loads(feedback_data)
                    feedback_dict['timestamp'] = datetime.fromisoformat(feedback_dict['timestamp'])
                    feedback = LearningFeedback(**feedback_dict)
                    self.feedback_history.append(feedback)

            # ترتيب زمنياً
            self.feedback_history.sort(key=lambda x: x.timestamp)

            logger.info("Loaded historical feedback", count=len(self.feedback_history))

        except Exception as e:
            logger.error("Failed to load historical feedback", error=str(e))

    def _calculate_performance_trends(self) -> Dict[str, str]:
        """حساب اتجاهات الأداء"""
        trends = {}

        for metric_name, data_points in self.performance_metrics.items():
            if len(data_points) >= 5:
                values = [p["value"] for p in data_points[-10:]]  # آخر 10 نقاط
                trend = self._calculate_trend(values)
                trends[metric_name] = trend

        return trends


# Global continuous learning instance
continuous_learning = ContinuousLearningSystem()