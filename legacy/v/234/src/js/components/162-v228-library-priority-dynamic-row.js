/* ============================================================
   MediaFlow v228 — Library Metadata Icons + Dynamic Row Ordering
   ------------------------------------------------------------
   - Removes the redundant global action icon from Library category pills.
   - Gives Library priority pills the same Low / Medium / High visual language
     as the priority picker.
   - Restores a dedicated three-line drag handle to Dynamic category settings.
   - Adds a persistent Dynamic category-row order source:
       * Custom Dynamic row order (default / existing behavior)
       * Follow Categories order
   ============================================================ */

const V228_RUNTIME_VERSION=228;

/* ---------- Priority icon parity with the priority picker ----- */
Object.assign(V225_BUTTON_ICONS,{
  priorityLow:v225IconSvg('<path d="M5 8h14l-7 9Z"/>'),
  priorityMedium:v225IconSvg('<circle cx="12" cy="12" r="4"/>'),
  priorityHigh:v225IconSvg('<path d="m12 7 7 9H5Z"/>')
});

const v228ButtonIconNameBase=v225ButtonIconName;
v225ButtonIconName=function(el){
  if(!el)return null;
  const t=v225CleanActionText(el);

  // Library category pills already show the category's own URL/emoji identity.
  // A second generic action icon is visual noise.
  if(el.matches?.('.category-click'))return null;

  // Match the priority picker language directly on Library title rows.
  if(el.matches?.('.priority-click')){
    if(/^low\b/.test(t))return 'priorityLow';
    if(/^medium\b/.test(t))return 'priorityMedium';
    if(/^high\b/.test(t))return 'priorityHigh';
  }

  return v228ButtonIconNameBase(el);
};

/* ---------- Dynamic category-row order source ---------------- */
V181_LIBRARY_DEFAULT.dynamicCategoryOrderMode='custom';
DEFAULT_SETTINGS.v181Library=DEFAULT_SETTINGS.v181Library||{};
DEFAULT_SETTINGS.v181Library.dynamicCategoryOrderMode='custom';

const v228NormalizeLibrarySettingsBase=v181NormalizeLibrarySettings;
v181NormalizeLibrarySettings=function(raw,categories){
  const out=v228NormalizeLibrarySettingsBase(raw,categories);
  out.dynamicCategoryOrderMode=String(raw?.dynamicCategoryOrderMode||'custom')==='category'?'category':'custom';
  return out;
};

function v228DynamicCategoryOrderMode(){
  return v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS).dynamicCategoryOrderMode==='category'?'category':'custom';
}

function v228MainCategoryOrder(){
  const ids=[];
  const seen=new Set();
  for(const cat of (S.categories||[])){
    const id=String(cat?.id||'');
    if(!id||seen.has(id))continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

function v228EffectiveDynamicCategoryOrder(cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS)){
  if(cfg.dynamicCategoryOrderMode==='category')return v228MainCategoryOrder();
  return (cfg.categoryOrder||[]).map(String);
}

function v228SetDynamicCategoryOrderMode(value){
  const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  cfg.dynamicCategoryOrderMode=String(value)==='category'?'category':'custom';
  cfg.modifiedAt=Date.now();

  const visible=v228EffectiveDynamicCategoryOrder(cfg).filter(id=>!(cfg.hiddenCategoryIds||[]).includes(String(id)));
  if(!visible.includes(String(cfg.activeCategoryId||'')))cfg.activeCategoryId=visible[0]||'';

  S.libPage=0;
  persistSettings();
  render();
  showToast(cfg.dynamicCategoryOrderMode==='category'?'Dynamic row now follows Categories order.':'Dynamic row now uses its own custom order.');
}

/* ---------- Drag-and-drop for custom Dynamic row order -------- */
let V228_DYNAMIC_CATEGORY_DRAG_ID='';

function v228DynamicCategoryDragStart(event,id){
  if(v228DynamicCategoryOrderMode()!=='custom'){
    event?.preventDefault?.();
    return;
  }
  V228_DYNAMIC_CATEGORY_DRAG_ID=String(id||'');
  const row=event?.currentTarget?.closest?.('.v186-dynamic-category-row');
  row?.classList?.add('v228-dragging');
  try{
    event.dataTransfer.effectAllowed='move';
    event.dataTransfer.setData('text/x-mediaflow-dynamic-category',V228_DYNAMIC_CATEGORY_DRAG_ID);
    event.dataTransfer.setData('text/plain',V228_DYNAMIC_CATEGORY_DRAG_ID);
  }catch(_){ }
}

function v228DynamicCategoryDragEnd(event){
  event?.currentTarget?.closest?.('.v186-dynamic-category-row')?.classList?.remove('v228-dragging');
  document.querySelectorAll('.v186-dynamic-category-row.v228-drop-target').forEach(el=>el.classList.remove('v228-drop-target'));
  V228_DYNAMIC_CATEGORY_DRAG_ID='';
}

function v228DynamicCategoryDragOver(event){
  if(v228DynamicCategoryOrderMode()!=='custom')return;
  event?.preventDefault?.();
  try{event.dataTransfer.dropEffect='move';}catch(_){ }
  event?.currentTarget?.classList?.add('v228-drop-target');
}

function v228DynamicCategoryDragLeave(event){
  event?.currentTarget?.classList?.remove('v228-drop-target');
}

function v228DynamicCategoryDrop(event,targetId){
  if(v228DynamicCategoryOrderMode()!=='custom')return;
  event?.preventDefault?.();
  event?.currentTarget?.classList?.remove('v228-drop-target');

  let source=V228_DYNAMIC_CATEGORY_DRAG_ID;
  try{source=event.dataTransfer.getData('text/x-mediaflow-dynamic-category')||event.dataTransfer.getData('text/plain')||source;}catch(_){ }
  source=String(source||'');
  const target=String(targetId||'');
  if(!source||!target||source===target)return;

  const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  const order=(cfg.categoryOrder||[]).map(String);
  const from=order.indexOf(source);
  const to=order.indexOf(target);
  if(from<0||to<0)return;

  const [moved]=order.splice(from,1);
  order.splice(to,0,moved);
  cfg.categoryOrder=order;
  cfg.modifiedAt=Date.now();
  S.libPage=0;
  persistSettings();
  render();
  showToast('Dynamic category row reordered.');
}

/* ---------- Settings UI -------------------------------------- */
const v228DynamicLibrarySettingsHtmlBase=v181DynamicLibrarySettingsHtml;
v181DynamicLibrarySettingsHtml=function(){
  const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  const mode=cfg.dynamicCategoryOrderMode==='category'?'category':'custom';
  const customOrder=(cfg.categoryOrder||[]).slice();
  const effectiveOrder=v228EffectiveDynamicCategoryOrder(cfg);

  // Reuse all mature v186/v197/v226 Settings markup, but render category rows
  // in the effective order while Follow Categories mode is active. Restore the
  // saved custom order immediately afterwards so switching back never loses it.
  if(mode==='category')S.settings.v181Library.categoryOrder=effectiveOrder.slice();
  let h='';
  try{
    h=v228DynamicLibrarySettingsHtmlBase.apply(this,arguments);
  }finally{
    // v181EnsureLibrarySettings replaces the settings object while normalizing,
    // so restore the saved custom order on the CURRENT object, not the stale
    // reference captured before the base renderer ran.
    const current=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
    current.categoryOrder=customOrder.slice();
    current.dynamicCategoryOrderMode=mode;
  }

  const orderSetting=`<div class="v228-dynamic-category-order-setting">
    <div class="v228-dynamic-category-order-copy">
      <b>Dynamic category row order</b>
      <small>Choose whether Dynamic Library keeps its own custom row order or automatically follows the main Categories order.</small>
    </div>
    <select aria-label="Dynamic Library category row order" onchange="App.v228SetDynamicCategoryOrderMode(this.value)">
      <option value="custom" ${mode==='custom'?'selected':''}>Custom Dynamic row order</option>
      <option value="category" ${mode==='category'?'selected':''}>Follow Categories order</option>
    </select>
  </div>`;

  const marker='<div class="section-label" style="margin-top:15px;">DYNAMIC CATEGORY ROW</div>';
  if(h.includes(marker))h=h.replace(marker,orderSetting+marker);

  const rowIds=effectiveOrder.slice();
  let rowIndex=0;
  h=h.replace(/<div class="v181-config-row v186-dynamic-category-row">/g,()=>{
    const id=String(rowIds[rowIndex++]||'');
    const follow=mode==='category';
    return `<div class="v181-config-row v186-dynamic-category-row ${follow?'v228-follow-category-order':'v228-custom-category-order'}" data-v228-dynamic-category="${escapeHtml(id)}" ${follow?'':`ondragover="App.v228DynamicCategoryDragOver(event)" ondragleave="App.v228DynamicCategoryDragLeave(event)" ondrop="App.v228DynamicCategoryDrop(event,'${escapeHtml(id)}')"`}>`;
  });

  let inputIndex=0;
  h=h.replace(/<input class="v186-dynamic-position"/g,()=>{
    const id=String(rowIds[inputIndex++]||'');
    const handle=mode==='custom'
      ?`<button type="button" class="btn btn-sm btn-ghost v228-dynamic-drag-handle" draggable="true" title="Drag to reorder Dynamic row" aria-label="Drag Dynamic category to reorder" ondragstart="App.v228DynamicCategoryDragStart(event,'${escapeHtml(id)}')" ondragend="App.v228DynamicCategoryDragEnd(event)">☰</button>`
      :`<button type="button" class="btn btn-sm btn-ghost v228-dynamic-drag-handle" disabled title="Order follows Categories" aria-label="Order follows Categories">☰</button>`;
    return `${handle}<input class="v186-dynamic-position"${mode==='category'?' disabled':''}`;
  });

  if(mode==='category'){
    h=h.replace(/(<button type="button" class="btn btn-sm btn-ghost" )(.*?onclick="App\.v181MoveDynamicCategory\([^>]+>)/g,'$1disabled $2');
    h=h.replace(/Dynamic row position (\d+) · (shown|hidden)/g,'Category position $1 · $2 · following Categories order');
    h=h.replace(
      /Set an exact row number, use ↑\/↓, show\/hide the category, or edit\/clear\/delete it directly\./,
      'This row follows the main Categories order automatically. Show/hide and Edit/Clear/Delete remain independent for Dynamic Library.'
    );
  }else{
    h=h.replace(
      /Set an exact row number, use ↑\/↓, show\/hide the category, or edit\/clear\/delete it directly\./,
      'Drag with ☰, set an exact row number, use ↑/↓, show/hide the category, or edit/clear/delete it directly.'
    );
  }

  return h;
};

/* Individual Settings reset support for the new persistent order mode. */
const v228ResetDescriptorBase=v221ResetDescriptorForControl;
v221ResetDescriptorForControl=function(el){
  const code=[el?.getAttribute?.('onchange'),el?.getAttribute?.('onclick'),el?.getAttribute?.('oninput')].filter(Boolean).join(' ');
  if(/App\.v228SetDynamicCategoryOrderMode\(/.test(code))return {type:'path',path:'v181Library.dynamicCategoryOrderMode'};
  return v228ResetDescriptorBase(el);
};

/* ---------- Dynamic Library uses effective row order ---------- */
const v228RenderDynamicLibraryBase=v181RenderDynamicLibrary;
v181RenderDynamicLibrary=function(){
  const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  if(cfg.dynamicCategoryOrderMode!=='category')return v228RenderDynamicLibraryBase.apply(this,arguments);
  const saved=(cfg.categoryOrder||[]).slice();
  S.settings.v181Library.categoryOrder=v228EffectiveDynamicCategoryOrder(cfg).slice();
  try{return v228RenderDynamicLibraryBase.apply(this,arguments);}
  finally{
    const current=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
    current.categoryOrder=saved.slice();
    current.dynamicCategoryOrderMode='category';
  }
};

const v228SelectDynamicCategoryBase=v181SelectDynamicCategory;
v181SelectDynamicCategory=function(id){
  const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  if(cfg.dynamicCategoryOrderMode!=='category')return v228SelectDynamicCategoryBase.apply(this,arguments);
  const visible=v228EffectiveDynamicCategoryOrder(cfg).filter(x=>!(cfg.hiddenCategoryIds||[]).includes(String(x)));
  if(!visible.includes(String(id)))return;
  cfg.activeCategoryId=String(id);
  cfg.modifiedAt=Date.now();
  S.libPage=0;
  persistSettings();
  render();
};
App.v181SelectDynamicCategory=v181SelectDynamicCategory;

/* Library Overview's "Dynamic row" order should mean the order users
   actually see, including Follow Categories mode. */
const v228EffectiveOverviewOrderBase=v188EffectiveOverviewOrder;
v188EffectiveOverviewOrder=function(cfg){
  if(cfg?.orderMode==='dynamic'){
    const byId=new Set((S.categories||[]).map(c=>String(c.id)));
    return v228EffectiveDynamicCategoryOrder().filter(id=>byId.has(String(id)));
  }
  return v228EffectiveOverviewOrderBase.apply(this,arguments);
};

/* ---------- Backup / sync audit metadata ----------------------
   The setting itself already rides inside S.settings.v181Library, so cloud
   merge/verification, Sync Now, Full Backup, Automatic Backup and Settings
   Presets include it automatically. Extend the backup manifest too so an
   exported backup explicitly reports the new order-source preference. */
const v228BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v228BackupManifestBase.apply(this,arguments);
  const cfg=v181NormalizeLibrarySettings(state?.settings?.v181Library,state?.categories||[]);
  manifest.includes=Object.assign({},manifest.includes||{}, {dynamicLibraryCategoryOrderMode:true});
  manifest.v181Library=Object.assign({},manifest.v181Library||{}, {
    dynamicCategoryOrderMode:cfg.dynamicCategoryOrderMode,
    dynamicCategoryIcons:cfg.dynamicCategoryIcons
  });
  return manifest;
};

/* Repaint already-mounted Library pills with the v228 icon rules. */
function v228RefreshLibraryMetadataIcons(){
  try{v226RefreshSemanticButtonIcons(document);}catch(_){ }
}
requestAnimationFrame(v228RefreshLibraryMetadataIcons);

Object.assign(App,{
  v228SetDynamicCategoryOrderMode,
  v228DynamicCategoryDragStart,
  v228DynamicCategoryDragEnd,
  v228DynamicCategoryDragOver,
  v228DynamicCategoryDragLeave,
  v228DynamicCategoryDrop,
  v228EffectiveDynamicCategoryOrder,
  v228RefreshLibraryMetadataIcons
});

v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
MediaFlowRuntime.version=V228_RUNTIME_VERSION;
