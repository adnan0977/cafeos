// Electron Desktop Main Entry Point for CaféOS Windows Cashier Terminal
// Run with: npx electron electron-main.cjs
// Or build Windows installer with: npx electron-builder

const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 600,
    title: 'CaféOS Windows Cashier Billing Terminal',
    backgroundColor: '#020617',
    icon: path.join(__dirname, 'public/favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'electron-preload.cjs'),
    },
    autoHideMenuBar: true,
  });

  // Load production dist or local dev server
  const startUrl = process.env.ELECTRON_START_URL || `http://localhost:3000/?tab=windows_cashier`;
  mainWindow.loadURL(startUrl);

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
