"""

Resilience Monitoring API Endpoints

Provides REST API endpoints for monitoring and managing the resilience system.

"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, Optional
import structlog

from services.api_gateway.integrations.resilience import (
    health_checker,
    chaos_system,
    LocalQueueFallback
)
from services.api_gateway.integrations.resilience_integration import (
    get_resilient_adapter_manager
)

logger = structlog.get_logger(__name__)

router = APIRouter()


@router.get("/health", response_model=Dict[str, Any])
async def get_system_health():
    """Get overall system health status"""
    try:
        health_summary = health_checker.get_system_health_summary()
        return {
            "status": "healthy" if health_summary['system_health_percentage'] >= 95 else "degraded",
            "timestamp": health_summary['timestamp'],
            "services": {
                "total": health_summary['total_services'],
                "healthy": health_summary['healthy_services'],
                "unhealthy": health_summary['unhealthy_services'],
                "health_percentage": health_summary['system_health_percentage']
            },
            "uptime": {
                "average_percentage": health_summary['average_uptime_percentage']
            }
        }
    except Exception as e:
        logger.error("Failed to get system health", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve health status")


@router.get("/health/{service_name}", response_model=Dict[str, Any])
async def get_service_health(service_name: str):
    """Get health status for a specific service"""
    try:
        status = health_checker.get_service_status(service_name)
        if not status:
            raise HTTPException(status_code=404, detail=f"Service {service_name} not found")

        return {
            "service_name": status.service_name,
            "is_healthy": status.is_healthy,
            "last_check": status.last_check.isoformat(),
            "response_time": status.response_time,
            "error_message": status.error_message,
            "consecutive_failures": status.consecutive_failures,
            "total_checks": status.total_checks,
            "total_failures": status.total_failures,
            "uptime_percentage": status.uptime_percentage,
            "last_success": status.last_success.isoformat() if status.last_success else None,
            "last_failure": status.last_failure.isoformat() if status.last_failure else None
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get service health", service=service_name, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve service health")


@router.get("/resilience/status", response_model=Dict[str, Any])
async def get_resilience_status(
    manager = Depends(get_resilient_adapter_manager)
):
    """Get comprehensive resilience system status"""
    try:
        status = await manager.get_resilience_status()
        return status
    except Exception as e:
        logger.error("Failed to get resilience status", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve resilience status")


@router.get("/queues/status", response_model=Dict[str, Any])
async def get_queues_status():
    """Get status of all retry queues"""
    try:
        queue_system = LocalQueueFallback()
        status = await queue_system.get_system_status()

        return {
            "timestamp": status['timestamp'],
            "queues": status['queues'],
            "summary": {
                "total_pending": status['total_pending'],
                "total_failed": status['total_failed'],
                "total_completed": sum(q['completed'] for q in status['queues'].values())
            }
        }
    except Exception as e:
        logger.error("Failed to get queues status", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve queues status")


@router.get("/queues/{queue_name}/pending", response_model=Dict[str, Any])
async def get_pending_operations(queue_name: str, limit: int = 50):
    """Get pending operations in a specific queue"""
    try:
        queue_system = LocalQueueFallback()

        # Get the appropriate queue
        if queue_name == "orders":
            queue = queue_system.order_queue
        elif queue_name == "fulfillments":
            queue = queue_system.fulfillment_queue
        elif queue_name == "notifications":
            queue = queue_system.notification_queue
        else:
            raise HTTPException(status_code=404, detail=f"Queue {queue_name} not found")

        pending_items = await queue.get_pending_items(limit)

        return {
            "queue_name": queue_name,
            "pending_count": len(pending_items),
            "items": [
                {
                    "id": item.id,
                    "operation": item.operation,
                    "service_name": item.service_name,
                    "priority": item.priority,
                    "created_at": item.created_at.isoformat(),
                    "retry_count": item.retry_count,
                    "last_error": item.last_error,
                    "next_retry": item.next_retry.isoformat() if item.next_retry else None
                }
                for item in pending_items
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get pending operations", queue=queue_name, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve pending operations")


@router.post("/queues/emergency-drain")
async def emergency_drain_queues(service_name: Optional[str] = None):
    """Emergency: Process all pending operations"""
    try:
        manager = await get_resilient_adapter_manager({})
        await manager.emergency_drain_queues(service_name)

        return {
            "message": f"Emergency drain completed for {service_name or 'all services'}",
            "timestamp": "now"
        }
    except Exception as e:
        logger.error("Failed to perform emergency drain", service=service_name, error=str(e))
        raise HTTPException(status_code=500, detail="Emergency drain failed")


@router.get("/chaos/status", response_model=Dict[str, Any])
async def get_chaos_status():
    """Get chaos engineering system status"""
    try:
        status = chaos_system.get_system_status()
        return status
    except Exception as e:
        logger.error("Failed to get chaos status", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve chaos status")


@router.post("/chaos/enable")
async def enable_chaos():
    """Enable chaos engineering (DANGER: Testing only!)"""
    try:
        if chaos_system.is_enabled:
            return {"message": "Chaos engineering already enabled"}

        chaos_system.enable_chaos()
        logger.warning("Chaos engineering enabled via API")

        return {
            "message": "Chaos engineering enabled",
            "warning": "This should only be used in testing environments!",
            "timestamp": "now"
        }
    except Exception as e:
        logger.error("Failed to enable chaos", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to enable chaos engineering")


@router.post("/chaos/disable")
async def disable_chaos():
    """Disable chaos engineering"""
    try:
        chaos_system.disable_chaos()
        logger.info("Chaos engineering disabled via API")

        return {"message": "Chaos engineering disabled"}
    except Exception as e:
        logger.error("Failed to disable chaos", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to disable chaos engineering")


@router.post("/chaos/scenarios/{scenario_name}")
async def run_chaos_scenario(scenario_name: str):
    """Run a predefined chaos scenario (DANGER: Testing only!)"""
    try:
        if not chaos_system.is_enabled:
            raise HTTPException(status_code=400, detail="Chaos engineering is disabled")

        results = await chaos_system.run_game_days_scenario(scenario_name)

        return {
            "message": f"Started chaos scenario: {scenario_name}",
            "results": results,
            "warning": "Chaos scenario running - monitor system closely!"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to run chaos scenario", scenario=scenario_name, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to run chaos scenario")


@router.post("/chaos/stop-all")
async def stop_all_chaos():
    """Emergency stop all chaos experiments"""
    try:
        await chaos_system.emergency_stop_all()
        logger.warning("Emergency stop of all chaos experiments via API")

        return {"message": "All chaos experiments stopped"}
    except Exception as e:
        logger.error("Failed to stop chaos experiments", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to stop chaos experiments")


@router.get("/metrics/{service_name}/{metric_name}")
async def get_service_metrics(service_name: str, metric_name: str, hours: int = 24):
    """Get metrics for a service"""
    try:
        metrics = await health_checker.get_metrics(service_name, metric_name, hours)

        return {
            "service_name": service_name,
            "metric_name": metric_name,
            "hours": hours,
            "data_points": len(metrics),
            "metrics": metrics
        }
    except Exception as e:
        logger.error("Failed to get metrics",
                    service=service_name,
                    metric=metric_name,
                    error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve metrics")


@router.get("/dashboard", response_model=Dict[str, Any])
async def get_resilience_dashboard():
    """Get comprehensive resilience dashboard data"""
    try:
        # Get all status data
        health_summary = health_checker.get_system_health_summary()
        queue_system = LocalQueueFallback()
        queue_status = await queue_system.get_system_status()
        chaos_status = chaos_system.get_system_status()

        # Calculate dashboard metrics
        total_pending = queue_status['total_pending']
        system_health = health_summary['system_health_percentage']

        # Determine overall status
        if system_health >= 95 and total_pending < 10:
            overall_status = "HEALTHY"
            status_color = "green"
        elif system_health >= 80 or total_pending < 50:
            overall_status = "WARNING"
            status_color = "yellow"
        else:
            overall_status = "CRITICAL"
            status_color = "red"

        return {
            "timestamp": "now",
            "overall_status": overall_status,
            "status_color": status_color,
            "summary": {
                "system_health_percentage": system_health,
                "total_pending_operations": total_pending,
                "total_failed_operations": queue_status['total_failed'],
                "active_chaos_experiments": chaos_status['active_experiments']
            },
            "health": health_summary,
            "queues": queue_status,
            "chaos": chaos_status,
            "alerts": [],  # TODO: Implement alert system
            "recommendations": []  # TODO: Implement AI recommendations
        }
    except Exception as e:
        logger.error("Failed to get dashboard data", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve dashboard data")