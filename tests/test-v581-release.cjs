/* v581 release contract. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const version=Number(read('VERSION').trim());
assert(version>=581);
assert(JSON.parse(read('src/css-order.json')).some(r=>r.path==='assets/css/308-v581-release.css'));
assert(JSON.stringify(JSON.parse(read('src/js/runtime-order.json'))).includes('434-v581-part-order.js'));
const js=read('src/js/components/434-v581-part-order.js');
for(const s of ['App.mf581MovePart','App.mf581SetPartPos','mf581-handle','v252EditorSeasonRowHtml=function'])assert(js.includes(s),'v581 has '+s);
assert(read('index.html').includes(`mediaflow-v${version}.bundle.js`));
if(version===581){const wf=read('.github/workflows/publish-v581.yml');assert(wf.includes('gh release create 581')&&wf.includes('legacy/v/581'));}
assert(read('docs/release-v581.md').startsWith('## MediaFlow v581 Stable'));
assert(read('.github/workflows/deploy-pages.yml').includes('"Build archive and release MediaFlow v581"'));
console.log('v581 release contract passed');
