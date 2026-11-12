/* MediaFlow v455: direct recovery job creation and safe cover persistence. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
assert(['455','456','457','458','459'].includes(fs.readFileSync('VERSION','utf8').trim()));
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert(order.includes('components/337-v455-workspace-direct-recovery.js')&&order.includes('components/338-v455-recovery-handoff-visibility.js'));
assert(order.includes('components/340-v456-recovery-start-status.js'));
const direct=fs.readFileSync('src/js/components/337-v455-workspace-direct-recovery.js','utf8');
const handoff=fs.readFileSync('src/js/components/338-v455-recovery-handoff-visibility.js','utf8');
const quick=fs.readFileSync('src/js/components/334-v453-quick-title-recovery.js','utf8');
const css=fs.readFileSync('assets/css/262-v455-recovery-workspace-execution.css','utf8');
assert(quick.includes("String(canonical.coverUrl)!==String(cover.url)"),'Confirmed cover URL must be verified on the canonical Library title');
assert(quick.includes("let coverCount=0,metadataCount=0,metadataError=''"),'Metadata failure cannot silently remove a saved cover');
assert(quick.includes("if(typeof persistLibrary==='function')"),'Normal Library saving path must be used');
assert(direct.includes('mf451PauseActive()')&&direct.includes('mf455ReplaceQueuedJobs()'),'New job must wait for safe checkpoint');
assert(direct.includes("App.mf455Launch("),'Use unified launch instead of legacy cover config');
assert(direct.includes("v455Direct:true,v455MetaProviders:metaIds"),'Combined workflow must hand off directly');
assert(handoff.includes("MF439.job=mf455MetadataOptions('both'"),'Both stage must start without a second old config popup');
assert(handoff.includes('mf455ReviewPendingMetadata')&&handoff.includes('mf455FinishManualTitle'),'Manual metadata selection must be actionable');
assert(css.includes('display:flex!important;flex-direction:column!important'),'Cover cards must not squeeze image and title into side columns');
assert(css.includes('font-size:12px!important'),'Background process must be readable');
const logs=[],saves=[];
const library=[{id:'a',title:'Anime',categoryId:'anime',status:'planned',coverUrl:''},
{id:'b',title:'Anime 2',categoryId:'anime',status:'completed',coverUrl:'https://example.org/old.jpg'}];
const env={
 console,Date,Math,Number,String,Array,Object,Map,Set,JSON,Promise,Error,
 S:{library,categories:[{id:'anime',name:'Anime'}],settings:{v453RecoveryPresets:{anime:{
 cover:['jikan'],metadata:['anilist']}}}},
 MF445:{oneId:'',metadataId:'',mode:'cover'},MF447:{active:'cover'},MF451:{journal:null},
 MF424:{ready:true,job:null,running:false,account:'user'},
 MF439:{job:null,working:false,cancel:false},MF442:{process:'',owner:'local'},
 App:{mf446ToggleProvider:()=>{},mf446ProviderAll:()=>{}},
 window:{},document:{getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[]},
 AUTH_USER:{id:'user'},
 mf424Escape:x=>String(x).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;'),
 mf425Icon:()=>'<svg></svg>',
 mf424Defaults:()=>({enabled:['jikan','tmdb'],selection:'hybrid',protection:'safe'}),
 mf439Preferences:()=>({enabled:['anilist','omdb'],maxBatch:250}),
 mf445Providers:mode=>mode==='cover'?[
 {id:'jikan',name:'Jikan',enabled:true,available:true},
 {id:'tmdb',name:'TMDB',enabled:true,available:true}]:[
 {id:'anilist',name:'AniList',enabled:true,available:true},
 {id:'omdb',name:'OMDb',enabled:true,available:true}],
 mf453Presets:()=>env.S.settings.v453RecoveryPresets,
 mf453ProvidersFor:(mode,cat)=>env.S.settings.v453RecoveryPresets?.[cat]?.[mode]||[],
 mf446ScopeIds:()=>['a','b'],mf447ScopeSnapshot:()=>['a','b'],
 mf446State:()=>({mode:'selected',categories:[]}),mf439Item:id=>library.find(x=>x.id===id),
 mf424Account:()=> 'user',mf439Account:()=> 'user',
 mf424Missing:item=>!item.coverUrl,mf442ProcessLease:()=>null,
 mf451PauseActive:async()=>true,mf451Read:()=>null,mf424SaveJob:async()=>{saves.push('cover');},
 mf424Run:async()=>{logs.push('cover-run')},mf439RunBatch:async()=>{logs.push('metadata-run');},
 mf439SaveJob:()=>{saves.push('metadata')},
 mf456LaunchStage:()=>{},mf456WatchRecovery:()=>{},
 mf455MetadataOptions:(kind,ids,providers)=>({schema:1,account:'user',ids,cursor:0,status:'running',completed:0,changed:0,errors:[],startedAt:Date.now(),v455Providers:providers,mode:'parts',partSize:25}),
 mf444Confirm:async()=>true,mf445Close:()=>{logs.push('closed')},
 mf441Paint:()=>{},mf447WriteCombo:x=>{env.combined=x},
 mf447ContinueCombined:async()=>{logs.push('both-next')},
 mf447AllowedIds:ids=>ids,saveState:async()=>{saves.push('settings')},
 mf445Panel:()=>{},mf425SettingsMarkup:()=>'<div class="mf425-settings-actions"></div>',
 mf439SettingsHtml:()=>'<div class="mf439-settings-actions"></div>',
 mf441WorkspaceHtml:()=>'<div></div>',
 mf441CoverRow:()=>'<article></article>',mf441MetadataRow:()=>'<article></article>',
 mf441WidgetHtml:()=>'<aside class="mf441-widget "></aside>',
 mf444Confirm:async()=>true,
 showToast:x=>logs.push(String(x)),mf439ReadJob:()=>null
};
vm.createContext(env);vm.runInContext(direct,env,{filename:'v455-direct.js'});
assert.equal(env.window.MediaFlowV455.version,455);
env.MF445.mode='cover';
env.MF455=vm.runInContext('MF455',env);
vm.runInContext("mf455ApplyCategoryPreset('cover')",env);
assert.deepEqual(Array.from(env.window.MediaFlowV455.selected().cover),['jikan']);
const processing=env.window.MediaFlowV455.processing('cover');
for(const label of ['Processing & matching','Part-by-Part','One-Go','Titles per part','Continuation',
 'Hybrid','Smart Automatic','Provider Priority','Manual Selection','Balanced','Custom','Resume when app reopens'])
 assert(processing.includes(label),label+' control required');
(async()=>{
 await env.App.mf455Launch('cover');
 assert(env.MF424.job&&env.MF424.job.ids.length===1,'Cover batch uses only missing covers');
 assert.deepEqual(Array.from(env.MF424.job.v455Providers),['jikan'],'Category preset applied to cover queue');
 assert(logs.includes('cover-run'),'Cover batch invoked real engine');
 const first=env.MF424.job.id;
 await env.App.mf455Launch('cover');
 assert.notEqual(env.MF424.job.id,first,'New recovery force-replaces stale saved queue');
 env.MF445.mode='metadata';
 vm.runInContext("mf455ApplyCategoryPreset('metadata')",env);
 await env.App.mf455Launch('metadata');
 assert.deepEqual(Array.from(env.MF439.job.ids),['a','b'],'Metadata starts scoped titles');
 assert.deepEqual(Array.from(env.MF439.job.v455Providers),['anilist']);
 assert(logs.includes('metadata-run'),'Metadata batch invoked real engine');
 const old=fs.readFileSync('src/js/components/322-v442-recovery-hardening.js','utf8');
 assert(old.includes("job.v455Selection==='manual'")&&old.includes("job.manualReviewId=id"));
 assert(old.includes("job.mode==='parts'&&job.continuation==='manual'"));
 console.log('PASS v455: forced queue replacement, scoped direct cover/metadata engines, category presets, manual settings and canonical cover save guard');
})().catch(e=>{console.error(e);process.exitCode=1});
