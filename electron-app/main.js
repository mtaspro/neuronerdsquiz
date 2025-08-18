const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

// PWA URL - Replace with your actual PWA URL
const PWA_URL = 'https://neuronerdsquiz.vercel.app';

// Keep a global reference of the window object
let mainWindow;

/**
 * Create the main application window
 */
function createWindow() {
  // Create the browser window with responsive settings
  mainWindow = new BrowserWindow({
    width: 1200,           // Default width
    height: 800,           // Default height
    minWidth: 800,         // Minimum width requirement
    minHeight: 600,        // Minimum height requirement
    show: false,           // Don't show until ready
    icon: path.join(__dirname, 'src/assets/icon.ico'), // App icon
    webPreferences: {
      nodeIntegration: false,        // Disable Node.js integration for security
      contextIsolation: true,        // Enable context isolation for security
      enableRemoteModule: false,     // Disable remote module for security
      preload: path.join(__dirname, 'preload.js'), // Preload script
      webSecurity: true,             // Enable web security
      allowRunningInsecureContent: false, // Block insecure content
      experimentalFeatures: false    // Disable experimental features
    },
    titleBarStyle: 'default',        // Default title bar
    autoHideMenuBar: true,           // Hide menu bar (PWA handles navigation)
    resizable: true,                 // Allow window resizing
    maximizable: true,               // Allow window maximization
    minimizable: true,               // Allow window minimization
    closable: true,                  // Allow window closing
    fullscreenable: true,            // Allow fullscreen mode
    backgroundColor: '#ffffff',       // Default background color
    center: true,                    // Center window on screen
    frame: true,                     // Show window frame
    transparent: false,              // Opaque window
    hasShadow: true,                 // Window shadow
    thickFrame: true                 // Thick window frame on Windows
  });

  // Hide the menu bar completely (PWA handles all navigation)
  Menu.setApplicationMenu(null);

  // Load the PWA URL
  console.log('Loading PWA URL:', PWA_URL);
  mainWindow.loadURL(PWA_URL).catch(err => {
    console.error('Failed to load PWA:', err);
    // Fallback to localhost if live URL fails
    mainWindow.loadURL('http://localhost:5000');
  });

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Focus the window
    if (mainWindow) {
      mainWindow.focus();
    }
  });

  // Handle window closed event
  mainWindow.on('closed', () => {
    // Dereference the window object
    mainWindow = null;
  });

  // Handle navigation - keep users within the PWA domain
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    const pwaUrl = new URL(PWA_URL);
    
    // Allow navigation within the same domain
    if (parsedUrl.origin !== pwaUrl.origin) {
      event.preventDefault();
      // Optionally open external links in default browser
      require('electron').shell.openExternal(navigationUrl);
    }
  });

  // Handle new window requests (open in default browser)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });

  // Development: Open DevTools (remove in production)
  // mainWindow.webContents.openDevTools();

  // Handle certificate errors (for HTTPS PWAs)
  mainWindow.webContents.on('certificate-error', (event, url, error, certificate, callback) => {
    // In production, you should validate certificates properly
    // For development with self-signed certificates, you might want to allow them
    event.preventDefault();
    callback(true);
  });

  // Handle responsive behavior for mobile-like views
  mainWindow.webContents.on('did-finish-load', () => {
    // Inject CSS for better mobile responsiveness if needed
    mainWindow.webContents.insertCSS(`
      body {
        -webkit-user-select: none;
        -webkit-app-region: no-drag;
      }
      
      /* Ensure proper scaling on smaller windows */
      @media (max-width: 900px) {
        body {
          font-size: 14px;
        }
      }
      
      /* Hide scrollbars for cleaner look */
      ::-webkit-scrollbar {
        width: 8px;
      }
      
      ::-webkit-scrollbar-track {
        background: #f1f1f1;
      }
      
      ::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 4px;
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background: #555;
      }
    `);
  });
}

/**
 * App event handlers
 */

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  // On macOS, re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    require('electron').shell.openExternal(navigationUrl);
  });
});

// Handle app protocol for deep linking (optional)
app.setAsDefaultProtocolClient('neuronerds-quiz');

// Prevent navigation to external websites
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    const pwaUrl = new URL(PWA_URL);
    
    if (parsedUrl.origin !== pwaUrl.origin) {
      event.preventDefault();
    }
  });
});

// Export for testing purposes
module.exports = { createWindow };