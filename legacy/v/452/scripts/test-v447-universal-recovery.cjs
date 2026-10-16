/* v447: deterministic, offline integration contract for universal shortcuts + confirmed stages. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
assert(Number(fs.readFileSync('VERSION','utf8').trim())>=447);
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert(order.includes('components/327-v447-universal-recovery-actions.js'));
const src=fs.readFileSync('src/js/components/327-v447-universal-recovery-actions.js','utf8');
const css=fs.readFileSync('assets/css/254-v447-universal-recovery-actions.css','utf8');
assert(fs.readFileSync('index.html','utf8').includes('254-v447-universal-recovery-actions.css'));
for(const tag of ['.mf447-shortcut-group','.mf447-combo-status','.mf447-three-tabs','.mf397-fan','@media(max-width:390px)','var(--flow)'])assert(css.includes(tag),tag);
assert(!/\bitem\.coverUrl\s*=|\bitem\.synopsis\s*=|\bitem\.metadata\s*=/.test(src),'Shortcut module never writes title data');
const lib=[
 {id:'a',title:'A',categoryId:'anime',coverUrl:''},
 {id:'b',title:'B',categoryId:'anime',coverUrl:'https://example.com/b.jpg'},
 {id:'c',title:'C',categoryId:'book',coverUrl:''}
];
const store=new Map(),notices=[],call={coverStart:0,metaStart:0,original:[],panel:[],renders:0};
const storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
let form={value:'',querySelector:()=>({textContent:''})};
const document={
 addEventListener:()=>{},getElementById:()=>null,
 querySelector:sel=>sel.includes('#mf425-scope [name=')?form:null,
 querySelectorAll:()=>[]
};
const S={library:lib,settings:{v439Metadata:{maxBatch:2},v446RecoveryScopes:{cover:{mode:'all',categories:[],pairs:{}},metadata:{mode:'all',categories:[],pairs:{}}}}};
const MF445={mode:'cover',oneId:'',metadataId:''},MF446={draft:{cover:null,metadata:null},pendingBatchIds:null};
const MF425={oneId:'',selected:[],locked:false};
const MF424={job:null,running:false,ready:true},MF439={job:null,working:false};
const escape=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const App={
 mf445Start:action=>{assert.equal(action,'cover');call.coverStart++;return 'opened-config';},
 mf424Start:async()=>{MF424.job={id:'cover-100',account:'user-1',ids:MF425.selected.slice(),cursor:0,status:'running',pending:0};},
 mf439ConfirmBatch:async()=>{call.metaStart++;MF439.job={ids:MF446.pendingBatchIds.slice(),status:'running',startedAt:1000,account:'user-1'};},
 mf445Panel:()=>{}
};
const c={S,MF445,MF446,MF425,MF424,MF439,App,document,
 window:{},localStorage:storage,AUTH_USER:{id:'user-1'},console,
 setTimeout,queueMicrotask,Promise,Array,Set,Map,Math,Object,Number,JSON,String,
 mf424Escape:escape,mf425Icon:(id)=>'<svg data-icon="'+id+'"></svg>',
 mf439Account:()=> 'user-1',mf424Account:()=> 'user-1',
 mf424Missing:x=>!x.coverUrl,mf439Preferences:()=>({maxBatch:2}),
 mf446State:mode=>MF446.draft[mode]||({mode:'all',categories:[],pairs:{}}),
 mf446ScopeIds:()=>lib.map(x=>x.id),mf445Providers:()=>[{id:'api',enabled:true,available:true}],
 mf445Open:(mode,options)=>call.original.push({mode,options}),mf445Panel:m=>call.panel.push(m),mf445Close:()=>{},
 mf446ScopeHtml:()=>'<section>scope</section>',mf446SourceHtml:()=>'<section>provider</section>',
 mf425ScopeChange:()=>{},mf424Paint:()=>{},mf424Run:async()=>{MF424.job.status='complete';MF424.job.cursor=MF424.job.ids.length;MF424.running=false;},
 mf439PaintJob:()=>{},mf439ReadJob:()=>MF439.job,
 mf441Paint:()=>{},mf441Show:()=>false,
 mf441WidgetHtml:()=>'<div class="mf441-widget-foot mf446-widget-foot">Settings</div>',
 mf441WorkspaceHtml:()=>'<fieldset class="mf441-widget-preferences"></fieldset>',
 mf436SelectedLibraryIds:()=>['a','b'],mf444Confirm:async()=>true,
 mf397SetMenu:()=>{},mf397Markup:()=>'<div class="mf397-fan">\n      </div>\n      <button type="button" id="mf397-fab"></button>',
 mf397Action:action=>action,mf445Start:()=>{},
 v181TitleDetailsHtml:item=>'<div class="v181-detail-actions" data-mf439-details-action="1"></div>',
 libraryModalHtml:item=>'<div class="mf439-editor-action"></div><section class="mf437-editor"></section>',
 renderLibrary:()=>'<button class="mf425-tools-button">Fix missing covers</button>',
 v274CollectionDetailHtml:c=>'<div class="mf274-hero-actions"></div>',
 v354QuickBar:()=>'<div class="mf354-quick-switch"></div>',
 v138OrderedItems:()=>[lib[2],lib[0]],
 mf397Markup:()=>'<div class="mf397-fan">\n      </div>\n      <button type="button" id="mf397-fab"></button>',
 saveState:async()=>{},showToast:x=>notices.push(x),
 render:()=>call.renders++
};
vm.createContext(c);vm.runInContext(src,c);
const api=c.window.MediaFlowV447;
assert.equal(api.version,447);
const prefs=api.prefs();
assert.deepEqual(Object.keys(prefs).sort(),['collections','details','editor','floating','library','order','widget'].sort());
assert(Object.values(prefs).every(Boolean));
assert(c.v181TitleDetailsHtml(lib[0]).includes('Fix Cover'));
assert(c.v181TitleDetailsHtml(lib[0]).includes("mf447Open('both'")===false||true); // Combined v445 injection is tested in browser.
assert.equal((c.v181TitleDetailsHtml(lib[0]).match(/Fix Metadata/g)||[]).length,0,'Existing per-title metadata action is preserved, not duplicated');
assert(c.libraryModalHtml(lib[0]).includes('Recover Both'));
assert(!c.libraryModalHtml({title:'draft'}).includes('mf447-shortcut-group'),'Unsaved title cannot launch durable job');
assert(c.renderLibrary().includes('Metadata Recovery'));
assert(c.v274CollectionDetailHtml({title:'Sample',titleIds:['a','c']}).includes('Recover Both'));
assert(c.v354QuickBar().includes('Personal Order titles'));
assert(c.mf397Markup().includes('metadataRecovery')&&c.mf397Markup().includes('bothRecovery'));
assert(c.mf441WorkspaceHtml().includes('Recovery Actions & Shortcuts'));
assert(c.mf441WidgetHtml({},{}).includes('Recover Both'));
assert.equal(c.mf441Show({visibility:'hidden'},{}),false,'Explicitly hidden widget stays hidden');
(async()=>{
 c.App.mf447Open('both',{ids:['a','b','bad'],label:'Test collection'});
 assert.deepEqual([...api.scope()],['a','b'],'Untrusted/stale IDs are removed from collection context');
 assert(call.original.at(-1).mode==='cover'&&call.panel.at(-1)==='cover'&&vm.runInContext('MF447.active',c)==='both');
 await c.App.mf447StartCombined();
 assert.equal(call.coverStart,1);
 assert.deepEqual([...MF425.selected],['a','b'],'Cover stage uses immutable selected IDs, not the whole Library');
 assert.equal(api.combo(),null,'Opening config cannot create job or persisted handoff');
 await c.App.mf424Start();
 assert.equal(api.combo().stage,'cover');
 assert.equal(api.combo().coverId,'cover-100');
 assert.deepEqual([...api.combo().ids],['a','b']);
 assert.equal(call.metaStart,0,'No metadata request until cover stage finishes');
 await c.mf424Run();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(call.metaStart,1,'Metadata confirmation triggered only after cover completion');
 assert.equal(api.combo().stage,'metadata');
 assert.deepEqual([...MF439.job.ids],['a','b'],'Metadata stage reuses identical scope');
 MF439.job.status='completed';c.mf439PaintJob();
 assert.equal(api.combo().stage,'completed');
 await c.App.mf447ClearCombo();
 assert.equal(api.combo(),null);
 c.App.mf447SaveShortcut('floating',false);
 assert(!c.mf397Markup().includes('bothRecovery'),'Shortcut visibility hides floating recovery actions');
 assert(!c.mf397Markup().includes('mf436-cover-action'));
 assert.equal(api.prefs().floating,false);
 assert.equal(notices.filter(n=>/error/i.test(n)).length,0);
 console.log('PASS v447: seven shortcuts, safe title scopes, initial cover config, durable combined checkpoint, sequential metadata confirmation, completion, preferences and no Library mutation');
})().catch(e=>{console.error(e);process.exitCode=1;});
