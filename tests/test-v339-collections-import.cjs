const assert=require('assert'),vm=require('vm'),fs=require('fs');
const path=__dirname+'/../src/js/components/215-v281-collections-responsive-cloud-library-search.js';
const text=fs.readFileSync(path,'utf8');
const start=text.indexOf('async function v281ImportCollections(file){');
const end=text.indexOf('/* ---------- Card cover-size responsiveness',start);
assert(start>0&&end>start);
const code=text.slice(start,end);
const saved=[{id:'a',title:'Newer existing',updatedAt:200},{id:'b',title:'Old existing',updatedAt:100}];
const S={collections:JSON.parse(JSON.stringify(saved)),collectionTombstones:[{id:'a'},{id:'b'},{id:'c'}],settings:{}};
const logs=[];
const context={S,console,Math,Number,String,Object,Array,Map,Set,Date,
  V274_UI:{activeId:'a'},
  v274NormalizeCollections:rows=>rows.map(x=>({...x})),
  v274EnsureCollections:()=>S.collections,
  v274Now:()=>400,
  v274Num:(x,def=0)=>Number(x)||def,
  v274Clone:(x,f)=>JSON.parse(JSON.stringify(x??f)),
  v279Confirm:async()=>true,
  v274EnsureSettings:()=>({}),
  v281RestoreCollectionUiState:()=>{},
  saveState:async()=>{},
  lastSaveFailed:false,V115_STARTUP_GUARD:false,
  render:()=>{},showToast:s=>logs.push(s)
};
vm.createContext(context);vm.runInContext(code,context);
(async()=>{
  const file={text:async()=>JSON.stringify({collections:[
    {id:'a',title:'Old imported',updatedAt:150},
    {id:'b',title:'Fresh imported',updatedAt:300},
    {id:'c',title:'Newly imported',updatedAt:250}
  ]})};
  await context.v281ImportCollections(file);
  assert.equal(S.collections.find(x=>x.id==='a').title,'Newer existing');
  assert.equal(S.collections.find(x=>x.id==='b').title,'Fresh imported');
  assert.equal(S.collections.find(x=>x.id==='c').title,'Newly imported');
  assert(S.collectionTombstones.some(x=>x.id==='a'));
  assert(!S.collectionTombstones.some(x=>x.id==='b'));
  assert(!S.collectionTombstones.some(x=>x.id==='c'));
  assert(logs.at(-1).includes('2 collections imported'));
  console.log('PASS v339: collection import respects newer existing edits; revive accepted tombstones only');
})().catch(e=>{console.error(e);process.exit(1)});
