#!/usr/bin/env python3
from pathlib import Path
import json, re, shutil, sys, time
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
index=(ROOT/'index.html').read_text(encoding='utf-8')
css_paths=re.findall(r'<link rel="stylesheet" href="([^"]+\.css)"',index)
css='\n'.join((ROOT/p).read_text(encoding='utf-8') for p in css_paths if (ROOT/p).exists())
bundle=(ROOT/'assets/js/mediaflow-v272.bundle.js').read_text(encoding='utf-8')

cats=[
 {'id':'anime','name':'Anime','icon':'🎬','type':'video','unit':'episodes','target':4,'weight':4,'minutesPerUnit':24,'color':'#5AA9E6','enabled':True},
 {'id':'tv','name':'TV Series','icon':'📺','type':'video','unit':'episodes','target':2,'weight':3,'minutesPerUnit':45,'color':'#3FC7A6','enabled':True},
 {'id':'manga','name':'Manga','icon':'📖','type':'reading','unit':'chapters','target':20,'weight':4,'minutesPerUnit':6,'color':'#9C8CF5','enabled':True},
 {'id':'movies','name':'Movies','icon':'🎥','type':'video','unit':'movies','target':1,'weight':3,'minutesPerUnit':115,'color':'#E8A94A','enabled':True},
]
lib=[]
for i in range(30000):
    c=cats[i%len(cats)]
    lib.append({'id':f'i{i}','title':f'Title {i:05d}','categoryId':c['id'],'progress':i%30,'total':30,'status':'active','priority':'medium','coverUrl':'','year':2000+(i%27),'modifiedAt':i})

base=1791302400000
sessions=[]
for i in range(5000):
    item=lib[(i*37)%len(lib)]
    ts=base-(i%365)*86400000-(i%12)*3600000
    d=time.gmtime(ts/1000)
    date=f'{d.tm_year:04d}-{d.tm_mon:02d}-{d.tm_mday:02d}'
    qty=(i%5)+1
    sessions.append({'id':f's{i}','date':date,'timestamp':ts,'categoryId':item['categoryId'],'targetAmount':1,'actualAmount':qty,'minutes':qty*24,'status':'logged','source':'manual','titles':[{'title':item['title'],'libraryId':item['id'],'qty':qty,'repeat':False}]})

state={
 'categories':cats,'categoryOrder':[c['id'] for c in cats],'library':lib,'sessions':sessions,
 'settings':{'theme':'dark','historyPageSize':10,'backup':{'enabled':False,'interval':60,'mode':'single','folderName':'','fileName':'mediaflow-backup.json'},'leveling':{'enabled':True,'minuteXP':1,'unitXP':{'episodes':10,'chapters':3,'issues':6,'movies':30},'rotationMultiplier':{'neglected':2,'due':1.5,'healthy':1,'overused':0.5},'libraryAdditionXP':25,'completionXP':50}},
 'activityLog':[],'currentTask':None,'sessionActive':False,'orderPlan':{},'xpLedger':{'libraryAdditions':{}},'completionTimeline':[]
}
setup=f'''() => {{
 const store={{}};const fakeStore={{getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{{store[k]=String(v)}},removeItem:k=>{{delete store[k]}},clear:()=>{{for(const k of Object.keys(store))delete store[k]}},key:i=>Object.keys(store)[i]||null,get length(){{return Object.keys(store).length}}}};
 Object.defineProperty(window,'localStorage',{{value:fakeStore,configurable:true}});Object.defineProperty(window,'sessionStorage',{{value:fakeStore,configurable:true}});
 const user={{id:'v272-perf',email:'perf@example.com',created_at:new Date().toISOString(),user_metadata:{{display_name:'Alex'}}}};
 let cloud={json.dumps(state,separators=(',',':'))};
 const q={{select(){{return q}},eq(){{return q}},maybeSingle:async()=>({{data:{{state_data:cloud,updated_at:new Date().toISOString()}},error:null}}),upsert:async(row)=>{{cloud=row.state_data;return {{data:null,error:null}}}},delete(){{return q}}}};
 const client={{auth:{{getSession:async()=>({{data:{{session:{{user}}}}}}),onAuthStateChange:()=>({{data:{{subscription:{{unsubscribe(){{}}}}}}}}),getUser:async()=>({{data:{{user}}}}),signOut:async()=>({{}})}},from:()=>q}};
 window.supabase={{createClient(){{return client;}}}};window.confirm=()=>true;window.alert=()=>{{}};window.prompt=()=>null;
}}'''

chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
if not chromium:
    print('Chromium not found');sys.exit(1)
errors=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1440,'height':1000})
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.set_content('<!doctype html><html><head></head><body><div id="app"></div></body></html>')
    page.add_style_tag(content=css)
    page.evaluate(setup)
    t0=time.perf_counter();page.add_script_tag(content=bundle);page.wait_for_timeout(1800);startup_ms=(time.perf_counter()-t0)*1000
    nav=page.evaluate('''()=>{const a=performance.now();App.setView('history');const sync=performance.now()-a;return {sync,view:document.querySelector('.v269-history-page')?true:false,cards:document.querySelectorAll('.mf269-history-card').length,weeks:document.querySelectorAll('.mf269-week-summary').length,chip:[...document.querySelectorAll('.v260-topbar-chip')].some(x=>/^v\\d+/i.test((x.textContent||'').trim()))};}''')
    page.wait_for_timeout(150)
    repeated=page.evaluate('''()=>{const timings=[];for(const view of ['dashboard','library','history','statistics','history']){const a=performance.now();App.setView(view);timings.push({view,ms:performance.now()-a});}return {timings,cards:document.querySelectorAll('.mf269-history-card').length,weeks:document.querySelectorAll('.mf269-week-summary').length};}''')
    page.evaluate('''()=>{const a=document.querySelector('.v260-topbar-actions');if(a){const x=document.createElement('span');x.className='v260-topbar-chip';x.textContent='v261';a.insertBefore(x,a.firstChild);}}''')
    page.wait_for_timeout(120)
    stable=page.evaluate('''()=>({cards:document.querySelectorAll('.mf269-history-card').length,weeks:document.querySelectorAll('.mf269-week-summary').length,chip:[...document.querySelectorAll('.v260-topbar-chip')].some(x=>/^v\\d+/i.test((x.textContent||'').trim())),scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,cacheReady:!!window.MediaFlowV272})''')
    browser.close()

print(json.dumps({'startup_ms':round(startup_ms,1),'history_sync_ms':round(nav['sync'],1),'initial':nav,'repeated':repeated,'stable':stable,'page_errors':errors},indent=2))
# History navigation should be comfortably below the browser's unresponsive threshold.
if errors or not nav['view'] or nav['sync']>2500 or max(x['ms'] for x in repeated['timings'])>2500 or stable['cards']<1 or stable['weeks']<1 or nav['chip'] or stable['chip'] or not stable['cacheReady'] or stable['scrollWidth']>stable['clientWidth']+2:
    print('PERF V272 FAILED');sys.exit(1)
print('PERF V272 OK')
