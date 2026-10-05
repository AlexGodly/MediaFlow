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


