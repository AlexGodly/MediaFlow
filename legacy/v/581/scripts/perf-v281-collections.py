#!/usr/bin/env python3
from pathlib import Path
import json,re,shutil,sys,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
index=(ROOT/'index.html').read_text(encoding='utf-8')
css='\n'.join((ROOT/p).read_text(encoding='utf-8') for p in re.findall(r'<link rel="stylesheet" href="([^"]+\.css)"',index) if (ROOT/p).exists())
bundle=(ROOT/'assets/js/mediaflow-v281.bundle.js').read_text(encoding='utf-8')
cats=[{'id':'anime','name':'Anime','icon':'🎬','type':'video','unit':'episodes','target':4,'weight':4,'minutesPerUnit':24,'color':'#5AA9E6','enabled':True},{'id':'tv','name':'TV','icon':'📺','type':'video','unit':'episodes','target':2,'weight':3,'minutesPerUnit':45,'color':'#3FC7A6','enabled':True}]
lib=[]
for i in range(30000):
 c=cats[i%2];lib.append({'id':f'i{i}','title':f'Title {i:05d}','categoryId':c['id'],'progress':i%24,'total':24,'status':['active','completed','planned'][i%3],'priority':['high','medium','low'][i%3],'coverUrl':f'https://example.invalid/{i}.jpg' if i%7 else '','year':1990+i%36,'rating':(i%10)+0.2,'runtimeMinutes':20+i%100,'seasonCount':i%10,'modifiedAt':i})
base=1791302400000
ids=[f'i{i*3}' for i in range(5000)]
state={'categories':cats,'categoryOrder':['anime','tv'],'library':lib,'sessions':[],'collections':[{'id':'huge','title':'Huge Collection','description':'5,000-title stress collection','coverUrl':'','titleIds':ids,'order':ids,'autoBackground':True,'createdAt':base,'updatedAt':base,'lastViewedAt':0}],'collectionTombstones':[],'settings':{'theme':'dark','autoUpdateCheck':False,'autoInstallUpdates':False,'backup':{'enabled':False,'interval':60,'mode':'single','folderName':'','fileName':'mediaflow-backup.json'},'leveling':{'enabled':True,'minuteXP':1,'unitXP':{},'rotationMultiplier':{},'libraryAdditionXP':25,'completionXP':50}},'activityLog':[],'currentTask':None,'sessionActive':False,'orderPlan':{},'xpLedger':{'libraryAdditions':{}},'completionTimeline':[]}
setup=f'''() => {{const store={{}};const fake={{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k],clear(){{}},key:i=>Object.keys(store)[i]||null,get length(){{return Object.keys(store).length}}}};Object.defineProperty(window,'localStorage',{{value:fake}});Object.defineProperty(window,'sessionStorage',{{value:fake}});const user={{id:'perf280',email:'p@x.test',created_at:new Date().toISOString(),user_metadata:{{}}}};let cloud={json.dumps(state,separators=(',',':'))};const q={{select(){{return q}},eq(){{return q}},maybeSingle:async()=>({{data:{{state_data:cloud,updated_at:new Date().toISOString()}},error:null}}),upsert:async(row)=>{{cloud=row.state_data;return {{error:null}}}},delete(){{return q}}}};window.supabase={{createClient:()=>({{auth:{{getSession:async()=>({{data:{{session:{{user}}}}}}),onAuthStateChange:()=>({{data:{{subscription:{{unsubscribe(){{}}}}}}}})}},from:()=>q}})}};window.confirm=()=>true;window.alert=()=>{{}};window.prompt=()=>null;}}'''
chromium=shutil.which('chromium') or shutil.which('google-chrome')
errors=[]
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':900});page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content('<!doctype html><html><body><div id="app"></div></body></html>');page.add_style_tag(content=css);page.evaluate(setup)
 t0=time.perf_counter();page.add_script_tag(content=bundle);page.wait_for_timeout(1800);startup=(time.perf_counter()-t0)*1000
 nav=page.evaluate("()=>{const a=performance.now();App.setView('collections');return performance.now()-a}");page.wait_for_timeout(60)
 op=page.evaluate("()=>{const a=performance.now();App.v274OpenCollection('huge');return performance.now()-a}");page.wait_for_timeout(80)
 edit=page.evaluate("()=>{const a=performance.now();App.v274EditCollection('huge');return performance.now()-a}");page.wait_for_timeout(20);page.evaluate("App.v274CloseOverlay('mf274-collection-editor')")
 addopen=page.evaluate("()=>{const a=performance.now();App.v274OpenAddTitles('huge');return performance.now()-a}");page.wait_for_timeout(80)
 search_sync=page.evaluate("()=>{const e=document.querySelector('#mf276-add-search');e.value='Title 299';const a=performance.now();App.v276AddSearchInput(e.value,e);return performance.now()-a}");page.wait_for_timeout(180)
 results=page.evaluate("()=>({rows:document.querySelectorAll('#mf276-add-results .mf274-add-row').length,scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth,audit:App.v281AuditState()})")
 b.close()
print(json.dumps({'startup_ms':round(startup,1),'collections_nav_ms':round(nav,1),'open_collection_sync_ms':round(op,1),'edit_collection_sync_ms':round(edit,1),'add_titles_open_sync_ms':round(addopen,1),'search_handler_sync_ms':round(search_sync,1),'results':results,'errors':errors},indent=2))
if errors or nav>1200 or op>1200 or edit>150 or addopen>1200 or search_sync>20 or results['scroll']>results['client']+2 or results['audit']['version']!=281:
 print('PERF V281 COLLECTIONS FAILED');sys.exit(1)
print('PERF V281 COLLECTIONS OK')
