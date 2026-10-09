/* ============================================================
   THEMES — 3 new adaptive cover collections
   ============================================================ */

for(const mode of ['recommended-only','onthisday-only','source-picker']){
  V162_THEME_MODES.add(mode);
}

V162_ROTATION_INDEX['recommended-only']=0;
V162_ROTATION_INDEX['onthisday-only']=0;
V162_ROTATION_INDEX['source-picker']=0;

function v173NormalizeThemeCollectionConfig(raw,kind){
  const src=(raw&&typeof raw==='object')?raw:{};

  if(kind==='picker'){
    return {
      intervalSec:v162ClampInterval(src.intervalSec),
      selectedKeys:[...new Set(
        (Array.isArray(src.selectedKeys)?src.selectedKeys:['recommended'])
          .map(String)
          .filter(Boolean)
      )],
      modifiedAt:Number(src.modifiedAt)||0
    };
  }

  return {
    intervalSec:v162ClampInterval(src.intervalSec),
    modifiedAt:Number(src.modifiedAt)||0
  };
}

const v173EnsureThemeSettingsObjectBase=v162EnsureThemeSettingsObject;
v162EnsureThemeSettingsObject=function(settings){
  const target=v173EnsureThemeSettingsObjectBase(settings);

  target.v173RecommendedTheme=v173NormalizeThemeCollectionConfig(
    target.v173RecommendedTheme,
    'simple'
  );
  target.v173OnThisDayTheme=v173NormalizeThemeCollectionConfig(
    target.v173OnThisDayTheme,
    'simple'
  );
  target.v173SourcePickerTheme=v173NormalizeThemeCollectionConfig(
    target.v173SourcePickerTheme,
    'picker'
  );

  return target;
};

v162EnsureThemeSettings();

function v173RecommendedThemeSources(){
  const rec=v160RecommendedCoverSource();
  return rec?[rec]:[];
}

function v173OnThisDayThemeSources(){
  return v159OnThisDayThemeSources();
}

function v173PickerSourceKey(source){
  if(String(source?.source)==='recommended')return 'recommended';

  const id=String(source?.libraryId||'');
  if(id)return `otd:${id}`;

  return `otd-url:${String(source?.url||'')}`;
}

function v173PickerAvailableSources(){
  const rows=[];
  const seen=new Set();

  const add=source=>{
    if(!source)return;
    const key=v173PickerSourceKey(source);
    if(!key||seen.has(key))return;
    seen.add(key);
    rows.push({key,source});
  };

  add(v160RecommendedCoverSource());
  for(const source of v159OnThisDayThemeSources())add(source);

  return rows;
}

function v173SelectedPickerSources(){
  const cfg=v162EnsureThemeSettings().v173SourcePickerTheme;
  const selected=new Set(cfg.selectedKeys.map(String));

  return v173PickerAvailableSources()
    .filter(row=>selected.has(row.key))
    .map(row=>row.source);
}

function v173RotatedSourceRows(mode,rows){
  if(!rows.length)return [];

  const index=(
    (Number(V162_ROTATION_INDEX[mode])||0)%rows.length+
    rows.length
  )%rows.length;

  const first=rows[index];
  return [first,...rows.filter((_,i)=>i!==index)];
}

const v173ThemeSourcesBase=v162ThemeSources;
v162ThemeSources=function(){
  const mode=v162ThemeMode();

  if(mode==='recommended-only'){
    V159_FORCED_THEME_SOURCE=null;
    return v173RotatedSourceRows(
      mode,
      v173RecommendedThemeSources()
    );
  }

  if(mode==='onthisday-only'){
    V159_FORCED_THEME_SOURCE=null;
    return v173RotatedSourceRows(
      mode,
      v173OnThisDayThemeSources()
    );
  }

  if(mode==='source-picker'){
    V159_FORCED_THEME_SOURCE=null;
    return v173RotatedSourceRows(
      mode,
      v173SelectedPickerSources()
    );
  }

  return v173ThemeSourcesBase();
};

// These three collections are still direct recommendation/OTD adaptive themes,
// so keep the expressive Dynamic palette rather than the softer Library/Image
// collection palette.
const v173SoftPaletteBase=v162SoftPalette;
v162SoftPalette=function(themeData,appearance){
  const mode=v162ThemeMode();

  if(
    mode==='recommended-only'||
    mode==='onthisday-only'||
    mode==='source-picker'
  ){
    return v159CoverPalette(themeData,appearance);
  }

  return v173SoftPaletteBase(themeData,appearance);
};

function v173ThemeIntervalForMode(mode){
  const s=v162EnsureThemeSettings();

  if(mode==='recommended-only'){
    return v162ClampInterval(s.v173RecommendedTheme.intervalSec);
  }
  if(mode==='onthisday-only'){
    return v162ClampInterval(s.v173OnThisDayTheme.intervalSec);
  }
  if(mode==='source-picker'){
    return v162ClampInterval(s.v173SourcePickerTheme.intervalSec);
  }

  return 30;
}

function v173RowsForMode(mode){
  if(mode==='recommended-only')return v173RecommendedThemeSources();
  if(mode==='onthisday-only')return v173OnThisDayThemeSources();
  if(mode==='source-picker')return v173SelectedPickerSources();
  return [];
}

// FINAL collection timer: existing Library/Image behavior is preserved;
// v173 collections use their own interval and refresh even with one current
// source so changing recommendations/date context can be detected.
const v173EnsureRotationTimerBase=v162EnsureRotationTimer;
v162EnsureRotationTimer=function(reset=false){
  const mode=v162ThemeMode();
  const isV173=[
    'recommended-only',
    'onthisday-only',
    'source-picker'
  ].includes(mode);

  if(!isV173){
    return v173EnsureRotationTimerBase(reset);
  }

  if(reset||mode!==V162_ROTATION_MODE){
    v162StopRotation();
  }

  if(V162_ROTATION_TIMER)return;

  V162_ROTATION_MODE=mode;
  const delay=v173ThemeIntervalForMode(mode)*1000;

  V162_ROTATION_TIMER=setTimeout(()=>{
    V162_ROTATION_TIMER=null;

    if(v162ThemeMode()!==mode){
      v162EnsureRotationTimer(true);
      return;
    }

    const rows=v173RowsForMode(mode);

    if(rows.length>1){
      V162_ROTATION_INDEX[mode]=
        ((Number(V162_ROTATION_INDEX[mode])||0)+1)%rows.length;
    }else{
      V162_ROTATION_INDEX[mode]=0;
    }

    v146ScheduleDynamicTheme();
    v162EnsureRotationTimer(false);
  },delay);
};

function v173SetThemeInterval(mode,value){
  const s=v162EnsureThemeSettings();
  const sec=v162ClampInterval(value);
  let cfg=null;

  if(mode==='recommended-only')cfg=s.v173RecommendedTheme;
  else if(mode==='onthisday-only')cfg=s.v173OnThisDayTheme;
  else if(mode==='source-picker')cfg=s.v173SourcePickerTheme;
  else return;

  cfg.intervalSec=sec;
  cfg.modifiedAt=Date.now();
  V162_ROTATION_INDEX[mode]=0;

  persistSettings();
  v162EnsureRotationTimer(true);
  render();
  v146ScheduleDynamicTheme();
}

function v173TogglePickerSource(key,checked){
  const cfg=v162EnsureThemeSettings().v173SourcePickerTheme;
  const k=String(key||'');
  if(!k)return;

  const set=new Set(cfg.selectedKeys.map(String));
  if(checked)set.add(k);
  else set.delete(k);

  cfg.selectedKeys=[...set];
  cfg.modifiedAt=Date.now();
  V162_ROTATION_INDEX['source-picker']=0;

  persistSettings();
  v162EnsureRotationTimer(true);
  render();
  v146ScheduleDynamicTheme();
}

function v173PickerListHtml(){
  const cfg=v162EnsureThemeSettings().v173SourcePickerTheme;
  const selected=new Set(cfg.selectedKeys.map(String));
  const rows=v173PickerAvailableSources();

  if(!rows.length){
    return `<div class="v173-source-picker-empty">
      There is currently no recommended-title cover or On This Day cover available. The selected fallback theme stays active until a source becomes available.
    </div>`;
  }

  return `<div class="v173-source-picker-list">${
    rows.map(({key,source})=>{
      const checked=selected.has(key);
      const kind=source.source==='recommended'
        ?'Current MediaFlow recommendation'
        :'On This Day';

      return `<div class="v173-source-picker-row">
        <img src="${escapeHtml(source.url)}" alt="" loading="lazy"
          onerror="this.style.visibility='hidden'">
        <div class="v173-source-picker-copy">
          <b>${escapeHtml(String(source.label||'Cover source'))}</b>
          <small>${escapeHtml(kind)}</small>
        </div>
        <label>
          <input type="checkbox" ${checked?'checked':''}
            onchange="App.v173TogglePickerSource('${escapeHtml(key)}',this.checked)">
          Rotate
        </label>
      </div>`;
    }).join('')
  }</div>`;
}

const v173CollectionPanelHtmlBase=v162CollectionPanelHtml;
v162CollectionPanelHtml=function(mode){
  const s=v162EnsureThemeSettings();

  if(mode==='recommended-only'){
    const rec=v160RecommendedCoverSource();

    return `<div class="v162-cover-theme-panel">
      <div class="v162-cover-theme-head">
        <div>
          <div class="v162-cover-theme-title">Recommended Title Cover Theme</div>
          <div class="hint">Uses only the current title recommended by MediaFlow. On This Day covers are never used by this collection.</div>
        </div>
        <span class="v162-cover-theme-badge">Recommendation only</span>
      </div>

      <div class="v162-theme-controls">
        <div class="field" style="margin:0">
          <label class="field-label">Rotate / refresh every (seconds)</label>
          <input type="number" min="5" max="3600" step="1"
            value="${s.v173RecommendedTheme.intervalSec}"
            onchange="App.v173SetThemeInterval('recommended-only',this.value)">
        </div>
      </div>

      <div class="v162-rotation-note">
        The interval controls how often MediaFlow re-checks the active recommendation. If the recommended title changes, the next refresh can switch the theme to its cover.
      </div>

      ${rec
        ?`<div class="v162-theme-status"><span>${escapeHtml(rec.label)}</span></div>`
        :`<div class="v162-theme-empty">No current recommended title with a usable cover.</div>`}

      <div id="v146-dynamic-theme-status" class="v162-theme-status"><span>Preparing recommended-title theme…</span></div>
    </div>`;
  }

  if(mode==='onthisday-only'){
    const rows=v173OnThisDayThemeSources();

    return `<div class="v162-cover-theme-panel">
      <div class="v162-cover-theme-head">
        <div>
          <div class="v162-cover-theme-title">On This Day Cover Theme</div>
          <div class="hint">Uses only titles available in On This Day. MediaFlow recommendations are never used by this collection.</div>
        </div>
        <span class="v162-cover-theme-badge">On This Day only</span>
      </div>

      <div class="v162-theme-controls">
        <div class="field" style="margin:0">
          <label class="field-label">Rotate every (seconds)</label>
          <input type="number" min="5" max="3600" step="1"
            value="${s.v173OnThisDayTheme.intervalSec}"
            onchange="App.v173SetThemeInterval('onthisday-only',this.value)">
        </div>
      </div>

      <div class="v162-rotation-note">
        ${rows.length.toLocaleString()} usable On This Day cover${rows.length===1?'':'s'} currently available. Multiple covers rotate sequentially on the interval above.
      </div>

      <div id="v146-dynamic-theme-status" class="v162-theme-status"><span>Preparing On This Day theme…</span></div>
    </div>`;
  }

  if(mode==='source-picker'){
    return `<div class="v162-cover-theme-panel">
      <div class="v162-cover-theme-head">
        <div>
          <div class="v162-cover-theme-title">Recommendation + On This Day Picks</div>
          <div class="hint">Choose exactly which currently available recommendation / On This Day cover sources are allowed into this rotation.</div>
        </div>
        <span class="v162-cover-theme-badge">Choose sources</span>
      </div>

      <div class="v162-theme-controls">
        <div class="field" style="margin:0">
          <label class="field-label">Rotate every (seconds)</label>
          <input type="number" min="5" max="3600" step="1"
            value="${s.v173SourcePickerTheme.intervalSec}"
            onchange="App.v173SetThemeInterval('source-picker',this.value)">
        </div>
      </div>

      <div class="v162-rotation-note">
        “Recommended” is a live slot: when selected, it follows MediaFlow's current recommendation. On This Day selections refer to the currently available titles shown below.
      </div>

      ${v173PickerListHtml()}

      <div id="v146-dynamic-theme-status" class="v162-theme-status"><span>Preparing selected cover rotation…</span></div>
    </div>`;
  }

  return v173CollectionPanelHtmlBase(mode);
};

// FINAL collection selector action.
const v173SetThemeCollectionBase=App.setThemeCollection;
App.setThemeCollection=function(kind){
  const k=String(kind||'');
  const map={
    'recommended-cover':'recommended-only',
    'on-this-day-cover':'onthisday-only',
    'recommendation-day-picker':'source-picker'
  };

  if(map[k]){
    S.settings=v162EnsureThemeSettingsObject(S.settings||DEFAULT_SETTINGS);
    S.settings.dynamicCoverTheme=true;
    S.settings.v162ThemeCollection=map[k];

    V162_ROTATION_INDEX[map[k]]=0;
    v162StopRotation();

    document.documentElement.dataset.v146ThemeMode='dynamic';
    persistSettings();
    render();
    v146ScheduleDynamicTheme();
    v162EnsureRotationTimer(true);
    return;
  }

  return v173SetThemeCollectionBase.call(this,k);
};

// FINAL Settings selector includes the three new collections.
const v173RenderSettingsBase=renderSettings;
renderSettings=function(){
  let h=v173RenderSettingsBase();
  const s=v162EnsureThemeSettings();
  const mode=v162ThemeMode();

  const current=s.theme||'dark';
  const isPlatform=V55_PLATFORM_THEMES.includes(current);
  const isFull=FULL_STYLE_THEMES.includes(current);

  let collection='mediaflow';

  if(s.dynamicCoverTheme){
    collection=
      mode==='library'?'library-cover':
      mode==='image'?'image-url':
      mode==='recommended-only'?'recommended-cover':
      mode==='onthisday-only'?'on-this-day-cover':
      mode==='source-picker'?'recommendation-day-picker':
      'dynamic';
  }else{
    collection=isFull?'fullstyle':isPlatform?'platform':'mediaflow';
  }

  const selector=`<select onchange="App.setThemeCollection(this.value)">
    <option value="mediaflow" ${collection==='mediaflow'?'selected':''}>MediaFlow Themes</option>
    <option value="platform" ${collection==='platform'?'selected':''}>Platform Themes</option>
    <option value="fullstyle" ${collection==='fullstyle'?'selected':''}>Full Style Themes</option>
    <option value="dynamic" ${collection==='dynamic'?'selected':''}>Dynamic Cover Theme</option>
    <option value="recommended-cover" ${collection==='recommended-cover'?'selected':''}>Recommended Title Covers</option>
    <option value="on-this-day-cover" ${collection==='on-this-day-cover'?'selected':''}>On This Day Covers</option>
    <option value="recommendation-day-picker" ${collection==='recommendation-day-picker'?'selected':''}>Recommendation + On This Day Picks</option>
    <option value="library-cover" ${collection==='library-cover'?'selected':''}>Library Cover Themes</option>
    <option value="image-url" ${collection==='image-url'?'selected':''}>Image URL Themes</option>
  </select>`;

  h=h.replace(
    /<select onchange="App\.setThemeCollection\(this\.value\)">[\s\S]*?<\/select>/,
    selector
  );

  return h;
};

Object.assign(App,{
  v173SetThemeInterval,
  v173TogglePickerSource
});

