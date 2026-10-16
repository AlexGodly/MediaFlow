/* v445: deterministic safety and rendering contracts for unified recovery UI. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'445');
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert.equal(order.at(-1),'components/325-v445-unified-recovery-workspace.js');
const src=fs.readFileSync('src/js/components/325-v445-unified-recovery-workspace.js','utf8');
const css=fs.readFileSync('assets/css/252-v445-unified-recovery-workspace.css','utf8');
const html=fs.readFileSync('index.html','utf8');
assert(html.includes('252-v445-unified-recovery-workspace.css'));
for(const selector of ['.mf445-category-art img','.mf445-provider-grid','.mf445-tabs','.mf445-dialog','@media(max-width:600px)','@media(max-width:370px)','var(--panel)','var(--flow)'])
 assert(css.includes(selector),'Missing workspace CSS '+selector);
const oldCover=fs.readFileSync('src/js/components/309-v424-advanced-cover-recovery.js','utf8');
const oldMeta=fs.readFileSync('src/js/components/319-v439-metadata-recovery.js','utf8');
assert(oldCover.includes('async function mf424Apply('));
assert(oldMeta.includes('function mf439Apply('));
assert(!src.includes('item.coverUrl='),'Workspace must not write cover URLs');
assert(!src.includes('item.universalMetadata='),'Workspace must not write recovered metadata');
assert(src.includes('mf445OriginalCoverConfig(entry,id)'),'Cover engine must remain the launch target');
assert(src.includes('mf445OriginalMetadataOpen(oneId)'),'Metadata preview engine must remain launch target');
assert(src.includes('App.mf439ConfirmBatch()'),'Metadata batch must retain its original confirmation');
const calls={network:0,cover:[],metadata:[],batch:0};
const S={settings:{},categories:[
 {id:'anime',name:'Anime',iconUrl:'assets/category-icons/seasonal-anime.png'},
 {id:'books',name:'Books',icon:'📚'},
 {id:'unsafe',name:'<danger>',icon:'<'}
 ],library:[{id:1,categoryId:'anime'},{id:2,categoryId:'books'}]};
const escape=t=>String(t??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const document={activeElement:null,getElementById:()=>null,createElement:()=>({}),body:{appendChild:()=>{}},querySelector:()=>null};
const App={mf425OpenConfig:(...args)=>calls.cover.push(args),mf439Open:(...args)=>calls.metadata.push(args),mf439ConfirmBatch:()=>calls.batch++};
const c={window:{},document,S,App,console,Number,String,Array,Set,Map,Object,Math,Promise,
 MF424_PROVIDER_META:[{id:'tenrai',name:'Tenrai',limit:10},{id:'tmdb',name:'TMDB',limit:0,credentials:true}],
 MF424:{job:null},MF439:{job:null},MF439_GATEWAY:['tmdb'],MF434_LABELS:{tmdb:'TMDB'},MF438_EXTRA_CATALOG:[],
 mf424Defaults:()=>({enabled:['tenrai']}),mf439Preferences:()=>({enabled:['jikan','tmdb']}),
 mf439Available:()=>['jikan','tmdb'],mf434ProviderStatus:()=>({configured:false,testable:true}),
 mf439ReadJob:()=>null,mf424Escape:escape,mf425Icon:name=>'<svg data-icon="'+name+'"></svg>',
 v144SafeIconUrl:url=>String(url).startsWith('assets/category-icons/')?url:'',
 mf436SelectedLibraryIds:()=>['1','2'],mf441Settings:()=>{},showToast:()=>{},
 v181TitleDetailsHtml:()=>'<div class="v181-detail-actions"></div>'};
vm.createContext(c);
vm.runInContext(src,c);
const api=c.window.MediaFlowV445;
assert.equal(api.version,445);
assert.equal(calls.network,0,'Opening source file must never launch a provider request');
const cover=api.providers('cover'),meta=api.providers('metadata');
assert.equal(cover.length,2);
assert.equal(cover[0].available,true);
assert.equal(cover[1].available,false);
assert.equal(meta[1].available,false);
assert.equal(meta[0].available,true);
const cats=api.categories();
assert(cats.includes('<img src="assets/category-icons/seasonal-anime.png"'));
assert(cats.includes('📚'));
assert(cats.includes('&lt;danger&gt;'),'Category labels must be escaped');
assert(cats.includes('1 titles'),'Counts use saved Library membership');
assert(cats.includes('<details class="mf445-category">'),'Categories expand independently');
assert(c.App.mf445Open&&c.App.mf445Start&&c.App.mf445Settings);
assert.equal(c.App.mf425OpenConfig===c.App.mf439Open,false,'Cover and metadata wrappers remain separate');
assert(c.v181TitleDetailsHtml({id:'42'}).includes('Covers + Metadata Recovery'));
assert.equal(calls.cover.length,0);
assert.equal(calls.metadata.length,0);
assert.equal(calls.batch,0);
console.log('v445 workspace passed: independent providers, real category artwork, safe escaping, preserved engine launchers, no eager network or writes.');
