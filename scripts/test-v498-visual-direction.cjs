/* MediaFlow v497 — visual direction, mode isolation, user effects. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const path='src/js/components/385-v497-living-visual-direction.js';
execFileSync('node',['--check',path]);
const src=fs.readFileSync(path,'utf8');
const runtime=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert.equal(runtime.at(-1),'components/386-v498-logging-cover-parity.js');
assert.match(fs.readFileSync('index.html','utf8'),/298-v497-living-visual-direction\.css/);
const css=fs.readFileSync('assets/css/298-v497-living-visual-direction.css','utf8');
assert.match(css,/data-mf497-material="glass"/);
assert.match(css,/data-mf497-material="satin"/);
assert.match(css,/data-mf497-material="matte"/);
assert.match(css,/prefers-reduced-motion:reduce/);
let mode='advanced',reduced=false,saver=false,small=false,rendered=0;
const living={mode:'advanced',intensity:'balanced',performance:'full',source:'intelligent',
 effects:{gradients:true,lighting:true,depth:true,materials:true,textures:true,
 particles:false,organic:false,transitions:true}};
const profile={id:'my-1',source:'manual',variation:'ethereal',imageUrl:'',colors:['#FF7722']};
const palette={mode:'dark',primary:'#C45AA8',secondary:'#9AAADD',tertiary:'#DDEEFF',
 atmosphereHints:{source:'pixel-derived guidance only',gradient:'warm-blend',
  lighting:'cinematic-directional',intensity:.63}};
const attrs={},vars={};
const root={dataset:{},style:{
 setProperty(k,v){vars[k]=v;},removeProperty(k){delete vars[k]}},
 hasAttribute(k){return Object.hasOwn(attrs,k)||
  (k==='data-mf497-material'&&root.dataset.mf497Material!==undefined)},
 removeAttribute(k){delete attrs[k];delete root.dataset[k.replace(/^data-/,'').replace(/-([a-z])/g,(_,c)=>c.toUpperCase())];}};
const ctx={console,document:{documentElement:root,getElementById:()=>null,
 querySelector:()=>null},window:{matchMedia:q=>({matches:q.includes('max-width')?small:reduced})},
 navigator:{connection:{get saveData(){return saver}}},S:{view:'dashboard'},
 MF485:{revision:1},Math,Number,String,JSON,Array,Object,
 mf484Prefs:()=>({mode,living}),mf484ActiveProfile:()=>profile,
 mf496Plan:()=>({mode,colors:[palette.primary,palette.secondary,palette.tertiary],
  power:.7,motion:!reduced}),
 mf496Signals:()=>({saturation:.54,contrast:.4,manual:mode==='custom'&&profile.source==='manual',
  mood:mode==='custom'&&profile.source==='manual'?null:palette.atmosphereHints}),
 mf496Clamp:(n,lo=0,hi=1)=>Math.max(lo,Math.min(hi,n)),
 mf484ApplyAtmosphere:()=>{rendered++},
 mf484Clear:()=>{rendered++},
 escapeHtml:String,MediaFlowRuntime:{version:496,registerPageEnhancer:()=>{}},
 App:{},persistSettings:()=>{throw Error('renderer must not save data')}};
vm.createContext(ctx);vm.runInContext(src,ctx);
const api=ctx.window.MediaFlowV497;
assert.equal(api.version,497);
let p=api.plan(palette);
assert.equal(p.lighting,'directional');
assert.equal(p.material,'satin');
assert.equal(p.depth,true);
ctx.mf484ApplyAtmosphere(palette,'');
assert.equal(root.dataset.mf497Light,'directional');
assert.equal(root.dataset.mf497Material,'satin');
assert.equal(api.status().active,true);
const start=api.status().compositions;
ctx.mf484ApplyAtmosphere(palette,'');
assert.equal(api.status().compositions,start);
assert.equal(api.status().reused,1);
living.effects.materials=false;living.effects.lighting=false;
p=api.plan(palette);
assert.equal(p.material,'none');assert.equal(p.lighting,'none');
living.effects.materials=true;living.effects.lighting=true;living.mode='basic';
assert.equal(api.plan(palette).material,'none','Basic mode must not enable materials');
living.mode='advanced';profile.source='manual';mode='custom';
p=api.plan(palette);
assert.equal(p.material,'glass','Custom ethereal profile selects glass without cover');
assert.equal(p.source,'Custom Studio colors');
ctx.mf484ApplyAtmosphere(palette,'');
assert.equal(root.dataset.mf497Material,'glass');
saver=true;living.performance='auto';
assert.equal(api.plan(palette).performance,true);
reduced=true;saver=false;living.performance='full';
assert.equal(api.plan(palette).motion,false);
mode='legacy';living.mode='advanced';
ctx.mf484ApplyAtmosphere(palette,'');
assert.equal(api.status().active,false,'direct Legacy switch clears v497 materials');
mode='custom';living.mode='off';
ctx.mf484ApplyAtmosphere(palette,'');
assert.equal(api.status().active,false);
mode='legacy';living.mode='advanced';
const count=rendered;
ctx.mf484ApplyAtmosphere(palette,'');
assert.equal(rendered,count+1);
assert.equal(api.status().active,false,'Legacy does not use material renderer');
assert.equal(api.status().mode,'legacy');
console.log('v497 visual direction PASS: materials, mood, Custom, Legacy, toggles, optimized, reuse');
