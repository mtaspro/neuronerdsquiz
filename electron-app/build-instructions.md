# 🏗️ Build Instructions for Neuronerds Quiz Desktop App

## 📋 Prerequisites Checklist

- [ ] Node.js v16+ installed
- [ ] npm package manager available
- [ ] Windows OS (for Windows builds)
- [ ] Icon file ready (256x256 pixels, ICO format)

## 🎯 Step-by-Step Build Process

### Step 1: Setup Project
```bash
# Navigate to electron-app directory
cd electron-app

# Install all dependencies
npm install
```

### Step 2: Prepare Assets
1. **Create App Icon**:
   - Size: 256x256 pixels
   - Format: ICO for Windows
   - Location: `src/assets/icon.ico`

2. **Update PWA URL** in `main.js`:
   ```javascript
   const PWA_URL = 'https://neuronerdsquiz.onrender.com';
   ```

### Step 3: Test in Development
```bash
# Run the app in development mode
npm start
```
- ✅ App should open and load your PWA
- ✅ Window should be resizable (min 800x600)
- ✅ Menu bar should be hidden
- ✅ PWA should function normally

### Step 4: Build Windows Installer
```bash
# Build Windows NSIS installer
npm run build:win
```

### Step 5: Locate Built Files
After successful build, find your installer in:
```
dist/
├── Neuronerds Quiz Setup 1.0.0.exe    # NSIS installer
├── win-unpacked/                       # Unpacked app files
└── builder-debug.yml                   # Build debug info
```

## 📦 Installer Features

Your Windows installer will include:
- ✅ **Custom Installation Path**: Users can choose install directory
- ✅ **Desktop Shortcut**: Automatic desktop shortcut creation
- ✅ **Start Menu Entry**: App appears in Start Menu
- ✅ **Uninstaller**: Clean uninstall option
- ✅ **Per-Machine Install**: Available to all users
- ✅ **App Icon**: Custom icon throughout

## 🔧 Customization Options

### Change App Details
Edit `package.json`:
```json
{
  "name": "your-app-name",
  "version": "1.0.0",
  "description": "Your app description",
  "author": "Your Name"
}
```

### Update Window Settings
Edit `main.js`:
```javascript
mainWindow = new BrowserWindow({
  width: 1200,        // Default width
  height: 800,        // Default height
  minWidth: 800,      // Minimum width
  minHeight: 600      // Minimum height
});
```

### Modify Installer Behavior
Edit `package.json` build section:
```json
"nsis": {
  "oneClick": false,                    // Allow custom install
  "allowToChangeInstallationDirectory": true,
  "perMachine": true,                   // Install for all users
  "createDesktopShortcut": true,        // Desktop shortcut
  "createStartMenuShortcut": true       // Start menu entry
}
```

## 🚨 Common Issues & Solutions

### Issue: Build Fails - Icon Not Found
**Solution**: 
```bash
# Ensure icon exists
ls src/assets/icon.ico

# If missing, add a 256x256 ICO file
```

### Issue: "electron-builder not found"
**Solution**:
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### Issue: Permission Denied on Windows
**Solution**:
```bash
# Run as Administrator
# Right-click Command Prompt → "Run as Administrator"
npm run build:win
```

### Issue: PWA Not Loading
**Solution**:
1. Check internet connection
2. Verify PWA URL is correct in `main.js`
3. Test PWA URL in browser first

### Issue: White Screen on Launch
**Solution**:
1. Open DevTools (uncomment line in `main.js`)
2. Check console for errors
3. Verify PWA is accessible

## 🔄 Version Updates

### To Release New Version:
1. **Update version** in `package.json`
2. **Test changes** with `npm start`
3. **Build new installer** with `npm run build:win`
4. **Distribute** the new `.exe` file

### Version Numbering:
- `1.0.0` - Major release
- `1.0.1` - Bug fixes
- `1.1.0` - New features

## 📊 Build Output Sizes

Typical build sizes:
- **Installer**: ~150-200 MB
- **Unpacked**: ~300-400 MB
- **Download time**: 2-5 minutes (depending on connection)

## 🎯 Distribution

### For End Users:
1. **Download**: `Neuronerds Quiz Setup 1.0.0.exe`
2. **Run installer**: Double-click the .exe file
3. **Follow prompts**: Choose installation directory
4. **Launch**: Use desktop shortcut or Start Menu

### For Developers:
1. **Share installer file**: Upload to file sharing service
2. **Provide instructions**: Include installation steps
3. **Version control**: Keep track of version numbers

## ✅ Final Checklist

Before distributing:
- [ ] App launches successfully
- [ ] PWA loads correctly
- [ ] All features work as expected
- [ ] Icon displays properly
- [ ] Installer creates shortcuts
- [ ] Uninstaller works correctly
- [ ] Version number is correct
- [ ] File size is reasonable

---

**🎉 Congratulations! Your Neuronerds Quiz desktop app is ready for distribution!**