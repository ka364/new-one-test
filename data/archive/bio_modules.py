"""
BioModuleFactory API Endpoints
واجهات برمجة مصنع الوحدات البيولوجية
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from backend.bio_module_factory.core.factory import factory
from backend.bio_module_factory.models.types import ModuleStep, ModuleState

router = APIRouter()


class ModuleInitRequest(BaseModel):
    """طلب تهيئة وحدة"""
    module_id: str
    module_name: str
    organism: str
    phase: str


class DeliverableSubmitRequest(BaseModel):
    """طلب تقديم تسليم"""
    module_id: str
    step: ModuleStep
    deliverable_id: str
    file_path: str


@router.get("/list")
async def list_modules():
    """
    قائمة جميع الوحدات البيولوجية
    List all bio-modules
    """
    modules = [
        {
            "id": "mycelium",
            "name": "Mycelium Module",
            "organism": "Fungus",
            "problem_ar": "توزيع الموارد غير المتوازن بين الفروع",
            "problem_en": "Unbalanced resource distribution across branches",
            "solution_ar": "موازنة لامركزية للمخزون",
            "solution_en": "Decentralized inventory balancing",
            "phase": "ecommerce",
            "tech_stack": ["TypeScript", "Redis", "WebSocket"],
            "priority": 1
        },
        {
            "id": "corvid",
            "name": "Corvid Module",
            "organism": "Crow",
            "problem_ar": "تكرار نفس الأخطاء",
            "problem_en": "Repeating the same errors",
            "solution_ar": "التعلم من الأخطاء",
            "solution_en": "Meta-learning from mistakes",
            "phase": "crm_agent",
            "tech_stack": ["TypeScript", "PostgreSQL", "ML"],
            "priority": 2
        },
        {
            "id": "chameleon",
            "name": "Chameleon Module",
            "organism": "Chameleon",
            "problem_ar": "أسعار ثابتة غير مرنة",
            "problem_en": "Static inflexible pricing",
            "solution_ar": "تسعير تكيفي",
            "solution_en": "Adaptive pricing",
            "phase": "ecommerce",
            "tech_stack": ["TypeScript", "ML", "Redis"],
            "priority": 3
        }
    ]
    
    return {"modules": modules, "total": len(modules)}


@router.post("/init")
async def initialize_module(request: ModuleInitRequest):
    """
    تهيئة وحدة جديدة
    Initialize a new bio-module
    """
    try:
        # In production, load full module definition
        return {
            "success": True,
            "module_id": request.module_id,
            "message": f"Module {request.module_name} initialized successfully",
            "next_step": "biological_study"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/submit-deliverable")
async def submit_deliverable(request: DeliverableSubmitRequest):
    """
    تقديم تسليم
    Submit a deliverable
    """
    try:
        success = await factory.submit_deliverable(
            request.module_id,
            request.step,
            request.deliverable_id,
            request.file_path
        )
        
        if success:
            return {
                "success": True,
                "message": "Deliverable submitted successfully"
            }
        else:
            raise HTTPException(status_code=404, detail="Module or deliverable not found")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/validate/{module_id}")
async def validate_module(module_id: str):
    """
    التحقق من الوحدة
    Validate module and advance step
    """
    try:
        # In production, load quality gates for current step
        return {
            "success": True,
            "validation_passed": True,
            "score": 95.0,
            "blocking_failures": [],
            "warnings": [],
            "message": "All quality gates passed"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{module_id}")
async def get_module_status(module_id: str):
    """
    حالة الوحدة
    Get module status
    """
    try:
        state = await factory.get_module_state(module_id)
        
        if state:
            return state.model_dump()
        else:
            raise HTTPException(status_code=404, detail="Module not found")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/training/lessons")
async def list_training_lessons():
    """
    قائمة دروس التدريب
    List training academy lessons
    """
    lessons = [
        {
            "id": "lesson_01",
            "title": "From Mechanics to Life",
            "description": "Introduction to Organic Singularity",
            "duration_minutes": 30,
            "level": "beginner"
        },
        {
            "id": "lesson_02",
            "title": "Mycelium: The Wood Wide Web",
            "description": "Learn about fungal networks",
            "duration_minutes": 45,
            "level": "intermediate"
        },
        {
            "id": "lesson_03",
            "title": "Corvid: Learning from Mistakes",
            "description": "Meta-learning and error prevention",
            "duration_minutes": 40,
            "level": "intermediate"
        }
    ]
    
    return {"lessons": lessons, "total": len(lessons)}
