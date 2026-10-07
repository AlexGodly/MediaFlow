#!/usr/bin/env python3
from pathlib import Path
import json,re,shutil,sys,base64
try:
    from playwright.sync_api import sync_playwright
except Exception as e:
    print('PLAYWRIGHT UNAVAILABLE',e);sys.exit(2)
ROOT=Path(__file__).resolve().parents[1]
index=(ROOT/'index.html').read_text(encoding='utf-8')
css='\n'.join((ROOT/m.group(1)).read_text(encoding='utf-8') for m in re.finditer(r'<link rel="stylesheet" href="([^"]+\.css)">',index) if (ROOT/m.group(1)).exists())
bundle=(ROOT/'assets/js/mediaflow-v292.bundle.js').read_text(encoding='utf-8')
svg='''<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ff7b31"/><stop offset=".48" stop-color="#6e2d22"/><stop offset="1" stop-color="#1a1525"/></linearGradient></defs><rect width="600" height="900" fill="url(#g)"/><circle cx="410" cy="255" r="190" fill="#ffca70" opacity=".38"/><circle cx="200" cy="560" r="270" fill="#ff432e" opacity=".28"/><text x="45" y="780" fill="white" font-family="sans-serif" font-size="48" font-weight="700">TEST COVER</text></svg>'''
cover='data:image/svg+xml;base64,'+base64.b64encode(svg.encode()).decode()
cat={'id':'seasonal','name':'Seasonal Anime','icon':'🌸','iconUrl':'','type':'video','unit':'episodes','target':3,'weight':1,'minutesPerUnit':30,'color':'#ff6b7d','seasonal':True,'enabled':True,'custom':False}
item={'id':'t1','title':'Cover Background Test','categoryId':'seasonal','status':'active','priority':'medium','progress':2,'total':12,'rating':8,'coverUrl':cover,'tags':[]}
state={'categories':[cat],'categoryOrder':['seasonal'],'library':[item], 'collections':[],'collectionTombstones':[],'sessions':[],'settings':{'categoryOrder':['seasonal'],'exactTitleRecommendations':True,'v292RecommendationBackground':'default'},'orderPlan':{'titleIds':[],'viewMode':'category','categoryMode':'default','categoryOrder':['seasonal'],'hiddenCategories':[],'modifiedAt':1},'currentTask':{'categoryId':'seasonal','libraryId':'t1','title':'Cover Background Test','low':7,'high':9,'unit':'episodes','reasons':['Fresh episodes available','Seasonal priority']},'sessionActive':True,'profilePicture':'','activityLog':[],'migrations':{},'savedAt':1}
def setup(st):
    return f'''() => {{const store={{}};const fake={{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k],clear(){{}},key:i=>Object.keys(store)[i]||null,get length(){{return Object.keys(store).length}}}};Object.defineProperty(window,'localStorage',{{configurable:true,value:fake}});Object.defineProperty(window,'sessionStorage',{{configurable:true,value:fake}});const user={{id:'u',email:'a@b.test',created_at:new Date().toISOString(),user_metadata:{{display_name:'Alex'}}}};let cloud={json.dumps(st,separators=(',',':'))};const mk=()=>{{const q={{select(){{return q}},eq(){{return q}},maybeSingle:async()=>({{data:{{state_data:cloud,updated_at:new Date().toISOString()}},error:null}}),upsert:async row=>{{cloud=row.state_data;return {{error:null}}}},delete(){{return q}}}};return q}};window.supabase={{createClient:()=>({{auth:{{getSession:()=>new Promise(r=>setTimeout(()=>r({{data:{{session:{{user}}}}}}),40)),onAuthStateChange:()=>({{data:{{subscription:{{unsubscribe(){{}}}}}}}}),getUser:async()=>({{data:{{user}},error:null}})}},from:mk}})}};window.confirm=()=>true;window.alert=()=>{{}};window.prompt=()=>null;}}'''
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
if not chromium:
    print('CHROMIUM UNAVAILABLE');sys.exit(2)
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
    page=b.new_page(viewport={'width':1440,'height':900})
    page.set_content(f'<!doctype html><html><head><style>{css}</style></head><body><div id="app"></div></body></html>')
    page.evaluate(setup(state));page.add_script_tag(content=bundle);page.wait_for_timeout(1200)

    audit=page.evaluate('App.v292AuditState()')
    assert audit['version']==292 and audit['recommendationBackground']=='default' and audit['defaultRecommendationBackground']=='default',audit

    # Default stays visually unchanged.
    page.evaluate("App.setView('dashboard')");page.wait_for_timeout(180)
    default_dom=page.evaluate("() => ({hero:!!document.querySelector('.hero'),coverHero:!!document.querySelector('.hero.mf292-recommendation-cover')})")
    assert default_dom['hero'] and default_dom['coverHero'] is False,default_dom

    # Settings control is organized inside the existing Dashboard Settings section.
    page.evaluate("App.setView('settings')");page.wait_for_timeout(220)
    settings=page.evaluate('''() => {const sel=document.querySelector('[data-v292-recommendation-background]');const group=sel?.closest('.v221-settings-page-group');const section=sel?.closest('.v221-settings-page-group-body');return {select:!!sel,value:sel?.value||'',text:section?.textContent||'',group:group?.dataset?.settingsGroup||''};}''')
    assert settings['select'] and settings['value']=='default' and 'Recommendation background' in settings['text'] and settings['group']=='Interface',settings

    # Enable cover mode and render Dashboard.
    page.evaluate("App.v292SetRecommendationBackground('cover')")
    page.evaluate("App.setView('dashboard')");page.wait_for_timeout(250)
    desktop=page.evaluate('''() => {const h=document.querySelector('.hero.mf292-recommendation-cover');const bg=h?.querySelector('.mf292-recommendation-bg');const art=h?.querySelector('.mf292-recommendation-art');const r=h?.getBoundingClientRect();return {hero:!!h,bg:!!bg,art:!!art,title:h?.dataset?.mf292Title||'',rect:r?[r.left,r.top,r.right,r.bottom]:null,background:bg?getComputedStyle(bg).backgroundImage:'none',overflow:h?getComputedStyle(h).overflow:''};}''')
    assert desktop['hero'] and desktop['bg'] and desktop['art'] and desktop['title']=='Cover Background Test',desktop
    assert desktop['background']!='none' and desktop['rect'][0]>=0 and desktop['rect'][2]<=1441,desktop
    page.screenshot(path=str(ROOT/'v292-cover-background-preview.png'),full_page=False)

    # Audit confirms this is a visual preference only.
    enabled_audit=page.evaluate('App.v292AuditState()')
    assert enabled_audit['recommendationBackground']=='cover' and enabled_audit['coverBackgroundAvailable'] and enabled_audit['recommendationLogicChanged'] is False and enabled_audit['loggingLogicChanged'] is False,enabled_audit

    # Tight mobile stays contained.
    page.set_viewport_size({'width':360,'height':760});page.wait_for_timeout(180)
    mobile=page.evaluate('''() => {const h=document.querySelector('.hero.mf292-recommendation-cover');const r=h?.getBoundingClientRect();return {hero:!!h,rect:r?[r.left,r.top,r.right,r.bottom]:null,bodyWidth:document.documentElement.scrollWidth,viewport:innerWidth};}''')
    assert mobile['hero'] and mobile['rect'][0]>=0 and mobile['rect'][2]<=361 and mobile['bodyWidth']<=361,mobile

    print(json.dumps({'audit':audit,'settings':settings,'desktop':desktop,'enabledAudit':enabled_audit,'mobile':mobile},indent=2))
    print('RESPONSIVE V292 OK')
    b.close()
