/* MediaFlow v201 source fragment
 * Ratings, covers, progression, sync reliability and cover-forward UI
 * Original HTML lines 12360-13077.
 * Build order matters; see scripts/build.mjs.
 */

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
