/* ============================================================
   MediaFlow v162 — User-controlled adaptive cover collections
   ============================================================ */

const V162_BACKUP_SCHEMA_VERSION=5;
const V162_THEME_MODES=new Set(['dynamic','library','image']);
let V162_ROTATION_TIMER=null;
let V162_ROTATION_MODE='';
let V162_ROTATION_INDEX={library:0,image:0};
let V162_LIBRARY_SEARCH_TIMER=null;

function v162ClampInterval(value){
  const n=Math.round(Number(value)||30);
  return Math.max(5,Math.min(3600,n));
}

function v162NormalizeHttpImageUrl(value){
  let s=String(value||'').trim();
  if(!s)return '';
  if(/^\/\//.test(s))s='https:'+s;
  if(!/^https?:\/\//i.test(s))return '';
  try{
    const u=new URL(s);
    return /^https?:$/i.test(u.protocol)?u.href:'';
  }catch(_){
    return '';
  }
}

function v162EnsureThemeSettingsObject(settings){
  const target=(settings&&typeof settings==='object')?settings:{};

  let mode=String(target.v162ThemeCollection||'').toLowerCase();
  if(!V162_THEME_MODES.has(mode))mode='dynamic';
  target.v162ThemeCollection=mode;

  const library=(target.v162LibraryTheme&&typeof target.v162LibraryTheme==='object')
    ?target.v162LibraryTheme:{};
  library.titleIds=[...new Set(
    (Array.isArray(library.titleIds)?library.titleIds:[])
      .map(String)
      .filter(Boolean)
  )];
  library.intervalSec=v162ClampInterval(library.intervalSec);
  library.modifiedAt=Number(library.modifiedAt)||0;
  target.v162LibraryTheme=library;

  const image=(target.v162ImageTheme&&typeof target.v162ImageTheme==='object')
    ?target.v162ImageTheme:{};
  image.urls=[...new Set(
    (Array.isArray(image.urls)?image.urls:[])
      .map(v162NormalizeHttpImageUrl)
      .filter(Boolean)
  )];
  image.intervalSec=v162ClampInterval(image.intervalSec);
  image.modifiedAt=Number(image.modifiedAt)||0;
  target.v162ImageTheme=image;

  return target;
}

function v162EnsureThemeSettings(){
  S.settings=v162EnsureThemeSettingsObject(S.settings||DEFAULT_SETTINGS);
  return S.settings;
}

v162EnsureThemeSettings();

function v162ThemeMode(){
  const s=v162EnsureThemeSettings();
  if(!s.dynamicCoverTheme)return 'static';
  return V162_THEME_MODES.has(s.v162ThemeCollection)?s.v162ThemeCollection:'dynamic';
}

function v162StopRotation(){
  clearTimeout(V162_ROTATION_TIMER);
  V162_ROTATION_TIMER=null;
  V162_ROTATION_MODE='';
}

function v162LibraryThemeSources(){
  const cfg=v162EnsureThemeSettings().v162LibraryTheme;
  const byId=new Map((S.library||[]).map(x=>[String(x?.id||''),x]));
  const out=[];

  for(const id of cfg.titleIds){
    const item=byId.get(String(id));
    const url=v160SafeCoverUrl(item?.coverUrl);
    if(!item||!url)continue;
    out.push({
      source:'librarytheme',
      label:`Library Cover: ${cleanTitle(item.title)}`,
      url,
      libraryId:item.id
    });
  }

  return out;
}

function v162ImageThemeSources(){const cfg=v162EnsureThemeSettings().v162ImageTheme;
  return cfg.urls.map((url,index)=>({
    source:'imagetheme',
    label:`Custom Image ${index+1}`,
    url
  }));
}

function v162RotatingSources(mode){
  const rows=mode==='library'?v162LibraryThemeSources():v162ImageThemeSources();
  if(!rows.length)return [];

  const index=((Number(V162_ROTATION_INDEX[mode])||0)%rows.length+rows.length)%rows.length;
  const first=rows[index];

  // Current rotation item first. Remaining configured sources are safe fallback
  // candidates if the current URL cannot be loaded.
  return [first,...rows.filter((_,i)=>i!==index)];
}

function v162ThemeSources(){
  const mode=v162ThemeMode();

  if(mode==='dynamic')return v160AllDynamicSources();

  // On This Day may request a forced Dynamic source every 12 seconds. Custom
  // collections intentionally ignore it; their user-selected rotation remains
  // authoritative.
  V159_FORCED_THEME_SOURCE=null;

  if(mode==='library')return v162RotatingSources('library');
  if(mode==='image')return v162RotatingSources('image');
  return [];
}

function v162SoftPalette(themeData,mode){
  const p=v159CoverPalette(themeData,mode);
  if(!p)return null;

  // Dynamic Cover Theme keeps its expressive v159 palette. The two manually
  // curated collections are intentionally calmer so a chosen poster/photo
  // influences the whole UI without overpowering content.
  if(v162ThemeMode()==='dynamic')return p;

  if(mode==='light'){
    p.bg=v145MixHex(p.bg,'#F4F6FA',.38);
    p.panel=v145MixHex(p.panel,'#FFFFFF',.32);
    p.raised=v145MixHex(p.raised,'#EDF1F6',.38);
    p.border=v145MixHex(p.border,'#CCD3DE',.48);
    p.borderSoft=v145MixHex(p.borderSoft,'#DCE2EA',.42);
    p.primary=v145MixHex(p.primary,'#53606F',.76);
    p.secondary=v145MixHex(p.secondary,'#677383',.72);
    p.tertiary=v145MixHex(p.tertiary,'#75808E',.68);
    p.flow=p.primary;
    p.flowDim=v145MixHex(p.primary,'#D8DEE7',.32);
    p.text='#151A22';
    p.textDim='#3E4857';
    p.textMute='#687486';
  }else{
    p.bg=v145MixHex(p.bg,'#080C13',.42);
    p.panel=v145MixHex(p.panel,'#0D121B',.40);
    p.raised=v145MixHex(p.raised,'#151C28',.44);
    p.border=v145MixHex(p.border,'#303947',.48);
    p.borderSoft=v145MixHex(p.borderSoft,'#202938',.42);
    p.primary=v145MixHex(p.primary,'#AAB5C4',.78);
    p.secondary=v145MixHex(p.secondary,'#8E9AAA',.72);
    p.tertiary=v145MixHex(p.tertiary,'#7D8998',.68);
    p.flow=p.primary;
    p.flowDim=v145MixHex(p.primary,'#222D3B',.38);
    p.text='#F5F7FA';
    p.textDim='#C5CDD8';
    p.textMute='#8D98A8';
  }

  return p;
}

function v162HasLiveCoverTheme(){
  const st=S.v146DynamicThemeState||{};
  return (
    document.documentElement.dataset.v146DynamicActive==='1' &&
    !!st.palette &&
    ['recommended','onthisday','librarytheme','imagetheme'].includes(String(st.source||''))
  );
}

// Tag the adaptive source family so CSS can keep curated custom collections
// intentionally calmer than normal Dynamic Cover Theme.
const v162ApplyFullPaletteBase=v146ApplyFullPalette;
v146ApplyFullPalette=function(palette,source){
  const root=document.documentElement;
  const sourceType=String(source?.source||'');
  const mode=sourceType==='librarytheme'
    ?'library'
    :sourceType==='imagetheme'
      ?'image'
      :'dynamic';

  root.dataset.v162CoverMode=mode;
  return v162ApplyFullPaletteBase.apply(this,arguments);
};

const v162ClearInlineThemeVarsBase=v146ClearInlineThemeVars;
v146ClearInlineThemeVars=function(){
  document.documentElement.removeAttribute('data-v162-cover-mode');
  return v162ClearInlineThemeVarsBase.apply(this,arguments);
};

// FINAL v162 adaptive-theme resolver shared by all three cover collections.
v146RefreshDynamicTheme=async function(){
  const seq=++V146_DYNAMIC_SEQ;

  if(!S.settings?.dynamicCoverTheme){
    v146RestoreSelectedThemeFallback();
    document.documentElement.dataset.v146ThemeMode='collection';
    return;
  }

  document.documentElement.dataset.v146ThemeMode='dynamic';

  const sources=v162ThemeSources();

  for(const source of sources){
    const themeData=await v160ExtractCoverTheme(source.url);
    if(seq!==V146_DYNAMIC_SEQ)return;
    if(!themeData)continue;

    const appearance=v159DynamicAppearanceMode(themeData);
    const palette=v162SoftPalette(themeData,appearance);
    if(!palette)continue;

    palette.visualCoverUrl=themeData.visualCoverUrl||source.url;
    palette.corsFallback=!!themeData.corsFallback;
    palette.naturalMode=themeData.naturalMode||appearance;

    v146ApplyFullPalette(palette,source);
    return;
  }

  if(seq!==V146_DYNAMIC_SEQ)return;

  // A temporary image/CORS/network failure must never replace a valid adaptive
  // theme with a static fallback.
  if(v162HasLiveCoverTheme()){
    v146UpdateThemeStatus();
    return;
  }

  v146RestoreSelectedThemeFallback();
};

function v162CurrentCollectionLabel(){
  const mode=v162ThemeMode();
  if(mode==='library')return 'Library Cover Theme';
  if(mode==='image')return 'Image URL Theme';
  return 'Dynamic Cover Theme';
}

v146UpdateThemeStatus=function(){
  const el=document.getElementById('v146-dynamic-theme-status');
  if(!el)return;

  const st=S.v146DynamicThemeState||{};
  const p=st.palette;
  const mode=v162ThemeMode();

  let text='Theme collections are active.';

  if(S.settings?.dynamicCoverTheme){
    const validSource=['recommended','onthisday','librarytheme','imagetheme'].includes(String(st.source||''));

    if(validSource&&p){
      const appearance=typeof v132GlobalAppearanceEnabled==='function'&&v132GlobalAppearanceEnabled()
        ?`Global ${p.mode||'dynamic'}`
        :`Natural ${p.mode||st.naturalMode||'dynamic'}`;

      const method=st.corsFallback
        ?'cover visual + safe palette'
        :'adaptive cover palette';

      text=`${st.label} · ${appearance} · ${method}`;
    }else if(mode==='library'){
      const count=v162LibraryThemeSources().length;
      text=count
        ?`${count} selected Library cover${count===1?'':'s'} · preparing theme`
        :'Select at least one Library title that has a cover.';
    }else if(mode==='image'){
      const count=v162ImageThemeSources().length;
      text=count
        ?`${count} custom image${count===1?'':'s'} · preparing theme`
        :'Add at least one valid http/https image URL.';
    }else{
      const count=v160AllDynamicSources().length;
      text=count
        ?`${count} Dynamic Cover source${count===1?'':'s'} found · preparing theme`
        :'No recommendation / On This Day cover source is currently available — using your selected fallback theme.';
    }
  }

  const colors=p
    ?[p.bg,p.panel,p.primary||p.flow,p.secondary,p.tertiary,p.text].filter(Boolean)
    :[];

  el.innerHTML=`<span>${escapeHtml(text)}</span>${colors.length?`<span class="v146-theme-swatches">${colors.map(c=>`<span class="v146-theme-swatch" style="background:${escapeHtml(c)}"></span>`).join('')}</span>`:''}`;
};

// v159's random Dynamic Cover timer should run only for the original Dynamic
// Cover collection. Curated Library/Image collections obey the user's interval.
const v162DynamicSourceTimerBase=v159EnsureDynamicSourceTimer;
v159EnsureDynamicSourceTimer=function(){
  if(v162ThemeMode()!=='dynamic'){
    clearTimeout(V159_DYNAMIC_SOURCE_TIMER);
    V159_DYNAMIC_SOURCE_TIMER=null;
    return;
  }
  return v162DynamicSourceTimerBase.apply(this,arguments);
};

// On This Day continues rotating visually, but it must not force a theme change
// while a user-curated collection is active.
const v162ApplyOtdHeroBase=v159ApplyOtdHero;
v159ApplyOtdHero=function(index,options={}){
  if(v162ThemeMode()!=='dynamic'){
    options=Object.assign({},options,{forceTheme:false});
  }
  return v162ApplyOtdHeroBase(index,options);
};

function v162EnsureRotationTimer(reset=false){
  const mode=v162ThemeMode();

  if(reset||mode!==V162_ROTATION_MODE){
    v162StopRotation();
  }

  if(mode!=='library'&&mode!=='image'){
    v162StopRotation();
    return;
  }

  const rows=mode==='library'?v162LibraryThemeSources():v162ImageThemeSources();
  if(rows.length<=1){
    v162StopRotation();
    return;
  }

  if(V162_ROTATION_TIMER)return;

  V162_ROTATION_MODE=mode;
  const cfg=mode==='library'
    ?v162EnsureThemeSettings().v162LibraryTheme
    :v162EnsureThemeSettings().v162ImageTheme;
  const delay=v162ClampInterval(cfg.intervalSec)*1000;

  V162_ROTATION_TIMER=setTimeout(()=>{
    V162_ROTATION_TIMER=null;
    const latest=mode==='library'?v162LibraryThemeSources():v162ImageThemeSources();

    if(v162ThemeMode()!==mode||latest.length<=1){
      v162EnsureRotationTimer(true);
      return;
    }

    V162_ROTATION_INDEX[mode]=(Number(V162_ROTATION_INDEX[mode])||0)+1;
    V162_ROTATION_INDEX[mode]%=latest.length;

    v146ScheduleDynamicTheme();
    v162EnsureRotationTimer(false);
  },delay);
}

// ---- Theme collection selector ---------------------------------------------

const v162SetThemeCollectionBase=App.setThemeCollection;
App.setThemeCollection=function(kind){
  const k=String(kind||'');

  if(k==='dynamic'||k==='library-cover'||k==='image-url'){
    S.settings=v162EnsureThemeSettingsObject(S.settings||DEFAULT_SETTINGS);
    S.settings.dynamicCoverTheme=true;
    S.settings.v162ThemeCollection=
      k==='library-cover'?'library':
      k==='image-url'?'image':
      'dynamic';

    V162_ROTATION_INDEX.library=0;
    V162_ROTATION_INDEX.image=0;
    v162StopRotation();

    document.documentElement.dataset.v146ThemeMode='dynamic';
    persistSettings();
    render();
    v146ScheduleDynamicTheme();
    v162EnsureRotationTimer(true);
    return;
  }

  S.settings=v162EnsureThemeSettingsObject(S.settings||DEFAULT_SETTINGS);
  v162StopRotation();
  return v162SetThemeCollectionBase.call(this,k);
};

// ---- Library-cover collection actions --------------------------------------

function v162LibraryThemeSelectedHtml(){
  const cfg=v162EnsureThemeSettings().v162LibraryTheme;
  const map=new Map((S.library||[]).map(x=>[String(x?.id||''),x]));
  const valid=cfg.titleIds.map(id=>map.get(String(id))).filter(Boolean);

  if(!valid.length){
    return `<div class="v162-theme-empty">No Library titles selected yet. Search for a title with a cover and add it.</div>`;
  }

  return valid.map((item,index)=>{
    const cover=v160SafeCoverUrl(item.coverUrl);
    return `<div class="v162-theme-selected-row">
      ${cover?`<img class="v162-theme-thumb" src="${escapeHtml(cover)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">`:''}
      <div class="v162-theme-selected-copy">
        <b>${escapeHtml(cleanTitle(item.title))}</b>
        <small>Theme ${index+1} of ${valid.length}</small>
      </div>
      <div class="v162-theme-row-actions">
        <button class="btn btn-sm btn-ghost" ${index===0?'disabled':''} onclick="App.v162MoveLibraryTheme('${escapeHtml(String(item.id))}',-1)">↑</button>
        <button class="btn btn-sm btn-ghost" ${index===valid.length-1?'disabled':''} onclick="App.v162MoveLibraryTheme('${escapeHtml(String(item.id))}',1)">↓</button>
        <button class="btn btn-sm btn-ghost" onclick="App.v162RemoveLibraryTheme('${escapeHtml(String(item.id))}')">Remove</button>
      </div>
    </div>`;
  }).join('');
}

function v162LibraryThemeSearch(query){
  clearTimeout(V162_LIBRARY_SEARCH_TIMER);

  const box=document.getElementById('v162-library-theme-results');
  if(!box)return;

  const q=cleanTitle(String(query||'')).toLocaleLowerCase();
  if(!q){
    box.innerHTML='';
    return;
  }

  V162_LIBRARY_SEARCH_TIMER=setTimeout(()=>{
    const selected=new Set(v162EnsureThemeSettings().v162LibraryTheme.titleIds.map(String));
    const rows=[];

    // One debounced linear scan is deliberate: no giant <select> with tens of
    // thousands of options is ever rendered into Settings.
    for(const item of (S.library||[])){
      if(rows.length>=20)break;
      if(!item?.id||!v160SafeCoverUrl(item.coverUrl))continue;
      if(selected.has(String(item.id)))continue;

      const title=cleanTitle(item.title||'');
      if(!title.toLocaleLowerCase().includes(q))continue;
      rows.push(item);
    }

    if(!rows.length){
      box.innerHTML=`<div class="v162-theme-empty">No unselected Library title with a cover matches this search.</div>`;
      return;
    }

    box.innerHTML=rows.map(item=>`
      <button type="button" class="v162-theme-search-result" onclick="App.v162AddLibraryTheme('${escapeHtml(String(item.id))}')">
        <img class="v162-theme-thumb" src="${escapeHtml(String(item.coverUrl))}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">
        <span class="v162-theme-selected-copy">
          <b>${escapeHtml(cleanTitle(item.title))}</b>
          <small>Add this cover to the rotation</small>
        </span>
      </button>`).join('');
  },140);
}

function v162AddLibraryTheme(id){
  const cfg=v162EnsureThemeSettings().v162LibraryTheme;
  const sid=String(id||'');
  const item=(S.library||[]).find(x=>String(x?.id||'')===sid);

  if(!item||!v160SafeCoverUrl(item.coverUrl)){
    showToast('That Library title does not currently have a usable cover.');
    return;
  }

  if(!cfg.titleIds.includes(sid))cfg.titleIds.push(sid);
  cfg.modifiedAt=Date.now();
  V162_ROTATION_INDEX.library=0;

  persistSettings();
  render();
  v146ScheduleDynamicTheme();
  v162EnsureRotationTimer(true);
}

function v162RemoveLibraryTheme(id){
  const cfg=v162EnsureThemeSettings().v162LibraryTheme;
  const sid=String(id||'');
  cfg.titleIds=cfg.titleIds.filter(x=>String(x)!==sid);
  cfg.modifiedAt=Date.now();

  const count=v162LibraryThemeSources().length;
  if(count)V162_ROTATION_INDEX.library%=count;
  else V162_ROTATION_INDEX.library=0;

  persistSettings();
  render();
  v146ScheduleDynamicTheme();
  v162EnsureRotationTimer(true);
}

function v162MoveLibraryTheme(id,delta){
  const cfg=v162EnsureThemeSettings().v162LibraryTheme;
  const sid=String(id||'');
  const from=cfg.titleIds.indexOf(sid);
  if(from<0)return;

  const to=Math.max(0,Math.min(cfg.titleIds.length-1,from+(Number(delta)||0)));
  if(to===from)return;

  cfg.titleIds.splice(from,1);
  cfg.titleIds.splice(to,0,sid);
  cfg.modifiedAt=Date.now();
  V162_ROTATION_INDEX.library=0;

  persistSettings();
  render();
  v146ScheduleDynamicTheme();
  v162EnsureRotationTimer(true);
}

function v162SetLibraryThemeInterval(value){
  const cfg=v162EnsureThemeSettings().v162LibraryTheme;
  cfg.intervalSec=v162ClampInterval(value);
  cfg.modifiedAt=Date.now();

  persistSettings();
  v162EnsureRotationTimer(true);
  render();
}

// ---- Image-URL collection actions ------------------------------------------

function v162SaveImageThemeUrls(){
  const el=document.getElementById('v162-image-theme-urls');
  if(!el)return;

  const raw=String(el.value||'');
  const pieces=raw
    .split(/\r?\n|,/)
    .map(x=>x.trim())
    .filter(Boolean);

  const valid=[];
  let invalid=0;

  for(const value of pieces){
    const url=v162NormalizeHttpImageUrl(value);
    if(!url){invalid++;continue;}
    if(!valid.includes(url))valid.push(url);
  }

  const cfg=v162EnsureThemeSettings().v162ImageTheme;
  cfg.urls=valid;
  cfg.modifiedAt=Date.now();
  V162_ROTATION_INDEX.image=0;

  persistSettings();
  render();
  v146ScheduleDynamicTheme();
  v162EnsureRotationTimer(true);

  if(invalid){
    showToast(`${invalid} invalid image URL${invalid===1?' was':'s were'} ignored.`);
  }else{
    showToast(`${valid.length} image theme${valid.length===1?'':'s'} saved.`);
  }
}

function v162SetImageThemeInterval(value){
  const cfg=v162EnsureThemeSettings().v162ImageTheme;
  cfg.intervalSec=v162ClampInterval(value);
  cfg.modifiedAt=Date.now();

  persistSettings();
  v162EnsureRotationTimer(true);
  render();
}

// ---- Settings UI -----------------------------------------------------------

function v162CollectionPanelHtml(mode){
  const settings=v162EnsureThemeSettings();

  if(mode==='dynamic'){
    return `<div class="v162-cover-theme-panel">
      <div class="v162-cover-theme-head">
        <div>
          <div class="v162-cover-theme-title">Dynamic Cover Theme</div>
          <div class="hint">MediaFlow automatically rotates priority between recommendation and On This Day covers. The cover drives an adaptive full-app palette while keeping text and form controls contrast-safe.</div>
        </div>
        <span class="v162-cover-theme-badge">Automatic</span>
      </div>
      <div id="v146-dynamic-theme-status" class="v162-theme-status"><span>Analyzing cover…</span></div>
    </div>`;
  }

  if(mode==='library'){
    const cfg=settings.v162LibraryTheme;

    return `<div class="v162-cover-theme-panel">
      <div class="v162-cover-theme-head">
        <div>
          <div class="v162-cover-theme-title">Library Cover Theme</div>
          <div class="hint">Choose one or more Library titles that already have covers. MediaFlow uses the same adaptive cover engine as Dynamic Cover Theme, but with a calmer palette and your exact rotation list.</div>
        </div>
        <span class="v162-cover-theme-badge">Your Library</span>
      </div>

      <div class="v162-theme-controls">
        <div class="field" style="margin:0">
          <label class="field-label">Rotate every (seconds)</label>
          <input type="number" min="5" max="3600" step="1" value="${cfg.intervalSec}"
            onchange="App.v162SetLibraryThemeInterval(this.value)">
        </div>
        <div class="field v162-theme-search-wrap" style="margin:0">
          <label class="field-label">Add Library title with cover</label>
          <input type="search" placeholder="Search titles with covers…"
            autocomplete="off"
            oninput="App.v162LibraryThemeSearch(this.value)">
          <div id="v162-library-theme-results" class="v162-theme-search-results"></div>
        </div>
      </div>

      <div class="v162-rotation-note">One selected title stays fixed. With multiple titles, themes rotate sequentially using the interval above. A failed cover automatically falls through to another selected cover instead of destroying the current theme.</div>
      <div class="v162-theme-selected-list">${v162LibraryThemeSelectedHtml()}</div>
      <div id="v146-dynamic-theme-status" class="v162-theme-status"><span>Preparing Library cover theme…</span></div>
    </div>`;
  }

  const cfg=settings.v162ImageTheme;
  return `<div class="v162-cover-theme-panel">
    <div class="v162-cover-theme-head">
      <div>
        <div class="v162-cover-theme-title">Image URL Theme</div>
        <div class="hint">Use any direct http/https image URL. Put multiple URLs on separate lines to rotate through them. MediaFlow applies the same adaptive/CORS-safe cover engine with a calmer visual treatment.</div>
      </div>
      <span class="v162-cover-theme-badge">Custom images</span>
    </div>

    <div class="v162-theme-controls">
      <div class="field" style="margin:0">
        <label class="field-label">Rotate every (seconds)</label>
        <input type="number" min="5" max="3600" step="1" value="${cfg.intervalSec}"
          onchange="App.v162SetImageThemeInterval(this.value)">
      </div>
      <div class="field" style="margin:0">
        <label class="field-label">Image URLs — one per line</label>
        <textarea id="v162-image-theme-urls" class="v162-image-url-box" placeholder="https://example.com/image.jpg&#10;https://example.com/another.jpg">${escapeHtml(cfg.urls.join('\n'))}</textarea>
      </div>
    </div>

    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:9px">
      <button type="button" class="btn btn-primary btn-sm" onclick="App.v162SaveImageThemeUrls()">Save image URLs</button>
      <span class="hint">${cfg.urls.length} saved image${cfg.urls.length===1?'':'s'}</span>
    </div>
    <div class="v162-rotation-note">One URL stays fixed. Multiple URLs rotate sequentially using the interval above. Invalid/non-image URLs are skipped and the last valid adaptive theme remains active during temporary failures.</div>
    <div id="v146-dynamic-theme-status" class="v162-theme-status"><span>Preparing image theme…</span></div>
  </div>`;
}

const v162RenderSettingsBase=renderSettings;
renderSettings=function(){
  let h=v162RenderSettingsBase();
  const settings=v162EnsureThemeSettings();
  const mode=v162ThemeMode();

  const current=settings.theme||'dark';
  const isPlatform=V55_PLATFORM_THEMES.includes(current);
  const isFull=FULL_STYLE_THEMES.includes(current);

  const collection=
    settings.dynamicCoverTheme
      ?(mode==='library'?'library-cover':mode==='image'?'image-url':'dynamic')
      :(isFull?'fullstyle':isPlatform?'platform':'mediaflow');

  const selector=`<select onchange="App.setThemeCollection(this.value)">
    <option value="mediaflow" ${collection==='mediaflow'?'selected':''}>MediaFlow Themes</option>
    <option value="platform" ${collection==='platform'?'selected':''}>Platform Themes</option>
    <option value="fullstyle" ${collection==='fullstyle'?'selected':''}>Full Style Themes</option>
    <option value="dynamic" ${collection==='dynamic'?'selected':''}>Dynamic Cover Theme</option>
    <option value="library-cover" ${collection==='library-cover'?'selected':''}>Library Cover Themes</option>
    <option value="image-url" ${collection==='image-url'?'selected':''}>Image URL Themes</option>
  </select>`;

  h=h.replace(
    /<select onchange="App\.setThemeCollection\(this\.value\)">[\s\S]*?<\/select>/,
    selector
  );

  // Remove v146's older one-purpose Dynamic panel/note. v162 supplies one
  // unified adaptive panel for all three special collections.
  h=h.replace(
    /<div class="v146-theme-mode-panel">[\s\S]*?<div id="v146-dynamic-theme-status" class="v146-theme-status">[\s\S]*?<\/div>\s*<\/div>/,
    ''
  );
  h=h.replace(
    /<div class="v146-static-fallback-note">[\s\S]*?<\/div>/,
    ''
  );

  if(settings.dynamicCoverTheme){
    // Keep the normal selected theme visible as the fallback chooser.
    h=h.replace(
      /<label class="field-label">(MediaFlow theme|Platform theme|Full style theme)<\/label>/,
      '<label class="field-label">Fallback theme</label>'
    );

    const panel=v162CollectionPanelHtml(mode);
    h=h.replace(
      /(<div class="field"><label class="field-label">Theme collection<\/label>[\s\S]*?<\/div>)/,
      `$1${panel}`
    );
  }

  return h;
};

// ---- Save/load/cloud/backup -------------------------------------------------

const v162PersistSettingsBase=persistSettings;
persistSettings=function(){
  v162EnsureThemeSettings();
  return v162PersistSettingsBase.apply(this,arguments);
};

const v162LoadAllBase=loadAll;
loadAll=async function(){
  await v162LoadAllBase.apply(this,arguments);
  v162EnsureThemeSettings();
};

const v162SnapshotBase=snapshot;
snapshot=function(){
  v162EnsureThemeSettings();
  const x=v162SnapshotBase();
  x.settings=JSON.parse(JSON.stringify(S.settings));
  x.cloudSyncVersion=Math.max(Number(x.cloudSyncVersion)||0,162);
  return x;
};

const v162ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v162ApplyStateBase.apply(this,arguments);
  v162EnsureThemeSettings();
  V162_ROTATION_INDEX.library=0;
  V162_ROTATION_INDEX.image=0;
  v162StopRotation();
  return result;
};

const v162MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v162MergeStatesBase(a,b)||{};
  out.settings=v162EnsureThemeSettingsObject(out.settings||{});
  out.cloudSyncVersion=Math.max(
    Number(a?.cloudSyncVersion)||0,
    Number(b?.cloudSyncVersion)||0,
    Number(out.cloudSyncVersion)||0,
    162
  );
  return out;
};

const v162VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v162VerifyCloudStateBase(cloudState,expected);
  const problems=[...(base?.missing||[])];

  const cloud=v162EnsureThemeSettingsObject(
    JSON.parse(JSON.stringify(cloudState?.settings||{}))
  );
  const wanted=v162EnsureThemeSettingsObject(
    JSON.parse(JSON.stringify(expected?.settings||{}))
  );

  const keys=['dynamicCoverTheme','v162ThemeCollection','v162LibraryTheme','v162ImageTheme'];
  for(const key of keys){
    if(JSON.stringify(cloud[key])!==JSON.stringify(wanted[key])){
      problems.push(`Theme setting: ${key}`);
    }
  }

  return {ok:problems.length===0,missing:[...new Set(problems)]};
};

const v162BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v162EnsureThemeSettings();
  const payload=v162BuildFullBackupBase();

  payload.backupSchemaVersion=V162_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  payload.backupManifest=v148BackupManifest(payload,payload.portableExtras||{});
  payload.backupManifest.schemaVersion=V162_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v162 backup. Includes Library Cover Theme and Image URL Theme source lists/rotation intervals in Settings, plus all canonical account data, Personal Order, Old System, navigation, Rating Queue and portable preferences. Authentication credentials and filesystem permission handles remain intentionally non-portable.';

  return payload;
};

const v162BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v162BackupManifestBase(state,extras);
  const settings=v162EnsureThemeSettingsObject(
    JSON.parse(JSON.stringify(state?.settings||{}))
  );

  manifest.schemaVersion=V162_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign({},manifest.includes||{},{
    adaptiveThemeCollections:true,
    libraryCoverThemeSources:true,
    customImageThemeSources:true,
    adaptiveThemeRotationIntervals:true
  });
  manifest.counts=Object.assign({},manifest.counts||{},{
    libraryCoverThemeTitles:settings.v162LibraryTheme.titleIds.length,
    customImageThemeUrls:settings.v162ImageTheme.urls.length
  });

  return manifest;
};

// ---- Final render/timer hook ------------------------------------------------

const v162RenderBase=render;
render=function(){
  const result=v162RenderBase.apply(this,arguments);

  Promise.resolve().then(()=>{
    v162EnsureRotationTimer(false);
    const status=document.getElementById('v146-dynamic-theme-status');
    if(status)v146UpdateThemeStatus();
  });

  return result;
};

Object.assign(App,{
  v162LibraryThemeSearch,
  v162AddLibraryTheme,
  v162RemoveLibraryTheme,
  v162MoveLibraryTheme,
  v162SetLibraryThemeInterval,
  v162SaveImageThemeUrls,
  v162SetImageThemeInterval
});



