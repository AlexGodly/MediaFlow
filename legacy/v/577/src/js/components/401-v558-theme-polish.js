/* MediaFlow v558 — theme polish and a fast Add to Logging popup.
 *
 *  1. Library-like sorting (Logging picker, Add to Logging, Library pickers)
 *     reused String.localeCompare(…, options), which builds a new collator for
 *     every comparison: several seconds for a few thousand titles. One shared
 *     Intl.Collator gives the identical order.
 *  2. Add to Logging: the popup paints once, then fills its list on the next
 *     frame; repeated list rebuilds in the same frame are merged into one;
 *     typing in the search is debounced.
 *  3. Background Processes (minimised button and the panel's minimise button),
 *     the External ID finder and the Add to Logging popup follow the active
 *     MediaFlow theme instead of fixed dark colours.
 */
const MF558_VERSION=558;

/* ---------- 1. Fast library-like comparator (same order as v224/v518) ---------- */
const MF558_COLLATOR=new Intl.Collator(undefined,{numeric:true,sensitivity:'base'});
const MF558_SORT_RANK={low:0,medium:1,high:2};
function mf558Num(v){const n=Number(v);return Number.isFinite(n)?n:0;}
function mf558CompareLibraryLike(a,b,base,dir){
  const d=v224SortDirection(dir)==='desc'?-1:1;
  const title=()=>MF558_COLLATOR.compare(cleanTitle(a?.title||''),cleanTitle(b?.title||''));
  const key=String(base||'title');
  let diff=0;
  switch(key){
    case 'title':diff=title();break;
    case 'priority':diff=(MF558_SORT_RANK[String(a?.priority||'medium').toLowerCase()]??1)-(MF558_SORT_RANK[String(b?.priority||'medium').toLowerCase()]??1);break;
    case 'rating':diff=mf558Num(a?.rating)-mf558Num(b?.rating);break;
    case 'progress':diff=mf558Num(a?.progress)-mf558Num(b?.progress);break;
    case 'total':diff=mf558Num(a?.total)-mf558Num(b?.total);break;
    case 'remaining':
      // v518: season-aware remaining units, ties broken by title ascending.
      return v518CompareRemainingLibrary(a,b,v224SortDirection(dir))||title();
    case 'logging':diff=mf558Num(v53LastTouched(a))-mf558Num(v53LastTouched(b));break;
    case 'edited':diff=mf558Num(a?.modifiedAt||a?.createdAt)-mf558Num(b?.modifiedAt||b?.createdAt);break;
    case 'seen':diff=mf558Num(a?.lastSeenAt)-mf558Num(b?.lastSeenAt);break;
    case 'added':diff=mf558Num(a?.createdAt)-mf558Num(b?.createdAt);break;
    default:diff=title();break;
  }
  return (diff*d)||(title()*d);
}
v224CompareLibraryLike=mf558CompareLibraryLike;

/* ---------- 2. Add to Logging: rebuild the title list once, not dozens of times ----------
 * renderLogForm (v238) builds Browse Library in a detached copy and marks it
 * open; the browser fires "toggle" on that detached copy, whose handler
 * schedules a full list rebuild. The form is rendered many times while the
 * popup opens, so the list was rebuilt ~50 times. Only the element on the
 * page may request a rebuild. */
const mf558ToggleLibraryBase=App.v238ToggleLogLibrary;
App.v238ToggleLogLibrary=function(details){
  if(details&&details.isConnected===false)return;   // a detached render copy, not the page
  return mf558ToggleLibraryBase.apply(this,arguments);
};

// Typing in the popup search: the draft updates at once, the list follows
// shortly after the last keystroke instead of on every key.
const MF558_TYPE_DELAY=140;
const MF558_STATS={listBuilds:0};
let mf558Defer=false,mf558TypeTimer=0;
const mf558RenderSuggestionsCore=renderLogSuggestions;
function mf558RenderSuggestionsBase(){MF558_STATS.listBuilds++;return mf558RenderSuggestionsCore.apply(this,arguments);}
renderLogSuggestions=function(){
  if(mf558Defer){
    clearTimeout(mf558TypeTimer);
    mf558TypeTimer=setTimeout(()=>{mf558TypeTimer=0;try{mf558RenderSuggestionsBase();}catch(_){}},MF558_TYPE_DELAY);
    return;
  }
  if(mf558TypeTimer){clearTimeout(mf558TypeTimer);mf558TypeTimer=0;}
  return mf558RenderSuggestionsBase.apply(this,arguments);
};
const mf558UpdateEntryDraftBase=App.updateEntryDraft;
App.updateEntryDraft=function(k){
  mf558Defer=k==='title'&&MF555UI.logPopup.open;
  try{return mf558UpdateEntryDraftBase.apply(this,arguments);}finally{mf558Defer=false;}
};

// Open: show the popup frame immediately, then build it on the next frame so
// the click answers at once even on a large library.
function mf558SkeletonHtml(){
  const row='<div class="mf558-skel-row"><i class="mf558-skel-box"></i><i class="mf558-skel-cover"></i><span><i class="mf558-skel-line"></i><i class="mf558-skel-line is-short"></i></span></div>';
  return '<div class="mf555-log-popup mf558-log-loading" id="mf558-log-skeleton" aria-busy="true" aria-label="Opening Add to Logging">'+
    '<div class="mf555-log-backdrop"></div><section class="mf555-log-sheet">'+
    '<header class="mf555-log-head"><div class="mf557-head-copy"><span class="mf557-head-icon" aria-hidden="true">'+MF557_ICON.library+'</span><div><strong>Add to Logging</strong><small>Opening your library…</small></div></div></header>'+
    '<div class="mf555-log-body"><div class="mf558-skel-search"></div><div class="mf558-skel-chips"><i></i><i></i><i></i><i></i></div>'+row.repeat(5)+'</div>'+
    '</section></div>';
}
const mf558OpenBase=App.mf555OpenLogPopup;
let mf558Opening=false;
App.mf555OpenLogPopup=function(){
  if(mf558Opening||MF555UI.logPopup.open)return mf558OpenBase.apply(this,arguments);
  mf558Opening=true;
  document.getElementById('mf558-log-skeleton')?.remove();
  document.body.insertAdjacentHTML('beforeend',mf558SkeletonHtml());
  document.body.classList.add('mf555-log-popup-open');
  const args=arguments,self=this;
  // Two frames: the skeleton is painted before the real work starts.
  requestAnimationFrame(()=>setTimeout(()=>{
    try{mf558OpenBase.apply(self,args);}
    finally{
      mf558Opening=false;
      document.getElementById('mf558-log-skeleton')?.remove();
      if(!MF555UI.logPopup.open)document.body.classList.remove('mf555-log-popup-open');
    }
  },0));
};

/* ---------- 3. Background Processes: minimise sits beside the chevron ----------
 * It was placed at fixed offsets, so it drifted away from the chevron at some
 * widths; now it takes the chevron's exact size and row. The minimised button
 * also says how many jobs are running. */
function mf558PlaceMinimize(){
  const w=document.getElementById('mf441-process-widget');
  const btn=w?.querySelector('.mf555-proc-minimize'),chev=w?.querySelector('.mf476-toggle-chevron');
  if(!btn||!chev||!w.getClientRects().length)return;   // fixed-position: offsetParent is always null
  const wr=w.getBoundingClientRect(),cr=chev.getBoundingClientRect();
  if(!cr.width)return;
  const gap=6;
  btn.style.top=Math.round(cr.top-wr.top-w.clientTop)+'px';
  btn.style.right=Math.round(wr.right-cr.left+gap-w.clientLeft)+'px';
  btn.style.width=Math.round(cr.width)+'px';
  btn.style.height=Math.round(cr.height)+'px';
  btn.classList.add('mf558-placed');
}
function mf558DecorateMini(state){
  const mini=document.getElementById('mf555-proc-mini');
  if(!mini)return;
  const active=Number(state?.activeCount)||0,jobs=(state?.cover?1:0)+(state?.metadata?1:0);
  mini.dataset.mf558Jobs=String(jobs);
  const icon=mini.querySelector('.mf555-proc-icon');
  let badge=mini.querySelector('.mf558-proc-badge');
  if(active>0&&icon){
    if(!badge){badge=document.createElement('span');badge.className='mf558-proc-badge';badge.setAttribute('aria-hidden','true');icon.appendChild(badge);}
    if(badge.textContent!==String(active))badge.textContent=String(active);
  }else badge?.remove();
}
// v566: measuring right after a paint forced a full page layout on every
// progress tick (very slow on big pages). Place it once per frame instead.
// The button's place only depends on the widget's layout state and the window
// size, so a progress repaint reuses the last measurement (no page layout).
let mf558PlacePending=false,mf558PlaceCache=null;
function mf558PlaceKey(w){return [w.className,window.innerWidth,window.innerHeight,w.querySelector('.mf476-toggle-chevron')?.getAttribute('aria-expanded')||''].join('|');}
function mf558SchedulePlace(){
  if(mf558PlacePending)return;
  mf558PlacePending=true;
  requestAnimationFrame(()=>{
    mf558PlacePending=false;
    try{
      const w=document.getElementById('mf441-process-widget'),btn=w?.querySelector('.mf555-proc-minimize');
      if(!btn)return;
      const key=mf558PlaceKey(w);
      if(mf558PlaceCache&&mf558PlaceCache.key===key){
        if(!btn.classList.contains('mf558-placed')){Object.assign(btn.style,mf558PlaceCache.style);btn.classList.add('mf558-placed');}
        return;
      }
      mf558PlaceMinimize();
      if(btn.classList.contains('mf558-placed'))mf558PlaceCache={key,style:{top:btn.style.top,right:btn.style.right,width:btn.style.width,height:btn.style.height}};
    }catch(_){}
  });
}
window.addEventListener('resize',()=>{mf558PlaceCache=null;});
const mf558ProcPaintBase=mf441Paint;
mf441Paint=function(){
  const out=mf558ProcPaintBase.apply(this,arguments);
  try{mf558DecorateMini(mf441State());}catch(_){}
  mf558SchedulePlace();
  return out;
};
const mf558LayoutBase=mf469Layout;
mf469Layout=function(){
  const out=mf558LayoutBase.apply(this,arguments);
  mf558SchedulePlace();   // v566: cached placement, no forced layout per repaint
  return out;
};
addEventListener('resize',()=>{try{mf558PlaceMinimize();}catch(_){}});

/* ---------- 4. Discover verified External IDs: clean layout ----------
 * Same data and the same radio names/values as v555, so "Add selected IDs"
 * (App.mf555LinkChosenIds) and saving are unchanged. */
const MF558_ID_ICON={
  open:MF555_SVG('<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>'),
  check:MF555_SVG('<path d="m5 12.5 4.2 4.2L19 7"/>'),
  plus:MF555_SVG('<path d="M12 5v14M5 12h14"/>'),
  link:MF555_SVG('<path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1"/><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"/>')
};
// Short label for a site's search status; the full message stays in the tooltip.
function mf558IdShort(s){
  const note=String(s?.note||'');
  if(s?.state==='busy')return 'Searching';
  if(s?.state==='waiting')return 'Waiting';
  if(s?.state==='stopped')return 'Stopped';
  if(s?.state==='ok'){const m=note.match(/^(\d+)\s+result/);return m?m[1]:'No match';}
  if(/API key|Not set up|credential/i.test(note))return 'Needs API key';
  if(/limit/i.test(note))return 'Limit reached';
  if(/^Busy/i.test(note))return 'Busy';
  if(/sign in/i.test(note))return 'Sign in again';
  if(/not available/i.test(note))return 'Unavailable';
  if(/reach|connection|network/i.test(note))return 'Unreachable';
  const http=note.match(/HTTP\s*(\d{3})/i);if(http)return 'Error '+http[1];
  return 'Error';
}
function mf558IdStatusHtml(){
  const rows=[...MF555ID.status].map(([p,s])=>({p,s,label:MF555ID_LABELS[p]||p,short:mf558IdShort(s)}));
  if(!rows.length)return '';
  const chip=(r,kind)=>'<span class="mf555-id-site mf558-chip is-'+kind+'" title="'+mf434Esc(r.label+': '+(r.s.note||''))+'">'+
    (kind==='busy'?'<i class="mf558-spin" aria-hidden="true"></i>':'')+'<span>'+mf434Esc(r.label)+'</span>'+
    '<span class="mf558-sr">: '+mf434Esc(r.s.note||'')+'</span>'+
    (kind==='found'?'<b>'+mf434Esc(r.short)+'</b>':kind==='none'?'':'<em>'+mf434Esc(r.short)+'</em>')+'</span>';
  const found=rows.filter(r=>r.s.state==='ok'&&/^\d+$/.test(r.short));
  const busy=rows.filter(r=>['busy','waiting'].includes(r.s.state));
  const errors=rows.filter(r=>['error','stopped'].includes(r.s.state));
  const none=rows.filter(r=>r.s.state==='ok'&&!/^\d+$/.test(r.short));
  const group=(title,list,kind)=>list.length?'<div class="mf558-chip-group is-'+kind+'"><span class="mf558-chip-label">'+title+'</span>'+list.map(r=>chip(r,kind)).join('')+'</div>':'';
  return '<div class="mf555-id-status mf558-id-status" aria-label="Sites searched">'+
    group('Found',found,'found')+group('Searching',busy,'busy')+group('No match',none,'none')+group('Couldn’t search',errors,'error')+'</div>';
}
function mf558IdSelectedCount(){
  let n=0;
  for(const g of document.querySelectorAll('.mf558-id-group[data-mf555-key]'))if(g.querySelector('input[type=radio]:checked')?.value)n++;
  return n;
}
function mf558IdSyncAddButton(){
  const btn=document.querySelector('.mf558-id-add');
  if(!btn)return;
  const n=mf558IdSelectedCount();
  btn.disabled=!n;
  const label=btn.querySelector('span');
  const text=n?'Add '+n+' ID'+(n===1?'':'s')+' to this title':'Select IDs to add';
  if(label&&label.textContent!==text)label.textContent=text;
}
mf555IdResultsHtml=function(item){
  const saved=item?.externalIds||{};
  const editor=document.querySelector('[data-v377-ids-editor]');
  const draft=key=>String([...(editor?.querySelectorAll('[data-v377-id]')||[])].find(x=>x.dataset.v377Id===key)?.value||'').trim();
  const order=Object.keys(MF555ID_KEYS);
  const groups=[...MF555ID.results].sort((a,b)=>(order.indexOf(a[0])+1||99)-(order.indexOf(b[0])+1||99));
  const linked=[],choose=[];
  for(const [key,map] of groups){
    const rows=[...map.values()].sort((a,b)=>Number(b.exact)-Number(a.exact)||(b.sources.size-a.sources.size));
    const current=String(saved[key]??'').trim()||draft(key);
    const label=MF555ID_KEYS[key]||key.toUpperCase();
    if(current){
      const known=rows.find(r=>r.value===current);
      linked.push('<li class="mf558-linked-row"><span class="mf558-linked-site">'+mf434Esc(label)+'</span><code>'+mf434Esc(current)+'</code>'+
        '<span class="mf558-linked-title">'+(known?mf434Esc(known.title):'')+'</span><span class="mf558-kept">Kept</span></li>');
      continue;
    }
    const exact=rows.filter(r=>r.exact);
    const preselect=exact.length===1?exact[0].value:'';
    const name='mf555-id-'+key;
    choose.push('<fieldset class="mf555-id-group mf558-id-group" data-mf555-key="'+mf434Esc(key)+'">'+
      '<legend><span>'+mf434Esc(label)+'</span>'+(rows.length>1?'<small>'+rows.length+' results</small>':'')+'</legend>'+
      rows.map(r=>'<label class="mf555-id-option mf558-id-row'+(r.exact?' is-exact':' is-loose')+'">'+
        '<input type="radio" class="mf558-radio" name="'+name+'" value="'+mf434Esc(r.value)+'"'+(r.value===preselect?' checked':'')+'>'+
        '<span class="mf555-id-main"><b>'+mf434Esc(r.title||'Untitled')+'</b>'+
        '<small>'+[r.year,r.type,'ID '+r.value,[...r.sources].map(s=>MF555ID_LABELS[s]||s).join(', ')].filter(Boolean).map(mf434Esc).join(' · ')+'</small></span>'+
        (r.exact?'<span class="mf558-tag is-exact">'+MF558_ID_ICON.check+'Exact match</span>':'<span class="mf558-tag">Check this</span>')+
        (r.link?'<a href="'+mf434Esc(r.link)+'" target="_blank" rel="noopener noreferrer" class="mf555-id-open mf558-id-open" title="Open on the site" aria-label="Open '+mf434Esc(r.title||'record')+' on the site">'+MF558_ID_ICON.open+'</a>':'')+
        '</label>').join('')+
      '<label class="mf555-id-option mf558-id-row is-none"><input type="radio" class="mf558-radio" name="'+name+'" value=""'+(preselect?'':' checked')+'><span class="mf555-id-main"><b>None of these</b></span></label>'+
      '</fieldset>');
  }
  const empty=!groups.length&&!MF555ID.busy?'<p class="mf555-id-empty mf558-id-empty">No records found. Try another name (for anime, the English or romanized title) or a single site.</p>':'';
  const linkedHtml=linked.length?'<section class="mf558-linked"><header>'+MF558_ID_ICON.link+'<span>Already linked</span><small>Existing IDs are never replaced</small></header><ul>'+linked.join('')+'</ul></section>':'';
  const addHtml=choose.length?'<div class="mf558-id-actions"><button type="button" class="btn btn-primary mf555-id-link mf558-id-add" onclick="App.mf555LinkChosenIds()">'+MF558_ID_ICON.plus+'<span>Add IDs</span></button></div>':'';
  queueMicrotask(mf558IdSyncAddButton);
  return mf558IdStatusHtml()+empty+choose.join('')+addHtml+linkedHtml;
};
document.addEventListener('change',e=>{if(e.target?.matches?.('.mf558-id-group input[type=radio]'))mf558IdSyncAddButton();});
// Find IDs: a proper primary button.
const mf558LookupHtmlBase=mf434IdsEditorLookupHtml;
mf434IdsEditorLookupHtml=function(){
  return String(mf558LookupHtmlBase.apply(this,arguments)).replace('class="btn btn-ghost mf436-find-ids"','class="btn btn-primary mf436-find-ids mf558-find-ids"')
    .replace('class="mf434-id-lookup mf555-id-finder"','class="mf434-id-lookup mf555-id-finder mf558-id-finder"');
};

/* ---------- 5. Add to Logging header: themed "added" pill ---------- */
const mf558HeadBase=mf557HeadHtml;
mf557HeadHtml=function(){
  return String(mf558HeadBase.apply(this,arguments)).replace('class="mf557-added"','class="mf557-added mf558-added-pill"');
};

window.MediaFlowV558=Object.freeze({version:MF558_VERSION,compare:mf558CompareLibraryLike,
  idShort:mf558IdShort,idSelected:mf558IdSelectedCount,placeMinimize:mf558PlaceMinimize,stats:()=>({...MF558_STATS})});
MediaFlowRuntime.version=MF558_VERSION;
