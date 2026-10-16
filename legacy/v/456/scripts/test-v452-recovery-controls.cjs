/* MediaFlow v452: provider selection, semantic icons and safe stop boundaries. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
assert(['452','453','454','455','456'].includes(fs.readFileSync('VERSION','utf8').trim()));
const runtime=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert(runtime.includes('components/332-v452-recovery-control-polish.js'));
assert(runtime.includes('components/334-v453-quick-title-recovery.js'));
assert(runtime.includes('components/336-v454-quick-title-hardening.js'));
assert(runtime.includes('components/338-v455-recovery-handoff-visibility.js'));
assert.equal(runtime.at(-1),'components/340-v456-recovery-start-status.js');
const source=fs.readFileSync('src/js/components/332-v452-recovery-control-polish.js','utf8');
const cover=fs.readFileSync('src/js/components/309-v424-advanced-cover-recovery.js','utf8');
const meta=fs.readFileSync('src/js/components/322-v442-recovery-hardening.js','utf8');
assert(cover.includes('if(job.stopAfterTitle){job.stopAfterTitle=false;job.stopRequested=true;await mf424SaveJob();break;}'));
assert.equal((meta.match(/mf452StopBoundary\(job\)/g)||[]).length,2,'Metadata handles both found and missing Library titles');
assert(source.includes('data-v225-iconified="1"'),'Button enhancement must not append generic circled arrows');
const notifications=[],modes=[],saved=[];
const providers={
 cover:[{id:'jikan',available:true},{id:'kitsu',available:true},{id:'restricted',available:false}],
 metadata:[{id:'anilist',available:true},{id:'itunes',available:true},{id:'private',available:false}]
};
const env={
 console,Map,Set,Date,JSON,Object,Number,String,Array,Math,Error,Promise,
 window:{},document:{getElementById:()=>({querySelector:()=>({})})},
 MF447:{active:'both'},MF445:{mode:'cover'},MF424:{job:null,running:false},
 MF439:{job:null,working:false},App:{},S:{settings:{}},
 mf445Providers:m=>providers[m],mf446SourceHtml:()=>'<section><div class="mf446-provider-tools"><button>Enable available</button><button>Disable all</button></div></section>',
 mf446ProviderAll:()=>{},mf446ToggleProvider:()=>{},
 mf424Defaults:()=>({enabled:env.S.settings?.v424Covers?.enabled||['restricted']}),
 mf439Preferences:()=>({enabled:env.S.settings?.v439Metadata?.enabled||['private'],batchSize:25}),
 mf445Panel:mode=>modes.push(mode),
 saveState:()=>{saved.push(1);return Promise.resolve()},
 mf424Escape:s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'),
 mf439Item:()=>null,showToast:s=>notifications.push(s),
 libraryModalHtml:()=>'<div>Original editor</div>',v181TitleDetailsHtml:()=>'<div>Original details</div>',
 mf449DraftButtons:()=>'<button disabled>Fix Metadata</button>',
 mf424SaveJob:async()=>{},mf424Paint:()=>{},mf441Paint:()=>{},mf439SaveJob:()=>{},mf439PaintJob:()=>{},
 mf441CoverRow:()=>'<article><div class="mf441-process-actions"><button class="mf451-stop">old square</button></div></article>',
 mf441MetadataRow:()=>'<article><div class="mf441-process-actions"><button class="mf451-stop">old square</button></div></article>',
 mf441WidgetHtml:()=>'<aside><div class="mf441-widget-foot"><button class="mf451-stop" onclick="App.mf451Stop(&#39;all&#39;)">Stop All</button></div></aside>',
 mf441WorkspaceHtml:()=>'<section></section>'
};
env.App.mf424Resume=()=>{};env.App.mf439Resume=()=>{};
vm.createContext(env);vm.runInContext(source,env,{filename:'v452.js'});
(async()=>{
 const api=env.window.MediaFlowV452;
 assert.equal(api.version,452);
 const coverTools=api.sourceHtml('cover'),metaTools=api.sourceHtml('metadata');
 for(const html of [coverTools,metaTools]){
  assert(html.includes('Select All')&&html.includes('Deselect All'));
  assert(!html.includes('Enable available')&&!html.includes('Disable all'));
  assert(html.includes('mf452-icon-selectAll')&&html.includes('mf452-icon-deselectAll'));
  assert(html.includes('data-v225-iconified="1"'));
  assert(!html.includes('v225-btn-icon'));
 }
 assert(coverTools.includes('mf446ProviderAll(&quot;cover&quot;,true)')===true,'HTML-escaped quote characters keep inline JavaScript attributes executable');
 env.mf446ProviderAll('cover',true);
 assert.deepEqual(Array.from(env.S.settings.v424Covers.enabled),['jikan','kitsu']);
 env.mf446ProviderAll('metadata',true);
 assert.deepEqual(Array.from(env.S.settings.v439Metadata.enabled),['anilist','itunes']);
 env.mf446ProviderAll('cover',false);
 assert.deepEqual(Array.from(env.S.settings.v424Covers.enabled),[]);
 env.mf446ToggleProvider('metadata','itunes',false);
 assert.deepEqual(Array.from(env.S.settings.v439Metadata.enabled),['anilist']);
 env.mf446ProviderAll('metadata',false);
 assert.deepEqual(Array.from(env.S.settings.v439Metadata.enabled),[]);
 assert(modes.length===5&&modes.every(x=>x==='both'),'Both tab must remain selected');
 assert(saved.length>=5);
 const m={ids:Array.from({length:74},(_,i)=>String(i)),cursor:4,status:'running'};
 env.MF439.job=m;env.MF439.working=true;
 env.App.mf452StopAfter('metadata','part');
 assert.equal(m.stopAtCursor,25);assert.equal(m.stopPartSize,25);
 m.cursor=24;assert.equal(api.boundary(m),false);
 m.cursor=25;assert.equal(api.boundary(m),true);assert.equal(m.stopRequested,true);
 const n={ids:['a','b'],cursor:0,status:'running'};
 env.MF439.job=n;
 env.App.mf452StopAfter('metadata','title');
 assert.equal(n.stopAfterTitle,true);
 n.cursor=1;assert.equal(api.boundary(n),true);assert.equal(n.stopAfterTitle,false);
 env.MF424.job={ids:['one','two'],cursor:0,status:'running'};
 env.MF424.running=true;
 await env.App.mf452StopAfter('cover','title');
 assert.equal(env.MF424.job.stopAfterTitle,true);assert.equal(env.MF424.job.stopRequested,undefined);
 await env.App.mf452StopAfter('cover','part');
 assert.equal(env.MF424.job.stopAfterPart,true);assert.equal(env.MF424.job.stopAfterTitle,false);
 const row=api.coverRow({cover:env.MF424.job});
 assert(row.includes('Stop Now')&&row.includes('Stop After Title')&&row.includes('Stop After Part'));
 assert(row.includes('mf452-icon-stopTitle')&&row.includes('mf452-icon-stopPart'));
 assert(!row.includes('old square'));
 env.MF439.job={ids:['x'],cursor:0,status:'running'};
 const metaRow=api.metadataRow({metadata:env.MF439.job});
 assert(metaRow.includes('Stop Now')&&metaRow.includes('Stop After Title')&&metaRow.includes('Stop After Part'));
 assert(!metaRow.includes('old square'));
 assert(source.includes('querySelectorAll')&&source.includes('Fix Metadata'));
 assert(fs.readFileSync('index.html','utf8').includes('259-v452-recovery-controls.css'));
 const css=fs.readFileSync('assets/css/259-v452-recovery-controls.css','utf8');
 assert(css.includes('var(--flow)')&&css.includes('@media(max-width:330px)'));
 console.log('PASS v452: correct provider selection in Cover/Metadata/Both, original tab retained, safe stop boundaries, unique icons and editor cleanup');
})().catch(e=>{console.error(e);process.exitCode=1;});
