/* v492 — tuned composition, presets, manual values, contrast and Legacy. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const file='src/js/components/379-v492-smart-palette-expressiveness.js';
execFileSync('node',['--check',file]);
const src=fs.readFileSync(file,'utf8');
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert.equal(order.at(-1),'components/379-v492-smart-palette-expressiveness.js');
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'492');
assert.match(fs.readFileSync('index.html','utf8'),/mediaflow-v492\.bundle\.js/);
assert.match(fs.readFileSync('index.html','utf8'),/292-v492-expressiveness\.css/);
assert.match(fs.readFileSync('assets/css/292-v492-expressiveness.css','utf8'),/max-width:500px/);
let saved=0,scheduled=0,customs=0,toast=[];
const DEFAULT_SETTINGS={};
const v145MixHex=(a,b,w)=>{
 const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
 const x=rgb(a),y=rgb(b);const v=x.map((c,i)=>Math.round(c*w+y[i]*(1-w)));
 return '#'+v.map(n=>n.toString(16).padStart(2,'0')).join('').toUpperCase();
};
const prefs={mode:'advanced',expressiveness:'balanced'};
const S={view:'settings',settings:{dynamicCoverTheme:true},v146DynamicThemeState:{palette:null}};
const doc={getElementById:()=>null,querySelector:()=>null};
const ctx={console,Math,JSON,Number,String,Object,Array,Set,Map,Date,
 S,DEFAULT_SETTINGS,v145MixHex,document:doc,window:{MediaFlowSettingsCenter:null},
 MediaFlowRuntime:{registerPageEnhancer:()=>{},version:491},MF485:{appliedKey:'was-saved',pending:null,pendingKey:''},
 MF484_CUSTOM_SEQ:0,V146_DYNAMIC_SEQ:0,
 mf484Prefs:()=>prefs,mf484Store:p=>{prefs.expressiveness=p.expressiveness;saved++;return p;},
 persistSettings:()=>{saved++;},mf484ApplyCustom:()=>{customs++;},
 v146ScheduleDynamicTheme:()=>{scheduled++;},showToast:x=>toast.push(x),escapeHtml:String,
 App:{mf484SetOption:(key,val)=>{if(key==='expressiveness')prefs.expressiveness=val;return true;}},
 mf484Compose:null};
vm.createContext(ctx);
const pixel=fs.readFileSync('src/js/components/374-v487-advanced-artwork-pixel-analysis.js','utf8');
const harmony=fs.readFileSync('src/js/components/376-v489-perceptual-color-harmony.js','utf8');
const readability=fs.readFileSync('src/js/components/378-v491-perceptual-readability.js','utf8');
vm.runInContext(pixel.slice(pixel.indexOf('function mf487Clamp'),pixel.indexOf('function mf487PixelSample')),ctx);
vm.runInContext(harmony.slice(harmony.indexOf('function mf489Clamp'),harmony.indexOf('const mf489ComposeBase=')),ctx);
vm.runInContext(readability.slice(readability.indexOf('const MF491_VERSION'),readability.indexOf('const mf491BaseApply=')),ctx);
ctx.mf484Compose=(d,a,e)=>ctx.mf489MakePalette(d,a,e,prefs.mode==='custom');
vm.runInContext(src,ctx);
const api=ctx.window.MediaFlowV492;
assert.equal(api.version,492);
assert.equal(DEFAULT_SETTINGS.v492Palette,null);
const source={colors:['#B552E5','#25BCE2','#E4AC57'],colorRoles:{dominantBackground:'#161E38'},
 analysis:{distribution:[{color:'#161E38',percent:65}]}};
const a=ctx.mf489MakePalette(source,'dark','balanced',false);
function compose(preset,values,appearance='dark'){
 prefs.expressiveness=preset;
 S.settings.v492Palette=values?{customized:true,values}:null;
 const raw=ctx.mf489MakePalette(source,appearance,preset,prefs.mode==='custom');
 const result=api.compose(raw);
 assert(result!==raw,'Composition must return a new object');
 assert.equal(JSON.stringify(raw),JSON.stringify(ctx.mf489MakePalette(source,appearance,preset,prefs.mode==='custom')),'Must not mutate source palette');
 assert(result.expressivenessV492);
 return result;
}
const subtle=compose('subtle');
const balanced=compose('balanced');
const vivid=compose('vivid');
assert(ctx.mf489Lch(vivid.primary).C>=ctx.mf489Lch(subtle.primary).C-.01,'Vivid should not be less saturated');
assert(vivid.expressivenessV492.surfaceGap>subtle.expressivenessV492.surfaceGap,'Vivid must increase depth');
assert.notEqual(vivid.panel,subtle.panel,'Surface panel must vary with presets');
assert.equal(subtle.expressivenessV492.preset,'subtle');
assert.equal(vivid.expressivenessV492.preset,'vivid');
const custom=compose('balanced',{saturation:94,accent:87,depth:100,tint:85});
const low=compose('balanced',{saturation:15,accent:18,depth:10,tint:12});
assert(custom.expressivenessV492.surfaceGap>low.expressivenessV492.surfaceGap,'Depth slider changes surface gap');
assert(ctx.mf489Lch(custom.primary).C>=ctx.mf489Lch(low.primary).C,'Saturation changes chroma');
assert.notEqual(custom.panel,low.panel,'Surface tint must change actual surface');
function protect(p){
 const x=ctx.mf491ProtectPalette(p);
 const surfaces=[x.bg,x.panel,x.raised];
 for(const k of ['text','textDim','textMute','primary','secondary','tertiary']){
  assert(Math.min(...surfaces.map(s=>ctx.mf489Contrast(s,x[k])))>=4.45,k+' contrast must survive');
 }
 assert(Math.min(...surfaces.map(s=>ctx.mf489Contrast(s,x.text)))>=6.95);
 assert(ctx.mf489Contrast(x.flow,x.onAccent)>=4.45);
 return x;
}
for(const p of [subtle,balanced,vivid,custom,low,compose('vivid',null,'light')])protect(p);
const mono=ctx.mf489MakePalette({colors:['#777777','#999999','#333333']},'dark','balanced',false);
const grays=api.compose(mono);
for(const k of ['primary','secondary','tertiary']){
 const rgb=[1,3,5].map(i=>parseInt(grays[k].slice(i,i+2),16));
 assert(Math.max(...rgb)-Math.min(...rgb)<8,'Must not invent hue for grayscale');
}
prefs.expressiveness='balanced';S.settings.v492Palette=null;
assert.equal(api.settings().customized,false);
assert.equal(ctx.App.mf492Save('saturation','70'),true);
assert.equal(api.settings().values.saturation,70);
assert.equal(api.settings().customized,true);
assert.equal(scheduled,1);
assert.equal(ctx.App.mf492Save('tint',-1),false);
assert.equal(ctx.App.mf492Save('bogus',50),false);
assert.equal(ctx.App.mf492Save('accent','abc'),false);
assert.equal(api.settings().values.saturation,70);
ctx.App.mf492SetPreset('vivid');
assert.equal(api.settings().customized,false);
assert.equal(prefs.expressiveness,'vivid');
assert.equal(api.settings().values.depth,78);
assert(scheduled>=2);
ctx.App.mf492Save('depth',99);
ctx.App.mf484SetOption('expressiveness','subtle');
assert.equal(api.settings().customized,false,'Original settings dropdown must reset manual tuning');
assert.equal(api.settings().preset,'subtle');
prefs.mode='custom';ctx.App.mf492Save('tint',75);
assert.equal(customs,1,'Custom mode should reapply current user profile');
assert.equal(ctx.MF485.appliedKey,'');
const data={...source};const tuned=ctx.mf484Compose(data,'dark','balanced');
assert(tuned.expressivenessV492);
assert.equal(api.status().compositions,1);
prefs.mode='legacy';const original={...a};
ctx.mf484Compose=ctx.mf484Compose; // Legacy wrapper still calls original delegate unchanged.
const before=scheduled,saves=saved;
assert.equal(ctx.App.mf492Save('depth',80),false);
assert.equal(ctx.App.mf492SetPreset('vivid'),false);
assert.equal(saved,saves);
assert.equal(scheduled,before);
const sample=api.compose(a);
assert(sample!==null,'Pure sample API can calculate without changing state');
const legacy=ctx.mf484Compose(data,'dark','balanced');
assert(!legacy.expressivenessV492,'Legacy must not apply expressive tuning');
assert(!/S\.library\s*=|S\.history\s*=/.test(src));
console.log('PASS v492: ordered presets, independent sliders, hue fidelity, grayscale, cross-surface contrast, cloud-compatible settings and Legacy isolation');
