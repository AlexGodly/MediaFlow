/* v574 release contract: Batch Log XP preview; live probe after the cursor. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const version=Number(read('VERSION').trim());
assert(version>=574);
assert(JSON.parse(read('src/js/runtime-order.json')).includes('components/424-v574-batch-xp-preview.js'));
assert(JSON.parse(read('src/css-order.json')).some(r=>r.path==='assets/css/303-v574-release.css'));
const mod=read('src/js/components/424-v574-batch-xp-preview.js');
for(const s of ['function mf574Project','calculateConsumptionXP(cat,catQty,minutes,health)','v150ComputeStateMetrics','mf542ProjectedMilestones',"v348Rate('batchLogXP')",
  "gt('updated_at',MF556.cursor)",'mf572Probe=async function'])assert(mod.includes(s),'v574 has '+s);
assert(read('index.html').includes(`mediaflow-v${version}.bundle.js`));
if(version===574){const wf=read('.github/workflows/publish-v574.yml');assert(wf.includes('gh release create 574')&&wf.includes('legacy/v/574'));}
assert(read('docs/release-v574.md').startsWith('## MediaFlow v574 Stable'));
assert(read('.github/workflows/deploy-pages.yml').includes('"Build archive and release MediaFlow v574"'));
console.log('v574 release contract passed');
