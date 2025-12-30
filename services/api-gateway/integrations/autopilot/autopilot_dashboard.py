"""

Autopilot Dashboard for HaderOS

لوحة التحكم الآلية لمراقبة وإدارة النظام الذاتي.

"""

import asyncio
import json
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import structlog

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from services.api_gateway.core.database import get_db
from services.api_gateway.integrations.autopilot.autopilot_control import (
    AutopilotControlSystem, AutopilotMode
)
from services.api_gateway.integrations.autopilot.decision_engine import DecisionEngine
from services.api_gateway.integrations.autopilot.predictive_analytics import PredictiveAnalytics
from services.api_gateway.integrations.autopilot.continuous_learning import ContinuousLearningSystem
from services.api_gateway.integrations.autopilot.natural_dialogue import NaturalDialogueSystem
from services.api_gateway.integrations.resilience.health_check_system import HealthCheckSystem

logger = structlog.get_logger(__name__)

# FastAPI Router
router = APIRouter(prefix="/autopilot", tags=["autopilot"])


async def get_autopilot_control() -> AutopilotControlSystem:
    """إنشاء instance للتحكم الآلي (للاختبارات والتطوير)"""
    control = AutopilotControlSystem()
    await control.initialize_autopilot()
    return control


async def get_health_check() -> HealthCheckSystem:
    """إنشاء instance لفحص الصحة (للاختبارات والتطوير)"""
    health = HealthCheckSystem()
    await health.initialize_health_checks()
    return health


# Global instances for development/testing (initialized on first use)
_autopilot_control_instance = None
_health_check_instance = None


async def get_autopilot_control_instance() -> AutopilotControlSystem:
    """الحصول على instance عام للتحكم الآلي"""
    global _autopilot_control_instance
    if _autopilot_control_instance is None:
        _autopilot_control_instance = AutopilotControlSystem()
        await _autopilot_control_instance.initialize_autopilot()
    return _autopilot_control_instance


async def get_health_check_instance() -> HealthCheckSystem:
    """الحصول على instance عام لفحص الصحة"""
    global _health_check_instance
    if _health_check_instance is None:
        _health_check_instance = HealthCheckSystem()
        await _health_check_instance.initialize_health_checks()
    return _health_check_instance


class AutopilotModeRequest(BaseModel):
    """طلب تغيير وضع التحكم الآلي"""
    mode: str
    confidence_threshold: Optional[float] = None


class DecisionRequest(BaseModel):
    """طلب قرار"""
    context: Dict[str, Any]
    priority: str = "normal"


class SentimentAnalysisRequest(BaseModel):
    """طلب تحليل المشاعر"""
    text: str
    source: str = "customer_feedback"


class BatchSentimentRequest(BaseModel):
    """طلب تحليل دفعة من النصوص"""
    texts: List[Dict[str, str]]


class BusinessImpactRequest(BaseModel):
    """طلب تقييم التأثير التجاري"""
    decision_id: str
    decision_data: Dict[str, Any]


class DialogueRequest(BaseModel):
    """طلب حوار طبيعي"""
    message: str
    session_id: Optional[str] = None
    language: str = "ar"  # ar أو en
    context: Optional[Dict[str, Any]] = None


class DialogueSessionRequest(BaseModel):
    """طلب إنشاء جلسة حوار"""
    user_id: str
    language: str = "ar"
    initial_context: Optional[Dict[str, Any]] = None


@router.get("/status")
async def get_autopilot_status():
    """الحصول على حالة التحكم الآلي"""

    try:
        autopilot_control = await get_autopilot_control_instance()
        status = await autopilot_control.get_autopilot_status()

        return JSONResponse(
            content={
                "status": "success",
                "data": status,
                "timestamp": datetime.utcnow().isoformat()
            }
        )

    except Exception as e:
        logger.error("Failed to get autopilot status", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get autopilot status")


@router.post("/mode")
async def set_autopilot_mode(request: AutopilotModeRequest):
    """تعيين وضع التحكم الآلي"""

    try:
        # التحقق من صحة الوضع
        try:
            mode = AutopilotMode(request.mode)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid mode: {request.mode}")

        autopilot_control = await get_autopilot_control_instance()

        # تعيين الوضع
        await autopilot_control.set_autopilot_mode(
            mode=mode,
            confidence_threshold=request.confidence_threshold
        )

        return JSONResponse(
            content={
                "status": "success",
                "message": f"Autopilot mode set to {mode.value}",
                "timestamp": datetime.utcnow().isoformat()
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to set autopilot mode", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to set autopilot mode")


@router.post("/decision")
async def submit_decision_request(request: DecisionRequest, background_tasks: BackgroundTasks):
    """تقديم طلب قرار"""

    try:
        autopilot_control = await get_autopilot_control_instance()
        request_id = await autopilot_control.submit_decision_request(
            context=request.context,
            priority=request.priority
        )

        return JSONResponse(
            content={
                "status": "success",
                "request_id": request_id,
                "message": "Decision request submitted successfully",
                "timestamp": datetime.utcnow().isoformat()
            }
        )

    except Exception as e:
        logger.error("Failed to submit decision request", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to submit decision request")


@router.post("/manual-intervention")
async def force_manual_intervention(reason: str):
    """فرض تدخل يدوي"""

    try:
        autopilot_control = await get_autopilot_control_instance()
        success = await autopilot_control.force_manual_intervention(reason)

        if success:
            return JSONResponse(
                content={
                    "status": "success",
                    "message": "Manual intervention activated",
                    "reason": reason,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
        else:
            raise HTTPException(status_code=403, detail="Manual intervention not allowed")

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to force manual intervention", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to force manual intervention")


@router.post("/learning-feedback")
async def provide_learning_feedback(request: LearningFeedbackRequest):
    """تقديم تغذية راجعة للتعلم"""

    try:
        from services.api_gateway.integrations.autopilot.continuous_learning import LearningMetric

        # التحقق من صحة المقياس
        try:
            metric = LearningMetric(request.metric)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid metric: {request.metric}")

        # تقديم التغذية الراجعة
        feedback_id = await continuous_learning.provide_learning_feedback(
            metric=metric,
            value=request.value,
            context=request.context,
            weight=request.weight
        )

        return JSONResponse(
            content={
                "status": "success",
                "feedback_id": feedback_id,
                "message": "Learning feedback recorded",
                "timestamp": datetime.utcnow().isoformat()
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to provide learning feedback", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to provide learning feedback")


@router.get("/metrics")
async def get_autopilot_metrics():
    """الحصول على مقاييس التحكم الآلي"""

    try:
        # جمع المقاييس من جميع المكونات
        autopilot_metrics = autopilot_control.metrics
        decision_metrics = await decision_engine.get_engine_metrics()
        predictive_metrics = predictive_analytics.get_analytics_stats()
        learning_metrics = continuous_learning.get_learning_stats()

        combined_metrics = {
            "autopilot": asdict(autopilot_metrics),
            "decision_engine": decision_metrics,
            "predictive_analytics": predictive_metrics,
            "continuous_learning": learning_metrics,
            "timestamp": datetime.utcnow().isoformat()
        }

        return JSONResponse(
            content={
                "status": "success",
                "data": combined_metrics
            }
        )

    except Exception as e:
        logger.error("Failed to get autopilot metrics", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get autopilot metrics")


@router.get("/recommendations")
async def get_learning_recommendations():
    """الحصول على توصيات التعلم"""

    try:
        # سياق عام للتوصيات
        context = {
            "current_time": datetime.utcnow().isoformat(),
            "system_status": await autopilot_control.get_autopilot_status(),
            "health_status": await health_check_system.get_system_health()
        }

        recommendations = await continuous_learning.get_learning_recommendations(context)

        return JSONResponse(
            content={
                "status": "success",
                "recommendations": recommendations,
                "count": len(recommendations),
                "timestamp": datetime.utcnow().isoformat()
            }
        )

    except Exception as e:
        logger.error("Failed to get learning recommendations", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get learning recommendations")


@router.get("/predictions")
async def get_system_predictions():
    """الحصول على تنبؤات النظام"""

    try:
        predictions = await predictive_analytics.get_current_predictions()

        return JSONResponse(
            content={
                "status": "success",
                "predictions": predictions,
                "timestamp": datetime.utcnow().isoformat()
            }
        )

    except Exception as e:
        logger.error("Failed to get system predictions", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get system predictions")


@router.get("/decisions/history")
async def get_decision_history(limit: int = 50, offset: int = 0):
    """الحصول على تاريخ القرارات"""

    try:
        history = await decision_engine.get_decision_history(limit=limit, offset=offset)

        return JSONResponse(
            content={
                "status": "success",
                "decisions": history,
                "limit": limit,
                "offset": offset,
                "timestamp": datetime.utcnow().isoformat()
            }
        )

    except Exception as e:
        logger.error("Failed to get decision history", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get decision history")


@router.get("/health")
async def get_autopilot_health():
    """الحصول على صحة نظام التحكم الآلي"""

    try:
        # فحص صحة جميع المكونات
        health_checks = {
            "autopilot_control": autopilot_control.is_running,
            "decision_engine": await decision_engine.is_healthy(),
            "predictive_analytics": predictive_analytics.is_initialized,
            "continuous_learning": continuous_learning.is_learning_enabled,
            "health_check_system": await health_check_system.is_healthy()
        }

        overall_healthy = all(health_checks.values())

        return JSONResponse(
            content={
                "status": "success",
                "healthy": overall_healthy,
                "components": health_checks,
                "timestamp": datetime.utcnow().isoformat()
            }
        )

    except Exception as e:
        logger.error("Failed to get autopilot health", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get autopilot health")


@router.post("/reset")
async def reset_autopilot():
    """إعادة تعيين نظام التحكم الآلي"""

    try:
        # إيقاف النظام الحالي
        await autopilot_control.shutdown_autopilot()

        # إعادة تهيئة النظام
        await autopilot_control.initialize_autopilot()

        return JSONResponse(
            content={
                "status": "success",
                "message": "Autopilot system reset successfully",
                "timestamp": datetime.utcnow().isoformat()
            }
        )

    except Exception as e:
        logger.error("Failed to reset autopilot", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to reset autopilot")


@router.get("/dashboard")
async def get_autopilot_dashboard():
    """الحصول على بيانات لوحة التحكم الآلية"""

    try:
        # جمع البيانات من جميع المكونات
        status = await autopilot_control.get_autopilot_status()
        metrics = await get_autopilot_metrics()
        recommendations = await get_learning_recommendations()
        predictions = await get_system_predictions()
        health = await get_autopilot_health()

        dashboard_data = {
            "status": status["data"],
            "metrics": metrics["data"],
            "recommendations": recommendations["recommendations"][:5],  # أفضل 5 توصيات
            "predictions": predictions["predictions"],
            "health": health,
            "alerts": await _get_active_alerts(),
            "timestamp": datetime.utcnow().isoformat()
        }

        return JSONResponse(
            content={
                "status": "success",
                "dashboard": dashboard_data
            }
        )

    except Exception as e:
        logger.error("Failed to get autopilot dashboard", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get autopilot dashboard")


async def _get_active_alerts() -> List[Dict[str, Any]]:
    """الحصول على التنبيهات النشطة"""

    alerts = []

    # فحص التنبيهات من نظام الصحة
    health_status = await health_check_system.get_system_health()
    if health_status.get("overall_status") in ["warning", "critical"]:
        alerts.append({
            "type": "health",
            "severity": health_status["overall_status"],
            "message": f"System health is {health_status['overall_status']}",
            "timestamp": datetime.utcnow().isoformat()
        })

    # فحص التنبيهات من التحليلات التنبؤية
    predictions = await predictive_analytics.get_current_predictions()
    for prediction in predictions:
        if prediction.get("probability", 0) > 0.8:
            alerts.append({
                "type": "prediction",
                "severity": "warning" if prediction["probability"] > 0.9 else "info",
                "message": f"High probability event: {prediction.get('description', 'Unknown')}",
                "probability": prediction["probability"],
                "timestamp": datetime.utcnow().isoformat()
            })

    # فحص التنبيهات من التعلم المستمر
    learning_stats = continuous_learning.get_learning_stats()
    if learning_stats.get("total_patterns", 0) == 0:
        alerts.append({
            "type": "learning",
            "severity": "info",
            "message": "Learning system has no patterns yet - still learning",
            "timestamp": datetime.utcnow().isoformat()
        })

    return alerts


# وظائف مساعدة للتهيئة
async def initialize_autopilot_dashboard():
    """تهيئة لوحة التحكم الآلية"""

    try:
        # تهيئة جميع مكونات التحكم الآلي
        await autopilot_control.initialize_autopilot()

        logger.info("🎛️ Autopilot Dashboard initialized")

    except Exception as e:
        logger.error("Failed to initialize autopilot dashboard", error=str(e))
        raise


@router.post("/sentiment/analyze")
async def analyze_sentiment(request: SentimentAnalysisRequest):
    """تحليل مشاعر النص"""

    try:
        autopilot_control = await get_autopilot_control_instance()
        result = await autopilot_control.analyze_customer_sentiment(
            text=request.text,
            source=request.source
        )

        return JSONResponse(
            content={
                "status": "success",
                "result": {
                    "sentiment": result.sentiment.value,
                    "polarity": result.polarity,
                    "subjectivity": result.subjectivity,
                    "confidence": result.confidence,
                    "source": result.source
                },
                "timestamp": datetime.utcnow().isoformat()
            }
        )

    except Exception as e:
        logger.error("Failed to analyze sentiment", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to analyze sentiment")


@router.post("/sentiment/batch-analyze")
async def batch_analyze_sentiment(request: BatchSentimentRequest):
    """تحليل دفعة من النصوص"""

    try:
        autopilot_control = await get_autopilot_control_instance()
        results = await autopilot_control.sentiment_analyzer.analyze_batch(request.texts)

        return JSONResponse(
            content={
                "status": "success",
                "results": [
                    {
                        "sentiment": r.sentiment.value,
                        "polarity": r.polarity,
                        "subjectivity": r.subjectivity,
                        "confidence": r.confidence,
                        "source": r.source
                    } for r in results
                ],
                "total_analyzed": len(results),
                "timestamp": datetime.utcnow().isoformat()
            }
        )

    except Exception as e:
        logger.error("Failed to batch analyze sentiment", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to batch analyze sentiment")


@router.get("/sentiment/trends")
async def get_sentiment_trends(hours: int = 24):
    """الحصول على اتجاهات المشاعر"""

    try:
        autopilot_control = await get_autopilot_control_instance()
        trends = await autopilot_control.get_sentiment_trends(hours)

        return JSONResponse(
            content={
                "status": "success",
                "trends": trends,
                "timestamp": datetime.utcnow().isoformat()
            }
        )

    except Exception as e:
        logger.error("Failed to get sentiment trends", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get sentiment trends")


@router.get("/sentiment/insights")
async def get_sentiment_insights():
    """الحصول على رؤى المشاعر"""

    try:
        autopilot_control = await get_autopilot_control_instance()
        insights = await autopilot_control.get_sentiment_insights()

        return JSONResponse(
            content={
                "status": "success",
                "insights": insights,
                "timestamp": datetime.utcnow().isoformat()
            }
        )

    except Exception as e:
        logger.error("Failed to get sentiment insights", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get sentiment insights")


@router.get("/sentiment/metrics")
async def get_sentiment_metrics():
    """الحصول على مقاييس تحليل المشاعر"""

    try:
        autopilot_control = await get_autopilot_control_instance()
        metrics = autopilot_control.sentiment_analyzer.get_sentiment_metrics()

        return JSONResponse(
            content={
                "status": "success",
                "metrics": metrics,
                "timestamp": datetime.utcnow().isoformat()
            }
        )

    except Exception as e:
        logger.error("Failed to get sentiment metrics", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get sentiment metrics")


@router.post("/evaluation/assess")
async def assess_business_impact(request: BusinessImpactRequest):
    """تقييم التأثير التجاري لقرار"""

    try:
        autopilot_control = await get_autopilot_control_instance()
        assessment = await autopilot_control.assess_business_impact(
            request.decision_id,
            request.decision_data
        )

        return JSONResponse(
            content={
                "status": "success",
                "assessment": asdict(assessment),
                "timestamp": datetime.utcnow().isoformat()
            }
        )

    except Exception as e:
        logger.error("Failed to assess business impact", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to assess business impact")


@router.get("/evaluation/report")
async def get_business_impact_report(days: int = 30):
    """الحصول على تقرير التأثير التجاري"""

    try:
        autopilot_control = await get_autopilot_control_instance()
        report = await autopilot_control.get_business_impact_report(days)

        return JSONResponse(
            content={
                "status": "success",
                "report": asdict(report),
                "timestamp": datetime.utcnow().isoformat()
            }
        )

    except Exception as e:
        logger.error("Failed to get business impact report", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get business impact report")


@router.post("/dialogue/session")
async def create_dialogue_session(request: DialogueSessionRequest):
    """إنشاء جلسة حوار جديدة"""

    try:
        autopilot_control = await get_autopilot_control_instance()
        dialogue_system = autopilot_control.get_dialogue_system()

        session_id = await dialogue_system.create_session(
            user_id=request.user_id,
            language=request.language,
            initial_context=request.initial_context
        )

        return JSONResponse(
            content={
                "status": "success",
                "data": {
                    "session_id": session_id,
                    "language": request.language,
                    "created_at": datetime.utcnow().isoformat()
                },
                "timestamp": datetime.utcnow().isoformat()
            }
        )

    except Exception as e:
        logger.error("Failed to create dialogue session", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to create dialogue session")


@router.post("/dialogue/process")
async def process_dialogue(request: DialogueRequest):
    """معالجة رسالة حوار طبيعي"""

    try:
        autopilot_control = await get_autopilot_control_instance()
        dialogue_system = autopilot_control.get_dialogue_system()

        # معالجة الرسالة
        response = await dialogue_system.process_message(
            message=request.message,
            session_id=request.session_id,
            language=request.language,
            context=request.context
        )

        return JSONResponse(
            content={
                "status": "success",
                "data": {
                    "response": response.response_text,
                    "intent": response.intent.value if response.intent else None,
                    "entities": [entity.value for entity in response.entities] if response.entities else [],
                    "confidence": response.confidence,
                    "session_id": response.session_id,
                    "actions": response.actions,
                    "metadata": response.metadata
                },
                "timestamp": datetime.utcnow().isoformat()
            }
        )

    except Exception as e:
        logger.error("Failed to process dialogue", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to process dialogue")


@router.get("/dialogue/history/{session_id}")
async def get_dialogue_history(session_id: str, limit: int = 50):
    """الحصول على تاريخ جلسة حوار"""

    try:
        autopilot_control = await get_autopilot_control_instance()
        dialogue_system = autopilot_control.get_dialogue_system()

        history = await dialogue_system.get_conversation_history(
            session_id=session_id,
            limit=limit
        )

        return JSONResponse(
            content={
                "status": "success",
                "data": {
                    "session_id": session_id,
                    "history": [
                        {
                            "message": msg.message,
                            "response": msg.response,
                            "intent": msg.intent.value if msg.intent else None,
                            "timestamp": msg.timestamp.isoformat(),
                            "confidence": msg.confidence
                        } for msg in history
                    ],
                    "count": len(history)
                },
                "timestamp": datetime.utcnow().isoformat()
            }
        )

    except Exception as e:
        logger.error("Failed to get dialogue history", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get dialogue history")


@router.delete("/dialogue/session/{session_id}")
async def end_dialogue_session(session_id: str):
    """إنهاء جلسة حوار"""

    try:
        autopilot_control = await get_autopilot_control_instance()
        dialogue_system = autopilot_control.get_dialogue_system()

        await dialogue_system.end_session(session_id)

        return JSONResponse(
            content={
                "status": "success",
                "message": f"Dialogue session {session_id} ended",
                "timestamp": datetime.utcnow().isoformat()
            }
        )

    except Exception as e:
        logger.error("Failed to end dialogue session", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to end dialogue session")


async def shutdown_autopilot_dashboard():
    """إيقاف لوحة التحكم الآلية"""

    try:
        await autopilot_control.shutdown_autopilot()

        logger.info("🛑 Autopilot Dashboard shut down")

    except Exception as e:
        logger.error("Failed to shutdown autopilot dashboard", error=str(e))


# Export the router for use in main application
__all__ = ["router", "initialize_autopilot_dashboard", "shutdown_autopilot_dashboard"]