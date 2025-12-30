"""
BioModuleFactory - Core Types and Models
Python port of TypeScript implementation
"""

from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from enum import Enum
from datetime import datetime


class ModuleStep(str, Enum):
    """خطوات بناء الوحدة - Module building steps"""
    BIOLOGICAL_STUDY = "biological_study"
    ARCHITECTURE_DESIGN = "architecture_design"
    DEVELOPMENT = "development"
    TESTING = "testing"
    DOCUMENTATION = "documentation"


class DeliverableStatus(str, Enum):
    """حالة التسليم - Deliverable status"""
    PENDING = "pending"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"


class QualityGateType(str, Enum):
    """نوع بوابة الجودة - Quality gate type"""
    BLOCKING = "blocking"  # Must pass to advance
    WARNING = "warning"    # Can proceed with warnings


class ModulePhase(str, Enum):
    """مراحل HADER - HADER phases"""
    FOUNDATION = "foundation"
    KEMET_MVP = "kemet_mvp"
    CRM_AGENT = "crm_agent"
    ECOMMERCE = "ecommerce"
    INTEGRATION_LAUNCH = "integration_launch"


class Organism(str, Enum):
    """الكائنات الحية - Bio-organisms"""
    MYCELIUM = "mycelium"
    CORVID = "corvid"
    CHAMELEON = "chameleon"
    CEPHALOPOD = "cephalopod"
    ARACHNID = "arachnid"
    ANT = "ant"
    TARDIGRADE = "tardigrade"


class Deliverable(BaseModel):
    """تسليم - Deliverable"""
    id: str
    name: str
    description: str
    required: bool
    status: DeliverableStatus = DeliverableStatus.PENDING
    file_path: Optional[str] = None
    submitted_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None


class QualityGate(BaseModel):
    """بوابة الجودة - Quality gate"""
    id: str
    name: str
    description: str
    gate_type: QualityGateType
    check_function: str  # Name of the check function
    error_message: str
    passed: Optional[bool] = None
    details: Optional[Dict] = None


class StepConfig(BaseModel):
    """تكوين الخطوة - Step configuration"""
    step: ModuleStep
    name: str
    duration_weeks: str
    deliverables: List[Deliverable]
    quality_gates: List[QualityGate]
    training_lessons: List[str] = []


class BioModule(BaseModel):
    """وحدة بيولوجية - Bio-inspired module"""
    id: str
    name: str
    organism: Organism
    problem_ar: str
    problem_en: str
    solution_ar: str
    solution_en: str
    phase: ModulePhase
    tech_stack: List[str]
    estimated_duration_weeks: int
    priority: int
    biological_principles: List[str]


class ModuleState(BaseModel):
    """حالة الوحدة - Module state"""
    module_id: str
    module_name: str
    current_step: ModuleStep
    completed_steps: List[ModuleStep] = []
    deliverables: List[Deliverable] = []
    started_at: datetime
    last_updated: datetime
    estimated_completion: Optional[datetime] = None


class ValidationResult(BaseModel):
    """نتيجة التحقق - Validation result"""
    passed: bool
    blocking_failures: List[QualityGate] = []
    warnings: List[QualityGate] = []
    score: float  # 0-100
    message: str


class TrainingLesson(BaseModel):
    """درس تدريبي - Training lesson"""
    id: str
    title: str
    description: str
    duration_minutes: int
    level: str  # beginner, intermediate, advanced
    content: str
    code_examples: List[Dict] = []
    exercises: List[Dict] = []
    quiz_questions: List[Dict] = []


class LessonProgress(BaseModel):
    """تقدم الدرس - Lesson progress"""
    user_id: str
    lesson_id: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    exercises_completed: List[str] = []
    quiz_score: Optional[float] = None
    passed: bool = False


class ExerciseResult(BaseModel):
    """نتيجة التمرين - Exercise result"""
    exercise_id: str
    passed: bool
    score: float
    feedback: str
    submitted_code: str
    execution_time_ms: int


class QuizResult(BaseModel):
    """نتيجة الاختبار - Quiz result"""
    quiz_id: str
    total_questions: int
    correct_answers: int
    score: float
    passed: bool
    answers: List[int]
    feedback: List[str]
