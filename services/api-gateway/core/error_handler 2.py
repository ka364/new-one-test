"""
Error Handler & Decorators
معالجات الأخطاء والـ Decorators الموحدة
"""

from functools import wraps
from fastapi import HTTPException
import logging
from typing import Callable, Any
from inspect import iscoroutinefunction

logger = logging.getLogger(__name__)


class AppException(Exception):
    """Base application exception"""
    def __init__(self, message: str, status_code: int = 500, details: dict = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class ValidationException(AppException):
    """Validation error"""
    def __init__(self, message: str, details: dict = None):
        super().__init__(message, status_code=400, details=details)


class ResourceNotFoundException(AppException):
    """Resource not found"""
    def __init__(self, resource: str, details: dict = None):
        message = f"{resource} not found"
        super().__init__(message, status_code=404, details=details)


class UnauthorizedException(AppException):
    """Unauthorized access"""
    def __init__(self, message: str = "Unauthorized", details: dict = None):
        super().__init__(message, status_code=401, details=details)


def handle_endpoint_errors(func: Callable) -> Callable:
    """
    Decorator for handling endpoint errors uniformly
    
    Usage:
        @router.get("/items")
        @handle_endpoint_errors
        async def get_items():
            return []
    """
    @wraps(func)
    async def async_wrapper(*args, **kwargs) -> Any:
        try:
            return await func(*args, **kwargs)
        except ValidationException as e:
            logger.warning(f"Validation error in {func.__name__}: {e.message}", extra=e.details)
            raise HTTPException(status_code=e.status_code, detail=e.message)
        except ResourceNotFoundException as e:
            logger.warning(f"Resource not found in {func.__name__}: {e.message}")
            raise HTTPException(status_code=e.status_code, detail=e.message)
        except UnauthorizedException as e:
            logger.warning(f"Unauthorized access in {func.__name__}")
            raise HTTPException(status_code=e.status_code, detail=e.message)
        except AppException as e:
            logger.error(f"Application error in {func.__name__}: {e.message}", extra=e.details)
            raise HTTPException(status_code=e.status_code, detail=e.message)
        except ValueError as e:
            logger.warning(f"Value error in {func.__name__}: {str(e)}")
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            logger.error(f"Unexpected error in {func.__name__}: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail="Internal server error")
    
    @wraps(func)
    def sync_wrapper(*args, **kwargs) -> Any:
        try:
            return func(*args, **kwargs)
        except ValidationException as e:
            logger.warning(f"Validation error in {func.__name__}: {e.message}", extra=e.details)
            raise HTTPException(status_code=e.status_code, detail=e.message)
        except ResourceNotFoundException as e:
            logger.warning(f"Resource not found in {func.__name__}: {e.message}")
            raise HTTPException(status_code=e.status_code, detail=e.message)
        except UnauthorizedException as e:
            logger.warning(f"Unauthorized access in {func.__name__}")
            raise HTTPException(status_code=e.status_code, detail=e.message)
        except AppException as e:
            logger.error(f"Application error in {func.__name__}: {e.message}", extra=e.details)
            raise HTTPException(status_code=e.status_code, detail=e.message)
        except ValueError as e:
            logger.warning(f"Value error in {func.__name__}: {str(e)}")
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            logger.error(f"Unexpected error in {func.__name__}: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail="Internal server error")
    
    return async_wrapper if iscoroutinefunction(func) else sync_wrapper
