# 🔐 HaderOS Authentication Guide

## Super Admin Credentials

### Default Super Admin User
```
Username: OShader
Password: Os@2030
Role: super_admin
```

**⚠️ Important:** Change this password in production! These are development credentials only.

---

## Login Flow

### Step 1: Access Login Page
```
http://localhost:3000/login
```

### Step 2: Enter Credentials
- **Username:** `OShader`
- **Password:** `Os@2030`

### Step 3: Submit & Get Tokens
The frontend will:
1. Send credentials to backend
2. Receive JWT access token + refresh token
3. Store tokens in localStorage
4. Redirect to `/dashboard`

---

## Backend API

### Login Endpoint
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "OShader",
  "password": "Os@2030"
}
```

### Response
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "OShader",
    "email": "oshader@haderos.local",
    "full_name": "OShader Administrator",
    "role": "super_admin"
  }
}
```

### Test with cURL
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "OShader",
    "password": "Os@2030"
  }'
```

---

## Using Access Token

### Attach to API Requests
```bash
curl -H "Authorization: Bearer <access_token>" \
  http://localhost:8000/api/v1/bio-modules/list
```

### In Frontend (Axios)
```typescript
import axios from 'axios';

const token = localStorage.getItem('access_token');

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: {
    Authorization: `Bearer ${token}`
  }
});
```

---

## User Roles

| Role | Permissions | Access |
|------|-------------|--------|
| `super_admin` | Full system access | All endpoints |
| `admin` | Administrative functions | Most endpoints |
| `user` | Regular user access | Limited endpoints |

---

## Creating New Users

### Register via API
```bash
POST /api/v1/auth/register

{
  "username": "newuser",
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "New User"
}
```

### Via Database (Direct)
```python
from backend.core.database import SessionLocal
from backend.core.models import User

db = SessionLocal()

new_user = User(
    username="testuser",
    email="test@example.com",
    full_name="Test User",
    role="admin",
    is_active=True,
    is_verified=True
)
new_user.set_password("testpass123")
db.add(new_user)
db.commit()
```

---

## Token Details

### Access Token
- **Duration:** 30 minutes (configurable in `.env` via `ACCESS_TOKEN_EXPIRE_MINUTES`)
- **Use:** Authenticate API requests
- **Stored:** localStorage

### Refresh Token
- **Duration:** 7 days (configurable via `REFRESH_TOKEN_EXPIRE_DAYS`)
- **Use:** Obtain new access token
- **Stored:** localStorage

### JWT Claims
```json
{
  "sub": "admin",
  "id": 1,
  "exp": 1703505600,
  "type": "access"
}
```

---

## Development Setup

### Auto-Create Admin on Startup
When you run the backend with `bash run.sh both` or `bash run.sh backend`:

1. Database tables are created
2. Super admin user is automatically seeded
3. Credentials are printed to console:
   ```
   ✅ Super Admin created: username: OShader' password='Os@2030'
   ```

### Reset Admin User
If you need to reset the admin password:

1. Stop the backend
2. Delete `haderos_dev.db`
3. Restart the backend
4. Admin user will be recreated with default password

---

## Security Considerations

### Production Checklist
- [ ] Change default admin password immediately
- [ ] Use strong, unique passwords
- [ ] Enable HTTPS/TLS
- [ ] Set `SECRET_KEY` to random value in `.env`
- [ ] Use environment variables for sensitive data
- [ ] Implement rate limiting on auth endpoints
- [ ] Add CORS restrictions
- [ ] Enable token refresh mechanism
- [ ] Log all auth events
- [ ] Implement account lockout after failed attempts

### Environment Variables
Create `.env` file with:
```env
# Authentication
SECRET_KEY=your-very-secret-key-change-this
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Database
DATABASE_URL=sqlite:///./haderos_dev.db

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
```

---

## Troubleshooting

### "Invalid username or password"
- Verify credentials: `admin` / `Os@2030`
- Check if admin user exists in database
- Restart backend to trigger auto-seed

### "Token expired"
- Request new access token using refresh token
- Implement auto-refresh in frontend

### "CORS error on login"
- Check `CORS_ORIGINS` in `.env`
- Verify frontend URL is in whitelist
- Restart backend after changing CORS settings

### Database locked
- Stop all running services
- Delete `haderos_dev.db`
- Restart backend

---

## Quick Start Commands

```bash
# Setup and run everything
bash run.sh setup    # First time only
bash run.sh both     # Daily development

# Login in browser
# http://localhost:3000/login
# Username: OShader
# Password: Os@2030

# View API docs
# http://localhost:8000/api/docs

# Check admin user in database
sqlite3 haderos_dev.db "SELECT * FROM users WHERE username: OShader';"
```

---

## Next Steps

1. ✅ Login with admin credentials
2. 🎨 Access dashboard at `/dashboard`
3. 📊 Create additional users as needed
4. 🔒 Change default password
5. 🚀 Deploy to production with secure configuration

---

For more information, see:
- [LOCAL_SETUP.md](./LOCAL_SETUP.md) - Full local setup guide
- [QUICK_START.md](./QUICK_START.md) - Quick start guide
- [README.md](./README.md) - Project overview
