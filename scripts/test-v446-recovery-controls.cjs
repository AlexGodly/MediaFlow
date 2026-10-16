/* v446 regression: provider preferences, category/status scopes, engine handoffs. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
assert(Number(fs.readFileSync('VERSION','utf8').trim())>=446);
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert(order.includes('components/326-v446-recovery-scope-controls.js'));
const src=fs.readFileSync('src/js/components/326-v446-recovery-scope-controls.js','utf8');
const css=fs.readFileSync('assets/css/253-v446-recovery-scopes.css','utf8');
const html=fs.readFileSync('index.html','utf8');
assert(html.includes('253-v446-recovery-scopes.css'));
for(const item of ['.mf446-provider-check','.mf446-category-grid','.mf446-statuses','.mf446-widget-foot','@media(max-width:370px)','var(--flow)'])assert(css.includes(item),item);
assert(!src.includes('item.coverUrl=')&&!src.includes('item.universalMetadata='),'UI cannot modify protected title fields');
const counts={saves:0,network:0,confirm:0,cover:0,meta:0,scopeUpdates:0};
const data=[
 {id:'a',title:'A',categoryId:'anime',status:'active',coverUrl:''},
 {id:'b',title:'B',categoryId:'anime',status:'completed',coverUrl:''},
 {id:'c',title:'C',categoryId:'books',status:'planned',coverUrl:''},
 {id:'d',title:'D',categoryId:'books',status:'dropped',coverUrl:''}
];
const S={library:data,categories:[{id:'anime',name:'Anime',iconUrl:'assets/category-icons/seasonal-anime.png'},
 {id:'books',name:'Books',icon:'📚'},{id:'danger"test',name:'<unsafe>',icon:'!'}],
 histFilters:{libSearch:'a',libCategory:'all',libStatus:'all',libPriority:'all'},
 settings:{v424Covers:{enabled:['jikan']},v439Metadata:{enabled:['jikan'],maxBatch:2}}};
const MF445={mode:'cover',oneId:'',metadataId:'',coverEntry:'settings'};
const MF425={selected:[],oneId:'',locked:false};
const MF436={reviewIds:[]};
const escape=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const App={
 mf445Start:()=>{counts.cover++;},
 mf439ConfirmBatch:async()=>{await Promise.resolve();counts.confirm++;return c.mf439BatchCandidates(); }
};
const input={value:'',querySelector:()=>({textContent:''})};
const doc={querySelector:sel=>sel.includes('mf425-scope [name=')?input:null,
 querySelectorAll:()=>[],getElementById:()=>null};
const c={console,window:{},document:doc,S,MF445,MF425,MF436,App,
 Map,Set,Array,Object,Number,JSON,Math,Promise,String,
 DEFAULT_SETTINGS:{},MF424:{running:false},MF439:{working:false},
 saveState:async()=>counts.saves++,showToast:()=>{},mf425Icon:(name)=>'<svg data-name="'+name+'"></svg>',
 mf445Esc:escape,mf445SourceHtml:()=>'',mf445Categories:()=>'',mf445Providers:mode=>mode==='cover'?
  [{id:'jikan',name:'Jikan',enabled:S.settings.v424Covers.enabled.includes('jikan'),available:true},
   {id:'tmdb',name:'TMDB',enabled:false,available:false,detail:'Setup needed'}]:
  [{id:'jikan',name:'Jikan',enabled:S.settings.v439Metadata.enabled.includes('jikan'),available:true}],
 mf425ScopeChange:()=>counts.scopeUpdates++,mf425UpdateCount:()=>{},
 mf436SelectedLibraryIds:()=>['b','d'],mf445Panel:()=>{},mf445Close:()=>{},
 mf445OriginalMetadataOpen:id=>{counts.meta++;return id;},
 mf424Defaults:()=>({...S.settings.v424Covers}),
 mf439Preferences:()=>({...S.settings.v439Metadata}),
 mf439BatchCandidates:()=>['b','d'],
 mf445CategoryIcon:cat=>cat.iconUrl?'<img src="'+escape(cat.iconUrl)+'">':'<span>'+escape(cat.icon||'')+'</span>',
 v181EnsureLibrarySettings:()=>({mode:'classic'}),
 v53FilteredLibrary:()=>[data[0],data[2]],
 mf441CoverRow:()=>'<div class="mf441-process-actions"><button type="button" onclick="App.mf441OpenCover()"><svg data-name="settings"></svg> Setup</button></div>',
 mf441WidgetHtml:()=>'<div class="mf441-widget-foot"><button type="button" onclick="App.mf441Settings()"> Recovery Settings</button></div>',
 mf441Settings:()=>{},
};
vm.createContext(c);
vm.runInContext(src,c);
const api=c.window.MediaFlowV446;
const internal=vm.runInContext('MF446',c);
assert.equal(api.version,446);
assert.deepEqual([...api.scopes],['all','library','category','categoryStatus','selected']);
assert.equal(counts.network,0);
assert.equal(c.mf446State('cover').mode,'selected','checked titles should remain default cover selection');
assert.equal(c.mf446State('metadata').mode,'selected');
internal.draft.cover.mode='all';
assert.deepEqual([...api.scopeIds('cover')],['a','b','c','d']);
internal.draft.cover.mode='library';
assert.deepEqual([...api.scopeIds('cover')],['a','c'],'current Library filter should be cross-page, not all titles');
internal.draft.cover.mode='selected';
assert.deepEqual([...api.scopeIds('cover')],['b','d'],'checked selection is a snapshot');
internal.draft.cover.mode='category';
internal.draft.cover.categories=['books'];
assert.deepEqual([...api.scopeIds('cover')],['c','d']);
internal.draft.cover.mode='categoryStatus';
internal.draft.cover.pairs.books=['dropped'];
assert.deepEqual([...api.scopeIds('cover')],['d']);
const htmlScopes=api.scopeHtml('cover');
assert(htmlScopes.includes('By Category → Status'));
assert(htmlScopes.includes('assets/category-icons/seasonal-anime.png'));
assert(htmlScopes.includes('&lt;unsafe&gt;'));
assert(htmlScopes.includes('mf446ToggleCategory'));
assert(!htmlScopes.includes('onchange="App.mf446ToggleCategory("danger'),'HTML attributes must be escaped');
const before=JSON.stringify(data);
c.mf446ToggleProvider('cover','jikan',false);
assert.deepEqual([...S.settings.v424Covers.enabled],[]);
assert.deepEqual([...S.settings.v439Metadata.enabled],['jikan'],'Cover choice does not affect metadata');
c.mf446ToggleProvider('cover','jikan',true);
assert.deepEqual([...S.settings.v424Covers.enabled],['jikan']);
c.mf446ToggleProvider('cover','tmdb',true);
assert.deepEqual([...S.settings.v424Covers.enabled],['jikan'],'unconfigured API cannot be enabled');
assert(api.sourceHtml('cover').includes('data-mf446-toggle="jikan"'));
const row=api.coverRow({});
assert(row.includes('New Recovery')&&!row.includes(' Setup'));
const foot=api.widget({},{});
assert(foot.indexOf(' Setup</button>')<foot.indexOf('Recovery Settings'));
(async()=>{
 c.MF445.mode='metadata';
 internal.draft.metadata={mode:'categoryStatus',categories:['anime','books'],pairs:{anime:['completed'],books:['dropped']}};
 const m=api.scopeIds('metadata');
 assert.deepEqual([...m],['b','d']);
 const queued=await c.App.mf445Start('batch');
 assert.deepEqual([...queued],['b','d'],'handoff through async two-stage confirmation uses category-status snapshot');
 assert.equal(internal.pendingBatchIds,null,'scoped metadata override must clear after confirmation');
 internal.draft.metadata={mode:'all',categories:[],pairs:{}};
 const allBatch=await c.App.mf445Start('batch');
 assert.deepEqual([...allBatch],['a','b'],'metadata scopes respect 2-title configured safety cap');
 c.MF445.mode='cover';internal.draft.cover.mode='all';
 await c.App.mf445Start('cover');
 assert.equal(counts.cover,1);
 assert.equal(input.value,'all','Cover config initialized with requested full-Library scope');
 assert.equal(counts.meta,0);
 assert.equal(JSON.stringify(data),before,'workspace cannot mutate Library titles');
 console.log('PASS v446: five scopes, filters, category status, provider toggle isolation, setup/new actions, capped confirmed metadata batches, cover legacy scope and no title writes');
})().catch(e=>{console.error(e);process.exitCode=1;});
