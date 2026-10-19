/* MediaFlow v526 — universal title-progress sorter labels (display-only). */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const checks=[
  ['src/js/pages/library/150-v224-library-controls.js',[
    "['progress','Consumed progress']",
    "['total','Total progress']",
    "['remaining','Remaining progress']"
  ]],
  ['src/js/components/271-v373-logging-order-studio.js',[
    "['progress','Consumed progress']",
    "['total','Total progress']",
    "['remaining','Remaining progress']"
  ]],
  ['src/js/components/376-v518-library-remaining-sort.js',[
    "['remaining','Remaining progress']"
  ]],
  ['src/js/pages/personal-order/152-v224-personal-order-sorting.js',[
    "['progress','Consumed progress']","['total','Total progress']"
  ]],
  ['src/js/pages/batch-log/151-v224-batch-log-sorting.js',[
    "['progress','Consumed progress']","['total','Total progress']"
  ]],
  ['src/js/features/logging/153-v224-dashboard-logging-sorting.js',[
    "['progress','Consumed progress']","['total','Total progress']"
  ]],
  ['src/js/components/252-v354-personal-order-quick-workspace.js',[
    "['progress','Consumed progress']"
  ]],
  ['src/js/components/286-v392-collections-instant-add.js',[
    "['progress','Consumed progress']","['total','Total progress']"
  ]],
  ['src/js/components/208-v274-collections-library-rating-order-layout.js',[
    '>Consumed progress</option>','>Total progress</option>'
  ]],
  ['src/js/pages/library/013-v70-expanded-library-display-ordering.js',[
    'Consumed progress: Most → Least','Total progress: Least → Most'
  ]],
  ['src/js/pages/library/122-v53-cached-library-filtering-now-understands-the-v189.js',[
    'Consumed progress: Most → Least','Total progress: Ascending'
  ]],
  ['src/js/components/256-v358-personal-order-rebuild.js',[
    "['progress','Total progress']"
  ]]
];
for(const [file,needles] of checks){
  const source=read(file);
  for(const needle of needles)assert(source.includes(needle),file+' is missing '+needle);
}
// This checks the actual generated bundle, not only the declarations the UI
// is expected to use. Keep application vocabulary free of old episode/chapter
// language in sorters without changing the identity of saved sort keys.
const bundle=read('assets/js/mediaflow-v526.bundle.js');
const deprecated=[
  'Progress watched/read','Total episodes/chapters',
  'Total episodes / chapters','Remaining episodes / chapters'
];

function walk(dir){
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(d=>{
    const full=path.join(dir,d.name);
    return d.isDirectory()?walk(full):(d.isFile()&&full.endsWith('.js')?[full]:[]);
  });
}
const findings=[];
for(const file of walk(path.join(root,'src/js'))){
 const source=fs.readFileSync(file,'utf8');
 for(const term of deprecated){
  let from=0,idx;
  while((idx=source.indexOf(term,from))!==-1){
   findings.push({file:path.relative(root,file),term,
      around:source.slice(Math.max(0,idx-70),Math.min(source.length,idx+term.length+70)).replace(/\\s+/g,' ')});
   from=idx+term.length;
  }
 }
}
if(findings.length)console.log('AUDIT old phrases: '+JSON.stringify(findings).slice(0,12000));

const remaining=deprecated.filter(x=>bundle.includes(x));
assert.deepEqual(remaining,[],'Deprecated sorter labels in deployed bundle: '+remaining.join(', '));
const standalone=[/\['progress','Progress'\]/g,/\['total','Total'\]/g];
for(const re of standalone){
 const count=[...bundle.matchAll(re)].length;
 // One Collection percentage sorter is not a title-consumption sorter.
 assert(count<=1,'Unexpected unqualified title progress/total sorter labels: '+re+' ('+count+')');
}
assert(bundle.includes("['progress','Consumed progress']"));
assert(bundle.includes("['total','Total progress']"));
assert(bundle.includes("['remaining','Remaining progress']"));
assert(bundle.includes("['draftUpdated','Last updated in draft']"),'v525 session sorter must remain');
const order=JSON.parse(read('src/js/runtime-order.json'));
assert(order.includes('components/377-v525-logging-draft-sort.js'),'Keep current Logging default');
console.log('PASS v526: unified sorter wording in Library, Logging, Personal Order, Collections, picker modes and build; saved keys unchanged.');
