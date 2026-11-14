/* v578 release contract: Batch Log rows keep their layout ("Log any title"). */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const version=Number(read('VERSION').trim());
assert(version>=578);
assert(JSON.parse(read('src/css-order.json')).some(r=>r.path==='assets/css/305-v578-release.css'));
const css=read('assets/css/305-v578-release.css');
for(const s of ['.batch-log-row .batch-selected-title','.v241-logged-cover-button','.batch-log-row>.mf577-parts{grid-column:1/-1'])assert(css.includes(s),'v578 css has '+s);
assert(read('src/js/components/427-v577-parts.js').includes('data-v225-iconified="1" class="mf577-chip'));
assert(read('index.html').includes(`mediaflow-v${version}.bundle.js`));
if(version===578){const wf=read('.github/workflows/publish-v578.yml');assert(wf.includes('gh release create 578')&&wf.includes('legacy/v/578'));}
assert(read('docs/release-v578.md').startsWith('## MediaFlow v578 Stable'));
assert(read('.github/workflows/deploy-pages.yml').includes('"Build archive and release MediaFlow v578"'));
console.log('v578 release contract passed');
