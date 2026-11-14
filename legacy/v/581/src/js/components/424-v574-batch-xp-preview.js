/* MediaFlow v574 — XP preview in Batch Log.
 *
 * Above "Log batch": "This batch earns +N XP", worked out with the same
 * pieces the save uses, read-only:
 *  - consumption XP per title: calculateConsumptionXP() with the category's
 *    health, exactly as Batch Log stores it on each session;
 *  - the day-streak multiplier (v149/v150), on the account as it would be
 *    with these sessions added (so a log on a past day that extends a streak
 *    counts what it adds);
 *  - completions, first title starts and first episodes (v542 projection);
 *  - the Batch Log bonus (v348).
 * Nothing is saved or changed: sessions are only added to a copy of the list.
 * The MediaFlow app shows the same preview in Log a title (8.0.0.574).
 *
 * Also: the live-sync probe (v572) looks strictly after the cursor; with the
 * few seconds of overlap it kept finding the last row and pulled every 5 s.
 */
const MF574={timer:null,last:null};

function mf574Rows(){
  const draft=S.batchDraft||{};
  return (Array.isArray(draft.rows)?draft.rows:[]).filter(r=>r&&r.libraryId&&Number(r.qty)>0);
}
function mf574Project(){
  if(typeof levelingSettings==='function'&&levelingSettings().enabled===false)return {xp:0,parts:null,rows:0};
  const rows=mf574Rows();
  if(!rows.length)return null;
  const date=/^\d{4}-\d{2}-\d{2}$/.test(S.batchDraft?.date||'')?S.batchDraft.date:todayISO();
  const at=(typeof mf573BatchTime==='function'&&mf573BatchTime(date,S.batchDraft?.mf573Time))||
    (date===todayISO()?Date.now():new Date(date+'T12:00:00').getTime());
  const progressMode=typeof v179Mode==='function'&&v179Mode('batch')==='progress';
  const sessions=Array.isArray(S.sessions)?S.sessions:(S.sessions=[]);
  const pushed=[],entries=[];
  const savedDraft=S.logDraft;
  let consumption=0,before=null,after=null,milestones=null,bonus=0,repeatXP=0;
  try{
    before=v150ComputeStateMetrics(S);
    for(const r of rows){
      const item=S.library.find(x=>x.id===r.libraryId);if(!item)continue;
      const cat=getCategory(item.categoryId);if(!cat)continue;
      const qty=Math.max(0,Number(r.qty)||0);
      let minutes=Math.max(0,Number(r.minutes)||0);
      if(progressMode&&!(minutes>0))minutes=typeof mf569Minutes==='function'?mf569Minutes(item,cat,qty):Math.round(qty*(Number(cat.minutesPerUnit)||0));
      const catQty=typeof mf565ToCategoryAmount==='function'?mf565ToCategoryAmount(item,cat,qty):qty;
      const repeat=item.status==='completed'||(Number(item.total)>0&&Number(item.progress)>=Number(item.total));
      const health=categoryStatus(cat),calc=calculateConsumptionXP(cat,catQty,minutes,health);
      consumption+=Number(calc.xp)||0;
      const s={id:'mf574-preview-'+pushed.length,timestamp:at,date,categoryId:cat.id,targetAmount:catQty,actualAmount:catQty,minutes,
        note:'',status:'logged',unit:cat.unit,xp:calc.xp,healthStatus:health,source:'batch',
        titles:[{title:cleanTitle(item.title),libraryId:item.id,qty,repeat,loggedAt:at}]};
      // Added for the next row's category health (as the save does), removed below.
      sessions.push(s);pushed.push(s);
      entries.push({libraryId:item.id,title:item.title,qty,isRepeat:repeat});
    }
    if(!pushed.length)return null;
    after=v150ComputeStateMetrics({...S,sessions:sessions.slice()});
    const streakMap=v149BuildStreakMap(sessions);
    const dayMultiplier=v149StreakMultiplier(streakMap.get(date)||1);
    S.logDraft={updateLibrary:true,v369Interface:'classic',v179Mode:'amount',entries,
      categoryId:pushed[0].categoryId,amount:entries.reduce((n,e)=>n+e.qty,0),minutes:pushed.reduce((n,s)=>n+s.minutes,0)};
    milestones=typeof mf542ProjectedMilestones==='function'?mf542ProjectedMilestones(dayMultiplier):null;
    // Rewatch / reread XP (v121), with the day's streak multiplier like session XP.
    if(entries.some(e=>e.isRepeat)&&typeof mf542ProjectRepeat==='function'){
      const r=mf542ProjectRepeat({categories:[]});
      repeatXP=Math.round(((Number(r.unitXP)||0)+(Number(r.fullXP)||0))*dayMultiplier);
    }
    bonus=typeof v348Enabled==='function'&&v348Enabled()?v348Multiply(v348Rate('batchLogXP')):0;
  }catch(e){
    console.warn('MediaFlow v574: Batch Log XP preview unavailable',e);
    return null;
  }finally{
    for(const s of pushed){const i=sessions.lastIndexOf(s);if(i>=0)sessions.splice(i,1);}
    S.logDraft=savedDraft;
  }
  const history=Math.max(0,Math.round((Number(after?.historyXP)||0)-(Number(before?.historyXP)||0)));
  const m=milestones||{};
  const library=['completionXP','completionBonusXP','completionStreakXP','titleStartXP','firstEpisodeXP']
    .reduce((n,k)=>n+(Number(m[k])||0),0);
  const xp=history+library+bonus+repeatXP;
  return {xp,rows:pushed.length,parts:{consumption:Math.round(consumption),streak:Math.max(0,history-Math.round(consumption)),library,bonus,repeat:repeatXP,completions:m.completions||0}};
}
function mf574Html(p){
  if(!p||!p.parts)return '';
  const bits=[];
  bits.push(p.parts.consumption.toLocaleString()+' consumption');
  if(p.parts.streak)bits.push('+'+p.parts.streak.toLocaleString()+' streak');
  if(p.parts.repeat)bits.push('+'+p.parts.repeat.toLocaleString()+' rewatch / reread');
  if(p.parts.library)bits.push('+'+p.parts.library.toLocaleString()+(p.parts.completions?' completion':' title milestones'));
  if(p.parts.bonus)bits.push('+'+p.parts.bonus.toLocaleString()+' Batch Log bonus');
  return '<span class="mf574-xp-icon" aria-hidden="true">✦</span><span><b>This batch earns +'+Math.round(p.xp).toLocaleString()+' XP</b>'+
    '<small>'+escapeHtml(bits.join(' · '))+'</small></span>';
}
function mf574Paint(){
  const el=document.getElementById('mf574-batch-xp');if(!el)return;
  let p=null;try{p=mf574Project();}catch(_){p=null;}
  MF574.last=p;
  const html=mf574Html(p);
  el.innerHTML=html;el.hidden=!html;
}
function mf574Schedule(){clearTimeout(MF574.timer);MF574.timer=setTimeout(mf574Paint,250);}

// The preview line, above the Batch Log buttons.
const mf574RenderBatchBase=renderBatchLog;
renderBatchLog=function(){
  const html=String(mf574RenderBatchBase.apply(this,arguments)||'');
  if(html.includes('mf574-batch-xp'))return html;
  setTimeout(mf574Paint,0);
  return html.replace('<div class="batch-log-actions">','<div class="mf574-batch-xp" id="mf574-batch-xp" aria-live="polite" hidden></div><div class="batch-log-actions">');
};
// Typing an amount, minutes or progress doesn't redraw the page: follow inputs.
document.addEventListener('input',e=>{if(e.target?.closest?.('#mf565-batch,.page-batch'))mf574Schedule();},true);
document.addEventListener('change',e=>{if(e.target?.closest?.('#mf565-batch,.page-batch'))mf574Schedule();},true);

/* The v572 live probe: strictly after the cursor. */
if(typeof mf572Probe==='function'){
  mf572Probe=async function(){
    if(MF572_LIVE.probing||!MF556.migrated||!AUTH_USER||!supabase||!navigator.onLine||document.visibilityState==='hidden')return false;
    if(!MF556.cursor||MF556.pulling||MF556.cursor.startsWith('1970'))return false;
    MF572_LIVE.probing=true;
    try{
      MF572_LIVE.probes++;
      const {data,error}=await supabase.from(MF556_TABLE).select('updated_at').eq('user_id',AUTH_USER.id).gt('updated_at',MF556.cursor)
        .or('device_id.is.null,device_id.neq.'+mf556Device()).order('updated_at',{ascending:true}).limit(1);
      if(error)throw error;
      if(!data||!data.length)return false;
      MF572_LIVE.hits++;
      await mf556Pull();
      return true;
    }catch(e){MF572_LIVE.lastError=String(e?.message||e);return false;}
    finally{MF572_LIVE.probing=false;}
  };
}

window.MediaFlowV574={version:574,project:mf574Project};
