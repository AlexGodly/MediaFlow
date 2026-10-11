/* MediaFlow v81 — Repeat Consumption (Rewatch / Reread) */
function v81RepeatTotals(){
  const byTitle=new Map(); let sessions=0,minutes=0,episodes=0,chapters=0,issues=0,movies=0;
  for(const sess of (S.sessions||[])){
    let sessionHadRepeat=false;
    for(const t of (sess.titles||[])){
      const itemized=Array.isArray(t?.v369Units)&&t.v369Itemized===true;
      if(!t?.repeat&&!itemized) continue;
      const item=t.libraryId?S.library.find(i=>i.id===t.libraryId):null;
      const key=item?.id||t.libraryId; if(!key) continue;
      const unit=getCategory(item?.categoryId||sess.categoryId)?.unit||sess.unit||'units';
      const amount=itemized?t.v369Units.filter(u=>t.repeat||u.isRepeat===true).length:Math.max(0,Number(t.qty)||0);
      if(!amount)continue;
      sessionHadRepeat=true;
      const rec=byTitle.get(key)||{title:cleanTitle(t.title),amount:0,loggedAmount:0,manualAmount:0,unit,total:Number(item?.total)||0,completedRepeats:0};
      rec.loggedAmount+=amount; rec.amount+=amount; rec.total=Number(item?.total)||rec.total||0; rec.unit=unit;
      byTitle.set(key,rec);
      if(unit==='episodes')episodes+=amount; else if(unit==='chapters')chapters+=amount; else if(unit==='issues')issues+=amount; else if(unit==='movies')movies+=amount;
    }
    if(sessionHadRepeat){ sessions++; minutes+=Math.max(0,Number(sess.minutes)||0); }
  }
  // v83: manual past repeats live on the Library title. They count as lifetime repeat
  // consumption, but deliberately create no History session, XP, minutes, streak, or scheduler activity.
  for(const item of (S.library||[])){
    const manual=Math.max(0,Math.floor(Number(item.manualRepeatAmount)||0)); if(!manual) continue;
    const unit=getCategory(item.categoryId)?.unit||'units';
    const rec=byTitle.get(item.id)||{title:cleanTitle(item.title),amount:0,loggedAmount:0,manualAmount:0,unit,total:Number(item.total)||0,completedRepeats:0};
    rec.manualAmount=manual; rec.amount=(Number(rec.loggedAmount)||0)+manual; rec.total=Number(item.total)||0; rec.unit=unit; byTitle.set(item.id,rec);
    if(unit==='episodes')episodes+=manual; else if(unit==='chapters')chapters+=manual; else if(unit==='issues')issues+=manual; else if(unit==='movies')movies+=manual;
  }
  for(const rec of byTitle.values()) rec.completedRepeats=rec.total>0?Math.floor(rec.amount/rec.total):0;
  return {byTitle,sessions,minutes,episodes,chapters,issues,movies};
}
function v81RepeatLabel(item){
  const r=v81RepeatTotals().byTitle.get(item.id); if(!r||!r.amount)return '';
  const noun=(getCategory(item.categoryId)?.type==='reading')?'Reread':'Rewatched';
  const cycles=r.completedRepeats?` · ${r.completedRepeats} full ${r.completedRepeats===1?'repeat':'repeats'}`:'';
  return `${noun}: ${r.amount.toLocaleString()} ${unitLabel(r.unit,r.amount)}${cycles}`;
}
