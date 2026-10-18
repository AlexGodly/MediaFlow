/* MediaFlow v493 — pixel-grounded corrections, drafts, storage and isolation. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const file='src/js/components/380-v493-cover-intelligence-corrections.js';
execFileSync('node',['--check',file]);
const js=fs.readFileSync(file,'utf8');
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert(order.includes('components/380-v493-cover-intelligence-corrections.js'));
assert(order.includes('components/381-v494-theme-preview-laboratory.js'));
assert.equal(order.at(-1),'components/386-v498-logging-cover-parity.js');
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'498');
assert.match(fs.readFileSync('index.html','utf8'),/mediaflow-v498\.bundle\.js/);
assert.match(fs.readFileSync('index.html','utf8'),/293-v493-cover-corrections\.css/);
assert.match(fs.readFileSync('assets/css/293-v493-cover-corrections.css','utf8'),/max-width:400px/);
assert(fs.readFileSync('src/js/components/371-v484-visual-evolution-foundation.js','utf8').includes('visualCoverUrl:sampled?.visualCoverUrl'),'Image/hybrid Custom needs sampled cover identity');
let mode='advanced',selectedUrl='https://covers.example/cover-a.jpg',source='image';
let writes=0,refresh=0,custom=0,composes=0,legacy=0;
const toast=[];
const profile={id:'myprofile',source,imageUrl:selectedUrl,appearance:'dark'};
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const hash=s=>{let a=2166136261,b=2246822519;for(const c of s){a=Math.imul(a^c.charCodeAt(0),16777619)>>>0;b=Math.imul(b^c.charCodeAt(0),3266489917)>>>0;}return [a,b]};
const difference=(a,b)=>Math.hypot(...rgb(a).map((v,i)=>v-rgb(b)[i]))/400;
const analyzed=(url)=>({
 visualCoverUrl:url,colors:['#A146D9','#23A8D7','#E3AD61'],
 naturalMode:'dark',
 analysis:{sampledFromPixels:true,pixels:4128,dominantCoverage:.64,
  composition:{selected:'top-left',focusColor:'#A146D9'},
  distribution:[
   {color:'#171A32',percent:64,chroma:.22},
   {color:'#23A8D7',percent:19,chroma:.72},
   {color:'#A146D9',percent:13,chroma:.81},
   {color:'#E3AD61',percent:4,chroma:.53}
  ],
  mood:{signature:{label:'Cinematic / Dramatic'}}},
 colorRoles:{dominantBackground:'#171A32',focal:'#A146D9'}
});
const S={settings:{dynamicCoverTheme:true},view:'settings',
 v146DynamicThemeState:{url:selectedUrl,palette:{mode:'dark'}}};
const MF487_STATE={last:analyzed(selectedUrl)};
const ctx={
 console,Math,JSON,Number,String,Object,Array,Set,Map,Date,
 S,MF487_STATE,MF485:{appliedKey:'cached',pending:null,pendingKey:''},
 MF484_CUSTOM_SEQ:0,V146_DYNAMIC_SEQ:0,
 mf484Prefs:()=>({mode,expressiveness:'balanced'}),
 mf484ActiveProfile:()=>profile,
 mf487ValidUrl:url=>/^https:\/\/[-\w./]+$/.test(url||'')?url:'',
 mf487Key:url=>'cover-'+hash(url).map(x=>x.toString(36)).join('-'),
 mf489HexValid:s=>/^#[a-f0-9]{6}$/i.test(s||''),
 mf489Separation:difference,
 mf489Lch:color=>({L:.55,C:color==='#171A32'?.05:.18,h:275}),
 mf489Gamut:({L,C})=>'#A146D9',
 mf489MakePalette:data=>({mode:'dark',bg:'#10121B',panel:'#181E2C',raised:'#232C3B',
  border:'#414453',borderSoft:'#2F3543',primary:data.colors[0],secondary:data.colors[1],
  tertiary:data.colors[2],text:'#F7F7FC',flow:data.colors[0]}),
 mf491ProtectPalette:palette=>({...palette,onAccent:'#FFFFFF'}),
 mf492ComposePalette:palette=>palette,
 mf484Compose:data=>{composes++;return {data,mode}},
 persistSettings:()=>writes++,
 mf484ApplyCustom:()=>{custom++;},
 v146ScheduleDynamicTheme:()=>{refresh++;},
 showToast:msg=>toast.push(msg),
 escapeHtml:String,
 document:{getElementById:()=>null,querySelector:()=>null},
 window:{MediaFlowSettingsCenter:null},
 MediaFlowRuntime:{registerPageEnhancer:()=>{},version:492},
 App:{}
};
ctx.v160HashString=hash;
vm.createContext(ctx);vm.runInContext(js,ctx,{filename:'v493.js'});
const api=ctx.window.MediaFlowV493;
assert.equal(api.version,493);
assert.equal(api.status().available,true);
const pool=api.status().availableColors;
assert(pool.length>=4,'Colors from source palette and distribution must be available');
assert(!JSON.stringify(api.status()).includes(selectedUrl),'No raw URL in persisted correction report');
const variants=api.variants(MF487_STATE.last);
assert.equal(variants.length,5);
for(const v of variants)assert(v.colors?.length===3,'Variant must return three color roles');
assert.equal(variants.find(x=>x.key==='dominant').colors[0],'#171A32');
assert.notEqual(variants.find(x=>x.key==='dominant').colors[0],variants.find(x=>x.key==='automatic').colors[0]);
const beforeColors=MF487_STATE.last.colors.slice();
assert.equal(ctx.App.mf493Preview('dominant'),true);
assert.equal(api.status().dirty,true);
assert.equal(writes,0,'Preview must not persist any changes');
assert.equal(refresh,0,'Preview must not write live theme');
assert.equal(composes,0,'Preview must not recompute actual theme');
assert.equal(ctx.App.mf493Slot(0,'#E3AD61'),true);
assert.equal(ctx.App.mf493Slot(1,'#DEAD00'),false,'Off-artwork color cannot be selected');
assert.equal(ctx.App.mf493Commit(),true);
assert.equal(writes,1,'Apply persists per-cover correction');
assert.equal(refresh,1,'Apply refreshes guarded dynamic cover');
const record=S.settings.v493CoverCorrections;
const keys=Object.keys(record);
assert.equal(keys.length,1);
assert(!JSON.stringify(record).includes(selectedUrl),'Cloud preferences must contain only artwork hash');
assert(record[keys[0]].slots.includes('#E3AD61'));
const resolved=api.correct(MF487_STATE.last);
assert.notStrictEqual(resolved,MF487_STATE.last,'Correction must be immutable');
assert.equal(resolved.colors[0],'#E3AD61');
assert.equal(resolved.correctionV493.appliedFromSavedSetting,true);
assert.deepEqual(MF487_STATE.last.colors,beforeColors,'Source artwork must not mutate');
const composed=ctx.mf484Compose(MF487_STATE.last,'dark','balanced');
assert.equal(composed.data.colors[0],'#E3AD61','Correction must be upstream of harmony');
const other=analyzed('https://covers.example/cover-b.jpg');
assert.strictEqual(api.correct(other),other,'Other artwork must be unaffected');
// Preview new artwork only when it is actually the current source.
S.v146DynamicThemeState.url=other.visualCoverUrl;
assert.equal(api.status().available,false,'Previous artwork must not appear after cover switch');
assert.equal(ctx.App.mf493Commit(),false,'Stale preview cannot save');
MF487_STATE.last=other;
assert.equal(api.status().available,true);
assert.equal(api.status().saved,false);
assert.equal(ctx.App.mf493Preview('focal'),true);
assert.equal(ctx.App.mf493Commit(),true);
assert.equal(Object.keys(S.settings.v493CoverCorrections).length,2);
assert.equal(ctx.App.mf493Reset(),true);
assert.equal(Object.keys(S.settings.v493CoverCorrections).length,1);
assert.equal(ctx.App.mf493Commit(),false,'Empty draft must not apply');
assert.equal(api.correct(other),other,'Reset restored original palette for this artwork');
// Invalid persisted colors are never admitted as a new source color.
S.settings.v493CoverCorrections={
 'advanced-abc':{variant:'contrast',slots:['#DEAD00','#23A8D7','#E3AD61']},
 [keys[0]]:{variant:'dominant',slots:['#DEAD00','#23A8D7','#E3AD61']}
};
S.v146DynamicThemeState.url=selectedUrl;MF487_STATE.last=analyzed(selectedUrl);
const sanitized=api.correct(MF487_STATE.last);
assert.notEqual(sanitized.colors[0],'#DEAD00','Old arbitrary color override must not inject color');
assert.equal(sanitized.colors[0],'#171A32','Valid variant still usable');
mode='legacy';
assert.strictEqual(api.correct(MF487_STATE.last),MF487_STATE.last);
assert.equal(api.status().available,false);
const writesBefore=writes;
assert.equal(ctx.App.mf493Preview('focal'),false);
assert.equal(ctx.App.mf493Reset(),false);
assert.equal(writes,writesBefore);
mode='custom';profile.source='manual';
assert.equal(api.status().available,false,'Manual Custom does not inherit artwork corrections');
profile.source='image';profile.imageUrl=selectedUrl;
assert.equal(api.status().available,true);
ctx.App.mf493Preview('contrast');assert.equal(ctx.App.mf493Commit(),true);
assert.equal(custom,1,'Custom reapplication only uses its own profile');
assert.equal(api.status().saved,true);
assert.equal(Object.keys(S.settings.v493CoverCorrections).length,3,'Custom scope independent of Advanced scope');
assert(!/S\.library\s*=|S\.history\s*=|S\.sessions\s*=/.test(js));
console.log('PASS v493: five artwork alternatives, real-sampled colors, preview only, explicit save, immutable correction, reset,');
console.log('           source isolation, stale-image rejection, manual Custom/Legacy guard and cloud-safe hashed scopes');
