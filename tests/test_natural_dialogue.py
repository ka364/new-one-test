"""

اختبارات نظام الحوار الطبيعي لـ HaderOS

Natural Dialogue System Tests for HaderOS

"""

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime
from typing import Dict, Any

from services.api_gateway.integrations.autopilot.natural_dialogue import (
    NaturalDialogueSystem,
    DialogueIntent,
    DialogueEntity,
    DialogueContext,
    DialogueResponse
)


class TestNaturalDialogueSystem:
    """اختبارات نظام الحوار الطبيعي"""

    @pytest.fixture
    async def dialogue_system(self):
        """إنشاء نظام حوار للاختبار"""
        system = NaturalDialogueSystem()
        await system.initialize()
        return system

    @pytest.mark.asyncio
    async def test_initialization(self, dialogue_system):
        """اختبار تهيئة النظام"""
        assert dialogue_system.is_initialized
        assert dialogue_system.nlp_model is not None or dialogue_system.fallback_mode

    @pytest.mark.asyncio
    async def test_intent_classification_arabic(self, dialogue_system):
        """اختبار تصنيف النية باللغة العربية"""

        # اختبار طلب حالة
        intent, confidence = await dialogue_system._classify_intent_arabic(
            "ما هي حالة النظام؟"
        )
        assert intent == DialogueIntent.ASK_STATUS
        assert confidence > 0.5

        # اختبار طلب تقرير
        intent, confidence = await dialogue_system._classify_intent_arabic(
            "أريد تقرير الأداء الشهري"
        )
        assert intent == DialogueIntent.REQUEST_REPORT
        assert confidence > 0.5

        # اختبار سؤال عن الأداء
        intent, confidence = await dialogue_system._classify_intent_arabic(
            "كيف يعمل قسم المبيعات؟"
        )
        assert intent == DialogueIntent.ASK_PERFORMANCE
        assert confidence > 0.5

    @pytest.mark.asyncio
    async def test_intent_classification_english(self, dialogue_system):
        """اختبار تصنيف النية باللغة الإنجليزية"""

        # اختبار طلب حالة
        intent, confidence = await dialogue_system._classify_intent_english(
            "What's the system status?"
        )
        assert intent == DialogueIntent.ASK_STATUS
        assert confidence > 0.5

        # اختبار طلب تقرير
        intent, confidence = await dialogue_system._classify_intent_english(
            "I need the monthly performance report"
        )
        assert intent == DialogueIntent.REQUEST_REPORT
        assert confidence > 0.5

    @pytest.mark.asyncio
    async def test_entity_extraction(self, dialogue_system):
        """اختبار استخراج الكيانات"""

        # اختبار استخراج الفترة الزمنية
        text = "أريد تقرير الأسبوع الماضي"
        entities = await dialogue_system._extract_entities(text, "ar")

        assert DialogueEntity.TIME_PERIOD in entities

        # اختبار استخراج المقياس
        text = "ما هو معدل الرضا؟"
        entities = await dialogue_system._extract_entities(text, "ar")

        assert DialogueEntity.METRIC in entities

    @pytest.mark.asyncio
    async def test_response_generation_arabic(self, dialogue_system):
        """اختبار توليد الاستجابة بالعربية"""

        context = DialogueContext(
            message="ما هي حالة النظام؟",
            intent=DialogueIntent.ASK_STATUS,
            entities=[DialogueEntity.SYSTEM_STATUS],
            language="ar",
            session_id="test_session"
        )

        response = await dialogue_system._generate_response_arabic(context)

        assert response.response_text
        assert isinstance(response, DialogueResponse)
        assert response.intent == DialogueIntent.ASK_STATUS

    @pytest.mark.asyncio
    async def test_response_generation_english(self, dialogue_system):
        """اختبار توليد الاستجابة بالإنجليزية"""

        context = DialogueContext(
            message="What's the system status?",
            intent=DialogueIntent.ASK_STATUS,
            entities=[DialogueEntity.SYSTEM_STATUS],
            language="en",
            session_id="test_session"
        )

        response = await dialogue_system._generate_response_english(context)

        assert response.response_text
        assert isinstance(response, DialogueResponse)
        assert response.intent == DialogueIntent.ASK_STATUS

    @pytest.mark.asyncio
    async def test_session_management(self, dialogue_system):
        """اختبار إدارة الجلسات"""

        # إنشاء جلسة
        session_id = await dialogue_system.create_session(
            user_id="test_user",
            language="ar"
        )

        assert session_id
        assert isinstance(session_id, str)

        # حفظ السياق
        await dialogue_system._save_context(session_id, {"test": "data"})

        # استرجاع السياق
        context = await dialogue_system._load_context(session_id)
        assert context["test"] == "data"

        # إنهاء الجلسة
        await dialogue_system.end_session(session_id)

        # التحقق من حذف الجلسة
        context = await dialogue_system._load_context(session_id)
        assert context is None

    @pytest.mark.asyncio
    async def test_process_message_arabic(self, dialogue_system):
        """اختبار معالجة الرسالة العربية"""

        response = await dialogue_system.process_message(
            message="ما هي حالة النظام؟",
            session_id="test_session",
            language="ar"
        )

        assert isinstance(response, DialogueResponse)
        assert response.response_text
        assert response.intent == DialogueIntent.ASK_STATUS
        assert response.session_id == "test_session"

    @pytest.mark.asyncio
    async def test_process_message_english(self, dialogue_system):
        """اختبار معالجة الرسالة الإنجليزية"""

        response = await dialogue_system.process_message(
            message="What's the system status?",
            session_id="test_session",
            language="en"
        )

        assert isinstance(response, DialogueResponse)
        assert response.response_text
        assert response.intent == DialogueIntent.ASK_STATUS
        assert response.session_id == "test_session"

    @pytest.mark.asyncio
    async def test_conversation_history(self, dialogue_system):
        """اختبار تاريخ المحادثة"""

        session_id = "test_history_session"

        # إرسال عدة رسائل
        await dialogue_system.process_message(
            message="ما هي حالة النظام؟",
            session_id=session_id,
            language="ar"
        )

        await dialogue_system.process_message(
            message="أريد تقرير الأداء",
            session_id=session_id,
            language="ar"
        )

        # الحصول على التاريخ
        history = await dialogue_system.get_conversation_history(session_id)

        assert len(history) == 2
        assert history[0].message == "ما هي حالة النظام؟"
        assert history[1].message == "أريد تقرير الأداء"

    @pytest.mark.asyncio
    async def test_fallback_mode(self, dialogue_system):
        """اختبار وضع النسخة الاحتياطية"""

        # محاكاة فشل تحميل نموذج NLP
        dialogue_system.nlp_model = None
        dialogue_system.fallback_mode = True

        response = await dialogue_system.process_message(
            message="ما هي حالة النظام؟",
            session_id="test_session",
            language="ar"
        )

        # يجب أن يعمل في وضع النسخة الاحتياطية
        assert isinstance(response, DialogueResponse)
        assert response.response_text

    @pytest.mark.asyncio
    async def test_error_handling(self, dialogue_system):
        """اختبار معالجة الأخطاء"""

        # اختبار رسالة فارغة
        with pytest.raises(ValueError):
            await dialogue_system.process_message(
                message="",
                session_id="test_session",
                language="ar"
            )

        # اختبار لغة غير مدعومة
        with pytest.raises(ValueError):
            await dialogue_system.process_message(
                message="Hello",
                session_id="test_session",
                language="fr"  # لغة غير مدعومة
            )

    @pytest.mark.asyncio
    async def test_context_persistence(self, dialogue_system):
        """اختبار استمرارية السياق"""

        session_id = "test_persistence"

        # حفظ بيانات السياق
        test_context = {
            "user_preferences": {"language": "ar", "theme": "dark"},
            "conversation_state": "active",
            "last_topic": "performance"
        }

        await dialogue_system._save_context(session_id, test_context)

        # استرجاع البيانات
        loaded_context = await dialogue_system._load_context(session_id)

        assert loaded_context == test_context

        # تحديث السياق
        updated_context = test_context.copy()
        updated_context["last_topic"] = "reports"

        await dialogue_system._save_context(session_id, updated_context)

        loaded_updated = await dialogue_system._load_context(session_id)
        assert loaded_updated["last_topic"] == "reports"


class TestDialogueIntent:
    """اختبارات تعداد النيات"""

    def test_intent_values(self):
        """اختبار قيم النيات"""
        assert DialogueIntent.ASK_STATUS.value == "ask_status"
        assert DialogueIntent.REQUEST_REPORT.value == "request_report"
        assert DialogueIntent.ASK_PERFORMANCE.value == "ask_performance"
        assert DialogueIntent.GET_RECOMMENDATIONS.value == "get_recommendations"
        assert DialogueIntent.REPORT_ISSUE.value == "report_issue"
        assert DialogueIntent.REQUEST_HELP.value == "request_help"
        assert DialogueIntent.CHANGE_SETTINGS.value == "change_settings"
        assert DialogueIntent.END_CONVERSATION.value == "end_conversation"

    def test_intent_count(self):
        """اختبار عدد النيات"""
        assert len(DialogueIntent) == 8


class TestDialogueEntity:
    """اختبارات تعداد الكيانات"""

    def test_entity_values(self):
        """اختبار قيم الكيانات"""
        assert DialogueEntity.TIME_PERIOD.value == "time_period"
        assert DialogueEntity.METRIC.value == "metric"
        assert DialogueEntity.DEPARTMENT.value == "department"
        assert DialogueEntity.SYSTEM_STATUS.value == "system_status"
        assert DialogueEntity.USER_ID.value == "user_id"
        assert DialogueEntity.ACTION_TYPE.value == "action_type"

    def test_entity_count(self):
        """اختبار عدد الكيانات"""
        assert len(DialogueEntity) == 6


class TestDialogueContext:
    """اختبارات سياق الحوار"""

    def test_context_creation(self):
        """اختبار إنشاء السياق"""
        context = DialogueContext(
            message="Test message",
            intent=DialogueIntent.ASK_STATUS,
            entities=[DialogueEntity.SYSTEM_STATUS],
            language="ar",
            session_id="test_session"
        )

        assert context.message == "Test message"
        assert context.intent == DialogueIntent.ASK_STATUS
        assert context.entities == [DialogueEntity.SYSTEM_STATUS]
        assert context.language == "ar"
        assert context.session_id == "test_session"
        assert isinstance(context.timestamp, datetime)


class TestDialogueResponse:
    """اختبارات استجابة الحوار"""

    def test_response_creation(self):
        """اختبار إنشاء الاستجابة"""
        response = DialogueResponse(
            response_text="Test response",
            intent=DialogueIntent.ASK_STATUS,
            entities=[DialogueEntity.SYSTEM_STATUS],
            confidence=0.85,
            session_id="test_session",
            actions=["get_status"],
            metadata={"source": "test"}
        )

        assert response.response_text == "Test response"
        assert response.intent == DialogueIntent.ASK_STATUS
        assert response.entities == [DialogueEntity.SYSTEM_STATUS]
        assert response.confidence == 0.85
        assert response.session_id == "test_session"
        assert response.actions == ["get_status"]
        assert response.metadata == {"source": "test"}
        assert isinstance(response.timestamp, datetime)


if __name__ == "__main__":
    # تشغيل الاختبارات
    pytest.main([__file__, "-v"])