/* v576 release contract: the persistence audit compares a normalised ledger. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const version=Number(read('VERSION').trim());
assert(version>=576);
assert(JSON.parse(read('src/js/runtime-order.json')).includes('components/426-v576-audit-ledger.js'));
const mod=read('src/js/components/426-v576-audit-ledger.js');
for(const s of ['mf507AuditPersistence=function','App.v507AuditPersistence=mf507AuditPersistence','v348Ledger()'])assert(mod.includes(s),'v576 has '+s);
assert(read('index.html').includes(`mediaflow-v${version}.bundle.js`));
if(version===576){const wf=read('.github/workflows/publish-v576.yml');assert(wf.includes('gh release create 576')&&wf.includes('legacy/v/576'));}
assert(read('docs/release-v576.md').startsWith('## MediaFlow v576 Stable'));
assert(read('.github/workflows/deploy-pages.yml').includes('"Build archive and release MediaFlow v576"'));
console.log('v576 release contract passed');
