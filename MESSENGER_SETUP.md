# Facebook Messenger Bot Setup Guide

## 1. Environment Variables

Add these to your `.env` file:

```env
MESSENGER_VERIFY_TOKEN=your_custom_verify_token_here
MESSENGER_APP_SECRET=your_facebook_app_secret_here
MESSENGER_PAGE_ACCESS_TOKEN=your_page_access_token_here
```

## 2. Facebook App Setup

### Step 1: Create Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app → Business → Continue
3. Add "Messenger" product to your app

### Step 2: Get App Secret
1. Go to App Settings → Basic
2. Copy your "App Secret" → Set as `MESSENGER_APP_SECRET`

### Step 3: Setup Webhook
1. In Messenger Settings, click "Setup Webhooks"
2. Callback URL: `https://neuronerdsquiz.onrender.com/api/messenger/webhook`
3. Verify Token: Create a custom token → Set as `MESSENGER_VERIFY_TOKEN`
4. Subscription Fields: Check `messages`, `messaging_postbacks`
5. Click "Verify and Save"

### Step 4: Get Page Access Token
1. In Messenger Settings → Access Tokens
2. Select your Facebook Page
3. Copy the Page Access Token → Set as `MESSENGER_PAGE_ACCESS_TOKEN`

### Step 5: Subscribe to Page Events
1. In Messenger Settings, find your page
2. Click "Subscribe" to connect webhook to page

## 3. Testing the Webhook

### Test Verification (GET)
```bash
curl "https://neuronerdsquiz.onrender.com/api/messenger/webhook?hub.mode=subscribe&hub.challenge=test&hub.verify_token=your_verify_token"
```
Should return: `test`

### Test Message Handling (POST)
Send a message to your Facebook Page - the bot should echo it back.

## 4. Webhook Endpoints

- **Verification**: `GET /api/messenger/webhook`
- **Messages**: `POST /api/messenger/webhook`

## 5. Security Features

✅ Webhook signature verification using `x-hub-signature-256`
✅ Verify token validation
✅ HTTPS required (automatically handled by Render)

## 6. Deployment Notes

- Deploy to Render with environment variables set
- Webhook URL must be publicly accessible via HTTPS
- Facebook requires webhook to respond within 20 seconds

## 7. Troubleshooting

**Webhook verification fails:**
- Check `MESSENGER_VERIFY_TOKEN` matches Facebook setup
- Ensure webhook URL is correct and accessible

**Messages not received:**
- Verify `MESSENGER_APP_SECRET` is correct
- Check webhook subscription is active
- Ensure page is subscribed to webhook

**Can't send messages:**
- Verify `MESSENGER_PAGE_ACCESS_TOKEN` is valid
- Check page permissions and app review status