from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
module=(ROOT/'src/js/components/233-v335-statistics-xp-calculator-polish.js').read_text()
css=(ROOT/'assets/css/162-v335-stats-xp-calculator.css').read_text()
base=r'''
var DEFAULT_SETTINGS={leveling:{}};
var V334_REWARD_DEFAULTS={activeTimeXPPerMinute:2,firstTitleStartXP:40,collectionCreateXP:35,collectionEditXP:10};
var S={settings:{leveling:{enabled:true}},categories:[{id:'anime',unit:'episodes'}],library:[{id:'first',categoryId:'anime',progress:0}],xpLedger:{},view:'library',collections:[]};
var AUTH_USER={id:'example1'},AUTH_READY=true,V334_ADDING_LOG_ENTRY=false;
var MediaFlowRuntime={registerPageRenderer(k,f){this[k]=f;},registerPageEnhancer(){}};
var App={setView(v){S.view=v;renderView();},mobileNav(v){S.view=v;renderView();},updateLeveling(k,v){S.settings.leveling[k]=Number(v)}};
var v334Ledger=()=>{S.xpLedger.v334ActiveTimeDays=S.xpLedger.v334ActiveTimeDays||{};return S.xpLedger;};
var v334Reward=(key)=>Number(S.settings.leveling[key]||0);
var v334Sum=(x)=>Object.values(x||{}).reduce((s,v)=>s+Number(v||0),0);
var v334Totals=()=>({activeMs:3600000,timeXP:144,startsXP:40,collectionCreateXP:35,collectionEditXP:10,total:229});
var v334InvalidateXP=()=>{};
var loadAll=async function(){};
var persistLibrary=()=>{};
var awardLibraryAdditionXP=(id)=>0;
var v120XPBreakdown=()=>({totalXP:229});
var mergeStates=(a,b)=>({...b,...a,xpLedger:{...b?.xpLedger,...a?.xpLedger}});
var v221RenderSettingsPage=()=>`<div class="v221-settings-page"><div class="v221-settings-content"><div class="section-label settings-section-head"><span>LEVELING &amp; XP</span></div><div class="card"><div>Basic leveling options</div><div style="font-weight:700;font-size:12px;margin:14px 0 8px;">UNIT XP</div><div>Other XP options</div></div></div></div>`;
var v221PlainSectionTitle=(x)=>x.textContent.trim();
var v256RuntimeCalculatorHtml=()=>`<div class="v256-runtime-mode-tabs"><button onclick="App.v256SetRuntimeMode('chain')"><span class="v334-mode-icon"><svg><circle/></svg></span>Carry-forward</button><button onclick="App.v256SetRuntimeMode('multi')"><span class="v334-mode-icon"><svg><circle/></svg></span>Multi-row</button></div><div class="v256-runtime-actions"><button onclick="App.v256ContinueRuntimeResult()">Continue with result</button></div>`;
var v225IconSvg=(paths)=>`<svg viewBox="0 0 24 24">${paths}</svg>`;
var v225ButtonIconName=()=>"generic";
var v149StreakMultiplier=()=>1.2, v149ProspectiveTodayStreak=()=>4;
var todayISO=()=>new Date().toISOString().slice(0,10);
var v334Duration=(ms)=>`${Math.floor(ms/3600000)}h ${Math.floor(ms%3600000/60000)}m ${Math.floor(ms%60000/1000)}s`;
var renderStats=()=>`<div class="view-head">Statistics</div><section class="card"><div class="section-label">LIFETIME ACHIEVEMENTS</div>achievements</section><section class="card stats-level-card">Leveling</section><section class="card v334-active-time-card">old</section>`;
var renderView=()=>{ document.getElementById('view-root').innerHTML=renderStats();};
var v334ScrollDashboardTop=()=>{window.scrollTo(0,0);document.scrollingElement.scrollTop=0;};
'''
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1280,'height':900})
    page.set_content('<style>:root{--panel:#19202e;--panel-raised:#263143;--flow:#82a5ff;--text:#f4f6fe;--text-dim:#acb9cf;--border:#415168}body{background:#111827;color:var(--text);font-family:Arial;padding:30px}.card{border-radius:16px}.stats-level-card{padding:20px;background:var(--panel);margin-bottom:25px}</style><main id="view-root"></main>')
    page.add_style_tag(content=css)
    page.add_script_tag(content=base+module)
    x=page.evaluate("""() => {let el=document.createElement('div');el.innerHTML=v335RenderSettingsPage();const xp=el.querySelector('#v335-xp-settings');return {exists:!!xp,fields:[...xp.querySelectorAll('input')].map(x=>x.id),parent:xp.parentElement.className};}""")
    assert x['exists'] and len(x['fields'])==5 and x['parent']=='card',x
    assert 'v335-xp-firstEpisodeXP' in x['fields'],x
    text=page.evaluate('v256RuntimeCalculatorHtml()')
    page.locator('#view-root').evaluate('(el,html)=>el.innerHTML=html',text)
    buttons=page.locator('[data-v335-calculator-icon]')
    assert buttons.count()==3,('calculator buttons',text)
    assert buttons.nth(0).locator('svg').count()==1,('carry svg',text)
    assert buttons.nth(1).locator('svg').count()==1,('multi svg',text)
    assert buttons.nth(2).locator('svg').count()==1,('continue svg',text)
    assert page.evaluate('v225ButtonIconName(document.querySelector("[data-v335-calculator-icon]"))') is None
    result=page.evaluate("""() => {v335SeedEpisodes(); S.library[0].progress=1;persistLibrary();let one=v335EpisodeLedger().first;persistLibrary();return {one,total:v334Totals().firstEpisodeXP,repeat:v335EpisodeLedger().first};}""")
    assert result=={'one':20,'total':20,'repeat':20},result
    result=page.evaluate("""() => {S.library.push({id:'imported',categoryId:'anime',progress:30});persistLibrary();return v335EpisodeLedger().imported;}""")
    assert result is None, result
    page.evaluate("""() => {document.getElementById('view-root').innerHTML=renderStats();}""")
    labels=page.evaluate("""() => {let host=document.createElement('div');host.innerHTML=renderStats();return [...host.querySelectorAll('.card')].map(x=>x.getAttribute('aria-label')||x.textContent.trim().slice(0,40));}""")
    assert labels[0]=='Leveling' and labels[1]=='Active Time Spent' and labels[2]=='LIFETIME ACHIEVEMENTSachievements',labels
    page.locator('#view-root').evaluate('(x)=>x.innerHTML=renderStats()')
    page.screenshot(path='/mnt/data/v335_stats_preview.png',full_page=True)
    page.evaluate("""() => {document.body.style.minHeight='3000px';window.scrollTo(0,700);S.view='dashboard';V335_PREVIOUS_VIEW='dashboard';App.setView('stats');}""")
    page.wait_for_timeout(120)
    scroll=page.evaluate('document.scrollingElement.scrollTop')
    assert scroll==0,scroll
    # Rerendering within Statistics must not forcibly jump to top.
    page.evaluate("""() => {document.scrollingElement.scrollTop=450;renderView()}""")
    assert page.evaluate('document.scrollingElement.scrollTop')==450
    print('PASS v335 live browser DOM: settings, icons, episode rewards, stats order, scroll reset')
    browser.close()
