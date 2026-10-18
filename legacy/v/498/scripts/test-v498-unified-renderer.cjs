/* MediaFlow v496 — deterministic Living Themes renderer contract. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const file='src/js/components/383-v496-unified-living-themes-renderer.js';
const source=fs.readFileSync(file,'utf8');
execFileSync('node',['--check',file]);
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'498');
assert.equal(JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8')).at(-1),
 'components/386-v498-logging-cover-parity.js');
assert.match(fs.readFileSync('index.html','utf8'),/296-v496-unified-living-themes-renderer\.css/);
const css=fs.readFileSync('assets/css/296-v496-unified-living-themes-renderer.css','utf8');
assert.match(css,/prefers-reduced-motion:reduce/);
assert.match(css,/data-mf496-renderer="on"/);
let mode='advanced',saved=0,original=0,reduced=false,small=false,dataSaver=false,settings=0;
const attrs={},vars={},host={dataset:{},children:[],
 replaceChildren(...nodes){this.children=nodes;}};
const root={dataset:{},style:{
 setProperty(k,v){vars[k]=v;},removeProperty(k){delete vars[k];}},
 hasAttribute(k){return Object.prototype.hasOwnProperty.call(attrs,k)||
  (k==='data-mf496-renderer'&&!!root.dataset.mf496Renderer);},
 removeAttribute(k){delete attrs[k];const n=k.replace(/^data-/,'').replace(/-([a-z])/g,(_,x)=>x.toUpperCase());delete root.dataset[n];}};
const profile={id:'mine',source:'manual',imageUrl:'',colors:['#112233','#DDAA33','#4499CC']};
const living={mode:'advanced',intensity:'balanced',source:'intelligent',performance:'auto',
 effects:{gradients:true,lighting:true,particles:true,depth:true,materials:true,
 textures:true,organic:true,transitions:true}};
const document={documentElement:root,getElementById:id=>id==='mf484-atmosphere'?host:null,
 createElement:tag=>({tagName:tag,className:'',attrs:{},
  setAttribute(key,value){this.attrs[key]=value;}})};
const ctx={console,JSON,Math,Date,String,Number,Object,Array,Set,Map,
 document,window:{matchMedia:q=>({matches:q.includes('prefers-reduced-motion')?reduced:small})},
 navigator:{connection:{get saveData(){return dataSaver}}},
 S:{view:'dashboard',v146DynamicThemeState:{url:'https://example.com/a.jpg'},
  settings:{}},MF485:{revision:1},
 mf484ActiveProfile:()=>profile,mf484Prefs:()=>({mode,living}),
 mf484Rgb:h=>({r:parseInt(h.slice(1,3),16),g:parseInt(h.slice(3,5),16),b:parseInt(h.slice(5,7),16)}),
 v145RgbToHsl:(r,g,b)=>{const min=Math.min(r,g,b),max=Math.max(r,g,b);
  return {s:max?100*(max-min)/max:0,l:100*(max+min)/510};},
 mf484AllowMotion:()=>!reduced&&!dataSaver,
 mf495Fingerprint:(url,mode)=>mode+'-hash'+url.length,
 mf484ApplyAtmosphere:()=>{original++},
 mf484Clear:()=>{original++},
 escapeHtml:s=>String(s),
 MediaFlowRuntime:{registerPageEnhancer:()=>{},version:495},
 App:{},persistSettings:()=>saved++,showToast:()=>settings++};
vm.createContext(ctx);
vm.runInContext(source,ctx,{filename:file});
const api=ctx.window.MediaFlowV496;
assert.equal(api.version,496);
assert.equal(ctx.MediaFlowRuntime.version,496);
const palette={primary:'#AA33CC',secondary:'#3399CC',tertiary:'#E6A344',
 atmosphereHints:{source:'pixel-derived guidance only',
  lighting:'cinematic-directional',gradient:'warm-blend',
  glowSuitability:.7,particleSuitability:.7,fogSuitability:.6,intensity:.65}};
const apply=()=>ctx.mf484ApplyAtmosphere(palette,'');
const setRootAttr=(key,value)=>{attrs[key]=value;
 const n=key.replace(/^data-/,'').replace(/-([a-z])/g,(_,x)=>x.toUpperCase());
 root.dataset[n]=value;};
const oldStyle=root.style.setProperty;
root.style.setProperty=(k,v)=>oldStyle(k,v);
// jsdom-less document dataset: reflect HTML dataset attributes from setter.
const originalSet=Object.getOwnPropertyDescriptor(root.dataset,'mf496Renderer');
ctx.mf484ApplyAtmosphere=ctx.mf484ApplyAtmosphere;
apply();
assert.equal(original,1);
assert.equal(api.status().mode,'advanced');
assert.equal(api.status().layers.includes('gradients'),true);
assert.equal(api.status().layers.includes('lighting'),true);
assert(host.children.length>0);
assert.equal(host.children.every(n=>n.className.startsWith('mf496-layer')) ,true);
assert.equal(saved,0,'visual rendering must not persist theme settings');
// Simulate dataset reflection expected by DOM when setting via .dataset
assert.equal(root.dataset.mf496Renderer,'on');
const first=api.status().renders;
apply();
assert.equal(api.status().renders,first,'unchanged composition must be reused');
assert(api.status().reused>=1);
living.effects.gradients=false;
apply();
assert(!api.status().layers.includes('gradients'),'user effect toggle always wins');
living.mode='basic';
apply();
assert(api.status().layers.every(k=>['gradients','lighting'].includes(k)));
living.mode='advanced';
living.performance='optimized';
apply();
assert(!api.status().layers.some(k=>['particles','organic','depth'].includes(k)));
assert(host.children.length<=3);
living.performance='full';reduced=true;
apply();
assert.equal(root.dataset.mf496Motion,'off','reduce motion must override full performance');
reduced=false;mode='custom';
profile.source='manual';profile.imageUrl='';
ctx.S.v146DynamicThemeState.url='https://example.com/another-cover.jpg';
const manual=api.plan(palette);
assert.equal(manual.source,'Custom manual colors');
assert.notEqual(api.plan(palette).source,'Pixel-verified artwork mood');
profile.source='hybrid';profile.imageUrl='https://example.com/my-own.jpg';
assert.equal(api.plan(palette).source,'Pixel-verified artwork mood');
apply();
assert.equal(api.status().mode,'custom');
living.mode='off';
apply();
assert.deepEqual(host.children,[]);
assert.equal(api.status().active,false);
mode='legacy';living.mode='advanced';
const before=original;
apply();
assert.equal(original,before+1,'original atmosphere must still run');
assert.equal(api.status().mode,'legacy');
assert.equal(host.children.length,0,'Legacy must not get Unified layers');
assert.equal(saved,0);
assert.equal(settings,0);
console.log('v496 unified renderer PASS (ownership, effects, modes, motion, perf, no writes)');
