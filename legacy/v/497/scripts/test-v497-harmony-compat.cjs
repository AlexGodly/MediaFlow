/* MediaFlow v489 — executable perceptual harmony and Legacy regression. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const path='src/js/components/376-v489-perceptual-color-harmony.js';
execFileSync('node',['--check',path]);
const src=fs.readFileSync(path,'utf8');
const runtime=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert(runtime.includes('components/376-v489-perceptual-color-harmony.js'));
assert(runtime.includes('components/377-v490-artwork-mood-atmosphere.js'));
assert(runtime.includes('components/378-v491-perceptual-readability.js'));
assert(runtime.includes('components/379-v492-smart-palette-expressiveness.js'));
assert(runtime.includes('components/380-v493-cover-intelligence-corrections.js'));
assert(runtime.includes('components/381-v494-theme-preview-laboratory.js'));
assert.equal(runtime.at(-1),'components/385-v497-living-visual-direction.js');
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'497');
assert.match(fs.readFileSync('index.html','utf8'),/mediaflow-v497\.bundle\.js/);
assert.match(fs.readFileSync('index.html','utf8'),/289-v489-color-harmony\.css/);
assert.match(fs.readFileSync('assets/css/289-v489-color-harmony.css','utf8'),/max-width:560px/);
const defs=fs.readFileSync('src/js/components/374-v487-advanced-artwork-pixel-analysis.js','utf8');
const core=defs.slice(defs.indexOf('function mf487Clamp'),defs.indexOf('function mf487PixelSample'));
let mode='advanced', applied=0;
const context={
 console,Math,JSON,Number,String,Object,Array,Set,Map,
 mf484Prefs:()=>({mode,expressiveness:'balanced'}),
 mf484Compose:()=>{applied++;return {legacy:true}},
 v145MixHex(a,b,w){
  const rgb=s=>[1,3,5].map(x=>parseInt(s.slice(x,x+2),16));
  const out=rgb(a).map((v,i)=>Math.round(v*w+rgb(b)[i]*(1-w)));
  return '#'+out.map(x=>x.toString(16).padStart(2,'0')).join('').toUpperCase();
 },
 document:{getElementById:()=>null,querySelector:()=>null},
 MediaFlowRuntime:{registerPageEnhancer:()=>{},version:488},
 S:{view:'settings'},window:{MediaFlowSettingsCenter:null},
 escapeHtml:String
};
vm.createContext(context);
vm.runInContext(core,context);
vm.runInContext(src,context);
const api=context.window.MediaFlowV489;
assert.equal(api.version,489);
const lch=context.mf489Lch,sep=context.mf489Separation;
function matchesHue(a,b,tolerance=18){
 const p=lch(a),q=lch(b);return p.C<.025||q.C<.025||context.mf489Angle(p.h,q.h)<=tolerance;
}
function verify(data,appearance,intensity='balanced',custom=false){
 const p=api.compose(data,appearance,intensity,custom);
 assert(p&&p.mode===appearance);
 for(const key of ['bg','panel','raised','border','borderSoft','text','textDim','textMute','flow','flowDim','primary','secondary','tertiary','selectionText'])
  assert(/^#[0-9A-F]{6}$/i.test(p[key]),'Invalid palette role '+key);
 assert.equal(p.harmony.version,489);
 assert(api.contrast(p.text,p.bg)>=7,'Text-background contrast must be strong');
 assert(api.contrast(p.primary,p.panel)>=4.5,'Primary accent must contrast on panel');
 assert(api.contrast(p.secondary,p.panel)>=4.5,'Secondary accent must contrast on panel');
 assert(api.contrast(p.tertiary,p.panel)>=4.5,'Tertiary accent must contrast on panel');
 assert(api.contrast(p.selectionText,p.primary)>=4.5,'Action text must contrast on primary');
 return p;
}
const nebula={colors:['#B13FE3','#25BFDB','#F2B85D'],naturalMode:'dark',
 colorRoles:{dominantBackground:'#101524'},analysis:{distribution:[
  {color:'#101524',percent:61},{color:'#25BFDB',percent:22},{color:'#B13FE3',percent:14}
 ]}};
const rich=verify(nebula,'dark','vivid');
const pale=verify(nebula,'light','balanced');
assert(matchesHue(rich.primary,nebula.colors[0]),'Purple accent identity shifted');
assert(matchesHue(rich.secondary,nebula.colors[1]),'Cyan accent identity shifted');
assert(matchesHue(rich.tertiary,nebula.colors[2]),'Gold accent identity shifted');
assert(matchesHue(pale.primary,nebula.colors[0]));
assert.notEqual(rich.bg,pale.bg);
assert.equal(rich.harmony.background,'#101524');
const calm=verify({colors:['#363F4A','#4D5964','#88929C']},'dark','subtle');
assert(['Analogous','Monochromatic'].includes(calm.harmony.classification));
for(const role of ['primary','secondary','tertiary']){
 const rgb=[1,3,5].map(i=>parseInt(calm[role].slice(i,i+2),16));
 assert(Math.max(...rgb)-Math.min(...rgb)<120,'Muted artwork received neon coloring');
}
const duplicate=verify({colors:['#874BC1','#874BC1','#884CC0']},'dark');
assert(sep(duplicate.primary,duplicate.secondary)>.04,'Duplicate hue roles should have usable tonal variation');
const gray=verify({colors:['#777777','#A0A0A0','#393939']},'light');
for(const role of ['primary','secondary','tertiary']){
 const rgb=[1,3,5].map(i=>parseInt(gray[role].slice(i,i+2),16));
 assert(Math.max(...rgb)-Math.min(...rgb)<=5,'Monochrome artwork should remain gray');
}
const manual=verify({colors:['#673AB7','#E68935','#3DCABD']},'dark','vivid',true);
assert.equal(manual.harmony.custom,true);
for(let i=0;i<3;i++)
 assert(matchesHue([manual.primary,manual.secondary,manual.tertiary][i],
  ['#673AB7','#E68935','#3DCABD'][i]),'Custom user hue must be preserved');
assert(['Analogous','Monochromatic'].includes(context.mf489HueCategory(['#77AA77','#779955','#669944'])));
assert.equal(api.roles({colors:[]}),null);
mode='legacy';
const old=context.mf484Compose({colors:['#12AABB']},'dark');
assert.deepEqual(old,{legacy:true},'Legacy must call original composer unchanged');
assert.equal(applied,1,'Base composer only used for Legacy');
mode='advanced';
const combined=context.mf484Compose(nebula,'dark','balanced');
assert.equal(combined.harmony.version,489,'Advanced must use new compositor');
assert.equal(api.status().advanced,1);
mode='custom';
const integrated=context.mf484Compose({colors:['#8832CC','#E45E4A','#29C0CB']},'dark');
assert.equal(integrated.harmony.custom,true,'Custom must share harmony engine');
assert.equal(api.status().custom,1);
assert(!/persistSettings\(|S\.library\s*=|S\.history\s*=/.test(src),'Composer cannot mutate user data');
console.log('PASS v489: OKLCH fidelity, dark/light contrast, muted art, duplicate roles, Custom hue order, Legacy isolation');
