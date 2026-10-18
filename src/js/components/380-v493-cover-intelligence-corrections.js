/* MediaFlow v493 — Cover Intelligence Diagnostics & Corrections
 * Strict preview-before-apply: variant/role drafts never alter live palette.
 * Correct a specific pixel-verified artwork, not a media title or collection.
 * Legacy and manual-color Custom themes remain completely unchanged.
 */
const MF493_VERSION=493;
const MF493_VARIANTS=Object.freeze({
 automatic:{name:'Automatic',description:'Original verified artwork analysis'},
 focal:{name:'Focal emphasis',description:'Prioritize a distinctive visual region'},
 dominant:{name:'Dominant artwork',description:'Respect the cover’s most common color'},
 gentle:{name:'Gentle harmony',description:'Preserve cover hues with restrained saturation'},
 contrast:{name:'Distinct accents',description:'Separate the artwork’s recognizable colors'}
});
const MF493_STATE={draft:null,samples:0,applies:0,resets:0,last:null,errors:0};
function mf493Scope(url,mode=mf484Prefs().mode){
 const clean=mf487ValidUrl(url);
 if(!clean||!['advanced','custom'].includes(mode))return '';
 const p=mode==='custom'?mf484ActiveProfile():null;
 if(mode==='custom'&&(p?.source==='manual'||!p?.imageUrl))return '';
 const id=mode==='custom'?String(p?.id||'').slice(0,90):'cover';
 return mode+'-'+v160HashString(id+'|'+clean).map(x=>x.toString(36)).join('-');
}
function mf493Settings(){
 const source=S.settings?.v493CoverCorrections;
 if(!source||typeof source!=='object'||Array.isArray(source))return {};
 const result={};
 for(const [key,record] of Object.entries(source).slice(-80)){
  if(!/^(advanced|custom)-[a-z0-9-]{3,90}$/.test(key))continue;
  if(!record||typeof record!=='object'||Array.isArray(record))continue;
  const variant=Object.hasOwn(MF493_VARIANTS,record.variant)?record.variant:'automatic';
  const slots=Array.isArray(record.slots)&&record.slots.length===3?
   record.slots.map(x=>mf489HexValid(x)?x.toUpperCase():null):null;
  result[key]={variant,slots:slots?.every(Boolean)?slots:null};
 }
 return result;
}
function mf493Colors(data){
 const available=[];
 const add=(color,source,coverage=null)=>{
  if(!mf489HexValid(color))return;
  const hex=color.toUpperCase();
  if(available.some(x=>mf489Separation(x.hex,hex)<.035))return;
  available.push({hex,source,coverage});
 };
 const direct=Array.isArray(data?.colors)?data.colors:[];
 direct.slice(0,3).forEach((v,i)=>add(v,['Extracted focal','Extracted accent','Extracted support'][i]));
 const f=data?.analysis?.composition?.focusColor;
 add(f,'Focal region');
 const distribution=Array.isArray(data?.analysis?.distribution)?data.analysis.distribution:[];
 distribution.slice(0,7).forEach((entry,i)=>{
  if(entry&&Number(entry.percent)>=1)add(entry.color,'Coverage '+Number(entry.percent).toFixed(1)+'%',entry.percent);
 });
 add(data?.colorRoles?.dominantBackground,'Dominant background',
  (Number(data?.analysis?.dominantCoverage)||0)*100);
 return available.slice(0,12);
}
function mf493Pick(data,variant='automatic',slots=null){
 const raw=Array.isArray(data?.colors)?data.colors.slice(0,3).filter(mf489HexValid):[];
 const pool=mf493Colors(data);
 if(!raw.length||!pool.length)return null;
 const sorted=pool.slice().sort((a,b)=>(b.coverage??0)-(a.coverage??0));
 const original=raw.map(x=>x.toUpperCase());
 const used=new Set();
 const choose=(color)=>{
  const c=mf489HexValid(color)?color.toUpperCase():null;
  if(!c)return;
  const matched=pool.find(x=>x.hex===c);
  if(matched&&!used.has(c)){used.add(c);return c;}
 };
 const complete=(head)=>{
  const result=[];
  for(const color of head){const c=choose(color);if(c)result.push(c);if(result.length===3)break;}
  for(const entry of pool){const c=choose(entry.hex);if(c)result.push(c);if(result.length===3)break;}
  while(result.length<3)result.push(original[result.length]||original[0]);
  return result.slice(0,3);
 };
 const focal=data?.analysis?.composition?.focusColor;
 const dominant=data?.colorRoles?.dominantBackground;
 let selected;
 if(variant==='focal')selected=complete([focal,...original]);
 else if(variant==='dominant')selected=complete([dominant,...sorted.map(x=>x.hex),...original]);
 else if(variant==='contrast'){
  const first=original[0];
  const remaining=pool.slice().sort((a,b)=>
   mf489Separation(first,b.hex)-mf489Separation(first,a.hex));
  selected=complete([first,...remaining.map(x=>x.hex)]);
 }else selected=complete(original);
 if(variant==='gentle'){
  selected=selected.map(c=>{
   const lab=mf489Lch(c);
   return mf489Gamut({L:lab.L,C:lab.C*.68,h:lab.h});
  });
 }
 // Slot choices are only accepted if they still exist in the sampled
 // artwork's current palette. Old overrides cannot inject arbitrary hexes.
 if(Array.isArray(slots)&&slots.length===3&&slots.every(x=>pool.some(y=>y.hex===x)))
  selected=slots.slice();
 return selected;
}
function mf493ValidData(data){
 return !!data?.analysis?.sampledFromPixels&&
  !!mf487ValidUrl(data.visualCoverUrl)&&mf493Colors(data).length>0;
}
function mf493ApplyCorrection(data,mode=mf484Prefs().mode){
 if(mode==='legacy'||!mf493ValidData(data))return data;
 if(mode==='custom'&&mf484ActiveProfile()?.source==='manual')return data;
 const key=mf493Scope(data.visualCoverUrl,mode);
 const saved=mf493Settings()[key];
 if(!saved||saved.variant==='automatic'&&!saved.slots)return data;
 const colors=mf493Pick(data,saved.variant,saved.slots);
 if(!colors)return data;
 const result={...data,colors,
  correctionV493:{variant:saved.variant,scope:key,
   selected:colors.slice(),appliedFromSavedSetting:true}};
 MF493_STATE.last={scope:key,variant:saved.variant,colors:colors.slice()};
 return result;
}
// Apply upstream of v489 harmony and v492 expressiveness. No hooks in
// v146's final write guard are replaced: v491 handles readability unchanged.
const mf493BaseCompose=mf484Compose;
mf484Compose=function(data,appearance,expressiveness){
 const validMode=mf484Prefs().mode;
 const corrected=mf493ApplyCorrection(data,validMode);
 return mf493BaseCompose.call(this,corrected,appearance,expressiveness);
};
function mf493Active(){
 const mode=mf484Prefs().mode;
 if(mode==='legacy')return null;
 const url=mode==='custom'?(mf484ActiveProfile()?.source==='manual'?'':mf484ActiveProfile()?.imageUrl):
  S.v146DynamicThemeState?.url;
 if(!url)return null;
 const sample=MF487_STATE.last;
 // Strict source identity: do not show an old image while a new cover is
 // being fetched, and never use the last analyzed cover as a source fallback.
 if(!sample||sample.visualCoverUrl!==url||!mf493ValidData(sample))return null;
 const scope=mf493Scope(url,mode);
 if(!scope)return null;
 return {mode,url,scope,sample};
}
function mf493Variants(data){
 return Object.keys(MF493_VARIANTS).map(key=>({
  key,label:MF493_VARIANTS[key].name,
  explanation:MF493_VARIANTS[key].description,
  colors:mf493Pick(data,key)
 }));
}
function mf493Draft(){
 const active=mf493Active();
 if(!active)return null;
 if(MF493_STATE.draft?.scope!==active.scope||
    MF493_STATE.draft?.fingerprint!==mf487Key(active.url)){
  const saved=mf493Settings()[active.scope];
  MF493_STATE.draft={scope:active.scope,fingerprint:mf487Key(active.url),
   variant:saved?.variant||'automatic',slots:saved?.slots?.slice()||null,
   dirty:false};
 }
 return {active,...MF493_STATE.draft};
}
function mf493Preview(variant){
 if(!Object.hasOwn(MF493_VARIANTS,variant))return false;
 const entry=mf493Draft();if(!entry)return false;
 MF493_STATE.draft.variant=variant;
 MF493_STATE.draft.slots=null;
 MF493_STATE.draft.dirty=true;
 mf493Render();
 return true;
}
function mf493Slot(position,hex){
 const entry=mf493Draft();
 const i=Number(position),color=String(hex||'').toUpperCase();
 if(!entry||!Number.isInteger(i)||i<0||i>2||
   !mf493Colors(entry.active.sample).some(x=>x.hex===color))return false;
 const draft=MF493_STATE.draft;
 const defaults=mf493Pick(entry.active.sample,draft.variant);
 const pool=mf493Colors(entry.active.sample);
 const chosen=draft.slots?draft.slots.slice():defaults.map(x=>
  pool.find(y=>y.hex===x)?.hex||pool.slice().sort((a,b)=>
   mf489Separation(a.hex,x)-mf489Separation(b.hex,x))[0]?.hex||x);
 chosen[i]=color;
 draft.slots=chosen;draft.dirty=true;
 mf493Render();
 return true;
}
function mf493ViewPalette(data,variant,slots){
 const updated=mf493Pick(data,variant,slots);
 if(!updated)return null;
 try{
  const mode=mf484Prefs().mode,custom=mode==='custom';
  const appearance=custom?mf484ActiveProfile()?.appearance:
    S.v146DynamicThemeState?.palette?.mode||data.naturalMode||'dark';
  const source={...data,colors:updated};
  const base=mf489MakePalette(source,appearance,mf484Prefs().expressiveness,custom);
  if(!base)return null;
  return mf491ProtectPalette(mf492ComposePalette(base));
 }catch(e){MF493_STATE.errors++;return null;}
}
function mf493Commit(){
 const entry=mf493Draft();
 if(!entry||!entry.dirty)return false;
 // Abort if the live artwork changed since preview.
 if(!mf493Active()||mf493Active().scope!==entry.scope)return false;
 const colors=mf493Pick(entry.active.sample,entry.variant,entry.slots);
 if(!colors)return false;
 const available=mf493Colors(entry.active.sample);
 const slots=entry.slots&&entry.slots.length===3&&
   entry.slots.every(x=>available.some(c=>c.hex===x))?entry.slots.slice():null;
 const records=mf493Settings();
 if(entry.variant==='automatic'&&!slots)delete records[entry.scope];
 else records[entry.scope]={variant:entry.variant,slots};
 S.settings=S.settings||{};
 S.settings.v493CoverCorrections=Object.fromEntries(Object.entries(records).slice(-80));
 persistSettings();
 MF493_STATE.applies++;
 MF493_STATE.draft=null;
 mf493Reapply(entry.active.mode);
 showToast('Cover correction saved and applied');
 mf493Render();
 return true;
}
function mf493Reset(){
 const entry=mf493Draft();if(!entry)return false;
 const records=mf493Settings();delete records[entry.scope];
 S.settings=S.settings||{};
 S.settings.v493CoverCorrections=records;
 persistSettings();MF493_STATE.resets++;MF493_STATE.draft=null;
 mf493Reapply(entry.active.mode);
 showToast('Automatic cover intelligence restored for this artwork');
 mf493Render();return true;
}
function mf493Discard(){
 MF493_STATE.draft=null;mf493Render();
}
function mf493Reapply(mode){
 const current=mf484Prefs().mode;
 if(current!==mode)return;
 // Reuse v487 caches; v485 prevents late writes from previous themes.
 if(mode==='custom'){
  ++MF484_CUSTOM_SEQ;MF485.appliedKey='';
  MF485.pending=null;MF485.pendingKey='';
  mf484ApplyCustom();
 }else if(S.settings?.dynamicCoverTheme){
  ++V146_DYNAMIC_SEQ;
  v146ScheduleDynamicTheme();
 }
}
function mf493Status(){
 const entry=mf493Draft();
 if(!entry)return {version:493,available:false,mode:mf484Prefs().mode,
  savedCount:Object.keys(mf493Settings()).length,reason:'No current pixel-verified cover'};
 const data=entry.active.sample;
 return {version:493,available:true,mode:entry.active.mode,
  scope:entry.scope,variant:entry.variant,dirty:entry.dirty,
  saved:!!mf493Settings()[entry.scope],
  sampledPoints:data.analysis?.pixels||0,
  focalRegion:data.analysis?.composition?.selected||'Not detected',
  dominant:data.colorRoles?.dominantBackground||'',
  mood:data.analysis?.mood?.signature?.label||'Not measured',
  coverage:(data.analysis?.distribution||[]).slice(0,7),
  availableColors:mf493Colors(data),
  variants:mf493Variants(data),selected:mf493Pick(data,entry.variant,entry.slots),
  savedCount:Object.keys(mf493Settings()).length};
}
function mf493Swatches(colors){
 return '<div class="mf493-swatches">'+(colors||[]).map(color=>
  '<span style="background:'+escapeHtml(color)+'" title="'+escapeHtml(color)+'"></span>').join('')+'</div>';
}
function mf493Render(){
 const host=document.getElementById('mf493-correction-workspace');
 if(!host)return;
 const entry=mf493Draft();
 if(!entry){
  host.innerHTML='<p>Choose Advanced with a readable cover or a Custom image/hybrid profile. Once the current artwork is analyzed, its source colors and correction choices will appear here.</p>';
  return;
 }
 const s=mf493Status(),data=entry.active.sample,preview=mf493ViewPalette(data,entry.variant,entry.slots);
 const available=s.availableColors;
 const image=/^https?:\/\//i.test(entry.active.url)&&entry.active.url.length<=1600?
  '<img alt="Current theme artwork" loading="lazy" src="'+escapeHtml(entry.active.url)+'">':'';
 const selectors=(s.selected||[]).map((color,i)=>
  '<label class="mf493-slot"><small>'+['Primary accent','Secondary accent','Supporting accent'][i]+
  '</small><select aria-label="'+['Primary accent','Secondary accent','Supporting accent'][i]+
  '" onchange="App.mf493Slot('+i+',this.value)">'+available.map(x=>
   '<option value="'+x.hex+'"'+(x.hex===color?' selected':'')+'>'+
   escapeHtml(x.hex+' · '+x.source)+'</option>').join('')+'</select></label>').join('');
 host.innerHTML='<div class="mf493-current">'+image+'<div><strong>Verified cover analysis</strong>'+
  '<small>'+s.sampledPoints+' sampled pixels · '+escapeHtml(s.focalRegion)+' focal region</small>'+
  '<small>Dominant color: '+escapeHtml(s.dominant)+' · '+escapeHtml(s.mood)+'</small>'+
  '<small>Per-image saved corrections: '+s.savedCount+'</small></div></div>'+
  '<div class="mf493-coverage">'+s.coverage.map(c=>
   '<span><i style="background:'+escapeHtml(c.color)+'"></i>'+escapeHtml(c.color)+' · '+
   Math.round(Number(c.percent)||0)+'%</span>').join('')+'</div>'+
  '<div class="mf493-variants">'+s.variants.map(v=>
   '<button type="button" class="mf493-variant'+(entry.variant===v.key?' selected':'')+
   '" aria-pressed="'+(entry.variant===v.key)+'" onclick="App.mf493Preview(\''+
   v.key+'\')"><strong>'+escapeHtml(v.label)+'</strong>'+
   mf493Swatches(v.colors)+'<small>'+escapeHtml(v.explanation)+'</small></button>').join('')+'</div>'+
  '<div class="mf493-roles">'+selectors+'</div>'+
  '<div class="mf493-preview"><strong>Preview · not applied</strong>'+
   (preview?'<div class="mf493-preview-surface" style="background:'+escapeHtml(preview.bg)+
   ';color:'+escapeHtml(preview.text)+';border-color:'+escapeHtml(preview.border)+'">'+
   '<div style="background:'+escapeHtml(preview.panel)+';color:'+escapeHtml(preview.text)+
   '"><strong>MediaFlow theme</strong><p>Sample text and elevated cards</p>'+
   '<span style="background:'+escapeHtml(preview.primary)+';color:'+
   escapeHtml(preview.onAccent)+'">Primary action</span></div></div>'+
   mf493Swatches([preview.bg,preview.panel,preview.raised,preview.primary,preview.secondary,preview.tertiary]):
   '<p>Palette preview is temporarily unavailable. Saved theme remains unchanged.</p>')+
  '</div><div class="mf493-actions">'+
   '<button type="button" class="btn btn-primary" '+(!entry.dirty||!preview?'disabled':'')+
   ' onclick="App.mf493Commit()">Apply to this cover</button>'+
   '<button type="button" class="btn btn-ghost" onclick="App.mf493Discard()">Discard preview</button>'+
   '<button type="button" class="btn btn-ghost" onclick="App.mf493Reset()">Reset cover</button>'+
  '</div><small>Preview changes are local until you apply. Existing Legacy themes, Library data, rotations and other artwork are unaffected.</small>';
}
function mf493Mount(){
 if(String(S.view)!=='settings'||!window.MediaFlowSettingsCenter?.mountSection)return;
 if(document.querySelector('.mf493-panel'))return;
 const node=document.createElement('div');
 node.innerHTML='<div class="mf493-panel"><div><strong>Cover Intelligence Diagnostics & Corrections</strong>'+
 '<p>Understand why MediaFlow selected its focal and accent colors. Compare real-artwork alternatives, preview them safely, then save a correction for this cover alone.</p></div>'+
 '<div id="mf493-correction-workspace" aria-live="polite"></div></div>';
 window.MediaFlowSettingsCenter.mountSection({
  id:'mf493-cover-correction',title:'Cover Intelligence Diagnostics & Corrections',
  category:'appearance',subgroup:'Theme Intelligence',
  keywords:['cover','correct','color','palette','preview','focal','dominant','accents','undo','reset','diagnostics'],
  nodes:[node]
 });
 mf493Render();
}
Object.assign(App,{mf493Preview,mf493Slot,mf493Commit,mf493Reset,mf493Discard});
MediaFlowRuntime.registerPageEnhancer('settings',mf493Mount);
window.MediaFlowV493=Object.freeze({version:493,variants:mf493Variants,
 choose:mf493Pick,correct:mf493ApplyCorrection,status:mf493Status,
 preview:mf493ViewPalette});
MediaFlowRuntime.version=MF493_VERSION;
