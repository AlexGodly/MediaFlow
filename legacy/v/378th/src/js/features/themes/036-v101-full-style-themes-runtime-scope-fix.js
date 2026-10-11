/* MediaFlow v101: Full Style Themes runtime scope fix */
const FULL_STYLE_THEMES=['fullstyle-anilist','fullstyle-anisearch','fullstyle-aniwatch','fullstyle-betaseries','fullstyle-criticker','fullstyle-crunchyroll','fullstyle-episodecalendar','fullstyle-hianime','fullstyle-imdb','fullstyle-letterboxd','fullstyle-livechart','fullstyle-kitsu','fullstyle-moviesfad','fullstyle-myanimelist','fullstyle-netflix','fullstyle-primewire','fullstyle-seriesfad','fullstyle-simkl','fullstyle-stremio','fullstyle-trakt','fullstyle-tvtime','fullstyle-tviso','fullstyle-twee'];
  const FULL_STYLE_LABELS={'fullstyle-anilist':'AniList','fullstyle-anisearch':'AniSearch','fullstyle-aniwatch':'AniWatch','fullstyle-betaseries':'BetaSeries','fullstyle-criticker':'Criticker','fullstyle-crunchyroll':'Crunchyroll','fullstyle-episodecalendar':'EpisodeCalendar','fullstyle-hianime':'HiAnime','fullstyle-imdb':'IMDb','fullstyle-letterboxd':'Letterboxd','fullstyle-livechart':'LiveChart','fullstyle-kitsu':'Kitsu','fullstyle-moviesfad':'MoviesFad','fullstyle-myanimelist':'MyAnimeList','fullstyle-netflix':'Netflix','fullstyle-primewire':'PrimeWire','fullstyle-seriesfad':'SeriesFad','fullstyle-simkl':'Simkl','fullstyle-stremio':'Stremio','fullstyle-trakt':'trakt','fullstyle-tvtime':'TV Time','fullstyle-tviso':'Tviso','fullstyle-twee':'Twee'};
  for(const t of FULL_STYLE_THEMES){
    if(!V43_THEMES.includes(t)) V43_THEMES.push(t);
    V43_THEME_LABELS[t]=FULL_STYLE_LABELS[t];
  }

  const v100ApplyTheme=applyTheme;
  applyTheme=function(theme){
    if(FULL_STYLE_THEMES.includes(theme)){
      if(S.settings)S.settings.theme=theme;
      v43ApplyCustomTheme();
      document.documentElement.dataset.theme=theme;
      try{localStorage.setItem('mf_theme',theme);}catch(e){}
      return;
    }
    v100ApplyTheme(theme);
  };

  App.setThemeCollection=function(kind){
    const current=S.settings.theme||'dark';
    const isPlatform=V55_PLATFORM_THEMES.includes(current);
    const isFull=FULL_STYLE_THEMES.includes(current);
    if(kind==='fullstyle'&&!isFull){S.settings.theme='fullstyle-netflix';applyTheme(S.settings.theme);persistSettings();render();return;}
    if(kind==='platform'&&!isPlatform){S.settings.theme='platform-anilist-dark';applyTheme(S.settings.theme);persistSettings();render();return;}
    if(kind==='mediaflow'&&(isPlatform||isFull)){S.settings.theme='dark';applyTheme('dark');persistSettings();render();return;}
    render();
  };

  const v100SettingsBase=renderSettings;
  renderSettings=function(){
    let html=v100SettingsBase();
    const current=S.settings.theme||'dark';
    const platform=V55_PLATFORM_THEMES.includes(current);
    const full=FULL_STYLE_THEMES.includes(current);
    const collection=full?'fullstyle':platform?'platform':'mediaflow';
    const collectionSelect=`<select onchange="App.setThemeCollection(this.value)"><option value="mediaflow" ${collection==='mediaflow'?'selected':''}>MediaFlow Themes</option><option value="platform" ${collection==='platform'?'selected':''}>Platform Themes</option><option value="fullstyle" ${collection==='fullstyle'?'selected':''}>Full Style Themes</option></select>`;
    html=html.replace(/<select onchange="App\.setThemeCollection\(this\.value\)">[\s\S]*?<\/select>/,collectionSelect);
    if(full){
      const opts=FULL_STYLE_THEMES.map(t=>`<option value="${t}" ${current===t?'selected':''}>${FULL_STYLE_LABELS[t]}</option>`).join('');
      html=html.replace(/<div class="field"><label class="field-label">MediaFlow theme<\/label>[\s\S]*?<\/div>|<div class="field"><label class="field-label">Platform theme<\/label>[\s\S]*?<\/div>/,`<div class="field"><label class="field-label">Full style theme</label><select onchange="App.setTheme(this.value)">${opts}</select><small class="hint">Full Style Themes transform MediaFlow's layout, navigation, surfaces, typography and controls — not only its colors.</small></div>`);
    }
    return html;
  };

  /* ============================================================
     MediaFlow v106 — Global Light / Dark Appearance Layer
     ------------------------------------------------------------
     Theme identity and appearance are intentionally separate:
       - S.settings.theme chooses the visual theme / Full Style.
       - S.settings.appearanceMode chooses light or dark globally.

     New themes automatically participate when they use MediaFlow's
     shared surface/text variables and standard component classes.
     ============================================================ */
  function v106ParseRgb(value){
    const m=String(value||'').match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
    return m?[Number(m[1]),Number(m[2]),Number(m[3])]:null;
  }

  function v106DetectThemeAppearance(){
    /* Resolve var(--bg) through the browser instead of maintaining a list of
       "light" and "dark" theme IDs. That keeps migration compatible with
       custom themes and future themes. Temporarily remove the global layer so
       we measure the selected theme itself rather than our own override. */
    const root=document.documentElement;
    const previousAppearance=root.getAttribute('data-appearance');
    try{
      root.removeAttribute('data-appearance');
      const probe=document.createElement('span');
      probe.setAttribute('aria-hidden','true');
      probe.style.cssText='position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;pointer-events:none;background:var(--bg);';
      (document.body||document.documentElement).appendChild(probe);
      const rgb=v106ParseRgb(getComputedStyle(probe).backgroundColor);
      probe.remove();
      if(previousAppearance) root.setAttribute('data-appearance',previousAppearance);
      if(rgb){
        const linear=rgb.map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});
        const luminance=0.2126*linear[0]+0.7152*linear[1]+0.0722*linear[2];
        return luminance>.42?'light':'dark';
      }
    }catch(e){
      if(previousAppearance) root.setAttribute('data-appearance',previousAppearance);
    }
    const id=String(S.settings?.theme||document.documentElement.dataset.theme||'').toLowerCase();
    if(/(?:^|-)light(?:$|-)/.test(id)||['sakura','arctic','desert','lavender','peach','mint','paper','sky','ivory','blueprint','candy'].includes(id)) return 'light';
    return 'dark';
  }

  function v106AppearanceMode(){
    if(!S.settings) return document.documentElement.dataset.appearance==='light'?'light':'dark';
    let mode=String(S.settings.appearanceMode||'').toLowerCase();
    if(mode!=='light'&&mode!=='dark'){
      mode=v106DetectThemeAppearance();
      /* Migration deliberately starts from the theme's current native mode so
         upgrading to v106 does not suddenly invert an existing user's UI. */
      S.settings.appearanceMode=mode;
    }
    return mode;
  }

  function v106ApplyAppearance(mode){
    mode=mode==='light'?'light':'dark';
    document.documentElement.removeAttribute('data-native-scheme');
    document.documentElement.dataset.appearance=mode;
    document.documentElement.style.colorScheme=mode;
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta) meta.setAttribute('content',mode==='light'?'#f5f7fb':'#0b0e14');
    return mode;
  }

  /* ============================================================
     MediaFlow v132 — Optional Global Appearance Layer
     ------------------------------------------------------------
     ON  = v106 Light/Dark surface overrides are applied globally.
     OFF = data-appearance is removed completely so the selected
           MediaFlow / Platform / Full Style theme renders natively.
     ============================================================ */
  function v132GlobalAppearanceEnabled(){
    return S.settings?.globalAppearanceEnabled!==false;
  }

  function v132RestoreNativeAppearance(){
    const root=document.documentElement;
    root.removeAttribute('data-appearance');
    root.style.removeProperty('color-scheme');

    /* v133 records the theme's own light/dark nature while Global Appearance
       is OFF. This does NOT recolor the theme; it only lets us replace old
       hard-coded dark base components with the theme's own CSS variables. */
    const nativeMode=v106DetectThemeAppearance();
    root.dataset.nativeScheme=nativeMode;
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta) meta.setAttribute('content',nativeMode==='light'?'#f5f7fb':'#0b0e14');
    return 'native';
  }

  function v132ApplyAppearancePreference(){
    if(v132GlobalAppearanceEnabled()) return v106ApplyAppearance(v106AppearanceMode());
    return v132RestoreNativeAppearance();
  }

  const v106ApplyThemeBase=applyTheme;
  applyTheme=function(theme){
    /* Always apply the selected theme first. The global layer is optional:
       when disabled, removing data-appearance exposes the theme's original
       colors/surfaces instead of forcing MediaFlow's Light/Dark neutrals. */
    v106ApplyThemeBase(theme);
    v132ApplyAppearancePreference();
  };

  function v106SetAppearanceMode(mode){
    if(mode!=='light'&&mode!=='dark') return;
    S.settings.appearanceMode=mode;
    if(v132GlobalAppearanceEnabled()) v106ApplyAppearance(mode);
    persistSettings();
    render();
  }

  function v132SetGlobalAppearanceEnabled(enabled){
    S.settings.globalAppearanceEnabled=!!enabled;
    v132ApplyAppearancePreference();
    persistSettings();
    render();
  }

  App.setAppearanceMode=v106SetAppearanceMode;
  App.setGlobalAppearanceEnabled=v132SetGlobalAppearanceEnabled;
  App.toggleAppearanceMode=function(){v106SetAppearanceMode(v106AppearanceMode()==='dark'?'light':'dark');};
  App.toggleGlobalAppearance=function(){v132SetGlobalAppearanceEnabled(!v132GlobalAppearanceEnabled());};

  const v106SettingsBase=renderSettings;
  renderSettings=function(){
    let html=v106SettingsBase();
    const mode=v106AppearanceMode();
    const enabled=v132GlobalAppearanceEnabled();
    const globalAppearance=`<div class="field v106-global-appearance ${enabled?'':'v132-native-appearance'}">
      <div class="settings-toggle-row" style="display:flex;align-items:center;justify-content:space-between;gap:16px;">
        <div>
          <label class="field-label" style="margin:0 0 4px;">Global appearance</label>
          <small class="hint">${enabled?'ON — MediaFlow applies the selected Light/Dark appearance after every theme.':'OFF — Native theme appearance. MediaFlow is not applying any global Light/Dark color layer.'}</small>
        </div>
        <button type="button" class="toggle ${enabled?'on':''}" onclick="App.setGlobalAppearanceEnabled(${enabled?'false':'true'})" aria-label="${enabled?'Disable':'Enable'} global appearance" aria-pressed="${enabled?'true':'false'}"></button>
      </div>
      <div class="v132-appearance-mode-controls" style="margin-top:12px;" ${enabled?'':'aria-disabled="true"'}>
        <label class="field-label">Light / Dark override</label>
        <select onchange="App.setAppearanceMode(this.value)" aria-label="Global light or dark appearance" ${enabled?'':'disabled'}>
          <option value="light" ${mode==='light'?'selected':''}>☀ Light mode</option>
          <option value="dark" ${mode==='dark'?'selected':''}>🌙 Dark mode</option>
        </select>
        <small class="hint">${enabled?'Changing themes keeps this Light/Dark override, including future themes.':'Turn Global appearance on to use the Light/Dark override again. Your saved mode is kept while native appearance is active.'}</small>
      </div>
    </div>`;
    const themeHint='<small class="hint">Switch collections first. The selected collection gets its own theme dropdown.</small></div>';
    if(html.includes(themeHint)) html=html.replace(themeHint,themeHint+globalAppearance);
    return html;
  };

  /* Apply immediately for normal themes too. initTheme() will run through the
     wrapped applyTheme after account state finishes loading. */
  v132ApplyAppearancePreference();

  /* Restore a saved Full Style theme after v99's earlier theme initializer has run. */
  const saved=S.settings?.theme||localStorage.getItem('mf_theme');
  if(FULL_STYLE_THEMES.includes(saved)) applyTheme(saved);


