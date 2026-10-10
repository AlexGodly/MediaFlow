/* MediaFlow v355 — Personal Order UI consistency and screenshot regression repair.
 * All changes are presentation-only. Canonical queue operations, settings order,
 * Collection assignment, XP, cloud storage, and import/export remain unchanged.
 */
const V355_RELEASE=355;

// Display-only search for the Category Display dialog. Keep the configured
// category order and visibility actions, without altering stored data.
function v355FilterCategoryDisplay(query, input){
  const host=input?.closest('.mf354-sheet-body');
  if(!host)return;
  const needle=String(query||'').trim().toLocaleLowerCase();
  let shown=0;
  for(const row of host.querySelectorAll('.v138-category-manager .v138-category-control')){
    const label=row.querySelector('.v138-category-control-name')?.textContent||'';
    row.hidden=!!needle&&!label.toLocaleLowerCase().includes(needle);
    if(!row.hidden)shown++;
  }
  const message=host.querySelector('.mf355-no-categories');
  if(message)message.hidden=shown!==0;
}
const v355OpenSheetBase=v354OpenSheet;
function v355OpenSheet(kind){
  v355OpenSheetBase(kind);
  const sheet=document.querySelector('.mf354-sheet-backdrop .mf354-sheet');
  if(!sheet)return;
  sheet.classList.add('mf355-personal-order-sheet');
  sheet.dataset.kind=kind;
  const body=sheet.querySelector('.mf354-sheet-body');
  if(kind==='categories'&&body){
    const manager=body.querySelector('.v138-category-manager');
    if(manager){
      const controls=document.createElement('div');
      controls.className='mf355-category-search';
      controls.innerHTML='<label for="mf355-category-query">Find a category</label><input id="mf355-category-query" type="search" autocomplete="off" placeholder="Search categories…" oninput="App.v355FilterCategoryDisplay(this.value,this)"><span class="mf355-no-categories" hidden>No matching categories.</span>';
      manager.before(controls);
    }
  }
}
App.v354OpenSheet=v355OpenSheet;
App.v355FilterCategoryDisplay=v355FilterCategoryDisplay;

// Suppress auto-generated generic action icons in the quick view navigation.
// This prevents the doubled circular chevrons shown in the v354 screenshots.
const v355IconNameBase=v225ButtonIconName;
v225ButtonIconName=function(el){
  if(el?.matches?.('.mf354-quick-switch .btn,.mf354-category-trigger,.mf354-cat-option'))return null;
  return v355IconNameBase.apply(this,arguments);
};
MediaFlowRuntime.version=V355_RELEASE;
window.MediaFlowV355={version:355,features:['Theme-aware Personal Order refinements','Readable Add Title and Add Collection dialogs','Searchable Category Display dialog','Deduplicated desktop quick navigation','Improved queue tabs and mobile controls']};
