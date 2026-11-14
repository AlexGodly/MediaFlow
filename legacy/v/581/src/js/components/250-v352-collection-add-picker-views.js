/* MediaFlow v352 — readable Collection Add Titles picker.
   The picker reuses the existing indexed search, selection, paging and commit
   paths; only rendering/layout preferences are new. Preferences are saved in
   the existing Settings JSON so backups, presets and cloud can carry them. */
const V352_PICKER_MODES=['list','compact','cards','covers','covers-title'];
let V352_PICKER_SAVE_TIMER=0;
function v352PickerPrefs(){
  const settings=S.settings||(S.settings={});
  const raw=settings.v352CollectionPicker&&typeof settings.v352CollectionPicker==='object'?settings.v352CollectionPicker:{};
  const mode=V352_PICKER_MODES.includes(raw.viewMode)?raw.viewMode:'list';
  const text=Number(raw.textSize),cover=Number(raw.coverSize);
  const prefs={viewMode:mode,textSize:Number.isFinite(text)?Math.max(12,Math.min(24,Math.round(text))):15,coverSize:Number.isFinite(cover)?Math.max(36,Math.min(180,Math.round(cover))):72};
  settings.v352CollectionPicker=prefs;
  return prefs;
}
function v352PickerSaveSoon(){
  clearTimeout(V352_PICKER_SAVE_TIMER);
  V352_PICKER_SAVE_TIMER=setTimeout(()=>{try{Promise.resolve(saveState()).catch(()=>{});}catch(_){ }},450);
}
function v352PickerVariables(p=v352PickerPrefs()){
  return `--mf352-text:${p.textSize}px;--mf352-cover:${p.coverSize}px`;
}
function v352PickerOptionsHtml(){
  const p=v352PickerPrefs();
  const choices=[['list','List'],['compact','Compact'],['cards','Cards'],['covers','Covers'],['covers-title','Covers + Titles']];
  return `<section class="mf352-picker-settings" aria-label="Add titles display settings">
    <div class="mf352-display-header"><b>Display</b><span>Choose how Library titles appear in this picker</span></div>
    <div class="mf352-view-modes" role="group" aria-label="Title display mode">${choices.map(([mode,label])=>`<button type="button" class="mf352-view-mode ${p.viewMode===mode?'active':''}" aria-pressed="${p.viewMode===mode}" onclick="App.v352PickerMode('${mode}')">${label}</button>`).join('')}</div>
    <div class="mf352-adjusters">
      <label class="mf352-adjuster"><span>Title text size</span><input type="range" min="12" max="24" step="1" value="${p.textSize}" aria-label="Title text size" oninput="App.v352PickerSize('textSize',this.value)"><output id="mf352-text-value">${p.textSize}px</output></label>
      <label class="mf352-adjuster"><span>Title cover size</span><input type="range" min="36" max="180" step="2" value="${p.coverSize}" aria-label="Title cover size" oninput="App.v352PickerSize('coverSize',this.value)"><output id="mf352-cover-value">${p.coverSize}px</output></label>
    </div>
  </section>`;
}
function v352PickerResultHtml(item){
  const cat=v274Cat(item),id=String(item.id),checked=v274AddState().picks.has(id);
  const title=escapeHtml(v274SafeTitle(item));
  const metadata=`${cat?v144CategoryIconHtml(cat):''} ${escapeHtml(cat?.name||'Uncategorized')} · ${escapeHtml(v274StatusLabel(item.status))} · ${escapeHtml(String(item.priority||'medium'))}${Number(item.rating)>0?` · ★ ${Number(item.rating).toFixed(1)}`:''}`;
  return `<label class="mf274-add-row mf352-picker-item" title="${title}" data-mf352-id="${escapeHtml(id)}">
    <input class="mf352-picker-check" type="checkbox" aria-label="Select ${title}" ${checked?'checked':''} onchange="App.v274AddPick('${escapeHtml(id)}',this.checked)">
    <span class="mf352-picker-cover">${v274TitleCover(item,false)}</span>
    <span class="mf352-picker-copy"><span class="mf352-picker-title">${title}</span><small class="mf352-picker-meta">${metadata}</small></span>
  </label>`;
}
v276AddResultsHtml=function(shown){return shown.length?shown.map(v352PickerResultHtml).join(''):'<div class="empty-state">No Library titles match.</div>';};
const v352OldAddModalBody=v274AddModalBody;
v274AddModalBody=function(c){
  const original=v352OldAddModalBody(c),p=v352PickerPrefs();
  // Inject the new controls immediately above results, without replacing the
  // optimized v279 search input, filter controls or pagination mechanisms.
  return original.replace('<div id="mf276-add-results" class="mf274-add-results">',
    `${v352PickerOptionsHtml()}<div id="mf276-add-results" class="mf274-add-results mf352-picker-results mf352-mode-${p.viewMode}" style="${v352PickerVariables(p)}">`);
};
function v352PickerMode(mode){
  if(!V352_PICKER_MODES.includes(mode))return;
  const prefs=v352PickerPrefs();prefs.viewMode=mode;
  const results=document.getElementById('mf276-add-results');
  if(results){
    for(const value of V352_PICKER_MODES)results.classList.remove('mf352-mode-'+value);
    results.classList.add('mf352-mode-'+mode);
    results.scrollTop=0;
  }
  document.querySelectorAll('#mf274-add-titles .mf352-view-mode').forEach(b=>{
    const active=b.getAttribute('onclick')?.includes(`'${mode}'`)||false;
    b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));
  });
  v352PickerSaveSoon();
}
function v352PickerSize(key,value){
  if(!['textSize','coverSize'].includes(key))return;
  const min=key==='textSize'?12:36,max=key==='textSize'?24:180;
  const num=Number(value);if(!Number.isFinite(num))return;
  const prefs=v352PickerPrefs();prefs[key]=Math.max(min,Math.min(max,Math.round(num)));
  const results=document.getElementById('mf276-add-results');
  if(results)results.style.setProperty(key==='textSize'?'--mf352-text':'--mf352-cover',prefs[key]+'px');
  const output=document.getElementById(key==='textSize'?'mf352-text-value':'mf352-cover-value');
  if(output)output.textContent=prefs[key]+'px';
  v352PickerSaveSoon();
}
Object.assign(App,{v352PickerMode,v352PickerSize});
window.MediaFlowV352={version:352,focus:'Collection Add Titles readable names, five view modes, cloud-synced cover/text adjusters'};
