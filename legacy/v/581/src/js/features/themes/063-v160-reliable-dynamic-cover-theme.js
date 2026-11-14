/* ============================================================
   MediaFlow v160 — Reliable Dynamic Cover Theme
   ------------------------------------------------------------
   Root causes fixed:
   1) v159's rotating On This Day "forced" source returned ONLY that cover.
      If that single image could not be sampled, MediaFlow immediately fell
      back to the static theme even when the recommendation / other OTD covers
      were perfectly usable.
   2) many valid remote covers display fine in <img> but do not allow canvas
      pixel reads (CORS). v159 treated those as unusable.
   3) a temporary failed refresh replaced an already-good dynamic theme with
      the static fallback.

   v160:
   - forced source is priority #1, NOT the only source;
   - recommendation source no longer unnecessarily depends on the setting flag
     if currentTask already contains an exact title;
   - all usable recommendation + On This Day covers become fallback candidates;
   - pixel extraction tries CORS first;
   - if the image itself loads but pixel access is blocked, MediaFlow generates
     a stable cover-specific palette from the cover URL and uses the cover as
     a blurred visual backdrop, instead of calling the cover unusable;
   - failed refresh keeps the last valid dynamic theme alive.
   ============================================================ */

const V160_COVER_THEME_CACHE=new Map();
const V160_IMAGE_USABILITY_CACHE=new Map();

function v160SafeCoverUrl(value){
  const s=String(value||'').trim();
  if(!s)return '';
  if(/^https?:\/\//i.test(s)||/^data:image\//i.test(s))return s;
  return '';
}

function v160RecommendedCoverSource(){
  const t=S.currentTask;
  if(!t)return null;

  let item=null;

  if(t.libraryId){
    item=(S.library||[]).find(x=>String(x?.id||'')===String(t.libraryId))||null;
  }

  if(!item&&t.title){
    item=v50FindLibraryItem(t.libraryId,t.title);
  }

  const url=v160SafeCoverUrl(item?.coverUrl);
  if(!item||!url)return null;

  return {
    source:'recommended',
    label:`Recommended: ${cleanTitle(item.title)}`,
    url,
    libraryId:item.id||t.libraryId||null
  };
}

// Replace the old helper so every later caller gets the fixed behavior.
v145RecommendedCoverSource=v160RecommendedCoverSource;

function v160AllDynamicSources(){
  const out=[];
  const seen=new Set();

  const add=x=>{
    if(!x)return;
    const url=v160SafeCoverUrl(x.url);
    if(!url||seen.has(url))return;
    seen.add(url);
    out.push(Object.assign({},x,{url}));
  };

  // The rotating title should get first chance, but must NEVER be the only
  // candidate if it fails.
  if(V159_FORCED_THEME_SOURCE){
    add(V159_FORCED_THEME_SOURCE);
    V159_FORCED_THEME_SOURCE=null;
  }

  const rec=v160RecommendedCoverSource();
  const otd=v159OnThisDayThemeSources();

  if(rec&&otd.length){
    // Preserve v159's random family priority after an optional forced source.
    if(Math.random()<.5){
      add(rec);
      const first=otd[v159RandomIndex(otd.length)];
      add(first);
      for(const row of otd)add(row);
    }else{
      const first=otd[v159RandomIndex(otd.length)];
      add(first);
      add(rec);
      for(const row of otd)add(row);
    }
  }else{
    add(rec);
    for(const row of otd)add(row);
  }

  return out;
}

// Keep the public v159 resolver name aligned with the corrected v160 source
// ordering so periodic timers and existing wrappers automatically use it.
v159DynamicSourceOrder=v160AllDynamicSources;

function v160HashString(value){
  let h1=2166136261>>>0;
  let h2=2246822519>>>0;
  const s=String(value||'');

  for(let i=0;i<s.length;i++){
    const c=s.charCodeAt(i);
    h1^=c;
    h1=Math.imul(h1,16777619)>>>0;
    h2^=(c+(i*31));
    h2=Math.imul(h2,3266489917)>>>0;
  }

  return [h1>>>0,h2>>>0];
}

function v160HashCoverTheme(url){
  const [a,b]=v160HashString(url);

  const h1=a%360;
  let h2=(h1+42+(b%126))%360;
  let h3=(h1+168+((a>>>8)%74))%360;

  // Keep the generated colors clearly separated.
  if(Math.abs(h2-h1)<34)h2=(h2+48)%360;
  if(Math.abs(h3-h1)<60)h3=(h3+96)%360;

  const s1=60+((a>>>12)%25);
  const s2=52+((b>>>10)%28);
  const s3=48+((a>>>20)%30);

  const l1=48+((b>>>18)%12);
  const l2=46+((a>>>6)%16);
  const l3=44+((b>>>4)%18);

  const colors=[
    v159HexFromHsl(h1,s1,l1),
    v159HexFromHsl(h2,s2,l2),
    v159HexFromHsl(h3,s3,l3)
  ];

  // Natural mode stays deterministic for this exact cover URL.
  const naturalMode=((a^b)&1)?'dark':'light';

  return {
    colors,
    naturalMode,
    averageLuminance:naturalMode==='light'?.64:.34,
    derived:true,
    corsFallback:true
  };
}

function v160CanDisplayImage(url){
  const src=v160SafeCoverUrl(url);
  if(!src)return Promise.resolve(false);
  if(V160_IMAGE_USABILITY_CACHE.has(src))return V160_IMAGE_USABILITY_CACHE.get(src);

  const promise=new Promise(resolve=>{
    const img=new Image();
    let settled=false;

    const done=value=>{
      if(settled)return;
      settled=true;
      clearTimeout(timer);
      resolve(!!value);
    };

    const timer=setTimeout(()=>done(false),10000);
    img.onload=()=>done(true);
    img.onerror=()=>done(false);

    try{img.src=src;}catch(_){done(false);}
  });

  V160_IMAGE_USABILITY_CACHE.set(src,promise);
  return promise;
}

function v160ExtractCoverTheme(url){
  const src=v160SafeCoverUrl(url);if(!src)return Promise.resolve(null);
  if(V160_COVER_THEME_CACHE.has(src))return V160_COVER_THEME_CACHE.get(src);

  const promise=(async()=>{
    // First use v159's richer real-pixel extraction. This also falls back to
    // the older v145 accent extractor when the host supports it.
    try{
      const real=await v159ExtractCoverTheme(src);
      if(real)return Object.assign({},real,{visualCoverUrl:src});
    }catch(_){}

    // A cover can display perfectly while refusing anonymous canvas access.
    // Verify the actual image loads normally; if it does, it is a valid source.
    const displayable=await v160CanDisplayImage(src);
    if(!displayable)return null;

    // CORS prevented us from reading pixels. Never call a visible cover
    // "unusable": create a stable cover-specific palette and also use the
    // actual cover image as a low-opacity blurred background atmosphere.
    const fallback=v160HashCoverTheme(src);
    fallback.visualCoverUrl=src;
    return fallback;
  })();

  V160_COVER_THEME_CACHE.set(src,promise);
  return promise;
}

function v160CssUrl(url){
  // setProperty receives a CSS value, not HTML. Escape slashes/quotes safely.
  const s=String(url||'').replace(/\\/g,'\\\\').replace(/"/g,'\\"');
  return `url("${s}")`;
}

function v160ApplyCoverVisual(url){
  const root=document.documentElement;
  const src=v160SafeCoverUrl(url);

  if(src){
    root.style.setProperty('--v160-cover-image',v160CssUrl(src));
    root.dataset.v160CoverVisual='1';
  }else{
    root.style.removeProperty('--v160-cover-image');
    root.removeAttribute('data-v160-cover-visual');
  }
}

const v160ApplyFullPaletteBase=v146ApplyFullPalette;
v146ApplyFullPalette=function(palette,source){
  v160ApplyFullPaletteBase(palette,source);

  const visual=palette?.visualCoverUrl||source?.url||'';
  v160ApplyCoverVisual(visual);

  if(S.v146DynamicThemeState){
    S.v146DynamicThemeState.corsFallback=!!palette?.corsFallback;
    S.v146DynamicThemeState.visualCoverUrl=visual;
  }
};

const v160ClearInlineThemeVarsBase=v146ClearInlineThemeVars;
v146ClearInlineThemeVars=function(){
  v160ApplyCoverVisual('');
  return v160ClearInlineThemeVarsBase.apply(this,arguments);
};

function v160HasLiveDynamicTheme(){
  const st=S.v146DynamicThemeState||{};
  return (
    document.documentElement.dataset.v146DynamicActive==='1' &&
    !!st.palette &&
    (st.source==='recommended'||st.source==='onthisday')
  );
}

// FINAL v160 resolver.
v146RefreshDynamicTheme=async function(){
  const seq=++V146_DYNAMIC_SEQ;

  if(!S.settings?.dynamicCoverTheme){
    v146RestoreSelectedThemeFallback();
    document.documentElement.dataset.v146ThemeMode='collection';
    return;
  }

  document.documentElement.dataset.v146ThemeMode='dynamic';

  const sources=v160AllDynamicSources();

  for(const source of sources){
    const themeData=await v160ExtractCoverTheme(source.url);
    if(seq!==V146_DYNAMIC_SEQ)return;
    if(!themeData)continue;

    const mode=v159DynamicAppearanceMode(themeData);
    const palette=v159CoverPalette(themeData,mode);

    if(!palette)continue;

    // Carry fallback/visual metadata through the palette layer.
    palette.visualCoverUrl=themeData.visualCoverUrl||source.url;
    palette.corsFallback=!!themeData.corsFallback;
    palette.naturalMode=themeData.naturalMode||mode;

    v146ApplyFullPalette(palette,source);
    return;
  }

  if(seq!==V146_DYNAMIC_SEQ)return;

  // Critical v160 behavior: a transient bad/blocked new source must not tear
  // down a perfectly valid dynamic theme that was already active.
  if(v160HasLiveDynamicTheme()){
    v146UpdateThemeStatus();
    return;
  }

  v146RestoreSelectedThemeFallback();
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

      const method=st.corsFallback
        ?'cover visual + cover-specific palette'
        :'multi-color cover theme';

      text=`${st.label} · ${appearance} · ${method}`;
    }else{
      const available=v160AllDynamicSources().length;
      text=available
        ?`${available} cover source${available===1?'':'s'} found · waiting for a usable image response`
        :'No recommendation / On This Day cover source is currently available — using your selected fallback theme.';
    }
  }

  const colors=p
    ?[p.bg,p.panel,p.primary||p.flow,p.secondary,p.tertiary,p.text].filter(Boolean)
    :[];

  el.innerHTML=`<span>${escapeHtml(text)}</span>${colors.length?`<span class="v146-theme-swatches">${colors.map(c=>`<span class="v146-theme-swatch" style="background:${escapeHtml(c)}"></span>`).join('')}</span>`:''}`;
};

// If the previous v159 cache remembered a failed extraction as null, v160 uses
// its own independent cache and therefore retries those valid covers once.
V160_COVER_THEME_CACHE.clear();
V160_IMAGE_USABILITY_CACHE.clear();



