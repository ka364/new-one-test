"""

Chaos Engineering System for HaderOS

This module provides controlled chaos testing capabilities to validate
system resilience and identify weaknesses in failure scenarios.

"""

import asyncio
import random
import time
from typing import Dict, Any, List, Optional, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
import structlog

from services.api_gateway.core.database import get_redis

logger = structlog.get_logger(__name__)


class ChaosType(Enum):
    """Types of chaos experiments"""
    NETWORK_DELAY = "network_delay"
    NETWORK_FAILURE = "network_failure"
    SERVICE_CRASH = "service_crash"
    RESOURCE_EXHAUSTION = "resource_exhaustion"
    DATA_CORRUPTION = "data_corruption"
    CONFIGURATION_ERROR = "configuration_error"
    DEPENDENCY_FAILURE = "dependency_failure"


@dataclass
class ChaosExperiment:
    """Represents a chaos experiment"""
    id: str
    name: str
    chaos_type: ChaosType
    target_service: str
    duration_seconds: int
    intensity: float  # 0.0 to 1.0
    parameters: Dict[str, Any]
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    status: str = "pending"  # pending, running, completed, failed
    results: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        data = {
            'id': self.id,
            'name': self.name,
            'chaos_type': self.chaos_type.value,
            'target_service': self.target_service,
            'duration_seconds': self.duration_seconds,
            'intensity': self.intensity,
            'parameters': self.parameters,
            'created_at': self.created_at.isoformat(),
            'status': self.status
        }

        if self.started_at:
            data['started_at'] = self.started_at.isoformat()
        if self.completed_at:
            data['completed_at'] = self.completed_at.isoformat()
        if self.results:
            data['results'] = self.results

        return data

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ChaosExperiment':
        """Create from dictionary"""
        data['chaos_type'] = ChaosType(data['chaos_type'])
        data['created_at'] = datetime.fromisoformat(data['created_at'])

        if data.get('started_at'):
            data['started_at'] = datetime.fromisoformat(data['started_at'])
        if data.get('completed_at'):
            data['completed_at'] = datetime.fromisoformat(data['completed_at'])

        return cls(**data)


class ChaosMonkey:
    """Chaos Monkey for controlled failure injection"""

    def __init__(self, target_service: str):
        self.target_service = target_service
        self.active_experiments: Dict[str, ChaosExperiment] = {}
        self.experiment_tasks: Dict[str, asyncio.Task] = {}

    async def inject_network_delay(self, delay_ms: int, duration_seconds: int) -> str:
        """Inject network delay for the target service"""
        experiment = ChaosExperiment(
            id=f"delay_{int(time.time())}_{random.randint(1000, 9999)}",
            name=f"Network Delay {delay_ms}ms",
            chaos_type=ChaosType.NETWORK_DELAY,
            target_service=self.target_service,
            duration_seconds=duration_seconds,
            intensity=min(delay_ms / 5000, 1.0),  # Max 5 seconds delay = 100% intensity
            parameters={'delay_ms': delay_ms},
            created_at=datetime.utcnow()
        )

        return await self._start_experiment(experiment)

    async def inject_network_failure(self, failure_rate: float, duration_seconds: int) -> str:
        """Inject network failures for the target service"""
        experiment = ChaosExperiment(
            id=f"failure_{int(time.time())}_{random.randint(1000, 9999)}",
            name=f"Network Failure {failure_rate*100}%",
            chaos_type=ChaosType.NETWORK_FAILURE,
            target_service=self.target_service,
            duration_seconds=duration_seconds,
            intensity=failure_rate,
            parameters={'failure_rate': failure_rate},
            created_at=datetime.utcnow()
        )

        return await self._start_experiment(experiment)

    async def inject_service_crash(self, crash_probability: float, duration_seconds: int) -> str:
        """Inject service crashes"""
        experiment = ChaosExperiment(
            id=f"crash_{int(time.time())}_{random.randint(1000, 9999)}",
            name=f"Service Crash {crash_probability*100}%",
            chaos_type=ChaosType.SERVICE_CRASH,
            target_service=self.target_service,
            duration_seconds=duration_seconds,
            intensity=crash_probability,
            parameters={'crash_probability': crash_probability},
            created_at=datetime.utcnow()
        )

        return await self._start_experiment(experiment)

    async def inject_resource_exhaustion(self, resource_type: str, exhaustion_level: float,
                                       duration_seconds: int) -> str:
        """Inject resource exhaustion (CPU, memory, etc.)"""
        experiment = ChaosExperiment(
            id=f"resource_{int(time.time())}_{random.randint(1000, 9999)}",
            name=f"Resource Exhaustion {resource_type} {exhaustion_level*100}%",
            chaos_type=ChaosType.RESOURCE_EXHAUSTION,
            target_service=self.target_service,
            duration_seconds=duration_seconds,
            intensity=exhaustion_level,
            parameters={'resource_type': resource_type, 'exhaustion_level': exhaustion_level},
            created_at=datetime.utcnow()
        )

        return await self._start_experiment(experiment)

    async def _start_experiment(self, experiment: ChaosExperiment) -> str:
        """Start a chaos experiment"""
        self.active_experiments[experiment.id] = experiment

        # Start the experiment task
        task = asyncio.create_task(self._run_experiment(experiment))
        self.experiment_tasks[experiment.id] = task

        logger.warning("Started chaos experiment",
                      experiment_id=experiment.id,
                      type=experiment.chaos_type.value,
                      target=experiment.target_service,
                      duration=experiment.duration_seconds)

        return experiment.id

    async def _run_experiment(self, experiment: ChaosExperiment):
        """Run the chaos experiment"""
        try:
            experiment.status = "running"
            experiment.started_at = datetime.utcnow()

            # Execute chaos based on type
            if experiment.chaos_type == ChaosType.NETWORK_DELAY:
                await self._execute_network_delay(experiment)
            elif experiment.chaos_type == ChaosType.NETWORK_FAILURE:
                await self._execute_network_failure(experiment)
            elif experiment.chaos_type == ChaosType.SERVICE_CRASH:
                await self._execute_service_crash(experiment)
            elif experiment.chaos_type == ChaosType.RESOURCE_EXHAUSTION:
                await self._execute_resource_exhaustion(experiment)

            # Wait for duration
            await asyncio.sleep(experiment.duration_seconds)

            # Complete experiment
            experiment.status = "completed"
            experiment.completed_at = datetime.utcnow()
            experiment.results = {
                'duration_actual': (experiment.completed_at - experiment.started_at).total_seconds(),
                'status': 'success'
            }

            logger.info("Completed chaos experiment",
                       experiment_id=experiment.id,
                       results=experiment.results)

        except Exception as e:
            experiment.status = "failed"
            experiment.completed_at = datetime.utcnow()
            experiment.results = {
                'error': str(e),
                'duration_actual': (experiment.completed_at - experiment.started_at).total_seconds() if experiment.started_at else 0,
                'status': 'failed'
            }

            logger.error("Chaos experiment failed",
                        experiment_id=experiment.id,
                        error=str(e))

        finally:
            # Clean up
            if experiment.id in self.experiment_tasks:
                del self.experiment_tasks[experiment.id]

    async def _execute_network_delay(self, experiment: ChaosExperiment):
        """Execute network delay injection"""
        delay_ms = experiment.parameters['delay_ms']

        # Store delay configuration in Redis for the service to pick up
        redis = await get_redis()
        chaos_key = f"chaos:{experiment.target_service}:delay"

        await redis.setex(chaos_key, experiment.duration_seconds + 60,  # Extra time for cleanup
                         json.dumps({
                             'active': True,
                             'delay_ms': delay_ms,
                             'experiment_id': experiment.id
                         }))

        logger.info("Injected network delay",
                   service=experiment.target_service,
                   delay_ms=delay_ms)

    async def _execute_network_failure(self, experiment: ChaosExperiment):
        """Execute network failure injection"""
        failure_rate = experiment.parameters['failure_rate']

        redis = await get_redis()
        chaos_key = f"chaos:{experiment.target_service}:failure"

        await redis.setex(chaos_key, experiment.duration_seconds + 60,
                         json.dumps({
                             'active': True,
                             'failure_rate': failure_rate,
                             'experiment_id': experiment.id
                         }))

        logger.info("Injected network failure",
                   service=experiment.target_service,
                   failure_rate=failure_rate)

    async def _execute_service_crash(self, experiment: ChaosExperiment):
        """Execute service crash injection"""
        crash_probability = experiment.parameters['crash_probability']

        redis = await get_redis()
        chaos_key = f"chaos:{experiment.target_service}:crash"

        await redis.setex(chaos_key, experiment.duration_seconds + 60,
                         json.dumps({
                             'active': True,
                             'crash_probability': crash_probability,
                             'experiment_id': experiment.id
                         }))

        logger.info("Injected service crash",
                   service=experiment.target_service,
                   crash_probability=crash_probability)

    async def _execute_resource_exhaustion(self, experiment: ChaosExperiment):
        """Execute resource exhaustion injection"""
        resource_type = experiment.parameters['resource_type']
        exhaustion_level = experiment.parameters['exhaustion_level']

        redis = await get_redis()
        chaos_key = f"chaos:{experiment.target_service}:resource:{resource_type}"

        await redis.setex(chaos_key, experiment.duration_seconds + 60,
                         json.dumps({
                             'active': True,
                             'exhaustion_level': exhaustion_level,
                             'experiment_id': experiment.id
                         }))

        logger.info("Injected resource exhaustion",
                   service=experiment.target_service,
                   resource=resource_type,
                   level=exhaustion_level)

    async def stop_experiment(self, experiment_id: str) -> bool:
        """Stop a running experiment"""
        if experiment_id not in self.active_experiments:
            return False

        experiment = self.active_experiments[experiment_id]

        # Cancel the task
        if experiment_id in self.experiment_tasks:
            self.experiment_tasks[experiment_id].cancel()
            del self.experiment_tasks[experiment_id]

        # Mark as completed early
        experiment.status = "completed"
        experiment.completed_at = datetime.utcnow()
        experiment.results = {
            'stopped_early': True,
            'duration_actual': (experiment.completed_at - (experiment.started_at or experiment.created_at)).total_seconds()
        }

        # Clean up chaos configuration
        await self._cleanup_chaos_config(experiment.target_service)

        logger.info("Stopped chaos experiment early", experiment_id=experiment_id)

        return True

    async def _cleanup_chaos_config(self, service_name: str):
        """Clean up chaos configuration from Redis"""
        redis = await get_redis()

        # Clean up all chaos keys for the service
        pattern = f"chaos:{service_name}:*"
        keys = await redis.keys(pattern)

        if keys:
            await redis.delete(*keys)

        logger.debug("Cleaned up chaos configuration", service=service_name, keys_deleted=len(keys))

    def get_active_experiments(self) -> List[ChaosExperiment]:
        """Get all active experiments"""
        return list(self.active_experiments.values())

    def get_experiment_status(self, experiment_id: str) -> Optional[ChaosExperiment]:
        """Get status of a specific experiment"""
        return self.active_experiments.get(experiment_id)


class ChaosEngineeringSystem:
    """Main chaos engineering system"""

    def __init__(self):
        self.monkeys: Dict[str, ChaosMonkey] = {}
        self.experiment_history: List[ChaosExperiment] = []
        self.is_enabled = False

    def enable_chaos(self):
        """Enable chaos engineering (only in development/testing)"""
        self.is_enabled = True
        logger.warning("Chaos Engineering ENABLED - Use with extreme caution!")

    def disable_chaos(self):
        """Disable chaos engineering"""
        self.is_enabled = False
        logger.info("Chaos Engineering DISABLED")

    def get_chaos_monkey(self, service_name: str) -> ChaosMonkey:
        """Get or create chaos monkey for a service"""
        if service_name not in self.monkeys:
            self.monkeys[service_name] = ChaosMonkey(service_name)
        return self.monkeys[service_name]

    async def run_game_days_scenario(self, scenario_name: str) -> Dict[str, Any]:
        """Run a predefined game days scenario"""
        if not self.is_enabled:
            raise ValueError("Chaos engineering is disabled")

        scenarios = {
            'network_storm': self._scenario_network_storm,
            'service_cascade': self._scenario_service_cascade,
            'resource_crunch': self._scenario_resource_crunch,
            'total_blackout': self._scenario_total_blackout
        }

        if scenario_name not in scenarios:
            raise ValueError(f"Unknown scenario: {scenario_name}")

        logger.warning("Starting Game Days scenario", scenario=scenario_name)

        try:
            results = await scenarios[scenario_name]()
            logger.info("Completed Game Days scenario", scenario=scenario_name, results=results)
            return results
        except Exception as e:
            logger.error("Game Days scenario failed", scenario=scenario_name, error=str(e))
            raise

    async def _scenario_network_storm(self) -> Dict[str, Any]:
        """Network storm scenario - random delays and failures across services"""
        services = ['shopify', 'aramex', 'smsa', 'unifonic', 'sendgrid']
        experiments = []

        for service in services:
            monkey = self.get_chaos_monkey(service)

            # Random delay (100ms - 2s)
            delay_ms = random.randint(100, 2000)
            exp_id = await monkey.inject_network_delay(delay_ms, 300)  # 5 minutes
            experiments.append(exp_id)

            # Random failure rate (5-20%)
            failure_rate = random.uniform(0.05, 0.20)
            exp_id = await monkey.inject_network_failure(failure_rate, 180)  # 3 minutes
            experiments.append(exp_id)

        return {'scenario': 'network_storm', 'experiments': experiments}

    async def _scenario_service_cascade(self) -> Dict[str, Any]:
        """Service cascade failure scenario"""
        # Start with one service failing, then cascade to others
        experiments = []

        # Primary failure
        monkey = self.get_chaos_monkey('shopify')
        exp_id = await monkey.inject_service_crash(0.8, 600)  # 10 minutes
        experiments.append(exp_id)

        await asyncio.sleep(120)  # Wait 2 minutes

        # Secondary failures
        for service in ['aramex', 'smsa']:
            monkey = self.get_chaos_monkey(service)
            exp_id = await monkey.inject_network_failure(0.5, 300)  # 5 minutes
            experiments.append(exp_id)

        return {'scenario': 'service_cascade', 'experiments': experiments}

    async def _scenario_resource_crunch(self) -> Dict[str, Any]:
        """Resource exhaustion scenario"""
        experiments = []

        for service in ['shopify', 'aramex']:
            monkey = self.get_chaos_monkey(service)
            exp_id = await monkey.inject_resource_exhaustion('memory', 0.7, 240)  # 4 minutes
            experiments.append(exp_id)

        return {'scenario': 'resource_crunch', 'experiments': experiments}

    async def _scenario_total_blackout(self) -> Dict[str, Any]:
        """Total blackout scenario - all services fail"""
        experiments = []

        for service in ['shopify', 'aramex', 'smsa', 'unifonic', 'sendgrid']:
            monkey = self.get_chaos_monkey(service)
            exp_id = await monkey.inject_network_failure(1.0, 120)  # 2 minutes, 100% failure
            experiments.append(exp_id)

        return {'scenario': 'total_blackout', 'experiments': experiments}

    def get_system_status(self) -> Dict[str, Any]:
        """Get overall chaos system status"""
        active_experiments = []
        for monkey in self.monkeys.values():
            active_experiments.extend(monkey.get_active_experiments())

        return {
            'chaos_enabled': self.is_enabled,
            'active_monkeys': len(self.monkeys),
            'active_experiments': len(active_experiments),
            'experiments': [exp.to_dict() for exp in active_experiments],
            'available_scenarios': ['network_storm', 'service_cascade', 'resource_crunch', 'total_blackout']
        }

    async def emergency_stop_all(self):
        """Emergency stop all chaos experiments"""
        logger.warning("Emergency stop of all chaos experiments")

        stop_tasks = []
        for monkey in self.monkeys.values():
            for exp_id in list(monkey.active_experiments.keys()):
                stop_tasks.append(monkey.stop_experiment(exp_id))

        await asyncio.gather(*stop_tasks, return_exceptions=True)

        logger.info("Emergency stop completed")


# Global chaos engineering system
chaos_system = ChaosEngineeringSystem()


async def inject_chaos(service_name: str, chaos_type: str, **kwargs) -> str:
    """Helper function to inject chaos into a service"""
    if not chaos_system.is_enabled:
        raise ValueError("Chaos engineering is disabled")

    monkey = chaos_system.get_chaos_monkey(service_name)

    if chaos_type == 'delay':
        return await monkey.inject_network_delay(**kwargs)
    elif chaos_type == 'failure':
        return await monkey.inject_network_failure(**kwargs)
    elif chaos_type == 'crash':
        return await monkey.inject_service_crash(**kwargs)
    elif chaos_type == 'resource':
        return await monkey.inject_resource_exhaustion(**kwargs)
    else:
        raise ValueError(f"Unknown chaos type: {chaos_type}")


async def check_for_chaos(service_name: str) -> Optional[Dict[str, Any]]:
    """Check if chaos is active for a service (called by service adapters)"""
    try:
        redis = await get_redis()

        # Check for active chaos configurations
        chaos_keys = await redis.keys(f"chaos:{service_name}:*")

        for key in chaos_keys:
            chaos_config = await redis.get(key)
            if chaos_config:
                return json.loads(chaos_config)

    except Exception as e:
        logger.error("Error checking for chaos", service=service_name, error=str(e))

    return None