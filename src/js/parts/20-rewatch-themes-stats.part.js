/* MediaFlow v81 — Repeat Consumption (Rewatch / Reread) */
function v81RepeatTotals(){
  const byTitle=new Map(); let sessions=0,minutes=0,episodes=0,chapters=0,issues=0,movies=0;
  for(const sess of (S.sessions||[])){
    let sessionHadRepeat=false;
    for(const t of (sess.titles||[])){
      if(!t?.repeat) continue;
      sessionHadRepeat=true;
      const item=t.libraryId?S.library.find(i=>i.id===t.libraryId):null;
      const key=item?.id||t.libraryId; if(!key) continue;
      const unit=getCategory(item?.categoryId||sess.categoryId)?.unit||sess.unit||'units';
      const amount=Math.max(0,Number(t.qty)||0);
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
/* MediaFlow v82 — per-title Rewatch / Reread visibility */
function v82RepeatSummary(item,r){
  if(!r||!r.amount) return '';
  const reading=getCategory(item.categoryId)?.type==='reading';
  const action=reading?'Reread':'Rewatched';
  const total=Math.max(0,Number(r.total)||0);
  const full=total>0?Math.floor(r.amount/total):0;
  const current=total>0?(r.amount%total):r.amount;
  const unit=unitLabel(r.unit,r.amount);
  if(total>0){
    const cycleWord=reading?'reread':'rewatch';
    const parts=[`${action}: ${r.amount.toLocaleString()} ${unit}`];
    if(full) parts.push(`${full} full ${cycleWord}${full===1?'':'es'}`);
    if(current) parts.push(`${current.toLocaleString()} / ${total.toLocaleString()} toward ${cycleWord} #${full+1}`);
    else if(full) parts.push(`${cycleWord} #${full} complete`);
    return parts.join(' · ');
  }
  return `${action}: ${r.amount.toLocaleString()} ${unit} · total unknown`;
}
function v82RepeatDetailHtml(item){
  const r=v81RepeatTotals().byTitle.get(item.id)||{amount:0,loggedAmount:0,manualAmount:Math.max(0,Number(item.manualRepeatAmount)||0),unit:getCategory(item.categoryId)?.unit||'units',total:Number(item.total)||0,completedRepeats:0};
  const reading=getCategory(item.categoryId)?.type==='reading';
  const noun=reading?'Rereads':'Rewatches',verb=reading?'reread':'rewatched';
  const total=Math.max(0,Number(item.total)||0),full=total>0?Math.floor(r.amount/total):0,current=total>0?r.amount%total:r.amount;
  const currentText=total>0?(current===0&&full>0?`Re${reading?'read':'watch'} #${full} complete`:`${current.toLocaleString()} / ${total.toLocaleString()} toward ${reading?'reread':'rewatch'} #${full+1}`):`${r.amount.toLocaleString()} ${unitLabel(r.unit,r.amount)} ${verb} · title total unknown`;
  const manual=Math.max(0,Math.floor(Number(item.manualRepeatAmount)||0));
  const manualFull=total>0?Math.floor(manual/total):0,manualExtra=total>0?manual%total:manual;
  const editFields=total>0?`<div class="v83-repeat-edit-grid"><div class="field"><label class="field-label">Manual full ${reading?'rereads':'rewatches'}</label><input type="number" id="l-repeat-full" min="0" step="1" value="${manualFull}"></div><div class="field"><label class="field-label">Extra ${escapeHtml(unitLabel(r.unit,2))}</label><input type="number" id="l-repeat-extra" min="0" max="${Math.max(0,total-1)}" step="1" value="${manualExtra}"></div></div>`:`<div class="field"><label class="field-label">Manual ${escapeHtml(unitLabel(r.unit,2))} ${verb}</label><input type="number" id="l-repeat-extra" min="0" step="1" value="${manualExtra}"></div>`;
  return `<div class="v82-repeat-panel"><div class="v82-repeat-head">↻ REWATCH / REREAD</div><div class="v82-repeat-grid"><div><b>${full.toLocaleString()}</b><small>Full ${noun.toLowerCase()}</small></div><div><b>${r.amount.toLocaleString()}</b><small>${escapeHtml(unitLabel(r.unit,r.amount))} ${verb}</small></div></div><div class="v82-repeat-current"><b>Current repeat</b><span>${escapeHtml(currentText)}</span></div><div class="v83-repeat-source"><b>Logged in MediaFlow:</b> ${(Number(r.loggedAmount)||0).toLocaleString()} · <b>Manual past repeats:</b> ${manual.toLocaleString()} ${escapeHtml(unitLabel(r.unit,manual))}</div><div class="v83-repeat-edit"><div class="v83-repeat-edit-title">EDIT PAST REPEAT HISTORY</div>${editFields}<small class="hint">Use this for rewatches/rereads from before MediaFlow or corrections. Manual values affect repeat totals only. They do not create History sessions, XP, time, streaks, or scheduler activity.</small></div></div>`;
}

function mfLifetime(){const completed=new Set((S.library||[]).filter(i=>i.status==='completed').map(i=>i.id));let episodes=0,chapters=0,issues=0,movies=0,minutes=0;for(const s of S.sessions||[]){if(s.status==='skipped')continue;const n=Math.max(0,Number(s.actualAmount)||0);minutes+=Math.max(0,Number(s.minutes)||0);if(s.unit==='episodes')episodes+=n;else if(s.unit==='chapters')chapters+=n;else if(s.unit==='issues')issues+=n;else if(s.unit==='movies')movies+=n;}return {completed:completed.size,episodes,chapters,issues,movies,minutes};}
function mfAchievementsHtml(){const a=mfLifetime();return `<div class="card" style="margin-bottom:24px"><div class="section-label">LIFETIME ACHIEVEMENTS</div><div class="mf-achievements"><div class="mf-achievement"><b>${a.completed.toLocaleString()}</b><small>Completed titles</small></div><div class="mf-achievement"><b>${a.episodes.toLocaleString()}</b><small>Episodes watched</small></div><div class="mf-achievement"><b>${a.movies.toLocaleString()}</b><small>Movies completed / logged</small></div><div class="mf-achievement"><b>${a.chapters.toLocaleString()}</b><small>Chapters read</small></div><div class="mf-achievement"><b>${a.issues.toLocaleString()}</b><small>Issues read</small></div><div class="mf-achievement"><b>${Math.round(a.minutes).toLocaleString()}</b><small>Minutes consumed</small></div></div></div>`;}
function mfActivityHtml(){const rows=(S.activityLog||[]).slice(0,1000).map(x=>`<div class="mf-activity-row"><div class="mf-activity-time">${new Date(x.timestamp).toLocaleString()}</div><div><b>${escapeHtml(x.action)}</b>${x.detail?`<div class="hint">${escapeHtml(x.detail)}</div>`:''}</div></div>`).join('')||'<div class="empty-state">No library activity recorded yet.</div>';return `<div class="card"><div class="section-label">LIBRARY CHANGE LOG</div><div class="mf-activity" style="max-height:none">${rows}</div></div>`;}
function renderLibraryHistory(){
  const undoCount=(S.undoStack||[]).length, redoCount=(S.redoStack||[]).length;
  return `<div class="view-head"><div><h1>Library History</h1><p>Review library changes and restore tracked operations.</p></div></div>
  <div class="mf-batchbar" style="margin-bottom:18px"><div class="mf-undo-group"><button class="btn btn-sm" onclick="App.undoChange()" ${undoCount?'':'disabled'}>↶ Undo</button><button class="btn btn-sm" onclick="App.redoChange()" ${redoCount?'':'disabled'}>↷ Redo</button></div><span class="hint">${undoCount} undo step${undoCount===1?'':'s'} · ${redoCount} redo step${redoCount===1?'':'s'}</span></div>
  ${mfActivityHtml()}`;
}
function mfBatchBar(){const n=mfSelectedIds().length;return `<div class="mf-batchbar"><label style="display:flex;gap:7px;align-items:center"><input class="mf-select" type="checkbox" onchange="App.selectVisibleLibrary(this.checked)"> Select visible</label><b>${n} selected</b><div class="spacer"></div><select style="width:auto" onchange="if(this.value){App.batchLibraryStatus(this.value);this.value=''}"><option value="">Set status…</option><option value="planned">Plan to Watch</option><option value="active">Watching</option><option value="paused">On Hold</option><option value="completed">Completed</option><option value="dropped">Dropped</option></select><select style="width:auto" onchange="if(this.value){App.batchLibraryPriority(this.value);this.value=''}"><option value="">Set priority…</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select><select style="width:auto" onchange="if(this.value){App.batchLibraryCategory(this.value);this.value=''}"><option value="">Move to…</option>${S.categories.map(c=>`<option value="${c.id}">${v144CategoryIconText(c)} ${escapeHtml(c.name)}</option>`).join('')}</select><button class="btn btn-sm" onclick="App.clearLibrarySelection()">Clear selection</button><button class="btn btn-sm" ${n?'':'disabled'} onclick="App.v69RepairSelectedCompleted()">Fix completed progress</button><button class="btn btn-sm btn-danger" ${n?'':'disabled'} onclick="App.batchDeleteLibrary()">Delete selected</button></div>`;}
function mfEnhanceLibraryDom(){if(S.view!=='library')return;document.querySelectorAll('.item-row').forEach(row=>{if(row.querySelector('[data-mf-select]'))return;const del=[...row.querySelectorAll('button')].find(b=>(b.getAttribute('onclick')||'').includes('deleteLibraryItem'));const m=(del?.getAttribute('onclick')||'').match(/deleteLibraryItem\('([^']+)'\)/);if(!m)return;const id=m[1],cb=document.createElement('input');cb.type='checkbox';cb.className='mf-select';cb.dataset.mfSelect=id;cb.checked=!!S.librarySelection?.[id];cb.addEventListener('change',()=>mfToggleSelect(id,cb.checked));row.insertBefore(cb,row.firstChild);});const count=document.querySelector('.mf-batchbar b');if(count)count.textContent=mfSelectedIds().length+' selected';}

async function mfImportSimklJson(file){if(!file)return;showImportProgress('Importing Simkl JSON',1);try{const data=JSON.parse(await file.text());if(!data||(!Array.isArray(data.anime)&&!Array.isArray(data.shows)&&!Array.isArray(data.movies)))throw new Error('This does not look like a Simkl JSON backup.');mfBegin('Simkl JSON import',file.name||'backup');const statusMap={watching:'active',plantowatch:'planned',completed:'completed',hold:'paused',onhold:'paused',dropped:'dropped'};let added=0,updated=0,historyAdded=0,processed=0;const groups=[['anime',data.anime||[]],['shows',data.shows||[]],['movies',data.movies||[]]],total=groups.reduce((a,g)=>a+g[1].length,0)||1;const seenSessions=new Set((S.sessions||[]).map(s=>s.importKey).filter(Boolean));for(const [kind,list] of groups){for(const rec of list){processed++;const media=rec.show||rec.movie||{};const title=cleanTitle(media.title||'');if(!title)continue;let catId;if(kind==='shows')catId='tv';else if(kind==='movies')catId='movies';else if(String(rec.anime_type||'').toLowerCase()==='movie')catId='animemovies';else catId=(Number(rec.not_aired_episodes_count)||0)>0?'seasonal':'backlog';if(!S.categories.some(c=>c.id===catId))catId=S.categories[0]?.id;if(!catId)continue;const ids=media.ids||{};const ext={simkl:ids.simkl??null,mal:ids.mal??null,anilist:ids.anilist??null,tmdb:ids.tmdb??ids.tmdbtv??null,imdb:ids.imdb??null};let item=S.library.find(i=>i.externalIds?.simkl&&ext.simkl&&String(i.externalIds.simkl)===String(ext.simkl));if(!item)item=S.library.find(i=>cleanTitle(i.title).toLowerCase()===title.toLowerCase()&&((i.year||null)===(media.year||null)||!i.year||!media.year));const progress=Math.max(0,Number(rec.watched_episodes_count)||0);const totalUnits=Number(rec.total_episodes_count)>0?Number(rec.total_episodes_count):(kind==='movies'?1:null);const status=statusMap[String(rec.status||'').toLowerCase()]||'planned';if(item){item.title=title;item.categoryId=catId;item.progress=Math.max(Number(item.progress)||0,progress);if(totalUnits)item.total=totalUnits;item.status=status;item.source='simkl';item.externalIds=Object.assign({},item.externalIds||{},ext);item.year=media.year||item.year||null;item.rating=rec.user_rating??item.rating??null;item.simklAddedAt=rec.added_to_watchlist_at||item.simklAddedAt||null;updated++;}else{item={id:uid(),title,categoryId:catId,progress,total:totalUnits,status,priority:'medium',estimatedMinutes:Number(media.runtime)||null,tags:['simkl'],source:'simkl',createdAt:rec.added_to_watchlist_at?Date.parse(rec.added_to_watchlist_at):Date.now(),completedAt:status==='completed'?(rec.last_watched_at?Date.parse(rec.last_watched_at):Date.now()):null,externalIds:ext,year:media.year||null,rating:rec.user_rating??null,simklAddedAt:rec.added_to_watchlist_at||null};S.library.push(item);awardLibraryAdditionXP(item.id);added++;}
// Genuine timestamped episode history, grouped by title/day to keep cloud state manageable.
const dayCounts=new Map();for(const season of rec.seasons||[]){for(const ep of season.episodes||[]){if(!ep.watched_at)continue;const ts=Date.parse(ep.watched_at);if(!Number.isFinite(ts))continue;const day=new Date(ts).toISOString().slice(0,10);const key=day;const old=dayCounts.get(key)||{count:0,ts};old.count++;old.ts=Math.max(old.ts,ts);dayCounts.set(key,old);}}for(const [day,h] of dayCounts){const ik=`simkl:${ext.simkl||title}:${day}`;if(seenSessions.has(ik))continue;const cat=getCategory(item.categoryId);const amount=kind==='movies'?1:h.count;S.sessions.push({id:uid(),timestamp:h.ts,date:day,categoryId:item.categoryId,targetAmount:amount,actualAmount:amount,minutes:Math.max(0,Math.round((Number(media.runtime)||cat.minutesPerUnit||0)*amount)),note:`Imported from Simkl · ${title}`,status:'complete',unit:cat.unit,xp:0,healthStatus:'healthy',titles:[{title,libraryId:item.id,qty:amount}],source:'simkl',importKey:ik});seenSessions.add(ik);historyAdded++;}
if(processed%250===0){updateImportProgress(processed,total,added,updated,0,`Processing ${processed.toLocaleString()} of ${total.toLocaleString()}…`);await yieldToBrowser();}}
}normalizeSeasonalLibraryItems();mfCommit('Simkl JSON import',`${added} added, ${updated} updated, ${historyAdded} history groups`);updateImportProgress(total,total,added,updated,0,'Saving imported data…');await saveState();finishImportProgress(true,'Simkl import successful',`${added.toLocaleString()} titles added, ${updated.toLocaleString()} updated, ${historyAdded.toLocaleString()} timestamped history groups imported.`);render();}catch(e){console.error(e);if(S.undoStack?.length&&S.undoStack[S.undoStack.length-1]?.action==='Simkl JSON import'){const x=S.undoStack.pop();mfRestoreCore(x.before);}finishImportProgress(false,'Simkl import failed',e.message||'Could not read this Simkl JSON backup.');}}

const mfBaseRenderLibrary=renderLibrary;
renderLibrary=function(){let h=mfBaseRenderLibrary();h=h.replace('<div class="section-label">OVERVIEW',mfBatchBar()+'<div class="section-label">OVERVIEW');const catTools=`<div class="card" style="margin-bottom:22px"><div class="section-label">CATEGORY MAINTENANCE</div><div style="display:flex;gap:8px;flex-wrap:wrap">${S.categories.map(c=>`<button class="btn btn-sm" onclick="App.clearCategoryLibrary('${c.id}')">Clear ${v144CategoryIconHtml(c)} ${escapeHtml(c.name)}</button>`).join('')}</div><div class="hint" style="margin-top:9px">Clears titles only from the chosen category. History stays intact and the action can be undone from Library History.</div></div>`;const end=h.lastIndexOf('</div>');if(end>0)h=h.slice(0,end)+catTools+h.slice(end);return h;};
const mfBaseRenderStats=renderStats;
renderStats=function(){let h=mfBaseRenderStats();const needle='<div class="view-head">';const p=h.indexOf('</div>',h.indexOf(needle));return p>=0?h.slice(0,p+6)+mfAchievementsHtml()+h.slice(p+6):mfAchievementsHtml()+h;};
const mfBaseRenderHistory=renderHistory;
renderHistory=function(){let h=mfBaseRenderHistory();h=h.replace(/\$\{S\.sessions\.length[^}]+\}/g,'');return h;};
const mfBaseRenderView=renderView;renderView=function(){mfBaseRenderView();setTimeout(mfEnhanceLibraryDom,0);};

Object.assign(App,{importSimklJson:mfImportSimklJson,toggleLibrarySelect:mfToggleSelect,selectVisibleLibrary:mfSelectVisible,clearLibrarySelection:mfClearSelection,batchLibraryStatus:mfBatchStatus,batchLibraryPriority:mfBatchPriority,batchLibraryCategory:mfBatchCategory,batchDeleteLibrary:mfBatchDelete,clearCategoryLibrary:mfClearCategory,undoChange:mfUndo,redoChange:mfRedo});
// Track the important library mutations in v37.
for(const name of ['setPriorityChoice','setLibraryStatus','setLibraryCategory']){const old=App[name];if(old)App[name]=function(id,v){const item=S.library.find(i=>i.id===id);mfBegin(name==='setPriorityChoice'?'Change priority':name==='setLibraryStatus'?'Change status':'Move title',item?cleanTitle(item.title):'');old.call(App,id,v);mfCommit(name==='setPriorityChoice'?'Change priority':name==='setLibraryStatus'?'Change status':'Move title',item?cleanTitle(item.title):'');};}
const mfOldSaveLibrary=App.saveLibraryModal;App.saveLibraryModal=function(id){const before=id?S.library.find(i=>i.id===id):null;mfBegin(id?'Edit title':'Add title',before?cleanTitle(before.title):'');mfOldSaveLibrary.call(App,id);const after=id?S.library.find(i=>i.id===id):S.library[S.library.length-1];mfCommit(id?'Edit title':'Add title',after?cleanTitle(after.title):'');};
const mfOldConfirmDelete=App.confirmDeleteLibrary;App.confirmDeleteLibrary=async function(id){const item=S.library.find(i=>i.id===id);mfBegin('Delete title',item?cleanTitle(item.title):'');await mfOldConfirmDelete.call(App,id);mfCommit('Delete title',item?cleanTitle(item.title):'');};
const mfOldSubmit=App.submitLog;App.submitLog=function(){mfBegin('Log consumption',S.currentTask?getCategory(S.currentTask.categoryId).name:'');mfOldSubmit.call(App);mfCommit('Log consumption',S.sessions.length?`${S.sessions[S.sessions.length-1].actualAmount} ${S.sessions[S.sessions.length-1].unit}`:'');};
// v37 history deletion is undoable. Existing custom session edit modal remains available.
App.deleteSession=function(id){const x=S.sessions.find(s=>s.id===id);if(!x)return;mfBegin('Delete history',getCategory(x.categoryId).name);S.sessions=S.sessions.filter(s=>s.id!==id);S.histPage=0;mfCommit('Delete history',getCategory(x.categoryId).name);render();showToast('History entry deleted · Undo available');};
App.deleteSessionFromModal=function(id){S.modal=null;App.deleteSession(id);};

const mfSnap=snapshot;snapshot=function(){const x=mfSnap();x.activityLog=S.activityLog||[];return x;};
const mfLoad=loadAll;loadAll=async function(){await mfLoad();const d=await rawGet(STATE_KEY);S.activityLog=Array.isArray(d?.activityLog)?d.activityLog:[];S.undoStack=[];S.redoStack=[];S.librarySelection={};};



/* ============================================================
   v43: Library controls, themes, richer activity, balance insight
   ============================================================ */

/* ============================================================
   MediaFlow v63 — original 50 Theme Collection
   Originally 50 selectable MediaFlow themes; v133 expands the collection
   to 64 while retaining every prior theme and the customizable theme.
   ============================================================ */
/* Additional built-in themes + user-custom theme */
const V43_THEMES=['dark','light','amoled','midnight','ocean','forest','sunset','purple','rose','coffee','nord','cyber','slate','crimson','sakura','arctic','desert','emerald','volcano','lavender','gold','matrix','dracula','solarized','peach','mint','monochrome','cobalt','cherry','toxic','galaxy','coral','bronze','iceberg','bubblegum','terminal','paper','wine','sky','obsidian','retro','autumn','aqua','ivory','neon','moss','blueprint','candy','storm','porcelain','matcha-cream','lemon-sorbet','lilac-haze','coastal-breeze','terracotta-studio','notebook','rose-milk','seafoam-glass','morning-sky','pistachio','apricot','aurora-night','ink-neon','custom','platform-anilist-dark','platform-anilist-light','platform-anisearch-dark','platform-anisearch-light','platform-aniwatch-dark','platform-aniwatch-light','platform-betaseries-dark','platform-betaseries-light','platform-criticker-dark','platform-criticker-light','platform-crunchyroll-dark','platform-crunchyroll-light','platform-episodecalendar-dark','platform-episodecalendar-light','platform-hianime-dark','platform-hianime-light','platform-imdb-dark','platform-imdb-light','platform-letterboxd-dark','platform-letterboxd-light','platform-livechart-dark','platform-livechart-light','platform-kitsu-dark','platform-kitsu-light','platform-moviesfad-dark','platform-moviesfad-light','platform-myanimelist-dark','platform-myanimelist-light','platform-malxml-dark','platform-malxml-light','platform-netflix-dark','platform-netflix-light','platform-primewire-dark','platform-primewire-light','platform-seriesfad-dark','platform-seriesfad-light','platform-stremio-dark','platform-stremio-light','platform-tvtime-dark','platform-tvtime-light','platform-tviso-dark','platform-tviso-light','platform-twee-dark','platform-twee-light','platform-simkl-dark','platform-simkl-light','platform-trakt-old','platform-trakt-new-dark','platform-trakt-new-light'];
const V43_THEME_LABELS={'dark':'Dark','light':'Light','amoled':'AMOLED','midnight':'Midnight Blue','ocean':'Ocean','forest':'Forest','sunset':'Sunset','purple':'Purple','rose':'Rose','coffee':'Coffee','nord':'Nord','cyber':'Cyber','slate':'Slate','crimson':'Crimson Noir','sakura':'Sakura','arctic':'Arctic Ice','desert':'Desert Sand','emerald':'Emerald City','volcano':'Volcano','lavender':'Lavender Dream','gold':'Royal Gold','matrix':'Matrix','dracula':'Dracula','solarized':'Solarized','peach':'Peach Cream','mint':'Mint Paper','monochrome':'Monochrome','cobalt':'Cobalt','cherry':'Cherry Cola','toxic':'Toxic Lime','galaxy':'Galaxy','coral':'Coral Reef','bronze':'Bronze Age','iceberg':'Iceberg','bubblegum':'Bubblegum','terminal':'Terminal','paper':'Paper','wine':'Wine Cellar','sky':'Day Sky','obsidian':'Obsidian','retro':'Retro Arcade','autumn':'Autumn','aqua':'Aqua Glass','ivory':'Ivory','neon':'Neon Nights','moss':'Moss','blueprint':'Blueprint','candy':'Candy Pop','storm':'Storm','porcelain':'Porcelain Blue','matcha-cream':'Matcha Cream','lemon-sorbet':'Lemon Sorbet','lilac-haze':'Lilac Haze','coastal-breeze':'Coastal Breeze','terracotta-studio':'Terracotta Studio','notebook':'Notebook','rose-milk':'Rose Milk','seafoam-glass':'Seafoam Glass','morning-sky':'Morning Sky','pistachio':'Pistachio','apricot':'Apricot','aurora-night':'Aurora Night','ink-neon':'Ink & Neon','custom':'Custom','platform-anilist-dark':'AniList Dark','platform-anilist-light':'AniList Light','platform-anisearch-dark':'AniSearch Dark','platform-anisearch-light':'AniSearch Light','platform-aniwatch-dark':'AniWatch Dark','platform-aniwatch-light':'AniWatch Light','platform-betaseries-dark':'BetaSeries Dark','platform-betaseries-light':'BetaSeries Light','platform-criticker-dark':'Criticker Dark','platform-criticker-light':'Criticker Light','platform-crunchyroll-dark':'Crunchyroll Dark','platform-crunchyroll-light':'Crunchyroll Light','platform-episodecalendar-dark':'EpisodeCalendar Dark','platform-episodecalendar-light':'EpisodeCalendar Light','platform-hianime-dark':'HiAnime Dark','platform-hianime-light':'HiAnime Light','platform-imdb-dark':'IMDb Dark','platform-imdb-light':'IMDb Light','platform-letterboxd-dark':'Letterboxd Dark','platform-letterboxd-light':'Letterboxd Light','platform-livechart-dark':'LiveChart Dark','platform-livechart-light':'LiveChart Light','platform-kitsu-dark':'Kitsu Dark','platform-kitsu-light':'Kitsu Light','platform-moviesfad-dark':'MoviesFad Dark','platform-moviesfad-light':'MoviesFad Light','platform-myanimelist-dark':'MyAnimeList Dark','platform-myanimelist-light':'MyAnimeList Light','platform-malxml-dark':'MAL-XML Dark','platform-malxml-light':'MAL-XML Light','platform-netflix-dark':'Netflix Dark','platform-netflix-light':'Netflix Light','platform-primewire-dark':'PrimeWire Dark','platform-primewire-light':'PrimeWire Light','platform-seriesfad-dark':'SeriesFad Dark','platform-seriesfad-light':'SeriesFad Light','platform-stremio-dark':'Stremio Dark','platform-stremio-light':'Stremio Light','platform-tvtime-dark':'TV Time Dark','platform-tvtime-light':'TV Time Light','platform-tviso-dark':'Tviso Dark','platform-tviso-light':'Tviso Light','platform-twee-dark':'Twee Dark','platform-twee-light':'Twee Light','platform-simkl-dark':'Simkl Dark','platform-simkl-light':'Simkl Light','platform-trakt-old':'Trakt Old','platform-trakt-new-dark':'Trakt New Dark','platform-trakt-new-light':'Trakt New Light'};
const V55_PLATFORM_THEMES=["platform-anilist-dark", "platform-anilist-light", "platform-anisearch-dark", "platform-anisearch-light", "platform-aniwatch-dark", "platform-aniwatch-light", "platform-betaseries-dark", "platform-betaseries-light", "platform-criticker-dark", "platform-criticker-light", "platform-crunchyroll-dark", "platform-crunchyroll-light", "platform-episodecalendar-dark", "platform-episodecalendar-light", "platform-hianime-dark", "platform-hianime-light", "platform-imdb-dark", "platform-imdb-light", "platform-letterboxd-dark", "platform-letterboxd-light", "platform-livechart-dark", "platform-livechart-light", "platform-kitsu-dark", "platform-kitsu-light", "platform-moviesfad-dark", "platform-moviesfad-light", "platform-myanimelist-dark", "platform-myanimelist-light", "platform-malxml-dark", "platform-malxml-light", "platform-netflix-dark", "platform-netflix-light", "platform-primewire-dark", "platform-primewire-light", "platform-seriesfad-dark", "platform-seriesfad-light", "platform-stremio-dark", "platform-stremio-light", "platform-tvtime-dark", "platform-tvtime-light", "platform-tviso-dark", "platform-tviso-light", "platform-twee-dark", "platform-twee-light", "platform-simkl-dark", "platform-simkl-light", "platform-trakt-old", "platform-trakt-new-dark", "platform-trakt-new-light"];
const V55_MEDIAFLOW_THEMES=V43_THEMES.filter(t=>!V55_PLATFORM_THEMES.includes(t));

S.settings=S.settings||{};
S.settings.customTheme=S.settings.customTheme||{bg:'#0E111A',panel:'#161B2A',raised:'#1C2334',border:'#2B3448',text:'#F4F6FB',muted:'#8D98AD',accent:'#E8A94A'};
S.settings.libraryView=S.settings.libraryView||'list';

const v43ThemeCss=document.createElement('style');
v43ThemeCss.textContent=`
html[data-theme="midnight"]{--bg:#07111f;--panel:#0d1b2d;--panel-raised:#13243a;--border:#243a55;--border-soft:#192d46;--text:#edf5ff;--text-dim:#a9bfd8;--text-mute:#7189a4;--flow:#69a7ff}
html[data-theme="ocean"]{--bg:#07181d;--panel:#0d252b;--panel-raised:#123139;--border:#24505a;--border-soft:#193d46;--text:#effcfd;--text-dim:#a7d2d6;--text-mute:#6f9ea3;--flow:#55d6be}
html[data-theme="forest"]{--bg:#0c1610;--panel:#142219;--panel-raised:#1a2d21;--border:#31503b;--border-soft:#223b2b;--text:#f1f8f2;--text-dim:#b2cbb7;--text-mute:#7f9d86;--flow:#76c893}
html[data-theme="sunset"]{--bg:#1b1014;--panel:#28171d;--panel-raised:#352027;--border:#5a3540;--border-soft:#452831;--text:#fff4ef;--text-dim:#dfb8aa;--text-mute:#a77f76;--flow:#ff9f68}
html[data-theme="purple"]{--bg:#120e1d;--panel:#1c162b;--panel-raised:#261d39;--border:#463663;--border-soft:#34284c;--text:#f8f3ff;--text-dim:#c8b8df;--text-mute:#907da9;--flow:#b892ff}
html[data-theme="rose"]{--bg:#1a1016;--panel:#271720;--panel-raised:#341f2a;--border:#583647;--border-soft:#432936;--text:#fff4f8;--text-dim:#dfb5c6;--text-mute:#a47a8b;--flow:#f08fb3}
html[data-theme="coffee"]{--bg:#17120f;--panel:#241c17;--panel-raised:#30251e;--border:#514033;--border-soft:#3d3027;--text:#fbf4ec;--text-dim:#d0bba6;--text-mute:#97816e;--flow:#d6a56f}
html[data-theme="nord"]{--bg:#242933;--panel:#2e3440;--panel-raised:#3b4252;--border:#4c566a;--border-soft:#404858;--text:#eceff4;--text-dim:#d8dee9;--text-mute:#8892a5;--flow:#88c0d0}
html[data-theme="cyber"]{--bg:#080b10;--panel:#10151d;--panel-raised:#151d28;--border:#26394a;--border-soft:#1b2b39;--text:#eafffb;--text-dim:#9bcfc8;--text-mute:#608d88;--flow:#35f2c1}
html[data-theme="slate"]{--bg:#11151b;--panel:#19202a;--panel-raised:#212b37;--border:#344252;--border-soft:#283543;--text:#f3f6fa;--text-dim:#b7c1cd;--text-mute:#7f8b99;--flow:#8fb3d9}
html[data-theme="crimson"]{--bg:#120609;--panel:#210b10;--panel-raised:#321019;--border:#5b1d2b;--border-soft:#41141f;--text:#fff1f3;--text-dim:#e3a9b3;--text-mute:#a76572;--flow:#ff345f;--flow-dim:color-mix(in srgb,#ff345f 58%,#120609)}
html[data-theme="sakura"]{--bg:#fff4f7;--panel:#fffafd;--panel-raised:#ffe8f0;--border:#eab8ca;--border-soft:#f5cfdd;--text:#442b36;--text-dim:#80586a;--text-mute:#ad7c91;--flow:#e96f9d;--flow-dim:color-mix(in srgb,#e96f9d 58%,#fff4f7)}
html[data-theme="arctic"]{--bg:#eaf8ff;--panel:#f8fdff;--panel-raised:#dff3ff;--border:#9bcce3;--border-soft:#c4e5f3;--text:#102d3c;--text-dim:#416779;--text-mute:#6e95a7;--flow:#008fc7;--flow-dim:color-mix(in srgb,#008fc7 58%,#eaf8ff)}
html[data-theme="desert"]{--bg:#f3e2c2;--panel:#fff1d7;--panel-raised:#ead0a5;--border:#b98e58;--border-soft:#d5b27f;--text:#3e2c1b;--text-dim:#77583a;--text-mute:#a07e5a;--flow:#c76b29;--flow-dim:color-mix(in srgb,#c76b29 58%,#f3e2c2)}
html[data-theme="emerald"]{--bg:#061711;--panel:#0b251b;--panel-raised:#103426;--border:#235d45;--border-soft:#184833;--text:#effff7;--text-dim:#a9dbc4;--text-mute:#6da88d;--flow:#2ee59d;--flow-dim:color-mix(in srgb,#2ee59d 58%,#061711)}
html[data-theme="volcano"]{--bg:#120807;--panel:#24100c;--panel-raised:#36160f;--border:#6b2b1b;--border-soft:#4b2017;--text:#fff2e9;--text-dim:#e5b09b;--text-mute:#a86f5a;--flow:#ff5b21;--flow-dim:color-mix(in srgb,#ff5b21 58%,#120807)}
html[data-theme="lavender"]{--bg:#f3efff;--panel:#fbf9ff;--panel-raised:#e9e0ff;--border:#b8a4e5;--border-soft:#d3c5f3;--text:#2d2345;--text-dim:#675687;--text-mute:#9480b7;--flow:#7c52d9;--flow-dim:color-mix(in srgb,#7c52d9 58%,#f3efff)}
html[data-theme="gold"]{--bg:#100d05;--panel:#211a08;--panel-raised:#32270b;--border:#665017;--border-soft:#4a3a10;--text:#fff8dd;--text-dim:#dfcb83;--text-mute:#9e8849;--flow:#f5c542;--flow-dim:color-mix(in srgb,#f5c542 58%,#100d05)}
html[data-theme="matrix"]{--bg:#000500;--panel:#001000;--panel-raised:#001a04;--border:#0b4a17;--border-soft:#06330f;--text:#caffca;--text-dim:#6fe87d;--text-mute:#329c44;--flow:#00ff41;--flow-dim:color-mix(in srgb,#00ff41 58%,#000500)}
html[data-theme="dracula"]{--bg:#17141f;--panel:#211d2b;--panel-raised:#2b2638;--border:#514666;--border-soft:#3d354d;--text:#f8f8f2;--text-dim:#c7bed7;--text-mute:#81758f;--flow:#ff79c6;--flow-dim:color-mix(in srgb,#ff79c6 58%,#17141f)}
html[data-theme="solarized"]{--bg:#002b36;--panel:#073642;--panel-raised:#0b4652;--border:#315b63;--border-soft:#17434d;--text:#fdf6e3;--text-dim:#b7c5bd;--text-mute:#7d9895;--flow:#b58900;--flow-dim:color-mix(in srgb,#b58900 58%,#002b36)}
html[data-theme="peach"]{--bg:#fff1e8;--panel:#fff9f4;--panel-raised:#ffe1d1;--border:#efb69a;--border-soft:#f6cdb8;--text:#4b2d24;--text-dim:#87594b;--text-mute:#b27d6a;--flow:#ef7f5b;--flow-dim:color-mix(in srgb,#ef7f5b 58%,#fff1e8)}
html[data-theme="mint"]{--bg:#edfff8;--panel:#f9fffc;--panel-raised:#d9f7eb;--border:#9ed8c2;--border-soft:#c0ead9;--text:#173b30;--text-dim:#477566;--text-mute:#75a594;--flow:#1ca87a;--flow-dim:color-mix(in srgb,#1ca87a 58%,#edfff8)}
html[data-theme="monochrome"]{--bg:#111111;--panel:#1b1b1b;--panel-raised:#292929;--border:#4a4a4a;--border-soft:#353535;--text:#f4f4f4;--text-dim:#bcbcbc;--text-mute:#7d7d7d;--flow:#ffffff;--flow-dim:color-mix(in srgb,#ffffff 58%,#111111)}
html[data-theme="cobalt"]{--bg:#071229;--panel:#0b1c3d;--panel-raised:#102954;--border:#254c82;--border-soft:#183867;--text:#eef5ff;--text-dim:#abc5ed;--text-mute:#718fb9;--flow:#3b82f6;--flow-dim:color-mix(in srgb,#3b82f6 58%,#071229)}
html[data-theme="cherry"]{--bg:#16080d;--panel:#2a0d16;--panel-raised:#3c1220;--border:#6d2739;--border-soft:#511b2b;--text:#fff0f4;--text-dim:#e7a5b7;--text-mute:#a96378;--flow:#e3265f;--flow-dim:color-mix(in srgb,#e3265f 58%,#16080d)}
html[data-theme="toxic"]{--bg:#0a0d03;--panel:#151b05;--panel-raised:#202909;--border:#465a12;--border-soft:#34430d;--text:#f5ffd8;--text-dim:#c7e57a;--text-mute:#8fa840;--flow:#b6ff2e;--flow-dim:color-mix(in srgb,#b6ff2e 58%,#0a0d03)}
html[data-theme="galaxy"]{--bg:#080719;--panel:#12102b;--panel-raised:#1d1740;--border:#42396e;--border-soft:#30285a;--text:#f4f0ff;--text-dim:#bcb0e7;--text-mute:#8173b2;--flow:#8c6cff;--flow-dim:color-mix(in srgb,#8c6cff 58%,#080719)}
html[data-theme="coral"]{--bg:#10202a;--panel:#17313b;--panel-raised:#1e424b;--border:#397079;--border-soft:#2a5861;--text:#f2ffff;--text-dim:#b7d9da;--text-mute:#7aa9aa;--flow:#ff786d;--flow-dim:color-mix(in srgb,#ff786d 58%,#10202a)}
html[data-theme="bronze"]{--bg:#17100a;--panel:#271a10;--panel-raised:#382417;--border:#62442b;--border-soft:#4a321f;--text:#fff3e4;--text-dim:#d8b894;--text-mute:#9b7957;--flow:#cd7f32;--flow-dim:color-mix(in srgb,#cd7f32 58%,#17100a)}
html[data-theme="iceberg"]{--bg:#08171d;--panel:#10252d;--panel-raised:#173540;--border:#315b67;--border-soft:#244954;--text:#effcff;--text-dim:#acd8e3;--text-mute:#719fac;--flow:#74d7ef;--flow-dim:color-mix(in srgb,#74d7ef 58%,#08171d)}
html[data-theme="bubblegum"]{--bg:#fff0fb;--panel:#fff8fd;--panel-raised:#fbdcf3;--border:#e8a6d2;--border-soft:#f1c5e3;--text:#4d2944;--text-dim:#89587c;--text-mute:#b97da9;--flow:#ff58b0;--flow-dim:color-mix(in srgb,#ff58b0 58%,#fff0fb)}
html[data-theme="terminal"]{--bg:#050805;--panel:#0a100a;--panel-raised:#101910;--border:#244024;--border-soft:#193019;--text:#e6ffe6;--text-dim:#9dd39d;--text-mute:#5f9960;--flow:#64ff64;--flow-dim:color-mix(in srgb,#64ff64 58%,#050805)}
html[data-theme="paper"]{--bg:#eee9dd;--panel:#faf7ef;--panel-raised:#e5ded0;--border:#c4b9a6;--border-soft:#d5cbbc;--text:#2e2b27;--text-dim:#625d55;--text-mute:#8e867a;--flow:#4b6b88;--flow-dim:color-mix(in srgb,#4b6b88 58%,#eee9dd)}
html[data-theme="wine"]{--bg:#14090e;--panel:#251019;--panel-raised:#351722;--border:#623047;--border-soft:#492235;--text:#fff1f6;--text-dim:#d9aab9;--text-mute:#9a6879;--flow:#b94a70;--flow-dim:color-mix(in srgb,#b94a70 58%,#14090e)}
html[data-theme="sky"]{--bg:#dff3ff;--panel:#f7fcff;--panel-raised:#cbeaff;--border:#8bc6ea;--border-soft:#acd9f3;--text:#18364a;--text-dim:#47748f;--text-mute:#719bb2;--flow:#168ad0;--flow-dim:color-mix(in srgb,#168ad0 58%,#dff3ff)}
html[data-theme="obsidian"]{--bg:#07090c;--panel:#0d1117;--panel-raised:#151b23;--border:#2d3744;--border-soft:#202935;--text:#f1f4f8;--text-dim:#aeb9c7;--text-mute:#6f7c8b;--flow:#8aa4c2;--flow-dim:color-mix(in srgb,#8aa4c2 58%,#07090c)}
html[data-theme="retro"]{--bg:#160d24;--panel:#25143a;--panel-raised:#361c50;--border:#613579;--border-soft:#48285f;--text:#fff4d6;--text-dim:#e7bf76;--text-mute:#a47b47;--flow:#ff9f1c;--flow-dim:color-mix(in srgb,#ff9f1c 58%,#160d24)}
html[data-theme="autumn"]{--bg:#1a1008;--panel:#2a1a0d;--panel-raised:#3a2512;--border:#684422;--border-soft:#4e3319;--text:#fff4df;--text-dim:#d9b786;--text-mute:#9e774c;--flow:#e07a2d;--flow-dim:color-mix(in srgb,#e07a2d 58%,#1a1008)}
html[data-theme="aqua"]{--bg:#06191b;--panel:#0b282b;--panel-raised:#10383c;--border:#28636a;--border-soft:#1b4b50;--text:#efffff;--text-dim:#a8dfe2;--text-mute:#6da9ad;--flow:#25d6d9;--flow-dim:color-mix(in srgb,#25d6d9 58%,#06191b)}
html[data-theme="ivory"]{--bg:#f7f2e5;--panel:#fffdf7;--panel-raised:#ece4d2;--border:#c8bda6;--border-soft:#dbd1bd;--text:#302c24;--text-dim:#665e50;--text-mute:#918674;--flow:#9a7438;--flow-dim:color-mix(in srgb,#9a7438 58%,#f7f2e5)}
html[data-theme="neon"]{--bg:#090611;--panel:#130b20;--panel-raised:#1d1030;--border:#462260;--border-soft:#321846;--text:#fff2ff;--text-dim:#d4a6e9;--text-mute:#9565ad;--flow:#ff35e1;--flow-dim:color-mix(in srgb,#ff35e1 58%,#090611)}
html[data-theme="moss"]{--bg:#10150a;--panel:#1a2210;--panel-raised:#253017;--border:#465d2c;--border-soft:#344621;--text:#f5fae9;--text-dim:#c0cf9d;--text-mute:#87996a;--flow:#86a94f;--flow-dim:color-mix(in srgb,#86a94f 58%,#10150a)}
html[data-theme="blueprint"]{--bg:#06182b;--panel:#0a2744;--panel-raised:#0e365c;--border:#285b86;--border-soft:#1b4770;--text:#eef8ff;--text-dim:#a7c9e7;--text-mute:#6d9bc2;--flow:#48a9ff;--flow-dim:color-mix(in srgb,#48a9ff 58%,#06182b)}
html[data-theme="candy"]{--bg:#fff4ea;--panel:#fffafd;--panel-raised:#ffe3ef;--border:#f1b2ce;--border-soft:#f7cada;--text:#412c42;--text-dim:#795a7b;--text-mute:#a77ca7;--flow:#ff4f9a;--flow-dim:color-mix(in srgb,#ff4f9a 58%,#fff4ea)}
html[data-theme="storm"]{--bg:#0d1118;--panel:#171d27;--panel-raised:#222b38;--border:#414e61;--border-soft:#303b4b;--text:#f0f4f9;--text-dim:#b3becd;--text-mute:#778596;--flow:#6e8eaf;--flow-dim:color-mix(in srgb,#6e8eaf 58%,#0d1118)}
html[data-theme="crimson"] body{background:radial-gradient(circle at 15% 0%,#5a1025 0%,var(--bg) 48%);}
html[data-theme="sakura"] body{background:linear-gradient(145deg,#fff8fb 0%,var(--bg) 58%);}
html[data-theme="arctic"] body{background:radial-gradient(circle at 85% 0%,#ffffff 0%,var(--bg) 52%);}
html[data-theme="desert"] body{background:linear-gradient(160deg,#f8e7c7 0%,var(--bg) 62%);}
html[data-theme="emerald"] body{background:radial-gradient(circle at 15% 0%,#124c36 0%,var(--bg) 50%);}
html[data-theme="volcano"] body{background:radial-gradient(circle at 50% -20%,#702310 0%,var(--bg) 52%);}
html[data-theme="lavender"] body{background:linear-gradient(145deg,#fffaff 0%,var(--bg) 60%);}
html[data-theme="gold"] body{background:radial-gradient(circle at 50% -20%,#4a3908 0%,var(--bg) 52%);}
html[data-theme="matrix"] body{background:linear-gradient(180deg,#001500 0%,var(--bg) 48%);}
html[data-theme="dracula"] body{background:radial-gradient(circle at 80% 0%,#35264d 0%,var(--bg) 52%);}
html[data-theme="solarized"] body{background:linear-gradient(160deg,#073642 0%,var(--bg) 58%);}
html[data-theme="peach"] body{background:linear-gradient(150deg,#fff9f4 0%,var(--bg) 60%);}
html[data-theme="mint"] body{background:linear-gradient(150deg,#fbfffd 0%,var(--bg) 60%);}
html[data-theme="monochrome"] body{background:linear-gradient(160deg,#242424 0%,var(--bg) 55%);}
html[data-theme="cobalt"] body{background:radial-gradient(circle at 20% 0%,#173d80 0%,var(--bg) 52%);}
html[data-theme="cherry"] body{background:radial-gradient(circle at 20% 0%,#5a1530 0%,var(--bg) 52%);}
html[data-theme="toxic"] body{background:radial-gradient(circle at 50% -20%,#273a06 0%,var(--bg) 50%);}
html[data-theme="galaxy"] body{background:radial-gradient(circle at 75% 0%,#37235f 0%,var(--bg) 52%);}
html[data-theme="coral"] body{background:radial-gradient(circle at 15% 0%,#22555c 0%,var(--bg) 52%);}
html[data-theme="bronze"] body{background:linear-gradient(155deg,#382313 0%,var(--bg) 56%);}
html[data-theme="iceberg"] body{background:radial-gradient(circle at 75% 0%,#174b5c 0%,var(--bg) 52%);}
html[data-theme="bubblegum"] body{background:linear-gradient(145deg,#fffaff 0%,var(--bg) 60%);}
html[data-theme="terminal"] body{background:linear-gradient(180deg,#0d1a0d 0%,var(--bg) 48%);}
html[data-theme="paper"] body{background:linear-gradient(145deg,#faf7ef 0%,var(--bg) 62%);}
html[data-theme="wine"] body{background:radial-gradient(circle at 15% 0%,#4b1b31 0%,var(--bg) 52%);}
html[data-theme="sky"] body{background:linear-gradient(180deg,#f7fcff 0%,var(--bg) 64%);}
html[data-theme="obsidian"] body{background:radial-gradient(circle at 50% -20%,#1d2733 0%,var(--bg) 48%);}
html[data-theme="retro"] body{background:radial-gradient(circle at 80% 0%,#4c2366 0%,var(--bg) 54%);}
html[data-theme="autumn"] body{background:linear-gradient(155deg,#4b2b10 0%,var(--bg) 58%);}
html[data-theme="aqua"] body{background:radial-gradient(circle at 15% 0%,#14545a 0%,var(--bg) 52%);}
html[data-theme="ivory"] body{background:linear-gradient(145deg,#fffdf7 0%,var(--bg) 62%);}
html[data-theme="neon"] body{background:radial-gradient(circle at 80% 0%,#48105c 0%,var(--bg) 52%);}
html[data-theme="moss"] body{background:linear-gradient(155deg,#293718 0%,var(--bg) 58%);}
html[data-theme="blueprint"] body{background:linear-gradient(145deg,#123e67 0%,var(--bg) 58%);}
html[data-theme="candy"] body{background:linear-gradient(145deg,#fffafd 0%,var(--bg) 62%);}
html[data-theme="storm"] body{background:radial-gradient(circle at 50% -20%,#334154 0%,var(--bg) 52%);}

/* MediaFlow v133 — 14 additional built-in MediaFlow themes.
   12 are native-light designs; Aurora Night and Ink & Neon are dark. */
html[data-theme="porcelain"]{--bg:#f4f8fc;--panel:#ffffff;--panel-raised:#edf3f9;--border:#b9c9d9;--border-soft:#d8e2ec;--text:#182433;--text-dim:#52677c;--text-mute:#8193a5;--flow:#376f9f;--flow-dim:#9fc0da}
html[data-theme="matcha-cream"]{--bg:#f3f4e8;--panel:#fffef5;--panel-raised:#e5ead3;--border:#b7c29a;--border-soft:#d4dcc0;--text:#26301f;--text-dim:#5d6c4e;--text-mute:#879477;--flow:#718b52;--flow-dim:#b8c99c}
html[data-theme="lemon-sorbet"]{--bg:#fff9d8;--panel:#fffdf0;--panel-raised:#fff0a9;--border:#d5bf55;--border-soft:#eadb91;--text:#302b18;--text-dim:#6d6335;--text-mute:#988a50;--flow:#d19b00;--flow-dim:#efd46f}
html[data-theme="lilac-haze"]{--bg:#f6f1ff;--panel:#ffffff;--panel-raised:#eae0ff;--border:#c1afe8;--border-soft:#dbcef4;--text:#302542;--text-dim:#6d5a88;--text-mute:#9784b3;--flow:#8566cc;--flow-dim:#c4b2ea}
html[data-theme="coastal-breeze"]{--bg:#eef9fb;--panel:#ffffff;--panel-raised:#dff2f5;--border:#a8cfd6;--border-soft:#cce5e9;--text:#17343b;--text-dim:#4c7078;--text-mute:#7599a0;--flow:#1689a3;--flow-dim:#9bd0da}
html[data-theme="terracotta-studio"]{--bg:#fbf0e7;--panel:#fffaf6;--panel-raised:#f4d9c8;--border:#d2a184;--border-soft:#e7c5b0;--text:#3d2921;--text-dim:#765348;--text-mute:#a37667;--flow:#b95f3d;--flow-dim:#dfa98f}
html[data-theme="notebook"]{--bg:#f7f8f4;--panel:#fffef9;--panel-raised:#edf1f3;--border:#aebac2;--border-soft:#d5dde2;--text:#172630;--text-dim:#51636d;--text-mute:#7e8e97;--flow:#2f6db0;--flow-dim:#a9c7e7}
html[data-theme="rose-milk"]{--bg:#fff3f2;--panel:#fffdfc;--panel-raised:#f9dddd;--border:#e1afb1;--border-soft:#f0ced0;--text:#3c2529;--text-dim:#78545b;--text-mute:#a47b82;--flow:#d86f7e;--flow-dim:#edb6bd}
html[data-theme="seafoam-glass"]{--bg:#e9fbf7;--panel:#fafffd;--panel-raised:#d6f3ea;--border:#92cfbd;--border-soft:#bee5d9;--text:#12372e;--text-dim:#467466;--text-mute:#73a294;--flow:#1f9f7f;--flow-dim:#93d6c4}
html[data-theme="morning-sky"]{--bg:#f3f8ff;--panel:#ffffff;--panel-raised:#e5f0ff;--border:#afc9e9;--border-soft:#d1e0f3;--text:#1e3047;--text-dim:#58718f;--text-mute:#8298b2;--flow:#4d86c6;--flow-dim:#b2d0ef}
html[data-theme="pistachio"]{--bg:#f5f7e9;--panel:#fffef8;--panel-raised:#e7eccb;--border:#bdc98f;--border-soft:#d7dfb7;--text:#2e341d;--text-dim:#657047;--text-mute:#8e986c;--flow:#819a43;--flow-dim:#bfce8d}
html[data-theme="apricot"]{--bg:#fff3e6;--panel:#fffaf5;--panel-raised:#ffdfbd;--border:#e6b17e;--border-soft:#f1cfad;--text:#422b1d;--text-dim:#7d5a42;--text-mute:#aa7f61;--flow:#e57e38;--flow-dim:#f3b783}
html[data-theme="aurora-night"]{--bg:#071419;--panel:#0d2026;--panel-raised:#143039;--border:#2e5a62;--border-soft:#21464e;--text:#eefcff;--text-dim:#acd8dc;--text-mute:#719da2;--flow:#57e2b2;--flow-dim:#2d8d7b}
html[data-theme="ink-neon"]{--bg:#08090f;--panel:#0f111b;--panel-raised:#171a29;--border:#34394f;--border-soft:#262b3e;--text:#f6f7ff;--text-dim:#b5bad3;--text-mute:#777f9c;--flow:#50e3ff;--flow-dim:#734cff}

/* Native body treatments */
html[data-theme="porcelain"] body{background:linear-gradient(145deg,#ffffff 0%,var(--bg) 66%);}
html[data-theme="matcha-cream"] body{background:radial-gradient(circle at 10% 0%,#fffef5 0%,var(--bg) 56%);}
html[data-theme="lemon-sorbet"] body{background:linear-gradient(155deg,#fffef2 0%,var(--bg) 62%);}
html[data-theme="lilac-haze"] body{background:radial-gradient(circle at 85% 0%,#ffffff 0%,var(--bg) 55%);}
html[data-theme="coastal-breeze"] body{background:linear-gradient(180deg,#fbffff 0%,var(--bg) 68%);}
html[data-theme="terracotta-studio"] body{background:linear-gradient(145deg,#fffaf5 0%,var(--bg) 64%);}
html[data-theme="notebook"] body{background-color:var(--bg);background-image:linear-gradient(#cfe0ee55 1px,transparent 1px),linear-gradient(90deg,#cfe0ee33 1px,transparent 1px);background-size:28px 28px;}
html[data-theme="rose-milk"] body{background:radial-gradient(circle at 78% 0%,#fffefd 0%,var(--bg) 58%);}
html[data-theme="seafoam-glass"] body{background:radial-gradient(circle at 16% 0%,#ffffff 0%,#e9fbf7 48%,var(--bg) 100%);}
html[data-theme="morning-sky"] body{background:linear-gradient(180deg,#ffffff 0%,#edf6ff 38%,var(--bg) 100%);}
html[data-theme="pistachio"] body{background:linear-gradient(150deg,#fffef7 0%,var(--bg) 64%);}
html[data-theme="apricot"] body{background:linear-gradient(145deg,#fffaf5 0%,var(--bg) 62%);}
html[data-theme="aurora-night"] body{background:radial-gradient(circle at 18% 0%,#124f4b 0%,transparent 33%),radial-gradient(circle at 88% 15%,#37245f 0%,transparent 30%),var(--bg);}
html[data-theme="ink-neon"] body{background:linear-gradient(135deg,#08090f 0%,#101326 55%,#07161b 100%);}

/* Structural signatures — these are intentionally more than simple recolors. */
html[data-theme="porcelain"] .card,html[data-theme="porcelain"] .stat-box{border-radius:5px;box-shadow:0 3px 12px rgba(41,74,105,.05)}
html[data-theme="porcelain"] .btn,html[data-theme="porcelain"] select{border-radius:5px}
html[data-theme="matcha-cream"] .card,html[data-theme="matcha-cream"] .stat-box,html[data-theme="matcha-cream"] .hero{border-radius:18px}
html[data-theme="matcha-cream"] .btn{border-radius:12px}
html[data-theme="lemon-sorbet"] .card,html[data-theme="lemon-sorbet"] .stat-box{border:2px solid var(--border);border-radius:7px;box-shadow:4px 4px 0 color-mix(in srgb,var(--flow) 20%,transparent)}
html[data-theme="lemon-sorbet"] .btn-primary{color:#2d250b}
html[data-theme="lilac-haze"] .card,html[data-theme="lilac-haze"] .stat-box,html[data-theme="lilac-haze"] .hero{border-radius:22px}
html[data-theme="lilac-haze"] .btn,html[data-theme="lilac-haze"] .pill{border-radius:999px}
html[data-theme="coastal-breeze"] .card,html[data-theme="coastal-breeze"] .stat-box{border-top:3px solid color-mix(in srgb,var(--flow) 65%,var(--border))}
html[data-theme="coastal-breeze"] .section-label{color:var(--flow)}
html[data-theme="terracotta-studio"] .view-title,html[data-theme="terracotta-studio"] .hero-name{font-family:Georgia,"Times New Roman",serif}
html[data-theme="terracotta-studio"] .card{border-left:4px solid color-mix(in srgb,var(--flow) 55%,var(--border))}
html[data-theme="notebook"] .card,html[data-theme="notebook"] .stat-box{border-radius:2px;box-shadow:none}
html[data-theme="notebook"] .section-label,html[data-theme="notebook"] .record-row .v{font-family:"Courier New",monospace}
html[data-theme="rose-milk"] .card,html[data-theme="rose-milk"] .stat-box,html[data-theme="rose-milk"] .hero{border-radius:24px;box-shadow:0 12px 28px rgba(171,92,105,.07)}
html[data-theme="seafoam-glass"] .card,html[data-theme="seafoam-glass"] .stat-box,html[data-theme="seafoam-glass"] .hero{background:color-mix(in srgb,var(--panel) 78%,transparent);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:0 14px 35px rgba(24,116,96,.08)}
html[data-theme="morning-sky"] .card,html[data-theme="morning-sky"] .stat-box{border-radius:14px;box-shadow:0 8px 24px rgba(55,100,150,.06)}
html[data-theme="morning-sky"] .section-label{letter-spacing:.09em;color:var(--flow)}
html[data-theme="pistachio"] .card{border-style:dashed}
html[data-theme="pistachio"] .btn{border-radius:14px}
html[data-theme="apricot"] .btn-primary{background:linear-gradient(135deg,#f29a58,var(--flow));border-color:var(--flow)}
html[data-theme="apricot"] .card,html[data-theme="apricot"] .stat-box{border-radius:16px}
html[data-theme="aurora-night"] .card,html[data-theme="aurora-night"] .hero{background:color-mix(in srgb,var(--panel) 86%,transparent);box-shadow:0 16px 44px rgba(0,0,0,.24)}
html[data-theme="aurora-night"] .btn-primary{background:linear-gradient(135deg,#57e2b2,#8a64ff);border-color:transparent;color:#071419}
html[data-theme="ink-neon"] .card,html[data-theme="ink-neon"] .stat-box{border-radius:3px;border-left:2px solid var(--flow)}
html[data-theme="ink-neon"] .section-label{font-family:"Courier New",monospace;color:var(--flow);text-transform:uppercase}
html[data-theme="ink-neon"] .btn-primary{background:linear-gradient(135deg,#50e3ff,#8b5cff);border-color:transparent;color:#071014}

/* v55 Platform Themes */
html[data-theme="platform-anilist-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#3db4f2;--flow-dim:color-mix(in srgb,#3db4f2 62%,#0b0d10)}
html[data-theme="platform-anilist-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#3db4f2;--flow-dim:color-mix(in srgb,#3db4f2 62%,#eef2f5)}
html[data-theme="platform-anisearch-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#e86c2f;--flow-dim:color-mix(in srgb,#e86c2f 62%,#0b0d10)}
html[data-theme="platform-anisearch-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#e86c2f;--flow-dim:color-mix(in srgb,#e86c2f 62%,#eef2f5)}
html[data-theme="platform-aniwatch-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#ffbade;--flow-dim:color-mix(in srgb,#ffbade 62%,#0b0d10)}
html[data-theme="platform-aniwatch-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#ffbade;--flow-dim:color-mix(in srgb,#ffbade 62%,#eef2f5)}
html[data-theme="platform-betaseries-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#ff4f4f;--flow-dim:color-mix(in srgb,#ff4f4f 62%,#0b0d10)}
html[data-theme="platform-betaseries-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#ff4f4f;--flow-dim:color-mix(in srgb,#ff4f4f 62%,#eef2f5)}
html[data-theme="platform-criticker-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#f39c12;--flow-dim:color-mix(in srgb,#f39c12 62%,#0b0d10)}
html[data-theme="platform-criticker-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#f39c12;--flow-dim:color-mix(in srgb,#f39c12 62%,#eef2f5)}
html[data-theme="platform-crunchyroll-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#f47521;--flow-dim:color-mix(in srgb,#f47521 62%,#0b0d10)}
html[data-theme="platform-crunchyroll-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#f47521;--flow-dim:color-mix(in srgb,#f47521 62%,#eef2f5)}
html[data-theme="platform-episodecalendar-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#4aa3df;--flow-dim:color-mix(in srgb,#4aa3df 62%,#0b0d10)}
html[data-theme="platform-episodecalendar-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#4aa3df;--flow-dim:color-mix(in srgb,#4aa3df 62%,#eef2f5)}
html[data-theme="platform-hianime-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#b9e36f;--flow-dim:color-mix(in srgb,#b9e36f 62%,#0b0d10)}
html[data-theme="platform-hianime-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#b9e36f;--flow-dim:color-mix(in srgb,#b9e36f 62%,#eef2f5)}
html[data-theme="platform-imdb-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#f5c518;--flow-dim:color-mix(in srgb,#f5c518 62%,#0b0d10)}
html[data-theme="platform-imdb-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#f5c518;--flow-dim:color-mix(in srgb,#f5c518 62%,#eef2f5)}
html[data-theme="platform-letterboxd-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#00e054;--flow-dim:color-mix(in srgb,#00e054 62%,#0b0d10)}
html[data-theme="platform-letterboxd-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#00e054;--flow-dim:color-mix(in srgb,#00e054 62%,#eef2f5)}
html[data-theme="platform-livechart-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#e84c4c;--flow-dim:color-mix(in srgb,#e84c4c 62%,#0b0d10)}
html[data-theme="platform-livechart-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#e84c4c;--flow-dim:color-mix(in srgb,#e84c4c 62%,#eef2f5)}
html[data-theme="platform-kitsu-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#f75239;--flow-dim:color-mix(in srgb,#f75239 62%,#0b0d10)}
html[data-theme="platform-kitsu-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#f75239;--flow-dim:color-mix(in srgb,#f75239 62%,#eef2f5)}
html[data-theme="platform-moviesfad-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#e74c3c;--flow-dim:color-mix(in srgb,#e74c3c 62%,#0b0d10)}
html[data-theme="platform-moviesfad-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#e74c3c;--flow-dim:color-mix(in srgb,#e74c3c 62%,#eef2f5)}
html[data-theme="platform-myanimelist-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#2e51a2;--flow-dim:color-mix(in srgb,#2e51a2 62%,#0b0d10)}
html[data-theme="platform-myanimelist-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#2e51a2;--flow-dim:color-mix(in srgb,#2e51a2 62%,#eef2f5)}
html[data-theme="platform-malxml-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#4f6bb5;--flow-dim:color-mix(in srgb,#4f6bb5 62%,#0b0d10)}
html[data-theme="platform-malxml-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#4f6bb5;--flow-dim:color-mix(in srgb,#4f6bb5 62%,#eef2f5)}
html[data-theme="platform-netflix-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#e50914;--flow-dim:color-mix(in srgb,#e50914 62%,#0b0d10)}
html[data-theme="platform-netflix-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#e50914;--flow-dim:color-mix(in srgb,#e50914 62%,#eef2f5)}
html[data-theme="platform-primewire-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#44c8f5;--flow-dim:color-mix(in srgb,#44c8f5 62%,#0b0d10)}
html[data-theme="platform-primewire-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#44c8f5;--flow-dim:color-mix(in srgb,#44c8f5 62%,#eef2f5)}
html[data-theme="platform-seriesfad-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#9b59b6;--flow-dim:color-mix(in srgb,#9b59b6 62%,#0b0d10)}
html[data-theme="platform-seriesfad-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#9b59b6;--flow-dim:color-mix(in srgb,#9b59b6 62%,#eef2f5)}
html[data-theme="platform-stremio-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#7b5cff;--flow-dim:color-mix(in srgb,#7b5cff 62%,#0b0d10)}
html[data-theme="platform-stremio-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#7b5cff;--flow-dim:color-mix(in srgb,#7b5cff 62%,#eef2f5)}
html[data-theme="platform-tvtime-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#ff2d55;--flow-dim:color-mix(in srgb,#ff2d55 62%,#0b0d10)}
html[data-theme="platform-tvtime-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#ff2d55;--flow-dim:color-mix(in srgb,#ff2d55 62%,#eef2f5)}
html[data-theme="platform-tviso-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#00a7c4;--flow-dim:color-mix(in srgb,#00a7c4 62%,#0b0d10)}
html[data-theme="platform-tviso-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#00a7c4;--flow-dim:color-mix(in srgb,#00a7c4 62%,#eef2f5)}
html[data-theme="platform-twee-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#ec407a;--flow-dim:color-mix(in srgb,#ec407a 62%,#0b0d10)}
html[data-theme="platform-twee-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#ec407a;--flow-dim:color-mix(in srgb,#ec407a 62%,#eef2f5)}
html[data-theme="platform-simkl-dark"]{--bg:#0b0d10;--panel:#12161b;--panel-raised:#1a2027;--border:#343c46;--border-soft:#252c34;--text:#f4f7fa;--text-dim:#b2bdc8;--text-mute:#74808c;--flow:#00a9e0;--flow-dim:color-mix(in srgb,#00a9e0 62%,#0b0d10)}
html[data-theme="platform-simkl-light"]{--bg:#eef2f5;--panel:#fff;--panel-raised:#f8fafb;--border:#cbd3db;--border-soft:#e0e5ea;--text:#202830;--text-dim:#52606d;--text-mute:#82909c;--flow:#00a9e0;--flow-dim:color-mix(in srgb,#00a9e0 62%,#eef2f5)}
html[data-theme="platform-trakt-old"]{--bg:#111;--panel:#1a1a1a;--panel-raised:#222;--border:#3a3a3a;--border-soft:#292929;--text:#f4f4f4;--text-dim:#bbb;--text-mute:#777;--flow:#ed1c24;--flow-dim:#a91c22}
html[data-theme="platform-trakt-new-dark"]{--bg:#0c0d0f;--panel:#17191c;--panel-raised:#202226;--border:#3a3d42;--border-soft:#292c30;--text:#f7f7f7;--text-dim:#b9bcc1;--text-mute:#777c82;--flow:#ed1c24;--flow-dim:#a91c22}
html[data-theme="platform-trakt-new-light"]{--bg:#f4f5f6;--panel:#fff;--panel-raised:#fafafa;--border:#d5d7da;--border-soft:#e6e7e9;--text:#202124;--text-dim:#5f6368;--text-mute:#8a8d91;--flow:#ed1c24;--flow-dim:#d35b60}
html[data-theme="custom"]{--bg:var(--mf-custom-bg);--panel:var(--mf-custom-panel);--panel-raised:var(--mf-custom-raised);--border:var(--mf-custom-border);--border-soft:var(--mf-custom-border);--text:var(--mf-custom-text);--text-dim:var(--mf-custom-muted);--text-mute:var(--mf-custom-muted);--flow:var(--mf-custom-accent)}
.v43-view-switch{display:flex;gap:6px;flex-wrap:wrap;align-items:center}.v43-view-switch .active{border-color:var(--flow);color:var(--text)}
.library-view-compact .item-row{padding:7px 10px;gap:8px}.library-view-compact .item-sub{font-size:10px}.library-view-compact .bal-icon{width:28px;height:28px}
.library-view-cards .card:has(.item-row){display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;background:transparent;border:0;padding:0}.library-view-cards .item-row{display:grid;grid-template-columns:auto 1fr;align-items:start;border:1px solid var(--border);background:var(--panel);border-radius:12px;padding:14px}.library-view-cards .item-row>button,.library-view-cards .item-row>.pill{margin-top:5px}.library-view-cards .item-row .mf-select{grid-row:1/3}
.v43-log-detail{font-size:11px;line-height:1.55;margin-top:4px;color:var(--text-dim)}.v43-log-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}.v43-balance-guidance{grid-column:2/-1;font-size:11px;color:var(--text-dim);margin-top:2px}.v43-balance-guidance b{color:var(--text)}
.v43-custom-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-top:12px}.v43-color-field input[type=color]{height:40px;padding:3px}
`;
document.head.appendChild(v43ThemeCss);

function v43ApplyCustomTheme(){
  const c=S.settings.customTheme||{};const r=document.documentElement.style;
  const pairs={bg:'--mf-custom-bg',panel:'--mf-custom-panel',raised:'--mf-custom-raised',border:'--mf-custom-border',text:'--mf-custom-text',muted:'--mf-custom-muted',accent:'--mf-custom-accent'};
  Object.entries(pairs).forEach(([k,v])=>r.setProperty(v,c[k]||DEFAULT_SETTINGS.customTheme?.[k]||'#111111'));
}
applyTheme=function(theme){const t=V43_THEMES.includes(theme)?theme:'dark';if(S.settings)S.settings.theme=t;v43ApplyCustomTheme();document.documentElement.dataset.theme=t;try{localStorage.setItem('mf_theme',t);}catch(e){}};
function v43SetCustomTheme(k,v){if(!/^#[0-9a-f]{6}$/i.test(v))return;S.settings.customTheme=S.settings.customTheme||{};S.settings.customTheme[k]=v;S.settings.theme='custom';applyTheme('custom');persistSettings();render();}
function v43ResetCustomTheme(){S.settings.customTheme={bg:'#0E111A',panel:'#161B2A',raised:'#1C2334',border:'#2B3448',text:'#F4F6FB',muted:'#8D98AD',accent:'#E8A94A'};S.settings.theme='custom';applyTheme('custom');persistSettings();render();}

/* Library selection + view modes */
function v43FilteredLibraryIds(){const f=S.histFilters||{};return v53FilteredLibrary(f.libCategory||'all',f.libStatus||'all',f.libPriority||'all',(f.libSearch||'').trim()).map(i=>i.id);}
function v43SelectAll(){S.librarySelection=S.librarySelection||{};v43FilteredLibraryIds().forEach(id=>S.librarySelection[id]=true);render();}
function v43DeselectAll(){S.librarySelection={};render();}
function v43SetLibraryView(v){if(!['list','compact','cards'].includes(v))return;S.settings.libraryView=v;persistSettings();render();}
const v43OriginalLibrary=mfBaseRenderLibrary;
renderLibrary=function(){let h=v43OriginalLibrary();const mode=S.settings.libraryView||'list';const controls=`<div class="mf-batchbar"><div style="display:flex;gap:7px;flex-wrap:wrap"><button class="btn btn-sm" onclick="App.selectVisibleLibrary(true)">Select visible</button><button class="btn btn-sm" onclick="App.selectAllLibrary()">Select all matching</button><button class="btn btn-sm" onclick="App.deselectAllLibrary()">Deselect all</button><button class="btn btn-sm" ${mfSelectedIds().length?'':'disabled'} onclick="App.fixSelectedCompletedProgress()">Fix completed progress</button></div><b>${mfSelectedIds().length} selected</b><div class="spacer"></div><select style="width:auto" onchange="if(this.value){App.batchLibraryStatus(this.value);this.value=''}"><option value="">Set status…</option><option value="planned">Plan to Watch</option><option value="active">Watching</option><option value="paused">On Hold</option><option value="completed">Completed</option><option value="dropped">Dropped</option></select><select style="width:auto" onchange="if(this.value){App.batchLibraryPriority(this.value);this.value=''}"><option value="">Set priority…</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select><select style="width:auto" onchange="if(this.value){App.batchLibraryCategory(this.value);this.value=''}"><option value="">Move to…</option>${S.categories.map(c=>`<option value="${c.id}">${v144CategoryIconText(c)} ${escapeHtml(c.name)}</option>`).join('')}</select><button class="btn btn-sm" ${mfSelectedIds().length?'':'disabled'} onclick="App.v69RepairSelectedCompleted()">Fix completed progress</button><button class="btn btn-sm btn-danger" ${mfSelectedIds().length?'':'disabled'} onclick="App.batchDeleteLibrary()">Delete selected</button></div>`;
  const view=`<div class="v43-view-switch" style="margin:0 0 12px"><span class="hint">Display:</span>${[['list','List'],['compact','Compact'],['cards','Cards']].map(([v,l])=>`<button class="btn btn-sm ${mode===v?'active':''}" onclick="App.setLibraryView('${v}')">${l}</button>`).join('')}</div>`;
  h=h.replace('<div class="section-label">OVERVIEW',controls+'<div class="section-label">OVERVIEW');h=h.replace('<div class="lib-toolbar">',view+'<div class="lib-toolbar">');return `<div class="library-view-${mode}">${h}</div>`;
};

/* Category maintenance now lives in Settings */
const v43SettingsBase=renderSettings;
renderSettings=function(){let html=v43SettingsBase();const maintenance=`<div class="section-label">CATEGORY MAINTENANCE</div><div class="card" style="margin-bottom:22px"><div style="display:flex;gap:8px;flex-wrap:wrap">${S.categories.map(c=>`<button class="btn btn-sm" onclick="App.clearCategoryLibrary('${c.id}')">Clear ${v144CategoryIconHtml(c)} ${escapeHtml(c.name)}</button>`).join('')}</div><div class="hint" style="margin-top:9px">Clears titles only from the chosen category. Consumption history stays intact and the change can be undone from Library History.</div></div>`;
  const c=S.settings.customTheme||{};const currentTheme=S.settings.theme||'dark';const platformMode=V55_PLATFORM_THEMES.includes(currentTheme);const mfOptions=V55_MEDIAFLOW_THEMES.map(t=>`<option value="${t}" ${currentTheme===t?'selected':''}>${V43_THEME_LABELS[t]}</option>`).join('');const pfOptions=V55_PLATFORM_THEMES.map(t=>`<option value="${t}" ${currentTheme===t?'selected':''}>${V43_THEME_LABELS[t]}</option>`).join('');const custom=`<div class="section-label">THEMES & CUSTOMIZATION</div><div class="card" style="margin-bottom:22px"><div class="field"><label class="field-label">Theme collection</label><select onchange="App.setThemeCollection(this.value)"><option value="mediaflow" ${!platformMode?'selected':''}>MediaFlow Themes</option><option value="platform" ${platformMode?'selected':''}>Platform Themes</option></select><small class="hint">Switch collections first. The selected collection gets its own theme dropdown.</small></div>${!platformMode?`<div class="field"><label class="field-label">MediaFlow theme</label><select onchange="App.setTheme(this.value)">${mfOptions}</select></div>`:`<div class="field"><label class="field-label">Platform theme</label><select onchange="App.setTheme(this.value)">${pfOptions}</select></div>`}<div class="v43-custom-grid">${[['bg','Background'],['panel','Panels'],['raised','Raised surfaces'],['border','Borders'],['text','Text'],['muted','Muted text'],['accent','Accent']].map(([k,l])=>`<div class="field v43-color-field"><label class="field-label">${l}</label><input type="color" value="${escapeHtml(c[k]||'#111111')}" onchange="App.setCustomTheme('${k}',this.value)"></div>`).join('')}</div><div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button class="btn" onclick="App.setTheme('custom')">Use custom theme</button><button class="btn btn-ghost" onclick="App.resetCustomTheme()">Reset custom colors</button></div></div>`;
  /* Remove the old 3-theme appearance card to avoid duplicate controls. */
  html=html.replace(/<div class="section-label settings-section-head"><span>APPEARANCE<\/span>[\s\S]*?<\/div><\/div>(?=<div class="section-label settings-section-head"><span>AUTOMATIC BACKUPS)/,'');
  const data=html.indexOf('<div class="section-label">DATA</div>');return data>=0?html.slice(0,data)+custom+maintenance+html.slice(data):html+custom+maintenance;
};

/* Richer activity entries. Existing entries remain readable. */
function v43DiffSnapshot(before,after){const b=new Map((before?.library||[]).map(i=>[i.id,i])),a=new Map((after?.library||[]).map(i=>[i.id,i]));const ids=new Set([...b.keys(),...a.keys()]),changes=[];for(const id of ids){const x=b.get(id),y=a.get(id);if(!x&&y)changes.push({id,title:cleanTitle(y.title),kind:'added'});else if(x&&!y)changes.push({id,title:cleanTitle(x.title),kind:'deleted'});else if(x&&y){const fields=[];for(const k of ['title','categoryId','status','priority','progress','total','rating'])if(JSON.stringify(x[k]??null)!==JSON.stringify(y[k]??null))fields.push(`${k}: ${x[k]??'—'} → ${y[k]??'—'}`);if(fields.length)changes.push({id,title:cleanTitle(y.title),kind:'changed',fields});}if(changes.length>=25)break;}return changes;}
function v50SnapshotXP(x){
  if(!x)return null;
  const sessions=Array.isArray(x.sessions)?x.sessions:[];
  const ledger=x.xpLedger||{};
  const sum=o=>Object.values(o||{}).reduce((a,v)=>a+(Number(v)||0),0);
  const sessionXP=sessions.reduce((a,s)=>{
    if(!s||s.status==='skipped')return a;
    if(Number.isFinite(Number(s.xp)))return a+Math.max(0,Number(s.xp));
    const cat=getCategory(s.categoryId);
    return a+calculateConsumptionXP(cat,Number(s.actualAmount)||0,Number(s.minutes)||0,'healthy').xp;
  },0);
  return sessionXP+sum(ledger.libraryAdditions)+sum(ledger.libraryEdits)+sum(ledger.manualCovers);
}
mfActivity=function(action,detail){
  S.activityLog=S.activityLog||[];
  const tx=(S.undoStack||[])[S.undoStack.length-1];
  const changes=tx?.before&&tx?.after?v43DiffSnapshot(tx.before,tx.after):[];
  let xpEarned=0;
  if(tx?.before&&tx?.after){
    const beforeXP=v50SnapshotXP(tx.before), afterXP=v50SnapshotXP(tx.after);
    if(beforeXP!=null&&afterXP!=null)xpEarned=Math.max(0,Math.round(afterXP-beforeXP));
  }
  const exactIds=[...new Set(changes.map(x=>x.id).filter(Boolean))];
  const titleSnapshot=exactIds.length===1?cleanTitle(S.library.find(i=>i.id===exactIds[0])?.title||changes[0]?.title||detail||''):'';
  S.activityLog.unshift({id:uid(),timestamp:Date.now(),action:String(action||'Change'),detail:String(detail||''),changes,titleIds:exactIds,titleSnapshot,xpEarned});
  if(S.activityLog.length>1000)S.activityLog.length=1000;
};
function v50NormalizeHistoryTitle(v){
  return cleanTitle(String(v||'')).trim().toLocaleLowerCase();
}
function v50LibraryLookup(){
  const byId=new Map(), byTitle=new Map();
  for(const item of (S.library||[])){
    if(!item?.id)continue;
    byId.set(item.id,item);
    const key=v50NormalizeHistoryTitle(item.title);
    if(!key)continue;
    const list=byTitle.get(key)||[];
    list.push(item.id);
    byTitle.set(key,list);
  }
  return {byId,byTitle};
}
function v50LegacyHistoryTitle(x){
  const candidates=[];
  if(x?.titleSnapshot)candidates.push(x.titleSnapshot);
  if(x?.title)candidates.push(x.title);
  for(const c of (x?.changes||[])) if(c?.title)candidates.push(c.title);
  // Old transactions commonly stored the affected title directly as detail.
  if(x?.detail)candidates.push(x.detail);
  return [...new Set(candidates.map(v=>String(v||'').trim()).filter(Boolean))];
}
function v43FindLogTitles(x,lookup){
  lookup=lookup||v50LibraryLookup();
  // Modern records: IDs are authoritative. Never fall back to text if an ID exists.
  const stored=[...(x?.titleIds||[]),...(x?.libraryIds||[])].filter(Boolean);
  if(stored.length)return [...new Set(stored)].filter(id=>lookup.byId.has(id));

  // Legacy records: exact normalized title only, and only when unique.
  // No includes()/substring matching: "Ai" can never match "Sendokai Champions".
  const hits=[];
  for(const title of v50LegacyHistoryTitle(x)){
    const ids=lookup.byTitle.get(v50NormalizeHistoryTitle(title))||[];
    if(ids.length===1)hits.push(ids[0]);
  }
  return [...new Set(hits)];
}
function v50MigrateLibraryHistoryLinks(){
  if(!Array.isArray(S.activityLog)||!S.activityLog.length)return {linked:0,ambiguous:0};
  const lookup=v50LibraryLookup();
  let linked=0, ambiguous=0;
  for(const x of S.activityLog){
    if(!x||typeof x!=='object')continue;
    const existing=[...(x.titleIds||[]),...(x.libraryIds||[])].filter(id=>lookup.byId.has(id));
    if(existing.length){
      x.titleIds=[...new Set(existing)];
      if(!x.titleSnapshot && x.titleIds.length===1)x.titleSnapshot=cleanTitle(lookup.byId.get(x.titleIds[0])?.title||'');
      continue;
    }
    const matches=[];
    for(const title of v50LegacyHistoryTitle(x)){
      const ids=lookup.byTitle.get(v50NormalizeHistoryTitle(title))||[];
      if(ids.length===1)matches.push(ids[0]);
      else if(ids.length>1)ambiguous++;
    }
    const unique=[...new Set(matches)];
    if(unique.length===1){
      x.titleIds=unique;
      x.titleSnapshot=cleanTitle(lookup.byId.get(unique[0])?.title||'');
      x.linkMigratedV50=true;
      linked++;
    }
  }
  S.migrations=S.migrations||{};
  S.migrations.libraryHistoryExactIdsV50={done:true,at:Date.now(),linked};
  return {linked,ambiguous};
}
function v43ActivityHtml(){
  const lookup=v50LibraryLookup();
  const rows=(S.activityLog||[]).slice(0,1000).map(x=>{
    const ids=v43FindLogTitles(x,lookup);
    const change=(x.changes||[]).map(c=>`<div>• <b>${escapeHtml(c.title)}</b> ${escapeHtml(c.kind)}${c.fields?.length?`<div>${c.fields.map(escapeHtml).join('<br>')}</div>`:''}</div>`).join('');
    const earned=Math.max(0,Number(x.xpEarned)||0);
    const xp=earned?`<div class="mf-activity-xp" title="XP earned by this Library action"><strong>+${earned.toLocaleString()} XP</strong> earned</div>`:'';
    return `<div class="mf-activity-row"><div class="mf-activity-time">${new Date(x.timestamp).toLocaleString()}</div><div><b>${escapeHtml(x.action)}</b>${x.detail?`<div class="v43-log-detail">${escapeHtml(x.detail)}</div>`:''}${xp}${change?`<div class="v43-log-detail">${change}</div>`:''}${ids.length?`<div class="v43-log-actions">${ids.slice(0,5).map(id=>{const i=S.library.find(z=>z.id===id);return i?`<button class="btn btn-sm btn-ghost" onclick="App.openLibraryModal('${id}')">Edit ${escapeHtml(cleanTitle(i.title))}</button>`:''}).join('')}</div>`:''}</div></div>`;
  }).join('')||'<div class="empty-state">No library activity recorded yet.</div>';
  return `<div class="card"><div class="section-label">LIBRARY CHANGE LOG</div><div class="mf-activity" style="max-height:none">${rows}</div></div>`;
}
mfActivityHtml=v43ActivityHtml;

/* Log imports and exports that are not already represented by a library transaction. */
function v43LogIO(action,detail){mfActivity(action,detail);saveState();}
for(const name of ['exportExchange','exportJSON','exportHistoryCSV']){const old=App[name];if(old)App[name]=function(...args){v43LogIO('Export',name.replace(/^export/,'')+(args[0]?` · ${args[0]}`:''));return old.apply(App,args);};}
for(const name of ['confirmPendingImport','syncMAL']){const old=App[name];if(old)App[name]=function(...args){v43LogIO('Import',name==='syncMAL'?'MyAnimeList sync':'Confirmed external/backup import');return old.apply(App,args);};}

/* Today's Balance mirrors the same dynamic amount engine used by recommendations. */
function v43BalanceGuidance(cat,status){const a=suggestedAmount(cat),mid=Math.max(1,Math.round((a.low+a.high)/2)),mins=Math.max(0,Math.round(mid*(Number(cat.minutesPerUnit)||0))),base=Math.max(1,Number(cat.target)||1),baseMin=Math.round(base*(Number(cat.minutesPerUnit)||0));if(status==='overused'||a.direction==='reduced'){const less=Math.max(0,base-mid),lessMin=Math.max(0,baseMin-mins);return `<b>Cool-down guidance:</b> if this rotates now, about ${mid} ${unitLabel(cat.unit,mid)} (~${mins} min), ${less} ${unitLabel(cat.unit,less)} / ~${lessMin} min less than the normal target.`;}if(status==='neglected'||status==='due'||a.direction==='increased'){return `<b>Catch-up guidance:</b> about ${a.low===a.high?a.low:`${a.low}–${a.high}`} ${unitLabel(cat.unit,mid)} (~${Math.round(a.low*(cat.minutesPerUnit||0))}${a.low===a.high?'':`–${Math.round(a.high*(cat.minutesPerUnit||0))}`} min) if selected now. This grows or shrinks with the scheduler's live balance calculation.`;}return `<b>Balanced guidance:</b> about ${a.low===a.high?a.low:`${a.low}–${a.high}`} ${unitLabel(cat.unit,mid)} (~${Math.round(a.low*(cat.minutesPerUnit||0))}${a.low===a.high?'':`–${Math.round(a.high*(cat.minutesPerUnit||0))}`} min) if selected now.`;}
const v43DashboardBase=renderDashboard;
renderDashboard=function(){let h=v43DashboardBase();for(const cat of (typeof v186ScopeCategories==='function'?v186ScopeCategories('todayBalance'):S.categories.filter(c=>c.enabled))){const status=categoryStatus(cat),needle=`${escapeHtml(categoryStatusActionSummary(cat,status,overallCategoryStatus(cat)))}</div>`;const repl=`${escapeHtml(categoryStatusActionSummary(cat,status,overallCategoryStatus(cat)))}</div><div class="v43-balance-guidance">${v43BalanceGuidance(cat,status)}</div>`;h=h.replace(needle,repl);}return h;};

Object.assign(App,{selectAllLibrary:v43SelectAll,deselectAllLibrary:v43DeselectAll,setLibraryView:v43SetLibraryView,setCustomTheme:v43SetCustomTheme,resetCustomTheme:v43ResetCustomTheme});



/* ============================================================
   V44 — STOPWATCH ADD TIME / RATINGS / COVERS / XP / TIMELINE
   ============================================================ */
/* Persist new v44 UI state without changing the cloud schema. */
S.timelinePage=S.timelinePage||0; S.timelinePageSize=25;
S.xpLedger=S.xpLedger||{}; S.xpLedger.libraryEdits=S.xpLedger.libraryEdits||{}; S.xpLedger.manualCovers=S.xpLedger.manualCovers||{};
function v44Leveling(){const l=levelingSettings();return Object.assign({libraryEditXP:5,manualCoverXP:15},l);}
function v44AwardEditXP(id){if(!id||!v44Leveling().enabled)return 0;S.xpLedger.libraryEdits=S.xpLedger.libraryEdits||{};const xp=Math.max(0,Math.round(Number(v44Leveling().libraryEditXP)||0));S.xpLedger.libraryEdits[id]=(Number(S.xpLedger.libraryEdits[id])||0)+xp;return xp;}
function v44AwardManualCoverXP(id){if(!id||!v44Leveling().enabled)return 0;S.xpLedger.manualCovers=S.xpLedger.manualCovers||{};if(S.xpLedger.manualCovers[id])return 0;const xp=Math.max(0,Math.round(Number(v44Leveling().manualCoverXP)||0));S.xpLedger.manualCovers[id]=xp;return xp;}
const v44OldLibraryXPTotal=libraryXPTotal;
libraryXPTotal=function(){return v44OldLibraryXPTotal()+Object.values(S.xpLedger?.libraryEdits||{}).reduce((a,v)=>a+(Number(v)||0),0)+Object.values(S.xpLedger?.manualCovers||{}).reduce((a,v)=>a+(Number(v)||0),0);};

/* Stopwatch: add the entered H:M:S to the current elapsed value. */
function stopwatchAddTime(){if(S.stopwatch.running)return;const h=Math.max(0,Math.min(999,Number(document.getElementById('sw-hours')?.value)||0)),m=Math.max(0,Math.min(59,Number(document.getElementById('sw-minutes')?.value)||0)),sec=Math.max(0,Math.min(59,Number(document.getElementById('sw-seconds')?.value)||0));const add=Math.round((h*3600+m*60+sec)*1000);if(!add){showToast('Enter a time to add.');return;}S.stopwatch.elapsed=Math.max(0,Number(S.stopwatch.elapsed)||0)+add;S.stopwatch.resetValue=S.stopwatch.elapsed;S.stopwatch.startedAt=0;persistTask();render();showToast(`Added ${fmtStopwatch(add)} · ${fmtStopwatch(S.stopwatch.elapsed)} total ✓`);}
function stopwatchMinusTime(){if(S.stopwatch.running)return;const h=Math.max(0,Math.min(999,Number(document.getElementById('sw-hours')?.value)||0)),m=Math.max(0,Math.min(59,Number(document.getElementById('sw-minutes')?.value)||0)),sec=Math.max(0,Math.min(59,Number(document.getElementById('sw-seconds')?.value)||0));const subtract=Math.round((h*3600+m*60+sec)*1000);if(!subtract){showToast('Enter a time to subtract.');return;}const before=Math.max(0,Number(S.stopwatch.elapsed)||0);S.stopwatch.elapsed=Math.max(0,before-subtract);S.stopwatch.resetValue=S.stopwatch.elapsed;S.stopwatch.startedAt=0;persistTask();render();showToast(`Subtracted ${fmtStopwatch(Math.min(subtract,before))} · ${fmtStopwatch(S.stopwatch.elapsed)} total ✓`);}
const v44OldStopwatchHtml=stopwatchHtml;
stopwatchHtml=function(){let h=v44OldStopwatchHtml();const sw=S.stopwatch||{};return h.replace('>Set time</button></div>',`>Set time</button><button class="btn" onclick="App.stopwatchAddTime()" ${sw.running?'disabled':''}>Add time</button><button class="btn" onclick="App.stopwatchMinusTime()" ${sw.running?'disabled':''}>Minus time</button></div>`).replace('Set any starting time, press Start, and the stopwatch continues upward from there.','Set, add, or subtract any time to build the exact starting value you want, then press Start to continue upward.');};

/* Rating + cover controls in title editor. */
const v44OldLibraryModalHtml=libraryModalHtml;
libraryModalHtml=function(d){let h=v44OldLibraryModalHtml(d);const rating=Number(d.rating)||0,cover=String(d.coverUrl||'');const extra=`<div class="field-row"><div class="field"><label class="field-label">Rating (0–10)</label><input type="number" id="l-rating" min="0" max="10" step="0.1" value="${rating||''}" placeholder="Not rated"></div></div><div class="field"><label class="field-label">Cover art</label><div class="v44-cover-row"><img id="l-cover-preview" class="v44-cover-preview" src="${escapeHtml(cover)}" alt="Cover preview" onerror="this.style.visibility='hidden'" ${cover?'':'style="visibility:hidden"'}><div class="v44-cover-fields"><input type="url" id="l-cover" value="${escapeHtml(cover)}" placeholder="Paste an image URL" oninput="App.previewLibraryCover(this.value)"><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button type="button" class="btn btn-sm" onclick="App.findLibraryCover()">Find cover automatically</button><button type="button" class="btn btn-sm btn-ghost" onclick="App.clearLibraryCover()">Remove cover</button></div><small class="hint">Manual cover art earns the configurable manual-cover XP bonus once per title. Automatic retrieval does not earn that bonus.</small></div></div></div>`;return h.replace('<div class="field"><label class="field-label">Estimated minutes',extra+'<div class="field"><label class="field-label">Estimated minutes');};
// v83: manual past repeat values are editable in the same per-title repeat panel.
// v82: show per-title repeat history inside the Library title editor.
const v82OldLibraryModalHtml=libraryModalHtml;
libraryModalHtml=function(d){
  let h=v82OldLibraryModalHtml(d);
  if(!d?.id) return h;
  const panel=v82RepeatDetailHtml(d);
  return h.replace('<div class="modal-actions" style="justify-content:space-between;">',panel+'<div class="modal-actions" style="justify-content:space-between;">');
};

const v135LibraryModalHtmlBase=libraryModalHtml;

function v135DateInputValue(ts){
  ts=Number(ts)||0;
  if(!ts)return '';
  const d=new Date(ts);
  if(Number.isNaN(d.getTime()))return '';
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,'0');
  const day=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

function v135ParseDateInput(raw){
  raw=String(raw||'').trim();
  const m=raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!m)return null;
  const y=Number(m[1]),mo=Number(m[2]),day=Number(m[3]);
  const d=new Date(y,mo-1,day,12,0,0,0);
  if(
    Number.isNaN(d.getTime()) ||
    d.getFullYear()!==y ||
    d.getMonth()!==mo-1 ||
    d.getDate()!==day
  )return null;
  return d.getTime();
}

function v135SessionTimestamp(s){
  const ts=Number(s?.timestamp)||0;
  if(ts)return ts;
  const raw=String(s?.date||'').slice(0,10);
  return v135ParseDateInput(raw)||0;
}

function v135InferStartedAt(item){
  const saved=Number(item?.startedAt)||0;
  if(saved)return saved;
  if(!item?.id)return 0;

  const id=String(item.id);
  const titleKey=cleanTitle(item.title).toLowerCase();
  let earliest=Infinity;

  for(const s of (S.sessions||[])){
    if(!s || s.status==='skipped')continue;
    const matched=(s.titles||[]).some(t=>
      String(t?.libraryId||'')===id ||
      (
        !t?.libraryId &&
        cleanTitle(t?.title).toLowerCase()===titleKey &&
        String(s.categoryId||'')===String(item.categoryId||'')
      )
    );
    if(!matched)continue;
    const ts=v135SessionTimestamp(s);
    if(ts>0 && ts<earliest)earliest=ts;
  }

  return Number.isFinite(earliest)?earliest:0;
}

libraryModalHtml=function(d){
  let h=v135LibraryModalHtmlBase(d);

  // Status controls whether Finish Date is active. Start Date stays editable
  // for planned/active/paused/completed/dropped titles.
  h=h.replace(
    '<select id="l-status">',
    '<select id="l-status" onchange="App.v135LibraryStatusChanged(this.value)">'
  );

  const startAt=v135InferStartedAt(d);
  const finishAt=Number(d?.completedAt)||0;
  const completed=String(d?.status||'planned')==='completed';
  const startSource=String(d?.startedAtSource||'');
  const startHint=
    startAt&&!d?.startedAt
      ?'Inferred from this title’s earliest genuine MediaFlow History log. Saving keeps it automatic unless you edit the date.'
      :startSource==='auto'
        ?'Automatically set from the earliest genuine History log. It can move earlier if older History is later logged or backdated.'
        :startSource==='mal'
          ?'Imported from MyAnimeList. Editing this date makes it a manual Start Date.'
          :'When you started this title. Manual/legacy dates are not overwritten by automatic logging.';

  const dates=`<div class="field-row v135-title-dates">
    <div class="field">
      <label class="field-label">Start date</label>
      <input type="date" id="l-start-date" value="${v135DateInputValue(startAt)}" onchange="this.dataset.edited='1'">
      <small class="hint">${startHint}</small>
    </div>
    <div class="field">
      <label class="field-label">Finish date</label>
      <input type="date" id="l-finish-date" value="${v135DateInputValue(finishAt)}" ${completed?'':'disabled'}>
      <small class="hint">${completed?'Used by completion history and completed-title statistics.':'Set Status to Completed to edit the finish date.'}</small>
    </div>
  </div>`;

  return h.replace(
    '<div class="field"><label class="field-label">Estimated minutes',
    dates+'<div class="field"><label class="field-label">Estimated minutes'
  );
};

App.v135LibraryStatusChanged=function(status){
  const input=document.getElementById('l-finish-date');
  if(!input)return;
  const completed=String(status)==='completed';
  input.disabled=!completed;

  // Preserve MediaFlow's previous behavior: choosing Completed without a known
  // finish date means "finished today", while still letting the user edit it.
  if(completed && !input.value) input.value=v135DateInputValue(Date.now());
};

function v44PreviewCover(url){const img=document.getElementById('l-cover-preview');if(!img)return;img.src=String(url||'');img.style.visibility=url?'visible':'hidden';}
async function v44FindCover(){
  const title=cleanTitle(document.getElementById('l-title')?.value||'');
  if(!title){showToast('Enter a title first.');return;}
  const catId=document.getElementById('l-category')?.value||'',cat=getCategory(catId);
  showToast('Searching multiple cover sources…');
  const results=[],seen=new Set();
  const add=(url,name,meta,provider)=>{url=String(url||'').trim();if(!url||seen.has(url))return;seen.add(url);results.push({url,name:cleanTitle(name||title),meta:String(meta||''),provider});};
  try{
    const animeLike=catId==='seasonal'||catId==='backlog'||catId==='animemovies'||/anime/i.test(cat?.name||'');
    const reading=cat?.type==='reading'||/manga|manhwa|manhua|comic/i.test(cat?.name||'');
    if(animeLike||reading){
      try{const endpoint=reading?'manga':'anime';const r=await fetch(`https://api.jikan.moe/v4/${endpoint}?q=${encodeURIComponent(title)}&limit=8`);if(r.ok){const j=await r.json();for(const x of (j?.data||[])){add(x?.images?.jpg?.large_image_url||x?.images?.jpg?.image_url,x?.title_english||x?.title,x?.year||x?.published?.from?.slice?.(0,4)||'',`Jikan / ${reading?'Manga':'Anime'}`);}}}catch(e){console.warn('Jikan cover search failed',e);}
    }
    if(cat?.type==='video'&&!animeLike){
      try{const r=await fetch('https://api.tvmaze.com/search/shows?q='+encodeURIComponent(title));if(r.ok){const j=await r.json();for(const row of (j||[]).slice(0,8)){const x=row.show;add(x?.image?.original||x?.image?.medium,x?.name,x?.premiered?.slice?.(0,4)||'', 'TVmaze');}}}catch(e){console.warn('TVmaze cover search failed',e);}
    }
    if(reading){
      try{const r=await fetch('https://openlibrary.org/search.json?title='+encodeURIComponent(title)+'&limit=8&fields=title,first_publish_year,cover_i');if(r.ok){const j=await r.json();for(const x of (j?.docs||[])){if(x.cover_i)add(`https://covers.openlibrary.org/b/id/${x.cover_i}-L.jpg`,x.title,x.first_publish_year||'','Open Library');}}}catch(e){console.warn('Open Library cover search failed',e);}
    }
    if(!results.length){showToast('No automatic cover found. You can paste an external image URL manually.');return;}
    v45ShowCoverPicker(title,results);
  }catch(e){console.error(e);showToast('Could not retrieve covers. You can paste an external image URL manually.');}
}
function v45ShowCoverPicker(title,results){let old=document.getElementById('v45-cover-picker');if(old)old.remove();const wrap=document.createElement('div');wrap.id='v45-cover-picker';wrap.className='modal-overlay';wrap.style.zIndex='130';wrap.onclick=e=>{if(e.target===wrap)wrap.remove();};wrap.innerHTML=`<div class="modal">${coverPickerModalHtml({title,results})}</div>`;document.body.appendChild(wrap);wrap._results=results;}
function coverPickerModalHtml(d){const rows=(d.results||[]).map((r,i)=>`<button type="button" class="v45-cover-choice" onclick="App.chooseLibraryCover(${i})"><img src="${escapeHtml(r.url)}" alt="" onerror="this.style.display='none'"><span><b>${escapeHtml(r.name)}</b><small>${escapeHtml([r.meta,r.provider].filter(Boolean).join(' · '))}</small></span></button>`).join('');return `<div class="modal-title">Choose cover for ${escapeHtml(d.title||'title')}</div><p class="hint">Select the correct match. MediaFlow stores only the external image URL, not the image file.</p><div class="v45-cover-grid">${rows}</div><div class="modal-actions"><button class="btn btn-ghost" onclick="document.getElementById('v45-cover-picker')?.remove()">Cancel</button></div>`;}
App.chooseLibraryCover=function(i){const picker=document.getElementById('v45-cover-picker'),r=picker?._results?.[i];if(!r)return;const input=document.getElementById('l-cover');if(input){input.value=r.url;input.dataset.auto='1';v44PreviewCover(r.url);}picker.remove();showToast('Cover selected ✓');};

/* Replace title save so rating/cover persist and title edits award XP. */
App.saveLibraryModal=function(id){
  const old=id?S.library.find(i=>i.id===id):null;

  const status=String(document.getElementById('l-status')?.value||'planned');
  const startInput=document.getElementById('l-start-date');
  const startRaw=String(startInput?.value||'').trim();
  const finishRaw=String(document.getElementById('l-finish-date')?.value||'').trim();
  const startedAt=startRaw?v135ParseDateInput(startRaw):null;

  // v137 source tracking:
  // - direct editor changes become manual;
  // - unchanged MAL/manual/legacy values retain their protection;
  // - an inferred blank-title date saved without editing stays automatic.
  let startedAtSource=null;
  if(startedAt){
    const edited=startInput?.dataset?.edited==='1';
    if(edited){
      startedAtSource='manual';
    }else if(old?.startedAt && startRaw===v135DateInputValue(old.startedAt)){
      startedAtSource=old.startedAtSource||null;
    }else if(!old?.startedAt && old?.id && startRaw===v135DateInputValue(v135InferStartedAt(old))){
      startedAtSource='auto';
    }else{
      startedAtSource='manual';
    }
  }

  let completedAt=null;
  if(status==='completed'){
    completedAt=finishRaw?v135ParseDateInput(finishRaw):(Number(old?.completedAt)||Date.now());
  }

  if(startRaw && !startedAt){
    showToast('Start date is invalid.');
    document.getElementById('l-start-date')?.focus();
    return;
  }
  if(status==='completed' && finishRaw && !completedAt){
    showToast('Finish date is invalid.');
    document.getElementById('l-finish-date')?.focus();
    return;
  }
  if(startedAt && completedAt && completedAt<startedAt){
    showToast('Finish date cannot be before Start date.');
    document.getElementById('l-finish-date')?.focus();
    return;
  }

  mfBegin(id?'Edit title':'Add title',old?cleanTitle(old.title):'');

  const tagsRaw=document.getElementById('l-tags').value;
  const coverInput=document.getElementById('l-cover');
  const cover=String(coverInput?.value||'').trim();

  const data=Object.assign({},old||{},{
    id:id||uid(),
    title:cleanTitle(document.getElementById('l-title').value)||'Untitled',
    categoryId:document.getElementById('l-category').value,
    progress:Math.max(0,Number(document.getElementById('l-progress').value)||0),
    total:document.getElementById('l-total').value?Math.max(0,Number(document.getElementById('l-total').value)):null,
    status,
    priority:document.getElementById('l-priority').value,
    estimatedMinutes:document.getElementById('l-est').value?Number(document.getElementById('l-est').value):null,
    tags:tagsRaw.split(',').map(t=>t.trim()).filter(Boolean),
    rating:Math.max(0,Math.min(10,Number(document.getElementById('l-rating')?.value)||0))||null,
    coverUrl:cover||'',
    coverSource:cover?(coverInput?.dataset?.auto==='1'?'auto':'manual'):'',
    manualRepeatAmount:(()=>{
      const total=document.getElementById('l-total').value?Math.max(0,Number(document.getElementById('l-total').value)||0):0;
      const full=Math.max(0,Math.floor(Number(document.getElementById('l-repeat-full')?.value)||0));
      let extra=Math.max(0,Math.floor(Number(document.getElementById('l-repeat-extra')?.value)||0));
      if(total>0)extra=Math.min(extra,Math.max(0,total-1));
      return total>0?full*total+extra:extra;
    })(),
    startedAt:startedAt||null,
    startedAtSource:startedAt?startedAtSource:null,
    createdAt:id?(old?.createdAt||Date.now()):Date.now(),
    completedAt:status==='completed'?(completedAt||Date.now()):null,
    modifiedAt:Date.now()
  });

  // Keep the completion timeline synchronized with an edited Finish Date.
  S.completionTimeline=Array.isArray(S.completionTimeline)?S.completionTimeline:[];
  S.completionTimeline=S.completionTimeline.filter(x=>String(x?.libraryId||'')!==String(data.id));
  if(data.status==='completed'){
    S.completionTimeline.push({
      libraryId:data.id,
      title:data.title,
      categoryId:data.categoryId,
      completedAt:data.completedAt
    });
  }

  const idx=S.library.findIndex(i=>i.id===id);
  let earned=0;
  if(idx>=0){
    S.library[idx]=data;
    earned+=v44AwardEditXP(data.id);
    if(data.coverSource==='manual'&&data.coverUrl&&data.coverUrl!==old?.coverUrl){
      earned+=v44AwardManualCoverXP(data.id);
    }
  }else{
    S.library.push(data);
    earned+=awardLibraryAdditionXP(data.id);
    if(data.coverSource==='manual'&&data.coverUrl){
      earned+=v44AwardManualCoverXP(data.id);
    }
  }

  normalizeSeasonalLibraryItems();
  S.modal=null;
  mfCommit(id?'Edit title':'Add title',data.title);
  persistLibrary();
  render();
  if(earned)showToast(`Saved · +${earned} XP`);
};

/* Completion timeline pagination. */
renderCompletionTimeline=function(){const map=new Map();for(const x of(S.completionTimeline||[])){if(x?.completedAt)map.set(x.libraryId||(`${x.title}::${x.completedAt}`),x);}for(const i of S.library){if(i?.status==='completed'&&i.completedAt&&!map.has(i.id))map.set(i.id,{libraryId:i.id,title:i.title,categoryId:i.categoryId,completedAt:i.completedAt});}const arr=[...map.values()].sort((a,b)=>Number(b.completedAt)-Number(a.completedAt));if(!arr.length)return '<div class="empty-state">No completed titles yet.</div>';const size=25,max=Math.max(0,Math.ceil(arr.length/size)-1);S.timelinePage=clamp(Number(S.timelinePage)||0,0,max);const page=arr.slice(S.timelinePage*size,S.timelinePage*size+size);const rows=`<div class="completion-timeline">${page.map(x=>{const c=getCategory(x.categoryId);return `<div class="timeline-item"><div class="timeline-dot" style="background:${c?.color||'var(--flow)'}"></div><div class="timeline-date">${new Date(Number(x.completedAt)).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})}</div><div class="timeline-title">${escapeHtml(cleanTitle(x.title))}</div><div class="timeline-cat">${c?.icon||'•'} ${escapeHtml(c?.name||'Unknown')}</div></div>`}).join('')}</div>`;if(max===0)return rows;return rows+`<div class="v44-timeline-pager"><button class="btn btn-sm" ${S.timelinePage<=0?'disabled':''} onclick="App.setTimelinePage(${S.timelinePage-1})">← Prev</button><span class="hint">Page ${S.timelinePage+1} of ${max+1} · ${arr.length} completed titles</span><button class="btn btn-sm" ${S.timelinePage>=max?'disabled':''} onclick="App.setTimelinePage(${S.timelinePage+1})">Next →</button></div>`;};

/* Settings: editing XP + manual cover XP. */
const v44SettingsBase=renderSettings;
renderSettings=function(){let h=v44SettingsBase();const fields=`<div class="field-row"><div class="field"><label class="field-label">Edit Library title XP</label><input type="number" min="0" value="${S.settings.leveling?.libraryEditXP??5}" onchange="App.updateLeveling('libraryEditXP',this.value)"><small class="hint">Awarded each time an existing Library title is saved after editing.</small></div><div class="field"><label class="field-label">Manual cover art XP</label><input type="number" min="0" value="${S.settings.leveling?.manualCoverXP??15}" onchange="App.updateLeveling('manualCoverXP',this.value)"><small class="hint">One-time bonus per title when you manually add its cover URL.</small></div></div>`;return h.replace('<div class="field"><label class="field-label">Completion bonus XP</label>',fields+'<div class="field"><label class="field-label">Completion bonus XP</label>');};

/* Rating statistics. */
const v44StatsBase=renderStats;
renderStats=function(){let h=v44StatsBase();const rated=S.library.filter(i=>Number(i.rating)>0),avg=rated.length?rated.reduce((a,i)=>a+Number(i.rating),0)/rated.length:0,high=rated.filter(i=>Number(i.rating)>=8).length,perfect=rated.filter(i=>Number(i.rating)>=9.5).length;const dist=[];for(let n=10;n>=1;n--)dist.push({n,count:rated.filter(i=>Math.ceil(Number(i.rating))===n).length});const max=Math.max(1,...dist.map(x=>x.count));const card=`<div class="card" style="margin-bottom:24px"><div class="section-label">RATINGS</div><div class="v44-rating-grid"><div><b>${rated.length}</b><small class="hint">Rated titles</small></div><div><b>${rated.length?avg.toFixed(2):'—'}</b><small class="hint">Average rating / 10</small></div><div><b>${high}</b><small class="hint">Rated 8+</small></div><div><b>${perfect}</b><small class="hint">Rated 9.5+</small></div></div><div style="margin-top:16px">${dist.map(x=>`<div class="bal-bar-row"><div class="bal-bar-label">${x.n}/10</div><div class="bal-bar-track"><div class="bal-bar-fill" style="width:${Math.round(x.count/max*100)}%;background:var(--flow)"></div></div><div class="bal-bar-val">${x.count}</div></div>`).join('')}</div></div>`;const marker='<div class="card" style="margin-bottom:24px;"><div class="section-label">TITLE COMPLETION TIMELINE</div>';const p=h.indexOf(marker);return p>=0?h.slice(0,p)+card+h.slice(p):h+card;};

/* v71: covers and ratings are rendered natively inside each Library row above.
   The old global HTML replacement injector was removed because it could match another
   row with identical category markup and visually assign the wrong title's cover. */

Object.assign(App,{stopwatchAddTime,stopwatchMinusTime,previewLibraryCover:v44PreviewCover,findLibraryCover:v44FindCover,clearLibraryCover(){const i=document.getElementById('l-cover');if(i){i.value='';delete i.dataset.auto;}v44PreviewCover('');},setTimelinePage(p){S.timelinePage=Math.max(0,Number(p)||0);render();}});


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

/* ============================================================
   v50 — Cover-forward UI + Simkl export
   ============================================================ */
function v50FindLibraryItem(libraryId,title){
  if(libraryId){const byId=(S.library||[]).find(i=>i.id===libraryId);if(byId)return byId;}
  const q=cleanTitle(title||'').toLowerCase();
  return q?(S.library||[]).find(i=>cleanTitle(i.title).toLowerCase()===q):null;
}
function v50Cover(item,cls=''){return item?.coverUrl?`<img class="v50-cover ${cls}" src="${escapeHtml(item.coverUrl)}" alt="${escapeHtml(cleanTitle(item.title||''))} cover" loading="lazy" onerror="this.style.display='none'">`:'';}

// v87: logging renderer is defined in the core logging section above so later UI enhancements cannot shadow its filters/pagination.

// Cover-aware exact-title recommendation on the dashboard.
const v50DashboardBase=renderDashboard;
renderDashboard=function(){
  let h=v50DashboardBase(); const t=S.currentTask;
  if(!t?.title || !S.settings.exactTitleRecommendations)return h;
  const item=v50FindLibraryItem(t.libraryId,t.title); if(!item?.coverUrl)return h;
  const plain=`<div class="hero-note">MediaFlow recommends: <b>${escapeHtml(t.title)}</b></div>`;
  const rich=`<div class="hero-note v50-title-feature">${v50Cover(item)}<div><small>MediaFlow recommends</small><br><b>${escapeHtml(t.title)}</b></div></div>`;
  return h.replace(plain,rich);
};

renderOnThisDay=function(){
  const now=new Date(),groups=new Map();

  const sessionDate=s=>{
    const ts=Number(s?.timestamp)||0;
    if(ts>0){
      const d=new Date(ts);
      if(!Number.isNaN(d.getTime()))return d;
    }
    const raw=String(s?.date||'').trim();
    if(raw){
      const d=new Date(raw+'T12:00:00');
      if(!Number.isNaN(d.getTime()))return d;
    }
    return null;
  };

  const coverMarkup=(item,summary=false,categoryId=null,title='')=>{
    const cls=summary?'v126-otd-summary':'v126-otd-row';
    const cat=getCategory(item?.categoryId||categoryId);
    const icon=v144CategoryIconHtml(cat);
    const name=cleanTitle(item?.title||title||'');
    if(item?.coverUrl){
      return `<img class="${cls}-cover" src="${escapeHtml(item.coverUrl)}" alt="${escapeHtml(name)} cover" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="${cls}-placeholder" style="display:none">${icon}</div>`;
    }
    return `<div class="${cls}-placeholder">${icon}</div>`;
  };

  for(const s of (S.sessions||[])){
    if(!s || s.status==='skipped')continue;
    const d=sessionDate(s);
    if(!d)continue;

    const years=now.getFullYear()-d.getFullYear();
    if(years<1 || d.getMonth()!==now.getMonth() || d.getDate()!==now.getDate())continue;

    const titles=Array.isArray(s.titles)&&s.titles.length
      ? s.titles.filter(t=>t?.title)
      : (s.title?[{title:s.title,libraryId:s.libraryId||null,qty:s.actualAmount||0,categoryId:s.categoryId||null}]:[]);

    if(!titles.length)continue;
    if(!groups.has(years))groups.set(years,[]);

    const totalQty=titles.reduce((n,t)=>n+Math.max(0,Number(t?.qty ?? t?.amount ?? 0)||0),0);
    const sessionMinutes=Math.max(0,Number(s.minutes)||0);

    for(const t of titles){
      const qty=Math.max(0,Number(t?.qty ?? t?.amount ?? 0)||0);
      let minutes=Math.max(0,Number(t?.minutes)||0);

      if(!minutes && sessionMinutes>0){
        if(titles.length===1)minutes=sessionMinutes;
        else if(totalQty>0)minutes=sessionMinutes*(qty/totalQty);
        else minutes=sessionMinutes/titles.length;
      }

      groups.get(years).push({
        title:cleanTitle(t.title),
        libraryId:t.libraryId||null,
        categoryId:t.categoryId||s.categoryId||null,
        qty,
        minutes,
        timestamp:d.getTime(),
        date:d
      });
    }
  }

  if(!groups.size)return '';

  const grouped=[];
  for(const [years,raw] of [...groups.entries()].sort((a,b)=>a[0]-b[0])){
    raw.sort((a,b)=>a.timestamp-b.timestamp);
    const merged=[],byKey=new Map();

    for(const x of raw){
      const key=x.libraryId
        ? `id:${String(x.libraryId)}`
        : `title:${cleanTitle(x.title).toLowerCase()}::${String(x.categoryId||'')}`;

      let m=byKey.get(key);
      if(!m){
        m={...x,qty:0,minutes:0,firstTimestamp:x.timestamp};
        byKey.set(key,m);
        merged.push(m);
      }
      m.qty+=Math.max(0,Number(x.qty)||0);
      m.minutes+=Math.max(0,Number(x.minutes)||0);
      m.firstTimestamp=Math.min(m.firstTimestamp,x.timestamp);
    }

    if(merged.length)grouped.push({years,rows:merged});
  }

  if(!grouped.length)return '';

  const amountText=x=>{
    const item=v50FindLibraryItem(x.libraryId,x.title);
    const cat=getCategory(item?.categoryId||x.categoryId);
    const bits=[];
    const qty=Math.max(0,Number(x.qty)||0);
    const minutes=Math.max(0,Math.round(Number(x.minutes)||0));

    if(qty>0)bits.push(`${qty} ${unitLabel(cat?.unit||'units',qty)}`);
    if(minutes>0)bits.push(fmtMinutes(minutes));
    return bits.join(' · ');
  };

  const nearest=grouped[0];
  const first=nearest.rows[0];
  const firstItem=v50FindLibraryItem(first.libraryId,first.title);
  const firstCat=getCategory(firstItem?.categoryId||first.categoryId);
  const sameYearExtra=Math.max(0,nearest.rows.length-1);
  const otherYears=Math.max(0,grouped.length-1);

  let more='';
  if(sameYearExtra)more+=`+${sameYearExtra} more logged that day`;
  if(otherYears)more+=(more?' · ':'')+`${otherYears} other matching year${otherYears===1?'':'s'}`;
  if(!more)more='Tap to view details';
  else more+=' · tap to view all';

  const body=grouped.map(group=>{
    const firstDate=group.rows[0]?.date;
    const dateLabel=firstDate instanceof Date&&!Number.isNaN(firstDate.getTime())
      ? firstDate.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})
      : '';

    const rows=group.rows.map(x=>{
      const item=v50FindLibraryItem(x.libraryId,x.title);
      const cat=getCategory(item?.categoryId||x.categoryId);
      const amount=amountText(x);
      const when=new Date(Number(x.firstTimestamp)||0);
      const time=Number.isNaN(when.getTime())?'':when.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'});

      return `<div class="v126-otd-row">
        ${coverMarkup(item,false,x.categoryId,x.title)}
        <div class="v126-otd-row-copy">
          <b>${escapeHtml(cleanTitle(x.title))}</b>
          <small>${escapeHtml(cat?.name||'Library')}${amount?` · ${escapeHtml(amount)}`:''}</small>
        </div>
        ${time?`<div class="v126-otd-row-time">${escapeHtml(time)}</div>`:''}
      </div>`;
    }).join('');

    return `<div class="v126-otd-year">
      <div class="v126-otd-year-head">
        <strong>${group.years} year${group.years===1?'':'s'} ago${dateLabel?` · ${escapeHtml(dateLabel)}`:''}</strong>
        <span>${group.rows.length.toLocaleString()} title${group.rows.length===1?'':'s'}</span>
      </div>
      ${rows}
    </div>`;
  }).join('');

  return `<details class="on-this-day v126-otd" data-mf-on-this-day-version="128">
    <summary class="v126-otd-summary">
      ${coverMarkup(firstItem,true,first.categoryId,first.title)}
      <div class="v126-otd-copy">
        <span>On this day · ${nearest.years} year${nearest.years===1?'':'s'} ago you logged</span>
        <b>${escapeHtml(cleanTitle(first.title))}</b>
        <small>${escapeHtml(firstCat?.name||'Library')}</small>
        <span class="v126-otd-more">${escapeHtml(more)}</span>
      </div>
      <span class="v126-otd-chevron">⌄</span>
    </summary>
    <div class="v126-otd-body">${body}</div>
  </details>`;
};

renderCompletionTimeline=function(){
  const map=new Map();
  for(const x of(S.completionTimeline||[])){if(x?.completedAt)map.set(x.libraryId||(`${x.title}::${x.completedAt}`),x);}
  for(const i of S.library){if(i?.status==='completed'&&i.completedAt&&!map.has(i.id))map.set(i.id,{libraryId:i.id,title:i.title,categoryId:i.categoryId,completedAt:i.completedAt});}
  const arr=[...map.values()].sort((a,b)=>Number(b.completedAt)-Number(a.completedAt)); if(!arr.length)return '<div class="empty-state">No completed titles yet.</div>';
  const size=25,max=Math.max(0,Math.ceil(arr.length/size)-1);S.timelinePage=clamp(Number(S.timelinePage)||0,0,max);const page=arr.slice(S.timelinePage*size,S.timelinePage*size+size);
  const rows=`<div class="completion-timeline">${page.map(x=>{const c=getCategory(x.categoryId),item=v50FindLibraryItem(x.libraryId,x.title);return `<div class="timeline-item"><div class="timeline-dot" style="background:${c?.color||'var(--flow)'}"></div><div class="v50-timeline-row">${v50Cover(item)}<div class="v50-timeline-copy"><div class="timeline-date">${new Date(Number(x.completedAt)).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})}</div><div class="timeline-title">${escapeHtml(cleanTitle(x.title))}</div><div class="timeline-cat">${c?.icon||'•'} ${escapeHtml(c?.name||'Unknown')}</div></div></div></div>`}).join('')}</div>`;
  if(max===0)return rows;return rows+`<div class="v44-timeline-pager"><button class="btn btn-sm" ${S.timelinePage<=0?'disabled':''} onclick="App.setTimelinePage(${S.timelinePage-1})">← Prev</button><span class="hint">Page ${S.timelinePage+1} of ${max+1} · ${arr.length} completed titles</span><button class="btn btn-sm" ${S.timelinePage>=max?'disabled':''} onclick="App.setTimelinePage(${S.timelinePage+1})">Next →</button></div>`;
};

function v50SimklStatus(status){return ({active:'watching',planned:'plantowatch',completed:'completed',paused:'hold',dropped:'dropped'})[status]||'plantowatch';}
function v50SimklExport(){
  const out={source:'MediaFlow',exported_at:new Date().toISOString(),anime:[],shows:[],movies:[]};
  for(const i of(S.library||[])){
    const c=getCategory(i.categoryId),ids=i.externalIds||{},media={title:cleanTitle(i.title),year:i.year||null,ids:{simkl:ids.simkl??null,mal:ids.mal??null,anilist:ids.anilist??null,tmdb:ids.tmdb??null,imdb:ids.imdb??null}};
    const rec={status:v50SimklStatus(i.status),watched_episodes_count:Number(i.progress)||0,total_episodes_count:i.total==null?null:Number(i.total)||0,user_rating:Number(i.rating)||0,added_to_watchlist_at:i.createdAt?new Date(Number(i.createdAt)).toISOString():null,last_watched_at:i.completedAt?new Date(Number(i.completedAt)).toISOString():null};
    if(i.categoryId==='movies'){out.movies.push(Object.assign({movie:media},rec));}
    else if(i.categoryId==='tv'||i.categoryId==='otheranimation'){out.shows.push(Object.assign({show:media},rec));}
    else if(['seasonal','backlog','animemovies'].includes(i.categoryId)){out.anime.push(Object.assign({show:media,anime_type:i.categoryId==='animemovies'?'movie':'tv'},rec));}
  }
  return out;
}
const v50ExportExchangeBase=mfExportExchange;
mfExportExchange=function(){
  const service=document.getElementById('exchange-service')?.value||'json';
  if(service!=='simkl')return v50ExportExchangeBase();
  const data=v50SimklExport(),count=data.anime.length+data.shows.length+data.movies.length;
  showDataProgress('Exporting for Simkl','Building Simkl-compatible JSON…',55);
  triggerDownload(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),`mediaflow-simkl-${todayISO()}.json`);
  setTimeout(()=>finishDataProgress(true,'Export complete',`${count.toLocaleString()} supported Library titles exported for Simkl.`),100);
};
App.exportExchange=mfExportExchange;

// v50 settings copy now advertises Simkl as an export target too.
const v50SettingsBase=renderSettings;
renderSettings=function(){let h=v50SettingsBase();return h.replace('AniList · AniSearch · AniWatch', 'AniList · AniSearch · AniWatch · Simkl');};

/* ============================================================

   RENDER LOOP + INIT

   ============================================================ */

function render(){

  if(!document.querySelector('.sidebar')) { renderShell(); bindSidebarResizer(); autoFitSidebarToProfile(); return; }

  bindSidebarResizer();

  // update sidebar active states + streak without full rebuild for smoothness

  document.querySelectorAll('.nav-item').forEach((el,i)=>el.classList.toggle('active', NAV_ITEMS[i].id===S.view));

  const mobileBar=document.querySelector('.mobile-tabbar'); if(mobileBar) mobileBar.innerHTML=renderMobileTabs();
  const accountName=document.querySelector('.account-menu-email');
  if(accountName)accountName.textContent=getDisplayName();
  const accountAvatarBtn=document.querySelector('.account-menu .account-avatar-btn');
  if(accountAvatarBtn)accountAvatarBtn.innerHTML=renderAccountAvatar();
  autoFitSidebarToProfile();

  renderView();

  renderModal();

}

async function startAuthenticatedApp(){AUTH_READY=true;await v115SafeBootstrap();}
async function init(){if(!supabase){renderAuthScreen('login');return;}try{const {data}=await supabase.auth.getSession();AUTH_USER=data?.session?.user||null;if(AUTH_USER)await startAuthenticatedApp();else renderAuthScreen('login');supabase.auth.onAuthStateChange(async(_event,session)=>{const next=session?.user||null;if(next&&!AUTH_READY){AUTH_USER=next;await startAuthenticatedApp();}else if(!next&&AUTH_READY){AUTH_USER=null;AUTH_READY=false;renderAuthScreen('login');}});}catch(err){renderAuthScreen('login',friendlyAuthError(err),true);}}
init();

// Only meaningful once this file is hosted at a real URL alongside sw.js/manifest.json

// (e.g. GitHub Pages) — installs MediaFlow as an app icon on Android/iOS home screens.

if('serviceWorker' in navigator){

  window.addEventListener('load', ()=>{

    navigator.serviceWorker.register('sw.js').catch(()=>{ /* not hosted with a SW — fine, app still works */ });

  });

}

window.addEventListener('beforeunload', function(e){

  if(saveQueue){ /* saves are queued+awaited on every action already; this is a last-resort nudge */ }

});


