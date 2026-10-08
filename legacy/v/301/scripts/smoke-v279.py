#!/usr/bin/env python3
from pathlib import Path
import json,re,shutil,sys,time,tempfile
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
index=(ROOT/'index.html').read_text(encoding='utf-8')
css='\n'.join((ROOT/p).read_text(encoding='utf-8') for p in re.findall(r'<link rel="stylesheet" href="([^"]+\.css)"',index) if (ROOT/p).exists())
bundle=(ROOT/'assets/js/mediaflow-v279.bundle.js').read_text(encoding='utf-8')
cats=[
 {'id':'anime','name':'Seasonal Anime','icon':'🎬','type':'video','unit':'episodes','target':4,'weight':4,'minutesPerUnit':24,'color':'#d746ff','enabled':True},
 {'id':'tv','name':'TV Series','icon':'📺','type':'video','unit':'episodes','target':2,'weight':3,'minutesPerUnit':45,'color':'#39c98a','enabled':True},
]
lib=[]
for i in range(160):
 c=cats[i%2]
 lib.append({'id':f'i{i}','title':f'Title {i:03d}','categoryId':c['id'],'progress':i%24,'total':24,'status':['active','planned','completed'][i%3],'priority':['high','medium','low'][i%3],'coverUrl':f'https://example.invalid/{i}.jpg' if i%4 else '','year':1990+i%30,'rating':[0,8.2,9.1,10][i%4],'source':'manual','runtimeMinutes':20+i%80,'seasonCount':i%6,'modifiedAt':i})
base=1791302400000
ids=[f'i{i}' for i in range(40)]
state={'categories':cats,'categoryOrder':['anime','tv'],'library':lib,'sessions':[],'collections':[{'id':'c1','title':'Franchise One','description':'A curated franchise collection with a readable description.','coverUrl':'','titleIds':ids,'order':ids,'autoBackground':True,'createdAt':base-10000,'updatedAt':base,'lastViewedAt':0}],'collectionTombstones':[],'settings':{'theme':'light','v238DeviceLayout':'desktop','autoUpdateCheck':False,'autoInstallUpdates':False,'backup':{'enabled':False,'interval':60,'mode':'single','folderName':'','fileName':'mediaflow-backup.json'},'leveling':{'enabled':True,'minuteXP':1,'unitXP':{},'rotationMultiplier':{},'libraryAdditionXP':25,'completionXP':50}},'activityLog':[],'currentTask':None,'sessionActive':False,'orderPlan':{},'xpLedger':{'libraryAdditions':{}},'completionTimeline':[]}
setup=f'''() => {{
 const store={{}};const fake={{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k],clear(){{}},key:i=>Object.keys(store)[i]||null,get length(){{return Object.keys(store).length}}}};Object.defineProperty(window,'localStorage',{{value:fake}});Object.defineProperty(window,'sessionStorage',{{value:fake}});
 const user={{id:'v279-smoke',email:'p@x.test',created_at:new Date().toISOString(),user_metadata:{{}}}};let cloud={json.dumps(state,separators=(',',':'))};
 const q={{select(){{return q}},eq(){{return q}},maybeSingle:async()=>({{data:{{state_data:cloud,updated_at:new Date().toISOString()}},error:null}}),upsert:async(row)=>{{cloud=row.state_data;return {{error:null}}}},delete(){{return q}}}};
 window.supabase={{createClient:()=>({{auth:{{getSession:async()=>({{data:{{session:{{user}}}}}}),onAuthStateChange:()=>({{data:{{subscription:{{unsubscribe(){{}}}}}}}})}},from:()=>q}})}};window.confirm=()=>true;window.alert=()=>{{}};window.prompt=()=>null;
}}'''
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
if not chromium: print('Chromium not found');sys.exit(1)
errors=[]
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':900});page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content('<!doctype html><html><head></head><body><div id="app"></div></body></html>');page.add_style_tag(content=css);page.evaluate(setup);page.add_script_tag(content=bundle);page.wait_for_timeout(1500)
 page.evaluate("App.setView('collections')");page.wait_for_timeout(100)
 browser=page.evaluate("()=>({createIcon:document.querySelector('.mf279-collections-head-actions [data-v225-icon=\"collectionAdd\"]')?.dataset.v225Icon||'',imports:!!document.querySelector('#mf279-collections-import-file'),progress:document.querySelectorAll('.mf279-collection-progress').length,showcase:document.querySelectorAll('.mf276-browser-showcase').length,clickable:document.querySelectorAll('.mf279-open-surface').length,openIcon:document.querySelector('[data-v225-icon=\"openCollection\"]')?.dataset.v225Icon||''})")
 # click whitespace in showcase
 page.locator('.mf279-open-surface').first.click(position={'x':500,'y':35});page.wait_for_timeout(80)
 detail=page.evaluate("()=>({detail:!!document.querySelector('.mf274-collection-detail'),hero:!!document.querySelector('.mf279-collection-hero'),bgPanels:document.querySelectorAll('.mf279-hero-bg-panel').length,heroProgress:!!document.querySelector('.mf279-hero-progress'),titleProgress:document.querySelectorAll('.mf279-title-progress').length,pageInput:document.querySelector('.mf279-page-size input')?.value||'',back:!!document.querySelector('.mf275-collection-back')})")
 # typed page size
 page.locator('.mf279-page-size input').fill('17');page.locator('.mf279-page-size input').press('Enter');page.wait_for_timeout(80)
 pagesize=page.evaluate("()=>({size:App.v279AuditState().collectionPageSize,cards:document.querySelectorAll('.mf274-collection-tile,.mf274-collection-list-row,.mf274-collection-title-card,.mf274-collection-compact').length})")
 # remove title should show designed confirm, cancel it
 page.locator('.mf274-remove-chip').first.click();page.wait_for_timeout(40)
 confirm=page.evaluate("()=>({visible:!!document.querySelector('#mf279-confirm'),browserConfirm:typeof window.confirm==='function'})")
 page.evaluate("App.v279ResolveConfirm(false)")
 # editor custom background controls and edit opening speed
 edit_ms=page.evaluate("()=>{const a=performance.now();App.v274EditCollection('c1');return performance.now()-a}");page.wait_for_timeout(40)
 editor=page.evaluate("()=>({editor:!!document.querySelector('.mf279-editor'),auto:!!document.querySelector('input[name=\"mf279-bg-mode\"][value=\"auto\"]'),custom:!!document.querySelector('input[name=\"mf279-bg-mode\"][value=\"custom\"]'),bgInput:!!document.querySelector('#mf279-col-background')})")
 page.locator('input[name="mf279-bg-mode"][value="custom"]').check();page.fill('#mf279-col-background','https://example.invalid/custom-bg.jpg');page.evaluate("App.v274SaveCollection('c1')");page.wait_for_timeout(80)
 saved=page.evaluate("()=>({mode:App.v279AuditState().backgroundMode,url:App.v279AuditState().backgroundUrl,audit:App.v279AuditState()})")
 # add titles search should debounce instead of doing heavy work synchronously
 page.evaluate("App.v274OpenAddTitles('c1')");page.wait_for_timeout(70)
 search_ms=page.evaluate("()=>{const el=document.querySelector('#mf276-add-search');const a=performance.now();App.v276AddSearchInput('Title 12',el);return performance.now()-a}");page.wait_for_timeout(140)
 search=page.evaluate("()=>({value:document.querySelector('#mf276-add-search')?.value||'',rows:document.querySelectorAll('#mf276-add-results .mf274-add-row').length})")
 b.close()
res={'browser':browser,'detail':detail,'pageSize':pagesize,'confirm':confirm,'editMs':edit_ms,'editor':editor,'saved':saved,'searchSyncMs':search_ms,'search':search,'errors':errors}
print(json.dumps(res,indent=2))
checks=[
 not errors,browser['createIcon']=='collectionAdd',browser['imports'],browser['progress']>0,browser['showcase']==1,browser['clickable']>=1,browser['openIcon']=='openCollection',
 detail['detail'] and detail['hero'] and detail['bgPanels']>=1 and detail['heroProgress'] and detail['titleProgress']>0 and detail['pageInput']=='50' and detail['back'],
 pagesize['size']==17 and 0<pagesize['cards']<=17,confirm['visible'],edit_ms<120,editor['editor'] and editor['auto'] and editor['custom'] and editor['bgInput'],
 saved['mode']=='custom' and saved['url'].endswith('custom-bg.jpg') and saved['audit']['version']==279 and saved['audit']['pwaRelease']==279,
 search_ms<20,search['rows']>=0
]
if not all(checks): print('SMOKE V279 FAILED',checks);sys.exit(1)
print('SMOKE V279 OK')
