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
for i in range(120):
 c=cats[i%len(cats)]
 lib.append({'id':f'i{i}','title':f'Title {i:03d}','categoryId':c['id'],'progress':i%24,'total':24,'status':'active','priority':'medium','coverUrl':'','year':2020+(i%6),'rating':(i%10)+1,'modifiedAt':i})
base=1791302400000
sessions=[]
for i in range(60):
 item=lib[(i*7)%len(lib)];ts=base-i*5*3600000;d=time.gmtime(ts/1000);date=f'{d.tm_year:04d}-{d.tm_mon:02d}-{d.tm_mday:02d}';qty=(i%4)+1
 sessions.append({'id':f's{i}','date':date,'timestamp':ts,'categoryId':item['categoryId'],'targetAmount':1,'actualAmount':qty,'minutes':qty*24,'status':'logged','source':'manual','note':item['title'],'titles':[{'title':item['title'],'libraryId':item['id'],'qty':qty,'repeat':False}]})
state={
 'categories':cats,'categoryOrder':[c['id'] for c in cats],'library':lib,'sessions':sessions,
 'settings':{'theme':'light','v238DeviceLayout':'desktop','historyPageSize':10,'autoUpdateCheck':False,'autoInstallUpdates':False,'backup':{'enabled':False,'interval':60,'mode':'single','folderName':'','fileName':'mediaflow-backup.json'},'leveling':{'enabled':True,'minuteXP':1,'unitXP':{'episodes':10,'chapters':3,'movies':30},'rotationMultiplier':{'neglected':2,'due':1.5,'healthy':1,'overused':0.5},'libraryAdditionXP':25,'completionXP':50}},
 'activityLog':[],'currentTask':None,'sessionActive':False,'orderPlan':{},'xpLedger':{'libraryAdditions':{}},'completionTimeline':[]
}
setup=f'''() => {{
 const store={{}};const fakeStore={{getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{{store[k]=String(v)}},removeItem:k=>{{delete store[k]}},clear:()=>{{for(const k of Object.keys(store))delete store[k]}},key:i=>Object.keys(store)[i]||null,get length(){{return Object.keys(store).length}}}};
 Object.defineProperty(window,'localStorage',{{value:fakeStore,configurable:true}});Object.defineProperty(window,'sessionStorage',{{value:fakeStore,configurable:true}});
 const user={{id:'v273-smoke',email:'smoke@example.com',created_at:new Date().toISOString(),user_metadata:{{display_name:'Alex'}}}};let cloud={json.dumps(state,separators=(',',':'))};
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
 page.add_style_tag(content=css);page.evaluate(setup);page.add_script_tag(content=bundle);page.wait_for_timeout(1400)
 page.evaluate("App.setView('history');App.v260SetHistoryTab('consumption')");page.wait_for_timeout(180)
 track=page.locator('.mf269-latest-track')
 box=track.bounding_box()
 before=page.evaluate("()=>({left:document.querySelector('.mf269-latest-track')?.scrollLeft||0,modal:!!document.querySelector('.modal-overlay'),scrollbar:getComputedStyle(document.querySelector('.mf269-latest-track')).scrollbarWidth})")
 if box:
  page.mouse.move(box['x']+box['width']*0.78,box['y']+min(55,box['height']*.5))
  page.mouse.down()
  page.mouse.move(box['x']+box['width']*0.28,box['y']+min(55,box['height']*.5),steps=8)
  page.mouse.up()
 page.wait_for_timeout(80)
 after=page.evaluate("()=>({left:document.querySelector('.mf269-latest-track')?.scrollLeft||0,modal:!!document.querySelector('.modal-overlay'),bound:document.querySelector('.mf269-latest-track')?.dataset.mf273DragBound||'',scrollbar:getComputedStyle(document.querySelector('.mf269-latest-track')).scrollbarWidth})")

 # Explicitly reproduce the old forced-desktop narrow viewport problem.
 page.evaluate("document.documentElement.dataset.v238DevicePreference='desktop';document.documentElement.dataset.v238Layout='desktop'")
 views=['dashboard','library','order','oldsystem','history','batch','stats','profile','settings','about']
 widths=[1024,600,320]
 responsive=[]
 for width in widths:
  page.set_viewport_size({'width':width,'height':820});page.wait_for_timeout(15)
  for view in views:
   try:
    page.evaluate(f"App.setView('{view}')")
    if view=='history': page.evaluate("App.v260SetHistoryTab('consumption')")
    page.wait_for_timeout(15)
    m=page.evaluate('''()=>({
      view:document.querySelector('.view-title')?.textContent?.trim()||'',width:innerWidth,scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,
      sidebar:getComputedStyle(document.querySelector('.sidebar')).display,
      mobile:getComputedStyle(document.querySelector('.mobile-tabbar')).display,
      mainWidth:document.querySelector('.main')?.getBoundingClientRect().width||0,
      bucket:document.documentElement.dataset.mf273Viewport||'',
      appMin:getComputedStyle(document.querySelector('#app')).minWidth
    })''')
    responsive.append(m)
   except Exception as e:
    responsive.append({'view':view,'width':width,'error':str(e)})

 # Exercise all five History tabs at tight width.
 page.set_viewport_size({'width':320,'height':820});page.evaluate("App.setView('history')");page.wait_for_timeout(60)
 history_tabs=[]
 for tab in ['consumption','recent','ratings','logs','library']:
  page.evaluate(f"App.v260SetHistoryTab('{tab}')");page.wait_for_timeout(25)
  history_tabs.append(page.evaluate(f"()=>({{tab:'{tab}',scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth}})"))

 audit=page.evaluate("()=>({legacy:App.v273AuditState(),current:App.v274AuditState(),runtime:MediaFlowRuntime.version})")
 browser.close()

result={'drag':{'before':before,'after':after},'responsive':responsive,'history_tabs':history_tabs,'audit':audit,'errors':errors}
print(json.dumps(result,indent=2))

resp_ok=all('error' not in r and r['scrollWidth']<=r['clientWidth']+2 and r['sidebar']=='none' and r['mobile']!='none' and r['mainWidth']<=r['clientWidth']+2 for r in responsive)
tabs_ok=all(x['scrollWidth']<=x['clientWidth']+2 for x in history_tabs)
systems=audit.get('legacy',{}).get('systems',{})
checks=[
 not errors,
 after['bound']=='1',after['left']>before['left']+20,after['modal']==before['modal'],after['scrollbar']=='none',
 resp_ok,tabs_ok,
 audit.get('current',{}).get('version')==274,audit.get('runtime')==274,audit.get('current',{}).get('cloudSyncVersion')==201,
 audit.get('current',{}).get('personalOrderExportVersion')>=4,audit.get('current',{}).get('pwaRelease')==274,
 all(bool(systems.get(k)) for k in ['syncNow','xpCalculation','fullDataExport','fullDataImport','settingsExport','settingsImport','consumptionHistoryExport','logsExport','personalOrderImport','personalOrderExport','automaticUpdate','automaticBackup']),
 audit.get('legacy',{}).get('snapshotHasSettings'),audit.get('legacy',{}).get('presetHasSettings'),audit.get('legacy',{}).get('backupHasSettings')
]
if not all(checks):
 print('SMOKE V273 FAILED',checks);sys.exit(1)
print('SMOKE V273 OK')
