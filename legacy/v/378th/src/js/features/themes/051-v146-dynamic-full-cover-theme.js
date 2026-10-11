/* ============================================================
   MediaFlow v146 — Dynamic Full Cover Theme
   ------------------------------------------------------------
   Theme mode is now mutually exclusive:
     • MediaFlow / Platform / Full Style theme collections
     • Dynamic Cover Theme

   Dynamic source priority stays:
     1. current MediaFlow-recommended title cover
     2. On This Day cover
     3. stored selected theme as fallback

   Unlike v145, v146 derives the complete color system:
   background, panels, raised surfaces, borders, text and accent.
   ============================================================ */

let V146_DYNAMIC_SEQ=0;
const V146_THEME_VARS=[
  '--bg','--panel','--panel-raised','--border','--border-soft',
  '--text','--text-dim','--text-mute','--flow','--flow-dim'
];

S.v146DynamicThemeState=S.v146DynamicThemeState||{
  source:'theme',
  label:'Selected theme fallback',
  url:'',
  palette:null
};

function v146RgbFromHex(hex){
  const m=String(hex||'').match(/^#([0-9A-F]{6})$/i);
  if(!m)return null;
  const n=parseInt(m[1],16);
  return {r:(n>>16)&255,g:(n>>8)&255,b:n&255};
}

function v146HslHex(h,s,l){
  const rgb=v145HslToRgb(h,s,l);
  return v145RgbHex(rgb.r,rgb.g,rgb.b);
}

function v146PaletteFromAccent(accent,mode){
  const rgb=v146RgbFromHex(accent);
  if(!rgb)return null;

  const hsl=v145RgbToHsl(rgb.r,rgb.g,rgb.b);
  const h=hsl.h;
  const chroma=Math.max(42,Math.min(82,hsl.s*1.10 || 58));

  if(mode==='light'){
    const flow=v146HslHex(h,Math.max(58,chroma),42);
    return {
      mode:'light',
      bg:v146HslHex(h,Math.min(28,chroma*.30),97),
      panel:v146HslHex(h,Math.min(22,chroma*.24),99),
      raised:v146HslHex(h,Math.min(34,chroma*.38),93),
      border:v146HslHex(h,Math.min(32,chroma*.34),78),
      borderSoft:v146HslHex(h,Math.min(26,chroma*.28),87),
      text:v146HslHex(h,Math.min(28,chroma*.26),14),
      textDim:v146HslHex(h,Math.min(30,chroma*.30),34),
      textMute:v146HslHex(h,Math.min(26,chroma*.25),50),
      flow,
      flowDim:v146HslHex(h,Math.max(36,chroma*.68),78)
    };
  }

  const flow=v146HslHex(h,Math.max(58,chroma),58);
  return {
    mode:'dark',
    bg:v146HslHex(h,Math.min(34,chroma*.36),7),
    panel:v146HslHex(h,Math.min(38,chroma*.40),11),
    raised:v146HslHex(h,Math.min(42,chroma*.45),16),
    border:v146HslHex(h,Math.min(36,chroma*.36),29),
    borderSoft:v146HslHex(h,Math.min(34,chroma*.34),21),
    text:v146HslHex(h,Math.min(18,chroma*.16),95),
    textDim:v146HslHex(h,Math.min(22,chroma*.20),73),
    textMute:v146HslHex(h,Math.min(24,chroma*.22),53),
    flow,
    flowDim:v146HslHex(h,Math.max(34,chroma*.62),31)
  };
}

function v146ClearInlineThemeVars(){
  const root=document.documentElement;
  for(const key of V146_THEME_VARS)root.style.removeProperty(key);
  root.removeAttribute('data-v146-dynamic-active');
}

function v146RestoreSelectedThemeFallback(){
  const root=document.documentElement;

  v146ClearInlineThemeVars();
  root.dataset.v146ThemeMode=S.settings?.dynamicCoverTheme?'dynamic':'collection';

  // Apply the user's stored static theme without invoking v145/v146 scheduling.
  // This is the exact fallback when no usable cover exists.
  v145ApplyThemeBase(S.settings?.theme||'dark');

  S.v146DynamicThemeState={
    source:'theme',
    label:'Selected theme fallback',
    url:'',
    palette:null
  };

  v146UpdateThemeStatus();
}

function v146ApplyFullPalette(palette,source){
  if(!palette)return;

  const root=document.documentElement;

  // Dynamic Cover Theme uses the normal MediaFlow structural skin and supplies
  // every important theme color itself. The saved static theme remains intact
  // in S.settings.theme for instant fallback / later return to collections.
  root.dataset.theme='dark';
  root.dataset.v146ThemeMode='dynamic';
  root.dataset.v146DynamicActive='1';

  // Global Appearance's neutral !important layer would otherwise mask the
  // dynamic surfaces. We still honor its Light/Dark preference when generating
  // the palette, but the actual dynamic palette owns the surfaces.
  root.removeAttribute('data-appearance');
  root.removeAttribute('data-native-scheme');
  root.style.colorScheme=palette.mode;

  root.style.setProperty('--bg',palette.bg);
  root.style.setProperty('--panel',palette.panel);
  root.style.setProperty('--panel-raised',palette.raised);
  root.style.setProperty('--border',palette.border);
  root.style.setProperty('--border-soft',palette.borderSoft);
  root.style.setProperty('--text',palette.text);
  root.style.setProperty('--text-dim',palette.textDim);
  root.style.setProperty('--text-mute',palette.textMute);
  root.style.setProperty('--flow',palette.flow);
  root.style.setProperty('--flow-dim',palette.flowDim);

  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta)meta.setAttribute('content',palette.bg);

  S.v146DynamicThemeState={
    source:source.source,
    label:source.label,
    url:source.url,
    palette
  };

  v146UpdateThemeStatus();
}

function v146DynamicAppearanceMode(){
  // Keep the user's existing Light/Dark preference meaningful in Dynamic mode.
  // If it has never been chosen explicitly, v106 resolves it from the stored
  // fallback theme once and saves the result.
  try{return v106AppearanceMode()==='light'?'light':'dark';}
  catch(_){return 'dark';}
}

function v146UpdateThemeStatus(){
  const el=document.getElementById('v146-dynamic-theme-status');
  if(!el)return;

  const st=S.v146DynamicThemeState||{};
  const enabled=!!S.settings?.dynamicCoverTheme;
  const p=st.palette;

  let text='Theme collections are active.';
  if(enabled){
    if(st.source==='recommended'||st.source==='onthisday'){
      text=`${st.label} · full ${p?.mode||'dynamic'} palette`;
    }else{
      text='No usable cover right now — using your selected theme as fallback.';
    }
  }

  const colors=p
    ? [p.bg,p.panel,p.raised,p.flow,p.text]
    : [];

  el.innerHTML=`<span>${escapeHtml(text)}</span>${colors.length?`<span class="v146-theme-swatches">${colors.map(c=>`<span class="v146-theme-swatch" style="background:${escapeHtml(c)}"></span>`).join('')}</span>`:''}`;
}

async function v146RefreshDynamicTheme(){
  const seq=++V146_DYNAMIC_SEQ;

  if(!S.settings?.dynamicCoverTheme){
    v146RestoreSelectedThemeFallback();
    document.documentElement.dataset.v146ThemeMode='collection';
    return;
  }

  document.documentElement.dataset.v146ThemeMode='dynamic';

  const sources=[];
  const rec=v145RecommendedCoverSource();
  if(rec)sources.push(rec);

  for(const row of v145OnThisDayCoverSources()){
    sources.push({
      source:'onthisday',
      label:row.label,
      url:row.url
    });
  }

  for(const source of sources){
    const accent=await v145ExtractCoverAccent(source.url);
    if(seq!==V146_DYNAMIC_SEQ)return;

    if(accent){
      const palette=v146PaletteFromAccent(accent,v146DynamicAppearanceMode());
      if(palette){
        v146ApplyFullPalette(palette,source);
        return;
      }
    }
  }

  if(seq===V146_DYNAMIC_SEQ)v146RestoreSelectedThemeFallback();
}

function v146ScheduleDynamicTheme(){
  const gate=++V146_DYNAMIC_SEQ;
  Promise.resolve().then(()=>{
    if(gate===V146_DYNAMIC_SEQ)v146RefreshDynamicTheme();
  });
}

// v145's final render/applyTheme wrappers call these variables at runtime.
// Redirect them to the v146 full-theme engine instead of the accent-only engine.
v145ScheduleDynamicCoverAccent=v146ScheduleDynamicTheme;
v145ClearDynamicAccent=function(){
  ++V146_DYNAMIC_SEQ;
  v146RestoreSelectedThemeFallback();
};

// Theme collection selector now includes Dynamic Cover Theme as a mutually
// exclusive mode. The stored static theme is never destroyed.
const v146StaticThemeCollectionSetter=App.setThemeCollection;
App.setThemeCollection=function(kind){
  if(kind==='dynamic'){
    S.settings.dynamicCoverTheme=true;
    document.documentElement.dataset.v146ThemeMode='dynamic';
    persistSettings();
    render();
    v146ScheduleDynamicTheme();
    return;
  }

  if(['mediaflow','platform','fullstyle'].includes(kind)){
    S.settings.dynamicCoverTheme=false;
    ++V146_DYNAMIC_SEQ;
    v146ClearInlineThemeVars();
    document.documentElement.dataset.v146ThemeMode='collection';

    // Restore appearance before handing control back to the existing collection
    // implementation. It may choose a default theme when changing collections.
    try{v132ApplyAppearancePreference();}catch(_){}
    persistSettings();
    return v146StaticThemeCollectionSetter.call(App,kind);
  }

  return v146StaticThemeCollectionSetter.call(App,kind);
};

// Keep the old v145 public toggle harmless/compatible if any stale UI calls it.
App.toggleDynamicCoverTheme=function(){
  App.setThemeCollection(S.settings?.dynamicCoverTheme?'mediaflow':'dynamic');
};

const v146RenderSettingsBase=renderSettings;
renderSettings=function(){
  let out=v146RenderSettingsBase();
  const dynamic=!!S.settings?.dynamicCoverTheme;

  // Remove v145's old accent-only toggle. v146 replaces it with an actual
  // Theme Collection mode.
  out=out.replace(
    /<div class="v145-cover-theme-row">[\s\S]*?aria-label="Toggle dynamic cover theme color"><\/button><\/div>/,
    ''
  );

  const current=S.settings?.theme||'dark';
  const isPlatform=V55_PLATFORM_THEMES.includes(current);
  const isFull=FULL_STYLE_THEMES.includes(current);
  const collection=dynamic?'dynamic':isFull?'fullstyle':isPlatform?'platform':'mediaflow';

  const collectionSelect=`<select onchange="App.setThemeCollection(this.value)">
    <option value="mediaflow" ${collection==='mediaflow'?'selected':''}>MediaFlow Themes</option>
    <option value="platform" ${collection==='platform'?'selected':''}>Platform Themes</option>
    <option value="fullstyle" ${collection==='fullstyle'?'selected':''}>Full Style Themes</option>
    <option value="dynamic" ${collection==='dynamic'?'selected':''}>Dynamic Cover Theme</option>
  </select>`;

  out=out.replace(
    /<select onchange="App\.setThemeCollection\(this\.value\)">[\s\S]*?<\/select>/,
    collectionSelect
  );

  if(dynamic){
    // The visible static theme picker becomes the fallback picker while Dynamic
    // Cover Theme is selected.
    out=out.replace(
      /<label class="field-label">(MediaFlow theme|Platform theme|Full style theme)<\/label>/,
      '<label class="field-label">Fallback theme</label>'
    );

    const note=`<div class="v146-static-fallback-note">Your selected static theme is kept as the fallback. Dynamic Cover Theme uses the recommended title cover first, then On This Day. If neither cover can be used, MediaFlow returns to this fallback automatically.</div>`;
    const panel=`<div class="v146-theme-mode-panel">
      <div class="v146-theme-mode-title"><b>Dynamic Cover Theme</b><span class="v146-theme-mode-badge">Full theme</span></div>
      <small>The cover now controls the whole MediaFlow color system — background, panels, raised surfaces, borders, text and accent — not only the accent color.</small>
      <div id="v146-dynamic-theme-status" class="v146-theme-status"><span>Analyzing cover…</span></div>
    </div>`;

    const needle='<div class="section-label">THEMES & CUSTOMIZATION</div><div class="card" style="margin-bottom:22px">';
    if(out.includes(needle))out=out.replace(needle,needle+panel);

    // Add the fallback explanation immediately after the collection selector's field.
    out=out.replace(
      /(<div class="field"><label class="field-label">Theme collection<\/label>[\s\S]*?<\/div>)/,
      '$1'+note
    );
  }

  return out;
};

// The v145 applyTheme wrapper remains the final selected-theme entry point.
// When Dynamic mode is active it now schedules the v146 full palette via the
// redirected v145ScheduleDynamicCoverAccent binding.

// Refresh settings status after async palette application.
const v146RenderBase=render;
render=function(){
  const result=v146RenderBase.apply(this,arguments);
  if(S.settings?.dynamicCoverTheme)v146ScheduleDynamicTheme();
  else{
    document.documentElement.dataset.v146ThemeMode='collection';
    v146ClearInlineThemeVars();
  }
  return result;
};



