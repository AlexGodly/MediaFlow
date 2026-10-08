#!/usr/bin/env python3
from pathlib import Path
import json,re,sys,shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
index=(ROOT/'index.html').read_text(encoding='utf-8')
css_paths=re.findall(r'<link rel="stylesheet" href="([^"]+\.css)"',index)
css='\n'.join((ROOT/p).read_text(encoding='utf-8') for p in css_paths if (ROOT/p).exists())
bundle=(ROOT/'assets/js/mediaflow-v262.bundle.js').read_text(encoding='utf-8')
setup=r'''() => {
 const store={};const fakeStore={getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},clear:()=>{for(const k of Object.keys(store))delete store[k]},key:i=>Object.keys(store)[i]||null,get length(){return Object.keys(store).length}};
 Object.defineProperty(window,'localStorage',{value:fakeStore,configurable:true});Object.defineProperty(window,'sessionStorage',{value:fakeStore,configurable:true});
 const user={id:'v262-smoke',email:'v262@example.com',created_at:new Date().toISOString(),user_metadata:{display_name:'Alex'}};
 const db=()=>{const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:null,error:null}),upsert:async()=>({data:null,error:null}),delete(){return q}};return q};
 const client={auth:{getSession:async()=>({data:{session:{user}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),getUser:async()=>({data:{user}}),signOut:async()=>({})},from:db};
 window.supabase={createClient(){return client;}};window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>null;
}'''
errors=[];results={}
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':1000});page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content('<!doctype html><html><head></head><body><div id="app"></div></body></html>');page.add_style_tag(content=css);page.evaluate(setup);page.add_script_tag(content=bundle);page.wait_for_timeout(1200)
 results['runtime']=page.evaluate('()=>window.MediaFlowRuntime?.version||0')
 page.evaluate("()=>App.setView('library')");page.wait_for_timeout(180)
 results['normal_tools']=page.locator('.mf262-library-tools').count()==1
 results['normal_dock']=page.locator('.mf262-library-filter-dock').count()==1
 results['status_row']=page.locator('.mf262-status-row').count()==1
 results['category_row']=page.locator('.mf262-category-row').count()==1
 results['no_v261_wrapper']=page.locator('.v261-library-page,.v261-library-sticky,.v261-library-tools').count()==0
 results['tools_before_dock']=page.evaluate('''()=>{const a=document.querySelector('.mf262-library-tools'),b=document.querySelector('.mf262-library-filter-dock');return !!(a&&b&&(a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING));}''')
 results['cover_filter_reliable']=('item?.poster' in bundle and 'item?.imageUrl' in bundle and 'v224LibraryHasCover=function' in bundle)
 page.evaluate("()=>App.v262ToggleLibraryTools()");page.wait_for_timeout(30)
 results['collapse']=page.locator('#view-root').evaluate("e=>e.classList.contains('mf262-tools-collapsed')")
 page.evaluate("()=>App.v181SetLibraryMode('dynamic')");page.wait_for_timeout(180)
 results['dynamic_tools']=page.locator('.mf262-library-tools').count()==1
 results['dynamic_nav']=page.locator('.v181-dynamic-nav').count()==1
 results['dynamic_rows']=page.locator('.v181-dynamic-nav .v181-dynamic-row').count()>=2
 results['dynamic_no_v261']=page.locator('.v261-library-sticky,.v261-library-tools').count()==0
 overflow=[]
 for w in [1440,1024,820,390,320,280]:
  page.set_viewport_size({'width':w,'height':900});page.evaluate("()=>App.setView('library')");page.wait_for_timeout(40)
  dims=page.evaluate('()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,bw:document.body.scrollWidth,iw:innerWidth})')
  if dims['sw']>dims['cw']+2 or dims['bw']>dims['iw']+2: overflow.append([w,dims])
 results['overflow']=overflow
 browser.close()
required=(results['runtime']==262 and results['normal_tools'] and results['normal_dock'] and results['status_row'] and results['category_row'] and results['no_v261_wrapper'] and results['tools_before_dock'] and results['cover_filter_reliable'] and results['collapse'] and results['dynamic_tools'] and results['dynamic_nav'] and results['dynamic_rows'] and results['dynamic_no_v261'] and not results['overflow'])
print(json.dumps(results,indent=2))
if errors: print('PAGE ERRORS:',errors)
if not required or errors: print('SMOKE V262 FAILED');sys.exit(1)
print('SMOKE V262 OK')
