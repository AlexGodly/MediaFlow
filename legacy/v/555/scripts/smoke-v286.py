#!/usr/bin/env python3
from pathlib import Path
import json,shutil,sys
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
bundle=(ROOT/'assets/js/mediaflow-v286.bundle.js').read_text(encoding='utf-8')
initial={
 'categories':[{'id':'testcat','name':'Test Cat','icon':'✨','type':'video','unit':'episodes','target':1,'weight':3,'minutesPerUnit':25,'color':'#7C5CFC','seasonal':False,'enabled':True,'custom':True}],
 'categoryOrder':['testcat'],'library':[],'sessions':[],'settings':{'categoryOrder':['testcat'],'v181Logging':{'defaultMode':'amount','modifiedAt':1}},'currentTask':{'id':'task-v286','categoryId':'testcat','low':1,'high':1,'targetMid':1,'unit':'episodes','createdAt':1,'reasons':['test']},'sessionActive':True,'profilePicture':'','activityLog':[],'migrations':{},'savedAt':1
}
def setup_script(state):
    return f'''() => {{
      const store={{}};const fake={{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k],clear(){{}},key:i=>Object.keys(store)[i]||null,get length(){{return Object.keys(store).length}}}};
      Object.defineProperty(window,'localStorage',{{configurable:true,value:fake}});Object.defineProperty(window,'sessionStorage',{{configurable:true,value:fake}});
      const user={{id:'v286-user',email:'alex@example.test',created_at:new Date().toISOString(),user_metadata:{{display_name:'Alex'}}}};
      let cloud={json.dumps(state,separators=(',',':'))};
      const q={{select(){{return q}},eq(){{return q}},maybeSingle:async()=>({{data:{{state_data:cloud,updated_at:new Date().toISOString()}},error:null}}),upsert:async(row)=>{{cloud=row.state_data;return {{error:null}}}},delete(){{return q}}}};
      window.supabase={{createClient:()=>({{auth:{{getSession:()=>new Promise(r=>setTimeout(()=>r({{data:{{session:{{user}}}}}}),80)),onAuthStateChange:()=>({{data:{{subscription:{{unsubscribe(){{}}}}}}}}),getUser:async()=>({{data:{{user}},error:null}})}},from:()=>q}})}};
      window.confirm=()=>true;window.alert=()=>{{}};window.prompt=()=>null;window.__cloudState=()=>cloud;
    }}'''

def boot(browser,state):
    page=browser.new_page(viewport={'width':1440,'height':900})
    errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
    page.set_content('<!doctype html><html><body><div id="app"></div></body></html>')
    page.evaluate(setup_script(state));page.add_script_tag(content=bundle);page.wait_for_timeout(1300)
    if errs: raise AssertionError(errs)
    return page

chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
    page=boot(b,initial)
    page.evaluate("App.setView('settings')");page.wait_for_timeout(100);page.evaluate("App.openCategoryModal('testcat')");page.wait_for_timeout(50)
    before=page.locator('#m-mpu').input_value()
    page.locator('#m-name').fill('Test Cat Updated');page.locator('#m-target').fill('3');page.locator('#m-mpu').fill('30')
    page.get_by_role('button',name='Save category').click();page.wait_for_timeout(650)
    same=page.evaluate("App.v286CategoryPersistenceAudit('testcat')")
    page.evaluate("App.openCategoryModal('testcat')");page.wait_for_timeout(50)
    reopened=(page.locator('#m-name').input_value(),page.locator('#m-target').input_value(),page.locator('#m-mpu').input_value())
    page.evaluate('App.closeModal()');cloud=page.evaluate('window.__cloudState()');page.close()
    fresh=boot(b,cloud);fresh.evaluate("App.setView('settings')");fresh.wait_for_timeout(100);fresh.evaluate("App.openCategoryModal('testcat')");fresh.wait_for_timeout(50)
    freshvals=(fresh.locator('#m-name').input_value(),fresh.locator('#m-target').input_value(),fresh.locator('#m-mpu').input_value())
    freshaudit=fresh.evaluate("App.v286CategoryPersistenceAudit('testcat')")
    fresh.evaluate("App.setView('dashboard'); App.openLogForm()");fresh.wait_for_timeout(100)
    logging_minutes=fresh.locator('#log-minutes').input_value()
    fresh.evaluate('App.cancelLogForm()')
    add_visible=True
    b.close()
res={'before':before,'sameClient':same,'reopened':reopened,'freshClient':freshaudit,'freshValues':freshvals,'savedCategoryVisible':add_visible,'oneEpisodeMinutes':int(logging_minutes),'runtimeMinutesPerUnit':freshaudit['runtimeMinutesPerUnit']}
print(json.dumps(res,indent=2))
ok=(before=='25' and same['cacheCoherent'] and same['runtimeMinutesPerUnit']==30 and reopened==('Test Cat Updated','3','30') and freshvals==('Test Cat Updated','3','30') and freshaudit['cacheCoherent'] and freshaudit['runtimeMinutesPerUnit']==30 and logging_minutes=='30' and add_visible)
if not ok: sys.exit(1)
print('SMOKE V286 OK')
