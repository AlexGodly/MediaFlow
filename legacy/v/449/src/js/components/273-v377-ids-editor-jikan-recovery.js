/* MediaFlow v377 — Editable external IDs, MAL-first Jikan recovery & diagnostic queue.
 * Keeps the v376 data contracts, covers, Collection Queue, and cloud account architecture.
 * Provider errors never turn missing episode data into a valid zero result.
 */
const V377_RELEASE=377;
const V377_ID_PROVIDERS=[
 ['mal','MyAnimeList','Numeric MAL ID'],['simkl','SIMKL','SIMKL ID'],
 ['anilist','AniList','Numeric AniList ID'],['tmdb','TMDB','Numeric TMDB ID'],
 ['imdb','IMDb','tt1234567'],['trakt','Trakt','Trakt ID / slug'],
 ['kitsu','Kitsu','Kitsu ID'],['isbn','ISBN','ISBN'],
 ['episodate','EpisoDate Show','TV show ID'],
 ['tvdb_series','TheTVDB Series','Series ID'],
 ['tvdb_season','TheTVDB Season','Season ID'],
 ['tvdb_episode','TheTVDB Episode','Episode ID'],
 ['tvdb_movie','TheTVDB Movie','Movie ID'],
 ['simkl_movie','SIMKL Movie','Movie record ID'],
 ['simkl_show','SIMKL Show','TV show ID'],
 ['mangadex','MangaDex','Manga UUID'],
 ['gcd_series','Grand Comics Database Series','Series ID'],
 ['gcd_issue','Grand Comics Database Issue','Issue ID'],
 ['royalroad','Royal Road Fiction','Fiction ID'],
 ['royalroad_rss','Royal Road RSS','https://.../fiction/syndication/...'],
 ['mangaupdates','MangaUpdates Series','Series ID'],
 ['livechart','LiveChart Anime','Anime ID'],
 ['wikidata','Wikidata','Q123456'],
 ['anidb','AniDB','Anime ID'],
 ['animeschedule','AnimeSchedule','Anime ID'],
 ['watchmode','Watchmode','Title ID'],
 ['marvel_comic','Marvel Comic','Comic ID'],
 ['marvel_series','Marvel Series','Series ID'],
 ['marvel_issue','Marvel Issue','Issue ID'],
 ['lccn','Library of Congress LCCN','LCCN'],
 ['oclc','OCLC Control Number','OCLC ID'],
 ['gnd','German National Library GND','GND ID'],
 ['dnb','German National Library Record','DNB record ID'],
 ['bnf','BnF Record','BnF record ID'],
 ['doi','Crossref DOI','10.XXXX/...'],
 ['comicvine_volume','Comic Vine Volume','Volume ID'],
 ['comicvine_issue','Comic Vine Issue','Issue ID'],
 ['comicvine_character','Comic Vine Character','Character ID'],
 ['metron_series','Metron Series','Series ID'],
 ['metron_issue','Metron Issue','Issue ID'],
 ['metron_publisher','Metron Publisher','Publisher ID'],
 ['hardcover_book','Hardcover Book','Book ID'],
 ['hardcover_edition','Hardcover Edition','Edition ID'],
 ['openlibrary_work','Open Library Work','OL123W'],
 ['openlibrary_edition','Open Library Edition','OL123M'],
 ['inventaire_work','Inventaire Work','Inventaire work ID'],
 ['inventaire_edition','Inventaire Edition','Inventaire edition ID'],
 ['gutendex','Gutendex Book','Gutenberg ID'],
 ['isbn10','ISBN-10','10-character ISBN'],
 ['isbn13','ISBN-13','13-digit ISBN'],
 ['ean','EAN','13-digit EAN'],
 ['youtube_video','YouTube Video','11-character video ID'],
 ['youtube_playlist','YouTube Playlist','Playlist ID'],
 ['tmdb_tv','TMDB TV','TV series ID'],
 ['loc','Library of Congress Record','Library of Congress ID'],
 ['crossref','Crossref Record','DOI'],
 ['fribb_mapping','Fribb Mapping Reference','Optional source record ID']
];
let V377_REOPEN_JIKAN_REPORT=false;
const v377IdValid=(key,value)=>{
  if(!value)return true;
  if(value.length>(['royalroad_rss'].includes(key)?512:120))return false;
  if(['royalroad_rss'].includes(key)){try{const url=new URL(value);return url.protocol==='https:'&&url.hostname.length>3;}catch(_){return false;}}
  if(key==='doi'||key==='crossref')return /^10\.\d{4,9}\/\S{1,100}$/i.test(value);
  if(key==='wikidata')return /^Q[1-9]\d*$/i.test(value);
  if(key==='mangadex')return /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value);
  if(key==='isbn10')return /^\d{9}[\dXx]$/.test(value.replace(/[-\s]/g,''));
  if(['isbn13','ean'].includes(key))return /^\d{13}$/.test(value.replace(/[-\s]/g,''));
  if(key==='mal'||key==='anilist'||key==='tmdb'||key==='kitsu'||key==='simkl')return /^[1-9]\d*$/.test(value);
  if(key==='imdb')return /^tt\d{7,12}$/i.test(value);
  if(key==='isbn')return /^(?:[\dXx-]{10,20})$/.test(value);
  return /^[\w.:-]+$/.test(value);
};
// An intentional manual MAL change/clear takes priority over historical
// aliases (`malId`, `mal_id`) that some older imports may have left behind.
const v377OriginalGetMalId=v166GetMalId;
v166GetMalId=function(item){
  const overrides=item?.v377ManualExternalIds;
  if(overrides&&Object.prototype.hasOwnProperty.call(overrides,'mal')){
    const id=String(overrides.mal??'').trim();
    return /^\d+$/.test(id)?id:'';
  }
  return v377OriginalGetMalId(item);
};
function v377IdsEditorHtml(item){
  const ids=item?.externalIds&&typeof item.externalIds==='object'?item.externalIds:{};
  const known=new Set(V377_ID_PROVIDERS.map(row=>row[0]));
  const providers=[...V377_ID_PROVIDERS];
  Object.keys(ids).filter(key=>!known.has(key)&&/^[a-z][a-z0-9_]{0,32}$/i.test(key)).forEach(key=>providers.push([key,key.toUpperCase(),'External identifier']));
  return `<section class="mf377-external-ids" data-v377-ids-editor>
    <details><summary><span class="mf377-section-icon">⌗</span> External Media IDs <small>Optional · ${Object.values(ids).filter(v=>v!=null&&String(v).trim()).length} saved</small></summary>
    <p class="hint">Edit service IDs without changing progress, ratings, History, or Collections. Automatic MAL Detection uses only the MyAnimeList ID. Provider and work/edition identifiers are available for verified provider matching. New sources require explicit testing before use.</p>
    <label class="mf433-id-search">Find an ID field <input type="search" placeholder="Search providers or identifiers…" oninput="App.mf433FilterExternalIds(this.value)" autocomplete="off"></label>
    <div class="mf377-ids-grid">${providers.map(([key,label,placeholder])=>`<label class="field" data-v377-id-row="${escapeHtml(key)}"><span class="field-label">${escapeHtml(label)}</span><span class="mf377-id-control"><input type="text" data-v377-id="${escapeHtml(key)}" autocomplete="off" spellcheck="false" value="${escapeHtml(String(ids[key]??''))}" placeholder="${escapeHtml(placeholder)}"></span></label>`).join('')}</div>
    <div class="mf377-mal-preview" id="mf377-mal-preview" aria-live="polite"></div>
    </details>
  </section>`;
}
const v377LibraryEditorBase=libraryModalHtml;
libraryModalHtml=function(item){
  const html=v377LibraryEditorBase.apply(this,arguments);
  try{
    const host=document.createElement('div');host.innerHTML=String(html||'');
    const editor=host.querySelector('.v240-library-editor,.v238-library-editor');
    if(!editor)return html;
    const ids=document.createElement('div');ids.innerHTML=v377IdsEditorHtml(item||{});
    const section=ids.firstElementChild;
    editor.appendChild(section);
    return host.innerHTML;
  }catch(err){console.warn('MediaFlow v377 external ID editor',err);return html;}
};

const v377LibrarySaveBase=App.saveLibraryModal;
App.saveLibraryModal=function(id){
  const root=document.querySelector('[data-v377-ids-editor]');
  const previous=id?(S.library||[]).find(row=>String(row.id)===String(id)):null;
  const oldIds=Object.assign({},previous?.externalIds||{});
  const oldOverrides=Object.assign({},previous?.v377ManualExternalIds||{});
  const nextIds={...oldIds},manual={...oldOverrides};
  if(root){
    const inputs=[...root.querySelectorAll('[data-v377-id]')];
    for(const field of inputs){
      const key=field.dataset.v377Id,value=String(field.value||'').trim();
      if(!v377IdValid(key,value)){
        root.querySelector('details').open=true;
        field.focus();
        showToast(`Invalid ${key.toUpperCase()} ID. Please correct it before saving.`);
        return false;
      }
      if(String(oldIds[key]??'').trim()!==value){
        if(value)nextIds[key]=value;else delete nextIds[key];
        manual[key]=value||null; // Null is an intentional manual clear.
      }
    }
  }
  // The normal Add Title saver appends new titles to S.library.
  const result=v377LibrarySaveBase.apply(this,arguments);
  if(root&&S.modal?.type!=='library'){
    const saved=id?(S.library||[]).find(row=>String(row.id)===String(id)):(S.library||[])[(S.library||[]).length-1];
    if(saved){
      saved.externalIds=nextIds;
      if(Object.prototype.hasOwnProperty.call(manual,'mal')){delete saved.malId;delete saved.mal_id;}
      if(Object.keys(manual).length)saved.v377ManualExternalIds=manual;
      saved.modifiedAt=Math.max(Number(saved.modifiedAt)||0,Date.now());
      try{v53InvalidateLibraryCache();}catch(_){}
      persistLibrary();
    }
    if(V377_REOPEN_JIKAN_REPORT){
      V377_REOPEN_JIKAN_REPORT=false;
      setTimeout(()=>v377ShowUnmatchedReport(),100);
    }
  }
  return result;
};
// Avoid resetting intentional user overrides when re-importing known metadata.
const v377ApplyImportedBase=v158ApplyNormalizedRecord;
v158ApplyNormalizedRecord=function(record,service,index,touched){
  const target=v158FindImportItem(record,index);
  const overrides=target?.v377ManualExternalIds;
  const result=v377ApplyImportedBase.apply(this,arguments);
  if(target&&overrides&&typeof overrides==='object'){
    target.externalIds=target.externalIds||{};
    for(const [key,value] of Object.entries(overrides)){
      if(value===null||value==='')delete target.externalIds[key];
      else target.externalIds[key]=value;
    }
  }
  return result;
};

async function v377VerifyMalId(){
  const field=document.querySelector('[data-v377-id="mal"]');
  const preview=document.getElementById('mf377-mal-preview');
  if(!field||!preview)return;
  const id=String(field.value||'').trim();
  if(!v377IdValid('mal',id)||!id){preview.textContent='Enter a valid numeric MAL ID first.';return;}
  preview.textContent='Checking MyAnimeList via Tenrai…';
  try{
    const result=await v166FetchJikan(`/anime/${encodeURIComponent(id)}/full`,{force:false,ttl:60*60*1000});
    const title=result?.data?.title||result?.data?.title_english;
    if(!title)throw new Error('No matching anime title returned');
    preview.textContent=`Verified anime: ${title} · MAL #${id}`;
  }catch(err){
    try{
      const manga=await v166FetchJikan(`/manga/${encodeURIComponent(id)}/full`,{force:false,ttl:60*60*1000});
      if(manga?.data?.title){preview.textContent=`Verified manga: ${manga.data.title} · MAL #${id}`;return;}
    }catch(_){}
    preview.textContent=`MAL verification failed: ${String(err?.message||err)}. The ID was not changed.`;
  }
}
App.v377VerifyMalId=v377VerifyMalId;
// Provide a direct entry from Anime Details into the existing Edit Title popup.
const v377DetailsHtmlBase=v181TitleDetailsHtml;
v181TitleDetailsHtml=function(item){
  const html=v377DetailsHtmlBase.apply(this,arguments);
  if(!item?.id)return html;
  try{
    const host=document.createElement('div');host.innerHTML=html;
    const readonly=[...host.querySelectorAll('.v181-detail-readonly')]
      .find(el=>String(el.querySelector('small')?.textContent||'').trim()==='External IDs');
    if(readonly){
      const button=document.createElement('button');button.type='button';
      button.className='btn btn-sm mf377-details-edit-ids';
      button.textContent='Edit external IDs';
      button.setAttribute('onclick',`App.v377EditExternalIds('${escapeHtml(String(item.id))}')`);
      readonly.after(button);
    }
    return host.innerHTML;
  }catch(_){return html;}
};
App.v377EditExternalIds=function(id){
  v181CloseTitleDetails();App.openLibraryModal(id);
  const disclosure=document.querySelector('[data-v377-ids-editor] details');
  if(disclosure)disclosure.open=true;
};


// Jikan reliability: sequential request gate respecting a rolling minute and
// per-second budget, including EACH attempt. Cache only meaningful HTTP success.
const V377_REQUEST_TIMES=[];
let V377_REQUEST_GATE=Promise.resolve();
async function v377JikanGate(){
  const execute=async()=>{
    while(true){
      const now=Date.now();
      while(V377_REQUEST_TIMES.length&&now-V377_REQUEST_TIMES[0]>=60000)V377_REQUEST_TIMES.shift();
      const latest=V377_REQUEST_TIMES[V377_REQUEST_TIMES.length-1]||0;
      const gap=Math.max(0,700-(now-latest));
      const minute=V377_REQUEST_TIMES.length>=100?Math.max(0,60050-(now-V377_REQUEST_TIMES[0])):0;
      const pause=Math.max(gap,minute);
      if(pause>0){await v166Sleep(pause);continue;}
      V377_REQUEST_TIMES.push(Date.now());return;
    }
  };
  const entry=V377_REQUEST_GATE.then(execute,execute);
  V377_REQUEST_GATE=entry.catch(()=>{});
  return entry;
}
function v377RetryDelay(value){
  if(!value)return 0;
  const seconds=Number(value);
  if(Number.isFinite(seconds))return Math.max(0,seconds*1000);
  const date=Date.parse(value);
  return Number.isFinite(date)?Math.max(0,date-Date.now()):0;
}
v166FetchJikan=async function(path,{force=false,ttl=V166_CACHE_TTL}={}){
  const url=path.startsWith('http')?path:`${V166_JIKAN_BASE}${path}`;
  const cached=V166_JIKAN_CACHE.get(url);
  if(!force&&cached&&Date.now()-cached.at<ttl)return cached.data;
  let error;
  for(let attempt=0;attempt<3;attempt++){
    await v377JikanGate();
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),16000);
    try{
      const response=await fetch(url,{signal:controller.signal,cache:'no-store',headers:{Accept:'application/json'}});
      if(response.ok){
        const json=await response.json();
        if(json&&typeof json==='object')V166_JIKAN_CACHE.set(url,{at:Date.now(),data:json});
        return json;
      }
      error=new Error(`Tenrai HTTP ${response.status}`);
      error.status=response.status;
      if(![408,429,500,502,503,504].includes(response.status))break;
      if(attempt<2){
        const pause=Math.min(120000,Math.max(response.status===429?5500:1000, v377RetryDelay(response.headers.get('Retry-After')), (1200*2**attempt)+Math.floor(Math.random()*350)));
        await v166Sleep(pause);
      }
    }catch(err){
      error=err;
      if(attempt<2)await v166Sleep(1200*2**attempt);
    }finally{clearTimeout(timer);}
  }
  throw error||new Error('Tenrai did not respond');
};

// An explicit MAL ID is authoritative. If absent, use the v166 strict
// resolver, and differentiate an unresolved/ambiguous match from API failures.
async function v377Identify(item,force){
  const id=v166GetMalId(item);
  if(id)return {malId:id,stored:false};
  const title=cleanTitle(item?.title||'');
  if(!title)return {malId:'',reason:'Missing title'};
  const payload=await v166FetchJikan(`/anime?q=${encodeURIComponent(title)}&limit=10`,{force,ttl:24*60*60*1000});
  let rows=Array.isArray(payload?.data)?payload.data:[];
  rows=rows.filter(x=>{
    if(typeof v158ExactTitleCandidate==='function'&&typeof v158JikanTitles==='function')return v158ExactTitleCandidate(item,v158JikanTitles(x));
    const wanted=title.toLocaleLowerCase();
    return [x.title,x.title_english,x.title_japanese,...(x.title_synonyms||[])].some(s=>cleanTitle(s||'').toLocaleLowerCase()===wanted);
  });
  const nonMovie=rows.filter(x=>String(x?.type||'').toLowerCase()!=='movie');
  if(nonMovie.length)rows=nonMovie;
  const year=v166CandidateYear(item);
  if(year){
    const matching=rows.filter(x=>Number(x?.year||new Date(x?.aired?.from||'').getFullYear())===year);
    if(matching.length)rows=matching;
  }
  const unique=new Set(rows.map(x=>String(x?.mal_id||'')).filter(x=>/^\d+$/.test(x)));
  if(unique.size!==1)return {malId:'',reason:unique.size>1?'Ambiguous title match':'No confident MAL match'};
  const malId=[...unique][0];
  // Explicit user clear blocks silent restamping of that external ID.
  const manuallyCleared=item?.v377ManualExternalIds&&Object.prototype.hasOwnProperty.call(item.v377ManualExternalIds,'mal')&&item.v377ManualExternalIds.mal===null;
  return {malId,stored:manuallyCleared?false:v166StoreMalId(item,malId)};
}
function v377EnsureJikanState(){
  const s=S.settings||DEFAULT_SETTINGS;
  if(!s.v377JikanLedger||typeof s.v377JikanLedger!=='object'||Array.isArray(s.v377JikanLedger))s.v377JikanLedger={};
  if(!s.v377JikanResults||typeof s.v377JikanResults!=='object')s.v377JikanResults={unmatched:[],failures:[],unavailable:[],lastCheckedAt:0,completeBaseline:false};
  if(!Array.isArray(s.v377JikanResults.unmatched))s.v377JikanResults.unmatched=[];
  if(!Array.isArray(s.v377JikanResults.failures))s.v377JikanResults.failures=[];
  if(!Array.isArray(s.v377JikanResults.unavailable))s.v377JikanResults.unavailable=[];
  return s;
}
function v377UnmatchedReportCover(item){
  const cat=getCategory(item?.categoryId);
  const fallback=cat?v144CategoryIconHtml(cat):'◫';
  const cover=String(item?.coverUrl||'').trim();
  return `<span class="mf377-report-cover">${cover?`<img loading="lazy" src="${escapeHtml(cover)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">`:''}<span class="mf377-report-fallback" ${cover?'style="display:none"':''}>${fallback}</span></span>`;
}
const V377_SELECTED_UNMATCHED=new Set();
function v377ReportRow(entry,type){
  const item=(S.library||[]).find(i=>String(i?.id)===String(entry.id));
  if(!item)return '';
  const id=String(item.id),name=cleanTitle(item.title||'Untitled');
  return `<div class="mf377-report-row" data-v377-report-item="${escapeHtml(id)}">
    ${type==='unmatched'?`<label class="mf377-report-check"><input type="checkbox" ${V377_SELECTED_UNMATCHED.has(id)?'checked':''} onchange="App.v377SelectUnmatched('${escapeHtml(id)}',this.checked)" aria-label="Select ${escapeHtml(name)}"></label>`:''}
    ${v377UnmatchedReportCover(item)}
    <div class="mf377-report-copy"><b>${escapeHtml(name)}</b><small>${escapeHtml(entry.reason||'Not matched')}</small><small>MAL ID: ${escapeHtml(v166GetMalId(item)||'Missing')}</small></div>
    <div class="mf377-report-actions"><button type="button" class="btn btn-sm" onclick="App.v377EditUnmatched('${escapeHtml(id)}')">Edit</button><button type="button" class="btn btn-sm btn-ghost" onclick="App.v377RetryOne('${escapeHtml(id)}')">Retry</button></div>
  </div>`;
}
function v377ShowUnmatchedReport(){
  document.getElementById('mf377-report-overlay')?.remove();
  const report=v377EnsureJikanState().v377JikanResults;
  const unmatched=report.unmatched.filter(x=>S.library.some(i=>String(i?.id)===String(x.id)));
  const failures=report.failures.filter(x=>S.library.some(i=>String(i?.id)===String(x.id)));
  const unavailable=report.unavailable.filter(x=>S.library.some(i=>String(i?.id)===String(x.id)));
  const root=document.createElement('div');
  root.id='mf377-report-overlay';
  root.innerHTML=`<div class="mf377-report-backdrop" onclick="if(event.target===this)App.v377CloseReport()"><section class="mf377-report-dialog" role="dialog" aria-modal="true" aria-label="Unmatched MAL titles">
    <header><div><h2>Unmatched Titles</h2><p>${unmatched.length.toLocaleString()} unmatched · ${failures.length.toLocaleString()} request failures · ${unavailable.length.toLocaleString()} missing episode lists</p></div><button type="button" class="btn btn-sm" onclick="App.v377CloseReport()">Close</button></header>
    <div class="mf377-report-toolbar"><button type="button" class="btn btn-primary btn-sm" ${!unmatched.length?'disabled':''} onclick="App.v377RetryUnmatched('all')">Check All Unmatched (${unmatched.length})</button><button type="button" class="btn btn-sm" ${!unmatched.length?'disabled':''} onclick="App.v377RetryUnmatched('selected')">Check Selected</button>${failures.length?`<button type="button" class="btn btn-sm" onclick="App.v377RetryUnmatched('failed')">Retry API Failures (${failures.length})</button>`:''}${unavailable.length?`<button type="button" class="btn btn-sm" onclick="App.v377RetryUnmatched('unavailable')">Retry Missing Episode Data (${unavailable.length})</button>`:''}</div>
    <div class="mf377-report-progress" id="mf377-report-progress" aria-live="polite"></div>
    <div class="mf377-report-list">${unmatched.length?unmatched.map(entry=>v377ReportRow(entry,'unmatched')).join(''):'<div class="hint">No unmatched titles from the last check.</div>'}</div>
    ${failures.length?`<h3>Temporary API failures</h3><div class="mf377-report-list">${failures.map(entry=>v377ReportRow(entry,'failed')).join('')}</div>`:''}
    ${unavailable.length?`<h3>Episode lists unavailable from Tenrai</h3><p class="hint">These MAL entries were identified, but Tenrai has not supplied enough released-episode data to calculate them safely. They are not necessarily network errors.</p><div class="mf377-report-list">${unavailable.map(entry=>v377ReportRow(entry,'unavailable')).join('')}</div>`:''}
  </section></div>`;
  document.body.appendChild(root);
}
App.v377ShowUnmatchedReport=v377ShowUnmatchedReport;
App.v377CloseReport=()=>document.getElementById('mf377-report-overlay')?.remove();
App.v377SelectUnmatched=(id,checked)=>{if(checked)V377_SELECTED_UNMATCHED.add(id);else V377_SELECTED_UNMATCHED.delete(id);};
// Canceling a report-launched editor returns to the report instead of leaving
// a stale reopen flag that affects an unrelated future editor.
const v377CloseModalBase=App.closeModal;
App.closeModal=function(){
  const returnToReport=V377_REOPEN_JIKAN_REPORT;
  V377_REOPEN_JIKAN_REPORT=false;
  const result=v377CloseModalBase.apply(this,arguments);
  if(returnToReport)setTimeout(()=>v377ShowUnmatchedReport(),0);
  return result;
};
App.v377EditUnmatched=id=>{
  App.v377CloseReport();V377_REOPEN_JIKAN_REPORT=true;App.openLibraryModal(id);
  const details=document.querySelector('[data-v377-ids-editor] details');if(details)details.open=true;
};

function v377LedgerMatches(item,hit){
  if(!hit||!Number.isFinite(Number(hit.available)))return false;
  const override=item?.v377ManualExternalIds;
  const cleared=override&&Object.prototype.hasOwnProperty.call(override,'mal')&&override.mal===null;
  if(cleared)return !v166GetMalId(item)&&String(hit.sourceTitle||'')===String(cleanTitle(item.title||''));
  return !!v166GetMalId(item)&&String(hit.malId)===v166GetMalId(item);
}
function v377RecomputeFromLedger(candidates,ledger){
  let freshTitles=0,freshEpisodes=0,matched=0,complete=true;
  for(const item of candidates){
    const hit=ledger[String(item.id)],malId=v166GetMalId(item);
    if(!v377LedgerMatches(item,hit)){complete=false;continue;}
    matched++;
    const waiting=Math.max(0,Number(hit.available)-Math.max(0,Number(item.progress)||0));
    if(waiting>0){freshTitles++;freshEpisodes+=waiting;}
  }
  return {freshTitles,freshEpisodes,matched,complete};
}
// Unified full/retry runner: canonical data untouched, and no partial scan is
// promoted to an authoritative total unless all candidate outcomes are known.
async function v377RunJikan({ids=null,force=false,notify=false}={}){
  const settings=v166EnsureSeasonalSettings(v377EnsureJikanState());
  if(V166_SEASONAL_SYNC_RUNNING){if(notify)showToast('A Seasonal Tenrai check is already running.');return null;}
  const all=v166SeasonalCandidates();
  const filter=ids?new Set(ids.map(String)):null;
  const rows=filter?all.filter(i=>filter.has(String(i.id))):all;
  const full=!filter;
  const oldCount=settings.seasonalFreshCount;
  const report=settings.v377JikanResults;
  const ledger=settings.v377JikanLedger;
  // A retry updates prior unresolved records; a full refresh replaces its report.
  const unresolved=new Map((full?[]:report.unmatched||[]).map(x=>[String(x.id),x]));
  const failures=new Map((full?[]:report.failures||[]).map(x=>[String(x.id),x]));
  const unavailable=new Map((full?[]:report.unavailable||[]).map(x=>[String(x.id),x]));
  V166_SEASONAL_SYNC_RUNNING=true;
  V166_SEASONAL_RUNTIME={status:'running',checked:0,total:rows.length,matched:0,freshTitles:0,freshEpisodes:0,message:'',error:'',startedAt:Date.now(),finishedAt:0};
  let changed=false,successes=0;
  v166UpdateSeasonalStatusDOM();
  try{
    for(const item of rows){
      const key=String(item.id);unresolved.delete(key);failures.delete(key);unavailable.delete(key);
      try{
        const match=await v377Identify(item,force);
        if(match.stored)changed=true;
        if(!match.malId){
          delete ledger[key];unresolved.set(key,{id:key,reason:match.reason||'No confident MAL match'});
        }else{
          const available=await v166AvailableEpisodeCount(match.malId,force);
          if(!Number.isFinite(available)||available<0)throw v166MissingTenraiEpisodeData(match.malId,null);
          ledger[key]={malId:String(match.malId),sourceTitle:cleanTitle(item.title||''),available,at:Date.now()};
          successes++;V166_SEASONAL_RUNTIME.matched++;
          const waiting=Math.max(0,available-(Number(item.progress)||0));
          if(waiting){V166_SEASONAL_RUNTIME.freshTitles++;V166_SEASONAL_RUNTIME.freshEpisodes+=waiting;}
        }
      }catch(err){
        const message=String(err?.message||err);
        const invalid=Number(err?.status)===404&&!!v166GetMalId(item);
        if(invalid){delete ledger[key];unresolved.set(key,{id:key,reason:'Invalid or unavailable MAL ID (HTTP 404)'});}
        else if(err?.kind==='episode_data_unavailable')unavailable.set(key,{id:key,reason:message});
        else failures.set(key,{id:key,reason:message});
        console.warn('MediaFlow v377 Jikan check',item?.title,err);
      }
      V166_SEASONAL_RUNTIME.checked++;
      v166UpdateSeasonalStatusDOM();
      const status=document.getElementById('mf377-report-progress');
      if(status)status.textContent=`Checking ${V166_SEASONAL_RUNTIME.checked}/${rows.length} titles…`;
      if(V166_SEASONAL_RUNTIME.checked%5===0)await v166Sleep(0);
    }
    // Remove ledger rows for deleted or no-longer-Seasonal items.
    const active=new Set(all.map(i=>String(i.id)));
    for(const key of Object.keys(ledger))if(!active.has(key))delete ledger[key];
    report.unmatched=[...unresolved.values()];report.failures=[...failures.values()];report.unavailable=[...unavailable.values()];report.lastCheckedAt=Date.now();
    const aggregate=v377RecomputeFromLedger(all,ledger);
    // Unmatched entries are known absent, not API failures. We may safely count
    // them as zero provided every OTHER active title has a usable episode count.
    const resolvedOrUnmatched=aggregate.complete||all.every(i=>v377LedgerMatches(i,ledger[String(i.id)])||unresolved.has(String(i.id)));
    const safe=resolvedOrUnmatched&&report.failures.length===0&&report.unavailable.length===0;
    if(safe){
      settings.seasonalFreshCount=aggregate.freshTitles;
      settings.seasonalFreshLastEpisodeTotal=aggregate.freshEpisodes;
      settings.seasonalFreshLastMatched=aggregate.matched;
      settings.seasonalFreshLastSyncAt=Date.now();
      settings.seasonalFreshLastProvider=V166_SEASONAL_PROVIDER;
      report.completeBaseline=true;
    }
    V166_SEASONAL_RUNTIME.status=safe?'success':(successes||report.unmatched.length||report.unavailable.length?'partial':'error');
    V166_SEASONAL_RUNTIME.message=safe?'Check completed.':`Partial check: ${report.failures.length} request failures, ${report.unavailable.length} missing episode lists. Last verified fresh count kept (${oldCount}).`;
    V166_SEASONAL_RUNTIME.error=!safe?V166_SEASONAL_RUNTIME.message:'';
    V166_SEASONAL_RUNTIME.finishedAt=Date.now();
    if(changed)try{v53InvalidateLibraryCache();}catch(_){}
    await saveState();
    if(S.view==='settings')render();else v166UpdateSeasonalStatusDOM();
    if(document.getElementById('mf377-report-overlay'))v377ShowUnmatchedReport();
    if(notify)showToast(safe?`${settings.seasonalFreshCount} Seasonal titles with fresh episodes`:`Tenrai partial check: ${report.failures.length} request failures, ${report.unavailable.length} missing episode lists. Last good count kept.`);
    return {freshTitles:settings.seasonalFreshCount,matched:aggregate.matched,unmatched:report.unmatched.length,failed:report.failures.length,unavailable:report.unavailable.length,complete:safe};
  }catch(err){
    V166_SEASONAL_RUNTIME.status='error';V166_SEASONAL_RUNTIME.error=String(err?.message||err);
    V166_SEASONAL_RUNTIME.finishedAt=Date.now();
    settings.seasonalFreshCount=oldCount;
    if(notify)showToast('Tenrai refresh failed; last good count preserved.');
    return null;
  }finally{
    V166_SEASONAL_SYNC_RUNNING=false;
    v166UpdateSeasonalStatusDOM();
    v166ScheduleSeasonalRefresh(false);
  }
}
v166RefreshSeasonalFresh=function(options){return v377RunJikan(options||{});};
App.v166RefreshSeasonalFresh=function(force){return v377RunJikan({force:!!force,notify:true});};
App.v377RetryUnmatched=function(mode){
  const report=v377EnsureJikanState().v377JikanResults;
  const ids=mode==='failed'?report.failures.map(x=>x.id):mode==='unavailable'?report.unavailable.map(x=>x.id):mode==='selected'?[...V377_SELECTED_UNMATCHED]:report.unmatched.map(x=>x.id);
  if(!ids.length){showToast('No titles selected for retry.');return;}
  if(mode==='selected')for(const id of ids)V377_SELECTED_UNMATCHED.delete(String(id));
  return v377RunJikan({ids,force:true,notify:true});
};
App.v377RetryOne=function(id){return v377RunJikan({ids:[id],force:true,notify:true});};
const v377SettingsHtmlBase=v166SeasonalSettingsHtml;
v166SeasonalSettingsHtml=function(){
  const html=v377SettingsHtmlBase.apply(this,arguments);
  const r=v377EnsureJikanState().v377JikanResults;
  const controls=`<div class="mf377-jikan-report-actions"><button type="button" class="btn btn-sm" ${!r.lastCheckedAt?'disabled':''} onclick="App.v377ShowUnmatchedReport()">View Unmatched Titles (${r.unmatched.length})</button><button type="button" class="btn btn-sm btn-ghost" ${!r.failures.length?'disabled':''} onclick="App.v377RetryUnmatched('failed')">Retry API Failures (${r.failures.length})</button><button type="button" class="btn btn-sm btn-ghost" ${!r.unavailable.length?'disabled':''} onclick="App.v377RetryUnmatched('unavailable')">Retry Missing Episode Data (${r.unavailable.length})</button></div><div class="mf377-jikan-report-hint hint">Tenrai uses exact MAL IDs first. Unmatched names and API errors are tracked separately. Retried titles contribute to the fresh count after a reliable result.</div>`;
  return html.replace('<div id="v166-seasonal-status"',controls+'<div id="v166-seasonal-status"');
};
const v377StatusBase=v166SeasonalStatusText;
v166SeasonalStatusText=function(){
  const text=v377StatusBase.apply(this,arguments),r=V166_SEASONAL_RUNTIME;
  if(r.status==='partial')return `Partial Tenrai check: ${v377EnsureJikanState().v377JikanResults.failures.length} request failures, ${v377EnsureJikanState().v377JikanResults.unavailable.length} missing episode lists. Last trustworthy count kept (${S.settings.seasonalFreshCount}). Use the relevant retry button.`;
  return text;
};
// Current report remains available after popup close; use persisted Settings to
// restore it after reload/cloud restore, without changing the data schema.
v377EnsureJikanState();
MediaFlowRuntime.version=V377_RELEASE;
window.MediaFlowV377={version:377,features:['Editable external IDs','MAL-first Jikan retry and diagnostics','Unmatched title report','Three-digit positions','Seasons last in Core Details']};
