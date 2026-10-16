#!/usr/bin/env python3
from pathlib import Path
import json,re,sys,shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
index=(ROOT/'index.html').read_text(encoding='utf-8')
css_paths=re.findall(r'<link rel="stylesheet" href="([^"]+\.css)"',index)
css='\n'.join((ROOT/p).read_text(encoding='utf-8') for p in css_paths if (ROOT/p).exists())
bundle=(ROOT/'assets/js/mediaflow-v261.bundle.js').read_text(encoding='utf-8')
setup=r'''() => {
 const store={};
 const fakeStore={getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},clear:()=>{for(const k of Object.keys(store))delete store[k]},key:i=>Object.keys(store)[i]||null,get length(){return Object.keys(store).length}};
 Object.defineProperty(window,'localStorage',{value:fakeStore,configurable:true});Object.defineProperty(window,'sessionStorage',{value:fakeStore,configurable:true});
 const user={id:'v261-smoke',email:'v261@example.com',created_at:new Date().toISOString(),user_metadata:{display_name:'Alex'}};
 const db=()=>{const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:null,error:null}),upsert:async()=>({data:null,error:null}),delete(){return q}};return q};
 const client={auth:{getSession:async()=>({data:{session:{user}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),getUser:async()=>({data:{user}}),signOut:async()=>({})},from:db};
 window.supabase={createClient(){return client;}};window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>null;
}'''
errors=[];results={}
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':1000});page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content('<!doctype html><html><head></head><body><div id="app"></div></body></html>');page.add_style_tag(content=css);page.evaluate(setup);page.add_script_tag(content=bundle);page.wait_for_timeout(1500)
 results['runtime']=page.evaluate('()=>window.MediaFlowRuntime?.version||0')
 page.evaluate("()=>App.setView('library')");page.wait_for_timeout(150)
 results['library_sticky']=page.locator('.v261-library-sticky').count()==1
 results['library_tools']=page.locator('.v261-library-tools').count()==1
 results['search_full_row']=page.locator('.v261-library-search').count()==1
 page.evaluate("()=>App.setView('history')");page.wait_for_timeout(100)
 results['history_tabs']=page.locator('.v260-history-tab').count()
 page.evaluate("()=>App.v260SetHistoryTab('ratings')");page.wait_for_timeout(80)
 results['ratings']=page.locator('.v261-ratings-table').count()==1
 page.evaluate("()=>App.v260SetHistoryTab('recent')");page.wait_for_timeout(80)
 results['recent']=page.locator('.v261-history-toolbar').count()==1
 page.evaluate("()=>App.setView('dashboard')");page.wait_for_timeout(100)
 results['balance']=page.locator('.v261-balance-card').count()==1
 page.evaluate("()=>App.setView('order')");page.wait_for_timeout(80)
 results['order_no_edge_icons']='«' not in page.locator('.container').inner_text() and '»' not in page.locator('.container').inner_text()
 overflow=[]
 for w in [1440,1024,820,390,320,280]:
  page.set_viewport_size({'width':w,'height':900})
  for view in ['dashboard','library','history','order','batch','stats','profile','settings']:
   page.evaluate(f"()=>App.setView('{view}')");page.wait_for_timeout(30)
   dims=page.evaluate('()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,bw:document.body.scrollWidth,iw:innerWidth})')
   if dims['sw']>dims['cw']+2 or dims['bw']>dims['iw']+2: overflow.append([w,view,dims])
 results['overflow']=overflow
 browser.close()
required=(results['runtime']==261 and results['library_sticky'] and results['library_tools'] and results['search_full_row'] and results['history_tabs']==4 and results['ratings'] and results['recent'] and results['balance'] and results['order_no_edge_icons'] and not results['overflow'])
print(json.dumps(results,indent=2))
if errors: print('PAGE ERRORS:',errors)
if not required or errors: print('SMOKE V261 FAILED');sys.exit(1)
print('SMOKE V261 OK')
