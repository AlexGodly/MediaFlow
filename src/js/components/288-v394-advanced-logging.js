/* MediaFlow v394 — Advanced Logging (existing Per Unit + two synchronized views).
 * Canonical source of truth is STILL v369Units: method switching NEVER submits.
 * All mutations remain inside the existing v369 draft / submit pipeline.
 */
const V394_RELEASE=394;
const V394_METHODS=new Set(['unit','last','amount']);
function v394Entry(index){return S.logDraft?.entries?.[Number(index)]||null;}
function v394Method(e){return V394_METHODS.has(e?.v394Method)?e.v394Method:'unit';}
function v394Seasons(item){return typeof v252Seasons==='function'?v252Seasons(item):[];}
function v394Season(e,item){return v369SelectedSeason(e,item);}
function v394SameSeason(u,s){return String(u.seasonId||'')===String(s?.id||'');}
function v394Relevant(e,item){
  const season=v394Season(e,item);
  return {season,units:(e.v369Units||[]).filter(u=>v394SameSeason(u,season))};
}
function v394Base(e,item,season){
  return e.isRepeat?0:Math.max(0,Math.floor(Number(season?season.progress:item.progress)||0));
}
function v394ExactContiguous(units,base){
  const sorted=[...units].map(u=>Math.floor(Number(u.number)||0)).sort((a,b)=>a-b);
  return sorted.every((n,i)=>n===base+i+1);
}
function v394NumberLimit(season,item){return Math.max(0,Math.floor(Number(season?season.total:item.total)||0));}
function v394DefaultStamp(e){return v369ValidStamp(e.v394When)||v369ValidStamp(e.loggedAt)||Date.now();}
function v394StampInfo(e,units){
  if(!units.length)return {stamp:v394DefaultStamp(e),mixed:false};
  const first=Number(units[0].loggedAt);
  const mixed=units.some(u=>Number(u.loggedAt)!==first);
  return {stamp:mixed?null:first,mixed};
}
function v394RuntimeForEntry(e){
  const actual=(e.v369Units||[]).reduce((n,u)=>n+v369Seconds(u),0);
  if(e.v394RuntimeManual && (e.v369Units||[]).length){
    const total=Number(e.v394RuntimeSeconds);
    if(Number.isFinite(total)&&total>=0)return Math.round(total);
  }
  return actual;
}
// Runtime preview for other pages uses the same effective total as submission.
const v394TotalBase=v369TotalSeconds;
v369TotalSeconds=function(){
  if(S.logDraft?.v369Interface!=='itemized')return v394TotalBase();
  return (S.logDraft?.entries||[]).reduce((n,e)=>n+v394RuntimeForEntry(e),0);
};
function v394UnitNoun(item){return v369UnitType(item);}
function v394BulkPanel(e,index,item){
  const method=v394Method(e),{season,units}=v394Relevant(e,item),noun=v394UnitNoun(item);
  const all=e.v369Units||[],base=v394Base(e,item,season);
  const quantity=units.length;
  const highest=units.length?Math.max(...units.map(u=>Number(u.number)||0)):base;
  const exact=v394ExactContiguous(units,base);
  const hasOther=all.length!==units.length;
  const repeatMixed=units.some(u=>!!u.isRepeat!==!!e.isRepeat);
  const duration=v394RuntimeForEntry(e), manual=!!e.v394RuntimeManual;
  const bulkStamp=v400BulkStamp(e,method);
  const dateValue=v369DateTimeValue(bulkStamp);
  const opts=v394Seasons(item).map(s=>'<option value="'+escapeHtml(String(s.id))+'" '+(String(s.id)===String(season?.id)?'selected':'')+'>'+escapeHtml(String(s.name||'Season '+s.number))+'</option>').join('');
  const note=(!exact?'<p class="mf394-warning">Nonconsecutive '+escapeHtml(noun.toLowerCase())+'s are preserved. Changing this number will replace the selected season’s detailed entries after confirmation.</p>':'')+
    (repeatMixed?'<p class="mf394-warning">Mixed repeat/non-repeat entries are preserved until you explicitly replace them.</p>':'')+
    (hasOther?'<p class="mf394-hint">'+(all.length-units.length)+' draft units in other seasons are preserved. The summary below controls only the selected season.</p>':'');
  const label=method==='last'?noun+' Reached':unitLabel(getCategory(item.categoryId).unit,2)+' Consumed';
  const value=method==='last'?highest:quantity;
  return '<div class="mf394-bulk" aria-label="'+escapeHtml(method==='last'?'Progress Reached':'Amount Consumed')+' logging">'+
    (opts?'<label class="mf394-field">Season <select onchange="App.v394ChooseSeason('+index+',this.value)">'+opts+'</select></label>':'')+
    '<label class="mf394-field">'+escapeHtml(label)+'<input type="number" inputmode="numeric" min="'+(method==='last'?base:0)+'" max="999999" value="'+value+'" onchange="App.v394SetQuantity('+index+',this.value)"></label>'+
    '<div class="mf394-summary"><span>Saved '+escapeHtml(noun.toLowerCase())+' progress: <strong>'+base+'</strong></span><span>Draft amount: <strong>'+quantity+'</strong></span><span>Highest draft '+escapeHtml(noun.toLowerCase())+': <strong>'+highest+'</strong></span></div>'+note+
    '<div class="mf394-field"><label>Consumed At <input type="datetime-local" step="1" aria-label="Consumed At" value="'+dateValue+'" onchange="App.v394SetWhen('+index+',this.value)"></label>'+
    '<small>Uses the title-added date by default. Editing this field never changes the Per Unit timestamps.</small>'+'</div>'+ 
    '<div class="mf394-runtime"><label class="mf394-runtime-toggle"><input type="checkbox" '+(manual?'checked':'')+' onchange="App.v394ToggleRuntime('+index+',this.checked)"> Customize total runtime</label>'+ 
    (manual?'<label class="mf394-field">Total runtime (HH:MM:SS) <input aria-label="Custom total runtime" type="text" inputmode="numeric" pattern="[0-9]+:[0-5][0-9]:[0-5][0-9]" value="'+v369Hms(Number(e.v394RuntimeSeconds)||0)+'" onchange="App.v394SetRuntime('+index+',this.value)"></label>':'<div class="mf394-auto-runtime">Automatic: <strong>'+v369Hms(duration)+'</strong>'+(v369DefaultSeconds(item)<=0?'<small>Duration metadata is missing; check the category runtime.</small>':'')+'</div>')+'</div>'+ 
    '<small class="mf394-hint">Switching tabs keeps the same unsaved units. Nothing is added to History until you submit Logging.</small></div>';
}
const v394TitlePanelBase=v370TitlePanelHtml;
v370TitlePanelHtml=function(e,index,forceExpanded=false){
  const raw=String(v394TitlePanelBase.call(this,e,index,forceExpanded)||'');
  if(S.logDraft?.v369Interface!=='itemized'||!raw)return raw;
  const item=v369ItemTitle(e);if(!item)return raw;
  const host=document.createElement('div');host.innerHTML=raw;
  const panel=host.querySelector('.v370-title');if(!panel)return raw;
  panel.classList.add('mf394-title');panel.dataset.mf394Method=v394Method(e);
  const content=panel.querySelector('.v370-title-content');
  if(content){
    const tabs=document.createElement('div');tabs.className='mf394-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Logging method for '+cleanTitle(item.title));
    const labels=[['unit','Per Unit','unit'],['last','Progress Reached','last'],['amount','Amount Consumed','amount']];
    tabs.innerHTML=labels.map(([id,label,icon])=>'<button type="button" role="tab" aria-selected="'+(v394Method(e)===id)+'" class="btn btn-sm '+(v394Method(e)===id?'active':'')+'" onclick="App.v394Switch('+index+',\''+id+'\')"><span class="mf394-tab-icon">'+v370Icon(icon,14)+'</span><span class="mf394-tab-label">'+label+'</span></button>').join('');
    content.insertAdjacentElement('afterbegin',tabs);
    if(v394Method(e)!=='unit'){
      content.querySelectorAll(':scope > .v370-unit-list,:scope > .v370-add-row,:scope > .v370-show-all').forEach(el=>{el.hidden=true;});
      content.insertAdjacentHTML('beforeend',v394BulkPanel(e,index,item));
    }
  }
  const stats=panel.querySelector('.v370-title-stats');
  if(stats && e.v394RuntimeManual)stats.innerHTML=(e.v369Units?.length||0)+' units in draft · '+v369Hms(v394RuntimeForEntry(e))+' total runtime';
  return host.innerHTML;
};
function v394Paint(index){
  const e=v394Entry(index),host=document.querySelector('.v370-panels [data-v369-title="'+Number(index)+'"]');
  if(!e||!host)return;
  const y=window.scrollY, x=window.scrollX;
  const scrollers=[...document.querySelectorAll('.log-form *')].filter(node=>node.scrollTop>0).map(node=>[node,node.scrollTop,node.scrollLeft]);
  const scratch=document.createElement('div');scratch.innerHTML=v370TitlePanelHtml(e,Number(index));
  const replacement=scratch.firstElementChild;if(replacement)host.replaceWith(replacement);
  for(const [node,top,left] of scrollers)if(node.isConnected){node.scrollTop=top;node.scrollLeft=left;}
  if(window.scrollY!==y||window.scrollX!==x)window.scrollTo(x,y);
  if(typeof v370UpdateTotals==='function')v370UpdateTotals();
  if(typeof v382UpdateXPPreview==='function')v382UpdateXPPreview();
  v369Touch();
}
App.v394Switch=function(index,method){
  const e=v394Entry(index);if(!e||!V394_METHODS.has(method))return;
  e.v394Method=method;e.v369UpdatedAt=Date.now();v394Paint(index);
};
App.v394ChooseSeason=function(index,id){
  const e=v394Entry(index),item=v369ItemTitle(e);
  if(!e||!item||!v394Seasons(item).some(s=>String(s.id)===String(id)))return;
  e.v369SelectedSeasonId=String(id);v394Paint(index);
};
/* v539: one destructive season replacement prompt at a time.
 * Promise resolution must never overwrite a different/stale logging draft. */
let V539_SEASON_REPLACE_CONFIRM_PENDING=false;
App.v394SetQuantity=async function(index,value){
  const originalDraft=S.logDraft;
  const e=v394Entry(index),item=v369ItemTitle(e);if(!e||!item)return;
  const {season,units}=v394Relevant(e,item),base=v394Base(e,item,season),mode=v394Method(e);
  if(mode==='unit')return;
  const val=Number(value);if(!Number.isSafeInteger(val)||val<0){showToast('Enter a valid whole unit number.');v394Paint(index);return;}
  const quantity=mode==='last'?val-base:val,limit=v394NumberLimit(season,item);
  if(quantity<0||quantity>2000||(limit>0&&base+quantity>limit)){
    showToast('The amount is outside saved progress, title total, or the 2,000-unit safe limit.');v394Paint(index);return;
  }
  if(quantity===units.length&&v394ExactContiguous(units,base))return;
  const inconsistent=units.length&&!v394ExactContiguous(units,base);
  const distinctTimes=new Set(units.map(u=>Number(u.loggedAt))).size>1;
  const distinctDurations=new Set(units.map(u=>v369Seconds(u))).size>1;
  const repeatMix=units.some(u=>!!u.isRepeat!==!!e.isRepeat);
  if(inconsistent||distinctTimes||distinctDurations||repeatMix){
    if(V539_SEASON_REPLACE_CONFIRM_PENDING){
      v394Paint(index);return;
    }
    const originalUnits=JSON.stringify(e.v369Units||[]);
    const originalSeasonId=String(season?.id||'');
    const seasonName=String(season?.name||'').trim()||
      (season?'Season '+String(season.number||''):'This title');
    const titleName=cleanTitle(item.title||'Selected title');
    const subject=season?seasonName+' in '+titleName:titleName;
    const message=
      'You are changing detailed entries for '+subject+'.\n\n'+
      'Replacing these '+units.length+' detailed unit entr'+(units.length===1?'y':'ies')+
      ' may change individual unit numbers, timestamps, runtimes, or repeat flags.\n\n'+
      (season?'Units in other seasons will remain unchanged. ':'')+
      'Only the unsaved Logging draft will change. Saved History is unaffected.';
    V539_SEASON_REPLACE_CONFIRM_PENDING=true;
    let approved=false;
    try{
      if(typeof v336Confirm==='function'){
        approved=await v336Confirm(message,{
          title:'Replace detailed season entries?',
          confirmText:'Replace season entries',
          cancelText:'Keep detailed entries',
          confirmIcon:'replace',
          cancelIcon:'keep',
          tone:'warning',
          closeOnOverlay:true
        });
      }else if(typeof v279Confirm==='function'){
        approved=await v279Confirm({
          title:'Replace detailed season entries?',
          body:message,
          confirmLabel:'Replace season entries',
          danger:true
        });
      }else{
        showToast('The confirmation dialog is unavailable. No entries were changed.');
      }
    }catch(err){
      console.warn('MediaFlow season replacement confirmation unavailable',err);
      showToast('Could not open confirmation. No entries were changed.');
    }finally{
      V539_SEASON_REPLACE_CONFIRM_PENDING=false;
    }
    if(!approved){
      if(S.logDraft===originalDraft&&v394Entry(index)===e)v394Paint(index);
      return;
    }
    // An asynchronous confirmation must not apply to a different title,
    // season, logging method, or draft updated while the modal was open.
    const current= v394Relevant(e,item);
    if(S.logDraft!==originalDraft||v394Entry(index)!==e||
       v369ItemTitle(e)!==item||v394Method(e)!==mode||
       String(current.season?.id||'')!==originalSeasonId||
       v394Base(e,item,current.season)!==base||
       v394NumberLimit(current.season,item)!==limit||
       JSON.stringify(e.v369Units||[])!==originalUnits){
      showToast('Logging changed while the dialog was open. Nothing was replaced. Review the current draft.');
      if(S.logDraft===originalDraft&&v394Entry(index)===e)v394Paint(index);
      return;
    }
  }
  // Preserve existing unit IDs, timestamps and per-unit durations wherever
  // identical consecutive positions survive the edit. Removed IDs become
  // tombstones so a cloud draft merge cannot resurrect them.
  const previous=new Map(units.map(u=>[Number(u.number),u]));
  const keep=new Set(Array.from({length:quantity},(_,i)=>base+i+1));
  const now=Date.now(),stamp=v400BulkStamp(e,mode),seconds=v369DefaultSeconds(item);
  const result=[];
  for(let i=1;i<=quantity;i++){
    const number=base+i,old=previous.get(number);
    if(old && !repeatMix){result.push(old);continue;}
    result.push({id:uid(),number,seasonId:season?String(season.id):null,
      seasonName:season?String(season.name||''):null,seasonNumber:season?.number??null,
      loggedAt:stamp,durationSeconds:seconds,v369UpdatedAt:now,isRepeat:!!e.isRepeat});
  }
  const removed=units.filter(u=>!result.includes(u));
  if(removed.length){e.v369DeletedUnits=e.v369DeletedUnits||{};for(const u of removed)e.v369DeletedUnits[String(u.id)]=now;}
  e.v369Units=[...(e.v369Units||[]).filter(u=>!v394SameSeason(u,season)),...result];
  e.v369UpdatedAt=now;delete e.v369NextNumber;
  v369Sync();v394Paint(index);
};
App.v394SetWhen=function(index,value){
  const e=v394Entry(index);if(!e)return;
  const stamp=new Date(String(value||'')).getTime();
  if(!v369ValidStamp(stamp)){showToast('Choose a valid past date and time.');v394Paint(index);return;}
  const mode=v394Method(e);
  if(mode==='unit')return;
  // v400: bulk method dates are separate draft metadata. Switching methods
  // must NEVER write to individual Per Unit records or their updatedAt flags.
  e[mode==='last'?'v400LastWhen':'v400AmountWhen']=stamp;
  e.v369UpdatedAt=Date.now();v369Touch();v394Paint(index);
};
App.v394ToggleRuntime=function(index,enabled){
  const e=v394Entry(index);if(!e)return;
  if(enabled && !(e.v369Units||[]).length){showToast('Add consumed units before customizing their total runtime.');v394Paint(index);return;}
  if(enabled && !e.v394RuntimeManual)e.v394RuntimeSeconds=(e.v369Units||[]).reduce((n,u)=>n+v369Seconds(u),0);
  e.v394RuntimeManual=!!enabled;e.v369UpdatedAt=Date.now();v369Sync();v394Paint(index);
};
App.v394SetRuntime=function(index,value){
  const e=v394Entry(index);if(!e)return;
  const m=/^(\d{1,5}):([0-5]\d):([0-5]\d)$/.exec(String(value||'').trim());
  if(!m){showToast('Use total runtime as HH:MM:SS.');v394Paint(index);return;}
  const seconds=Number(m[1])*3600+Number(m[2])*60+Number(m[3]);
  if(!Number.isSafeInteger(seconds)||seconds>359999999){showToast('Total runtime is too large.');v394Paint(index);return;}
  e.v394RuntimeSeconds=seconds;e.v394RuntimeManual=true;e.v369UpdatedAt=Date.now();v369Sync();v394Paint(index);
};
// Canonical submit serializes v369Units. Split the custom TOTAL across units
// only when the user explicitly chose a manual override, then use the original
// v369 commit/XP/History flow unchanged.
const v394SubmitBase=App.submitLog;
App.submitLog=function(){
  // If legacy validation rejects the action, put all custom runtime controls
  // and exact unit data back. Only a successful commit materializes overrides.
  const changed=[];
  if(S.logDraft?.v369Interface==='itemized')for(const e of S.logDraft.entries||[]){
    const units=e.v369Units||[],total=Number(e.v394RuntimeSeconds);
    if(!e.v394RuntimeManual||!units.length||!Number.isFinite(total)||total<0)continue;
    changed.push({e,priorManual:e.v394RuntimeManual,priorSeconds:e.v394RuntimeSeconds,
      originals:units.map(u=>({u,seconds:u.durationSeconds,minutes:u.minutes,modified:u.v369UpdatedAt}))});
    const seconds=Math.round(total),q=Math.floor(seconds/units.length),r=seconds%units.length;
    units.forEach((u,i)=>{u.durationSeconds=q+(i<r?1:0);delete u.minutes;u.v369UpdatedAt=Date.now();});
    e.v394RuntimeManual=false;e.v394RuntimeSeconds=seconds;
  }
  const rollback=()=>{for(const change of changed){
    change.e.v394RuntimeManual=change.priorManual;change.e.v394RuntimeSeconds=change.priorSeconds;
    for(const {u,seconds,minutes,modified} of change.originals){
      if(seconds===undefined)delete u.durationSeconds;else u.durationSeconds=seconds;
      if(minutes===undefined)delete u.minutes;else u.minutes=minutes;
      u.v369UpdatedAt=modified;
    }
  }if(changed.length&&S.logDraft?.v369Interface==='itemized')v369Sync();};
  try{
    const result=v394SubmitBase.apply(this,arguments);
    if(S.logging===true)rollback();
    return result;
  }catch(error){rollback();throw error;}
};
// Keep the existing v369 duration controls authoritative when users manually
// edit an individual unit's runtime in Per Unit.
const v394EditUnitBase=App.v369EditUnit;
App.v369EditUnit=function(index,pos,key,value){
  const e=v394Entry(index);if(e&&(/^duration-/.test(key)||key==='minutes'))e.v394RuntimeManual=false;
  return v394EditUnitBase.apply(this,arguments);
};
// Ensure every current and future renderer / dynamic Settings center uses the
// new public mode name. v369 storage value stays 'itemized' intentionally.
const v394SettingsRenderer=V219_PAGE_RENDERERS.get('settings');
if(typeof v394SettingsRenderer==='function')MediaFlowRuntime.registerPageRenderer('settings',function(ctx){
  const raw=String(v394SettingsRenderer.call(this,ctx)||'');
  const host=document.createElement('div');host.innerHTML=raw;
  host.querySelectorAll('.v370-settings-modes button').forEach(button=>{
    if(String(button.getAttribute('onclick')||'').includes("'itemized'")){
      button.innerHTML=v370Icon('advanced')+' Advanced Logging <span class="v369-recommended">Recommended</span>';
    }
  });
  return host.innerHTML;
});
// Existing old navigation preferences are automatically normalized against the
// now-without-Batch NAV_ITEMS. Old batch History remains readable in History.
const v394SetViewBase=App.setView;
App.setView=function(view){return v394SetViewBase.call(this,view==='batch'?'dashboard':view);};
window.MediaFlowV394={version:394,features:['Advanced Logging per-title tabs','Shared Per Unit canonical draft','Progress Reached','Amount Consumed','Runtime override','When watched','Batch Log navigation retired'],audit:()=>({mode:S.logDraft?.v369Interface,methods:(S.logDraft?.entries||[]).map(e=>v394Method(e)),units:(S.logDraft?.entries||[]).map(e=>e.v369Units?.length||0),batchNavigation:NAV_ITEMS.some(n=>n.id==='batch')})};
MediaFlowRuntime.version=V394_RELEASE;
