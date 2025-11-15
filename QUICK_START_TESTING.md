# 🚀 Quick Start - Testing MyWASender

## ✅ Everything is Running!

- **Backend API**: http://localhost:8000 ✅
- **Desktop App**: Electron window open ✅
- **Database**: Initialized with test data ✅

---

## 🔐 Step 1: Login

In the Electron app window, use these credentials:

```
Email: test@example.com
Password: password123
```

Click **Login**

---

## 🎫 Step 2: Activate License

After login, you'll see the **Activation Screen**.

**Copy and paste this entire token:**

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsaWNlbnNlX2lkIjoiNTQ2ZjA0MzEtMjg5Mi00YWEzLTlmNDUtMzgyMzZiNTQ5OWY4Iiwib3duZXJfZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicGxhbiI6InByZW1pdW0iLCJpc3N1ZWRfYXQiOiIyMDI1LTExLTE0VDA4OjQwOjUyLjk3MTU2OSIsImV4cGlyZXNfYXQiOiIyMDI2LTExLTE0VDA4OjQwOjUyLjk3MTU2OSIsIm1heF9kZXZpY2VzIjozLCJ0eXBlIjoibGljZW5zZSJ9.VQyc9lvEIV6jNhZkMfc_yrXQbm_jopWwVBcc50eP-RM
```

Paste it in the **License Key** field and click **Activate License**

---

## 🎉 Step 3: Explore the App!

Once activated, you'll have full access to:

### Dashboard
- View statistics
- See campaign overview
- Check license status

### Campaigns
- Create new campaigns
- Manage existing campaigns
- View campaign progress

### Contacts
- Import CSV files
- Manage contact lists
- View contact details

### Settings
- View license information
- Check app version
- Configure preferences

---

## 📊 Test Data

### Sample CSV for Contact Import

Create a file called `test_contacts.csv`:

```csv
name,phone,company
John Doe,+1234567890,Acme Inc
Jane Smith,+0987654321,Tech Corp
Bob Johnson,+1122334455,StartupXYZ
```

Then import it via **Contacts** → **Import CSV**

---

## 🔧 API Testing

Visit the interactive API documentation:
**http://localhost:8000/api/docs**

You can test all endpoints directly from the browser!

---

## 📝 Summary

**Login Credentials:**
- Email: `test@example.com`
- Password: `password123`

**License Token:** (see above)

**What's Working:**
✅ Authentication system
✅ License activation
✅ Dashboard
✅ Campaign management
✅ Contact import
✅ Settings

---

## 🆘 Need Help?

If something doesn't work:
1. Check the terminal for error messages
2. Open browser DevTools (F12) in the Electron window
3. Check backend logs in the terminal
4. Visit http://localhost:8000/api/v1/health to verify backend

---

## 🎯 You're All Set!

The app is fully functional and ready for testing. Enjoy exploring MyWASender! 🚀
