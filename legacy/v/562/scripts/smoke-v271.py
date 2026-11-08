#!/usr/bin/env python3
from pathlib import Path
import json,re,shutil,sys,time
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
index=(ROOT/'index.html').read_text(encoding='utf-8')
css='\n'.join((ROOT/p).read_text(encoding='utf-8') for p in re.findall(r'<link rel="stylesheet" href="([^"]+\.css)"',index) if (ROOT/p).exists())
bundle=(ROOT/'assets/js/mediaflow-v271.bundle.js').read_text(encoding='utf-8')

cats=[
 {'id':'anime','name':'Seasonal Anime','icon':'🎬','type':'video','unit':'episodes','target':4,'weight':4,'minutesPerUnit':24,'color':'#5AA9E6','enabled':True},
 {'id':'tv','name':'TV Series','icon':'📺','type':'video','unit':'episodes','target':2,'weight':3,'minutesPerUnit':45,'color':'#3FC7A6','enabled':True},
 {'id':'manga','name':'Manga Backlog','icon':'📖','type':'reading','unit':'chapters','target':20,'weight':4,'minutesPerUnit':6,'color':'#9C8CF5','enabled':True},
 {'id':'movies','name':'Movies','icon':'🎥','type':'video','unit':'movies','target':1,'weight':3,'minutesPerUnit':115,'color':'#E8A94A','enabled':True},
]
lib=[]
for i in range(700):
 c=cats[i%len(cats)]
 lib.append({'id':f'i{i}','title':f'Title {i:04d}','categoryId':c['id'],'progress':i%30,'total':30,'status':'active','priority':'medium','coverUrl':f'https://example.invalid/{i}.jpg' if i%4 else '','year':2000+(i%27),'rating':(i%10)+1,'modifiedAt':i})
base=1791302400000
sessions=[]
for i in range(180):
 item=lib[(i*7)%len(lib)];ts=base-(i%70)*86400000-(i%12)*3600000;d=time.gmtime(ts/1000);date=f'{d.tm_year:04d}-{d.tm_mon:02d}-{d.tm_mday:02d}';qty=(i%5)+1
 sessions.append({'id':f's{i}','date':date,'timestamp':ts,'categoryId':item['categoryId'],'targetAmount':1,'actualAmount':qty,'minutes':qty*24,'status':'logged','source':'manual','titles':[{'title':item['title'],'libraryId':item['id'],'qty':qty,'repeat':False}]})
state={'categories':cats,'categoryOrder':[c['id'] for c in cats],'library':lib,'sessions':sessions,'settings':{'theme':'light','historyPageSize':10,'backup':{'enabled':False,'interval':60,'mode':'single','folderName':'','fileName':'mediaflow-backup.json'},'leveling':{'enabled':True,'minuteXP':1,'unitXP':{'episodes':10,'chapters':3,'issues':6,'movies':30},'rotationMultiplier':{'neglected':2,'due':1.5,'healthy':1,'overused':0.5},'libraryAdditionXP':25,'completionXP':50}},'activityLog':[],'currentTask':None,'sessionActive':False,'orderPlan':{},'xpLedger':{'libraryAdditions':{}},'completionTimeline':[]}
setup=f'''() => {{
 const store={{}};const fakeStore={{getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{{store[k]=String(v)}},removeItem:k=>{{delete store[k]}},clear:()=>{{for(const k of Object.keys(store))delete store[k]}},key:i=>Object.keys(store)[i]||null,get length(){{return Object.keys(store).length}}}};
 Object.defineProperty(window,'localStorage',{{value:fakeStore,configurable:true}});Object.defineProperty(window,'sessionStorage',{{value:fakeStore,configurable:true}});
 const user={{id:'v271-smoke',email:'smoke@example.com',created_at:new Date().toISOString(),user_metadata:{{display_name:'Alex'}}}};let cloud={json.dumps(state,separators=(',',':'))};
 const q={{select(){{return q}},eq(){{return q}},maybeSingle:async()=>({{data:{{state_data:cloud,updated_at:new Date().toISOString()}},error:null}}),upsert:async(row)=>{{cloud=row.state_data;return {{data:null,error:null}}}},delete(){{return q}}}};
 const client={{auth:{{getSession:async()=>({{data:{{session:{{user}}}}}}),onAuthStateChange:()=>({{data:{{subscription:{{unsubscribe(){{}}}}}}}}),getUser:async()=>({{data:{{user}}}}),signOut:async()=>({{}})}},from:()=>q}};window.supabase={{createClient(){{return client;}}}};window.confirm=()=>true;window.alert=()=>{{}};window.prompt=()=>null;
 window.__downloads=[];URL.createObjectURL=()=> 'blob:test';HTMLAnchorElement.prototype.click=function(){{window.__downloads.push(this.download)}};
}}'''
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
if not chromium: print('Chromium not found');sys.exit(1)
errors=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1536,'height':920})
 page.on('pageerror',lambda e: errors.append(str(e)))
 page.set_content('<!doctype html><html><head></head><body><div id="app"></div></body></html>')
 page.add_style_tag(content=css);page.evaluate(setup);page.add_script_tag(content=bundle);page.wait_for_timeout(1200)
 page.evaluate("App.setView('history')");page.wait_for_timeout(250)
 initial=page.evaluate('''()=>({
   tabs:[...document.querySelectorAll('.v260-history-tab')].map(x=>(x.textContent||'').trim()),
   tabCount:document.querySelectorAll('.v260-history-tab').length,
   visualIcons:document.querySelectorAll('.mf269-latest-title>.v225-btn-icon,.mf269-card-main>.v225-btn-icon,.mf269-most-card>.v225-btn-icon').length,
   selectIcon:!!document.querySelector('.mf269-select-toggle>.v225-btn-icon'),
   optionsIcon:!!document.querySelector('.mf269-options>summary>.v225-btn-icon'),
   weekBadge:(()=>{const x=document.querySelector('.mf269-week-badge');if(!x)return null;const r=x.getBoundingClientRect();return {text:x.textContent,top:r.top,right:r.right,width:r.width,visible:r.width>0&&r.height>0&&r.top>=0&&r.right<=innerWidth+1}})(),
   historyLatest:getComputedStyle(document.documentElement).getPropertyValue('--v181-cover-history-latest').trim(),
   hasV271:!!window.MediaFlowV271
 })''')
 # Category popup should be fixed and visibly outside the filter cell/bar.
 page.click('.mf269-filter-category summary');page.wait_for_timeout(120)
 popup=page.evaluate('''()=>{const p=document.querySelector('.mf269-filter-category .v236-category-filter-panel');const b=document.querySelector('.mf269-filterbar');const pr=p.getBoundingClientRect(),br=b.getBoundingClientRect();const ds=[...document.querySelectorAll('[data-v241-history-category-filter]')].map(d=>({open:d.open,rect:d.getBoundingClientRect().toJSON(),in269:!!d.closest('.mf269-filter-category'),panel:d.querySelector('.v236-category-filter-panel')?.getBoundingClientRect().toJSON()}));return {pos:getComputedStyle(p).position,visible:pr.width>0&&pr.height>0,top:pr.top,barBottom:br.bottom,bottom:pr.bottom,vh:innerHeight,details:ds};}''')
 # Logs tab should be immediately before Library and render old paginated rows.
 page.evaluate("App.v260SetHistoryTab('logs')");page.wait_for_timeout(120)
 logs=page.evaluate('''()=>({active:document.querySelector('.v260-history-tab.active')?.textContent.trim(),rows:document.querySelectorAll('.mf271-logs .hist-row').length,hasPageSize:!!document.querySelector('.mf271-logs .v253-history-page-size'),exportHook:[...document.querySelectorAll('.mf271-logs button')].some(x=>(x.getAttribute('onclick')||'').includes('v271ExportLogsCSV')),html:document.querySelector('.mf271-logs')?.innerHTML.slice(0,1000)})''')
 # Cover-size settings are persistent and reflected in CSS vars/snapshot/preset.
 cover=page.evaluate('''()=>{App.v181SetCoverSize('historyLatest',135);App.v181SetCoverSize('historyWeekSummary',125);App.v181SetCoverSize('historyConsumptionCard',120);App.v181SetCoverSize('historyRecent',130);App.v181SetCoverSize('historyRatings',140);const a=App.v271AuditState();return {settings:a.coverSizes,snap:a.snapshotCoverSizes,preset:a.settingsPresetCoverSizes,latestVar:getComputedStyle(document.documentElement).getPropertyValue('--v181-cover-history-latest').trim()};}''')
 # Verify Recently Viewed and Ratings react to their own scale variables.
 page.evaluate("App.v260SetHistoryTab('recent')");page.wait_for_timeout(100)
 recent=page.evaluate('''()=>{const e=document.querySelector('.v261-recent-cover,.v260-recent-cover');return e?e.getBoundingClientRect().width:0}''')
 page.evaluate("App.v260SetHistoryTab('ratings')");page.wait_for_timeout(100)
 ratings=page.evaluate('''()=>{const e=document.querySelector('.v261-rating-cover,.v260-rating-cover');return e?e.getBoundingClientRect().width:0}''')
 # Exports and audit surface.
 audit=page.evaluate('''()=>({consumptionExport:typeof App.v271ExportConsumptionCSV==='function',logsExport:typeof App.v271ExportLogsCSV==='function',manifest:App.v271AuditState().manifestV271||null,runtime:App.v271AuditState().version,scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth})''')
 page.set_viewport_size({'width':280,'height':760});page.evaluate("App.v260SetHistoryTab('consumption')");page.wait_for_timeout(140)
 mobile=page.evaluate('''()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,tabs:document.querySelectorAll('.v260-history-tab').length,latest:document.querySelectorAll('.mf269-latest-cover').length,weekBadgeVisible:(()=>{const x=document.querySelector('.mf269-week-badge');if(!x)return false;const r=x.getBoundingClientRect();return r.width>0&&r.right<=innerWidth+1})()})''')
 page.evaluate("App.v260SetHistoryTab('logs')");page.wait_for_timeout(100)
 mobileLogs=page.evaluate('''()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,rows:document.querySelectorAll('.mf271-logs .hist-row').length})''')
 page.evaluate("App.setView('settings')");page.wait_for_timeout(100)
 settings=page.evaluate('''()=>({labels:[...document.querySelectorAll('.v181-cover-setting>label')].map(x=>x.textContent.trim()),scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth})''')
 browser.close()

result={'initial':initial,'popup':popup,'logs':logs,'cover':cover,'recentCoverWidth':recent,'ratingsCoverWidth':ratings,'audit':audit,'mobile':mobile,'mobileLogs':mobileLogs,'settings':settings,'errors':errors}
print(json.dumps(result,indent=2))
checks=[
 not errors,initial['hasV271'],initial['tabCount']==5,initial['tabs'][-2:] == ['Logs','Library'],initial['visualIcons']==0,initial['selectIcon'],initial['optionsIcon'],initial['weekBadge'] and initial['weekBadge']['visible'],
 popup['pos']=='absolute' and popup['visible'] and popup['top']>=popup['details'][0]['rect']['bottom']-2 and popup['bottom']<=popup['vh']+2,
 logs['active']=='Logs' and logs['rows']>0 and logs['hasPageSize'] and logs['exportHook'],
 cover['settings']['historyLatest']==135 and cover['snap']['historyWeekSummary']==125 and cover['preset']['historyRatings']==140 and float(cover['latestVar'])>1.3,
 recent>50,ratings>45,audit['consumptionExport'],audit['logsExport'],audit['manifest'] is not None,audit['runtime']==271,audit['scrollWidth']<=audit['clientWidth']+2,
 mobile['scrollWidth']<=mobile['clientWidth']+2,mobile['tabs']==5,mobile['latest']>0,mobile['weekBadgeVisible'],mobileLogs['scrollWidth']<=mobileLogs['clientWidth']+2,mobileLogs['rows']>0,
 settings['scrollWidth']<=settings['clientWidth']+2,all(x in settings['labels'] for x in ['Consumption History · Latest consumed covers','Consumption History · Week summary covers','Consumption History · Daily log covers','History · Recently viewed covers','History · Ratings covers','Dashboard · Recommended title cover'])
]
if not all(checks):
 print('SMOKE V271 FAILED',checks);sys.exit(1)
print('SMOKE V271 OK')
