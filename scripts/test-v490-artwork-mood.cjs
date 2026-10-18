/* v490: measurable image-characteristics and artwork-source isolation. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const moodPath='src/js/components/377-v490-artwork-mood-atmosphere.js';
const oldPath='src/js/components/374-v487-advanced-artwork-pixel-analysis.js';
execFileSync('node',['--check',moodPath]);
const code=fs.readFileSync(moodPath,'utf8');
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert.equal(order.at(-1),'components/377-v490-artwork-mood-atmosphere.js');
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'490');
assert.match(fs.readFileSync('index.html','utf8'),/mediaflow-v490\.bundle\.js/);
assert.match(fs.readFileSync('index.html','utf8'),/290-v490-artwork-mood\.css/);
assert.match(fs.readFileSync('assets/css/290-v490-artwork-mood.css','utf8'),/max-width:500px/);
const v484=fs.readFileSync('src/js/components/371-v484-visual-evolution-foundation.js','utf8');
assert(v484.includes('analysis:sampled?.analysis'),'Custom image/hybrid must forward sampled mood');
assert(v484.includes('mf484CustomPalette(profile,colors,sampled)'));
let mode='advanced',themeUrl='https://covers.example/warm.png',manual=false,compositions=0;
const S={view:'settings',settings:{dynamicCoverTheme:true},
 v146DynamicThemeState:{url:themeUrl}};
const context={
 console,Math,JSON,Number,String,Object,Array,Set,Map,Date,Uint8ClampedArray,
 mf484Prefs:()=>({mode}),mf484ActiveProfile:()=>({source:manual?'manual':'image',imageUrl:themeUrl}),
 mf484Compose:()=>{compositions++;return {mode:'dark',flow:'#224488'};},
 document:{getElementById:()=>null,querySelector:()=>null},
 MediaFlowRuntime:{registerPageEnhancer:()=>{},version:489},
 window:{MediaFlowSettingsCenter:null},S,escapeHtml:String
};
vm.createContext(context);
const legacy=fs.readFileSync(oldPath,'utf8');
const start=legacy.indexOf('function mf487Clamp');
const stop=legacy.indexOf('// mf484 uses this named binding');
vm.runInContext(legacy.slice(start,stop),context);
vm.runInContext(code,context);
const api=context.window.MediaFlowV490;
assert.equal(api.version,490);
function pixels(w,h,fn){
 const arr=new Uint8ClampedArray(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const rgba=fn(x,y),at=(y*w+x)*4;
  for(let i=0;i<4;i++)arr[at+i]=rgba[i]??255;
 }
 return arr;
}
const W=96,H=120;
const warm=pixels(W,H,(x,y)=>x<48?[236,122,32,255]:[183,92,39,255]);
const cool=pixels(W,H,(x,y)=>x<48?[30,110,206,255]:[28,151,178,255]);
const bright=pixels(W,H,(x,y)=>y<90?[248,247,234,255]:[229,233,243,255]);
const dark=pixels(W,H,(x,y)=>y<90?[18,23,42,255]:[182,151,74,255]);
const neon=pixels(W,H,(x,y)=>((x>>2)+(y>>2))%2?[230,31,205,255]:[12,219,239,255]);
const gray=pixels(W,H,(x,y)=>x<48?[90,90,90,255]:[138,138,138,255]);
const examples={warm,cool,bright,dark,neon,gray};
const results={};
for(const [kind,b] of Object.entries(examples)){
 const analyzed=context.mf487AnalyzePixelData(b,W,H,'https://covers.example/'+kind+'.png');
 assert(analyzed?.analysis?.mood?.pixelVerified,kind+' missing mood');
 assert(analyzed.atmosphereHints?.effectsApplied===false,kind+' must not enable effects');
 const mood=analyzed.analysis.mood;
 assert(mood.signature.label&&mood.method&&mood.scope);
 assert(mood.signature.confidence>=0&&mood.signature.confidence<=1);
 for(const [key,value] of Object.entries(mood.metrics)){
  if(key==='temperature'||key==='validSamples'||key==='lightnessRange'||key==='colorDiversity')continue;
  assert(value>=0&&value<=1,kind+' metric out of range: '+key);
 }
 assert(!JSON.stringify(mood).includes('https://'),'No raw cover URL in mood');
 results[kind]={...mood.metrics,signature:mood.signature.key};
}
assert(results.warm.temperature>0.15,'Warm orange art not warm');
assert(results.cool.temperature<-.15,'Cool blue art not cool');
assert(results.bright.lightness>results.dark.lightness+.28,'Light vs dark art should differ');
assert(results.neon.saturation>results.gray.saturation+.35,'Vivid vs gray separation');
assert(results.neon.texture>results.warm.texture+.10,'Busy vs flat texture');
assert(results.gray.saturation<.08,'Grayscale must remain low chroma');
assert(Math.abs(results.gray.temperature)<.03,'Achromatic artwork must have neutral temperature');
assert(results.neon.signature==='neon-energetic','Vivid textured artwork should register energetic signature');
assert(results.warm.signature==='warm-atmospheric','Distinct warm artwork should register warm signature');
assert(results.cool.signature==='cool-serene','Distinct cool artwork should register cool signature');
assert(results.dark.shadows>results.bright.shadows+.40,'Dark shadows detected');
assert(results.bright.highlights>results.dark.highlights+.40,'Light highlights detected');
assert(results.neon.energy>results.gray.energy+.18,'High-contrast vivid energetic art detected');
assert(api.classify(results.neon,{analysis:{diversity:.8}}).label);
assert(api.status().verified===false,'Must not label previous source as current artwork');
const palette=context.mf484Compose(context.mf487AnalyzePixelData(warm,W,H,themeUrl),'dark');
assert(palette.artworkMood&&palette.atmosphereHints);
assert.equal(palette.atmosphereHints.effectsApplied,false);
assert.equal(compositions,1);
assert.equal(api.status().verified,true,'Current source has pixel-verified mood');
S.v146DynamicThemeState.url='https://covers.example/different.png';
assert.equal(api.status().verified,false,'Switching source must hide stale mood');
mode='custom';manual=true;
assert.equal(api.status().verified,false,'Manual custom color theme cannot claim image mood');
manual=false;themeUrl='https://covers.example/warm.png';
assert.equal(api.status().verified,true,'Custom chosen image can use its own measured mood');
mode='legacy';
const out=context.mf487AnalyzePixelData(warm,W,H,themeUrl);
assert(out&&!out.analysis?.mood,'Legacy retains old pixel return without mood');
assert.equal(api.status().verified,false,'Legacy never shows Advanced sampled mood');
assert(!/persistSettings\(|S\.library\s*=|S\.history\s*=/.test(code),'Mood engine cannot mutate personal data');
console.log('PASS v490: warm/cool, luminous/dark, neon/muted, texture/energy, source isolation, Legacy safety');
console.log('Signals:',JSON.stringify(Object.fromEntries(Object.entries(results).map(([k,v])=>[k,{
  signature:v.signature,temp:v.temperature,brightness:v.lightness,energy:v.energy,texture:v.texture
}]))));
