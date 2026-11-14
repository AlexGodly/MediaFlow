#!/usr/bin/env python3
from pathlib import Path
import json,re,shutil,sys,time
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
index=(ROOT/'index.html').read_text(encoding='utf-8')
css='\n'.join((ROOT/p).read_text(encoding='utf-8') for p in re.findall(r'<link rel="stylesheet" href="([^"]+\.css)"',index) if (ROOT/p).exists())
bundle=(ROOT/'assets/js/mediaflow-v274.bundle.js').read_text(encoding='utf-8')

cats=[
 {'id':'anime','name':'Seasonal Anime','icon':'🎬','type':'video','unit':'episodes','target':4,'weight':4,'minutesPerUnit':24,'color':'#5AA9E6','enabled':True},
 {'id':'tv','name':'TV Series','icon':'📺','type':'video','unit':'episodes','target':2,'weight':3,'minutesPerUnit':45,'color':'#3FC7A6','enabled':True},
 {'id':'manga','name':'Manga Backlog','icon':'📖','type':'reading','unit':'chapters','target':20,'weight':4,'minutesPerUnit':6,'color':'#9C8CF5','enabled':True},
 {'id':'movies','name':'Movies','icon':'🎥','type':'video','unit':'movies','target':1,'weight':3,'minutesPerUnit':115,'color':'#E8A94A','enabled':True},
]
lib=[]
for i in range(160):
 c=cats[i%len(cats)]
 lib.append({'id':f'i{i}','title':f'Title {i:03d}','categoryId':c['id'],'progress':i%24,'total':24 if c['unit']!='movies' else 1,'status':['active','planned','completed','paused'][i%4],'priority':['high','medium','low'][i%3],'coverUrl':'' if i%5==0 else f'https://example.invalid/{i}.jpg','year':1990+(i%36),'rating':(i%10)+1,'source':'simkl' if i%3==0 else 'manual','simklId':str(1000+i) if i%3==0 else '', 'runtimeMinutes':20+(i%120), 'seasonCount':i%8, 'modifiedAt':i})
base=1791302400000
sessions=[]
for i in range(80):
 item=lib[(i*7)%len(lib)];ts=base-i*4*3600000;d=time.gmtime(ts/1000);date=f'{d.tm_year:04d}-{d.tm_mon:02d}-{d.tm_mday:02d}';qty=(i%4)+1
 sessions.append({'id':f's{i}','date':date,'timestamp':ts,'categoryId':item['categoryId'],'targetAmount':1,'actualAmount':qty,'minutes':qty*24,'status':'logged','source':'manual','note':item['title'],'titles':[{'title':item['title'],'libraryId':item['id'],'qty':qty,'repeat':False}]})
collections=[{'id':'c1','title':'Franchise Collection','description':'A professional mini-library smoke collection.','coverUrl':'','titleIds':[f'i{i}' for i in range(12)],'order':[f'i{i}' for i in range(12)],'autoBackground':True,'createdAt':base-100000,'updatedAt':base,'lastViewedAt':base-5000}]
state={
 'categories':cats,'categoryOrder':[c['id'] for c in cats],'library':lib,'sessions':sessions,'collections':collections,'collectionTombstones':[],
 'settings':{'theme':'light','v238DeviceLayout':'desktop','historyPageSize':10,'autoUpdateCheck':False,'autoInstallUpdates':False,'backup':{'enabled':False,'interval':60,'mode':'single','folderName':'','fileName':'mediaflow-backup.json'},'leveling':{'enabled':True,'minuteXP':1,'unitXP':{'episodes':10,'chapters':3,'movies':30},'rotationMultiplier':{'neglected':2,'due':1.5,'healthy':1,'overused':0.5},'libraryAdditionXP':25,'completionXP':50}},
 'activityLog':[],'currentTask':None,'sessionActive':False,'orderPlan':{'titleIds':['i0','i1','i2'],'viewMode':'category','categoryMode':'default','categoryOrder':[],'hiddenCategories':[],'modifiedAt':0},'xpLedger':{'libraryAdditions':{}},'completionTimeline':[]
}
setup=f'''() => {{
 const store={{}};const fakeStore={{getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{{store[k]=String(v)}},removeItem:k=>{{delete store[k]}},clear:()=>{{for(const k of Object.keys(store))delete store[k]}},key:i=>Object.keys(store)[i]||null,get length(){{return Object.keys(store).length}}}};
 Object.defineProperty(window,'localStorage',{{value:fakeStore,configurable:true}});Object.defineProperty(window,'sessionStorage',{{value:fakeStore,configurable:true}});
 const user={{id:'v274-smoke',email:'smoke@example.com',created_at:new Date().toISOString(),user_metadata:{{display_name:'Alex'}}}};let cloud={json.dumps(state,separators=(',',':'))};
 const q={{select(){{return q}},eq(){{return q}},maybeSingle:async()=>({{data:{{state_data:cloud,updated_at:new Date().toISOString()}},error:null}}),upsert:async(row)=>{{cloud=row.state_data;return {{data:null,error:null}}}},delete(){{return q}}}};
 const client={{auth:{{getSession:async()=>({{data:{{session:{{user}}}}}}),onAuthStateChange:()=>({{data:{{subscription:{{unsubscribe(){{}}}}}}}}),getUser:async()=>({{data:{{user}}}}),signOut:async()=>({{}})}},from:()=>q}};
 window.supabase={{createClient(){{return client;}}}};window.confirm=()=>true;window.alert=()=>{{}};window.prompt=()=>null;
}}'''

chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
if not chromium: print('Chromium not found');sys.exit(1)
errors=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':900})
 page.on('pageerror',lambda e: errors.append(str(e)))
 page.set_content('<!doctype html><html><head></head><body><div id="app"></div></body></html>')
 page.add_style_tag(content=css);page.evaluate(setup);page.add_script_tag(content=bundle);page.wait_for_timeout(1500)
 nav=page.evaluate("()=>App.v274VisibleNavIds()")
 page.evaluate("App.setView('collections')");page.wait_for_timeout(120)
 # CRUD: create, edit and delete a temporary collection through the actual modal UI.
 page.evaluate("App.v274CreateCollection()");page.wait_for_timeout(30)
 page.locator('#mf274-col-title').fill('Temporary Collection')
 page.locator('#mf274-col-cover').fill('https://example.com/collection.jpg')
 page.locator('#mf274-col-desc').fill('Created by the v274 CRUD regression test.')
 page.get_by_role('button',name='Create collection').click();page.wait_for_timeout(90)
 created_count=page.evaluate("()=>App.v274AuditState().collections")
 page.get_by_role('button',name='Edit collection').click();page.wait_for_timeout(30)
 page.locator('#mf274-col-title').fill('Temporary Collection Edited')
 page.get_by_role('button',name='Save changes').click();page.wait_for_timeout(80)
 edited_title=page.locator('.mf274-collection-hero h1').inner_text()
 page.get_by_role('button',name='Edit collection').click();page.wait_for_timeout(25)
 page.get_by_role('button',name='Delete collection').click();page.wait_for_timeout(80)
 deleted_count=page.evaluate("()=>App.v274AuditState().collections")
 crud={'createdCount':created_count,'editedTitle':edited_title,'deletedCount':deleted_count}
 browser_state=page.evaluate('''()=>({showcase:document.querySelectorAll('.mf274-browser-showcase').length,collections:document.querySelectorAll('.mf274-browser-results>*').length,search:!!document.querySelector('.mf274-browser-toolbar input'),modes:document.querySelectorAll('.mf274-view-switch button').length,scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth})''')
 page.evaluate("App.v274OpenCollection('c1')");page.wait_for_timeout(140)
 detail=page.evaluate('''()=>({hero:!!document.querySelector('.mf274-collection-hero'),coverCollage:document.querySelectorAll('.mf274-detail-cover img,.mf274-detail-cover>span').length,tools:!!document.querySelector('.mf274-collection-tools'),advanced:document.querySelectorAll('.mf274-advanced-filter').length,items:document.querySelectorAll('.mf274-collection-tile,.mf274-collection-list-row,.mf274-collection-compact,.mf274-collection-title-card').length,overlayControls:!!document.querySelector('.v254-cover-overlay-controls'),background:document.querySelector('.mf274-collection-hero')?.classList.contains('has-bg')})''')
 # rating filter in collection should shrink visible rows
 counts=page.evaluate("()=>{const all=App.v274TestCollectionVisibleCount('c1');App.v274SetCollectionFilter('rating','9+');const hi=App.v274TestCollectionVisibleCount('c1');App.v274SetCollectionFilter('rating','all');return {all,hi};}")
 page.wait_for_timeout(100)
 # Add Titles modal, select visible then deselect all
 page.evaluate("App.v274OpenAddTitles('c1')");page.wait_for_timeout(100)
 add_before=page.evaluate("()=>({rows:document.querySelectorAll('.mf274-add-row').length,picks:App.v274TestAddPickCount()})")
 page.evaluate("App.v274AddSelectVisible()");page.wait_for_timeout(40)
 add_selected=page.evaluate("()=>App.v274TestAddPickCount()")
 page.evaluate("App.v274AddDeselectAll()");page.wait_for_timeout(40)
 add_after=page.evaluate("()=>App.v274TestAddPickCount()")
 page.evaluate("App.v274CloseOverlay('mf274-add-titles');App.v274ToggleOrderView()");page.wait_for_timeout(80)
 order_view=page.evaluate("()=>({rows:document.querySelectorAll('.mf274-order-row').length,draggable:[...document.querySelectorAll('.mf274-order-row')].every(x=>x.draggable)})")
 # Library rating filter applies to both classic helper and Dynamic helper.
 rating=page.evaluate("()=>App.v274TestLibraryRatingCounts()")
 # Personal Order controls
 page.evaluate("App.setView('order')");page.wait_for_timeout(120)
 order=page.evaluate('''()=>({layout:!!document.querySelector('.mf274-order-layout'),sliders:document.querySelectorAll('.mf274-order-layout input[type="range"]').length,deselect:!!document.querySelector('#v274-order-deselect'),side:getComputedStyle(document.documentElement).getPropertyValue('--mf274-order-side-width').trim()})''')
 # Persistence audit
 audit=page.evaluate("()=>App.v274AuditState()")
 # responsive sanity on collections detail
 page.set_viewport_size({'width':360,'height':760});page.evaluate("App.setView('collections');App.v274OpenCollection('c1')");page.wait_for_timeout(100)
 mobile=page.evaluate("()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,sidebar:getComputedStyle(document.querySelector('.sidebar')).display,mobile:getComputedStyle(document.querySelector('.mobile-tabbar')).display})")
 browser.close()

result={'nav':nav,'crud':crud,'browser':browser_state,'detail':detail,'filterCounts':counts,'add':{'before':add_before,'selected':add_selected,'after':add_after},'orderView':order_view,'rating':rating,'order':order,'audit':audit,'mobile':mobile,'errors':errors}
print(json.dumps(result,indent=2))
li=nav.index('library') if 'library' in nav else -1
checks=[
 not errors,crud['createdCount']==2,crud['editedTitle']=='Temporary Collection Edited',crud['deletedCount']==1,'collections' in nav and li>=0 and nav.index('collections')==li+1,
 browser_state['showcase']==1,browser_state['collections']==1,browser_state['search'],browser_state['modes']==5,browser_state['scrollWidth']<=browser_state['clientWidth']+2,
 detail['hero'],detail['coverCollage']>=1 and detail['coverCollage']<=4,detail['tools'],detail['advanced']>=6,detail['items']>0,detail['overlayControls'],detail['background'],
 counts['all']>counts['hi']>=0,
 add_before['rows']>0,add_selected>0,add_after==0,
 order_view['rows']==12,order_view['draggable'],
 rating['normalAll']>rating['normalHigh']>=0,rating['dynAll']>=rating['dynHigh']>=0,
 order['layout'],order['sliders']==2,order['deselect'],order['side'].endswith('px'),
 audit['version']==274,audit['collections']==1,audit['snapshotCollections'],audit['backupCollections'],audit['settingsPersisted'],audit['presetSettings'],audit['cloudSyncVersion']==201,audit['fullBackupSchema']>=29,audit['settingsPresetSchema']>=1,audit['personalOrderExportVersion']>=4,audit['pwaRelease']==274,
 mobile['scrollWidth']<=mobile['clientWidth']+2,mobile['sidebar']=='none',mobile['mobile']!='none'
]
if not all(checks):
 print('SMOKE V274 FAILED',checks);sys.exit(1)
print('SMOKE V274 OK')
