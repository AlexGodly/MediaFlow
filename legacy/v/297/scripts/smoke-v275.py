#!/usr/bin/env python3
from pathlib import Path
import json,re,shutil,sys,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
index=(ROOT/'index.html').read_text(encoding='utf-8')
css='\n'.join((ROOT/p).read_text(encoding='utf-8') for p in re.findall(r'<link rel="stylesheet" href="([^"]+\.css)"',index) if (ROOT/p).exists())
bundle=(ROOT/'assets/js/mediaflow-v275.bundle.js').read_text(encoding='utf-8')
cats=[
 {'id':'anime','name':'Seasonal Anime','icon':'🎬','type':'video','unit':'episodes','target':4,'weight':4,'minutesPerUnit':24,'color':'#5AA9E6','enabled':True},
 {'id':'tv','name':'TV Series','icon':'📺','type':'video','unit':'episodes','target':2,'weight':3,'minutesPerUnit':45,'color':'#3FC7A6','enabled':True},
 {'id':'manga','name':'Manga Backlog','icon':'📖','type':'reading','unit':'chapters','target':20,'weight':4,'minutesPerUnit':6,'color':'#9C8CF5','enabled':True},
 {'id':'movies','name':'Movies','icon':'🎥','type':'video','unit':'movies','target':1,'weight':3,'minutesPerUnit':115,'color':'#E8A94A','enabled':True},
]
lib=[]
for i in range(180):
 c=cats[i%len(cats)]
 lib.append({'id':f'i{i}','title':f'Title {i:03d}','categoryId':c['id'],'progress':i%24,'total':24 if c['unit']!='movies' else 1,'status':['active','planned','completed','paused'][i%4],'priority':['high','medium','low'][i%3],'coverUrl':'' if i%5==0 else f'https://example.invalid/{i}.jpg','year':1990+(i%36),'rating':(i%10)+1,'source':'manual','runtimeMinutes':20+(i%120),'seasonCount':i%8,'modifiedAt':i})
base=1791302400000
collections=[{'id':'c1','title':'Franchise Collection','description':'A professional mini-library smoke collection.','coverUrl':'','titleIds':[f'i{i}' for i in range(18)],'order':[f'i{i}' for i in range(18)],'autoBackground':True,'createdAt':base-100000,'updatedAt':base,'lastViewedAt':base-5000}]
state={
 'categories':cats,'categoryOrder':[c['id'] for c in cats],'library':lib,'sessions':[],'collections':collections,'collectionTombstones':[],
 'settings':{'theme':'light','v238DeviceLayout':'desktop','historyPageSize':10,'autoUpdateCheck':False,'autoInstallUpdates':False,'backup':{'enabled':False,'interval':60,'mode':'single','folderName':'','fileName':'mediaflow-backup.json'},'leveling':{'enabled':True,'minuteXP':1,'unitXP':{'episodes':10,'chapters':3,'movies':30},'rotationMultiplier':{'neglected':2,'due':1.5,'healthy':1,'overused':0.5},'libraryAdditionXP':25,'completionXP':50}},
 'activityLog':[],'currentTask':None,'sessionActive':False,'orderPlan':{'titleIds':[f'i{i}' for i in range(20)],'viewMode':'category','categoryMode':'default','categoryOrder':[],'hiddenCategories':[],'modifiedAt':0},'xpLedger':{'libraryAdditions':{}},'completionTimeline':[]
}
setup=f'''() => {{
 const store={{}};const fakeStore={{getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{{store[k]=String(v)}},removeItem:k=>{{delete store[k]}},clear:()=>{{for(const k of Object.keys(store))delete store[k]}},key:i=>Object.keys(store)[i]||null,get length(){{return Object.keys(store).length}}}};
 Object.defineProperty(window,'localStorage',{{value:fakeStore,configurable:true}});Object.defineProperty(window,'sessionStorage',{{value:fakeStore,configurable:true}});
 const user={{id:'v275-smoke',email:'smoke@example.com',created_at:new Date().toISOString(),user_metadata:{{display_name:'Alex'}}}};let cloud={json.dumps(state,separators=(',',':'))};
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
 # Personal Order: no sliders and direct edge resizing.
 page.evaluate("App.setView('order')");page.wait_for_timeout(150)
 initial=page.evaluate("()=>({layout:!!document.querySelector('.mf274-order-layout'),side:getComputedStyle(document.documentElement).getPropertyValue('--mf274-order-side-width').trim(),cat:getComputedStyle(document.documentElement).getPropertyValue('--mf274-order-category-width').trim(),cards:document.querySelectorAll('.v138-category-card').length,deselect:!!document.querySelector('#v274-order-deselect')})")
 side=page.locator('.v138-order-side').bounding_box(); assert side
 # grab the left edge and drag left to make Add Titles wider
 page.mouse.move(side['x']+2,side['y']+100);page.mouse.down();page.mouse.move(side['x']-90,side['y']+100,steps=6);page.mouse.up();page.wait_for_timeout(80)
 side_after=page.evaluate("()=>getComputedStyle(document.documentElement).getPropertyValue('--mf274-order-side-width').trim()")
 card=page.locator('.v138-category-card').first.bounding_box(); assert card
 page.mouse.move(card['x']+card['width']-2,card['y']+50);page.mouse.down();page.mouse.move(card['x']+max(430,card['width']-80),card['y']+50,steps=5);page.mouse.up();page.wait_for_timeout(80)
 cat_after=page.evaluate("()=>getComputedStyle(document.documentElement).getPropertyValue('--mf274-order-category-width').trim()")
 audit_order=page.evaluate("()=>App.v275AuditState()")
 # Collections detail has a prominent back button.
 page.evaluate("App.setView('collections');App.v274OpenCollection('c1')");page.wait_for_timeout(140)
 detail=page.evaluate("()=>({back:document.querySelectorAll('.mf275-collection-back').length,heroBack:[...document.querySelectorAll('.mf274-hero-actions button')].some(x=>x.textContent.includes('Collections')),scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth})")
 # Add Titles popup is wide and not clipped on desktop.
 page.evaluate("App.v274OpenAddTitles('c1')");page.wait_for_timeout(120)
 modal=page.evaluate("()=>{const m=document.querySelector('#mf274-add-titles .mf274-add-modal'),tools=document.querySelector('#mf274-add-titles .mf274-add-tools'),results=document.querySelector('#mf274-add-titles .mf274-add-results');const r=m.getBoundingClientRect();return {width:r.width,right:r.right,viewport:innerWidth,toolsScroll:tools.scrollWidth,toolsClient:tools.clientWidth,results:results.children.length,overflow:getComputedStyle(m).overflow};}")
 page.locator('#mf274-add-titles .v66-cat-filter summary').click();page.wait_for_timeout(40)
 catpanel=page.evaluate("()=>{const p=document.querySelector('#mf274-add-titles .v66-cat-panel');const r=p.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,viewport:innerWidth,visible:!!document.elementFromPoint(Math.min(innerWidth-2,r.left+10),Math.min(innerHeight-2,r.top+10))?.closest('.v66-cat-panel')};}")
 page.evaluate("App.v274CloseOverlay('mf274-add-titles')")
 # Dedicated back button returns to Collections main page.
 page.get_by_role('button',name='Back to Collections').click();page.wait_for_timeout(80)
 back_state=page.evaluate("()=>({browser:!!document.querySelector('.mf274-collections-browser'),hero:!!document.querySelector('.mf274-collection-hero')})")
 # Mobile Add Titles remains viewport-safe.
 page.set_viewport_size({'width':360,'height':760});page.evaluate("App.v274OpenCollection('c1')");page.wait_for_timeout(80);page.evaluate("App.v274OpenAddTitles('c1')");page.wait_for_timeout(80)
 mobile=page.evaluate("()=>{const m=document.querySelector('#mf274-add-titles .mf274-add-modal').getBoundingClientRect();return {modalWidth:m.width,viewport:innerWidth,docScroll:document.documentElement.scrollWidth,docClient:document.documentElement.clientWidth,results:document.querySelectorAll('.mf274-add-row').length};}")
 audit=page.evaluate("()=>App.v275AuditState()")
 browser.close()
result={'initial':initial,'sideAfter':side_after,'catAfter':cat_after,'auditOrder':audit_order,'detail':detail,'modal':modal,'categoryPanel':catpanel,'back':back_state,'mobile':mobile,'audit':audit,'errors':errors}
print(json.dumps(result,indent=2))
def px(s):
 try:return float(str(s).replace('px','').strip())
 except:return 0
checks=[
 not errors,
 not initial['layout'],initial['cards']>0,initial['deselect'],px(side_after)>px(initial['side']),px(cat_after)!=px(initial['cat']),
 audit_order['orderEdgeResize'] and audit_order['orderSliderPanelRemoved'],
 detail['back']==1 and not detail['heroBack'] and detail['scrollWidth']<=detail['clientWidth']+2,
 modal['width']>=900 and modal['right']<=modal['viewport']+2 and modal['toolsScroll']<=modal['toolsClient']+4 and modal['results']>0,
 catpanel['left']>=0 and catpanel['right']<=catpanel['viewport']+2 and catpanel['visible'],
 back_state['browser'] and not back_state['hero'],
 mobile['modalWidth']<=mobile['viewport']+2 and mobile['docScroll']<=mobile['docClient']+2 and mobile['results']>0,
 audit['version']==275 and audit['pwaRelease']==275 and audit['collectionAddModalFixed'] and audit['collectionBackButton']
]
if not all(checks):
 print('SMOKE V275 FAILED',checks);sys.exit(1)
print('SMOKE V275 OK')
