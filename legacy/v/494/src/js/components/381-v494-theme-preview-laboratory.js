/* MediaFlow v494 — Theme Preview Laboratory & Comparison.
 * Side-by-side component previews, independent candidate tuning and explicit
 * application. Drafts never change the live theme or persisted preferences.
 * Legacy is read-only; Custom manual never consumes Library cover data.
 */
const MF494_VERSION=494;
const MF494_STATE={key:'',candidates:null,scene:'dashboard',previews:0,applies:0,blocked:0};
const MF494_TUNING=['saturation','accent','depth','tint'];
function mf494Source(){
 const prefs=mf484Prefs(),mode=prefs.mode;
 if(mode==='legacy')return null;
 const profile=mode==='custom'?mf484ActiveProfile(prefs):null;
 if(mode==='custom'&&profile?.source==='manual'){
  const colors=(profile.colors||[]).slice(0,3);
  if(colors.length!==3||!colors.every(mf489HexValid))return null;
  return {mode,manual:true,profile,appearance:profile.appearance,
   key:'manual|'+profile.id+'|'+profile.appearance+'|'+(profile.variation||'')+'|'+colors.join(','),
   data:{colors,naturalMode:profile.appearance},variants:['automatic']};
 }
 const state=window.MediaFlowV493?.status();
 if(!state?.available||state.mode!==mode)return null;
 const sample=MF487_STATE.last;
 if(!sample?.analysis?.sampledFromPixels||!mf487ValidUrl(sample.visualCoverUrl))return null;
 const expected=mode==='custom'?profile?.imageUrl:S.v146DynamicThemeState?.url;
 if(!expected||expected!==sample.visualCoverUrl)return null;
 const colors=(sample.colors||[]).filter(mf489HexValid);
 if(!colors.length)return null;
 const appearance=mode==='custom'?profile.appearance:
  S.v146DynamicThemeState?.palette?.mode||sample.naturalMode||'dark';
 return {mode,manual:false,profile,appearance,data:sample,
  key:state.scope+'|'+mf487Key(expected)+'|'+appearance+'|'+(profile?.variation||'')+'|'+colors.join(','),
  scope:state.scope,saved:mf493Settings()[state.scope]||null,
  variants:state.variants.map(x=>x.key),activeVariant:state.variant||'automatic'};
}
function mf494ResetDraft(source){
 const initial=mf492Config().values;
 MF494_STATE.key=source.key;
 MF494_STATE.candidates=[
  {variant:source.activeVariant||'automatic',values:{...initial},
   slots:source.saved?.slots?.slice()||null},
  {variant:source.manual?'automatic':
   (source.variants.includes('focal')?'focal':'dominant'),
   values:{...MF492_PRESETS.vivid},slots:null}
 ];
}
function mf494Ready(){
 const source=mf494Source();
 if(!source){MF494_STATE.key='';MF494_STATE.candidates=null;return null;}
 if(MF494_STATE.key!==source.key||!MF494_STATE.candidates)mf494ResetDraft(source);
 return source;
}
function mf494Compose(source,candidate){
 if(!source||!candidate)return null;
 try{
  const colors=source.manual?source.data.colors.slice():
   mf493Pick(source.data,candidate.variant,candidate.slots||null);
  if(!colors||colors.length<3||!colors.every(mf489HexValid))return null;
  const selected=source.mode==='custom'&&source.profile?.source==='hybrid'?
   [source.profile.colors[0],colors[0],colors[1]]:colors.slice(0,3);
  const base=mf489MakePalette({...source.data,colors:selected},
   source.appearance,mf484Prefs().expressiveness,source.mode==='custom');
  if(!base)return null;
  const tuned=mf492ComposePalette(base,{preset:'comparison',customized:true,
   values:{...candidate.values}});
  const varied=mf494CustomVariation(tuned,source.profile,source.mode);
  const safe=mf491ProtectPalette(varied);
  return safe&&['bg','panel','raised','text','flow','onAccent','border']
   .every(k=>mf489HexValid(safe[k]))?safe:null;
 }catch(e){return null;}
}
function mf494CustomVariation(input,profile,mode){
 if(mode!=='custom'||!profile||!input)return input;
 const p={...input},light=p.mode==='light';
 if(profile.variation==='ethereal')p.bg=v145MixHex(p.bg,light?'#F9F0FF':'#18122F',.58);
 else if(profile.variation==='futuristic')p.border=v145MixHex(p.secondary,p.border,.48);
 else if(profile.variation==='artistic')p.bg=v145MixHex(p.bg,p.tertiary,.79);
 return p;
}
function mf494ApplySlots(candidate,source){
 if(!candidate.slots)return true;
 if(!Array.isArray(candidate.slots)||candidate.slots.length!==3)return false;
 const available=mf493Colors(source.data).map(x=>x.hex);
 if(!candidate.slots.every(x=>available.includes(x)))return false;
 for(let i=0;i<3;i++)if(!App.mf493Slot(i,candidate.slots[i]))return false;
 return true;
}
function mf494Color(value,fallback){
 const s=String(value||'').trim();
 if(mf489HexValid(s))return s.toUpperCase();
 const short=/^#([0-9a-f]{3})$/i.exec(s);
 if(short)return '#'+short[1].split('').map(c=>c+c).join('').toUpperCase();
 const rgb=/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i.exec(s);
 if(rgb)return mf487Hex(+rgb[1],+rgb[2],+rgb[3]);
 return fallback;
}
function mf494Current(){
 const root=document.documentElement;
 const css=typeof getComputedStyle==='function'?getComputedStyle(root):null;
 const read=(variable,fallback)=>mf494Color(css?.getPropertyValue(variable),fallback);
 const bg=read('--bg','#10121B'),panel=read('--panel','#1A1D2C'),
  raised=read('--panel-raised','#252B3A'),flow=read('--flow','#9165E8');
 return {bg,panel,raised,flow,primary:flow,
  secondary:read('--flow-dim','#5A9FA8'),
  tertiary:read('--text-mute','#A7A5B3'),
  border:read('--border','#485166'),
  text:read('--text','#F7F7FC'),
  textDim:read('--text-dim','#CFD4DF'),
  onAccent:mf491ChooseOnAccent(flow)};
}
function mf494Choose(slot,variant){
 const source=mf494Ready(),i=Number(slot);
 if(!source||!Number.isInteger(i)||i<0||i>1||
  !source.variants.includes(variant))return false;
 MF494_STATE.candidates[i].variant=variant;
 MF494_STATE.candidates[i].slots=null;
 MF494_STATE.previews++;
 mf494Render();return true;
}
function mf494Tune(slot,key,value){
 const source=mf494Ready(),i=Number(slot),n=Number(value);
 if(!source||!Number.isInteger(i)||i<0||i>1||
  !MF494_TUNING.includes(key)||!Number.isFinite(n)||n<0||n>100)return false;
 MF494_STATE.candidates[i].values[key]=Math.round(n);
 MF494_STATE.previews++;
 // Preserve slider focus and thumb position while dragging.
 const host=document.getElementById('mf494-laboratory');
 const output=host?.querySelector('[data-mf494-value="'+i+'-'+key+'"]');
 if(output)output.textContent=Math.round(n)+'%';
 const card=host?.querySelector('[data-mf494-preview="'+i+'"]');
 if(card)card.innerHTML=mf494Scene(mf494Compose(source,MF494_STATE.candidates[i]),'Candidate '+(i?'B':'A'));
 return true;
}
function mf494SetScene(scene){
 if(!['dashboard','library','details'].includes(scene)||!mf494Ready())return false;
 MF494_STATE.scene=scene;
 MF494_STATE.previews++;
 mf494Render();return true;
}
function mf494Swap(){
 const source=mf494Ready();if(!source)return false;
 MF494_STATE.candidates.reverse();mf494Render();return true;
}
function mf494Reset(){
 const source=mf494Source();if(!source)return false;
 mf494ResetDraft(source);mf494Render();return true;
}
function mf494Apply(slot){
 const source=mf494Ready(),i=Number(slot);
 if(!source||!Number.isInteger(i)||i<0||i>1)return false;
 const candidate=MF494_STATE.candidates[i];
 if(!mf494Compose(source,candidate))return false;
 // Re-check identity before ANY persisted change; a rotating cover or a
 // changed Custom profile invalidates the comparison without side effects.
 if(mf494Source()?.key!==source.key){MF494_STATE.blocked++;mf494Render();return false;}
 const previous=S.settings?.v492Palette;
 S.settings=S.settings||{};
 const next={customized:true,values:{...candidate.values}};
 if(!source.manual){
  // v493 owns per-artwork corrections, source identity, and guarded refresh.
  // Set the new tuning before its single persisted correction commit.
  S.settings.v492Palette=next;
  if(!App.mf493Preview(candidate.variant)||!mf494ApplySlots(candidate,source)||!App.mf493Commit()){
   S.settings.v492Palette=previous;MF494_STATE.blocked++;
   mf494Render();return false;
  }
 }else{
  S.settings.v492Palette=next;
  persistSettings();
  mf492Reapply();
 }
 MF494_STATE.applies++;
 MF494_STATE.key='';MF494_STATE.candidates=null;
 showToast('Theme comparison candidate applied');
 mf494Render();return true;
}
function mf494Scene(palette,label){
 if(!palette)return '<p class="mf494-unavailable">Preview unavailable. The active theme was not changed.</p>';
 const c=key=>escapeHtml(palette[key]||'#FFFFFF');
 const swatches=['bg','panel','raised','primary','secondary','tertiary'].map(k=>
  '<i style="background:'+c(k)+'" title="'+escapeHtml(k)+'"></i>').join('');
 return '<div class="mf494-scene" style="background:'+c('bg')+';color:'+c('text')+
  ';border-color:'+c('border')+'">'+
  '<div class="mf494-scene-nav" style="background:'+c('panel')+';border-color:'+c('border')+'">'+
  '<strong>MEDIAFLOW</strong><span>Dashboard &nbsp; Library &nbsp; Collections</span></div>'+
  '<div class="mf494-scene-hero" style="background:linear-gradient(130deg,'+
   c('raised')+','+c('panel')+');border-color:'+c('border')+'">'+
  '<small style="color:'+c('textDim')+'">'+
  (MF494_STATE.scene==='library'?'YOUR LIBRARY':MF494_STATE.scene==='details'?'TITLE DETAILS':'NEXT IN YOUR LIBRARY')+'</small>'+
  '<h4>'+(MF494_STATE.scene==='library'?'Your next discoveries':
   MF494_STATE.scene==='details'?'Title overview':'Discover your next story')+'</h4>'+
  '<p style="color:'+c('textDim')+'">Preview cards, navigation, badges and typography.</p>'+
  '<span class="mf494-scene-action" style="background:'+c('flow')+
   ';color:'+c('onAccent')+'">Preview action</span></div>'+
  '<div class="mf494-scene-kpis"><span style="background:'+c('panel')+
   ';border-color:'+c('border')+'"><b>24</b><small>Completed</small></span>'+
  '<span style="background:'+c('panel')+';border-color:'+c('border')+
   '"><b>07</b><small>In progress</small></span></div>'+
  '<div class="mf494-scene-list" style="background:'+c('panel')+
   ';border-color:'+c('border')+'"><span>Sample title <em style="color:'+c('secondary')+
   '">Watching</em></span><div style="background:'+c('raised')+
   '"><i style="width:64%;background:'+c('flow')+'"></i></div>'+
   '<small style="color:'+c('textDim')+'">Progress · 64%</small></div>'+
  '<div class="mf494-scene-extras" style="background:'+c('panel')+';border-color:'+c('border')+'">'+
  (MF494_STATE.scene==='details'?
    '<strong>Title details</strong><p>Runtime · Rating · Personal Order</p>':
   MF494_STATE.scene==='library'?
    '<strong>Library filters</strong><p>Watching · Completed · Planned</p>':
    '<strong>Activity snapshot</strong><p>Recently logged · Today</p>')+
  '<div class="mf494-scene-dialog" style="background:'+c('raised')+';border-color:'+c('border')+'">'+
    '<strong>Settings dialog</strong><small style="color:'+c('textDim')+'">Example option · Read-only</small>'+
    '<span class="mf494-scene-action" style="background:'+c('flow')+';color:'+c('onAccent')+'">Save changes</span>'+
  '</div></div>'+
  '<div class="mf494-scene-swatches">'+swatches+'</div></div>';
}
function mf494Candidate(source,index){
 const d=MF494_STATE.candidates[index],p=mf494Compose(source,d);
 const name=index?'B':'A',select=source.variants.length>1?
  '<label>Artwork interpretation<select aria-label="Candidate '+name+' artwork interpretation" onchange="App.mf494Choose('+index+',this.value)">'+
  source.variants.map(v=>'<option value="'+v+'"'+(v===d.variant?' selected':'')+'>'+
  escapeHtml(MF493_VARIANTS[v]?.name||v)+'</option>').join('')+'</select></label>':
  '<small>Manual Custom colors · independent of covers</small>';
 const rows=MF494_TUNING.map(key=>
  '<label class="mf494-tuning"><span>'+escapeHtml(key[0].toUpperCase()+key.slice(1))+
  '<output data-mf494-value="'+index+'-'+key+'">'+d.values[key]+'%</output></span>'+
  '<input type="range" min="0" max="100" value="'+d.values[key]+
  '" aria-label="Candidate '+name+' '+key+'" oninput="App.mf494Tune('+
  index+',\''+key+'\',this.value)"></label>').join('');
 return '<article class="mf494-comparison-card"><div class="mf494-card-head">'+
  '<strong>Candidate '+name+'</strong><small>Draft · not applied'+
  (p?.readability?.ratios?.text?' · '+p.readability.ratios.text+':1 text':'')+'</small></div>'+
  '<div data-mf494-preview="'+index+'">'+mf494Scene(p,'Candidate '+name)+'</div>'+
  '<div class="mf494-card-controls">'+select+rows+
  '<button type="button" class="btn btn-primary" '+(!p?'disabled':'')+
  ' onclick="App.mf494Apply('+index+')">Apply candidate '+name+'</button></div></article>';
}
function mf494Render(){
 const host=document.getElementById('mf494-laboratory');if(!host)return;
 const source=mf494Ready();
 if(!source){
  host.innerHTML='<p class="mf494-unavailable">Switch to Advanced with a verified cover or Custom with your own colors or verified image. Legacy remains unchanged. No live theme is modified by this laboratory.</p>';
  return;
 }
 const current=mf494Current();
 host.innerHTML='<div class="mf494-lab-tools"><span>'+
  (source.manual?'Custom manual palette':'Pixel-verified '+(source.mode==='custom'?'Custom image':'Advanced cover'))+
  ' · compare without changing the active theme</span>'+
  '<div><label class="mf494-scene-choice">Compare layout <select aria-label="Preview component layout" onchange="App.mf494SetScene(this.value)">'+
  ['dashboard','library','details'].map(view=>'<option value="'+view+'"'+(view===MF494_STATE.scene?' selected':'')+'>'+view[0].toUpperCase()+view.slice(1)+'</option>').join('')+'</select></label>'+
  '<button type="button" class="btn btn-ghost" onclick="App.mf494Swap()">Swap A / B</button>'+
  '<button type="button" class="btn btn-ghost" onclick="App.mf494Reset()">Reset drafts</button></div></div>'+
  '<div class="mf494-comparison-grid"><article class="mf494-comparison-card mf494-live">'+
  '<div class="mf494-card-head"><strong>Current live theme</strong><small>Read-only snapshot</small></div>'+
  mf494Scene(current,'Current')+
  '<p class="mf494-current-note">This column reads the currently applied interface colors. Comparison drafts never write to it.</p></article>'+
  mf494Candidate(source,0)+mf494Candidate(source,1)+'</div>'+
  '<p class="mf494-footnote">Color tuning is shared by Advanced and Custom through the existing expressiveness settings. Artwork interpretation is saved only for the current verified image; Custom manual themes never use Library covers. Apply is explicit, and a changed image/profile blocks stale drafts.</p>';
}
function mf494Status(){
 const source=mf494Ready();
 return {version:494,available:!!source,mode:mf484Prefs().mode,
  manual:!!source?.manual,scene:MF494_STATE.scene,previews:MF494_STATE.previews,
  applies:MF494_STATE.applies,blocked:MF494_STATE.blocked,
  candidates:source?MF494_STATE.candidates.map(x=>({variant:x.variant,values:{...x.values}})):[]};
}
function mf494Mount(){
 if(String(S.view)!=='settings'||!window.MediaFlowSettingsCenter?.mountSection)return;
 if(document.querySelector('.mf494-panel'))return;
 const node=document.createElement('div');
 node.innerHTML='<div class="mf494-panel"><header><small>VISUAL EVOLUTION · v494</small>'+
  '<h3>Theme Preview Laboratory & Comparison</h3>'+
  '<p>Compare realistic interface components in three columns, fine-tune each candidate, and apply only the version you choose.</p></header>'+
  '<div id="mf494-laboratory" aria-live="polite"></div></div>';
 window.MediaFlowSettingsCenter.mountSection({
  id:'mf494-theme-preview-laboratory',title:'Theme Preview Laboratory & Comparison',
  category:'appearance',subgroup:'Theme Studio',
  keywords:['theme','preview','compare','candidate','colors','studio','advanced','custom','palette','live'],
  nodes:[node]
 });
 mf494Render();
}
Object.assign(App,{mf494Choose,mf494Tune,mf494SetScene,mf494Swap,mf494Reset,mf494Apply});
MediaFlowRuntime.registerPageEnhancer('settings',mf494Mount);
window.MediaFlowV494=Object.freeze({version:494,status:mf494Status,
 compose:mf494Compose,source:mf494Source});
MediaFlowRuntime.version=MF494_VERSION;
