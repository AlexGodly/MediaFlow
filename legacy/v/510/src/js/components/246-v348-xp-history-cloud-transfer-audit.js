/* MediaFlow v348 — XP History tab, event provenance, cloud/transfer coverage.
 * All event metadata is stored in xpLedger.v348EventMeta and automatically
 * follows existing cloud state, full backups and device merges. */
const V348_XP_PAGE_SIZES=[10,25,50,100];
const V348_XP_HISTORY_UI={page:0,size:25,query:'',source:'all'};
if(!V260_HISTORY_TABS.includes('xp'))V260_HISTORY_TABS.push('xp');
V260_HISTORY_LABELS.xp='XP';
const v348HistoryTabsBase=v260HistoryTabsHtml;
v260HistoryTabsHtml=function(active=v260HistoryTab()){
  // The final v271 tabs renderer owns the live navigation; add a real tab to
  // its generated markup rather than changing an obsolete v260 renderer.
  let html=v348HistoryTabsBase.apply(this,arguments);
  if(!html.includes("App.v260SetHistoryTab('xp')")){
    const icon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 3h12v5a6 6 0 0 1-12 0Z"/><path d="M12 14v5M8 22h8M6 5H3v2a4 4 0 0 0 4 4M18 5h3v2a4 4 0 0 1-4 4"/></svg>';
    const cls=active==='xp'?' active':'';
    const tab=`<button type="button" role="tab" aria-selected="${active==='xp'}" class="v260-history-tab v348-xp-history-tab${cls}" onclick="App.v260SetHistoryTab('xp')">${icon}<span>XP</span></button>`;
    html=html.replace('</div>',tab+'</div>');
  }
  const xpIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v5a6 6 0 0 1-12 0ZM12 14v5M8 22h8M6 5H3v2a4 4 0 0 0 4 4M18 5h3v2a4 4 0 0 1-4 4"/></svg>';
  html=html.replace("onclick=\"App.v260SetHistoryTab('xp')\">","onclick=\"App.v260SetHistoryTab('xp')\">"+xpIcon);
  return html;
};
// Also patch v271's direct binding (v260HistoryTabsHtml already points there
// after v271 loads; no extra global icon decoration is required on the XP tab).
function v348HistoryEntries(ledger=S.xpLedger,sessions=S.sessions,library=S.library){
  const result=[],L=ledger||{},meta=L.v348EventMeta||{};
  const nameById=new Map((library||[]).filter(x=>x?.id).map(x=>[String(x.id),String(x.title||'')]));
  const seenAmounts=new Map();
  for(const [key,row] of Object.entries(meta)){
    if(!row||typeof row!=='object'||!Number.isFinite(Number(row.xp)))continue;
    const timestamp=Number(row.timestamp)||0,kind=String(row.kind||'other'),subjectId=String(row.subjectId||'');
    if(subjectId){const track=kind+'\0'+subjectId;seenAmounts.set(track,(seenAmounts.get(track)||0)+Math.max(0,Number(row.xp)||0));}
    result.push({id:'event:'+key,source:String(row.source||v348SourceLabel(kind)),kind,subjectId,title:nameById.get(subjectId)||'',timestamp,baseXP:Math.max(0,Number(row.baseXP)||0),multiplier:Number(row.multiplier)||1,xp:Math.max(0,Number(row.xp)||0),details:row.details||'',legacy:false});
  }
  // Only new action XP is stored as a total in a separate map; the event meta
  // above is its source of truth for timing. Keep a safe fallback for imported
  // v348 actions from backups without metadata.
  for(const [id,value] of Object.entries(L.v348ActionEvents||{})){
    if(meta[id])continue;
    const kind=String(id).split(':')[0];
    result.push({id:'action:'+id,source:v348SourceLabel(kind),kind,xp:Number(value)||0,baseXP:null,multiplier:null,timestamp:0,legacy:true});
  }
  for(const s of (Array.isArray(sessions)?sessions:[])){
    if(!s||s.status==='skipped')continue;
    const xp=Math.max(0,Math.round(Number(s.xpWithStreak??s.xp)||0));if(!xp)continue;
    const base=Number(s.streakBaseXP??s.xp)||0;
    const title=(Array.isArray(s.titles)?s.titles:[]).map(t=>String(t?.title||nameById.get(String(t?.libraryId||''))||'')).filter(Boolean).slice(0,3).join(', ');
    result.push({id:'log:'+String(s.id||s.timestamp),kind:'consumption',source:s.source==='batch'?'Batch Log · consumption':'Consumption log',timestamp:Number(s.timestamp)||0,title,details:String(s.note||''),xp,baseXP:base,multiplier:Number(s.streakMultiplier)||1,streak:Number(s.streakAtLog)||0,sessionId:String(s.id||'')});
  }
  for(const [date,row] of Object.entries(L.v334ActiveTimeDays||{})){
    const xp=Math.max(0,Number(row?.xp)||0);if(!xp)continue;
    result.push({id:'time:'+date,kind:'activeTime',source:'Active app time',timestamp:/^\d{4}-\d{2}-\d{2}$/.test(date)?new Date(date+'T12:00:00').getTime():0,details:`${v334Duration(Number(row?.ms)||0)} active`,xp,baseXP:xp/(Number(row?.multiplier)||1),multiplier:Number(row?.multiplier)||1,streak:Number(row?.streak)||0,grouped:true});
  }
  const legacy=[
    ['libraryEdits','Library · edited title'],['manualCovers','Library · manual cover'],['ratings','Rating reward'],
    ['v334StartedTitles','First title start'],['v335FirstEpisodeRewards','First episode'],
    ['v334CollectionCreates','Collection created'],['v334CollectionEdits','Collection edited'],
    ['logCompletions','Log completion bonus'],['libraryAdditions','Library · added title']
  ];
  for(const [key,label] of legacy){
    for(const [id,value] of Object.entries(L[key]||{})){
      const xp=Math.max(0,Number(value)||0),recorded=seenAmounts.get(key+'\0'+id)||0,residual=Math.max(0,xp-recorded);
      if(!residual)continue;
      result.push({id:'legacy:'+key+':'+id,kind:key,source:label,title:nameById.get(id)||'',subjectId:id,xp:residual,timestamp:0,multiplier:null,baseXP:null,legacy:true});
    }
  }
  // The underlying level engine calculates these dynamically from Library
  // title/completion counts; no historical creation timestamps exist for them.
  return result.sort((a,b)=>(b.timestamp||0)-(a.timestamp||0)||a.id.localeCompare(b.id));
}
function v348XpHistoryFiltered(){
  const ui=V348_XP_HISTORY_UI,q=ui.query.trim().toLowerCase();
  return v348HistoryEntries().filter(x=>(ui.source==='all'||x.kind===ui.source)&&(!q||[x.source,x.title,x.details,x.kind].join(' ').toLowerCase().includes(q)));
}
function v348XpHistoryHtml(){
  const ui=V348_XP_HISTORY_UI,rows=v348XpHistoryFiltered(),pageSize=ui.size,pages=Math.max(1,Math.ceil(rows.length/pageSize));
  ui.page=Math.min(Math.max(0,ui.page),pages-1);
  const slice=rows.slice(ui.page*pageSize,(ui.page+1)*pageSize);
  const sum=rows.reduce((total,r)=>total+r.xp,0);
  const known=rows.filter(r=>r.timestamp>0).length;
  const sources=[...new Set(v348HistoryEntries().map(r=>r.kind))].sort();
  const icons={activeTime:'clock',consumption:'play'};
  return `<section class="v348-xp-page" aria-label="XP History">
    <div class="v348-xp-hero"><div><small>PROGRESSION JOURNAL</small><h2>XP History</h2><p>Every available award, source and streak multiplier—built from your saved XP records.</p></div><div class="v348-xp-hero-total"><small>Current account XP</small><strong>${Math.round(mediaFlowXP()).toLocaleString()} XP</strong></div></div>
    <div class="v348-xp-metrics"><div><span>Recorded award entries</span><strong>${rows.length.toLocaleString()}</strong></div><div><span>XP represented by these entries</span><strong>${Math.round(sum).toLocaleString()} XP</strong></div><div><span>Dated entries</span><strong>${known.toLocaleString()}</strong></div></div>
    <div class="v348-xp-toolbar"><label class="v348-xp-search"><span>Search XP history</span><input type="search" id="v348-xp-search" value="${escapeHtml(ui.query)}" placeholder="Search source, title, reward…" oninput="App.v348HistorySetFilter('query',this.value)"></label><label><span>Source</span><select id="v348-xp-source" onchange="App.v348HistorySetFilter('source',this.value)"><option value="all">All XP sources</option>${sources.map(s=>`<option value="${escapeHtml(s)}" ${ui.source===s?'selected':''}>${escapeHtml(v348SourceLabel(s))}</option>`).join('')}</select></label><label><span>Entries / page</span><select id="v348-xp-page-size" onchange="App.v348HistorySetFilter('size',this.value)">${V348_XP_PAGE_SIZES.map(n=>`<option value="${n}" ${ui.size===n?'selected':''}>${n}</option>`).join('')}</select></label><button type="button" class="btn btn-sm" data-v225-icon="export" onclick="App.v348ExportXPHistory('csv')">Export CSV</button><button type="button" class="btn btn-sm" data-v225-icon="export" onclick="App.v348ExportXPHistory('json')">Export JSON</button></div>
    <div class="v348-xp-list">${slice.length?slice.map(row=>{
      const when=row.timestamp?new Date(row.timestamp).toLocaleString():'Earlier award · timestamp unavailable';
      const mult=row.multiplier!=null?'×'+Number(row.multiplier).toFixed(2):'Not recorded';
      const base=row.baseXP!=null?`${Math.round(row.baseXP).toLocaleString()} base XP`:'Base XP unavailable';
      return `<article class="v348-xp-entry"><div class="v348-xp-entry-mark" aria-hidden="true">✦</div><div class="v348-xp-entry-main"><div class="v348-xp-entry-heading"><strong>${escapeHtml(row.source)}</strong><span>${escapeHtml(when)}</span></div>${row.title?`<div class="v348-xp-entry-title">${escapeHtml(row.title)}</div>`:''}${row.details?`<p>${escapeHtml(row.details)}</p>`:''}<div class="v348-xp-entry-details"><span>${escapeHtml(base)}</span><span>Streak multiplier ${escapeHtml(mult)}</span>${row.streak?`<span>${row.streak} day streak</span>`:''}${row.legacy?'<span>Legacy data · original multiplier unavailable</span>':''}${row.grouped?'<span>Daily activity total</span>':''}</div></div><div class="v348-xp-entry-award">+${Math.round(row.xp).toLocaleString()}<small>XP</small></div></article>`;
    }).join(''):'<div class="v348-xp-empty">No XP entries match these filters.</div>'}</div>
    <div class="v348-xp-pagination"><span>Showing ${rows.length?ui.page*pageSize+1:0}–${Math.min(rows.length,(ui.page+1)*pageSize)} of ${rows.length.toLocaleString()}</span><div><button type="button" class="btn btn-sm" ${ui.page===0?'disabled':''} onclick="App.v348HistoryPage(${ui.page-1})">Previous</button><span>Page ${ui.page+1} of ${pages}</span><button type="button" class="btn btn-sm" ${ui.page>=pages-1?'disabled':''} onclick="App.v348HistoryPage(${ui.page+1})">Next</button></div></div>
    <p class="v348-xp-footnote">Older XP ledgers did not record every award's timestamp or multiplier, and Library-count XP is calculated from the current Library rather than individual dated awards. Missing history details are not fabricated. Editing/deleting past logs may change their computed XP.</p>
  </section>`;
}
const v348HistoryBodyBase=v260HistoryBody;
v260HistoryBody=function(tab){if(tab==='xp')return v348XpHistoryHtml();return v348HistoryBodyBase.apply(this,arguments);};
function v348RefreshXP(){if(S.view==='history'&&v260HistoryTab()==='xp'&&typeof v341HistoryBodyRefresh==='function'&&v341HistoryBodyRefresh())return;render();}
App.v348HistoryPage=function(n){V348_XP_HISTORY_UI.page=Math.max(0,Number(n)||0);v348RefreshXP();};
App.v348HistorySetFilter=function(key,value){
  const ui=V348_XP_HISTORY_UI;
  if(key==='size')ui.size=V348_XP_PAGE_SIZES.includes(Number(value))?Number(value):25;
  else if(key==='source')ui.source=String(value||'all');
  else if(key==='query')ui.query=String(value||'');
  ui.page=0;
  const focused=key==='query',node=focused?document.querySelector('#v348-xp-search'):null;
  const pos=node?.selectionStart??null;
  v348RefreshXP();
  if(focused){const next=document.querySelector('#v348-xp-search');if(next){next.focus({preventScroll:true});try{if(pos!=null)next.setSelectionRange(pos,pos);}catch(_){}}}
};
App.v348ExportXPHistory=function(format='csv'){
  const rows=v348XpHistoryFiltered(),name=`MediaFlow_v348_XP_History_${todayISO()}`;
  if(format==='json'){const payload=JSON.stringify({mediaflowVersion:v161CurrentVersion(),type:'mediaflow-xp-history',exportedAt:new Date().toISOString(),rows},null,2);const u=URL.createObjectURL(new Blob([payload],{type:'application/json'}));const a=document.createElement('a');a.href=u;a.download=name+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);return;}
  const header=['timestamp','source','kind','title','base_xp','streak_multiplier','streak_days','xp','details','legacy'];
  const quote=x=>'"'+String(x??'').replace(/"/g,'""')+'"';
  const content=[header.join(','),...rows.map(x=>[x.timestamp?new Date(x.timestamp).toISOString():'',x.source,x.kind,x.title||'',x.baseXP??'',x.multiplier??'',x.streak??'',x.xp,x.details||'',!!x.legacy].map(quote).join(','))].join('\r\n');
  const url=URL.createObjectURL(new Blob(['\uFEFF'+content],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download=name+'.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
window.MediaFlowV348XPHistory={version:348,events:v348HistoryEntries};

// Confirm v348 preferences and metadata use the current export builders.
const v348PresetBase=v196BuildSettingsPreset;
v196BuildSettingsPreset=function(){
 const payload=v348PresetBase.apply(this,arguments);
 payload.presetManifest=payload.presetManifest||{};
 payload.presetManifest.v348={release:v161CurrentVersion(),universalStreakMultiplier:true,actionRewards:Object.keys(V348_REWARD_DEFAULTS).filter(x=>x.endsWith('XP')),xpHistory:'Personal event history is in Full Backup, not Settings Presets'};
 return payload;
};
const v348BackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
 const payload=v348BackupBase.apply(this,arguments);
 payload.backupManifest=payload.backupManifest||{};
 payload.backupManifest.v348={release:v161CurrentVersion(),actionEvents:Object.keys(payload.xpLedger?.v348ActionEvents||{}).length,xpHistoryMetadata:Object.keys(payload.xpLedger?.v348EventMeta||{}).length,settingsIncluded:true,cloudFormatUnchanged:true};
 return payload;
};
backupSnapshot=function(){return v148BuildFullBackup();};
const v348CloudVerifyBase=v155VerifyCloudState;
v155VerifyCloudState=function(remote,expected){
 const result=v348CloudVerifyBase.apply(this,arguments)||{ok:true,missing:[]};
 const missing=new Set(result.missing||[]);
 if(v250Fingerprint({data:remote?.xpLedger?.v348ActionEvents||{}})!==v250Fingerprint({data:expected?.xpLedger?.v348ActionEvents||{}}))missing.add('XP action events content');
 if(v250Fingerprint({data:remote?.xpLedger?.v348EventMeta||{}})!==v250Fingerprint({data:expected?.xpLedger?.v348EventMeta||{}}))missing.add('XP History metadata content');
 if(v250Fingerprint({data:remote?.settings?.leveling?.globalStreakMultiplierEnabled??true})!==v250Fingerprint({data:expected?.settings?.leveling?.globalStreakMultiplierEnabled??true}))missing.add('Universal XP multiplier setting');
 return {ok:missing.size===0,missing:[...missing]};
};
