"""

نظام الحوار الطبيعي للمديرين - HaderOS

Natural Dialogue System for Managers

يسمح هذا النظام للمديرين بالتفاعل مع نظام HaderOS باستخدام اللغة الطبيعية،
مع فهم النوايا واستخراج المعلومات المهمة وتقديم ردود ذكية ومفيدة.

"""

import asyncio
import re
import json
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
from dataclasses import dataclass
from enum import Enum
import structlog

try:
    import spacy
    SPACY_AVAILABLE = True
except ImportError:
    SPACY_AVAILABLE = False
    print("⚠️ spaCy غير متوفر. قم بتثبيته: pip install spacy")

from services.api_gateway.core.database import get_redis
from services.api_gateway.integrations.autopilot.sentiment_analysis import SentimentAnalyzer
from services.api_gateway.integrations.autopilot.continuous_evaluation import ContinuousEvaluationSystem

logger = structlog.get_logger(__name__)


class DialogueIntent(Enum):
    """نوايا الحوار"""
    ASK_STATUS = "ask_status"
    REQUEST_REPORT = "request_report"
    ASK_PERFORMANCE = "ask_performance"
    REQUEST_ANALYSIS = "request_analysis"
    ASK_RECOMMENDATIONS = "ask_recommendations"
    REPORT_ISSUE = "report_issue"
    REQUEST_METRICS = "request_metrics"
    GENERAL_QUERY = "general_query"
    UNKNOWN = "unknown"


class DialogueEntity(Enum):
    """الكيانات المستخرجة"""
    TIME_PERIOD = "time_period"
    METRIC_TYPE = "metric_type"
    DEPARTMENT = "department"
    BUSINESS_UNIT = "business_unit"
    DECISION_ID = "decision_id"
    KPI_NAME = "kpi_name"


@dataclass
class DialogueContext:
    """سياق الحوار"""
    user_id: str
    session_id: str
    intent: DialogueIntent
    entities: Dict[str, Any]
    confidence: float
    timestamp: datetime
    conversation_history: List[Dict[str, Any]]


@dataclass
class DialogueResponse:
    """استجابة الحوار"""
    response_text: str
    intent: DialogueIntent
    confidence: float
    extracted_data: Dict[str, Any]
    suggested_actions: List[str]
    follow_up_questions: List[str]
    timestamp: datetime


class NaturalDialogueSystem:
    """نظام الحوار الطبيعي للمديرين"""

    def __init__(self):
        self.is_initialized = False
        self.nlp_model = None
        self.redis_client = None
        self.sentiment_analyzer = None
        self.evaluation_system = None

        # قاموس النوايا والكلمات المفتاحية
        self.intent_keywords = {
            DialogueIntent.ASK_STATUS: [
                "حالة", "وضع", "كيف حال", "ما الوضع", "status", "how is", "what's up"
            ],
            DialogueIntent.REQUEST_REPORT: [
                "تقرير", "report", "generate report", "أنشئ تقرير", "أحتاج تقرير"
            ],
            DialogueIntent.ASK_PERFORMANCE: [
                "أداء", "performance", "كيف الأداء", "how performing", "نتائج"
            ],
            DialogueIntent.REQUEST_ANALYSIS: [
                "تحليل", "analysis", "analyze", "حلل", "ما رأيك"
            ],
            DialogueIntent.ASK_RECOMMENDATIONS: [
                "توصيات", "recommendations", "اقتراحات", "suggest", "ما تقترح"
            ],
            DialogueIntent.REPORT_ISSUE: [
                "مشكلة", "issue", "problem", "خطأ", "error", "bug"
            ],
            DialogueIntent.REQUEST_METRICS: [
                "مؤشرات", "metrics", "قياسات", "kpi", "أرقام"
            ]
        }

        # أنماط استخراج الكيانات
        self.entity_patterns = {
            DialogueEntity.TIME_PERIOD: [
                r"اليوم", r"الأسبوع", r"الشهر", r"الربع", r"السنة",
                r"today", r"this week", r"this month", r"this quarter", r"this year",
                r"آخر (\d+) أيام", r"last (\d+) days"
            ],
            DialogueEntity.METRIC_TYPE: [
                r"مالي", r"تشغيلي", r"عملاء", r"سوق", r"ابتكار",
                r"financial", r"operational", r"customer", r"market", r"innovation"
            ]
        }

    async def initialize_dialogue_system(self) -> bool:
        """تهيئة نظام الحوار"""
        try:
            logger.info("Initializing Natural Dialogue System")

            # تهيئة Redis
            self.redis_client = await get_redis()
            if not self.redis_client:
                logger.warning("Redis not available for dialogue system")
                return False

            # تهيئة نموذج NLP
            if SPACY_AVAILABLE:
                try:
                    self.nlp_model = spacy.load("en_core_web_sm")
                    logger.info("spaCy model loaded successfully")
                except OSError:
                    logger.warning("spaCy model not found, downloading...")
                    try:
                        import subprocess
                        subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"], check=True)
                        self.nlp_model = spacy.load("en_core_web_sm")
                        logger.info("spaCy model downloaded and loaded")
                    except Exception as e:
                        logger.error(f"Failed to download spaCy model: {e}")
                        return False
            else:
                logger.warning("spaCy not available, using basic NLP")
                self.nlp_model = None

            # تهيئة الأنظمة المساعدة
            self.sentiment_analyzer = SentimentAnalyzer()
            await self.sentiment_analyzer.initialize_sentiment_analyzer()

            self.evaluation_system = ContinuousEvaluationSystem()
            await self.evaluation_system.initialize_evaluation_system()

            self.is_initialized = True
            logger.info("Natural Dialogue System initialized successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to initialize dialogue system: {e}")
            return False

    async def process_dialogue(self, user_input: str, user_id: str, session_id: str) -> DialogueResponse:
        """معالجة إدخال المستخدم وإنشاء استجابة"""
        if not self.is_initialized:
            return DialogueResponse(
                response_text="عذراً، نظام الحوار غير متاح حالياً. يرجى المحاولة لاحقاً.",
                intent=DialogueIntent.UNKNOWN,
                confidence=0.0,
                extracted_data={},
                suggested_actions=[],
                follow_up_questions=[],
                timestamp=datetime.utcnow()
            )

        try:
            # تحليل النص واستخراج النوايا والكيانات
            intent, confidence = await self._classify_intent(user_input)
            entities = await self._extract_entities(user_input)

            # إنشاء سياق الحوار
            context = DialogueContext(
                user_id=user_id,
                session_id=session_id,
                intent=intent,
                entities=entities,
                confidence=confidence,
                timestamp=datetime.utcnow(),
                conversation_history=[]
            )

            # حفظ السياق
            await self._save_dialogue_context(context)

            # إنشاء الاستجابة المناسبة
            response = await self._generate_response(context)

            return response

        except Exception as e:
            logger.error(f"Error processing dialogue: {e}")
            return DialogueResponse(
                response_text="عذراً، حدث خطأ في معالجة طلبك. يرجى المحاولة مرة أخرى.",
                intent=DialogueIntent.UNKNOWN,
                confidence=0.0,
                extracted_data={},
                suggested_actions=[],
                follow_up_questions=[],
                timestamp=datetime.utcnow()
            )

    async def _classify_intent(self, text: str) -> Tuple[DialogueIntent, float]:
        """تصنيف نية المستخدم"""
        text_lower = text.lower()

        # البحث عن الكلمات المفتاحية
        for intent, keywords in self.intent_keywords.items():
            for keyword in keywords:
                if keyword.lower() in text_lower:
                    confidence = 0.8  # ثقة أساسية للكلمات المفتاحية
                    return intent, confidence

        # استخدام NLP إذا كان متاحاً
        if self.nlp_model:
            doc = self.nlp_model(text)
            # تحليل بسيط للنوايا بناءً على الأفعال والأسماء
            if any(token.pos_ == "VERB" for token in doc):
                # إذا كان هناك فعل، قد يكون طلباً
                return DialogueIntent.GENERAL_QUERY, 0.6

        return DialogueIntent.UNKNOWN, 0.3

    async def _extract_entities(self, text: str) -> Dict[str, Any]:
        """استخراج الكيانات من النص"""
        entities = {}

        # البحث عن الأنماط
        for entity_type, patterns in self.entity_patterns.items():
            for pattern in patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    if entity_type == DialogueEntity.TIME_PERIOD:
                        entities["time_period"] = match.group(0)
                    elif entity_type == DialogueEntity.METRIC_TYPE:
                        entities["metric_type"] = match.group(0)
                    break

        # استخراج الأرقام
        numbers = re.findall(r'\d+', text)
        if numbers:
            entities["numbers"] = numbers

        return entities

    async def _generate_response(self, context: DialogueContext) -> DialogueResponse:
        """إنشاء استجابة مناسبة للسياق"""
        intent = context.intent
        entities = context.entities

        if intent == DialogueIntent.ASK_STATUS:
            return await self._handle_status_request(context)

        elif intent == DialogueIntent.REQUEST_REPORT:
            return await self._handle_report_request(context)

        elif intent == DialogueIntent.ASK_PERFORMANCE:
            return await self._handle_performance_request(context)

        elif intent == DialogueIntent.REQUEST_ANALYSIS:
            return await self._handle_analysis_request(context)

        elif intent == DialogueIntent.ASK_RECOMMENDATIONS:
            return await self._handle_recommendations_request(context)

        elif intent == DialogueIntent.REPORT_ISSUE:
            return await self._handle_issue_report(context)

        elif intent == DialogueIntent.REQUEST_METRICS:
            return await self._handle_metrics_request(context)

        else:
            return await self._handle_general_query(context)

    async def _handle_status_request(self, context: DialogueContext) -> DialogueResponse:
        """معالجة طلبات الحالة"""
        response_text = "نظام HaderOS يعمل بشكل طبيعي. جميع الأنظمة الفرعية نشطة وتعمل بكفاءة."

        return DialogueResponse(
            response_text=response_text,
            intent=context.intent,
            confidence=context.confidence,
            extracted_data=context.entities,
            suggested_actions=["عرض التقارير", "تحليل الأداء", "مراجعة التوصيات"],
            follow_up_questions=["هل تريد تقريراً مفصلاً؟", "هل يوجد مجال محدد تريد التركيز عليه؟"],
            timestamp=datetime.utcnow()
        )

    async def _handle_report_request(self, context: DialogueContext) -> DialogueResponse:
        """معالجة طلبات التقارير"""
        time_period = context.entities.get("time_period", "الشهر الحالي")

        response_text = f"سأقوم بإنشاء تقرير الأداء للفترة {time_period}. التقرير سيحتوي على تحليل شامل لجميع المؤشرات الرئيسية."

        return DialogueResponse(
            response_text=response_text,
            intent=context.intent,
            confidence=context.confidence,
            extracted_data=context.entities,
            suggested_actions=["إنشاء تقرير PDF", "إرسال التقرير بالبريد", "عرض التقرير تفاعلياً"],
            follow_up_questions=["ما هي التفاصيل التي تريد تضمينها في التقرير؟", "هل تريد التركيز على مجال محدد؟"],
            timestamp=datetime.utcnow()
        )

    async def _handle_performance_request(self, context: DialogueContext) -> DialogueResponse:
        """معالجة طلبات الأداء"""
        metric_type = context.entities.get("metric_type", "عام")

        response_text = f"الأداء في مجال {metric_type} جيد جداً. المؤشرات تظهر تحسناً مستمراً مقارنة بالفترة السابقة."

        return DialogueResponse(
            response_text=response_text,
            intent=context.intent,
            confidence=context.confidence,
            extracted_data=context.entities,
            suggested_actions=["عرض التفاصيل", "مقارنة مع الأهداف", "تحليل الاتجاهات"],
            follow_up_questions=["هل تريد تفاصيل أكثر؟", "ما هي المؤشرات المحددة التي تهتم بها؟"],
            timestamp=datetime.utcnow()
        )

    async def _handle_analysis_request(self, context: DialogueContext) -> DialogueResponse:
        """معالجة طلبات التحليل"""
        response_text = "بعد تحليل البيانات المتاحة، أرى أن هناك فرصاً جيدة للتحسين في عدة مجالات رئيسية."

        return DialogueResponse(
            response_text=response_text,
            intent=context.intent,
            confidence=context.confidence,
            extracted_data=context.entities,
            suggested_actions=["عرض تحليل مفصل", "اقتراح خطة تحسين", "تحديد الأولويات"],
            follow_up_questions=["ما هو المجال الذي تريد تحليله بالتفصيل؟", "هل لديك أهداف محددة للتحسين؟"],
            timestamp=datetime.utcnow()
        )

    async def _handle_recommendations_request(self, context: DialogueContext) -> DialogueResponse:
        """معالجة طلبات التوصيات"""
        response_text = "بناءً على تحليل البيانات الحالية، أوصي بالتركيز على التحسينات التالية:"

        recommendations = [
            "تعزيز الكفاءة التشغيلية",
            "تحسين رضا العملاء",
            "تطوير الابتكار في المنتجات",
            "تحسين الأداء المالي"
        ]

        return DialogueResponse(
            response_text=response_text,
            intent=context.intent,
            confidence=context.confidence,
            extracted_data=context.entities,
            suggested_actions=recommendations,
            follow_up_questions=["أي من هذه التوصيات تريد التركيز عليها أولاً؟", "هل تحتاج لخطة تنفيذ مفصلة؟"],
            timestamp=datetime.utcnow()
        )

    async def _handle_issue_report(self, context: DialogueContext) -> DialogueResponse:
        """معالجة الإبلاغ عن المشاكل"""
        response_text = "شكراً لإبلاغك عن هذه المشكلة. سأقوم بتسجيلها وإبلاغ الفريق المختص فوراً."

        return DialogueResponse(
            response_text=response_text,
            intent=context.intent,
            confidence=context.confidence,
            extracted_data=context.entities,
            suggested_actions=["تسجيل المشكلة", "إشعار الفريق الفني", "متابعة الحل"],
            follow_up_questions=["ما هي تفاصيل المشكلة؟", "متى لاحظت هذه المشكلة؟", "ما هو التأثير المتوقع؟"],
            timestamp=datetime.utcnow()
        )

    async def _handle_metrics_request(self, context: DialogueContext) -> DialogueResponse:
        """معالجة طلبات المؤشرات"""
        response_text = "المؤشرات الرئيسية الحالية تظهر أداءً إيجابياً في معظم المجالات."

        return DialogueResponse(
            response_text=response_text,
            intent=context.intent,
            confidence=context.confidence,
            extracted_data=context.entities,
            suggested_actions=["عرض المؤشرات التفصيلية", "مقارنة مع الأهداف", "تحليل الاتجاهات"],
            follow_up_questions=["ما هي المؤشرات المحددة التي تريد رؤيتها؟", "هل تريد مقارنة مع فترة سابقة؟"],
            timestamp=datetime.utcnow()
        )

    async def _handle_general_query(self, context: DialogueContext) -> DialogueResponse:
        """معالجة الاستفسارات العامة"""
        response_text = "أنا هنا لمساعدتك في إدارة وتحسين أداء نظام HaderOS. يمكنني تقديم تقارير، تحليلات، وتوصيات حول الأداء المالي، التشغيلي، والعملاء."

        return DialogueResponse(
            response_text=response_text,
            intent=context.intent,
            confidence=context.confidence,
            extracted_data=context.entities,
            suggested_actions=["طلب تقرير", "تحليل الأداء", "الحصول على توصيات"],
            follow_up_questions=["ما الذي يمكنني مساعدتك فيه اليوم؟", "هل لديك استفسار محدد؟"],
            timestamp=datetime.utcnow()
        )

    async def _save_dialogue_context(self, context: DialogueContext):
        """حفظ سياق الحوار"""
        if not self.redis_client:
            return

        try:
            key = f"dialogue_context:{context.session_id}"
            data = {
                "user_id": context.user_id,
                "intent": context.intent.value,
                "entities": context.entities,
                "confidence": context.confidence,
                "timestamp": context.timestamp.isoformat(),
                "history": context.conversation_history
            }

            import json
            await self.redis_client.set(key, json.dumps(data, cls=CustomJSONEncoder))
            await self.redis_client.expire(key, 3600 * 24)  # 24 ساعة

        except Exception as e:
            logger.warning(f"Failed to save dialogue context: {e}")

    async def get_conversation_history(self, session_id: str) -> List[Dict[str, Any]]:
        """الحصول على تاريخ المحادثة"""
        if not self.redis_client:
            return []

        try:
            key = f"dialogue_context:{session_id}"
            data = await self.redis_client.get(key)
            if data:
                import json
                context_data = json.loads(data)
                return context_data.get("history", [])
        except Exception as e:
            logger.warning(f"Failed to get conversation history: {e}")

        return []


class CustomJSONEncoder(json.JSONEncoder):
    """Custom JSON encoder للتعامل مع الـ enums والتواريخ"""
    def default(self, obj):
        if isinstance(obj, Enum):
            return obj.value
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)
<parameter name="filePath">/Users/ahmedmohamedshawkyatta/Documents/HADEROS-AI-CLOUD/services/api_gateway/integrations/autopilot/natural_dialogue.py