/* MediaFlow v485 — executable owner/rollback/timer/atmosphere contract.
 * Run with node; no browser dependency or external network required.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),prefix='src/js/components/';
const runtime=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert(runtime.includes('components/372-v485-visual-engine-ownership.js'));
assert(runtime.includes('components/373-v486-universal-cover-source-intelligence.js'));
assert(runtime.includes('components/374-v487-advanced-artwork-pixel-analysis.js'));
assert(runtime.includes('components/375-v488-composition-salience.js'));
assert(runtime.includes('components/376-v489-perceptual-color-harmony.js'));
assert(runtime.includes('components/377-v490-artwork-mood-atmosphere.js'));
assert(runtime.includes('components/378-v491-perceptual-readability.js'));
assert(runtime.includes('components/379-v492-smart-palette-expressiveness.js'));
assert(runtime.includes('components/380-v493-cover-intelligence-corrections.js'));
assert(runtime.includes('components/381-v494-theme-preview-laboratory.js'));
assert.equal(runtime.at(-1),'components/385-v497-living-visual-direction.js');
assert.ok(runtime.includes('components/371-v484-visual-evolution-foundation.js'));
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'497');
const source=fs.readFileSync(prefix+'372-v485-visual-engine-ownership.js','utf8');
execFileSync('node',['--check',prefix+'372-v485-visual-engine-ownership.js']);
const index=fs.readFileSync('index.html','utf8');
assert.match(index,/mediaflow-v497\.bundle\.js/);
assert.match(index,/285-v485-visual-engine-health\.css/);
const css=fs.readFileSync('assets/css/285-v485-visual-engine-health.css','utf8');
assert.match(css,/max-width:480px/);
const makeStyle=()=>{
 const map=new Map();
 return {
  setProperty:(k,v)=>map.set(k,v),getPropertyValue:k=>map.get(k)||'',
  removeProperty:k=>map.delete(k),_map:map
 };
};
const rootElement={dataset:{},style:makeStyle()};
const hosts=new Map(),counts={applies:0,clears:0,fallbacks:0,sourceTimer:0,rotation:0,
 stopRotation:0,atmosphere:0,theme:0,custom:0,toast:0};
const profile={id:'example',name:'Nebula',colors:['#152443','#B568DB','#28B5C1','#EDAB5B'],
 source:'manual',imageUrl:'',appearance:'dark',variation:'cinematic'};
const prefs={mode:'legacy',expressiveness:'balanced',
 living:{mode:'off',intensity:'balanced',source:'intelligent',performance:'auto',
 effects:{gradients:true,lighting:true,transitions:true}},active:'example',profiles:[profile]};
const normal={
 mode:'dark',bg:'#10121B',panel:'#191F2A',raised:'#232C3B',
 border:'#3C4050',borderSoft:'#262D40',text:'#F5F7F9',textDim:'#BBC1D2',
 textMute:'#8890A5',flow:'#AD68EC',flowDim:'#504272',primary:'#AD68EC',
 secondary:'#25B5CC',tertiary:'#F5B769'
};
const S={settings:{dynamicCoverTheme:true},v146DynamicThemeState:{source:'theme',palette:null}};
const document={
 documentElement:rootElement,
 getElementById:id=>hosts.get(id)||null,
 visibilityState:'visible',addEventListener:()=>{}
};
const window={addEventListener:()=>{},confirm:()=>true,MediaFlowSettingsCenter:null};
const timers=new Set();
const context={
 console,Promise,Date,JSON,Math,Object,String,Number,
 clearTimeout:t=>timers.delete(t),
 setTimeout:fn=>{const id=timers.size+1;timers.add(id);return id;},
 DEFAULT_SETTINGS:{},S,window,document,navigator:{connection:{saveData:false}},
 getComputedStyle:()=>({getPropertyValue:key=>rootElement.style.getPropertyValue(key)||'#A682E8'}),
 v146ApplyFullPalette(p,src){
  counts.applies++;
  if(p.flow==='#DEAD00')throw Error('synthetic renderer failure');
  S.v146DynamicThemeState={source:src.source,label:src.label||'',palette:p};
  rootElement.dataset.v146DynamicActive='1';
  rootElement.style.setProperty('--flow',p.flow);
  return true;
 },
 v146ClearInlineThemeVars(){counts.clears++;delete rootElement.dataset.v146DynamicActive;},
 v146RestoreSelectedThemeFallback(){counts.fallbacks++;S.v146DynamicThemeState={source:'theme',palette:null};},
 applyTheme(){counts.theme++;},
 v159EnsureDynamicSourceTimer(){counts.sourceTimer++;},
 v162EnsureRotationTimer(){counts.rotation++;},
 v162StopRotation(){counts.stopRotation++;},
 V159_FORCED_THEME_SOURCE:null,V159_DYNAMIC_SOURCE_TIMER:null,
 V146_DYNAMIC_SEQ:0,MF484_CUSTOM_SEQ:0,
 mf484Prefs:()=>prefs,mf484ActiveProfile:()=>profile,
 mf484ImageUrl:s=>String(s||''),mf484Hex:(value,fallback='#8B5CF6')=> /^#[0-9a-f]{6}$/i.test(value||'')?value:fallback,
 mf484AllowMotion:()=>true,
 mf484ApplyAtmosphere(p){
  // Match v484's real Legacy+Off no-op/cleanup branch.
  if(prefs.mode==='legacy'&&prefs.living.mode==='off'){
   context.mf484Clear();return;
  }
  counts.atmosphere++;
  rootElement.dataset.mf484Mode=prefs.mode;
  rootElement.style.setProperty('--mf484-a',p.primary||p.flow);
  rootElement.style.setProperty('--mf484-b',p.secondary||p.flowDim);
  hosts.set('mf484-atmosphere',{id:'mf484-atmosphere'});
 },
 mf484Clear(){hosts.delete('mf484-atmosphere');delete rootElement.dataset.mf484Mode;},
 mf484ApplyCustom:async()=>{
  counts.custom++;
  context.v146ApplyFullPalette({...normal},{source:'custom',label:'Nebula'});
  return true;
 },
 mf484Sync:()=>true,showToast:()=>{counts.toast++;},escapeHtml:String,
 MediaFlowRuntime:{registerPageEnhancer:()=>{},version:484}
};
context.App={
 mf484SetMode(mode){prefs.mode=mode;return mode;},
 mf484SetOption(key,value){if(key==='living.mode')prefs.living.mode=value;return value;},
 mf484SaveStudio(){return true;},mf484SelectProfile(){return true;},
 mf484DuplicateProfile(){return true;},mf484DeleteProfile(){return true;},
 setThemeCollection(kind){return kind;}
};
vm.createContext(context);vm.runInContext(source,context,{filename:'v485-theme-ownership.js'});
(async()=>{
 const api=window.MediaFlowV485;
 assert.equal(api.version,485);
 assert.equal(api.status().mode,'legacy');
 assert.equal(api.status().atmosphere,'off');
 // Old dynamic cover is untouched when Legacy is selected.
 assert.equal(context.v146ApplyFullPalette({...normal},{source:'recommended',label:'Cover'}),true);
 assert.equal(counts.applies,1);
 // Switching to Custom cancels stale async writers and source timers.
 context.App.mf484SetMode('custom');
 await context.mf484ApplyCustom();
 assert.equal(api.status().mode,'custom');
 const before=counts.applies;
 context.v146ApplyFullPalette({...normal},{source:'onthisday',label:'stale cover'});
 assert.equal(counts.applies,before,'Custom palette must never be overwritten by cover');
 const oldFallbacks=counts.fallbacks,oldClears=counts.clears;
 context.v146RestoreSelectedThemeFallback();
 context.v146ClearInlineThemeVars();
 assert.equal(counts.fallbacks,oldFallbacks,'stale fallback refused');
 assert.equal(counts.clears,oldClears,'stale color wipe refused');
 context.v162EnsureRotationTimer(true);
 context.v159EnsureDynamicSourceTimer();
 assert.equal(counts.rotation,0,'cover timer suspended for Custom');
 assert.equal(counts.sourceTimer,0,'source timer suspended for Custom');
 assert.ok(counts.stopRotation>0);
 // Repeated identical atmosphere requests preserve running visual nodes.
 prefs.living.mode='advanced';
 context.mf484ApplyAtmosphere({...normal},'');
 const effectsBefore=counts.atmosphere;
 context.mf484ApplyAtmosphere({...normal},'');
 assert.equal(counts.atmosphere,effectsBefore,'same atmosphere must not restart');
 // Invalid palettes are rejected, even if called directly.
 context.v146ApplyFullPalette({...normal,bg:'invalid'},{source:'custom',label:'wrong'});
 assert.equal(counts.applies,before,'invalid palette rejected');
 // Changing away from Custom cancels its ownership and resumes saved cover timers.
 context.App.mf484SetMode('legacy');
 assert.equal(api.status().mode,'legacy');
 assert.ok(counts.rotation>=1&&counts.sourceTimer>=1,'cover rotation resumes on Legacy');
 const legacyWrites=counts.applies;
 context.v146ApplyFullPalette({...normal},{source:'custom',label:'late custom'});
 assert.equal(counts.applies,legacyWrites,'late Custom writer rejected in Legacy');
 assert.equal(context.v146ApplyFullPalette({...normal},{source:'recommended',label:'Cover 2'}),true);
 // Failed but syntactically valid palette update restores previous valid palette.
 const recoveredBefore=api.status().restored;
 context.v146ApplyFullPalette({...normal,flow:'#DEAD00'},{source:'recommended',label:'broken'});
 assert.equal(api.status().restored,recoveredBefore+1);
 assert.ok(api.status().lastError.includes('failed'));
 // In a static collection, an outdated dynamic job is ignored.
 S.settings.dynamicCoverTheme=false;
 const beforeStatic=counts.applies;
 context.v146ApplyFullPalette({...normal},{source:'recommended',label:'stale'});
 assert.equal(counts.applies,beforeStatic);
 // Living Effects are optional even on Legacy. Explicit Off must clear them.
 context.App.mf484SetOption('living.mode','off');
 context.mf484ApplyAtmosphere(normal,'');
 assert.ok(!hosts.has('mf484-atmosphere'));
 assert.equal(api.status().mode,'legacy');
 assert.ok(api.status().blockedStale>=4);
 console.log('PASS v485: legacy preserved, Custom owner guarded, stale themes blocked, timers suspended/resumed,');
 console.log('          invalid palette rejected, rollback recovers last-good, atmosphere stable, static fallback safe');
})().catch(err=>{console.error(err);process.exitCode=1;});
