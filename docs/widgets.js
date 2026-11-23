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
#widgets{position:absolute;inset:0;pointer-events:none}
.wg{position:absolute;pointer-events:auto;background:rgba(13,17,31,.92);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);color:#fff;border:1px solid rgba(255,255,255,.14);border-radius:22px;box-shadow:var(--shadow);overflow:hidden;touch-action:none;-webkit-user-select:none;user-select:none}
.wg .wh{display:flex;align-items:center;gap:8px;padding:6px 6px 6px 16px;cursor:grab;font-weight:600;font-size:14px;color:#cfd5ea;touch-action:none}
.wg .wh span{flex:1;white-space:nowrap}
.wg .wh .wx{min-width:38px;min-height:38px;width:38px;height:38px;padding:0;border-radius:50%}
.wg .wb{padding:4px 16px 18px}
.wg .wz{position:absolute;right:0;bottom:0;width:30px;height:30px;cursor:nwse-resize;touch-action:none;background:linear-gradient(135deg,transparent 52%,rgba(255,255,255,.45) 52% 60%,transparent 60% 72%,rgba(255,255,255,.45) 72% 80%,transparent 80%)}
.wg button{color:#fff;background:rgba(255,255,255,.1);min-height:44px;min-width:44px;font-size:15px;font-weight:600;flex-direction:row;padding:0 14px;border-radius:12px;gap:6px}
.wg button small{color:inherit;font-size:13px}
@media(hover:hover){.wg button:hover:not(:disabled):not(.on){background:rgba(255,255,255,.2)}}
.wg button.big{background:linear-gradient(135deg,var(--accent),var(--accent2));min-height:52px;font-size:17px;padding:0 22px}
.wg button.on{background:linear-gradient(135deg,var(--accent),var(--accent2))}
.wg .ic{width:20px;height:20px}
.wg input,.wg textarea,.wg select{font:inherit;font-size:15px;background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:10px;padding:8px 10px;-webkit-user-select:text;user-select:text;outline:none;min-width:0}
.wg input:focus,.wg textarea:focus{border-color:#a5b4fc}
.wg select option{color:#111}
.wg textarea{width:100%;resize:vertical}
.wg .row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px}
.wg .row.c{justify-content:center}
.wg .lab{font-size:13px;color:#aab2cc}
.wg .num{font-variant-numeric:tabular-nums;font-weight:700}
.wg details{margin-top:12px;font-size:14px;color:#cfd5ea}
.wg summary{cursor:pointer;padding:4px 0}
.wg .hint{font-size:12.5px;color:#9aa2bb;margin-top:8px;max-width:330px}
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
.zf-name{min-width:300px;min-height:92px;display:flex;align-items:center;justify-content:center;text-align:center;font-size:44px;font-weight:700;background:rgba(255,255,255,.08);border-radius:18px;padding:10px 16px}
.gr-wrap{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px;max-width:640px}
.gr-g{background:rgba(255,255,255,.08);border-radius:14px;padding:10px 14px;min-width:130px;border-top:5px solid var(--c)}
.gr-g b{display:block;font-size:13px;color:#cfd5ea;margin-bottom:4px}.gr-g div{font-size:18px;line-height:1.5}
/* Würfel */
.dc{display:flex;gap:14px;flex-wrap:wrap;justify-content:center;max-width:420px;min-height:100px;margin-top:6px}
.die{width:92px;height:92px;border-radius:18px;background:#fff;color:#111;display:flex;align-items:center;justify-content:center;font-size:40px;font-weight:800;box-shadow:0 4px 12px rgba(0,0,0,.4);cursor:pointer}
.die.pips{display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);padding:12px;gap:2px;align-items:stretch;justify-items:stretch}
.die.pips i{border-radius:50%;background:#111;margin:3px}
.die.rolling{animation:wob .12s infinite alternate}
@keyframes wob{to{transform:rotate(8deg) scale(.96)}}
/* Lärm */
.lm-bar{position:relative;height:34px;border-radius:17px;background:rgba(255,255,255,.1);overflow:hidden;min-width:330px}
.lm-fill{position:absolute;left:0;top:0;bottom:0;width:0;background:linear-gradient(90deg,#22c55e 0%,#eab308 60%,#ef4444 100%);background-size:330px 100%;border-radius:17px}
.lm-th{position:absolute;top:0;bottom:0;width:3px;background:#fff}
.lm-st{font-size:30px;font-weight:700;text-align:center;margin-top:12px}
.wg.alarm{box-shadow:0 0 0 4px #ef4444,var(--shadow)}
/* Zeitscheibe */
.vt svg{display:block;margin:0 auto}
/* Punkte */
.pt{display:flex;gap:12px;flex-wrap:wrap;max-width:640px}
.pt-t{background:rgba(255,255,255,.08);border-radius:16px;padding:12px;text-align:center;min-width:140px;border-top:6px solid var(--c)}
.pt-t input{width:120px;text-align:center;font-weight:600}
.pt-t .s{font-size:64px;font-weight:800;line-height:1.1;font-variant-numeric:tabular-nums}
/* Abstimmung */
.ab-r{display:flex;gap:8px;align-items:center;margin-top:8px}
.ab-r input{width:110px}
.ab-b{flex:1;min-width:180px;height:38px;background:rgba(255,255,255,.1);border-radius:10px;position:relative;overflow:hidden}
.ab-b i{position:absolute;left:0;top:0;bottom:0;background:var(--c);border-radius:10px;transition:width .25s}
.ab-b b{position:absolute;inset:0;display:flex;align-items:center;padding-left:12px;font-size:22px}
/* Countdown */
.cd-n{font-size:96px;font-weight:800;line-height:1;text-align:center;font-variant-numeric:tabular-nums}
.cd-l{text-align:center;font-size:22px;font-weight:600;margin-top:4px}
/* Stundenplan */
.sp{border-collapse:separate;border-spacing:4px}
.sp th{font-size:14px;color:#cfd5ea;padding:4px}.sp th.today{color:#fff;background:var(--accent);border-radius:8px}
.sp td.h{font-weight:700;color:#aab2cc;text-align:center}
.sp input{width:112px;padding:6px 8px;font-size:14px}.sp input.today{background:rgba(79,70,229,.35)}
/* Kamera */
.cam video{display:block;width:480px;height:270px;background:#000;border-radius:14px;object-fit:contain}
/* Stoppuhr */
.sw-t{font-size:64px;font-weight:700;text-align:center;font-variant-numeric:tabular-nums;min-width:300px}
.sw-l{font-size:15px;color:#cfd5ea;margin-top:8px;line-height:1.5;text-align:center}
/* Sticker */
.st-g{display:grid;grid-template-columns:repeat(6,64px);gap:6px}
.st-g button{font-size:34px;min-height:64px;padding:0;line-height:1}
/* Links */
.lk-l{display:flex;flex-direction:column;gap:8px;min-width:300px}
.lk-r{display:flex;gap:6px}
.lk-r a{flex:1;display:flex;align-items:center;gap:10px;min-height:48px;padding:0 16px;border-radius:12px;background:rgba(255,255,255,.1);color:#fff;text-decoration:none;font-weight:600;font-size:16px}
.lk-r a:hover{background:rgba(255,255,255,.2)}
.gp-t{font-size:28px;font-weight:700;text-align:center;max-width:340px;line-height:1.3;min-height:76px;display:flex;align-items:center;justify-content:center}
.emb iframe{width:640px;height:400px;border:0;border-radius:12px;background:#fff;display:block;margin-top:10px}
/* Feier */
.fete{position:absolute;inset:0;z-index:50;background:rgba(10,14,30,.55);display:flex;align-items:center;justify-content:center;text-align:center;pointer-events:auto;cursor:pointer;border-radius:16px}
.fete canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.fete div{position:relative;color:#fff;font-size:min(8vw,110px);font-weight:800;line-height:1.15;text-shadow:0 6px 30px rgba(0,0,0,.6);padding:0 5%}
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
  const w = h(`<div class="wg"><div class="wh">${def.em}<span>${esc(def.title)}</span><button class="wx" aria-label="Schließen">${ic('close', 18)}</button></div><div class="wb"></div><div class="wz" title="Größe ändern"></div></div>`);
  const body = w.querySelector('.wb'), hd = w.querySelector('.wh'), zh = w.querySelector('.wz');
  let z = defZoom() * (def.zoom || 1);
  body.style.zoom = z;
  w.style.left = (70 + (n % 7) * 36) + 'px'; w.style.top = (60 + (n % 7) * 30) + 'px';
  host.appendChild(w); front(w);
  const o = openW[def.id] = { el: w };
  o.cleanup = def.build(body, w) || null;
  w.addEventListener('pointerdown', () => front(w), true);
  w.addEventListener('keydown', e => e.stopPropagation());
  w.querySelector('.wx').onclick = () => closeW(def.id);
  // verschieben
  hd.addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return;
    const r = w.getBoundingClientRect(), hr = host.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
    hd.setPointerCapture(e.pointerId); hd.style.cursor = 'grabbing';
    const mv = ev => {
      w.style.left = clamp(ev.clientX - hr.left - dx, 80 - r.width, host.clientWidth - 80) + 'px';
      w.style.top = clamp(ev.clientY - hr.top - dy, 0, host.clientHeight - 44) + 'px';
    };
    const up = () => { hd.removeEventListener('pointermove', mv); hd.removeEventListener('pointerup', up); hd.removeEventListener('pointercancel', up); hd.style.cursor = '' };
    hd.addEventListener('pointermove', mv); hd.addEventListener('pointerup', up); hd.addEventListener('pointercancel', up);
  });
  // Größe ändern (skaliert den Inhalt)
  zh.addEventListener('pointerdown', e => {
    e.stopPropagation(); zh.setPointerCapture(e.pointerId);
    const r = w.getBoundingClientRect(), z0 = z;
    const mv = ev => { z = clamp(z0 * Math.max(120, ev.clientX - r.left) / r.width, .5, 3); body.style.zoom = z };
    const up = () => { zh.removeEventListener('pointermove', mv); zh.removeEventListener('pointerup', up); zh.removeEventListener('pointercancel', up) };
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
  let T = [{ n: 'Team 1', s: 0 }, { n: 'Team 2', s: 0 }];
  const draw = () => {
    b.innerHTML = `<div class="pt">${T.map((t, i) => `<div class="pt-t" style="--c:${COL[i]}"><input data-i="${i}" value="${esc(t.n)}"><div class="s">${t.s}</div><div class="row c"><button data-d="-1" data-i="${i}">−</button><button class="big" data-d="1" data-i="${i}">+</button></div></div>`).join('')}</div><div class="row"><button class="ad">+ Team</button><button class="rm">− Team</button><button class="z">Alle auf 0</button></div>`;
    b.querySelectorAll('input').forEach(x => x.oninput = () => T[+x.dataset.i].n = x.value);
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
  let O = [{ n: 'Ja', c: 0 }, { n: 'Nein', c: 0 }];
  const draw = () => {
    const tot = O.reduce((a, o) => a + o.c, 0) || 1;
    b.innerHTML = O.map((o, i) => `<div class="ab-r" style="--c:${COL[i]}"><input data-i="${i}" value="${esc(o.n)}"><div class="ab-b"><i style="width:${o.c / tot * 100}%"></i><b>${o.c}</b></div><button class="big" data-d="1" data-i="${i}">+</button><button data-d="-1" data-i="${i}">−</button></div>`).join('') + `<div class="row"><button class="ad">+ Antwort</button><button class="rm">− Antwort</button><button class="z">Zurücksetzen</button></div>`;
    b.querySelectorAll('input').forEach(x => x.oninput = () => O[+x.dataset.i].n = x.value);
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
  b.innerHTML = `<div class="vt"><svg viewBox="-110 -110 220 220" width="250" height="250"><circle r="104" fill="rgba(255,255,255,.1)"/><path class="pie" fill="#ef4444"/><text class="tx" text-anchor="middle" y="14" font-size="42" font-weight="800" fill="#fff" style="paint-order:stroke;stroke:rgba(0,0,0,.65);stroke-width:6px"></text></svg></div><div class="row c pre">${[1, 2, 5, 10, 15, 20, 30].map(m => `<button data-m="${m}">${m}</button>`).join('')}</div><div class="row c"><label class="lab">Minuten <input type="number" class="cu" min="1" max="180" style="width:74px"></label><button class="big go">▶ Start</button><button class="rs" aria-label="Zurücksetzen">↺</button></div>`;
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
  let ac = null, stream = null, raf = 0, lvl = 0, over = 0;
  const setTh = () => thEl.style.left = th.value + '%'; th.oninput = setTh; setTh();
  const stop = () => { cancelAnimationFrame(raf); try { stream && stream.getTracks().forEach(t => t.stop()) } catch (e) {} try { ac && ac.close() } catch (e) {} ac = stream = null; fill.style.width = '0'; st.textContent = 'Mikrofon aus'; win.classList.remove('alarm'); go.textContent = '🎤 Start' };
  go.onclick = async () => {
    if (ac) { stop(); return }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      ac = new (window.AudioContext || window.webkitAudioContext)();
      const an = ac.createAnalyser(); an.fftSize = 1024; ac.createMediaStreamSource(stream).connect(an);
      const buf = new Uint8Array(an.fftSize); go.textContent = '■ Stopp'; over = 0;
      const tick = () => {
        an.getByteTimeDomainData(buf); let s = 0; for (const v of buf) { const x = (v - 128) / 128; s += x * x }
        const db = 20 * Math.log10(Math.sqrt(s / buf.length) + 1e-6), now = clamp((db + 60) / 50 * 100, 0, 100);
        lvl = Math.max(now, lvl * .93); fill.style.width = lvl + '%';
        over = lvl > +th.value ? over + 1 : Math.max(0, over - 2);
        const loud = over > 20;
        win.classList.toggle('alarm', loud);
        st.textContent = loud ? '🔴 Zu laut!' : lvl > +th.value * .75 ? '🟡 Etwas laut' : '🟢 Schön leise';
        raf = requestAnimationFrame(tick);
      };
      tick();
    } catch (e) { toast('Mikrofon nicht erlaubt oder nicht gefunden', 4000); stop() }
  };
  return stop;
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
  b.innerHTML = `<div class="row" style="margin-top:0"><button class="big ttt">⭕ Tic Tac Toe</button><button class="big gal">🔤 Galgenmännchen</button></div><div class="hint">Legt eine neue Seite mit der Vorlage an.</div>`;
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
});

/* Gehirnpause */
add('gehirnpause', '🧠', 'Gehirnpause', 'Material', b => {
  const IDEAS = ['10 Hampelmänner', 'Alle strecken sich so hoch wie möglich', 'Schulterkreisen: 5 vorwärts, 5 rückwärts', 'Tief ein- und ausatmen – 5 Mal', 'Rechte Hand zum linken Knie, dann wechseln', 'Auf einem Bein stehen – 10 Sekunden', 'Hände kräftig ausschütteln', 'Rückwärts zählen von 20', 'Nase und Ohr wechseln: Rechts Nase, links Ohr … und tauschen', 'Augen schließen und 30 Sekunden still lauschen', 'Wie ein Tier durch die Klasse laufen (leise!)', '10 Kniebeugen', 'Mit dem Finger eine liegende Acht in die Luft malen', 'Massiere dir sanft die Schläfen', 'Alle klatschen den Rhythmus nach, den die Lehrkraft vorgibt'];
  b.innerHTML = `<div class="gp-t"></div><div class="row c"><button class="big go">💡 Neue Idee</button></div>`;
  const t = b.querySelector('.gp-t'); let last = -1;
  const next = () => { let i; do { i = Math.floor(Math.random() * IDEAS.length) } while (i === last); last = i; t.textContent = IDEAS[i] };
  b.querySelector('.go').onclick = next; next();
});

/* ---------- Menü in der Leiste ---------- */
const GROUPS = ['Klasse', 'Zeit', 'Werkzeuge', 'Material'];
ICONS.widgets = '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/><path d="M17.5 14v7"/><path d="M14 17.5h7"/>';
const pop = h(`<div class="pop" id="widpop">${GROUPS.map(g => `<h4>${g}</h4>${WG.filter(d => d.group === g).map(d => `<button data-w="${d.id}"><span style="font-size:24px;line-height:1">${d.em}</span><small>${esc(d.title)}</small></button>`).join('')}`).join('')}</div>`);
const btn = h(`<button data-pop="widpop">${ic('widgets')}<small>Widgets</small></button>`);
const aid = document.querySelector('[data-pop="aidpop"]');
aid.parentNode.insertBefore(btn, aid);
$('#bar').appendChild(pop);
const menuState = () => pop.querySelectorAll('[data-w]').forEach(x => x.classList.toggle('on', !!openW[x.dataset.w]));
pop.addEventListener('click', e => {
  const t = e.target.closest('[data-w]'); if (!t) return;
  const d = WG.find(x => x.id === t.dataset.w); if (d) { pop.classList.remove('show'); openWidget(d) }
});
window.__widgets = { openWidget, W: WG, closeW };

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
    if (o.tafel) { try { restore(o.tafel); toast('Tafel aus dem Planer geöffnet') } catch (e) { toast('Tafel konnte nicht geöffnet werden', 4000) } }
    else if (o.klasse) toast('Klasse ' + o.klasse + (o.namen ? ' – ' + o.namen.length + ' Kinder geladen' : ''), 3500);
  }
};
if (window.planer && window.planer.speichern) {
  const b = h(`<button id="fplan">${ic('folderOpen')}<small>In den Planer legen</small></button>`);
  $('#filepop').appendChild(b);
  b.onclick = async () => {
    $('#filepop').classList.remove('show');
    const c = document.createElement('canvas'); c.width = W; c.height = H; render(c.getContext('2d'), P(), false);
    const name = ctx.thema || 'Tafel';
    const r = await window.planer.speichern({ klasse: ctx.klasse, name, json: serialize(), png: c.toDataURL('image/png') });
    toast(r.ok ? 'Im Planer abgelegt: ' + (ctx.klasse ? 'Klasse ' + ctx.klasse : 'Allgemein') : 'Ablegen nicht möglich: ' + r.fehler, 4000);
  };
}
})();
