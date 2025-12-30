"""
BioModuleFactory - State Machine and Workflow Engine
Python port of TypeScript implementation
"""

from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import logging
import json
from pathlib import Path

from backend.bio_module_factory.models.types import (
    BioModule,
    ModuleState,
    ModuleStep,
    Deliverable,
    DeliverableStatus,
    ValidationResult,
    QualityGate,
    QualityGateType
)

logger = logging.getLogger(__name__)


class BioModuleFactory:
    """
    مصنع الوحدات البيولوجية
    Bio-Module Factory - State Machine for Module Development
    """
    
    def __init__(self, storage_path: str = "modules"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.states: Dict[str, ModuleState] = {}
        self._load_states()
    
    def _load_states(self) -> None:
        """تحميل الحالات المحفوظة - Load saved states"""
        state_file = self.storage_path / "states.json"
        if state_file.exists():
            try:
                with open(state_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    for module_id, state_data in data.items():
                        self.states[module_id] = ModuleState(**state_data)
                logger.info(f"Loaded {len(self.states)} module states")
            except Exception as e:
                logger.error(f"Error loading states: {e}")
    
    def _save_states(self) -> None:
        """حفظ الحالات - Save states"""
        state_file = self.storage_path / "states.json"
        try:
            data = {
                module_id: state.model_dump(mode='json')
                for module_id, state in self.states.items()
            }
            with open(state_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2, default=str)
            logger.info(f"Saved {len(self.states)} module states")
        except Exception as e:
            logger.error(f"Error saving states: {e}")
    
    async def initialize_module(
        self,
        module_definition: BioModule,
        step_configs: List
    ) -> ModuleState:
        """
        تهيئة وحدة جديدة
        Initialize a new module
        
        Args:
            module_definition: Module definition
            step_configs: List of step configurations
            
        Returns:
            ModuleState: Initial module state
        """
        # Create module directory
        module_dir = self.storage_path / module_definition.id
        module_dir.mkdir(parents=True, exist_ok=True)
        
        # Create subdirectories
        (module_dir / "docs").mkdir(exist_ok=True)
        (module_dir / "src").mkdir(exist_ok=True)
        (module_dir / "tests").mkdir(exist_ok=True)
        
        # Initialize deliverables from all steps
        all_deliverables = []
        for step_config in step_configs:
            all_deliverables.extend(step_config.deliverables)
        
        # Create initial state
        state = ModuleState(
            module_id=module_definition.id,
            module_name=module_definition.name,
            current_step=ModuleStep.BIOLOGICAL_STUDY,
            completed_steps=[],
            deliverables=all_deliverables,
            started_at=datetime.now(),
            last_updated=datetime.now(),
            estimated_completion=datetime.now() + timedelta(
                weeks=module_definition.estimated_duration_weeks
            )
        )
        
        # Save state
        self.states[module_definition.id] = state
        self._save_states()
        
        logger.info(f"Initialized module: {module_definition.name}")
        return state
    
    async def submit_deliverable(
        self,
        module_id: str,
        step: ModuleStep,
        deliverable_id: str,
        file_path: str
    ) -> bool:
        """
        تقديم تسليم
        Submit a deliverable
        
        Args:
            module_id: Module identifier
            step: Current step
            deliverable_id: Deliverable identifier
            file_path: Path to deliverable file
            
        Returns:
            bool: Success status
        """
        if module_id not in self.states:
            logger.error(f"Module not found: {module_id}")
            return False
        
        state = self.states[module_id]
        
        # Find deliverable
        deliverable = next(
            (d for d in state.deliverables if d.id == deliverable_id),
            None
        )
        
        if not deliverable:
            logger.error(f"Deliverable not found: {deliverable_id}")
            return False
        
        # Update deliverable
        deliverable.status = DeliverableStatus.SUBMITTED
        deliverable.file_path = file_path
        deliverable.submitted_at = datetime.now()
        
        # Update state
        state.last_updated = datetime.now()
        self._save_states()
        
        logger.info(f"Deliverable submitted: {deliverable.name}")
        return True
    
    async def validate_step(
        self,
        module_id: str,
        quality_gates: List[QualityGate]
    ) -> ValidationResult:
        """
        التحقق من الخطوة
        Validate current step
        
        Args:
            module_id: Module identifier
            quality_gates: List of quality gates to check
            
        Returns:
            ValidationResult: Validation result
        """
        if module_id not in self.states:
            return ValidationResult(
                passed=False,
                score=0.0,
                message="Module not found"
            )
        
        state = self.states[module_id]
        blocking_failures = []
        warnings = []
        
        # Run all quality gates
        for gate in quality_gates:
            # Execute check function (simplified - in production, use dynamic imports)
            passed = await self._execute_quality_gate(state, gate)
            gate.passed = passed
            
            if not passed:
                if gate.gate_type == QualityGateType.BLOCKING:
                    blocking_failures.append(gate)
                else:
                    warnings.append(gate)
        
        # Calculate score
        total_gates = len(quality_gates)
        passed_gates = sum(1 for g in quality_gates if g.passed)
        score = (passed_gates / total_gates * 100) if total_gates > 0 else 0.0
        
        # Determine if validation passed
        passed = len(blocking_failures) == 0
        
        # Generate message
        if passed:
            message = f"✅ All quality gates passed! Score: {score:.1f}%"
        else:
            message = f"❌ {len(blocking_failures)} blocking failures. Score: {score:.1f}%"
        
        return ValidationResult(
            passed=passed,
            blocking_failures=blocking_failures,
            warnings=warnings,
            score=score,
            message=message
        )
    
    async def _execute_quality_gate(
        self,
        state: ModuleState,
        gate: QualityGate
    ) -> bool:
        """
        تنفيذ بوابة الجودة
        Execute a quality gate check
        """
        # Simplified implementation - in production, dynamically import check functions
        check_name = gate.check_function
        
        if check_name == "check_deliverable_exists":
            # Check if required deliverables are submitted
            required_deliverables = [
                d for d in state.deliverables
                if d.required and d.status == DeliverableStatus.PENDING
            ]
            return len(required_deliverables) == 0
        
        elif check_name == "check_file_exists":
            # Check if file exists
            module_dir = self.storage_path / state.module_id
            return module_dir.exists()
        
        elif check_name == "check_test_coverage":
            # Simplified - in production, run actual coverage tool
            return True  # Placeholder
        
        else:
            logger.warning(f"Unknown quality gate check: {check_name}")
            return True
    
    async def advance_step(self, module_id: str) -> bool:
        """
        التقدم إلى الخطوة التالية
        Advance to next step
        
        Args:
            module_id: Module identifier
            
        Returns:
            bool: Success status
        """
        if module_id not in self.states:
            logger.error(f"Module not found: {module_id}")
            return False
        
        state = self.states[module_id]
        
        # Get next step
        step_order = list(ModuleStep)
        current_index = step_order.index(state.current_step)
        
        if current_index >= len(step_order) - 1:
            logger.info(f"Module already at final step: {state.module_name}")
            return False
        
        # Mark current step as completed
        if state.current_step not in state.completed_steps:
            state.completed_steps.append(state.current_step)
        
        # Advance to next step
        state.current_step = step_order[current_index + 1]
        state.last_updated = datetime.now()
        
        self._save_states()
        
        logger.info(f"Advanced to step: {state.current_step.value}")
        return True
    
    async def get_module_state(self, module_id: str) -> Optional[ModuleState]:
        """
        الحصول على حالة الوحدة
        Get module state
        """
        return self.states.get(module_id)
    
    async def list_modules(self) -> List[ModuleState]:
        """
        قائمة جميع الوحدات
        List all modules
        """
        return list(self.states.values())


# Global instance
factory = BioModuleFactory()
