/* ============================================================
   MediaFlow v136 — On This Day lifecycle events
   Combines real History logs with per-title Start/Finish dates.
   Start/Finish events are display-only; they do not create fake sessions,
   consumption minutes, scheduler activity, or XP.
   ============================================================ */
renderOnThisDay=function(){
  const now=new Date(),groups=new Map();

  const add=(date,event)=>{
    if(!(date instanceof Date) || Number.isNaN(date.getTime()))return;
    const years=now.getFullYear()-date.getFullYear();
    if(years<1 || date.getMonth()!==now.getMonth() || date.getDate()!==now.getDate())return;
    if(!groups.has(years))groups.set(years,[]);
    groups.get(years).push(Object.assign({timestamp:date.getTime(),date},event));
  };

  const eventDate=ts=>{
    ts=Number(ts)||0;
    if(!ts)return null;
    const d=new Date(ts);
    return Number.isNaN(d.getTime())?null:d;
  };

  // Actual consumption History.
  for(const s of (S.sessions||[])){
    if(!s || s.status==='skipped')continue;

    const key=v119SessionDateKey(s);
    if(!key)continue;
    const d=new Date(key+'T12:00:00');
    if(Number.isNaN(d.getTime()))continue;

    const years=now.getFullYear()-d.getFullYear();
    if(years<1 || d.getMonth()!==now.getMonth() || d.getDate()!==now.getDate())continue;

    const titles=Array.isArray(s.titles)&&s.titles.length
      ? s.titles.filter(t=>t?.title)
      : (s.title?[{
          title:s.title,
          libraryId:s.libraryId||null,
          qty:s.actualAmount||0,
          categoryId:s.categoryId||null
        }]:[]);

    if(!titles.length)continue;

    const totalQty=titles.reduce(
      (n,t)=>n+Math.max(0,Number(t?.qty ?? t?.amount ?? 0)||0),
      0
    );
    const sessionMinutes=Math.max(0,Number(s.minutes)||0);

    for(const t of titles){
      const qty=Math.max(0,Number(t?.qty ?? t?.amount ?? 0)||0);
      let minutes=Math.max(0,Number(t?.minutes)||0);

      if(!minutes && sessionMinutes>0){
        if(titles.length===1)minutes=sessionMinutes;
        else if(totalQty>0)minutes=sessionMinutes*(qty/totalQty);
        else minutes=sessionMinutes/titles.length;
      }

      add(d,{
        kind:'logged',
        title:cleanTitle(t.title),
        libraryId:t.libraryId||null,
        categoryId:t.categoryId||s.categoryId||null,
        qty,
        minutes
      });
    }
  }

  // Title lifecycle dates — including MAL-imported v136 dates.
  for(const item of (S.library||[])){
    const title=cleanTitle(item?.title||'');
    if(!title)continue;

    const started=eventDate(item?.startedAt);
    if(started)add(started,{
      kind:'started',
      title,
      libraryId:item.id||null,
      categoryId:item.categoryId||null,
      qty:0,
      minutes:0
    });

    const finished=eventDate(item?.completedAt);
    if(finished)add(finished,{
      kind:'finished',
      title,
      libraryId:item.id||null,
      categoryId:item.categoryId||null,
      qty:0,
      minutes:0
    });
  }

  if(!groups.size)return '';

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

  const verb={started:'Started',finished:'Finished',logged:'Logged'};
  const icon={started:'▶',finished:'✓',logged:'●'};
  const priority={started:0,logged:1,finished:2};

  // Merge duplicate History rows for the same title/year while keeping Started
  // and Finished as their own meaningful events.
  const grouped=[];
  for(const [years,raw] of [...groups.entries()].sort((a,b)=>a[0]-b[0])){
    raw.sort((a,b)=>
      (Number(a.timestamp)||0)-(Number(b.timestamp)||0) ||
      (priority[a.kind]??9)-(priority[b.kind]??9)
    );

    const merged=[],byKey=new Map();
    for(const x of raw){
      const identity=x.libraryId
        ? `id:${String(x.libraryId)}`
        : `title:${cleanTitle(x.title).toLowerCase()}::${String(x.categoryId||'')}`;
      const key=`${x.kind}::${identity}`;

      let m=byKey.get(key);
      if(!m){
        m={...x,qty:0,minutes:0};
        byKey.set(key,m);
        merged.push(m);
      }
      m.qty+=Math.max(0,Number(x.qty)||0);
      m.minutes+=Math.max(0,Number(x.minutes)||0);
    }

    if(merged.length)grouped.push({years,rows:merged});
  }

  if(!grouped.length)return '';

  const amountText=x=>{
    if(x.kind!=='logged')return '';
    const item=v50FindLibraryItem(x.libraryId,x.title);
    const cat=getCategory(item?.categoryId||x.categoryId);
    const bits=[];
    const qty=Math.max(0,Number(x.qty)||0);
    const minutes=Math.max(0,Math.round(Number(x.minutes)||0));
    if(qty>0)bits.push(`${qty} ${unitLabel(cat?.unit||'units',qty)}`);
    if(minutes>0)bits.push(fmtMinutes(minutes));
    return bits.join(' · ');
  };

  const nearest=grouped[0],first=nearest.rows[0];
  const firstItem=v50FindLibraryItem(first.libraryId,first.title);
  const firstCat=getCategory(firstItem?.categoryId||first.categoryId);
  const totalExtra=Math.max(0,nearest.rows.length-1);
  const otherYears=Math.max(0,grouped.length-1);

  let more='';
  if(totalExtra)more+=`+${totalExtra} more event${totalExtra===1?'':'s'} that day`;
  if(otherYears)more+=(more?' · ':'')+`${otherYears} other matching year${otherYears===1?'':'s'}`;
  more=more?more+' · tap to view all':'Tap to view details';

  const body=grouped.map(group=>{
    const rows=group.rows.map(x=>{
      const item=v50FindLibraryItem(x.libraryId,x.title);
      const cat=getCategory(item?.categoryId||x.categoryId);
      const amount=amountText(x);

      return `<div class="v126-otd-row">
        ${coverMarkup(item,false,x.categoryId,x.title)}
        <div class="v126-otd-row-copy">
          <span class="v136-otd-event" data-kind="${x.kind}">${icon[x.kind]||'•'} ${verb[x.kind]||'Event'}</span>
          <b>${escapeHtml(cleanTitle(x.title))}</b>
          <small>${escapeHtml(cat?.name||'Library')}${amount?` · ${escapeHtml(amount)}`:''}</small>
        </div>
      </div>`;
    }).join('');

    const eventCount=group.rows.length;
    return `<div class="v126-otd-year">
      <div class="v126-otd-year-head">
        <strong>${group.years} year${group.years===1?'':'s'} ago</strong>
        <span>${eventCount.toLocaleString()} event${eventCount===1?'':'s'}</span>
      </div>
      ${rows}
    </div>`;
  }).join('');

  return `<details class="on-this-day v126-otd" data-mf-on-this-day-version="136">
    <summary class="v126-otd-summary">
      ${coverMarkup(firstItem,true,first.categoryId,first.title)}
      <div class="v126-otd-copy">
        <span>On this day · ${nearest.years} year${nearest.years===1?'':'s'} ago</span>
        <b>${escapeHtml(`${verb[first.kind]||'Event'} ${cleanTitle(first.title)}`)}</b>
        <small>${escapeHtml(firstCat?.name||'Library')}</small>
        <span class="v126-otd-more">${escapeHtml(more)}</span>
      </div>
      <span class="v126-otd-chevron">⌄</span>
    </summary>
    <div class="v126-otd-body">${body}</div>
  </details>`;
};



