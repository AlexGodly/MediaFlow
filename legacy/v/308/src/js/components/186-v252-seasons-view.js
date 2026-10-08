/* ============================================================
   MediaFlow v252 — Per-title Seasons View
   --------------------------------------------------------------------------
   - Optional per-title seasons with name/number/progress/total.
   - Title progress/total are derived from the season rows while Seasons View
     exists, so the aggregate Library counters cannot drift from season data.
   - Normal Last progress logging can switch between aggregate progress and a
     Season + Episode view. The season-local episode is translated into the
     title's aggregate final progress before the established logging pipeline
     runs, preserving repeat/rewatch, XP, History and scheduler behavior.
   - Imported services (especially Simkl) can populate season progress/totals
     when the source actually exposes that metadata.
   - Full Library state already lives inside cloud/full-backup/data-export
     payloads; v252 additionally normalizes/merges the season field explicitly.
   ============================================================ */
const V252_RUNTIME_VERSION=252;

function v252SeasonUid(){return `season-${uid()}`;}
function v252Num(value,fallback=0){const n=Number(value);return Number.isFinite(n)?Math.max(0,Math.round(n)):fallback;}
function v252SeasonNumberValue(value){
  if(value===null||value===undefined||String(value).trim()==='')return null;
  const n=Number(value);return Number.isFinite(n)?Math.max(0,Math.round(n)):null;
}
function v252SeasonLabel(season,index=0){
  const name=cleanTitle(String(season?.name||season?.title||'').trim());
  if(name)return name;
  const n=v252SeasonNumberValue(season?.number);
  if(n===0)return 'Specials';
  if(n!=null)return `Season ${n}`;
  return `Season ${index+1}`;
}
function v252NormalizeSeason(raw,index=0,source='manual'){
  const row=(raw&&typeof raw==='object')?raw:{};
  const number=v252SeasonNumberValue(row.number??row.season??row.season_number??row.seasonNumber);
  const explicitTotal=row.total??row.totalEpisodes??row.total_episodes??row.total_episodes_count??row.episodes_count??row.episode_count;
  const total=(explicitTotal===null||explicitTotal===undefined||String(explicitTotal).trim()==='')?null:v252Num(explicitTotal,0);
  let progress=v252Num(row.progress??row.watchedEpisodes??row.watched_episodes??row.watched_episodes_count??row.episodes_watched,0);
  if(total!=null&&total>0)progress=Math.min(progress,total);
  return {
    id:String(row.id||row.seasonId||row.season_id||v252SeasonUid()),
    number,
    name:v252SeasonLabel(Object.assign({},row,{number}),index),
    progress,
    total:total!=null&&total>0?total:(total===0?0:null),
    source:String(row.source||source||'manual'),
    manual:row.manual===true||String(row.source||source||'')==='manual',
    synthetic:row.synthetic===true
  };
}
function v252SortSeasons(rows){
  return rows.map((s,i)=>({s,i})).sort((a,b)=>{
    const an=a.s.number,bn=b.s.number;
    if(an==null&&bn==null)return a.i-b.i;
    if(an==null)return 1;if(bn==null)return -1;
    return an-bn||a.i-b.i;
  }).map(x=>x.s);
}
function v252NormalizeSeasons(raw,source='manual'){
  const list=Array.isArray(raw)?raw:[];
  const seen=new Set();
  const out=[];
  list.forEach((row,index)=>{
    const s=v252NormalizeSeason(row,index,source);
    let key=s.number!=null?`n:${s.number}`:`name:${String(s.name||'').toLowerCase()}`;
    if(seen.has(key))key=`${key}:${index}`;
    seen.add(key);out.push(s);
  });
  return v252SortSeasons(out);
}
function v252Seasons(item){return v252NormalizeSeasons(item?.seasons,item?.seasonSource||'manual');}
function v252HasSeasons(item){return v252Seasons(item).length>0;}
function v252SeasonAggregate(rows){
  const seasons=v252NormalizeSeasons(rows);
  let progress=0,total=0,knownTotals=0;
  for(const season of seasons){
    progress+=v252Num(season.progress,0);
    const t=season.total==null?0:v252Num(season.total,0);
    total+=t;if(t>0)knownTotals++;
  }
  return {progress,total:total>0?total:null,knownTotals,count:seasons.length};
}
function v252SyncTitleFromSeasons(item){
  if(!item)return item;
  const seasons=v252NormalizeSeasons(item.seasons,item.seasonSource||'manual');
  item.seasons=seasons;
  if(!seasons.length)return item;
  const a=v252SeasonAggregate(seasons);
  item.progress=a.progress;
  item.total=a.total;
  item.seasonViewEnabled=item.seasonViewEnabled!==false;
  item.seasonsModifiedAt=Math.max(Number(item.seasonsModifiedAt)||0,Number(item.modifiedAt)||0);
  return item;
}
function v252ReconcileImportedAggregate(seasons,progress,total,source){
  let rows=v252NormalizeSeasons(seasons,source);
  const a=v252SeasonAggregate(rows);
  const wantedProgress=v252Num(progress,0);
  const wantedTotal=(total==null||String(total).trim()==='')?null:v252Num(total,0);
  const missingProgress=Math.max(0,wantedProgress-a.progress);
  const missingTotal=wantedTotal==null?0:Math.max(0,wantedTotal-(a.total||0));
  if(missingProgress>0||missingTotal>0){
    rows.push(v252NormalizeSeason({
      id:`v252-unassigned-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      number:null,name:'Unassigned',progress:missingProgress,
      total:Math.max(missingTotal,missingProgress)||null,
      source,synthetic:true,manual:false
    },rows.length,source));
  }
  return v252SortSeasons(rows);
}
function v252SeasonOffset(item,seasonId){
  const seasons=v252Seasons(item);let offset=0;
  for(const season of seasons){
    if(String(season.id)===String(seasonId))break;
    offset+=season.total!=null&&Number(season.total)>0?Number(season.total):Number(season.progress)||0;
  }
  return Math.max(0,Math.round(offset));
}
function v252SeasonGlobalEnd(item,seasonId,localProgress){
  const season=v252Seasons(item).find(s=>String(s.id)===String(seasonId));
  if(!season)return v179ClampEndProgress(item,localProgress);
  let local=v252Num(localProgress,0);
  if(Number(season.total)>0)local=Math.min(local,Number(season.total));
  return v179ClampEndProgress(item,v252SeasonOffset(item,season.id)+local);
}
function v252SeasonForGlobalProgress(item,globalProgress){
  const seasons=v252Seasons(item);if(!seasons.length)return null;
  let left=Math.max(0,Number(globalProgress)||0),offset=0;
  for(let i=0;i<seasons.length;i++){
    const season=seasons[i];
    const span=Number(season.total)>0?Number(season.total):Math.max(Number(season.progress)||0,0);
    if(left<span || (left===span&&i===seasons.length-1))return {season,local:Math.min(left,span||left),offset,index:i};
    if(left===span&&i<seasons.length-1)return {season:seasons[i+1],local:0,offset:offset+span,index:i+1};
    left-=span;offset+=span;
  }
  const season=seasons[seasons.length-1];
  return {season,local:Number(season.total)>0?Number(season.total):Number(season.progress)||0,offset:v252SeasonOffset(item,season.id),index:seasons.length-1};
}
function v252DistributeAggregateProgress(item,aggregateProgress){
  if(!v252HasSeasons(item))return item;
  let remaining=Math.max(0,Number(aggregateProgress)||0);
  const seasons=v252Seasons(item);
  for(const season of seasons){
    const total=Number(season.total)>0?Number(season.total):null;
    if(total!=null){season.progress=Math.min(total,remaining);remaining=Math.max(0,remaining-total);}
    else {season.progress=remaining;remaining=0;}
  }
  if(remaining>0){
    let tail=seasons[seasons.length-1];
    if(!tail||Number(tail.total)>0){
      tail=v252NormalizeSeason({name:'Unassigned',progress:remaining,total:remaining,source:'derived',synthetic:true},seasons.length,'derived');
      seasons.push(tail);
    }else tail.progress+=remaining;
  }
  item.seasons=seasons;
  return v252SyncTitleFromSeasons(item);
}
function v252SeasonOptions(item,selectedId){
  return v252Seasons(item).map(s=>`<option value="${escapeHtml(String(s.id))}" ${String(s.id)===String(selectedId)?'selected':''}>${escapeHtml(s.name)}${s.total!=null?` · ${s.progress}/${s.total}`:` · ${s.progress}`}</option>`).join('');
}

/* ---------- Title editor ------------------------------------------------ */
function v252EditorSeasonRowHtml(season,index,prefix='v252-editor-season'){
  const s=v252NormalizeSeason(season,index,'manual');
  return `<div class="v252-season-editor-row" data-v252-season-row data-season-id="${escapeHtml(s.id)}">
    <div class="field v252-season-name"><label class="field-label">Season name</label><input type="text" data-v252-season-name value="${escapeHtml(s.name)}" placeholder="Season ${index+1}" oninput="App.v252EditorSyncAggregate()"></div>
    <div class="field v252-season-number"><label class="field-label">#</label><input type="number" min="0" step="1" data-v252-season-number value="${s.number??''}" placeholder="${index+1}" oninput="App.v252EditorSyncAggregate()"></div>
    <div class="field"><label class="field-label">Progress</label><input type="number" min="0" step="1" data-v252-season-progress value="${s.progress}" oninput="App.v252EditorSyncAggregate()"></div>
    <div class="field"><label class="field-label">Total</label><input type="number" min="0" step="1" data-v252-season-total value="${s.total??''}" oninput="App.v252EditorSyncAggregate()"></div>
    <button type="button" class="btn btn-sm btn-danger v252-season-remove" onclick="App.v252EditorRemoveSeason(this)">Remove</button>
  </div>`;
}
function v252SeasonEditorHtml(item){
  const seasons=v252Seasons(item);
  const a=v252SeasonAggregate(seasons);
  return `<section class="v252-seasons-editor" data-v252-seasons-editor>
    <div class="v252-seasons-editor-head"><div><div class="v252-season-kicker">SEASONS VIEW</div><b>Track progress by season</b><p>Optional per-title season metadata. While seasons exist, title Progress and Total are automatically calculated from the season rows.</p></div><div class="v252-season-summary" data-v252-editor-summary>${seasons.length?`${a.progress}${a.total!=null?` / ${a.total}`:''} · ${seasons.length} season${seasons.length===1?'':'s'}`:'Not configured'}</div></div>
    <div class="v252-season-editor-list" data-v252-season-list>${seasons.map((s,i)=>v252EditorSeasonRowHtml(s,i)).join('')}</div>
    <div class="v252-season-editor-actions"><button type="button" class="btn btn-sm" onclick="App.v252EditorAddSeason()">+ Add season</button>${seasons.length?'<span class="hint">Remove every row to disable Seasons View for this title.</span>':'<span class="hint">Adding the first season keeps existing aggregate progress safe as an Unassigned row when needed.</span>'}</div>
  </section>`;
}
function v252EditorRows(){return [...document.querySelectorAll('[data-v252-seasons-editor] [data-v252-season-row]')];}
function v252CaptureRowsFrom(root=document){
  return [...root.querySelectorAll('[data-v252-season-row]')].map((row,index)=>v252NormalizeSeason({
    id:row.dataset.seasonId||v252SeasonUid(),
    name:row.querySelector('[data-v252-season-name]')?.value||'',
    number:row.querySelector('[data-v252-season-number]')?.value||null,
    progress:row.querySelector('[data-v252-season-progress]')?.value||0,
    total:row.querySelector('[data-v252-season-total]')?.value||null,
    source:'manual',manual:true,synthetic:false
  },index,'manual'));
}
function v252EditorSyncAggregate(){
  const rows=v252EditorRows();const progress=document.getElementById('l-progress'),total=document.getElementById('l-total');
  if(!progress||!total)return;
  if(!rows.length){progress.readOnly=false;total.readOnly=false;progress.removeAttribute('aria-readonly');total.removeAttribute('aria-readonly');const s=document.querySelector('[data-v252-editor-summary]');if(s)s.textContent='Not configured';return;}
  const seasons=v252CaptureRowsFrom(document);const a=v252SeasonAggregate(seasons);
  progress.value=String(a.progress);total.value=a.total==null?'':String(a.total);progress.readOnly=true;total.readOnly=true;progress.setAttribute('aria-readonly','true');total.setAttribute('aria-readonly','true');
  const summary=document.querySelector('[data-v252-editor-summary]');if(summary)summary.textContent=`${a.progress}${a.total!=null?` / ${a.total}`:''} · ${seasons.length} season${seasons.length===1?'':'s'}`;
}
function v252EditorAddSeason(){
  const list=document.querySelector('[data-v252-season-list]');if(!list)return;
  let rows=v252EditorRows();
  if(!rows.length){
    const p=v252Num(document.getElementById('l-progress')?.value,0);const tRaw=String(document.getElementById('l-total')?.value||'').trim();const t=tRaw?v252Num(tRaw,0):null;
    if(p>0||Number(t)>0){list.insertAdjacentHTML('beforeend',v252EditorSeasonRowHtml({name:'Unassigned',number:null,progress:p,total:t,source:'manual',manual:true,synthetic:true},0));}
  }
  rows=v252EditorRows();const numbered=rows.map(r=>Number(r.querySelector('[data-v252-season-number]')?.value)).filter(Number.isFinite);const next=(numbered.length?Math.max(...numbered):0)+1;
  list.insertAdjacentHTML('beforeend',v252EditorSeasonRowHtml({number:next,name:`Season ${next}`,progress:0,total:null,source:'manual',manual:true},rows.length));
  v252EditorSyncAggregate();
}
function v252EditorRemoveSeason(button){button?.closest?.('[data-v252-season-row]')?.remove();v252EditorSyncAggregate();}

const v252LibraryModalHtmlBase=libraryModalHtml;
libraryModalHtml=function(d){
  const raw=v252LibraryModalHtmlBase.apply(this,arguments);
  try{
    const host=document.createElement('div');host.innerHTML=String(raw||'');
    const editor=host.querySelector('.v238-library-editor')||host;
    const anchor=editor.querySelector('.v82-repeat-panel')||editor.querySelector('.v178-rich-editor')||editor.querySelector('.modal-actions');
    if(anchor)anchor.insertAdjacentHTML('beforebegin',v252SeasonEditorHtml(d||{}));else editor.insertAdjacentHTML('beforeend',v252SeasonEditorHtml(d||{}));
    if(v252HasSeasons(d)){
      const p=host.querySelector('#l-progress'),t=host.querySelector('#l-total');if(p){p.readOnly=true;p.setAttribute('aria-readonly','true');}if(t){t.readOnly=true;t.setAttribute('aria-readonly','true');}
    }
    return host.innerHTML;
  }catch(_){return raw;}
};

const v252SaveLibraryModalBase=App.saveLibraryModal;
App.saveLibraryModal=function(id){
  const seasons=v252CaptureRowsFrom(document);const hadEditor=!!document.querySelector('[data-v252-seasons-editor]');
  const beforeIds=new Set((S.library||[]).map(x=>String(x?.id||'')));
  const result=v252SaveLibraryModalBase.apply(this,arguments);
  if(document.getElementById('l-title'))return result;
  if(!hadEditor)return result;
  let item=id?(S.library||[]).find(x=>String(x?.id||'')===String(id)):(S.library||[]).find(x=>!beforeIds.has(String(x?.id||'')))||(S.library||[])[(S.library||[]).length-1];
  if(!item)return result;
  if(seasons.length){item.seasons=v252NormalizeSeasons(seasons,'manual');item.seasonSource='manual';item.seasonViewEnabled=true;item.seasonsModifiedAt=Date.now();v252SyncTitleFromSeasons(item);}else{delete item.seasons;delete item.seasonSource;delete item.seasonViewEnabled;delete item.seasonsModifiedAt;}
  item.modifiedAt=Date.now();try{v53InvalidateLibraryCache();}catch(_){ }persistLibrary();render();return result;
};

/* ---------- Title Details + direct season manager ----------------------- */
function v252SeasonProgressHtml(season){
  const total=Number(season.total)>0?Number(season.total):null,progress=Number(season.progress)||0,pct=total?Math.min(100,Math.round(progress/total*100)):0;
  return `<div class="v252-season-detail-row"><div class="v252-season-detail-copy"><b>${escapeHtml(season.name)}</b><span>${progress}${total!=null?` / ${total}`:''}</span></div>${total?`<div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>`:''}</div>`;
}
function v252TitleDetailsSeasonsHtml(item){
  const seasons=v252Seasons(item);if(!seasons.length)return `<div class="v181-detail-section-label v252-details-season-label" style="margin-top:14px;">Seasons View</div><div class="v252-season-empty"><span>No seasons configured.</span><button type="button" class="btn btn-sm" onclick="App.v252OpenSeasonManager('${escapeHtml(String(item.id))}')">+ Add seasons</button></div>`;
  const a=v252SeasonAggregate(seasons);
  return `<div class="v181-detail-section-label v252-details-season-label" style="margin-top:14px;">Seasons View</div><section class="v252-title-seasons"><div class="v252-title-seasons-head"><div><b>${a.progress}${a.total!=null?` / ${a.total}`:''}</b><small>${seasons.length} season${seasons.length===1?'':'s'} · title progress is calculated from these rows</small></div><button type="button" class="btn btn-sm" onclick="App.v252OpenSeasonManager('${escapeHtml(String(item.id))}')">Edit seasons</button></div><div class="v252-title-season-list">${seasons.map(v252SeasonProgressHtml).join('')}</div></section>`;
}
const v252TitleDetailsHtmlBase=v181TitleDetailsHtml;
v181TitleDetailsHtml=function(item){
  let h=v252TitleDetailsHtmlBase.apply(this,arguments);const block=v252TitleDetailsSeasonsHtml(item);
  const marker='<div class="v181-detail-section-label" style="margin-top:14px;">Dates & source</div>';
  return h.includes(marker)?h.replace(marker,block+marker):h.replace('<div class="v181-detail-actions">',block+'<div class="v181-detail-actions">');
};
function v252SeasonManagerRowHtml(season,index){return v252EditorSeasonRowHtml(season,index,'v252-manager-season');}
function v252OpenSeasonManager(id){
  const item=(S.library||[]).find(x=>String(x?.id||'')===String(id));if(!item)return;
  document.getElementById('v252-season-manager-overlay')?.remove();const seasons=v252Seasons(item);
  document.body.insertAdjacentHTML('beforeend',`<div class="v181-quick-detail-overlay v252-season-manager-overlay" id="v252-season-manager-overlay" onclick="if(event.target===this)App.v252CloseSeasonManager()"><div class="v252-season-manager"><div class="v252-season-manager-head"><div><div class="v252-season-kicker">SEASONS VIEW</div><h3>${escapeHtml(cleanTitle(item.title))}</h3><p>Edit season totals and progress. Saving recalculates the title's main Progress and Total automatically.</p></div><button type="button" class="btn btn-sm btn-ghost" onclick="App.v252CloseSeasonManager()">Close</button></div><div class="v252-season-editor-list" data-v252-manager-list>${seasons.map(v252SeasonManagerRowHtml).join('')}</div><div class="v252-season-manager-actions"><button type="button" class="btn btn-sm" onclick="App.v252ManagerAddSeason('${escapeHtml(String(item.id))}')">+ Add season</button><div class="spacer"></div><button type="button" class="btn btn-ghost" onclick="App.v252CloseSeasonManager()">Cancel</button><button type="button" class="btn btn-primary" onclick="App.v252SaveSeasonManager('${escapeHtml(String(item.id))}')">Save seasons</button></div></div></div>`);
}
function v252CloseSeasonManager(){document.getElementById('v252-season-manager-overlay')?.remove();}
function v252ManagerAddSeason(id){
  const list=document.querySelector('[data-v252-manager-list]');const item=(S.library||[]).find(x=>String(x?.id||'')===String(id));if(!list||!item)return;
  let rows=[...list.querySelectorAll('[data-v252-season-row]')];
  if(!rows.length&&(Number(item.progress)>0||Number(item.total)>0))list.insertAdjacentHTML('beforeend',v252SeasonManagerRowHtml({name:'Unassigned',progress:Number(item.progress)||0,total:item.total??null,source:'manual',manual:true,synthetic:true},0));
  rows=[...list.querySelectorAll('[data-v252-season-row]')];const nums=rows.map(r=>Number(r.querySelector('[data-v252-season-number]')?.value)).filter(Number.isFinite);const next=(nums.length?Math.max(...nums):0)+1;
  list.insertAdjacentHTML('beforeend',v252SeasonManagerRowHtml({number:next,name:`Season ${next}`,progress:0,total:null,source:'manual',manual:true},rows.length));
}
function v252SaveSeasonManager(id){
  const item=(S.library||[]).find(x=>String(x?.id||'')===String(id));const root=document.getElementById('v252-season-manager-overlay');if(!item||!root)return;
  const rows=v252CaptureRowsFrom(root);if(rows.length){item.seasons=v252NormalizeSeasons(rows,'manual');item.seasonSource='manual';item.seasonViewEnabled=true;item.seasonsModifiedAt=Date.now();v252SyncTitleFromSeasons(item);}else{delete item.seasons;delete item.seasonSource;delete item.seasonViewEnabled;delete item.seasonsModifiedAt;}
  item.modifiedAt=Date.now();try{v44AwardEditXP(item.id);}catch(_){ }try{v53InvalidateLibraryCache();}catch(_){ }persistLibrary();v252CloseSeasonManager();render();setTimeout(()=>v181OpenTitleDetails(item.id),0);showToast('Seasons View saved.');
}
const v252QuickEditDetailBase=App.v181QuickEditDetail;
App.v181QuickEditDetail=function(id,key){
  const item=(S.library||[]).find(x=>String(x?.id||'')===String(id));
  if(item&&v252HasSeasons(item)&&(key==='progress'||key==='total')){v252OpenSeasonManager(id);return;}
  return v252QuickEditDetailBase.apply(this,arguments);
};

/* ---------- Last progress logging: aggregate <-> season-local ----------- */
function v252DefaultSeasonChoice(item,startProgress){
  const mapped=v252SeasonForGlobalProgress(item,startProgress);return mapped||{season:v252Seasons(item)[0],local:0,offset:0,index:0};
}
function v252InitEntryDraftSeason(item){
  if(!item||!v252HasSeasons(item))return;
  S.entryDraft=S.entryDraft||{};const start=v179StartProgress(item);const choice=v252DefaultSeasonChoice(item,start);
  S.entryDraft.v252UseSeasonView=S.entryDraft.v252UseSeasonView!==false;
  S.entryDraft.v252SeasonId=String(choice.season.id);S.entryDraft.v252SeasonEpisode=Math.max(0,Number(choice.local)||0)+1;
  if(Number(choice.season.total)>0)S.entryDraft.v252SeasonEpisode=Math.min(S.entryDraft.v252SeasonEpisode,Number(choice.season.total));
  S.entryDraft.endProgress=v252SeasonGlobalEnd(item,choice.season.id,S.entryDraft.v252SeasonEpisode);
}
function v252DraftSeasonControlsHtml(item){
  if(!item||!v252HasSeasons(item)||v179Mode('single')!=='progress')return '';
  if(S.entryDraft?.v252UseSeasonView===undefined)v252InitEntryDraftSeason(item);
  const use=S.entryDraft?.v252UseSeasonView!==false;let season=v252Seasons(item).find(s=>String(s.id)===String(S.entryDraft?.v252SeasonId));if(!season){season=v252Seasons(item)[0];S.entryDraft.v252SeasonId=season.id;}
  const local=Math.max(0,Number(S.entryDraft?.v252SeasonEpisode)||0);const start=v179StartProgress(item);const end=v252SeasonGlobalEnd(item,season.id,local);const qty=v179CalculatedQty(item,start,end);
  return `<div class="v252-log-season-box"><div class="v252-log-season-head"><div><b>Seasons View</b><small>Enter progress inside a season instead of the title-wide episode number.</small></div><button type="button" class="btn btn-sm ${use?'active':''}" onclick="App.v252ToggleEntryDraftSeasonView()">${use?'Using seasons':'Use seasons'}</button></div>${use?`<div class="v252-log-season-fields"><label><span>Season</span><select onchange="App.v252SetEntryDraftSeason(this.value)">${v252SeasonOptions(item,season.id)}</select></label><label><span>Last watched episode</span><input type="number" min="0" ${Number(season.total)>0?`max="${Number(season.total)}"`:''} step="1" value="${local}" onchange="App.v252SetEntryDraftSeasonEpisode(this.value)"></label><div class="v252-log-season-calc"><b>Title progress ${end}${Number(item.total)>0?` / ${Number(item.total)}`:''}</b><span>+${qty} ${escapeHtml(v179ProgressNoun(item,qty))}</span></div></div>`:''}</div>`;
}
function v252ToggleEntryDraftSeasonView(){S.entryDraft=S.entryDraft||{};S.entryDraft.v252UseSeasonView=!(S.entryDraft.v252UseSeasonView!==false);render();}
function v252SetEntryDraftSeason(id){
  const item=S.entryDraft?.libraryId?S.library.find(x=>String(x.id)===String(S.entryDraft.libraryId)):null;if(!item)return;
  const season=v252Seasons(item).find(s=>String(s.id)===String(id));if(!season)return;S.entryDraft.v252SeasonId=season.id;
  const start=v179StartProgress(item),mapped=v252SeasonForGlobalProgress(item,start);let local=(mapped&&String(mapped.season.id)===String(season.id))?mapped.local:0;
  S.entryDraft.v252SeasonEpisode=Math.min(Number(season.total)>0?Number(season.total):Number.MAX_SAFE_INTEGER,Math.max(0,local)+1);S.entryDraft.endProgress=v252SeasonGlobalEnd(item,season.id,S.entryDraft.v252SeasonEpisode);render();
}
function v252SetEntryDraftSeasonEpisode(value){
  const item=S.entryDraft?.libraryId?S.library.find(x=>String(x.id)===String(S.entryDraft.libraryId)):null;if(!item)return;S.entryDraft.v252SeasonEpisode=v252Num(value,0);S.entryDraft.endProgress=v252SeasonGlobalEnd(item,S.entryDraft.v252SeasonId,S.entryDraft.v252SeasonEpisode);render();
}

const v252RenderLogFormBase=renderLogForm;
renderLogForm=function(){
  const raw=v252RenderLogFormBase.apply(this,arguments);if(v179Mode('single')!=='progress')return raw;
  const item=S.entryDraft?.libraryId?S.library.find(x=>String(x.id)===String(S.entryDraft.libraryId)):null;if(!item||!v252HasSeasons(item))return raw;
  try{const host=document.createElement('div');host.innerHTML=String(raw||'');const inline=host.querySelector('.v179-inline-progress');if(inline){inline.classList.add('v252-global-progress-input');if(S.entryDraft?.v252UseSeasonView!==false)inline.hidden=true;inline.insertAdjacentHTML('afterend',v252DraftSeasonControlsHtml(item));}return host.innerHTML;}catch(_){return raw;}
};

const v252SelectLogTitleBase=App.selectLogTitle;
App.selectLogTitle=function(id){const out=v252SelectLogTitleBase.apply(this,arguments);const item=(S.library||[]).find(x=>String(x.id)===String(id));if(v179Mode('single')==='progress'&&item&&v252HasSeasons(item)){v252InitEntryDraftSeason(item);render();}return out;};

const v252AddLogEntryBase=App.addLogEntry;
App.addLogEntry=function(){
  const item=S.entryDraft?.libraryId?S.library.find(x=>String(x.id)===String(S.entryDraft.libraryId)):null;
  const use=!!(item&&v252HasSeasons(item)&&v179Mode('single')==='progress'&&S.entryDraft?.v252UseSeasonView!==false);
  const meta=use?{id:String(S.entryDraft.v252SeasonId||''),episode:v252Num(S.entryDraft.v252SeasonEpisode,0)}:null;
  if(use)S.entryDraft.endProgress=v252SeasonGlobalEnd(item,meta.id,meta.episode);
  const out=v252AddLogEntryBase.apply(this,arguments);
  if(item&&v252HasSeasons(item)){const entry=(S.logDraft?.entries||[]).find(e=>String(e?.libraryId||'')===String(item.id));if(entry){entry.v252UseSeasonView=use;if(use){const season=v252Seasons(item).find(s=>String(s.id)===meta.id);entry.v252SeasonId=meta.id;entry.v252SeasonNumber=season?.number??null;entry.v252SeasonName=season?.name||'';entry.v252SeasonEpisode=meta.episode;entry.v179EndProgress=v252SeasonGlobalEnd(item,meta.id,meta.episode);entry.qty=v179CalculatedQty(item,entry.v179StartProgress??v179StartProgress(item),entry.v179EndProgress);}v179SyncSingleFromEntries();render();}}
  return out;
};
function v252EntrySeasonControlsHtml(item,entry,index,start){
  const use=entry.v252UseSeasonView!==false;let season=v252Seasons(item).find(s=>String(s.id)===String(entry.v252SeasonId));
  if(!season){const mapped=v252SeasonForGlobalProgress(item,entry.v179EndProgress??start);season=mapped?.season||v252Seasons(item)[0];entry.v252SeasonId=season?.id;entry.v252SeasonEpisode=mapped?.local??0;}
  const local=Math.max(0,Number(entry.v252SeasonEpisode)||0),end=v252SeasonGlobalEnd(item,season.id,local),qty=v179CalculatedQty(item,start,end);
  return `<div class="v252-entry-season-action"><button type="button" class="btn btn-sm ${use?'active':''}" onclick="App.v252ToggleLogEntrySeasonView(${index})">${use?'Seasons View':'Use seasons'}</button>${use?`<label><span>Season</span><select onchange="App.v252SetLogEntrySeason(${index},this.value)">${v252SeasonOptions(item,season.id)}</select></label><label><span>Episode</span><input type="number" min="0" ${Number(season.total)>0?`max="${Number(season.total)}"`:''} step="1" value="${local}" onchange="App.v252SetLogEntrySeasonEpisode(${index},this.value)"></label><span class="v239-logged-consumed">+${qty} ${escapeHtml(v179ProgressNoun(item,qty))}</span><small>Title progress ${end}${Number(item.total)>0?` / ${Number(item.total)}`:''}</small>`:`<label class="v239-logged-progress v242-logged-progress"><span>${escapeHtml(v179ProgressInputLabel(item))}</span><input type="number" min="${start}" ${Number(item.total)>0?`max="${Number(item.total)}"`:''} step="1" value="${entry.v179EndProgress??start}" onchange="App.v179SetLogEntryEnd(${index},this.value)"></label>`}</div>`;
}
function v252LoggedTitlesHtml(entries){
  if(!Array.isArray(entries)||!entries.length)return '';
  const progressMode=v179Mode('single')==='progress';
  return `<div class="v239-logged-title-list v242-logged-title-list v252-logged-title-list" aria-label="Titles logged">${entries.map((entry,idx)=>{
    const item=entry?.libraryId?(typeof v241LibraryById==='function'?v241LibraryById(entry.libraryId):S.library.find(x=>String(x.id)===String(entry.libraryId))):null,cat=item?getCategory(item.categoryId):null;
    const title=cleanTitle(item?.title||entry?.title||'Untitled'),status=item?v199StatusLabel(item.status):'',priority=item?String(item.priority||'medium').toLowerCase():'';
    let action='';
    if(progressMode&&item){const start=Number.isFinite(Number(entry.v179StartProgress))?Math.max(0,Number(entry.v179StartProgress)):v179StartProgress(item);if(v252HasSeasons(item))action=v252EntrySeasonControlsHtml(item,entry,idx,start);else{const end=entry.v179EndProgress!=null?v179ClampEndProgress(item,entry.v179EndProgress):v179ClampEndProgress(item,start+Math.max(0,Number(entry.qty)||0));const qty=v179CalculatedQty(item,start,end);action=`<label class="v239-logged-progress v242-logged-progress"><span>${escapeHtml(v179ProgressInputLabel(item))}</span><input type="number" min="${start}" ${Number(item.total)>0?`max="${Number(item.total)}"`:''} step="1" value="${end}" onchange="App.v179SetLogEntryEnd(${idx},this.value)"></label><span class="v239-logged-consumed">+${qty} ${escapeHtml(v179ProgressNoun(item,qty))}</span>`;}}
    else action=`<span class="v239-logged-consumed">${Math.max(0,Number(entry?.qty)||0)} ${escapeHtml(item?v179ProgressNoun(item,Number(entry?.qty)||0):'units')}</span>`;
    const cover=typeof v242LoggedCoverMarkup==='function'?v242LoggedCoverMarkup(item,title):v239LoggedCover(item,title);const progress=item?(Number(item.total)>0?`${Number(item.progress)||0}/${Number(item.total)}`:`Progress ${Number(item.progress)||0}`):'';
    return `<article class="v239-logged-title-card v242-logged-title-card">${cover}<div class="v239-logged-title-copy"><b>${escapeHtml(title)}</b><small>${[cat?.name,status,priority?`${priority} priority`:'',progress,v252HasSeasons(item)?`${v252Seasons(item).length} seasons`:'',entry?.isRepeat?'Rewatch / reread':''].filter(Boolean).map(escapeHtml).join(' · ')}</small></div><div class="v239-logged-title-actions">${action}<button type="button" class="btn btn-sm btn-ghost v239-remove-log-title" onclick="App.removeLogEntry(${idx})" aria-label="Remove ${escapeHtml(title)}">Remove</button></div></article>`;
  }).join('')}</div>`;
}
v239LoggedTitlesHtml=v252LoggedTitlesHtml;
function v252ToggleLogEntrySeasonView(index){const entry=S.logDraft?.entries?.[index];if(!entry)return;entry.v252UseSeasonView=!(entry.v252UseSeasonView!==false);render();}
function v252SetLogEntrySeason(index,id){
  const entry=S.logDraft?.entries?.[index];const item=entry?.libraryId?S.library.find(x=>String(x.id)===String(entry.libraryId)):null;if(!entry||!item)return;const season=v252Seasons(item).find(s=>String(s.id)===String(id));if(!season)return;entry.v252SeasonId=season.id;entry.v252SeasonNumber=season.number;entry.v252SeasonName=season.name;const start=Number(entry.v179StartProgress)||v179StartProgress(item);const mapped=v252SeasonForGlobalProgress(item,start);entry.v252SeasonEpisode=(mapped&&String(mapped.season.id)===String(season.id))?mapped.local:0;entry.v179EndProgress=v252SeasonGlobalEnd(item,season.id,entry.v252SeasonEpisode);entry.qty=v179CalculatedQty(item,start,entry.v179EndProgress);v179SyncSingleFromEntries();render();
}
function v252SetLogEntrySeasonEpisode(index,value){
  const entry=S.logDraft?.entries?.[index];const item=entry?.libraryId?S.library.find(x=>String(x.id)===String(entry.libraryId)):null;if(!entry||!item)return;entry.v252SeasonEpisode=v252Num(value,0);entry.v179EndProgress=v252SeasonGlobalEnd(item,entry.v252SeasonId,entry.v252SeasonEpisode);const start=Number.isFinite(Number(entry.v179StartProgress))?Number(entry.v179StartProgress):v179StartProgress(item);entry.qty=v179CalculatedQty(item,start,entry.v179EndProgress);v179SyncSingleFromEntries();render();
}

function v252CaptureLoggingEntries(entries){return (entries||[]).map(e=>({libraryId:e.libraryId||null,title:e.title||'',qty:Number(e.qty)||0,repeat:!!e.isRepeat,useSeason:!!(e.v252UseSeasonView&&e.v252SeasonId),seasonId:e.v252SeasonId||null,seasonNumber:e.v252SeasonNumber??null,seasonName:e.v252SeasonName||'',seasonEpisode:e.v252SeasonEpisode==null?null:v252Num(e.v252SeasonEpisode,0),globalEnd:e.v179EndProgress==null?null:Number(e.v179EndProgress)}));}
function v252AttachSeasonMetadataToNewSessions(beforeIds,captured){
  const byLibrary=new Map(captured.filter(x=>x.libraryId).map(x=>[String(x.libraryId),x]));
  for(const session of (S.sessions||[])){
    if(beforeIds.has(String(session?.id||'')))continue;
    for(const title of (session?.titles||[])){
      const meta=byLibrary.get(String(title?.libraryId||''));if(!meta?.useSeason)continue;
      title.season={id:meta.seasonId,number:meta.seasonNumber,name:meta.seasonName,episode:meta.seasonEpisode,globalEndProgress:meta.globalEnd};
    }
  }
}
const v252SubmitLogBase=App.submitLog;
App.submitLog=function(){
  const captured=v252CaptureLoggingEntries(S.logDraft?.entries||[]);const beforeIds=new Set((S.sessions||[]).map(s=>String(s?.id||'')));
  const out=v252SubmitLogBase.apply(this,arguments);
  let libraryChanged=false;
  for(const row of captured){const item=row.libraryId?S.library.find(x=>String(x.id)===String(row.libraryId)):null;if(item&&v252HasSeasons(item)&&!row.repeat){v252DistributeAggregateProgress(item,item.progress);item.modifiedAt=Date.now();libraryChanged=true;}}
  if(libraryChanged){try{v53InvalidateLibraryCache();}catch(_){ }persistLibrary();}
  v252AttachSeasonMetadataToNewSessions(beforeIds,captured);if(captured.some(x=>x.useSeason))persistSessions();
  return out;
};

/* Keep season aggregates synchronized after Batch Log or other progress writes,
   even though v252's season-local selector is intentionally focused on the
   normal Last progress logging workflow requested for this release. */
const v252SubmitBatchLogBase=App.submitBatchLog;
App.submitBatchLog=function(){
  const ids=(S.batchDraft?.rows||[]).map(r=>r?.libraryId).filter(Boolean);const out=v252SubmitBatchLogBase.apply(this,arguments);let changed=false;
  for(const id of ids){const item=S.library.find(x=>String(x.id)===String(id));if(item&&v252HasSeasons(item)){v252DistributeAggregateProgress(item,item.progress);item.modifiedAt=Date.now();changed=true;}}
  if(changed){try{v53InvalidateLibraryCache();}catch(_){ }persistLibrary();}
  return out;
};

/* ---------- Service import support ------------------------------------- */
function v252FirstNumber(obj,keys){for(const key of keys){const v=obj?.[key];if(v!==undefined&&v!==null&&String(v).trim()!==''){const n=Number(v);if(Number.isFinite(n))return Math.max(0,Math.round(n));}}return null;}
function v252SeasonFromImport(raw,index,service){
  const row=(raw&&typeof raw==='object')?raw:{};const episodes=Array.isArray(row.episodes)?row.episodes:[];
  let total=v252FirstNumber(row,['total','total_episodes','totalEpisodes','total_episodes_count','episodes_count','episode_count']);
  if(total==null&&typeof row.episodes==='number')total=v252Num(row.episodes,0);
  let progress=v252FirstNumber(row,['progress','watched','watched_episodes','watchedEpisodes','watched_episodes_count','episodes_watched']);
  if(progress==null&&episodes.length){
    progress=episodes.filter(ep=>ep&&(ep.watched===true||ep.completed===true||ep.seen===true||ep.watched_at||ep.watchedAt||/watched|completed|seen/i.test(String(ep.status||'')))).length;
  }
  if(progress==null)progress=0;
  // Only infer an episode-list total when the source visibly contains both
  // watched and unwatched/full-list episode records. A Simkl history export can
  // contain watched episodes only, so episodes.length alone is not trustworthy.
  if(total==null&&episodes.length&&episodes.some(ep=>ep&&(ep.watched===false||ep.completed===false||ep.seen===false||/unwatched|planned|aired/i.test(String(ep.status||''))))){
    total=Math.max(episodes.length,...episodes.map(ep=>v252Num(ep?.episode??ep?.number??ep?.episode_number,0)));
  }
  const number=row.season??row.number??row.season_number??row.seasonNumber??index+1;
  return v252NormalizeSeason({id:row.id||row.season_id||row.seasonId,number,name:row.name||row.title,progress,total,source:`import:${service}`,manual:false},index,`import:${service}`);
}
function v252ExtractImportedSeasons(raw,service){
  const nested=[raw,raw?.show,raw?.movie,raw?.media,raw?.anime,raw?.item].filter(Boolean);
  let list=null;for(const obj of nested){if(Array.isArray(obj?.seasons)&&obj.seasons.length){list=obj.seasons;break;}}
  if(!list)return [];
  return v252SortSeasons(list.map((s,i)=>v252SeasonFromImport(s,i,service)).filter(s=>s.progress>0||Number(s.total)>0||s.name));
}
function v252MergeImportedSeasons(existing,incoming,service,aggregateProgress,aggregateTotal){
  const out=v252NormalizeSeasons(existing,'manual');const byKey=new Map();
  out.forEach((s,i)=>byKey.set(s.number!=null?`n:${s.number}`:`name:${String(s.name).toLowerCase()}`,i));
  for(const inc of v252NormalizeSeasons(incoming,`import:${service}`)){
    const key=inc.number!=null?`n:${inc.number}`:`name:${String(inc.name).toLowerCase()}`;const idx=byKey.get(key);
    if(idx==null){byKey.set(key,out.length);out.push(inc);continue;}
    const local=out[idx];if(local.manual===true||local.source==='manual')continue;
    out[idx]=Object.assign({},local,inc,{id:local.id||inc.id,source:`import:${service}`,manual:false});
  }
  return v252ReconcileImportedAggregate(out,aggregateProgress,aggregateTotal,`import:${service}`);
}
const v252NormalizeRecordBase=v158NormalizeRecord;
v158NormalizeRecord=function(raw,service){const record=v252NormalizeRecordBase.apply(this,arguments);if(!record)return record;const seasons=v252ExtractImportedSeasons(raw,service);if(seasons.length)record.seasons=v252ReconcileImportedAggregate(seasons,record.progress,record.total,`import:${service}`);return record;};
mfNormalizeRecord=v158NormalizeRecord;
const v252ApplyNormalizedRecordBase=v158ApplyNormalizedRecord;
v158ApplyNormalizedRecord=function(record,service,index,touched){const out=v252ApplyNormalizedRecordBase.apply(this,arguments);if(record?.seasons?.length){const item=v158FindImportItem(record,index);if(item){item.seasons=v252MergeImportedSeasons(item.seasons,record.seasons,service,record.progress,record.total);item.seasonSource=`import:${service}`;item.seasonViewEnabled=true;item.seasonsModifiedAt=Date.now();v252SyncTitleFromSeasons(item);item.modifiedAt=Date.now();touched?.set?.(String(item.id),item);}}return out;};

/* ---------- Load/cloud merge/backup normalization ---------------------- */
function v252NormalizeLibrarySeasonState(library){
  for(const item of (Array.isArray(library)?library:[]))if(Array.isArray(item?.seasons)&&item.seasons.length){item.seasons=v252NormalizeSeasons(item.seasons,item.seasonSource||'manual');v252SyncTitleFromSeasons(item);}
  return library;
}
v252NormalizeLibrarySeasonState(S.library);
const v252LoadAllBase=loadAll;
loadAll=async function(){await v252LoadAllBase.apply(this,arguments);v252NormalizeLibrarySeasonState(S.library);};
const v252ApplyStateBase=v46ApplyState;
v46ApplyState=function(){const out=v252ApplyStateBase.apply(this,arguments);v252NormalizeLibrarySeasonState(S.library);return out;};
function v252SeasonMergeKey(item){return `${cleanTitle(item?.title||'').toLowerCase()}::${String(item?.categoryId||'')}`;}
function v252ChooseSeasonState(a,b,out){
  const aRows=a?.library||[],bRows=b?.library||[];
  const amap=new Map(aRows.map(x=>[String(x?.id||''),x])),bmap=new Map(bRows.map(x=>[String(x?.id||''),x]));
  const akeys=new Map(aRows.map(x=>[v252SeasonMergeKey(x),x])),bkeys=new Map(bRows.map(x=>[v252SeasonMergeKey(x),x]));
  for(const item of (out?.library||[])){
    // Older/service imports may identify the same title with a different local id.
    // Match id first, then the same title/category key used by MediaFlow's cloud merge.
    const key=v252SeasonMergeKey(item);
    const ai=amap.get(String(item?.id||''))||akeys.get(key),bi=bmap.get(String(item?.id||''))||bkeys.get(key);
    const ac=Array.isArray(ai?.seasons)&&ai.seasons.length,bc=Array.isArray(bi?.seasons)&&bi.seasons.length;
    if(!ac&&!bc)continue;let chosen;if(ac&&bc)chosen=(Number(ai.seasonsModifiedAt||ai.modifiedAt)||0)>=(Number(bi.seasonsModifiedAt||bi.modifiedAt)||0)?ai:bi;else chosen=ac?ai:bi;
    item.seasons=JSON.parse(JSON.stringify(chosen.seasons||[]));item.seasonSource=chosen.seasonSource||'manual';item.seasonViewEnabled=chosen.seasonViewEnabled!==false;item.seasonsModifiedAt=Number(chosen.seasonsModifiedAt||chosen.modifiedAt)||Date.now();v252SyncTitleFromSeasons(item);
  }
}
const v252MergeStatesBase=mergeStates;
mergeStates=function(a,b){const out=v252MergeStatesBase.apply(this,arguments)||{};v252ChooseSeasonState(a,b,out);return out;};

const v252BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){const manifest=v252BackupManifestBase.apply(this,arguments);const titles=(state?.library||[]).filter(x=>Array.isArray(x?.seasons)&&x.seasons.length);manifest.includes=Object.assign({},manifest.includes||{},{seasonsViewV252:true,seasonProgressTotalsV252:true,seasonLoggingMetadataV252:true,serviceSeasonImportV252:true});manifest.v252={seasonTitles:titles.length,seasonRows:titles.reduce((n,x)=>n+x.seasons.length,0),cloudSyncVersion:201,fullBackupSchema:29,settingsPresetSchema:1,personalOrderExportVersion:4};return manifest;};
const v252BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){v252NormalizeLibrarySeasonState(S.library);const payload=v252BuildFullBackupBase.apply(this,arguments);payload.backupManifest=v148BackupManifest(payload,payload.portableExtras||{});payload.backupManifest.note='Complete MediaFlow v252 backup. Includes per-title Seasons View rows, season progress/totals, aggregate title progress derived from seasons, season-aware logging History metadata, imported service season metadata, plus all v250/v251 cloud, XP, History, Personal Order, Settings and update/PWA state.';return payload;};

/* Keep full exchange JSON exports useful for round-tripping season metadata. */
const v252ExchangeRowsBase=mfExchangeRows;
mfExchangeRows=function(){const rows=v252ExchangeRowsBase.apply(this,arguments);return rows.map((row,index)=>{const item=S.library[index];return Object.assign({},row,{seasons:item&&v252HasSeasons(item)?JSON.parse(JSON.stringify(v252Seasons(item))):[]});});};

function v252SeasonPersistenceAudit(id){
  const key=String(id||'');const cloud=snapshot();const backup=v148BuildFullBackup();const exchange=mfExchangeRows();
  const cloudItem=(cloud?.library||[]).find(x=>String(x?.id||'')===key);const backupItem=(backup?.library||[]).find(x=>String(x?.id||'')===key);const sourceItem=(S.library||[]).find(x=>String(x?.id||'')===key);const sourceIndex=(S.library||[]).indexOf(sourceItem);
  return {
    cloudSeasons:Array.isArray(cloudItem?.seasons)?cloudItem.seasons.length:0,
    backupSeasons:Array.isArray(backupItem?.seasons)?backupItem.seasons.length:0,
    exchangeSeasons:sourceIndex>=0&&Array.isArray(exchange[sourceIndex]?.seasons)?exchange[sourceIndex].seasons.length:0,
    cloudProgress:Number(cloudItem?.progress)||0,cloudTotal:cloudItem?.total==null?null:Number(cloudItem.total),
    backupProgress:Number(backupItem?.progress)||0,backupTotal:backupItem?.total==null?null:Number(backupItem.total),
    backupManifestSeasons:backup?.backupManifest?.includes?.seasonsViewV252===true
  };
}

Object.assign(App,{
  v252EditorSyncAggregate,v252EditorAddSeason,v252EditorRemoveSeason,
  v252OpenSeasonManager,v252CloseSeasonManager,v252ManagerAddSeason,v252SaveSeasonManager,
  v252ToggleEntryDraftSeasonView,v252SetEntryDraftSeason,v252SetEntryDraftSeasonEpisode,
  v252ToggleLogEntrySeasonView,v252SetLogEntrySeason,v252SetLogEntrySeasonEpisode,
  // Small public diagnostics helpers keep import/season regression tests outside
  // the private module closure without changing the normal MediaFlow UI surface.
  v252NormalizeImportedRecord:(raw,service)=>v158NormalizeRecord(raw,service),
  v252NormalizeSeasons:(rows,source)=>v252NormalizeSeasons(rows,source),
  v252SyncTitleFromSeasons:(item)=>v252SyncTitleFromSeasons(item),v252SeasonPersistenceAudit,
  v252CurrentDraftSeasonControlsHtml:()=>{const item=S.entryDraft?.libraryId?S.library.find(x=>String(x.id)===String(S.entryDraft.libraryId)):null;return v252DraftSeasonControlsHtml(item);}
});
MediaFlowRuntime.version=V252_RUNTIME_VERSION;
