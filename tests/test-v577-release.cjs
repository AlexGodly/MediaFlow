/* v577 release contract: titles logged by parts, XP History rows, every
 * keyless source, the synced Batch Log draft. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const version=Number(read('VERSION').trim());
assert(version>=577);
const order=JSON.parse(read('src/js/runtime-order.json'));
for(const m of ['427-v577-parts.js','428-v577-xp-history.js','429-v577-keyless-apis.js','430-v577-batch-draft.js'])
  assert(order.includes('components/'+m),'runtime order has '+m);
assert(JSON.parse(read('src/css-order.json')).some(r=>r.path==='assets/css/304-v577-release.css'));
const parts=read('src/js/components/427-v577-parts.js');
for(const s of ["item.mf577LogMode==='parts'",'v252SeasonOffset=function','v252DistributeAggregateProgress=function','mf565ToCategoryAmount=function',
  'App.submitLog=function','App.submitBatchLog=function','v369Sync=function','How this title is logged','t.mf577Parts=mf577Meta'])
  assert(parts.includes(s),'v577 parts has '+s);
assert(read('src/js/components/428-v577-xp-history.js').includes('v348HistoryEntries=function'));
const keyless=read('src/js/components/429-v577-keyless-apis.js');
for(const s of ['wikidata','wikimedia','inventaire','episodate','crossref','services.dnb.de','catalogue.bnf.fr','MF438_PUBLIC_PROBES'])assert(keyless.includes(s),'v577 sources has '+s);
const batch=read('src/js/components/430-v577-batch-draft.js');
for(const s of ['resumeStateV285','mf577Batch','v285NormalizeResume=function','mergeStates=function','v46ApplyState=function'])assert(batch.includes(s),'v577 batch draft has '+s);
assert(read('index.html').includes(`mediaflow-v${version}.bundle.js`));
if(version===577){const wf=read('.github/workflows/publish-v577.yml');assert(wf.includes('gh release create 577')&&wf.includes('legacy/v/577'));}
assert(read('docs/release-v577.md').startsWith('## MediaFlow v577 Stable'));
assert(read('.github/workflows/deploy-pages.yml').includes('"Build archive and release MediaFlow v577"'));
console.log('v577 release contract passed');
