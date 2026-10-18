/* v488 focal composition behavior; node --test independent of browser/network. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const prev='src/js/components/374-v487-advanced-artwork-pixel-analysis.js';
const file='src/js/components/375-v488-composition-salience.js';
execFileSync('node',['--check',file]);
const src=fs.readFileSync(file,'utf8');
const old=fs.readFileSync(prev,'utf8');
assert(old.includes('mf487AnalyzePixelData(bytes,w,h,u)'),'Source identity must be passed from Canvas stage');
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert(order.includes('components/375-v488-composition-salience.js'));
assert(order.includes('components/376-v489-perceptual-color-harmony.js'));
assert(order.includes('components/377-v490-artwork-mood-atmosphere.js'));
assert(order.includes('components/378-v491-perceptual-readability.js'));
assert(order.includes('components/379-v492-smart-palette-expressiveness.js'));
assert(order.includes('components/380-v493-cover-intelligence-corrections.js'));
assert(order.includes('components/381-v494-theme-preview-laboratory.js'));
assert.equal(order.at(-1),'components/383-v496-unified-living-themes-renderer.js');
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'496');
assert.match(fs.readFileSync('index.html','utf8'),/mediaflow-v496\.bundle\.js/);
assert.match(fs.readFileSync('index.html','utf8'),/288-v488-composition-salience\.css/);
assert.match(fs.readFileSync('assets/css/288-v488-composition-salience.css','utf8'),/max-width:500px/);
const vals={mode:'advanced'},signals={persist:0,refresh:0,toast:[],custom:0},url='https://example.test/cover.png';
const current={source:'recommended',label:'Poster',url};
const S={settings:{dynamicCoverTheme:true},v146DynamicThemeState:current,view:'settings'};
const window={MediaFlowSettingsCenter:{mountSection:()=>{}},MediaFlowV487:{}};
const document={getElementById:()=>null,querySelector:()=>null,createElement:()=>({innerHTML:''})};
const ctx={
 console,Math,JSON,Promise,Object,Map,Set,Array,String,Number,Date,
 S,window,document,Uint8ClampedArray,
 setTimeout,clearTimeout,
 App:{},MediaFlowRuntime:{registerPageEnhancer:()=>{},version:487},
 mf484Prefs:()=>vals,mf484ActiveProfile:()=>({source:'image',imageUrl:url}),
 persistSettings:()=>{signals.persist++;},showToast:t=>signals.toast.push(t),
 v146ScheduleDynamicTheme:()=>{signals.refresh++;},
 mf484ApplyCustom:()=>{signals.custom++;},
 MF485:{appliedKey:'already'},MF484_CUSTOM_SEQ:0,V146_DYNAMIC_SEQ:0,
 v160HashString:s=>{let a=2166136261,b=2246822519;for(let i=0;i<s.length;i++){a=Math.imul(a^s.charCodeAt(i),16777619)>>>0;b=Math.imul(b^s.charCodeAt(i),3266489917)>>>0;}return [a,b];},
 mf484ImageUrl:s=>/^https:\/\/[A-Za-z0-9./_-]+$/.test(s)?s:'',
 escapeHtml:s=>String(s)
};
vm.createContext(ctx);
const defs=old.slice(0,old.indexOf('// mf484 uses this named binding'));
vm.runInContext(defs,ctx);
vm.runInContext(src,ctx);
assert.equal(window.MediaFlowV488.version,488);
assert.equal(window.MediaFlowV488.regions.length,9);
function rgb(hex){return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));}
function nearColor(hex,r,g,b,max=90){return Math.hypot(...rgb(hex).map((x,i)=>x-[r,g,b][i]))<max;}
function image(w,h,fn){const arr=new Uint8ClampedArray(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const p=(y*w+x)*4;const c=fn(x,y);for(let i=0;i<4;i++)arr[p+i]=c[i]??255;}return arr;}
const w=90,h=120,dark=[22,24,42,255],purple=[179,58,229,255],blue=[35,173,208,255];
// A conspicuous upper-left violet block and lower-right blue patch on a
// much larger dark background. Region selection should not be center-only.
const poster=image(w,h,(x,y)=>{
 if(x<32&&y<41)return purple;
 if(x>64&&y>80)return blue;
 return dark;
});
const auto=ctx.mf487AnalyzePixelData(poster,w,h,url);
assert(auto&&auto.analysisVersion===488);
assert.equal(auto.analysis.composition.mode,'automatic');
assert.equal(auto.analysis.composition.selected,'top-left');
assert(auto.analysis.composition.confidence>=0&&auto.analysis.composition.confidence<=1);
assert(auto.analysis.composition.topRegions.length>0);
assert(auto.analysis.composition.detection.includes('not object recognition'));
assert(auto.colors.some(c=>nearColor(c,179,58,229)),'Prominent off-center violet should influence palette');
assert(nearColor(auto.colorRoles.dominantBackground,22,24,42));
assert.equal(auto.analysis.sampledFromPixels,true);
// Manual region must be stored per artwork and switch focal attention to
// the selected region, without changing the source URL or rotation settings.
ctx.App.mf488SetFocus('bottom-right');
assert.equal(signals.persist,1);assert.equal(signals.refresh,1);
assert.equal(window.MediaFlowV488.selection(url),'bottom-right');
const manual=ctx.mf487AnalyzePixelData(poster,w,h,url);
assert.equal(manual.analysis.composition.mode,'manual');
assert.equal(manual.analysis.composition.selected,'bottom-right');
assert(manual.analysis.composition.center.x>.75&&manual.analysis.composition.center.y>.75);
assert(manual.colors.some(c=>nearColor(c,35,173,208,90)),'Manual region should preserve blue identity');
ctx.App.mf488SetFocus('auto');
assert.equal(window.MediaFlowV488.selection(url),'auto');
assert.equal(signals.persist,2);
assert(!Object.keys(S.settings.v488FocalOverrides).length,'Auto must remove override');
// Invalid regions never persist changes.
ctx.App.mf488SetFocus('script-injection');
assert.equal(signals.persist,2);
// Overrides cannot apply to an unrelated artwork.
ctx.App.mf488SetFocus('left');
const other='https://example.test/other.png';
assert.equal(window.MediaFlowV488.selection(other),'auto');
assert.equal(window.MediaFlowV488.selection(url),'left');
// Legacy mode remains exactly v487's original sampler, without v488 metadata.
vals.mode='legacy';
const legacy=ctx.mf487AnalyzePixelData(poster,w,h,url);
assert.equal(legacy.analysisVersion,487);
assert(!legacy.analysis.composition);
const before=signals.persist;
ctx.App.mf488SetFocus('center'); // caller should be blocked from Legacy edits
assert.equal(signals.persist,before,'Legacy cannot modify v488 focal settings');
// Muted covers stay muted, and transparency is not interpreted as artwork.
vals.mode='advanced';
const mono=image(60,90,(x,y)=>y<45?[31,31,31,255]:[174,174,174,255]);
const m=ctx.mf487AnalyzePixelData(mono,60,90,other);
assert(m.colors.every(c=>{const a=rgb(c);return Math.max(...a)-Math.min(...a)<=12;}));
const transparent=image(60,90,(x,y)=>x<21?[255,0,0,0]:[16,123,160,255]);
const t=ctx.mf487AnalyzePixelData(transparent,60,90,other);
assert(t.colors.every(c=>!nearColor(c,255,0,0,60)));
assert.equal(ctx.mf487AnalyzePixelData(new Uint8ClampedArray(4),60,90,other),null);
// Focus overrides survive serializing settings, without storing raw URL keys.
const k=Object.keys(S.settings.v488FocalOverrides);
assert(k.length===1&&k[0].startsWith('cover-'));
assert(!JSON.stringify(S.settings.v488FocalOverrides).includes(url));
assert(!/S\.library\s*=|S\.history\s*=|S\.sessions\s*=/.test(src));
console.log('PASS v488: off-center subject-like salience, manual bottom-right override,');
console.log('          stored URL-hash preferences, Legacy isolation, muted and transparent art');
