/* MediaFlow v399 — picker workspace refinements. All add/save operations remain
 * the original Personal Order and Collection workflows; no new data schema. */
const V399_RELEASE=399;
const V399_NARROW=window.matchMedia('(max-width:1023px)');
const V399_PAGE_MIN=1,V399_PAGE_MAX=1000;
function v399PageNumber(value, fallback=50){
  if(String(value??'').trim()==='')return fallback;
  const n=Number(value);
  return Number.isSafeInteger(n)&&n>=V399_PAGE_MIN&&n<=V399_PAGE_MAX?n:fallback;
}
/* Personal Order's existing v359 persistence, pager and quick-action handlers
 * are reused; only the title page-size vocabulary is now numeric. */
const v399PriorValidate=v359ValidPageSize;
v359ValidPageSize=function(value,fallback=50){return v399PageNumber(value,fallback);};
const v399PriorPageHtml=v359PageSizeSelect;
v359PageSizeSelect=function(kind){
  if(kind!=='titles')return v399PriorPageHtml.apply(this,arguments);
  return `<label class="mf359-page-size-field mf399-title-page-field"><span>Titles per page</span><input type="number" inputmode="numeric" min="1" max="1000" step="1" aria-label="Titles per page" value="${v359PagePrefs().titles}" onchange="App.v399TitlePageSize(this)" onkeydown="if(event.key==='Enter')this.blur()"></label>`;
};
function v399TitlePageSize(input){
  const n=v399PageNumber(input?.value,0);
  if(!n){if(input){input.setCustomValidity('Enter a whole number from 1 to 1000');input.reportValidity();}return;}
  input?.setCustomValidity('');
  const prefs=v359PagePrefs();
  if(prefs.titles===n)return;
  prefs.titles=n;
  v359SavePrefs();
  const ui=v140EnsureOrderPickerUI();ui.page=0;
  try{v141InvalidateOrderPickerCache();}catch(_){ }
  v141RefreshOrderPickerPageOnly();
  document.querySelector('.mf359-title-sheet #v138-order-picker-results')?.scrollTo?.({top:0});
}
function v399AnchorMove(el,slot){
  if(!el||!slot||el.parentElement===slot)return;
  if(!el._mf399Anchor){const anchor=document.createComment('v399 original tool placement');el.before(anchor);el._mf399Anchor=anchor;}
  slot.appendChild(el);
}
function v399AnchorRestore(el){
  const anchor=el?._mf399Anchor;
  if(anchor?.isConnected&&anchor.parentElement!==el.parentElement)anchor.after(el);
}
/* No cloning: the original sliders and numeric input keep their live event
 * handlers, focus semantics and settings persistence across resized windows. */
function v399TitleMobileTools(){
  const sheet=document.querySelector('.mf354-sheet-backdrop .mf359-title-sheet');if(!sheet || sheet.classList.contains('mf400-order-workspace'))return;
  const disclosure=sheet.querySelector('.mf356-title-filters');
  const sizes=sheet.querySelector('.mf358-size-controls');
  const paging=sheet.querySelector('.mf399-title-page-field');
  if(!disclosure||!sizes||!paging)return;
  let area=disclosure.querySelector(':scope > .mf399-title-mobile-settings');
  if(!area){area=document.createElement('section');area.className='mf399-title-mobile-settings';area.innerHTML='<b>Picker display</b><div class="mf399-title-size-slot"></div><div class="mf399-title-page-slot"></div>';disclosure.append(area);}
  if(V399_NARROW.matches){
    v399AnchorMove(sizes,area.querySelector('.mf399-title-size-slot'));
    v399AnchorMove(paging,area.querySelector('.mf399-title-page-slot'));
    sheet.classList.add('mf399-title-tools-mobile');
  }else{
    v399AnchorRestore(sizes);v399AnchorRestore(paging);
    sheet.classList.remove('mf399-title-tools-mobile');
  }
}
const v399OpenSheetBase=App.v354OpenSheet;
App.v354OpenSheet=function(kind){
  const result=v399OpenSheetBase.apply(this,arguments);
  if(kind==='title')v399TitleMobileTools();
  return result;
};
try{V399_NARROW.addEventListener('change',v399TitleMobileTools);}catch(_){ }

/* Collection → Add Titles: configurable page length based on the same indexed
 * search/pick paths used by v276/v392; selections are never cleared. */
function v399CollectionPageSize(){
  return v399PageNumber(S.settings?.v399CollectionAddPageSize,24);
}
function v399SetCollectionPageSize(input){
  const n=v399PageNumber(input?.value,0);
  if(!n){input?.setCustomValidity('Enter a whole number from 1 to 1000');input?.reportValidity();return;}
  input?.setCustomValidity('');
  if(v399CollectionPageSize()===n)return;
  (S.settings||(S.settings={})).v399CollectionAddPageSize=n;
  v274AddState().page=0;
  v352PickerSaveSoon();
  v392UpdateCollectionPicker();
}
v276AddData=function(c){
  const s=v274AddState(),rows=v274AddCandidates(c),pageSize=v399CollectionPageSize();
  const pages=Math.max(1,Math.ceil(rows.length/pageSize));
  s.page=Math.max(0,Math.min(Number(s.page)||0,pages-1));
  return {s,rows,pages,shown:rows.slice(s.page*pageSize,(s.page+1)*pageSize),pageSize};
};
v274AddSelectVisible=function(){
  const c=v274CollectionById(V274_UI.activeId);if(!c)return;
  const data=v276AddData(c);
  data.shown.forEach(item=>data.s.picks.add(String(item.id)));
  v392RefreshCollectionResults();
};
let V399_COLLECTION_OPEN=false;
function v399CollectionToolsToggle(el){V399_COLLECTION_OPEN=!!el.open;}
const v399CollectionBodyBase=v274AddModalBody;
v274AddModalBody=function(c){
  const raw=String(v399CollectionBodyBase.apply(this,arguments));
  const host=document.createElement('div');host.innerHTML=raw;
  const old=host.querySelector('.mf274-add-tools');
  const search=old?.querySelector('#mf276-add-search');
  const fieldset=old?.querySelector('.mf353-filter-fields');
  const display=host.querySelector('.mf352-picker-settings');
  const add=host.querySelector('.mf392-picker-row');
  const results=host.querySelector('#mf276-add-results');
  const footer=host.querySelector('#mf276-add-footer');
  if(!old||!search||!fieldset||!display||!add||!results||!footer)return raw;
  const shell=document.createElement('section');shell.className='mf399-collection-shell';
  const sidebar=document.createElement('aside');sidebar.className='mf399-collection-sidebar';
  const searchBox=document.createElement('div');searchBox.className='mf399-collection-search';searchBox.append(search);sidebar.append(searchBox);
  const details=document.createElement('details');details.className='mf399-collection-tools';
  details.open=!V399_NARROW.matches||V399_COLLECTION_OPEN;
  details.setAttribute('ontoggle','App.v399CollectionToolsToggle(this)');
  details.innerHTML='<summary>Tools & Filters <span aria-hidden="true">⌄</span></summary>';
  const contents=document.createElement('div');contents.className='mf399-collection-tool-content';
  const pageWrap=document.createElement('label');pageWrap.className='mf399-collection-page-size';
  pageWrap.innerHTML=`<span>Titles per page</span><input type="number" inputmode="numeric" min="1" max="1000" step="1" aria-label="Collection Add Titles per page" value="${v399CollectionPageSize()}" onchange="App.v399SetCollectionPageSize(this)" onkeydown="if(event.key==='Enter')this.blur()">`;
  fieldset.removeAttribute('id');fieldset.classList.remove('mf353-filter-fields');fieldset.classList.add('mf399-collection-filters');
  display.classList.remove('mf353-display-open','mf353-display-closed');
  const obsolete=display.querySelector('.mf353-display-toggle');if(obsolete)obsolete.remove();
  contents.append(pageWrap,add,display,fieldset);details.append(contents);sidebar.append(details);
  const main=document.createElement('div');main.className='mf399-collection-main';main.append(results,footer);
  shell.append(sidebar,main);return shell.outerHTML;
};
const v399CollectionOpenBase=v274OpenAddTitles;
v274OpenAddTitles=function(id){V399_COLLECTION_OPEN=false;return v399CollectionOpenBase.apply(this,arguments);};
/* Correct native selection change doesn't modify the collection browser unless
 * a valid value is selected. Results paging is calculated by v359 unchanged. */
Object.assign(App,{v399TitlePageSize,v399SetCollectionPageSize,v399CollectionToolsToggle});
MediaFlowRuntime.version=V399_RELEASE;
window.MediaFlowV399={version:399,features:['Personal Order title numeric pagination','Mobile/tablet title sizing controls inside filters','Collection title numeric pagination','Unified Collection picker tool surface','Existing canonical selection and persistence preserved']};
