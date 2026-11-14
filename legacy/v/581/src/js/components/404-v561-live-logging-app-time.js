/* MediaFlow v561 — live logging with the MediaFlow app, and app time.
 *
 * 1. Live logging (accounts on per-record storage, v556): while logging is
 *    open here, the logging draft the MediaFlow app saves is read every few
 *    seconds (one small row) and shown right away; a task started, rerolled or
 *    ended in the app is picked up by an immediate record pull. Drafts typed
 *    here already reach the app within a second (v285 saves 0.4 s after a
 *    change; the app checks every 3 s while its Log page is open).
 *    The newer draft wins; per-unit drafts of the same session are merged unit
 *    by unit (v369MergeLogging), exactly as when a device opens the account.
 *    A draft is never replaced while you are typing in it.
 *
 * 2. App time: the MediaFlow app records the time it is used in
 *    xpLedger.v561AppTimeDays[day] = {ms, exactXP, xp, streak, multiplier,
 *    updatedAt, platforms:{android, windows, ios: ms}}, earned exactly like the
 *    website's active time (v334: XP per minute × the day's streak
 *    multiplier). It is kept apart from v334ActiveTimeDays so neither side
 *    overwrites the other, counts toward total XP and levels, appears in XP
 *    history, and Statistics shows website vs app time.
 *
 * No Supabase schema or policy change.
 */
const MF561_VERSION=561;
const MF561_APP_KEY='v561AppTimeDays';
const MF561={timer:null,busy:false,since:'',applied:0,pulls:0,taskPulls:0,lastError:''};
const MF561_LOGGING_ID='resumeStateV285'+MF556_SEP+'logging';
const MF561_TASK_IDS=['sessionActive','currentTask'+MF556_SEP,'currentTask'+MF556_SEP+'id','currentTask'+MF556_SEP+'libraryId'];
const MF561_PLATFORM_LABELS={android:'Android',ios:'iOS',windows:'Windows',macos:'macOS',linux:'Linux'};

/* ---------- 2. app time in XP, history and Statistics ---------- */
function mf561AppDays(ledger=S.xpLedger){
  const d=ledger?.[MF561_APP_KEY];
  return d&&typeof d==='object'&&!Array.isArray(d)?d:{};
}
function mf561AppTotals(ledger=S.xpLedger){
  let ms=0,xp=0;const platforms={};
  for(const row of Object.values(mf561AppDays(ledger))){
    ms+=Math.max(0,Number(row?.ms)||0);xp+=Math.max(0,Number(row?.xp)||0);
    for(const [k,v] of Object.entries(row?.platforms||{}))platforms[k]=(platforms[k]||0)+Math.max(0,Number(v)||0);
  }
  return {ms,xp,platforms};
}
const mf561TotalsBase=v334Totals;
v334Totals=function(ledger=S.xpLedger){
  const base=mf561TotalsBase.call(this,ledger);
  const app=mf561AppTotals(ledger||{});
  return {...base,websiteActiveMs:base.activeMs,websiteTimeXP:base.timeXP,appActiveMs:app.ms,appTimeXP:app.xp,appPlatforms:app.platforms,
    activeMs:base.activeMs+app.ms,timeXP:base.timeXP+app.xp,total:base.total+app.xp};
};
// Older backups / devices merged in: keep the larger known progress per day.
const mf561MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const merged=mf561MergeStatesBase.apply(this,arguments);
  if(!merged||typeof merged!=='object')return merged;
  const x=mf561AppDays(a?.xpLedger),y=mf561AppDays(b?.xpLedger);
  if(!Object.keys(x).length&&!Object.keys(y).length)return merged;
  const days={};
  for(const day of new Set([...Object.keys(y),...Object.keys(x)])){
    const p=x[day]||{},q=y[day]||{};
    const latest=(Number(p.updatedAt)||0)>=(Number(q.updatedAt)||0)?p:q;
    const platforms={};
    for(const k of new Set([...Object.keys(p.platforms||{}),...Object.keys(q.platforms||{})]))
      platforms[k]=Math.max(Number(p.platforms?.[k])||0,Number(q.platforms?.[k])||0);
    days[day]={...latest,ms:Math.max(Number(p.ms)||0,Number(q.ms)||0),exactXP:Math.max(Number(p.exactXP)||0,Number(q.exactXP)||0),
      xp:Math.max(Number(p.xp)||0,Number(q.xp)||0),updatedAt:Math.max(Number(p.updatedAt)||0,Number(q.updatedAt)||0),platforms};
  }
  merged.xpLedger=merged.xpLedger||{};
  merged.xpLedger[MF561_APP_KEY]=days;
  return merged;
};
const mf561HistoryBase=v348HistoryEntries;
v348HistoryEntries=function(ledger=S.xpLedger,sessions=S.sessions,library=S.library){
  const out=mf561HistoryBase.call(this,ledger,sessions,library);
  for(const [date,row] of Object.entries(mf561AppDays(ledger))){
    const xp=Math.max(0,Number(row?.xp)||0);if(!xp)continue;
    const platforms=Object.entries(row?.platforms||{}).filter(([,v])=>Number(v)>0).map(([k])=>MF561_PLATFORM_LABELS[k]||k).join(', ');
    out.push({id:'apptime:'+date,kind:'activeTime',source:'MediaFlow app time',timestamp:/^\d{4}-\d{2}-\d{2}$/.test(date)?new Date(date+'T12:00:00').getTime():0,
      details:`${v334Duration(Number(row?.ms)||0)} in the app${platforms?' · '+platforms:''}`,xp,baseXP:xp/(Number(row?.multiplier)||1),
      multiplier:Number(row?.multiplier)||1,streak:Number(row?.streak)||0,grouped:true});
  }
  return out.sort((a,b)=>(b.timestamp||0)-(a.timestamp||0)||String(a.id).localeCompare(String(b.id)));
};
function mf561SplitHtml(){
  const t=v334Totals();
  if(!(t.appActiveMs>0))return '';
  const rows=[['On the website',v334Duration(t.websiteActiveMs),`${Math.round(t.websiteTimeXP).toLocaleString()} XP`],
    ['In the MediaFlow app',v334Duration(t.appActiveMs),`${Math.round(t.appTimeXP).toLocaleString()} XP`]];
  for(const [k,ms] of Object.entries(t.appPlatforms).sort((a,b)=>b[1]-a[1]))if(ms>0)rows.push(['· '+(MF561_PLATFORM_LABELS[k]||k),v334Duration(ms),'']);
  return '<div class="record-list mf561-time-split" aria-label="Website and app time">'+rows.map(([k,v,x])=>
    `<div class="record-row"><span class="k">${escapeHtml(k)}</span><span class="v">${escapeHtml(v)}${x?` <small>· ${escapeHtml(x)}</small>`:''}</span></div>`).join('')+'</div>';
}
const mf561ActiveCardBase=v335ActiveTimeCard;
v335ActiveTimeCard=function(){
  const html=String(mf561ActiveCardBase.apply(this,arguments)||'');
  const split=mf561SplitHtml();
  if(!split)return html;
  const at=html.lastIndexOf('</section>');
  return at<0?html+split:html.slice(0,at)+split+html.slice(at);
};

/* ---------- 1. live logging with the app ---------- */
function mf561Wanted(){
  if(!MF556.migrated||!AUTH_USER||!navigator.onLine||document.visibilityState==='hidden'||V115_STARTUP_GUARD)return false;
  return S.logging===true||S.sessionActive===true||S.view==='dashboard'||!!document.getElementById('mf555-log-popup');
}
function mf561Typing(){
  const el=document.activeElement;
  if(!el||!/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))return false;
  const since=Date.now()-(Number(S.v285ResumeState?.logging?.modifiedAt)||0);
  return since<4000;
}
async function mf561Fetch(ids,since){
  let q=supabase.from(MF556_TABLE).select('kind,record_id,pos,data,deleted,device_id,updated_at').eq('user_id',AUTH_USER.id).eq('kind','doc').in('record_id',ids);
  if(since)q=q.gt('updated_at',since);
  const {data,error}=await q.order('updated_at',{ascending:true});
  if(error)throw error;
  return data||[];
}
function mf561Known(row){
  const cur=MF556.local.get(mf556Key(row.kind,row.record_id));
  const j=row.deleted?null:row.data;
  const h=j==null?null:mf556Hash(j+'|'+(row.pos??''));
  return {cur,h,known:cur?(cur.sh===h||cur.h===h):h==null};
}
async function mf561Tick(){
  if(MF561.busy||!mf561Wanted())return;
  MF561.busy=true;
  try{
    const since=MF561.since||(MF556.cursor?new Date(Date.parse(MF556.cursor)-3000).toISOString():'');
    const rows=await mf561Fetch([MF561_LOGGING_ID,...MF561_TASK_IDS],since);
    MF561.pulls++;
    if(!rows.length)return;
    for(const r of rows)if(r.updated_at>MF561.since)MF561.since=r.updated_at;
    // A task started / rerolled / ended on another device: the regular record pull.
    if(rows.some(r=>r.record_id!==MF561_LOGGING_ID&&!mf561Known(r).known)){
      MF561.taskPulls++;
      if(typeof mf556Pull==='function')await mf556Pull();
    }
    const row=[...rows].reverse().find(r=>r.record_id===MF561_LOGGING_ID);
    if(!row||row.deleted||row.data==null)return;
    const k=mf561Known(row);
    if(k.known||mf561Typing())return;
    if(k.cur&&k.cur.h!==k.cur.sh)return; // an unsent draft here: our own save goes first
    let incoming=null;try{incoming=v285NormalizeLogging(JSON.parse(row.data));}catch(_){return;}
    const current=v285NormalizeLogging(S.v285ResumeState?.logging||{});
    let next=null;
    if(typeof v369MergeLogging==='function'){
      const merged=v369MergeLogging(current,incoming);
      if(merged)next=v285NormalizeLogging(merged);
    }
    if(!next&&incoming.modifiedAt>current.modifiedAt)next=incoming;
    if(!next||JSON.stringify(next)===JSON.stringify(current))return;
    // Remember the cloud row as known, so this change is not uploaded back.
    MF556.local.set(mf556Key(row.kind,row.record_id),{k:row.kind,i:row.record_id,pos:row.pos,j:row.data,h:k.h,sh:k.h});
    const view=S.view;
    v285ApplyResume({resumeStateV285:{...S.v285ResumeState,logging:next},settings:S.settings},{includeLocal:false});
    S.view=view;
    MF561.applied++;
    render();
  }catch(e){MF561.lastError=String(e?.message||e);}
  finally{MF561.busy=false;}
}
function mf561Schedule(){
  clearTimeout(MF561.timer);
  MF561.timer=setTimeout(()=>{mf561Tick().finally(mf561Schedule);},3000);
}
mf561Schedule();
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')mf561Tick();});

window.MediaFlowV561=Object.freeze({version:MF561_VERSION,stats:()=>({...MF561,timer:undefined}),appTime:()=>mf561AppTotals(),tick:mf561Tick});
MediaFlowRuntime.version=MF561_VERSION;
