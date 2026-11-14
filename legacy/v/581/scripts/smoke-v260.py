#!/usr/bin/env python3
from pathlib import Path
import json,re,sys,shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
index=(ROOT/'index.html').read_text(encoding='utf-8')
css_paths=re.findall(r'<link rel="stylesheet" href="([^"]+\.css)"',index)
css='\n'.join((ROOT/p).read_text(encoding='utf-8') for p in css_paths if (ROOT/p).exists())
bundle=(ROOT/'assets/js/mediaflow-v260.bundle.js').read_text(encoding='utf-8')
react_ui=(ROOT/'assets/js/mediaflow-v260-react-ui.js').read_text(encoding='utf-8')
setup=r'''() => {
 const store={};
 const fakeStore={getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},clear:()=>{for(const k of Object.keys(store))delete store[k]},key:i=>Object.keys(store)[i]||null,get length(){return Object.keys(store).length}};
 Object.defineProperty(window,'localStorage',{value:fakeStore,configurable:true});
 Object.defineProperty(window,'sessionStorage',{value:fakeStore,configurable:true});
 const user={id:'v260-smoke',email:'v260@example.com',created_at:new Date().toISOString(),user_metadata:{display_name:'Alex'}};
 const db=()=>{const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:null,error:null}),upsert:async()=>({data:null,error:null}),delete(){return q}};return q};
 const client={auth:{getSession:async()=>({data:{session:{user}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),getUser:async()=>({data:{user}}),signOut:async()=>({})},from:db};
 window.supabase={createClient(){return client;}};
 window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>null;
}'''
errors=[];results={}
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':1050})
 page.on('pageerror',lambda e: errors.append(str(e)))
 page.set_content('<!doctype html><html><head></head><body><div id="app"></div></body></html>')
 page.add_style_tag(content=css)
 page.evaluate(setup)
 page.add_script_tag(content=bundle)
 page.wait_for_timeout(1200)
 results['runtime']=page.evaluate('()=>window.MediaFlowRuntime?.version||0')
 results['bridge']=page.evaluate('()=>window.MediaFlowV260Bridge?.version||0')
 results['shell']=page.locator('.sidebar').count()==1 and page.locator('#v260-react-host').count()==1
 results['library_history_hidden']=page.locator('.nav-item[data-view="libraryhistory"]').count()==0
 page.evaluate("()=>App.setView('history')");page.wait_for_timeout(160)
 results['history_tabs']=page.locator('.v260-history-tab').count()
 results['history_tab_names']=[x.strip() for x in page.locator('.v260-history-tab').all_text_contents()]
 for tab in ['consumption','recent','ratings','library']:
  page.evaluate(f"()=>App.v260SetHistoryTab('{tab}')");page.wait_for_timeout(80)
  results[f'history_{tab}']=page.locator(f'.v260-history-body[data-history-view="{tab}"]').count()==1
 overflow=[]
 for w in [1440,1024,820,390,320,280]:
  page.set_viewport_size({'width':w,'height':900})
  for view in ['dashboard','library','history','batch','stats','profile','settings']:
   page.evaluate(f"()=>App.setView('{view}')");page.wait_for_timeout(35)
   dims=page.evaluate('()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,bw:document.body.scrollWidth,iw:innerWidth})')
   if dims['sw']>dims['cw']+2 or dims['bw']>dims['iw']+2:overflow.append([w,view,dims])
 results['overflow']=overflow
 page.set_viewport_size({'width':1440,'height':1000});page.evaluate("()=>App.setView('history')");page.wait_for_timeout(100);page.screenshot(path=str(ROOT/'v260-history-preview.png'),full_page=True)
 page.evaluate("()=>App.setView('dashboard')");page.wait_for_timeout(100);page.screenshot(path=str(ROOT/'v260-dashboard-preview.png'),full_page=True)
 browser.close()
required=(results['runtime']==260 and results['bridge']==260 and results['shell'] and results['library_history_hidden'] and results['history_tabs']==4 and all(results.get(f'history_{x}') for x in ['consumption','recent','ratings','library']) and not results['overflow'])
print(json.dumps(results,indent=2))
if errors:print('PAGE ERRORS:',errors)
if not required or errors:print('SMOKE V260 FAILED');sys.exit(1)
print('SMOKE V260 OK')
