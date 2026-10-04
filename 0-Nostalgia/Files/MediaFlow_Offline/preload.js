const { contextBridge } = require('electron');

// Expose a minimal safe API to the renderer.
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  version: process.versions.electron,
});
