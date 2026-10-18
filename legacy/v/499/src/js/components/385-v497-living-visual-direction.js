/* MediaFlow v497 — Living Themes Visual Direction & Material Intelligence.
 * A surface-finishing extension to v496's palette-aware renderer.
 * Uses current protected palette, verified v490 hints (when available) and
 * existing user-selected effects. No new image reads, timers or settings.
 */
const MF497_VISUAL_VERSION=497;
const MF497_VISUAL={compositions:0,reused:0,cleared:0,last:null,key:''};
function mf497VisualPlan(palette,prefs=mf484Prefs()){
 if(!['advanced','custom'].includes(prefs.mode)||prefs.living.mode==='off'||!palette)return null;
 const base=mf496Plan(palette,prefs);
 if(!base)return null;
 const signals=mf496Signals(palette);
 const living=prefs.living,profile=prefs.mode==='custom'?mf484ActiveProfile(prefs):null;
 const mood=signals.mood;
 const light=!!living.effects.lighting;
 const surfaces=living.mode==='advanced'&&!!living.effects.materials;
 const depth=living.mode==='advanced'&&!!living.effects.depth;
 const muted=signals.saturation<.22;
 const style=signals.manual&&profile?.variation?
  profile.variation:mood?.gradient||'source-palette';
 let material='none';
 if(surfaces){
  material=muted?'matte':
   ['ethereal','luminous-airy','soft-dreamlike'].includes(style)?'glass':
   style==='futuristic'||style==='neon-energetic'?'prismatic':
   'satin';
 }
 let lighting='none';
 if(light){
  lighting=mood?.lighting==='cinematic-directional'?'directional':
   mood?.lighting==='soft-diffuse'||style==='ethereal'?'diffuse':'ambient';
 }
 const saver=!!navigator.connection?.saveData;
 const performance=living.performance==='optimized'||(living.performance==='auto'&&
  (saver||window.matchMedia?.('(max-width: 520px)')?.matches));
 const raw=Number(base.power);
 const power=mf496Clamp(raw,.10,1);
 const reflection=mf496Clamp(.04+.16*power*(muted?.65:1),.04,.22);
 const rim=mf496Clamp(.10+.22*(signals.contrast+.15)*power,.10,.30);
 const tilt=lighting==='directional'?58:lighting==='diffuse'?142:113;
 const motion=base.motion&&!performance&&living.effects.transitions;
 return {mode:prefs.mode,material,lighting,depth,performance,modeName:living.mode,
  reflection:Math.round(reflection*1000)/1000,
  rim:Math.round(rim*1000)/1000,
  tilt,colors:base.colors.slice(),motion:!!motion,
  source:signals.manual?'Custom Studio colors':mood?'Verified artwork direction':'Protected palette colors'};
}
function mf497VisualClear(){
 const root=document.documentElement;
 for(const key of ['data-mf497-material','data-mf497-light','data-mf497-depth',
  'data-mf497-motion','data-mf497-performance'])root.removeAttribute(key);
 for(const variable of ['--mf497-reflection','--mf497-rim','--mf497-tilt',
  '--mf497-color-a','--mf497-color-b','--mf497-color-c'])
  root.style.removeProperty(variable);
 MF497_VISUAL.key='';MF497_VISUAL.last=null;MF497_VISUAL.cleared++;
 mf497VisualUpdate();
}
function mf497VisualApply(palette){
 const root=document.documentElement,prefs=mf484Prefs();
 const plan=mf497VisualPlan(palette,prefs);
 if(!plan){if(root.hasAttribute('data-mf497-material'))mf497VisualClear();return;}
 // No URL or pixel data is retained in the renderer's status or key.
 const key=JSON.stringify([plan,prefs.mode,MF485.revision,
  prefs.mode==='custom'?mf484ActiveProfile(prefs)?.id:'']);
 if(key===MF497_VISUAL.key&&root.dataset.mf497Material===plan.material){
  MF497_VISUAL.reused++;mf497VisualUpdate();return;
 }
 root.dataset.mf497Material=plan.material;
 root.dataset.mf497Light=plan.lighting;
 root.dataset.mf497Depth=plan.depth?'on':'off';
 root.dataset.mf497Motion=plan.motion?'on':'off';
 root.dataset.mf497Performance=plan.performance?'optimized':'full';
 root.style.setProperty('--mf497-reflection',plan.reflection.toFixed(3));
 root.style.setProperty('--mf497-rim',plan.rim.toFixed(3));
 root.style.setProperty('--mf497-tilt',plan.tilt+'deg');
 root.style.setProperty('--mf497-color-a',plan.colors[0]);
 root.style.setProperty('--mf497-color-b',plan.colors[1]);
 root.style.setProperty('--mf497-color-c',plan.colors[2]);
 MF497_VISUAL.compositions++;
 MF497_VISUAL.key=key;
 MF497_VISUAL.last={...plan,colors:undefined};
 mf497VisualUpdate();
}
const mf497VisualPreviousAtmosphere=mf484ApplyAtmosphere;
mf484ApplyAtmosphere=function(palette,imageUrl){
 const result=mf497VisualPreviousAtmosphere.apply(this,arguments);
 if(mf484Prefs().mode==='legacy'){
  if(document.documentElement.hasAttribute('data-mf497-material'))mf497VisualClear();
  return result;
 }
 try{mf497VisualApply(palette);}
 catch(error){console.warn('[MediaFlow v497] Preserved v496 renderer after visual direction failure',error);}
 return result;
};
const mf497VisualPreviousClear=mf484Clear;
mf484Clear=function(){
 const result=mf497VisualPreviousClear.apply(this,arguments);
 mf497VisualClear();return result;
};
function mf497VisualStatus(){
 const mode=mf484Prefs().mode,last=MF497_VISUAL.last;
 return {version:497,mode,active:!!last,material:last?.material||'none',
  lighting:last?.lighting||'none',depth:!!last?.depth,
  motion:!!last?.motion,performance:last?.performance?'optimized':'full',
  source:last?.source||'',compositions:MF497_VISUAL.compositions,
  reused:MF497_VISUAL.reused,cleared:MF497_VISUAL.cleared};
}
function mf497VisualUpdate(){
 const node=document.getElementById('mf497-visual-direction');
 if(!node)return;
 const status=mf497VisualStatus();
 node.innerHTML='<strong>'+escapeHtml(status.active?'Visual Direction active':'Visual Direction inactive')+'</strong>'+
  '<p>'+escapeHtml(status.mode==='legacy'?'Legacy retains its original surfaces.':
   !status.active?'Enable Living Themes to add adaptive material finishes.':
   status.source+' · '+status.material+' surfaces · '+status.lighting+' lighting')+'</p>'+
  '<div class="mf497-visual-tags"><span>Materials: '+escapeHtml(status.material)+'</span>'+
  '<span>Lighting: '+escapeHtml(status.lighting)+'</span>'+
  '<span>Depth: '+(status.depth?'enabled':'off')+'</span>'+
  '<span>Motion: '+(status.motion?'enabled':'off')+'</span></div>'+
  '<small>Recompositions '+status.compositions+' · Reused '+status.reused+
  ' · '+(status.performance==='optimized'?'Optimized':'Standard')+
  ' · All effects remain controlled by your Living Themes settings.</small>';
}
function mf497VisualMount(){
 if(String(S.view)!=='settings'||!window.MediaFlowSettingsCenter?.mountSection)return;
 if(document.querySelector('.mf497-visual-panel'))return;
 const node=document.createElement('div');
 node.innerHTML='<div class="mf497-visual-panel"><strong>Living Themes Visual Direction</strong>'+
  '<p>Adaptive lighting, reflective accents and satin/glass/matte finishes follow your selected palette and enabled effects; Custom manual themes never follow Library covers.</p>'+
  '<div id="mf497-visual-direction" aria-live="polite"></div></div>';
 window.MediaFlowSettingsCenter.mountSection({id:'mf497-visual-direction',
  title:'Living Themes Visual Direction & Materials',category:'appearance',
  subgroup:'Theme Intelligence',
  keywords:['reflection','glass','satin','matte','lighting','materials','glow','visual direction'],
  nodes:[node]});
 mf497VisualUpdate();
}
MediaFlowRuntime.registerPageEnhancer('settings',mf497VisualMount);
window.MediaFlowV497=Object.freeze({version:497,plan:mf497VisualPlan,status:mf497VisualStatus});
MediaFlowRuntime.version=MF497_VISUAL_VERSION;
