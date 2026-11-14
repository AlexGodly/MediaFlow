#!/usr/bin/env python3
from pathlib import Path
import json,re,shutil,sys,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
index=(ROOT/'index.html').read_text(encoding='utf-8')
css='\n'.join((ROOT/p).read_text(encoding='utf-8') for p in re.findall(r'<link rel="stylesheet" href="([^"]+\.css)"',index) if (ROOT/p).exists())
bundle=(ROOT/'assets/js/mediaflow-v276.bundle.js').read_text(encoding='utf-8')
cats=[{'id':'anime','name':'Anime','icon':'🎬','type':'video','unit':'episodes','target':4,'weight':4,'minutesPerUnit':24,'color':'#5AA9E6','enabled':True},{'id':'tv','name':'TV','icon':'📺','type':'video','unit':'episodes','target':2,'weight':3,'minutesPerUnit':45,'color':'#3FC7A6','enabled':True}]
lib=[]
for i in range(30000):
 c=cats[i%2];lib.append({'id':f'i{i}','title':f'Title {i:05d}','categoryId':c['id'],'progress':i%24,'total':24,'status':['active','completed','planned'][i%3],'priority':['high','medium','low'][i%3],'coverUrl':'','year':1990+i%36,'rating':(i%10)+1,'runtimeMinutes':20+i%100,'seasonCount':i%10,'modifiedAt':i})
base=1791302400000
ids=[f'i{i*3}' for i in range(5000)]
state={'categories':cats,'categoryOrder':['anime','tv'],'library':lib,'sessions':[],'collections':[{'id':'huge','title':'Huge Collection','description':'5,000-title stress collection','coverUrl':'','titleIds':ids,'order':ids,'autoBackground':False,'createdAt':base,'updatedAt':base,'lastViewedAt':0}],'collectionTombstones':[],'settings':{'theme':'dark','autoUpdateCheck':False,'autoInstallUpdates':False,'backup':{'enabled':False,'interval':60,'mode':'single','folderName':'','fileName':'mediaflow-backup.json'},'leveling':{'enabled':True,'minuteXP':1,'unitXP':{},'rotationMultiplier':{},'libraryAdditionXP':25,'completionXP':50}},'activityLog':[],'currentTask':None,'sessionActive':False,'orderPlan':{},'xpLedger':{'libraryAdditions':{}},'completionTimeline':[]}
setup=f'''() => {{const store={{}};const fake={{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k],clear(){{}},key:i=>Object.keys(store)[i]||null,get length(){{return Object.keys(store).length}}}};Object.defineProperty(window,'localStorage',{{value:fake}});Object.defineProperty(window,'sessionStorage',{{value:fake}});const user={{id:'perf276',email:'p@x.test',created_at:new Date().toISOString(),user_metadata:{{}}}};let cloud={json.dumps(state,separators=(',',':'))};const q={{select(){{return q}},eq(){{return q}},maybeSingle:async()=>({{data:{{state_data:cloud,updated_at:new Date().toISOString()}},error:null}}),upsert:async(row)=>{{cloud=row.state_data;return {{error:null}}}},delete(){{return q}}}};window.supabase={{createClient:()=>({{auth:{{getSession:async()=>({{data:{{session:{{user}}}}}}),onAuthStateChange:()=>({{data:{{subscription:{{unsubscribe(){{}}}}}}}})}},from:()=>q}})}};window.confirm=()=>true;window.alert=()=>{{}};window.prompt=()=>null;}}'''
chromium=shutil.which('chromium') or shutil.which('google-chrome')
errors=[]
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':900});page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content('<!doctype html><html><body><div id="app"></div></body></html>');page.add_style_tag(content=css);page.evaluate(setup)
 t0=time.perf_counter();page.add_script_tag(content=bundle);page.wait_for_timeout(1800);startup=(time.perf_counter()-t0)*1000
 nav=page.evaluate("()=>{const a=performance.now();App.setView('collections');return performance.now()-a}");page.wait_for_timeout(80)
 op=page.evaluate("()=>{const a=performance.now();App.v274OpenCollection('huge');return performance.now()-a}");page.wait_for_timeout(120)
 result=page.evaluate("()=>({cards:document.querySelectorAll('.mf274-collection-tile,.mf274-collection-list-row,.mf274-collection-title-card,.mf274-collection-compact').length,pager:document.querySelector('.mf274-collection-pager')?.textContent?.trim()||'',matching:App.v274TestCollectionVisibleCount('huge'),scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth})")
 filt=page.evaluate("()=>{const a=performance.now();App.v274SetCollectionFilter('rating','8');return performance.now()-a}");page.wait_for_timeout(80)
 filtered=page.evaluate("()=>({cards:document.querySelectorAll('.mf274-collection-tile,.mf274-collection-list-row,.mf274-collection-title-card,.mf274-collection-compact').length,matching:App.v274TestCollectionVisibleCount('huge')})")
 b.close()
print(json.dumps({'startup_ms':round(startup,1),'collections_nav_ms':round(nav,1),'open_collection_sync_ms':round(op,1),'filter_sync_ms':round(filt,1),'result':result,'filtered':filtered,'errors':errors},indent=2))
if errors or nav>2500 or op>2500 or filt>2500 or result['cards']>50 or result['cards']<1 or result['matching']!=5000 or not result['pager'] or result['scrollWidth']>result['clientWidth']+2 or filtered['cards']>50 or filtered['matching']>=result['matching']:
 print('PERF V276 COLLECTIONS FAILED');sys.exit(1)
print('PERF V276 COLLECTIONS OK')
