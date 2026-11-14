/* MediaFlow v353 — mobile-only, independently collapsible Add Titles tools.
   The indexed search/filter/selection/pagination paths remain unchanged. */
const V353_PICKER_PANELS={filters:false,display:false};
function v353PickerToggle(which){
  if(which!=='filters'&&which!=='display')return;
  V353_PICKER_PANELS[which]=!V353_PICKER_PANELS[which];
  const modal=document.getElementById('mf274-add-titles');if(!modal)return;
  const tools=modal.querySelector('.mf274-add-tools');
  const settings=modal.querySelector('.mf352-picker-settings');
  const isFilters=which==='filters';const target=isFilters?tools:settings;
  if(!target)return;
  const key=isFilters?'mf353-filters':'mf353-display';
  target.classList.toggle(key+'-open',V353_PICKER_PANELS[which]);
  target.classList.toggle(key+'-closed',!V353_PICKER_PANELS[which]);
  const control=target.querySelector(isFilters?'.mf353-filter-toggle':'.mf353-display-toggle');
  if(control){
    control.setAttribute('aria-expanded',String(V353_PICKER_PANELS[which]));
    const state=control.querySelector('.mf353-toggle-word');
    if(state)state.textContent=V353_PICKER_PANELS[which]?'Hide':'Show';
  }
  // Very short phone viewports cannot comfortably show both expanded panels
  // and the title list at once. Keep each independently accessible, but close
  // the other on these short screens to preserve useful browsing space.
  if(V353_PICKER_PANELS[which]&&window.matchMedia('(max-height:700px)').matches){
    const other=which==='filters'?'display':'filters';
    if(V353_PICKER_PANELS[other])v353PickerToggle(other);
  }
}
const v353PickerBodyBase=v274AddModalBody;
v274AddModalBody=function(c){
  let html=v353PickerBodyBase(c);
  const filtersOpen=V353_PICKER_PANELS.filters;
  const displayOpen=V353_PICKER_PANELS.display;
  html=html.replace('<div class="mf274-add-tools">',`<div class="mf274-add-tools mf353-filters-${filtersOpen?'open':'closed'}">`);
  // Search stays directly accessible. All other original filter controls remain
  // in their native DOM and retain their original event handlers.
  html=html.replace(/(<input id="mf276-add-search"[^>]*>)/,
    `$1<button type="button" class="mf353-mobile-toggle mf353-filter-toggle" aria-controls="mf353-filter-fields" aria-expanded="${filtersOpen}" onclick="App.v353PickerToggle('filters')"><span>Filters</span><span class="mf353-toggle-word">${filtersOpen?'Hide':'Show'}</span><span aria-hidden="true" class="mf353-chevron">⌄</span></button><div id="mf353-filter-fields" class="mf353-filter-fields">`);
  // Finish the filter wrapper just before the v352 display settings section.
  // display:contents on desktop preserves the original grid exactly.
  html=html.replace('</div><section class="mf352-picker-settings"','</div></div><section class="mf352-picker-settings"');
  html=html.replace('<section class="mf352-picker-settings"',`<section class="mf352-picker-settings mf353-display-${displayOpen?'open':'closed'}"`);
  html=html.replace('<div class="mf352-display-header"><b>Display</b><span>Choose how Library titles appear in this picker</span></div>',
    `<div class="mf352-display-header"><b>Display</b><span>Choose how Library titles appear in this picker</span><button type="button" class="mf353-mobile-toggle mf353-display-toggle" aria-controls="mf353-display-adjusters" aria-expanded="${displayOpen}" onclick="App.v353PickerToggle('display')"><span>Display tools</span><span class="mf353-toggle-word">${displayOpen?'Hide':'Show'}</span><span aria-hidden="true" class="mf353-chevron">⌄</span></button></div>`);
  html=html.replace('<div class="mf352-adjusters">','<div class="mf352-adjusters" id="mf353-display-adjusters">');
  // The filter group preserves existing handlers; only mobile layout changes.
  return html;
};
const v353PickerOpenBase=v274OpenAddTitles;
v274OpenAddTitles=function(id){
  V353_PICKER_PANELS.filters=false;
  V353_PICKER_PANELS.display=false;
  return v353PickerOpenBase.apply(this,arguments);
};
Object.assign(App,{v274OpenAddTitles,v353PickerToggle});
window.MediaFlowV353={version:353,focus:'mobile Collection Add Titles filters and display tools; more visible title results'};
