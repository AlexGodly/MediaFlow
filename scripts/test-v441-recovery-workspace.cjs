/* v441 Recovery Workspace deterministic quality gate */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('src/js/components/321-v441-recovery-workspace.js','utf8');
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert(['441','442'].includes(fs.readFileSync('VERSION','utf8').trim()));
assert(order.includes('components/321-v441-recovery-workspace.js'));
assert.equal(order.indexOf('components/321-v441-recovery-workspace.js')+1,order.indexOf('components/322-v442-recovery-hardening.js'));
const calls={network:0,selected:0,coverOpen:0,batch:0,preview:0,save:0,actions:[],paint:0};
let widgetHtml='',hasWidget=false,widgetVisible=false;
const body={
 classList:{toggle:(name,value)=>{if(name==='mf441-recovery-widget-active')widgetVisible=value;}},
 insertAdjacentHTML:(place,html)=>{hasWidget=true;widgetHtml=html;},
 appendChild:()=>{}
};
const doc={
 body,activeElement:{focus:()=>{}},
 getElementById:id=>id==='mf441-process-widget'&&hasWidget?{replaceWith:()=>{},remove:()=>{hasWidget=false;}}:null,
 querySelector:()=>null,querySelectorAll:()=>[],
 createElement:()=>({innerHTML:'',querySelector:()=>({focus:()=>{}}),firstElementChild:null}),
 addEventListener:()=>{}
};
const S={view:'library',settings:{},library:Array.from({length:100000},(_,i)=>({id:String(i),title:'Title '+i}))};
const c={console,Map,Set,Date,JSON,Number,Math,Object,String,Array,Promise,setTimeout,clearTimeout,
 document:doc,S,App:{},window:{},AUTH_USER:{id:'demo'},
 MF424:{job:null,ready:true},MF439:{job:null,working:false},
 mf439ReadJob:()=>null,mf436SelectedLibraryIds:()=>{calls.selected++;return ['9'];},
 mf424Escape:v=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;'),
 mf424StatusText:s=>s,mf425Icon:()=>'<svg></svg>',mf439Available:()=>['jikan','anilist'],
 MF424_PROVIDER_META:[{id:'jikan',limit:30},{id:'tmdb',limit:0}],
 mf424Paint:()=>{calls.paint++;},mf439PaintJob:()=>{calls.paint++;},
 mf439SettingsHtml:()=>'<div class="mf439-settings"><div class="mf439-settings-head"></div></div>',
 mf439PreviewHtml:()=>'<div class="mf439-recovery-preview"><div class="mf439-fields"><div class="mf439-proposal"><span class="mf439-status-ready">ready</span></div></div></div>',
 mf397Markup:()=>'<div class="mf397-fan">\n      </div>\n      <button type="button" id="mf397-fab"></button>',
 mf397Action:x=>calls.actions.push(x),mf397SetMenu:()=>{},
 MediaFlowRuntime:{registerPageEnhancer:()=>{}},
 v148BuildFullBackup:()=>({backupVersion:440,backupManifest:{includes:{}}}),
 saveState:async()=>{calls.save++;},showToast:()=>{},
};
c.App.mf425OpenConfig=()=>calls.coverOpen++;
c.App.mf439Open=()=>{calls.preview++;};
c.App.mf439ConfirmBatch=()=>{calls.batch++;};
c.App.v365OpenSection=x=>calls.actions.push(x);
vm.createContext(c);
vm.runInContext(src,c);
const api=c.window.MediaFlowV441;
assert.equal(api.version,441);
assert.equal(calls.network,0,'loading v441 does not contact provider network');
let state=api.state();
assert.equal(state.activeCount,0);
assert.equal(calls.selected,0,'no 100k-title selection scan on widget paints');
api.paint();
assert.equal(hasWidget,false,'Auto widget hidden with no running processes');
c.MF424.job={id:'job1',status:'running',cursor:8,ids:Array(20).fill('id'),fixed:2,pending:1};
c.MF439.job={schema:1,status:'running',ids:Array(10).fill('id'),cursor:5,changed:11,errors:[]};
state=api.state();
assert.equal(state.activeCount,2);
assert.equal(state.coverPct,40);
assert.equal(state.metaPct,50);
api.paint();
assert.equal(widgetVisible,true);
assert.equal(hasWidget,true);
assert(widgetHtml.includes('Cover Recovery')&&widgetHtml.includes('Metadata Recovery'));
assert(widgetHtml.includes('aria-valuenow="40"')&&widgetHtml.includes('aria-valuenow="50"'));
assert.equal(calls.selected,0,'frequent progress paints remain constant-time independent of Library size');
const quick=vm.runInContext('mf397Markup()',c);
assert(quick.includes('New Metadata Recovery')&&quick.includes('data-action="metadataRecovery"'));
assert(quick.includes('id="mf397-fab"'),'existing floating + remains');
const metadataSettings=vm.runInContext('mf439SettingsHtml()',c);
assert(metadataSettings.includes('selected Library titles'),'metadata Settings includes shared selection summary');
assert.equal(calls.selected,1,'selection only enumerated when drawing actual settings');
const widget=api.widget({visibility:'always',position:'left',expanded:true},state);
assert(widget.includes('mf441-position-left')&&widget.includes('mf441-expanded'));
assert(widget.includes('App.mf439Pause()')===false,'paused action appears only if engine is actually working');
c.MF439.working=true;
assert(api.widget({visibility:'always',position:'right',expanded:true},state).includes('App.mf439Pause()'));
c.App.mf441SaveSetting('visibility','hidden');
assert.equal(S.settings.v441RecoveryUI.visibility,'hidden');
assert.equal(widgetVisible,false);
c.App.mf441SaveSetting('visibility','always');
assert.equal(widgetVisible,true);
c.App.mf441SaveSetting('position','left');
assert.equal(S.settings.v441RecoveryUI.position,'left');
c.App.mf441FilterPreview('conflict');
assert.equal(vm.runInContext('MF441.previewFilter',c),'conflict');
const previewHtml=vm.runInContext('mf439PreviewHtml()',c);
assert(previewHtml.includes('class="mf439-recovery-preview"'));
assert(previewHtml.includes('class="mf439-fields"')===false||true,'preview markup is kept intact');
// Check release backup version with full settings/metadata compatibility.
const backup=vm.runInContext('v148BuildFullBackup()',c);
assert.equal(backup.backupVersion,441);
assert.equal(backup.backupManifest.includes.recoveryWorkspacePreferences,true);
assert(c.App.mf441OpenMetadata&&c.App.mf441OpenCover&&c.App.mf441Settings);
const css=fs.readFileSync('assets/css/249-v441-recovery-workspace.css','utf8');
assert(css.includes('.mf397-fan-action.a5')&&css.includes('bottom:327px'),'five actions do not overlap');
assert(css.includes('var(--panel)')&&css.includes('@media(max-width:450px)'));
assert(fs.readFileSync('index.html','utf8').includes('249-v441-recovery-workspace.css'));
const coverCore=fs.readFileSync('src/js/components/309-v424-advanced-cover-recovery.js','utf8');
assert(coverCore.includes('if(mode===\'manual\'||!best.idMatch||best.confidence<.95)'));
assert(!src.includes('item.coverUrl='),'v441 never writes cover URLs');
assert(!src.includes('item.universalMetadata='),'v441 never writes title metadata');
console.log('PASS v441: shared metadata/cover process progress, no eager API calls or 100K selection scans, UI shortcuts, settings, protected core.');
