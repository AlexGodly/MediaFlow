/* MediaFlow v580 — task goal XP.
 *
 * A recommendation ("Consume 5–7 issues") now pays XP for its goal:
 *   - reaching the minimum (task.low):           +100 XP (setting)
 *   - reaching the maximum (task.high):           +300 XP more (setting)
 *   - each unit past the maximum:                 +10 XP, up to +100 (settings)
 * Once per task, by any log: Logging, Batch Log / Log any title. The task's
 * progress is everything logged in its category since the task was created
 * (Batch Log rows dated before it don't count); each part is paid once — the
 * log that reaches it gets it, stored on that log's session:
 *   session.mf580GoalXP        the goal XP of this log
 *   session.mf580GoalTaskId    the task it belongs to
 *   session.mf580Goal          {min,max,extra,low,high,amount,version}
 * Like System Respect XP it is part of the session's base XP (so the day
 * streak multiplies it). Settings → System Respect XP → Task goal XP.
 * The XP previews in Logging and Batch Log show it.
 */
const MF580_GOAL_DEFAULT=Object.freeze({enabled:true,min:100,max:300,perExtra:10,extraCap:100});
function mf580GoalCfg(){
  const c=S.settings?.mf580GoalXP&&typeof S.settings.mf580GoalXP==='object'?S.settings.mf580GoalXP:{};
  const n=(v,d)=>Number.isFinite(Number(v))?Math.max(0,Math.min(100000,Math.round(Number(v)))):d;
  return {enabled:c.enabled!==false,min:n(c.min,MF580_GOAL_DEFAULT.min),max:n(c.max,MF580_GOAL_DEFAULT.max),
    perExtra:n(c.perExtra,MF580_GOAL_DEFAULT.perExtra),extraCap:n(c.extraCap,MF580_GOAL_DEFAULT.extraCap)};
}
function mf580GoalBounds(t){
  const safe=v=>Math.max(0,Number.isFinite(Number(v))?Number(v):0);
  const low=Math.max(1,Math.round(safe(t?.low??t?.targetMid??1)));
  const high=Math.max(low,Math.round(safe(t?.high??t?.targetMid??low)));
  return {low,high};
}
/* What a task's goal is worth at [amount]. */
function mf580GoalTiers(amount,low,high,cfg=mf580GoalCfg()){
  const out={min:0,max:0,extra:0};
  if(!cfg.enabled)return out;
  const a=Math.max(0,Number(amount)||0);
  if(a>=low)out.min=cfg.min;
  if(a>=high)out.max=cfg.max;
  if(a>high)out.extra=Math.min(cfg.extraCap,Math.floor(a-high)*cfg.perExtra);
  return out;
}
/* Logged in the task's category since the task was created. */
function mf580TaskAmount(task,sessions){
  const cat=String(task?.categoryId||''),since=Number(task?.createdAt)||0;
  let n=0;
  for(const s of Array.isArray(sessions)?sessions:[]){
    if(!s||s.status==='skipped'||String(s.categoryId||'')!==cat)continue;
    if((Number(s.timestamp)||0)<since)continue;
    n+=Math.max(0,Number(s.actualAmount)||0);
  }
  return n;
}
function mf580GoalPaid(task,sessions){
  const out={min:0,max:0,extra:0},id=String(task?.id||'');
  if(!id)return out;
  for(const s of Array.isArray(sessions)?sessions:[]){
    if(String(s?.mf580GoalTaskId||'')!==id)continue;
    const g=s.mf580Goal||{};
    out.min+=Number(g.min)||0;out.max+=Number(g.max)||0;out.extra+=Number(g.extra)||0;
  }
  return out;
}
/* The goal XP still to pay when the task's amount becomes [amount]. */
function mf580GoalDue(task,amount,sessions,cfg=mf580GoalCfg()){
  if(!task?.id||!task.categoryId||(typeof levelingSettings==='function'&&levelingSettings().enabled===false))return {min:0,max:0,extra:0,total:0,low:0,high:0,amount:0};
  const {low,high}=mf580GoalBounds(task);
  const tiers=mf580GoalTiers(amount,low,high,cfg),paid=mf580GoalPaid(task,sessions);
  const due={min:Math.max(0,tiers.min-paid.min),max:Math.max(0,tiers.max-paid.max),extra:Math.max(0,tiers.extra-paid.extra)};
  return {...due,total:due.min+due.max+due.extra,low,high,amount};
}
/* After a log is saved: the goal XP goes on its first session in the task's category. */
function mf580ApplyGoal(task,beforeIds){
  if(!task?.id||!task.categoryId)return 0;
  const sessions=Array.isArray(S.sessions)?S.sessions:[];
  const fresh=sessions.filter(s=>s&&!beforeIds.has(s.id));
  const target=fresh.find(s=>s.status!=='skipped'&&String(s.categoryId||'')===String(task.categoryId)&&Number(s.actualAmount)>0);
  if(!target||target.mf580GoalTaskId)return 0;
  const due=mf580GoalDue(task,mf580TaskAmount(task,sessions),sessions);
  if(!due.total)return 0;
  target.mf580GoalXP=due.total;
  target.mf580GoalTaskId=String(task.id);
  target.mf580Goal={min:due.min,max:due.max,extra:due.extra,low:due.low,high:due.high,amount:due.amount,version:580};
  try{if(typeof v334InvalidateXP==='function')v334InvalidateXP();}catch(_){}
  /* The log's stored streak fields (xpWithStreak…) include it before saving. */
  try{if(typeof v149MarkStreakDirty==='function')v149MarkStreakDirty();if(typeof v149EnsureStreakXP==='function')v149EnsureStreakXP();}catch(_){}
  try{persistSessions();}catch(_){}
  const bits=[due.min?'minimum +'+due.min:'',due.max?'maximum +'+due.max:'',due.extra?'past the maximum +'+due.extra:''].filter(Boolean);
  setTimeout(()=>showToast('Task goal reached · +'+due.total.toLocaleString()+' XP ('+bits.join(' · ')+')'),0);
  return due.total;
}
/* Part of the session's base XP, like System Respect XP. */
const mf580BaseSessionXPBase=v150BaseSessionXP;
v150BaseSessionXP=function(s){
  const base=Number(mf580BaseSessionXPBase.apply(this,arguments))||0;
  if(!s||s.status==='skipped')return base;
  return Math.max(0,base+Math.max(0,Math.round(Number(s.mf580GoalXP)||0)));
};
try{if(typeof v334InvalidateXP==='function')v334InvalidateXP();}catch(_){}

/* ---------- saving ---------- */
const mf580SubmitLogBase=App.submitLog;
App.submitLog=function(){
  const task=S.currentTask?{...S.currentTask}:null;
  const before=new Set((S.sessions||[]).map(s=>s?.id));
  const out=mf580SubmitLogBase.apply(this,arguments);
  try{if((S.sessions||[]).length>before.size)mf580ApplyGoal(task,before);}catch(e){console.warn('MediaFlow v580: goal XP',e);}
  return out;
};
const mf580SubmitBatchBase=App.submitBatchLog;
App.submitBatchLog=function(){
  const task=S.currentTask?{...S.currentTask}:null;
  const before=new Set((S.sessions||[]).map(s=>s?.id));
  const out=mf580SubmitBatchBase.apply(this,arguments);
  const settle=()=>{try{if((S.sessions||[]).length>before.size)mf580ApplyGoal(task,before);}catch(e){console.warn('MediaFlow v580: goal XP',e);}};
  if(out&&typeof out.then==='function')return out.then(v=>{settle();return v;});
  settle();
  return out;
};

/* ---------- Logging XP preview ---------- */
const mf580ProjectBase=mf537ProjectXP;
mf537ProjectXP=function(){
  const p=mf580ProjectBase.apply(this,arguments);
  try{
    const task=S.currentTask;
    if(!p||!task?.id||!Array.isArray(p.categories))return p;
    const row=p.categories.find(c=>String(c.id)===String(task.categoryId));
    if(!row||!(Number(row.amount)>0))return {...p,goal:null};
    const sessions=S.sessions||[];
    const due=mf580GoalDue(task,mf580TaskAmount(task,sessions)+Number(row.amount),sessions);
    if(!due.total)return {...p,goal:due};
    const mult=Number(p.dayMultiplier)||1;
    const was=Number(row.afterStreak)||0,now=Math.max(0,Math.round(((Number(row.beforeStreak)||0)+due.total)*mult));
    const add=now-was;
    return {...p,goal:{...due,afterStreak:add},total:(Number(p.total)||0)+add,streakBonus:(Number(p.streakBonus)||0)+(add-due.total)};
  }catch(e){console.warn('MediaFlow v580: goal preview',e);return p;}
};
function mf580GoalLine(g){
  if(!g||!g.total)return '';
  const bits=[g.min?'minimum ('+g.low+') +'+g.min:'',g.max?'maximum ('+g.high+') +'+g.max:'',g.extra?'past the maximum +'+g.extra:''].filter(Boolean);
  return '<div class="mf580-goal-xp"><b>Task goal +'+Number(g.total).toLocaleString()+' XP</b><small>'+escapeHtml(bits.join(' · '))+'</small></div>';
}
const mf580CardBase=mf537XPCardMarkup;
mf537XPCardMarkup=function(){
  const card=String(mf580CardBase.apply(this,arguments)||'');
  let p=null;try{p=mf537ProjectXP();}catch(_){}
  const line=mf580GoalLine(p?.goal);
  if(!line||card.includes('mf580-goal-xp'))return card;
  return card.includes('<div class="mf537-xp-formula">')?card.replace('<div class="mf537-xp-formula">',line+'<div class="mf537-xp-formula">'):card+line;
};

/* ---------- Batch Log XP preview ---------- */
const mf580BatchProjectBase=mf574Project;
mf574Project=function(){
  const p=mf580BatchProjectBase.apply(this,arguments);
  try{
    const task=S.currentTask;
    if(!p||!p.parts||!task?.id)return p;
    const date=/^\d{4}-\d{2}-\d{2}$/.test(S.batchDraft?.date||'')?S.batchDraft.date:todayISO();
    const at=(typeof mf573BatchTime==='function'&&mf573BatchTime(date,S.batchDraft?.mf573Time))||(date===todayISO()?Date.now():new Date(date+'T12:00:00').getTime());
    if(at<(Number(task.createdAt)||0))return p;
    let amount=0;
    for(const r of mf574Rows()){
      const item=S.library.find(x=>x.id===r.libraryId);if(!item||String(item.categoryId)!==String(task.categoryId))continue;
      const cat=getCategory(item.categoryId),qty=Math.max(0,Number(r.qty)||0);
      amount+=typeof mf565ToCategoryAmount==='function'?mf565ToCategoryAmount(item,cat,qty):qty;
    }
    if(!amount)return p;
    const sessions=S.sessions||[];
    const due=mf580GoalDue(task,mf580TaskAmount(task,sessions)+amount,sessions);
    if(!due.total)return p;
    let mult=1;
    try{mult=v149StreakMultiplier(v149BuildStreakMap(sessions).get(date)||1)||1;}catch(_){}
    const add=Math.round(due.total*mult);
    return {...p,xp:(Number(p.xp)||0)+add,parts:{...p.parts,goal:add},goal:due};
  }catch(e){console.warn('MediaFlow v580: batch goal preview',e);return p;}
};
const mf580BatchHtmlBase=mf574Html;
mf574Html=function(p){
  const html=String(mf580BatchHtmlBase.apply(this,arguments)||'');
  if(!p?.parts?.goal)return html;
  return html.replace(/<\/small><\/span>$/,' · +'+Number(p.parts.goal).toLocaleString()+' task goal</small></span>');
};

/* ---------- Settings ---------- */
App.mf580SetGoal=function(key,value){
  const cfg={...mf580GoalCfg()};
  if(key==='enabled')cfg.enabled=!!value;
  else if(['min','max','perExtra','extraCap'].includes(key))cfg[key]=Math.max(0,Math.min(100000,Math.round(Number(value)||0)));
  else return;
  cfg.modifiedAt=Date.now();
  S.settings.mf580GoalXP=cfg;
  persistSettings();render();
};
App.mf580ResetGoal=function(){S.settings.mf580GoalXP={...MF580_GOAL_DEFAULT,modifiedAt:Date.now()};persistSettings();render();};
function mf580GoalSettingsHtml(){
  const c=mf580GoalCfg();
  const field=(key,label,max)=>'<div class="v167-respect-edit"><label>'+label+'</label><input type="number" min="0" max="'+max+'" step="1" value="'+c[key]+'" onchange="App.mf580SetGoal(\''+key+'\',this.value)"></div>';
  return '<div class="v165-respect-card mf580-goal-card"><div class="v165-respect-head"><div><div class="v165-respect-title">TASK GOAL XP</div>'+
    '<div class="hint">XP for reaching a recommendation\'s goal — once per task, by any log (Logging, Batch Log, Log any title). The day streak multiplies it like other session XP.</div></div>'+
    '<label class="mf580-goal-switch"><input type="checkbox" '+(c.enabled?'checked':'')+' onchange="App.mf580SetGoal(\'enabled\',this.checked)"> On</label></div>'+
    '<div class="v167-respect-edit-grid">'+field('min','Reaching the minimum — XP',100000)+field('max','Reaching the maximum — XP more',100000)+
    field('perExtra','Each unit past the maximum — XP',10000)+field('extraCap','Past the maximum — at most XP',100000)+'</div>'+
    '<div class="v167-respect-actions"><button type="button" class="btn btn-sm btn-ghost" onclick="App.mf580ResetGoal()">Reset goal XP</button></div></div>';
}
if(typeof v167RespectEditorHtml==='function'){
  const mf580RespectEditorBase=v167RespectEditorHtml;
  v167RespectEditorHtml=function(){return String(mf580RespectEditorBase.apply(this,arguments)||'')+mf580GoalSettingsHtml();};
}

/* MediaFlow Recommends: what the goal is worth. */
if(typeof mf395DashboardRecommendationHtml==='function'){
  const mf580DashBase=mf395DashboardRecommendationHtml;
  mf395DashboardRecommendationHtml=function(task){
    const html=String(mf580DashBase.apply(this,arguments)||'');
    const c=mf580GoalCfg();
    if(!task||!c.enabled||!(c.min+c.max+c.perExtra)||html.includes('mf580-goal-hint'))return html;
    const {low,high}=mf580GoalBounds(task);
    const text='Goal XP: reach '+low+' for +'+c.min+' · '+high+' for +'+c.max+' more'+(c.perExtra&&c.extraCap?' · +'+c.perExtra+' each past it (up to +'+c.extraCap+')':'');
    const hint='<div class="mf580-goal-hint">'+escapeHtml(text)+'</div>';
    return html.includes('<p>Here')?html.replace('<p>Here',hint+'<p>Here'):hint+html;
  };
}
window.MediaFlowV580Goal=Object.freeze({tiers:mf580GoalTiers,due:mf580GoalDue,taskAmount:mf580TaskAmount,config:mf580GoalCfg,defaults:MF580_GOAL_DEFAULT});
