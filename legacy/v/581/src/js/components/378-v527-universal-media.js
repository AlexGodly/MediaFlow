/* MediaFlow v527 — Universal Media presentation and category-aware XP controls.
 * Internal sort keys, Library data, and saved category identifiers are unchanged.
 */
const V527_UNIVERSAL_VERSION=527;
const V527_ACTIVITY_TYPES=Object.freeze({video:'Watching',reading:'Reading',playing:'Playing',listening:'Listening'});
const V527_SORT_LABELS=Object.freeze({progress:'Consumed progress',total:'Total progress',remaining:'Remaining progress'});
const V527_NEW_UNITS=Object.freeze(['sessions','videos','pages','volumes','tracks','albums','levels','missions','matches','lessons','items']);
// The canonical sort arrays are the primary source; this repairs historical
// renderer overrides and legacy/picker HTML that are still active elsewhere.
for(const rows of [typeof V224_LIBRARY_SORT_OPTIONS==='undefined'?[]:V224_LIBRARY_SORT_OPTIONS,
                    typeof V373_SORTS==='undefined'?[]:V373_SORTS,
                    typeof V373_PICKER_SORTS==='undefined'?[]:V373_PICKER_SORTS]){
  for(const row of rows)if(V527_SORT_LABELS[row?.[0]])row[1]=V527_SORT_LABELS[row[0]];
}
function v527NormalizeSortSelect(select){
  if(!select?.options)return;
  const marker=String(select.id||'')+' '+String(select.getAttribute('aria-label')||'')+' '+String(select.getAttribute('data-v89-filter')||'');
  if(!/sort|order/i.test(marker)&&![...select.options].some(o=>/^(progress|total|remaining)$/.test(o.value)&&
      /episodes|chapters|watched\/read|current progress/i.test(o.textContent||'')))return;
  for(const option of select.options){
    const label=V527_SORT_LABELS[option.value];
    if(label&&option.textContent!==label)option.textContent=label;
  }
}
function v527AddUnitXPControls(root){
  if(!root?.querySelectorAll)return;
  // v528: never treat controls produced by this helper as original settings
  // fields. Without both guards the MutationObserver reinserts recursively.
  if(root.matches?.('.mf527-unit-xp')||root.closest?.('.mf527-unit-xp'))return;
  const inputs=[...root.querySelectorAll('input[onchange*="updateLevelingUnit"]')];
  if(!inputs.length)return;
  const anchor=inputs[inputs.length-1].closest('.field-row')||inputs[inputs.length-1].closest('.field');
  if(!anchor||anchor.closest?.('.mf527-unit-xp')||anchor.parentElement?.querySelector(':scope > .mf527-unit-xp'))return;
  const frame=document.createElement('div');
  frame.className='mf527-unit-xp';
  frame.setAttribute('aria-label','Additional media unit XP rates');
  const rates=levelingSettings().unitXP||{};
  frame.innerHTML='<div class="field-label" style="font-weight:700;margin:12px 0 7px">MORE UNIT XP RATES</div>'+
    '<div class="field-row" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:10px">'+
    V527_NEW_UNITS.map(unit=>'<div class="field"><label class="field-label" for="mf527-xp-'+unit+'">'+escapeHtml(UNITS[unit].label)+' XP</label>'+
    '<input id="mf527-xp-'+unit+'" type="number" min="0" step="1" value="'+Math.max(0,Number(rates[unit])||0)+'" onchange="App.updateLevelingUnit(\''+unit+'\',this.value)"></div>').join('')+
    '</div>';
  anchor.insertAdjacentElement('afterend',frame);
}
function v527EnhanceNode(root){
  if(!root||root.nodeType!==1)return;
  if(root.matches?.('select'))v527NormalizeSortSelect(root);
  root.querySelectorAll?.('select').forEach(v527NormalizeSortSelect);
  v527AddUnitXPControls(root);
}
function v527Start(){
  if(!document.body){document.addEventListener('DOMContentLoaded',v527Start,{once:true});return;}
  v527EnhanceNode(document.body);
  if(typeof MutationObserver==='function'){
    const observer=new MutationObserver(records=>{
      for(const record of records)for(const node of record.addedNodes||[])
        if(node.nodeType===1)v527EnhanceNode(node);
    });
    observer.observe(document.body,{childList:true,subtree:true});
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',v527Start,{once:true});
else v527Start();
window.MediaFlowV527=Object.freeze({
  version:V527_UNIVERSAL_VERSION,
  activityTypes:V527_ACTIVITY_TYPES,
  newUnits:V527_NEW_UNITS,
  sortLabels:V527_SORT_LABELS,
  inspect:()=>({categoryTypes:Object.keys(V527_ACTIVITY_TYPES),
    units:Object.keys(UNITS),sessionSortOptions:V373_SORTS.map(r=>[...r]),
    librarySortOptions:V224_LIBRARY_SORT_OPTIONS.map(r=>[...r]),
    newUnitRates:{...levelingSettings().unitXP}})
});
