"""
Security Endpoints - HaderOS Platform
نقاط نهاية الأمان - منصة حضر أوس
"""

from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from backend.core.database import get_db
from typing import Optional

router = APIRouter()

# Simulated security manager (يمكن استبداله بـ import من ملف آخر)
class SecurityManager:
    def __init__(self):
        self.failed_attempts = {}  # {username: count}
        self.locked_users = {}     # {username: unlock_time}
        self.blocked_ips = {}      # {ip: unlock_time}
        
    def record_login_attempt(self, username: str, ip: str, success: bool):
        """تسجيل محاولة تسجيل دخول"""
        now = datetime.utcnow()
        
        # تحقق من الحساب المحظور
        if username in self.locked_users:
            if self.locked_users[username] > now:
                remaining = (self.locked_users[username] - now).seconds // 60
                return {
                    "allowed": False,
                    "message": f"الحساب محظور - حاول مرة أخرى في {remaining} دقائق"
                }
            else:
                del self.locked_users[username]
        
        # تحقق من IP المحظور
        if ip in self.blocked_ips:
            if self.blocked_ips[ip] > now:
                remaining = (self.blocked_ips[ip] - now).seconds // 60
                return {
                    "allowed": False,
                    "message": f"عنوان IP محظور - حاول مرة أخرى في {remaining} دقائق"
                }
            else:
                del self.blocked_ips[ip]
        
        if success:
            # امسح المحاولات عند النجاح
            if username in self.failed_attempts:
                del self.failed_attempts[username]
            return {
                "allowed": True,
                "message": "تسجيل الدخول ناجح"
            }
        else:
            # زيادة العداد عند الفشل
            self.failed_attempts[username] = self.failed_attempts.get(username, 0) + 1
            
            # حظر بعد 5 محاولات فاشلة
            if self.failed_attempts[username] >= 5:
                self.locked_users[username] = now + timedelta(minutes=15)
                return {
                    "allowed": False,
                    "message": "الحساب محظور لمدة 15 دقيقة بعد عدة محاولات فاشلة"
                }
            
            return {
                "allowed": True,
                "message": f"محاولة فاشلة ({self.failed_attempts[username]}/5)"
            }

# Initialize security manager
security_manager = SecurityManager()

# ==================== API Endpoints ====================

@router.post("/login-attempt")
async def record_login_attempt(
    request: Request,
    body: dict,
    db: Session = Depends(get_db)
):
    """
    تسجيل محاولة تسجيل دخول
    
    Body:
    {
        "username": "string",
        "success": boolean
    }
    """
    username = body.get("username", "").strip()
    success = body.get("success", False)
    ip = request.client.host if request.client else "0.0.0.0"
    
    if not username:
        return {"error": "username مطلوب", "status": 400}
    
    result = security_manager.record_login_attempt(username, ip, success)
    
    # Log to database (اختياري)
    # await log_login_attempt(db, username, ip, success)
    
    return {
        **result,
        "ip": ip,
        "timestamp": datetime.utcnow().isoformat(),
        "username": username
    }


@router.get("/stats")
async def get_security_stats(db: Session = Depends(get_db)):
    """احصائيات الأمان العامة"""
    now = datetime.utcnow()
    
    # نظف الحسابات المحظورة المنتهية
    expired_users = [
        u for u, unlock_time in security_manager.locked_users.items()
        if unlock_time <= now
    ]
    for user in expired_users:
        del security_manager.locked_users[user]
    
    # نظف IPs المحظورة المنتهية
    expired_ips = [
        ip for ip, unlock_time in security_manager.blocked_ips.items()
        if unlock_time <= now
    ]
    for ip in expired_ips:
        del security_manager.blocked_ips[ip]
    
    return {
        "stats": {
            "total_failed_attempts": sum(security_manager.failed_attempts.values()),
            "locked_accounts": len(security_manager.locked_users),
            "blocked_ips": len(security_manager.blocked_ips),
            "timestamp": now.isoformat()
        }
    }


@router.get("/blocked-users")
async def get_blocked_users(db: Session = Depends(get_db)):
    """قائمة الحسابات المحظورة"""
    blocked = []
    
    for username, unlock_time in security_manager.locked_users.items():
        remaining = max(0, (unlock_time - datetime.utcnow()).total_seconds())
        blocked.append({
            "username": username,
            "unlock_at": unlock_time.isoformat(),
            "remaining_seconds": int(remaining)
        })
    
    return {
        "blocked": blocked,
        "count": len(blocked)
    }


@router.get("/blocked-ips")
async def get_blocked_ips(db: Session = Depends(get_db)):
    """قائمة IPs المحظورة"""
    blocked = []
    
    for ip, unlock_time in security_manager.blocked_ips.items():
        remaining = max(0, (unlock_time - datetime.utcnow()).total_seconds())
        blocked.append({
            "ip": ip,
            "unlock_at": unlock_time.isoformat(),
            "remaining_seconds": int(remaining)
        })
    
    return {
        "blocked": blocked,
        "count": len(blocked)
    }


@router.post("/unlock-user/{username}")
async def unlock_user(
    username: str,
    db: Session = Depends(get_db)
):
    """فك حظر حساب (require admin)"""
    if username in security_manager.locked_users:
        del security_manager.locked_users[username]
        return {
            "success": True,
            "message": f"تم فك حظر {username}"
        }
    
    return {
        "success": False,
        "message": "الحساب غير محظور"
    }


@router.post("/unblock-ip/{ip}")
async def unblock_ip(
    ip: str,
    db: Session = Depends(get_db)
):
    """فك حظر IP (require admin)"""
    if ip in security_manager.blocked_ips:
        del security_manager.blocked_ips[ip]
        return {
            "success": True,
            "message": f"تم فك حظر {ip}"
        }
    
    return {
        "success": False,
        "message": "IP غير محظور"
    }


@router.post("/clear-all")
async def clear_all_security_data(db: Session = Depends(get_db)):
    """
    مسح جميع بيانات الأمان
    ⚠️ للاختبار فقط!
    """
    security_manager.failed_attempts.clear()
    security_manager.locked_users.clear()
    security_manager.blocked_ips.clear()
    
    return {
        "success": True,
        "message": "تم مسح جميع بيانات الأمان",
        "warning": "⚠️ هذا للاختبار فقط!"
    }


@router.get("/health")
async def security_health_check(db: Session = Depends(get_db)):
    """فحص صحة نظام الأمان"""
    return {
        "status": "operational",
        "security": {
            "locked_accounts": len(security_manager.locked_users),
            "blocked_ips": len(security_manager.blocked_ips),
            "failed_attempts": len(security_manager.failed_attempts)
        },
        "timestamp": datetime.utcnow().isoformat()
    }


# ==================== Integration with Router ====================
# أضف هذا الملف في backend/api/v1/router.py:
#
# from backend.api.v1.endpoints import security
#
# api_router.include_router(
#     security.router,
#     prefix="/security",
#     tags=["security"]
# )
