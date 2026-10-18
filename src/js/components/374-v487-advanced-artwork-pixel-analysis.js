/* MediaFlow v487 — Advanced Artwork Pixel Analysis
 * Opt-in Advanced and user-image Custom modes only. Legacy is untouched.
 * Small bounded image sampler + weighted perceptual clustering (OKLab).
 * Never guesses artwork colors from a URL when actual pixels were unavailable.
 */
const MF487_VERSION=487;
const MF487_CACHE=new Map();
const MF487_STATE={attempts:0,sampled:0,cacheHits:0,failures:0,
 last:null,lastError:'',lastUrl:'',lastAt:0};
const MF487_MAX_CACHE=96;
const MF487_CACHE_TTL=12*60*60*1000;
const MF487_TIMEOUT=9500;
function mf487Clamp(x,a,b){return Math.max(a,Math.min(b,x));}
function mf487Hex(r,g,b){
 const v=[r,g,b].map(n=>mf487Clamp(Math.round(n),0,255));
 return '#'+v.map(n=>n.toString(16).padStart(2,'0')).join('').toUpperCase();
}
function mf487Linear(c){
 const v=mf487Clamp(c/255,0,1);
 return v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4;
}
function mf487OKLab(r,g,b){
 const R=mf487Linear(r),G=mf487Linear(g),B=mf487Linear(b);
 const l=Math.cbrt(0.4122214708*R+0.5363325363*G+0.0514459929*B);
 const m=Math.cbrt(0.2119034982*R+0.6806995451*G+0.1073969566*B);
 const s=Math.cbrt(0.0883024619*R+0.2817188376*G+0.6299787005*B);
 return {L:0.2104542553*l+0.7936177850*m-0.0040720468*s,
  a:1.9779984951*l-2.4285922050*m+0.4505937099*s,
  b:0.0259040371*l+0.7827717662*m-0.8086757660*s};
}
function mf487Distance(a,b){
 return Math.hypot(a.L-b.L,a.a-b.a,a.b-b.b);
}
function mf487Chroma(lab){return Math.hypot(lab.a,lab.b);}
function mf487Lightness(r,g,b){return (r*.2126+g*.7152+b*.0722)/255;}
function mf487PixelSample(data,width,height){
 if(!data||typeof data.length!=='number'||!Number.isInteger(width)||
  !Number.isInteger(height)||width<2||height<2||
  width>2500||height>2500||data.length<width*height*4)return null;
 // Working pixel count is bounded by the image-downsampling stage. Direct
 // callers with larger buffers are sampled sparsely instead of per-pixel.
 const stride=Math.max(1,Math.ceil(Math.sqrt(width*height/5500)));
 const out=[];
 let sumL=0,sumS=0,weight=0;
 for(let y=0;y<height;y+=stride)for(let x=0;x<width;x+=stride){
  const p=(y*width+x)*4,alpha=data[p+3]/255;
  if(alpha<.5)continue;
  const r=data[p],g=data[p+1],b=data[p+2];
  const lab=mf487OKLab(r,g,b),chroma=mf487Chroma(lab);
  const fx=(x+.5)/width,fy=(y+.5)/height;
  const focus=1-mf487Clamp(Math.hypot((fx-.5)*1.2,(fy-.5)*.85),0,1);
  // Local edge estimate rewards distinctive features without turning
  // individual noisy pixels into the main palette color.
  const xx=Math.min(width-1,x+stride),yy=Math.min(height-1,y+stride);
  const q=(yy*width+xx)*4;
  const neighbor=mf487OKLab(data[q],data[q+1],data[q+2]);
  const edge=mf487Clamp(mf487Distance(lab,neighbor)*3.4,0,1);
  const salience=(.65+focus*.27+edge*.24+
   Math.min(1,chroma/.22)*.52)*alpha;
  out.push({r,g,b,lab,chroma,fx,fy,weight:salience,
   bin:Math.round(lab.L/.055)+':'+Math.round(lab.a/.055)+':'+Math.round(lab.b/.055)});
  const w=alpha;sumL+=mf487Lightness(r,g,b)*w;
  sumS+=mf487Clamp(chroma/.25,0,1)*w;weight+=w;
 }
 if(out.length<3)return null;
 return {pixels:out,samples:out.length,
  avgLuminance:weight?sumL/weight:.5,
  avgChroma:weight?sumS/weight:0,
  transparentFraction:1-out.length/Math.ceil(width/stride)/Math.ceil(height/stride)};
}
function mf487ClusterPixels(scan){
 const all=scan.pixels;
 const bins=new Map();
 for(const p of all){
  let v=bins.get(p.bin);
  if(!v){v={n:0,w:0,r:0,g:0,b:0,L:0,a:0,bb:0,center:0};bins.set(p.bin,v);}
  v.n++;v.w+=p.weight;v.r+=p.r*p.weight;v.g+=p.g*p.weight;
  v.b+=p.b*p.weight;v.L+=p.lab.L*p.weight;
  v.a+=p.lab.a*p.weight;v.bb+=p.lab.b*p.weight;
  v.center+=p.weight*(1-Math.hypot((p.fx-.5)*.9,(p.fy-.5)*.7));
 }
 const groups=[...bins.values()].map(v=>({
  n:v.n,w:v.w,r:v.r/v.w,g:v.g/v.w,b:v.b/v.w,
  lab:{L:v.L/v.w,a:v.a/v.w,b:v.bb/v.w},center:v.center/v.w
 })).sort((a,b)=>b.w-a.w);
 if(!groups.length)return [];
 // Initial centers combine true coverage and perceptual separation.
 const eligible=groups.filter(g=>g.n>=Math.max(2,Math.floor(scan.samples*.001)));
 const choices=eligible.length?eligible:groups;
 const centers=[{...choices[0].lab}];
 while(centers.length<Math.min(7,choices.length)){
  let best=null,bestScore=-Infinity;
  for(const g of choices){
   const distance=Math.min(...centers.map(c=>mf487Distance(g.lab,c)));
   if(distance<.055)continue;
   const score=distance*(.24+Math.sqrt(g.n/scan.samples))*Math.sqrt(g.w);
   if(score>bestScore){bestScore=score;best=g;}
  }
  if(!best)break;
  centers.push({...best.lab});
 }
 for(let t=0;t<6;t++){
  const result=centers.map(()=>({n:0,w:0,L:0,a:0,b:0}));
  for(const p of all){
   let best=0,d=Infinity;
   for(let j=0;j<centers.length;j++){
    const next=mf487Distance(p.lab,centers[j]);
    if(next<d){best=j;d=next;}
   }
   const v=result[best];v.n++;v.w+=p.weight;
   v.L+=p.lab.L*p.weight;v.a+=p.lab.a*p.weight;v.b+=p.lab.b*p.weight;
  }
  centers.forEach((c,i)=>{const v=result[i];if(v.w>0){
   c.L=v.L/v.w;c.a=v.a/v.w;c.b=v.b/v.w;
  }});
 }
 const result=centers.map((lab,i)=>({lab,index:i,w:0,n:0,
  r:0,g:0,b:0,focus:0,weight:0}));
 for(const p of all){
  let best=0,d=Infinity;
  for(let i=0;i<centers.length;i++){
   const distance=mf487Distance(p.lab,centers[i]);
   if(distance<d){d=distance;best=i;}
  }
  const v=result[best];v.n++;v.w+=p.weight;v.r+=p.r*p.weight;
  v.g+=p.g*p.weight;v.b+=p.b*p.weight;
  v.focus+=p.weight*(1-mf487Clamp(Math.hypot((p.fx-.5)*1.1,(p.fy-.5)*.8),0,1));
 }
 return result.filter(v=>v.w>0).map(v=>{
  const rgb={r:v.r/v.w,g:v.g/v.w,b:v.b/v.w};
  return {...v,lab:mf487OKLab(rgb.r,rgb.g,rgb.b),
   hex:mf487Hex(rgb.r,rgb.g,rgb.b),
   share:v.n/scan.samples,
   attention:v.focus/v.w,
   chroma:mf487Chroma(v.lab)};
 }).sort((a,b)=>b.share-a.share);
}
function mf487Tone(hex,offset){
 const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),
  b=parseInt(hex.slice(5,7),16);
 // Grayscale-safe tonal alternative when a cover contains just one hue.
 const target=offset>=0?255:0,m=Math.abs(offset);
 return mf487Hex(r+(target-r)*m,g+(target-g)*m,b+(target-b)*m);
}
function mf487ChoosePalette(clusters,scan){
 if(!clusters.length)return null;
 const background=clusters[0],major=clusters.filter(v=>v.share>=.012);
 const eligible=major.length?major:clusters;
 const score=v=>{
  const separation=mf487Distance(v.lab,background.lab);
  return .46*Math.sqrt(v.share)+.72*mf487Clamp(v.chroma/.19,0,1)+
   .22*mf487Clamp(separation/.3,0,1)+.18*v.attention;
 };
 const ranked=[...eligible].sort((a,b)=>score(b)-score(a));
 let first=ranked[0];
 // Reject tiny isolated artifacts masquerading as representative accents.
 if(first.share<.017&&background.share>.65)first=background;
 const picked=[first];
 while(picked.length<3){
  let best=null,bestScore=-Infinity;
  for(const c of eligible){
   if(picked.includes(c))continue;
   const difference=Math.min(...picked.map(x=>mf487Distance(x.lab,c.lab)));
   if(difference<.065)continue;
   const s=score(c)+difference*1.35+Math.sqrt(c.share)*.15;
   if(s>bestScore){bestScore=s;best=c;}
  }
  if(!best)break;
  picked.push(best);
 }
 // In naturally muted artwork, fill missing roles with muted variations,
 // never an unrelated neon hue or arbitrary vibrant accent.
 const colors=picked.map(v=>v.hex);
 while(colors.length<3){
  const base=colors[0]||background.hex;
  colors.push(mf487Tone(base,colors.length===1?.19:-.21));
 }
 const coverage=clusters.map(c=>({color:c.hex,percent:Math.round(c.share*1000)/10,
  chroma:Math.round(c.chroma*1000)/1000}));
 const colorDiversity=1-clusters.reduce((sum,x)=>sum+x.share*x.share,0);
 const spread=clusters.length>1?Math.max(...clusters.slice(1).map(v=>
  mf487Distance(background.lab,v.lab))):0;
 return {
  colors:colors.slice(0,3),
  naturalMode:scan.avgLuminance>.62&&background.lab.L>.57?'light':'dark',
  averageLuminance:scan.avgLuminance,
  derived:false,intelligent:true,analysisVersion:487,
  colorRoles:{
   focal:colors[0],accent:colors[1],supporting:colors[2],
   dominantBackground:background.hex
  },
  analysis:{
   pixels:scan.samples,clusters:clusters.length,
   dominantCoverage:Math.round(background.share*1000)/1000,
   chroma:Math.round(scan.avgChroma*1000)/1000,
   luminance:Math.round(scan.avgLuminance*1000)/1000,
   diversity:Math.round(colorDiversity*1000)/1000,
   separation:Math.round(spread*1000)/1000,
   transparency:Math.round(scan.transparentFraction*1000)/1000,
   distribution:coverage.slice(0,7),
   sampledFromPixels:true,method:'OKLab spatial/contrast-aware clustering'
  }
 };
}
function mf487AnalyzePixelData(data,width,height){
 const scan=mf487PixelSample(data,width,height);
 if(!scan)return null;
 const clusters=mf487ClusterPixels(scan);
 return mf487ChoosePalette(clusters,scan);
}
function mf487ValidUrl(value){
 const url=String(value||'').trim();
 if(mf484ImageUrl(url))return url;
 // Existing Library cover sources can contain inline raster images. Keep a
 // strict size and media-type cap; SVG/script-bearing data URLs are excluded.
 return url.length<2_000_000&&
 /^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(url)?url:'';
}
function mf487Key(url){
 return url.length>160?('data:'+v160HashString(url).join('-')):url;
}
function mf487CacheDelete(url){MF487_CACHE.delete(mf487Key(url));}
function mf487AnalyzeImage(url){
 const u=mf487ValidUrl(url);
 if(!u)return Promise.resolve(null);
 MF487_STATE.lastUrl=u;
 const now=Date.now(),key=mf487Key(u);
 const prior=MF487_CACHE.get(key);
 if(prior&&now-prior.at<MF487_CACHE_TTL){
  MF487_STATE.cacheHits++;
  return prior.promise;
 }
 if(prior)MF487_CACHE.delete(key);
 MF487_STATE.attempts++;
 const promise=new Promise(resolve=>{
  let done=false,timer=null;
  const img=new Image();
  const finish=(value,error)=>{
   if(done)return;
   done=true;clearTimeout(timer);
   img.onload=null;img.onerror=null;
   MF487_STATE.lastAt=Date.now();
   if(value){
    MF487_STATE.sampled++;
    MF487_STATE.last=value;
    MF487_STATE.lastError='';
   }else{
    MF487_STATE.failures++;
    MF487_STATE.lastError=error||'Unable to read artwork pixels';
    MF487_CACHE.delete(key);
   }
   mf487ShowStatus();
   resolve(value);
  };
  timer=setTimeout(()=>finish(null,'Artwork sampling timed out'),MF487_TIMEOUT);
  img.crossOrigin='anonymous';
  img.onerror=()=>finish(null,'Image failed to load or blocked by source');
  img.onload=()=>{
   try{
    const w0=Math.max(1,img.naturalWidth||img.width||0),
     h0=Math.max(1,img.naturalHeight||img.height||0);
    const scale=Math.min(1,128/Math.max(w0,h0));
    const w=Math.max(2,Math.round(w0*scale)),
     h=Math.max(2,Math.round(h0*scale));
    const canvas=document.createElement('canvas');
    canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    if(!ctx)return finish(null,'Browser canvas unavailable');
    ctx.drawImage(img,0,0,w,h);
    const bytes=ctx.getImageData(0,0,w,h).data;
    const outcome=mf487AnalyzePixelData(bytes,w,h,u);
    if(!outcome)return finish(null,'No usable opaque artwork pixels');
    outcome.visualCoverUrl=u;
    outcome.sourceIntegrity='pixel-sampled';
    finish(outcome,null);
   }catch(_){finish(null,'Image pixels not accessible (CORS or canvas restriction)');}
  };
  try{img.src=u;}catch(_){finish(null,'Invalid image source');}
 });
 MF487_CACHE.set(key,{promise,at:now});
 while(MF487_CACHE.size>MF487_MAX_CACHE)MF487_CACHE.delete(MF487_CACHE.keys().next().value);
 return promise;
}
// mf484 uses this named binding from inside its existing v160 extraction
// wrapper and from Custom image/hybrid profile application. Replacing only
// this function retains all previous Legacy behavior and fallback rules.
const mf487BaseSampler=mf484Analyze;
mf484Analyze=mf487AnalyzeImage;
function mf487Status(){
 const p=mf484Prefs(),sample=MF487_STATE.last;
 return {
  version:487,mode:p.mode,
  attempts:MF487_STATE.attempts,
  sampled:MF487_STATE.sampled,
  cacheHits:MF487_STATE.cacheHits,
  failures:MF487_STATE.failures,
  cached:MF487_CACHE.size,
  method:sample?.analysis?.method||'Awaiting image',
  sampleCount:sample?.analysis?.pixels||0,
  averageLuminance:sample?.analysis?.luminance??null,
  chroma:sample?.analysis?.chroma??null,
  dominantCoverage:sample?.analysis?.dominantCoverage??null,
  colorDiversity:sample?.analysis?.diversity??null,
  sourceIntegrity:sample?.sourceIntegrity||'No sampled cover yet',
  colors:sample?.colors?.slice(0,3)||[],
  dominant:sample?.colorRoles?.dominantBackground||'',
  error:MF487_STATE.lastError,
  analyzedAt:MF487_STATE.lastAt
 };
}
function mf487ShowStatus(){
 const el=document.getElementById('mf487-analysis-status');
 if(!el)return;
 const s=mf487Status();
 const colorSquares=s.colors.map(color=>'<span class="mf487-color-chip" title="'+color+
  '" style="background:'+color+'"></span>').join('');
 el.innerHTML='<div class="mf487-metrics">'+
  '<span><strong>'+s.sampled+'</strong> analyzed</span>'+
  '<span><strong>'+s.cacheHits+'</strong> cached reads</span>'+
  '<span><strong>'+s.failures+'</strong> failures</span></div>'+
  '<div class="mf487-color-row">'+colorSquares+'</div>'+
  '<p>'+escapeHtml(s.sampleCount?s.sampleCount+' sampled artwork points · '+
  s.method:'No successful pixel analysis yet')+'</p>'+
  (s.sampleCount?'<p>Brightness '+Math.round(s.averageLuminance*100)+'% · '+
  'Chroma '+Math.round(s.chroma*100)+'% · Dominant coverage '+
  Math.round(s.dominantCoverage*100)+'%</p>':'')+
  (s.error?'<small class="mf487-warning">'+escapeHtml(s.error)+
  ' — the existing fallback system remains available.</small>':'')+
  '<small>Only images whose pixels are readable can produce verified colors. Analysis never infers artwork from its URL.</small>';
}
function mf487Retry(){
 const p=mf484Prefs();
 if(p.mode==='legacy'){
  showToast('Legacy retains the original MediaFlow extraction method');return;
 }
 if(p.mode==='custom'){
  const profile=mf484ActiveProfile(p);
  if(!profile.imageUrl){showToast('This Custom profile has no image URL');return;}
  mf487CacheDelete(profile.imageUrl);
  // Force Custom to invalidate its last applied profile key; keep colors.
  MF485.appliedKey='';
  ++MF484_CUSTOM_SEQ;
  mf484ApplyCustom();
 }else{
  if(!S.settings?.dynamicCoverTheme){
   showToast('Select a cover-based collection to analyze artwork');return;
  }
  if(MF487_STATE.lastUrl)mf487CacheDelete(MF487_STATE.lastUrl);
  v146ScheduleDynamicTheme();
 }
 showToast('Reanalyzing artwork pixels');
}
function mf487Mount(){
 if(String(S.view)!=='settings'||!window.MediaFlowSettingsCenter?.mountSection)return;
 if(document.querySelector('.mf487-analysis-panel'))return;
 const node=document.createElement('div');
 node.innerHTML='<div class="mf487-analysis-panel">'+
  '<div class="mf487-analysis-title"><strong>Artwork Pixel Intelligence</strong><small>Advanced sampling diagnostics · v487</small></div>'+
  '<p>Analyzes real artwork using perceptual color clusters, spatial contrast and salient accents while retaining the cover’s dominant visual identity.</p>'+
  '<div id="mf487-analysis-status" aria-live="polite"></div>'+
  '<button type="button" class="btn btn-ghost" onclick="App.mf487Retry()">Reanalyze Current Artwork</button>'+
  '</div>';
 window.MediaFlowSettingsCenter.mountSection({
  id:'mf487-pixel-intelligence',title:'Advanced Artwork Pixel Analysis',
  category:'appearance',subgroup:'Theme Intelligence',
  keywords:['artwork','pixels','analysis','dominant','accent','contrast','color','sampling','quality'],
  nodes:[node]
 });
 mf487ShowStatus();
}
Object.assign(App,{mf487Retry});
MediaFlowRuntime.registerPageEnhancer('settings',mf487Mount);
window.MediaFlowV487=Object.freeze({
 version:487,status:mf487Status,analyze:mf487AnalyzeImage,
 sample:mf487AnalyzePixelData,clearCache:mf487CacheDelete
});
MediaFlowRuntime.version=MF487_VERSION;
