# Auto-Maintenance System

## Overview
Automatic maintenance mode that triggers when Render deployment starts. Users see a 60-second countdown, then a maintenance screen with Lottie animation until deployment completes.

## How It Works

### 1. **Deployment Trigger**
When you push to Git or manually deploy on Render:
- `render-build.sh` runs automatically
- Calls `trigger-maintenance.js` to notify all connected users
- Users see 60-second countdown notification

### 2. **Countdown Phase (60 seconds)**
- All users see countdown notification at top of screen
- Users can save work and prepare for maintenance
- Navigation still works during countdown

### 3. **Maintenance Screen**
After countdown:
- Full-screen maintenance overlay with Lottie animation
- All navigation blocked (except for SuperAdmin)
- Users who visit during maintenance see the screen immediately

### 4. **Auto-Recovery**
When deployment completes:
- Server starts and auto-disables maintenance after 5 seconds
- All users automatically return to normal operation
- No manual intervention needed

## Setup Instructions

### 1. Add Environment Variable to Render
```
DEPLOYMENT_SECRET=your-secret-key-here
```
Generate a secure random string for this.

### 2. Update Render Build Command
In Render dashboard, **replace** the existing build command with:
```
bash render-build.sh
```
(Remove `npm install; npm run build` - the script handles everything)

### 3. Make Script Executable (if needed)
```bash
chmod +x render-build.sh
```

## Manual Maintenance Mode
SuperAdmin can still manually trigger maintenance from dashboard:
- Go to SuperAdmin Dashboard
- Click "Enable Maintenance Mode"
- Same 60s countdown → maintenance screen flow

## Features
- ✅ Auto-triggers on deployment
- ✅ 60-second countdown warning
- ✅ Full-screen maintenance overlay
- ✅ Lottie animation during maintenance
- ✅ Blocks all navigation during maintenance
- ✅ SuperAdmin bypass (can still use site)
- ✅ Auto-recovery when deployment completes
- ✅ Works for users already on site
- ✅ Works for new visitors during maintenance

## Testing
1. Push to Git to trigger Render deployment
2. Watch for countdown notification on frontend
3. After 60s, maintenance screen should appear
4. When deployment completes, site returns to normal

## Troubleshooting
- If maintenance doesn't trigger: Check DEPLOYMENT_SECRET is set in Render
- If maintenance doesn't end: Manually disable from SuperAdmin dashboard
- If countdown is wrong: Check server time sync (should use UTC)
