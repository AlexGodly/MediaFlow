/* MediaFlow v419 — shared missing cover surface, recommendation insights,
   Personal Order/Collection queue context, Logging workspace and sidebar polish.
   All ranks, reasons, counts and covers are derived from canonical state.
   No Library item, title cover URL, order or Collection membership is modified. */
const MF419_VERSION=419;
const MF419_LOGGING_SIZE_KEY='v419LoggingRecommend';
V181_COVER_SIZE_DEFAULTS[MF419_LOGGING_SIZE_KEY]=100;
V181_COVER_LABELS.recommended='Dashboard · MediaFlow Recommends cover';
V181_COVER_LABELS[MF419_LOGGING_SIZE_KEY]='Logging · Use Recommended Title cover';
v181EnsureCoverSizes(DEFAULT_SETTINGS);
v181EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);
function mf419ApplyRecCoverVars(value){
  const v=value===undefined?v181CoverSize(MF419_LOGGING_SIZE_KEY):v181ClampCoverSize(value,100);
  document.documentElement.style.setProperty('--mf419-log-rec-scale',String(v/100));
}
const mf419ApplyCoverVarsBase=v181ApplyCoverVars;
v181ApplyCoverVars=function(){const result=mf419ApplyCoverVarsBase.apply(this,arguments);mf419ApplyRecCoverVars();return result;};
const mf419PreviewCoverBase=App.v181PreviewCoverSize;
App.v181PreviewCoverSize=function(kind,value){const result=mf419PreviewCoverBase.apply(this,arguments);if(kind===MF419_LOGGING_SIZE_KEY)mf419ApplyRecCoverVars(value);return result;};
mf419ApplyRecCoverVars();

function mf419Icon(name,size=17){
  const shapes={sparkle:'<path d="m12 2 2.1 7.9L22 12l-7.9 2.1L12 22l-2.1-7.9L2 12l7.9-2.1Z"/>',queue:'<path d="M5 5h14M5 10h14M5 15h9M5 20h5"/><path d="m17 15 3 3-3 3"/>',folder:'<path d="M3 7h6l2 2h10v11H3Z"/>',star:'<path d="m12 2 3.2 6.5 7.2 1-5.2 5 .9 7-6.1-3.4-6.1 3.4.9-7-5.2-5 7.2-1Z"/>',check:'<path d="m5 12 5 5L20 7"/>',progress:'<path d="M4 18h16M4 15l5-6 4 3 7-8"/>',flame:'<path d="M12 22c-5 0-8-3-8-8 0-4 4-8 5-11 .5 3 4 4 4 8 2-1 3-3 3-5 7 7 7 16-4 16Z"/>',layers:'<path d="m12 2 9 5-9 5-9-5Z M3 12l9 5 9-5 M3 17l9 5 9-5"/>',eye:'<path d="M2 12c3-5 7-7 10-7s7 2 10 7c-3 5-7 7-10 7S5 17 2 12Z"/><circle cx="12" cy="12" r="3"/>',up:'<path d="m5 14 7-7 7 7M12 7v14M4 3h16"/>',chevron:'<path d="m6 9 6 6 6-6"/>'};
  return `<svg class="mf419-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shapes[name]||shapes.sparkle}</svg>`;
}
function mf419MissingCoverHtml(item,classname=''){
  const source=v200TitleCoverSource(item),cat=getCategory(item?.categoryId),color=escapeHtml(cat?.color||'var(--flow)');
  const fallback=`<span class="mf419-cover-fallback" role="img" aria-label="Missing cover for ${escapeHtml(cleanTitle(item?.title||'title'))}" style="--mf419-category-color:${color};${source.url?'display:none;':''}">${cat?v144CategoryIconHtml(cat):mf419Icon('layers',26)}</span>`;
  return `<span class="mf419-cover-art ${classname}" data-mf419-cover-source="${source.type}">${source.url?`<img src="${escapeHtml(source.url)}" alt="${escapeHtml(cleanTitle(item?.title||'title'))} cover" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">`:''}${fallback}</span>`;
}
function mf419StatusHtml(item,cat){
  const stat=String(item?.status||'planned');const statusName=typeof v274StatusLabel==='function'?v274StatusLabel(stat):stat;
  const icon=typeof v229StatusChoiceIcon==='function'?v229StatusChoiceIcon(stat):mf419Icon('check');
  return `<div class="mf419-rec-chips"><span class="mf419-meta-chip">${cat?v144CategoryIconHtml(cat):mf419Icon('layers')}<span>${escapeHtml(cat?.name||'Library')}</span></span><span class="mf419-meta-chip">${icon}<span>${escapeHtml(statusName)}</span></span>${item?.priority?`<span class="mf419-meta-chip mf419-priority">${mf419Icon('sparkle')} ${escapeHtml(String(item.priority))} priority</span>`:''}</div>`;
}
function mf419CategoryRemaining(cat){
  let remaining=0,unknown=0;
  for(const item of S.library||[]){
    if(!item||String(item.categoryId)!==String(cat?.id))continue;
    const p=typeof mf395DashboardProgress==='function'?mf395DashboardProgress(item):{current:Math.max(0,Number(item.progress)||0),total:Number(item.total)||null};
    if(p.total==null){unknown++;continue;}
    remaining+=Math.max(0,p.total-p.current);
  }
  return {remaining,unknown};
}
function mf419FreshRemaining(cat){
  if(typeof v401IsSeasonal!=='function'||!v401IsSeasonal(cat) ||
     (typeof v401AutomaticEnabled==='function'&&!v401AutomaticEnabled()) ||
     (typeof v380Mode==='function'&&v380Mode()==='manual'))return null;
  let fresh=0,unknown=0;
  for(const item of S.library||[]){
    if(!item||String(item.categoryId)!==String(cat.id))continue;
    const state=typeof v401EpisodeOutcome==='function'?v401EpisodeOutcome(item):'unknown';
    if(state==='unknown'){unknown++;continue;}
    if(state==='fresh'){
      const entry=S.settings?.v377JikanLedger?.[String(item.id)];
      fresh+=Math.max(0,(Number(entry?.available)||0)-(Number(item.progress)||0));
    }
  }
  return {fresh,unknown};
}
function mf419CollectionMembership(item){
  const id=String(item?.id||'');if(!id)return [];
  return v287Collections().filter(c=>v287CollectionTitleIds(c).some(x=>String(x)===id)).map(c=>({collection:c,position:v287CollectionTitleIds(c).indexOf(id)+1}));
}
/* A Personal Order token is a queue slot. Collection slots expand in their
   canonical Collection title order. The resulting rank is a title's position,
   not the Collection slot index repeated for every nested title. */
function mf419OrderContext(item){
  const id=String(item?.id||'');if(!id)return [];
  const plan=v287EnsureOrderExtensions(),assignments=v287Assignments();
  const categories=[...(plan.categoryOrder||[]),...(S.categories||[]).map(c=>String(c.id||''))];
  const seenCats=new Set(),out=[];let queuePosition=0,overallSlot=0;
  for(const rawCid of categories){
    const cid=String(rawCid||'');if(!cid||seenCats.has(cid))continue;seenCats.add(cid);
    const queue=v287Queue(cid);let categorySlot=0;
    for(const token of queue){
      categorySlot++;overallSlot++;
      if(token.startsWith('t:')){
        const title=v287LibraryItem(token.slice(2));if(!title)continue;
        queuePosition++;
        if(String(title.id)===id)out.push({kind:'title',queueRank:queuePosition,overallRank:overallSlot,categoryRank:categorySlot,categoryId:cid});
      }else if(token.startsWith('c:')){
        const a=assignments.find(x=>String(x.id)===token.slice(2));if(!a)continue;
        const c=v287Collection(a.collectionId);if(!c)continue;
        const ids=v287CollectionTitleIds(c);
        for(let j=0;j<ids.length;j++){
          const title=v287LibraryItem(ids[j]);if(!title)continue;
          if(a.categoryRule==='match'&&String(title.categoryId)!==cid)continue;
          if(a.completedRule==='skip'&&v287IsCompleted(title))continue;
          queuePosition++;
          if(String(title.id)===id)out.push({kind:'collection',collection:c,queueRank:queuePosition,overallRank:overallSlot,categoryRank:categorySlot,titleRank:j+1,categoryId:cid});
        }
      }
    }
  }
  return out;
}
function mf419OrderInfoHtml(item){
  const paths=mf419OrderContext(item);
  if(!paths.length)return '';
  const primary=paths[0],category=getCategory(primary.categoryId);
  return `<section class="mf419-insight-group mf419-order-group" aria-label="Personal Order queue ranking"><div class="mf419-group-title">${mf419Icon('queue',20)}<strong>Your queue position</strong></div><div class="mf419-queue-top"><span class="mf419-queue-number">#${primary.queueRank}</span><div><b>Overall queue position</b><small>${escapeHtml(primary.kind==='collection'?primary.collection.title:'Directly in Personal Order')}</small></div></div><div class="mf419-mini-facts"><span>${mf419Icon('queue')} Category slot <b>#${primary.categoryRank}</b></span><span>${mf419Icon('layers')} Overall slot <b>#${primary.overallRank}</b></span>${primary.kind==='collection'?`<span>${mf419Icon('folder')} Title within Collection <b>#${primary.titleRank}</b></span>`:''}</div>${paths.length>1?`<details class="mf419-extra-queues"><summary>${paths.length-1} other Personal Order path${paths.length===2?'':'s'}</summary>${paths.slice(1).map(p=>`<div>Queue #${p.queueRank} · ${escapeHtml(p.collection?.title||getCategory(p.categoryId)?.name||'Direct title')} · Slot #${p.overallRank}</div>`).join('')}</details>`:''}</section>`;
}
function mf419RelatedCollectionsHtml(item){
  const memberships=mf419CollectionMembership(item);if(!memberships.length)return '';
  const order=mf419OrderContext(item);
  const rows=memberships.map(m=>{
    const cid=String(m.collection.id),id=encodeURIComponent(cid),paths=order.filter(p=>p.collection&&String(p.collection.id)===cid);
    const c=m.collection,rank=paths[0];
    return `<div class="mf419-related-row"><span class="mf419-related-folder">${mf419Icon('folder',20)}</span><div class="mf419-related-text"><strong>${escapeHtml(c.title)}</strong><small>${v287CollectionTitleIds(c).length.toLocaleString()} titles · This title is #${m.position}${rank?' · Personal Order slot #'+rank.overallRank:''}</small></div><button type="button" class="btn btn-sm" onclick="App.v274OpenCollection(decodeURIComponent('${id}'))">${mf419Icon('folder',15)} Open</button></div>`;
  }).join('');
  return `<details class="mf419-related" data-mf419-related><summary>${mf419Icon('folder',20)}<strong>Appears in Collections</strong><span class="mf419-related-count">${memberships.length}</span>${mf419Icon('chevron')}</summary><div class="mf419-related-content">${rows}</div></details>`;
}
function mf419RatingHtml(item){
  const rating=Number(item?.rating);
  if(!Number.isFinite(rating)||rating<=0)return '';
  const maximum=Math.max(10,Number(S.settings?.ratingMax)||10);
  return `<span class="mf419-rating" title="Your saved rating">${mf419Icon('star')} <b>${escapeHtml(String(rating))}</b><small>/ ${maximum}</small></span>`;
}
function mf419ReasonsHtml(task){
  const reasons=Array.isArray(task?.reasons)?task.reasons.filter(Boolean):[];
  if(!reasons.length)return `<div class="mf419-reason">${mf419Icon('sparkle')}<span>Selected by your current MediaFlow recommendation rules.</span></div>`;
  return reasons.map((reason,i)=>`<div class="mf419-reason">${mf419Icon(i===0?'sparkle':i%2?'progress':'queue')}<span>${escapeHtml(String(reason))}</span></div>`).join('');
}
/* Override the actual v395 recommendation renderer (the older v50 hero is
   no longer used). We deliberately retain the existing action handlers. */
mf395DashboardRecommendationHtml=function(task,cat){
  if(!S.settings?.exactTitleRecommendations)return `<div class="hero-note">You choose the titles — pick whatever you're in the mood for.</div>`;
  if(!task?.title)return `<div class="hero-note">No eligible title found in this category. Add one to your Library.</div>`;
  const item=mf395DashboardRecommendedItem(task),p=item?mf395DashboardProgress(item):null;
  const history=typeof v180EnsureRecommendationHistory==='function'?v180EnsureRecommendationHistory(task):[];
  const rerolls=Math.max(0,(history?.length||0)-1);
  const unit=String(cat?.unit||'units'),total=mf419CategoryRemaining(cat),fresh=mf419FreshRemaining(cat);
  const cover=item?mf419MissingCoverHtml(item,'mf419-dashboard-cover'):`<span class="mf419-cover-art mf419-dashboard-cover"><span class="mf419-cover-fallback">${cat?v144CategoryIconHtml(cat):mf419Icon('layers',30)}</span></span>`;
  const progress=p?`<section class="mf419-insight-group mf419-progress-section"><div class="mf419-section-label">${mf419Icon('progress')} <strong>Title progress</strong><b>${p.total?Math.round(p.pct)+'%':'Total unknown'}</b></div><div class="mf419-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p.total?Math.round(p.pct):0}"><span style="width:${p.total?p.pct:0}%"></span></div><div class="mf419-progress-numbers"><span><b>${p.current.toLocaleString()}</b> ${escapeHtml(unit)} logged</span><span>${p.total?`<b>${p.remaining.toLocaleString()}</b> remaining of ${p.total.toLocaleString()}`:'Add a total to calculate remaining units'}</span></div></section>`:'';
  const stats=`<div class="mf419-category-stats"><section class="mf419-stat"><span>${mf419Icon('layers')} Category remaining</span><strong>${total.remaining.toLocaleString()}</strong><small>${escapeHtml(unit)}${total.unknown?' · '+total.unknown+' titles with unknown totals':''}</small></section>${fresh?`<section class="mf419-stat"><span>${mf419Icon('flame')} Verified fresh remaining</span><strong>${fresh.fresh.toLocaleString()}</strong><small>${escapeHtml(unit)}${fresh.unknown?' · '+fresh.unknown+' titles awaiting verification':''}</small></section>`:''}</div>`;
  const actions=`<div class="mf419-recommend-actions">${item?.id?`<button type="button" class="btn btn-sm btn-ghost" onclick="App.v174EditRecommendedTitle()">Edit title</button>`:''}<button type="button" class="btn btn-sm" onclick="App.v180RerollRecommendedTitle()">Reroll title</button><button type="button" class="btn btn-sm btn-ghost" onclick="App.v180OpenRerollHistory()">Reroll history (${rerolls})</button></div>`;
  return `<section class="mf419-recommend-card" aria-label="MediaFlow Recommends 2.0"><div class="mf419-recommend-header"><span>${mf419Icon('sparkle',20)} MEDIAFLOW RECOMMENDS</span><span class="mf419-recommend-pill">PERSONALIZED PICK</span></div><div class="mf419-recommend-main"><div class="mf419-recommend-cover">${cover}</div><div class="mf419-recommend-intro"><h3>${escapeHtml(task.title)}</h3>${mf419StatusHtml(item,cat)}<div class="mf419-highlight-row">${item?mf419RatingHtml(item):''}</div><p>Here's why this title deserves a spot in your next session.</p></div></div>${progress}${stats}${item?mf419OrderInfoHtml(item):''}<section class="mf419-insight-group mf419-reasons"><div class="mf419-group-title">${mf419Icon('sparkle',20)}<strong>Why this title?</strong></div><div class="mf419-reasons-grid">${mf419ReasonsHtml(task)}</div></section>${item?mf419RelatedCollectionsHtml(item):''}${actions}</section>`;
};

/* Logging: render the same source for the small recommended cover, and
   preserve the direct-add action, disabled/added states and draft metadata. */
v253RecommendedLogCardHtml=function(item){
  if(!item)return '';
  const added=v382RecommendedIsAdded(item),cat=getCategory(item.categoryId);
  const progress=Number(item.total)>0?`${Number(item.progress)||0} / ${Number(item.total)}`:`Progress ${Number(item.progress)||0}`;
  const seasons=typeof v252Seasons==='function'?v252Seasons(item):[];
  return `<section class="v253-log-recommended mf382-recommended mf419-log-recommended ${added?'mf382-rec-added':''}" aria-label="Recommended title shortcut"><div class="v253-log-recommended-copy">${mf419MissingCoverHtml(item,'mf419-log-rec-cover')}<div><span class="v253-log-recommended-kicker">RECOMMENDED TITLE</span><b>${escapeHtml(cleanTitle(item.title))}</b><small>${escapeHtml(cat?.name||'Library')} · ${escapeHtml(progress)}${seasons.length?' · '+seasons.length+' seasons':''}</small></div></div><button type="button" class="btn btn-sm ${added?'btn-ghost mf382-recommended-confirm':'btn-primary mf382-recommended-action'}" onclick="App.v253UseRecommendedTitle()">${v382Icon(added?'check':'plus')}${added?'Recommended title added':'Use recommended title'}</button></section>`;
};

/* In the v379 picker, mutate only thumbnail markup. Keep the existing search,
   filtering, checkbox, display, and quick-add handlers intact. */
const mf419LogSuggestionsBase=v224LogSuggestionsHtml;
v224LogSuggestionsHtml=function(){
  const html=String(mf419LogSuggestionsBase.apply(this,arguments)||'');
  const root=document.createElement('div');root.innerHTML=html;
  const candidates=logTitleCandidates(String(S.entryDraft?.title||'').trim());
  const rows=candidates.slice(V89_LOG.page*V89_LOG.pageSize,(V89_LOG.page+1)*V89_LOG.pageSize);
  root.querySelectorAll('.mf378-picker .log-suggestion').forEach((row,i)=>{
    const item=rows[i];if(!item)return;
    const result=row.querySelector('.v86-log-result');if(!result)return;
    result.querySelector('.v86-log-cover')?.remove();
    result.insertAdjacentHTML('afterbegin',mf419MissingCoverHtml(item,'mf419-logging-cover'));
  });
  return root.innerHTML;
};

/* Visibility-only collapsed Logging editor. The library picker and recommended
   shortcut remain accessible, and every draft input stays in the document. */
const mf419LogRenderBase=renderLogForm;
renderLogForm=function(){
  const html=String(mf419LogRenderBase.apply(this,arguments)||'');
  if(!S.logDraft)return html;
  const host=document.createElement('div');host.innerHTML=html;
  const form=host.querySelector('.log-form');if(!form)return html;
  const collapsed=S.settings?.v419LoggingCollapsed===true;
  const section=document.createElement('section');section.className='mf419-workspace';section.id='mf419-workspace';
  const control=document.createElement('button');control.type='button';control.className='mf419-workspace-toggle';control.setAttribute('aria-expanded',String(!collapsed));control.setAttribute('aria-controls','mf419-workspace-body');control.setAttribute('onclick','App.v419ToggleLoggingWorkspace()');
  const count=S.logDraft.entries?.length||0,units=(S.logDraft.entries||[]).reduce((n,e)=>n+(Array.isArray(e.v369Units)?e.v369Units.length:Math.max(0,Number(e.qty)||0)),0);
  control.innerHTML=`<span>${mf419Icon('progress',21)} <strong>Logging Workspace</strong><small>${count} title${count===1?'':'s'} · ${units} unit${units===1?'':'s'} staged</small></span><span>${collapsed?'Expand':'Collapse'} ${mf419Icon('chevron',16)}</span>`;
  const body=document.createElement('div');body.id='mf419-workspace-body';body.className='mf419-workspace-body';body.hidden=collapsed;
  const preserved=Array.from(form.children).filter(el=>el.matches('.v238-log-library, .v253-log-recommended'));
  const first=preserved[0]||form.firstElementChild;
  if(first)form.insertBefore(section,first);else form.append(section);
  section.append(control,body);
  for(const child of Array.from(form.children)){
    if(child===section||preserved.includes(child))continue;
    body.appendChild(child);
  }
  return host.innerHTML;
};
App.v419ToggleLoggingWorkspace=function(){
  const state=!(S.settings?.v419LoggingCollapsed===true);
  S.settings=S.settings||{};S.settings.v419LoggingCollapsed=state;
  const body=document.getElementById('mf419-workspace-body'),control=document.querySelector('.mf419-workspace-toggle');
  if(body)body.hidden=state;
  if(control){control.setAttribute('aria-expanded',String(!state));control.lastElementChild.innerHTML=`${state?'Expand':'Collapse'} ${mf419Icon('chevron',16)}`;}
  persistSettings();
};

/* Floating back-to-top only while Logging is actually open. Determine free
   space from the real existing dock rectangle, not a guessed CSS offset. */
let MF419_TOP_BOOTED=false;
function mf419LoggingScrollHost(){
  const root=document.querySelector('.log-form');
  let node=root?.parentElement;
  while(node&&node!==document.body){
    const style=getComputedStyle(node);
    if(/auto|scroll/.test(style.overflowY)&&node.scrollHeight>node.clientHeight+50)return node;
    node=node.parentElement;
  }
  return document.scrollingElement||document.documentElement;
}
function mf419EnhanceSidebar(){
  const footer=document.querySelector('.sidebar-foot');if(!footer)return;
  footer.classList.add('mf419-sidebar-hub');
  const level=footer.querySelector('.level-head');
  if(level&&!level.querySelector('.mf419-level-mark')){
    const mark=document.createElement('span');mark.className='mf419-level-mark';mark.innerHTML=mf419Icon('sparkle',18);
    mark.title='Your MediaFlow level';level.prepend(mark);
  }
  const account=footer.querySelector('.account-menu');if(account)account.setAttribute('aria-label','Account and profile');
}
function mf419UpdateTopButton(){
  if(!document.body)return;
  let btn=document.getElementById('mf419-back-to-logging');
  if(!btn){btn=document.createElement('button');btn.type='button';btn.id='mf419-back-to-logging';btn.className='mf419-back-to-logging';btn.title='Back to the top of Logging';btn.setAttribute('aria-label','Back to top of Logging');btn.innerHTML=mf419Icon('up',22);btn.addEventListener('click',()=>{const scroller=mf419LoggingScrollHost();const behavior=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth';if(scroller&&scroller!==document.documentElement&&scroller!==document.body)scroller.scrollTo({top:0,behavior});window.scrollTo({top:0,behavior});});document.body.appendChild(btn);}
  const scroller=mf419LoggingScrollHost();const depth=Math.max(window.scrollY,document.scrollingElement?.scrollTop||0,scroller?.scrollTop||0);
  const eligible=!!(S.logging&&document.querySelector('.log-form')) && depth>Math.max(320,window.innerHeight*.55);
  btn.hidden=!eligible;if(!eligible)return;
  const dock=document.getElementById('mf397-dock');let bottom=24;
  if(dock){const box=dock.getBoundingClientRect();if(box.width&&box.height&&box.top<innerHeight&&box.bottom>0)bottom=Math.max(bottom,innerHeight-box.top+16);}
  const mobile=window.matchMedia?.('(max-width:900px)').matches;
  bottom=Math.max(bottom,mobile?88:24);
  btn.style.bottom=Math.min(innerHeight-65,bottom)+'px';
  btn.style.right='max(16px, env(safe-area-inset-right))';
  btn.hidden=bottom>innerHeight-90;
}
function mf419BootTopButton(){
  if(MF419_TOP_BOOTED)return;MF419_TOP_BOOTED=true;
  window.addEventListener('scroll',mf419UpdateTopButton,{passive:true});
  document.addEventListener('scroll',mf419UpdateTopButton,{passive:true,capture:true});
  window.addEventListener('resize',mf419UpdateTopButton,{passive:true});
  document.addEventListener('click',()=>requestAnimationFrame(mf419UpdateTopButton));
  mf419UpdateTopButton();
}
const mf419RenderBase=render;
render=function(){const result=mf419RenderBase.apply(this,arguments);requestAnimationFrame(()=>{mf419BootTopButton();mf419EnhanceSidebar();mf419UpdateTopButton();});return result;};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mf419BootTopButton,{once:true});else mf419BootTopButton();

Object.assign(App,{v419ToggleLoggingWorkspace:App.v419ToggleLoggingWorkspace});
