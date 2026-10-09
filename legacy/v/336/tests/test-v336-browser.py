from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
module=(ROOT/'src/js/components/234-v336-dialogs-active-time-analytics.js').read_text()
css=(ROOT/'assets/css/163-v336-dialogs-active-time-analytics.css').read_text()
base=r'''
var DEFAULT_SETTINGS={leveling:{}};
var S={view:'stats',settings:{leveling:{enabled:true,activeTimeXPPerMinute:2}},xpLedger:{v334ActiveTimeDays:{}},categories:[],library:[],collections:[]};
var AUTH_USER={id:'u1',email:'a@b.com',user_metadata:{}},AUTH_READY=true;
var supabase={auth:{updateUser:async()=>({})}};
var App={setView(v){S.view=v;},mobileNav(v){S.view=v;},updateSetting(){},updateLeveling(k,v){S.settings.leveling[k]=Number(v)},addLogEntry(){},openLibraryModal(){},saveLibrary(){},confirmDeleteLibrary(){},openSessionModal(){},saveSession(){},v274SaveCollection(){},v274OpenCollection(){},v274CommitAddTitles(){},v274RemoveTitle(){},v274RemoveSelectedFromCollection(){},openProfile(){}};
var MediaFlowRuntime={registerPageRenderer(){},registerPageEnhancer(){}};
var V335_PREVIOUS_VIEW='dashboard';
var v334ScrollDashboardTop=()=>{window.scrollTo(0,0);document.scrollingElement.scrollTop=0;};
var render=()=>{}; var refreshAuthUser=async()=>{};
var v149StreakMultiplier=()=>1.2, v149ProspectiveTodayStreak=()=>4;
var todayISO=()=>new Date().toISOString().slice(0,10);
var v334Reward=(k)=>Number(S.settings.leveling[k]||2);
var v334Sum=(x)=>Object.values(x||{}).reduce((s,v)=>s+Number(v||0),0);
var v334Ledger=()=>S.xpLedger;
var v334Totals=()=>({activeMs:7200000,timeXP:288,startsXP:40,collectionCreateXP:35,collectionEditXP:10,firstEpisodeXP:20,total:393});
var v334Duration=(ms)=>`${Math.floor(ms/3600000)}h ${Math.floor(ms%3600000/60000)}m ${Math.floor(ms%60000/1000)}s`;
var v334EarnTime=(ms,day)=>{}; var mergeStates=(a,b)=>({...b,...a,xpLedger:{...(b?.xpLedger||{}),...(a?.xpLedger||{})}});
var v115StartWithData=async(v)=>{window.__startEmpty=v===undefined?'empty':v;};
window.MediaFlowRecovery={};
var escapeHtml=(s)=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function iso(days){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+days);return d.toISOString().slice(0,10)}
const labels=['dashboard','library','stats','settings','history'];
for(let i=-34;i<=0;i++){
  const key=iso(i), page=labels[(i+40)%labels.length], action=page==='stats'?'analytics':page==='settings'?'settings':page==='history'?'history':page==='dashboard'?'logging':'editing';
  const ms=Math.max(0,(i+35))*60000;
  S.xpLedger.v334ActiveTimeDays[key]={ms:ms,xp:Math.floor(ms/60000)*2,pageMs:{[page]:ms},actionMs:{[action]:ms}};
}
function renderStats(){return '<div class="view-head">Statistics</div><section class="card stats-level-card">Leveling</section><section class="card v334-active-time-card">old</section><section class="card"><div class="section-label">LIFETIME ACHIEVEMENTS</div></section>';}
function renderView(){ document.getElementById('view-root').innerHTML=renderStats(); }
function v335ActiveTimeCard(){return '<div>old active</div>';}
'''
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1280,'height':1600})
    page.set_content('<style>:root{--panel:#19202e;--panel-raised:#263143;--flow:#82a5ff;--text:#f4f6fe;--text-dim:#acb9cf;--border:#415168;--danger:#eb6969}body{background:#111827;color:var(--text);font-family:Arial;padding:24px}.card,.modal{border-radius:16px}.stats-level-card{padding:20px;background:var(--panel);margin-bottom:25px}.btn{border:1px solid var(--border);background:#243041;color:white;border-radius:999px;padding:8px 12px;cursor:pointer}.btn-primary{background:#2d4670}.btn-ghost{background:transparent}.btn-sm{padding:7px 11px;font-size:12px}.modal-overlay{position:fixed;inset:0;display:grid;place-items:center}.modal{background:var(--panel)}</style><main id="view-root"></main>')
    page.add_style_tag(content=css)
    page.add_script_tag(content=base+module)
    card=page.evaluate('v335ActiveTimeCard()')
    assert 'Last 30 days' in card and 'Time by page' in card and 'Time by action' in card and 'Weekday rhythm' in card, card[:500]
    page.evaluate('()=>{ window.MediaFlowRecovery.startEmpty(); return true; }')
    page.wait_for_selector('#v336-dialog-root')
    assert page.locator('#v336-dialog-root .modal-title').inner_text()=='Empty MediaFlow workspace?'
    page.locator('#v336-dialog-root [data-v336-dialog-confirm]').click()
    page.wait_for_timeout(260)
    assert page.evaluate('window.__startEmpty')=='empty'
    page.evaluate("document.body.innerHTML += '<div class=\"card\"><input id=\"profile-name\" value=\"Alex\"><button class=\"btn btn-primary\">Save name</button></div>'")
    page.evaluate('()=>{ updateAccountName(); return true; }')
    page.wait_for_selector('#v336-dialog-root')
    assert page.locator('#v336-dialog-root .modal-title').inner_text()=='Profile updated'
    page.locator('#v336-dialog-root [data-v336-dialog-confirm]').click()
    page.wait_for_timeout(260)
    page.locator('#view-root').evaluate('(el,html)=>el.innerHTML=html', page.evaluate('v335ActiveTimeCard()'))
    page.screenshot(path='/mnt/data/v336_active_time_preview.png',full_page=True)
    print('PASS v336 dialogs + active-time analytics smoke test')
    browser.close()
