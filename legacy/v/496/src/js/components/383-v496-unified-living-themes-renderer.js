/* MediaFlow v496 — Unified Living Themes Renderer.
 * One synchronous, opt-in composition path for Advanced and Custom.
 * It reads the protected palette and pixel-derived direction already provided
 * by v484–v495; it never samples images, writes a palette, or changes settings.
 * Legacy and its original renderer are untouched.
 */
const MF496_VERSION=496;
const MF496_LAYERS=['gradients','lighting','depth','materials','textures','organic','particles'];
const MF496_STATS={renders:0,reused:0,clears:0,blocked:0,last:null,lastKey:''};
function mf496Clamp(value,low=0,high=1){
 const n=Number(value);return Number.isFinite(n)?Math.max(low,Math.min(high,n)):low;
}
function mf496Hex(color,fallback='#8B5CF6'){
 return /^#[0-9A-F]{6}$/i.test(String(color||''))?String(color).toUpperCase():fallback;
}
function mf496Signals(palette){
 const colors=[palette?.primary||palette?.flow,palette?.secondary||palette?.flowDim,
  palette?.tertiary||palette?.primary].map(c=>mf496Hex(c));
 const hsl=colors.map(c=>{
  const rgb=mf484Rgb(c),result=v145RgbToHsl(rgb.r,rgb.g,rgb.b);
  return {s:mf496Clamp(result.s/100),l:mf496Clamp(result.l/100)};
 });
 const saturation=hsl.reduce((v,c)=>v+c.s,0)/3;
 const contrast=Math.max(...hsl.map(c=>c.l))-Math.min(...hsl.map(c=>c.l));
 const lightness=hsl.reduce((v,c)=>v+c.l,0)/3;
 // A true pixel-verified mood may refine the visual treatment. Never
 // reuse a previous cover's MF490_STATE.last for another artwork.
 const profile=mf484Prefs().mode==='custom'?mf484ActiveProfile():null;
 const manual=!!profile&&profile.source==='manual';
 const mood=!manual&&palette?.atmosphereHints?.source==='pixel-derived guidance only'?
  palette.atmosphereHints:null;
 return {colors,saturation,contrast,lightness,mood,manual};
}
function mf496Allowed(prefs,signals){
 const living=prefs.living;
 if(living.mode==='off')return [];
 const allowed=MF496_LAYERS.filter(k=>living.effects[k]);
 const basic=living.mode==='basic';
 const optimized=living.performance==='optimized'||
  (living.performance==='auto'&&
   (navigator.connection?.saveData||
    window.matchMedia?.('(max-width: 520px)')?.matches));
 const mood=signals.mood;
 const preferred=k=>{
  if(k==='gradients'||k==='lighting')return true;
  if(basic)return false;
  if(living.source==='custom')return true;
  if(k==='materials')return signals.saturation>.26;
  if(k==='textures')return signals.saturation<.60;
  if(k==='depth')return signals.contrast>.12||signals.lightness<.45;
  if(k==='organic')return mood?.fogSuitability>.24||
    (!mood&&signals.saturation>.22&&signals.saturation<.76);
  if(k==='particles')return mood?.particleSuitability>.35||
    (!mood&&signals.saturation>.45&&signals.contrast>.14);
  return false;
 };
 const cap=optimized?3:living.mode==='basic'?2:6;
 return allowed.filter(preferred).filter(k=>!(optimized&&
  ['particles','organic','depth'].includes(k))).slice(0,cap);
}
function mf496Plan(palette,prefs=mf484Prefs()){
 if(!['advanced','custom'].includes(prefs.mode))return null;
 if(!palette)return null;
 const s=mf496Signals(palette),live=prefs.living;
 const intensity={subtle:.38,balanced:.65,vivid:.93}[live.intensity]||.65;
 const mood=s.mood,signal=mf496Clamp(mood?.intensity??s.saturation);
 const power=mf496Clamp(intensity*(.78+signal*.42),.16,.98);
 const glow=mf496Clamp((mood?.glowSuitability??s.saturation)*power,.06,.9);
 const density=mf496Clamp((mood?.fogSuitability??(1-s.contrast))*.65,.10,.75);
 const soft=mood?.lighting==='soft-diffuse',directional=mood?.lighting==='cinematic-directional';
 const axis=soft?140:directional?52:105;
 const source=s.manual?'Custom manual colors':mood?'Pixel-verified artwork mood':'Protected palette colors';
 return {mode:prefs.mode,colors:s.colors,source,
  mood:mood?.gradient||'source-palette',
  layers:mf496Allowed(prefs,s),power,glow,density,axis,
  motion:mf484AllowMotion(live),transitions:live.mode!=='off'&&!!live.effects.transitions,
  optimized:live.performance==='optimized'||!!navigator.connection?.saveData,
  performance:live.performance};
}
function mf496Identity(plan,prefs){
 const profile=prefs.mode==='custom'?mf484ActiveProfile(prefs):null;
 const current=prefs.mode==='custom'?
  (profile?.source==='manual'?'':profile?.imageUrl||''):
  (S.v146DynamicThemeState?.url||'');
 // Fingerprint raw URLs: never retain or expose them in status or settings.
 const fingerprint=current?mf495Fingerprint(current,prefs.mode):'static';
 return JSON.stringify([prefs.mode,MF485.revision,
  profile?.id||'',profile?.source||'',fingerprint,prefs.living,plan]);
}
function mf496Clear(){
 const root=document.documentElement;
 root.removeAttribute('data-mf496-renderer');
 root.removeAttribute('data-mf496-motion');
 root.removeAttribute('data-mf496-composition');
 for(const k of ['--mf496-power','--mf496-glow','--mf496-density',
  '--mf496-axis','--mf496-primary','--mf496-secondary','--mf496-tertiary',
  '--mf496-gradient-opacity','--mf496-light-opacity','--mf496-depth-opacity',
  '--mf496-material-opacity','--mf496-texture-opacity','--mf496-organic-opacity',
  '--mf496-particles-opacity'])
  root.style.removeProperty(k);
 MF496_STATS.lastKey='';
 MF496_STATS.last=null;
 MF496_STATS.clears++;
 mf496Update();
}
function mf496Render(palette){
 const prefs=mf484Prefs(),root=document.documentElement;
 if(!['advanced','custom'].includes(prefs.mode)){
  // Do not alter v484's Legacy DOM, custom properties or original layers.
  if(root.hasAttribute('data-mf496-renderer'))mf496Clear();
  return;
 }
 const host=document.getElementById('mf484-atmosphere');
 if(!host){MF496_STATS.blocked++;return;}
 const plan=mf496Plan(palette,prefs);
 if(!plan){MF496_STATS.blocked++;return;}
 const key=mf496Identity(plan,prefs);
 if(key===MF496_STATS.lastKey&&host.dataset.mf496Key==='active'&&
  root.dataset.mf496Renderer==='on'){
  MF496_STATS.reused++;
  root.dataset.mf496Motion=plan.motion?'on':'off';
  mf496Update();return;
 }
 // Only replace atmospheric children. All palette application, source
 // priority and cover rotation remain under their previous owners.
 if(prefs.living.mode==='off'){
  host.replaceChildren();mf496Clear();return;
 }
 const nodes=plan.layers.map(name=>{
  const layer=document.createElement('i');
  layer.className='mf496-layer mf496-'+name;
  layer.setAttribute('aria-hidden','true');
  return layer;
 });
 host.replaceChildren(...nodes);
 host.dataset.mf496Key='active';
 root.dataset.mf496Renderer='on';
 root.dataset.mf496Motion=plan.motion?'on':'off';
 root.dataset.mf496Composition=plan.optimized?'optimized':'full';
 root.style.setProperty('--mf496-primary',plan.colors[0]);
 root.style.setProperty('--mf496-secondary',plan.colors[1]);
 root.style.setProperty('--mf496-tertiary',plan.colors[2]);
 root.style.setProperty('--mf496-power',plan.power.toFixed(3));
 root.style.setProperty('--mf496-glow',plan.glow.toFixed(3));
 root.style.setProperty('--mf496-density',plan.density.toFixed(3));
 root.style.setProperty('--mf496-axis',plan.axis+'deg');
 const opacities={gradient:.25+plan.power*.45,light:.2+plan.glow*.7,
  depth:.18+plan.power*.4,material:.1+plan.glow*.3,
  texture:.04+plan.density*.12,organic:.18+plan.density*.35,
  particles:.09+plan.glow*.35};
 Object.entries(opacities).forEach(([name,value])=>
  root.style.setProperty('--mf496-'+name+'-opacity',value.toFixed(3)));

 // Reuse the existing transition switch. No unapproved animation mode.
 root.dataset.mf484Transitions=plan.transitions?'on':'off';
 MF496_STATS.renders++;
 MF496_STATS.lastKey=key;
 MF496_STATS.last={version:496,mode:plan.mode,source:plan.source,
  mood:plan.mood,layers:plan.layers.slice(),motion:plan.motion,
  optimized:plan.optimized,renderCount:MF496_STATS.renders};
 mf496Update();
}
const mf496PreviousAtmosphere=mf484ApplyAtmosphere;
mf484ApplyAtmosphere=function(palette,imageUrl){
 const result=mf496PreviousAtmosphere.apply(this,arguments);
 if(mf484Prefs().mode==='legacy')return result;
 try{mf496Render(palette);}catch(error){
  MF496_STATS.blocked++;
  console.warn('[MediaFlow v496] Unified renderer kept the original atmosphere',error);
 }
 return result;
};
const mf496PreviousClear=mf484Clear;
mf484Clear=function(){
 const result=mf496PreviousClear.apply(this,arguments);
 mf496Clear();return result;
};
function mf496Status(){
 const prefs=mf484Prefs(),state=MF496_STATS.last;
 return {version:496,mode:prefs.mode,active:!!state&&
  document.documentElement.dataset.mf496Renderer==='on',
  source:state?.source||'Not composed',mood:state?.mood||'—',
  layers:state?.layers.slice()||[],motion:!!state?.motion,
  optimized:!!state?.optimized,renders:MF496_STATS.renders,
  reused:MF496_STATS.reused,blocked:MF496_STATS.blocked,
  clears:MF496_STATS.clears};
}
function mf496Update(){
 const node=document.getElementById('mf496-status');
 if(!node)return;
 const s=mf496Status(),legacy=s.mode==='legacy';
 node.innerHTML='<div class="mf496-status-line"><strong>'+
  (legacy?'Legacy renderer unchanged':s.active?'Unified renderer active':'Living Themes inactive')+
  '</strong><span>'+escapeHtml(s.mode)+'</span></div>'+
  '<p>'+escapeHtml(legacy?'Legacy keeps its original appearance and behavior.':
   s.active?s.source+' · '+s.mood:'Enable Basic or Advanced Living Themes to compose ambient layers.')+'</p>'+
  '<div class="mf496-layer-list">'+
  (s.layers.length?s.layers.map(x=>'<span>'+escapeHtml(x)+'</span>').join(''):
   '<small>No additional layers active</small>')+'</div>'+
  '<small>Compositions '+s.renders+' · Reused '+s.reused+
  ' · Guarded '+s.blocked+' · Motion '+(s.motion?'on':'off')+
  ' · '+(s.optimized?'Optimized':'Standard')+' rendering</small>';
}
function mf496Mount(){
 if(String(S.view)!=='settings'||!window.MediaFlowSettingsCenter?.mountSection)return;
 if(document.querySelector('.mf496-panel'))return;
 const node=document.createElement('div');
 node.innerHTML='<div class="mf496-panel"><strong>Unified Living Themes Renderer</strong>'+
  '<p>Advanced and Custom share a palette-aware, performance-conscious atmosphere. Existing Theme Studio, Living Themes mode, effect toggles and performance preferences remain in control. Legacy is unaffected.</p>'+
  '<div id="mf496-status" aria-live="polite"></div></div>';
 window.MediaFlowSettingsCenter.mountSection({id:'mf496-unified-living-themes',
  title:'Unified Living Themes Renderer',category:'appearance',
  subgroup:'Theme Intelligence',
  keywords:['living','ambient','renderer','gradients','lighting','depth','materials','performance','motion'],
  nodes:[node]});
 mf496Update();
}
MediaFlowRuntime.registerPageEnhancer('settings',mf496Mount);
window.MediaFlowV496=Object.freeze({version:496,plan:mf496Plan,status:mf496Status,
 signals:mf496Signals,allowed:mf496Allowed});
MediaFlowRuntime.version=MF496_VERSION;
