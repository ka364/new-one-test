# 🔐 HaderOS Admin Authentication System

**Complete authentication system with Super Admin credentials that work everywhere!**

---

## 🎯 Quick Reference

### Default Credentials
```
Username: OShader
Password: Os@2030
```

**These credentials work in:**
- ✅ Browser login page
- ✅ API endpoints  
- ✅ Dashboard
- ✅ Offline after setup

---

## 🚀 Get Started in 3 Steps

### Step 1: Start the System
```bash
bash run.sh both
```

### Step 2: Open Browser
```
http://localhost:3000/login
```

### Step 3: Login
```
Username: OShader
Password: Os@2030
```

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| **AUTH_GUIDE.md** | Complete authentication details |
| **DASHBOARD_GUIDE.md** | Admin dashboard features |
| **ADMIN_SETUP_COMPLETE.md** | Comprehensive technical summary |
| **SUPER_ADMIN_READY.md** | Arabic checklist |

---

## 🧪 Test Immediately

```bash
# Quick test
bash test_admin_auth.sh

# Or manual test
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username: OShader","password":"Os@2030"}'
```

---

## ✨ What You Get

### Backend
- ✅ User authentication with password hashing (bcrypt)
- ✅ JWT token generation (HS256, 30-min expiry)
- ✅ Login endpoint
- ✅ Registration endpoint
- ✅ Token verification
- ✅ Auto-create admin on startup

### Frontend
- ✅ Beautiful login page
- ✅ Admin dashboard
- ✅ Protected routes
- ✅ Auth state management (Zustand)
- ✅ Logout functionality

### Documentation
- ✅ 4 comprehensive guides
- ✅ API documentation
- ✅ Postman collection
- ✅ Test scripts

---

## 🔒 Security

✅ **Passwords**: Hashed with bcrypt (10 salt rounds)
✅ **Tokens**: JWT HS256 signature  
✅ **Expiration**: 30min access, 7day refresh tokens
✅ **Routes**: Protected with role-based access control
✅ **Sessions**: Stored securely in localStorage

---

## 🎓 How to Use

### Login
```bash
POST /api/v1/auth/login
{
  "username: OShader",
  "password": "Os@2030"
}

# Returns
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username: OShader",
    "email": "oshader@haderos.local",
    "role": "super_admin"
  }
}
```

### Use Token
```bash
curl -H "Authorization: Bearer <access_token>" \
  http://localhost:8000/api/v1/bio-modules/list
```

---

## 📊 Architecture

```
Browser (Port 3000)
    ↓
React Login Page
    ↓
POST /api/v1/auth/login
    ↓
FastAPI Backend (Port 8000)
    ↓
SQLite Database
    ↓
Returns JWT Token
    ↓
Protected Routes & API Calls
```

---

## 🛠️ Files Created

### Backend (4 files)
- `backend/core/models.py` - User ORM model
- `backend/core/jwt_utils.py` - JWT utilities
- `backend/core/seeder.py` - Auto-seed admin
- `backend/api/v1/endpoints/auth.py` - Auth endpoints

### Frontend (4 files)
- `frontend/src/pages/Login.tsx` - Login page
- `frontend/src/pages/Dashboard.tsx` - Dashboard
- `frontend/src/store/auth.store.ts` - Auth state
- `frontend/src/components/ProtectedRoute.tsx` - Route guard

### Documentation (6 files)
- `AUTH_GUIDE.md`
- `DASHBOARD_GUIDE.md`
- `ADMIN_SETUP_COMPLETE.md`
- `SUPER_ADMIN_READY.md`
- `test_admin_auth.sh`
- `HaderOS_Admin_Auth_API.postman_collection.json`

---

## 🎉 You're Ready!

```bash
bash run.sh both
# Visit: http://localhost:3000/login
# Login: admin / Os@2030
```

---

For detailed information, see **AUTH_GUIDE.md**

Created: December 24, 2025 | Version: 1.0.0
