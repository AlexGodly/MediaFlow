/* MediaFlow v532 — History media-type options, filters and Statistics mix. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const helper=read('src/js/components/379-v532-media-type-history-statistics.js');
const categories=[
 {id:'anime',type:'video'},{id:'books',type:'reading'},
 {id:'games',type:'playing'},{id:'music',type:'listening'},
 {id:'unrecognized',type:'unsupported'}
];
const sessions=[
 {id:'a',categoryId:'anime',status:'logged',minutes:60,timestamp:6},
 {id:'b',categoryId:'books',status:'logged',minutes:20,timestamp:5},
 {id:'c',categoryId:'games',status:'logged',minutes:120,timestamp:4},
 {id:'d',categoryId:'music',status:'logged',minutes:40,timestamp:3},
 {id:'e',categoryId:'deleted',status:'logged',minutes:5,timestamp:2},
 {id:'f',categoryId:'unrecognized',status:'logged',minutes:3,timestamp:1},
 {id:'skip',categoryId:'games',status:'skipped',minutes:900,timestamp:0}
];
const ctx=vm.createContext({S:{categories,sessions,histFilters:{type:'all',range:'all'}},v241HistorySelectedCategories:()=>[]});
vm.runInContext(helper,ctx);
const types=[['video','Watching'],['reading','Reading'],['playing','Playing'],['listening','Listening'],['other','Other']];
for(const [id,label] of types){
 const html=vm.runInContext('v532MediaTypeOptions('+JSON.stringify(id)+')',ctx);
 assert(html.includes('value="'+id+'" selected>'+label+'</option>'),'Selection/label for '+id);
 const options=[...html.matchAll(/<option value="([^"]+)"\s*(selected)?>([^<]+)<\/option>/g)];
 assert.equal(options.length,6,'all, four media types and Other');
 assert.equal(options.filter(m=>m[2]).length,1,'one selected option');
 assert(!html.includes('>Video</option>'),'legacy Video must not be shown');
}
const history=read('src/js/components/187-v253-seasons-history-logging-polish.js');
const start=history.indexOf('function v253HistoryFilteredList(){');
const end=history.indexOf('function v253HistoryPageData(){',start);
assert(start>=0&&end>start,'active History filtering function located');
vm.runInContext(history.slice(start,end),ctx);
for(const [type,ids] of [['video',['a']],['reading',['b']],['playing',['c']],['listening',['d']],['other',['e','f']]]){
 ctx.S.histFilters.type=type;
 const found=vm.runInContext('v253HistoryFilteredList().map(s=>s.id).join(",")',ctx);
 assert.equal(found,ids.join(','),'History filtering for '+type);
}
ctx.S.histFilters.type='all';
assert.equal(vm.runInContext('v253HistoryFilteredList().length',ctx),7,'All media filter still retains history');
const mixture=vm.runInContext('v532MediaTypeMix(S.sessions,S.categories)',ctx);
assert.equal(JSON.stringify(mixture),JSON.stringify([
 {label:'Watching',value:60},{label:'Reading',value:20},
 {label:'Playing',value:120},{label:'Listening',value:40},
 {label:'Other',value:8}
]),'Statistics uses canonical labels and preserves accumulated minutes');
ctx.S.sessions=ctx.S.sessions.filter(s=>!['e','f'].includes(s.id));
assert(!vm.runInContext('v532MediaTypeMix(S.sessions,S.categories)',ctx).some(x=>x.label==='Other'),
 'Other only appears when unmatched history exists');
for(const file of ['src/js/pages/history/015-view-history.js',
 'src/js/components/187-v253-seasons-history-logging-polish.js',
 'src/js/components/203-v269-consumption-history-redesign.js']){
 const code=read(file);
 assert(code.includes('v532MediaTypeOptions(f.type)'),file+' uses the shared type dropdown');
 assert(!code.includes('>Video</option>'),file+' must not expose old Video label');
}
const stats=read('src/js/pages/statistics/023-v16-features-backups-themes-stopwatch-mal-link-stats.js');
assert(stats.includes('const mediaData=v532MediaTypeMix(S.sessions,S.categories);'),
 'Media Type Mix must render normalized types with stable totals');
const runtime=JSON.parse(read('src/js/runtime-order.json'));
assert(runtime.includes('components/379-v532-media-type-history-statistics.js'), 'The helper must be bundled');
const category=read('src/js/components/category/049-v144-reusable-category-icon-color-palettes.js');
assert(category.includes('>Watching</option>'),'Existing category activity labels are not changed');
console.log('PASS v532: History filters work for Watching, Reading, Playing, Listening and Other; Statistics minutes and labels are correct.');
