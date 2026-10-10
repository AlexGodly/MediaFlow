#!/usr/bin/env python3
from pathlib import Path
import json,re,shutil,sys
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
index=(ROOT/'index.html').read_text(encoding='utf-8')
css='\n'.join((ROOT/p).read_text(encoding='utf-8') for p in re.findall(r'<link rel="stylesheet" href="([^"]+\.css)"',index) if (ROOT/p).exists())
bundle=(ROOT/'assets/js/mediaflow-v284.bundle.js').read_text(encoding='utf-8')
cats=[{'id':'anime','name':'Anime','icon':'🎬','type':'video','unit':'episodes','target':4,'weight':4,'minutesPerUnit':24,'color':'#d746ff','enabled':True}]
lib=[]
for i in range(10):
    lib.append({'id':f'i{i}','title':f'Title {i}','categoryId':'anime','progress':12 if i<3 else 1,'total':12,'status':'completed' if i<3 else 'active','priority':'medium','coverUrl':'','rating':8.2})
state={
 'categories':cats,'categoryOrder':['anime'],'library':lib,'sessions':[],
 'collections':[{'id':'c1','title':'test','description':'No description yet.','coverUrl':'','titleIds':[f'i{i}' for i in range(10)],'order':[f'i{i}' for i in range(10)],'autoBackground':True,'createdAt':1,'updatedAt':1,'lastViewedAt':0}],
 'collectionTombstones':[],
 'settings':{'theme':'light','v274Collections':{'browserView':'compact','detailView':'cards','pageSize':50,'toolsVisible':True},'sidebarCollapsed':False},
 'navLayout':{'version':1,'order':['dashboard','library','collections','order','oldsystem','history','batch','stats','profile','settings','about'],'hiddenIds':[],'modifiedAt':0},
 'activityLog':[],'currentTask':None,'sessionActive':False,'orderPlan':{},'xpLedger':{'libraryAdditions':{}},'completionTimeline':[]
}
setup=f'''() => {{ const store={{}};const fake={{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k],clear(){{}},key:i=>Object.keys(store)[i]||null,get length(){{return Object.keys(store).length}}}};Object.defineProperty(window,'localStorage',{{value:fake}});Object.defineProperty(window,'sessionStorage',{{value:fake}});const user={{id:'v284',email:'alex@example.test',created_at:new Date().toISOString(),user_metadata:{{display_name:'Alex'}}}};let cloud={json.dumps(state,separators=(',',':'))};const q={{select(){{return q}},eq(){{return q}},maybeSingle:async()=>({{data:{{state_data:cloud,updated_at:new Date().toISOString()}},error:null}}),upsert:async(row)=>{{cloud=row.state_data;return {{error:null}}}},delete(){{return q}}}};window.supabase={{createClient:()=>({{auth:{{getSession:async()=>({{data:{{session:{{user}}}}}}),onAuthStateChange:()=>({{data:{{subscription:{{unsubscribe(){{}}}}}}}})}},from:()=>q}})}};window.confirm=()=>true;window.alert=()=>{{}};window.prompt=()=>null; }}'''
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
errors=[]
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
    page=b.new_page(viewport={'width':1440,'height':900})
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content('<!doctype html><html><body><div id="app"></div></body></html>')
    page.add_style_tag(content=css);page.evaluate(setup);page.add_script_tag(content=bundle);page.wait_for_timeout(1200)
    cloud_badges=page.locator('.sidebar-foot .cloud-badge').count()
    username=page.locator('.sidebar-foot .account-menu-email').first.inner_text().strip()
    page.evaluate("App.setView('collections');App.v274SetBrowserView('compact')");page.wait_for_timeout(120)
    geom=page.evaluate("()=>{const track=document.querySelector('.mf279-open-surface[data-mode=\"compact\"] .mf280-browser-compact-progress-track');const fill=track?.querySelector('span');if(!track||!fill)return null;const a=track.getBoundingClientRect(),b=fill.getBoundingClientRect();return {trackTop:a.top,fillTop:b.top,trackLeft:a.left,fillLeft:b.left,trackH:a.height,fillH:b.height,trackW:a.width,fillW:b.width,position:getComputedStyle(fill).position};}")
    audit=page.evaluate('()=>App.v284AuditState()')
    b.close()
res={'errors':errors,'cloudBadges':cloud_badges,'username':username,'progressGeometry':geom,'audit':audit}
print(json.dumps(res,indent=2))
ok=(not errors and cloud_badges==0 and username and geom and abs(geom['trackTop']-geom['fillTop'])<0.6 and abs(geom['trackLeft']-geom['fillLeft'])<0.6 and abs(geom['trackH']-geom['fillH'])<0.6 and 0 < geom['fillW'] <= geom['trackW'] and geom['position']=='absolute' and audit['version']==284 and audit['sidebarCloudBadgeRemoved'])
if not ok: sys.exit(1)
print('SMOKE V284 OK')
