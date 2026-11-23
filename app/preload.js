'use strict';
// Schmale Brücke zur Seite: nur das Ablegen im Planer-Ordner.
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('planer', {
  speichern: d => ipcRenderer.invoke('planer:speichern', d),
  karte: f => ipcRenderer.invoke('karte:lesen', f),
  datei: f => ipcRenderer.invoke('planer:datei', f),
  paketLesen: () => ipcRenderer.invoke('paket:lesen'),
  rueck: d => ipcRenderer.send('rueck:schreiben', d)
});
