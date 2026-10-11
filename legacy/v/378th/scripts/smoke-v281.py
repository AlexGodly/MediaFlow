#!/usr/bin/env python3
from pathlib import Path
import json,re,shutil,sys
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
index=(ROOT/'index.html').read_text(encoding='utf-8')
css='\n'.join((ROOT/p).read_text(encoding='utf-8') for p in re.findall(r'<link rel="stylesheet" href="([^"]+\.css)"',index) if (ROOT/p).exists())
bundle=(ROOT/'assets/js/mediaflow-v281.bundle.js').read_text(encoding='utf-8')
cats=[
 {'id':'anime','name':'Anime','icon':'🎬','type':'video','unit':'episodes','target':4,'weight':4,'minutesPerUnit':24,'color':'#d746ff','enabled':True},
 {'id':'tv','name':'TV','icon':'📺','type':'video','unit':'episodes','target':2,'weight':3,'minutesPerUnit':45,'color':'#39c98a','enabled':True},
]
lib=[]
for i in range(220):
 c=cats[i%2]
 lib.append({'id':f'i{i}','title':f'Alpha Title {i:03d}','categoryId':c['id'],'progress':(i%20)+1,'total':24,'status':['active','planned','completed'][i%3],'priority':['high','medium','low'][i%3],'coverUrl':f'https://example.invalid/{i}.jpg' if i%4 else '','year':2000+i%20,'rating':[0,7.4,8.2,10][i%4],'source':'manual'})
base=1791302400000
ids=[f'i{i}' for i in range(96)]
state={'categories':cats,'categoryOrder':['anime','tv'],'library':lib,'sessions':[],'collections':[{'id':'c1','title':'Collection A','description':'v281 regression collection.','coverUrl':'','titleIds':ids,'order':ids,'backgroundMode':'auto','backgroundUrl':'','autoBackground':True,'createdAt':base-10000,'updatedAt':base,'lastViewedAt':0}],'collectionTombstones':[],'settings':{'theme':'light','v238DeviceLayout':'desktop','autoUpdateCheck':False,'autoInstallUpdates':False,'v274Collections':{'detailView':'cards','browserView':'compact','pageSize':50,'toolsVisible':True,'collectionCoverSize':100,'collectionTitleTextSize':100,'pageState':{'browserSearch':'','browserSort':'updated','browserDir':'desc','detailFilters':{'search':'','categories':[],'status':'all','priority':'all','rating':'all','cover':'all','sort':'order','dir':'asc','yearMin':'','yearMax':'','runtimeMin':'','runtimeMax':'','seasonMin':'','seasonMax':'','episodeMin':'','episodeMax':'','limit':0,'moderator':'all'}}},'v254CoverOverlays':{'status':True,'category':True,'rating':True,'progress':True},'backup':{'enabled':False,'interval':60,'mode':'single','folderName':'','fileName':'mediaflow-backup.json'},'leveling':{'enabled':True,'minuteXP':1,'unitXP':{},'rotationMultiplier':{},'libraryAdditionXP':25,'completionXP':50}},'activityLog':[],'currentTask':None,'sessionActive':False,'orderPlan':{},'xpLedger':{'libraryAdditions':{}},'completionTimeline':[]}
setup=f'''() => {{
 const store={{}};const fake={{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k],clear(){{}},key:i=>Object.keys(store)[i]||null,get length(){{return Object.keys(store).length}}}};Object.defineProperty(window,'localStorage',{{value:fake}});Object.defineProperty(window,'sessionStorage',{{value:fake}});
 const user={{id:'v281-smoke',email:'p@x.test',created_at:new Date().toISOString(),user_metadata:{{}}}};let cloud={json.dumps(state,separators=(',',':'))};window.__getCloud=()=>cloud;
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
 # Main Collections Compact progress should be an integrated, useful-width stack.
 page.evaluate("App.setView('collections')");page.wait_for_timeout(80)
 compact=page.evaluate("()=>{const box=document.querySelector('.mf280-browser-compact-progress'),track=document.querySelector('.mf280-browser-compact-progress-track');const copy=document.querySelector('.mf280-browser-compact-progress-copy');return {boxW:box?.getBoundingClientRect().width||0,trackW:track?.getBoundingClientRect().width||0,grid:getComputedStyle(box).gridTemplateColumns,copyDisplay:getComputedStyle(copy).display}}")
 # Large cover setting in Collection Cards should change column capacity, not overflow/collapse text.
 page.evaluate("App.v274OpenCollection('c1')");page.wait_for_timeout(80);page.evaluate("App.v274SetDetailView('cards')");page.wait_for_timeout(60);page.evaluate("App.v276SetCollectionSize('cover',300)");page.wait_for_timeout(100)
 card=page.evaluate("()=>{const card=document.querySelector('.mf280-collection-title-card'),cover=card?.querySelector('.mf280-cover-frame'),copy=card?.querySelector('.mf274-title-copy');if(!card||!cover||!copy)return null;const a=card.getBoundingClientRect(),b=cover.getBoundingClientRect(),c=copy.getBoundingClientRect();return {cardW:a.width,coverW:b.width,copyW:c.width,coverInside:b.right<=a.right+1,copyInside:c.right<=a.right+1,docW:document.documentElement.scrollWidth,clientW:document.documentElement.clientWidth,cardCount:document.querySelectorAll('.mf280-collection-title-card').length}}")
 responsive_cards=[]
 for width in [1024,768,600,360]:
  page.set_viewport_size({'width':width,'height':820});page.wait_for_timeout(45)
  responsive_cards.append(page.evaluate("()=>{const card=document.querySelector('.mf280-collection-title-card'),cover=card?.querySelector('.mf280-cover-frame'),copy=card?.querySelector('.mf274-title-copy');if(!card||!cover||!copy)return null;const a=card.getBoundingClientRect(),b=cover.getBoundingClientRect(),c=copy.getBoundingClientRect();return {width:innerWidth,cardW:a.width,coverW:b.width,copyW:c.width,inside:b.right<=a.right+1&&c.right<=a.right+1,docW:document.documentElement.scrollWidth,clientW:document.documentElement.clientWidth}}"))
 page.set_viewport_size({'width':1440,'height':900});page.wait_for_timeout(45)
 # Collection page UI state must serialize through cloud snapshot/full backup/preset/export.
 page.evaluate("App.v274SetCollectionFilter('rating','8')");page.evaluate("App.v274SetCollectionFilter('status','active')");page.wait_for_timeout(30)
 sync=page.evaluate("()=>{const p=App.v281PersistenceProbe(),audit=App.v281AuditState();return {snap:p.snap?.settings?.v274Collections?.pageState,backup:p.backup?.settings?.v274Collections?.pageState,preset:p.preset?.settings?.v274Collections?.pageState,exportVersion:p.collectionsExport?.mediaflowCollectionsExportVersion,exportSettings:!!p.collectionsExport?.collectionSettings,audit}}")
 # Library search must remain focused across a full render, then accept more keys.
 page.evaluate("App.setView('library')");page.wait_for_timeout(100)
 search=page.locator('#view-root .mf264-library-search').first
 search.click();search.fill('Alpha');page.wait_for_timeout(30)
 page.evaluate("App.v274SetLibraryRatingFilter('rated')");page.wait_for_timeout(10)
 page.keyboard.type('Beta019',delay=10);page.wait_for_timeout(500)
 search_state=page.evaluate("()=>{const el=document.querySelector('#view-root .mf264-library-search');return {value:el?.value||'',active:document.activeElement===el,results:document.querySelectorAll('#view-root .item-row,#view-root [data-library-id]').length}}")
 b.close()
res={'compact':compact,'card':card,'responsiveCards':responsive_cards,'sync':sync,'librarySearch':search_state,'errors':errors}
print(json.dumps(res,indent=2))
required_systems=['syncNow','xpCalculation','fullDataExport','fullDataImport','settingsExport','settingsImport','consumptionHistoryExport','logsExport','personalOrderImport','personalOrderExport','collectionsExport','collectionsImport','automaticUpdate','automaticBackup']
systems=sync['audit'].get('systems',{})
checks=[
 not errors,
 compact['boxW']>160 and compact['trackW']>150 and compact['grid'].count(' ')==0,
 card is not None and card['coverInside'] and card['copyInside'] and card['copyW']>120 and card['docW']<=card['clientW']+2,
 all(x and x['inside'] and x['copyW']>70 and x['docW']<=x['clientW']+2 for x in responsive_cards),
 sync['snap'] and sync['snap']['detailFilters']['rating']=='8' and sync['snap']['detailFilters']['status']=='active',
 sync['backup'] and sync['backup']['detailFilters']['rating']=='8',
 sync['preset'] and sync['preset']['detailFilters']['rating']=='8',
 sync['exportVersion']==2 and sync['exportSettings'],
 sync['audit']['version']==281 and sync['audit']['collectionCloudData'] and sync['audit']['collectionCloudSettings'] and sync['audit']['collectionPageStateSynced'] and sync['audit']['collectionBackupData'] and sync['audit']['collectionBackupSettings'] and sync['audit']['collectionPresetSettings'],
 all(systems.get(k) for k in required_systems),
 search_state['value']=='AlphaBeta019' and search_state['active']
]
if not all(checks): print('SMOKE V281 FAILED',checks);sys.exit(1)
print('SMOKE V281 OK')
