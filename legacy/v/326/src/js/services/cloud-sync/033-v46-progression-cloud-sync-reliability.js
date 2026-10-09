/* ============================================================
   v46 — Progression + Cloud Sync Reliability
   Keeps the v45 scheduler formula intact. Adds deterministic XP
   recovery from Library/History and explicit force-sync controls.
   ============================================================ */

function v46Yield(){ return new Promise(r=>setTimeout(r,0)); }
function v46CompletedLibraryCount(){ return (S.library||[]).filter(i=>i && (i.status==='completed' || (i.total!=null && Number(i.total)>0 && Number(i.progress)>=Number(i.total)))).length; }
function v46LibraryBaseXP(){
  if(levelingSettings().enabled===false) return 0;
  const add=Math.max(0,Math.round(Number(levelingSettings().libraryAdditionXP)||0));
  const complete=Math.max(0,Math.round(Number(levelingSettings().completionXP)||0));
  return (S.library||[]).length*add + v46CompletedLibraryCount()*complete;
}
function v46ExtraLibraryXP(){
  const edits=Object.values(S.xpLedger?.libraryEdits||{}).reduce((a,v)=>a+(Number(v)||0),0);
  const covers=Object.values(S.xpLedger?.manualCovers||{}).reduce((a,v)=>a+(Number(v)||0),0);
  return edits+covers;
}
// v46 source of truth: current Library earns the configured title + completion XP.
// Existing edit/manual-cover ledgers remain event based and are preserved.
libraryXPTotal=function(){ return v46LibraryBaseXP()+v46ExtraLibraryXP(); };

sessionStoredXP=function(s){
  if(!s || s.status==='skipped') return 0;
  const stored=Number(s.xp);
  if(Number.isFinite(stored) && stored>0) return stored;
  // Imported/legacy history frequently contains xp:0 because the old importer
  // created history before progression was reconstructed. Positive consumption
  // must still contribute XP after restore/import.
  if((Number(s.actualAmount)||0)>0 && (Number(s.minutes)||0)>0){
    const cat=getCategory(s.categoryId);
    return calculateConsumptionXP(cat,Number(s.actualAmount)||0,Number(s.minutes)||0,s.healthStatus||'healthy').xp;
  }
  return 0;
};

async function v46RecalculateXP(force=false){
  const sessions=S.sessions||[], total=Math.max(1,sessions.length);
  for(let i=0;i<sessions.length;i++){
    const x=sessions[i];
    if(!x || x.status==='skipped'){ if(x) x.xp=0; continue; }
    const should=force || !Number.isFinite(Number(x.xp)) || (Number(x.xp)===0 && (Number(x.actualAmount)||0)>0 && (Number(x.minutes)||0)>0);
    if(should){
      const cat=getCategory(x.categoryId);
      x.xp=calculateConsumptionXP(cat,Number(x.actualAmount)||0,Number(x.minutes)||0,x.healthStatus||'healthy').xp;
    }
    if(i && i%500===0){ updateDataProgress(12+Math.round((i/total)*58),`Calculating History XP… ${i.toLocaleString()} / ${sessions.length.toLocaleString()}`); await v46Yield(); }
  }
  // Rebuild completion timeline from Library when an old backup did not contain it.
  S.completionTimeline=Array.isArray(S.completionTimeline)?S.completionTimeline:[];
  const seen=new Set(S.completionTimeline.map(x=>x?.libraryId).filter(Boolean));
  for(const item of (S.library||[])){
    const complete=item && (item.status==='completed' || (item.total!=null && Number(item.total)>0 && Number(item.progress)>=Number(item.total)));
    if(complete && !seen.has(item.id)){
      S.completionTimeline.push({libraryId:item.id,title:cleanTitle(item.title),categoryId:item.categoryId,completedAt:item.completedAt||item.createdAt||Date.now()});
      seen.add(item.id);
    }
  }
  return mediaFlowLevelInfo();
}

async function v46RefreshSchedulerProgress(){
  updateDataProgress(76,'Refreshing scheduler balance…'); await v46Yield();
  // Force all v45 scheduler inputs to be evaluated without changing its formula.
  for(const c of (S.categories||[]).filter(c=>c.enabled!==false)) categoryBalance(c);
  computeScores([]);
}

function v46ApplyState(d){
  d=d||{};
  S.categories=d.categories||S.categories||JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
  v74ApplyCategoryOrder(d.categoryOrder||d.settings?.categoryOrder||[]);
  S.library=sanitizeLibrary(d.library||[]);
  S.sessions=Array.isArray(d.sessions)?d.sessions:[];
  S.settings=Object.assign({},DEFAULT_SETTINGS,d.settings||{});
  S.settings.backup=Object.assign({},DEFAULT_SETTINGS.backup,d.settings?.backup||{});
  S.settings.leveling=Object.assign({},DEFAULT_SETTINGS.leveling,d.settings?.leveling||{});
  S.settings.leveling.unitXP=Object.assign({},DEFAULT_SETTINGS.leveling.unitXP,d.settings?.leveling?.unitXP||{});
  S.settings.leveling.rotationMultiplier=Object.assign({},DEFAULT_SETTINGS.leveling.rotationMultiplier,d.settings?.leveling?.rotationMultiplier||{});
  S.currentTask=d.currentTask||null; S.sessionActive=!!d.sessionActive;
  S.profilePicture=String(d.profilePicture||S.profilePicture||'').trim();
  S.stopwatch=Object.assign({running:false,startedAt:0,elapsed:0,resetValue:0},d.stopwatch||{});
  S.malLink=Object.assign({username:'',mode:'anime'},d.malLink||{});
  S.xpLedger=Object.assign({libraryAdditions:{}},d.xpLedger||{});
  S.xpLedger.libraryAdditions=Object.assign({},d.xpLedger?.libraryAdditions||{});
  S.completionTimeline=Array.isArray(d.completionTimeline)?d.completionTimeline:[];
  normalizeSeasonalLibraryItems();
}

async function v46CalculateXPNow(){
  showDataProgress('Calculate XP now','Scanning Library and History…',6);
  try{updateDataProgress(10,`Checking ${(S.library||[]).length.toLocaleString()} Library titles and ${(S.sessions||[]).length.toLocaleString()} History logs…`);
    const info=await v46RecalculateXP(true);
    updateDataProgress(74,'Rebuilding completion and Library XP…'); await v46Yield();
    await v46RefreshSchedulerProgress();
    updateDataProgress(88,'Saving recalculated progression to cloud…');
    await saveState();
    render();
    finishDataProgress(true,'XP calculation complete',`Level ${info.level} · ${info.xp.toLocaleString()} lifetime XP · Menu and Statistics updated.`);
  }catch(e){ console.error(e); finishDataProgress(false,'XP calculation failed',friendlyAuthError?.(e)||String(e?.message||e)); }
}

async function v46SyncNow(){
  showDataProgress('Sync now','Preparing local MediaFlow data…',5);
  try{
    await saveQueue;
    updateDataProgress(14,'Reading your cloud state…');
    const remote=await rawGet(STATE_KEY);
    updateDataProgress(28,'Merging cloud and local Library + History…'); await v46Yield();
    const local=snapshot();
    const merged=remote?mergeStates(local,remote):local;
    v46ApplyState(merged);
    updateDataProgress(42,'Recalculating missing progression…');
    await v46RecalculateXP(false);
    updateDataProgress(72,'Refreshing scheduler…'); await v46RefreshSchedulerProgress();
    updateDataProgress(88,'Uploading one optimized cloud state…');
    await saveState(); await saveQueue;
    const info=mediaFlowLevelInfo();
    render();
    finishDataProgress(true,'Sync complete',`${(S.library||[]).length.toLocaleString()} titles · ${(S.sessions||[]).length.toLocaleString()} logs · Level ${info.level} · ${info.xp.toLocaleString()} XP`);
  }catch(e){ console.error(e); finishDataProgress(false,'Sync failed',String(e?.message||e)); }
}

// MediaFlow v99 — canonical full backup export.
// This is the final exportJSON override used at runtime, so the requested filename
// cannot be replaced by the older v50 compatibility override.
App.exportJSON=function(){
  showDataProgress('Exporting MediaFlow backup','Preparing complete MediaFlow state…',15);
  setTimeout(()=>{try{
    const now=new Date();
    const pad=n=>String(n).padStart(2,'0');
    const stamp=`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    const payload=Object.assign({},snapshot(),{
      backupFormat:'MediaFlow_Full_Backup',
      backupVersion:182,
      mediaFlowVersion:182,
      exportedAt:now.toISOString(),
      progression:mediaFlowLevelInfo(),
      progressionBreakdown:v120XPBreakdown()
    });
    updateDataProgress(65,'Packing complete MediaFlow state…');
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    updateDataProgress(88,'Creating download…');
    triggerDownload(blob,`MediaFlow_Backup_${stamp}.json`);
    finishDataProgress(true,'Export successful',`Complete backup created: MediaFlow_Backup_${stamp}.json`);
  }catch(e){console.error(e);finishDataProgress(false,'Export failed','MediaFlow could not create the backup file.');}},40);
};

App.importJSON=function(file){
  if(!file)return;
  showDataProgress('Importing MediaFlow backup','Reading backup file…',5);
  const reader=new FileReader();
  reader.onprogress=e=>{if(e.lengthComputable)updateDataProgress(Math.min(22,5+Math.round((e.loaded/e.total)*17)),'Reading backup…');};
  reader.onload=async()=>{try{
    const data=JSON.parse(reader.result);
    updateDataProgress(25,'Restoring Library, History, settings and progression…');
    v46ApplyState(data);
    updateDataProgress(36,'Reconstructing XP from restored data…');
    const info=await v46RecalculateXP(false);
    await v46RefreshSchedulerProgress();
    updateDataProgress(88,'Saving restored state to cloud…'); await saveState(); await saveQueue;
    render();
    finishDataProgress(true,'Import successful',`${(S.library||[]).length.toLocaleString()} titles · ${(S.sessions||[]).length.toLocaleString()} logs · Level ${info.level} · ${info.xp.toLocaleString()} XP`);
  }catch(e){console.error(e);finishDataProgress(false,'Import failed','Could not restore that MediaFlow JSON backup.');}};
  reader.onerror=()=>finishDataProgress(false,'Import failed','The file could not be read.'); reader.readAsText(file);
};

// Add the two explicit v46 controls without disturbing the existing Settings layout.
const v46SettingsBase=renderSettings;
renderSettings=function(){
  let h=v46SettingsBase();
  const xpButton=`<div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border-soft);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap"><div><b style="font-size:13px">Progression repair</b><div class="hint">Force a full XP calculation from Library + History using the optimized large-library repair path, then refresh every Level/XP display.</div></div><button class="btn btn-primary" onclick="App.calculateXPNow()">Calculate XP now</button></div>`;
  h=h.replace('</div>\n\n        <div class="section-label settings-section-head"><span>IMPORT / EXPORT — MEDIA SERVICES</span>',xpButton+'</div>\n\n        <div class="section-label settings-section-head"><span>IMPORT / EXPORT — MEDIA SERVICES</span>');
  const syncCard=`<div class="section-label">CLOUD SYNC</div><div class="card" style="margin-bottom:22px"><div style="display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap"><div><b>Synchronize MediaFlow</b><div class="hint">Merge cloud + local data, refresh XP and scheduler calculations with the optimized large-library path, then upload one complete protected state.</div></div><button class="btn btn-primary" onclick="App.syncNow()">Sync now</button></div></div>`;
  h=h.replace('<div class="section-label">DATA</div>',syncCard+'<div class="section-label">DATA</div>');
  return h;
};
Object.assign(App,{calculateXPNow:v46CalculateXPNow,syncNow:v46SyncNow});

