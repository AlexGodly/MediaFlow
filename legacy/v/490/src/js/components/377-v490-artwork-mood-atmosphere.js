/* MediaFlow v490 — Artwork Mood & Atmosphere Detection.
 * Browser-only perceptual signals, never artwork title/URL semantic guesses.
 * Pixel-derived heuristics (not an AI image classifier) give Living Themes
 * a measured visual-direction contract for its future Visual Director.
 * Legacy and manually defined Custom colors remain unchanged.
 */
const MF490_VERSION=490;
const MF490_STATE={analyzed:0,errors:0,last:null,lastSource:'',lastAt:0};
const MF490_VISUAL_SIGNATURES=Object.freeze({
 'cinematic-dramatic':'Cinematic / Dramatic',
 'neon-energetic':'Neon / Energetic',
 'soft-dreamlike':'Soft / Dreamlike',
 'luminous-airy':'Luminous / Airy',
 'warm-atmospheric':'Warm / Atmospheric',
 'cool-serene':'Cool / Serene',
 'minimal-muted':'Minimal / Muted',
 'balanced-artwork':'Balanced / Expressive'
});
function mf490Clamp(v,a=0,b=1){const n=Number(v);return Number.isFinite(n)?Math.max(a,Math.min(b,n)):a;}
function mf490Round(v){return Math.round(mf490Clamp(v)*1000)/1000;}
function mf490Measure(bytes,width,height,scan){
 if(!scan||scan.samples<3)return null;
 const stride=Math.max(1,Math.ceil(Math.sqrt(width*height/5500)));
 const lumas=[],weights=[];
 let weight=0,weightedL=0,weightedChroma=0,warmSum=0,coolSum=0;
 let edgeSum=0,complexitySum=0,dark=0,light=0;
 let opaque=0;
 for(const p of scan.pixels){
  const x=Math.min(width-1,Math.max(0,Math.floor(p.fx*width)));
  const y=Math.min(height-1,Math.max(0,Math.floor(p.fy*height)));
  const at=(y*width+x)*4;
  const alpha=bytes[at+3]/255;
  if(alpha<.5)continue;
  const w=alpha;
  const L=p.lab.L,chroma=p.chroma;
  const nextX=Math.min(width-1,x+stride),nextY=Math.min(height-1,y+stride);
  const toLab=(xx,yy)=>{
   const i=(yy*width+xx)*4;
   if(bytes[i+3]<128)return p.lab;
   return mf487OKLab(bytes[i],bytes[i+1],bytes[i+2]);
  };
  const horizontal=mf487Distance(p.lab,toLab(nextX,y));
  const vertical=mf487Distance(p.lab,toLab(x,nextY));
  // A clipped edge score prevents isolated pixel noise from claiming that
  // a grainy cover is "neon" or high-energy.
  const edge=mf490Clamp((horizontal+vertical)*2.0);
  const edgePresence=mf490Clamp((horizontal+vertical-.035)*3);
  const h=((Math.atan2(p.lab.b,p.lab.a)*180/Math.PI)%360+360)%360;
  const hueWeight=mf490Clamp(chroma/.13)*w;
  // Warm/cool describe sampled colors, not the cover's artistic genre.
  const warm=(h<=105||h>=342)?1:0;
  const cool=h>=175&&h<=295?1:0;
  warmSum+=warm*hueWeight;coolSum+=cool*hueWeight;
  edgeSum+=edge*w;complexitySum+=edgePresence*w;
  weightedL+=L*w;weightedChroma+=mf490Clamp(chroma/.24)*w;
  if(L<.34)dark+=w;
  if(L>.74)light+=w;
  lumas.push(L);weights.push(w);weight+=w;opaque++;
 }
 if(opaque<3||weight<=0)return null;
 // Bounded 5,500-point distribution and no per-frame browser processing.
 const sorted=lumas.slice().sort((a,b)=>a-b);
 const pct=q=>sorted[Math.max(0,Math.min(sorted.length-1,Math.floor(q*(sorted.length-1))))];
 const low=pct(.12),high=pct(.88);
 const lightness=weightedL/weight;
 const saturation=weightedChroma/weight;
 const contrast=mf490Clamp((high-low)/.73);
 const texture=mf490Clamp(complexitySum/weight);
 const edges=mf490Clamp(edgeSum/weight);
 // Nearly achromatic pixels have unreliable hue; their temperature is neutral.
 const hueCoverage=(warmSum+coolSum)/weight;
 const temperature=hueCoverage<.035?0:(warmSum-coolSum)/Math.max(warmSum+coolSum,.001);
 const temperatureStrength=mf490Clamp(Math.abs(temperature)*.85);
 const diversity=mf490Clamp(scan.samples?1-
  (scan.pixels.reduce((acc,p)=>acc+Math.pow(p.weight/scan.samples,2),0)):0);
 const energy=mf490Clamp(saturation*.45+texture*.35+contrast*.20);
 const softness=mf490Clamp(1-(texture*.65+contrast*.35));
 const shadow=mf490Clamp(dark/weight);
 const highlights=mf490Clamp(light/weight);
 return {lightness:mf490Round(lightness),saturation:mf490Round(saturation),
  contrast:mf490Round(contrast),texture:mf490Round(texture),edges:mf490Round(edges),
  energy:mf490Round(energy),softness:mf490Round(softness),
  warm:mf490Round(Math.max(0,temperature)),cool:mf490Round(Math.max(0,-temperature)),
  temperature:Math.round(temperature*1000)/1000,
  temperatureStrength:mf490Round(temperatureStrength),
  shadows:mf490Round(shadow),highlights:mf490Round(highlights),
  lightnessRange:[mf490Round(low),mf490Round(high)],validSamples:opaque,
  transparentFraction:mf490Round(scan.transparentFraction),
  // Diversity is retained from v487's validated clustering, not the
  // raw-weight heuristic above; actual palette diversity is more reliable.
  colorDiversity:null};
}
function mf490Signatures(metrics,base){
 const m=metrics;
 const diversity=mf490Clamp(base?.analysis?.diversity??.5);
 m.colorDiversity=mf490Round(diversity);
 const warm=m.warm,cool=m.cool;
 const scores={
  'cinematic-dramatic':.38*mf490Clamp((.59-m.lightness)/.46)+
   .36*m.contrast+.16*m.shadows+.10*mf490Clamp(m.saturation+.1)+
   .17*m.shadows*m.contrast,
  'neon-energetic':.42*m.saturation+.29*m.texture+.21*m.contrast+
   .08*diversity+.18*Math.min(m.saturation,m.texture),
  'soft-dreamlike':.36*m.softness+.31*mf490Clamp(1-m.contrast)+
   .18*mf490Clamp(.65-m.texture)+.15*m.saturation,
  'luminous-airy':.40*mf490Clamp((m.lightness-.51)/.40)+
   .30*mf490Clamp(1-m.contrast)+.20*m.highlights+.10*m.softness,
  'warm-atmospheric':.44*warm+.20*m.softness+
   .20*mf490Clamp(1-m.contrast)+.16*m.saturation,
  'cool-serene':.42*cool+.28*m.softness+
   .20*mf490Clamp(1-m.texture)+.10*mf490Clamp(1-m.saturation),
  'minimal-muted':.43*mf490Clamp(1-m.saturation)+
   .32*mf490Clamp(1-m.texture)+.25*mf490Clamp(1-diversity),
  'balanced-artwork':.48+.16*diversity+.12*mf490Clamp(1-m.texture)
 };
 // Some descriptors require clear evidence. A subdued grayscale poster
 // must not be labeled "neon", nor a vivid dark poster "airy".
 if(m.saturation<.35)scores['neon-energetic']*=.45;
 if(m.lightness>.60)scores['cinematic-dramatic']*=.38;
 if(m.lightness<.50)scores['luminous-airy']*=.32;
 if(warm<.19)scores['warm-atmospheric']*=.34;
 if(cool<.19)scores['cool-serene']*=.34;
 if(m.saturation>.63)scores['minimal-muted']*=.42;
 if(m.texture>.32)scores['soft-dreamlike']*=.48;
 const order=Object.entries(scores).sort((a,b)=>b[1]-a[1]);
 let first=order[0],second=order[1];
 const clarity=mf490Clamp((first[1]-second[1])/.24);
 const confidence=mf490Clamp(.34+clarity*.50+
  mf490Clamp((m.validSamples-300)/2200)*.13);
 // Avoid claiming a narrow style at low separability from "Balanced".
 if(first[0]!=='balanced-artwork'&&first[1]-(scores['balanced-artwork']||0)<.055){
  first=['balanced-artwork',scores['balanced-artwork']];
  second=order.find(x=>x[0]!=='balanced-artwork')||order[1];
 }
 return {key:first[0],label:MF490_VISUAL_SIGNATURES[first[0]],
  confidence:mf490Round(confidence),
  alternatives:order.filter(x=>x[0]!==first[0]).slice(0,2).map(x=>({
   key:x[0],label:MF490_VISUAL_SIGNATURES[x[0]],
   score:mf490Round(x[1])
  })),
  scores:Object.fromEntries(Object.entries(scores).map(([key,value])=>[
   key,mf490Round(value)]))};
}
function mf490Direction(metrics,signature){
 // These are future Living Themes suggestions, NOT commands to launch
 // weather/particles or override manually selected effects in v490.
 const m=metrics,style=signature.key;
 const lighting=m.lightness>.68?'soft-diffuse':
  m.contrast>.53?'cinematic-directional':'ambient-diffuse';
 const gradient=m.temperature>.18?'warm-blend':
  m.temperature<-.18?'cool-blend':'source-palette';
 const glow=mf490Clamp(m.saturation*.55+m.contrast*.3);
 const particles=mf490Clamp(m.softness*.35+m.saturation*.25);
 const motion=style==='minimal-muted'||style==='cool-serene'?'restrained':
  style==='neon-energetic'?'energetic':'balanced';
 return {lighting,gradient,motion,
  glowSuitability:mf490Round(glow),particleSuitability:mf490Round(particles),
  fogSuitability:mf490Round(m.softness*.45+m.shadows*.3),
  intensity:mf490Round(.20+m.energy*.72),
  source:'pixel-derived guidance only',
  effectsApplied:false};
}
function mf490AnalyzeMood(bytes,width,height,result){
 if(!result?.analysis?.sampledFromPixels)return result;
 const scan=mf487PixelSample(bytes,width,height);
 if(!scan)return result;
 const metrics=mf490Measure(bytes,width,height,scan);
 if(!metrics)return result;
 const signature=mf490Signatures(metrics,result);
 const direction=mf490Direction(metrics,signature);
 const payload={version:490,pixelVerified:true,
  metrics,signature,direction,
  method:'Local OKLab lightness, chroma, spatial edges and distribution',
  scope:'Visual characteristics only; not semantic genre or object recognition'};
 return {...result,analysis:{...result.analysis,mood:payload},
  atmosphereHints:direction};
}
const mf490PixelBase=mf487AnalyzePixelData;
mf487AnalyzePixelData=function(bytes,width,height,sourceUrl=''){
 const base=mf490PixelBase.apply(this,arguments);
 if(!base||mf484Prefs().mode==='legacy')return base;
 try{
  const next=mf490AnalyzeMood(bytes,width,height,base);
  const mood=next?.analysis?.mood;
  if(mood){
   MF490_STATE.analyzed++;
   MF490_STATE.last=mood;
   MF490_STATE.lastSource=sourceUrl?mf487Key(sourceUrl):'';
   MF490_STATE.lastAt=Date.now();
   mf490Render();
  }
  return next;
 }catch(err){
  MF490_STATE.errors++;
  console.warn('[MediaFlow v490] Mood analysis skipped; previous verified color palette preserved',err);
  return base;
 }
};
const mf490ComposeBase=mf484Compose;
mf484Compose=function(data,appearance,expressiveness){
 const palette=mf490ComposeBase.apply(this,arguments);
 if(palette&&mf484Prefs().mode!=='legacy'&&data?.analysis?.mood?.pixelVerified){
  palette.atmosphereHints={...data.analysis.mood.direction};
  palette.artworkMood={...data.analysis.mood.signature};
 }
 return palette;
};
function mf490MoodStatus(){
 const mode=mf484Prefs().mode;
 const current=mode==='custom'?
  (mf484ActiveProfile()?.source==='manual'?'':mf484ActiveProfile()?.imageUrl||''):
  (mode==='advanced'?(S.v146DynamicThemeState?.url||''):'');
 const sourceKey=current?mf487Key(current):'';
 // Never attribute the previous artwork's mood to a new current source.
 const currentMatch=!!sourceKey&&sourceKey===MF490_STATE.lastSource;
 const verified=mode!=='legacy'&&currentMatch?MF490_STATE.last:null;
 return {version:490,mode,sourceAvailable:!!sourceKey,
  verified:!!verified,analyzed:MF490_STATE.analyzed,
  errors:MF490_STATE.errors,
  signature:verified?.signature||null,
  metrics:verified?.metrics||null,
  direction:verified?.direction||null,
  lastAnalyzedAt:verified?MF490_STATE.lastAt:0};
}
function mf490Bar(label,value){
 const val=mf490Clamp(value);
 return '<div class="mf490-metric"><span>'+escapeHtml(label)+
  '</span><div role="progressbar" aria-label="'+escapeHtml(label)+
  '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+
  Math.round(val*100)+'"><i style="width:'+Math.round(val*100)+'%"></i></div>'+
  '<small>'+Math.round(val*100)+'%</small></div>';
}
function mf490Render(){
 const root=document.getElementById('mf490-mood-state');if(!root)return;
 const s=mf490MoodStatus();
 if(!s.verified){
  root.innerHTML='<p>No current pixel-verified artwork mood. Choose Advanced with an accessible cover, or a Custom image/hybrid theme; blocked images use the existing safe fallback.</p>';
  return;
 }
 const a=s.signature,m=s.metrics,d=s.direction;
 root.innerHTML='<div class="mf490-signature"><strong>'+escapeHtml(a.label)+'</strong>'+
  '<span>Heuristic confidence '+Math.round(a.confidence*100)+'%</span></div>'+
  '<div class="mf490-metrics">'+
  mf490Bar('Visual energy',m.energy)+mf490Bar('Color intensity',m.saturation)+
  mf490Bar('Brightness',m.lightness)+mf490Bar('Contrast',m.contrast)+
  mf490Bar('Texture',m.texture)+mf490Bar('Softness',m.softness)+
  '</div><div class="mf490-direction"><strong>Suggested atmosphere</strong>'+
  '<span>'+escapeHtml(d.lighting)+' · '+escapeHtml(d.gradient)+
  ' · '+escapeHtml(d.motion)+' motion</span></div>'+
  '<small>Temperature: '+(m.temperature>.15?'warm':m.temperature<-.15?'cool':'balanced')+
  ' · Analyzed '+m.validSamples+' artwork samples. Suggestions do not enable effects or change your theme settings.</small>';
}
function mf490Mount(){
 if(String(S.view)!=='settings'||!window.MediaFlowSettingsCenter?.mountSection)return;
 if(document.querySelector('.mf490-mood-panel'))return;
 const node=document.createElement('div');
 node.innerHTML='<div class="mf490-mood-panel"><div><strong>Artwork Mood & Atmosphere</strong>'+
  '<p>Explore the visual character of sampled artwork: lighting, temperature, contrast, texture and energy. Mood labels describe measurable image style, not story genre or recognizable objects.</p></div>'+
  '<div id="mf490-mood-state" aria-live="polite"></div>'+
  '<small>Intelligent Living Themes effect selection arrives in later roadmap updates. This update supplies trustworthy, opt-in visual direction data without enabling animations.</small></div>';
 window.MediaFlowSettingsCenter.mountSection({
  id:'mf490-artwork-mood',title:'Artwork Mood & Atmosphere Detection',
  category:'appearance',subgroup:'Theme Intelligence',
  keywords:['mood','atmosphere','visual','temperature','warm','cool','serene','neon','energy','texture','contrast'],
  nodes:[node]
 });mf490Render();
}
MediaFlowRuntime.registerPageEnhancer('settings',mf490Mount);
window.MediaFlowV490=Object.freeze({version:490,
 analyze:mf490AnalyzeMood,measure:mf490Measure,
 classify:mf490Signatures,status:mf490MoodStatus});
MediaFlowRuntime.version=MF490_VERSION;
