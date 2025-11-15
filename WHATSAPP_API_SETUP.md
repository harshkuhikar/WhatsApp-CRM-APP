# 📱 WhatsApp Business API Setup Guide

## Complete guide to integrate WhatsApp Business API with MyWASender

---

## 🎯 **What You Need**

1. **Facebook Business Account**
2. **WhatsApp Business Account**
3. **Phone Number** (not currently used on WhatsApp)
4. **Access Token**
5. **Phone Number ID**

---

## 📋 **Step-by-Step Setup**

### **Step 1: Create Facebook Business Account**

1. Go to: https://business.facebook.com/
2. Click **Create Account**
3. Enter your business name
4. Complete the setup

---

### **Step 2: Create WhatsApp Business App**

1. Go to: https://developers.facebook.com/
2. Click **My Apps** → **Create App**
3. Select **Business** as app type
4. Fill in app details:
   - App Name: `MyWASender`
   - Contact Email: your@email.com
5. Click **Create App**

---

### **Step 3: Add WhatsApp Product**

1. In your app dashboard, find **WhatsApp**
2. Click **Set Up**
3. Select your Business Account
4. Click **Continue**

---

### **Step 4: Get Your Credentials**

#### **A. Get Phone Number ID:**

1. Go to **WhatsApp** → **API Setup**
2. You'll see **Phone Number ID** (looks like: `123456789012345`)
3. Copy this number

#### **B. Get Access Token:**

1. In the same page, find **Temporary Access Token**
2. Click **Copy**
3. **Note**: This is temporary! For production, you need a permanent token

#### **C. Create Permanent Access Token:**

1. Go to **Settings** → **Basic**
2. Copy your **App ID** and **App Secret**
3. Go to: https://developers.facebook.com/tools/explorer/
4. Select your app
5. Click **Generate Access Token**
6. Select permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
7. Click **Generate Token**
8. Copy the token

---

### **Step 5: Add Phone Number**

1. Go to **WhatsApp** → **API Setup**
2. Click **Add Phone Number**
3. Enter your phone number
4. Verify with OTP
5. Your number is now connected!

---

### **Step 6: Configure MyWASender**

#### **Update Backend .env:**

```bash
# Navigate to backend folder
cd backend

# Create .env file (if not exists)
cp .env.example .env

# Edit .env file
nano .env  # or use any text editor
```

#### **Add These Values:**

```env
# WhatsApp Business API
WHATSAPP_API_VERSION=v18.0
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_VERIFY_TOKEN=your_random_string_here
```

**Example:**
```env
WHATSAPP_API_VERSION=v18.0
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=EAABsbCS1iHgBO7ZC9ZAw...
WHATSAPP_VERIFY_TOKEN=my_secret_verify_token_12345
```

---

### **Step 7: Test the Integration**

#### **Start Backend:**

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### **Test API:**

```bash
# Test connection
curl http://localhost:8000/api/v1/whatsapp/test-connection

# Send test message
curl -X POST http://localhost:8000/api/v1/whatsapp/send-text \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "to": "1234567890",
    "message": "Hello from MyWASender!"
  }'
```

---

## 🔧 **API Endpoints**

### **1. Send Text Message**

```python
POST /api/v1/whatsapp/send-text

{
  "to": "1234567890",
  "message": "Hello World!",
  "preview_url": false
}
```

### **2. Send Template Message**

```python
POST /api/v1/whatsapp/send-template

{
  "to": "1234567890",
  "template_name": "hello_world",
  "language_code": "en_US",
  "variables": {
    "name": "John",
    "company": "Acme Inc"
  }
}
```

### **3. Send Media Message**

```python
POST /api/v1/whatsapp/send-media

{
  "to": "1234567890",
  "media_type": "image",
  "media_url": "https://example.com/image.jpg",
  "caption": "Check this out!"
}
```

### **4. Send Campaign**

```python
POST /api/v1/whatsapp/send-campaign

{
  "contacts": ["1234567890", "0987654321"],
  "template_name": "welcome_message",
  "variables": {
    "name": "Customer",
    "company": "MyCompany"
  },
  "language_code": "en_US"
}
```

### **5. Validate Phone Number**

```python
POST /api/v1/whatsapp/validate-phone?phone=1234567890
```

### **6. Test Connection**

```python
GET /api/v1/whatsapp/test-connection
```

---

## 📝 **Create Message Templates**

### **Step 1: Go to Template Manager**

1. In Facebook Business Manager
2. Go to **WhatsApp** → **Message Templates**
3. Click **Create Template**

### **Step 2: Create Template**

**Example Template:**

**Name:** `welcome_message`

**Category:** `MARKETING`

**Language:** `English (US)`

**Body:**
```
Hello {{1}}! 👋

Welcome to {{2}}. We're excited to have you!

Reply STOP to unsubscribe.
```

**Variables:**
- `{{1}}` = Customer name
- `{{2}}` = Company name

### **Step 3: Submit for Approval**

1. Click **Submit**
2. Wait for approval (usually 24-48 hours)
3. Once approved, you can use it!

### **Step 4: Use Template in Code**

```python
{
  "to": "1234567890",
  "template_name": "welcome_message",
  "variables": {
    "1": "John Doe",
    "2": "MyWASender"
  },
  "language_code": "en_US"
}
```

---

## 🔐 **Security Best Practices**

### **1. Never Commit Tokens**

```bash
# Add to .gitignore
.env
*.env
```

### **2. Use Environment Variables**

```python
# Good ✅
access_token = os.getenv("WHATSAPP_ACCESS_TOKEN")

# Bad ❌
access_token = "EAABsbCS1iHgBO7ZC9ZAw..."
```

### **3. Rotate Tokens Regularly**

- Generate new access tokens every 60 days
- Update in your .env file
- Restart backend

### **4. Use Webhooks for Status**

Set up webhooks to receive:
- Message delivery status
- Read receipts
- User replies

---

## 📊 **Rate Limits**

WhatsApp Business API has rate limits:

**Tier 1 (New):**
- 1,000 messages per 24 hours

**Tier 2:**
- 10,000 messages per 24 hours

**Tier 3:**
- 100,000 messages per 24 hours

**Tier 4:**
- Unlimited (with approval)

---

## 🐛 **Troubleshooting**

### **Error: Invalid Phone Number**

```json
{
  "error": "Invalid phone number format"
}
```

**Solution:**
- Use international format without `+`
- Example: `1234567890` (not `+1234567890`)
- Include country code

### **Error: Template Not Found**

```json
{
  "error": "Template not found"
}
```

**Solution:**
- Check template name spelling
- Ensure template is approved
- Verify language code

### **Error: Unauthorized**

```json
{
  "error": "Unauthorized"
}
```

**Solution:**
- Check access token is correct
- Verify token hasn't expired
- Regenerate token if needed

### **Error: Rate Limit Exceeded**

```json
{
  "error": "Rate limit exceeded"
}
```

**Solution:**
- Wait 24 hours
- Request tier upgrade
- Implement message queuing

---

## 💡 **Usage Examples**

### **Example 1: Send Welcome Message**

```python
import requests

url = "http://localhost:8000/api/v1/whatsapp/send-template"
headers = {
    "Authorization": "Bearer YOUR_JWT_TOKEN",
    "Content-Type": "application/json"
}
data = {
    "to": "1234567890",
    "template_name": "welcome_message",
    "variables": {
        "name": "John Doe",
        "company": "MyWASender"
    },
    "language_code": "en_US"
}

response = requests.post(url, headers=headers, json=data)
print(response.json())
```

### **Example 2: Send Campaign to Multiple Users**

```python
import requests

url = "http://localhost:8000/api/v1/whatsapp/send-campaign"
headers = {
    "Authorization": "Bearer YOUR_JWT_TOKEN",
    "Content-Type": "application/json"
}
data = {
    "contacts": [
        "1234567890",
        "0987654321",
        "1122334455"
    ],
    "template_name": "promotional_offer",
    "variables": {
        "discount": "20%",
        "code": "SAVE20"
    },
    "language_code": "en_US"
}

response = requests.post(url, headers=headers, json=data)
print(response.json())
```

### **Example 3: Send Image with Caption**

```python
import requests

url = "http://localhost:8000/api/v1/whatsapp/send-media"
headers = {
    "Authorization": "Bearer YOUR_JWT_TOKEN",
    "Content-Type": "application/json"
}
data = {
    "to": "1234567890",
    "media_type": "image",
    "media_url": "https://example.com/product.jpg",
    "caption": "Check out our new product! 🎉"
}

response = requests.post(url, headers=headers, json=data)
print(response.json())
```

---

## 📚 **Additional Resources**

- **WhatsApp Business API Docs**: https://developers.facebook.com/docs/whatsapp
- **Message Templates Guide**: https://developers.facebook.com/docs/whatsapp/message-templates
- **API Reference**: https://developers.facebook.com/docs/whatsapp/cloud-api/reference
- **Rate Limits**: https://developers.facebook.com/docs/whatsapp/messaging-limits

---

## ✅ **Setup Checklist**

- [ ] Create Facebook Business Account
- [ ] Create WhatsApp Business App
- [ ] Get Phone Number ID
- [ ] Get Access Token
- [ ] Add phone number
- [ ] Update backend .env file
- [ ] Test connection
- [ ] Create message templates
- [ ] Submit templates for approval
- [ ] Test sending messages
- [ ] Set up webhooks (optional)
- [ ] Monitor rate limits

---

## 🎉 **You're Ready!**

Your WhatsApp Business API is now integrated with MyWASender!

You can now:
- ✅ Send text messages
- ✅ Send template messages
- ✅ Send media messages
- ✅ Run campaigns
- ✅ Track message status

**Start sending messages through your app!** 🚀
