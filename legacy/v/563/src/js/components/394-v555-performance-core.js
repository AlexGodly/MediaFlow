/* MediaFlow v555 — performance core for very large accounts.
 * Replaces hot O(Library) lookups with cached indexes, memoises pure helpers
 * that run hundreds of thousands of times per render, and batches layout
 * reads before writes. No Library, History, XP, settings or cloud data is
 * changed by this module: every override returns exactly what the original
 * returned, only faster.
 */
const MF555_VERSION=555;
const MF555_PERF={titleMemoHits:0,indexBuilds:0,levelingHits:0,coverLookups:0};

/* ---------- 1. cleanTitle: pure string function, memoised ---------- */
const mf555CleanTitleBase=cleanTitle;
const MF555_CLEAN=new Map();
cleanTitle=function(value){
  if(typeof value!=='string')return mf555CleanTitleBase(value);
  const hit=MF555_CLEAN.get(value);
  if(hit!==undefined){MF555_PERF.titleMemoHits++;return hit;}
  const out=mf555CleanTitleBase(value);
  if(MF555_CLEAN.size>300000)MF555_CLEAN.clear();
  MF555_CLEAN.set(value,out);
  return out;
};
const mf555NormalizedTitleBase=v165NormalizedTitle;
const MF555_NORM=new Map();
v165NormalizedTitle=function(value){
  const key=typeof value==='string'?value:String(value||'');
  const hit=MF555_NORM.get(key);
  if(hit!==undefined)return hit;
  const out=mf555NormalizedTitleBase(key);
  if(MF555_NORM.size>300000)MF555_NORM.clear();
  MF555_NORM.set(key,out);
  return out;
};

/* ---------- 2. levelingSettings: same result while settings are unchanged ---------- */
// No caller mutates the returned object (verified for v555); the cache key is
// the serialized user leveling settings, so in-place edits invalidate it.
const mf555LevelingBase=levelingSettings;
let MF555_LEVELING={key:null,value:null};
// Inside one History-wide XP computation settings cannot change, so the
// serialized check is skipped while that computation runs.
let MF555_XP_SCOPE=0;
levelingSettings=function(){
  const raw=S.settings?.leveling;
  if(MF555_XP_SCOPE&&MF555_LEVELING.value&&MF555_LEVELING.raw===raw){MF555_PERF.levelingHits++;return MF555_LEVELING.value;}
  let key;
  try{key=raw==null?'':JSON.stringify(raw);}catch(_){return mf555LevelingBase.apply(this,arguments);}
  if(MF555_LEVELING.value&&MF555_LEVELING.key===key){MF555_PERF.levelingHits++;return MF555_LEVELING.value;}
  const value=mf555LevelingBase.apply(this,arguments);
  MF555_LEVELING={key,value,raw};
  return value;
};
const mf555StateMetricsBase=v150ComputeStateMetrics;
v150ComputeStateMetrics=function(){
  // Validate once on entry (picks up any in-place settings edit), then reuse.
  if(!MF555_XP_SCOPE)levelingSettings();
  MF555_XP_SCOPE++;
  try{return mf555StateMetricsBase.apply(this,arguments);}finally{MF555_XP_SCOPE--;}
};

/* ---------- 3. One Library index for id / cover / title lookups ---------- */
// Rebuilt lazily whenever the Library array, its length, or the shared
// v53 Library token changes, and at the start of every full render.
let MF555_INDEX=null;
function mf555LibraryToken(){
  let token=0;
  try{token=V53_LIB?.libraryToken||0;}catch(_){}
  return token;
}
function mf555InvalidateIndex(){MF555_INDEX=null;}
function mf555Index(){
  const lib=Array.isArray(S.library)?S.library:[];
  const token=mf555LibraryToken();
  const idx=MF555_INDEX;
  if(idx&&idx.lib===lib&&idx.length===lib.length&&idx.token===token)return idx;
  MF555_PERF.indexBuilds++;
  const byId=new Map();
  for(const item of lib){
    if(!item)continue;
    const id=String(item.id??'');
    if(id&&!byId.has(id))byId.set(id,item);
  }
  MF555_INDEX={lib,length:lib.length,token,byId,byCover:null,byTitle:null};
  return MF555_INDEX;
}
function mf555ById(id){
  const key=String(id??'');
  if(!key)return null;
  const item=mf555Index().byId.get(key)||null;
  // Guard against in-place id edits since the index was built.
  if(item&&String(item.id??'')!==key){mf555InvalidateIndex();return mf555Index().byId.get(key)||null;}
  return item;
}
function mf555ByCover(src){
  const idx=mf555Index();
  if(!idx.byCover){
    idx.byCover=new Map();
    for(const item of idx.lib){
      if(!item?.coverUrl)continue;
      const key=v181NormalizeUrl(item.coverUrl);
      if(key&&!idx.byCover.has(key))idx.byCover.set(key,item);
    }
  }
  const hit=idx.byCover.get(src)||null;
  // A cover changed since the index was built: rebuild once and retry.
  if(hit&&v181NormalizeUrl(hit.coverUrl||'')!==src){mf555InvalidateIndex();return mf555ByCover(src);}
  return hit;
}
function mf555ByTitle(key){
  const idx=mf555Index();
  if(!idx.byTitle){
    idx.byTitle=new Map();
    for(const item of idx.lib){
      const k=v165NormalizedTitle(item?.title||'');
      const list=idx.byTitle.get(k);
      if(list)list.push(item);else idx.byTitle.set(k,[item]);
    }
  }
  return idx.byTitle.get(key)||[];
}
window.MediaFlowLibraryIndex=Object.freeze({byId:mf555ById,invalidate:mf555InvalidateIndex});

// v181: identical resolution order (id → cover URL → unique exact title).
const mf555ResolveCoverBase=v181ResolveCoverItem;
v181ResolveCoverItem=function(img){
  if(!img)return null;
  MF555_PERF.coverLookups++;
  const direct=String(img.dataset?.libraryId||img.closest?.('[data-library-id]')?.dataset?.libraryId||'');
  if(direct){const byId=mf555ById(direct);if(byId)return byId;}
  const src=v181NormalizeUrl(img.currentSrc||img.src||img.getAttribute?.('src')||'');
  if(src){const byCover=mf555ByCover(src);if(byCover)return byCover;}
  const alt=String(img.alt||'').replace(/\s+cover$/i,'').trim();
  if(alt){const matches=mf555ByTitle(v165NormalizedTitle(alt));if(matches.length===1)return matches[0];}
  return null;
};
// Mark only images that are new or whose source changed since the last pass.
v181MarkClickableCovers=function(){
  for(const img of document.images){
    const src=img.getAttribute('src')||'';
    if(img.dataset.mf555Cover===src)continue;
    img.dataset.mf555Cover=src;
    if(img.closest('.v181-title-details-overlay,.v181-quick-detail-overlay,#modal-root'))continue;
    const item=v181ResolveCoverItem(img);
    if(!item)continue;
    img.classList.add('v181-title-cover-clickable');
    img.dataset.v181LibraryId=String(item.id||'');
    if(!img.title)img.title='Open title details';
  }
};
const mf555RenderBase=render;
let MF555_RANK_SCHEDULED=false;
function mf555ScheduleRanks(){
  if(!MF555_RANK_SCHEDULED&&(S.library?.length||0)>=5000&&!mf555RanksReady()){
    MF555_RANK_SCHEDULED=true;MF555_RANK_IDLE(()=>{MF555_RANK_SCHEDULED=false;mf555PrepareRanks();});
  }
}
render=function(){
  mf555InvalidateIndex();
  const out=mf555RenderBase.apply(this,arguments);
  mf555ScheduleRanks();
  return out;
};
// Startup draws through renderShell rather than render.
const mf555RenderShellBase=renderShell;
renderShell=function(){
  mf555InvalidateIndex();
  const out=mf555RenderShellBase.apply(this,arguments);
  mf555ScheduleRanks();
  return out;
};
const mf555PersistLibraryBase=persistLibrary;
persistLibrary=function(){mf555InvalidateIndex();return mf555PersistLibraryBase.apply(this,arguments);};
const mf555InvalidateLibraryBase=v53InvalidateLibraryCache;
v53InvalidateLibraryCache=function(){mf555InvalidateIndex();return mf555InvalidateLibraryBase.apply(this,arguments);};

/* ---------- 4. Collections showcase: measure only what is (nearly) visible ----------
 * Reading poster geometry forces layout of every showcase, including the
 * off-screen ones the browser could otherwise skip. Measure a showcase when it
 * approaches the viewport, reading all geometry first and writing after. */
function mf555MeasureFrames(frames){
  const reads=[],strips=new Map();
  for(const frame of frames){
    for(const poster of frame.querySelectorAll('.mf474-poster')){
      const strip=poster.closest('.mf474-showcase-strip');
      if(!strip)continue;
      let st=strips.get(strip);
      if(!st){
        const css=getComputedStyle(strip);
        st={width:strip.clientWidth,pad:(parseFloat(css.paddingLeft)||0)+(parseFloat(css.paddingRight)||0),
          peers:Math.max(0,strip.querySelectorAll('.mf474-poster').length-1)};
        strips.set(strip,st);
      }
      const cover=poster.querySelector('.mf473-poster-crop');
      reads.push({poster,st,height:poster.getBoundingClientRect().height,w:Number(cover?.naturalWidth),h:Number(cover?.naturalHeight)});
    }
  }
  for(const r of reads){
    if(r.st.width<1||r.height<1)continue;
    const valid=Number.isFinite(r.w)&&Number.isFinite(r.h)&&r.w>0&&r.h>0;
    const ratio=valid?r.w/r.h:2/3;
    const content=Math.max(1,r.st.width-r.st.pad);
    const maxWidth=Math.max(16,content-r.st.peers*MF474_MIN_PEEK);
    const px=Math.round(Math.min(maxWidth,Math.max(16,r.height*ratio))*100)/100;
    r.poster.style.setProperty('--mf474-native-width',px+'px');
    r.poster.dataset.mf474Aspect=ratio.toFixed(4);
    r.poster.dataset.mf474Source=valid?'natural':'placeholder';
  }
}
let MF555_SHOWCASE_IO=null;
const MF555_SHOWCASE_VISIBLE=new Set();
mf474RefreshAll=function(){
  const frames=[...document.querySelectorAll('.mf274-collections-browser .mf474-showcase-frame')];
  if(typeof IntersectionObserver==='undefined'){mf555MeasureFrames(frames);return;}
  if(!MF555_SHOWCASE_IO)MF555_SHOWCASE_IO=new IntersectionObserver(entries=>{
    const now=[];
    for(const e of entries){
      if(e.isIntersecting){MF555_SHOWCASE_VISIBLE.add(e.target);now.push(e.target);}
      else MF555_SHOWCASE_VISIBLE.delete(e.target);
    }
    if(now.length)mf555MeasureFrames(now);
  },{rootMargin:'600px 0px'});
  MF555_SHOWCASE_IO.disconnect();MF555_SHOWCASE_VISIBLE.clear();
  for(const f of frames)MF555_SHOWCASE_IO.observe(f);
  if(typeof ResizeObserver==='undefined')return;
  if(!MF474_OBSERVER)MF474_OBSERVER=new ResizeObserver(entries=>{
    // Only re-measure showcases that are currently near the viewport.
    const hit=entries.map(e=>e.target).filter(f=>MF555_SHOWCASE_VISIBLE.has(f));
    if(hit.length)requestAnimationFrame(()=>mf555MeasureFrames(hit.filter(f=>f.isConnected)));
  });
  MF474_OBSERVER.disconnect();
  for(const f of frames)MF474_OBSERVER.observe(f);
};
// Poster images that finish loading re-measure only their own showcase.
mf474ImageReady=function(img){
  const frame=img?.closest?.('.mf474-showcase-frame');
  if(frame&&(!MF555_SHOWCASE_IO||MF555_SHOWCASE_VISIBLE.has(frame)))mf555MeasureFrames([frame]);
};
// Inline onload handlers and other modules call these through App.
Object.assign(App,{mf474ImageReady,mf474RefreshAll});

/* ---------- 5. History: reset scroll once, without touching every scroller ---------- */
v349HistoryScrollTop=function(){
  if(String(S.view||'')!=='history')return;
  const targets=[document.scrollingElement,document.querySelector('.main'),document.querySelector('.main-content'),document.querySelector('.content')];
  for(const el of new Set(targets.filter(Boolean)))if(el.scrollTop!==0)el.scrollTop=0;
};

/* ---------- 6. UI enhancer: skip nested roots in O(n·depth), not O(n²) ---------- */
v232ScheduleEnhance=function(root){
  if(root?.nodeType===1)V232_PENDING_ROOTS.add(root);
  if(V232_ENHANCE_FRAME)return;
  V232_ENHANCE_FRAME=requestAnimationFrame(()=>{
    V232_ENHANCE_FRAME=0;
    const roots=V232_PENDING_ROOTS;
    const batch=[...roots];roots.clear();
    const set=new Set(batch);
    for(const node of batch){
      let covered=false;
      for(let p=node.parentNode;p;p=p.parentNode)if(set.has(p)){covered=true;break;}
      if(!covered&&node.isConnected)v232EnhanceRoot(node);
    }
  });
};

/* ---------- 7. Per-task memo for History-wide helpers ----------
 * Dashboard and Statistics call the same O(History) helpers once per
 * category, several times in one render. Results are cached only for the
 * current synchronous task (cleared on the next microtask) and only while
 * the History/Library arrays and their lengths are unchanged, so any new log
 * or edit made afterwards is always seen. */
const MF555_TASK={memo:new Map(),scheduled:false};
function mf555DataKey(){
  const s=S.sessions,l=S.library,c=S.categories;
  return [s?.length,l?.length,c?.length,todayISO()];
}
function mf555TaskMemo(name,args,compute){
  if(!MF555_TASK.scheduled){MF555_TASK.scheduled=true;queueMicrotask(()=>{MF555_TASK.memo.clear();MF555_TASK.scheduled=false;});}
  const keyParts=mf555DataKey();
  const key=name+'|'+args.map(a=>a&&typeof a==='object'?(a.id??JSON.stringify(a)):String(a)).join('|')+'|'+keyParts.join('|');
  const hit=MF555_TASK.memo.get(key);
  if(hit&&hit.s===S.sessions&&hit.l===S.library&&hit.c===S.categories)return hit.v;
  const v=compute();
  MF555_TASK.memo.set(key,{v,s:S.sessions,l:S.library,c:S.categories});
  return v;
}
function mf555SessionsByCategory(){
  return mf555TaskMemo('byCat',[],()=>{
    const map=new Map();
    for(const s of S.sessions||[]){if(!s)continue;const k=s.categoryId;const list=map.get(k);if(list)list.push(s);else map.set(k,[s]);}
    return map;
  });
}
const mf555LastSessionBase=lastSessionFor,mf555MinutesSinceBase=minutesSince,mf555TodayBase=todaysSessions,mf555ConsumptionBase=schedulerConsumptionSessions;
lastSessionFor=function(catId){
  return mf555TaskMemo('last',[catId],()=>{
    let best=null;
    for(const s of mf555SessionsByCategory().get(catId)||[])if(!best||s.timestamp>best.timestamp)best=s;
    return best;
  });
};
minutesSince=function(catId,hours){
  const cutoff=hoursAgo(hours);
  let sum=0;
  for(const s of mf555SessionsByCategory().get(catId)||[])if(s.timestamp>=cutoff&&s.status!=='skipped')sum+=(s.minutes||0);
  return sum;
};
todaysSessions=function(){
  return mf555TaskMemo('today',[],()=>{const t=todayISO();return S.sessions.filter(s=>s.date===t);}).slice();
};
schedulerConsumptionSessions=function(){
  return mf555TaskMemo('consumption',[],()=>S.sessions.filter(s=>s&&s.status!=='skipped'&&((Number(s.minutes)||0)>0||(Number(s.actualAmount)||0)>0))).slice();
};
const mf555CategoryBalanceBase=categoryBalance;
categoryBalance=function(cat){
  const v=mf555TaskMemo('balance',[cat],()=>mf555CategoryBalanceBase.apply(this,arguments));
  // Object result: every caller gets its own copy, so no caller can alter another's.
  return v&&typeof v==='object'?structuredClone(v):v;
};
const mf555OverallStatusBase=overallCategoryStatus;
overallCategoryStatus=function(cat){return mf555TaskMemo('overall',[cat],()=>mf555OverallStatusBase.apply(this,arguments));};
const mf555CategoryStatusBase=categoryStatus;
categoryStatus=function(cat){return mf555TaskMemo('status',[cat],()=>mf555CategoryStatusBase.apply(this,arguments));};
const mf555MissingQueueBase=v192SyncMissingCoverQueue;
v192SyncMissingCoverQueue=function(){return mf555TaskMemo('missingCovers',[],()=>mf555MissingQueueBase.apply(this,arguments));};
v192CurrentMissingCoverItem=function(){
  v192SyncMissingCoverQueue();
  const id=V192_MISSING_COVER_QUEUE[0];
  return id?mf555ById(id):null;
};

/* ---------- 8. Library sorting: collate titles once, compare integers ----------
 * Every Library sort ends with a title tie-break through Intl.Collator,
 * ~1.7 million collator calls for 100,000 titles. Rank all titles once per
 * Library version (equal titles share a rank), then compare ranks: the sign
 * of every comparison is identical to the collator's. */
let MF555_TITLE_RANK=null;
function mf555TitleRanks(){
  // Keyed on the Library version, not on the per-render index object; renamed
  // titles are detected per comparison below.
  const lib=Array.isArray(S.library)?S.library:[],token=mf555LibraryToken();
  const r=MF555_TITLE_RANK;
  if(r&&r.lib===lib&&r.length===lib.length&&r.token===token)return r.ranks;
  const rows=lib.filter(Boolean).map(item=>({item,raw:item.title,t:cleanTitle(item.title||'')}));
  rows.sort((a,b)=>V391_TITLE_COLLATOR.compare(a.t,b.t));
  const ranks=new Map();
  let rank=0;
  for(let i=0;i<rows.length;i++){
    if(i&&V391_TITLE_COLLATOR.compare(rows[i-1].t,rows[i].t)!==0)rank++;
    ranks.set(rows[i].item,{rank,raw:rows[i].raw});
  }
  MF555_TITLE_RANK={lib,length:lib.length,token,ranks};
  return ranks;
}
/* The first ranking of a large Library runs in a worker after startup, so
 * opening the Library never waits for 100,000 collator comparisons. Until a
 * ranking for the current Library version exists, comparisons use the
 * collator directly (identical results, just slower). */
const MF555_RANK_JOB={pending:null,worker:null};
const MF555_RANK_WORKER=`onmessage=e=>{const c=new Intl.Collator(undefined,{numeric:true,sensitivity:'base'});
  const t=e.data.titles,idx=new Int32Array(t.length);for(let i=0;i<t.length;i++)idx[i]=i;
  idx.sort((a,b)=>c.compare(t[a],t[b]));const rank=new Int32Array(t.length);let r=0;
  for(let i=0;i<idx.length;i++){if(i&&c.compare(t[idx[i-1]],t[idx[i]])!==0)r++;rank[idx[i]]=r;}
  postMessage({id:e.data.id,rank},[rank.buffer]);};`;
function mf555RanksReady(){
  const lib=Array.isArray(S.library)?S.library:[],token=mf555LibraryToken(),r=MF555_TITLE_RANK;
  return !!(r&&r.lib===lib&&r.length===lib.length&&r.token===token);
}
function mf555PrepareRanks(){
  const lib=Array.isArray(S.library)?S.library:[];
  if(lib.length<5000||mf555RanksReady())return;
  const token=mf555LibraryToken(),job=MF555_RANK_JOB;
  if(job.pending&&job.pending.lib===lib&&job.pending.length===lib.length&&job.pending.token===token)return;
  try{
    if(!job.worker){job.worker=new Worker(URL.createObjectURL(new Blob([MF555_RANK_WORKER],{type:'text/javascript'})));
      job.worker.onmessage=e=>{
        const p=job.pending;if(!p||p.id!==e.data.id)return;job.pending=null;
        // Discard if the Library changed while ranking.
        const cur=Array.isArray(S.library)?S.library:[];
        if(cur!==p.lib||cur.length!==p.length||mf555LibraryToken()!==p.token)return;
        const ranks=new Map();
        for(let i=0;i<p.items.length;i++)ranks.set(p.items[i],{rank:e.data.rank[i],raw:p.raws[i]});
        MF555_TITLE_RANK={lib:p.lib,length:p.length,token:p.token,ranks};
      };
      job.worker.onerror=()=>{job.worker=null;job.pending=null;};}
    const items=lib.filter(Boolean),raws=items.map(i=>i.title);
    const titles=items.map(i=>cleanTitle(i.title||''));
    job.pending={id:Date.now()+Math.random(),lib,length:lib.length,token,items,raws};
    job.worker.postMessage({id:job.pending.id,titles});
  }catch(_){job.pending=null;}
}
const MF555_RANK_IDLE=cb=>typeof requestIdleCallback==='function'?requestIdleCallback(cb,{timeout:4000}):setTimeout(cb,1500);
function mf555TitleCompare(ai,bi){
  if(!mf555RanksReady()&&(S.library?.length||0)>=5000){
    // Large Library: never block on ranking; use the collator until ready.
    mf555PrepareRanks();
    return V391_TITLE_COLLATOR.compare(cleanTitle(ai?.title||''),cleanTitle(bi?.title||''));
  }
  const ranks=mf555TitleRanks();
  const ra=ranks.get(ai),rb=ranks.get(bi);
  // Ranks are valid only while the titles are unchanged since ranking.
  if(ra&&rb&&ra.raw===ai.title&&rb.raw===bi.title)return ra.rank-rb.rank;
  return V391_TITLE_COLLATOR.compare(cleanTitle(ai?.title||''),cleanTitle(bi?.title||''));
}
const mf555CompareBase=v189CompareLibraryItems;
v189CompareLibraryItems=function(a,b,sort){
  const ai=a?.item||a,bi=b?.item||b;
  if(sort==='remaining-asc'||sort==='remaining-desc')
    return v518CompareRemainingLibrary(a,b,sort.endsWith('-asc')?'asc':'desc')||mf555TitleCompare(ai,bi);
  const n=v=>Number.isFinite(Number(v))?Number(v):0;
  const rank={low:0,medium:1,high:2};
  let d=0;
  if(sort==='title-asc')return mf555TitleCompare(ai,bi);
  if(sort==='title-desc')return -mf555TitleCompare(ai,bi);
  if(sort==='priority-asc')d=(rank[String(ai?.priority||'medium')]??1)-(rank[String(bi?.priority||'medium')]??1);
  else if(sort==='priority-desc'||sort==='priority')d=(rank[String(bi?.priority||'medium')]??1)-(rank[String(ai?.priority||'medium')]??1);
  else if(sort==='rating-asc')d=n(ai?.rating)-n(bi?.rating);
  else if(sort==='rating-desc')d=n(bi?.rating)-n(ai?.rating);
  else if(sort==='progress-asc')d=n(ai?.progress)-n(bi?.progress);
  else if(sort==='progress-desc')d=n(bi?.progress)-n(ai?.progress);
  else if(sort==='total-asc')d=n(ai?.total)-n(bi?.total);
  else if(sort==='total-desc')d=n(bi?.total)-n(ai?.total);
  else if(sort==='logging-asc')d=n(v53LastTouched(ai))-n(v53LastTouched(bi));
  else if(sort==='logging-desc')d=n(v53LastTouched(bi))-n(v53LastTouched(ai));
  else if(sort==='edited-asc')d=n(ai?.modifiedAt||ai?.createdAt)-n(bi?.modifiedAt||bi?.createdAt);
  else if(sort==='edited-desc')d=n(bi?.modifiedAt||bi?.createdAt)-n(ai?.modifiedAt||ai?.createdAt);
  else if(sort==='seen-asc')d=n(ai?.lastSeenAt)-n(bi?.lastSeenAt);
  else if(sort==='seen-desc')d=n(bi?.lastSeenAt)-n(ai?.lastSeenAt);
  else if(sort==='added-asc')d=n(ai?.createdAt)-n(bi?.createdAt);
  else if(sort==='added-desc')d=n(bi?.createdAt)-n(ai?.createdAt);
  else if(sort==='random')d=v189RandomValue(ai)-v189RandomValue(bi);
  return d||mf555TitleCompare(ai,bi);
};

/* ---------- 9. Button labels without deep-cloning every button ----------
 * v225 cloned each button, removed icons/inputs and read textContent — and
 * ~30 stacked icon resolvers call it repeatedly. Walking the text nodes that
 * are not inside an icon, svg or input gives the identical string. Results
 * are reused within one task (elements do not change mid-task). */
const mf555CleanActionTextBase=v225CleanActionText;
let MF555_LABELS=new WeakMap(),MF555_LABELS_SCHEDULED=false;
function mf555RawActionText(el){
  if(!el||typeof el.nodeType!=='number')return null;
  let text='';
  const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
  for(let n=walker.nextNode();n;n=walker.nextNode()){
    let skip=false;
    for(let p=n.parentNode;p&&p!==el;p=p.parentNode){
      if(p.nodeType===1&&p.matches('.v225-btn-icon,svg,input')){skip=true;break;}
    }
    if(!skip)text+=n.data;
  }
  return text;
}
v225CleanActionText=function(el){
  if(!el||typeof el.cloneNode!=='function')return mf555CleanActionTextBase.apply(this,arguments);
  if(!MF555_LABELS_SCHEDULED){MF555_LABELS_SCHEDULED=true;queueMicrotask(()=>{MF555_LABELS=new WeakMap();MF555_LABELS_SCHEDULED=false;});}
  const hit=MF555_LABELS.get(el);
  if(hit!==undefined)return hit;
  const raw=mf555RawActionText(el);
  const out=String(raw||el.getAttribute?.('aria-label')||el.getAttribute?.('title')||'')
    .replace(/[←→↑↓↶↷↻✓✕×＋+]/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
  MF555_LABELS.set(el,out);
  return out;
};

window.MediaFlowV555Performance=Object.freeze({version:MF555_VERSION,ranksReady:()=>mf555RanksReady(),
  // Original implementations, for parity tests only.
  bases:{compare:mf555CompareBase,lastSessionFor:mf555LastSessionBase,minutesSince:mf555MinutesSinceBase,todaysSessions:mf555TodayBase,
    consumption:mf555ConsumptionBase,resolveCover:mf555ResolveCoverBase,cleanTitle:mf555CleanTitleBase,leveling:mf555LevelingBase,
    categoryBalance:mf555CategoryBalanceBase,overall:mf555OverallStatusBase,status:mf555CategoryStatusBase,
    actionText:mf555CleanActionTextBase},stats:()=>({...MF555_PERF,cleanCache:MF555_CLEAN.size,normCache:MF555_NORM.size})});
MediaFlowRuntime.version=MF555_VERSION;
