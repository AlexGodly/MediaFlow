/* MediaFlow v407 — clean, single-icon bulk action dropdowns.
 * Shared rendering applies to Library Normal, Library Dynamic, and Collections.
 * Preserve the v406 membership filters, canonical Set Category/Status/Priority
 * order/visibility, and original action handlers. No data-schema changes. */
const V407_RELEASE=407;

// v225/v226 decorate *every* button, which accidentally added a generic
// circle-arrow to options already displaying their own semantic icon.
// Opt these specific picker choices out of both icon-enhancement passes.
const v407IconNameBase=v225ButtonIconName;
v225ButtonIconName=function(el){
  if(el?.matches?.('.mf406-action-picker .mf406-picker-option'))return null;
  return v407IconNameBase(el);
};

// Reuse the v406 picker integration and handlers; render exactly one canonical
// icon per row. Category remains searchable. Status and Priority are compact
// ordered lists without a search field.
v406PickerHtml=function(kind,scope){
  if(!['category','status','priority'].includes(kind))return '';
  if(!['library','collection'].includes(scope))return '';
  const title=kind==='category'?'Move to category':kind==='status'?'Set status':'Set priority';
  const summarySymbol=kind==='category'?'▦':kind==='status'?'◉':'⚑';
  const searchable=kind==='category';
  const items=v406ActionItems(kind); // canonical Settings order and visibility
  const options=items.map(item=>
    `<button type="button" class="mf406-picker-option mf407-picker-option" data-v225-iconified="1" role="option" data-v406-search="${escapeHtml(item.label.toLocaleLowerCase())}" data-v406-value="${escapeHtml(item.id)}" onclick="App.v406Choose(this)">`+
      `<span class="mf406-picker-icon mf407-option-icon" aria-hidden="true">${item.icon||summarySymbol}</span>`+
      `<span class="mf407-option-label">${escapeHtml(item.label)}</span>`+
    `</button>`).join('');
  const search=searchable?`<input type="search" autocomplete="off" aria-label="Search categories" placeholder="Search categories…" oninput="App.v406Search(this)">`:'';
  return `<details class="mf406-action-picker mf407-action-picker mf407-${kind}" data-v406-kind="${kind}" data-v406-scope="${scope}" ontoggle="App.v406Position(this)">`+
    `<summary aria-label="${title}"><span class="mf406-summary-symbol" aria-hidden="true">${summarySymbol}</span><span>${title}…</span><span aria-hidden="true">⌄</span></summary>`+
    `<div class="mf406-picker-panel mf407-picker-panel">${search}`+
      `<div class="mf406-picker-options" role="listbox" aria-label="${title} choices">${options}</div>`+
      `<div class="mf406-picker-empty" ${items.length?'hidden':''}>${items.length?'No matching categories.':'No visible options in Settings.'}</div>`+
    `</div></details>`;
};

MediaFlowRuntime.version=V407_RELEASE;
window.MediaFlowV407={
  version:V407_RELEASE,
  features:['Single semantic icon per action option','Left-aligned bulk action rows','Category-only search','Settings-based option order and visibility'],
  audit:()=>({version:V407_RELEASE,searchable:['category'],status:v406ActionItems('status').map(x=>x.id),priority:v406ActionItems('priority').map(x=>x.id),category:v406ActionItems('category').map(x=>x.id)})
};
