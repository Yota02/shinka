const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('phylogeny', {
  saveFile: (defaultName, filters, data) => {
    ipcRenderer.send('save-file', { defaultName, filters, data });
  },
  onExportRequest: (callback) => {
    ipcRenderer.on('export-request', (event, format) => callback(format));
  },
});
