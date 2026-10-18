/* MediaFlow v486 — Universal Source Contract & Behavioral Regression.
 * Run with Node; no browser/network required. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const p='src/js/components/373-v486-universal-cover-source-intelligence.js';
const code=fs.readFileSync(p,'utf8');
execFileSync('node',['--check',p]);
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert(order.includes('components/373-v486-universal-cover-source-intelligence.js'));
assert(order.includes('components/374-v487-advanced-artwork-pixel-analysis.js'));
assert(order.includes('components/375-v488-composition-salience.js'));
assert(order.includes('components/376-v489-perceptual-color-harmony.js'));
assert(order.includes('components/377-v490-artwork-mood-atmosphere.js'));
assert(order.includes('components/378-v491-perceptual-readability.js'));
assert(order.includes('components/379-v492-smart-palette-expressiveness.js'));
assert.equal(order.at(-1),'components/380-v493-cover-intelligence-corrections.js');
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'493');
assert.match(fs.readFileSync('index.html','utf8'),/mediaflow-v493\.bundle\.js/);
assert.match(fs.readFileSync('index.html','utf8'),/286-v486-cover-source-intelligence\.css/);
const css=fs.readFileSync('assets/css/286-v486-cover-source-intelligence.css','utf8');
assert.match(css,/max-width:480px/);
const expectedModes=['dynamic','recommended-only','onthisday-only','source-picker','library','image'];
let mode='dynamic',owner='legacy',refreshes=0,applied=0,scheduled=0,rendered=0;
const rec={source:'recommended',label:'Recommendation A',url:'https://covers.example/rec.png',libraryId:'r'};
const otd={source:'onthisday',label:'On This Day B',url:'https://covers.example/otd.png',libraryId:'b'};
const lib={source:'librarytheme',label:'Library C',url:'https://covers.example/lib.png',libraryId:'c'};
const img={source:'imagetheme',label:'Image D',url:'https://covers.example/url.png'};
const pools={
 dynamic:[rec,otd],
 'recommended-only':[rec],
 'onthisday-only':[otd],
 'source-picker':[otd,rec],
 library:[lib,rec],
 image:[img,lib]
};
const html={};
const S={settings:{
 dynamicCoverTheme:true,
 v162LibraryTheme:{titleIds:['c','r'],intervalSec:42},
 v162ImageTheme:{urls:[img.url],intervalSec:23},
 v173RecommendedTheme:{intervalSec:51},
 v173OnThisDayTheme:{intervalSec:61},
 v173SourcePickerTheme:{selectedKeys:['otd:b','recommended'],intervalSec:71}
},v146DynamicThemeState:{palette:null,source:'theme'}};
const root={dataset:{}},document={
 documentElement:root,
 getElementById:id=>html[id]||null,
 querySelector:()=>null
};
const win={MediaFlowSettingsCenter:null};
const context={
 console,JSON,Math,Date,Object,String,Array,Number,Map,Set,Promise,
 window:win,document,S,
 v160HashString(s){let a=2166136261,b=2246822519;for(let i=0;i<s.length;i++){a=Math.imul(a^s.charCodeAt(i),16777619)>>>0;b=Math.imul(b^s.charCodeAt(i),3266489917)>>>0;}return [a,b];},
 v160SafeCoverUrl:url=>(/^https?:\/\//.test(url)||/^data:image\//.test(url))?url:'',
 v162ClampInterval:n=>Math.max(5,Math.min(3600,Number(n)||30)),
 v162ThemeMode:()=>mode,
 mf484Prefs:()=>({mode:owner}),
 v162ThemeSources:()=>pools[mode]||[],
 v146RefreshDynamicTheme:async()=>{
  refreshes++;
  if(owner==='custom')return;
  const sources=context.v162ThemeSources();
  for(const src of sources){
   if(src.url.includes('fail'))continue;
   const palette={mode:'dark',bg:'#112233',flow:'#ABCDEF'};
   context.v146ApplyFullPalette(palette,src);
   return;
  }
 },
 v146ApplyFullPalette:(palette,source)=>{
  applied++;
  S.v146DynamicThemeState={palette,source:source.source};
  root.dataset.v146DynamicActive='1';
 },
 v146ScheduleDynamicTheme:()=>{scheduled++;},
 MediaFlowRuntime:{registerPageEnhancer:()=>{},version:485},
 App:{setThemeCollection:kind=>{rendered++;return kind;}},
 showToast:()=>{},
 escapeHtml:s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;'),
};
vm.createContext(context);
vm.runInContext(code,context,{filename:'v486-sources.js'});
(async()=>{
 const api=win.MediaFlowV486;
 assert.equal(api.version,486);
 assert.deepEqual(Object.keys(api.registry).sort(),expectedModes.sort());
 // The Legacy engine gets exactly the old arrays and source instances.
 for(const key of expectedModes){
  mode=key;owner='legacy';
  const got=context.v162ThemeSources();
  assert.equal(got,pools[key],key+' Legacy source array identity changed');
  assert.equal(got[0],pools[key][0],key+' Legacy source ordering changed');
 }
 // Advanced normalizes metadata but leaves candidate order, labels and URLs.
 for(const key of expectedModes){
  mode=key;owner='advanced';
  const got=context.v162ThemeSources();
  assert.equal(got.length,pools[key].length);
  for(let i=0;i<got.length;i++){
   assert.equal(got[i].url,pools[key][i].url,key+' URL changed');
   assert.equal(got[i].label,pools[key][i].label,key+' label changed');
   assert.equal(got[i].source,pools[key][i].source,key+' kind changed');
   assert.equal(got[i].libraryId,pools[key][i].libraryId);
   assert.ok(got[i].mf486Id,'Source identity missing');
  }
  assert.equal(api.sources().count,pools[key].length);
 }
 // Source-picker must obey chosen order, not reinsert unselected items.
 mode='source-picker';pools[mode]=[otd];context.v162ThemeSources();
 assert.equal(api.sources().count,1);
 assert.equal(api.sources().sources[0].kind,'onthisday');
 assert.equal(api.sources().interval,'71 seconds');
 // Invalid candidates are skipped in Advanced, but never dropped in Legacy.
 const invalid={source:'imagetheme',label:'Broken',url:'javascript:bad'};
 mode='image';pools.image=[invalid,img];
 owner='legacy';assert.equal(context.v162ThemeSources().length,2);
 owner='advanced';const valid=context.v162ThemeSources();
 assert.equal(valid.length,1);assert.equal(valid[0].url,img.url);
 assert.equal(api.sources().count,2);assert.ok(api.sources().invalid>=1);
 // A failed preferred source uses next configured cover as safe fallback.
 mode='library';pools.library=[{...lib,url:'https://covers.example/fail.png'},rec];
 await context.v146RefreshDynamicTheme();
 const status=api.sources();
 assert.equal(status.active.kind,'recommended');
 assert.equal(status.active.index,1);
 assert.equal(status.fallbacks,1);
 assert.equal(status.outcome,'Fallback artwork selected');
 // Detect artwork URL changes while maintaining stable per-Library identity.
 pools.library=[lib,rec];context.v162ThemeSources();
 const first=api.sources().sources[0];
 pools.library=[{...lib,url:'https://covers.example/new.png'},rec];
 context.v162ThemeSources();
 const second=api.sources().sources[0];
 assert.equal(first.id,second.id);
 assert.notEqual(first.fingerprint,second.fingerprint);
 assert.ok(api.sources().changes>=1);
 // Legacy still applies the original source without modifying palette shape.
 mode='dynamic';owner='legacy';const before=applied;
 await context.v146RefreshDynamicTheme();
 assert.ok(applied>before);
 // No source operation should fetch media based on a diagnostic read.
 const oldRefreshCount=refreshes;
 const lastSource=context.v162ThemeSources();
 api.sources();api.sources();
 assert.equal(refreshes,oldRefreshCount);
 assert.equal(lastSource,pools.dynamic);
 // Custom remains independent of the cover resolver and controls.
 owner='custom';
 const original=context.v162ThemeSources();
 assert.equal(original,pools.dynamic);
 const beforeCustom=refreshes;
 await context.v146RefreshDynamicTheme();
 assert.equal(refreshes,beforeCustom+1); // delegates existing Custom implementation
 assert.equal(api.sources().owner,'custom');
 const beforeManual=scheduled;
 api.refresh();assert.equal(scheduled,beforeManual);
 owner='advanced';api.refresh();assert.equal(scheduled,beforeManual+1);
 context.App.setThemeCollection('library-cover');
 assert.equal(api.sources().count,0);
 assert.equal(rendered,1);
 // Rendering diagnostics must never include a raw full cover URL.
 mode='image';owner='advanced';pools.image=[img];
 context.v162ThemeSources();
 const panel=context.mf486StatusHtml();
 assert.ok(panel.includes('Image URL Themes'));
 assert.ok(!panel.includes('https://covers.example/'));
 assert.ok(!panel.includes('undefined'));
 console.log('PASS v486: six cover source policies, exact Legacy ordering, Advanced metadata,');
 console.log('          selected picker, fallback order, source revision, no network diagnostics, Custom isolation');
})().catch(e=>{console.error(e);process.exitCode=1;});
