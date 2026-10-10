/* MediaFlow v356 — Unified Personal Order picker workspace.
 * Presentation-only: preserve canonical title/Collection pickers and handlers.
 * Reparent existing picker DOM controls; do not recreate or duplicate actions.
 */
const V356_RELEASE=356;
function v356ImproveOrderSheet(){
  const sheet=document.querySelector('.mf354-sheet-backdrop .mf355-personal-order-sheet');
  if(!sheet || sheet.dataset.mf356Ready==='1')return;
  const kind=sheet.dataset.kind;
  if(kind!=='title'&&kind!=='collection')return;
  const body=sheet.querySelector('.mf354-sheet-body');
  if(!body)return;
  const card=kind==='title'?body.querySelector(':scope > .card:not(.mf287-add-collection-card)'):body.querySelector(':scope > .mf287-add-collection-card');
  if(!card)return;
  sheet.dataset.mf356Ready='1';sheet.classList.add('mf356-browse-sheet',`mf356-${kind}-sheet`);
  card.classList.add('mf356-browse-card');
  if(kind==='title'){
    const tools=card.querySelector('#v140-order-picker-tools');
    if(tools){
      const disclosure=document.createElement('details');
      disclosure.className='mf356-title-filters';
      disclosure.innerHTML='<summary data-v225-iconified="1"><span class="mf356-summary-label">Filters & sorting</span><span class="mf356-summary-hint">Category, sort, status, priority</span><span class="mf356-chevron" aria-hidden="true">⌄</span></summary>';
      tools.before(disclosure);disclosure.appendChild(tools);
    }
    const result=card.querySelector('#v138-order-picker-results');
    if(result)result.setAttribute('role','region');
    if(result)result.setAttribute('aria-label','Available Library titles');
  } else {
    const controls=card.querySelector('.mf354-collection-filter-disclosure');
    if(controls){controls.open=false;controls.classList.add('mf356-collection-filters');}
    const help=card.querySelector('.mf287-picker-help');
    if(help)help.classList.add('mf356-picker-intro');
    const result=card.querySelector('#mf287-collection-results');
    if(result){result.setAttribute('role','region');result.setAttribute('aria-label','Available Collections');}
  }
}
const v356PreviousSheetOpen=App.v354OpenSheet;
App.v354OpenSheet=function(kind){
  const result=v356PreviousSheetOpen.apply(this,arguments);
  v356ImproveOrderSheet();
  // Avoid opening the software keyboard before the user chooses to search.
  if(window.matchMedia('(max-width: 1023px)').matches && document.activeElement?.closest?.('.mf356-browse-sheet'))document.activeElement.blur();
  return result;
};
MediaFlowRuntime.version=V356_RELEASE;
window.MediaFlowV356={version:356,features:['Compact Personal Order title picker','Collapsible desktop and mobile title filters','Improved collection dialog results area','Theme-aware readable picker rows','Preserved live canonical picker operations']};
