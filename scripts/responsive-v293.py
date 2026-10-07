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
bundle=(ROOT/'assets/js/mediaflow-v293.bundle.js').read_text(encoding='utf-8')
# More detailed pseudo-cover than v292's test so contrast/art visibility can be measured.
svg='''<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ff822f"/><stop offset=".35" stop-color="#8f2e24"/><stop offset=".72" stop-color="#2b183c"/><stop offset="1" stop-color="#10152f"/></linearGradient></defs><rect width="800" height="1200" fill="url(#g)"/><circle cx="540" cy="320" r="240" fill="#ffd36a" opacity=".72"/><path d="M80 900 C220 530 430 650 760 370 L760 1200 L80 1200Z" fill="#ff3f26" opacity=".62"/><circle cx="240" cy="650" r="210" fill="#171128" opacity=".62"/><text x="60" y="1090" fill="white" font-family="sans-serif" font-size="64" font-weight="800">CINEMATIC COVER</text></svg>'''
cover='data:image/svg+xml;base64,'+base64.b64encode(svg.encode()).decode()
cat={'id':'seasonal','name':'Seasonal Anime','icon':'🌸','iconUrl':'','type':'video','unit':'episodes','target':3,'weight':1,'minutesPerUnit':30,'color':'#ff6b7d','seasonal':True,'enabled':True,'custom':False}
item={'id':'t1','title':'Cinematic Cover Test','categoryId':'seasonal','status':'active','priority':'medium','progress':2,'total':12,'rating':8,'coverUrl':cover,'tags':[]}
state={'categories':[cat],'categoryOrder':['seasonal'],'library':[item],'collections':[],'collectionTombstones':[],'sessions':[],'settings':{'categoryOrder':['seasonal'],'exactTitleRecommendations':True,'v292RecommendationBackground':'cover'},'orderPlan':{'titleIds':[],'viewMode':'category','categoryMode':'default','categoryOrder':['seasonal'],'hiddenCategories':[],'modifiedAt':1},'currentTask':{'categoryId':'seasonal','libraryId':'t1','title':'Cinematic Cover Test','low':7,'high':9,'unit':'episodes','reasons':['Fresh episodes available','Seasonal priority']},'sessionActive':True,'profilePicture':'','activityLog':[],'migrations':{},'savedAt':1}
def setup(st):
    return f'''() => {{const store={{}};const fake={{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k],clear(){{}},key:i=>Object.keys(store)[i]||null,get length(){{return Object.keys(store).length}}}};Object.defineProperty(window,'localStorage',{{configurable:true,value:fake}});Object.defineProperty(window,'sessionStorage',{{configurable:true,value:fake}});const user={{id:'u',email:'a@b.test',created_at:new Date().toISOString(),user_metadata:{{display_name:'Alex'}}}};let cloud={json.dumps(st,separators=(',',':'))};const mk=()=>{{const q={{select(){{return q}},eq(){{return q}},maybeSingle:async()=>({{data:{{state_data:cloud,updated_at:new Date().toISOString()}},error:null}}),upsert:async row=>{{cloud=row.state_data;return {{error:null}}}},delete(){{return q}}}};return q}};window.supabase={{createClient:()=>({{auth:{{getSession:()=>new Promise(r=>setTimeout(()=>r({{data:{{session:{{user}}}}}}),40)),onAuthStateChange:()=>({{data:{{subscription:{{unsubscribe(){{}}}}}}}}),getUser:async()=>({{data:{{user}},error:null}})}},from:mk}})}};window.confirm=()=>true;window.alert=()=>{{}};window.prompt=()=>null;}}'''
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
if not chromium:
    print('CHROMIUM UNAVAILABLE');sys.exit(2)
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
    page=b.new_page(viewport={'width':1600,'height':900})
    page.set_content(f'<!doctype html><html><head><style>{css}</style></head><body><div id="app"></div></body></html>')
    page.evaluate(setup(state));page.add_script_tag(content=bundle);page.wait_for_timeout(1250)
    page.evaluate("App.setView('dashboard')");page.wait_for_timeout(260)
    desktop=page.evaluate('''() => {const h=document.querySelector('.hero.mf293-cinematic-cover');const bg=h?.querySelector('.mf292-recommendation-bg');const art=h?.querySelector('.mf292-recommendation-art');const feature=h?.querySelector('.v50-title-feature');const r=h?.getBoundingClientRect();const bs=bg?getComputedStyle(bg):null;const as=art?getComputedStyle(art):null;const fs=feature?getComputedStyle(feature):null;return {hero:!!h,rect:r?[r.left,r.top,r.right,r.bottom]:null,bgOpacity:bs?.opacity,bgFilter:bs?.filter,artOpacity:as?.opacity,featureBackground:fs?.backgroundColor,bodyWidth:document.documentElement.scrollWidth,viewport:innerWidth};}''')
    assert desktop['hero'],desktop
    assert float(desktop['bgOpacity'])>=.95,desktop
    assert float(desktop['artOpacity'])>=.70,desktop
    assert desktop['rect'][0]>=0 and desktop['rect'][2]<=1601 and desktop['bodyWidth']<=1601,desktop
    audit=page.evaluate('App.v293AuditState()')
    assert audit['version']==293 and audit['cinematicCoverMode'] and audit['recommendationLogicChanged'] is False and audit['loggingLogicChanged'] is False,audit
    page.screenshot(path=str(ROOT/'v293-cinematic-cover-preview.png'),full_page=False)
    page.set_viewport_size({'width':360,'height':760});page.wait_for_timeout(220)
    mobile=page.evaluate('''() => {const h=document.querySelector('.hero.mf293-cinematic-cover');const r=h?.getBoundingClientRect();const art=h?.querySelector('.mf292-recommendation-art');return {hero:!!h,rect:r?[r.left,r.top,r.right,r.bottom]:null,artOpacity:art?getComputedStyle(art).opacity:'0',bodyWidth:document.documentElement.scrollWidth,viewport:innerWidth};}''')
    assert mobile['hero'] and mobile['rect'][0]>=0 and mobile['rect'][2]<=361 and mobile['bodyWidth']<=361,mobile
    assert float(mobile['artOpacity'])>=.45,mobile
    print(json.dumps({'desktop':desktop,'audit':audit,'mobile':mobile},indent=2))
    print('RESPONSIVE V293 OK')
    b.close()
