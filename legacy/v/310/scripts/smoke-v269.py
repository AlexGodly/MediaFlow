#!/usr/bin/env python3
from pathlib import Path
import json,re,sys,shutil
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
index=(ROOT/'index.html').read_text(encoding='utf-8')
css_paths=re.findall(r'<link rel="stylesheet" href="([^"]+\.css)"',index)
css='\n'.join((ROOT/p).read_text(encoding='utf-8') for p in css_paths if (ROOT/p).exists())
bundle=(ROOT/'assets/js/mediaflow-v269.bundle.js').read_text(encoding='utf-8')

state={
  'categories':[
    {'id':'anime','name':'Anime','icon':'🎬','type':'video','unit':'episodes','target':4,'weight':4,'minutesPerUnit':24,'color':'#5AA9E6','enabled':True,'custom':True},
    {'id':'tv','name':'TV Series','icon':'📺','type':'video','unit':'episodes','target':2,'weight':3,'minutesPerUnit':45,'color':'#3FC7A6','enabled':True,'custom':False},
    {'id':'manga','name':'Manga','icon':'📖','type':'reading','unit':'chapters','target':20,'weight':4,'minutesPerUnit':6,'color':'#9C8CF5','enabled':True,'custom':False},
    {'id':'movies','name':'Movies','icon':'🎥','type':'video','unit':'movies','target':1,'weight':3,'minutesPerUnit':115,'color':'#E8A94A','enabled':True,'custom':False},
  ],
  'categoryOrder':['anime','tv','manga','movies'],
  'library':[
    {'id':'a1','title':'Tougen Anki','categoryId':'anime','progress':16,'total':24,'status':'active','priority':'high','coverUrl':'https://example.com/a1.jpg','year':2025,'modifiedAt':1},
    {'id':'a2','title':'Re:Zero kara Hajimeru Isekai Seikatsu','categoryId':'anime','progress':13,'total':24,'status':'active','priority':'medium','coverUrl':'https://example.com/a2.jpg','year':2026,'modifiedAt':1},
    {'id':'t1','title':'Stranger Things','categoryId':'tv','progress':8,'total':8,'status':'completed','priority':'medium','coverUrl':'https://example.com/t1.jpg','year':2016,'modifiedAt':1},
    {'id':'m1','title':'Berserk','categoryId':'manga','progress':42,'total':380,'status':'active','priority':'high','coverUrl':'','year':1989,'modifiedAt':1},
    {'id':'mv1','title':'A Silent Voice','categoryId':'movies','progress':1,'total':1,'status':'completed','priority':'medium','coverUrl':'https://example.com/mv1.jpg','year':2016,'modifiedAt':1},
  ],
  'sessions':[
    {'id':'s1','date':'2026-10-06','timestamp':1791291600000,'categoryId':'anime','targetAmount':4,'actualAmount':16,'minutes':384,'status':'logged','source':'manual','titles':[{'title':'Tougen Anki','libraryId':'a1','qty':16,'repeat':False}]},
    {'id':'s2','date':'2026-10-06','timestamp':1791302400000,'categoryId':'tv','targetAmount':2,'actualAmount':5,'minutes':225,'status':'logged','source':'manual','titles':[{'title':'Stranger Things','libraryId':'t1','qty':5,'repeat':False}]},
    {'id':'s3','date':'2026-10-05','timestamp':1791201600000,'categoryId':'anime','targetAmount':4,'actualAmount':13,'minutes':312,'status':'logged','source':'manual','titles':[{'title':'Re:Zero kara Hajimeru Isekai Seikatsu','libraryId':'a2','qty':13,'repeat':False}]},
    {'id':'s4','date':'2026-10-04','timestamp':1791115200000,'categoryId':'manga','targetAmount':20,'actualAmount':20,'minutes':120,'status':'logged','source':'manual','titles':[{'title':'Berserk','libraryId':'m1','qty':20,'repeat':False}]},
    {'id':'s5','date':'2026-09-30','timestamp':1790769600000,'categoryId':'movies','targetAmount':1,'actualAmount':1,'minutes':130,'status':'logged','source':'manual','titles':[{'title':'A Silent Voice','libraryId':'mv1','qty':1,'repeat':False}]},
    {'id':'s6','date':'2026-09-29','timestamp':1790683200000,'categoryId':'anime','targetAmount':4,'actualAmount':4,'minutes':96,'status':'logged','source':'manual','titles':[{'title':'Tougen Anki','libraryId':'a1','qty':4,'repeat':True}]},
  ],
  'settings':{'theme':'dark','historyPageSize':10,'backup':{'enabled':False,'interval':60,'mode':'single','folderName':'','fileName':'mediaflow-backup.json'},'leveling':{'enabled':True,'minuteXP':1,'unitXP':{'episodes':10,'chapters':3,'issues':6,'movies':30},'rotationMultiplier':{'neglected':2,'due':1.5,'healthy':1,'overused':0.5},'libraryAdditionXP':25,'completionXP':50}},
  'activityLog':[], 'currentTask':None,'sessionActive':False,'orderPlan':{},'xpLedger':{'libraryAdditions':{}},'completionTimeline':[]
}

setup=f'''() => {{
 const store={{}};const fakeStore={{getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{{store[k]=String(v)}},removeItem:k=>{{delete store[k]}},clear:()=>{{for(const k of Object.keys(store))delete store[k]}},key:i=>Object.keys(store)[i]||null,get length(){{return Object.keys(store).length}}}};
 Object.defineProperty(window,'localStorage',{{value:fakeStore,configurable:true}});Object.defineProperty(window,'sessionStorage',{{value:fakeStore,configurable:true}});
 const user={{id:'v269-smoke',email:'v269@example.com',created_at:new Date().toISOString(),user_metadata:{{display_name:'Alex'}}}};
 let cloud={json.dumps(state)};
 const q={{select(){{return q}},eq(){{return q}},maybeSingle:async()=>({{data:{{state_data:cloud,updated_at:new Date().toISOString()}},error:null}}),upsert:async(row)=>{{cloud=row.state_data;return {{data:null,error:null}}}},delete(){{return q}}}};
 const client={{auth:{{getSession:async()=>({{data:{{session:{{user}}}}}}),onAuthStateChange:()=>({{data:{{subscription:{{unsubscribe(){{}}}}}}}}),getUser:async()=>({{data:{{user}}}}),signOut:async()=>({{}})}},from:()=>q}};
 window.supabase={{createClient(){{return client;}}}};window.confirm=()=>true;window.alert=()=>{{}};window.prompt=()=>null;
}}'''

chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
if not chromium: print('Chromium not found');sys.exit(1)
errors=[];results={}
with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1440,'height':1100})
  page.on('pageerror',lambda e: errors.append(str(e)))
  page.set_content('<!doctype html><html><head></head><body><div id="app"></div></body></html>')
  page.add_style_tag(content=css);page.evaluate(setup);page.add_script_tag(content=bundle);page.wait_for_timeout(1400)
  results['runtime']=page.evaluate('()=>window.MediaFlowRuntime?.version||0')
  page.evaluate("()=>App.setView('history')");page.wait_for_timeout(120)
  results['tabs']=page.locator('.v260-history-tab').count()
  results['filterbar']=page.locator('.mf269-filterbar').count()==1
  results['latest']=page.locator('.mf269-latest-title').count()
  results['week_summaries']=page.locator('.mf269-week-summary').count()
  results['day_groups']=page.locator('.mf269-day').count()
  results['cards']=page.locator('.mf269-history-card').count()
  results['first_summary_text']=page.locator('.mf269-week-summary').first.inner_text(); results['category_summary']='ANIME' in results['first_summary_text'].upper() and 'TV SERIES' in results['first_summary_text'].upper()
  results['fallback']=page.locator('.mf269-latest-cover .mf269-cover-fallback').count()>=1
  results['progress_labels']=page.locator('.mf269-latest-progress').all_inner_texts()
  page.evaluate("()=>App.v269SetYear('2026')");page.wait_for_timeout(80)
  results['year_filter']=page.locator('.mf269-week-summary').count()>=2
  page.evaluate("()=>App.v269SetMonth('10')");page.wait_for_timeout(80)
  results['month_filter']=page.locator('.mf269-week-summary').count()==2
  page.evaluate("()=>App.v269SetMonth('all')");page.wait_for_timeout(60)
  page.evaluate("()=>App.v269ToggleSelectMode()");page.wait_for_timeout(60)
  results['selection']=page.locator('.mf269-selection-bar').count()==1 and page.locator('.mf269-history-select').count()>0
  page.evaluate("()=>App.setTheme('light')");page.wait_for_timeout(70)
  results['theme']=page.evaluate("()=>document.documentElement.getAttribute('data-theme')")== 'light' and page.locator('.mf269-week-summary').count()>0
  page.wait_for_timeout(120); results['version_chrome']='v269' in page.locator('.v260-topbar-copy').inner_text()
  overflow=[]
  for w in [1440,1024,820,680,390,320,280]:
    page.set_viewport_size({'width':w,'height':900});page.wait_for_timeout(50)
    dims=page.evaluate('()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,bw:document.body.scrollWidth,iw:innerWidth})')
    if dims['sw']>dims['cw']+2 or dims['bw']>dims['iw']+2:
      offenders=page.evaluate('''()=>[...document.querySelectorAll("*")].map(el=>{const r=el.getBoundingClientRect();return {t:el.tagName,c:el.className||"",l:Math.round(r.left),r:Math.round(r.right),w:Math.round(r.width),sw:el.scrollWidth,cw:el.clientWidth}}).filter(x=>x.r>innerWidth+2||x.l<-2||x.sw>x.cw+2).sort((a,b)=>(b.r-innerWidth)-(a.r-innerWidth)).slice(0,12)'''); overflow.append([w,dims,offenders])
  results['overflow']=overflow
  browser.close()

required=(results['runtime']==269 and results['tabs']==4 and results['filterbar'] and results['latest']>=5 and results['week_summaries']>=2 and results['day_groups']>=4 and results['cards']>=6 and results['category_summary'] and results['fallback'] and results['year_filter'] and results['month_filter'] and results['selection'] and results['theme'] and results['version_chrome'] and not results['overflow'])
print(json.dumps(results,indent=2))
if errors: print('PAGE ERRORS:',errors)
if not required or errors: print('SMOKE V269 FAILED');sys.exit(1)
print('SMOKE V269 OK')
