/* MediaFlow v566 — logs keep the time you actually consumed.
 *
 * Before v566 a log saved with "Save" or "Save & get next task" was dated
 * when it was saved: a log kept open for two days put everything on the save
 * day, and the days in between looked empty to streaks, History and
 * Statistics.
 *
 * Now every session written by the log is dated by when you consumed:
 *   Setting "Log time" (Settings → Dashboard → Logging), S.settings.mf566LogTime
 *     'unit'  (default) each unit counts at the time it was logged
 *             (itemized logging: each episode / chapter's own time;
 *              other logging methods: the time the title was added).
 *     'added' each title counts at the time it was added to the log.
 * When those times fall on more than one day, the session is split into one
 * session per day. Amount, minutes and XP are divided between the days (the
 * total never changes); the latest day keeps the session's id and its
 * recommendation outcome, earlier days are "logged". Each part carries
 * mf566Split {group, part, of}. Days use the same date key as everywhere
 * else in MediaFlow (UTC ISO date of the time).
 * The MediaFlow app writes exactly the same (website v566 contract).
 */
const MF566_LOG_TIME_MODES=['unit','added'];
function mf566LogTimeMode(){
  const v=String(S.settings?.mf566LogTime||'');
  return MF566_LOG_TIME_MODES.includes(v)?v:'unit';
}
function mf566DayKey(ms){const d=new Date(Number(ms));return Number.isNaN(d.getTime())?'':d.toISOString().slice(0,10);}
function mf566Stamp(v){const n=Number(v);return Number.isFinite(n)&&n>=946684800000&&n<=Date.now()+300000?n:0;}

// What the draft knew before submit (submit clears the draft).
function mf566CaptureDraft(){
  const byKey=new Map();
  for(const e of S.logDraft?.entries||[]){
    const key=e.libraryId?'id:'+String(e.libraryId):'t:'+String(cleanTitle(e.title)).toLocaleLowerCase();
    byKey.set(key,{added:mf566Stamp(e.loggedAt)});
  }
  return byKey;
}
function mf566TitleKey(t){return t.libraryId?'id:'+String(t.libraryId):'t:'+String(cleanTitle(t.title)).toLocaleLowerCase();}

/* Points = the moments one session's consumption happened.
 * Each point carries its share of the title's qty and, for itemized units,
 * its exact seconds. */
function mf566SessionPoints(session,draft,mode){
  const points=[],fallback=mf566Stamp(session.timestamp)||Date.now();
  (session.titles||[]).forEach((t,ti)=>{
    const added=draft.get(mf566TitleKey(t))?.added||mf566Stamp(t.loggedAt)||fallback;
    const units=Array.isArray(t.v369Units)?t.v369Units:[];
    const qty=Math.max(0,Number(t.qty)||0);
    if(units.length){
      units.forEach((u,ui)=>points.push({ti,ui,time:mode==='added'?added:(mf566Stamp(u.loggedAt)||added),
        qty:qty/units.length,seconds:typeof v369Seconds==='function'?v369Seconds(u):0}));
    }else{
      points.push({ti,ui:-1,time:mode==='added'?added:(mf566Stamp(t.loggedAt)||added),qty,seconds:0});
    }
  });
  return points;
}
const mf566Round=(n,d=4)=>{const f=10**d;return Math.round(Number(n)*f)/f;};

// Returns the sessions that replace `session` (one per day, oldest first).
function mf566RedateSession(session,draft,mode){
  if(!session||session.status==='skipped'||!Array.isArray(session.titles)||!session.titles.length)return [session];
  const points=mf566SessionPoints(session,draft,mode);
  if(!points.length)return [session];
  const days=new Map();
  for(const p of points){
    const key=mf566DayKey(p.time);if(!key)continue;
    if(!days.has(key))days.set(key,[]);
    days.get(key).push(p);
  }
  if(!days.size)return [session];
  const keys=[...days.keys()].sort();
  if(keys.length===1){
    const key=keys[0],last=Math.max(...days.get(key).map(p=>p.time));
    // v567: a log that's all on its own save day keeps its save time.
    if(session.date!==key){
      session.mf566SavedAt=Number(session.timestamp)||Date.now();
      session.date=key;session.timestamp=last;
    }
    return [session];
  }
  const totalQty=points.reduce((n,p)=>n+p.qty,0);
  const itemized=points.some(p=>p.ui>=0&&p.seconds>0);
  const totalSeconds=points.reduce((n,p)=>n+p.seconds,0);
  const savedAt=Number(session.timestamp)||Date.now();
  const xpTotal=Math.round(Number(session.xp)||0);
  let xpLeft=xpTotal,amountLeft=Number(session.actualAmount)||0,minutesLeft=Number(session.minutes)||0;
  const parts=keys.map((key,index)=>{
    const pts=days.get(key),isLast=index===keys.length-1;
    const share=totalQty>0?pts.reduce((n,p)=>n+p.qty,0)/totalQty:pts.length/points.length;
    const titles=[];
    const byTitle=new Map();
    for(const p of pts){if(!byTitle.has(p.ti))byTitle.set(p.ti,[]);byTitle.get(p.ti).push(p);}
    for(const [ti,list] of [...byTitle.entries()].sort((a,b)=>a[0]-b[0])){
      const t=session.titles[ti],row={...t};
      if(Array.isArray(t.v369Units)&&t.v369Units.length){
        row.v369Units=list.filter(p=>p.ui>=0).map(p=>({...t.v369Units[p.ui]}));
        row.v369DurationSeconds=list.reduce((n,p)=>n+p.seconds,0);
      }
      row.qty=mf566Round(list.reduce((n,p)=>n+p.qty,0));
      row.loggedAt=Math.min(...list.map(p=>p.time));
      titles.push(row);
    }
    const seconds=pts.reduce((n,p)=>n+p.seconds,0);
    const xp=isLast?xpLeft:Math.round(xpTotal*share);
    const amount=isLast?amountLeft:mf566Round((Number(session.actualAmount)||0)*share);
    const minutes=isLast?minutesLeft:(itemized&&totalSeconds>0?seconds/60:mf566Round((Number(session.minutes)||0)*share));
    xpLeft-=xp;amountLeft-=amount;minutesLeft-=minutes;
    const part={...session,
      id:isLast?session.id:uid(),
      date:key,timestamp:Math.max(...pts.map(p=>p.time)),
      titles,xp,actualAmount:mf566Round(amount),minutes:mf566Round(Math.max(0,minutes)),
      status:isLast?session.status:'logged',
      mf566SavedAt:savedAt,
      mf566Split:{group:String(session.sessionGroupId||session.id),part:index+1,of:keys.length}};
    if(!isLast){part.targetAmount=part.actualAmount;part.followedAssignedCategory=session.followedAssignedCategory;}
    if(session.v369DurationSeconds!=null)part.v369DurationSeconds=Math.round(itemized?seconds:(Number(session.v369DurationSeconds)||0)*share);
    return part;
  });
  return parts;
}
function mf566RedateNewSessions(beforeIds,draft){
  const mode=mf566LogTimeMode();
  const list=S.sessions||[];
  let changed=false;
  for(let i=list.length-1;i>=0;i--){
    const s=list[i];
    if(!s||beforeIds.has(String(s.id)))continue;
    const parts=mf566RedateSession(s,draft,mode);
    if(parts.length!==1||parts[0]!==s||s.mf566SavedAt){changed=true;}
    if(parts.length>1)list.splice(i,1,...parts);
  }
  if(!changed)return false;
  try{if(typeof v149MarkStreakDirty==='function')v149MarkStreakDirty();}catch(_){}
  try{persistSessions();}catch(e){console.warn('MediaFlow v566: could not save log times',e);}
  try{render();}catch(_){}
  return true;
}
const mf566SubmitBase=App.submitLog;
App.submitLog=function(){
  if(!S.logDraft)return mf566SubmitBase.apply(this,arguments);
  const before=new Set((S.sessions||[]).map(s=>String(s.id)));
  const draft=mf566CaptureDraft();
  const finish=()=>{if(S.logging!==true)mf566RedateNewSessions(before,draft);};
  const value=mf566SubmitBase.apply(this,arguments);
  if(value&&typeof value.then==='function')return value.then(r=>{finish();return r;});
  finish();
  return value;
};

/* ---------- setting ---------- */
function mf566SetLogTime(value){
  if(!MF566_LOG_TIME_MODES.includes(value))return;
  S.settings=S.settings||{};
  S.settings.mf566LogTime=value;
  try{const p=persistSettings();if(p&&typeof p.catch==='function')p.catch(()=>{});}catch(_){}
  document.querySelectorAll('[data-mf566-logtime]').forEach(el=>{el.checked=el.value===value;});
  showToast(value==='added'?'Logs count when each title was added to the log.':'Logs count when each unit was logged.');
}
function mf566LogTimeHtml(){
  const mode=mf566LogTimeMode();
  const opt=(v,title,sub)=>'<label class="mf566-radio"><input type="radio" name="mf566-logtime" value="'+v+'" data-mf566-logtime'+(mode===v?' checked':'')+
    ' onchange="App.mf566SetLogTime(this.value)"><span><b>'+title+'</b><small>'+sub+'</small></span></label>';
  return '<div class="mf566-logtime-settings" data-mf566-setting="log-time"><div class="mf566-setting-copy"><b>Log time</b>'+
    '<small>When a log is saved, its titles count on the day you consumed them, not the day you pressed Save. Streaks, History and Statistics follow these times.</small></div>'+
    '<div class="mf566-radio-group" role="radiogroup" aria-label="Log time">'+
    opt('unit','When each unit was logged','Default. Each episode, chapter or unit counts at its own time.')+
    opt('added','When the title was added to the log','Everything for a title counts at the time it was added.')+
    '</div></div>';
}
function mf566MountLogTimeSettings(){
  if(String(S.view)!=='settings'||!window.MediaFlowSettingsCenter?.mountSection)return;
  if(document.querySelector('.mf566-logtime-settings'))return;
  const node=document.createElement('div');node.innerHTML=mf566LogTimeHtml();
  window.MediaFlowSettingsRegistry?.registerSetting?.({id:'mf566-log-time',section:'mf566-log-time',selector:'[data-mf566-setting="log-time"]',
    label:'Log time',subgroup:'Logging',keywords:['log','time','date','streak','day','save','next task','unit','episode','added']});
  window.MediaFlowSettingsCenter.mountSection({id:'mf566-log-time',title:'Log time',category:'dashboard',subgroup:'Logging',
    keywords:['log','time','date','streak','day','save','next task','unit','episode','added'],nodes:[node.firstElementChild]});
}
MediaFlowRuntime.registerPageEnhancer('settings',mf566MountLogTimeSettings);

Object.assign(App,{mf566SetLogTime});
window.MediaFlowV566=Object.assign(window.MediaFlowV566||{},{logTimeMode:mf566LogTimeMode,redateSession:mf566RedateSession,dayKey:mf566DayKey});
