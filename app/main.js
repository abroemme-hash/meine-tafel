'use strict';
const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Start-Parameter vom LehrerPlaner: --klasse X --thema Y --namen-datei Pfad --oeffne Pfad
function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    const m = /^--(klasse|thema|namen-datei|phasen-datei|oeffne)$/.exec(argv[i]);
    if (m && i + 1 < argv.length) o[m[1]] = argv[++i];
  }
  return o;
}
const safe = s => String(s || '').replace(/[<>:"\/\\|?*\x00-\x1f]/g, '_').replace(/[. ]+$/, '').trim().slice(0, 80);

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) { app.quit(); }

let win, ready = false, pending = parseArgs(process.argv.slice(1));

// Optionen an die Seite übergeben (Klassenliste, Thema, Tafel-Datei)
async function apply(o) {
  if (!win || !o || !(o.klasse || o.thema || o['namen-datei'] || o['phasen-datei'] || o.oeffne)) return;
  const data = { klasse: o.klasse || '', thema: o.thema || '' };
  if (o['phasen-datei']) {
    try {
      const f = o['phasen-datei'];
      if (path.basename(f).startsWith('meinetafel-')) {
        try {
          const l = JSON.parse(fs.readFileSync(f, 'utf8').replace(/^﻿/, ''));
          if (Array.isArray(l)) data.phasen = l.map(p => [String(p[0] || ''), String(p[1] || '')]);
        } finally { try { fs.unlinkSync(f); } catch (e) {} }
      }
    } catch (e) {}
  }
  if (o['namen-datei']) {
    try {
      const f = o['namen-datei'];
      if (path.basename(f).startsWith('meinetafel-')) {            // nur Dateien, die der Planer angelegt hat
        try {
          const l = JSON.parse(fs.readFileSync(f, 'utf8').replace(/^﻿/, ''));
          if (Array.isArray(l)) data.namen = l.map(String);
        } finally { try { fs.unlinkSync(f); } catch (e) {} }
      }
    } catch (e) {}
  }
  if (o.oeffne && /\.tafel\.json$/i.test(o.oeffne)) {
    try { data.tafel = fs.readFileSync(o.oeffne, 'utf8'); } catch (e) {}
  }
  try { await win.webContents.executeJavaScript('window.__planer&&window.__planer.apply(' + JSON.stringify(data) + ')'); } catch (e) {}
}

function create() {
  Menu.setApplicationMenu(null);
  win = new BrowserWindow({
    width: 1440, height: 860, minWidth: 800, minHeight: 500,
    backgroundColor: '#171c33',
    title: 'Meine Tafel',
    icon: path.join(__dirname, 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true, spellcheck: false, preload: path.join(__dirname, 'preload.js') }
  });
  win.maximize();
  win.loadFile(path.join(__dirname, 'www', 'index.html'));
  win.webContents.on('did-finish-load', () => { ready = true; const p = pending; pending = null; if (p) apply(p); });

  // Externe Links im Standardbrowser öffnen, interne Fenster (z. B. Druckansicht) erlauben
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) { shell.openExternal(url); return { action: 'deny' }; }
    return { action: 'allow' };
  });
  // F11 = Vollbild
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
  });
}

// Tafel im Planer-Ordner ablegen: Dokumente\MeineTafel\Tafelbilder\<Klasse>\<Datum>-<Thema>.tafel.json (+ .png)
ipcMain.handle('planer:speichern', (e, d) => {
  if (!win || e.sender !== win.webContents || !d || typeof d.json !== 'string') return { ok: false, fehler: 'Ungültige Anfrage' };
  try {
    const dir = path.join(app.getPath('documents'), 'MeineTafel', 'Tafelbilder', safe(d.klasse) || 'Allgemein');
    fs.mkdirSync(dir, { recursive: true });
    const day = new Date().toISOString().slice(0, 10);
    const base = day + '-' + (safe(d.name) || 'Tafel');
    let stem = path.join(dir, base), n = 1;
    while (fs.existsSync(stem + '.tafel.json')) stem = path.join(dir, base + '-' + (++n));
    fs.writeFileSync(stem + '.tafel.json', d.json, 'utf8');
    const m = /^data:image\/png;base64,(.+)$/.exec(d.png || '');
    if (m) fs.writeFileSync(stem + '.png', Buffer.from(m[1], 'base64'));
    return { ok: true, datei: stem + '.tafel.json' };
  } catch (err) { return { ok: false, fehler: String(err.message || err) }; }
});

app.on('second-instance', (e, argv) => {
  if (win) { if (win.isMinimized()) win.restore(); win.focus(); apply(parseArgs(argv.slice(1))); }
});
app.whenReady().then(create);
app.on('window-all-closed', () => app.quit());
