/* MediaFlow v494 — Side-by-side Lab, isolated draft and explicit application. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const path='src/js/components/381-v494-theme-preview-laboratory.js';
execFileSync('node',['--check',path]);
const js=fs.readFileSync(path,'utf8');
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert.equal(order.at(-1),'components/381-v494-theme-preview-laboratory.js');
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'494');
assert.match(fs.readFileSync('index.html','utf8'),/mediaflow-v494\.bundle\.js/);
assert.match(fs.readFileSync('index.html','utf8'),/294-v494-theme-preview-laboratory\.css/);
const css=fs.readFileSync('assets/css/294-v494-theme-preview-laboratory.css','utf8');
assert.match(css,/max-width:650px/);
assert.match(css,/prefers-reduced-motion/);
const variants=['automatic','focal','dominant','gentle','contrast'];
const profile={id:'custom-1',source:'image',colors:['#8133D3','#E3AD61','#28AFD1','#171A32'],
 imageUrl:'https://covers.example/a.jpg',appearance:'dark',variation:'ethereal'};
const data={visualCoverUrl:'https://covers.example/a.jpg',naturalMode:'dark',
 colors:['#A146D9','#23A8D7','#E3AD61'],
 analysis:{sampledFromPixels:true,pixels:4200,
  distribution:[{color:'#171A32',percent:68},{color:'#23A8D7',percent:20}]},
 colorRoles:{dominantBackground:'#171A32'}};
const MF487_STATE={last:data};let mode='advanced',preset='balanced';
const S={view:'settings',settings:{dynamicCoverTheme:true,v492Palette:null},
 v146DynamicThemeState:{url:data.visualCoverUrl,palette:{mode:'dark'}}};
const applied={writes:0,live:0,previews:0,slots:[],commits:0,reapplies:0,toasts:[]};
let staleDuringCompose=false;
const hash=s=>[s.length,37];
const rgb=h=>[1,3,5].map(x=>parseInt(h.slice(x,x+2),16));
const mix=(a,b,w)=>'#'+rgb(a).map((v,i)=>Math.round(v*w+rgb(b)[i]*(1-w)).toString(16).padStart(2,'0')).join('').toUpperCase();
const ctx={
 console,JSON,Math,Number,String,Array,Object,Set,Map,Date,
 S,MF487_STATE,
 MF492_PRESETS:{subtle:{saturation:36,accent:36,depth:30,tint:28},
  balanced:{saturation:56,accent:57,depth:54,tint:52},
  vivid:{saturation:81,accent:82,depth:78,tint:75}},
 MF493_VARIANTS:Object.fromEntries(variants.map(v=>[v,{name:v.toUpperCase()}])),
 mf484Prefs:()=>({mode,expressiveness:preset}),
 mf484ActiveProfile:()=>profile,
 mf487ValidUrl:url=>/^https:\/\/[a-z0-9./-]+$/i.test(url)?url:'',
 mf487Key:url=>'hash-'+hash(url).join('-'),
 mf489HexValid:s=>/^#[0-9a-f]{6}$/i.test(s||''),
 mf491ChooseOnAccent:()=>"#FFFFFF",
 v160HashString:hash,mf487Hex:(r,g,b)=>'#'+[r,g,b].map(v=>Math.round(v).toString(16).padStart(2,'0')).join('').toUpperCase(),
 v145MixHex:mix,
 mf492Config:()=>({values:{saturation:56,accent:57,depth:54,tint:52}}),
 mf493Settings:()=>({['advanced-'+hash(data.visualCoverUrl).join('-')]:{variant:'dominant',
  slots:['#171A32','#23A8D7','#E3AD61']}}),
 mf493Colors:()=>['#171A32','#A146D9','#23A8D7','#E3AD61'].map(hex=>({hex})),
 mf493Pick:(sample,variant,slots)=>{
  if(Array.isArray(slots))return slots.slice();
  if(variant==='dominant')return ['#171A32','#23A8D7','#E3AD61'];
  if(variant==='focal')return ['#A146D9','#E3AD61','#23A8D7'];
  return sample.colors.slice();
 },
 mf489MakePalette:(sample,appearance,expressiveness,isCustom)=>{
  if(staleDuringCompose){S.v146DynamicThemeState.url='https://covers.example/b.jpg';staleDuringCompose=false;}
  return {
   mode:appearance,bg:'#111320',panel:'#202434',raised:'#303848',
   text:'#F8F8FC',textDim:'#C1C6D1',border:'#4C5361',borderSoft:'#353B49',
   primary:sample.colors[0],secondary:sample.colors[1],tertiary:sample.colors[2],
   flow:sample.colors[0],flowDim:'#5665AA',onAccent:'#FFFFFF'
  };
 },
 mf492ComposePalette:(p,settings)=>({...p,expressivenessV492:{...settings.values},
  raised:settings.values.depth>50?'#43495B':'#303848'}),
 mf491ProtectPalette:p=>({...p,readability:{ratios:{text:8.0,secondaryText:5.1}}}),
 mf492Reapply:()=>{applied.reapplies++},
 persistSettings:()=>{applied.writes++},
 showToast:msg=>applied.toasts.push(msg),
 escapeHtml:String,
 getComputedStyle:()=>({getPropertyValue:key=>
  key==='--bg'?'rgb(20, 30, 40)':
  key==='--panel'?'#2C3040':key==='--flow'?'#AA50DD':'#4C5670'}),
 document:{documentElement:{},getElementById:()=>null,querySelector:()=>null},
 MediaFlowRuntime:{registerPageEnhancer:()=>{},version:493},
 window:{MediaFlowSettingsCenter:null,MediaFlowV493:{
  status:()=>{
   const expected=mode==='custom'?profile.imageUrl:S.v146DynamicThemeState.url;
   const ok=data.visualCoverUrl===expected;
   return {available:ok,mode,scope:mode+'-'+hash(expected).join('-'),
    variant:'dominant',variants:variants.map(key=>({key}))};
  },
  choose:(sample,v)=>ctx.mf493Pick(sample,v)
 }},
 App:{
  mf493Preview:variant=>{applied.previews++;return true},
  mf493Slot:(i,color)=>{applied.slots.push([i,color]);return true},
  mf493Commit:()=>{applied.commits++;applied.writes++;applied.live++;return true}
 }
};
vm.createContext(ctx);
vm.runInContext(js,ctx,{filename:'v494.js'});
const api=ctx.window.MediaFlowV494;
assert.equal(api.version,494);
const now=api.status();
assert.equal(now.available,true);
assert.equal(now.candidates.length,2);
assert.equal(now.candidates[0].variant,'dominant','Candidate A should reflect saved variant');
assert.equal(now.candidates[1].variant,'focal');
const readSource=api.source();
assert.equal(readSource.saved?.variant,'dominant');
assert(api.compose(readSource,now.candidates[0]).readability);
assert.equal(applied.writes,0);
assert.equal(applied.live,0);
assert.equal(ctx.App.mf494SetScene('library'),true);
assert.equal(api.status().scene,'library');
assert.equal(ctx.App.mf494SetScene('details'),true);
assert.equal(api.status().scene,'details');
assert.equal(ctx.App.mf494SetScene('fake'),false);
assert.equal(ctx.App.mf494Tune(1,'depth',92),true);
assert.equal(api.status().candidates[1].values.depth,92);
assert.equal(ctx.App.mf494Tune(1,'saturation',-4),false);
assert.equal(ctx.App.mf494Tune(3,'depth',82),false);
assert.equal(ctx.App.mf494Tune(0,'bad',50),false);
assert.equal(ctx.App.mf494Choose(1,'gentle'),true);
assert.equal(ctx.App.mf494Choose(0,'not-a-variant'),false);
const scene=ctx.mf494Scene(api.compose(api.source(),api.status().candidates[1]),'Candidate B');
assert(scene.includes('Settings dialog')&&scene.includes('TITLE DETAILS'));
assert(scene.includes('Sample title')&&scene.includes('Progress · 64%'));
const original=JSON.stringify(data);
assert.equal(applied.writes,0,'Candidate tuning and layout selection must not persist');
assert.equal(applied.live,0,'Candidate tuning and layout selection must not touch live theme');
assert.equal(ctx.App.mf494Swap(),true);
assert.equal(api.status().candidates[0].variant,'gentle');
assert.equal(ctx.App.mf494Reset(),true);
assert.equal(api.status().candidates[0].variant,'dominant');
assert.equal(JSON.stringify(data),original,'Preview must not alter verified artwork data');
const color=ctx.mf494Color('rgb(25, 80, 155)','#FFFFFF');
assert.equal(color,'#19509B','Browser RGB computed colors should be captured accurately');
assert(ctx.mf494Current().bg==='#141E28');
assert.equal(ctx.App.mf494Apply(0),true);
assert.equal(applied.previews,1);
assert.equal(applied.commits,1);
assert.equal(applied.writes,1);
assert.equal(applied.live,1);
assert.equal(applied.slots.length,3,'Saved accent role overrides should remain preserved');
assert.equal(S.settings.v492Palette?.values?.depth,54);
assert.equal(ctx.App.mf494Apply(0),true);
S.v146DynamicThemeState.url='https://covers.example/a.jpg';
ctx.App.mf494Tune(1,'tint',80);
const writesBefore=applied.writes;
staleDuringCompose=true;
assert.equal(ctx.App.mf494Apply(1),false,'Stale source before persistence must block commit');
assert.equal(applied.writes,writesBefore);
assert.equal(applied.live,writesBefore);
assert.equal(api.status().available,false);
S.v146DynamicThemeState.url=data.visualCoverUrl;
mode='custom';
profile.source='manual';
assert.equal(api.status().available,true,'Custom manual color profiles may preview their own colors');
const customScene=api.compose(api.source(),api.status().candidates[0]);
assert(customScene&&customScene.readability);
assert.equal(api.status().manual,true);
assert.equal(ctx.App.mf494Apply(1),true);
assert.equal(applied.reapplies,1,'Manual Custom apply must use own profile and compositor');
profile.source='image';
assert.equal(api.status().available,true);
const customImage=api.compose(api.source(),api.status().candidates[0]);
assert(customImage,'Custom image candidate should be renderable');
mode='legacy';
assert.equal(api.status().available,false,'Legacy remains unmodified and read-only');
const legacyWrites=applied.writes;
assert.equal(ctx.App.mf494Apply(0),false);
assert.equal(applied.writes,legacyWrites);
assert.equal(JSON.stringify(data),original,'No source image data mutation');
assert(!/S\.library\s*=|S\.history\s*=/.test(js));
console.log('PASS v494: current-vs-A-vs-B preview, dashboard/library/details, slider isolation, saved variant/slots,');
console.log('           explicit guarded application, Custom image/manual isolation, stale source and untouched Legacy');
