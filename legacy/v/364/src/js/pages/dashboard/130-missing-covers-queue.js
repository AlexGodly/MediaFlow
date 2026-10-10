/* ---------- Missing Covers queue ---------- */
let V192_MISSING_COVER_QUEUE=[];
let V192_MISSING_COVER_QUEUE_LOADED=false;

function v192MissingCoverStorageKey(){
  return `mf_missing_cover_queue_v192_${String(AUTH_USER?.id||'local')}`;
}
function v192LoadMissingCoverQueue(){
  if(V192_MISSING_COVER_QUEUE_LOADED)return;
  V192_MISSING_COVER_QUEUE_LOADED=true;
  try{
    const raw=localStorage.getItem(v192MissingCoverStorageKey());
    const parsed=raw?JSON.parse(raw):[];
    V192_MISSING_COVER_QUEUE=Array.isArray(parsed)?parsed.map(String).filter(Boolean):[];
  }catch(_){V192_MISSING_COVER_QUEUE=[];}
}
function v192SaveMissingCoverQueue(){
  try{localStorage.setItem(v192MissingCoverStorageKey(),JSON.stringify(V192_MISSING_COVER_QUEUE));}catch(_){}
}
function v192MissingCoverItems(){
  return (S.library||[]).filter(item=>item?.id&&!String(item.coverUrl||'').trim());
}
function v192SyncMissingCoverQueue(){
  v192LoadMissingCoverQueue();
  const missing=v192MissingCoverItems();
  const valid=new Set(missing.map(item=>String(item.id)));
  V192_MISSING_COVER_QUEUE=V192_MISSING_COVER_QUEUE.map(String).filter(id=>valid.has(id));
  const present=new Set(V192_MISSING_COVER_QUEUE);
  for(const item of missing){
    const id=String(item.id);
    if(!present.has(id)){
      V192_MISSING_COVER_QUEUE.push(id);
      present.add(id);
    }
  }
  v192SaveMissingCoverQueue();
  return missing;
}
function v192CurrentMissingCoverItem(){
  v192SyncMissingCoverQueue();
  const id=V192_MISSING_COVER_QUEUE[0];
  return id?(S.library||[]).find(item=>String(item?.id||'')===String(id)):null;
}
function v192MissingCoversHtml(){
  const missing=v192SyncMissingCoverQueue();
  if(!(S.library||[]).length){
    return `<div class="card v123-rating-queue v192-missing-covers"><div class="section-label">MISSING COVERS</div><div class="v123-rating-done"><b>No Library titles yet</b><span>Add titles to your Library and titles without cover URLs will appear here.</span></div></div>`;
  }
  if(!missing.length){
    return `<div class="card v123-rating-queue v192-missing-covers"><div class="section-label">MISSING COVERS</div><div class="v123-rating-done"><b>Every Library title has a cover ✓</b><span>If a cover URL is removed later, that title will automatically appear here.</span></div></div>`;
  }
  const item=v192CurrentMissingCoverItem();
  if(!item)return '';
  const cat=getCategory(item.categoryId);
  const progress=item.total!=null
    ? `${Number(item.progress)||0}/${Number(item.total)||0}`
    : `${Number(item.progress)||0} ${unitLabel(cat?.unit||'units',Number(item.progress)||0)}`;
  return `<div class="card v123-rating-queue v192-missing-covers">
    <div class="v123-rating-head">
      <div><div class="section-label">MISSING COVERS</div><div class="v192-missing-sub">Add cover URLs to titles that currently have no artwork.</div></div>
      <div class="v123-rating-count">${missing.length.toLocaleString()} title${missing.length===1?'':'s'} without covers</div>
    </div>
    <div class="v123-rating-main">
      <button type="button" class="v123-rating-placeholder v186-rating-placeholder-button v192-cover-placeholder" title="Open title details" onclick="event.preventDefault();event.stopPropagation();App.v181OpenTitleDetails('${escapeHtml(String(item.id))}')">${v144CategoryIconHtml(cat)}</button>
      <div class="v123-rating-copy">
        <div class="v123-rating-title">${escapeHtml(cleanTitle(item.title))}</div>
        <div class="v123-rating-meta">${v144CategoryIconHtml(cat)} ${escapeHtml(cat?.name||'Library')} · ${escapeHtml(v123StatusLabel(item.status))} · ${escapeHtml(progress)}</div>
        <div class="v192-cover-control">
          <div class="field v192-cover-url-field"><label class="field-label">COVER URL</label><input id="v192-cover-url-input" type="url" placeholder="Paste cover image URL" onkeydown="if(event.key==='Enter'){event.preventDefault();App.v192SaveMissingCover()}"></div>
          <div class="v123-rating-actions v192-cover-actions">
            <button type="button" class="btn btn-ghost" onclick="App.openLibraryModal('${escapeHtml(String(item.id))}')">Edit title</button>
            <button type="button" class="btn btn-ghost" onclick="App.v192SkipMissingCover()">Skip</button>
            <button type="button" class="btn btn-primary" onclick="App.v192SaveMissingCover()">Save cover & Next</button>
          </div>
        </div>
        <div class="v123-rating-xp">Paste a cover URL directly here, or use Edit title for MediaFlow's full cover search/editor. Skip moves this title behind the rest of the missing-cover queue.</div>
      </div>
    </div>
  </div>`;
}
function v192SkipMissingCover(){
  v192SyncMissingCoverQueue();
  if(!V192_MISSING_COVER_QUEUE.length)return;
  const first=V192_MISSING_COVER_QUEUE.shift();
  V192_MISSING_COVER_QUEUE.push(first);
  v192SaveMissingCoverQueue();
  render();
  showToast(V192_MISSING_COVER_QUEUE.length>1?'Skipped for now · this title will return after the rest of the queue':'Skipped · this is the only title without a cover');
}
function v192SaveMissingCover(){
  const item=v192CurrentMissingCoverItem();
  if(!item)return;
  const input=document.getElementById('v192-cover-url-input');
  const cover=String(input?.value||'').trim();
  if(!cover){
    showToast('Paste a cover URL first.');
    try{input?.focus();}catch(_){}
    return;
  }
  const oldCover=String(item.coverUrl||'').trim();
  const beforeXP=mediaFlowXP();
  mfBegin('Add cover',cleanTitle(item.title));
  item.coverUrl=cover;
  item.coverSource='manual';
  item.modifiedAt=Date.now();
  if(typeof V178_EDITABLE_RICH_FIELDS!=='undefined'&&V178_EDITABLE_RICH_FIELDS.includes('coverUrl')){
    item.richMetadataManual=typeof v178ManualMap==='function'?v178ManualMap(item):(item.richMetadataManual||{});
    item.richMetadataManual.coverUrl=true;
  }
  if(cover!==oldCover){
    try{v44AwardEditXP(item.id);}catch(_){}
    try{v44AwardManualCoverXP(item.id);}catch(_){}
  }
  mfCommit('Add cover',`${cleanTitle(item.title)} · manual cover URL`);
  V192_MISSING_COVER_QUEUE=V192_MISSING_COVER_QUEUE.filter(id=>String(id)!==String(item.id));
  v192SaveMissingCoverQueue();
  try{v53InvalidateLibraryCache();}catch(_){}
  persistLibrary();
  const gained=Math.max(0,Math.round(mediaFlowXP()-beforeXP));
  render();
  showToast(`Cover saved${gained?` · +${gained.toLocaleString()} XP`:''} ✓`);
}
Object.assign(App,{v192SkipMissingCover,v192SaveMissingCover});

/* Rate Your Library visibility uses the existing queue without altering it. */
const v192RatingQueueHtmlBase=v123RatingQueueHtml;
v123RatingQueueHtml=function(){
  const cfg=v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);
  return cfg.showRatingQueue===false?'':v192RatingQueueHtmlBase.apply(this,arguments);
};

/* Existing stopwatchHtml already ends with Rate Your Library, so append the new
   Missing Covers card here to keep it directly underneath the rating section. */
const v192StopwatchHtmlBase=stopwatchHtml;
stopwatchHtml=function(){
  let h=v192StopwatchHtmlBase.apply(this,arguments);
  const cfg=v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);
  if(cfg.showMissingCovers!==false)h+=v192MissingCoversHtml();
  return h;
};

/* Today's Balance is rendered by the original Dashboard renderer. Remove only
   that section when disabled, leaving the rest of Dashboard untouched. */
const v192RenderDashboardBase=renderDashboard;
renderDashboard=function(){
  const html=v192RenderDashboardBase.apply(this,arguments);
  const cfg=v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);
  if(cfg.showTodayBalance!==false)return html;
  const host=document.createElement('div');
  host.innerHTML=html;
  const label=[...host.querySelectorAll('.section-label')].find(el=>String(el.textContent||'').trim().toUpperCase()==="TODAY'S BALANCE");
  if(label){
    const head=label.parentElement;
    const next=head?.nextElementSibling;
    if(next?.classList?.contains('card'))next.remove();
    head?.remove();
  }
  return host.innerHTML;
};

