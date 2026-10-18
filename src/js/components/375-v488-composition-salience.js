/* MediaFlow v488 — Composition & Focal Region Intelligence.
 * Cover-driven Advanced and image-sourced Custom only. Legacy is unchanged.
 * Focal "subject" here means a visually distinctive image region, not
 * semantic people/object recognition. Fully local, pixel-based and bounded.
 */
const MF488_VERSION=488;
const MF488_GRID=3;
const MF488_LABELS=['top-left','top','top-right','left','center','right','bottom-left','bottom','bottom-right'];
const MF488_HEALTH={evaluated:0,automatic:0,manual:0,changes:0,last:null,errors:0};
function mf488Clamp(n,min=0,max=1){return Math.max(min,Math.min(max,Number(n)||0));}
function mf488Key(url){
 const clean=mf487ValidUrl(url);
 return clean?'cover-'+v160HashString(clean).map(n=>n.toString(36)).join('-'):'';
}
function mf488Overrides(){
 const raw=S.settings?.v488FocalOverrides;
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return {};
 const out={};
 for(const [key,val] of Object.entries(raw).slice(-80)){
  if(!/^cover-[a-z0-9-]{3,90}$/.test(key))continue;
  if(typeof val==='string'&&MF488_LABELS.includes(val))out[key]=val;
 }
 return out;
}
function mf488FocusFor(url){
 const key=mf488Key(url);
 return key?mf488Overrides()[key]||'auto':'auto';
}
function mf488SourceUrl(){
 const mode=mf484Prefs().mode;
 if(mode==='custom'){
  const p=mf484ActiveProfile();
  return p.source!=='manual'?mf487ValidUrl(p.imageUrl):'';
 }
 if(mode!=='advanced'||!S.settings?.dynamicCoverTheme)return '';
 const active=S.v146DynamicThemeState?.url;
 return mf487ValidUrl(active)||mf487ValidUrl(MF487_STATE.lastUrl)||'';
}
function mf488DistanceToCenter(lab,centroid){return mf487Distance(lab,centroid);}
function mf488TileIndex(x,y){
 return Math.min(2,Math.floor(mf488Clamp(y,0,.999)*3))*3+
 Math.min(2,Math.floor(mf488Clamp(x,0,.999)*3));
}
function mf488TileGrid(x,y){return {col:x%3,row:Math.floor(x/3)};}
function mf488AnalyzeComposition(data,width,height,base,requested='auto'){
 if(!base||!data||width<3||height<3)return base;
 const scan=mf487PixelSample(data,width,height);
 if(!scan)return base;
 const clusters=mf487ClusterPixels(scan);
 if(!clusters.length)return base;
 const background=clusters[0];
 // Perceptual rarity relative to the artwork's most-covered color is more
 // useful than raw saturation alone for a dark poster with a small subject.
 const tiles=Array.from({length:9},(_,i)=>({
  i,name:MF488_LABELS[i],count:0,weight:0,
  r:0,g:0,b:0,variation:0,rarity:0,saturation:0,meanL:0
 }));
 let totalSalience=0;
 for(const p of scan.pixels){
  const t=tiles[mf488TileIndex(p.fx,p.fy)];
  const diff=mf488DistanceToCenter(p.lab,background.lab);
  const novelty=mf488Clamp(diff/.29);
  const vivid=mf488Clamp(p.chroma/.22);
  // Local contrast is measured against two nearby pixels; use a bounded
  // texture boost to reject uniform backgrounds but not reward noise alone.
  const xx=Math.min(width-1,Math.round(p.fx*width)),yy=Math.min(height-1,Math.round(p.fy*height));
  const next=Math.min(width-1,xx+2),below=Math.min(height-1,yy+2);
  const read=(x,y)=>{
   const off=(y*width+x)*4;
   return mf487OKLab(data[off],data[off+1],data[off+2]);
  };
  const gradient=mf488Clamp((mf487Distance(p.lab,read(next,yy))+
   mf487Distance(p.lab,read(xx,below)))*2.6);
  const nonbackground=mf488Clamp((diff-.04)/.28);
  const value=p.weight*(.22+.66*novelty+.34*vivid+
   .22*gradient)*(.75+.25*nonbackground);
  t.count++;t.weight+=value;t.r+=p.r*value;t.g+=p.g*value;
  t.b+=p.b*value;t.variation+=gradient;t.rarity+=novelty;
  t.saturation+=vivid;t.meanL+=p.lab.L;
  totalSalience+=value;
 }
 const valid=tiles.filter(t=>t.count>0);
 if(!valid.length)return base;
 const tileAverage=valid.reduce((a,t)=>a+t.weight/Math.max(t.count,1),0)/valid.length;
 const score=t=>{
  if(!t.count)return 0;
  const density=t.weight/t.count;
  // Penalize tiny noisy patches, but allow edge subjects. Slight center
  // preference only as a tie-break; dominant backgrounds often surround a
  // genuinely distinct off-center focal element.
  const coverage=Math.min(1,t.count/(scan.samples/9));
  return density*(.83+.17*Math.sqrt(coverage))*(t.i===4?1.055:1);
 };
 const ranked=[...valid].sort((a,b)=>score(b)-score(a));
 const detected=ranked[0],manual=MF488_LABELS.includes(requested);
 const target=manual?tiles[MF488_LABELS.indexOf(requested)]:detected;
 if(!target?.count)return base;
 const strength=tileAverage>0?score(detected)/tileAverage:1;
 const confidence=mf488Clamp((strength-1)/1.2);
 const foreground=mf487Hex(target.r/Math.max(.01,target.weight),
  target.g/Math.max(.01,target.weight),target.b/Math.max(.01,target.weight));
 const chosen=manual?'manual':'automatic';
 // Focused color clusters must represent a coherent region of artwork. No
 // semantic claims. Avoid picking a single bright pixel or inventing hues.
 const activeSamples=scan.pixels.filter(p=>
  mf488TileIndex(p.fx,p.fy)===target.i);
 const regional={pixels:activeSamples,samples:activeSamples.length};
 const areaClusters=activeSamples.length>=12?mf487ClusterPixels(regional):[];
 const contrastCandidates=areaClusters.filter(v=>
  v.share>=.075&&mf487Distance(v.lab,background.lab)>.07)
  .sort((a,b)=>{
   const rank=v=>.48*mf488Clamp(v.chroma/.22)+
    .64*mf488Clamp(mf487Distance(v.lab,background.lab)/.28)+
    .16*Math.sqrt(v.share);
   return rank(b)-rank(a);
  });
 const leading=contrastCandidates[0]||null;
 const enoughEvidence=manual||confidence>.12;
 let colors=base.colors.slice();
 if(leading&&enoughEvidence){
  const primary=leading.hex;
  const similar=mf487Distance(leading.lab,mf487OKLab(...[1,3,5].map(k=>
   parseInt(String(colors[0]).slice(k,k+2),16))));
  if(similar>.065){
   colors=[primary,...colors.filter(x=>x!==primary)].slice(0,3);
  }
 }
 while(colors.length<3)colors.push(colors[colors.length-1]);
 const focusColor=leading?.hex||foreground;
 const regionShare=target.count/scan.samples;
 const metadata={
  selected:target.name,mode:chosen,automatic:detected.name,
  center:{x:(mf488TileGrid(target.i).col+.5)/3,
   y:(mf488TileGrid(target.i).row+.5)/3},
  confidence:Math.round(confidence*1000)/1000,
  focusColor,foregroundContrast:Math.round(mf487Distance(
   mf487OKLab(...[1,3,5].map(k=>parseInt(focusColor.slice(k,k+2),16))),background.lab)*1000)/1000,
  coverage:Math.round(regionShare*1000)/1000,
  topRegions:ranked.slice(0,4).map(t=>({
   name:t.name,score:Math.round(score(t)*1000)/1000,
   chroma:Math.round(t.saturation/Math.max(1,t.count)*1000)/1000
  })),
  detection:'Spatial contrast, chroma and coverage heuristics — not object recognition'
 };
 const enriched={
  ...base,colors,analysisVersion:488,
  colorRoles:{...base.colorRoles,focal:colors[0],focalRegion:metadata.selected,
   foregroundHint:focusColor},
  analysis:{...base.analysis,composition:metadata,
   method:'OKLab clustering + spatial focal-region salience'}
 };
 MF488_HEALTH.evaluated++;
 if(manual)MF488_HEALTH.manual++;else MF488_HEALTH.automatic++;
 MF488_HEALTH.last={mode:chosen,region:metadata.selected,
  confidence:metadata.confidence,color:focusColor,
  sourceMethod:metadata.detection};
 return enriched;
}
// Extend the v487 pixel stage without replacing its source-selection,
// caching, fallback, theme-ownership or palette-composition architecture.
const mf488PixelBase=mf487AnalyzePixelData;
mf487AnalyzePixelData=function(data,width,height,sourceUrl=''){
 const base=mf488PixelBase(data,width,height);
 if(!base||mf484Prefs().mode==='legacy')return base;
 const override=mf488FocusFor(sourceUrl);
 try{return mf488AnalyzeComposition(data,width,height,base,override);}
 catch(e){
  MF488_HEALTH.errors++;
  console.warn('[MediaFlow v488] Using verified v487 palette after composition error',e);
  return base;
 }
};
function mf488SetFocus(region){
 if(mf484Prefs().mode==='legacy'){
  showToast('Legacy keeps the original cover theme behavior');return;
 }
 if(region!=='auto'&&!MF488_LABELS.includes(region))return;
 const url=mf488SourceUrl(),key=mf488Key(url);
 if(!key){showToast('No readable artwork source is selected for this theme');return;}
 const settings=mf488Overrides();
 if(region==='auto')delete settings[key];else settings[key]=region;
 // Bounded preferences that are included in standard settings/cloud exports.
 const entries=Object.entries(settings).slice(-79);
 S.settings.v488FocalOverrides=Object.fromEntries(entries);
 persistSettings();
 MF488_HEALTH.changes++;
 mf487CacheDelete(url);
 // The old Legacy fallback cache may have retained a prior palette.
 // For opt-in Advanced, its source remains unchanged and will be sampled
 // again on the next guarded refresh.
 if(mf484Prefs().mode==='custom'){
  ++MF484_CUSTOM_SEQ;MF485.appliedKey='';
  mf484ApplyCustom();
 }else{
  ++V146_DYNAMIC_SEQ;
  v146ScheduleDynamicTheme();
 }
 mf488ShowStatus();
 showToast(region==='auto'?'Using automatic focal analysis':'Focal region set: '+region.replace('-',' '));
}
function mf488Status(){
 const mode=mf484Prefs().mode,url=mf488SourceUrl(),last=MF488_HEALTH.last;
 const sampled=MF487_STATE.last?.analysis?.composition;
 return {
  version:488,mode,sourceAvailable:!!url,
  preferred:mf488FocusFor(url),
  detected:sampled?.automatic||last?.region||'Not sampled yet',
  selected:sampled?.selected||last?.region||'Not sampled yet',
  confidence:sampled?.confidence??last?.confidence??null,
  focusColor:sampled?.focusColor||last?.color||'',
  manual:MF488_HEALTH.manual,automatic:MF488_HEALTH.automatic,
  evaluated:MF488_HEALTH.evaluated,changes:MF488_HEALTH.changes,
  errors:MF488_HEALTH.errors
 };
}
function mf488ShowStatus(){
 const root=document.getElementById('mf488-composition-state');
 if(!root)return;
 const s=mf488Status();
 root.innerHTML='<strong>'+escapeHtml(s.mode.toUpperCase())+
  ' · '+escapeHtml(s.selected)+'</strong>'+
  '<small>Detected: '+escapeHtml(s.detected)+
  ' · Confidence: '+(s.confidence==null?'—':Math.round(s.confidence*100)+'%')+
  ' · Analyses: '+s.evaluated+'</small>'+
  (s.focusColor?'<span class="mf488-focus-color" style="background:'+
   escapeHtml(s.focusColor)+'" title="Detected focal color"></span>':'')+
  (!s.sourceAvailable?'<small>No current cover image URL is available.</small>':'');
 const buttons=document.getElementById('mf488-focus-grid');
 if(buttons){
  buttons.querySelectorAll('[data-mf488-region]').forEach(node=>{
   const selected=node.dataset.mf488Region===s.preferred;
   node.setAttribute('aria-pressed',selected?'true':'false');
   node.classList.toggle('selected',selected);
  });
 }
 const cover=document.getElementById('mf488-cover-preview');
 if(cover){
  const url=mf488SourceUrl();
  const verified=/^https?:\/\//i.test(url)&&url.length<1600?url:'';
  if(verified){
   if(cover.getAttribute('src')!==verified)cover.setAttribute('src',verified);
   cover.hidden=false;
  }else{
   cover.removeAttribute('src');cover.hidden=true;
  }
 }
}
function mf488Mount(){
 if(String(S.view)!=='settings'||!window.MediaFlowSettingsCenter?.mountSection)return;
 if(document.querySelector('.mf488-focal-panel'))return;
 const wrapper=document.createElement('div');
 const nine=MF488_LABELS.map((label,i)=>
  '<button type="button" class="mf488-region" data-mf488-region="'+label+
  '" aria-label="Focus '+escapeHtml(label.replace('-',' '))+
  '" onclick="App.mf488SetFocus(\''+label+'\')">'+
  '<span>'+({0:'↖',1:'↑',2:'↗',3:'←',4:'◎',5:'→',6:'↙',7:'↓',8:'↘'}[i])+'</span></button>'
 ).join('');
 wrapper.innerHTML='<div class="mf488-focal-panel"><div><strong>Visual Composition & Focal Region</strong>'+
 '<p>Automatic detection analyzes spatial contrast and artwork details. If it misreads the main visual area, choose where to focus for this specific cover.</p></div>'+
 '<div class="mf488-focal-layout"><div class="mf488-cover-holder"><img id="mf488-cover-preview" alt="Current theme cover for focal selection" loading="lazy" hidden></div>'+
 '<div class="mf488-focal-controls"><span>Focal priority</span>'+
 '<div id="mf488-focus-grid" class="mf488-focus-grid">'+nine+'</div>'+
 '<button type="button" class="btn btn-ghost" data-mf488-region="auto" onclick="App.mf488SetFocus(\'auto\')">Automatic detection</button>'+
 '</div></div><div id="mf488-composition-state" class="mf488-state" aria-live="polite"></div>'+
 '<small>Focal overrides are stored by artwork identity, not by changing the image URL or your existing Theme Collection settings. This is perceptual image analysis, not people/object detection.</small></div>';
 window.MediaFlowSettingsCenter.mountSection({
  id:'mf488-composition-focal',title:'Visual Composition & Subject Salience',
  category:'appearance',subgroup:'Theme Intelligence',
  keywords:['composition','focal','subject','salience','artwork','visual','region','override','background','foreground'],
  nodes:[wrapper]
 });
 mf488ShowStatus();
}
Object.assign(App,{mf488SetFocus});
MediaFlowRuntime.registerPageEnhancer('settings',mf488Mount);
window.MediaFlowV488=Object.freeze({
 version:488,analyze:mf488AnalyzeComposition,
 selection:mf488FocusFor,status:mf488Status,regions:MF488_LABELS.slice()
});
MediaFlowRuntime.version=MF488_VERSION;
