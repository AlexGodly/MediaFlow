/* v575 release contract: the full fallback copy is written rarely. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const version=Number(read('VERSION').trim());
assert(version>=575);
assert(JSON.parse(read('src/js/runtime-order.json')).includes('components/425-v575-fallback-io.js'));
const mod=read('src/js/components/425-v575-fallback-io.js');
for(const s of ['MF575_INTERVAL=30*60*1000','MF575_MIN_GAP=10*60*1000','mf556ScheduleLegacy=function','mf556WriteLegacy=async function',"MF575_KEY='mediaflow-v575-legacy-at'"])
  assert(mod.includes(s),'v575 has '+s);
assert(read('index.html').includes(`mediaflow-v${version}.bundle.js`));
if(version===575){const wf=read('.github/workflows/publish-v575.yml');assert(wf.includes('gh release create 575')&&wf.includes('legacy/v/575'));}
assert(read('docs/release-v575.md').startsWith('## MediaFlow v575 Stable'));
assert(read('.github/workflows/deploy-pages.yml').includes('"Build archive and release MediaFlow v575"'));
console.log('v575 release contract passed');
