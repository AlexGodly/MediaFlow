/* v572 release contract: live sync; other devices' changes are never skipped. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const version=Number(read('VERSION').trim());
assert(version>=572);
assert(JSON.parse(read('src/js/runtime-order.json')).includes('components/422-v572-sync-cursor.js'));
const mod=read('src/js/components/422-v572-sync-cursor.js');
for(const s of ['mf556SaveState=async function','MF556.cursor=cursor','mf556LoadLocal=async function',"MF556.cursor='1970-01-01T00:00:03.000Z'",
  'mf556Pull=async function','MF572_PROBE_MS=5000',"or('device_id.is.null,device_id.neq.'+mf556Device())"])
  assert(mod.includes(s),'v572 has '+s);
assert(read('index.html').includes(`mediaflow-v${version}.bundle.js`));
if(version===572){const wf=read('.github/workflows/publish-v572.yml');assert(wf.includes('gh release create 572')&&wf.includes('legacy/v/572'));}
assert(read('docs/release-v572.md').startsWith('## MediaFlow v572 Stable'));
assert(read('.github/workflows/deploy-pages.yml').includes('"Build archive and release MediaFlow v572"'));
console.log('v572 release contract passed');
