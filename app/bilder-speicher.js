'use strict';
// Bildersammlung als echte Ordner: <Wurzel>\<Kategorie>\[<Unterkategorie>\]<Name>.<Endung>
// "Unsortiert" ist ein normaler Ordner. Gelöschte Bilder kommen in den Papierkorb.
const path = require('path');
const fs = require('fs');

const REST = 'Unsortiert';
const START = ['Deutsch', 'Mathe', 'Sachunterricht', 'Englisch', 'Kunst und Musik', 'Regeln und Rituale', 'Sonstiges'];
const EXT = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif', 'image/svg+xml': '.svg', 'image/bmp': '.bmp' };
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.bmp': 'image/bmp' };
const clean = s => String(s || '').replace(/[<>:"\/\\|?*\x00-\x1f]/g, ' ').replace(/\s+/g, ' ').replace(/^[. ]+|[. ]+$/g, '').slice(0, 50);

function speicher(root, shell) {
  // Kategorie "A" oder "A/B" -> Ordner innerhalb der Wurzel (jeder Teil wird bereinigt)
  const dirOf = kat => {
    const teile = String(kat || '').split('/').map(clean).filter(Boolean);
    if (!teile.length || teile.length > 2) throw new Error('Ungültige Kategorie');
    return path.join(root(), ...teile);
  };
  // Bild-Kennung = relativer Pfad "Kategorie/Datei.png"
  const fileOf = id => {
    const teile = String(id || '').split('/');
    const datei = teile.pop();
    const f = path.join(dirOf(teile.join('/')), path.basename(datei));
    if (!MIME[path.extname(f).toLowerCase()]) throw new Error('Kein Bild');
    return f;
  };
  const frei = (dir, name, ext) => { let n = name, i = 2; while (fs.existsSync(path.join(dir, n + ext))) n = name + ' (' + i++ + ')'; return path.join(dir, n + ext); };
  const idOf = f => path.relative(root(), f).split(path.sep).join('/');

  return {
    liste() {
      const r = root();
      if (!fs.existsSync(r)) for (const k of START) fs.mkdirSync(path.join(r, k), { recursive: true });
      const kats = [], bilder = [];
      const lies = (dir, kat, tiefe) => {
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
          const p = path.join(dir, e.name);
          if (e.isDirectory() && tiefe < 2) { const k = kat ? kat + '/' + e.name : e.name; if (k !== REST) kats.push(k); lies(p, k, tiefe + 1); }
          else if (e.isFile() && MIME[path.extname(e.name).toLowerCase()]) {
            // Dateien, die direkt in "Bilder" liegen, zeigen wir nicht an – sie gehören in einen Kategorie-Ordner
            if (kat) bilder.push({ id: kat + '/' + e.name, kat, name: path.basename(e.name, path.extname(e.name)), zeit: fs.statSync(p).mtimeMs });
          }
        }
      };
      lies(r, '', 0);
      return { kats, bilder };
    },
    neu({ kat, name, data }) {
      const m = /^data:(image\/[a-z+.-]+);base64,(.+)$/i.exec(data || '');
      if (!m || !EXT[m[1].toLowerCase()]) throw new Error('Format wird nicht unterstützt');
      const buf = Buffer.from(m[2], 'base64'), dir = dirOf(kat), ext = EXT[m[1].toLowerCase()], n = clean(name) || 'Bild';
      fs.mkdirSync(dir, { recursive: true });
      // dasselbe Bild nicht doppelt ablegen
      for (const f of fs.readdirSync(dir)) {
        if (path.extname(f).toLowerCase() !== ext) continue;
        const p = path.join(dir, f);
        if (fs.statSync(p).size === buf.length && fs.readFileSync(p).equals(buf)) return idOf(p);
      }
      const ziel = frei(dir, n, ext);
      fs.writeFileSync(ziel, buf);
      return idOf(ziel);
    },
    lesen({ id }) {
      const f = fileOf(id);
      if (fs.statSync(f).size > 30 * 1024 * 1024) return null;
      return 'data:' + MIME[path.extname(f).toLowerCase()] + ';base64,' + fs.readFileSync(f).toString('base64');
    },
    aendern({ id, kat, name }) {
      const alt = fileOf(id), dir = dirOf(kat), ext = path.extname(alt), n = clean(name) || path.basename(alt, ext);
      const wunsch = path.join(dir, n + ext);
      if (wunsch === alt) return id;
      fs.mkdirSync(dir, { recursive: true });
      const ziel = wunsch.toLowerCase() === alt.toLowerCase() ? wunsch : frei(dir, n, ext);
      fs.renameSync(alt, ziel);
      return idOf(ziel);
    },
    async loeschen({ id }) { await shell.trashItem(fileOf(id)); },
    katNeu({ kat }) { fs.mkdirSync(dirOf(kat), { recursive: true }); },
    katName({ alt, neu }) {
      const a = dirOf(alt), n = dirOf(neu);
      if (fs.existsSync(n) && a.toLowerCase() !== n.toLowerCase()) throw new Error('Kategorie existiert schon');
      fs.renameSync(a, n);
    },
    // nur leere Kategorien löschen (rmdir schlägt bei Inhalt fehl)
    katWeg({ kat }) {
      const d = dirOf(kat);
      for (const e of fs.readdirSync(d, { withFileTypes: true })) if (e.isDirectory()) fs.rmdirSync(path.join(d, e.name));
      fs.rmdirSync(d);
    },
    ordner({ kat }) {
      let d = root();
      try { if (kat) d = dirOf(kat); } catch (e) {}
      fs.mkdirSync(d, { recursive: true });
      return shell.openPath(d);
    }
  };
}

module.exports = (ipcMain, getWin, root, shell) => {
  const S = speicher(root, shell);
  ipcMain.handle('bilder', async (e, aktion, daten) => {
    const win = getWin();
    if (!win || e.sender !== win.webContents || !Object.prototype.hasOwnProperty.call(S, aktion)) throw new Error('Ungültige Anfrage');
    return S[aktion](daten || {});
  });
};
module.exports.speicher = speicher;
