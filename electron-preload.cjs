// Preload script for CaféOS Electron Desktop Terminal
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  printReceipt: (html) => ipcRenderer.send('print-receipt', html),
  openCashDrawer: () => ipcRenderer.send('open-cash-drawer'),
});
