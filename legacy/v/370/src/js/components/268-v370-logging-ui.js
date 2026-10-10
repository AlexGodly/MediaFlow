/* MediaFlow v370 — responsive Logging UI 2.0.
 * Pure rendering and preference changes; canonical log/XP/History remain v369.
 */
const V370_RELEASE=370;
const V370_ICONS={
  list:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h8M9 13h8M9 17h8"/><path d="m6.5 9 .5.5 1-1M6.5 13 .5.5 1-1"/>',
  quick:'<path d="m13 2-9 11h7l-1 9 10-12h-7l1-8Z"/>',
  add:'<circle cx="12" cy="12" r="9"/><path d="M12 7v10M7 12h10"/>',
  repeat:'<path d="m17 2 4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3"/>',
  remove:'<path d="M3 6h18M8 6V4h8v2M5 6l1 15h12l1-15M10 10v7M14 10v7"/>',
  clear:'<path d="M4 6h14M4 11h11M4 16h8M17 15l5 5M22 15l-5 5"/>',
  collapse:'<path d="m6 15 6-6 6 6"/>',
  expand:'<path d="m6 9 6 6 6-6"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  shield:'<path d="M12 2 4 6v6c0 5 3 8 8 10 5-2 8-5 8-10V6l-8-4Z"/><path d="m9 12 2 2 4-4"/>'
};
function v370Icon(name,size=16){return '<svg class="v370-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="'+size+'" height="'+size+'" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(V370_ICONS[name]||V370_ICONS.list)+'</svg>';}
v369RenderInterfaceControl=function(){
  const itemized=S.logDraft?.v369Interface==='itemized';
  return '<section class="v369-interface v370-interface"><div class="v370-interface-copy"><strong>Logging interface</strong><small>'+(itemized?'Record individual units with timestamps and runtimes.':'Log by amount consumed or last progress.')+'</small></div><div class="v369-switch v370-mode-switch">'+
    '<button type="button" class="btn btn-sm v370-icon-btn '+(itemized?'active':'')+'" aria-pressed="'+itemized+'" onclick="App.v369SwitchInterface(\'itemized\')">'+v370Icon('list')+'<span>Per unit</span><span class="v369-recommended">Recommended</span></button>'+ 
    '<button type="button" class="btn btn-sm v370-icon-btn '+(!itemized?'active':'')+'" aria-pressed="'+(!itemized)+'" onclick="App.v369SwitchInterface(\'quick\')">'+v370Icon('quick')+'<span>Quick logging</span></button></div></section>';
};
App.v369SetDefaultInterface=function(value){
  S.settings=S.settings||{};
  S.settings.v369Logging={defaultInterface:value==='quick'?'quick':'itemized'};
  persistSettings();render();
  showToast('Default interface: '+(value==='quick'?'Quick logging':'Per unit'));
};
// Keep all other v181 cover-size controls intact. The new surface is an
// independent, portable setting inside the existing cloud/Settings Preset object.
V181_COVER_SIZE_DEFAULTS.v370Itemized=100;
V181_COVER_LABELS.v370Itemized='Per unit Logging · Title covers';
v181EnsureCoverSizes(DEFAULT_SETTINGS);
v181EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);
function v370CoverWidth(){return Math.max(36,Math.min(300,Math.round(74*v181CoverSize('v370Itemized')/100)));}
function v370ApplyCoverSize(){
  document.documentElement.style.setProperty('--v370-cover-size',v370CoverWidth()+'px');
}
const v370PreviewCoverBase=App.v181PreviewCoverSize;
App.v181PreviewCoverSize=function(kind,value){
  const out=v370PreviewCoverBase.apply(this,arguments);
  if(kind==='v370Itemized')document.documentElement.style.setProperty('--v370-cover-size',Math.max(36,Math.min(300,Math.round(74*v181ClampCoverSize(value,100)/100)))+'px');
  return out;
};
const v370SetCoverBase=App.v181SetCoverSize;
App.v181SetCoverSize=function(kind,value){const out=v370SetCoverBase.apply(this,arguments);if(kind==='v370Itemized')v370ApplyCoverSize();return out;};
const v370ResetCoversBase=App.v181ResetCoverSizes;
App.v181ResetCoverSizes=function(){const out=v370ResetCoversBase.apply(this,arguments);v370ApplyCoverSize();return out;};
const v370ApplyCoversBase=v181ApplyCoverVars;
v181ApplyCoverVars=function(){const out=v370ApplyCoversBase.apply(this,arguments);v370ApplyCoverSize();return out;};
v370ApplyCoverSize();
function v370CoverHtml(item){
  const cat=getCategory(item.categoryId);
  const fallback='<span class="v370-cover-fallback">'+(cat?v144CategoryIconHtml(cat):v370Icon('list',24))+'<small>Missing cover</small></span>';
  const url=typeof v274CoverUrl==='function'?v274CoverUrl(item):String(item.coverUrl||'');
  if(!url||!/^https?:\/\//i.test(url))return '<div class="v370-title-cover is-missing">'+fallback+'</div>';
  return '<div class="v370-title-cover"><img src="'+escapeHtml(url)+'" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="v370-cover-fallback" hidden>'+(cat?v144CategoryIconHtml(cat):v370Icon('list',24))+'<small>Missing cover</small></span></div>';
}
function v370TitleMeta(item){
  const cat=getCategory(item.categoryId),status=typeof v274StatusLabel==='function'?v274StatusLabel(item.status):String(item.status||'planned'),priority=String(item.priority||'medium');
  return '<div class="v370-title-tags"><span class="v370-tag v370-status" data-status="'+escapeHtml(String(item.status||'planned'))+'">'+escapeHtml(status)+'</span>'+ 
    '<span class="v370-tag v370-category">'+(cat?v144CategoryIconHtml(cat):'')+escapeHtml(cat?.name||'Uncategorized')+'</span>'+ 
    '<span class="v370-tag v370-priority" data-priority="'+escapeHtml(priority)+'">'+escapeHtml(priority.slice(0,1).toUpperCase()+priority.slice(1))+' priority</span></div>';
}
function v370UnitHtml(e,index,unit,pos,item,seasons,noun){
  const season=seasons.find(s=>String(s.id)===String(unit.seasonId));
  const seasonName=unit.seasonName||season?.name||'';
  const hasSeasons=seasons.length>0;
  const seasonField=hasSeasons?'<label class="v370-unit-season">Season<select aria-label="Season for this '+escapeHtml(noun.toLowerCase())+'" onchange="App.v369EditUnit('+index+','+pos+',\'season\',this.value)">'+seasons.map(s=>'<option value="'+escapeHtml(String(s.id))+'" '+(String(s.id)===String(unit.seasonId)?'selected':'')+'>'+escapeHtml(s.name||'Season '+s.number)+'</option>').join('')+'</select></label>':'';
  return '<article class="v369-unit v370-unit" data-unit-id="'+escapeHtml(String(unit.id))+'">'+
    '<div class="v370-unit-top"><strong>'+escapeHtml(noun)+' '+Number(unit.number)+'</strong>'+(unit.isRepeat?'<span class="v370-unit-repeat-state">'+v370Icon('repeat',13)+'Repeat</span>':'')+
    '<span class="v370-unit-time">'+v370Icon('clock',13)+v369Hms(v369Seconds(unit))+'</span></div>'+ 
    '<div class="v370-unit-grid">'+seasonField+
    '<label class="v370-unit-number">'+escapeHtml(noun)+' #<input type="number" min="1" max="999999" step="1" value="'+Number(unit.number)+'" onchange="App.v369EditUnit('+index+','+pos+',\'number\',this.value)"></label>'+ 
    '<label class="v370-unit-date">Logged at<input type="datetime-local" step="1" value="'+v369DateTimeValue(unit.loggedAt)+'" aria-label="Recorded date and time" onchange="App.v369EditUnit('+index+','+pos+',\'time\',this.value)"></label>'+ 
    '<div class="v370-unit-runtime"><span class="v370-group-label">Runtime</span>'+v369DurationInputs(index,pos,unit)+'</div></div>'+ 
    '<div class="v370-unit-actions"><button type="button" class="btn btn-sm v370-icon-btn '+(unit.isRepeat?'active':'')+'" aria-pressed="'+!!unit.isRepeat+'" onclick="App.v369ToggleUnitRepeat('+index+','+pos+')">'+v370Icon('repeat')+(unit.isRepeat?'Repeat logged':'Mark repeat')+'</button>'+ 
    '<button type="button" class="btn btn-sm btn-ghost v370-icon-btn v370-remove-unit" onclick="App.v369RemoveUnit('+index+','+pos+')">'+v370Icon('remove')+'Remove</button></div></article>';
}
v369PanelsHtml=function(){
  const entries=S.logDraft?.entries||[];
  return '<div class="v369-panels v370-panels">'+entries.map((e,index)=>{
    const item=v369ItemTitle(e);if(!item)return '';
    const units=Array.isArray(e.v369Units)?e.v369Units:[];
    const seasons=typeof v252Seasons==='function'?v252Seasons(item):[];
    const season=v369SelectedSeason(e,item),noun=v369UnitType(item);
    const next=Number(e.v369NextNumber)||v369NextNumber(e,item);
    const visible=e.v369ShowAll?units:units.slice(-40);
    const select=seasons.length?'<label class="v370-next-season">Season<select onchange="App.v369SelectSeason('+index+',this.value)">'+seasons.map(s=>'<option value="'+escapeHtml(String(s.id))+'" '+(String(s.id)===String(season?.id)?'selected':'')+'>'+escapeHtml(String(s.name||'Season '+s.number))+'</option>').join('')+'</select></label>':'';
    return '<section class="v369-title v370-title" data-v369-title="'+index+'">'+
      '<header class="v370-title-head">'+v370CoverHtml(item)+'<div class="v370-title-info"><h3>'+escapeHtml(cleanTitle(item.title))+'</h3>'+v370TitleMeta(item)+
      '<div class="v370-title-stats">'+units.length+' '+escapeHtml(noun.toLowerCase())+(units.length===1?'':'s')+' in draft <span aria-hidden="true">·</span> '+v369Hms(units.reduce((sum,u)=>sum+v369Seconds(u),0))+'</div></div>'+ 
      '<div class="v370-title-actions"><button type="button" class="btn btn-sm v370-icon-btn" aria-expanded="'+!e.v369Collapsed+'" onclick="App.v369ToggleTitle('+index+')">'+v370Icon(e.v369Collapsed?'expand':'collapse')+(e.v369Collapsed?'Expand':'Collapse')+'</button>'+ 
      '<button type="button" class="btn btn-sm btn-ghost v370-icon-btn v370-remove-title" onclick="App.removeLogEntry('+index+')">'+v370Icon('remove')+'Remove title</button></div></header>'+ 
      (e.v369Collapsed?'':'<div class="v370-title-content"><div class="v369-unit-list v370-unit-list">'+visible.map(u=>v370UnitHtml(e,index,u,units.indexOf(u),item,seasons,noun)).join('')+'</div>'+ 
      (units.length>40?'<button type="button" class="btn btn-sm v370-show-all" onclick="App.v369ToggleAll('+index+')">'+(e.v369ShowAll?'Show recent 40':'Show all '+units.length+' entries')+'</button>':'')+
      '<div class="v369-add-row v370-add-row"><div class="v370-add-title">'+v370Icon('add')+'<strong>Log another '+escapeHtml(noun.toLowerCase())+'</strong></div><div class="v370-add-controls">'+select+
      '<label class="v370-next-number">'+escapeHtml(noun)+' number<input type="number" min="1" max="999999" step="1" value="'+next+'" oninput="App.v369SetNext('+index+',this.value)"></label>'+ 
      '<button type="button" class="btn btn-primary btn-sm v370-icon-btn" onclick="App.v369AddUnit('+index+')">'+v370Icon('add')+'Log '+escapeHtml(noun)+'</button>'+ 
      '<button type="button" class="btn btn-sm v370-icon-btn" onclick="App.v369AddUnit('+index+',true)">'+v370Icon('repeat')+'Log rewatch / reread</button></div></div></div>')+'</section>';
  }).join('')+'</div>';
};
function v370TotalsHtml(){
  const items=S.logDraft?.entries||[],count=items.reduce((n,e)=>n+(e.v369Units?.length||0),0);
  return '<section class="v370-auto-totals" aria-label="Automatically calculated logging totals"><div><span>Units logged</span><strong data-v370-count>'+count+'</strong></div><div><span>Consumption time</span><strong data-v370-duration>'+v369Hms(v369TotalSeconds())+'</strong></div></section>';
}
function v370UpdateTotals(){
  const c=document.querySelector('[data-v370-count]'),d=document.querySelector('[data-v370-duration]');
  if(c)c.textContent=(S.logDraft?.entries||[]).reduce((n,e)=>n+(e.v369Units?.length||0),0);
  if(d)d.textContent=v369Hms(v369TotalSeconds());
}
const v370RefreshBase=v369RefreshPanels;
v369RefreshPanels=function(){const out=v370RefreshBase.apply(this,arguments);v370UpdateTotals();return out;};
const v370RenderBase=renderLogForm;
renderLogForm=function(){
  const raw=String(v370RenderBase.apply(this,arguments)||'');
  try{
    const host=document.createElement('div');host.innerHTML=raw;
    const form=host.querySelector('.log-form');if(!form)return raw;
    form.classList.add('v370-logging');
    // v369 inserts panels after #log-suggestions, which is nested in the
    // collapsible Library picker. Always move them OUTSIDE <details> or the
    // selected titles disappear whenever the Library section is collapsed.
    const activePanels=form.querySelector('.v370-panels');
    const libraryPicker=form.querySelector('details.v238-log-library');
    if(activePanels && libraryPicker)libraryPicker.insertAdjacentElement('afterend',activePanels);
    const selected=S.logDraft?.entries?.length||0;
    const bar=document.createElement('div');bar.className='v370-logging-actions';
    bar.innerHTML='<span class="v370-selected-count">'+selected+' title'+(selected===1?'':'s')+' selected</span><button type="button" class="btn btn-sm v370-icon-btn v370-clear-btn" '+(!selected?'disabled':'')+' onclick="App.v370ConfirmClearTitles()">'+v370Icon('clear')+'Clear all titles</button>';
    const mode=form.querySelector('.v369-interface');(mode||form).insertAdjacentElement(mode?'afterend':'afterbegin',bar);
    if(S.logDraft?.v369Interface==='itemized'){
      // The new compact session counter replaces the older duplicate
      // 'WHAT YOU LOGGED' and 'Use as amount' summaries in Per unit only.
      form.querySelector('.v238-logged-section-head')?.remove();
      form.querySelector('button[onclick*="syncAmountFromEntries"]')?.parentElement?.remove();
      const input=form.querySelector('#log-amount'),row=input?.closest('.field-row');
      if(row){row.classList.add('v370-hidden-legacy-totals');row.insertAdjacentHTML('afterend',v370TotalsHtml());}
    }else{
      // The existing Quick Logging actions retain their original handlers.
      for(const button of form.querySelectorAll('button')){
        if(/^Remove(?: title)?$/i.test(button.textContent.trim())&&!button.querySelector('svg')){
          button.classList.add('v370-icon-btn');
          button.insertAdjacentHTML('afterbegin',v370Icon('remove'));
        }
      }
    }
    return host.innerHTML;
  }catch(err){console.warn('v370 logging UI fallback',err);return raw;}
};
App.v370ConfirmClearTitles=async function(){
  const draft=S.logDraft,entries=draft?.entries||[];
  if(!entries.length)return;
  const count=entries.length;
  const message='Remove '+count+' added title'+(count===1?'':'s')+' and all their unsaved logging entries? Saved Library data, History and XP will not be changed. This cannot be undone.';
  const accept=typeof v336Confirm==='function'
    ?await v336Confirm(message,{title:'Clear all added titles?',confirmText:'Clear titles',cancelText:'Keep titles',tone:'warning'})
    :await (typeof v279Confirm==='function'?v279Confirm('Clear all added titles?',message,'Clear titles',true):Promise.resolve(false));
  if(!accept||S.logDraft!==draft)return;
  if(draft.v369Interface==='itemized'){
    draft.v369DeletedTitles=draft.v369DeletedTitles||{};
    for(const e of draft.entries)if(e.libraryId)draft.v369DeletedTitles[String(e.libraryId)]=Date.now();
  }
  draft.entries=[];
  S.entryDraft={title:'',qty:1,libraryId:null};
  if(draft.v369Interface==='itemized')v369Sync();
  else {draft.amount=0;draft.minutes=0;if(typeof v179SyncSingleFromEntries==='function')v179SyncSingleFromEntries();}
  v369Touch();render();showToast(count+' added title'+(count===1?'':'s')+' cleared.');
};
// The v369 settings control is registered as a dynamic section, so replace its
// visual content in the same render pipeline while retaining the registered ID.
const v370SettingsRender=V219_PAGE_RENDERERS.get('settings');
if(typeof v370SettingsRender==='function'){
  const old=v370SettingsRender;
  MediaFlowRuntime.registerPageRenderer('settings',function(ctx){
    const raw=String(old.call(this,ctx)||'');
    try{
      const host=document.createElement('div');host.innerHTML=raw;
      const section=host.querySelector('[data-setting="v369-default-interface"]');
      if(!section)return raw;
      const container=section.querySelector('.v369-settings-choice');
      if(container){const current=v369DefaultInterface();container.classList.add('v370-settings-modes');container.innerHTML=
        '<button type="button" class="btn v370-icon-btn '+(current==='itemized'?'active':'')+'" onclick="App.v369SetDefaultInterface(\'itemized\')">'+v370Icon('list')+'Per unit <span class="v369-recommended">Recommended</span></button>'+ 
        '<button type="button" class="btn v370-icon-btn '+(current==='quick'?'active':'')+'" onclick="App.v369SetDefaultInterface(\'quick\')">'+v370Icon('quick')+'Quick logging</button>';}
      return host.innerHTML;
    }catch(_){return raw;}
  });
}
if(typeof v366RegisterSetting==='function')v366RegisterSetting({
  id:'v370-itemized-cover-size',section:'cover-size-adjustment',selector:'#v181-cover-range-v370Itemized',
  label:'Per unit Logging title cover size',subgroup:'Covers & Artwork',keywords:['per unit','logging','cover','title','size','mobile','artwork']
});
const v370Style=document.createElement('style');v370Style.id='v370-logging-style';
v370Style.textContent=/*css*/`
.v370-icon{flex:none;display:inline-block;vertical-align:-.16em}.v370-icon-btn{display:inline-flex!important;align-items:center;justify-content:center;gap:7px;min-width:0}
.v370-logging{min-width:0}.v370-interface{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;background:var(--panel-raised,var(--surface));border-color:var(--border-soft,var(--border))}
.v370-interface-copy strong{font-size:13px}.v370-interface-copy small{font-size:12px}.v370-mode-switch{align-items:center}.v370-mode-switch button{white-space:normal;text-align:center;min-height:38px}.v370-mode-switch button>span:first-of-type{white-space:nowrap}
.v370-logging-actions{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:-4px 0 14px;padding:0 2px}.v370-selected-count{font-size:12px;color:var(--text-dim)}.v370-clear-btn{color:var(--overused,var(--text-dim));border:1px solid var(--border-soft,var(--border))}.v370-clear-btn:disabled{opacity:.5}
.v370-panels{gap:14px;margin:16px 0}.v370-title{padding:0;overflow:hidden;background:var(--panel-raised,var(--surface));border:1px solid var(--border-soft,var(--border));box-shadow:0 4px 16px rgba(0,0,0,.035)}
.v370-title-head{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:14px;padding:15px;align-items:center}.v370-title-cover{position:relative;width:var(--v370-cover-size,74px);min-width:36px;aspect-ratio:2/3;border:1px solid var(--border-soft,var(--border));border-radius:9px;overflow:hidden;display:grid;place-items:center;background:var(--panel,var(--surface));color:var(--text-dim)}
.v370-title-cover img{width:100%;height:100%;object-fit:cover;display:block}.v370-cover-fallback{display:grid;place-items:center;gap:5px;text-align:center;padding:4px;min-width:0;width:100%}.v370-cover-fallback[hidden]{display:none!important}.v370-cover-fallback .v144-cat-icon-img{max-width:32px;max-height:32px;object-fit:contain}.v370-cover-fallback small{font-size:9px;opacity:.78}
.v370-title-info{min-width:0}.v370-title-info h3{font-size:15px;line-height:1.35;margin:0 0 8px;overflow-wrap:anywhere}.v370-title-tags{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px}.v370-tag{display:inline-flex;align-items:center;gap:5px;max-width:100%;padding:4px 7px;border-radius:7px;background:var(--panel,var(--surface));border:1px solid var(--border-soft,var(--border));font-size:11px;line-height:1.2}.v370-tag img{width:15px;height:15px;object-fit:contain}.v370-priority[data-priority=high]{color:var(--overused,var(--flow))}.v370-status[data-status=completed]{color:#4da3ff}.v370-title-stats{font-size:12px;color:var(--text-dim);font-variant-numeric:tabular-nums}.v370-title-actions{display:grid;justify-items:end;gap:7px}.v370-title-actions .btn{max-width:100%;white-space:nowrap}
.v370-title-content{border-top:1px solid var(--border-soft,var(--border));padding:12px 15px 15px}.v370-unit-list{display:grid;gap:9px;margin:0 0 12px}.v370-unit{display:grid;gap:10px;margin:0;padding:12px;border-radius:10px;border:1px solid var(--border-soft,var(--border));background:var(--panel,var(--surface));min-width:0}
.v370-unit-top{display:flex;align-items:center;gap:8px;min-width:0}.v370-unit-top strong{font-size:13px}.v370-unit-time{margin-left:auto;color:var(--text-dim);font-size:12px;display:inline-flex;align-items:center;gap:5px;font-variant-numeric:tabular-nums}.v370-unit-repeat-state{display:inline-flex;gap:4px;align-items:center;font-size:11px;color:var(--flow)}
.v370-unit-grid{display:grid;grid-template-columns:minmax(90px,.5fr) minmax(210px,1.2fr) minmax(230px,1.2fr);gap:9px;align-items:end;min-width:0}.v370-unit-grid:has(.v370-unit-season){grid-template-columns:minmax(105px,.7fr) minmax(85px,.55fr) minmax(205px,1.1fr) minmax(230px,1.25fr)}
.v370-unit-grid label,.v370-add-controls label{display:grid;gap:5px;font-size:11px;color:var(--text-dim);min-width:0}.v370-unit-grid input,.v370-unit-grid select,.v370-add-controls input,.v370-add-controls select{display:block;width:100%;max-width:none;min-width:0;box-sizing:border-box;height:39px;font-size:13px}
.v370-unit-runtime{display:grid;gap:5px;min-width:0}.v370-group-label{font-size:11px;color:var(--text-dim)}.v370-unit-runtime .v369-duration{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.v370-unit-runtime .v369-duration label{width:auto;min-width:0}.v370-unit-runtime .v369-duration input{width:100%;max-width:none;text-align:center;font-variant-numeric:tabular-nums}
.v370-unit-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap}.v370-unit-actions .btn{min-height:33px}.v370-remove-unit,.v370-remove-title{color:var(--text-dim)}
.v370-add-row{display:grid;gap:10px;margin:14px 0 0;padding:13px;border:1px dashed var(--border-soft,var(--border));border-radius:10px;background:var(--panel-raised,var(--surface));min-width:0}.v370-add-title{display:flex;align-items:center;gap:7px;font-size:13px}.v370-add-controls{display:flex;align-items:end;flex-wrap:wrap;gap:8px}.v370-next-number{width:100px}.v370-next-season{min-width:140px;max-width:240px}.v370-add-controls .btn{min-height:39px}.v370-show-all{margin:4px 0}
.v370-hidden-legacy-totals{display:none!important}.v370-auto-totals{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:10px 0 14px}.v370-auto-totals>div{display:grid;gap:4px;padding:12px 14px;border:1px solid var(--border-soft,var(--border));border-radius:11px;background:var(--panel-raised,var(--surface))}.v370-auto-totals span{font-size:11px;color:var(--text-dim)}.v370-auto-totals strong{font-size:17px;font-variant-numeric:tabular-nums}
.v370-logging input,.v370-logging select{min-width:0}.v370-settings-modes .btn{min-height:38px}
@media(max-width:1050px){.v370-unit-grid,.v370-unit-grid:has(.v370-unit-season){grid-template-columns:minmax(80px,.7fr) minmax(170px,1.3fr);gap:9px}.v370-unit-runtime{grid-column:1/-1}.v370-unit-season{grid-column:auto}.v370-unit-actions{justify-content:flex-start}}
@media(max-width:720px){.v370-interface{grid-template-columns:1fr}.v370-logging .v179-log-mode-switch{flex-wrap:wrap}.v370-title-head{grid-template-columns:auto minmax(0,1fr);gap:11px;padding:12px}.v370-title-cover{width:min(var(--v370-cover-size,74px),clamp(68px,22vw,110px))}.v370-title-actions{grid-column:1/-1;display:flex;align-items:center;justify-content:flex-end;gap:7px}.v370-title-content{padding:10px}.v370-title-info h3{font-size:14px}.v370-unit-grid,.v370-unit-grid:has(.v370-unit-season){grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px}.v370-unit-date,.v370-unit-runtime{grid-column:1/-1}.v370-unit-runtime .v369-duration{grid-template-columns:repeat(3,minmax(0,1fr))}.v370-add-controls{display:grid;grid-template-columns:minmax(0,100px) minmax(0,1fr);gap:8px}.v370-next-season{grid-column:1/-1;max-width:none}.v370-add-controls .btn{white-space:normal}.v370-add-controls .btn:last-child{grid-column:1/-1}.v370-logging .log-form .field-row{min-width:0}.v370-mode-switch{width:100%}.v370-mode-switch button{flex:1}.v370-logging .hero-actions{display:flex;flex-wrap:wrap}}
@media(max-width:400px){.v370-mode-switch button{gap:4px;padding:7px 6px;font-size:11px;flex-wrap:wrap}.v370-mode-switch .v369-recommended{font-size:9px}.v370-title-head{gap:9px}.v370-title-tags{gap:4px}.v370-tag{font-size:10px;padding:3px 5px}.v370-title-stats{font-size:11px}.v370-unit{padding:10px}.v370-unit-top{flex-wrap:wrap}.v370-unit-actions .btn{flex:1;white-space:normal}.v370-logging-actions{flex-wrap:wrap}.v370-logging-actions button{margin-left:auto}.v370-logging #entry-title{width:100%;min-width:0}.v370-add-controls{grid-template-columns:minmax(0,94px) minmax(0,1fr)}}
`;
document.head.appendChild(v370Style);
// Clear action is already attached directly to App above.
window.MediaFlowV370={version:370,feature:'responsive logging UI',defaultInterface:'itemized'};
MediaFlowRuntime.version=V370_RELEASE;
