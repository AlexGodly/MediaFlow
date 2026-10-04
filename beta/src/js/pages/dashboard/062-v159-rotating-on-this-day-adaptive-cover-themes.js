/* ============================================================
   MediaFlow v159 — Rotating On This Day + Adaptive Cover Themes
   ------------------------------------------------------------
   Dashboard / On This Day
   - summary shows ONLY the current title, then its event underneath;
   - all matching titles remain in the expandable list;
   - every surviving Library title gets Edit directly in the list;
   - the single summary title rotates without rerendering Dashboard;
   - On This Day data is cached and invalidated only by Library/History changes.

   Dynamic Cover Theme
   - On This Day rotation immediately feeds its new cover to Dynamic Theme;
   - periodic theme refreshes randomly alternate source priority between the
     current recommendation and On This Day titles;
   - Global Appearance ON  -> obey selected Light/Dark;
   - Global Appearance OFF -> choose the cover's own natural Light/Dark mode;
   - extract several cover colors and use them across surfaces/gradients instead
     of generating a mostly monochrome palette.
   ============================================================ */

const V159_OTD_ROTATE_MS=12000;
let V159_OTD_ROTATE_TIMER=null;
let V159_OTD_CURRENT_INDEX=0;
let V159_OTD_CACHE={dirty:true,dayKey:'',groups:[],flat:[]};

let V159_DYNAMIC_SOURCE_TIMER=null;
let V159_FORCED_THEME_SOURCE=null;
const V159_COVER_THEME_CACHE=new Map();

function v159TodayKey(){
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function v159MarkOnThisDayDirty(){
  V159_OTD_CACHE.dirty=true;
}

function v159LibraryLookup(){
  const byId=new Map();
  const byTitle=new Map();

  for(const item of (S.library||[])){
    if(!item)continue;
    if(item.id)byId.set(String(item.id),item);

    const key=cleanTitle(item.title||'').toLocaleLowerCase();
    if(!key)continue;
    let rows=byTitle.get(key);
    if(!rows){rows=[];byTitle.set(key,rows);}
    rows.push(item);
  }

  const find=(libraryId,title,categoryId)=>{
    if(libraryId){
      const item=byId.get(String(libraryId));
      if(item)return item;
    }

    const key=cleanTitle(title||'').toLocaleLowerCase();
    const rows=byTitle.get(key)||[];
    if(rows.length===1)return rows[0];

    const catRows=rows.filter(x=>String(x.categoryId||'')===String(categoryId||''));
    return catRows.length===1?catRows[0]:null;
  };

  return {byId,byTitle,find};
}

function v159BuildOnThisDayModel(){
  const dayKey=v159TodayKey();if(!V159_OTD_CACHE.dirty && V159_OTD_CACHE.dayKey===dayKey){
    return V159_OTD_CACHE;
  }

  const now=new Date();
  const groups=new Map();
  const lib=v159LibraryLookup();

  const add=(date,event)=>{
    if(!(date instanceof Date)||Number.isNaN(date.getTime()))return;

    const years=now.getFullYear()-date.getFullYear();
    if(
      years<1 ||
      date.getMonth()!==now.getMonth() ||
      date.getDate()!==now.getDate()
    )return;

    if(!groups.has(years))groups.set(years,[]);
    groups.get(years).push(Object.assign({
      timestamp:date.getTime(),
      years
    },event));
  };

  const eventDate=ts=>{
    ts=Number(ts)||0;
    if(!ts)return null;
    const d=new Date(ts);
    return Number.isNaN(d.getTime())?null:d;
  };

  // Genuine History logs. Editable History day stays authoritative.
  for(const s of (S.sessions||[])){
    if(!s||s.status==='skipped')continue;

    const key=typeof v119SessionDateKey==='function'?v119SessionDateKey(s):'';
    let d=null;

    if(key){
      const parsed=new Date(key+'T12:00:00');
      if(!Number.isNaN(parsed.getTime()))d=parsed;
    }
    if(!d&&Number(s.timestamp)>0){
      const parsed=new Date(Number(s.timestamp));
      if(!Number.isNaN(parsed.getTime()))d=parsed;
    }
    if(!d)continue;

    const years=now.getFullYear()-d.getFullYear();
    if(
      years<1 ||
      d.getMonth()!==now.getMonth() ||
      d.getDate()!==now.getDate()
    )continue;

    const titles=Array.isArray(s.titles)&&s.titles.length
      ?s.titles.filter(t=>t?.title)
      :(s.title?[{
          title:s.title,
          libraryId:s.libraryId||null,
          qty:s.actualAmount||0,
          categoryId:s.categoryId||null
        }]:[]);

    if(!titles.length)continue;

    const totalQty=titles.reduce(
      (n,t)=>n+Math.max(0,Number(t?.qty??t?.amount??0)||0),
      0
    );
    const sessionMinutes=Math.max(0,Number(s.minutes)||0);

    for(const t of titles){
      const qty=Math.max(0,Number(t?.qty??t?.amount??0)||0);
      let minutes=Math.max(0,Number(t?.minutes)||0);

      if(!minutes&&sessionMinutes>0){
        if(titles.length===1)minutes=sessionMinutes;
        else if(totalQty>0)minutes=sessionMinutes*(qty/totalQty);
        else minutes=sessionMinutes/titles.length;
      }

      const item=lib.find(t.libraryId,t.title,t.categoryId||s.categoryId);

      add(d,{
        kind:'logged',
        title:cleanTitle(t.title),
        libraryId:item?.id||t.libraryId||null,
        categoryId:item?.categoryId||t.categoryId||s.categoryId||null,
        qty,
        minutes,
        item:item||null
      });
    }
  }

  // Library lifecycle dates.
  for(const item of (S.library||[])){
    const title=cleanTitle(item?.title||'');
    if(!title)continue;

    const started=eventDate(item.startedAt);
    if(started)add(started,{
      kind:'started',
      title,
      libraryId:item.id||null,
      categoryId:item.categoryId||null,
      qty:0,
      minutes:0,
      item
    });

    const finished=eventDate(item.completedAt);
    if(finished)add(finished,{
      kind:'finished',
      title,
      libraryId:item.id||null,
      categoryId:item.categoryId||null,
      qty:0,
      minutes:0,
      item
    });
  }

  const priority={started:0,logged:1,finished:2};
  const grouped=[];

  for(const [years,raw] of [...groups.entries()].sort((a,b)=>a[0]-b[0])){
    raw.sort((a,b)=>
      (Number(a.timestamp)||0)-(Number(b.timestamp)||0) ||
      (priority[a.kind]??9)-(priority[b.kind]??9)
    );

    const merged=[];
    const byKey=new Map();

    for(const x of raw){
      const identity=x.libraryId
        ?`id:${String(x.libraryId)}`
        :`title:${cleanTitle(x.title).toLocaleLowerCase()}::${String(x.categoryId||'')}`;

      const key=`${x.kind}::${identity}`;
      let m=byKey.get(key);

      if(!m){
        m=Object.assign({},x,{qty:0,minutes:0});
        byKey.set(key,m);
        merged.push(m);
      }

      m.qty+=Math.max(0,Number(x.qty)||0);
      m.minutes+=Math.max(0,Number(x.minutes)||0);
    }

    if(merged.length)grouped.push({years,rows:merged});
  }

  const flat=[];
  for(const group of grouped){
    for(const row of group.rows){
      row.years=group.years;
      flat.push(row);
    }
  }

  V159_OTD_CACHE={
    dirty:false,
    dayKey,
    groups:grouped,
    flat
  };

  return V159_OTD_CACHE;
}

function v159OtdVerb(kind){
  return ({started:'Started',finished:'Finished',logged:'Logged'})[kind]||'Event';
}

function v159OtdIcon(kind){
  return ({started:'▶',finished:'✓',logged:'●'})[kind]||'•';
}

function v159OtdAmountText(x){
  if(x?.kind!=='logged')return '';

  const item=x.item||v50FindLibraryItem(x.libraryId,x.title);
  const cat=getCategory(item?.categoryId||x.categoryId);
  const bits=[];
  const qty=Math.max(0,Number(x.qty)||0);
  const minutes=Math.max(0,Math.round(Number(x.minutes)||0));

  if(qty>0)bits.push(`${qty} ${unitLabel(cat?.unit||'units',qty)}`);
  if(minutes>0)bits.push(fmtMinutes(minutes));

  return bits.join(' · ');
}

function v159OtdCoverMarkup(x,summary=false){
  const item=x?.item||v50FindLibraryItem(x?.libraryId,x?.title);
  const cat=getCategory(item?.categoryId||x?.categoryId);
  const cls=summary?'v126-otd-summary':'v126-otd-row';
  const icon=v144CategoryIconHtml(cat);
  const title=cleanTitle(item?.title||x?.title||'');

  if(item?.coverUrl){
    return `<img class="${cls}-cover" src="${escapeHtml(String(item.coverUrl))}" alt="${escapeHtml(title)} cover" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="${cls}-placeholder" style="display:none">${icon}</div>`;
  }

  return `<div class="${cls}-placeholder">${icon}</div>`;
}

function v159OtdEventLine(x,summary=false){
  const amount=v159OtdAmountText(x);
  const ago=`${x.years} year${x.years===1?'':'s'} ago`;
  const extra=amount?` · ${amount}`:'';

  if(summary){
    return `<span class="v159-otd-event-chip">${v159OtdIcon(x.kind)} ${escapeHtml(v159OtdVerb(x.kind))}</span>${escapeHtml(ago+extra)}`;
  }

  return `<span class="v159-otd-event-chip">${v159OtdIcon(x.kind)} ${escapeHtml(v159OtdVerb(x.kind))}</span>${amount?`<span>${escapeHtml(amount)}</span>`:''}`;
}

function v159OtdInitialIndex(model){
  const count=model?.flat?.length||0;
  if(count<=1)return 0;
  return Math.floor(Date.now()/V159_OTD_ROTATE_MS)%count;
}

function v159OtdThemeSource(x){
  const item=x?.item||v50FindLibraryItem(x?.libraryId,x?.title);
  if(!item?.coverUrl)return null;

  return {
    source:'onthisday',
    label:`On This Day: ${cleanTitle(item.title||x.title)}`,
    url:String(item.coverUrl),
    libraryId:item.id||x.libraryId||null
  };
}

renderOnThisDay=function(){
  const model=v159BuildOnThisDayModel();
  if(!model.flat.length)return '';

  V159_OTD_CURRENT_INDEX=v159OtdInitialIndex(model);
  const hero=model.flat[V159_OTD_CURRENT_INDEX]||model.flat[0];

  const body=model.groups.map(group=>{
    const rows=group.rows.map(x=>{
      const item=x.item||v50FindLibraryItem(x.libraryId,x.title);
      const edit=item?.id
        ?`<button type="button" class="btn btn-sm btn-ghost v159-otd-edit" onclick="event.preventDefault();event.stopPropagation();App.openLibraryModal('${escapeHtml(String(item.id))}')">Edit</button>`
        :'';

      return `<div class="v126-otd-row v159-otd-row">
        ${v159OtdCoverMarkup(x,false)}
        <div class="v126-otd-row-copy v159-otd-row-copy">
          <b>${escapeHtml(cleanTitle(x.title))}</b>
          <div class="v159-otd-row-event">${v159OtdEventLine(x,false)}</div>
        </div>
        ${edit}
      </div>`;
    }).join('');

    return `<div class="v126-otd-year">
      <div class="v126-otd-year-head">
        <strong>${group.years} year${group.years===1?'':'s'} ago</strong>
        <span>${group.rows.length.toLocaleString()} event${group.rows.length===1?'':'s'}</span>
      </div>
      ${rows}
    </div>`;
  }).join('');

  return `<details class="on-this-day v126-otd" data-mf-on-this-day-version="159">
    <summary class="v126-otd-summary" id="v159-otd-summary" data-v159-index="${V159_OTD_CURRENT_INDEX}">
      <div class="v159-otd-summary-cover-slot" id="v159-otd-summary-cover">${v159OtdCoverMarkup(hero,true)}</div>
      <div class="v126-otd-copy">
        <b class="v159-otd-summary-title" id="v159-otd-summary-title">${escapeHtml(cleanTitle(hero.title))}</b>
        <span class="v159-otd-summary-event" id="v159-otd-summary-event">${v159OtdEventLine(hero,true)}</span>
      </div>
      <span class="v126-otd-chevron">⌄</span>
    </summary>
    <div class="v126-otd-body">${body}</div>
  </details>`;
};

function v159ApplyOtdHero(index,{forceTheme=true}={}){
  const model=v159BuildOnThisDayModel();
  const count=model.flat.length;
  if(!count)return;

  const normalized=((Number(index)||0)%count+count)%count;
  const x=model.flat[normalized];

  V159_OTD_CURRENT_INDEX=normalized;

  const summary=document.getElementById('v159-otd-summary');
  const cover=document.getElementById('v159-otd-summary-cover');
  const title=document.getElementById('v159-otd-summary-title');
  const event=document.getElementById('v159-otd-summary-event');

  if(!summary||!cover||!title||!event)return;

  summary.dataset.v159Index=String(normalized);
  cover.innerHTML=v159OtdCoverMarkup(x,true);
  title.textContent=cleanTitle(x.title);
  event.innerHTML=v159OtdEventLine(x,true);

  if(forceTheme&&S.settings?.dynamicCoverTheme){
    const source=v159OtdThemeSource(x);
    if(source){
      V159_FORCED_THEME_SOURCE=source;
      v146ScheduleDynamicTheme();
    }
  }
}

function v159ScheduleOtdRotation(){
  clearTimeout(V159_OTD_ROTATE_TIMER);
  V159_OTD_ROTATE_TIMER=null;

  if(S.view!=='dashboard')return;

  const model=v159BuildOnThisDayModel();
  if(model.flat.length<=1)return;
  if(!document.getElementById('v159-otd-summary'))return;

  const elapsed=Date.now()%V159_OTD_ROTATE_MS;
  const delay=Math.max(1500,V159_OTD_ROTATE_MS-elapsed);

  V159_OTD_ROTATE_TIMER=setTimeout(()=>{
    if(S.view!=='dashboard')return;
    const latest=v159BuildOnThisDayModel();
    if(latest.flat.length>1){
      v159ApplyOtdHero((V159_OTD_CURRENT_INDEX+1)%latest.flat.length,{forceTheme:true});
    }
    v159ScheduleOtdRotation();
  },delay);
}

// Invalidate the expensive On This Day model only when the data it reads changes.
const v159InvalidateLibraryCacheBase=v53InvalidateLibraryCache;
v53InvalidateLibraryCache=function(){
  v159MarkOnThisDayDirty();
  return v159InvalidateLibraryCacheBase.apply(this,arguments);
};

const v159InvalidateSessionCacheBase=v53InvalidateSessionCache;
v53InvalidateSessionCache=function(){
  v159MarkOnThisDayDirty();
  return v159InvalidateSessionCacheBase.apply(this,arguments);
};

// ------------------------------------------------------------
// Rich multi-color cover extraction
// ------------------------------------------------------------

function v159ColorDistance(a,b){
  if(!a||!b)return Infinity;
  const dr=a.r-b.r,dg=a.g-b.g,db=a.b-b.b;
  return Math.sqrt(dr*dr+dg*dg+db*db);
}

function v159HexRgb(hex){
  return v146RgbFromHex(hex)||v145CssColorToRgb(hex);
}

function v159HexFromHsl(h,s,l){
  return v146HslHex(h,s,l);
}

function v159TuneThemeColor(hex,mode,role='accent'){
  const rgb=v159HexRgb(hex);
  if(!rgb)return hex;
  const hsl=v145RgbToHsl(rgb.r,rgb.g,rgb.b);

  if(role==='accent'){
    const s=Math.max(58,Math.min(92,hsl.s*1.14||66));
    const l=mode==='light'?Math.max(34,Math.min(52,hsl.l)):Math.max(52,Math.min(68,hsl.l));
    return v159HexFromHsl(hsl.h,s,l);
  }

  const s=Math.max(32,Math.min(78,hsl.s||48));
  const l=mode==='light'?Math.max(38,Math.min(62,hsl.l)):Math.max(42,Math.min(68,hsl.l));
  return v159HexFromHsl(hsl.h,s,l);
}

function v159DerivedThemeDataFromAccent(accent){
  const rgb=v159HexRgb(accent);
  if(!rgb)return null;
  const hsl=v145RgbToHsl(rgb.r,rgb.g,rgb.b);

  return {
    colors:[
      v159HexFromHsl(hsl.h,Math.max(52,hsl.s),Math.max(42,Math.min(64,hsl.l))),
      v159HexFromHsl(hsl.h+48,Math.max(46,hsl.s*.88),55),
      v159HexFromHsl(hsl.h+188,Math.max(42,hsl.s*.78),52)
    ],
    naturalMode:v145Luminance(rgb)>.52?'light':'dark',
    averageLuminance:v145Luminance(rgb),
    derived:true
  };
}

function v159ExtractCoverTheme(url){
  const src=String(url||'').trim();
  if(!src)return Promise.resolve(null);
  if(V159_COVER_THEME_CACHE.has(src))return V159_COVER_THEME_CACHE.get(src);

  const promise=new Promise(resolve=>{
    const img=new Image();
    img.crossOrigin='anonymous';

    const fallback=async()=>{
      try{
        const accent=await v145ExtractCoverAccent(src);
        resolve(accent?v159DerivedThemeDataFromAccent(accent):null);
      }catch(_){
        resolve(null);
      }
    };

    img.onerror=fallback;

    img.onload=()=>{
      try{
        const canvas=document.createElement('canvas');
        const w=54,h=72;
        canvas.width=w;
        canvas.height=h;

        const ctx=canvas.getContext('2d',{willReadFrequently:true});
        if(!ctx){fallback();return;}

        ctx.drawImage(img,0,0,w,h);
        const data=ctx.getImageData(0,0,w,h).data;
        const buckets=new Map();

        let lumSum=0,lumWeight=0;

        for(let i=0;i<data.length;i+=4){
          const a=data[i+3];
          if(a<180)continue;

          const r=data[i],g=data[i+1],b=data[i+2];
          const max=Math.max(r,g,b),min=Math.min(r,g,b);
          const sat=max?((max-min)/max):0;
          const lum=.2126*r+.7152*g+.0722*b;

          lumSum+=lum;
          lumWeight++;

          // Keep dark/light cover colors available, but de-emphasize near-gray.
          const qr=Math.round(r/24)*24;
          const qg=Math.round(g/24)*24;
          const qb=Math.round(b/24)*24;
          const key=`${qr},${qg},${qb}`;

          const vivid=.35+sat*1.9;
          const middle=.55+(1-Math.abs(lum/255-.50))*.45;
          const score=vivid*middle;

          const row=buckets.get(key)||{r:0,g:0,b:0,n:0,score:0};
          row.r+=r;row.g+=g;row.b+=b;row.n++;row.score+=score;
          buckets.set(key,row);
        }

        const ranked=[...buckets.values()]
          .filter(x=>x.n>=2)
          .map(x=>({
            r:x.r/x.n,
            g:x.g/x.n,
            b:x.b/x.n,
            n:x.n,
            score:x.score*Math.pow(x.n,.62)
          }))
          .sort((a,b)=>b.score-a.score);

        const picked=[];
        for(const row of ranked){
          if(picked.every(x=>v159ColorDistance(x,row)>=76)){
            picked.push(row);
            if(picked.length>=4)break;
          }
        }

        if(!picked.length){fallback();return;}

        const colors=picked.map(x=>v145RgbHex(x.r,x.g,x.b));
        while(colors.length<3){
          const seed=v159HexRgb(colors[0]);
          const hsl=v145RgbToHsl(seed.r,seed.g,seed.b);
          const shift=colors.length===1?52:188;
          colors.push(v159HexFromHsl(hsl.h+shift,Math.max(44,hsl.s*.86),54));
        }

        const average=lumWeight?lumSum/lumWeight/255:.35;
        resolve({
          colors:colors.slice(0,4),
          naturalMode:average>.58?'light':'dark',
          averageLuminance:average,
          derived:false
        });
      }catch(_){
        fallback();
      }
    };

    try{img.src=src;}catch(_){fallback();}
  });

  V159_COVER_THEME_CACHE.set(src,promise);
  return promise;
}

function v159DynamicAppearanceMode(themeData){
  // Global Appearance enabled = explicitly honor its selected Light/Dark mode.
  if(typeof v132GlobalAppearanceEnabled==='function'&&v132GlobalAppearanceEnabled()){
    return v106AppearanceMode()==='light'?'light':'dark';
  }

  // Global Appearance disabled = let the cover decide its own natural mode.
  return themeData?.naturalMode==='light'?'light':'dark';
}

v146DynamicAppearanceMode=v159DynamicAppearanceMode;

function v159CoverPalette(themeData,mode){
  if(!themeData?.colors?.length)return null;

  const raw1=themeData.colors[0];
  const raw2=themeData.colors[1]||raw1;
  const raw3=themeData.colors[2]||raw2;

  const primary=v159TuneThemeColor(raw1,mode,'accent');
  const secondary=v159TuneThemeColor(raw2,mode,'secondary');
  const tertiary=v159TuneThemeColor(raw3,mode,'secondary');

  if(mode==='light'){
    return {
      mode:'light',
      naturalMode:themeData.naturalMode,
      primary,
      secondary,
      tertiary,
      bg:v145MixHex(raw1,'#F5F7FB',.10),
      panel:v145MixHex(raw2,'#FFFFFF',.07),
      raised:v145MixHex(raw3,'#EDF1F7',.12),
      border:v145MixHex(secondary,'#CBD3DF',.18),
      borderSoft:v145MixHex(tertiary,'#DEE4EC',.11),
      text:'#121722',
      textDim:'#394354',
      textMute:'#667184',
      flow:primary,
      flowDim:v145MixHex(primary,'#D9E1EC',.36),
      selectionText:'#FFFFFF'
    };
  }

  return {
    mode:'dark',
    naturalMode:themeData.naturalMode,
    primary,
    secondary,
    tertiary,
    bg:v145MixHex(raw1,'#060912',.21),
    panel:v145MixHex(raw2,'#0B1019',.17),
    raised:v145MixHex(raw3,'#141B29',.20),
    border:v145MixHex(secondary,'#2C3545',.22),
    borderSoft:v145MixHex(tertiary,'#1D2635',.17),
    text:'#F4F7FB',
    textDim:'#C1CAD7',
    textMute:'#8793A5',
    flow:primary,
    flowDim:v145MixHex(primary,'#202A3A',.42),
    selectionText:'#FFFFFF'
  };
}

// Keep v146's proven base application, then add richer independent cover colors.
const v159ApplyFullPaletteBase=v146ApplyFullPalette;
v146ApplyFullPalette=function(palette,source){
  v159ApplyFullPaletteBase(palette,source);

  const root=document.documentElement;
  root.style.setProperty('--v159-primary',palette.primary||palette.flow);
  root.style.setProperty('--v159-secondary',palette.secondary||palette.flow);
  root.style.setProperty('--v159-tertiary',palette.tertiary||palette.flowDim);
  root.style.setProperty('--v159-selection-text',palette.selectionText||'#FFFFFF');
  root.dataset.v159DynamicRich='1';

  if(S.v146DynamicThemeState){
    S.v146DynamicThemeState.palette=palette;
    S.v146DynamicThemeState.naturalMode=palette.naturalMode||palette.mode;
  }

  v146UpdateThemeStatus();
};

const v159ClearInlineThemeVarsBase=v146ClearInlineThemeVars;
v146ClearInlineThemeVars=function(){
  const root=document.documentElement;
  for(const key of [
    '--v159-primary','--v159-secondary','--v159-tertiary','--v159-selection-text'
  ])root.style.removeProperty(key);
  root.removeAttribute('data-v159-dynamic-rich');
  return v159ClearInlineThemeVarsBase.apply(this,arguments);
};

function v159OnThisDayThemeSources(){
  const model=v159BuildOnThisDayModel();
  if(!model.flat.length)return [];

  const rows=[];
  const seen=new Set();

  const add=x=>{
    const source=v159OtdThemeSource(x);
    if(!source||seen.has(source.url))return;
    seen.add(source.url);
    rows.push(source);
  };

  const current=model.flat[V159_OTD_CURRENT_INDEX]||model.flat[0];
  if(current)add(current);

  for(const row of model.flat)add(row);

  return rows;
}

// Redirect the old On This Day theme source helper to the cached v159 model.
v145OnThisDayCoverSources=function(){
  return v159OnThisDayThemeSources().map((x,index)=>({
    years:0,
    priority:index,
    timestamp:index,
    label:x.label,
    url:x.url
  }));
};

function v159RandomIndex(length){
  if(length<=1)return 0;
  return Math.floor(Math.random()*length);
}

function v159DynamicSourceOrder(){
  if(V159_FORCED_THEME_SOURCE){
    const forced=V159_FORCED_THEME_SOURCE;
    V159_FORCED_THEME_SOURCE=null;
    return [forced];
  }

  const rec=v145RecommendedCoverSource();
  const otd=v159OnThisDayThemeSources();

  if(rec&&otd.length){
    // Randomly switch which source family receives first priority.
    const onThisDayFirst=Math.random()<.5;
    const chosenOtd=otd[v159RandomIndex(otd.length)];

    if(onThisDayFirst){
      return [chosenOtd,rec,...otd.filter(x=>x.url!==chosenOtd.url).slice(0,1)];
    }

    return [rec,chosenOtd,...otd.filter(x=>x.url!==chosenOtd.url).slice(0,1)];
  }

  if(rec)return [rec];
  if(otd.length){
    const first=otd[v159RandomIndex(otd.length)];
    return [first,...otd.filter(x=>x.url!==first.url).slice(0,1)];
  }

  return [];
}

// FINAL Dynamic Cover Theme resolver.
v146RefreshDynamicTheme=async function(){
  const seq=++V146_DYNAMIC_SEQ;

  if(!S.settings?.dynamicCoverTheme){
    v146RestoreSelectedThemeFallback();
    document.documentElement.dataset.v146ThemeMode='collection';
    return;
  }

  document.documentElement.dataset.v146ThemeMode='dynamic';

  const sources=v159DynamicSourceOrder();

  for(const source of sources){
    const themeData=await v159ExtractCoverTheme(source.url);
    if(seq!==V146_DYNAMIC_SEQ)return;
    if(!themeData)continue;

    const mode=v159DynamicAppearanceMode(themeData);
    const palette=v159CoverPalette(themeData,mode);

    if(palette){
      v146ApplyFullPalette(palette,source);
      return;
    }
  }

  if(seq===V146_DYNAMIC_SEQ)v146RestoreSelectedThemeFallback();
};

v146UpdateThemeStatus=function(){
  const el=document.getElementById('v146-dynamic-theme-status');
  if(!el)return;

  const st=S.v146DynamicThemeState||{};
  const enabled=!!S.settings?.dynamicCoverTheme;
  const p=st.palette;

  let text='Theme collections are active.';

  if(enabled){
    if(st.source==='recommended'||st.source==='onthisday'){
      const appearance=typeof v132GlobalAppearanceEnabled==='function'&&v132GlobalAppearanceEnabled()
        ?`Global ${p?.mode||'dynamic'}`
        :`Natural ${p?.mode||st.naturalMode||'dynamic'}`;

      text=`${st.label} · ${appearance} · multi-color cover theme`;
    }else{
      text='No usable cover right now — using your selected fallback theme.';
    }
  }

  const colors=p
    ?[p.bg,p.panel,p.primary||p.flow,p.secondary,p.tertiary,p.text].filter(Boolean)
    :[];

  el.innerHTML=`<span>${escapeHtml(text)}</span>${colors.length?`<span class="v146-theme-swatches">${colors.map(c=>`<span class="v146-theme-swatch" style="background:${escapeHtml(c)}"></span>`).join('')}</span>`:''}`;
};

function v159EnsureDynamicSourceTimer(){
  if(!S.settings?.dynamicCoverTheme){
    clearTimeout(V159_DYNAMIC_SOURCE_TIMER);
    V159_DYNAMIC_SOURCE_TIMER=null;
    return;
  }

  if(V159_DYNAMIC_SOURCE_TIMER)return;

  const schedule=()=>{
    if(!S.settings?.dynamicCoverTheme){
      V159_DYNAMIC_SOURCE_TIMER=null;
      return;
    }

    // 24–36 seconds keeps the theme alive without turning it into a rapid
    // slideshow or continuously analyzing images.
    const delay=24000+Math.floor(Math.random()*12000);

    V159_DYNAMIC_SOURCE_TIMER=setTimeout(()=>{
      V159_DYNAMIC_SOURCE_TIMER=null;

      if(S.settings?.dynamicCoverTheme){
        V159_FORCED_THEME_SOURCE=null;
        v146ScheduleDynamicTheme();
        schedule();
      }
    },delay);
  };

  schedule();
}

// Settings copy now explains the new source rotation / natural appearance logic.
const v159RenderSettingsBase=renderSettings;
renderSettings=function(){
  let out=v159RenderSettingsBase();

  out=out.replace(
    'Your selected static theme is kept as the fallback. Dynamic Cover Theme uses the recommended title cover first, then On This Day. If neither cover can be used, MediaFlow returns to this fallback automatically.',
    'Your selected static theme is kept only as a fallback. Dynamic Cover Theme now rotates source priority between MediaFlow recommendations and On This Day covers. With Global Appearance off, each cover chooses its own natural Light/Dark treatment; with Global Appearance on, your selected Light/Dark mode wins.'
  );

  out=out.replace(
    'The cover now controls the whole MediaFlow color system — background, panels, raised surfaces, borders, text and accent — not only the accent color.',
    'The cover now creates a multi-color MediaFlow theme: independent background, panel, raised-surface, border and accent colors plus cover-driven gradients/glows. It no longer reduces the artwork to one flat hue.'
  );

  return out;
};

// After every real render, only arm lightweight timers. The On This Day
// rotation itself updates four small DOM nodes and does not rerender Dashboard.
const v159RenderBase=render;
render=function(){
  const result=v159RenderBase.apply(this,arguments);

  Promise.resolve().then(()=>{
    v159ScheduleOtdRotation();
    v159EnsureDynamicSourceTimer();
  });

  return result;
};



