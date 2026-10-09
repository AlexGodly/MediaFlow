#!/usr/bin/env python3
from pathlib import Path
import json,re,shutil,sys,time
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
index=(ROOT/'index.html').read_text(encoding='utf-8')
css='\n'.join((ROOT/p).read_text(encoding='utf-8') for p in re.findall(r'<link rel="stylesheet" href="([^"]+\.css)"',index) if (ROOT/p).exists())
bundle=(ROOT/'assets/js/mediaflow-v273.bundle.js').read_text(encoding='utf-8')

cats=[
 {'id':'anime','name':'Missed Anime','icon':'🎬','type':'video','unit':'episodes','target':4,'weight':4,'minutesPerUnit':24,'color':'#ff7a59','enabled':True},
 {'id':'tv','name':'TV Series','icon':'📺','type':'video','unit':'episodes','target':2,'weight':3,'minutesPerUnit':45,'color':'#3FC7A6','enabled':True},
 {'id':'manga','name':'Manga Backlog','icon':'📖','type':'reading','unit':'chapters','target':20,'weight':4,'minutesPerUnit':6,'color':'#9C8CF5','enabled':True},
]
lib=[]
for i in range(120):
 c=cats[i%len(cats)]
 lib.append({'id':f'i{i}','title':f'Title {i:03d}','categoryId':c['id'],'progress':i%20,'total':24,'status':'active','priority':'medium','coverUrl':'' if i%3==0 else f'https://example.invalid/{i}.jpg','year':2020+(i%6),'rating':(i%10)+1,'modifiedAt':i})
base=1791302400000
sessions=[]
for i in range(50):
 item=lib[(i*5)%len(lib)];ts=base-i*3600000;d=time.gmtime(ts/1000);date=f'{d.tm_year:04d}-{d.tm_mon:02d}-{d.tm_mday:02d}';qty=(i%3)+1
 sessions.append({'id':f's{i}','date':date,'timestamp':ts,'categoryId':item['categoryId'],'targetAmount':1,'actualAmount':qty,'minutes':qty*24,'status':'logged','source':'manual','note':f'{item["title"]} x{qty}' if qty>1 else item['title'],'titles':[{'title':item['title'],'libraryId':item['id'],'qty':qty,'repeat':False}]})
state={'categories':cats,'categoryOrder':[c['id'] for c in cats],'library':lib,'sessions':sessions,'settings':{'theme':'light','historyPageSize':10,'backup':{'enabled':False,'interval':60,'mode':'single','folderName':'','fileName':'mediaflow-backup.json'},'leveling':{'enabled':True,'minuteXP':1,'unitXP':{'episodes':10,'chapters':3},'rotationMultiplier':{'neglected':2,'due':1.5,'healthy':1,'overused':0.5},'libraryAdditionXP':25,'completionXP':50}},'activityLog':[],'currentTask':None,'sessionActive':False,'orderPlan':{},'xpLedger':{'libraryAdditions':{}},'completionTimeline':[]}
setup=f'''() => {{
 const store={{}};const fakeStore={{getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{{store[k]=String(v)}},removeItem:k=>{{delete store[k]}},clear:()=>{{for(const k of Object.keys(store))delete store[k]}},key:i=>Object.keys(store)[i]||null,get length(){{return Object.keys(store).length}}}};
 Object.defineProperty(window,'localStorage',{{value:fakeStore,configurable:true}});Object.defineProperty(window,'sessionStorage',{{value:fakeStore,configurable:true}});
 const user={{id:'v273-smoke',email:'smoke@example.com',created_at:new Date().toISOString(),user_metadata:{{display_name:'Alex'}}}};let cloud={json.dumps(state,separators=(',',':'))};
 const q={{select(){{return q}},eq(){{return q}},maybeSingle:async()=>({{data:{{state_data:cloud,updated_at:new Date().toISOString()}},error:null}}),upsert:async(row)=>{{cloud=row.state_data;return {{data:null,error:null}}}},delete(){{return q}}}};
 const client={{auth:{{getSession:async()=>({{data:{{session:{{user}}}}}}),onAuthStateChange:()=>({{data:{{subscription:{{unsubscribe(){{}}}}}}}}),getUser:async()=>({{data:{{user}}}}),signOut:async()=>({{}})}},from:()=>q}};window.supabase={{createClient(){{return client;}}}};window.confirm=()=>true;window.alert=()=>{{}};window.prompt=()=>null;
}}'''
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
if not chromium: print('Chromium not found');sys.exit(1)
errors=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':900})
 page.on('pageerror',lambda e: errors.append(str(e)))
 page.set_content('<!doctype html><html><head></head><body><div id="app"></div></body></html>')
 page.add_style_tag(content=css);page.evaluate(setup);page.add_script_tag(content=bundle);page.wait_for_timeout(1200)
 page.evaluate("App.setView('history')");page.wait_for_timeout(150);page.evaluate("App.v260SetHistoryTab('logs')");page.wait_for_timeout(150)
 logs=page.evaluate('''()=>({
   rows:document.querySelectorAll('.mf271-logs .mf272-log-row').length,
   cards:document.querySelectorAll('.mf271-logs .mf272-log-title-card').length,
   covers:document.querySelectorAll('.mf271-logs .mf272-log-title-cover').length,
   fallbacks:document.querySelectorAll('.mf271-logs .mf272-log-title-cover-fallback').length,
   oldIcons:document.querySelectorAll('.mf271-logs .mf272-log-row>.hist-icon').length,
   duplicateNotes:[...document.querySelectorAll('.mf271-logs .mf272-log-row')].filter(r=>{const t=r.querySelector('.mf272-log-title-copy b')?.textContent?.trim();const n=r.querySelector('.hist-note')?.textContent?.replace(/[\"“”']/g,'').trim();return t&&n&&n.toLowerCase().startsWith(t.toLowerCase())}).length,
   scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth
 })''')
 cover=page.evaluate('''()=>{App.v181SetCoverSize('historyLogs',135);const a=App.v272AuditState();return {...a,var:getComputedStyle(document.documentElement).getPropertyValue('--v181-cover-history-logs').trim(),width:document.querySelector('.mf272-log-title-cover')?.getBoundingClientRect().width||0};}''')
 page.evaluate("App.openLibraryModal('i1')");page.wait_for_timeout(120)
 modal=page.evaluate('''()=>{const h=document.querySelector('.mf272-edit-title-head'),t=h?.querySelector('.modal-title'),d=h?.querySelector('.mf272-edit-title-delete');if(!h||!t||!d)return null;const hr=h.getBoundingClientRect(),tr=t.getBoundingClientRect(),dr=d.getBoundingClientRect(),cs=getComputedStyle(t);return {title:t.textContent.trim(),deleteText:d.textContent.trim(),head:{x:hr.x,y:hr.y,w:hr.width,h:hr.height},titleRect:{x:tr.x,y:tr.y,w:tr.width,h:tr.height},deleteRect:{x:dr.x,y:dr.y,w:dr.width,h:dr.height},overlap:!(tr.right<=dr.left||dr.right<=tr.left||tr.bottom<=dr.top||dr.bottom<=tr.top),position:cs.position,whiteSpace:cs.whiteSpace};}''')
 page.set_viewport_size({'width':360,'height':760});page.evaluate("App.closeModal();App.setView('history');App.v260SetHistoryTab('logs')");page.wait_for_timeout(120)
 mobile=page.evaluate('''()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,cards:document.querySelectorAll('.mf272-log-title-card').length})''')
 browser.close()

result={'logs':logs,'cover':cover,'modal':modal,'mobile':mobile,'errors':errors}
print(json.dumps(result,indent=2))
checks=[
 not errors,logs['rows']>0,logs['cards']>=logs['rows'],logs['covers']>=logs['rows'],logs['fallbacks']>0,logs['oldIcons']==0,logs['duplicateNotes']==0,logs['scrollWidth']<=logs['clientWidth']+2,
 cover['version']==272,cover['historyLogsCoverSize']==135,cover['snapshotHistoryLogsCoverSize']==135,cover['presetHistoryLogsCoverSize']==135,float(cover['var'])>1.3,cover['width']>60,
 modal is not None,modal['title']=='Edit title',modal['deleteText']=='Delete title',not modal['overlap'],modal['position']=='static',modal['whiteSpace']=='nowrap',
 mobile['scrollWidth']<=mobile['clientWidth']+2,mobile['cards']>0
]
if not all(checks):
 print('SMOKE V272 FAILED',checks);sys.exit(1)
print('SMOKE V272 OK')
