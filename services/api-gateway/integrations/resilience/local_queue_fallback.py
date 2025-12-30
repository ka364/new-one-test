"""

Local Queue Fallback System for HaderOS

This module provides a Redis-based queue system for storing failed operations
and retrying them when services become available again.

"""

import json
import asyncio
import time
from typing import Dict, Any, List, Optional, Callable
from datetime import datetime, timedelta
import structlog

from services.api_gateway.core.database import get_redis

logger = structlog.get_logger(__name__)


class QueueItem:
    """Represents an item in the retry queue"""

    def __init__(self, operation: str, data: Dict[str, Any], priority: int = 1):
        self.id = f"{operation}_{int(time.time() * 1000)}_{hash(str(data))}"
        self.operation = operation
        self.data = data
        self.priority = priority  # 1=low, 2=medium, 3=high, 4=critical
        self.created_at = datetime.utcnow()
        self.retry_count = 0
        self.last_error = None
        self.last_attempt = None
        self.next_retry = None
        self.max_retries = 10
        self.service_name = data.get('service_name', 'unknown')

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for Redis storage"""
        return {
            'id': self.id,
            'operation': self.operation,
            'data': self.data,
            'priority': self.priority,
            'created_at': self.created_at.isoformat(),
            'retry_count': self.retry_count,
            'last_error': str(self.last_error) if self.last_error else None,
            'last_attempt': self.last_attempt.isoformat() if self.last_attempt else None,
            'next_retry': self.next_retry.isoformat() if self.next_retry else None,
            'max_retries': self.max_retries,
            'service_name': self.service_name
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'QueueItem':
        """Create from dictionary"""
        item = cls(data['operation'], data['data'], data.get('priority', 1))
        item.id = data['id']
        item.created_at = datetime.fromisoformat(data['created_at'])
        item.retry_count = data.get('retry_count', 0)
        item.last_error = data.get('last_error')
        item.last_attempt = datetime.fromisoformat(data['last_attempt']) if data.get('last_attempt') else None
        item.next_retry = datetime.fromisoformat(data['next_retry']) if data.get('next_retry') else None
        item.max_retries = data.get('max_retries', 10)
        item.service_name = data.get('service_name', 'unknown')
        return item

    def should_retry(self) -> bool:
        """Check if item should be retried"""
        return self.retry_count < self.max_retries

    def calculate_next_retry(self) -> datetime:
        """Calculate next retry time using exponential backoff"""
        # Base delay: 5 minutes, exponential backoff with jitter
        base_delay = 5 * 60  # 5 minutes in seconds
        delay = base_delay * (2 ** self.retry_count)

        # Add jitter (±25%)
        jitter = delay * 0.25 * (0.5 - time.time() % 1)  # Random between -25% and +25%
        delay += jitter

        # Cap at 24 hours
        delay = min(delay, 24 * 60 * 60)

        return datetime.utcnow() + timedelta(seconds=delay)

    def record_attempt(self, success: bool, error: Optional[str] = None):
        """Record an attempt"""
        self.last_attempt = datetime.utcnow()
        if not success:
            self.retry_count += 1
            self.last_error = error
            if self.should_retry():
                self.next_retry = self.calculate_next_retry()
        else:
            self.next_retry = None


class RedisQueue:
    """Redis-based queue for failed operations"""

    def __init__(self, queue_name: str):
        self.queue_name = queue_name
        self.pending_key = f"queue:{queue_name}:pending"
        self.processing_key = f"queue:{queue_name}:processing"
        self.failed_key = f"queue:{queue_name}:failed"
        self.completed_key = f"queue:{queue_name}:completed"

    async def push(self, item: QueueItem) -> str:
        """Add item to queue"""
        redis = await get_redis()
        item_dict = item.to_dict()

        # Use priority as score for sorted set
        score = item.priority * 1000000 + int(time.time())

        await redis.zadd(self.pending_key, {json.dumps(item_dict): score})
        logger.info("Queued item for retry", item_id=item.id, operation=item.operation)
        return item.id

    async def pop(self) -> Optional[QueueItem]:
        """Get next item from queue"""
        redis = await get_redis()

        # Get item with highest priority (lowest score)
        result = await redis.zpopmin(self.pending_key, count=1)
        if not result:
            return None

        item_data = json.loads(result[0][0])
        item = QueueItem.from_dict(item_data)

        # Move to processing
        await redis.setex(f"{self.processing_key}:{item.id}", 3600, json.dumps(item_data))  # 1 hour timeout

        return item

    async def complete(self, item_id: str):
        """Mark item as completed"""
        redis = await get_redis()

        # Remove from processing
        await redis.delete(f"{self.processing_key}:{item_id}")

        # Add to completed (with TTL)
        await redis.setex(f"{self.completed_key}:{item_id}", 86400, "completed")  # 24 hours

        logger.info("Completed queued item", item_id=item_id)

    async def fail(self, item: QueueItem, error: str):
        """Mark item as failed"""
        redis = await get_redis()

        item.record_attempt(success=False, error=error)

        if item.should_retry():
            # Re-queue with updated retry info
            await self.push(item)
        else:
            # Move to permanent failure
            await redis.setex(f"{self.failed_key}:{item.id}", 604800, json.dumps(item.to_dict()))  # 7 days

        # Remove from processing
        await redis.delete(f"{self.processing_key}:{item.id}")

        logger.warning("Failed queued item", item_id=item.id, error=error, retry_count=item.retry_count)

    async def get_queue_stats(self) -> Dict[str, Any]:
        """Get queue statistics"""
        redis = await get_redis()

        pending_count = await redis.zcard(self.pending_key)
        processing_count = await redis.eval("return #redis.call('keys', ARGV[1])", 0, f"{self.processing_key}:*")
        failed_count = await redis.eval("return #redis.call('keys', ARGV[1])", 0, f"{self.failed_key}:*")
        completed_count = await redis.eval("return #redis.call('keys', ARGV[1])", 0, f"{self.completed_key}:*")

        return {
            'queue_name': self.queue_name,
            'pending': pending_count,
            'processing': processing_count,
            'failed': failed_count,
            'completed': completed_count,
            'total': pending_count + processing_count + failed_count + completed_count
        }

    async def get_pending_items(self, limit: int = 50) -> List[QueueItem]:
        """Get pending items for monitoring"""
        redis = await get_redis()

        result = await redis.zrange(self.pending_key, 0, limit - 1, withscores=True)
        items = []

        for item_json, score in result:
            try:
                item_data = json.loads(item_json)
                item = QueueItem.from_dict(item_data)
                items.append(item)
            except Exception as e:
                logger.error("Failed to parse queued item", error=str(e))

        return items

    async def clear_queue(self):
        """Clear all queue data (for testing/emergency)"""
        redis = await get_redis()

        await redis.delete(self.pending_key)
        await redis.eval("return redis.call('del', unpack(redis.call('keys', ARGV[1])))", 0, f"{self.processing_key}:*")
        await redis.eval("return redis.call('del', unpack(redis.call('keys', ARGV[1])))", 0, f"{self.failed_key}:*")
        await redis.eval("return redis.call('del', unpack(redis.call('keys', ARGV[1])))", 0, f"{self.completed_key}:*")

        logger.warning("Cleared queue", queue_name=self.queue_name)


class RetryScheduler:
    """Scheduler for retrying queued operations"""

    def __init__(self, queue_manager=None):
        self.scheduled_tasks: Dict[str, asyncio.Task] = {}
        self.queue_manager = queue_manager  # Will be set later to avoid circular reference

    async def schedule_retry(self, item_id: str, retry_in_seconds: int):
        """Schedule a retry for an item"""
        if item_id in self.scheduled_tasks:
            # Cancel existing task
            self.scheduled_tasks[item_id].cancel()

        async def retry_task():
            try:
                await asyncio.sleep(retry_in_seconds)
                await self.queue_manager.process_retry(item_id)
            except asyncio.CancelledError:
                logger.info("Retry task cancelled", item_id=item_id)
            except Exception as e:
                logger.error("Retry task failed", item_id=item_id, error=str(e))

        task = asyncio.create_task(retry_task())
        self.scheduled_tasks[item_id] = task

        logger.info("Scheduled retry", item_id=item_id, retry_in_seconds=retry_in_seconds)

    async def cancel_retry(self, item_id: str):
        """Cancel scheduled retry"""
        if item_id in self.scheduled_tasks:
            self.scheduled_tasks[item_id].cancel()
            del self.scheduled_tasks[item_id]
            logger.info("Cancelled retry", item_id=item_id)

    async def get_scheduled_retries(self) -> Dict[str, Any]:
        """Get information about scheduled retries"""
        return {
            'active_retries': len(self.scheduled_tasks),
            'scheduled_items': list(self.scheduled_tasks.keys())
        }


class LocalQueueFallback:
    """Main fallback system using local queues"""

    def __init__(self):
        self.order_queue = RedisQueue("orders")
        self.fulfillment_queue = RedisQueue("fulfillments")
        self.notification_queue = RedisQueue("notifications")
        self.retry_scheduler = RetryScheduler()
        self.retry_scheduler.queue_manager = self  # Set reference after creation

        # Service health tracking
        self.service_health: Dict[str, Dict[str, Any]] = {}

    async def queue_failed_operation(self, operation: str, data: Dict[str, Any],
                                   service_name: str, error: str) -> str:
        """Queue a failed operation for later retry"""
        priority_map = {
            'create_order': 4,  # Critical
            'update_inventory': 3,  # High
            'create_fulfillment': 3,  # High
            'send_notification': 2,  # Medium
            'get_orders': 1,  # Low
        }

        priority = priority_map.get(operation, 2)

        item = QueueItem(operation, {
            **data,
            'service_name': service_name,
            'original_error': error
        }, priority)

        queue = self._get_queue_for_operation(operation)
        item_id = await queue.push(item)

        # Schedule immediate retry (5 minutes)
        await self.retry_scheduler.schedule_retry(item_id, 300)

        logger.warning("Queued failed operation",
                      operation=operation,
                      service=service_name,
                      item_id=item_id,
                      error=error)

        return item_id

    def _get_queue_for_operation(self, operation: str) -> RedisQueue:
        """Get appropriate queue for operation type"""
        if operation in ['create_order', 'update_order', 'cancel_order', 'get_orders']:
            return self.order_queue
        elif operation in ['create_fulfillment', 'get_fulfillments']:
            return self.fulfillment_queue
        elif operation in ['send_sms', 'send_email']:
            return self.notification_queue
        else:
            return self.order_queue  # Default

    async def process_retry(self, item_id: str):
        """Process a retry for a queued item"""
        # Find item in all queues
        queues = [self.order_queue, self.fulfillment_queue, self.notification_queue]

        for queue in queues:
            try:
                # Check if item exists in this queue
                redis = await get_redis()
                items = await queue.get_pending_items(1000)  # Get all pending

                for item in items:
                    if item.id == item_id:
                        await self._execute_retry(item, queue)
                        return

            except Exception as e:
                logger.error("Error checking queue for retry", queue=queue.queue_name, error=str(e))

        logger.warning("Retry item not found", item_id=item_id)

    async def _execute_retry(self, item: QueueItem, queue: RedisQueue):
        """Execute retry for an item"""
        try:
            # Import here to avoid circular imports
            from services.api_gateway.integrations import AdapterManager

            # Get service health
            service_name = item.service_name
            if not await self._is_service_healthy(service_name):
                # Reschedule for later
                await self.retry_scheduler.schedule_retry(item.id, 600)  # 10 minutes
                return

            # Create adapter manager (this should be injected in real implementation)
            manager = AdapterManager({})  # TODO: Pass proper config

            # Execute operation
            if item.operation == 'create_order':
                result = await manager.create_order(service_name, item.data)
            elif item.operation == 'get_orders':
                result = await manager.get_orders(service_name, **item.data.get('filters', {}))
            # Add other operations...

            # Mark as completed
            await queue.complete(item.id)
            logger.info("Successfully retried operation",
                       operation=item.operation,
                       item_id=item.id,
                       service=service_name)

        except Exception as e:
            error_msg = str(e)
            await queue.fail(item, error_msg)
            logger.error("Retry failed",
                        operation=item.operation,
                        item_id=item.id,
                        service=service_name,
                        error=error_msg)

    async def _is_service_healthy(self, service_name: str) -> bool:
        """Check if service is healthy"""
        # TODO: Implement proper health checking
        # For now, assume all services are healthy
        return True

    async def get_system_status(self) -> Dict[str, Any]:
        """Get overall system status"""
        order_stats = await self.order_queue.get_queue_stats()
        fulfillment_stats = await self.fulfillment_queue.get_queue_stats()
        notification_stats = await self.notification_queue.get_queue_stats()
        scheduler_stats = await self.retry_scheduler.get_scheduled_retries()

        return {
            'queues': {
                'orders': order_stats,
                'fulfillments': fulfillment_stats,
                'notifications': notification_stats
            },
            'scheduler': scheduler_stats,
            'total_pending': (order_stats['pending'] +
                            fulfillment_stats['pending'] +
                            notification_stats['pending']),
            'total_failed': (order_stats['failed'] +
                           fulfillment_stats['failed'] +
                           notification_stats['failed'])
        }

    async def emergency_drain_queue(self, service_name: str):
        """Emergency: Process all pending items for a service"""
        logger.warning("Starting emergency queue drain", service=service_name)

        queues = [self.order_queue, self.fulfillment_queue, self.notification_queue]

        for queue in queues:
            items = await queue.get_pending_items(1000)
            service_items = [item for item in items if item.service_name == service_name]

            for item in service_items:
                await self._execute_retry(item, queue)
                await asyncio.sleep(1)  # Rate limiting

        logger.info("Completed emergency queue drain", service=service_name)