/* v573 release contract: Batch Log date & time. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const version=Number(read('VERSION').trim());
assert(version>=573);
assert(JSON.parse(read('src/js/runtime-order.json')).includes('components/423-v573-batch-time.js'));
assert(JSON.parse(read('src/css-order.json')).some(r=>r.path==='assets/css/302-v573-release.css'));
const mod=read('src/js/components/423-v573-batch-time.js');
for(const s of ['function mf573BatchTime','App.mf573SetBatchTime','renderBatchLog=function','App.submitBatchLog=function','Math.min(at,now)'])assert(mod.includes(s),'v573 has '+s);
assert(read('index.html').includes(`mediaflow-v${version}.bundle.js`));
if(version===573){const wf=read('.github/workflows/publish-v573.yml');assert(wf.includes('gh release create 573')&&wf.includes('legacy/v/573'));}
assert(read('docs/release-v573.md').startsWith('## MediaFlow v573 Stable'));
assert(read('.github/workflows/deploy-pages.yml').includes('"Build archive and release MediaFlow v573"'));
console.log('v573 release contract passed');
