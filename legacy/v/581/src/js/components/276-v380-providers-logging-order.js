/* MediaFlow v380 — Five-source seasonal detection + logging/order reliability.
 * Patch appended after v379; underlying Library, XP and History data unchanged.
 */
const V380_RELEASE=380;
const V380_SOURCES=['automatic','automatic2','tenrai','anizip','tvmaze','kitsu','anilist'];
const V380_NAMES={automatic:'Automatic Multi-Provider',automatic2:"Alex Godly's Smart Fresh Episodes Engine",tenrai:'Tenrai',anizip:'AniZip',tvmaze:'TVmaze',kitsu:'Kitsu',anilist:'AniList'};
function v380Mode(){const s=S.settings||DEFAULT_SETTINGS;return V380_SOURCES.includes(s.v380EpisodeProvider)?s.v380EpisodeProvider:'automatic';}
function v380Svg(path){return `<span class="mf380-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg></span>`;}
const V380_ICONS={
  eye:v380Svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>'),
  eyeOff:v380Svg('<path d="m3 3 18 18M10.6 5.1c.5-.1 1-.1 1.4-.1 6.5 0 10 7 10 7a17 17 0 0 1-3.4 4.2M6.1 6.1C3.3 8 2 12 2 12s3.5 7 10 7c1.5 0 2.9-.4 4.1-1M10 10a3 3 0 0 0 4 4"/>'),
  check:v380Svg('<circle cx="12" cy="12" r="10"/><path d="m7 12 3 3 7-7"/>'),
  up:v380Svg('<path d="M12 19V5m-6 6 6-6 6 6"/>'),
  down:v380Svg('<path d="M12 5v14m-6-6 6 6 6-6"/>'),
  all:v380Svg('<path d="M9 6h12M9 12h12M9 18h12M2 6l2 2 3-3M2 12l2 2 3-3M2 18l2 2 3-3"/>'),
  selected:v380Svg('<path d="m3 12 5 5L21 4M3 20h18"/>'),
  retry:v380Svg('<path d="M20 11a8 8 0 1 0-2 6M20 4v7h-7"/>'),
  missing:v380Svg('<path d="M4 6h12M4 12h10M4 18h8m-1-6 4 4 4-4m-4 4V7"/>'),
  unmatched:v380Svg('<path d="M4 6h16M4 12h12M4 18h8"/><circle cx="20" cy="18" r="2"/>')
};

// One authoritative draft visibility switch. Render/refresh rebuilds always
// reapply the saved state; event handling is delegated and independent of DOM replacement.
function v380ApplyLoggingVisibility(root=document){
  const form=root?.matches?.('.log-form')?root:root?.querySelector?.('.log-form');
  if(!form||!S.logDraft)return;
  const hidden=!!S.logDraft.v379HideAddedTitles;
  form.querySelectorAll('.v370-panels,.v369-panels,.v239-logged-title-list,.mf379-added-panels').forEach(el=>{
    el.classList.add('mf380-added-panels');el.hidden=hidden;el.style.display=hidden?'none':'';
  });
  const actions=form.querySelector('.v370-logging-actions');
  if(!actions)return;
  actions.querySelectorAll('.v379-toggle-list,.mf380-toggle-list').forEach(x=>x.remove());
  const button=document.createElement('button');button.type='button';button.className='btn btn-sm mf380-toggle-list';
  button.dataset.v225Iconified='1';button.setAttribute('aria-pressed',String(hidden));
  button.setAttribute('aria-label',hidden?'Show Added Titles':'Hide Added Titles');
  button.innerHTML=(hidden?V380_ICONS.eye:V380_ICONS.eyeOff)+`<span>${hidden?'Show Added Titles':'Hide Added Titles'}</span>`;
  const clear=actions.querySelector('.v370-clear-btn');if(clear)actions.insertBefore(button,clear);else actions.appendChild(button);
}
const v380RenderLogBase=renderLogForm;
renderLogForm=function(){
  const html=v380RenderLogBase.apply(this,arguments);if(!S.logDraft)return html;
  const host=document.createElement('div');host.innerHTML=String(html||'');v380ApplyLoggingVisibility(host);return host.innerHTML;
};
const v380PanelsBase=v369RefreshPanels;
v369RefreshPanels=function(){const result=v380PanelsBase.apply(this,arguments);v380ApplyLoggingVisibility();v380RefreshSortIcon();return result;};
App.v379ToggleAddedTitles=function(){
  if(!S.logDraft)return;
  S.logDraft.v379HideAddedTitles=!S.logDraft.v379HideAddedTitles;
  v380ApplyLoggingVisibility();v369Touch();
};
document.addEventListener('click',e=>{
  const button=e.target?.closest?.('.mf380-toggle-list');if(!button)return;
  e.preventDefault();e.stopImmediatePropagation();App.v379ToggleAddedTitles();
},true);

// The v225 global icon renderer guesses generic action symbols. Explicitly
// iconify stateful/specific controls and opt them out of the guessing path.
function v380UpdateActionIcons(root=document){
  const rules=[
    ['button[onclick*="v377RetryUnmatched(\'all\')"]','all'],
    ['button[onclick*="v377RetryUnmatched(\'selected\')"]','selected'],
    ['button[onclick*="v377RetryUnmatched(\'unavailable\')"]','missing'],
    ['button[onclick*="v377RetryUnmatched(\'failed\')"]','retry'],
    ['button[onclick*="v377RetryOne("]','retry'],
    ['button[onclick*="v377ShowUnmatchedReport("]','unmatched']
  ];
  for(const [selector,kind] of rules){
    root.querySelectorAll?.(selector).forEach(button=>{
      if(button.dataset.mf380Icon===kind)return;
      // Avoid duplicating v379 icons or generic v225 icons.
      button.querySelectorAll(':scope > .v225-btn-icon,:scope > .mf380-icon').forEach(x=>x.remove());
      button.insertAdjacentHTML('afterbegin',V380_ICONS[kind]);
      button.dataset.mf380Icon=kind;button.dataset.v225Iconified='1';
    });
  }
  root.querySelectorAll?.('.mf379-picker .mf378-add-btn').forEach(button=>{
    if(!button.disabled&&!/^Added\b/i.test(button.textContent.trim()))return;
    if(button.dataset.mf380Icon==='added')return;
    button.innerHTML=V380_ICONS.check+'<span>Added</span>';
    button.dataset.mf380Icon='added';button.dataset.v225Iconified='1';
  });
}
const v380SuggestionsBase=v224LogSuggestionsHtml;
v224LogSuggestionsHtml=function(){const html=String(v380SuggestionsBase.apply(this,arguments)||'');
  const host=document.createElement('div');host.innerHTML=html;v380UpdateActionIcons(host);return host.innerHTML;};
const v380ActionsBase=v166SeasonalSettingsHtml;
v166SeasonalSettingsHtml=function(){const html=String(v380ActionsBase.apply(this,arguments)||'');
  const host=document.createElement('div');host.innerHTML=html;v380UpdateActionIcons(host);return host.innerHTML;};
const v380IconNameBase=v225ButtonIconName;
v225ButtonIconName=function(el){
  if(el?.matches?.('.mf373-dir,.mf380-toggle-list,.mf378-add-btn[data-mf380-icon="added"],button[data-mf380-icon]'))return null;
  return v380IconNameBase.apply(this,arguments);
};
const V380_ICON_OBSERVER=new MutationObserver(records=>{
  const roots=new Set();for(const record of records)for(const node of record.addedNodes){
    if(node.nodeType!==1)continue;
    if(node.matches?.('#mf377-report-overlay,.mf377-report-toolbar,.mf377-report-actions,.mf377-jikan-report-actions,.mf378-picker,.log-form')||
      node.querySelector?.('.mf377-report-toolbar,.mf377-report-actions,.mf377-jikan-report-actions,.mf378-picker'))roots.add(node);
  }
  for(const node of roots){v380UpdateActionIcons(node);if(node.matches?.('.log-form'))v380ApplyLoggingVisibility(node);}
});
V380_ICON_OBSERVER.observe(document.documentElement,{childList:true,subtree:true});

// Added titles: count only unsaved units. Per Unit stores v369Units; Quick
// amount stores qty or an explicit positive end-minus-start progression.
function v380DraftUnitCount(entry){
  if(Array.isArray(entry?.v369Units))return entry.v369Units.length;
  if(entry?.v179Mode==='last'||S.logDraft?.v179Mode==='last'){
    const start=Number(entry.v179StartProgress),end=Number(entry.v179EndProgress);
    if(Number.isFinite(start)&&Number.isFinite(end))return Math.max(0,Math.floor(end-start));
  }
  return Math.max(0,Math.floor(Number(entry?.qty)||0));
}
V373_SORTS.splice(3,0,['draftUnits','Units in Draft']);V373_ALLOWED.add('draftUnits');
const v380CompareEntryBase=v373CompareData;
v373CompareData=function(a,b,field,dir){if(field==='draftUnits')return (v380DraftUnitCount(a.entry)-v380DraftUnitCount(b.entry))*(dir==='desc'?-1:1);
  return v380CompareEntryBase.apply(this,arguments);};
function v380RefreshSortIcon(root=document){
  root.querySelectorAll?.('.mf373-dir').forEach(button=>{
    const st=v373OrderState(),descending=st.dir==='desc';
    button.dataset.v225Iconified='1';
    button.innerHTML=(descending?V380_ICONS.down:V380_ICONS.up)+`<span>${descending?'Desc':'Asc'}</span>`;
    button.setAttribute('aria-label',`Sort direction: ${descending?'descending':'ascending'}`);
    button.disabled=['custom','random'].includes(st.sort);
  });
}
const v380SortToolbarBase=v373ToolbarHtml;
v373ToolbarHtml=function(){const host=document.createElement('div');host.innerHTML=v380SortToolbarBase.apply(this,arguments);
  v380RefreshSortIcon(host);return host.innerHTML;};
const v380ApplyOrderBase=v373ApplyDOMOrder;
v373ApplyDOMOrder=function(){const result=v380ApplyOrderBase.apply(this,arguments);v380RefreshSortIcon(arguments[0]||document);return result;};
const v380TouchBase=v369Touch;
v369Touch=function(){const result=v380TouchBase.apply(this,arguments);if(S.logDraft?.v373Ordering?.sort==='draftUnits'){
    const active=document.activeElement;
    if(!active?.closest?.('.log-form input,.log-form textarea,.log-form select'))requestAnimationFrame(()=>v373LiveUpdate());
  }return result;};

// Preserve location when one Personal Order entry is moved, even if an older
// view falls back to rebuilding the order DOM. Do not force scroll changes when
// changing tabs, categories or manually navigating.
let V380_SCROLL_REORDER=0;
function v380ScrollSnapshot(){
  const entries=[{key:'window',top:window.scrollY,left:window.scrollX}];
  for(const element of document.querySelectorAll('#view-root,#app,.main-content,.content,.mf287-queue-list,.v138-order-list,[data-scroll-container]')){
    if(element.scrollHeight<=element.clientHeight+2)continue;
    const key=element.id?'#'+element.id:element.classList.length?'.'+[...element.classList].slice(0,2).join('.'):null;
    if(key)entries.push({key,top:element.scrollTop,left:element.scrollLeft});
  }
  return entries;
}
function v380RestoreScroll(snapshot){
  if(!snapshot)return;
  for(const item of snapshot){
    if(item.key==='window'){window.scrollTo(item.left,item.top);continue;}
    try{const el=document.querySelector(item.key);if(el){el.scrollTop=item.top;el.scrollLeft=item.left;}}catch(_){ }
  }
}
const v380RenderBase=render;
render=function(){const snap=V380_SCROLL_REORDER?v380ScrollSnapshot():null;
  const result=v380RenderBase.apply(this,arguments);
  if(snap){v380RestoreScroll(snap);requestAnimationFrame(()=>v380RestoreScroll(snap));}
  return result;};
function v380KeepOrderView(fn){return function(){const snapshot=v380ScrollSnapshot();V380_SCROLL_REORDER++;
  try{return fn.apply(this,arguments);}finally{V380_SCROLL_REORDER--;v380RestoreScroll(snapshot);requestAnimationFrame(()=>v380RestoreScroll(snapshot));}
};}
for(const key of ['v379MoveToken','v379PositionToken','v287MoveAssignment','v287SetAssignmentPosition','v138MoveTitleInCategory','v138MoveTitle','v157SetOrderTitlePosition']){
  if(typeof App[key]==='function')App[key]=v380KeepOrderView(App[key]);
}
// The drag/drop path calls the v379 internal mover without an App wrapper.
const v380MoveMixedBase=v379MoveQueueToken;
v379MoveQueueToken=v380KeepOrderView(v380MoveMixedBase);

// --------------------- Episode data providers -----------------------------
// This integration uses public read endpoints. Never save a "finished" total
// as an airing episode count; do not turn uncertain missing data into zero.
const V380_FETCH_CACHE=new Map(),V380_FETCH_PENDING=new Map();
const V380_SOURCE_BY_MAL=new Map();
const V380_RESPONSE_TTL=6*60*60*1000;
const V380_PROVIDER_LAST_REQUEST=new Map();
const V380_PROVIDER_INTERVAL={"graphql.anilist.co":2500,"api.tvmaze.com":750,"kitsu.io":850,"api.ani.zip":600};
const V381_PROVIDER_QUEUES=new Map();
const V381_PROVIDER_COOLDOWN=new Map();
const V381_PROVIDER_HEALTH=new Map();
const V380_PROVIDER_SEQUENCE=['tenrai','anizip','anilist','tvmaze','kitsu'];
function v380Unavailable(provider,message){const e=new Error(`${V380_NAMES[provider]}: ${message}`);e.kind='episode_data_unavailable';e.provider=provider;return e;}
function v380ValidPositive(value){const n=Number(value);return Number.isSafeInteger(n)&&n>0?n:null;}
function v380AiredTimestamp(value){
  if(value===null||value===undefined||value==='')return null;
  if(typeof value==='number')return Number.isFinite(value)?(value<100000000000?value*1000:value):null;
  const text=String(value).trim();if(/^\d{9,13}$/.test(text))return v380AiredTimestamp(Number(text));
  const ts=Date.parse(text);return Number.isFinite(ts)?ts:null;
}
function v380TodayAired(value){const t=v380AiredTimestamp(value);return t!==null&&t<=Date.now()+5*60*1000;}
function v381RecordHealth(hostname,ok,reason=''){
 const state=V381_PROVIDER_HEALTH.get(hostname)||{ok:0,failed:0,reason:'',last:0};
 state[ok?'ok':'failed']++;state.reason=reason;state.last=Date.now();V381_PROVIDER_HEALTH.set(hostname,state);
}
async function v380GateRequest(url){
 const hostname=new URL(url).hostname;
 const previous=V381_PROVIDER_QUEUES.get(hostname)||Promise.resolve();
 const current=previous.catch(()=>{}).then(async()=>{
  const interval=V380_PROVIDER_INTERVAL[hostname]||700;
  const cooldown=V381_PROVIDER_COOLDOWN.get(hostname)||0;
  const gap=(V380_PROVIDER_LAST_REQUEST.get(hostname)||0)+interval;
  const wait=Math.max(0,cooldown-Date.now(),gap-Date.now());
  if(wait)await v166Sleep(wait);
  V380_PROVIDER_LAST_REQUEST.set(hostname,Date.now());
 });
 V381_PROVIDER_QUEUES.set(hostname,current);
 try{await current;}finally{if(V381_PROVIDER_QUEUES.get(hostname)===current)V381_PROVIDER_QUEUES.delete(hostname);}
}
function v381RetryAfter(response){
 const raw=response.headers.get('Retry-After');let until=0;
 if(raw){const sec=Number(raw);until=Number.isFinite(sec)?Date.now()+Math.max(0,sec*1000):Date.parse(raw)||0;}
 const reset=Number(response.headers.get('X-RateLimit-Reset'));
 if(Number.isFinite(reset)&&reset>0)until=Math.max(until,reset*1000);
 return Math.max(0,until-Date.now());
}
async function v380Request(url,{method='GET',body=null,force=false,ttl=V380_RESPONSE_TTL}={}){
 const key=method+':'+url+(body?'#'+body:'');
 const record=V380_FETCH_CACHE.get(key);
 if(!force&&record&&Date.now()-record.at<ttl)return record.value;
 if(V380_FETCH_PENDING.has(key))return V380_FETCH_PENDING.get(key);
 const hostname=new URL(url).hostname;
 const cooldown=V381_PROVIDER_COOLDOWN.get(hostname)||0;
 if(cooldown>Date.now()){const e=new Error(`${hostname}: temporarily paused until ${new Date(cooldown).toLocaleTimeString()} after a provider failure/rate limit`);e.kind='provider_cooldown';e.providerHost=hostname;throw e;}
 const promise=(async()=>{
  let error;
  for(let attempt=0;attempt<3;attempt++){
   // Queue / rate-limit waiting must not consume the actual HTTP timeout.
   await v380GateRequest(url);
   const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),18000);
   try{
    const result=await fetch(url,{method,headers:{Accept:hostname==='kitsu.io'?'application/vnd.api+json':'application/json',...(body?{'Content-Type':'application/json'}:{})},body,signal:controller.signal});
    if(!result.ok){
      const e=new Error(`${hostname} HTTP ${result.status}`);e.status=result.status;e.providerHost=hostname;
      if(result.status===429){e.kind='rate_limited';const ms=Math.max(2500,v381RetryAfter(result)||60000);V381_PROVIDER_COOLDOWN.set(hostname,Date.now()+ms);e.retryAfterMs=ms;}
      if(result.status===429)throw e; // Respect provider cooldown on a later check; never hammer Retry-After.
      if(result.status>=500&&attempt<2){error=e;continue;}
      throw e;
    }
    const json=await result.json();if(!json||typeof json!=='object'){const e=new Error(`${hostname}: Invalid API response`);e.kind='invalid_response';throw e;}
    if(hostname==='graphql.anilist.co'&&Array.isArray(json.errors)&&json.errors.length){const e=new Error('AniList GraphQL: '+String(json.errors[0].message||'validation or API error'));e.kind='graphql_error';throw e;}
    V381_PROVIDER_COOLDOWN.delete(hostname);v381RecordHealth(hostname,true);
    V380_FETCH_CACHE.set(key,{at:Date.now(),value:json});return json;
   }catch(err){
    error=err;
    if(!err?.kind&&!err?.status){err.kind=err?.name==='AbortError'?'timeout':'network_or_cors';}
    if(err?.kind==='network_or_cors'){
      err.message=`${hostname}: connection or CORS blocked (${String(err.message||'network failure')})`;
      // A browser-level block cannot be fixed by repeating the same request.
      V381_PROVIDER_COOLDOWN.set(hostname,Date.now()+60000);
    }
    v381RecordHealth(hostname,false,String(err?.message||err));
    if(attempt<2&&(err?.kind==='timeout'||Number(err?.status)>=500)){
      await v166Sleep(600*(attempt+1));continue;
    }
    throw err;
   }finally{clearTimeout(timer);}
  }
  throw error||new Error(`${hostname}: Request unsuccessful`);
 })();
 V380_FETCH_PENDING.set(key,promise);
 try{return await promise;}finally{V380_FETCH_PENDING.delete(key);}
}
function v380AnimeForMal(malId){return (S.library||[]).find(item=>v166GetMalId(item)===String(malId))||null;}
async function v380AniZip(malId,force){
  const data=await v380Request(`https://api.ani.zip/mappings?mal_id=${encodeURIComponent(malId)}`,{force});
  const matched=Number(data?.mappings?.mal_id||data?.mal_id);
  if(matched&&matched!==Number(malId))throw v380Unavailable('anizip','returned a different MAL mapping');
  const episodes=data?.episodes;
  if(!episodes||typeof episodes!=='object')throw v380Unavailable('anizip','no episode catalogue');
  let count=0,dated=0,invalid=0;
  for(const [key,episode] of Object.entries(episodes)){
    if(!episode||typeof episode!=='object')continue;
    const number=v380ValidPositive(episode.episode||episode.episodeNumber||episode.number||key);
    // AniZip exposes airDateUtc on several catalogue representations.
    const aired=episode.airDateUtc??episode.airdate??episode.airDate??episode.aired??episode.air_date;
    if(aired===null||aired===undefined||aired==='')continue;
    const timestamp=v380AiredTimestamp(aired);
    if(timestamp===null){invalid++;continue;}
    dated++;
    if(number&&timestamp<=Date.now()+5*60*1000)count=Math.max(count,number);
  }
  if(dated&&count)return count;
  if(dated&&!count&&invalid===0)return 0; // Verified: all known dates are in the future.
  throw v380Unavailable('anizip',invalid?'episode release dates are malformed or incomplete':'episode entries have no verifiable release dates');
}
async function v380AniList(malId,force){
  // Media.airingSchedule supports notYetAired/perPage, but not sort.
  const query=`query ($id:Int){ Media(idMal:$id,type:ANIME){ id idMal status episodes nextAiringEpisode{episode airingAt} airingSchedule(notYetAired:false,perPage:25){nodes{episode airingAt}} } }`;
  const payload=await v380Request('https://graphql.anilist.co',{method:'POST',body:JSON.stringify({query,variables:{id:Number(malId)}}),force,ttl:3*60*60*1000});
  const media=payload.data?.Media;
  if(!media||Number(media.idMal)!==Number(malId))throw v380Unavailable('anilist','no confirmed MAL match');
  if(media.status==='NOT_YET_RELEASED')return 0;
  if(media.status==='FINISHED'){
    const total=v380ValidPositive(media.episodes);if(total)return total;
  }
  const next=media.nextAiringEpisode,upcoming=v380ValidPositive(next?.episode);
  if(upcoming&&v380AiredTimestamp(next.airingAt)>Date.now()+5*60*1000)return upcoming-1;
  const schedule=media.airingSchedule?.nodes||[];
  const aired=schedule.filter(x=>v380TodayAired(x?.airingAt)&&v380ValidPositive(x?.episode)).map(x=>Number(x.episode));
  if(aired.length)return Math.max(...aired);
  throw v380Unavailable('anilist','no confirmed released episode count; AniList schedules may be incomplete');
}
function v380CleanMatch(value){return String(value||'').normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();}
function v381SeasonFromTitle(item){
 const names=[item?.title,item?.englishTitle,item?.titleEnglish].filter(Boolean).map(String);
 for(const name of names){
  const match=name.match(/(?:\b(?:season|series|part|cour)\s*(\d{1,2})\b|\b(\d{1,2})(?:st|nd|rd|th)\s+season\b)/i);
  if(match){const n=Number(match[1]||match[2]);if(n>0&&n<=50)return n;}
 }
 return null;
}
async function v380TVmaze(malId,force){
 const item=v380AnimeForMal(malId);if(!item)throw v380Unavailable('tvmaze','Library title not found');
 const ids=item.externalIds||{},tvmaze=v380ValidPositive(ids.tvmaze||item.tvmazeId),imdb=String(ids.imdb||item.imdbId||'').trim(),tvdb=String(ids.tvdb||'').trim();
 let show=null,verifiedId=!!tvmaze||/^tt\d+$/.test(imdb)||/^\d+$/.test(tvdb);
 try{
  if(tvmaze)show=await v380Request(`https://api.tvmaze.com/shows/${tvmaze}`,{force});
  else if(/^tt\d+$/.test(imdb))show=await v380Request(`https://api.tvmaze.com/lookup/shows?imdb=${encodeURIComponent(imdb)}`,{force});
  else if(/^\d+$/.test(tvdb))show=await v380Request(`https://api.tvmaze.com/lookup/shows?thetvdb=${encodeURIComponent(tvdb)}`,{force});
  else{
   const name=cleanTitle(item.title||'');if(!name)throw v380Unavailable('tvmaze','cannot match title');
   const matches=await v380Request(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(name)}`,{force});
   if(!Array.isArray(matches))throw v380Unavailable('tvmaze','unexpected search response');
   const expected=v380CleanMatch(name);
   let exact=matches.filter(x=>[x?.show?.name,...(x?.show?.akas||[]).map(y=>y?.name)].some(t=>v380CleanMatch(t)===expected));
   if(exact.length!==1){
    // An explicit "Season N" can be stripped for a possible show-level match;
    // individual episodes are still restricted to that exact numbered season.
    const season=v381SeasonFromTitle(item);
    if(season){const series=v380CleanMatch(name.replace(/(?:\b(?:season|series|part|cour)\s*\d{1,2}\b|\b\d{1,2}(?:st|nd|rd|th)\s+season\b)/ig,''));
      exact=matches.filter(x=>v380CleanMatch(x?.show?.name)===series);
    }
   }
   if(exact.length!==1)throw v380Unavailable('tvmaze',exact.length?'ambiguous exact title matches':'no confident title match');
   show=exact[0].show;
  }
 }catch(e){if(Number(e?.status)===404)throw v380Unavailable('tvmaze','no show for the supplied identifier');throw e;}
 if(!v380ValidPositive(show?.id))throw v380Unavailable('tvmaze','no confirmed show ID');
 const episodes=await v380Request(`https://api.tvmaze.com/shows/${Number(show.id)}/episodes`,{force});
 if(!Array.isArray(episodes)||!episodes.length){
  if(show.premiered&&Date.parse(show.premiered)>Date.now())return 0;
  throw v380Unavailable('tvmaze','matched show has no episode list');
 }
 const allSeasons=new Set(episodes.map(x=>Number(x.season)).filter(x=>x>0));
 let selectedSeason=null;
 if(allSeasons.size===1)selectedSeason=[...allSeasons][0];
 else{
  const specified=v381SeasonFromTitle(item);
  if(specified&&allSeasons.has(specified))selectedSeason=specified;
  else throw v380Unavailable('tvmaze','multi-season show needs verified season identification');
 }
 const rows=episodes.filter(e=>Number(e.season)===selectedSeason&&v380ValidPositive(e.number));
 const aired=rows.filter(e=>v380TodayAired(e.airstamp||e.airdate));
 if(aired.length)return Math.max(...aired.map(e=>Number(e.number)));
 if(rows.length&&rows.every(e=>v380AiredTimestamp(e.airstamp||e.airdate)>Date.now()))return 0;
 throw v380Unavailable('tvmaze','matched season has no confirmed aired episode dates');
}
async function v380Kitsu(malId,force){
 const item=v380AnimeForMal(malId);
 // A user-verified Kitsu ID is more direct than a second MAL mapping request.
 const explicit=v380ValidPositive(item?.externalIds?.kitsu||item?.kitsuId);
 let id=explicit?String(explicit):'';
 if(!id){
  const maps=await v380Request(`https://kitsu.io/api/edge/mappings?filter%5BexternalSite%5D=myanimelist%2Fanime&filter%5BexternalId%5D=${encodeURIComponent(malId)}&include=item`,{force});
  const rows=Array.isArray(maps.data)?maps.data:[];
  const verified=rows.filter(x=>String(x.attributes?.externalId)===String(malId)&&x.attributes?.externalSite==='myanimelist/anime');
  const ids=[...new Set(verified.map(x=>x.relationships?.item?.data).filter(x=>x?.type==='anime'&&v380ValidPositive(x.id)).map(x=>String(x.id)))];
  if(ids.length!==1)throw v380Unavailable('kitsu',ids.length?'ambiguous MAL mapping':'no MAL mapping');
  id=ids[0];
 }
 const info=await v380Request(`https://kitsu.io/api/edge/anime/${encodeURIComponent(id)}`,{force});
 const data=info.data?.attributes||{};
 if(String(data.status||'').toLowerCase()==='finished'){
  const total=v380ValidPositive(data.episodeCount);if(total)return total;
 }
 if(String(data.status||'').toLowerCase()==='tba'||(data.startDate&&Date.parse(data.startDate)>Date.now()))return 0;
 let offset=0,available=0,dated=0,undated=0,exhausted=false;
 const maxRecords=Math.max(2000,Math.min(20000,Number(data.episodeCount)||2000));
 for(let page=0;page<Math.ceil(maxRecords/20)+1;page++){
  const result=await v380Request(`https://kitsu.io/api/edge/episodes?filter%5BanimeId%5D=${encodeURIComponent(id)}&page%5Blimit%5D=20&page%5Boffset%5D=${offset}`,{force});
  const list=Array.isArray(result?.data)?result.data:[];
  for(const episode of list){const a=episode.attributes||{},number=v380ValidPositive(a.number);
   const released=a.airdate??a.airDate??null;
   if(released){dated++;if(number&&v380TodayAired(released))available=Math.max(available,number);}else undated++;
  }
  if(list.length<20){exhausted=true;break;}
  offset+=list.length;
 }
 if(!exhausted)throw v380Unavailable('kitsu','episode pagination is incomplete');
 if(available>0)return available;
 if(dated&&!undated)return 0;
 throw v380Unavailable('kitsu','no verifiable released-episode dates');
}
const v380TenraiBase=v166AvailableEpisodeCount;
const V380_ADAPTERS={tenrai:(id,force)=>v380TenraiBase(id,force),anizip:v380AniZip,tvmaze:v380TVmaze,kitsu:v380Kitsu,anilist:v380AniList};
v166AvailableEpisodeCount=async function(malId,force=false){
  const mode=v380Mode(),sequence=mode==='automatic'?V380_PROVIDER_SEQUENCE:[mode];
  let failure=null,missing=null;const explanations=[];
  for(const source of sequence){
    try{
      const count=await V380_ADAPTERS[source](String(malId),force);
      if(!Number.isSafeInteger(count)||count<0)throw v380Unavailable(source,'invalid episode count');
      V380_SOURCE_BY_MAL.set(String(malId),{source,available:count,at:Date.now()});
      return count;
    }catch(originalError){
      // An alternative provider's HTTP 404 means *its* record is absent;
      // it cannot establish that the MAL ID itself is invalid.
      const error=source!=='tenrai'&&Number(originalError?.status)===404
        ?v380Unavailable(source,'no record for this anime'):originalError;
      explanations.push(`${source}: ${String(error?.message||error).slice(0,180)}`);
      if(error?.kind==='episode_data_unavailable')missing=error;
      else failure=error;
      if(mode!=='automatic')throw error;
    }
  }
  // A request error should not be converted into a definitive negative result.
  if(missing)throw v380Unavailable('automatic',explanations.join(' | ')||'all sources returned incomplete episode data');
  if(failure){failure.message=`Automatic sources failed: ${explanations.join(' | ')}`;throw failure;}
  throw v380Unavailable(mode,'all sources returned no usable data');
};
// Manual modes never silently call Tenrai to resolve a missing MAL identifier;
// the user may provide an ID in the existing External Media IDs editor.
const v380IdentifyBase=v377Identify;
v377Identify=async function(item,force){
  const mode=v380Mode();
  if(mode!=='automatic'&&mode!=='automatic2'&&mode!=='tenrai'&&!v166GetMalId(item))
    return {malId:'',reason:`Add a MAL ID to use ${V380_NAMES[mode]} exact lookups`};
  return v380IdentifyBase.apply(this,arguments);
};
// Store per-title provider provenance after each complete or partial scan.
const v380RunBase=v377RunJikan;
v377RunJikan=async function(options){
  const result=await v380RunBase.apply(this,arguments),settings=S.settings||{};
  const ledger=settings.v377JikanLedger||{};
  for(const value of Object.values(ledger)){
    const hit=V380_SOURCE_BY_MAL.get(String(value.malId));
    if(hit&&hit.available===value.available){value.v380Provider=hit.source;value.v380ProviderAt=hit.at;}
  }
  if(result?.complete){settings.seasonalFreshLastProvider=V380_NAMES[v380Mode()];}
  // The v377 runner persisted before provenance annotations were appended.
  // Persist those annotations once, without touching Library titles or XP.
  if(result){try{await saveState();}catch(error){console.warn('Provider diagnostics persistence',error);}}
  if(result&&S.view==='settings')render();
  return result;
};

function v380ProviderSummaryHtml(){
  const mode=v380Mode(),ledger=S.settings?.v377JikanLedger||{},hits=Object.values(ledger);
  const tally={};for(const item of hits){if(item?.v380Provider)tally[item.v380Provider]=(tally[item.v380Provider]||0)+1;}
  const text=Object.entries(tally).map(([id,n])=>`${V380_NAMES[id]||id}: ${n}`).join(' · ');
  return `<div class="mf380-provider-panel"><div class="mf380-provider-head"><b>Episode data source</b><small>Choose a source or let MediaFlow try alternatives when a lookup is incomplete.</small></div>
    <label class="mf380-provider-select">Provider <select aria-label="Episode data provider" onchange="App.v380SetEpisodeProvider(this.value)">
    ${V380_SOURCES.map(id=>`<option value="${id}" ${id===mode?'selected':''}>${escapeHtml(V380_NAMES[id])}</option>`).join('')}</select></label>
    <p class="mf380-provider-note">Automatic uses Tenrai → AniZip → AniList → TVmaze → Kitsu as needed. Exact MAL IDs are preferred; unverified or multi-season matches are not guessed. Manual modes query only the selected provider.</p>
    <small class="mf380-provider-stats">${escapeHtml(text||'Provider results will appear after the next scan.')}</small>
    <small class="mf380-provider-source">TVmaze data © TVmaze · <a href="https://www.tvmaze.com" target="_blank" rel="noopener noreferrer">TVmaze</a> · CC BY-SA. Data sources may have incomplete coverage.</small></div>`;
}
const v380ProviderSettingsBase=v166SeasonalSettingsHtml;
v166SeasonalSettingsHtml=function(){const html=String(v380ProviderSettingsBase.apply(this,arguments)||'');
  return v380ProviderSummaryHtml()+html;};
App.v380SetEpisodeProvider=async function(value){
  if(!V380_SOURCES.includes(value))return;
  if(V166_SEASONAL_SYNC_RUNNING){showToast('Wait for the current episode check to finish before switching sources.');return;}
  const settings=S.settings||(S.settings={});if(v380Mode()===value)return;
  settings.v380EpisodeProvider=value;
  // A previously verified source must never masquerade as this provider's
  // scan results. The last certified aggregate count is retained.
  settings.v377JikanLedger={};
  settings.v377JikanResults={unmatched:[],failures:[],unavailable:[],lastCheckedAt:0,completeBaseline:false};
  V380_SOURCE_BY_MAL.clear();
  try{await saveState();}catch(error){console.warn('Unable to persist provider choice',error);}
  render();showToast(`Episode source: ${V380_NAMES[value]}. Run a refresh to verify available episodes.`);
};
const v380StatusBase=v166SeasonalStatusText;
v166SeasonalStatusText=function(){return String(v380StatusBase.apply(this,arguments)||'').replace(/Tenrai/g,V380_NAMES[v380Mode()]);};

window.MediaFlowV380={version:380,providers:V380_SOURCES.slice(),getMode:v380Mode,
  v380DraftUnitCount,probe:(source,id,force=false)=>V380_ADAPTERS[source]?.(String(id),force),
  getProviderForMAL:id=>V380_SOURCE_BY_MAL.get(String(id))||null,
  features:['Five provider adapters and fallback','Provider choice','Logging visibility','Draft-unit sorting','Personal Order scroll retention','Semantic icons']};
MediaFlowRuntime.version=V380_RELEASE;
