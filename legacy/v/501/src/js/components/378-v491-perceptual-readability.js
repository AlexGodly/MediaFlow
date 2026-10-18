/* MediaFlow v491 — Perceptual Color Science & Readability.
 * Opt-in Advanced / Custom application-time safeguard.
 * Applied AFTER Custom variations and all earlier palette composition.
 * Preserves original hues and media source: tonal correction only.
 * Legacy path and original static Theme Collections remain untouched.
 */
const MF491_VERSION=491;
const MF491_STATS={applied:0,corrected:0,contrastChecks:0,failed:0,
 last:null,lastAt:0};
const MF491_TEXT_TARGET={text:7,textDim:4.5,textMute:4.5};
const MF491_ACCENT_TARGET=4.5;
function mf491Contrast(a,b){
 return mf489Contrast(a,b);
}
function mf491ValidHex(h){return /^#[0-9A-F]{6}$/i.test(String(h||''));}
function mf491ChooseOnAccent(background){
 const white=mf491Contrast('#FFFFFF',background);
 const black=mf491Contrast('#111827',background);
 if(white>=4.5||white>=black)return '#FFFFFF';
 if(black>=4.5)return '#111827';
 return mf491Contrast('#000000',background)>white?'#000000':'#FFFFFF';
}
function mf491ContrastAcross(color,surfaces){
 return Math.min(...surfaces.map(s=>mf491Contrast(color,s)));
}
function mf491FitTone(color,surfaces,minimum=4.5){
 if(!mf491ValidHex(color)||!surfaces?.length)return color;
 const hex=color.toUpperCase();
 if(mf491ContrastAcross(hex,surfaces)>=minimum)return hex;
 const lch=mf489Lch(hex);
 // Search BOTH luminance directions, preserving source hue/chroma. This
 // handles unusually dark panels inside a light profile and vice versa.
 let best=null;
 for(const target of [.025,.975]){
  let passing=null;
  const start=lch.L,end=target;
  for(let i=1;i<=45;i++){
   const L=start+(end-start)*i/45;
   const candidate=mf489Gamut({L,C:lch.C,h:lch.h});
   if(mf491ContrastAcross(candidate,surfaces)>=minimum){
    passing={hex:candidate,delta:Math.abs(L-start)};
    break;
   }
  }
  if(passing&&(!best||passing.delta<best.delta))best=passing;
 }
 if(best)return best.hex;
 const black=mf491ContrastAcross('#080B13',surfaces);
 const white=mf491ContrastAcross('#FFFFFF',surfaces);
 const neutral=black>=white?'#080B13':'#FFFFFF';
 // A mixed-surface design may make the target mathematically impossible.
 // Choose the strongest available safe neutral instead of claiming a pass.
 return neutral;
}
function mf491BorderTone(color,surfaces,minimum=1.55){
 const original=mf491ValidHex(color)?color.toUpperCase():'#68748B';
 if(mf491ContrastAcross(original,surfaces)>=minimum)return original;
 return mf491FitTone(original,surfaces,minimum);
}
function mf491ProtectPalette(input){
 if(!input||!['dark','light'].includes(input.mode))return input;
 const fields=['bg','panel','raised','border','borderSoft','text','textDim',
  'textMute','flow','flowDim'];
 if(fields.some(x=>!mf491ValidHex(input[x])))return input;
 const p={...input},surfaces=[p.bg,p.panel,p.raised];
 const before={...p},contrast=(c,s)=>mf491ContrastAcross(c,s);
 // Readable text against ALL three structural surfaces, not only the
 // primary background. Normal text minimum 7:1 and dim/muted 4.5:1.
 p.text=mf491FitTone(p.text,surfaces,MF491_TEXT_TARGET.text);
 p.textDim=mf491FitTone(p.textDim,surfaces,MF491_TEXT_TARGET.textDim);
 p.textMute=mf491FitTone(p.textMute,surfaces,MF491_TEXT_TARGET.textMute);
 // Existing product accents, links, badges and progress text can occur
 // on the background, panels or elevated cards. Enforce 4.5:1 for
 // palette-based foreground accents while retaining chosen hue identities.
 const sourceAccents=[p.primary||p.flow,p.secondary||p.flowDim,
  p.tertiary||p.flowDim].map(x=>mf491ValidHex(x)?x:p.flow);
 const accents=sourceAccents.map(x=>mf491FitTone(x,surfaces,MF491_ACCENT_TARGET));
 [p.primary,p.secondary,p.tertiary]=accents;
 p.flow=accents[0];
 p.flowDim=mf491FitTone(p.flowDim,surfaces,3);
 p.border=mf491BorderTone(p.border,[p.panel,p.bg],1.55);
 p.borderSoft=mf491BorderTone(p.borderSoft,[p.panel,p.raised],1.3);
 p.selectionText=mf491ChooseOnAccent(p.flow);
 p.onAccent=p.selectionText;
 const measured={
  text:contrast(p.text,surfaces),
  secondaryText:contrast(p.textDim,surfaces),
  mutedText:contrast(p.textMute,surfaces),
  accents:accents.map(c=>contrast(c,surfaces)),
  actionText:mf491Contrast(p.onAccent,p.flow),
  border:contrast(p.border,[p.panel,p.bg]),
  softBorder:contrast(p.borderSoft,[p.panel,p.raised])
 };
 const violations=[];
 if(measured.text<6.95)violations.push('body text');
 if(measured.secondaryText<4.45)violations.push('secondary text');
 if(measured.mutedText<4.45)violations.push('muted text');
 if(measured.accents.some(x=>x<4.45))violations.push('accent');
 if(measured.actionText<4.45)violations.push('button label');
 if(measured.border<1.5)violations.push('border');
 const corrected=fields.concat(['primary','secondary','tertiary','onAccent','selectionText'])
  .filter(k=>before[k]!==p[k]);
 MF491_STATS.contrastChecks++;
 if(corrected.length)MF491_STATS.corrected++;
 const report={version:491,mode:p.mode,source:'application-time perceptual check',
  corrected,violations,pass:violations.length===0,
  ratios:{
   text:mf491Round(measured.text),
   secondaryText:mf491Round(measured.secondaryText),
   mutedText:mf491Round(measured.mutedText),
   primary:mf491Round(measured.accents[0]),
   secondary:mf491Round(measured.accents[1]),
   tertiary:mf491Round(measured.accents[2]),
   buttonLabel:mf491Round(measured.actionText),
   border:mf491Round(measured.border)
  }
 };
 p.readability=report;
 MF491_STATS.last=report;
 return p;
}
function mf491Round(value){return Math.round(value*100)/100;}
// This is intentionally a final write guard rather than a replacement for
// v489's harmony/composition pipeline: Custom variation transforms may
// recolor surfaces AFTER the initial palette was built.
const mf491BaseApply=v146ApplyFullPalette;
v146ApplyFullPalette=function(palette,source){
 const mode=mf484Prefs().mode;
 if(mode==='legacy')return mf491BaseApply.apply(this,arguments);
 if(!palette||!['advanced','custom'].includes(mode))
  return mf491BaseApply.apply(this,arguments);
 try{
  const safe=mf491ProtectPalette(palette);
  const result=mf491BaseApply.call(this,safe,source);
  if(S.v146DynamicThemeState?.palette===safe){
   MF491_STATS.applied++;
   MF491_STATS.lastAt=Date.now();
   // Only set CSS after an ACTUAL accepted palette write, not a blocked
   // stale request (v485 owner guards remain authoritative).
   const root=document.documentElement;
   root.style.setProperty('--mf491-on-accent',safe.onAccent||'#FFFFFF');
   root.style.setProperty('--mf491-focus-outline',safe.flow);
   root.dataset.mf491Readability='on';
   mf491Render();
  }
  return result;
 }catch(error){
  MF491_STATS.failed++;
  console.warn('[MediaFlow v491] Readability guard failed; applying existing validated theme path',error);
  return mf491BaseApply.apply(this,arguments);
 }
};
// Make sure opt-in CSS does not leak into Legacy after a mode switch.
const mf491OriginalSetMode=App.mf484SetMode;
App.mf484SetMode=function(mode){
 if(mode==='legacy'){
  const root=document.documentElement;
  root.removeAttribute('data-mf491-readability');
  root.style.removeProperty('--mf491-on-accent');
  root.style.removeProperty('--mf491-focus-outline');
 }
 const result=mf491OriginalSetMode.apply(this,arguments);
 if(mode!=='legacy'&&!S.settings?.dynamicCoverTheme&&mode!=='custom'){
  document.documentElement.removeAttribute('data-mf491-readability');
 }
 return result;
};
const mf491FallbackBase=v146RestoreSelectedThemeFallback;
v146RestoreSelectedThemeFallback=function(){
 const result=mf491FallbackBase.apply(this,arguments);
 if(!S.v146DynamicThemeState?.palette){
  const root=document.documentElement;
  root.removeAttribute('data-mf491-readability');
  root.style.removeProperty('--mf491-on-accent');
  root.style.removeProperty('--mf491-focus-outline');
 }
 return result;
};
function mf491Status(){
 const mode=mf484Prefs().mode;
 const report=MF491_STATS.last;
 return {version:491,mode,applied:MF491_STATS.applied,
  corrected:MF491_STATS.corrected,checks:MF491_STATS.contrastChecks,
  errors:MF491_STATS.failed,
  active:mode!=='legacy'&&document.documentElement.dataset.mf491Readability==='on',
  pass:report?.pass??null,ratios:report?.ratios||null,
  violations:report?.violations||[],adjustments:report?.corrected||[],
  checkedAt:MF491_STATS.lastAt};
}
function mf491Render(){
 const host=document.getElementById('mf491-readability-status');
 if(!host)return;
 const s=mf491Status(),ratios=s.active?s.ratios:null;
 if(!ratios){
  host.innerHTML='<p>No Advanced/Custom palette is active. Legacy uses the original MediaFlow theme appearance.</p>';
  return;
 }
 const entries=[['Main text',ratios.text,7],
  ['Secondary text',ratios.secondaryText,4.5],
  ['Muted text',ratios.mutedText,4.5],
  ['Primary accent',ratios.primary,4.5],
  ['Secondary accent',ratios.secondary,4.5],
  ['Tertiary accent',ratios.tertiary,4.5],
  ['Button label',ratios.buttonLabel,4.5],
  ['Structural border',ratios.border,1.55]];
 host.innerHTML='<div class="mf491-status-title"><strong>'+(
  s.pass?'Readability targets met':'Readability needs attention')+
  '</strong><small>'+s.adjustments.length+' adjusted color roles · '+
  s.checks+' palette checks</small></div>'+
  '<div class="mf491-audit-rows">'+entries.map(([label,value,target])=>
   '<div class="mf491-audit-row"><span>'+escapeHtml(label)+'</span>'+
   '<strong>'+value+':1</strong><small>'+target+':1 target</small>'+
   '<i class="'+(value+0.02>=target?'mf491-pass':'mf491-warning')+
   '" aria-label="'+(value+0.02>=target?'Meets target':'Below target')+'"></i></div>'
  ).join('')+'</div>'+
  '<small>Ratios use the worst of background, panel and raised surfaces. Border ratios are design cues, not a universal WCAG requirement.</small>'+
  (s.violations.length?'<small class="mf491-warning-text">Still below target: '+
   escapeHtml(s.violations.join(', '))+'. Adjust surfaces or colors in Custom Studio.</small>':'');
}
function mf491Mount(){
 if(String(S.view)!=='settings'||!window.MediaFlowSettingsCenter?.mountSection)return;
 if(document.querySelector('.mf491-readability-panel'))return;
 const node=document.createElement('div');
 node.innerHTML='<div class="mf491-readability-panel"><div><strong>Perceptual Readability & Contrast</strong>'+
  '<p>Advanced and Custom themes automatically adjust text and accent tones for stronger contrast on backgrounds, cards and elevated surfaces. Original cover hues remain recognizable.</p></div>'+
  '<div id="mf491-readability-status" aria-live="polite"></div>'+
  '<small>Audits cover generated theme variables, not every third-party artwork image, hardcoded UI component or complex overlay. Full application accessibility review is scheduled in later roadmap milestones.</small></div>';
 window.MediaFlowSettingsCenter.mountSection({
  id:'mf491-readable-theme',title:'Perceptual Color Science & Readability',
  category:'appearance',subgroup:'Theme Intelligence',
  keywords:['readability','contrast','wcag','palette','color','text','surface','button','accessible','light','dark'],
  nodes:[node]
 });mf491Render();
}
MediaFlowRuntime.registerPageEnhancer('settings',mf491Mount);
window.MediaFlowV491=Object.freeze({version:491,
 audit:mf491ProtectPalette,fit:mf491FitTone,
 contrast:mf491Contrast,status:mf491Status});
MediaFlowRuntime.version=MF491_VERSION;
