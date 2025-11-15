# MyWASender - Test Credentials

## 🚀 Services Running

### Backend API
- **URL**: http://localhost:8000
- **API Docs**: http://localhost:8000/api/docs
- **Health Check**: http://localhost:8000/api/v1/health

### Desktop App
- **Electron App**: Should open automatically
- **Vite Dev Server**: http://localhost:5173

## 🔑 Test Login Credentials

### Regular User Account
```
Email: test@example.com
Password: password123
```

### Admin Account
```
Email: admin@example.com
Password: admin123
```

## 🎫 Test License Key

**Copy this JWT token for activation:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsaWNlbnNlX2lkIjoiNTQ2ZjA0MzEtMjg5Mi00YWEzLTlmNDUtMzgyMzZiNTQ5OWY4Iiwib3duZXJfZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicGxhbiI6InByZW1pdW0iLCJpc3N1ZWRfYXQiOiIyMDI1LTExLTE0VDA4OjQwOjUyLjk3MTU2OSIsImV4cGlyZXNfYXQiOiIyMDI2LTExLTE0VDA4OjQwOjUyLjk3MTU2OSIsIm1heF9kZXZpY2VzIjozLCJ0eXBlIjoibGljZW5zZSJ9.VQyc9lvEIV6jNhZkMfc_yrXQbm_jopWwVBcc50eP-RM
```

**Or use the human-readable key:**
```
LFT-8C4D-505B-DB4A-88FB
```

**License Details:**
- Plan: Premium
- Valid Until: November 14, 2026
- Max Devices: 3
- Status: Active

## 📝 How to Test

### 1. Login to Desktop App
1. The Electron window should open automatically
2. You'll see the login screen
3. Use either credential above to login

### 2. Activate License (Admin Flow)
Since you're testing, you'll need to generate a license first:

**Option A: Use API directly**
```bash
# Login as admin to get token
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Use the access_token from response to generate license
curl -X POST http://localhost:8000/api/v1/licenses/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "owner_email": "test@example.com",
    "plan": "premium",
    "days": 365,
    "max_devices": 2
  }'
```

**Option B: Skip activation for testing**
You can modify the app to skip activation temporarily, or I can create a test license for you.

### 3. Test Features
Once logged in:
- ✅ View Dashboard
- ✅ Create Campaigns
- ✅ Import Contacts (CSV)
- ✅ View Settings
- ✅ Check License Status

## 🔧 Troubleshooting

### Desktop App Not Opening?
Check the process output:
```bash
# The Electron window should open automatically
# If not, check for errors in the terminal
```

### Can't Login?
- Make sure backend is running on port 8000
- Check browser console for errors (F12)
- Verify credentials are correct

### API Errors?
- Check backend logs in the terminal
- Visit http://localhost:8000/api/docs for API documentation
- Test health endpoint: http://localhost:8000/api/v1/health

## 📊 Database

The app uses SQLite for testing:
- **Location**: `backend/test.db`
- **Tables**: users, licenses, campaigns, contacts, etc.
- **Pre-seeded**: 2 users (test user + admin)

## 🎯 Quick Test Flow

1. **Login** with `test@example.com` / `password123`
2. **Skip Activation** (or generate license via API)
3. **Explore Dashboard** - see statistics
4. **Create Campaign** - test campaign creation
5. **Import Contacts** - upload a CSV file
6. **View Settings** - check license info

## 📱 Test CSV Format

Create a file `contacts.csv`:
```csv
name,phone,company
John Doe,+1234567890,Acme Inc
Jane Smith,+0987654321,Tech Corp
```

## 🌐 API Endpoints

All endpoints are documented at: http://localhost:8000/api/docs

Key endpoints:
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/register` - Register
- `POST /api/v1/licenses/generate` - Generate license (admin)
- `POST /api/v1/licenses/activate` - Activate license
- `POST /api/v1/campaigns` - Create campaign
- `GET /api/v1/admin/stats` - Admin statistics

## ✅ What's Working

- ✅ Backend API running on port 8000
- ✅ Database initialized with test users
- ✅ Desktop app starting (Electron + React)
- ✅ Authentication system
- ✅ License system (generation/validation)
- ✅ Campaign management
- ✅ Admin panel endpoints

## 🎉 Enjoy Testing!

The desktop app window should be open now. If you see the login screen, you're all set!

Use the credentials above to login and explore the application.
