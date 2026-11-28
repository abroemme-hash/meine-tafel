'use strict';
// Schmale Brücke zur Seite: nur das Ablegen im Planer-Ordner.
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('planer', {
  speichern: d => ipcRenderer.invoke('planer:speichern', d),
  karte: f => ipcRenderer.invoke('karte:lesen', f),
  symbol: id => ipcRenderer.invoke('symbol:lesen', id),
  datei: f => ipcRenderer.invoke('planer:datei', f),
  paketLesen: () => ipcRenderer.invoke('paket:lesen'),
  rueck: d => ipcRenderer.send('rueck:schreiben', d),
  tafelnListe: () => ipcRenderer.invoke('tafeln:liste'),
  tafelnOeffnen: f => ipcRenderer.invoke('tafeln:oeffnen', f),
  tafelnOrdner: f => ipcRenderer.invoke('tafeln:ordner', f),
  bilder: (aktion, daten) => ipcRenderer.invoke('bilder', aktion, daten)
});
