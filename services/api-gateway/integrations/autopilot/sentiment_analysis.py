"""

Sentiment Analysis for HaderOS

تحليل المشاعر في النصوص لفهم آراء العملاء وتحسين الخدمات.

"""

import asyncio
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from dataclasses import dataclass
from enum import Enum
import structlog

try:
    from textblob import TextBlob
    TEXTBLOB_AVAILABLE = True
except ImportError:
    TEXTBLOB_AVAILABLE = False
    print("⚠️ TextBlob غير متوفر. قم بتثبيته: pip install textblob")

from services.api_gateway.core.database import get_redis

logger = structlog.get_logger(__name__)


class SentimentType(Enum):
    """أنواع المشاعر"""
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"


@dataclass
class SentimentResult:
    """نتيجة تحليل المشاعر"""
    text: str
    sentiment: SentimentType
    polarity: float  # من -1 (سلبي) إلى 1 (إيجابي)
    subjectivity: float  # من 0 (موضوعي) إلى 1 (ذاتي)
    confidence: float
    timestamp: datetime
    source: str  # مصدر النص (مثل: shopify_review, aramex_feedback)


@dataclass
class SentimentMetrics:
    """مقاييس تحليل المشاعر"""
    total_analyzed: int = 0
    positive_count: int = 0
    negative_count: int = 0
    neutral_count: int = 0
    average_polarity: float = 0.0
    average_subjectivity: float = 0.0
    last_updated: datetime = None

    def __post_init__(self):
        if self.last_updated is None:
            self.last_updated = datetime.utcnow()


class SentimentAnalyzer:
    """محلل المشاعر"""

    def __init__(self):
        self.metrics = SentimentMetrics()
        self.analysis_history: List[SentimentResult] = []
        self.is_initialized = False

    async def initialize_sentiment_analyzer(self):
        """تهيئة محلل المشاعر"""
        if not TEXTBLOB_AVAILABLE:
            logger.error("TextBlob غير متوفر. قم بتثبيته أولاً")
            return False

        # تحميل البيانات التاريخية
        await self._load_historical_data()

        self.is_initialized = True
        logger.info("🔍 Sentiment Analyzer initialized")
        return True

    async def analyze_text(self, text: str, source: str = "unknown") -> SentimentResult:
        """تحليل مشاعر النص"""

        if not self.is_initialized:
            raise RuntimeError("Sentiment Analyzer not initialized")

        if not TEXTBLOB_AVAILABLE:
            raise RuntimeError("TextBlob not available")

        # تحليل النص باستخدام TextBlob
        blob = TextBlob(text)
        polarity = blob.sentiment.polarity
        subjectivity = blob.sentiment.subjectivity

        # تحديد نوع المشاعر
        if polarity > 0.1:
            sentiment = SentimentType.POSITIVE
        elif polarity < -0.1:
            sentiment = SentimentType.NEGATIVE
        else:
            sentiment = SentimentType.NEUTRAL

        # حساب الثقة (بناءً على القوة المطلقة)
        confidence = min(abs(polarity) * 2, 1.0)

        result = SentimentResult(
            text=text,
            sentiment=sentiment,
            polarity=polarity,
            subjectivity=subjectivity,
            confidence=confidence,
            timestamp=datetime.utcnow(),
            source=source
        )

        # حفظ النتيجة
        await self._save_result(result)
        self.analysis_history.append(result)

        # تحديث المقاييس
        await self._update_metrics(result)

        logger.info("📊 Text analyzed",
                   sentiment=sentiment.value,
                   polarity=polarity,
                   confidence=confidence,
                   source=source)

        return result

    async def analyze_batch(self, texts: List[Dict[str, str]]) -> List[SentimentResult]:
        """تحليل دفعة من النصوص"""

        results = []
        for text_data in texts:
            text = text_data.get("text", "")
            source = text_data.get("source", "batch")

            if text.strip():
                result = await self.analyze_text(text, source)
                results.append(result)

        return results

    async def get_sentiment_trends(self, hours: int = 24) -> Dict[str, Any]:
        """الحصول على اتجاهات المشاعر"""

        # تصفية النتائج حسب الوقت
        cutoff_time = datetime.utcnow().replace(hour=datetime.utcnow().hour - hours)
        recent_results = [r for r in self.analysis_history if r.timestamp > cutoff_time]

        if not recent_results:
            return {"message": "لا توجد بيانات كافية للتحليل"}

        # حساب الإحصائيات
        total = len(recent_results)
        positive = len([r for r in recent_results if r.sentiment == SentimentType.POSITIVE])
        negative = len([r for r in recent_results if r.sentiment == SentimentType.NEGATIVE])
        neutral = len([r for r in recent_results if r.sentiment == SentimentType.NEUTRAL])

        avg_polarity = sum(r.polarity for r in recent_results) / total
        avg_subjectivity = sum(r.subjectivity for r in recent_results) / total

        return {
            "period_hours": hours,
            "total_analyzed": total,
            "sentiment_distribution": {
                "positive": positive,
                "negative": negative,
                "neutral": neutral,
                "positive_percentage": (positive / total) * 100,
                "negative_percentage": (negative / total) * 100,
                "neutral_percentage": (neutral / total) * 100
            },
            "averages": {
                "polarity": avg_polarity,
                "subjectivity": avg_subjectivity
            },
            "trends": await self._calculate_trends(recent_results)
        }

    async def get_customer_insights(self) -> Dict[str, Any]:
        """الحصول على رؤى حول العملاء"""

        # تحليل الملاحظات السلبية
        negative_feedback = [r for r in self.analysis_history
                           if r.sentiment == SentimentType.NEGATIVE and r.confidence > 0.5]

        # استخراج الكلمات الشائعة في الملاحظات السلبية
        negative_words = await self._extract_common_words(negative_feedback)

        # اقتراحات للتحسين
        recommendations = await self._generate_improvement_recommendations(negative_feedback)

        return {
            "negative_feedback_count": len(negative_feedback),
            "common_negative_words": negative_words,
            "improvement_recommendations": recommendations,
            "customer_satisfaction_score": await self._calculate_satisfaction_score()
        }

    def get_sentiment_metrics(self) -> Dict[str, Any]:
        """الحصول على مقاييس تحليل المشاعر"""
        return {
            "metrics": {
                "total_analyzed": self.metrics.total_analyzed,
                "sentiment_distribution": {
                    "positive": self.metrics.positive_count,
                    "negative": self.metrics.negative_count,
                    "neutral": self.metrics.neutral_count
                },
                "averages": {
                    "polarity": self.metrics.average_polarity,
                    "subjectivity": self.metrics.average_subjectivity
                }
            },
            "last_updated": self.metrics.last_updated.isoformat() if self.metrics.last_updated else None
        }

    async def _save_result(self, result: SentimentResult):
        """حفظ نتيجة التحليل في Redis"""
        try:
            redis = await get_redis()
            key = f"sentiment:{result.timestamp.isoformat()}"
            data = {
                "text": result.text[:200],  # اقتصار النص
                "sentiment": result.sentiment.value,
                "polarity": result.polarity,
                "subjectivity": result.subjectivity,
                "confidence": result.confidence,
                "source": result.source,
                "timestamp": result.timestamp.isoformat()
            }
            await redis.setex(key, 86400 * 30, str(data))  # 30 يوم
        except Exception as e:
            logger.warning("Failed to save sentiment result", error=str(e))

    async def _load_historical_data(self):
        """تحميل البيانات التاريخية"""
        try:
            redis = await get_redis()
            # تحميل آخر 100 نتيجة
            keys = await redis.keys("sentiment:*")
            if keys:
                recent_keys = sorted(keys, reverse=True)[:100]
                for key in recent_keys:
                    data_str = await redis.get(key)
                    if data_str:
                        # تحليل البيانات (مبسط)
                        self.metrics.total_analyzed += 1
        except Exception as e:
            logger.warning("Failed to load historical sentiment data", error=str(e))

    async def _update_metrics(self, result: SentimentResult):
        """تحديث المقاييس"""
        self.metrics.total_analyzed += 1

        if result.sentiment == SentimentType.POSITIVE:
            self.metrics.positive_count += 1
        elif result.sentiment == SentimentType.NEGATIVE:
            self.metrics.negative_count += 1
        else:
            self.metrics.neutral_count += 1

        # تحديث المعدلات
        total = self.metrics.total_analyzed
        self.metrics.average_polarity = (
            (self.metrics.average_polarity * (total - 1)) + result.polarity
        ) / total
        self.metrics.average_subjectivity = (
            (self.metrics.average_subjectivity * (total - 1)) + result.subjectivity
        ) / total

        self.metrics.last_updated = datetime.utcnow()

    async def _calculate_trends(self, results: List[SentimentResult]) -> Dict[str, Any]:
        """حساب الاتجاهات"""
        if len(results) < 2:
            return {"trend": "insufficient_data"}

        # ترتيب حسب الوقت
        sorted_results = sorted(results, key=lambda x: x.timestamp)

        # حساب التغيير في المتوسط
        mid_point = len(sorted_results) // 2
        first_half = sorted_results[:mid_point]
        second_half = sorted_results[mid_point:]

        first_avg = sum(r.polarity for r in first_half) / len(first_half) if first_half else 0
        second_avg = sum(r.polarity for r in second_half) / len(second_half) if second_half else 0

        trend = "stable"
        if second_avg > first_avg + 0.1:
            trend = "improving"
        elif second_avg < first_avg - 0.1:
            trend = "declining"

        return {
            "trend": trend,
            "change": second_avg - first_avg,
            "first_half_avg": first_avg,
            "second_half_avg": second_avg
        }

    async def _extract_common_words(self, results: List[SentimentResult]) -> List[str]:
        """استخراج الكلمات الشائعة من الملاحظات السلبية"""
        if not TEXTBLOB_AVAILABLE or not results:
            return []

        all_words = []
        for result in results:
            blob = TextBlob(result.text)
            # استخراج الكلمات الاسمية والصفات
            words = [word.lower() for word, tag in blob.tags
                    if tag in ['NN', 'NNS', 'JJ', 'JJR', 'JJS'] and len(word) > 3]
            all_words.extend(words)

        # عد الكلمات
        word_counts = {}
        for word in all_words:
            word_counts[word] = word_counts.get(word, 0) + 1

        # إرجاع أكثر 10 كلمات شيوعاً
        return sorted(word_counts.items(), key=lambda x: x[1], reverse=True)[:10]

    async def _generate_improvement_recommendations(self, negative_results: List[SentimentResult]) -> List[str]:
        """توليد توصيات للتحسين"""
        recommendations = []

        if not negative_results:
            return ["لا توجد ملاحظات سلبية كافية لتوليد توصيات"]

        # تحليل أنماط الشكاوى
        common_words = await self._extract_common_words(negative_results)

        # توليد توصيات بناءً على الكلمات الشائعة
        word_to_recommendation = {
            "shipping": "تحسين خدمة الشحن وتقليل أوقات التسليم",
            "delivery": "تحسين دقة مواعيد التسليم",
            "quality": "تحسين جودة المنتجات",
            "price": "مراجعة سياسة التسعير",
            "service": "تحسين خدمة العملاء",
            "packaging": "تحسين تغليف المنتجات",
            "size": "تحسين دقة أحجام المنتجات",
            "return": "تبسيط عملية الإرجاع",
            "communication": "تحسين التواصل مع العملاء"
        }

        for word, count in common_words:
            if word in word_to_recommendation:
                recommendations.append(word_to_recommendation[word])

        if not recommendations:
            recommendations.append("تحسين التواصل مع العملاء وجمع ملاحظاتهم بانتظام")

        return recommendations[:5]  # أقصى 5 توصيات

    async def _calculate_satisfaction_score(self) -> float:
        """حساب درجة رضا العملاء"""
        if self.metrics.total_analyzed == 0:
            return 0.0

        # درجة الرضا = (إيجابي + محايد/2) / إجمالي
        positive_weight = self.metrics.positive_count
        neutral_weight = self.metrics.neutral_count * 0.5

        satisfaction = (positive_weight + neutral_weight) / self.metrics.total_analyzed
        return min(satisfaction * 100, 100.0)  # كنسبة مئوية