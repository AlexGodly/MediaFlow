/* v437 durable title-metadata round-trip contract: core backups, sanitizeLibrary and manual edits.
 * No account, cloud requests, secrets, or real user records are used. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
const raw=read('src/js/services/cloud-sync/004-v115-cloud-data-loss-prevention-recovery-guard.js');
const start=raw.indexOf('function sanitizeLibrary(list){');
const end=raw.indexOf('\n}',start);
assert(start>=0&&end>start,'Expected canonical sanitizeLibrary implementation');
const sample=[
 {id:'game-1',title:'Test Game',categoryId:'games',rating:9.1,progress:22,mediaMetadata:{
   developers:['Test Dev'],platforms:['Windows'],gameModes:['Single player'],year:2023,budget:1000},
  externalRatings:{imdb:{value:8.1,scale:10,votes:1300,provider:'omdb'}},
  externalIds:{steam:'1234',vndb:'v999'},richMetadataManual:{platforms:true},
  metadataRecoverySources:{externalRatings:{provider:'omdb',at:1792100000000}}},
 {id:'music-2',title:'Test Album',categoryId:'music',mediaMetadata:{
  artists:['Test Artist'],trackCount:12,isrc:'USABC1200001'},
  externalRatings:{musicbrainz:{value:4,scale:5}}},
 {id:'if-3',title:'Test Interactive Fiction',categoryId:'fiction',mediaMetadata:{
  ifid:'7B207541-D9DC-4421-8B0D-B8AB59AB3409',visualNovelLength:240},
  externalRatings:{ifdb:{value:4.2,scale:5,votes:24}}}
];
const ctx={S:{categories:[{id:'games'},{id:'music'},{id:'fiction'}]},
 cleanTitle:x=>String(x||'').trim(),uid:()=> 'unit-id',
 v84MergeLibraryItem:(existing,item)=>({...existing,...item})};
vm.createContext(ctx);
vm.runInContext(raw.slice(start,end+2),ctx);
const restored=vm.runInContext('sanitizeLibrary',ctx)(JSON.parse(JSON.stringify(sample)));
assert.equal(restored.length,sample.length);
for(let i=0;i<sample.length;i++){
 assert.deepEqual(JSON.parse(JSON.stringify(restored[i].mediaMetadata)),sample[i].mediaMetadata);
 assert.deepEqual(JSON.parse(JSON.stringify(restored[i].externalRatings)),sample[i].externalRatings);
 assert.equal(restored[i].id,sample[i].id);
}
assert.deepEqual(JSON.parse(JSON.stringify(restored[0].externalIds)),sample[0].externalIds);
assert.deepEqual(JSON.parse(JSON.stringify(restored[0].richMetadataManual)),sample[0].richMetadataManual);
assert.deepEqual(JSON.parse(JSON.stringify(restored[0].metadataRecoverySources)),sample[0].metadataRecoverySources);
assert.equal(restored[0].rating,9.1);assert.equal(restored[0].progress,22);
const snapCode=read('src/js/features/import-export/026-v37-simkl-json-bulk-library-tools-activity-undo.js');
assert(snapCode.includes('library:mfDeep(S.library||[])'),'Canonical undo snapshots must include full Library');
assert(snapCode.includes('S.library=sanitizeLibrary(mfDeep(x.library||[]))'),'Undo restores complete Library objects');
console.log('PASS: v437 media-specific metadata, external ratings, IDs and manual protections survive JSON restore and undo snapshot contracts');
