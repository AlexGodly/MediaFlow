#!/usr/bin/env python3
from pathlib import Path
import json,re,shutil,sys
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
index=(ROOT/'index.html').read_text(encoding='utf-8')
css='\n'.join((ROOT/p).read_text(encoding='utf-8') for p in re.findall(r'<link rel="stylesheet" href="([^"]+\.css)"',index) if (ROOT/p).exists())
bundle=(ROOT/'assets/js/mediaflow-v282.bundle.js').read_text(encoding='utf-8')
cats=[{'id':'anime','name':'Anime','icon':'🎬','type':'video','unit':'episodes','target':4,'weight':4,'minutesPerUnit':24,'color':'#d746ff','enabled':True},{'id':'tv','name':'TV','icon':'📺','type':'video','unit':'episodes','target':2,'weight':3,'minutesPerUnit':45,'color':'#39c98a','enabled':True}]
lib=[{'id':f'i{i}','title':f'Title {i}','categoryId':'anime' if i<120 else 'tv','progress':i%12,'total':12,'status':'active','priority':'medium','coverUrl':'','rating':8.2} for i in range(200)]
state={'categories':cats,'categoryOrder':['anime','tv'],'library':lib,'sessions':[],'collections':[{'id':'c1','title':'One','description':'','coverUrl':'','titleIds':['i1','i2'],'order':['i1','i2'],'autoBackground':True,'createdAt':1,'updatedAt':1,'lastViewedAt':0},{'id':'c2','title':'Two','description':'','coverUrl':'','titleIds':['i3'],'order':['i3'],'autoBackground':True,'createdAt':2,'updatedAt':2,'lastViewedAt':0}],'collectionTombstones':[],'settings':{'theme':'light','v274Collections':{'browserView':'compact','detailView':'cards','pageSize':50,'toolsVisible':True},'sidebarCollapsed':False},'navLayout':{'version':1,'order':['dashboard','library','order','oldsystem','history','batch','stats','profile','settings','about','collections'],'hiddenIds':[],'modifiedAt':0},'activityLog':[],'currentTask':None,'sessionActive':False,'orderPlan':{},'xpLedger':{'libraryAdditions':{}},'completionTimeline':[]}
setup=f'''() => {{ const store={{}};const fake={{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k],clear(){{}},key:i=>Object.keys(store)[i]||null,get length(){{return Object.keys(store).length}}}};Object.defineProperty(window,'localStorage',{{value:fake}});Object.defineProperty(window,'sessionStorage',{{value:fake}});const user={{id:'v282',email:'x@y.test',created_at:new Date().toISOString(),user_metadata:{{}}}};let cloud={json.dumps(state,separators=(',',':'))};const q={{select(){{return q}},eq(){{return q}},maybeSingle:async()=>({{data:{{state_data:cloud,updated_at:new Date().toISOString()}},error:null}}),upsert:async(row)=>{{cloud=row.state_data;return {{error:null}}}},delete(){{return q}}}};window.supabase={{createClient:()=>({{auth:{{getSession:async()=>({{data:{{session:{{user}}}}}}),onAuthStateChange:()=>({{data:{{subscription:{{unsubscribe(){{}}}}}}}})}},from:()=>q}})}};window.confirm=()=>true;window.alert=()=>{{}};window.prompt=()=>null; }}'''
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
errors=[]
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':900});page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content('<!doctype html><html><body><div id="app"></div></body></html>');page.add_style_tag(content=css);page.evaluate(setup);page.add_script_tag(content=bundle);page.wait_for_timeout(1200)
 nav=page.evaluate("()=>({order:[...document.querySelectorAll('.sidebar .nav-item')].map(x=>x.dataset.view).slice(0,4),bound:document.querySelector('.sidebar .brand')?.dataset?.mf266Bound||'',audit:App.v282AuditState()})")
 page.evaluate("App.setView('settings')");page.wait_for_timeout(100);page.evaluate("App.openCategoryModal('anime')");page.wait_for_timeout(30)
 cat=page.evaluate("()=>{const ed=document.querySelector('.mf282-category-editor');const modal=ed?.closest('.modal');return {exists:!!ed,overflow:ed?getComputedStyle(ed).overflowY:'',maxH:modal?getComputedStyle(modal).maxHeight:''}}")
 page.evaluate("App.closeModal();App.setView('collections')");page.wait_for_timeout(100)
 batch0=page.locator('.mf282-collections-batchbar').count();page.evaluate("App.v282SetCollectionBatchMode(true)");page.wait_for_timeout(50)
 checks=page.locator('.mf282-batch-checkbox input').count();page.locator('.mf282-batch-checkbox input').first.check();page.wait_for_timeout(50)
 batch1=page.evaluate("()=>({selected:document.querySelector('.mf282-collections-batchbar b')?.textContent||'',deleteDisabled:document.querySelector('.mf282-collections-batchbar .btn-danger')?.disabled})")
 compact=page.evaluate("()=>{const x=document.querySelector('.mf280-browser-compact-progress'),t=document.querySelector('.mf280-browser-compact-progress-track');return {grid:x?getComputedStyle(x).gridTemplateColumns:'',track:t?.getBoundingClientRect().width||0}}")
 b.close()
res={'errors':errors,'nav':nav,'category':cat,'batch0':batch0,'checkboxes':checks,'batch1':batch1,'compact':compact};print(json.dumps(res,indent=2))
ok=not errors and nav['order'][:3]==['dashboard','library','collections'] and nav['bound']=='1' and cat['exists'] and cat['overflow'] in ('auto','scroll') and batch0==1 and checks==2 and batch1['selected'].startswith('1 selected') and not batch1['deleteDisabled'] and compact['track']>100
if not ok:sys.exit(1)
print('SMOKE V282 OK')
