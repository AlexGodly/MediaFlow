/* v491 — live palette guard, contrast ratios, Custom variations and Legacy parity. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const file='src/js/components/378-v491-perceptual-readability.js';
execFileSync('node',['--check',file]);
const code=fs.readFileSync(file,'utf8');
const runtime=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert.equal(runtime.at(-1),'components/378-v491-perceptual-readability.js');
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'491');
assert.match(fs.readFileSync('index.html','utf8'),/mediaflow-v491\.bundle\.js/);
assert.match(fs.readFileSync('index.html','utf8'),/291-v491-readability\.css/);
const css=fs.readFileSync('assets/css/291-v491-readability.css','utf8');
assert.match(css,/max-width:480px/);
assert.match(css,/data-mf491-readability="on"/);
const old=fs.readFileSync('src/js/components/376-v489-perceptual-color-harmony.js','utf8');
const pixel=fs.readFileSync('src/js/components/374-v487-advanced-artwork-pixel-analysis.js','utf8');
const core=pixel.slice(pixel.indexOf('function mf487Clamp'),pixel.indexOf('function mf487PixelSample'));
const harmony=old.slice(old.indexOf('function mf489Clamp'),old.indexOf('const mf489ComposeBase='));
let mode='advanced',last=null,applyCount=0,blocked=0,legacyChanges=0;
const style=new Map(),attrs=new Set();
const root={
 dataset:{},
 style:{setProperty:(k,v)=>style.set(k,v),removeProperty:k=>style.delete(k),
   getPropertyValue:k=>style.get(k)||''},
 removeAttribute:k=>{attrs.delete(k);if(k==='data-mf491-readability')delete root.dataset.mf491Readability;}
};
const S={view:'settings',settings:{dynamicCoverTheme:true},
 v146DynamicThemeState:{source:'theme',palette:null}};
const oldApply=(p,source)=>{
 if(mode==='custom'&&source?.source!=='custom'){blocked++;return;}
 S.v146DynamicThemeState={source:source.source,palette:p};
 applyCount++;last=p;
 return true;
};
const ctx={
 console,JSON,Math,Number,String,Object,Array,Set,Map,
 document:{documentElement:root,getElementById:()=>null,querySelector:()=>null},
 window:{MediaFlowSettingsCenter:null},
 mf484Prefs:()=>({mode}),
 MediaFlowRuntime:{registerPageEnhancer:()=>{},version:490},
 S,App:{mf484SetMode:m=>{mode=m;return m;}},
 v146ApplyFullPalette:oldApply,
 v146RestoreSelectedThemeFallback:()=>{S.v146DynamicThemeState={source:'theme',palette:null};},
 escapeHtml:String,
 v145MixHex:(a,b,w)=>{
  const c=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
  const first=c(a),second=c(b);
  const v=first.map((x,i)=>Math.round(x*w+second[i]*(1-w)));
  return '#'+v.map(x=>x.toString(16).padStart(2,'0')).join('').toUpperCase();
 }
};
vm.createContext(ctx);
vm.runInContext(core,ctx);
vm.runInContext(harmony,ctx);
vm.runInContext(code,ctx,{filename:'v491.js'});
const api=ctx.window.MediaFlowV491;
assert.equal(api.version,491);
const source={source:'recommended',label:'Test cover',url:'https://covers.example/one.jpg'};
const sets=[
 {colors:['#BB31F0','#29BFE1','#F4B751'],naturalMode:'dark',colorRoles:{dominantBackground:'#141128'}},
 {colors:['#242931','#767982','#BABABA'],naturalMode:'light',colorRoles:{dominantBackground:'#EFEFF4'}},
 {colors:['#8844D4','#1CADD8','#E2A45D'],naturalMode:'dark',colorRoles:{dominantBackground:'#00000A'}},
 {colors:['#C3BABA','#D3C2C2','#897A7A'],naturalMode:'light',colorRoles:{dominantBackground:'#DADFE5'}}
];
function closeHue(a,b,max=24){
 const l=ctx.mf489Lch;
 const x=l(a),y=l(b);
 return x.C<.027||y.C<.027||ctx.mf489Angle(x.h,y.h)<=max;
}
function verify(input){
 const out=api.audit(input);
 const surfaces=[out.bg,out.panel,out.raised],ctr=(color,s)=>Math.min(...s.map(x=>api.contrast(color,x)));
 assert(ctr(out.text,surfaces)>=6.95,'Main text must reach ~7:1 on all core surfaces');
 for(const key of ['textDim','textMute','primary','secondary','tertiary'])
  assert(ctr(out[key],surfaces)>=4.45,key+' must reach 4.5:1 on surfaces');
 assert(api.contrast(out.selectionText,out.flow)>=4.45,'CTA text must be readable');
 assert(out.readability&&out.readability.version===491);
 assert(['#FFFFFF','#111827','#000000'].includes(out.onAccent));
 assert(closeHue(out.primary,input.primary),'Primary hue should be preserved');
 assert.equal(out.mode,input.mode);
 return out;
}
for(const spec of sets)for(const scheme of ['dark','light']){
 let p=ctx.mf489MakePalette(spec,scheme,'vivid',false);
 // Simulate Custom composition variations applying a further color wash.
 p={...p,bg:ctx.v145MixHex(p.bg,scheme==='light'?'#F9F0FF':'#18122F',.58),
  border:ctx.v145MixHex(p.secondary,p.border,.48)};
 verify(p);
}
const poor={
 mode:'dark',bg:'#12141E',panel:'#171925',raised:'#1C1E2A',
 border:'#20232B',borderSoft:'#1D2026',text:'#30313D',
 textDim:'#454659',textMute:'#454659',
 primary:'#AA39DA',secondary:'#1691A8',tertiary:'#DFAD75',
 flow:'#AA39DA',flowDim:'#303B56',selectionText:'#FFFFFF'
};
const fixed=verify(poor);
assert(fixed.readability.corrected.includes('text'));
assert(fixed.readability.corrected.includes('border'));
assert(api.contrast(fixed.border,fixed.panel)>=1.5);
const noChange=JSON.stringify(poor);
const repaired=api.audit(poor);
assert.equal(JSON.stringify(poor),noChange,'Original theme object must be unchanged');
assert.equal(repaired.readability.violations.length,0,'All sampled contrast targets must pass');
const recommended=ctx.v146ApplyFullPalette({...poor},source);
assert.equal(recommended,true);
assert(last?.readability?.version===491);
assert.equal(root.dataset.mf491Readability,'on');
assert.equal(style.get('--mf491-on-accent'),last.onAccent);
assert.equal(style.get('--mf491-focus-outline'),last.flow);
assert.equal(applyCount,1);
mode='custom';const before=applyCount;
ctx.v146ApplyFullPalette({...poor},source);
assert.equal(applyCount,before,'Owner-protected stale cover must not write');
assert.equal(blocked,1);
ctx.v146ApplyFullPalette({...poor},{source:'custom',label:'My Theme'});
assert.equal(applyCount,before+1);
mode='legacy';const legacy={...poor};
ctx.v146ApplyFullPalette(legacy,source);
assert.strictEqual(last,legacy,'Legacy path must pass original palette object unchanged');
assert(!last.readability);
ctx.App.mf484SetMode('legacy');
assert(!style.has('--mf491-on-accent'));
assert(!style.has('--mf491-focus-outline'));
ctx.v146RestoreSelectedThemeFallback();
assert(!root.dataset.mf491Readability,'Fallback must remove opt-in attributes');
assert(api.status().active===false);
assert(!/persistSettings\(|S\.library\s*=|S\.history\s*=/.test(code));
console.log('PASS v491: 7:1 main/4.5:1 secondary text, accents, CTA labels, borders, Custom variation, owner guards and Legacy parity');
