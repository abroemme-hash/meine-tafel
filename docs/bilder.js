'use strict';
/* Bildersammlung: hochgeladene Bilder nach Kategorien (mit Unterkategorien) aufbewahren.
   Windows-App: echte Ordner unter Dokumente\MeineTafel\Bilder\<Kategorie>\[<Unterkategorie>\]
   Internet-Version: Datenbank dieses Browsers (IndexedDB) mit denselben Kategorien.
   Nutzt Globals aus index.html: $, toast, addImage, shrink, hideAllPops */
(() => {
const REST = 'Unsortiert';
const START = ['Deutsch', 'Mathe', 'Sachunterricht', 'Englisch', 'Kunst und Musik', 'Regeln und Rituale', 'Sonstiges'];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const h = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild };
const clean = s => String(s || '').replace(/[<>:"\/\\|?*\x00-\x1f]/g, ' ').replace(/\s+/g, ' ').replace(/^[. ]+|[. ]+$/g, '').slice(0, 50);
const de = (a, b) => a.localeCompare(b, 'de', { numeric: true, sensitivity: 'base' });

/* ---------- Speicher: Ordner (App) ---------- */
const native = window.planer && window.planer.bilder;
const disk = native && {
  ort: 'Dokumente\\MeineTafel\\Bilder',
  liste: () => native('liste'),
  neu: (kat, name, data) => native('neu', { kat, name, data }),
  lesen: id => native('lesen', { id }),
  aendern: (id, kat, name) => native('aendern', { id, kat, name }),
  loeschen: id => native('loeschen', { id }),
  katNeu: kat => native('katNeu', { kat }),
  katName: (alt, neu) => native('katName', { alt, neu }),
  katWeg: kat => native('katWeg', { kat }),
  ordner: kat => native('ordner', { kat })
};

/* ---------- Speicher: Browser-Datenbank (Internet-Version) ---------- */
let dbp = null;
const db = () => dbp || (dbp = new Promise((res, rej) => { const r = indexedDB.open('tafel-bilder', 1); r.onupgradeneeded = () => r.result.createObjectStore('img', { keyPath: 'id' }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error) }));
const tx = async (mode, fn) => { const d = await db(); return new Promise((res, rej) => { const t = d.transaction('img', mode), r = fn(t.objectStore('img')); t.oncomplete = () => res(r && r.result); t.onerror = t.onabort = () => rej(t.error) }) };
const kats = () => { try { const v = JSON.parse(localStorage.getItem('tafel-bildkats')); if (Array.isArray(v)) return v } catch (e) {} return START.slice() };
const setKats = k => localStorage.setItem('tafel-bildkats', JSON.stringify([...new Set(k)]));
const under = (k, top) => k === top || k.startsWith(top + '/');
const web = {
  ort: 'in diesem Browser',
  async liste() { const all = await tx('readonly', s => s.getAll()); const K = kats(); all.forEach(x => { if (x.kat !== REST && !K.includes(x.kat)) K.push(x.kat) }); return { kats: K, bilder: all.map(x => ({ id: x.id, kat: x.kat, name: x.name, zeit: x.zeit })) } },
  async neu(kat, name, data) {
    const all = await tx('readonly', s => s.getAll()), same = all.find(x => x.data === data && x.kat === kat); if (same) return same.id;
    let n = name, i = 2; while (all.some(x => x.kat === kat && x.name === n)) n = name + ' (' + i++ + ')';
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    await tx('readwrite', s => s.put({ id, kat, name: n, data, zeit: Date.now() })); return id;
  },
  async lesen(id) { const x = await tx('readonly', s => s.get(id)); return x ? x.data : null },
  async aendern(id, kat, name) { const x = await tx('readonly', s => s.get(id)); if (!x) return; x.kat = kat; x.name = name; await tx('readwrite', s => s.put(x)) },
  async loeschen(id) { await tx('readwrite', s => s.delete(id)) },
  async katNeu(kat) { const K = kats(); const top = kat.split('/')[0]; if (!K.includes(top)) K.push(top); K.push(kat); setKats(K) },
  async katName(alt, neu) {
    const move = k => under(k, alt) ? neu + k.slice(alt.length) : k;
    setKats(kats().map(move));
    for (const x of await tx('readonly', s => s.getAll())) if (under(x.kat, alt)) { x.kat = move(x.kat); await tx('readwrite', s => s.put(x)) }
  },
  async katWeg(kat) { setKats(kats().filter(k => !under(k, kat))) },
  ordner: null
};
const S2 = disk || web;

/* ---------- Oberfläche ---------- */
const css = document.createElement('style');
css.textContent = `
#bib{position:fixed;inset:0;z-index:150;background:rgba(20,26,48,.45);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);display:none;align-items:center;justify-content:center;padding:18px}
#bib.show{display:flex}
#bib button{flex-direction:row;min-width:0}
#bib .bx{width:min(1180px,100%);height:min(820px,100%);background:var(--bar);color:var(--ink);border-radius:28px;box-shadow:0 30px 90px rgba(10,15,40,.4);display:flex;flex-direction:column;overflow:hidden}
#bib .bh{display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:14px 18px;border-bottom:1px solid var(--line)}
#bib .bh b{font-size:21px;margin-right:6px}
#bib input,#bib select{font:inherit;font-size:15px;color:var(--ink);background:var(--hover);border:1px solid var(--line);border-radius:999px;padding:10px 16px;outline:none;-webkit-user-select:text;user-select:text}
#bib select option{color:#222;background:#fff}
#bib input:focus,#bib select:focus{border-color:var(--accent)}
#bib .bq{flex:1;min-width:160px}
#bib .btn{min-height:44px;padding:0 18px;border-radius:999px;background:var(--hover);font-size:14.5px;font-weight:600;display:flex;gap:8px;align-items:center;justify-content:center}
#bib .btn.pri{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff}
#bib .btn[hidden]{display:none}
#bib .btn.x{width:44px;padding:0;font-size:22px}
#bib .bm{flex:1;min-height:0;display:flex}
#bib .bs{width:260px;flex:none;border-right:1px solid var(--line);padding:12px;display:flex;flex-direction:column;gap:8px}
#bib .bk{flex:1;min-height:0;overflow-y:auto;touch-action:pan-y;display:flex;flex-direction:column;gap:3px}
#bib .k{min-height:44px;flex:none;border-radius:14px;padding:0 12px;justify-content:space-between;display:flex;align-items:center;font-size:15px;font-weight:600;background:transparent;text-align:left}
#bib .k.sub{padding-left:30px;font-weight:500;font-size:14px}
#bib .k small{color:var(--mute);font-size:12.5px;margin-left:8px}
#bib .k.on{background:color-mix(in srgb,var(--accent) 15%,transparent);color:var(--accent)}
#bib .k.over{outline:2px dashed var(--accent);outline-offset:-2px}
#bib .ka{display:flex;flex-wrap:wrap;gap:6px}#bib .ka .btn{min-height:38px;padding:0 12px;font-size:13px}
#bib .bc{flex:1;min-width:0;display:flex;flex-direction:column}
#bib .bg{flex:1;min-height:0;overflow-y:auto;touch-action:pan-y;padding:14px;display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px;align-content:start}
#bib .bg.drop{outline:3px dashed var(--accent);outline-offset:-8px}
#bib .t{position:relative;border-radius:18px;background:var(--hover);padding:8px;display:flex;flex-direction:column;gap:6px;cursor:pointer;transition:transform .15s,box-shadow .2s}
#bib .t:hover{transform:translateY(-2px);box-shadow:0 12px 26px rgba(30,40,80,.18)}
#bib .t .im{height:130px;display:flex;align-items:center;justify-content:center;background:#fff;border-radius:12px;overflow:hidden}
#bib .t .im img{max-width:100%;max-height:100%;display:block}
#bib .t .n{font-size:13.5px;font-weight:600;line-height:1.25;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#bib .t .c{font-size:12px;color:var(--mute);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#bib .t .ed{position:absolute;right:12px;top:12px;width:36px;height:36px;min-height:0;border-radius:50%;background:rgba(20,26,48,.72);color:#fff;font-size:18px;font-weight:800;display:flex;align-items:center;justify-content:center;padding:0}
#bib .leer{grid-column:1/-1;text-align:center;color:var(--mute);padding:50px 20px;font-size:15px;line-height:1.5}
#bib .bf{padding:8px 18px;border-top:1px solid var(--line);font-size:12.5px;color:var(--mute)}
#bask{position:fixed;inset:0;z-index:160;background:rgba(20,26,48,.45);display:flex;align-items:center;justify-content:center;padding:18px}
#bask .d{background:var(--bar);color:var(--ink);border-radius:24px;padding:20px;width:min(440px,100%);display:flex;flex-direction:column;gap:12px;box-shadow:0 24px 70px rgba(10,15,40,.4)}
#bask input,#bask select{font:inherit;font-size:16px;color:var(--ink);background:var(--hover);border:1px solid var(--line);border-radius:14px;padding:11px 14px;outline:none;width:100%;-webkit-user-select:text;user-select:text}
#bask select option{color:#222;background:#fff}
#bask label{font-size:13px;color:var(--mute);display:flex;flex-direction:column;gap:4px}
#bask .r{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}
#bask button{min-height:44px;min-width:0;padding:0 18px;border-radius:999px;background:var(--hover);font-weight:600;flex-direction:row}
#bask button.pri{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff}
#bask button.del{margin-right:auto;color:#d64545;background:rgba(239,68,68,.12)}
@media(max-width:700px){#bib .bs{width:170px}}
`;
document.head.appendChild(css);

/* Eigener Eingabedialog (die Windows-App kennt kein prompt()) */
function ask({ titel, felder = [], ok = 'OK', loeschen }) {
  return new Promise(res => {
    const d = h(`<div id="bask"><div class="d"><b>${esc(titel)}</b>${felder.map((f, i) => `<label>${esc(f.label || '')}${f.optionen ? `<select data-f="${i}">${f.optionen.map(([v, n]) => `<option value="${esc(v)}" ${v === f.wert ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>` : `<input data-f="${i}" value="${esc(f.wert || '')}">`}</label>`).join('')}<div class="r">${loeschen ? `<button class="del">${esc(loeschen)}</button>` : ''}<button class="no">Abbrechen</button><button class="pri">${esc(ok)}</button></div></div></div>`);
    const done = v => { d.remove(); res(v) };
    d.querySelector('.no').onclick = () => done(null);
    d.querySelector('.pri').onclick = () => done([...d.querySelectorAll('[data-f]')].map(x => x.value));
    if (loeschen) d.querySelector('.del').onclick = () => done('loeschen');
    d.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') done(null); else if (e.key === 'Enter') d.querySelector('.pri').click() });
    document.body.appendChild(d);
    (d.querySelector('input') || d.querySelector('.pri')).focus();
  });
}
window.__ask = ask;

const el = h(`<div id="bib" role="dialog" aria-label="Bildersammlung"><div class="bx">
<div class="bh"><b>Bildersammlung</b><input class="bq" type="search" placeholder="Bild suchen …" aria-label="Bild suchen"><select class="so" aria-label="Sortierung"><option value="neu">Neueste zuerst</option><option value="name">Nach Name</option></select><button class="btn pri up">⬆ Bilder hochladen</button><button class="btn x zu" aria-label="Schließen">×</button></div>
<div class="bm"><div class="bs"><div class="bk"></div><div class="ka"><button class="btn kn">+ Kategorie</button><button class="btn ks">+ Unterkategorie</button><button class="btn ke">Bearbeiten</button><button class="btn od">Ordner öffnen</button></div></div><div class="bc"><div class="bg"></div></div></div>
<div class="bf"></div></div></div>`);
document.body.appendChild(el);
const $e = s => el.querySelector(s);
const grid = $e('.bg'), side = $e('.bk'), q = $e('.bq'), so = $e('.so');
let cur = '', data = { kats: [], bilder: [] };   // cur: '' = alle Bilder
const cache = new Map();
const lesen = async id => { if (!cache.has(id)) { cache.set(id, await S2.lesen(id)); if (cache.size > 150) cache.delete(cache.keys().next().value) } return cache.get(id) };

const sorted = () => [...new Set(data.kats)].filter(k => k !== REST).sort((a, b) => { const x = a.split('/'), y = b.split('/'); return de(x[0], y[0]) || de(x[1] || '', y[1] || '') });
const katOpts = () => [[REST, REST], ...sorted().map(k => [k, k.replace('/', ' › ')])];

const lazy = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; lazy.unobserve(e.target); lesen(e.target.dataset.src).then(src => { if (src) e.target.src = src }) }), { root: grid, rootMargin: '300px' });

function drawGrid() {
  const t = q.value.trim().toLowerCase();
  let L = data.bilder.filter(b => (!cur || (cur === REST ? b.kat === REST : under(b.kat, cur))) && (!t || (b.name + ' ' + b.kat).toLowerCase().includes(t)));
  L.sort(so.value === 'name' ? (a, b) => de(a.name, b.name) : (a, b) => b.zeit - a.zeit);
  lazy.disconnect();
  grid.innerHTML = L.length ? L.map(b => `<div class="t" draggable="true" data-id="${esc(b.id)}" title="${esc(b.name)} – antippen legt das Bild auf die Tafel"><div class="im"><img data-src="${esc(b.id)}" alt="${esc(b.name)}"></div><div class="n">${esc(b.name)}</div><div class="c">${esc(b.kat.replace('/', ' › '))}</div><button class="ed" data-ed="${esc(b.id)}" aria-label="Umbenennen, verschieben oder löschen" title="Umbenennen, verschieben, löschen">✎</button></div>`).join('')
    : `<div class="leer">${t ? 'Kein Bild gefunden.' : 'Hier liegt noch kein Bild.<br>Tippe auf „Bilder hochladen“ oder ziehe Dateien in dieses Fenster.'}</div>`;
  grid.querySelectorAll('img[data-src]').forEach(i => lazy.observe(i));
}
function drawSide() {
  const count = k => data.bilder.filter(b => k === REST ? b.kat === REST : under(b.kat, k)).length;
  const row = (id, name, n, sub) => `<button class="k ${sub ? 'sub' : ''} ${cur === id ? 'on' : ''}" data-k="${esc(id)}"><span>${esc(name)}</span><small>${n}</small></button>`;
  side.innerHTML = row('', 'Alle Bilder', data.bilder.length) + row(REST, REST, count(REST)) + sorted().map(k => { const p = k.split('/'); return row(k, p[p.length - 1], count(k), p.length > 1) }).join('');
  $e('.ks').disabled = $e('.ke').disabled = !cur || cur === REST;
}
async function refresh() {
  try { data = await S2.liste() } catch (e) { toast('Die Bildersammlung konnte nicht gelesen werden', 4000) }
  if (cur && cur !== REST && !data.kats.includes(cur)) cur = '';
  drawSide(); drawGrid();
  $e('.bf').textContent = 'Gespeichert: ' + S2.ort + (S2.ordner ? ' (Unterordner je Kategorie)' : ' – nur auf diesem Gerät. Beim Löschen der Browserdaten gehen die Bilder verloren.') + ' · Antippen legt ein Bild auf die Tafel.';
}
const fail = e => { console.error(e); toast('Das hat nicht geklappt – bitte erneut versuchen', 4000) };
const run = async fn => { try { await fn() } catch (e) { fail(e) } await refresh() };

const stem = n => clean(String(n || '').replace(/\.[a-z0-9]{2,5}$/i, '')) || 'Bild ' + new Date().toLocaleDateString('de-DE');
async function upload(files) {
  const imgs = [...files].filter(f => f.type.startsWith('image/'));
  if (!imgs.length) { toast('Bitte Bilddateien wählen (PNG, JPG, GIF, WEBP, SVG)'); return }
  const kat = cur || REST; let n = 0;
  for (const f of imgs) { try { await S2.neu(kat, stem(f.name), await shrink(f)); n++ } catch (e) { console.error(e) } }
  await refresh();
  toast(n === imgs.length ? `${n} Bild${n === 1 ? '' : 'er'} in „${kat.replace('/', ' › ')}“ gespeichert` : `${imgs.length - n} Bild(er) konnten nicht gespeichert werden`, 3500);
}
$e('.up').onclick = () => { const f = document.createElement('input'); f.type = 'file'; f.accept = 'image/*'; f.multiple = true; f.onchange = () => upload(f.files); f.click() };
const close = () => el.classList.remove('show');
const open = () => { if (typeof hideAllPops === 'function') hideAllPops(); el.classList.add('show'); q.value = ''; cache.clear(); refresh() };
$e('.zu').onclick = close;
el.addEventListener('pointerdown', e => { if (e.target === el) close() });
el.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') close() });
q.oninput = drawGrid; so.onchange = drawGrid;
side.onclick = e => { const k = e.target.closest('[data-k]'); if (k) { cur = k.dataset.k; drawSide(); drawGrid() } };

$e('.kn').onclick = async () => { const r = await ask({ titel: 'Neue Kategorie', felder: [{ label: 'Name' }], ok: 'Anlegen' }); const n = r && clean(r[0]); if (!n) return; await run(async () => { await S2.katNeu(n); cur = n }) };
$e('.ks').onclick = async () => { const top = cur.split('/')[0]; const r = await ask({ titel: 'Neue Unterkategorie in „' + top + '“', felder: [{ label: 'Name' }], ok: 'Anlegen' }); const n = r && clean(r[0]); if (!n) return; await run(async () => { await S2.katNeu(top + '/' + n); cur = top + '/' + n }) };
$e('.ke').onclick = async () => {
  const alt = cur, p = alt.split('/'), voll = data.bilder.some(b => under(b.kat, alt));
  const r = await ask({ titel: 'Kategorie bearbeiten', felder: [{ label: 'Name', wert: p[p.length - 1] }], ok: 'Speichern', loeschen: 'Kategorie löschen' });
  if (!r) return;
  if (r === 'loeschen') { if (voll) { toast('Die Kategorie enthält noch Bilder – bitte zuerst verschieben oder löschen', 4500); return } await run(async () => { await S2.katWeg(alt); cur = '' }); return }
  const n = clean(r[0]); if (!n) return; p[p.length - 1] = n; const neu = p.join('/'); if (neu === alt) return;
  if (data.kats.some(k => k.toLowerCase() === neu.toLowerCase() && k !== alt)) { toast('Diese Kategorie gibt es schon'); return }
  await run(async () => { await S2.katName(alt, neu); cur = neu; cache.clear() });
};
$e('.od').onclick = () => S2.ordner(cur);
if (!S2.ordner) $e('.od').hidden = true;

grid.addEventListener('click', async e => {
  const ed = e.target.closest('[data-ed]');
  if (ed) {
    const b = data.bilder.find(x => x.id === ed.dataset.ed); if (!b) return;
    const r = await ask({ titel: 'Bild bearbeiten', felder: [{ label: 'Name', wert: b.name }, { label: 'Kategorie', wert: b.kat, optionen: katOpts() }], ok: 'Speichern', loeschen: 'Bild löschen' });
    if (!r) return;
    if (r === 'loeschen') {
      const s = await ask({ titel: `„${b.name}“ löschen?` + (S2.ordner ? ' Das Bild kommt in den Papierkorb.' : ' Das lässt sich nicht rückgängig machen.'), ok: 'Löschen' });
      if (s) await run(async () => { await S2.loeschen(b.id); cache.delete(b.id) }); return;
    }
    await run(async () => { await S2.aendern(b.id, r[1], clean(r[0]) || b.name); cache.delete(b.id) });
    return;
  }
  const t = e.target.closest('.t'); if (!t) return;
  const src = await lesen(t.dataset.id).catch(() => null);
  if (!src) { toast('Bild konnte nicht geladen werden'); return }
  close(); addImage(src);
});
// Bild auf eine Kategorie ziehen = verschieben; Dateien ins Fenster ziehen = hochladen
let drag = null;
grid.addEventListener('dragstart', e => { const t = e.target.closest('.t'); drag = t ? t.dataset.id : null });
grid.addEventListener('dragend', () => drag = null);
el.addEventListener('dragover', e => { e.preventDefault(); e.stopPropagation(); side.querySelectorAll('.over').forEach(x => x.classList.remove('over')); const k = e.target.closest('[data-k]'); if (drag && k && k.dataset.k) k.classList.add('over'); grid.classList.toggle('drop', !drag) });
el.addEventListener('dragleave', e => { if (e.target === el || !el.contains(e.relatedTarget)) grid.classList.remove('drop') });
el.addEventListener('drop', async e => {
  e.preventDefault(); e.stopPropagation(); grid.classList.remove('drop'); side.querySelectorAll('.over').forEach(x => x.classList.remove('over'));
  if (drag) { const k = e.target.closest('[data-k]'), b = data.bilder.find(x => x.id === drag); drag = null; if (k && k.dataset.k && b && k.dataset.k !== b.kat) await run(async () => { await S2.aendern(b.id, k.dataset.k, b.name); cache.delete(b.id) }); return }
  if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
});
document.addEventListener('paste', e => { if (!el.classList.contains('show')) return; const f = [...e.clipboardData.items].filter(i => i.type.startsWith('image/')).map(i => i.getAsFile()); if (f.length) { e.preventDefault(); e.stopPropagation(); upload(f) } }, true);

/* auto: Bilder, die direkt auf die Tafel eingefügt oder gezogen werden, ebenfalls aufheben (unter „Unsortiert“) */
window.__bilder = {
  open, close, upload,
  auto: (src, name) => S2.neu(REST, stem(name), src).catch(e => console.error(e))
};
})();
