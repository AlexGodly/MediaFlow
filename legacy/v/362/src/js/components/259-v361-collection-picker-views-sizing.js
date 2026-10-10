/* MediaFlow v361 — readable desktop title sizing controls and configurable
 * Collection picker views. Collection assignment, search/sort and pagination
 * remain owned by their existing canonical implementations. */
const V361_RELEASE=361;
const V361_COLLECTION_MODES=['list','compact','cards','covers','covers-title'];
const V361_COLLECTION_LIMITS={text:[12,24],cover:[36,180]};

function v361CollectionPrefs(){
  const settings=S.settings||(S.settings={});
  const current=settings.v361CollectionPicker&&typeof settings.v361CollectionPicker==='object' ? settings.v361CollectionPicker : {};
  const mode=V361_COLLECTION_MODES.includes(current.mode)?current.mode:(window.matchMedia('(max-width: 1023px)').matches?'list':'cards');
  const sane=(key,fallback)=>{
    const n=Number(current[key]);
    if(!Number.isFinite(n)||n===0)return fallback;
    return Math.round(Math.min(V361_COLLECTION_LIMITS[key][1],Math.max(V361_COLLECTION_LIMITS[key][0],n)));
  };
  // Persist only the three picker preferences. No Collection or queue mutation.
  settings.v361CollectionPicker={mode,text:sane('text',15),cover:sane('cover',window.matchMedia('(max-width: 1023px)').matches?52:78)};
  return settings.v361CollectionPicker;
}
function v361CollectionViewHtml(){
  const prefs=v361CollectionPrefs();
  const modes=[['list','List'],['compact','Compact'],['cards','Cards'],['covers','Covers'],['covers-title','Covers+Titles']];
  return `<div class="mf361-collection-display" role="group" aria-label="Add Collections display and sizing">
    <div class="mf361-collection-mode-buttons" role="group" aria-label="Add Collections display mode">${modes.map(([id,label])=>`<button type="button" class="mf361-collection-mode ${prefs.mode===id?'active':''}" aria-pressed="${prefs.mode===id}" data-v225-iconified="1" onclick="App.v361CollectionMode('${id}')">${label}</button>`).join('')}</div>
    <div class="mf361-collection-size-controls">
      <label class="mf361-size-field"><span>Text size</span><input type="range" aria-label="Add Collections text size" min="12" max="24" step="1" value="${prefs.text}" oninput="App.v361CollectionSize('text',this.value)"><output data-size="text">${prefs.text}px</output></label>
      <label class="mf361-size-field"><span>Cover size</span><input type="range" aria-label="Add Collections cover size" min="36" max="180" step="1" value="${prefs.cover}" oninput="App.v361CollectionSize('cover',this.value)"><output data-size="cover">${prefs.cover}px</output></label>
    </div>
  </div>`;
}
function v361ApplyCollectionDisplay(){
  const sheet=document.querySelector('.mf354-sheet-backdrop .mf359-collection-sheet');
  if(!sheet)return;
  const results=sheet.querySelector('#mf287-collection-results');
  if(!results)return;
  const p=v361CollectionPrefs();
  results.classList.add('mf361-collection-results');
  V361_COLLECTION_MODES.forEach(id=>results.classList.toggle('mf361-mode-'+id,p.mode===id));
  results.style.setProperty('--mf361-cover',p.cover+'px');
  results.style.setProperty('--mf361-text',p.text+'px');
  // Collection rows are recreated by the canonical pager/filters. Give each
  // Add/Assigned control a Collection-specific accessible name and prevent
  // the legacy v225 generic icon layer from adding a second action icon.
  results.querySelectorAll('.mf287-picker-row').forEach(row=>{
    const name=row.querySelector('.mf287-picker-copy b')?.textContent?.trim()||'Collection';
    const action=row.querySelector(':scope > button.btn');
    if(action){
      action.setAttribute('aria-label',`${action.disabled?'Already assigned':'Add'} ${name}`);
      action.setAttribute('title',`${action.disabled?'Already assigned':'Add'} ${name}`);
      action.setAttribute('data-v225-iconified','1');
    }
    row.setAttribute('title',name);
  });
}
function v361CollectionMode(mode){
  if(!V361_COLLECTION_MODES.includes(mode))return;
  const prefs=v361CollectionPrefs();
  if(prefs.mode===mode)return;
  prefs.mode=mode;
  const bar=document.querySelector('.mf359-collection-sheet .mf361-collection-display');
  if(bar)bar.querySelectorAll('.mf361-collection-mode').forEach(btn=>{
    const current=btn.getAttribute('onclick')?.includes(`'${mode}'`)||false;
    btn.classList.toggle('active',current);btn.setAttribute('aria-pressed',String(current));
  });
  v361ApplyCollectionDisplay();
  if(typeof v360CollectionDialogDensity==='function')v360CollectionDialogDensity();
  if(typeof v358SaveLater==='function')v358SaveLater();
}
function v361CollectionSize(key,value){
  if(!V361_COLLECTION_LIMITS[key])return;
  const number=Number(value);
  if(!Number.isFinite(number))return;
  const pref=v361CollectionPrefs();
  pref[key]=Math.max(V361_COLLECTION_LIMITS[key][0],Math.min(V361_COLLECTION_LIMITS[key][1],Math.round(number)));
  const panel=document.querySelector('.mf359-collection-sheet .mf361-collection-results');
  if(panel)panel.style.setProperty(key==='text'?'--mf361-text':'--mf361-cover',pref[key]+'px');
  document.querySelectorAll(`.mf359-collection-sheet .mf361-collection-size-controls output[data-size="${key}"]`).forEach(output=>{output.textContent=pref[key]+'px';});
  if(typeof v358SaveLater==='function')v358SaveLater();
}
function v361AddCollectionControls(){
  const sheet=document.querySelector('.mf354-sheet-backdrop .mf359-collection-sheet');
  if(!sheet)return;
  const pane=sheet.querySelector('.mf359-collection-results-panel');
  const bar=pane?.querySelector('.mf359-collection-toolbar');
  if(!pane||!bar)return;
  let controls=pane.querySelector(':scope > .mf361-collection-display');
  if(!controls){
    const holder=document.createElement('div');holder.innerHTML=v361CollectionViewHtml();
    controls=holder.firstElementChild;
    bar.after(controls);
  }
  v361ApplyCollectionDisplay();
}
// The existing refresh path only replaces result rows / page labels. Reapply
// view and text-size classes after pagination and filtering; do not rebuild
// the toolbar and do not scroll the result list away from the current page.
const v361CollectionRefreshBase=v287RefreshCollectionPicker;
v287RefreshCollectionPicker=function(){
  const result=v361CollectionRefreshBase.apply(this,arguments);
  v361ApplyCollectionDisplay();
  return result;
};
const v361OpenSheetBase=App.v354OpenSheet;
App.v354OpenSheet=function(kind){
  const result=v361OpenSheetBase.apply(this,arguments);
  if(kind==='collection')v361AddCollectionControls();
  return result;
};
const v361BtnIconNameBase=v225ButtonIconName;
v225ButtonIconName=function(el){
  if(el?.matches?.('.mf361-collection-mode,.mf361-collection-results .mf287-picker-row>.btn'))return null;
  return v361BtnIconNameBase.apply(this,arguments);
};
Object.assign(App,{v361CollectionMode,v361CollectionSize});
MediaFlowRuntime.version=V361_RELEASE;
window.MediaFlowV361={version:361,features:[
  'Large desktop Add Titles text and cover slider controls',
  'Five independent Add Collections display modes',
  'Add Collections persistent text and cover size adjusters',
  'Responsive Collection card and collage art sizing',
  'Preserved Collection filters, independent pagination and queue assignment actions'
]};
