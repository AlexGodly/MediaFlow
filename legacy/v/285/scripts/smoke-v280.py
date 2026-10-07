#!/usr/bin/env python3
from pathlib import Path
import json,re,shutil,sys
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
index=(ROOT/'index.html').read_text(encoding='utf-8')
css='\n'.join((ROOT/p).read_text(encoding='utf-8') for p in re.findall(r'<link rel="stylesheet" href="([^"]+\.css)"',index) if (ROOT/p).exists())
bundle=(ROOT/'assets/js/mediaflow-v280.bundle.js').read_text(encoding='utf-8')
cats=[
 {'id':'anime','name':'Anime','icon':'🎬','type':'video','unit':'episodes','target':4,'weight':4,'minutesPerUnit':24,'color':'#d746ff','enabled':True},
 {'id':'tv','name':'TV','icon':'📺','type':'video','unit':'episodes','target':2,'weight':3,'minutesPerUnit':45,'color':'#39c98a','enabled':True},
]
lib=[]
for i in range(80):
 c=cats[i%2]
 lib.append({'id':f'i{i}','title':f'Title {i:03d}','categoryId':c['id'],'progress':(i%20)+1,'total':24,'status':['active','planned','completed'][i%3],'priority':['high','medium','low'][i%3],'coverUrl':f'https://example.invalid/{i}.jpg' if i%4 else '','year':2000+i%20,'rating':[0,7.4,8.2,10][i%4],'source':'manual'})
base=1791302400000
ids=[f'i{i}' for i in range(48)]
state={'categories':cats,'categoryOrder':['anime','tv'],'library':lib,'sessions':[],'collections':[{'id':'c1','title':'Collection A','description':'Collection v280 visual regression.','coverUrl':'','titleIds':ids,'order':ids,'backgroundMode':'custom','backgroundUrl':'https://example.invalid/background.jpg','autoBackground':False,'createdAt':base-10000,'updatedAt':base,'lastViewedAt':0}],'collectionTombstones':[],'settings':{'theme':'light','v238DeviceLayout':'desktop','autoUpdateCheck':False,'autoInstallUpdates':False,'v274Collections':{'detailView':'covers','browserView':'compact','pageSize':50,'toolsVisible':True},'v254CoverOverlays':{'status':True,'category':True,'rating':True,'progress':True},'backup':{'enabled':False,'interval':60,'mode':'single','folderName':'','fileName':'mediaflow-backup.json'},'leveling':{'enabled':True,'minuteXP':1,'unitXP':{},'rotationMultiplier':{},'libraryAdditionXP':25,'completionXP':50}},'activityLog':[],'currentTask':None,'sessionActive':False,'orderPlan':{},'xpLedger':{'libraryAdditions':{}},'completionTimeline':[]}
setup=f'''() => {{
 const store={{}};const fake={{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k],clear(){{}},key:i=>Object.keys(store)[i]||null,get length(){{return Object.keys(store).length}}}};Object.defineProperty(window,'localStorage',{{value:fake}});Object.defineProperty(window,'sessionStorage',{{value:fake}});
 const user={{id:'v280-smoke',email:'p@x.test',created_at:new Date().toISOString(),user_metadata:{{}}}};let cloud={json.dumps(state,separators=(',',':'))};
 const q={{select(){{return q}},eq(){{return q}},maybeSingle:async()=>({{data:{{state_data:cloud,updated_at:new Date().toISOString()}},error:null}}),upsert:async(row)=>{{cloud=row.state_data;return {{error:null}}}},delete(){{return q}}}};
 window.supabase={{createClient:()=>({{auth:{{getSession:async()=>({{data:{{session:{{user}}}}}}),onAuthStateChange:()=>({{data:{{subscription:{{unsubscribe(){{}}}}}}}})}},from:()=>q}})}};window.confirm=()=>true;window.alert=()=>{{}};window.prompt=()=>null;
}}'''
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
if not chromium: print('Chromium not found');sys.exit(1)
errors=[]
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':900});page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content('<!doctype html><html><body><div id="app"></div></body></html>');page.add_style_tag(content=css);page.evaluate(setup);page.add_script_tag(content=bundle);page.wait_for_timeout(1500)
 page.evaluate("App.setView('collections')");page.wait_for_timeout(80)
 # Compact browser has v280 compact progress and no old compact progress block.
 compact=page.evaluate("()=>({newProgress:document.querySelectorAll('.mf280-browser-compact-progress').length,oldCompact:document.querySelectorAll('.mf274-browser-compact .mf279-collection-progress').length})")
 page.evaluate("App.v274OpenCollection('c1')");page.wait_for_timeout(100)
 detail=page.evaluate("()=>({tiles:document.querySelectorAll('.mf280-collection-tile').length,frames:document.querySelectorAll('.mf280-cover-frame').length,externalProgress:document.querySelectorAll('.mf274-collection-detail .mf279-title-progress').length,coverProgress:document.querySelectorAll('.mf280-cover-frame .v254-cover-progress').length,ratings:document.querySelectorAll('.mf280-cover-frame .v254-cover-rating').length,metaRatings:[...document.querySelectorAll('.mf274-collection-detail .mf274-title-meta')].some(x=>x.textContent.includes('★')),heroBg:document.querySelectorAll('.mf279-hero-bg-panel').length})")
 # Manual one-by-one selection must enable Remove selected after the render.
 cb=page.locator('.mf274-collection-tile .mf274-select-title input').first
 cb.check();page.wait_for_timeout(80)
 selection=page.evaluate("()=>({selected:App.v280AuditState().selected,removeDisabled:document.querySelector('.mf274-collection-batchbar .btn-danger')?.disabled ?? true,count:[...document.querySelectorAll('.mf274-collection-batchbar b')].map(x=>x.textContent).find(x=>x.includes('selected'))||''})")
 # Compact detail still has attached cover progress and no detached progress block.
 page.evaluate("App.v274SetDetailView('compact')");page.wait_for_timeout(80)
 compactDetail=page.evaluate("()=>({rows:document.querySelectorAll('.mf280-collection-compact').length,coverProgress:document.querySelectorAll('.mf280-collection-compact .mf280-cover-frame .v254-cover-progress').length,detached:document.querySelectorAll('.mf280-collection-compact .mf279-title-progress').length})")
 # Hero visibility CSS should be materially less opaque than v279's washed-out state.
 hero=page.evaluate("()=>{const panel=document.querySelector('.mf279-hero-bg-panel'),overlay=document.querySelector('.mf279-hero-overlay'),copy=document.querySelector('.mf279-hero-copy');return {panelOpacity:panel?getComputedStyle(panel).opacity:'',overlay:getComputedStyle(overlay).backgroundImage,copyBg:getComputedStyle(copy).backgroundColor,audit:App.v280AuditState()}}")
 b.close()
res={'compact':compact,'detail':detail,'selection':selection,'compactDetail':compactDetail,'hero':hero,'errors':errors}
print(json.dumps(res,indent=2))
checks=[
 not errors,
 compact['newProgress']>=1 and compact['oldCompact']==0,
 detail['tiles']>0 and detail['frames']>=detail['tiles'] and detail['externalProgress']==0 and detail['coverProgress']>0 and detail['ratings']>0 and not detail['metaRatings'] and detail['heroBg']>=1,
 selection['selected']==1 and selection['removeDisabled'] is False and '1 selected' in selection['count'],
 compactDetail['rows']>0 and compactDetail['coverProgress']>0 and compactDetail['detached']==0,
 hero['audit']['version']==280 and hero['audit']['collectionCoverProgress'] and hero['audit']['collectionRatingOnCover'] and float(hero['panelOpacity'] or 0)>=0.75
]
if not all(checks): print('SMOKE V280 FAILED',checks);sys.exit(1)
print('SMOKE V280 OK')
