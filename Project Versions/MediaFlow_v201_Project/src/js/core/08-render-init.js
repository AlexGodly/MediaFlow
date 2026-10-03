/* MediaFlow v201 source fragment
 * Render loop, initialization and service-worker registration
 * Original HTML lines 13078-13178.
 * Build order matters; see scripts/build.mjs.
 */

/* ============================================================

   RENDER LOOP + INIT

   ============================================================ */

function render(){

  if(!document.querySelector('.sidebar')) { renderShell(); bindSidebarResizer(); autoFitSidebarToProfile(); return; }

  bindSidebarResizer();

  // update sidebar active states + streak without full rebuild for smoothness

  document.querySelectorAll('.nav-item').forEach((el,i)=>el.classList.toggle('active', NAV_ITEMS[i].id===S.view));

  const mobileBar=document.querySelector('.mobile-tabbar'); if(mobileBar) mobileBar.innerHTML=renderMobileTabs();
  const accountName=document.querySelector('.account-menu-email');
  if(accountName)accountName.textContent=getDisplayName();
  const accountAvatarBtn=document.querySelector('.account-menu .account-avatar-btn');
  if(accountAvatarBtn)accountAvatarBtn.innerHTML=renderAccountAvatar();
  autoFitSidebarToProfile();

  renderView();

  renderModal();

}

async function startAuthenticatedApp(){AUTH_READY=true;await v115SafeBootstrap();}
async function init(){if(!supabase){renderAuthScreen('login');return;}try{const {data}=await supabase.auth.getSession();AUTH_USER=data?.session?.user||null;if(AUTH_USER)await startAuthenticatedApp();else renderAuthScreen('login');supabase.auth.onAuthStateChange(async(_event,session)=>{const next=session?.user||null;if(next&&!AUTH_READY){AUTH_USER=next;await startAuthenticatedApp();}else if(!next&&AUTH_READY){AUTH_USER=null;AUTH_READY=false;renderAuthScreen('login');}});}catch(err){renderAuthScreen('login',friendlyAuthError(err),true);}}
init();

// Only meaningful once this file is hosted at a real URL alongside sw.js/manifest.json

// (e.g. GitHub Pages) — installs MediaFlow as an app icon on Android/iOS home screens.

if('serviceWorker' in navigator){

  window.addEventListener('load', ()=>{

    navigator.serviceWorker.register('sw.js').catch(()=>{ /* not hosted with a SW — fine, app still works */ });

  });

}

window.addEventListener('beforeunload', function(e){

  if(saveQueue){ /* saves are queued+awaited on every action already; this is a last-resort nudge */ }

});


/* MediaFlow v107: Full Style Themes library expanded to the complete service set. */
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
