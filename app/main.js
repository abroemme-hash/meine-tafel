'use strict';
const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Start-Parameter vom LehrerPlaner: --klasse X --thema Y --namen-datei Pfad --oeffne Pfad
function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    const m = /^--(klasse|thema|namen-datei|phasen-datei|gruppen-datei|oeffne|stunde)$/.exec(argv[i]);
    if (m && i + 1 < argv.length) o[m[1]] = argv[++i];
  }
  return o;
}
const safe = s => String(s || '').replace(/[<>:"\/\\|?*\x00-\x1f]/g, '_').replace(/[. ]+$/, '').trim().slice(0, 80);

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) { app.quit(); }

let win, ready = false, pending = parseArgs(process.argv.slice(1));
// Austauschordner mit dem LehrerPlaner (lokal, nicht in der Cloud): stunden.json, material/, rueckmeldung/
const AUST = path.join(process.env.LOCALAPPDATA || path.join(app.getPath('home'), 'AppData', 'Local'), 'MeineTafel', 'Austausch');
const readPaket = () => { try { return fs.readFileSync(path.join(AUST, 'stunden.json'), 'utf8').replace(/^﻿/, ''); } catch (e) { return null; } };
// Stundenpaket des Planers an die Seite geben (id = bestimmte Stunde, sonst Auswahl nach Datum und Uhrzeit)
async function sendPaket(id) {
  let t = readPaket(); if (!win || !t) return;
  try { t = JSON.stringify(JSON.parse(t)); } catch (e) { return; }   // prüfen und neu serialisieren
  try { await win.webContents.executeJavaScript('window.__planer&&window.__planer.paket&&window.__planer.paket(' + t + ',' + JSON.stringify(id || null) + ')'); } catch (e) {}
}

// Optionen an die Seite übergeben (Klassenliste, Thema, Tafel-Datei)
async function apply(o) {
  if (!win || !o || !(o.klasse || o.thema || o['namen-datei'] || o['phasen-datei'] || o['gruppen-datei'] || o.oeffne)) return;
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
  if (o['gruppen-datei']) {
    try {
      const f = o['gruppen-datei'];
      if (path.basename(f).startsWith('meinetafel-')) {
        try {
          const l = JSON.parse(fs.readFileSync(f, 'utf8').replace(/^﻿/, ''));
          if (Array.isArray(l)) data.gruppen = l.map(g => (Array.isArray(g) ? g : []).map(String));
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
  win.webContents.on('did-finish-load', () => { ready = true; const p = pending; pending = null; if (p) apply(p); setTimeout(() => sendPaket(p && p.stunde), 700); });

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
    if (d.stunde && typeof d.stunde === 'object') fs.writeFileSync(stem + '.meta.json', JSON.stringify({ stunde: d.stunde, datei: path.basename(stem) }), 'utf8');
    return { ok: true, datei: stem + '.tafel.json' };
  } catch (err) { return { ok: false, fehler: String(err.message || err) }; }
});

// Bildkarten (Ordner www/karten) als Data-URL liefern, damit sie ohne „tainted canvas“ auf die Tafel gelegt werden können
ipcMain.handle('karte:lesen', (e, f) => {
  if (!win || e.sender !== win.webContents || !/^p\d{3}[a-z]?\.webp$/.test(String(f))) return null;
  try { return 'data:image/webp;base64,' + fs.readFileSync(path.join(__dirname, 'www', 'karten', f)).toString('base64'); } catch (err) { return null; }
});

// Dateien des Planers lesen: nur aus dem Austauschordner und dem Kartenordner des Planers, nur Bilder und PDF
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.pdf': 'application/pdf' };
ipcMain.handle('paket:lesen', e => { if (!win || e.sender !== win.webContents) return null; try { return JSON.parse(readPaket() || 'null'); } catch (err) { return null; } });
ipcMain.handle('planer:datei', (e, f) => {
  if (!win || e.sender !== win.webContents || typeof f !== 'string') return null;
  try {
    let roots = [AUST];
    try { const p = JSON.parse(readPaket() || '{}'); if (p.kartenOrdner) roots.push(String(p.kartenOrdner)); } catch (x) {}
    const r = path.resolve(f), ext = path.extname(r).toLowerCase();
    if (!MIME[ext] || !roots.some(x => r.toLowerCase().startsWith(path.resolve(x).toLowerCase() + path.sep))) return null;
    const st = fs.statSync(r); if (st.size > 40 * 1024 * 1024) return null;
    return 'data:' + MIME[ext] + ';base64,' + fs.readFileSync(r).toString('base64');
  } catch (err) { return null; }
});
// Rückmeldung der Tafel an den Planer (wer war dran, Punkte, Abstimmung, Gruppen): Austausch/rueckmeldung/<Stunde>.json
ipcMain.on('rueck:schreiben', (e, d) => {
  if (!win || e.sender !== win.webContents || !d || typeof d.id !== 'string') return;
  try {
    const dir = path.join(AUST, 'rueckmeldung'); fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, safe(d.id).replace(/[|]/g, '_') + '.json'), JSON.stringify(d), 'utf8');
  } catch (err) {}
});

app.on('second-instance', (e, argv) => {
  if (win) { if (win.isMinimized()) win.restore(); win.focus(); const o = parseArgs(argv.slice(1)); apply(o); if (o.stunde) sendPaket(o.stunde); }
});
app.whenReady().then(create);
app.on('window-all-closed', () => app.quit());
