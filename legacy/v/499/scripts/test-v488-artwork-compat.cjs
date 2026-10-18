/* MediaFlow v487: synthetic artwork pixel-analysis regression. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const file='src/js/components/374-v487-advanced-artwork-pixel-analysis.js';
execFileSync('node',['--check',file]);
const source=fs.readFileSync(file,'utf8');
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert(order.includes('components/374-v487-advanced-artwork-pixel-analysis.js'));
assert.equal(order.at(-1),'components/375-v488-composition-salience.js');
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'488');
assert.match(fs.readFileSync('index.html','utf8'),/mediaflow-v488\.bundle\.js/);
assert.match(fs.readFileSync('index.html','utf8'),/287-v487-artwork-analysis\.css/);
assert.match(fs.readFileSync('assets/css/287-v487-artwork-analysis.css','utf8'),/max-width:480px/);
assert.ok(!/persistSettings\(|S\.library\s*=|S\.history\s*=/.test(source),'Pixel sampler cannot mutate user data');
const pre=source.slice(0,source.indexOf('// mf484 uses this named binding'));
const made=new Map();
function ImageMock(){this.naturalWidth=100;this.naturalHeight=120;this.onload=null;this.onerror=null;}
Object.defineProperty(ImageMock.prototype,'src',{set(u){
 if(u.includes('blocked')){queueMicrotask(()=>this.onerror&&this.onerror());return;}
 const data=made.get(u);
 queueMicrotask(()=>{
  if(data){this.bytes=data;this.onload&&this.onload();}
  else this.onerror&&this.onerror();
 });
}});
let mockCanvas=null;
const doc={
 createElement(type){assert.equal(type,'canvas');return {
   width:0,height:0,
   getContext(){return{
    drawImage(img){mockCanvas=img.bytes;},
    getImageData(){return {data:mockCanvas};}
   }}};},
 getElementById:()=>null
};
const ctx={
 console,Promise,Map,Date,Math,JSON,Number,String,Set,Image:ImageMock,
 document:doc,setTimeout,clearTimeout,
 mf484ImageUrl:u=>(/^https:\/\/[-\w./]+$/.test(u)?u:''),
 v160HashString:u=>[u.length,42],
 mf487ShowStatus:()=>{}
};
vm.createContext(ctx);
vm.runInContext(pre+'\nthis.pixelAnalysis=mf487AnalyzePixelData;this.analyze=mf487AnalyzeImage;'+
 'this.currentStatus=()=>({attempts:MF487_STATE.attempts,sampled:MF487_STATE.sampled,failures:MF487_STATE.failures,cacheHits:MF487_STATE.cacheHits});'+
 'this.cleanUrl=mf487ValidUrl;this.cacheClear=mf487CacheDelete;',ctx);
const hexRgb=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));
const similar=(hex,expected,max=90)=>{
 const a=hexRgb(hex),b=expected;
 return Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2])<max;
};
function pixels(width,height,color){
 const buf=new Uint8ClampedArray(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const rgba=typeof color==='function'?color(x,y):color,at=(y*width+x)*4;
  for(let i=0;i<4;i++)buf[at+i]=rgba[i]??255;
 }
 return buf;
}
const dark=[18,22,43,255],violet=[171,48,225,255],cyan=[20,200,226,255];
const poster=pixels(100,120,(x,y)=> y<90?dark:y<112?violet:cyan);
const generated=ctx.pixelAnalysis(poster,100,120);
assert(generated,'Dark poster analysis returned null');
assert.equal(generated.analysisVersion,487);
assert.equal(generated.derived,false);
assert.equal(generated.intelligent,true);
assert.equal(generated.analysis.sampledFromPixels,true);
assert(generated.analysis.pixels>=1500,'Not enough sampled pixels');
assert.equal(generated.naturalMode,'dark');
assert(similar(generated.colorRoles.dominantBackground,dark.slice(0,3),65),'Dominant dark region not recognized');
assert(generated.colors.some(c=>similar(c,violet.slice(0,3),90)),'Violet accent ignored');
assert(generated.colors.some(c=>similar(c,cyan.slice(0,3),90)),'Cyan accent ignored');
const white=pixels(100,100,(x,y)=>y<88?[243,245,248,255]:[55,111,211,255]);
const bright=ctx.pixelAnalysis(white,100,100);
assert(bright,'Bright poster analysis null');
assert.equal(bright.naturalMode,'light');
assert(similar(bright.colorRoles.dominantBackground,[243,245,248],42));
assert(bright.colors.some(c=>similar(c,[55,111,211],70)),'Distinct blue accent not preserved');
const gray=pixels(80,90,(x,y)=>y<48?[38,38,38,255]:[182,182,182,255]);
const muted=ctx.pixelAnalysis(gray,80,90);
assert(muted);
assert(muted.colors.every(c=>{const [r,g,b]=hexRgb(c);return Math.max(r,g,b)-Math.min(r,g,b)<8;}),'Gray artwork invented saturated colors');
const transparent=pixels(90,90,(x,y)=>x<30?[255,0,0,0]:[25,160,143,255]);
const alpha=ctx.pixelAnalysis(transparent,90,90);
assert(alpha);
assert(alpha.analysis.transparency>.2);
assert(alpha.colors.every(c=>!similar(c,[255,0,0],70)),'Transparent red influenced the palette');
assert.equal(ctx.pixelAnalysis(new Uint8ClampedArray(8),200,200),null);
assert.equal(ctx.cleanUrl('javascript:alert(1)'),'');
assert.equal(ctx.cleanUrl('data:image/svg+xml;base64,AA'), '');
assert.equal(ctx.cleanUrl('https://covers.example/cover.png'),'https://covers.example/cover.png');
const uri='https://covers.example/real.png';
made.set(uri,poster);
(async()=>{
 const first=await ctx.analyze(uri);
 assert(first&&first.sourceIntegrity==='pixel-sampled');
 assert.equal(first.visualCoverUrl,uri);
 const second=await ctx.analyze(uri);
 assert.equal(second,first,'Cached image must reuse its prior result');
 assert(ctx.currentStatus().cacheHits>=1);
 assert.equal(ctx.currentStatus().sampled,1,'Cache hit must not reanalyze image');
 const fail=await ctx.analyze('https://covers.example/blocked.png');
 assert.equal(fail,null,'CORS failure must return null for legacy fallback');
 assert(ctx.currentStatus().failures>=1);
 ctx.cacheClear(uri);
 assert(await ctx.analyze(uri),'Reanalysis should work after cache invalidation');
 assert.equal(ctx.currentStatus().sampled,2);
 console.log('PASS v487: dark poster accents, bright artwork, grayscale, transparency, invalid inputs,');
 console.log('           real pixel extraction, CORS fallback, cache reuse and reanalysis');
})().catch(e=>{console.error(e);process.exitCode=1;});
