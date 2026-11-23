'use strict';
// Schmale Brücke zur Seite: nur das Ablegen im Planer-Ordner.
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('planer', {
  speichern: d => ipcRenderer.invoke('planer:speichern', d)
});
