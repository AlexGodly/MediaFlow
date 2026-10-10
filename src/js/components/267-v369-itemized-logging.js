/* MediaFlow v369 WIP — itemized Dashboard logging foundation.
 * Loaded AFTER v368, before the closing app wrapper.
 * Each item lives in the canonical v285 resumable logDraft entry.
 * No XP, Library progress or History write occurs until submitLog.
 */
const V369_RELEASE = 369;
DEFAULT_SETTINGS.v369Logging = {defaultInterface:'itemized'};
function v369DefaultInterface(){
  return S.settings?.v369Logging?.defaultInterface==='quick'?'quick':'itemized';
}
function v369Touch(){
  try{v285TouchLogging(S.logging===true,false);}catch(err){console.warn('v369 draft cache unavailable',err);}
}
function v369ItemTitle(entry){
  const id=String(entry?.libraryId||'');
  if(!id)return null;
  if(typeof v156EnsureOrderIndexes==='function'){
    try{
      const found=v156EnsureOrderIndexes()?.libraryById?.get(id);
      if(found)return found;
    }catch(_){}
  }
  return (S.library||[]).find(x=>String(x?.id||'')===id)||null;
}
function v369UnitType(item){
  const u=String(getCategory(item?.categoryId)?.unit||'').toLowerCase();
  return /chapter/.test(u)?'Chapter':/issue/.test(u)?'Issue':/volume/.test(u)?'Volume':/book/.test(u)?'Book':'Episode';
}
function v369ValidStamp(value){
  const n=Number(value);
  return Number.isFinite(n)&&n>=946684800000&&n<=Date.now()+300000?n:0;
}
function v369DateTimeValue(value){
  const d=new Date(v369ValidStamp(value)||Date.now());
  const pad=x=>String(x).padStart(2,'0');
  return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds());
}
function v369Seconds(unit){
  if(Number.isFinite(Number(unit?.durationSeconds)))return Math.max(0,Math.floor(Number(unit.durationSeconds)));
  return Math.max(0,Math.round((Number(unit?.minutes)||0)*60));
}
function v369DefaultSeconds(item){
  const cat=getCategory(item?.categoryId||'');
  if(Number.isFinite(Number(cat?.secondsPerUnit)))return Math.max(0,Math.floor(Number(cat.secondsPerUnit)));
  return Math.max(0,Math.round((Number(cat?.minutesPerUnit)||0)*60));
}
function v369TotalSeconds(){
  return (S.logDraft?.entries||[]).reduce((total,e)=>total+(e.v369Units||[]).reduce((t,u)=>t+v369Seconds(u),0),0);
}
function v369Hms(seconds){
  const t=Math.max(0,Math.floor(seconds)||0);
  const p=x=>String(x).padStart(2,'0');
  return p(Math.floor(t/3600))+':'+p(Math.floor(t%3600/60))+':'+p(t%60);
}
function v369DurationInputs(index,pos,unit){
  const t=v369Seconds(unit),v=[Math.floor(t/3600),Math.floor(t%3600/60),t%60];
  return '<div class="v369-duration" aria-label="Individual runtime">'+['Hours','Minutes','Seconds'].map((label,i)=>
    '<label>'+label+' <input type="number" min="0" max="'+(i===0?'9999':'59')+'" step="1" aria-label="'+label+' for this entry" value="'+v[i]+'" onchange="App.v369EditUnit('+index+','+pos+',\'duration-'+i+'\',this.value)"></label>'
  ).join('')+'</div>';
}
// Advance confirmed Library progress only through a contiguous run of
// specifically logged unit numbers. A gap may still count as consumed in
// History/XP, but never fabricates an unseen intermediate episode.
function v369ContiguousProgress(start,units,seasonId=null,limit=null){
  const current=Math.max(0,Math.floor(Number(start)||0));
  const relevant=new Set((units||[]).filter(u=>String(u?.seasonId||'')===String(seasonId||''))
    .map(u=>Math.floor(Number(u.number)||0)).filter(n=>n>current));
  const max=Number(limit)>0?Math.max(current,Math.floor(Number(limit))):Number.MAX_SAFE_INTEGER;
  let end=current;
  while(end<max && relevant.has(end+1))end++;
  return end;
}
function v369ProjectedTitleProgress(item,entry){
  const start=Math.max(0,Number(item?.progress)||0);
  if(entry?.isRepeat)return start;
  const units=Array.isArray(entry?.v369Units)?entry.v369Units:[];
  const seasons=typeof v252Seasons==='function'?v252Seasons(item):[];
  if(!seasons.length)return v369ContiguousProgress(start,units,null,item?.total);
  return seasons.reduce((total,s)=>total+v369ContiguousProgress(s.progress,units,s.id,s.total),0);
}
function v369Sync(){
  const entries=S.logDraft?.entries||[];
  for(const e of entries){
    if(!Array.isArray(e.v369Units))continue;
    e.qty=e.v369Units.length;
    const item=v369ItemTitle(e);
    e.v179EndProgress=item?v369ProjectedTitleProgress(item,e):Math.max(0,Number(e.v179StartProgress)||0)+e.qty;
  }
  if(typeof v179SyncSingleFromEntries==='function')v179SyncSingleFromEntries();
  // The canonical XP engine expects minutes. Individual timestamps and
  // duration remain exact in integer seconds for History and data transfer.
  S.logDraft.v369DurationSeconds=v369TotalSeconds();
  S.logDraft.minutes=S.logDraft.v369DurationSeconds/60;
}
function v369NextNumber(entry,item){
  const season=v369SelectedSeason(entry,item);
  const units=Array.isArray(entry.v369Units)?entry.v369Units:[];
  const relevant=units.filter(x=>String(x.seasonId||'')===String(season?.id||''));
  const last=relevant.length?Number(relevant[relevant.length-1].number)||0:0;
  const base=season?Number(season.progress)||0:Number(item?.progress)||0;
  return Math.max(1,last+1,base+1);
}
function v369SelectedSeason(entry,item){
  if(!item||typeof v252Seasons!=='function')return null;
  return v252Seasons(item).find(x=>String(x.id)===String(entry.v369SelectedSeasonId||''))||v252Seasons(item)[0]||null;
}
function v369PanelsHtml(){
  const entries=S.logDraft?.entries||[];
  return '<div class="v369-panels">'+entries.map((e,idx)=>{
    const item=v369ItemTitle(e);
    if(!item)return '';
    const units=Array.isArray(e.v369Units)?e.v369Units:[];
    const season=v369SelectedSeason(e,item);
    const seasons=typeof v252Seasons==='function'?v252Seasons(item):[];
    const noun=v369UnitType(item),next=Number(e.v369NextNumber)||v369NextNumber(e,item);
    const visible=e.v369ShowAll?units:units.slice(-40);
    const seasonChoices=seasons.length?'<label>Season <select aria-label="Season for next entry" onchange="App.v369SelectSeason('+idx+',this.value)">'+seasons.map(s=>'<option value="'+escapeHtml(String(s.id))+'" '+(String(s.id)===String(season?.id)?'selected':'')+'>'+escapeHtml(String(s.name||'Season '+s.number))+'</option>').join('')+'</select></label>':'';
    return '<section class="v369-title" data-v369-title="'+idx+'">'+
      '<div class="v369-title-head"><strong>'+escapeHtml(cleanTitle(item.title))+'</strong><small>'+units.length+' '+escapeHtml(noun.toLowerCase())+(units.length===1?'':'s')+' in draft · '+v369Hms(units.reduce((n,u)=>n+v369Seconds(u),0))+'</small><button type="button" class="btn btn-sm btn-ghost" onclick="App.removeLogEntry('+idx+')">Remove title</button></div>'+
      '<div class="v369-unit-list">'+visible.map((u)=>{
        const pos=units.indexOf(u);
        const unitName=u.seasonName?escapeHtml(u.seasonName)+' · ':'';
        return '<div class="v369-unit" data-unit-id="'+escapeHtml(String(u.id))+'">'+
          '<span class="v369-unit-name">'+unitName+escapeHtml(noun)+' '+Number(u.number)+'</span>'+
          '<label>Logged at <input type="datetime-local" aria-label="Timestamp for '+escapeHtml(noun)+' '+Number(u.number)+'" step="1" value="'+v369DateTimeValue(u.loggedAt)+'" onchange="App.v369EditUnit('+idx+','+pos+',\'time\',this.value)"></label>'+
          v369DurationInputs(idx,pos,u)+
          '<button type="button" class="btn btn-sm btn-ghost" onclick="App.v369RemoveUnit('+idx+','+pos+')" aria-label="Remove '+escapeHtml(noun)+' '+Number(u.number)+'">Remove</button>'+
          '</div>';
      }).join('')+'</div>'+
      (units.length>40?'<button type="button" class="btn btn-sm" onclick="App.v369ToggleAll('+idx+')">'+(e.v369ShowAll?'Show recent 40':'Show all '+units.length)+'</button>':'')+
      '<div class="v369-add-row">'+seasonChoices+'<label>'+escapeHtml(noun)+' number <input type="number" min="1" max="999999" value="'+next+'" oninput="App.v369SetNext('+idx+',this.value)"></label>'+
      '<button type="button" class="btn btn-primary btn-sm" onclick="App.v369AddUnit('+idx+')">+ Log '+escapeHtml(noun)+'</button></div>'+
      '</section>';
  }).join('')+'</div>';
}
function v369RefreshPanels(){
  const root=document.querySelector('.v369-panels');
  if(root)root.outerHTML=v369PanelsHtml();
  try{refreshXPPreview();}catch(_){}
}
function v369RenderInterfaceControl(){
  const itemized=S.logDraft?.v369Interface==='itemized';
  return '<div class="v369-interface"><div><strong>Logging interface</strong><small>Choose how to record this session. '+(itemized?'Each unit captures its own timestamp and runtime. Total '+v369Hms(v369TotalSeconds())+'.':'Original Amount Consumed / Last Progress logging.')+'</small></div><div class="v369-switch">'+
    '<button type="button" class="btn btn-sm '+(itemized?'active':'')+'" onclick="App.v369SwitchInterface(\'itemized\')">Per episode / chapter / issue <span class="v369-recommended">Recommended</span></button>'+
    '<button type="button" class="btn btn-sm '+(!itemized?'active':'')+'" onclick="App.v369SwitchInterface(\'quick\')">Quick logging</button></div></div>';
}
const v369OpenBase=App.openLogForm;
App.openLogForm=function(){
  const r=v369OpenBase.apply(this,arguments);
  S.logDraft=S.logDraft||{};
  S.logDraft.v369Interface=v369DefaultInterface();
  if(!S.logDraft.v369CommitId)S.logDraft.v369CommitId=uid();
  if(S.logDraft.v369Interface==='itemized')S.logDraft.v179Mode='amount';
  v369Touch();render();return r;
};
const v369AddBase=App.addLogEntry;
App.addLogEntry=function(){
  if(S.logDraft?.v369Interface!=='itemized')return v369AddBase.apply(this,arguments);
  const id=String(S.entryDraft?.libraryId||'');
  const typed=String(S.entryDraft?.title||'').trim().toLowerCase();
  const item=(id?S.library.find(x=>String(x.id)===id):null)||
    (typed?S.library.find(x=>cleanTitle(x.title).toLowerCase()===typed&&x.status!=='dropped'):null);
  if(!item){showToast('Select a title from your Library for itemized logging.');return;}
  if((S.logDraft.entries||[]).some(e=>String(e.libraryId)===String(item.id))){
    showToast('This title is already in your session. Open it to log another unit.');return;
  }
  const repeat=typeof v179IsComplete==='function'?v179IsComplete(item):false;
  const start=typeof v179StartProgress==='function'?v179StartProgress(item):Number(item.progress)||0;
  S.logDraft.entries=S.logDraft.entries||[];
  S.logDraft.entries.push({title:cleanTitle(item.title),libraryId:item.id,qty:0,
    isRepeat:repeat,isNew:false,loggedAt:Date.now(),v179StartProgress:start,
    v179EndProgress:start,v369Units:[],v369SelectedSeasonId:''});
  S.entryDraft={title:'',qty:1,libraryId:null};
  v369Sync();v369Touch();render();
};
function v369SwitchInterface(value){
  const mode=value==='quick'?'quick':'itemized';
  if((S.logDraft?.entries||[]).length){
    showToast('Remove session titles before changing the interface; this protects unfinished entries.');
    return;
  }
  S.logDraft.v369Interface=mode;
  S.logDraft.v179Mode=mode==='itemized'?'amount':v181DefaultLoggingMode();
  v369Touch();render();
}
function v369SetDefaultInterface(value){
  S.settings=S.settings||{};
  S.settings.v369Logging={defaultInterface:value==='quick'?'quick':'itemized'};
  persistSettings();render();
  showToast(S.settings.v369Logging.defaultInterface==='itemized'
    ?'Default interface: Per episode / chapter / issue':'Default interface: Quick logging');
}
function v369SelectSeason(index,id){
  const e=S.logDraft?.entries?.[index],item=v369ItemTitle(e);
  if(!e||!item||!v252Seasons(item).some(x=>String(x.id)===String(id)))return;
  e.v369SelectedSeasonId=String(id);delete e.v369NextNumber;
  v369Touch();v369RefreshPanels();
}
function v369SetNext(index,value){
  const e=S.logDraft?.entries?.[index];if(!e)return;
  e.v369NextNumber=Math.max(1,Math.min(999999,Math.floor(Number(value)||1)));
  v369Touch();
}
function v369AddUnit(index){
  const e=S.logDraft?.entries?.[index],item=v369ItemTitle(e);
  if(!e||!item)return;
  const season=v369SelectedSeason(e,item),number=Math.floor(Number(e.v369NextNumber)||v369NextNumber(e,item));
  if(number<1||number>999999||season&&Number(season.total)>0&&number>Number(season.total)){
    showToast('Enter a valid episode/chapter/issue number for this title.');return;
  }
  e.v369Units=e.v369Units||[];
  // Existing season/title progress represents confirmed consumption. A
  // partially completed title's earlier episodes need explicit repeat handling;
  // do not silently award new progress for them.
  if(!e.isRepeat && number<=Math.max(0,Number(season?season.progress:item.progress)||0)){
    showToast('That unit is already within saved progress. Rewatch handling for partially completed titles is not enabled yet.');
    return;
  }
  if(e.v369Units.some(x=>String(x.seasonId||'')===String(season?.id||'')&&Number(x.number)===number)){
    showToast('That unit is already in this draft.');return;
  }
  const timestamp=Date.now();
  e.v369Units.push({id:uid(),number,seasonId:season?String(season.id):null,
    seasonName:season?String(season.name||''):null,
    seasonNumber:season?season.number:null,loggedAt:timestamp,durationSeconds:v369DefaultSeconds(item)});
  e.v369NextNumber=number+1;
  v369Sync();v369Touch();v369RefreshPanels();
}
function v369RemoveUnit(index,pos){
  const e=S.logDraft?.entries?.[index];if(!Array.isArray(e?.v369Units)||!e.v369Units[pos])return;
  e.v369Units.splice(pos,1);
  v369Sync();v369Touch();v369RefreshPanels();
}
function v369EditUnit(index,pos,key,value){
  const e=S.logDraft?.entries?.[index],u=e?.v369Units?.[pos];if(!u)return;
  if(/^duration-[012]$/.test(key)){
    const which=Number(key.slice(-1)),t=v369Seconds(u);
    const parts=[Math.floor(t/3600),Math.floor(t%3600/60),t%60];
    parts[which]=Math.max(0,Math.min(which===0?9999:59,Math.floor(Number(value)||0)));
    u.durationSeconds=parts[0]*3600+parts[1]*60+parts[2];
    delete u.minutes;
    v369Sync();
  }
  if(key==='minutes'){u.durationSeconds=Math.max(0,Math.round((Number(value)||0)*60));delete u.minutes;v369Sync();}
  if(key==='time'){
    const parsed=new Date(String(value||''));
    const time=parsed.getTime();
    if(!v369ValidStamp(time)){showToast('Choose a valid past date/time.');v369RefreshPanels();return;}
    u.loggedAt=time;
  }
  v369Touch();v369RefreshPanels();
}
function v369ToggleAll(index){
  const e=S.logDraft?.entries?.[index];if(!e)return;
  e.v369ShowAll=!e.v369ShowAll;v369Touch();v369RefreshPanels();
}
const v369RenderLogBase=renderLogForm;
renderLogForm=function(){
  const raw=String(v369RenderLogBase.apply(this,arguments)||'');
  if(!S.logDraft)return raw;
  try{
    const host=document.createElement('div');host.innerHTML=raw;
    const form=host.querySelector('.log-form');if(!form)return raw;
    form.insertAdjacentHTML('afterbegin',v369RenderInterfaceControl());
    if(S.logDraft.v369Interface==='itemized'){
      form.classList.add('v369-itemized');
      const suggestions=form.querySelector('#log-suggestions');
      if(suggestions)suggestions.insertAdjacentHTML('afterend',v369PanelsHtml());
      const amount=form.querySelector('#log-amount');
      if(amount)amount.readOnly=true;
    }
    return host.innerHTML;
  }catch(err){console.warn('v369 logging renderer fallback',err);return raw;}
};
const v369SubmitBase=App.submitLog;
App.submitLog=function(){
  if(S.logDraft?.v369Interface!=='itemized')return v369SubmitBase.apply(this,arguments);
  const all=(S.logDraft.entries||[]);
  if(!all.length||all.some(e=>!Array.isArray(e.v369Units)||e.v369Units.length===0)){
    showToast('Log at least one unit for every selected title before saving.');return;
  }
  for(const e of all){
    if(!v369ItemTitle(e)){showToast('A selected Library title is missing.');return;}
    if(e.v369Units.some(u=>!v369ValidStamp(u.loggedAt)||!(Number(u.number)>0))){
      showToast('Correct invalid unit timestamps or numbers before saving.');return;
    }
  }
  // Verify that every selected season still belongs to the current title.
  // A restored draft must never remap unknown seasons to Season 1.
  for(const e of all){
    const item=v369ItemTitle(e),valid=new Set((typeof v252Seasons==='function'?v252Seasons(item):[]).map(s=>String(s.id)));
    if(e.v369Units.some(u=>valid.size ? !valid.has(String(u.seasonId||'')) : !!u.seasonId)){
      showToast('A logged season no longer matches the Library title. Restore its season before saving.');
      return;
    }
  }
  // Same logical session cannot award XP again following a double click,
  // retry, or restore of an already-committed local draft.
  if(!S.logDraft.v369CommitId)S.logDraft.v369CommitId=uid();
  const commitId=String(S.logDraft.v369CommitId);
  if((S.sessions||[]).some(x=>String(x?.sessionGroupId||x?.v369CommitId||'')===commitId && (x?.v369Itemized||x?.v369CommitId))){
    showToast('This itemized session was already saved. It will not award duplicate XP.');
    return;
  }
  v369Sync();
  const baseLibrary=new Map(all.map(e=>{
    const item=v369ItemTitle(e);
    return [String(item.id),{
      item, status:String(item.status||''), progress:Number(item.progress)||0,
      seasons:typeof v252Seasons==='function'?v252Seasons(item):[]
    }];
  }));
  const before=new Set((S.sessions||[]).map(x=>String(x.id)));
  const captured=new Map(all.map(e=>[String(e.libraryId),{
    units:e.v369Units.map(u=>({...u})),repeat:!!e.isRepeat
  }]));
  const result=v369SubmitBase.apply(this,arguments);
  if(S.logging===true)return result; // The underlying validation refused submission.
  let changed=false;
  for(const session of S.sessions||[]){
    if(before.has(String(session.id)))continue;
    let exactSeconds=0;
    for(const title of session.titles||[]){
      const data=captured.get(String(title.libraryId));
      if(!data)continue;
      title.v369Units=data.units;
      title.v369DurationSeconds=data.units.reduce((n,u)=>n+v369Seconds(u),0);
      title.v369Itemized=true;
      title.loggedAt=Math.min(...data.units.map(x=>Number(x.loggedAt)));
      exactSeconds+=title.v369DurationSeconds;
      changed=true;
    }
    if((session.titles||[]).some(t=>t.v369Itemized)){
      session.v369DurationSeconds=exactSeconds;
      session.minutes=exactSeconds/60;
      // Calculate category rewards from this category's actual recorded
      // durations rather than the legacy qty-weight allocation.
      const category=getCategory(session.categoryId);
      if(category && typeof calculateConsumptionXP==='function'){
        session.xp=calculateConsumptionXP(category,Number(session.actualAmount)||0,
          session.minutes,session.healthStatus).xp;
      }
    }
  }
  // The legacy v252 submit wrapper distributes aggregate progress starting at
  // the first season. Restore the correct per-season counts using the exact
  // season IDs captured from this itemized draft.
  let libraryChanged=false;
  for(const [id,base] of baseLibrary){
    const row=captured.get(id);
    if(!row||row.repeat)continue;
    if(!base.seasons.length){
      const progress=v369ContiguousProgress(base.progress,row.units,null,base.item.total);
      if(base.item.progress!==progress){
        base.item.progress=progress;
        if(base.item.status==='completed'&&Number(base.item.total)>progress)base.item.status='active';
        base.item.modifiedAt=Date.now();
        libraryChanged=true;
      }
      continue;
    }
    for(const season of base.seasons){
      season.progress=v369ContiguousProgress(season.progress,row.units,season.id,season.total);
    }
    base.item.seasons=base.seasons;
    v252SyncTitleFromSeasons(base.item);
    base.item.modifiedAt=Date.now();
    libraryChanged=true;
  }
  if(libraryChanged){
    try{v53InvalidateLibraryCache();}catch(_){}
    persistLibrary();
  }
  if(changed){
    try{if(typeof v334InvalidateXP==='function')v334InvalidateXP();}catch(_){}
    persistSessions();
  }
  return result;
};
const v369SettingsRenderer=V219_PAGE_RENDERERS.get('settings');
if(typeof v369SettingsRenderer==='function'){
  MediaFlowRuntime.registerPageRenderer('settings',function(ctx){
    const raw=String(v369SettingsRenderer.call(this,ctx)||'');
    try{
      const host=document.createElement('div');host.innerHTML=raw;
      const label=[...host.querySelectorAll('.section-label')].find(x=>/LOGGING METHOD/i.test(x.textContent||''));
      if(!label)return raw;
      const current=v369DefaultInterface();
      label.insertAdjacentHTML('afterend','<div class="v369-settings-control" data-setting="v369-default-interface"><div class="field-label"><strong>Default Logging Interface</strong></div><p class="hint">Used when opening a new Dashboard logging session; does not change Amount Consumed / Last Progress.</p><div class="v369-settings-choice"><button type="button" class="btn '+(current==='itemized'?'active':'')+'" onclick="App.v369SetDefaultInterface(\'itemized\')">Per Episode / Chapter / Issue · Recommended</button><button type="button" class="btn '+(current==='quick'?'active':'')+'" onclick="App.v369SetDefaultInterface(\'quick\')">Quick Logging</button></div></div>');
      return host.innerHTML;
    }catch(_){return raw;}
  });
}
if(typeof v366RegisterSetting==='function')v366RegisterSetting({
  id:'v369-default-interface',section:'v221-settings-default-logging-method',
  selector:'[data-setting="v369-default-interface"]',label:'Default Logging Interface',
  subgroup:'Title logging',keywords:['per episode','chapter','issue','itemized','quick','logging default','recommended']
});
if(typeof v221ResetDescriptorForControl==='function'){
  const base=v221ResetDescriptorForControl;
  v221ResetDescriptorForControl=function(el){
    if(String(el?.getAttribute?.('onclick')||'').includes('App.v369SetDefaultInterface'))return {type:'path',path:'v369Logging.defaultInterface'};
    return base.apply(this,arguments);
  };
}
if(typeof v221SectionResetPlan==='function'){
  const base=v221SectionResetPlan;
  v221SectionResetPlan=function(title){
    if(String(title||'').trim().toUpperCase()==='DEFAULT LOGGING METHOD')return {kind:'paths',paths:['v181Logging','v369Logging']};
    return base.apply(this,arguments);
  };
}
const style=document.createElement('style');
style.id='v369-logging-style';
style.textContent='.v369-interface{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:14px;border:1px solid var(--border);border-radius:12px;margin:0 0 16px}.v369-interface small,.v369-title-head small{display:block;color:var(--text-dim);margin-top:4px}.v369-switch,.v369-settings-choice{display:flex;flex-wrap:wrap;gap:8px}.v369-recommended{font-size:10px;color:var(--flow)}.v369-itemized .v179-log-mode-switch,.v369-itemized .v239-logged-title-list,.v369-itemized #entry-qty{display:none!important}.v369-panels{display:grid;gap:12px;margin:12px 0}.v369-title{border:1px solid var(--border);border-radius:12px;padding:14px}.v369-title-head,.v369-add-row,.v369-unit{display:flex;flex-wrap:wrap;align-items:center;gap:10px}.v369-title-head strong{flex:1}.v369-unit-list{display:grid;gap:8px;margin:12px 0}.v369-unit{background:var(--surface-2,var(--surface));border-radius:8px;padding:8px}.v369-unit-name{font-weight:600;flex:1;min-width:100px}.v369-unit label,.v369-add-row label{font-size:12px;display:grid;gap:4px}.v369-unit input,.v369-add-row input,.v369-add-row select{max-width:190px}.v369-duration{display:flex;gap:6px;flex-wrap:wrap}.v369-duration label{width:76px}.v369-duration input{width:76px}.v369-history-units{border-top:1px solid var(--border);padding:8px 10px;font-size:12px}.v369-history-units summary{cursor:pointer;color:var(--text-dim);font-weight:600}.v369-history-unit-list{display:grid;gap:6px;margin-top:8px}.v369-history-unit{display:grid;grid-template-columns:minmax(0,1fr) auto auto;align-items:center;gap:8px;padding:8px;border-radius:8px;background:var(--surface-2,var(--surface))}.v369-history-unit strong{font-variant-numeric:tabular-nums}@media(max-width:600px){.v369-history-unit{grid-template-columns:1fr auto}.v369-history-unit span{grid-column:1/-1;grid-row:2}}.v369-add-row{margin-top:12px}.v369-settings-control{padding:12px;border:1px solid var(--border);border-radius:10px;margin:10px 0}@media(max-width:600px){.v369-unit label{width:100%}.v369-add-row label{flex:1}.v369-settings-choice button{width:100%}}';
document.head.appendChild(style);
Object.assign(App,{v369SetDefaultInterface,v369SwitchInterface,v369SelectSeason,v369SetNext,
  v369AddUnit,v369RemoveUnit,v369EditUnit,v369ToggleAll});
window.MediaFlowV369={version:369,stage:'itemized logging foundation',defaultInterface:'itemized'};
MediaFlowRuntime.version=V369_RELEASE;
