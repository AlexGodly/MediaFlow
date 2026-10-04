#!/usr/bin/env python3
from pathlib import Path
import json, shutil, sys

ROOT=Path(__file__).resolve().parents[1]
BUNDLE=ROOT/'assets/js/mediaflow-v219.bundle.js'
try:
    from playwright.sync_api import sync_playwright
except Exception as e:
    print('SMOKE FAILED: Playwright is not installed:', e)
    sys.exit(1)

chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
if not chromium:
    print('SMOKE FAILED: Chromium executable not found')
    sys.exit(1)

bundle=BUNDLE.read_text(encoding='utf-8')
setup_js=r'''() => {
 const store={};
 const fakeStore={
   getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,
   setItem:(k,v)=>{store[k]=String(v)}, removeItem:k=>{delete store[k]},
   clear:()=>{for(const k of Object.keys(store))delete store[k]},
   key:i=>Object.keys(store)[i]||null,
   get length(){return Object.keys(store).length}
 };
 Object.defineProperty(window,'localStorage',{value:fakeStore,configurable:true});
 Object.defineProperty(window,'sessionStorage',{value:fakeStore,configurable:true});
 const user={id:'smoke-user',email:'smoke@example.com',created_at:new Date().toISOString(),user_metadata:{display_name:'Smoke Test'}};
 const db=()=>{const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:null,error:null}),upsert:async()=>({data:null,error:null}),delete(){return q}};return q};
 const client={auth:{getSession:async()=>({data:{session:{user}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),getUser:async()=>({data:{user}}),signOut:async()=>({})},from:db};
 window.supabase={createClient(){return client;}};
 window.confirm=()=>true; window.alert=()=>{}; window.prompt=()=>null;
}'''

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True, executable_path=chromium, args=['--no-sandbox'])
    page=browser.new_page()
    errors=[]
    page.on('pageerror', lambda exc: errors.append(str(exc)))
    page.set_content('<!doctype html><html><body><div id="app"></div></body></html>')
    page.evaluate(setup_js)
    page.add_script_tag(content=bundle)
    page.wait_for_timeout(900)
    page.evaluate("()=>App.setView('settings')")
    page.wait_for_timeout(350)
    result=page.evaluate(r'''() => ({
      runtimeVersion:window.MediaFlowRuntime?.version||0,
      settingsRegistered:window.MediaFlowRuntime?.hasPageRenderer?.('settings')===true,
      settingsPage:!!document.querySelector('.v219-settings-page'),
      searchExists:!!document.getElementById('v219-settings-search'),
      navGroups:document.querySelectorAll('.v219-settings-nav-group').length,
      navItems:document.querySelectorAll('.v219-settings-nav-item').length,
      resetButtons:document.querySelectorAll('.v219-setting-reset,.v219-section-reset').length,
      restoreAllExists:[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Restore all defaults')
    })''')
    search=page.evaluate(r'''() => {
      const before=[...document.querySelectorAll('.v219-settings-nav-item')].filter(b=>!b.classList.contains('v219-settings-hidden')).length;
      App.v219SearchSettings('cover');
      const after=[...document.querySelectorAll('.v219-settings-nav-item')].filter(b=>!b.classList.contains('v219-settings-hidden')).length;
      return {before,after,searchFilters:after>0&&after<before};
    }''')
    result.update(search)
    page.evaluate("()=>App.v219ClearSettingsSearch()")
    page.evaluate("()=>App.updateSetting('dailyMinutes',999)")
    page.wait_for_timeout(250)
    result['changedSetting']=page.evaluate("()=>window.MediaFlowRuntime.getSettings().dailyMinutes===999")
    page.evaluate("()=>App.v219ResetSettingPath('dailyMinutes','Daily minutes')")
    page.wait_for_timeout(250)
    result['individualResetWorks']=page.evaluate("()=>window.MediaFlowRuntime.getSettings().dailyMinutes===window.MediaFlowRuntime.getDefaultSettings().dailyMinutes")
    page.evaluate("()=>App.updateSetting('tasksPerDay',99)")
    page.wait_for_timeout(200)
    page.evaluate("()=>App.v219RestoreAllDefaults()")
    page.wait_for_timeout(300)
    result['restoreAllWorks']=page.evaluate("()=>window.MediaFlowRuntime.getSettings().tasksPerDay===window.MediaFlowRuntime.getDefaultSettings().tasksPerDay")
    browser.close()

required={
    'runtimeVersion':219,
    'settingsRegistered':True,
    'settingsPage':True,
    'searchExists':True,
    'restoreAllExists':True,
    'searchFilters':True,
    'changedSetting':True,
    'individualResetWorks':True,
    'restoreAllWorks':True,
}
fail=[]
for k,v in required.items():
    if result.get(k)!=v: fail.append(f'{k}: expected {v!r}, got {result.get(k)!r}')
if result.get('navGroups',0)<5: fail.append('organized Settings navigation did not render enough groups')
if result.get('navItems',0)<10: fail.append('organized Settings navigation did not render enough sections')
if result.get('resetButtons',0)<10: fail.append('per-setting/section reset controls did not render')
if errors: fail.extend(f'browser page error: {e}' for e in errors)
print(json.dumps(result,indent=2))
if fail:
    print('UI SMOKE FAILED')
    for x in fail: print('-',x)
    sys.exit(1)
print('UI SMOKE OK')
