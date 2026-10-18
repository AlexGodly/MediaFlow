/* MediaFlow v489 — Perceptual Color Harmony Engine.
 * Advanced and Custom only. Source hues stay faithful to actual cover or
 * user-entered palette. Legacy and original static collections unchanged.
 */
const MF489_VERSION=489;
const MF489_STATS={composed:0,advanced:0,custom:0,fallback:0,last:null,errors:0};
const MF489_EPS=0.0001;
function mf489Clamp(x,a=0,b=1){return Math.max(a,Math.min(b,Number.isFinite(Number(x))?Number(x):a));}
function mf489HexValid(x){return /^#[0-9A-F]{6}$/i.test(String(x||''));}
function mf489Rgb(hex){
 const n=parseInt(hex.slice(1),16);
 return [(n>>16)&255,(n>>8)&255,n&255];
}
function mf489Hex(rgb){return mf487Hex(rgb[0],rgb[1],rgb[2]);}
function mf489Lch(hex){
 const lab=mf487OKLab(...mf489Rgb(hex));
 return {L:lab.L,C:Math.hypot(lab.a,lab.b),
  h:((Math.atan2(lab.b,lab.a)*180/Math.PI)%360+360)%360};
}
function mf489Lab(lch){
 const r=lch.h*Math.PI/180;
 return {L:lch.L,a:lch.C*Math.cos(r),b:lch.C*Math.sin(r)};
}
function mf489Srgb(lab){
 const l_=lab.L+.3963377774*lab.a+.2158037573*lab.b;
 const m_=lab.L-.1055613458*lab.a-.0638541728*lab.b;
 const s_=lab.L-.0894841775*lab.a-1.2914855480*lab.b;
 const l=l_**3,m=m_**3,s=s_**3;
 const lin=[
   +4.0767416621*l-3.3077115913*m+.2309699292*s,
   -1.2684380046*l+2.6097574011*m-.3413193965*s,
   -.0041960863*l-.7034186147*m+1.7076147010*s
 ];
 const gamma=v=>v<=.0031308?12.92*v:1.055*Math.pow(v,1/2.4)-.055;
 return lin.map(gamma);
}
function mf489Gamut(lch){
 const x={L:mf489Clamp(lch.L,.02,.98),C:mf489Clamp(lch.C,0,.34),h:lch.h};
 let out=mf489Srgb(mf489Lab(x));
 if(!out.every(v=>v>=-.00001&&v<=1.00001)){
  let lo=0,hi=x.C;
  for(let i=0;i<15;i++){
   const mid=(lo+hi)/2;
   const test=mf489Srgb(mf489Lab({...x,C:mid}));
   if(test.every(v=>v>=-.00001&&v<=1.00001)){lo=mid;out=test;}
   else hi=mid;
  }
  out=mf489Srgb(mf489Lab({...x,C:lo}));
 }
 return mf489Hex(out.map(v=>mf489Clamp(v)*255));
}
function mf489RelativeLuminance(hex){
 const rgb=mf489Rgb(hex);
 const lin=rgb.map(mf487Linear);
 return .2126*lin[0]+.7152*lin[1]+.0722*lin[2];
}
function mf489Contrast(a,b){
 const x=mf489RelativeLuminance(a),y=mf489RelativeLuminance(b);
 return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
function mf489Angle(a,b){
 const diff=Math.abs(a-b)%360;
 return Math.min(diff,360-diff);
}
function mf489Separation(a,b){
 return mf487Distance(mf487OKLab(...mf489Rgb(a)),mf487OKLab(...mf489Rgb(b)));
}
function mf489Tonal(hex,L,chromaMult=1){
 const o=mf489Lch(hex);
 return mf489Gamut({L:mf489Clamp(L,.02,.98),C:o.C*chromaMult,h:o.h});
}
function mf489Distinct(a,b,minimum=.078){
 return mf489Separation(a,b)>=minimum;
}
function mf489HueCategory(colors){
 const colorful=colors.map(mf489Lch).filter(x=>x.C>=.035);
 if(colorful.length<2)return 'Monochromatic';
 const gaps=[];
 for(let i=0;i<colorful.length;i++)for(let j=i+1;j<colorful.length;j++)
  gaps.push(mf489Angle(colorful[i].h,colorful[j].h));
 if(!gaps.length)return 'Monochromatic';
 const high=Math.max(...gaps),low=Math.min(...gaps);
 if(high<26)return 'Monochromatic';
 if(high<=74)return 'Analogous';
 if(high>=138&&low>=108&&colorful.length>=3)return 'Triadic / Wide';
 if(high>=135)return 'Complementary';
 if(high>=88&&low<65)return 'Split-complementary';
 return 'Multicolor';
}
function mf489UniqueColors(colors,preserveOrder=true){
 const out=[];
 for(const hex of colors){
  if(!mf489HexValid(hex))continue;
  const color=hex.toUpperCase();
  if(out.every(x=>mf489Distinct(x,color,.07)))out.push(color);
 }
 return out;
}
// Prefer real secondary artwork candidates before deriving purely tonal
// alternatives. Never generate unrelated neon complementary colors.
function mf489ArtworkCandidates(data){
 const direct=Array.isArray(data?.colors)?data.colors.filter(mf489HexValid):[];
 const distribution=Array.isArray(data?.analysis?.distribution)
  ?data.analysis.distribution.filter(x=>mf489HexValid(x?.color)&&x.percent>=2)
    .slice(0,7).map(x=>x.color):[];
 const bg=mf489HexValid(data?.colorRoles?.dominantBackground)?data.colorRoles.dominantBackground:null;
 return {direct,extras:distribution,background:bg};
}
function mf489RoleColors(data,custom=false){
 const {direct,extras,background}=mf489ArtworkCandidates(data);
 const initial=direct.map(c=>c.toUpperCase());
 if(!initial.length)return null;
 // Custom manual hues are authoritative, with only tonal adjustment if
 // repeated/near-identical values would make UI roles indistinguishable.
 const unique=mf489UniqueColors(initial.concat(custom?[]:extras));
 const selected=[initial[0]];
 for(const c of initial.slice(1))if(selected.length<3&&
  selected.every(x=>mf489Distinct(x,c,.075)))selected.push(c);
 for(const c of unique)if(selected.length<3&&
  selected.every(x=>mf489Distinct(x,c,.075)))selected.push(c);
 while(selected.length<3){
  const anchor=selected[0],index=selected.length;
  const lch=mf489Lch(anchor);
  const L=index===1?(lch.L>.57?lch.L-.23:lch.L+.23):
   (lch.L>.55?lch.L-.37:lch.L+.37);
  const result=mf489Tonal(anchor,L,index===1?.9:.73);
  if(selected.every(x=>mf489Distinct(x,result,.052)))selected.push(result);
  else selected.push(mf489Tonal(anchor,index===1?.33:.78,.52));
 }
 return {colors:selected.slice(0,3),background:background||initial[0],
  harmony:mf489HueCategory(selected),preservedCustomColors:custom,
  sourceCandidates:unique.length};
}
function mf489ContrastTone(hex,surface,minimum=4.5){
 let out=hex;
 if(mf489Contrast(out,surface)>=minimum)return out;
 const source=mf489Lch(hex),surfaceLight=mf489RelativeLuminance(surface)>.27;
 const goLight=!surfaceLight;
 let best=out;
 // Adjust L only in narrow perceptual increments, preserving color hue
 // and as much artwork saturation as possible.
 for(let i=0;i<=24;i++){
  const fraction=i/24;
  const L=source.L+(goLight?1-source.L:-source.L)*fraction;
  const trial=mf489Gamut({L:mf489Clamp(L,.05,.96),C:source.C,h:source.h});
  if(mf489Contrast(trial,surface)>=minimum){best=trial;break;}
  best=trial;
 }
 return best;
}
function mf489MakePalette(data,appearance='dark',expressiveness='balanced',custom=false){
 const roles=mf489RoleColors(data,custom);
 if(!roles)return null;
 const light=appearance==='light',raw=roles.colors;
 // Build full surfaces with calibrated color tint. The strongest hue belongs
 // in accents, not all UI surfaces; very dark/light media stay atmospheric.
 const bg=light?v145MixHex(roles.background,'#F4F6FB',.075):
  v145MixHex(roles.background,'#090B15',.145);
 const panel=light?v145MixHex(raw[1],'#FFFFFF',.035):
  v145MixHex(raw[1],'#151827',.065);
 const raised=light?v145MixHex(raw[2],'#E9EDF6',.075):
  v145MixHex(raw[2],'#25293A',.115);
 const intensity=expressiveness==='subtle'?.77:expressiveness==='vivid'?1.08:1;
 const accent=(hex,i)=>{
  const lch=mf489Lch(hex);
  const toned=mf489Gamut({L:light?(.51+(i===0?-.025:0)):(.72+(i===0?.01:-.035)),
   C:mf489Clamp(lch.C*intensity,0,.28),h:lch.h});
  return mf489ContrastTone(toned,panel,4.5);
 };
 const primary=accent(raw[0],0);
 const secondary=accent(raw[1],1);
 const tertiary=accent(raw[2],2);
 // Preserve perceptual hue identity across roles, but avoid indistinguishable
 // button/badge/progress accents by adjusting tone rather than inventing hues.
 const accents=[primary,secondary,tertiary];
 for(let i=1;i<3;i++){
  if(!mf489Distinct(accents[i],accents[0],.072)){
   const source=mf489Lch(accents[i]),candidate=mf489Gamut({
    L:light?mf489Clamp(source.L-(i===1?.14:.18),.22,.78):
     mf489Clamp(source.L+(i===1?.13:.19),.38,.94),
    C:source.C*.88,h:source.h
   });
   // Readability always wins over accent separation.
   if(mf489Contrast(candidate,panel)>=4.5)accents[i]=candidate;
  }
 }
 const neutralBorder=light?'#D1D6E2':'#42495A';
 const border=v145MixHex(accents[1],neutralBorder,light?.13:.19);
 const borderSoft=v145MixHex(accents[2],light?'#E2E6EE':'#2E3344',light?.08:.10);
 const text=light?'#171C28':'#F7F7FC';
 const textDim=light?'#394354':'#D0D6E3';
 const textMute=light?'#616C7E':'#A5B0C0';
 const selectionText=mf489Contrast('#FFFFFF',accents[0])>=4.5?'#FFFFFF':'#111827';
 const colorRoles={primary:accents[0],secondary:accents[1],tertiary:accents[2]};
 return {
  mode:light?'light':'dark',naturalMode:data.naturalMode||appearance,
  primary:accents[0],secondary:accents[1],tertiary:accents[2],
  bg,panel,raised,border,borderSoft,
  text,textDim,textMute,flow:accents[0],
  flowDim:v145MixHex(accents[0],light?'#D7DCE8':'#283246',.38),
  selectionText,
  harmony:{
   classification:roles.harmony,
   sourceColors:raw.slice(),background:roles.background,
   colorRoles,custom,
   accentContrast:accents.map(c=>Math.round(mf489Contrast(c,panel)*100)/100),
   textContrast:Math.round(mf489Contrast(text,bg)*100)/100,
   expressive:expressiveness,version:489
  }
 };
}
const mf489ComposeBase=mf484Compose;
mf484Compose=function(data,appearance,expressiveness='balanced'){
 if(mf484Prefs().mode==='legacy')return mf489ComposeBase.apply(this,arguments);
 try{
  const custom=mf484Prefs().mode==='custom';
  const result=mf489MakePalette(data,appearance,expressiveness,custom);
  if(!result)return mf489ComposeBase.apply(this,arguments);
  MF489_STATS.composed++;
  if(custom)MF489_STATS.custom++;else MF489_STATS.advanced++;
  MF489_STATS.last={...result.harmony,mode:result.mode};
  mf489Render();
  return result;
 }catch(e){
  MF489_STATS.errors++;MF489_STATS.fallback++;
  console.warn('[MediaFlow v489] Harmony composition fell back to previous palette',e);
  return mf489ComposeBase.apply(this,arguments);
 }
};
function mf489Snapshot(){
 const p=mf484Prefs(),h=MF489_STATS.last;
 return {version:489,mode:p.mode,composed:MF489_STATS.composed,
  advanced:MF489_STATS.advanced,custom:MF489_STATS.custom,
  errors:MF489_STATS.errors,fallback:MF489_STATS.fallback,
  classification:h?.classification||'Awaiting composition',
  roles:h?.colorRoles||null,
  sourceColors:h?.sourceColors||[],background:h?.background||null,
  accentContrast:h?.accentContrast||[],textContrast:h?.textContrast||null,
  expressive:h?.expressive||p.expressiveness};
}
function mf489Render(){
 const el=document.getElementById('mf489-harmony-status');
 if(!el)return;
 const s=mf489Snapshot();
 const colors=s.roles?[s.roles.primary,s.roles.secondary,s.roles.tertiary]:[];
 const badges=colors.map((c,i)=>'<div class="mf489-color-role"><i style="background:'+c+
  '" aria-hidden="true"></i><span>'+['Primary','Secondary','Tertiary'][i]+
  '<small>'+c+' · '+(s.accentContrast[i]||'—')+':1 on panel</small></span></div>').join('');
 el.innerHTML='<div class="mf489-harmony-top"><strong>'+escapeHtml(s.classification)+
  '</strong><small>'+s.composed+' compositions · '+s.fallback+' fallbacks</small></div>'+
  (colors.length?'<div class="mf489-role-grid">'+badges+'</div>':
   '<p>Choose Advanced with cover artwork, or apply a Custom theme, to generate a perceptual harmony report.</p>')+
  (s.textContrast?'<small>Text/background contrast: '+s.textContrast+':1 · '+
   'Expressiveness: '+escapeHtml(s.expressive)+'</small>':'')+
  '<small>Harmony uses colors from your artwork or Custom palette. No unrelated complementary hue is injected.</small>';
}
function mf489Mount(){
 if(String(S.view)!=='settings'||!window.MediaFlowSettingsCenter?.mountSection)return;
 if(document.querySelector('.mf489-harmony-panel'))return;
 const node=document.createElement('div');
 node.innerHTML='<div class="mf489-harmony-panel"><div><strong>Perceptual Color Harmony</strong>'+
  '<p>Coordinate the theme’s color roles and depth while protecting artwork identity, Custom hues, and readability.</p></div>'+
  '<div id="mf489-harmony-status" aria-live="polite"></div></div>';
 window.MediaFlowSettingsCenter.mountSection({
  id:'mf489-harmony',title:'Advanced Color Harmony',
  category:'appearance',subgroup:'Theme Intelligence',
  keywords:['harmony','colors','accent','analogous','complementary','contrast','roles','palette','perceptual'],
  nodes:[node]
 });
 mf489Render();
}
MediaFlowRuntime.registerPageEnhancer('settings',mf489Mount);
window.MediaFlowV489=Object.freeze({version:489,status:mf489Snapshot,
 compose:mf489MakePalette,roles:mf489RoleColors,contrast:mf489Contrast});
MediaFlowRuntime.version=MF489_VERSION;
