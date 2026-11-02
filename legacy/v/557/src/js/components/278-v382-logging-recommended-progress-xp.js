/* MediaFlow v382 — recommended-title direct addition, Per Unit progress,
 * and theme-aware XP preview. Visual-only progress and XP read existing
 * canonical v369/v179 calculations; no saved progress/XP writes here.
 */
const V382_LOGGING_RELEASE=382;
function v382Icon(name,size=16){
  const paths={
    check:'<path d="m5 12 4 4L19 6"/><circle cx="12" cy="12" r="9"/>',
    plus:'<path d="M12 5v14M5 12h14"/><circle cx="12" cy="12" r="9"/>',
    sparkle:'<path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z"/><path d="m19 16 .7 1.7L21.5 18.5l-1.8.7-.7 1.8-.8-1.8-1.7-.7 1.7-.8.8-1.7Z"/>',
    shield:'<path d="M12 3 4 7v6c0 4.5 3.3 7.6 8 9 4.7-1.4 8-4.5 8-9V7l-8-4Z"/><path d="m9 12 2 2 4-4"/>'
  };
  return '<svg class="mf382-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="'+size+'" height="'+size+'" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[name]||paths.check)+'</svg>';
}
function v382RecommendedIsAdded(item){
  return !!(item&&S.logDraft?.entries?.some(e=>String(e?.libraryId||'')===String(item.id)));
}
// v253 invokes this renderer from the logging form. Track real draft inclusion,
// not an entryDraft.search selection which is cleared after adding the entry.
v253RecommendedLogCardHtml=function(item){
  if(!item)return '';
  const added=v382RecommendedIsAdded(item),cat=getCategory(item.categoryId);
  const progress=Number(item.total)>0?`${Number(item.progress)||0} / ${Number(item.total)}`:`Progress ${Number(item.progress)||0}`;
  const seasons=typeof v252Seasons==='function'?v252Seasons(item):[];
  const seasonText=seasons.length?` · ${seasons.length} seasons`:'';
  const cover=item.coverUrl?`<img src="${escapeHtml(item.coverUrl)}" alt="" loading="lazy" onerror="this.style.display='none'">`:`<span class="v253-rec-fallback">${v144CategoryIconHtml(cat)}</span>`;
  return `<section class="v253-log-recommended mf382-recommended ${added?'mf382-rec-added':''}" aria-label="Recommended title shortcut">
    <div class="v253-log-recommended-copy">${cover}<div><span class="v253-log-recommended-kicker">RECOMMENDED TITLE</span><b>${escapeHtml(cleanTitle(item.title))}</b><small>${escapeHtml(cat?.name||'Library')} · ${escapeHtml(progress+seasonText)}</small></div></div>
    <button type="button" class="btn btn-sm ${added?'btn-ghost mf382-recommended-confirm':'btn-primary mf382-recommended-action'}" onclick="App.v253UseRecommendedTitle()" aria-label="${added?'Find recommended title in added titles':'Add recommended title directly to Logging'}">${v382Icon(added?'check':'plus')}${added?'Recommended title added':'Use recommended title'}</button>
  </section>`;
};
App.v253UseRecommendedTitle=function(){
  const item=typeof v253RecommendedLogItem==='function'?v253RecommendedLogItem():null;
  if(!item){showToast('The recommended title is not available in your Library.');return false;}
  if(!S.logDraft){showToast('Open Logging to add the recommended title.');return false;}
  const id=String(item.id),already=v382RecommendedIsAdded(item);
  // Reopen the list before either adding or locating an existing entry.
  S.logDraft.v379HideAddedTitles=false;
  if(already){
    const entry=S.logDraft.entries.find(e=>String(e?.libraryId||'')===id);
    if(entry){entry.v369Collapsed=false;entry.v379QuickCollapsed=false;}
    if(typeof v369Touch==='function')v369Touch();
    render();
    showToast('Recommended title is already added to Logging.');
  }else{
    // v378QuickAdd supports BOTH Per Unit and Quick Logging, and protects
    // against duplicates; no XP or Library progress is awarded until submit.
    if(typeof App.v378QuickAdd!=='function'||!App.v378QuickAdd(id,{quiet:true})){
      showToast('Could not add the recommended title. Try again.');return false;
    }
    showToast('Recommended title added to '+(S.logDraft.v369Interface==='itemized'?'Advanced Logging':'Quick Logging')+'.');
  }
  // Only scroll the local selected-title row into view. Other draft entries,
  // timestamps, and manual order remain intact.
  requestAnimationFrame(()=>{
    const entryIndex=S.logDraft?.entries?.findIndex(e=>String(e?.libraryId||'')===id)??-1;
    const cards=document.querySelectorAll(S.logDraft?.v369Interface==='itemized'?'.log-form .v370-title':'.log-form .v239-logged-title-card');
    const card=entryIndex>=0?cards[entryIndex]:null;
    if(card&&typeof card.scrollIntoView==='function')card.scrollIntoView({behavior:'smooth',block:'nearest'});
  });
  return true;
};
// Keep public function available for existing inline v253 shortcut buttons.
v253UseRecommendedTitle=function(){return App.v253UseRecommendedTitle();};

function v382ProgressNumbers(item,entry){
  const safe=n=>Math.max(0,Number.isFinite(Number(n))?Math.floor(Number(n)):0);
  const seasons=typeof v252Seasons==='function'?v252Seasons(item):[];
  const current=seasons.length?seasons.reduce((n,s)=>n+safe(s.progress),0):safe(item.progress);
  const knownTotal=Number(item.total)>0?Math.floor(Number(item.total)):
    (seasons.length&&seasons.every(s=>Number(s.total)>0)?seasons.reduce((n,s)=>n+safe(s.total),0):null);
  const total=knownTotal>0?knownTotal:null;
  const projected=typeof v369ProjectedTitleProgress==='function'?safe(v369ProjectedTitleProgress(item,entry)):current;
  const future=Math.max(current,total!==null?Math.min(total,projected):projected);
  const unitCount=Array.isArray(entry?.v369Units)?entry.v369Units.length:0;
  return {current,future,total,unitCount,delta:Math.max(0,future-current)};
}
function v382ProgressBar(label,value,total,kind){
  const pct=total>0?Math.min(100,Math.max(0,(value/total)*100)):null;
  const name=kind==='future'?'Projected after logging':'Current saved Library progress';
  return `<div class="mf382-progress-line mf382-progress-${kind}" role="group" aria-label="${name}">
    <div class="mf382-progress-label"><span>${escapeHtml(label)}</span><strong>${value.toLocaleString()} <span class="mf382-progress-divider">/</span> ${total===null?'?':total.toLocaleString()}</strong></div>
    <div class="mf382-progress-track ${pct===null?'mf382-progress-unknown':''}" ${pct===null?'':'role="progressbar" aria-valuemin="0" aria-valuemax="'+total+'" aria-valuenow="'+Math.min(total,value)+'" aria-label="'+name+'"'}>
      ${pct!==null?`<span class="mf382-progress-fill" style="width:${pct.toFixed(2)}%"></span>`:''}
    </div>
  </div>`;
}
function v382ProgressHtml(item,entry){
  const p=v382ProgressNumbers(item,entry);
  const totalKnown=p.total!==null;
  const futurePct=totalKnown&&p.total>0?Math.min(100,Math.max(0,(p.future/p.total)*100)):null;
  const currentPct=totalKnown&&p.total>0?Math.min(100,Math.max(0,(p.current/p.total)*100)):null;
  const remaining=totalKnown?Math.max(0,p.total-p.future):null;
  const noun=(typeof v369UnitType==='function'?v369UnitType(item):'Unit').toLowerCase();
  return `<section class="mf382-progress-comparison mf395-progress-preview" aria-label="Current and projected title progress">
    <div class="mf382-progress-heading"><span>Progress preview</span><span class="mf382-progress-draft">+${p.unitCount.toLocaleString()} drafted ${p.unitCount===1?noun:noun+'s'}</span></div>
    <div class="mf395-progress-overview">
      <div class="mf395-progress-stat">
        <small>Current</small>
        <strong>${p.current.toLocaleString()}${totalKnown?` <span>/ ${p.total.toLocaleString()}</span>`:''}</strong>
      </div>
      <div class="mf395-progress-arrow" aria-hidden="true">→</div>
      <div class="mf395-progress-stat">
        <small>After draft</small>
        <strong>${p.future.toLocaleString()}${totalKnown?` <span>/ ${p.total.toLocaleString()}</span>`:''}</strong>
      </div>
      <div class="mf395-progress-gain">+${p.delta.toLocaleString()}</div>
    </div>
    <div class="mf395-progress-stack ${!totalKnown?'is-unknown':''}" ${totalKnown?`role="progressbar" aria-valuemin="0" aria-valuemax="${p.total}" aria-valuenow="${Math.min(p.total,p.future)}" aria-label="Projected progress after this draft"`:''}>
      ${totalKnown?`<span class="mf395-progress-segment is-current" style="width:${currentPct.toFixed(2)}%"></span><span class="mf395-progress-segment is-draft" style="left:${currentPct.toFixed(2)}%;width:${Math.max(0,futurePct-currentPct).toFixed(2)}%"></span>`:''}
    </div>
    <div class="mf395-progress-legend">
      <span><i class="is-current"></i>Already completed</span>
      <span><i class="is-draft"></i>Current draft</span>
      ${totalKnown?`<span><i class="is-remaining"></i>${remaining.toLocaleString()} ${remaining===1?noun:noun+'s'} remaining</span>`:`<span><i class="is-remaining"></i>Total unknown</span>`}
    </div>
    ${!totalKnown?'<p class="mf382-progress-note">Total unknown · MediaFlow shows your saved and projected progress without inventing a percentage.</p>':
      p.unitCount&&p.delta<p.unitCount?'<p class="mf382-progress-note">Only consecutive new units advance progress; repeats and gaps are not added to the projection.</p>':''}
  </section>`;
}
// v396: This renderer hook was inadvertently dropped during the v395
// unified-progress refactor. Its absence removed every progress preview.
// Preserve it in the ORIGINAL rendering chain (before v394 per-title tabs),
// so both collapsed and expanded cards display the same live projection.
const v382TitlePanelBase=v370TitlePanelHtml;
v370TitlePanelHtml=function(entry,index,forceExpanded=false){
  const raw=String(v382TitlePanelBase.apply(this,arguments)||'');
  if(S.logDraft?.v369Interface!=='itemized')return raw;
  const item=v369ItemTitle(entry);if(!item)return raw;
  const host=document.createElement('div');host.innerHTML=raw;
  const info=host.querySelector('.v370-title-info');
  if(info)info.insertAdjacentHTML('beforeend',v382ProgressHtml(item,entry));
  return host.innerHTML;
};
function v382XPCardMarkup(x){
  // v538: use the current unified reward model at the SHARED renderer source.
  // Avoid relying solely on an end-of-bundle function reassignment.
  if(typeof mf537XPCardMarkup==='function')return mf537XPCardMarkup();
  if(x==null)x=estimateCurrentLogXP();
  const number=(v)=>Number.isFinite(Number(v))?Number(v):0;
  const award=Math.max(0,number(x?.xp)),base=Math.max(0,number(x?.base));
  const rotation=Number.isFinite(Number(x?.multiplier))?Number(x.multiplier):1;
  const streakMultiplier=Number.isFinite(Number(x?.streakMultiplier))?Number(x.streakMultiplier):1;
  const days=Math.max(0,Math.floor(number(x?.streak)));
  const label=String(x?.label||'Normal rotation');
  return `<div class="mf382-xp-card" role="group" aria-label="Estimated XP for this log">
    <div class="mf382-xp-overview"><span class="mf382-xp-symbol">${v382Icon('sparkle',21)}</span><div class="mf382-xp-intro"><span class="mf382-xp-kicker">ESTIMATED REWARD</span><span class="mf382-xp-title">XP for this log</span></div><strong class="mf382-xp-earned">+${Math.round(award).toLocaleString()}<small>XP</small></strong></div>
    <div class="mf382-xp-breakdown" aria-label="XP breakdown"><span><small>Base</small><strong>${base.toLocaleString()} XP</strong></span><span><small>Rotation</small><strong>×${rotation.toFixed(2).replace(/\.00$/,'')}</strong></span><span><small>Streak</small><strong>×${streakMultiplier.toFixed(2)}</strong></span><span><small>Days</small><strong>${days.toLocaleString()}d</strong></span></div>
    <div class="mf382-xp-caption">${escapeHtml(label)} · Preview only — XP is awarded when your log is submitted.</div>
  </div>`;
}
function v382UpdateXPPreview(){
  const el=document.getElementById('xp-preview');if(!el)return;
  el.classList.add('mf382-xp-host');el.removeAttribute('style');
  try{el.innerHTML=v382XPCardMarkup();}
  catch(error){
    console.warn('XP reward preview unavailable',error);
    el.innerHTML='<div class="mf537-preview-error" role="status">XP preview could not be calculated. Your saved XP is unaffected. Retry after checking the Logging draft.</div>';
  }
}
const v382RefreshXPBase=refreshXPPreview;
refreshXPPreview=function(){
  // v541: the legacy consumption-only estimator is not an input to the
  // unified preview. A failure in legacy UI refresh must never hide the
  // independent, source-shared Respect + consumption projection.
  let out;
  try{out=v382RefreshXPBase.apply(this,arguments);}
  catch(error){console.warn('Legacy XP UI refresh failed; attempting unified projection',error);}
  v382UpdateXPPreview();
  return out;
};
const v382RenderBase=renderLogForm;
renderLogForm=function(){
  const raw=String(v382RenderBase.apply(this,arguments)||'');
  if(!S.logDraft)return raw;
  const host=document.createElement('div');host.innerHTML=raw;
  const xp=host.querySelector('#xp-preview');
  if(xp){xp.classList.add('mf382-xp-host');xp.removeAttribute('style');
    try{xp.innerHTML=v382XPCardMarkup();}
    catch(error){
      console.warn('XP reward preview rendering failed',error);
      xp.innerHTML='<div class="mf537-preview-error" role="status">The XP preview is temporarily unavailable. No XP has been awarded.</div>';
    }}
  return host.innerHTML;
};
window.MediaFlowV382={version:382,feature:'recommended logging direct add, Per Unit progress, XP summary'};
MediaFlowRuntime.version=V382_LOGGING_RELEASE;
