/* MediaFlow v573 — Batch Log: an exact time as well as a date.
 *
 * Next to "Consumption date" there's now a time. Empty keeps the old rule
 * (now for today, midday for another day). With a time, every session and
 * title of that Batch Log is saved at that date and time (never later than
 * now), so History, Statistics and streaks show when you really consumed.
 * Saved as S.batchDraft.mf573Time ('HH:MM', this device's local time).
 * The MediaFlow app (7.2.0.573) has the same time picker in Log a title.
 */
function mf573BatchTime(date,time,now=Date.now()){
  const m=/^(\d{1,2}):(\d{2})$/.exec(String(time||'').trim());
  const d=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date||''));
  if(!m||!d)return 0;
  const h=Number(m[1]),mi=Number(m[2]);
  if(h>23||mi>59)return 0;
  const at=new Date(Number(d[1]),Number(d[2])-1,Number(d[3]),h,mi,0,0).getTime();
  if(!Number.isFinite(at))return 0;
  return Math.min(at,now);
}
App.mf573SetBatchTime=function(value){
  ensureBatchDraft();
  const v=String(value||'').trim();
  S.batchDraft.mf573Time=/^\d{1,2}:\d{2}$/.test(v)?v:'';
};

// The time field, next to the date.
const mf573RenderBatchBase=renderBatchLog;
renderBatchLog=function(){
  const html=String(mf573RenderBatchBase.apply(this,arguments)||'');
  if(html.includes('mf573-batch-time'))return html;
  const t=escapeHtml(S.batchDraft?.mf573Time||'');
  const input='<input type="time" class="mf573-batch-time" value="'+t+'" aria-label="Time (optional)" title="Time (optional: empty = now today, midday on other days)" onchange="App.mf573SetBatchTime(this.value)">';
  return html.replace(/<input type="date"[\s\S]*?v331DateOverride=true">/,m=>'<div class="mf573-when">'+m+input+'</div>')
    .replace('<label class="field-label">Consumption date</label>','<label class="field-label">Consumption date &amp; time</label>');
};

// Saving: the sessions of this Batch Log get the chosen date and time.
const mf573SubmitBatchBase=App.submitBatchLog;
App.submitBatchLog=function(){
  const time=S.batchDraft?.mf573Time||'';
  const date=/^\d{4}-\d{2}-\d{2}$/.test(S.batchDraft?.date||'')?S.batchDraft.date:todayISO();
  const at=mf573BatchTime(date,time);
  const known=new Set((S.sessions||[]).map(s=>s&&s.id));
  const finish=()=>{
    if(!at)return;
    let changed=0;
    for(const s of S.sessions||[]){
      if(!s||known.has(s.id)||s.source!=='batch')continue;
      s.timestamp=at;
      for(const t of Array.isArray(s.titles)?s.titles:[])if(t&&typeof t==='object')t.loggedAt=at;
      changed++;
    }
    if(changed){try{saveState();}catch(_){}try{if(typeof V153_HISTORY_CACHE_DIRTY!=='undefined')V153_HISTORY_CACHE_DIRTY=true;}catch(_){}}
  };
  const result=mf573SubmitBatchBase.apply(this,arguments);
  if(result&&typeof result.then==='function')return result.then(r=>{finish();return r;});
  finish();return result;
};

window.MediaFlowV573={version:573,time:mf573BatchTime};
