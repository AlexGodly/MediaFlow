/* ============================================================
   v50 — Cover-forward UI + Simkl export
   ============================================================ */
function v50FindLibraryItem(libraryId,title){
  if(libraryId){const byId=(S.library||[]).find(i=>i.id===libraryId);if(byId)return byId;}
  const q=cleanTitle(title||'').toLowerCase();
  return q?(S.library||[]).find(i=>cleanTitle(i.title).toLowerCase()===q):null;
}
function v50Cover(item,cls=''){return item?.coverUrl?`<img class="v50-cover ${cls}" src="${escapeHtml(item.coverUrl)}" alt="${escapeHtml(cleanTitle(item.title||''))} cover" loading="lazy" onerror="this.style.display='none'">`:'';}

// v87: logging renderer is defined in the core logging section above so later UI enhancements cannot shadow its filters/pagination.

// Cover-aware exact-title recommendation on the dashboard.
const v50DashboardBase=renderDashboard;
renderDashboard=function(){
  let h=v50DashboardBase(); const t=S.currentTask;
  if(!t?.title || !S.settings.exactTitleRecommendations)return h;
  const item=v50FindLibraryItem(t.libraryId,t.title); if(!item?.coverUrl)return h;
  const plain=`<div class="hero-note">MediaFlow recommends: <b>${escapeHtml(t.title)}</b></div>`;
  const rich=`<div class="hero-note v50-title-feature">${v50Cover(item)}<div><small>MediaFlow recommends</small><br><b>${escapeHtml(t.title)}</b></div></div>`;
  return h.replace(plain,rich);
};

renderOnThisDay=function(){
  const now=new Date(),groups=new Map();

  const sessionDate=s=>{
    const ts=Number(s?.timestamp)||0;
    if(ts>0){
      const d=new Date(ts);
      if(!Number.isNaN(d.getTime()))return d;
    }
    const raw=String(s?.date||'').trim();
    if(raw){
      const d=new Date(raw+'T12:00:00');
      if(!Number.isNaN(d.getTime()))return d;
    }
    return null;
  };

  const coverMarkup=(item,summary=false,categoryId=null,title='')=>{
    const cls=summary?'v126-otd-summary':'v126-otd-row';
    const cat=getCategory(item?.categoryId||categoryId);
    const icon=v144CategoryIconHtml(cat);
    const name=cleanTitle(item?.title||title||'');
    if(item?.coverUrl){
      return `<img class="${cls}-cover" src="${escapeHtml(item.coverUrl)}" alt="${escapeHtml(name)} cover" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="${cls}-placeholder" style="display:none">${icon}</div>`;
    }
    return `<div class="${cls}-placeholder">${icon}</div>`;
  };

  for(const s of (S.sessions||[])){
    if(!s || s.status==='skipped')continue;
    const d=sessionDate(s);
    if(!d)continue;

    const years=now.getFullYear()-d.getFullYear();
    if(years<1 || d.getMonth()!==now.getMonth() || d.getDate()!==now.getDate())continue;

    const titles=Array.isArray(s.titles)&&s.titles.length
      ? s.titles.filter(t=>t?.title)
      : (s.title?[{title:s.title,libraryId:s.libraryId||null,qty:s.actualAmount||0,categoryId:s.categoryId||null}]:[]);

    if(!titles.length)continue;
    if(!groups.has(years))groups.set(years,[]);

    const totalQty=titles.reduce((n,t)=>n+Math.max(0,Number(t?.qty ?? t?.amount ?? 0)||0),0);
    const sessionMinutes=Math.max(0,Number(s.minutes)||0);

    for(const t of titles){
      const qty=Math.max(0,Number(t?.qty ?? t?.amount ?? 0)||0);
      let minutes=Math.max(0,Number(t?.minutes)||0);

      if(!minutes && sessionMinutes>0){
        if(titles.length===1)minutes=sessionMinutes;
        else if(totalQty>0)minutes=sessionMinutes*(qty/totalQty);
        else minutes=sessionMinutes/titles.length;
      }

      groups.get(years).push({
        title:cleanTitle(t.title),
        libraryId:t.libraryId||null,
        categoryId:t.categoryId||s.categoryId||null,
        qty,
        minutes,
        timestamp:d.getTime(),
        date:d
      });
    }
  }

  if(!groups.size)return '';

  const grouped=[];
  for(const [years,raw] of [...groups.entries()].sort((a,b)=>a[0]-b[0])){
    raw.sort((a,b)=>a.timestamp-b.timestamp);
    const merged=[],byKey=new Map();

    for(const x of raw){
      const key=x.libraryId
        ? `id:${String(x.libraryId)}`
        : `title:${cleanTitle(x.title).toLowerCase()}::${String(x.categoryId||'')}`;

      let m=byKey.get(key);
      if(!m){
        m={...x,qty:0,minutes:0,firstTimestamp:x.timestamp};
        byKey.set(key,m);
        merged.push(m);
      }
      m.qty+=Math.max(0,Number(x.qty)||0);
      m.minutes+=Math.max(0,Number(x.minutes)||0);
      m.firstTimestamp=Math.min(m.firstTimestamp,x.timestamp);
    }

    if(merged.length)grouped.push({years,rows:merged});
  }

  if(!grouped.length)return '';

  const amountText=x=>{
    const item=v50FindLibraryItem(x.libraryId,x.title);
    const cat=getCategory(item?.categoryId||x.categoryId);
    const bits=[];
    const qty=Math.max(0,Number(x.qty)||0);
    const minutes=Math.max(0,Math.round(Number(x.minutes)||0));

    if(qty>0)bits.push(`${qty} ${unitLabel(cat?.unit||'units',qty)}`);
    if(minutes>0)bits.push(fmtMinutes(minutes));
    return bits.join(' · ');
  };

  const nearest=grouped[0];
  const first=nearest.rows[0];
  const firstItem=v50FindLibraryItem(first.libraryId,first.title);
  const firstCat=getCategory(firstItem?.categoryId||first.categoryId);
  const sameYearExtra=Math.max(0,nearest.rows.length-1);
  const otherYears=Math.max(0,grouped.length-1);

  let more='';
  if(sameYearExtra)more+=`+${sameYearExtra} more logged that day`;
  if(otherYears)more+=(more?' · ':'')+`${otherYears} other matching year${otherYears===1?'':'s'}`;
  if(!more)more='Tap to view details';
  else more+=' · tap to view all';

  const body=grouped.map(group=>{
    const firstDate=group.rows[0]?.date;
    const dateLabel=firstDate instanceof Date&&!Number.isNaN(firstDate.getTime())
      ? firstDate.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})
      : '';

    const rows=group.rows.map(x=>{
      const item=v50FindLibraryItem(x.libraryId,x.title);
      const cat=getCategory(item?.categoryId||x.categoryId);
      const amount=amountText(x);
      const when=new Date(Number(x.firstTimestamp)||0);
      const time=Number.isNaN(when.getTime())?'':when.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'});

      return `<div class="v126-otd-row">
        ${coverMarkup(item,false,x.categoryId,x.title)}
        <div class="v126-otd-row-copy">
          <b>${escapeHtml(cleanTitle(x.title))}</b>
          <small>${escapeHtml(cat?.name||'Library')}${amount?` · ${escapeHtml(amount)}`:''}</small>
        </div>
        ${time?`<div class="v126-otd-row-time">${escapeHtml(time)}</div>`:''}
      </div>`;
    }).join('');

    return `<div class="v126-otd-year">
      <div class="v126-otd-year-head">
        <strong>${group.years} year${group.years===1?'':'s'} ago${dateLabel?` · ${escapeHtml(dateLabel)}`:''}</strong>
        <span>${group.rows.length.toLocaleString()} title${group.rows.length===1?'':'s'}</span>
      </div>
      ${rows}
    </div>`;
  }).join('');

  return `<details class="on-this-day v126-otd" data-mf-on-this-day-version="128">
    <summary class="v126-otd-summary">
      ${coverMarkup(firstItem,true,first.categoryId,first.title)}
      <div class="v126-otd-copy">
        <span>On this day · ${nearest.years} year${nearest.years===1?'':'s'} ago you logged</span>
        <b>${escapeHtml(cleanTitle(first.title))}</b>
        <small>${escapeHtml(firstCat?.name||'Library')}</small>
        <span class="v126-otd-more">${escapeHtml(more)}</span>
      </div>
      <span class="v126-otd-chevron">⌄</span>
    </summary>
    <div class="v126-otd-body">${body}</div>
  </details>`;
};

renderCompletionTimeline=function(){
  const map=new Map();
  for(const x of(S.completionTimeline||[])){if(x?.completedAt)map.set(x.libraryId||(`${x.title}::${x.completedAt}`),x);}
  for(const i of S.library){if(i?.status==='completed'&&i.completedAt&&!map.has(i.id))map.set(i.id,{libraryId:i.id,title:i.title,categoryId:i.categoryId,completedAt:i.completedAt});}
  const arr=[...map.values()].sort((a,b)=>Number(b.completedAt)-Number(a.completedAt)); if(!arr.length)return '<div class="empty-state">No completed titles yet.</div>';
  const size=25,max=Math.max(0,Math.ceil(arr.length/size)-1);S.timelinePage=clamp(Number(S.timelinePage)||0,0,max);const page=arr.slice(S.timelinePage*size,S.timelinePage*size+size);
  const rows=`<div class="completion-timeline">${page.map(x=>{const c=getCategory(x.categoryId),item=v50FindLibraryItem(x.libraryId,x.title);return `<div class="timeline-item"><div class="timeline-dot" style="background:${c?.color||'var(--flow)'}"></div><div class="v50-timeline-row">${v50Cover(item)}<div class="v50-timeline-copy"><div class="timeline-date">${new Date(Number(x.completedAt)).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})}</div><div class="timeline-title">${escapeHtml(cleanTitle(x.title))}</div><div class="timeline-cat">${c?.icon||'•'} ${escapeHtml(c?.name||'Unknown')}</div></div></div></div>`}).join('')}</div>`;
  if(max===0)return rows;return rows+`<div class="v44-timeline-pager"><button class="btn btn-sm" ${S.timelinePage<=0?'disabled':''} onclick="App.setTimelinePage(${S.timelinePage-1})">← Prev</button><span class="hint">Page ${S.timelinePage+1} of ${max+1} · ${arr.length} completed titles</span><button class="btn btn-sm" ${S.timelinePage>=max?'disabled':''} onclick="App.setTimelinePage(${S.timelinePage+1})">Next →</button></div>`;
};

function v50SimklStatus(status){return ({active:'watching',planned:'plantowatch',completed:'completed',paused:'hold',dropped:'dropped'})[status]||'plantowatch';}
function v50SimklExport(){
  const out={source:'MediaFlow',exported_at:new Date().toISOString(),anime:[],shows:[],movies:[]};
  for(const i of(S.library||[])){
    const c=getCategory(i.categoryId),ids=i.externalIds||{},media={title:cleanTitle(i.title),year:i.year||null,ids:{simkl:ids.simkl??null,mal:ids.mal??null,anilist:ids.anilist??null,tmdb:ids.tmdb??null,imdb:ids.imdb??null}};
    const rec={status:v50SimklStatus(i.status),watched_episodes_count:Number(i.progress)||0,total_episodes_count:i.total==null?null:Number(i.total)||0,user_rating:Number(i.rating)||0,added_to_watchlist_at:i.createdAt?new Date(Number(i.createdAt)).toISOString():null,last_watched_at:i.completedAt?new Date(Number(i.completedAt)).toISOString():null};
    if(i.categoryId==='movies'){out.movies.push(Object.assign({movie:media},rec));}
    else if(i.categoryId==='tv'||i.categoryId==='otheranimation'){out.shows.push(Object.assign({show:media},rec));}
    else if(['seasonal','backlog','animemovies'].includes(i.categoryId)){out.anime.push(Object.assign({show:media,anime_type:i.categoryId==='animemovies'?'movie':'tv'},rec));}
  }
  return out;
}
const v50ExportExchangeBase=mfExportExchange;
mfExportExchange=function(){
  const service=document.getElementById('exchange-service')?.value||'json';
  if(service!=='simkl')return v50ExportExchangeBase();
  const data=v50SimklExport(),count=data.anime.length+data.shows.length+data.movies.length;
  showDataProgress('Exporting for Simkl','Building Simkl-compatible JSON…',55);
  triggerDownload(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),`mediaflow-simkl-${todayISO()}.json`);
  setTimeout(()=>finishDataProgress(true,'Export complete',`${count.toLocaleString()} supported Library titles exported for Simkl.`),100);
};
App.exportExchange=mfExportExchange;

// v50 settings copy now advertises Simkl as an export target too.
const v50SettingsBase=renderSettings;
renderSettings=function(){let h=v50SettingsBase();return h.replace('AniList · AniSearch · AniWatch', 'AniList · AniSearch · AniWatch · Simkl');};

