/* v579 release contract. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const version=Number(read('VERSION').trim());
assert(version>=579);
assert(JSON.parse(read('src/css-order.json')).some(r=>r.path==='assets/css/306-v579-release.css'));
assert(JSON.stringify(JSON.parse(read('src/js/runtime-order.json'))).includes('431-v579-quick-select-history-units.js'));
assert(read('src/js/components/203-v269-consumption-history-redesign.js').includes('window.MediaFlowV269Hooks='));
const js=read('src/js/components/431-v579-quick-select-history-units.js');
for(const s of ['App.mf579QuickSelect','MF579H.wrap(\'consumedLabel\'','v340RecentCard=function','App.v378QuickAdd=function','mf579NextPartText'])assert(js.includes(s),'v579 has '+s);
assert(read('src/js/components/427-v577-parts.js').includes('mf579-parts-head'));
assert(read('index.html').includes(`mediaflow-v${version}.bundle.js`));
if(version===579){const wf=read('.github/workflows/publish-v579.yml');assert(wf.includes('gh release create 579')&&wf.includes('legacy/v/579'));}
assert(read('docs/release-v579.md').startsWith('## MediaFlow v579 Stable'));
assert(read('.github/workflows/deploy-pages.yml').includes('"Build archive and release MediaFlow v579"'));
console.log('v579 release contract passed');
