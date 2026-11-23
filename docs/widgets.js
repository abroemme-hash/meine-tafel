'use strict';
/* Widgets: verschiebbare, skalierbare Fenster auf der Tafel (Arbeitssymbole, Ampel, Zufallsname, ...).
   Nutzt Globals aus index.html: $, ic, ICONS, stage, toast, beep, addImage, addPage, P, S, snap, toolsUI, loadScript */
(() => {
const store = {
  get(k, d) { try { const v = localStorage.getItem('tafel-' + k); return v == null ? d : JSON.parse(v) } catch (e) { return d } },
  set(k, v) { try { localStorage.setItem('tafel-' + k, JSON.stringify(v)) } catch (e) {} }
};
const h = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a };
const pad = n => String(n).padStart(2, '0');

/* ---------- Stil ---------- */
const css = document.createElement('style');
css.textContent = `
#bar{z-index:60}
/* Widget-Farben folgen der Tafel: helle Fenster auf der weißen Tafel, dunkle auf der grünen */
:root{--w-bg:rgba(255,255,255,.96);--w-fg:#1e2433;--w-mute:#5b6479;--w-soft:rgba(30,36,51,.07);--w-soft2:rgba(30,36,51,.14);--w-line:rgba(30,36,51,.12);--w-line2:rgba(30,36,51,.28)}
body.theme-board{--w-bg:rgba(13,17,31,.93);--w-fg:#ffffff;--w-mute:#aab2cc;--w-soft:rgba(255,255,255,.1);--w-soft2:rgba(255,255,255,.2);--w-line:rgba(255,255,255,.14);--w-line2:rgba(255,255,255,.35)}
#widgets{position:absolute;inset:0;pointer-events:none}
.wg::before{content:"";position:absolute;left:0;right:0;top:0;height:4px;background:var(--wa,var(--accent))}
.wg.min .wb,.wg.min .wz{display:none}.wg.min{border-radius:999px}.wg.min .wh{padding-right:6px}
.wg .wh .wm{min-width:38px;min-height:38px;width:38px;height:38px;padding:0;border-radius:50%;background:transparent}
.wg .wh .wx{background:transparent}
.wg .wh .ei{font-size:20px;line-height:1}
/* Menü: Suche, Favoriten, Anordnungen */
#widpop{width:min(560px,calc(100vw - 140px));flex-direction:column;align-items:stretch;gap:4px;padding:14px}
#widpop.show{display:flex}
#widpop .ws{font:inherit;font-size:15px;border:1px solid var(--line);background:var(--hover);color:var(--ink);border-radius:12px;padding:10px 14px;outline:none;-webkit-user-select:text;user-select:text}
#widpop .ws:focus{border-color:var(--accent)}
#widpop .wgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
#widpop .wi{position:relative;min-height:74px;flex-direction:column;gap:4px;padding:8px 4px;font-size:12px}
#widpop .wi .em{font-size:26px;line-height:1}
#widpop .wi small{white-space:normal;text-align:center;line-height:1.15}
#widpop .wi .fv{position:absolute;right:2px;top:2px;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:15px;border-radius:50%;opacity:.35;cursor:pointer}
#widpop .wi:hover .fv,#widpop .wi .fv.on{opacity:1}
#widpop .wi .fv.on{color:#e6a700}
#widpop .wlay{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:4px}
#widpop .wlay input{font:inherit;font-size:13px;border:1px solid var(--line);background:var(--hover);color:var(--ink);border-radius:10px;padding:6px 10px;width:150px;outline:none}
#widpop .wlay button{min-height:36px;min-width:0;flex-direction:row;padding:0 12px;font-size:13px;border-radius:10px;background:var(--hover)}
#widpop h4{margin:10px 4px 2px}
.wg{position:absolute;pointer-events:auto;background:var(--w-bg);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);color:var(--w-fg);border:1px solid var(--w-line);border-radius:22px;box-shadow:var(--shadow);overflow:hidden;touch-action:none;-webkit-user-select:none;user-select:none}
.wg .wh{display:flex;align-items:center;gap:8px;padding:10px 6px 4px 16px;cursor:grab;font-weight:700;font-size:15px;letter-spacing:.01em;color:var(--w-fg);touch-action:none}
.wg .wh .wt{flex:1;white-space:nowrap}
.wg .wh .wx{min-width:38px;min-height:38px;width:38px;height:38px;padding:0;border-radius:50%}
.wg .wb{padding:4px 16px 18px}
.wg .wz{position:absolute;right:0;bottom:0;width:30px;height:30px;cursor:nwse-resize;touch-action:none;background:linear-gradient(135deg,transparent 52%,var(--w-line2) 52% 60%,transparent 60% 72%,var(--w-line2) 72% 80%,transparent 80%)}
.wg button{color:var(--w-fg);background:var(--w-soft);min-height:48px;min-width:48px;font-size:15px;font-weight:600;flex-direction:row;padding:0 14px;border-radius:12px;gap:6px}
.wg button small{color:inherit;font-size:13px}
@media(hover:hover){.wg button:hover:not(:disabled):not(.on){background:var(--w-soft2)}}
.wg button.big{color:#fff;background:linear-gradient(135deg,var(--accent),var(--accent2));min-height:52px;font-size:17px;padding:0 22px}
.wg button.on{color:#fff;background:linear-gradient(135deg,var(--accent),var(--accent2))}
.wg .ic{width:20px;height:20px}
.wg input,.wg textarea,.wg select{font:inherit;font-size:15px;background:var(--w-soft);color:var(--w-fg);border:1px solid var(--w-line2);border-radius:10px;padding:8px 10px;-webkit-user-select:text;user-select:text;outline:none;min-width:0}
.wg input:focus,.wg textarea:focus{border-color:#a5b4fc}
.wg select option{color:#111}
.wg textarea{width:100%;resize:vertical}
.wg .row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px}
.wg .row.c{justify-content:center}
.wg .lab{font-size:13px;color:var(--w-mute)}
.wg .num{font-variant-numeric:tabular-nums;font-weight:700}
.wg details{margin-top:12px;font-size:14px;color:var(--w-mute)}
.wg summary{cursor:pointer;padding:4px 0}
.wg .hint{font-size:12.5px;color:var(--w-mute);margin-top:8px;max-width:330px}
/* Symbole */
.sy-big{text-align:center;padding:6px 0 10px}.sy-big .e{font-size:120px;line-height:1.1}.sy-big .l{font-size:30px;font-weight:700}
.sy-grid{display:grid;grid-template-columns:repeat(4,86px);gap:8px}
.sy-grid button{flex-direction:column;min-height:74px;padding:6px;font-size:12px;gap:2px}.sy-grid button .e{font-size:32px;line-height:1}
.sy-grid button.on{box-shadow:0 0 0 2px #a5b4fc}
/* Ampel */
.am{display:flex;gap:18px;align-items:center}
.am-box{background:#0b0e18;border-radius:26px;padding:14px;display:flex;flex-direction:column;gap:12px}
.am-box button{width:78px;height:78px;border-radius:50%;padding:0;opacity:.2;transition:opacity .2s,box-shadow .2s;box-shadow:inset 0 0 0 3px rgba(0,0,0,.35)}
.am-box button.on{opacity:1;box-shadow:0 0 36px 6px var(--g),inset 0 0 0 3px rgba(0,0,0,.2)}
.am-txt{font-size:24px;font-weight:700;max-width:240px;line-height:1.25}
/* Zufall / Gruppen */
.zf-name{min-width:300px;min-height:92px;display:flex;align-items:center;justify-content:center;text-align:center;font-size:44px;font-weight:700;background:var(--w-soft);border-radius:18px;padding:10px 16px}
.gr-wrap{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px;max-width:640px}
.gr-g{background:var(--w-soft);border-radius:14px;padding:10px 14px;min-width:130px;border-top:5px solid var(--c)}
.gr-g b{display:block;font-size:13px;color:var(--w-mute);margin-bottom:4px}.gr-g div{font-size:18px;line-height:1.5}
/* Würfel */
.dc{display:flex;gap:14px;flex-wrap:wrap;justify-content:center;max-width:420px;min-height:100px;margin-top:6px}
.die{width:92px;height:92px;border-radius:18px;background:#fff;color:#111;display:flex;align-items:center;justify-content:center;font-size:40px;font-weight:800;box-shadow:0 4px 12px rgba(0,0,0,.4);cursor:pointer}
.die.pips{display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);padding:12px;gap:2px;align-items:stretch;justify-items:stretch}
.die.pips i{border-radius:50%;background:#111;margin:3px}
.die.rolling{animation:wob .12s infinite alternate}
@keyframes wob{to{transform:rotate(8deg) scale(.96)}}
/* Lärm */
.lm-bar{position:relative;height:34px;border-radius:17px;background:var(--w-soft);overflow:hidden;min-width:330px}
.lm-fill{position:absolute;left:0;top:0;bottom:0;width:0;background:linear-gradient(90deg,#22c55e 0%,#eab308 60%,#ef4444 100%);background-size:330px 100%;border-radius:17px}
.lm-th{position:absolute;top:0;bottom:0;width:3px;background:var(--w-fg)}
.lm-st{font-size:30px;font-weight:700;text-align:center;margin-top:12px}
.wg.alarm{box-shadow:0 0 0 4px #ef4444,var(--shadow)}
/* Zeitscheibe */
.vt svg{display:block;margin:0 auto}
/* Punkte */
.pt{display:flex;gap:12px;flex-wrap:wrap;max-width:640px}
.pt-t{background:var(--w-soft);border-radius:16px;padding:12px;text-align:center;min-width:140px;border-top:6px solid var(--c)}
.pt-t input{width:120px;text-align:center;font-weight:600}
.pt-t .s{font-size:64px;font-weight:800;line-height:1.1;font-variant-numeric:tabular-nums}
/* Abstimmung */
.ab-r{display:flex;gap:8px;align-items:center;margin-top:8px}
.ab-r input{width:110px}
.ab-b{flex:1;min-width:180px;height:38px;background:var(--w-soft);border-radius:10px;position:relative;overflow:hidden}
.ab-b i{position:absolute;left:0;top:0;bottom:0;background:var(--c);border-radius:10px;transition:width .25s}
.ab-b b{position:absolute;inset:0;display:flex;align-items:center;padding-left:12px;font-size:22px}
/* Countdown */
.cd-n{font-size:96px;font-weight:800;line-height:1;text-align:center;font-variant-numeric:tabular-nums}
.cd-l{text-align:center;font-size:22px;font-weight:600;margin-top:4px}
/* Stundenplan */
.sp{border-collapse:separate;border-spacing:4px}
.sp th{font-size:14px;color:var(--w-mute);padding:4px}.sp th.today{color:#fff;background:var(--accent);border-radius:8px}
.sp td.h{font-weight:700;color:var(--w-mute);text-align:center}
.sp input{width:112px;padding:6px 8px;font-size:14px}.sp input.today{background:rgba(79,70,229,.35)}
/* Kamera */
.cam video{display:block;width:480px;height:270px;background:#000;border-radius:14px;object-fit:contain}
/* Stoppuhr */
.sw-t{font-size:64px;font-weight:700;text-align:center;font-variant-numeric:tabular-nums;min-width:300px}
.sw-l{font-size:15px;color:var(--w-mute);margin-top:8px;line-height:1.5;text-align:center}
/* Sticker */
.st-g{display:grid;grid-template-columns:repeat(6,64px);gap:6px}
.st-g button{font-size:34px;min-height:64px;padding:0;line-height:1}
/* Links */
.lk-l{display:flex;flex-direction:column;gap:8px;min-width:300px}
.lk-r{display:flex;gap:6px}
.lk-r a{flex:1;display:flex;align-items:center;gap:10px;min-height:48px;padding:0 16px;border-radius:12px;background:var(--w-soft);color:var(--w-fg);text-decoration:none;font-weight:600;font-size:16px}
.lk-r a:hover{background:var(--w-soft2)}
.gp-t{font-size:28px;font-weight:700;text-align:center;max-width:340px;line-height:1.3;min-height:76px;display:flex;align-items:center;justify-content:center}
.emb iframe{width:640px;height:400px;border:0;border-radius:12px;background:#fff;display:block;margin-top:10px}
/* Feier */
.fete{position:absolute;inset:0;z-index:50;background:rgba(10,14,30,.55);display:flex;align-items:center;justify-content:center;text-align:center;pointer-events:auto;cursor:pointer;border-radius:16px}
.fete canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.fete div{position:relative;color:#fff;font-size:min(8vw,110px);font-weight:800;line-height:1.15;text-shadow:0 6px 30px rgba(0,0,0,.6);padding:0 5%}
/* Lupe / Spot */
#dim{position:absolute;inset:0;pointer-events:none;display:none;z-index:7;border-radius:16px}
#linksgrp button img{width:100%;height:100%;object-fit:contain;display:block;pointer-events:none}
#lens{position:absolute;display:none;z-index:9;touch-action:none;cursor:grab}
#lens canvas{display:block;width:100%;height:100%;border-radius:50%;border:4px solid #fff;box-shadow:0 0 0 2px rgba(0,0,0,.35),0 14px 40px rgba(0,0,0,.45);background:#fff}
#lens .lt{position:absolute;left:50%;top:calc(100% + 10px);transform:translateX(-50%);display:flex;gap:4px;background:rgba(13,17,31,.92);padding:4px;border-radius:14px;cursor:default;white-space:nowrap}
#lens .lt button{min-width:42px;min-height:42px;width:auto;padding:0 10px;border-radius:10px;background:rgba(255,255,255,.14);color:#fff;font-size:15px;font-weight:700;flex-direction:row}
#lens .lt button.on{background:linear-gradient(135deg,var(--accent),var(--accent2))}
/* Taschenrechner */
.rc-d{background:var(--w-soft);border-radius:14px;padding:10px 14px;margin-bottom:10px;text-align:right;min-width:300px}
.rc-e{font-size:16px;color:var(--w-mute);min-height:22px;word-break:break-all}.rc-r{font-size:44px;font-weight:700;font-variant-numeric:tabular-nums;line-height:1.15;word-break:break-all}
.rc-g{display:grid;grid-template-columns:repeat(4,70px);gap:6px}
.rc-g button{min-height:58px;font-size:24px;padding:0;justify-content:center}.rc-g button.op{background:rgba(99,102,241,.35)}
/* Geodreieck */
#geo{position:absolute;left:240px;top:160px;display:none;z-index:8;cursor:grab;touch-action:none;transform-origin:50% 66%;clip-path:polygon(0 100%,100% 100%,50% 0)}
#geo svg{display:block;pointer-events:none}
#geo .gb{position:absolute;bottom:0;min-width:0;min-height:0;width:38px;height:30px;padding:0;border-radius:9px;background:rgba(255,255,255,.8);color:#123;font-size:12px;font-weight:700}
/* Zehnerfeld */
.zf10{display:grid;gap:5px;margin:10px auto;justify-content:center}
.zc{width:var(--s);height:var(--s);background:var(--w-soft);border:2px solid var(--w-line2);border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer}
.zc i{width:72%;height:72%;border-radius:50%;display:none}
.zc.r i{display:block;background:#ef4444}.zc.bl i{display:block;background:#3b82f6}
/* Uhr */
.ur svg{display:block;margin:0 auto;touch-action:none;cursor:pointer}
.ur-d{font-size:46px;font-weight:800;text-align:center;font-variant-numeric:tabular-nums;margin-top:6px}
.ur-w{font-size:22px;text-align:center;color:var(--w-mute);min-height:30px}
/* Anlauttabelle */
.al-g{display:grid;grid-template-columns:repeat(7,74px);gap:6px}
.al-g button{flex-direction:column;min-height:78px;padding:4px;gap:0;font-size:11px}.al-g button .e{font-size:30px;line-height:1.1}.al-g button b{font-size:15px}
.al-big{text-align:center;padding:4px 0 12px}.al-big .e{font-size:110px;line-height:1.1}.al-big .l{font-size:34px;font-weight:700}
/* Seiten-Vorlagen / Hilfe */
.sv-r{display:flex;gap:6px;align-items:center;margin-top:6px}.sv-r span{flex:1;font-weight:600;min-width:150px}
.hl-t{border-collapse:collapse;font-size:14px}.hl-t td{padding:4px 12px 4px 0;color:var(--w-mute)}.hl-t td:first-child{font-weight:700;color:var(--w-fg);white-space:nowrap}
`;
document.head.appendChild(css);

/* ---------- Fenster-Verwaltung ---------- */
const host = h('<div id="widgets"></div>');
stage.appendChild(host);
const openW = {};
let zc = 12;
const defZoom = () => clamp(host.clientHeight / 820, .9, 1.4);
const front = w => { w.style.zIndex = ++zc; if (zc > 48) { zc = 12; Object.values(openW).forEach(o => o.el.style.zIndex = ++zc) } };

function closeW(id) { const o = openW[id]; if (!o) return; try { o.cleanup && o.cleanup() } catch (e) {} o.el.remove(); delete openW[id]; menuState() }

function openWidget(def) {
  if (openW[def.id]) { closeW(def.id); return }
  const n = Object.keys(openW).length;
  const w = h(`<div class="wg"><div class="wh"><span class="ei">${def.em}</span><span class="wt">${esc(def.title)}</span><button class="wm" aria-label="Verkleinern" title="Verkleinern">${ic('minus', 18)}</button><button class="wx" aria-label="Schließen" title="Schließen">${ic('close', 18)}</button></div><div class="wb"></div><div class="wz" title="Größe ändern"></div></div>`);
  w.style.setProperty('--wa', ({ Klasse: '#6366f1', Zeit: '#f59e0b', Werkzeuge: '#14b8a6', Material: '#ec4899' })[def.group] || '#6366f1');
  { const rc = store.get('recent', []).filter(x => x !== def.id); rc.unshift(def.id); store.set('recent', rc.slice(0, 8)) }
  const body = w.querySelector('.wb'), hd = w.querySelector('.wh'), zh = w.querySelector('.wz');
  let z = defZoom() * (def.zoom || 1);
  body.style.zoom = z;
  w.style.left = (70 + (n % 7) * 36) + 'px'; w.style.top = (60 + (n % 7) * 30) + 'px';
  const sp = store.get('wpos', {})[def.id];   // zuletzt benutzte Position und Größe
  if (sp) { z = clamp(sp.z || z, .5, 3); body.style.zoom = z; w.style.left = clamp(sp.x, 0, Math.max(0, host.clientWidth - 120)) + 'px'; w.style.top = clamp(sp.y, 0, Math.max(0, host.clientHeight - 60)) + 'px' }
  const savePos = () => { const all = store.get('wpos', {}); all[def.id] = { x: parseFloat(w.style.left), y: parseFloat(w.style.top), z }; store.set('wpos', all) };
  host.appendChild(w); front(w);
  const o = openW[def.id] = { el: w };
  o.cleanup = def.build(body, w) || null;
  w.addEventListener('pointerdown', () => front(w), true);
  w.addEventListener('keydown', e => e.stopPropagation());
  w.querySelector('.wx').onclick = () => closeW(def.id);
  w.querySelector('.wm').onclick = () => w.classList.toggle('min');
  hd.addEventListener('dblclick', e => { if (!e.target.closest('button')) w.classList.toggle('min') });
  // verschieben
  hd.addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return;
    const r = w.getBoundingClientRect(), hr = host.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
    hd.setPointerCapture(e.pointerId); hd.style.cursor = 'grabbing';
    const mv = ev => {
      w.style.left = clamp(ev.clientX - hr.left - dx, 80 - r.width, host.clientWidth - 80) + 'px';
      w.style.top = clamp(ev.clientY - hr.top - dy, 0, host.clientHeight - 44) + 'px';
    };
    const up = () => { hd.removeEventListener('pointermove', mv); hd.removeEventListener('pointerup', up); hd.removeEventListener('pointercancel', up); hd.style.cursor = ''; savePos() };
    hd.addEventListener('pointermove', mv); hd.addEventListener('pointerup', up); hd.addEventListener('pointercancel', up);
  });
  // Größe ändern (skaliert den Inhalt)
  zh.addEventListener('pointerdown', e => {
    e.stopPropagation(); zh.setPointerCapture(e.pointerId);
    const r = w.getBoundingClientRect(), z0 = z;
    const mv = ev => { z = clamp(z0 * Math.max(120, ev.clientX - r.left) / r.width, .5, 3); body.style.zoom = z };
    const up = () => { zh.removeEventListener('pointermove', mv); zh.removeEventListener('pointerup', up); zh.removeEventListener('pointercancel', up); savePos() };
    zh.addEventListener('pointermove', mv); zh.addEventListener('pointerup', up); zh.addEventListener('pointercancel', up);
  });
  menuState();
}

/* ---------- Klassenliste (gemeinsam für Zufall & Gruppen) ---------- */
const klasse = () => store.get('klasse', []);
function klasseBox(parent, onchange) {
  const d = h(`<details><summary>Klassenliste <span class="lab n"></span></summary><textarea rows="9" placeholder="Ein Name pro Zeile"></textarea></details>`);
  const ta = d.querySelector('textarea'), n = d.querySelector('.n');
  ta.value = klasse().join('\n');
  const upd = () => n.textContent = '(' + klasse().length + ' Namen)';
  ta.addEventListener('input', () => { store.set('klasse', ta.value.split('\n').map(s => s.trim()).filter(Boolean)); upd(); onchange && onchange() });
  upd(); parent.appendChild(d); return d;
}

/* ---------- Widgets ---------- */
const WG = [];
const add = (id, em, title, group, build, zoom) => WG.push({ id, em, title, group, build, zoom });

/* Arbeitssymbole */
add('symbole', '🧍', 'Arbeitssymbole', 'Klasse', b => {
  const SYM = [['🧍', 'Einzelarbeit'], ['👫', 'Partnerarbeit'], ['👥', 'Gruppenarbeit'], ['🤫', 'Flüstern'], ['🔇', 'Ruhe'], ['✋', 'Melden'], ['📖', 'Lesen'], ['✏️', 'Schreiben'], ['👂', 'Zuhören'], ['🧹', 'Aufräumen'], ['🎒', 'Einpacken'], ['🙋', 'Fragen?']];
  b.innerHTML = `<div class="sy-big"><div class="e"></div><div class="l"></div></div><div class="sy-grid">${SYM.map(([e, l], i) => `<button data-i="${i}"><span class="e">${e}</span>${l}</button>`).join('')}</div>`;
  const pick = i => { b.querySelector('.e').textContent = SYM[i][0]; b.querySelector('.l').textContent = SYM[i][1]; b.querySelectorAll('.sy-grid button').forEach((x, j) => x.classList.toggle('on', i === j)) };
  b.querySelectorAll('.sy-grid button').forEach(x => x.onclick = () => pick(+x.dataset.i));
  pick(0);
});

/* Ampel */
add('ampel', '🚦', 'Ampel', 'Klasse', b => {
  const L = [['#ef4444', 'Bitte nicht stören – ich arbeite gerade'], ['#f59e0b', 'Leise fragen oder kurz warten'], ['#22c55e', 'Ich bin ansprechbar']];
  b.innerHTML = `<div class="am"><div class="am-box">${L.map(([c], i) => `<button data-i="${i}" style="background:${c};--g:${c}"></button>`).join('')}</div><div class="am-txt"></div></div>`;
  const pick = i => { b.querySelectorAll('.am-box button').forEach((x, j) => x.classList.toggle('on', i === j)); b.querySelector('.am-txt').textContent = L[i][1] };
  b.querySelectorAll('.am-box button').forEach(x => x.onclick = () => pick(+x.dataset.i));
  pick(2);
});

/* Zufallsname */
add('zufall', '🎯', 'Wer ist dran?', 'Klasse', b => {
  b.innerHTML = `<div class="zf-name">?</div><div class="row c"><button class="big go">🎲 Ziehen</button><button class="rs">Neu mischen</button></div><div class="row c"><label class="lab"><input type="checkbox" class="nr" checked> ohne Wiederholung</label><span class="lab st"></span></div>`;
  const out = b.querySelector('.zf-name'), st = b.querySelector('.st'), nr = b.querySelector('.nr');
  let done = [], busy = null;
  const upd = () => st.textContent = klasse().length ? `dran: ${done.length} / ${klasse().length}` : '';
  const box = klasseBox(b, () => { done = []; upd() });
  b.querySelector('.rs').onclick = () => { done = []; upd(); out.textContent = '?' };
  b.querySelector('.go').onclick = () => {
    const all = klasse();
    if (!all.length) { toast('Bitte zuerst die Klassenliste eintragen'); box.open = true; return }
    let pool = nr.checked ? all.filter(n => !done.includes(n)) : all;
    if (!pool.length) { toast('Alle waren dran – es geht wieder von vorn los'); done = []; pool = all }
    clearInterval(busy);
    const pickN = pool[Math.floor(Math.random() * pool.length)];
    let k = 0; busy = setInterval(() => {
      if (++k > 18) { clearInterval(busy); out.textContent = pickN; done.push(pickN); upd(); return }
      out.textContent = all[Math.floor(Math.random() * all.length)];
    }, 75);
  };
  upd();
  return () => clearInterval(busy);
});

/* Gruppen */
add('gruppen', '👥', 'Gruppen', 'Klasse', b => {
  const COL = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ec4899', '#14b8a6', '#f97316'];
  b.innerHTML = `<div class="row"><span class="lab">Anzahl Gruppen</span><button class="m">−</button><b class="num n" style="font-size:24px;min-width:28px;text-align:center">4</b><button class="p">+</button><button class="big go">Mischen</button></div><div class="gr-wrap"></div>`;
  let n = 4; const nn = b.querySelector('.n'), wrap = b.querySelector('.gr-wrap');
  b.querySelector('.m').onclick = () => { n = Math.max(2, n - 1); nn.textContent = n };
  b.querySelector('.p').onclick = () => { n = Math.min(8, n + 1); nn.textContent = n };
  b.querySelector('.go').onclick = () => {
    const all = klasse(); if (!all.length) { toast('Bitte zuerst die Klassenliste eintragen'); box.open = true; return }
    const g = Array.from({ length: n }, () => []); shuffle(all).forEach((x, i) => g[i % n].push(x));
    wrap.innerHTML = g.map((m, i) => `<div class="gr-g" style="--c:${COL[i]}"><b>Gruppe ${i + 1}</b>${m.map(x => `<div>${esc(x)}</div>`).join('')}</div>`).join('');
  };
  const box = klasseBox(b);
});

/* Punkte */
add('punkte', '🏅', 'Punkte', 'Klasse', b => {
  const COL = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ec4899'];
  let T = store.get('punkte', [{ n: 'Team 1', s: 0 }, { n: 'Team 2', s: 0 }]);
  const draw = () => {
    store.set('punkte', T);
    b.innerHTML = `<div class="pt">${T.map((t, i) => `<div class="pt-t" style="--c:${COL[i]}"><input data-i="${i}" value="${esc(t.n)}"><div class="s">${t.s}</div><div class="row c"><button data-d="-1" data-i="${i}">−</button><button class="big" data-d="1" data-i="${i}">+</button></div></div>`).join('')}</div><div class="row"><button class="ad">+ Team</button><button class="rm">− Team</button><button class="z">Alle auf 0</button></div>`;
    b.querySelectorAll('input').forEach(x => x.oninput = () => { T[+x.dataset.i].n = x.value; store.set('punkte', T) });
    b.querySelectorAll('[data-d]').forEach(x => x.onclick = () => { T[+x.dataset.i].s += +x.dataset.d; draw() });
    b.querySelector('.ad').onclick = () => { if (T.length < 6) { T.push({ n: 'Team ' + (T.length + 1), s: 0 }); draw() } };
    b.querySelector('.rm').onclick = () => { if (T.length > 1) { T.pop(); draw() } };
    b.querySelector('.z').onclick = () => { T.forEach(t => t.s = 0); draw() };
  };
  draw();
});

/* Abstimmung */
add('abstimmung', '🗳️', 'Abstimmung', 'Klasse', b => {
  const COL = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7'];
  let O = store.get('abstimmung', [{ n: 'Ja', c: 0 }, { n: 'Nein', c: 0 }]);
  const draw = () => {
    store.set('abstimmung', O);
    const tot = O.reduce((a, o) => a + o.c, 0) || 1;
    b.innerHTML = O.map((o, i) => `<div class="ab-r" style="--c:${COL[i]}"><input data-i="${i}" value="${esc(o.n)}"><div class="ab-b"><i style="width:${o.c / tot * 100}%"></i><b>${o.c}</b></div><button class="big" data-d="1" data-i="${i}">+</button><button data-d="-1" data-i="${i}">−</button></div>`).join('') + `<div class="row"><button class="ad">+ Antwort</button><button class="rm">− Antwort</button><button class="z">Zurücksetzen</button></div>`;
    b.querySelectorAll('input').forEach(x => x.oninput = () => { O[+x.dataset.i].n = x.value; store.set('abstimmung', O) });
    b.querySelectorAll('[data-d]').forEach(x => x.onclick = () => { const o = O[+x.dataset.i]; o.c = Math.max(0, o.c + +x.dataset.d); draw() });
    b.querySelector('.ad').onclick = () => { if (O.length < 5) { O.push({ n: 'Antwort ' + (O.length + 1), c: 0 }); draw() } };
    b.querySelector('.rm').onclick = () => { if (O.length > 2) { O.pop(); draw() } };
    b.querySelector('.z').onclick = () => { O.forEach(o => o.c = 0); draw() };
  };
  draw();
});

/* Geburtstag */
function celebrate(name) {
  const f = h(`<div class="fete"><canvas></canvas><div>🎂 Alles Gute zum Geburtstag${name ? ',<br>' + esc(name) : ''}! 🎉</div></div>`);
  stage.appendChild(f);
  const c = f.querySelector('canvas'); c.width = f.clientWidth; c.height = f.clientHeight;
  const g = c.getContext('2d'), COL = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#facc15'];
  const ps = Array.from({ length: 220 }, () => ({ x: Math.random() * c.width, y: -Math.random() * c.height, vy: 2 + Math.random() * 4, vx: (Math.random() - .5) * 3, r: Math.random() * 6, s: 8 + Math.random() * 10, col: COL[Math.floor(Math.random() * COL.length)] }));
  let alive = true; const t0 = performance.now();
  const stop = () => { if (!alive) return; alive = false; f.remove(); try { ac.close() } catch (e) {} };
  f.onclick = stop;
  (function tick() {
    if (!alive) return;
    g.clearRect(0, 0, c.width, c.height);
    ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.r += .12; if (p.y > c.height + 20) { p.y = -20; p.x = Math.random() * c.width } g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.col; g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore() });
    if (performance.now() - t0 > 14000) { stop(); return }
    requestAnimationFrame(tick);
  })();
  // Melodie "Happy Birthday"
  let ac; try {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    const N = [[0, .75], [0, .25], [2, 1], [0, 1], [5, 1], [4, 2], [0, .75], [0, .25], [2, 1], [0, 1], [7, 1], [5, 2], [0, .75], [0, .25], [12, 1], [9, 1], [5, 1], [4, 1], [2, 1], [10, .75], [10, .25], [9, 1], [5, 1], [7, 1], [5, 2]];
    let t = ac.currentTime + .1; const beat = .42;
    N.forEach(([s, d]) => { const o = ac.createOscillator(), gn = ac.createGain(); o.type = 'triangle'; o.frequency.value = 261.63 * Math.pow(2, s / 12); o.connect(gn); gn.connect(ac.destination); gn.gain.setValueAtTime(.0001, t); gn.gain.exponentialRampToValueAtTime(.28, t + .03); gn.gain.exponentialRampToValueAtTime(.001, t + d * beat * .95); o.start(t); o.stop(t + d * beat); t += d * beat });
  } catch (e) {}
}
add('geburtstag', '🎂', 'Geburtstag', 'Klasse', b => {
  b.innerHTML = `<div class="row" style="margin-top:0"><input class="nm" placeholder="Name (optional)" style="width:230px"></div><div class="row"><button class="big go">🎉 Feiern!</button></div><div class="hint">Zeigt Konfetti und spielt eine Melodie. Mit einem Klick auf den Bildschirm beenden.</div>`;
  b.querySelector('.go').onclick = () => celebrate(b.querySelector('.nm').value.trim());
});

/* Visueller Timer */
add('zeitscheibe', '⏳', 'Zeit-Scheibe', 'Zeit', b => {
  let total = 300, end = 0, left = 300, iv = null;
  b.innerHTML = `<div class="vt"><svg viewBox="-110 -110 220 220" width="250" height="250"><circle r="104" style="fill:var(--w-soft2)"/><path class="pie" fill="#ef4444"/><text class="tx" text-anchor="middle" y="14" font-size="42" font-weight="800" fill="#fff" style="paint-order:stroke;stroke:rgba(0,0,0,.65);stroke-width:6px"></text></svg></div><div class="row c pre">${[1, 2, 5, 10, 15, 20, 30].map(m => `<button data-m="${m}">${m}</button>`).join('')}</div><div class="row c"><label class="lab">Minuten <input type="number" class="cu" min="1" max="180" style="width:74px"></label><button class="big go">▶ Start</button><button class="rs" aria-label="Zurücksetzen">↺</button></div>`;
  const pie = b.querySelector('.pie'), tx = b.querySelector('.tx'), go = b.querySelector('.go');
  const draw = () => {
    const f = clamp(left / total, 0, 1), a = f * 2 * Math.PI;
    pie.setAttribute('d', f >= .9999 ? 'M0 -100 A100 100 0 1 1 -0.01 -100Z' : f <= 0 ? '' : `M0 0 L0 -100 A100 100 0 ${a > Math.PI ? 1 : 0} 1 ${100 * Math.sin(a)} ${-100 * Math.cos(a)}Z`);
    const s = Math.ceil(left); tx.textContent = left <= 0 && iv === null && total !== left ? 'Zeit!' : `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
  };
  const stop = () => { clearInterval(iv); iv = null; go.textContent = '▶ Start' };
  const set = m => { stop(); total = left = m * 60; b.querySelector('.cu').value = ''; draw() };
  b.querySelectorAll('.pre button').forEach(x => x.onclick = () => set(+x.dataset.m));
  b.querySelector('.cu').onchange = e => { const m = +e.target.value; if (m > 0) set(m) };
  b.querySelector('.rs').onclick = () => { stop(); left = total; draw() };
  go.onclick = () => {
    if (iv) { stop(); return }
    if (left <= 0) left = total;
    end = Date.now() + left * 1000; go.textContent = '❚❚ Pause';
    iv = setInterval(() => { left = (end - Date.now()) / 1000; if (left <= 0) { left = 0; stop(); beep(); draw(); return } draw() }, 200);
  };
  draw();
  return () => clearInterval(iv);
});

/* Stoppuhr */
add('stoppuhr', '⏱️', 'Stoppuhr', 'Zeit', b => {
  b.innerHTML = `<div class="sw-t">00:00,00</div><div class="row c"><button class="big go">▶ Start</button><button class="lp">Runde</button><button class="rs">↺</button></div><div class="sw-l"></div>`;
  let acc = 0, t0 = 0, iv = null, laps = [];
  const tt = b.querySelector('.sw-t'), go = b.querySelector('.go'), L = b.querySelector('.sw-l');
  const cur = () => acc + (iv ? performance.now() - t0 : 0);
  const fmt = ms => { const c = Math.floor(ms / 10) % 100, s = Math.floor(ms / 1000) % 60, m = Math.floor(ms / 60000); return `${pad(m)}:${pad(s)},${pad(c)}` };
  const draw = () => { tt.textContent = fmt(cur()); L.innerHTML = laps.slice(-5).map((l, i, a) => `Runde ${laps.length - a.length + i + 1}: ${fmt(l)}`).join('<br>') };
  go.onclick = () => { if (iv) { acc += performance.now() - t0; clearInterval(iv); iv = null; go.textContent = '▶ Weiter' } else { t0 = performance.now(); iv = setInterval(draw, 40); go.textContent = '❚❚ Stopp' } draw() };
  b.querySelector('.lp').onclick = () => { if (cur() > 0) { laps.push(cur()); draw() } };
  b.querySelector('.rs').onclick = () => { clearInterval(iv); iv = null; acc = 0; laps = []; go.textContent = '▶ Start'; draw() };
  draw();
  return () => clearInterval(iv);
});

/* Countdown */
add('countdown', '📅', 'Countdown', 'Zeit', b => {
  const s = store.get('countdown', { n: '', d: '' });
  b.innerHTML = `<div class="cd-n">–</div><div class="cd-l"></div><div class="row c"><input class="nm" placeholder="Ereignis (z. B. Ferien)" style="width:200px"><input class="dt" type="date"></div>`;
  const nm = b.querySelector('.nm'), dt = b.querySelector('.dt'), nn = b.querySelector('.cd-n'), ll = b.querySelector('.cd-l');
  nm.value = s.n; dt.value = s.d;
  const draw = () => {
    ll.textContent = nm.value;
    if (!dt.value) { nn.textContent = '–'; return }
    const [y, m, d] = dt.value.split('-').map(Number), now = new Date();
    const days = Math.round((new Date(y, m - 1, d) - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 864e5);
    nn.innerHTML = days === 0 ? '<span style="font-size:60px">Heute!</span>' : days > 0 ? `${days}<span style="font-size:30px"> ${days === 1 ? 'Tag' : 'Tage'}</span>` : '<span style="font-size:40px">vorbei</span>';
  };
  const save = () => { store.set('countdown', { n: nm.value, d: dt.value }); draw() };
  nm.oninput = dt.onchange = save; draw();
  const iv = setInterval(draw, 60000);
  return () => clearInterval(iv);
});

/* Stundenplan */
add('stundenplan', '🗓️', 'Stundenplan', 'Zeit', b => {
  const D = ['Mo', 'Di', 'Mi', 'Do', 'Fr'], data = store.get('stundenplan', {}), today = new Date().getDay() - 1;
  b.innerHTML = `<table class="sp"><tr><th></th>${D.map((d, i) => `<th class="${i === today ? 'today' : ''}">${d}</th>`).join('')}</tr>${Array.from({ length: 8 }, (_, r) => `<tr><td class="h">${r + 1}</td>${D.map((_, c) => `<td><input data-k="${c}-${r}" class="${c === today ? 'today' : ''}" value="${esc(data[c + '-' + r] || '')}"></td>`).join('')}</tr>`).join('')}</table>`;
  b.querySelectorAll('input').forEach(x => x.oninput = () => { data[x.dataset.k] = x.value; store.set('stundenplan', data) });
});

/* Würfel */
add('wuerfel', '🎲', 'Würfel', 'Werkzeuge', b => {
  const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  b.innerHTML = `<div class="dc"></div><div class="sum" style="text-align:center;font-size:22px;font-weight:700;min-height:30px;margin-top:6px"></div><div class="row c"><label class="lab">Anzahl <select class="cn">${[1, 2, 3, 4, 5, 6].map(n => `<option>${n}</option>`).join('')}</select></label><label class="lab">Seiten <select class="sd"><option>6</option><option>10</option><option>12</option><option>20</option><option>100</option></select></label><button class="big go">🎲 Würfeln</button></div>`;
  const dc = b.querySelector('.dc'), sum = b.querySelector('.sum');
  let iv = null;
  const face = (v, sides) => sides === 6 ? `<div class="die pips">${Array.from({ length: 9 }, (_, i) => PIPS[v].includes(i) ? '<i></i>' : '<span></span>').join('')}</div>` : `<div class="die">${v}</div>`;
  const roll = () => {
    const n = +b.querySelector('.cn').value, sd = +b.querySelector('.sd').value; let k = 0; clearInterval(iv);
    iv = setInterval(() => {
      const last = ++k > 9, vs = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * sd));
      dc.innerHTML = vs.map(v => face(v, sd)).join('');
      dc.querySelectorAll('.die').forEach(d => { d.classList.toggle('rolling', !last); d.onclick = roll });
      if (last) { clearInterval(iv); sum.textContent = n > 1 ? 'Summe: ' + vs.reduce((a, c) => a + c, 0) : '' }
    }, 70);
  };
  b.querySelector('.go').onclick = roll;
  dc.innerHTML = face(6, 6);
  return () => clearInterval(iv);
});

/* Lärmpegel */
add('laerm', '🔊', 'Lärmpegel', 'Werkzeuge', b => {
  b.innerHTML = `<div class="lm-bar"><div class="lm-fill"></div><div class="lm-th"></div></div><div class="lm-st">Mikrofon aus</div><div class="row c"><button class="big go">🎤 Start</button><label class="lab">Grenze <input type="range" class="th" min="15" max="95" value="60"></label></div><div class="hint">Das Mikrofon wird nur für die Anzeige genutzt, es wird nichts aufgenommen oder gesendet.</div>`;
  const fill = b.querySelector('.lm-fill'), thEl = b.querySelector('.lm-th'), st = b.querySelector('.lm-st'), go = b.querySelector('.go'), th = b.querySelector('.th');
  const win = b.closest('.wg');
  let ac = null, stream = null, raf = 0, lvl = 0, over = 0, cal = 0, calSum = 0;
  const setTh = () => thEl.style.left = th.value + '%'; th.oninput = setTh; setTh();
  const stop = () => { cancelAnimationFrame(raf); try { stream && stream.getTracks().forEach(t => t.stop()) } catch (e) {} try { ac && ac.close() } catch (e) {} ac = stream = null; fill.style.width = '0'; st.textContent = 'Mikrofon aus'; win.classList.remove('alarm'); go.textContent = '🎤 Start' };
  go.onclick = async () => {
    if (ac) { stop(); return }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      ac = new (window.AudioContext || window.webkitAudioContext)();
      const an = ac.createAnalyser(); an.fftSize = 1024; ac.createMediaStreamSource(stream).connect(an);
      const buf = new Uint8Array(an.fftSize); go.textContent = '■ Stopp'; over = 0; cal = 0; calSum = 0; lvl = 0;
      const tick = () => {
        an.getByteTimeDomainData(buf); let s = 0; for (const v of buf) { const x = (v - 128) / 128; s += x * x }
        const db = 20 * Math.log10(Math.sqrt(s / buf.length) + 1e-6), now = clamp((db + 60) / 50 * 100, 0, 100);
        lvl = Math.max(now, lvl * .93); fill.style.width = lvl + '%';
        if (cal < 120) {   // die ersten ~2 Sekunden: Raumgeräusch messen und die Grenze daran anpassen
          calSum += now; cal++;
          if (cal === 120) { th.value = clamp(Math.round(calSum / 120 + 24), 30, 92); setTh() }
          st.textContent = 'Raum wird gemessen …'; win.classList.remove('alarm');
        } else {
          over = lvl > +th.value ? over + 1 : Math.max(0, over - 2);
          const loud = over > 20;
          win.classList.toggle('alarm', loud);
          st.textContent = loud ? '🔴 Zu laut!' : lvl > +th.value * .75 ? '🟡 Etwas laut' : '🟢 Schön leise';
        }
        raf = requestAnimationFrame(tick);
      };
      tick();
    } catch (e) { toast('Mikrofon nicht erlaubt oder nicht gefunden', 4000); stop() }
  };
  return stop;
});

/* Taschenrechner (Punkt-vor-Strich, Klammern, Komma; Tastatur möglich) */
add('rechner', '🧮', 'Taschenrechner', 'Werkzeuge', b => {
  const K = [['C', '(', ')', '⌫'], ['7', '8', '9', '÷'], ['4', '5', '6', '×'], ['1', '2', '3', '−'], ['0', ',', '=', '+']];
  b.innerHTML = `<div class="rc-d"><div class="rc-e"></div><div class="rc-r">0</div></div><div class="rc-g">${K.flat().map(k => `<button data-k="${k}" class="${/[÷×−+]/.test(k) ? 'op' : k === '=' ? 'big' : ''}">${k}</button>`).join('')}</div>`;
  const win = b.closest('.wg'); win.tabIndex = 0;
  const eE = b.querySelector('.rc-e'), eR = b.querySelector('.rc-r');
  let ex = '', fresh = false;                       // ex: Rechnung mit „.“ als Dezimalzeichen
  const show = s => String(s).replace(/\./g, ',').replace(/-/g, '−');
  const fmt = v => { if (!isFinite(v)) return null; let s = String(+v.toPrecision(12)); if (/e/i.test(s)) s = v.toExponential(6); return s };
  const evalEx = s => {                              // kleiner Parser ohne eval()
    let i = 0; const peek = () => s[i];
    const num = () => { const m = /^\d*\.?\d+|^\d+\.?/.exec(s.slice(i)); if (!m) throw 0; i += m[0].length; return parseFloat(m[0]) };
    const fac = () => { if (peek() === '−' || peek() === '-') { i++; return -fac() } if (peek() === '(') { i++; const v = exp(); if (peek() !== ')') throw 0; i++; return v } return num() };
    const term = () => { let v = fac(); while (peek() === '×' || peek() === '÷') { const o = s[i++], r = fac(); v = o === '×' ? v * r : v / r } return v };
    const exp = () => { let v = term(); while (peek() === '+' || peek() === '−') { const o = s[i++], r = term(); v = o === '+' ? v + r : v - r } return v };
    const v = exp(); if (i !== s.length) throw 0; return v;
  };
  const closeP = s => s + ')'.repeat(Math.max(0, (s.match(/\(/g) || []).length - (s.match(/\)/g) || []).length));
  const live = () => { let r = null; try { r = fmt(evalEx(closeP(ex.replace(/[+×÷−(]+$/, '')))) } catch (e) {} eE.textContent = show(ex); eR.textContent = ex ? (r == null ? '' : show(r)) : '0' };
  const press = k => {
    if (k === 'C') { ex = ''; fresh = false }
    else if (k === '⌫') { ex = ex.slice(0, -1); fresh = false }
    else if (k === '=') {
      if (!ex) return; let v; try { v = evalEx(closeP(ex)) } catch (e) { eR.textContent = 'Fehler'; return }
      const r = fmt(v); if (r == null) { eE.textContent = show(ex) + ' ='; eR.textContent = 'Fehler'; ex = ''; return }
      eE.textContent = show(closeP(ex)) + ' ='; eR.textContent = show(r); ex = r; fresh = true; return;
    }
    else if (/\d/.test(k)) { if (fresh) { ex = ''; fresh = false } ex += k }
    else if (k === ',') { if (fresh) { ex = ''; fresh = false } const last = ex.split(/[+×÷−()]/).pop(); if (!last.includes('.')) ex += last === '' ? '0.' : '.' }
    else if (k === '(') { if (fresh) { ex = ''; fresh = false } ex += k }
    else if (k === ')') { if ((ex.match(/\(/g) || []).length > (ex.match(/\)/g) || []).length && !/[+×÷−(]$/.test(ex)) ex += k }
    else { fresh = false; if (!ex && k !== '−') return; if (/[+×÷−]$/.test(ex)) { if (k === '−' && !/[−]$/.test(ex) && !/[(]$/.test(ex)) ex += k; else ex = ex.slice(0, -1) + k } else ex += k }
    live();
  };
  b.querySelector('.rc-g').addEventListener('click', e => { const k = e.target.closest('button'); if (k) press(k.dataset.k) });
  win.addEventListener('keydown', e => {
    const m = { '*': '×', 'x': '×', '/': '÷', '-': '−', '.': ',', 'Enter': '=', '=': '=', 'Backspace': '⌫', 'Escape': 'C', 'Delete': 'C' };
    const k = m[e.key] || e.key; if (/^[0-9+×÷−=,()]$|^⌫$|^C$/.test(k)) { e.preventDefault(); press(k) }
  });
  live();
});

/* QR-Code */
add('qr', '▦', 'QR-Code', 'Werkzeuge', b => {
  b.innerHTML = `<div style="text-align:center"><canvas width="280" height="280" style="width:280px;height:280px;background:#fff;border-radius:14px;display:block;margin:0 auto"></canvas></div><div class="row c"><input class="u" placeholder="Adresse oder Text" style="width:280px"></div><div class="row c"><button class="tb">Auf die Tafel</button></div>`;
  const cvs = b.querySelector('canvas'), g = cvs.getContext('2d'), u = b.querySelector('.u');
  const draw = async () => {
    g.fillStyle = '#fff'; g.fillRect(0, 0, 280, 280);
    const v = u.value.trim(); if (!v) return;
    try {
      if (!window.qrcode) await loadScript('lib/qrcode.js');
      const q = qrcode(0, 'M'); q.addData(v); q.make();
      const n = q.getModuleCount(), cell = 248 / n, off = 16; g.fillStyle = '#000';
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) g.fillRect(Math.floor(off + c * cell), Math.floor(off + r * cell), Math.ceil(cell), Math.ceil(cell));
    } catch (e) { toast('Text ist zu lang für einen QR-Code') }
  };
  u.oninput = draw;
  b.querySelector('.tb').onclick = () => { if (!u.value.trim()) return; addImage(cvs.toDataURL('image/png')); toast('QR-Code liegt auf der Tafel') };
  draw();
});

/* Kamera (Dokumentenkamera) */
add('kamera', '📷', 'Kamera', 'Werkzeuge', b => {
  b.innerHTML = `<div class="cam"><video autoplay playsinline muted></video></div><div class="row c"><button class="big go">▶ Kamera an</button><button class="sw">🔄 Wechseln</button><button class="fr">⏸ Standbild</button><button class="tb">Auf die Tafel</button></div>`;
  const v = b.querySelector('video'), go = b.querySelector('.go');
  let stream = null, devs = [], di = 0;
  const stop = () => { try { stream && stream.getTracks().forEach(t => t.stop()) } catch (e) {} stream = null; v.srcObject = null; go.textContent = '▶ Kamera an' };
  const start = async () => {
    stop();
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: devs[di] ? { deviceId: { exact: devs[di].deviceId }, width: { ideal: 1920 } } : { width: { ideal: 1920 } } });
      v.srcObject = stream; go.textContent = '■ Kamera aus';
      devs = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'videoinput');
    } catch (e) { toast('Kamera nicht erlaubt oder nicht gefunden', 4000); stop() }
  };
  go.onclick = () => stream ? stop() : start();
  b.querySelector('.sw').onclick = async () => { if (!devs.length) devs = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'videoinput'); if (devs.length < 2) { toast('Nur eine Kamera gefunden'); return } di = (di + 1) % devs.length; start() };
  b.querySelector('.fr').onclick = e => { if (v.paused) { v.play(); e.currentTarget.textContent = '⏸ Standbild' } else { v.pause(); e.currentTarget.textContent = '▶ Weiter' } };
  b.querySelector('.tb').onclick = () => {
    if (!v.videoWidth) { toast('Zuerst die Kamera einschalten'); return }
    const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0);
    addImage(c.toDataURL('image/jpeg', .88));
  };
  start();
  return stop;
});

/* Webseite einbetten */
add('einbetten', '🌐', 'Webseite', 'Werkzeuge', b => {
  b.innerHTML = `<div class="emb"><div class="row" style="margin-top:0"><input class="u" placeholder="https://…" style="flex:1;min-width:300px"><button class="big go">Öffnen</button></div><div class="hint">Manche Webseiten (z. B. Anmeldeseiten) erlauben das Einbetten nicht. Dann zeigt das Fenster nichts an – nutze dafür das Widget „Links“.</div></div>`;
  const u = b.querySelector('.u');
  const go = () => {
    let v = u.value.trim(); if (!v) return; if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
    b.querySelector('iframe')?.remove();
    const f = document.createElement('iframe'); f.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups'); f.src = v; b.querySelector('.emb').appendChild(f);
  };
  b.querySelector('.go').onclick = go; u.onkeydown = e => { if (e.key === 'Enter') go() };
});

/* Links */
add('links', '🔗', 'Links', 'Werkzeuge', b => {
  const BASE = [['🦈', 'Shy Safari', 'https://www.shysafari.com/'], ['🗂️', 'TaskCards', 'https://www.taskcards.de/'], ['📚', 'Bibox (Westermann)', 'https://bibox2.westermann.de/']];
  let own = store.get('links', []);
  const draw = () => {
    b.innerHTML = `<div class="lk-l">${BASE.map(([e, n, u]) => `<div class="lk-r"><a href="${u}" target="_blank" rel="noopener">${e} ${esc(n)}</a></div>`).join('')}${own.map(([n, u], i) => `<div class="lk-r"><a href="${esc(u)}" target="_blank" rel="noopener">🔗 ${esc(n)}</a><button data-i="${i}" aria-label="Link entfernen">${ic('trash', 18)}</button></div>`).join('')}</div><div class="row"><input class="nm" placeholder="Name" style="width:120px"><input class="u" placeholder="https://…" style="flex:1;min-width:150px"><button class="ad">+</button></div><div class="hint">Eigene Links (z. B. deine TaskCards-Boards) werden nur auf diesem Gerät gespeichert.</div>`;
    b.querySelector('.ad').onclick = () => {
      let u = b.querySelector('.u').value.trim(); const n = b.querySelector('.nm').value.trim(); if (!u) return;
      if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
      own.push([n || u.replace(/^https?:\/\//, '').split('/')[0], u]); store.set('links', own); draw();
    };
    b.querySelectorAll('button[data-i]').forEach(x => x.onclick = () => { own.splice(+x.dataset.i, 1); store.set('links', own); draw() });
  };
  draw();
});

/* Sticker */
add('sticker', '⭐', 'Sticker', 'Material', b => {
  const ST = ['⭐', '🌟', '👍', '👏', '❤️', '😀', '😎', '🏆', '🎉', '✅', '❌', '💯', '🌈', '🍎', '🎈', '🔥', '☀️', '🌸'];
  b.innerHTML = `<div class="st-g">${ST.map(s => `<button>${s}</button>`).join('')}</div><div class="hint">Antippen legt den Sticker auf die Tafel. Mit dem Auswahl-Werkzeug verschieben und mit „Größer“ vergrößern.</div>`;
  b.querySelectorAll('.st-g button').forEach(x => x.onclick = () => {
    const j = () => (Math.random() - .5) * 300;
    P().objs.push({ t: 'text', x: 860 + j(), y: 440 + j() / 2, s: x.textContent, c: '#000000', size: 130, w: 1 });
    sel = P().objs.length - 1; tool = 'select'; snap(); toolsUI();
  });
});

/* Vorlagen */
add('vorlagen', '🧩', 'Vorlagen', 'Material', b => {
  b.innerHTML = `<div class="row" style="margin-top:0"><button class="big ttt">⭕ Tic Tac Toe</button><button class="big gal">🔤 Galgenmännchen</button></div><div class="row"><button class="big bin">🎱 Bingo</button><button class="big kre">🧩 Kreuzworträtsel</button></div><div class="row"><button class="big mem">🃏 Memory</button><button class="big lue">✏️ Lückentext</button></div><div class="hint">Legt eine neue Seite mit der Vorlage an. Tabellen lassen sich per Doppelklick in eine Zelle beschriften.</div>`;
  const ink = () => S.theme === 'board' ? '#ffffff' : '#111111';
  const ln = (x1, y1, x2, y2, c, w = 9) => ({ t: 'line', x1, y1, x2, y2, c, w });
  const tx = (x, y, s, c, size) => ({ t: 'text', x, y, s, c, size, w: 1 });
  b.querySelector('.ttt').onclick = () => {
    addPage('plain'); const c = ink();
    P().objs.push(tx(740, 40, 'Tic Tac Toe', c, 100), ln(843, 220, 843, 900, c), ln(1077, 220, 1077, 900, c), ln(610, 447, 1310, 447, c), ln(610, 673, 1310, 673, c)); snap();
  };
  b.querySelector('.gal').onclick = () => {
    addPage('plain'); const c = ink(), o = P().objs;
    o.push(ln(160, 960, 760, 960, c), ln(460, 960, 460, 160, c), ln(460, 160, 860, 160, c), ln(460, 300, 600, 160, c), ln(860, 160, 860, 290, c));
    for (let i = 0; i < 8; i++) o.push(ln(960 + i * 120, 900, 1050 + i * 120, 900, c, 7));
    o.push(tx(960, 160, 'Falsche Buchstaben:', c, 60)); snap();
  };
  const tbl = (x1, y1, x2, y2, r, k) => ({ t: 'table', x1, y1, x2, y2, r, k, c: S.theme === 'board' ? '#c3cad6' : '#6b7280', w: 3 });   // dünne graue Linie wie mit Bleistift
  b.querySelector('.bin').onclick = () => { addPage('plain'); const c = ink(); P().objs.push(tx(820, 40, 'Bingo', c, 100), tbl(560, 220, 1360, 1020, 5, 5, c)); snap() };
  b.querySelector('.kre').onclick = () => { addPage('plain'); const c = ink(); P().objs.push(tx(700, 40, 'Kreuzworträtsel', c, 100), tbl(480, 220, 1440, 1000, 13, 16, c)); snap() };
  b.querySelector('.mem').onclick = () => { addPage('plain'); const c = ink(); P().objs.push(tx(820, 30, 'Memory', c, 90), tbl(360, 190, 1560, 1030, 4, 6, c)); snap() };
  b.querySelector('.lue').onclick = () => {
    addPage('plain'); const c = ink(), o = P().objs; o.push(tx(120, 40, 'Lückentext', c, 100));
    for (let i = 0; i < 7; i++) o.push(ln(120, 330 + i * 120, 1800, 330 + i * 120, c, 5));
    snap();
  };
});

/* Gehirnpause */
add('gehirnpause', '🧠', 'Gehirnpause', 'Material', b => {
  const IDEAS = ['10 Hampelmänner', 'Alle strecken sich so hoch wie möglich', 'Schulterkreisen: 5 vorwärts, 5 rückwärts', 'Tief ein- und ausatmen – 5 Mal', 'Rechte Hand zum linken Knie, dann wechseln', 'Auf einem Bein stehen – 10 Sekunden', 'Hände kräftig ausschütteln', 'Rückwärts zählen von 20', 'Nase und Ohr wechseln: Rechts Nase, links Ohr … und tauschen', 'Augen schließen und 30 Sekunden still lauschen', 'Wie ein Tier durch die Klasse laufen (leise!)', '10 Kniebeugen', 'Mit dem Finger eine liegende Acht in die Luft malen', 'Massiere dir sanft die Schläfen', 'Alle klatschen den Rhythmus nach, den die Lehrkraft vorgibt'];
  b.innerHTML = `<div class="gp-t"></div><div class="row c"><button class="big go">💡 Neue Idee</button></div>`;
  const t = b.querySelector('.gp-t'); let last = -1;
  const next = () => { let i; do { i = Math.floor(Math.random() * IDEAS.length) } while (i === last); last = i; t.textContent = IDEAS[i] };
  b.querySelector('.go').onclick = next; next();
});

/* Zehnerfeld / Zwanzigerfeld / Hunderterfeld mit Plättchen */
add('zahlen', '🔴', 'Zehnerfeld', 'Material', b => {
  let n = 10, st = [];
  b.innerHTML = `<div class="row" style="margin-top:0"><button data-n="10">Zehnerfeld</button><button data-n="20">Zwanzigerfeld</button><button data-n="100">Hunderterfeld</button></div><div class="zf10"></div><div class="row c"><b class="num cnt" style="font-size:24px"></b><button class="rs">Leeren</button></div><div class="hint">Antippen: rotes Plättchen, nochmal: blaues, nochmal: weg.</div>`;
  const grid = b.querySelector('.zf10'), cnt = b.querySelector('.cnt');
  const draw = () => {
    const cols = n === 100 ? 10 : 5, s = n === 100 ? 42 : 64;
    grid.style.gridTemplateColumns = `repeat(${cols},${s}px)`; grid.style.setProperty('--s', s + 'px');
    grid.innerHTML = Array.from({ length: n }, (_, i) => `<div class="zc ${st[i] === 1 ? 'r' : st[i] === 2 ? 'bl' : ''}" data-i="${i}"><i></i></div>`).join('');
    const r = st.slice(0, n).filter(v => v === 1).length, bl = st.slice(0, n).filter(v => v === 2).length;
    cnt.textContent = (r + bl) + ' Plättchen' + (r && bl ? ` (${r} rot + ${bl} blau)` : '');
    b.querySelectorAll('[data-n]').forEach(x => x.classList.toggle('on', +x.dataset.n === n));
  };
  grid.addEventListener('click', e => { const c = e.target.closest('.zc'); if (!c) return; const i = +c.dataset.i; st[i] = ((st[i] || 0) + 1) % 3; draw() });
  b.querySelectorAll('[data-n]').forEach(x => x.onclick = () => { n = +x.dataset.n; draw() });
  b.querySelector('.rs').onclick = () => { st = []; draw() };
  draw();
});

/* Uhr zum Verstellen */
add('uhr', '🕒', 'Uhr', 'Material', b => {
  const HN = ['zwölf', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf'];
  const hn = h12 => HN[((h12 % 12) + 12) % 12];
  const words = (h, m) => {
    const nx = hn(h + 1);
    return ({ 0: (h % 12 === 1 ? 'ein' : hn(h)) + ' Uhr', 5: `fünf nach ${hn(h)}`, 10: `zehn nach ${hn(h)}`, 15: `Viertel nach ${hn(h)}`, 20: `zwanzig nach ${hn(h)}`, 25: `fünf vor halb ${nx}`, 30: `halb ${nx}`, 35: `fünf nach halb ${nx}`, 40: `zwanzig vor ${nx}`, 45: `Viertel vor ${nx}`, 50: `zehn vor ${nx}`, 55: `fünf vor ${nx}` })[m] || '';
  };
  let h = 3, m = 0, pm = false, h24 = false, task = null;
  let tk = ''; for (let i = 0; i < 60; i++) { const a = i * 6 * Math.PI / 180, r1 = i % 5 === 0 ? 100 : 105, x1 = 112 * Math.sin(a), y1 = -112 * Math.cos(a); tk += `<line x1="${r1 * Math.sin(a)}" y1="${-r1 * Math.cos(a)}" x2="${x1}" y2="${y1}" stroke="#334" stroke-width="${i % 5 === 0 ? 3 : 1.2}"/>` }
  let nums = ''; for (let i = 1; i <= 12; i++) { const a = i * 30 * Math.PI / 180; nums += `<text x="${82 * Math.sin(a)}" y="${-82 * Math.cos(a) + 9}" font-size="26" font-weight="700" text-anchor="middle" fill="#112" font-family="Segoe UI,sans-serif">${i}</text>` }
  b.innerHTML = `<div class="ur"><svg viewBox="-125 -125 250 250" width="270" height="270"><circle r="120" fill="#fff" stroke="#334" stroke-width="5"/>${tk}${nums}<line class="hh" x1="0" y1="0" x2="0" y2="-52" stroke="#c0182d" stroke-width="9" stroke-linecap="round"/><line class="mh" x1="0" y1="0" x2="0" y2="-88" stroke="#1b4fb8" stroke-width="6" stroke-linecap="round"/><circle r="7" fill="#223"/></svg></div><div class="ur-d"></div><div class="ur-w"></div><div class="row c"><button class="ap">Vormittag</button><button class="f24">24-Stunden</button><button class="wd">Wörter</button></div><div class="row c"><button class="big nw">🎲 Aufgabe</button><button class="ck">Prüfen</button></div>`;
  const svg = b.querySelector('svg'), hh = b.querySelector('.hh'), mh = b.querySelector('.mh'), dd = b.querySelector('.ur-d'), ww = b.querySelector('.ur-w');
  let showW = false;
  const draw = () => {
    hh.setAttribute('transform', `rotate(${(h + m / 60) * 30})`); mh.setAttribute('transform', `rotate(${m * 6})`);
    const hr = h24 ? (h + (pm ? 12 : 0)) % 24 : (h === 0 ? 12 : h);
    dd.textContent = `${h24 ? pad(hr) : hr}:${pad(m)}` + (h24 ? '' : ' Uhr');
    b.querySelector('.ap').textContent = pm ? 'Nachmittag' : 'Vormittag'; b.querySelector('.f24').classList.toggle('on', h24); b.querySelector('.wd').classList.toggle('on', showW);
    ww.textContent = task ? 'Stelle: ' + task.text : (showW ? (words(h, Math.round(m / 5) * 5 % 60) || '') : '');
  };
  let drag = null;
  const ang = e => { const r = svg.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2); return { a: (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360, d: Math.hypot(dx, dy) / (r.width / 2) } };
  svg.addEventListener('pointerdown', e => { const p = ang(e); drag = p.d < .5 ? 'h' : 'm'; svg.setPointerCapture(e.pointerId); mv(e) });
  const mv = e => {
    if (!drag) return; const { a } = ang(e);
    if (drag === 'h') { const t = a / 360 * 720; h = Math.floor(t / 60) % 12; m = Math.round(t % 60) % 60 }
    else { const nm = Math.round(a / 6) % 60; if (m > 45 && nm < 15) h = (h + 1) % 12; else if (m < 15 && nm > 45) h = (h + 11) % 12; m = nm }
    draw();
  };
  svg.addEventListener('pointermove', mv); svg.addEventListener('pointerup', () => drag = null); svg.addEventListener('pointercancel', () => drag = null);
  b.querySelector('.ap').onclick = () => { pm = !pm; draw() };
  b.querySelector('.f24').onclick = () => { h24 = !h24; draw() };
  b.querySelector('.wd').onclick = () => { showW = !showW; draw() };
  b.querySelector('.nw').onclick = () => { const th = Math.floor(Math.random() * 12), tm = Math.floor(Math.random() * 12) * 5; task = { h: th, m: tm, text: words(th, tm) }; h = 12 % 12; m = 0; draw() };
  b.querySelector('.ck').onclick = () => { if (!task) { toast('Zuerst eine Aufgabe stellen'); return } const ok = (h % 12) === (task.h % 12) && Math.round(m / 5) * 5 % 60 === task.m; toast(ok ? '✔ Richtig!' : '✖ Noch nicht ganz – nochmal versuchen', 2500) };
  draw();
});

/* Anlauttabelle */
add('anlaut', '🔤', 'Anlauttabelle', 'Material', b => {
  const A = [['A', '🍍', 'Ananas'], ['B', '🍐', 'Birne'], ['C', '🤡', 'Clown'], ['D', '🦖', 'Dino'], ['E', '🦆', 'Ente'], ['F', '🐟', 'Fisch'], ['G', '🦒', 'Giraffe'], ['H', '🐶', 'Hund'], ['I', '🦔', 'Igel'], ['J', '🧒', 'Junge'], ['K', '🐱', 'Katze'], ['L', '🦁', 'Löwe'], ['M', '🐭', 'Maus'], ['N', '👃', 'Nase'], ['O', '👂', 'Ohr'], ['P', '🍄', 'Pilz'], ['Qu', '💧', 'Quelle'], ['R', '🚀', 'Rakete'], ['S', '☀️', 'Sonne'], ['T', '🐯', 'Tiger'], ['U', '🕐', 'Uhr'], ['V', '🐦', 'Vogel'], ['W', '🐳', 'Wal'], ['X', '🎹', 'Xylofon'], ['Y', '🧘', 'Yoga'], ['Z', '🦓', 'Zebra']];
  b.innerHTML = `<div class="al-big"><div class="e">🔤</div><div class="l">Tippe einen Buchstaben</div></div><div class="al-g">${A.map(([l, e, w], i) => `<button data-i="${i}"><span class="e">${e}</span><b>${l}${l.toLowerCase()}</b>${w}</button>`).join('')}</div>`;
  b.querySelectorAll('.al-g button').forEach(x => x.onclick = () => { const [l, e, w] = A[+x.dataset.i]; b.querySelector('.al-big .e').textContent = e; b.querySelector('.al-big .l').textContent = `${l} ${l.toLowerCase()} – ${w}` });
});

/* Seiten-Vorlagen: aktuelle Seite als Vorlage merken, später wieder einfügen */
add('seitenvorlagen', '📑', 'Seiten-Vorlagen', 'Material', b => {
  const draw = () => {
    const V = store.get('vorlagen', []);
    b.innerHTML = `<div class="row" style="margin-top:0"><input class="nm" placeholder="Name der Vorlage" style="width:200px"><button class="big sv">Seite speichern</button></div>${V.length ? V.map((v, i) => `<div class="sv-r"><span>${esc(v.n)}</span><button data-i="${i}" data-a="ins">Einfügen</button><button data-i="${i}" data-a="del" aria-label="Löschen">${ic('trash', 18)}</button></div>`).join('') : '<div class="hint">Noch keine Vorlagen. Gestalte eine Seite (z. B. Stundeneinstieg) und speichere sie hier.</div>'}`;
    b.querySelector('.sv').onclick = () => {
      const nm = b.querySelector('.nm').value.trim() || ('Vorlage ' + (V.length + 1));
      if (P().objs.some(o => o.t === 'img') || P().bgImg) { toast('Seiten mit Bildern oder PDF lassen sich nicht als Vorlage speichern', 4000); return }
      V.push({ n: nm, bg: P().bg, objs: JSON.parse(JSON.stringify(P().objs)) }); store.set('vorlagen', V); toast('Vorlage gespeichert'); draw();
    };
    b.querySelectorAll('[data-a]').forEach(x => x.onclick = () => {
      const v = V[+x.dataset.i];
      if (x.dataset.a === 'del') { V.splice(+x.dataset.i, 1); store.set('vorlagen', V); draw() }
      else { S.pages.splice(S.cur + 1, 0, mkPage(v.bg, JSON.parse(JSON.stringify(v.objs)))); setPage(S.cur + 1) }
    });
  };
  draw();
});

/* Hilfe */
add('hilfe', '❓', 'Hilfe', 'Material', b => {
  const R = [['← →  /  Bild ↑↓', 'Seite wechseln'], ['Strg + Z / Strg + Y', 'Rückgängig / Wiederholen'], ['Entf', 'ausgewähltes Objekt löschen'], ['Esc', 'Auswahl aufheben, Menüs schließen'], ['F11', 'Vollbild (Windows-App)'], ['Formen → Tabelle', 'Rechteck aufziehen; Doppelklick in eine Zelle zum Beschriften'], ['Geometrie → Zirkel', 'vom Mittelpunkt aus ziehen: Kreis in Bleistift-Grau'], ['Geometrie → Lineal / Geodreieck', 'Stift an der Kante entlang ziehen: dünne graue gerade Linie'], ['Abdecken → Abdeckung', 'Rechteck aufziehen; antippen deckt auf'], ['Abdecken → Lupe / Spot', 'Kreisfenster verschieben; + und − Größe, 2× Vergrößerung, Spot dunkelt die Umgebung ab'], ['Hilfsmittel → Gerade Linie', 'Stift am Ende kurz ruhig halten'], ['Hilfsmittel → Mehrfach-Touch', 'mehrere Finger zeichnen, jeder in eigener Farbe'], ['Lineal „cm“', 'Länge am Board nachmessen und kalibrieren'], ['Auswahl → Sperren', 'Objekt fixieren (Seiten-Menü: Alles entsperren)'], ['Widgets', 'Fenster verschieben, Ecke unten rechts = Größe']];
  b.innerHTML = `<table class="hl-t">${R.map(([a, c]) => `<tr><td>${esc(a)}</td><td>${esc(c)}</td></tr>`).join('')}</table>`;
});

/* Geodreieck (verschiebbar, drehbar; Maße nach der Lineal-Kalibrierung) */
const geo = h('<div id="geo"></div>');
stage.appendChild(geo);
let grot = 0;
function buildGeo() {
  const px = pxmmGet(), Wd = Math.round(160 * px) + 8, Hd = Math.round(80 * px) + 8, cx = Wd / 2, by = Hd - 4, R = 56 * px;
  let s = `<polygon points="4,${by} ${Wd - 4},${by} ${cx},4" fill="rgba(120,190,255,.3)" stroke="#2b5f8a" stroke-width="2"/>`;
  for (let i = 0; i <= 160; i++) { const x = 4 + i * px, len = i % 10 === 0 ? 16 : i % 5 === 0 ? 11 : 7; s += `<line x1="${x}" y1="${by}" x2="${x}" y2="${by - len}" stroke="#123" stroke-width="${i % 10 === 0 ? 1.4 : .8}"/>`; if (i % 10 === 0 && i > 0 && i < 160) s += `<text x="${x}" y="${by - 20}" font-size="11" text-anchor="middle" fill="#123">${i / 10}</text>` }
  for (let d = 0; d <= 180; d++) {
    const a = d * Math.PI / 180, len = d % 10 === 0 ? 12 : d % 5 === 0 ? 8 : 4, x1 = cx + R * Math.cos(a), y1 = by - R * Math.sin(a), x2 = cx + (R - len) * Math.cos(a), y2 = by - (R - len) * Math.sin(a);
    s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#123" stroke-width="${d % 10 === 0 ? 1.3 : .7}"/>`;
    if (d % 10 === 0) { const tx = cx + (R - 24) * Math.cos(a), ty = by - (R - 24) * Math.sin(a) + 4; s += `<text x="${tx}" y="${ty}" font-size="10" text-anchor="middle" fill="#123">${d}</text>`; const ux = cx + (R - 38) * Math.cos(a), uy = by - (R - 38) * Math.sin(a) + 4; s += `<text x="${ux}" y="${uy}" font-size="9" text-anchor="middle" fill="#b03">${180 - d}</text>` }
  }
  s += `<line x1="${cx - 12}" y1="${by}" x2="${cx + 12}" y2="${by}" stroke="#b03" stroke-width="1.5"/><line x1="${cx}" y1="${by - 12}" x2="${cx}" y2="${by}" stroke="#b03" stroke-width="1.5"/>`;
  const btn = (dx, t, r) => `<button class="gb" style="left:${cx + dx - 19}px;bottom:${Math.round(R * .55)}px" data-r="${r}">${t}</button>`;
  geo.style.width = Wd + 'px'; geo.style.height = Hd + 'px';
  geo.innerHTML = `<svg width="${Wd}" height="${Hd}">${s}</svg>` + btn(-84, '−15°', -15) + btn(-42, '−1°', -1) + btn(0, '✕', 'x') + btn(42, '+1°', 1) + btn(84, '+15°', 15);
}
buildGeo(); window.__rebuildTri = buildGeo;
(() => {
  let d = null;
  geo.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; d = { x: e.clientX - geo.offsetLeft, y: e.clientY - geo.offsetTop }; geo.setPointerCapture(e.pointerId) });
  geo.addEventListener('pointermove', e => { if (!d) return; geo.style.left = e.clientX - d.x + 'px'; geo.style.top = e.clientY - d.y + 'px' });
  geo.addEventListener('pointerup', () => d = null);
  geo.addEventListener('click', e => { const bt = e.target.closest('button'); if (!bt) return; if (bt.dataset.r === 'x') geo.style.display = 'none'; else { grot += +bt.dataset.r; geo.style.transform = `rotate(${grot}deg)` } });
  $('#tri').onclick = () => { document.querySelectorAll('.pop').forEach(p => p.classList.remove('show')); geo.style.display = geo.style.display === 'block' ? 'none' : 'block' };
})();

/* Lupe und Spot: ein bewegliches Kreisfenster vergrößert den Bereich darunter; „Spot“ dunkelt zusätzlich die Umgebung ab */
(() => {
  const ZS = [1, 1.5, 2, 3, 4];
  const lens = h('<div id="lens"><canvas></canvas><div class="lt"><button data-a="m" title="Kleiner">−</button><button data-a="p" title="Größer">+</button><button data-a="z" title="Vergrößerung wechseln">2×</button><button data-a="d" title="Umgebung abdunkeln (Spot)">Spot</button><button data-a="x" title="Schließen" aria-label="Schließen">✕</button></div></div>');
  const dim = h('<div id="dim"></div>');
  wrap.append(dim, lens);
  const lcv = lens.querySelector('canvas'), lc = lcv.getContext('2d');
  const LS = { on: false, cx: 0, cy: 0, D: 320, zi: 2, dim: false, dirty: true };
  const draw = () => {
    const wW = wrap.clientWidth, wH = wrap.clientHeight, D = LS.D, dpr = window.devicePixelRatio || 1, pw = Math.round(D * dpr);
    LS.cx = clamp(LS.cx, 0, wW); LS.cy = clamp(LS.cy, 0, wH);
    if (lcv.width !== pw) { lcv.width = lcv.height = pw }
    const z = ZS[LS.zi], sw = D / (scale * z), sx = LS.cx / scale - sw / 2, sy = LS.cy / scale - sw / 2;
    lc.fillStyle = '#fff'; lc.fillRect(0, 0, pw, pw);
    try { lc.drawImage(cv, sx, sy, sw, sw, 0, 0, pw, pw) } catch (e) {}
    lens.style.cssText = `display:block;left:${LS.cx - D / 2}px;top:${LS.cy - D / 2}px;width:${D}px;height:${D}px`;
    dim.style.display = LS.dim ? 'block' : 'none';
    if (LS.dim) dim.style.background = `radial-gradient(circle at ${LS.cx}px ${LS.cy}px,transparent ${D / 2}px,rgba(8,12,28,.84) ${D / 2 + 1}px)`;
    lens.querySelector('[data-a=z]').textContent = z + '×'; lens.querySelector('[data-a=d]').classList.toggle('on', LS.dim);
  };
  const close = () => { LS.on = false; lens.style.display = 'none'; dim.style.display = 'none' };
  const open = d => {
    if (LS.on && LS.dim === d) { close(); return }
    if (!LS.on) { LS.cx = wrap.clientWidth / 2; LS.cy = wrap.clientHeight / 2; LS.zi = d ? 0 : 2 } else LS.zi = d ? 0 : Math.max(LS.zi, 2);
    LS.on = true; LS.dim = d; LS.dirty = true; draw();
  };
  window.__lens = dirtyFrame => { if (LS.on && (dirtyFrame || LS.dirty)) { LS.dirty = false; draw() } };
  let drag = null;
  lens.addEventListener('pointerdown', e => { if (e.target.closest('.lt')) return; drag = { dx: e.clientX - (wrap.getBoundingClientRect().left + LS.cx), dy: e.clientY - (wrap.getBoundingClientRect().top + LS.cy) }; lens.setPointerCapture(e.pointerId); e.stopPropagation() });
  lens.addEventListener('pointermove', e => { if (!drag) return; const r = wrap.getBoundingClientRect(); LS.cx = e.clientX - r.left - drag.dx; LS.cy = e.clientY - r.top - drag.dy; LS.dirty = true });
  lens.addEventListener('pointerup', () => drag = null); lens.addEventListener('pointercancel', () => drag = null);
  lens.querySelector('.lt').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return; const a = b.dataset.a;
    if (a === 'x') close(); else if (a === 'm') LS.D = Math.max(160, LS.D - 40); else if (a === 'p') LS.D = Math.min(640, LS.D + 40);
    else if (a === 'z') LS.zi = (LS.zi + 1) % ZS.length; else if (a === 'd') LS.dim = !LS.dim;
    LS.dirty = true; if (LS.on) draw();
  });
  const hidePops = () => document.querySelectorAll('.pop').forEach(p => p.classList.remove('show'));
  $('#lensb').onclick = () => { hidePops(); open(false) };
  $('#spotb').onclick = () => { hidePops(); open(true) };
})();

/* ---------- Menü in der Leiste ---------- */
const GROUPS = ['Klasse', 'Zeit', 'Werkzeuge', 'Material'];
ICONS.widgets = '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/><path d="M17.5 14v7"/><path d="M14 17.5h7"/>';
const pop = h(`<div class="pop" id="widpop"><input class="ws" type="search" placeholder="Widget suchen …" aria-label="Widget suchen"><div class="wlist"></div><div class="wlay"></div></div>`);
const itemHtml = d => `<button class="wi" data-w="${d.id}"><span class="fv ${store.get('favs', []).includes(d.id) ? 'on' : ''}" data-fav="${d.id}" role="button" aria-label="Favorit" title="Als Favorit merken">★</span><span class="em">${d.em}</span><small>${esc(d.title)}</small></button>`;
function renderMenu() {
  const q = pop.querySelector('.ws').value.trim().toLowerCase(), favs = store.get('favs', []), rec = store.get('recent', []);
  const by = ids => ids.map(id => WG.find(d => d.id === id)).filter(Boolean);
  let html;
  if (q) { const m = WG.filter(d => (d.title + ' ' + d.group).toLowerCase().includes(q)); html = m.length ? `<div class="wgrid">${m.map(itemHtml).join('')}</div>` : '<div class="hint" style="padding:8px">Kein Widget gefunden.</div>' }
  else {
    const fav = by(favs), rest = by(rec).filter(d => !favs.includes(d.id)).slice(0, 4);
    html = (fav.length ? `<h4>★ Favoriten</h4><div class="wgrid">${fav.map(itemHtml).join('')}</div>` : '') + (rest.length ? `<h4>Zuletzt benutzt</h4><div class="wgrid">${rest.map(itemHtml).join('')}</div>` : '')
      + GROUPS.map(g => `<h4>${g}</h4><div class="wgrid">${WG.filter(d => d.group === g).map(itemHtml).join('')}</div>`).join('');
  }
  pop.querySelector('.wlist').innerHTML = html;
  // Anordnungen: offene Widgets samt Position speichern und mit einem Klick wieder öffnen
  const L = store.get('layouts', []);
  pop.querySelector('.wlay').innerHTML = `<h4 style="flex-basis:100%">Anordnungen</h4>${L.map((l, i) => `<button data-lay="${i}" title="Anordnung öffnen">${esc(l.n)}</button><button data-laydel="${i}" aria-label="Anordnung löschen" title="Löschen" style="padding:0 8px">${ic('close', 14)}</button>`).join('')}<input class="ln" placeholder="Name, z. B. Morgenkreis"><button class="ls" title="Aktuell geöffnete Widgets als Anordnung speichern">Speichern</button>`;
  menuState();
}
pop.querySelector('.ws').addEventListener('input', renderMenu);
const saveLayout = () => {
  const n = pop.querySelector('.ln').value.trim() || ('Anordnung ' + (store.get('layouts', []).length + 1));
  const ws = Object.entries(openW).map(([id, o]) => ({ id, x: parseFloat(o.el.style.left), y: parseFloat(o.el.style.top), z: parseFloat(o.el.querySelector('.wb').style.zoom) || 1, min: o.el.classList.contains('min') }));
  if (!ws.length) { toast('Zuerst Widgets öffnen und anordnen'); return }
  const L = store.get('layouts', []); L.push({ n, ws }); store.set('layouts', L); toast('Anordnung „' + n + '“ gespeichert'); renderMenu();
};
const loadLayout = i => {
  const l = store.get('layouts', [])[i]; if (!l) return;
  Object.keys(openW).forEach(closeW);
  const all = store.get('wpos', {}); l.ws.forEach(w => { all[w.id] = { x: w.x, y: w.y, z: w.z } }); store.set('wpos', all);
  l.ws.forEach(w => { const d = WG.find(x => x.id === w.id); if (d) { openWidget(d); if (w.min && openW[w.id]) openW[w.id].el.classList.add('min') } });
};
const btn = h(`<button data-pop="widpop">${ic('widgets')}<small>Widgets</small></button>`);
const aid = document.querySelector('[data-pop="aidpop"]');
aid.parentNode.insertBefore(btn, aid);

/* Schnellzugriff: drei Internet-Seiten direkt in der Werkzeugleiste (öffnen in neuem Browserfenster) */
Object.assign(ICONS, {
  fish: '<path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6Z"/><path d="M18 12v.5"/><path d="M7 10.67C7 8 5.58 5.97 2.73 5.5c-1 1.5-1 5 .23 6.5-1.24 1.5-1.24 5-.23 6.5C5.58 18.03 7 16 7 13.33"/>',
  kanban: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 7v7"/><path d="M12 7v4"/><path d="M16 7v9"/>',
  bookOpen: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>'
});
const QL = [['shy', 'shysafari.png', 'Shy Safari', 'https://www.shysafari.com/'], ['task', 'taskcards.png', 'TaskCards', 'https://www.taskcards.de/'], ['bibox', 'bibox.png', 'Bibox (Westermann)', 'https://bibox2.westermann.de/']];
const qlUrl = k => (store.get('quicklinks', {})[k]) || QL.find(x => x[0] === k)[3];
const lgrp = h(`<div class="grp" id="linksgrp">${QL.map(([k, i, n]) => `<button data-link="${k}" title="${esc(n)} – Rechtsklick oder langes Drücken: Adresse ändern" aria-label="${esc(n)}"><img src="icons/${i}" alt=""><small>${esc(n.split(' ')[0])}</small></button>`).join('')}</div>`);
btn.parentNode.parentNode.insertBefore(lgrp, btn.parentNode);
const openExt = url => { if (!window.open(url, '_blank', 'noopener,width=1280,height=860')) toast('Pop-up wurde blockiert – bitte Pop-ups für diese Seite erlauben', 4000) };
lgrp.addEventListener('click', e => { const b = e.target.closest('[data-link]'); if (b) { document.querySelectorAll('.pop').forEach(p => p.classList.remove('show')); openExt(qlUrl(b.dataset.link)) } });
lgrp.addEventListener('contextmenu', e => {   // Adresse ändern (nur auf diesem Gerät gespeichert, z. B. eigenes TaskCards-Board)
  const b = e.target.closest('[data-link]'); if (!b) return; e.preventDefault();
  const k = b.dataset.link, q = QL.find(x => x[0] === k), cur = qlUrl(k);
  const v = prompt(`Adresse für „${q[2]}“ (leer lassen = Standard):`, cur); if (v == null) return;
  const all = store.get('quicklinks', {}), t = v.trim();
  if (!t) delete all[k]; else if (/^https?:\/\//i.test(t)) all[k] = t; else { toast('Bitte eine Adresse mit https:// eingeben', 3500); return }
  store.set('quicklinks', all); toast('Adresse gespeichert');
});
$('#bar').appendChild(pop);
const menuState = () => pop.querySelectorAll('[data-w]').forEach(x => x.classList.toggle('on', !!openW[x.dataset.w]));
pop.addEventListener('click', e => {
  const fv = e.target.closest('[data-fav]');
  if (fv) { e.stopPropagation(); const f = store.get('favs', []), id = fv.dataset.fav, i = f.indexOf(id); if (i >= 0) f.splice(i, 1); else f.push(id); store.set('favs', f); renderMenu(); return }
  const lo = e.target.closest('[data-lay]'); if (lo) { pop.classList.remove('show'); loadLayout(+lo.dataset.lay); return }
  const ld = e.target.closest('[data-laydel]'); if (ld) { const L = store.get('layouts', []); L.splice(+ld.dataset.laydel, 1); store.set('layouts', L); renderMenu(); return }
  if (e.target.closest('.ls')) { saveLayout(); return }
  const t = e.target.closest('[data-w]'); if (!t) return;
  const d = WG.find(x => x.id === t.dataset.w); if (d) { pop.classList.remove('show'); openWidget(d) }
});
btn.addEventListener('click', () => { pop.querySelector('.ws').value = ''; renderMenu() });
renderMenu();
window.__widgets = { openWidget, W: WG, closeW };
// Die schmale Leiste zeigt nur Symbole: Beschriftung als Tooltip und für Screenreader
document.querySelectorAll('#bar>.grp>button').forEach(b => {
  const s = b.querySelector('small'); if (!s || b.title) return;
  const t = b.id === 'dock' ? 'Leiste links/rechts' : s.textContent;
  b.title = t; if (!b.getAttribute('aria-label')) b.setAttribute('aria-label', t);
});

/* ---------- Verknüpfung mit dem LehrerPlaner (nur in der Windows-App) ---------- */
const ctx = { klasse: '', thema: '' };
const showStunde = () => { window.__kopfText = [ctx.klasse, ctx.thema].filter(Boolean).join(' · '); dirty = true; };
const waitFor = async (fn, ms = 8000) => { const t0 = Date.now(); while (!fn() && Date.now() - t0 < ms) await new Promise(r => setTimeout(r, 100)); return fn() };
window.__planer = {
  async apply(o) {
    await waitFor(() => window.__tafel);
    if (Array.isArray(o.namen) && o.namen.length) {
      store.set('klasse', o.namen);
      Object.keys(openW).forEach(closeW); // offene Widgets lesen die neue Klassenliste beim nächsten Öffnen
    }
    ctx.klasse = o.klasse || ctx.klasse; ctx.thema = o.thema || '';
    showStunde();
    if (Array.isArray(o.phasen) && o.phasen.length) {   // Stundenphasen aus dem Planer: je Phase eine Seite
      const ink = S.theme === 'board' ? '#ffffff' : '#111111';
      const wrapLines = (t, n) => { const out = []; String(t || '').split(/\r?\n/).forEach(p => { let l = ''; p.split(/\s+/).filter(Boolean).forEach(wd => { if ((l + ' ' + wd).trim().length > n) { out.push(l); l = wd } else l = (l + ' ' + wd).trim() }); out.push(l) }); return out.filter((l, i, a) => l || (i && a[i - 1])).slice(0, 9) };
      const pages = o.phasen.map(([titel, text]) => {
        const objs = [{ t: 'text', x: 110, y: 130, s: String(titel), c: ink, size: 100, w: 1 }];
        const ls = wrapLines(text, 52); if (ls.length) objs.push({ t: 'text', x: 110, y: 290, s: ls.join('\n'), c: ink, size: 52, w: 1 });
        return mkPage('plain', objs);
      });
      const first = (S.pages.length === 1 && !P().objs.length && !P().bgImg) ? 0 : S.pages.length;
      if (first === 0) S.pages = pages; else S.pages.push(...pages);
      setPage(first);
    }
    if (o.tafel) { try { restore(o.tafel); toast('Tafel aus dem Planer geöffnet') } catch (e) { toast('Tafel konnte nicht geöffnet werden', 4000) } }
    else if (o.klasse) toast('Klasse ' + o.klasse + (o.namen ? ' – ' + o.namen.length + ' Kinder geladen' : ''), 3500);
  }
};
if (window.planer && window.planer.speichern) {
  // In der Windows-App speichert „Speichern“ direkt im Tafel-Ordner (Dokumente\MeineTafel\Tafelbilder\<Klasse>), wo der LehrerPlaner sie findet
  $('#fsave').onclick = async () => {
    $('#filepop').classList.remove('show');
    const c = document.createElement('canvas'); c.width = W; c.height = H; render(c.getContext('2d'), P(), false);
    const name = ctx.thema || 'Tafel';
    const r = await window.planer.speichern({ klasse: ctx.klasse, name, json: serialize(), png: c.toDataURL('image/png') });
    toast(r.ok ? 'Gespeichert: Dokumente\\MeineTafel\\Tafelbilder\\' + (ctx.klasse || 'Allgemein') : 'Speichern nicht möglich: ' + r.fehler, 4500);
  };
}
})();
