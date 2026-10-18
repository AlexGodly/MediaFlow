/* MediaFlow v492 — Smart Palette Composition & Expressiveness.
 * User-controlled visual identity, source color fidelity and subtle-to-vivid
 * scene composition. v491's final-write contrast guard remains authoritative.
 * Existing default Legacy theme and original Custom profile data untouched.
 */
const MF492_VERSION=492;
const MF492_KEYS=Object.freeze(['saturation','accent','depth','tint']);
const MF492_PRESETS=Object.freeze({
 subtle:Object.freeze({saturation:36,accent:36,depth:30,tint:28}),
 balanced:Object.freeze({saturation:56,accent:57,depth:54,tint:52}),
 vivid:Object.freeze({saturation:81,accent:82,depth:78,tint:75})
});
const MF492_STATS={compositions:0,modified:0,errors:0,last:null,lastPalette:null};
DEFAULT_SETTINGS.v492Palette=null;
function mf492Clamp(n,min=0,max=100){
 const x=Number(n);
 return Number.isFinite(x)?Math.min(max,Math.max(min,x)):min;
}
function mf492Preset(){
 const p=mf484Prefs().expressiveness;
 return Object.hasOwn(MF492_PRESETS,p)?p:'balanced';
}
function mf492Config(){
 const raw=S.settings?.v492Palette;
 const preset=mf492Preset();
 const defaults=MF492_PRESETS[preset];
 if(!raw||typeof raw!=='object'||Array.isArray(raw))
  return {preset,customized:false,values:{...defaults}};
 const values={};
 for(const key of MF492_KEYS){
  const value=raw.values?.[key];
  values[key]=typeof value==='number'&&Number.isFinite(value)?
   Math.round(mf492Clamp(value)):defaults[key];
 }
 return {preset,customized:raw.customized===true,values};
}
function mf492Tonal(hex,L,chromaFactor=1){
 if(!mf489HexValid(hex))return hex;
 const source=mf489Lch(hex);
 return mf489Gamut({L:mf489Clamp(L,.035,.975),
  C:mf489Clamp(source.C*chromaFactor,0,.34),h:source.h});
}
function mf492Chroma(hex,factor){
 if(!mf489HexValid(hex))return hex;
 const p=mf489Lch(hex);
 // Preserve hue identity, including grayscale. Do not invent saturation
 // when actual sampled artwork is monochromatic.
 return mf489Gamut({L:p.L,C:mf489Clamp(p.C*factor,0,.33),h:p.h});
}
function mf492ComposePalette(input,settings=mf492Config()){
 if(!input||!['dark','light'].includes(input.mode))return input;
 const valid=['bg','panel','raised','primary','secondary','tertiary',
  'flow','flowDim','border','borderSoft'].every(k=>mf489HexValid(input[k]));
 if(!valid)return input;
 const v=settings.values,light=input.mode==='light';
 const out={...input};
 // Color identity always comes from the existing artwork/manual palette.
 // The chosen expressiveness only changes perceptual chroma and tones.
 const sat=.64+v.saturation/100*.73;
 const focus=.76+v.accent/100*.50;
 for(const key of ['primary','secondary','tertiary']){
  out[key]=mf492Chroma(out[key],sat*focus);
 }
 out.flow=out.primary;
 out.flowDim=mf492Chroma(input.flowDim,.70+v.accent/100*.50);
 const base=mf489Lch(input.bg);
 const panel=mf489Lch(input.panel);
 const raised=mf489Lch(input.raised);
 const tintFactor=.58+v.tint/100*.95;
 const bgFactor=.8+v.tint/100*.28;
 const depth=v.depth/100;
 // Dynamic depth gives cards genuine separation without turning a dark
 // cover into a light UI or vice versa. Adapt perceptually to appearance.
 const bgL=mf489Clamp(base.L,light?.80:.055,light?.975:.36);
 const panelGap=.014+.068*depth;
 const raisedGap=.042+.135*depth;
 const panelL=light?mf489Clamp(bgL+panelGap,.83,.985):
  mf489Clamp(bgL+panelGap,.06,.56);
 const raisedL=light?mf489Clamp(panelL-raisedGap,.57,.94):
  mf489Clamp(panelL+raisedGap,.12,.76);
 out.bg=mf492Tonal(input.bg,bgL,bgFactor);
 out.panel=mf492Tonal(input.panel,panelL,tintFactor);
 out.raised=mf492Tonal(input.raised,raisedL,tintFactor);
 // Borders may inherit accent hue, but remain subtle design cues rather
 // than introducing unrelated rainbow colors.
 out.border=mf492Chroma(input.border,.65+v.tint/100*.50);
 out.borderSoft=mf492Chroma(input.borderSoft,.55+v.tint/100*.47);
 const summary={
  version:492,preset:settings.preset,customized:settings.customized,
  values:{...v},sourceColors:Array.isArray(input.harmony?.sourceColors)?
   input.harmony.sourceColors.slice():[],
  baseSurface:input.bg,outputSurface:out.bg,
  accent:out.primary,surfaceGap:
   Math.round(Math.abs(mf489Lch(out.raised).L-mf489Lch(out.panel).L)*1000)/1000
 };
 out.expressivenessV492=summary;
 // Non-destructive: v491 contrast audit runs at the final application point.
 return out;
}
const mf492BaseCompose=mf484Compose;
mf484Compose=function(data,appearance,expressiveness){
 const palette=mf492BaseCompose.apply(this,arguments);
 if(mf484Prefs().mode==='legacy')return palette;
 try{
  const tuned=mf492ComposePalette(palette);
  if(tuned!==palette){
   MF492_STATS.compositions++;
   MF492_STATS.last=tuned.expressivenessV492;
   MF492_STATS.lastPalette=tuned;
   mf492Render();
  }
  return tuned;
 }catch(e){
  MF492_STATS.errors++;
  console.warn('[MediaFlow v492] Composition fallback to original palette',e);
  return palette;
 }
};
function mf492Reapply(){
 const mode=mf484Prefs().mode;
 if(mode==='legacy'){mf492Render();return;}
 // Cover refresh reuses the v487 cached pixels; Custom recovers its own
 // selected image/profile. No extra lookup or repeated timers on Legacy.
 if(mode==='custom'){
  ++MF484_CUSTOM_SEQ;
  MF485.appliedKey='';
  MF485.pending=null;MF485.pendingKey='';
  mf484ApplyCustom();
 }else if(S.settings?.dynamicCoverTheme){
  ++V146_DYNAMIC_SEQ;
  v146ScheduleDynamicTheme();
 }
 mf492Render();
}
function mf492Save(key,value){
 if(!MF492_KEYS.includes(key)||mf484Prefs().mode==='legacy')return false;
 const n=Number(value);
 if(!Number.isFinite(n)||n<0||n>100)return false;
 const current=mf492Config();
 const values={...current.values,[key]:Math.round(n)};
 S.settings=S.settings||{};
 S.settings.v492Palette={customized:true,values};
 persistSettings();
 mf492Reapply();
 return true;
}
function mf492SetPreset(preset){
 if(!Object.hasOwn(MF492_PRESETS,preset))return false;
 if(mf484Prefs().mode==='legacy')return false;
 const p=mf484Prefs();
 p.expressiveness=preset;
 // Reset per-control adjustments only when deliberately selecting a preset.
 S.settings=S.settings||{};
 S.settings.v492Palette=null;
 mf484Store(p); // persists with existing Supabase settings & backup flow
 mf492Reapply();
 mf492RefreshControls();
 return true;
}
function mf492Reset(){
 if(mf484Prefs().mode==='legacy')return;
 S.settings=S.settings||{};
 S.settings.v492Palette=null;
 persistSettings();
 mf492Reapply();
 mf492RefreshControls();
 showToast('Palette tuning reset to the selected expressiveness preset');
}
// Preserve the original v484 settings dropdown as an equal entry point.
// Changing Subtle / Balanced / Vivid there resets the fine-tuning override.
const mf492OriginalOption=App.mf484SetOption;
App.mf484SetOption=function(key,value){
 if(key==='expressiveness'&&Object.hasOwn(MF492_PRESETS,value)&&
    mf484Prefs().expressiveness!==value){
  S.settings=S.settings||{};
  S.settings.v492Palette=null;
 }
 const result=mf492OriginalOption.apply(this,arguments);
 if(key==='expressiveness')mf492RefreshControls();
 return result;
};
function mf492Status(){
 const cfg=mf492Config();
 return {version:492,mode:mf484Prefs().mode,preset:cfg.preset,
  customized:cfg.customized,values:{...cfg.values},
  compositions:MF492_STATS.compositions,errors:MF492_STATS.errors,
  last:MF492_STATS.last};
}
function mf492RefreshControls(){
 const status=mf492Status();
 const root=document.getElementById('mf492-expressiveness-panel');
 if(!root)return;
 root.dataset.mf492Mode=status.mode;
 const preset=root.querySelector('[data-mf492-preset]');
 if(preset)preset.value=status.preset;
 for(const key of MF492_KEYS){
  const control=root.querySelector('[data-mf492-key="'+key+'"]');
  const output=root.querySelector('[data-mf492-value="'+key+'"]');
  if(control)control.value=String(status.values[key]);
  if(output)output.textContent=status.values[key]+'%';
 }
 const note=root.querySelector('[data-mf492-note]');
 if(note)note.textContent=status.mode==='legacy'?
  'Legacy stays exactly as before. Switch to Advanced or Custom to tune colors.':
  (status.customized?'Customized '+status.preset+' preset':'Using '+status.preset+' recommended values');
 const reset=root.querySelector('[data-mf492-reset]');
 if(reset)reset.disabled=status.mode==='legacy'||!status.customized;
 root.querySelectorAll('input,select').forEach(el=>el.disabled=status.mode==='legacy');
}
function mf492Render(){
 mf492RefreshControls();
 const preview=document.getElementById('mf492-visual-preview');
 if(!preview)return;
 const p=MF492_STATS.lastPalette||S.v146DynamicThemeState?.palette;
 if(mf484Prefs().mode==='legacy'||!p?.expressivenessV492){
  preview.textContent='Apply an Advanced or Custom theme to inspect its composed palette.';
  return;
 }
 const info=p.expressivenessV492;
 preview.innerHTML='<div class="mf492-swatches">'+
  [p.bg,p.panel,p.raised,p.primary,p.secondary,p.tertiary].map((c,i)=>
   '<span title="'+escapeHtml(['Background','Panel','Raised','Primary','Secondary','Tertiary'][i])+
   '" style="background:'+escapeHtml(c)+'"></span>').join('')+
  '</div><small>'+escapeHtml(info.preset)+(info.customized?' · customized':'')+
  ' · Final readability is checked before application.</small>';
}
function mf492Mount(){
 if(String(S.view)!=='settings'||!window.MediaFlowSettingsCenter?.mountSection)return;
 if(document.querySelector('.mf492-panel'))return;
 const node=document.createElement('div');
 const rows=[
  ['saturation','Palette saturation','How intensely source colors appear'],
  ['accent','Accent influence','How much primary and secondary accents stand out'],
  ['depth','Surface depth','Separation between background, panels and raised cards'],
  ['tint','Atmospheric tint','How much source color enters surfaces and borders']
 ];
 node.innerHTML='<div class="mf492-panel" id="mf492-expressiveness-panel">'+
  '<p class="mf492-intro">Shape the artwork’s visual identity without losing its original colors. The readability engine still protects text and controls.</p>'+
  '<label class="field"><span class="field-label">Expressiveness preset</span>'+
  '<select data-mf492-preset onchange="App.mf492SetPreset(this.value)">'+
  ['subtle','balanced','vivid'].map(x=>'<option value="'+x+'">'+
   x[0].toUpperCase()+x.slice(1)+'</option>').join('')+'</select></label>'+
  rows.map(([key,label,desc])=>'<label class="mf492-slider-row"><span>'+
   '<b>'+label+'</b><small>'+desc+'</small></span><div>'+
   '<input type="range" min="0" max="100" step="1" data-mf492-key="'+key+
   '" oninput="this.nextElementSibling.textContent=this.value+\'%\'"'+
   ' onchange="App.mf492Save(\''+key+'\',this.value)">'+
   '<output data-mf492-value="'+key+'">—</output></div></label>').join('')+
  '<div class="mf492-actions"><span data-mf492-note></span>'+
  '<button type="button" class="btn btn-ghost" data-mf492-reset onclick="App.mf492Reset()">Reset to preset</button></div>'+
  '<div id="mf492-visual-preview" class="mf492-preview" aria-live="polite"></div>'+
  '<small>Visual tuning applies to Advanced and Custom, not Legacy. Your settings are saved through the existing MediaFlow account and backup system; no media data is changed.</small></div>';
 window.MediaFlowSettingsCenter.mountSection({
  id:'mf492-smart-palette',title:'Smart Palette & Expressiveness',
  category:'appearance',subgroup:'Theme Intelligence',
  keywords:['saturation','vivid','balanced','subtle','palette','depth','accent','surface','tint','colors'],
  nodes:[node]
 });
 mf492Render();
}
Object.assign(App,{mf492Save,mf492SetPreset,mf492Reset});
MediaFlowRuntime.registerPageEnhancer('settings',mf492Mount);
window.MediaFlowV492=Object.freeze({version:492,compose:mf492ComposePalette,
 settings:mf492Config,status:mf492Status});
MediaFlowRuntime.version=MF492_VERSION;
