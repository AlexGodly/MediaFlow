/* v569 release contract: a title's own unit and runtime in logging. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const version=Number(read('VERSION').trim());
assert(version>=569);
const runtime=JSON.parse(read('src/js/runtime-order.json'));
assert(runtime.includes('components/421-v569-title-units.js'),'421-v569-title-units is in the runtime order');
const mod=read('src/js/components/421-v569-title-units.js');
for(const s of ['v369UnitType=function','v179SyncSingleFromEntries=function','v179SetLogMode=function','v179UpdateBatchProgress=function',
  'App.v179SetLogMode=v179SetLogMode','App.v179UpdateBatchProgress=v179UpdateBatchProgress','App.selectBatchTitle=function','App.submitBatchLog=function','Math.round(n*own/60)'])
  assert(mod.includes(s),'v569 has '+s);
assert(read('index.html').includes(`mediaflow-v${version}.bundle.js`));
if(version===569){const wf=read('.github/workflows/publish-v569.yml');assert(wf.includes('gh release create 569')&&wf.includes('legacy/v/569'));}
assert(read('docs/release-v569.md').startsWith('## MediaFlow v569 Stable'));
assert(read('.github/workflows/deploy-pages.yml').includes('"Build archive and release MediaFlow v569"'));
console.log('v569 release contract passed');
