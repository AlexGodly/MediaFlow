#!/usr/bin/env python3
from pathlib import Path
import json, shutil, sys

ROOT=Path(__file__).resolve().parents[1]
BUNDLE=ROOT/'assets/js/mediaflow-v220.bundle.js'
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
    page=browser.new_page(viewport={'width':1600,'height':1100})
    errors=[]
    page.on('pageerror', lambda exc: errors.append(str(exc)))
    page.set_content('<!doctype html><html><body><div id="app"></div></body></html>')
    page.evaluate(setup_js)
    page.add_script_tag(content=bundle)
    page.wait_for_timeout(900)
    page.evaluate("()=>App.setView('settings')")
    page.wait_for_timeout(450)
    result=page.evaluate(r'''() => {
      const groups=[...document.querySelectorAll('.v220-settings-nav-group')].map(g=>({
        title:g.querySelector('.v220-settings-nav-title')?.textContent.trim()||'',
        items:[...g.querySelectorAll('.v220-settings-nav-item')].map(x=>x.textContent.trim())
      }));
      const pageGroups=[...document.querySelectorAll('.v220-settings-page-group')].map(g=>({
        title:g.querySelector('h2')?.textContent.trim()||'',
        sections:[...g.querySelectorAll('.section-label')].filter(x=>!x.closest('.card')).map(x=>{
          const c=x.cloneNode(true); c.querySelectorAll('button').forEach(b=>b.remove()); return c.textContent.trim().replace(/\s+/g,' ');
        })
      }));
      const labels=[...document.querySelectorAll('.v220-settings-content .section-label')].filter(x=>!x.closest('.card'));
      const normalized=labels.map(x=>{
        const c=x.cloneNode(true); c.querySelectorAll('button').forEach(b=>b.remove()); return c.textContent.trim().replace(/\s+/g,' ');
      });
      const requestedNoDefault=['DAILY GOAL','TITLE RECOMMENDATIONS','MEDIAFLOW SYSTEM','SCHEDULER TUNING','LEVELING & XP','AUTOMATIC BACKUPS'];
      const defaultLeak=requestedNoDefault.filter(name=>{
        const el=labels.find(x=>{const c=x.cloneNode(true);c.querySelectorAll('button').forEach(b=>b.remove());return c.textContent.trim().replace(/\s+/g,' ')===name;});
        return !el || [...el.querySelectorAll('button')].some(b=>/^Default$/i.test(b.textContent.trim()));
      });
      return {
        runtimeVersion:window.MediaFlowRuntime?.version||0,
        settingsRegistered:window.MediaFlowRuntime?.hasPageRenderer?.('settings')===true,
        settingsPage:!!document.querySelector('.v220-settings-page'),
        searchExists:!!document.getElementById('v220-settings-search'),
        searchPlaceholder:document.getElementById('v220-settings-search')?.getAttribute('placeholder')||'',
        navGroups:groups,
        pageGroups,
        resetButtons:document.querySelectorAll('.v220-setting-reset,.v220-section-reset').length,
        restoreAllExists:[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Restore all defaults'),
        categoriesFirstInLibrary:groups.find(g=>g.title==='Library')?.items?.[0]==='CATEGORIES',
        noOtherGroup:!groups.some(g=>g.title==='Other'),
        groupOrderMatches:JSON.stringify(groups.map(g=>g.title))===JSON.stringify(pageGroups.map(g=>g.title)),
        librarySectionOrderMatches:JSON.stringify(groups.find(g=>g.title==='Library')?.items||[])===JSON.stringify((pageGroups.find(g=>g.title==='Library')?.sections||[]).map(x=>x==='DEFAULT LOGGING METHOD'?'LOGGING METHOD':x)),
        libraryIntegrityClean:normalized.includes('LIBRARY INTEGRITY')&&!normalized.some(x=>x.includes('🛠')),
        defaultLeak,
        pageHasCategoriesFirst:(pageGroups.find(g=>g.title==='Library')?.sections||[])[0]==='CATEGORIES'
      };
    }''')
    search=page.evaluate(r'''() => {
      const before=[...document.querySelectorAll('.v220-settings-nav-item')].filter(b=>!b.classList.contains('v220-settings-hidden')).length;
      App.v220SearchSettings('cover');
      const after=[...document.querySelectorAll('.v220-settings-nav-item')].filter(b=>!b.classList.contains('v220-settings-hidden')).length;
      const clearVisible=!document.getElementById('v220-settings-clear')?.hidden;
      return {before,after,searchFilters:after>0&&after<before,clearVisible};
    }''')
    result.update(search)
    page.evaluate("()=>App.v220ClearSettingsSearch()")
    page.evaluate("()=>App.updateSetting('dailyMinutes',999)")
    page.wait_for_timeout(250)
    result['changedSetting']=page.evaluate("()=>window.MediaFlowRuntime.getSettings().dailyMinutes===999")
    page.evaluate("()=>App.v220ResetSettingPath('dailyMinutes','Daily minutes')")
    page.wait_for_timeout(250)
    result['individualResetWorks']=page.evaluate("()=>window.MediaFlowRuntime.getSettings().dailyMinutes===window.MediaFlowRuntime.getDefaultSettings().dailyMinutes")
    page.evaluate("()=>App.updateSetting('tasksPerDay',99)")
    page.wait_for_timeout(200)
    page.evaluate("()=>App.v220RestoreAllDefaults()")
    page.wait_for_timeout(300)
    result['restoreAllWorks']=page.evaluate("()=>window.MediaFlowRuntime.getSettings().tasksPerDay===window.MediaFlowRuntime.getDefaultSettings().tasksPerDay")
    browser.close()

required={
    'runtimeVersion':220,
    'settingsRegistered':True,
    'settingsPage':True,
    'searchExists':True,
    'restoreAllExists':True,
    'searchFilters':True,
    'clearVisible':True,
    'changedSetting':True,
    'individualResetWorks':True,
    'restoreAllWorks':True,
    'categoriesFirstInLibrary':True,
    'noOtherGroup':True,
    'groupOrderMatches':True,
    'librarySectionOrderMatches':True,
    'libraryIntegrityClean':True,
    'pageHasCategoriesFirst':True,
}
fail=[]
for k,v in required.items():
    if result.get(k)!=v: fail.append(f'{k}: expected {v!r}, got {result.get(k)!r}')
if len(result.get('navGroups',[]))<6: fail.append('organized Settings navigation did not render enough groups')
if result.get('resetButtons',0)<10: fail.append('per-setting/section reset controls did not render')
if result.get('defaultLeak'): fail.append('native Default button/text still present in: '+', '.join(result['defaultLeak']))
if 'feature, or section' not in result.get('searchPlaceholder',''): fail.append('new v220 search placeholder is missing')
if errors: fail.extend(f'browser page error: {e}' for e in errors)
print(json.dumps(result,indent=2))
if fail:
    print('UI SMOKE FAILED')
    for x in fail: print('-',x)
    sys.exit(1)
print('UI SMOKE OK')
