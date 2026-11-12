/* v570 release contract: every popup on the shared sheet follows the theme. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const version=Number(read('VERSION').trim());
assert(version>=570);
assert(JSON.parse(read('src/css-order.json')).some(r=>r.path==='assets/css/300-v570-release.css'));
const css=read('assets/css/300-v570-release.css');
for(const s of ['.mf555-log-popup .mf555-log-sheet{background:var(--panel);color:var(--text)','.mf555-log-popup .mf555-log-head strong{color:var(--text)','.mf565-get .mf565-get-status .hint{'])
  assert(css.includes(s),'v570 css has '+s);
assert(read('index.html').includes(`mediaflow-v${version}.bundle.js`));
if(version===570){const wf=read('.github/workflows/publish-v570.yml');assert(wf.includes('gh release create 570')&&wf.includes('legacy/v/570'));}
assert(read('docs/release-v570.md').startsWith('## MediaFlow v570 Stable'));
assert(read('.github/workflows/deploy-pages.yml').includes('"Build archive and release MediaFlow v570"'));
console.log('v570 release contract passed');
