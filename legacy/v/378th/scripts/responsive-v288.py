#!/usr/bin/env python3
from pathlib import Path
import json,re,shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
index=(ROOT/'index.html').read_text(encoding='utf-8')
css='\n'.join((ROOT/m.group(1)).read_text(encoding='utf-8') for m in re.finditer(r'<link rel="stylesheet" href="([^"]+\.css)">',index) if (ROOT/m.group(1)).exists())
bundle=(ROOT/'assets/js/mediaflow-v288.bundle.js').read_text(encoding='utf-8')
lib=[{'id':'d1','title':'Direct Movie','categoryId':'movies','status':'planned','priority':'medium','progress':0,'total':1}]
ids=[]
for i in range(1,25):
    tid=f'm{i}';ids.append(tid);lib.append({'id':tid,'title':f'Collection Movie With A Longer Title {i:02d}','categoryId':'movies','status':'planned','priority':'medium','progress':0,'total':1})
state={'categories':[{'id':'movies','name':'Movies','icon':'🎬','type':'video','unit':'movies','target':1,'weight':3,'minutesPerUnit':120,'color':'#7C5CFC','seasonal':False,'enabled':True,'custom':True}], 'categoryOrder':['movies'],'library':lib,'collections':[{'id':'c1','title':'A Large Assigned Collection With A Long Name','description':'Responsive queue details','titleIds':ids,'order':ids,'createdAt':1,'updatedAt':1,'lastViewedAt':0,'autoBackground':True,'coverUrl':''}],'collectionTombstones':[],'sessions':[],'settings':{'categoryOrder':['movies'],'prioritizePersonalOrder':True,'exactTitleRecommendations':True},'orderPlan':{'titleIds':['d1'],'viewMode':'category','categoryMode':'default','categoryOrder':['movies'],'hiddenCategories':[],'modifiedAt':1},'currentTask':{'id':'task','categoryId':'movies','low':1,'high':1,'targetMid':1,'unit':'movies','createdAt':1,'reasons':['test']},'sessionActive':True,'profilePicture':'','activityLog':[],'migrations':{},'savedAt':1}
def setup(st):
    return f'''() => {{const store={{}};const fake={{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k],clear(){{}},key:i=>Object.keys(store)[i]||null,get length(){{return Object.keys(store).length}}}};Object.defineProperty(window,'localStorage',{{configurable:true,value:fake}});Object.defineProperty(window,'sessionStorage',{{configurable:true,value:fake}});const user={{id:'u',email:'a@b.test',created_at:new Date().toISOString(),user_metadata:{{display_name:'Alex'}}}};let cloud={json.dumps(st,separators=(',',':'))};const q={{select(){{return q}},eq(){{return q}},maybeSingle:async()=>({{data:{{state_data:cloud,updated_at:new Date().toISOString()}},error:null}}),upsert:async row=>{{cloud=row.state_data;return {{error:null}}}},delete(){{return q}}}};window.supabase={{createClient:()=>({{auth:{{getSession:()=>new Promise(r=>setTimeout(()=>r({{data:{{session:{{user}}}}}}),50)),onAuthStateChange:()=>({{data:{{subscription:{{unsubscribe(){{}}}}}}}}),getUser:async()=>({{data:{{user}},error:null}})}},from:()=>q}})}};window.confirm=()=>true;window.alert=()=>{{}};}}'''
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
with sync_playwright() as p:
  b=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
  results=[]
  for width,name in [(1440,'desktop'),(900,'tablet'),(600,'mobile'),(360,'tight')]:
    page=b.new_page(viewport={'width':width,'height':1000});errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
    page.set_content(f'<!doctype html><html><head><style>{css}</style></head><body><div id="app"></div></body></html>')
    page.evaluate(setup(state));page.add_script_tag(content=bundle);page.wait_for_timeout(1000);page.evaluate("App.setView('order')");page.wait_for_timeout(120);page.evaluate("App.v287AddCollectionAssignment('c1','movies')");page.wait_for_timeout(180);aid=page.locator('[data-assignment-id]').first.get_attribute('data-assignment-id');page.evaluate(f"App.v288ToggleAssignmentTitles('{aid}')");page.evaluate("App.v288SetQueueView('showCollectionsInRegularQueues',true)");page.wait_for_timeout(250)
    metric=page.evaluate("""() => ({iw:innerWidth, body:document.body.scrollWidth, doc:document.documentElement.scrollWidth, main:document.querySelector('.v138-order-main')?.scrollWidth||0, client:document.querySelector('.v138-order-main')?.clientWidth||0})""")
    if errs: raise AssertionError(errs)
    if metric['doc']>metric['iw']+2 or metric['body']>metric['iw']+2: raise AssertionError((width,metric))
    page.screenshot(path=str(ROOT/f'v288-order-{name}.png'),full_page=True)
    results.append((width,metric));page.close()
  b.close()
print(json.dumps(results,indent=2));print('RESPONSIVE V288 OK')
