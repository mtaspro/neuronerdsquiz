# Neuronerds Quiz Desktop App

A desktop application wrapper for the Neuronerds Quiz PWA built with Electron.js.

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- Windows (for building Windows installer)

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Development Mode
```bash
npm start
```

### 3. Build Windows Installer
```bash
npm run build:win
```

## 📁 Project Structure

```
electron-app/
├── main.js              # Main Electron process
├── preload.js           # Preload script for security
├── package.json         # Project configuration
├── src/
│   └── assets/
│       ├── icon.ico     # Windows icon (256x256)
│       ├── icon.icns    # macOS icon (optional)
│       └── icon.png     # Linux icon (optional)
├── dist/                # Build output directory
└── README.md           # This file
```

## 🔧 Configuration

### PWA URL
Update the PWA URL in `main.js`:
```javascript
const PWA_URL = 'https://your-pwa-url.com';
```

### App Information
Update app details in `package.json`:
- `name`: Application name
- `version`: Version number
- `description`: App description
- `author`: Your name
- `homepage`: PWA URL

### Icons
Place your app icons in `src/assets/`:
- `icon.ico` - Windows icon (256x256 pixels)
- `icon.icns` - macOS icon (optional)
- `icon.png` - Linux icon (optional)

## 📦 Build Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Run in development mode |
| `npm run build` | Build for current platform |
| `npm run build:win` | Build Windows installer |
| `npm run dist` | Same as build:win |
| `npm run pack` | Package without installer |

## 🏗️ Building Windows Installer

### Step 1: Prepare Icons
1. Create a 256x256 pixel icon file
2. Save as `src/assets/icon.ico`
3. Ensure the icon is in ICO format

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Build Installer
```bash
npm run build:win
```

### Step 4: Find Your Installer
The installer will be created in the `dist/` directory:
- `Neuronerds Quiz Setup 1.0.0.exe` - NSIS installer

## ⚙️ Installer Configuration

The Windows installer includes:
- ✅ Custom installation directory selection
- ✅ Desktop shortcut creation
- ✅ Start menu shortcut
- ✅ Uninstaller
- ✅ Per-machine installation
- ✅ Custom app icon

## 🔒 Security Features

- ✅ Node.js integration disabled
- ✅ Context isolation enabled
- ✅ Remote module disabled
- ✅ Web security enabled
- ✅ External link protection
- ✅ Certificate error handling

## 📱 Responsive Features

- ✅ Minimum window size: 800x600
- ✅ Resizable and maximizable
- ✅ Auto-adapts to screen size
- ✅ Mobile-friendly CSS injection
- ✅ Custom scrollbar styling

## 🐛 Troubleshooting

### Build Issues
1. **Icon not found**: Ensure `icon.ico` exists in `src/assets/`
2. **Build fails**: Run `npm install` to ensure all dependencies are installed
3. **Permission errors**: Run terminal as administrator on Windows

### Runtime Issues
1. **PWA not loading**: Check internet connection and PWA URL
2. **White screen**: Check browser console for errors
3. **Certificate errors**: Update certificate handling in `main.js`

## 🔄 Updates

To update the PWA URL or configuration:
1. Edit `main.js` to change `PWA_URL`
2. Update `package.json` version number
3. Rebuild the application

## 📄 License

MIT License - See package.json for details.

## 🤝 Support

For issues related to:
- **Electron app**: Check this README and Electron documentation
- **PWA functionality**: Contact the PWA development team
- **Build process**: Ensure all prerequisites are met

---

**Built with ❤️ using Electron.js**