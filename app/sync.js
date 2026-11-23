// Kopiert die Web-Version (../docs) in den App-Ordner (www), damit beide Versionen denselben Code nutzen.
const fs = require('fs'), path = require('path');
const src = path.join(__dirname, '..', 'docs'), dst = path.join(__dirname, 'www');
fs.rmSync(dst, { recursive: true, force: true });
fs.cpSync(src, dst, { recursive: true, filter: p => !/[\\/]sw\.js$/.test(p) && !/\.nojekyll$/.test(p) });
console.log('docs -> app/www kopiert');
