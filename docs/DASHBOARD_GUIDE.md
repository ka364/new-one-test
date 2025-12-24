# 🎯 HaderOS Admin Dashboard Guide

## Accessing the Dashboard

After logging in with admin credentials:
```
Username: OShader
Password: Os@2030
```

You will be redirected to: `http://localhost:3000/dashboard`

---

## Dashboard Features

### 1. Header Section
- **Username Display:** Shows currently logged-in user
- **Role Badge:** Displays user role (Super Admin)
- **Logout Button:** Click to logout and return to login page

### 2. Welcome Card
Personalized greeting showing:
- Full name (or username if not available)
- Current role
- Login timestamp

### 3. Account Information Card
View your admin profile details:
- **Username:** `admin`
- **Email:** `oshader@haderos.local`
- **Role:** `super_admin`
- **User ID:** `1` (first user)

### 4. Quick Access Modules
Three main sections for system management:

#### 📦 Bio Modules
- Access the 7 bio-inspired modules
- Monitor their performance
- Configure module parameters
- View anomaly detection results

#### ✅ Compliance
- Sharia compliance verification
- Investment screening
- Transaction review
- Compliance reports

#### 🔗 Blockchain
- Blockchain transaction history
- Smart contract management
- Token operations
- Network status

---

## Available Admin Features

### User Management (Future)
- Create/edit/delete users
- Assign roles and permissions
- View user activity logs
- Reset passwords

### System Monitoring (Future)
- Performance metrics
- System health status
- Database statistics
- API usage analytics

### Configuration (Future)
- Environment settings
- Module configuration
- Blockchain network settings
- Notification preferences

---

## Navigation

### From Dashboard
The dashboard currently serves as the main hub. Future enhancements will include:

1. **Sidebar Navigation**
   - Dashboard (Home)
   - Users
   - Modules
   - Compliance
   - Blockchain
   - Settings

2. **Top Menu Bar**
   - Profile dropdown
   - Notifications
   - Help & Documentation
   - Logout

### Keyboard Shortcuts (Future)
- `Ctrl/Cmd + K` - Command palette
- `Ctrl/Cmd + /` - Help menu
- `Ctrl/Cmd + L` - Logout

---

## Session Management

### Automatic Logout
- Sessions expire after **30 minutes** of inactivity
- Refresh token allows re-authentication without login
- Tokens are stored securely in localStorage

### Manual Logout
Click the **Logout** button in the top-right corner to:
1. Clear all tokens
2. Remove user data from storage
3. Redirect to login page

### Re-login
Simply visit `/login` and enter credentials again

---

## Customization

### Change Admin Password

**Option 1: Via API**
```bash
POST /api/v1/auth/change-password
Authorization: Bearer <token>

{
  "current_password": "Os@2030",
  "new_password": "my_new_secure_password"
}
```

**Option 2: Direct Database**
```python
from backend.core.database import SessionLocal
from backend.core.models import User

db = SessionLocal()
admin = db.query(User).filter(User.username: OShader").first()
admin.set_password("new_password_here")
db.commit()
```

### Update Admin Profile
```bash
PATCH /api/v1/users/me
Authorization: Bearer <token>

{
  "full_name": "Ahmed Admin",
  "email": "admin@mycompany.com"
}
```

---

## Troubleshooting

### Dashboard Not Loading
1. Check if you're logged in
2. Verify token in browser console: `localStorage.getItem('access_token')`
3. Try clearing cache: `Ctrl + Shift + Delete`
4. Restart backend service

### Session Expired
- You'll be automatically redirected to login
- Click "Login" and enter credentials again
- Check if backend is running on port 8000

### Profile Information Missing
- Refresh the page: `F5` or `Ctrl + R`
- Clear browser cache and reload
- Check browser console for errors: `F12`

### Cannot Logout
- Try clearing localStorage manually:
  ```javascript
  localStorage.clear();
  window.location.href = '/login';
  ```
- Close browser and reopen

---

## Best Practices

### For Development
✅ **DO:**
- Use unique passwords
- Log out when leaving your desk
- Refresh frequently for updates
- Test with multiple users

❌ **DON'T:**
- Share credentials with others
- Commit tokens to version control
- Disable HTTPS in production
- Keep default passwords

### For Production
✅ **DO:**
- Change default admin password immediately
- Use strong, unique passwords
- Enable two-factor authentication (when available)
- Monitor login attempts
- Regularly review user permissions
- Update system regularly
- Keep audit logs

❌ **DON'T:**
- Use simple/common passwords
- Share admin account
- Leave session unattended
- Disable authentication

---

## Future Enhancements

Planned features for the admin dashboard:

1. **Advanced Analytics**
   - System performance charts
   - User activity heatmaps
   - Real-time monitoring

2. **User Management**
   - User creation/editing
   - Role-based access control
   - Activity audit logs

3. **Module Management**
   - Module deployment
   - Configuration management
   - Performance tuning

4. **Compliance Dashboard**
   - Automated compliance reports
   - Risk assessment
   - Regulatory reporting

5. **Settings & Configuration**
   - API key management
   - Notification settings
   - System preferences

---

## Quick Reference

### Default Credentials
```
Username: OShader
Password: Os@2030
```

### Endpoints
- **Login:** `POST /api/v1/auth/login`
- **Dashboard:** `GET /dashboard`
- **Logout:** Click button (deletes local tokens)

### Storage
- Tokens: `localStorage.getItem('access_token')`
- User: `localStorage.getItem('user')`
- Refresh Token: `localStorage.getItem('refresh_token')`

### Support
- 📧 Email: support@haderos.local
- 📖 Docs: [AUTH_GUIDE.md](./AUTH_GUIDE.md)
- 🐛 Issues: [GitHub Issues](https://github.com/ka364/haderos-platform/issues)

---

## What's Next?

1. ✅ **Login** with admin credentials
2. 🎨 **Explore** the dashboard
3. 🔐 **Change password** (recommended)
4. 📊 **Access modules** (coming soon)
5. 👥 **Create users** (coming soon)

---

Last Updated: December 24, 2025
HaderOS Platform v1.0.0
