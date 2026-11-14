/* MediaFlow v577 — titles logged by parts.
 *
 * Edit title → "How this title is logged":
 *   - Normal (default): as before. Seasons fill in order.
 *   - By parts: the title is a set of parts (game modes, chapters, anything),
 *     each with its own kind, name, counter, unit and time per unit.
 * A part's time per unit falls back to the title's own (mf565), then to the
 * category's. The title's number is the sum of its parts. A part with a total
 * can be completed; a by-parts title is completed only by hand.
 *
 * Data (kept in the existing season rows, so nothing else breaks):
 *   item.mf577LogMode         'parts' (absent = Normal)
 *   item.mf577LastPartId      the part logged last (the default next time)
 *   item.seasons[]            the parts: id, name, progress, total, plus
 *     mf577Kind, mf577Unit, mf577SecondsPerUnit (all optional)
 * A log of a by-parts title says which parts it moved (quick log entries and
 * Batch Log rows: mf577Parts = [{id, qty}]; Advanced: each unit's seasonId),
 * and History keeps it on the title row:
 *   title.mf577Parts = [{id, name, kind, unit, from, to, qty}]
 * Minutes and XP use each part's own time; the category amount counts each
 * part's units in the category's unit (like v565 title units).
 * The MediaFlow app (9.0.0.577) logs by parts the same way.
 */
const MF577={queue:null};

function mf577IsParts(item){return !!item&&item.mf577LogMode==='parts';}
function mf577Parts(item){return mf577IsParts(item)?v252Seasons(item):[];}
function mf577Part(item,id){return mf577Parts(item).find(p=>String(p.id)===String(id))||null;}
function mf577Kind(part){return String(part?.mf577Kind||'').trim().slice(0,30);}
function mf577PartName(part){const k=mf577Kind(part);return (k?k+' · ':'')+String(part?.name||'Part');}
function mf577PartUnitKey(part,item,cat){
  const own=String(part?.mf577Unit||'').trim().slice(0,40);
  return own||mf565UnitKey(item,cat||getCategory(item?.categoryId||''));
}
function mf577PartSeconds(part,item,cat){
  const own=Math.floor(Number(part?.mf577SecondsPerUnit)||0);
  if(own>0)return own;
  return mf565TitleSeconds(item,cat||getCategory(item?.categoryId||''));
}
/* Category units per one of this part's units. */
function mf577PartFactor(part,item,cat){
  const own=Math.floor(Number(part?.mf577SecondsPerUnit)||0),base=mf565CatSeconds(cat);
  if(own>0&&base>0)return own/base;
  return mf565UnitFactor(item,cat);
}
function mf577Default(item){
  const parts=mf577Parts(item);
  return parts.find(p=>String(p.id)===String(item?.mf577LastPartId||''))||parts[0]||null;
}
/* A clean [{id, qty}] list: known parts only, once each, whole units. */
function mf577Clean(item,list){
  const known=new Set(mf577Parts(item).map(p=>String(p.id))),seen=new Set(),out=[];
  for(const r of Array.isArray(list)?list:[]){
    const id=String(r?.id||'');
    if(!known.has(id)||seen.has(id))continue;
    seen.add(id);out.push({id,qty:Math.max(0,Math.floor(Number(r.qty)||0))});
  }
  return out;
}
function mf577Qty(list){return (list||[]).reduce((n,r)=>n+Math.max(0,Number(r.qty)||0),0);}
function mf577Minutes(item,cat,list){
  return (list||[]).reduce((n,r)=>{
    const part=mf577Part(item,r.id);if(!part)return n;
    return n+Math.round(Math.max(0,Number(r.qty)||0)*mf577PartSeconds(part,item,cat)/60);
  },0);
}
function mf577CatAmount(item,cat,list){
  return (list||[]).reduce((n,r)=>{
    const part=mf577Part(item,r.id),q=Math.max(0,Number(r.qty)||0);if(!part)return n;
    const f=mf577PartFactor(part,item,cat);
    return n+(f===1?q:Math.round(q*f*100)/100);
  },0);
}
/* Advanced logging: one unit per row, tagged with its part. */
function mf577FromUnits(units){
  const map=new Map();
  for(const u of Array.isArray(units)?units:[]){const id=String(u?.seasonId||'');if(id)map.set(id,(map.get(id)||0)+1);}
  return [...map].map(([id,qty])=>({id,qty}));
}

/* ---------- season rows keep the part fields ---------- */
const mf577NormalizeSeasonBase=v252NormalizeSeason;
v252NormalizeSeason=function(raw){
  const s=mf577NormalizeSeasonBase.apply(this,arguments);
  const r=raw&&typeof raw==='object'?raw:{};
  const kind=String(r.mf577Kind||'').trim().slice(0,30),unit=String(r.mf577Unit||'').trim().slice(0,40);
  const secs=Math.max(0,Math.floor(Number(r.mf577SecondsPerUnit)||0));
  if(kind)s.mf577Kind=kind;if(unit)s.mf577Unit=unit;if(secs>0)s.mf577SecondsPerUnit=secs;
  return s;
};
/* The title's number is the sum of its parts; it has no total (completed by hand). */
const mf577SyncBase=v252SyncTitleFromSeasons;
v252SyncTitleFromSeasons=function(item){
  const out=mf577SyncBase.apply(this,arguments);
  if(mf577IsParts(item)&&Array.isArray(item.seasons)&&item.seasons.length)item.total=null;
  return out;
};
/* A part's place is its own counter: the others are simply added. */
const mf577OffsetBase=v252SeasonOffset;
v252SeasonOffset=function(item,seasonId){
  if(!mf577IsParts(item))return mf577OffsetBase.apply(this,arguments);
  return mf577Parts(item).reduce((n,p)=>String(p.id)===String(seasonId)?n:n+(Number(p.progress)||0),0);
};
const mf577ForGlobalBase=v252SeasonForGlobalProgress;
v252SeasonForGlobalProgress=function(item){
  if(!mf577IsParts(item))return mf577ForGlobalBase.apply(this,arguments);
  const part=mf577Default(item);if(!part)return null;
  return {season:part,local:Number(part.progress)||0,offset:v252SeasonOffset(item,part.id),index:mf577Parts(item).indexOf(part)};
};
/* Any other progress change (an edited number, a +1) goes to the last part
 * logged instead of filling the parts in order. */
const mf577DistributeBase=v252DistributeAggregateProgress;
v252DistributeAggregateProgress=function(item,aggregate){
  if(!mf577IsParts(item))return mf577DistributeBase.apply(this,arguments);
  const parts=mf577Parts(item);if(!parts.length)return item;
  let diff=Math.max(0,Math.round(Number(aggregate)||0))-parts.reduce((n,p)=>n+(Number(p.progress)||0),0);
  const target=parts.find(p=>String(p.id)===String(item.mf577LastPartId||''))||parts[0];
  if(diff>0)target.progress=(Number(target.progress)||0)+diff;
  for(const p of diff<0?[target,...parts.filter(x=>x!==target).reverse()]:[]){
    const take=Math.min(Number(p.progress)||0,-diff);p.progress-=take;diff+=take;if(!diff)break;
  }
  item.seasons=parts;
  return v252SyncTitleFromSeasons(item);
};
/* Normal seasons picker: by-parts titles use their own part controls. */
const mf577InitDraftBase=v252InitEntryDraftSeason;
v252InitEntryDraftSeason=function(item){
  if(mf577IsParts(item)){S.entryDraft=S.entryDraft||{};S.entryDraft.v252UseSeasonView=false;return;}
  return mf577InitDraftBase.apply(this,arguments);
};
const mf577DraftControlsBase=v252DraftSeasonControlsHtml;
v252DraftSeasonControlsHtml=function(item){
  if(mf577IsParts(item)){S.entryDraft=S.entryDraft||{};S.entryDraft.v252UseSeasonView=false;return '';}
  return mf577DraftControlsBase.apply(this,arguments);
};

/* ---------- logging: minutes, category amount ---------- */
const mf577SyncSingleBase=v179SyncSingleFromEntries;
v179SyncSingleFromEntries=function(){
  if(!S.logDraft)return;
  const entries=S.logDraft.entries||[];
  if(S.logDraft.v369Interface==='itemized'||!entries.some(e=>Array.isArray(e?.mf577Parts)))return mf577SyncSingleBase.apply(this,arguments);
  let amount=0,minutes=0;
  for(const entry of entries){
    const qty=Math.max(0,Number(entry.qty)||0);
    amount+=qty;
    const item=entry.libraryId?S.library.find(i=>i.id===entry.libraryId):null;
    const cat=item?getCategory(item.categoryId):getCategory(S.currentTask?.categoryId||'');
    minutes+=item&&mf577IsParts(item)&&Array.isArray(entry.mf577Parts)?mf577Minutes(item,cat,entry.mf577Parts):mf569Minutes(item,cat,qty);
  }
  S.logDraft.amount=amount;
  S.logDraft.minutes=minutes;
  refreshXPPreview();
};
function mf577EntryParts(item,qty){
  const id=String(item?.id||'');
  if(MF577.queue){
    const list=MF577.queue.get(id);
    if(!list||!list.length)return null;
    const r=list.shift();
    return Array.isArray(r?.mf577Parts)?mf577Clean(item,r.mf577Parts):null;
  }
  const e=(S.logDraft?.entries||[]).find(x=>String(x?.libraryId||'')===id);
  if(!e)return null;
  if(S.logDraft?.v369Interface==='itemized')return Array.isArray(e.v369Units)?mf577FromUnits(e.v369Units):null;
  return Array.isArray(e.mf577Parts)?mf577Clean(item,e.mf577Parts):null;
}
const mf577ToCategoryBase=mf565ToCategoryAmount;
mf565ToCategoryAmount=function(item,cat,qty){
  if(!mf577IsParts(item))return mf577ToCategoryBase.apply(this,arguments);
  const parts=mf577EntryParts(item,qty);
  if(!parts||!parts.length||Math.abs(mf577Qty(parts)-(Number(qty)||0))>1e-9)return mf577ToCategoryBase.apply(this,arguments);
  return mf577CatAmount(item,cat,parts);
};
/* Advanced: a unit still at the title's default time takes its part's time. */
const mf577V369SyncBase=v369Sync;
v369Sync=function(){
  for(const e of S.logDraft?.entries||[]){
    const item=e?.libraryId?S.library.find(x=>String(x.id)===String(e.libraryId)):null;
    if(!item||!mf577IsParts(item)||!Array.isArray(e.v369Units)||Number.isFinite(Number(e.v394RuntimeSeconds)))continue;
    const def=v369DefaultSeconds(item);
    for(const u of e.v369Units){
      const part=mf577Part(item,u?.seasonId);if(!part)continue;
      const secs=mf577PartSeconds(part,item);
      if(Number(u.durationSeconds)===def&&secs!==def)u.durationSeconds=secs;
    }
  }
  return mf577V369SyncBase.apply(this,arguments);
};

/* ---------- logging: the part controls ---------- */
function mf577Bar(part){
  const t=Number(part.total)>0?Number(part.total):0;
  if(!t)return '';
  return '<span class="mf577-bar" aria-hidden="true"><i style="width:'+Math.min(100,Math.round((Number(part.progress)||0)/t*100))+'%"></i></span>';
}
/* Chips to pick parts, then one line per chosen part: its own counter. */
function mf577ControlsHtml(kind,index,item,list,repeat){
  const mode=v179Mode(kind==='batch'?'batch':'single');
  const parts=mf577Parts(item),chosen=new Map(mf577Clean(item,list).map(r=>[r.id,r.qty]));
  const cat=getCategory(item.categoryId);
  const fn=kind==='batch'?'App.mf577BatchSet':'App.mf577SetPart',tg=kind==='batch'?'App.mf577BatchToggle':'App.mf577TogglePart';
  const chips=parts.map(p=>'<button type="button" data-v225-iconified="1" class="mf577-chip'+(chosen.has(String(p.id))?' is-on':'')+'" aria-pressed="'+chosen.has(String(p.id))+'" onclick="'+tg+'('+index+',\''+escapeHtml(String(p.id))+'\')">'+escapeHtml(mf577PartName(p))+'</button>').join('');
  const lines=parts.filter(p=>chosen.has(String(p.id))).map(p=>{
    const qty=chosen.get(String(p.id))||0,from=Number(p.progress)||0,total=Number(p.total)>0?Number(p.total):0;
    const unit=mf577PartUnitKey(p,item,cat),to=total?Math.min(total,from+qty):from+qty;
    const reached=mode==='progress'&&!repeat;
    const input='<input type="number" min="'+(reached?from:0)+'" '+(reached&&total?'max="'+total+'"':'')+' step="1" inputmode="numeric" value="'+(reached?to:qty)+'" aria-label="'+escapeHtml(mf577PartName(p))+(reached?' reached':' amount')+'" onchange="'+fn+'('+index+',\''+escapeHtml(String(p.id))+'\',this.value)">';
    const label=reached?escapeHtml(unitLabel(unit,1).replace(/^./,c=>c.toUpperCase())):'Amount';
    const secs=mf577PartSeconds(p,item,cat),mins=Math.round(qty*secs/60);
    return '<div class="mf577-line mf579-part-card"><div class="mf579-part-head"><b>'+escapeHtml(mf577PartName(p))+'</b><label><span>'+label+(reached?' reached':'')+'</span>'+input+'</label></div>'+
      '<small>'+(reached?escapeHtml(unitLabel(unit,1).replace(/^./,c=>c.toUpperCase()))+' '+from+' → '+to+' ':'')+'(+'+qty+' '+escapeHtml(unitLabel(unit,qty))+')'+(total?' · '+to+'/'+total+(to>=total?' ✓':''):'')+(secs?' · '+fmtMinutes(mins):'')+'</small>'+mf577Bar(p)+'</div>';
  }).join('');
  const sum=mf577Qty(mf577Clean(item,list));
  return '<div class="mf577-parts" role="group" aria-label="Parts"><div class="mf579-parts-head"><b>Parts</b><small>'+parts.length+' part'+(parts.length===1?'':'s')+' · '+sum+' in all</small></div><div class="mf577-chips">'+chips+'</div>'+lines+
    '<small class="mf577-sum">'+(sum?'+'+sum+' in all · '+fmtMinutes(mf577Minutes(item,cat,list)):'Pick the parts you played, read or watched.')+'</small></div>';
}
function mf577EntryItem(index){
  const e=S.logDraft?.entries?.[index];
  const item=e?.libraryId?S.library.find(x=>String(x.id)===String(e.libraryId)):null;
  return {e,item:item&&mf577IsParts(item)?item:null};
}
function mf577ApplyEntry(e,item){
  e.mf577Parts=mf577Clean(item,e.mf577Parts);
  const start=Number.isFinite(Number(e.v179StartProgress))?Math.max(0,Number(e.v179StartProgress)):Math.max(0,Number(item.progress)||0);
  e.qty=mf577Qty(e.mf577Parts);
  e.v179StartProgress=start;
  e.v179EndProgress=start+e.qty;
  e.v252UseSeasonView=false;
  try{v179SyncSingleFromEntries();}catch(_){}
  try{v369Touch();}catch(_){}
}
/* value: the part's reached number (progress mode) or its amount. */
function mf577SetIn(list,item,id,value,mode,repeat){
  const part=mf577Part(item,id);if(!part)return list;
  const v=Math.max(0,Math.floor(Number(value)||0)),from=Number(part.progress)||0,total=Number(part.total)>0?Number(part.total):0;
  const qty=mode==='progress'&&!repeat?Math.max(0,(total?Math.min(total,v):v)-from):v;
  const out=mf577Clean(item,list);
  const row=out.find(r=>r.id===String(id));
  if(row)row.qty=qty;else out.push({id:String(id),qty});
  return out;
}
function mf577ToggleIn(list,item,id){
  const out=mf577Clean(item,list);
  const i=out.findIndex(r=>r.id===String(id));
  if(i>=0){if(out.length===1){showToast('Keep at least one part, or remove the title.');return out;}out.splice(i,1);}
  else if(mf577Part(item,id))out.push({id:String(id),qty:1});
  return out;
}
App.mf577TogglePart=function(index,id){
  const {e,item}=mf577EntryItem(index);if(!e||!item)return;
  e.mf577Parts=mf577ToggleIn(e.mf577Parts,item,id);
  mf577ApplyEntry(e,item);render();
};
App.mf577SetPart=function(index,id,value){
  const {e,item}=mf577EntryItem(index);if(!e||!item)return;
  e.mf577Parts=mf577SetIn(e.mf577Parts,item,id,value,v179Mode('single'),!!e.isRepeat);
  mf577ApplyEntry(e,item);render();
};
const mf577AddEntryBase=App.addLogEntry;
App.addLogEntry=function(){
  const draftItem=S.entryDraft?.libraryId?S.library.find(x=>String(x.id)===String(S.entryDraft.libraryId)):null;
  if(mf577IsParts(draftItem))S.entryDraft.v252UseSeasonView=false;
  const out=mf577AddEntryBase.apply(this,arguments);
  if(mf577IsParts(draftItem)&&S.logDraft?.v369Interface!=='itemized'){
    const e=(S.logDraft?.entries||[]).find(x=>String(x?.libraryId||'')===String(draftItem.id));
    if(e&&!Array.isArray(e.mf577Parts)){
      const part=mf577Default(draftItem);
      if(part){
        const amount=v179Mode('single')==='amount'?Math.max(1,Math.floor(Number(e.qty)||1)):1;
        e.mf577Parts=[{id:String(part.id),qty:amount}];
        mf577ApplyEntry(e,draftItem);render();
      }
    }
  }
  return out;
};
const mf577LoggedTitlesBase=v239LoggedTitlesHtml;
v239LoggedTitlesHtml=function(entries){
  const raw=String(mf577LoggedTitlesBase.apply(this,arguments)||'');
  if(S.logDraft?.v369Interface==='itemized'||!(entries||[]).some(e=>Array.isArray(e?.mf577Parts)))return raw;
  try{
    const host=document.createElement('div');host.innerHTML=raw;
    host.querySelectorAll('.v239-logged-title-card').forEach((card,index)=>{
      const e=entries[index],item=e?.libraryId?S.library.find(x=>String(x.id)===String(e.libraryId)):null;
      if(!item||!mf577IsParts(item)||!Array.isArray(e.mf577Parts))return;
      const actions=card.querySelector('.v239-logged-title-actions');if(!actions)return;
      const remove=actions.querySelector('.v239-remove-log-title');
      actions.innerHTML=mf577ControlsHtml('single',index,item,e.mf577Parts,!!e.isRepeat)+(remove?remove.outerHTML:'');
      actions.classList.add('mf577-actions');
    });
    return host.innerHTML;
  }catch(_){return raw;}
};

/* Saving a log: each part moves by its own amount (never "in order"), and
 * History records which parts moved. */
function mf577Snapshot(item){return new Map(mf577Parts(item).map(p=>[String(p.id),Number(p.progress)||0]));}
function mf577Restore(item,before,moves){
  const parts=mf577Parts(item);
  for(const p of parts)if(before.has(String(p.id)))p.progress=before.get(String(p.id));
  for(const list of moves)for(const r of list){
    const p=parts.find(x=>String(x.id)===r.id);if(!p)continue;
    const t=Number(p.total)>0?Number(p.total):0,next=(Number(p.progress)||0)+Math.max(0,Number(r.qty)||0);
    p.progress=t?Math.min(t,next):next;
  }
  item.seasons=parts;
  v252SyncTitleFromSeasons(item);
}
function mf577Meta(item,before,list,repeat){
  const cat=getCategory(item.categoryId);
  return list.map(r=>{
    const p=mf577Part(item,r.id),from=before.has(r.id)?before.get(r.id):Number(p?.progress)||0,t=Number(p?.total)>0?Number(p.total):0;
    const row={id:r.id,name:String(p?.name||'Part'),kind:mf577Kind(p),unit:mf577PartUnitKey(p,item,cat),qty:r.qty};
    if(!repeat){row.from=from;row.to=t?Math.min(t,from+r.qty):from+r.qty;}
    return row;
  });
}
function mf577Finish(plan,beforeIds,source){
  const fresh=(S.sessions||[]).filter(s=>s&&!beforeIds.has(String(s.id))&&(!source||s.source===source));
  if(!fresh.length)return false;
  const byItem=new Map();
  for(const p of plan){if(!byItem.has(p.item.id))byItem.set(p.item.id,{item:p.item,before:p.before,moves:[],rows:[]});const g=byItem.get(p.item.id);g.rows.push(p);if(!p.repeat&&!p.itemized)g.moves.push(p.list);}
  for(const g of byItem.values()){
    if(g.moves.length)mf577Restore(g.item,g.before,g.moves);else v252SyncTitleFromSeasons(g.item);
    const last=g.rows[g.rows.length-1].list.slice(-1)[0];
    if(last)g.item.mf577LastPartId=last.id;
    g.item.modifiedAt=Date.now();
  }
  const queues=new Map();for(const p of plan){const k=String(p.item.id);if(!queues.has(k))queues.set(k,[]);queues.get(k).push(p);}
  for(const s of fresh)for(const t of Array.isArray(s.titles)?s.titles:[]){
    const q=queues.get(String(t?.libraryId||''));if(!q||!q.length)continue;
    const p=q.shift();t.mf577Parts=mf577Meta(p.item,p.before,p.list,p.repeat);
  }
  try{v53InvalidateLibraryCache();}catch(_){}
  persistLibrary();persistSessions();
  return true;
}
const mf577SubmitBase=App.submitLog;
App.submitLog=function(){
  const itemized=S.logDraft?.v369Interface==='itemized',plan=[];
  for(const e of S.logDraft?.entries||[]){
    const item=e?.libraryId?S.library.find(x=>String(x.id)===String(e.libraryId)):null;
    if(!item||!mf577IsParts(item))continue;
    const list=itemized?mf577FromUnits(e.v369Units):mf577Clean(item,e.mf577Parts);
    if(!list.length)continue;
    plan.push({item,before:mf577Snapshot(item),list,repeat:!!e.isRepeat,itemized});
  }
  if(!plan.length)return mf577SubmitBase.apply(this,arguments);
  const beforeIds=new Set((S.sessions||[]).map(s=>String(s?.id||'')));
  MF577.queue=null;
  const out=mf577SubmitBase.apply(this,arguments);
  mf577Finish(plan,beforeIds,null);
  return out;
};

/* ---------- Batch Log ---------- */
function mf577BatchRow(i){
  const r=S.batchDraft?.rows?.[i],item=r?.libraryId?S.library.find(x=>String(x.id)===String(r.libraryId)):null;
  return {r,item:item&&mf577IsParts(item)?item:null};
}
function mf577ApplyRow(r,item){
  r.mf577Parts=mf577Clean(item,r.mf577Parts);
  r.qty=mf577Qty(r.mf577Parts);
  r.v179StartProgress=Math.max(0,Number(item.progress)||0);
  r.v179EndProgress=r.v179StartProgress+r.qty;
  if(!r.mf577MinutesManual)r.minutes=mf577Minutes(item,getCategory(item.categoryId),r.mf577Parts);
}
App.mf577BatchToggle=function(i,id){
  const {r,item}=mf577BatchRow(i);if(!r||!item)return;
  r.mf577Parts=mf577ToggleIn(r.mf577Parts,item,id);mf577ApplyRow(r,item);render();
};
App.mf577BatchSet=function(i,id,value){
  const {r,item}=mf577BatchRow(i);if(!r||!item)return;
  const repeat=item.status==='completed';
  r.mf577Parts=mf577SetIn(r.mf577Parts,item,id,value,v179Mode('batch'),repeat);mf577ApplyRow(r,item);render();
};
const mf577SelectBatchBase=App.selectBatchTitle;
App.selectBatchTitle=function(i,id){
  const out=mf577SelectBatchBase.apply(this,arguments);
  const {r,item}=mf577BatchRow(i);
  if(r&&item){
    if(!Array.isArray(r.mf577Parts)||!mf577Clean(item,r.mf577Parts).length){const p=mf577Default(item);r.mf577Parts=p?[{id:String(p.id),qty:1}]:[];}
    mf577ApplyRow(r,item);render();
  }else if(r)delete r.mf577Parts;
  return out;
};
const mf577UpdateBatchRowBase=App.updateBatchRow;
App.updateBatchRow=function(i,key){
  const r=S.batchDraft?.rows?.[i];
  if(r&&key==='minutes')r.mf577MinutesManual=true;
  return mf577UpdateBatchRowBase.apply(this,arguments);
};
const mf577RenderBatchBase=renderBatchLog;
renderBatchLog=function(){
  const html=String(mf577RenderBatchBase.apply(this,arguments)||'');
  if(!(S.batchDraft?.rows||[]).some(r=>Array.isArray(r?.mf577Parts)))return html;
  try{
    const host=document.createElement('div');host.innerHTML=html;
    host.querySelectorAll('.batch-log-row').forEach((row,i)=>{
      const {r,item}=mf577BatchRow(i);if(!r||!item||!Array.isArray(r.mf577Parts))return;
      const fields=row.querySelector('.batch-number-fields');if(!fields)return;
      const own=row.querySelector('#batch-qty-'+i+',#batch-progress-'+i)?.closest('.field');
      if(own)own.hidden=true;
      fields.insertAdjacentHTML('beforebegin',mf577ControlsHtml('batch',i,item,r.mf577Parts,item.status==='completed'));
    });
    return host.innerHTML;
  }catch(_){return html;}
};
const mf577SubmitBatchBase=App.submitBatchLog;
App.submitBatchLog=function(){
  const rows=(S.batchDraft?.rows||[]).filter(r=>r?.libraryId&&Number(r.qty)>0),plan=[],befores=new Map();
  for(const r of rows){
    const item=S.library.find(x=>String(x.id)===String(r.libraryId));
    if(!item||!mf577IsParts(item)||!Array.isArray(r.mf577Parts))continue;
    const list=mf577Clean(item,r.mf577Parts);if(!list.length)continue;
    if(!befores.has(item.id))befores.set(item.id,mf577Snapshot(item));
    plan.push({item,before:befores.get(item.id),list,repeat:item.status==='completed',itemized:false});
  }
  if(!plan.length)return mf577SubmitBatchBase.apply(this,arguments);
  const beforeIds=new Set((S.sessions||[]).map(s=>String(s?.id||'')));
  MF577.queue=new Map();
  for(const r of rows){const k=String(r.libraryId);if(!MF577.queue.has(k))MF577.queue.set(k,[]);MF577.queue.get(k).push(r);}
  const finish=()=>{MF577.queue=null;mf577Finish(plan,beforeIds,'batch');};
  let result;
  try{result=mf577SubmitBatchBase.apply(this,arguments);}catch(e){MF577.queue=null;throw e;}
  if(result&&typeof result.then==='function')return result.then(x=>{finish();return x;},e=>{MF577.queue=null;throw e;});
  finish();return result;
};
if(typeof mf574Project==='function'){
  const mf577ProjectBase=mf574Project;
  mf574Project=function(){
    MF577.queue=new Map();
    for(const r of mf574Rows()){const k=String(r.libraryId);if(!MF577.queue.has(k))MF577.queue.set(k,[]);MF577.queue.get(k).push(r);}
    try{return mf577ProjectBase.apply(this,arguments);}finally{MF577.queue=null;}
  };
}

/* ---------- History ---------- */
function mf577HistoryText(row){
  const list=Array.isArray(row?.mf577Parts)?row.mf577Parts:[];
  if(!list.length)return '';
  return list.map(p=>{
    const name=(p.kind?p.kind+' · ':'')+(p.name||'Part'),u=unitLabel(p.unit||'units',1);
    return Number.isFinite(Number(p.to))?name+' · '+u.charAt(0).toUpperCase()+u.slice(1)+' '+p.from+' → '+p.to+' (+'+p.qty+')':name+' +'+p.qty;
  }).join(' · ');
}
if(window.MediaFlowV269Hooks){
  MediaFlowV269Hooks.wrap('progressMeta',function(base,ev){return mf577HistoryText(ev?.row)||base(ev);});
  MediaFlowV269Hooks.wrap('latestLabel',function(base,ev){
    const list=Array.isArray(ev?.row?.mf577Parts)?ev.row.mf577Parts:[];
    if(list.length){const p=list[list.length-1];return (p.name||'Part')+(Number.isFinite(Number(p.to))?' '+p.to:' +'+p.qty);}
    return base(ev);
  });
}

/* ---------- Edit title: how this title is logged + the parts ---------- */
function mf577ParseTime(text){
  const s=String(text||'').trim();if(!s)return 0;
  if(/^\d+(\.\d+)?$/.test(s))return Math.round(Number(s)*60);
  const m=/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/.exec(s);
  if(!m)return 0;
  return m[3]!=null?Number(m[1])*3600+Number(m[2])*60+Number(m[3]):Number(m[1])*60+Number(m[2]);
}
function mf577TimeText(secs){
  const t=Math.max(0,Math.floor(Number(secs)||0));if(!t)return '';
  const h=Math.floor(t/3600),m=Math.floor(t%3600/60),s=t%60;
  return h?h+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0'):m+':'+String(s).padStart(2,'0');
}
const mf577RowHtmlBase=v252EditorSeasonRowHtml;
v252EditorSeasonRowHtml=function(season){
  const raw=String(mf577RowHtmlBase.apply(this,arguments)||'');
  const s=season&&typeof season==='object'?season:{};
  const extra='<div class="field mf577-part-field"><label class="field-label">Kind</label><input type="text" maxlength="30" data-mf577-kind value="'+escapeHtml(String(s.mf577Kind||''))+'" placeholder="Mode, Chapter…"></div>'+
    '<div class="field mf577-part-field"><label class="field-label">Unit</label><input type="text" maxlength="40" data-mf577-unit value="'+escapeHtml(String(s.mf577Unit||''))+'" placeholder="Title\'s unit"></div>'+
    '<div class="field mf577-part-field"><label class="field-label">Time per unit</label><input type="text" data-mf577-time value="'+escapeHtml(mf577TimeText(s.mf577SecondsPerUnit))+'" placeholder="mm:ss"></div>';
  return raw.replace('<label class="field-label">Season name</label>','<label class="field-label"><span class="mf577-l-season">Season name</span><span class="mf577-l-part">Part name</span></label>')
    .replace('<button type="button" class="btn btn-sm btn-danger v252-season-remove"',extra+'<button type="button" class="btn btn-sm btn-danger v252-season-remove"');
};
function mf577EditorIsParts(root){
  return !!(root&&(root.classList?.contains('mf577-parts-editor')||root.querySelector?.('.mf577-parts-editor')));
}
const mf577CaptureBase=v252CaptureRowsFrom;
v252CaptureRowsFrom=function(root=document){
  const out=mf577CaptureBase.apply(this,arguments);
  const parts=mf577EditorIsParts(root);
  const rows=[...root.querySelectorAll('[data-v252-season-row]')];
  return out.map((s,i)=>{
    const row=rows[i];if(!row)return s;
    const kind=String(row.querySelector('[data-mf577-kind]')?.value||'').trim().slice(0,30);
    const unit=String(row.querySelector('[data-mf577-unit]')?.value||'').trim().slice(0,40);
    const secs=mf577ParseTime(row.querySelector('[data-mf577-time]')?.value);
    const next={...s};
    delete next.mf577Kind;delete next.mf577Unit;delete next.mf577SecondsPerUnit;
    if(kind)next.mf577Kind=kind;if(unit)next.mf577Unit=unit;if(secs>0)next.mf577SecondsPerUnit=secs;
    if(parts){next.number=null;if(!String(row.querySelector('[data-v252-season-name]')?.value||'').trim())next.name='Part '+(i+1);}
    return next;
  });
};
const mf577AddSeasonBase=v252EditorAddSeason;
v252EditorAddSeason=function(){
  const editor=document.querySelector('[data-v252-seasons-editor]');
  if(!mf577EditorIsParts(editor))return mf577AddSeasonBase.apply(this,arguments);
  const list=editor.querySelector('[data-v252-season-list]');if(!list)return;
  let rows=v252EditorRows();
  if(!rows.length){
    const p=v252Num(document.getElementById('l-progress')?.value,0);
    if(p>0)list.insertAdjacentHTML('beforeend',v252EditorSeasonRowHtml({name:'Main',number:null,progress:p,total:null,source:'manual',manual:true},0));
  }
  rows=v252EditorRows();
  list.insertAdjacentHTML('beforeend',v252EditorSeasonRowHtml({number:null,name:'Part '+(rows.length+1),progress:0,total:null,source:'manual',manual:true},rows.length));
  v252EditorSyncAggregate();
  if(editor.classList.contains('mf577-parts-editor'))v252EditorSyncAggregate();
};
App.v252EditorAddSeason=v252EditorAddSeason;
function mf577ModeHtml(item){
  const parts=mf577IsParts(item);
  return '<section class="mf577-mode" data-mf577-mode><div><b>How this title is logged</b><small>Normal fills seasons in order. By parts gives each part (a game mode, a chapter, anything) its own counter, unit and time per unit; the title adds them up and is completed only by hand.</small></div>'+
    '<div class="mf577-mode-pick" role="radiogroup" aria-label="How this title is logged">'+
    '<label><input type="radio" name="mf577-mode" value="normal" '+(parts?'':'checked')+' onchange="App.mf577SetEditorMode(this.value)"> Normal</label>'+
    '<label><input type="radio" name="mf577-mode" value="parts" '+(parts?'checked':'')+' onchange="App.mf577SetEditorMode(this.value)"> By parts</label></div></section>';
}
App.mf577SetEditorMode=function(value){
  const editor=document.querySelector('[data-v252-seasons-editor]');if(!editor)return;
  editor.classList.toggle('mf577-parts-editor',value==='parts');
  const head=editor.querySelector('.v252-seasons-editor-head b');
  if(head)head.textContent=value==='parts'?'Parts':'Track progress by season';
  if(value==='parts'&&!v252EditorRows().length)v252EditorAddSeason();
  v252EditorSyncAggregate();
  if(value==='parts'){const t=document.getElementById('l-total');if(t){t.value='';t.readOnly=true;}}
};
const mf577LibraryModalBase=libraryModalHtml;
libraryModalHtml=function(d){
  const raw=String(mf577LibraryModalBase.apply(this,arguments)||'');
  try{
    const host=document.createElement('div');host.innerHTML=raw;
    const editor=host.querySelector('[data-v252-seasons-editor]');if(!editor)return raw;
    editor.insertAdjacentHTML('beforebegin',mf577ModeHtml(d||{}));
    if(mf577IsParts(d)){
      editor.classList.add('mf577-parts-editor');
      const head=editor.querySelector('.v252-seasons-editor-head b');if(head)head.textContent='Parts';
      const t=host.querySelector('#l-total');if(t){t.value='';t.readOnly=true;}
    }
    return host.innerHTML;
  }catch(_){return raw;}
};
const mf577EditorSyncBase=v252EditorSyncAggregate;
v252EditorSyncAggregate=function(){
  const out=mf577EditorSyncBase.apply(this,arguments);
  if(mf577EditorIsParts(document.querySelector('[data-v252-seasons-editor]'))){
    const t=document.getElementById('l-total');if(t){t.value='';t.readOnly=true;}
  }
  return out;
};
App.v252EditorSyncAggregate=v252EditorSyncAggregate;
const mf577SaveLibraryBase=App.saveLibraryModal;
App.saveLibraryModal=function(id){
  const pick=document.querySelector('[data-mf577-mode] input[name="mf577-mode"]:checked');
  const mode=pick?pick.value:null;
  const count=(S.library||[]).length;
  const result=mf577SaveLibraryBase.apply(this,arguments);
  if(!mode||S.modal?.type==='library')return result;
  const item=id?(S.library||[]).find(x=>String(x?.id||'')===String(id)):((S.library||[]).length>count?S.library[S.library.length-1]:null);
  if(!item)return result;
  if(mode==='parts'){
    item.mf577LogMode='parts';
    if(!Array.isArray(item.seasons)||!item.seasons.length){
      item.seasons=v252NormalizeSeasons([{name:'Main',number:null,progress:Number(item.progress)||0,total:null,source:'manual',manual:true}],'manual');
      item.seasonSource='manual';item.seasonViewEnabled=true;item.seasonsModifiedAt=Date.now();
    }
    v252SyncTitleFromSeasons(item);
  }else if(item.mf577LogMode){
    delete item.mf577LogMode;delete item.mf577LastPartId;
    v252SyncTitleFromSeasons(item);
  }else return result;
  item.modifiedAt=Date.now();
  try{v53InvalidateLibraryCache();}catch(_){}
  persistLibrary();render();
  return result;
};
/* Title Details: the parts with their own counters. */
const mf577DetailsSeasonsBase=v252TitleDetailsSeasonsHtml;
v252TitleDetailsSeasonsHtml=function(item){
  if(!mf577IsParts(item))return mf577DetailsSeasonsBase.apply(this,arguments);
  const parts=mf577Parts(item),cat=getCategory(item.categoryId),sum=parts.reduce((n,p)=>n+(Number(p.progress)||0),0);
  const rows=parts.map(p=>{
    const t=Number(p.total)>0?Number(p.total):0,u=mf577PartUnitKey(p,item,cat),n=Number(p.progress)||0;
    return '<div class="v252-season-detail-row"><div class="v252-season-detail-copy"><b>'+escapeHtml(mf577PartName(p))+'</b><span>'+n+(t?' / '+t+(n>=t?' ✓':''):'')+' '+escapeHtml(unitLabel(u,n))+'</span></div>'+
      (t?'<div class="progress-track"><div class="progress-fill" style="width:'+Math.min(100,Math.round(n/t*100))+'%"></div></div>':'')+'</div>';
  }).join('');
  return '<div class="v181-detail-section-label v252-details-season-label" style="margin-top:14px;">Logged by parts</div><section class="v252-title-seasons mf577-detail-parts"><div class="v252-title-seasons-head"><div><b>'+sum+' in all</b><small>'+parts.length+' part'+(parts.length===1?'':'s')+' · completed only by hand</small></div><button type="button" class="btn btn-sm" onclick="App.v252OpenSeasonManager(\''+escapeHtml(String(item.id))+'\')">Edit parts</button></div><div class="v252-title-season-list">'+rows+'</div></section>';
};
const mf577OpenManagerBase=v252OpenSeasonManager;
v252OpenSeasonManager=function(id){
  const out=mf577OpenManagerBase.apply(this,arguments);
  const item=(S.library||[]).find(x=>String(x?.id||'')===String(id));
  const box=document.querySelector('#v252-season-manager-overlay .v252-season-manager');
  if(box&&mf577IsParts(item)){
    box.classList.add('mf577-parts-editor');
    const k=box.querySelector('.v252-season-kicker');if(k)k.textContent='PARTS';
  }
  return out;
};
App.v252OpenSeasonManager=v252OpenSeasonManager;
const mf577ManagerAddBase=v252ManagerAddSeason;
v252ManagerAddSeason=function(id){
  const box=document.querySelector('#v252-season-manager-overlay .v252-season-manager');
  if(!mf577EditorIsParts(box))return mf577ManagerAddBase.apply(this,arguments);
  const list=box.querySelector('[data-v252-manager-list]');if(!list)return;
  const n=list.querySelectorAll('[data-v252-season-row]').length;
  list.insertAdjacentHTML('beforeend',v252SeasonManagerRowHtml({number:null,name:'Part '+(n+1),progress:0,total:null,source:'manual',manual:true},n));
};
App.v252ManagerAddSeason=v252ManagerAddSeason;

window.MediaFlowV577=Object.freeze({version:577,isParts:mf577IsParts,parts:mf577Parts,partSeconds:mf577PartSeconds,
  minutes:mf577Minutes,categoryAmount:mf577CatAmount,history:mf577HistoryText});

/* ---------- a selected season's (or part's) own bar ----------
 * Normal titles with seasons: with a season selected, logging shows that
 * season's own counter and bar (Season 2 · Ep. 3 → 5 / 12), in Progress
 * reached and in Advanced logging (Per Unit, Progress Reached, Amount). */
function mf577SeasonBarHtml(season,item,to){
  if(!season)return '';
  const from=Number(season.progress)||0,t=Number(season.total)>0?Number(season.total):0;
  const end=Math.max(from,t?Math.min(t,Number(to)||0):Number(to)||0);
  const u=unitLabel(mf577IsParts(item)?mf577PartUnitKey(season,item):mf565UnitKey(item,getCategory(item?.categoryId||'')),1);
  return '<div class="mf577-season-bar"><span><b>'+escapeHtml(mf577IsParts(item)?mf577PartName(season):String(season.name||'Season'))+'</b> · '+
    escapeHtml(u.charAt(0).toUpperCase()+u.slice(1))+' '+from+' → '+end+(t?' / '+t+(end>=t?' ✓':''):'')+' (+'+(end-from)+')</span>'+
    (t?'<span class="mf577-bar" aria-hidden="true"><i style="width:'+Math.min(100,Math.round(end/t*100))+'%"></i></span>':'')+'</div>';
}
const mf577EntrySeasonBase=v252EntrySeasonControlsHtml;
v252EntrySeasonControlsHtml=function(item,entry){
  const raw=mf577EntrySeasonBase.apply(this,arguments);
  if(entry?.v252UseSeasonView===false)return raw;
  const season=v252Seasons(item).find(s=>String(s.id)===String(entry?.v252SeasonId));
  return season?String(raw).replace(/<\/div>$/,mf577SeasonBarHtml(season,item,entry.v252SeasonEpisode)+'</div>'):raw;
};
const mf577DraftSeasonBarBase=v252DraftSeasonControlsHtml;
v252DraftSeasonControlsHtml=function(item){
  const raw=mf577DraftSeasonBarBase.apply(this,arguments);
  if(!raw||S.entryDraft?.v252UseSeasonView===false)return raw;
  const season=v252Seasons(item).find(s=>String(s.id)===String(S.entryDraft?.v252SeasonId));
  return season?String(raw).replace(/<\/div>$/,mf577SeasonBarHtml(season,item,S.entryDraft.v252SeasonEpisode)+'</div>'):raw;
};
if(typeof v394BulkPanel==='function'){
  const mf577BulkBase=v394BulkPanel;
  v394BulkPanel=function(e,index,item){
    const raw=String(mf577BulkBase.apply(this,arguments)||'');
    try{
      if(!item||!v252HasSeasons(item))return raw;
      const season=v369SelectedSeason(e,item);if(!season)return raw;
      const to=v369ContiguousProgress(season.progress,[...v369KnownUnits(item),...(Array.isArray(e?.v369Units)?e.v369Units:[])],season.id,season.total);
      return mf577SeasonBarHtml(season,item,to)+raw;
    }catch(_){return raw;}
  };
}
