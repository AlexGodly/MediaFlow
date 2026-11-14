#!/usr/bin/env python3
from pathlib import Path
import json,re,shutil,sys
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
index=(ROOT/'index.html').read_text(encoding='utf-8')
css='\n'.join((ROOT/p).read_text(encoding='utf-8') for p in re.findall(r'<link rel="stylesheet" href="([^"]+\.css)"',index) if (ROOT/p).exists())
bundle=(ROOT/'assets/js/mediaflow-v283.bundle.js').read_text(encoding='utf-8')
cats=[
 {'id':'anime','name':'Anime','icon':'🎬','type':'video','unit':'episodes','target':4,'weight':4,'minutesPerUnit':24,'color':'#d746ff','enabled':True},
 {'id':'tv','name':'TV','icon':'📺','type':'video','unit':'episodes','target':2,'weight':3,'minutesPerUnit':45,'color':'#39c98a','enabled':True}
]
lib=[{'id':f'i{i}','title':f'Title {i}','categoryId':'anime' if i<20 else 'tv','progress':i%12,'total':12,'status':'active','priority':'medium','coverUrl':'','rating':8.2} for i in range(40)]
state={
 'categories':cats,'categoryOrder':['anime','tv'],'library':lib,'sessions':[],
 'collections':[{'id':'c1','title':'test','description':'No description yet.','coverUrl':'','titleIds':[f'i{i}' for i in range(24)],'order':[f'i{i}' for i in range(24)],'autoBackground':True,'createdAt':1,'updatedAt':1,'lastViewedAt':0}],
 'collectionTombstones':[],
 'settings':{'theme':'light','v274Collections':{'browserView':'cards','detailView':'cards','pageSize':50,'toolsVisible':True},'sidebarCollapsed':False},
 'navLayout':{'version':1,'order':['dashboard','library','collections','order','oldsystem','history','batch','stats','profile','settings','about'],'hiddenIds':[],'modifiedAt':0},
 'activityLog':[],'currentTask':None,'sessionActive':False,'orderPlan':{},'xpLedger':{'libraryAdditions':{}},'completionTimeline':[]
}
setup=f'''() => {{ const store={{}};const fake={{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k],clear(){{}},key:i=>Object.keys(store)[i]||null,get length(){{return Object.keys(store).length}}}};Object.defineProperty(window,'localStorage',{{value:fake}});Object.defineProperty(window,'sessionStorage',{{value:fake}});const user={{id:'v283',email:'x@y.test',created_at:new Date().toISOString(),user_metadata:{{}}}};let cloud={json.dumps(state,separators=(',',':'))};const q={{select(){{return q}},eq(){{return q}},maybeSingle:async()=>({{data:{{state_data:cloud,updated_at:new Date().toISOString()}},error:null}}),upsert:async(row)=>{{cloud=row.state_data;return {{error:null}}}},delete(){{return q}}}};window.supabase={{createClient:()=>({{auth:{{getSession:async()=>({{data:{{session:{{user}}}}}}),onAuthStateChange:()=>({{data:{{subscription:{{unsubscribe(){{}}}}}}}})}},from:()=>q}})}};window.confirm=()=>true;window.alert=()=>{{}};window.prompt=()=>null; }}'''
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
errors=[]
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':900})
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content('<!doctype html><html><body><div id="app"></div></body></html>')
 page.add_style_tag(content=css);page.evaluate(setup);page.add_script_tag(content=bundle);page.wait_for_timeout(1200)
 # First-load sidebar: click immediately, without changing page.
 before=page.evaluate("()=>document.body.classList.contains('mf265-sidebar-collapsed')")
 page.locator('.sidebar .brand').click();page.wait_for_timeout(30)
 after=page.evaluate("()=>document.body.classList.contains('mf265-sidebar-collapsed')")
 # Category Cancel must directly close.
 page.evaluate("App.setView('settings')");page.wait_for_timeout(80);page.evaluate("App.openCategoryModal('anime')");page.wait_for_timeout(20)
 page.locator('.mf282-category-editor .modal-actions .btn-ghost').click();page.wait_for_timeout(20)
 cancel_closed=page.locator('#modal-root').count()==0
 # Save must work and close, not remain disabled/stranded.
 page.evaluate("App.openCategoryModal('anime')");page.wait_for_timeout(20)
 page.locator('#m-name').fill('Anime Prime')
 page.locator('.mf282-category-editor .modal-actions .btn-primary').click();page.wait_for_timeout(80)
 save_state={'closed':page.locator('#modal-root').count()==0,'name':page.locator('.cat-manage-row[data-category-id=\"anime\"] .name').first.inner_text().split('\n')[0].strip()}
 # Add + save temporary category, then delete and ensure delete modal disappears.
 page.evaluate("App.openCategoryModal()");page.wait_for_timeout(20);page.locator('#m-name').fill('TempDelete');page.locator('.mf282-category-editor .modal-actions .btn-primary').click();page.wait_for_timeout(60)
 temp_row=page.locator('.cat-manage-row').filter(has_text='TempDelete').first
 temp_id=temp_row.get_attribute('data-category-id') or ''
 page.evaluate("id=>App.deleteCategory(id)",temp_id);page.wait_for_timeout(20)
 page.locator('#modal-root .btn-danger').click();page.wait_for_timeout(80)
 delete_state={'closed':page.locator('#modal-root').count()==0,'exists':page.locator(f'.cat-manage-row[data-category-id=\"{temp_id}\"]').count()>0}
 # Clear category cancel must close instantly.
 page.evaluate("App.v197OpenCategoryClear('anime')");page.wait_for_timeout(20)
 page.locator('#modal-root .btn-ghost').click();page.wait_for_timeout(20)
 clear_cancel_closed=page.locator('#modal-root').count()==0
 # Collection Card typography: label and title must occupy separate vertical lines.
 page.evaluate("App.setView('collections');App.v274SetBrowserView('cards')");page.wait_for_timeout(100)
 card=page.evaluate("()=>{const copy=document.querySelector('.mf274-browser-card-copy'),k=copy?.querySelector('.mf274-kicker'),t=copy?.querySelector('.mf274-title-link');if(!copy||!k||!t)return null;const kr=k.getBoundingClientRect(),tr=t.getBoundingClientRect();return {display:getComputedStyle(copy).display,gap:parseFloat(getComputedStyle(copy).rowGap)||0,kBottom:kr.bottom,tTop:tr.top,titleSize:parseFloat(getComputedStyle(t).fontSize)||0,title:t.textContent.trim()};}")
 audit=page.evaluate("()=>App.v283AuditState()")
 b.close()
res={'errors':errors,'sidebar':{'before':before,'after':after},'cancelClosed':cancel_closed,'save':save_state,'delete':delete_state,'clearCancelClosed':clear_cancel_closed,'card':card,'audit':audit}
print(json.dumps(res,indent=2))
ok=(not errors and before is False and after is True and cancel_closed and save_state['closed'] and save_state['name']=='Anime Prime' and delete_state['closed'] and not delete_state['exists'] and clear_cancel_closed and card and card['display']=='grid' and card['tTop']>=card['kBottom'] and card['titleSize']>=14 and audit['version']==283 and audit['sidebarFirstLoadDelegation'])
if not ok: sys.exit(1)
print('SMOKE V283 OK')
