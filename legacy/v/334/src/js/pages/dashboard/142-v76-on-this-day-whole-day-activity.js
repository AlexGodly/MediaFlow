/* ============================================================
   v76 — On This Day: whole-day activity
   ============================================================ */
renderOnThisDay=function(){
  const now=new Date(), groups=new Map();
  for(const s of (S.sessions||[])){
    if(!s || s.status==='skipped') continue;
    const d=new Date(Number(s.timestamp)||0);
    if(Number.isNaN(d.getTime())) continue;
    const years=now.getFullYear()-d.getFullYear();
    if(years<1 || d.getMonth()!==now.getMonth() || d.getDate()!==now.getDate()) continue;
    if(!groups.has(years)) groups.set(years,[]);
    const rows=groups.get(years);
    for(const t of (s.titles||[])){
      if(!t?.title) continue;
      rows.push({
        title:t.title, libraryId:t.libraryId||null,
        qty:Number(t.qty ?? t.amount ?? 0)||0,
        categoryId:t.categoryId || s.categoryId || null,
        minutes:Number(t.minutes)||0, timestamp:Number(s.timestamp)||0
      });
    }
  }
  if(!groups.size) return '';
  const years=Math.min(...groups.keys()), raw=groups.get(years).sort((a,b)=>a.timestamp-b.timestamp);
  const merged=[], byKey=new Map();
  for(const x of raw){
    const key=x.libraryId ? `id:${x.libraryId}` : `title:${cleanTitle(x.title).toLowerCase()}`;
    let m=byKey.get(key);
    if(!m){m={...x,qty:0,minutes:0};byKey.set(key,m);merged.push(m);}
    m.qty+=x.qty; m.minutes+=x.minutes;
  }
  if(!merged.length) return '';
  const first=merged[0], firstItem=v50FindLibraryItem(first.libraryId,first.title), cover=v50Cover(firstItem);
  const extra=merged.length-1;
  const amountText=x=>{
    const item=v50FindLibraryItem(x.libraryId,x.title), cat=getCategory(item?.categoryId||x.categoryId);
    const unit=cat?.unit||'';
    const bits=[];
    if(x.qty>0) bits.push(`${x.qty} ${escapeHtml(unit||'unit'+(x.qty===1?'':'s'))}`);
    if(x.minutes>0) bits.push(fmtMinutes(x.minutes));
    return bits.join(' · ');
  };
  const rows=merged.map(x=>{
    const item=v50FindLibraryItem(x.libraryId,x.title), cat=getCategory(item?.categoryId||x.categoryId), img=v50Cover(item);
    return `<div class="v76-otd-row">${img||`<div class="v76-otd-placeholder">${v144CategoryIconHtml(cat)}</div>`}<div class="v76-otd-row-copy"><b>${escapeHtml(cleanTitle(x.title))}</b><small>${escapeHtml(cat?.name||'Library')}${amountText(x)?` · ${amountText(x)}`:''}</small></div></div>`;
  }).join('');
  return `<details class="on-this-day v76-otd ${cover?'v50-onthisday':''}"><summary class="v76-otd-summary">${cover}<div class="v76-otd-copy"><span>On this day · ${years} year${years===1?'':'s'} ago you logged</span><b>${escapeHtml(cleanTitle(first.title))}</b>${firstItem?`<small>${escapeHtml(getCategory(firstItem.categoryId)?.name||'Library')}</small>`:''}${extra?`<span class="v76-otd-more">+${extra} more logged that day · tap to view all</span>`:`<span class="v76-otd-more">Tap to view details</span>`}</div><span class="v76-otd-chevron">⌄</span></summary><div class="v76-otd-list">${rows}</div></details>`;
};


