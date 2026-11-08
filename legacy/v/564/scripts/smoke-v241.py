#!/usr/bin/env python3
from pathlib import Path
import json, shutil, sys
try:
    from playwright.sync_api import sync_playwright
except Exception as e:
    print('v241 SMOKE FAILED: Playwright unavailable:',e);sys.exit(1)
ROOT=Path(__file__).resolve().parents[1]
BUNDLE=ROOT/'assets/js/mediaflow-v241.bundle.js'
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
if not chromium:
    print('v241 SMOKE FAILED: Chromium unavailable');sys.exit(1)
css_files=sorted((ROOT/'assets/css').glob('*.css'),key=lambda p:int(p.name.split('-',1)[0]) if p.name.split('-',1)[0].isdigit() else 9999)
css='\n'.join(p.read_text(encoding='utf-8') for p in css_files);bundle=BUNDLE.read_text(encoding='utf-8')
setup_js=r'''() => {
 const store={}; const fakeStore={getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},clear:()=>{for(const k of Object.keys(store))delete store[k]},key:i=>Object.keys(store)[i]||null,get length(){return Object.keys(store).length}};
 Object.defineProperty(window,'localStorage',{value:fakeStore,configurable:true});Object.defineProperty(window,'sessionStorage',{value:fakeStore,configurable:true});
 const user={id:'v241-user',email:'v241@example.com',created_at:new Date().toISOString(),user_metadata:{display_name:'v241'}};
 const db=()=>{const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:null,error:null}),upsert:async()=>({data:null,error:null}),delete(){return q}};return q};
 const client={auth:{getSession:async()=>({data:{session:{user}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),getUser:async()=>({data:{user}}),signOut:async()=>({})},from:db};
 window.supabase={createClient(){return client;}};window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>null;
}'''
fails=[]
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
    page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda exc: errors.append(str(exc)))
    page.set_content('<!doctype html><html><body><div id="app"></div></body></html>');page.add_style_tag(content=css);page.evaluate(setup_js);page.add_script_tag(content=bundle);page.wait_for_timeout(850)
    page.evaluate(r'''() => {MediaFlowRuntime.registerPageRenderer('__v241_probe__',({state})=>{window.__mfState=state;return '<div>probe</div>';});App.setView('__v241_probe__');}''');page.wait_for_timeout(50)
    prepared=page.evaluate(r'''() => {const s=window.__mfState;if(!s||!s.categories?.length)return false;const c=s.categories[0],c2=s.categories[1]||c;
      s.library=[
       {id:'covered',title:'Covered Show',categoryId:c.id,status:'active',priority:'high',progress:2,total:12,rating:8,coverUrl:'https://example.com/cover.jpg',manualRepeatAmount:0},
       {id:'missing',title:'Missing Cover Show',categoryId:c2.id,status:'active',priority:'medium',progress:3,total:24,rating:null,coverUrl:'',manualRepeatAmount:0}
      ];
      s.sessions=[
       {id:'h1',timestamp:Date.parse('2026-10-04T10:00:00Z'),date:'2026-10-04',categoryId:c.id,targetAmount:1,actualAmount:1,minutes:24,status:'logged',unit:c.unit||'episodes',titles:[{title:'Covered Show',libraryId:'covered',qty:1}]},
       {id:'h2',timestamp:Date.parse('2026-09-01T10:00:00Z'),date:'2026-09-01',categoryId:c2.id,targetAmount:2,actualAmount:2,minutes:48,status:'logged',unit:c2.unit||'episodes',titles:[{title:'Missing Cover Show',libraryId:'missing',qty:2}]}
      ];
      s.activityLog=Array.from({length:125},(_,i)=>({id:'a'+i,timestamp:Date.now()-i*1000,action:'Edit title',detail:'Change '+i,changes:[],titleIds:i%2?['covered']:['missing']}));
      s.histFilters={category:'all',type:'all',range:'all',historyCategories:[],dateFrom:'',dateTo:'',libSearch:'',libCategory:'all',libCategories:[],libStatus:'all',libPriority:'all',libCover:'all',libSortBase:'title',libSortDir:'asc',libSort:'title-asc'};
      s.histPage=0;s.histPageSize=50;s.v241LibraryHistoryPage=0;
      s.settings.v230ChoiceLayout=s.settings.v230ChoiceLayout||{};
      s.logDraft={entries:[{libraryId:'missing',title:'Missing Cover Show',qty:1,v179StartProgress:3,v179EndProgress:4}],minutes:10,note:''};s.logging=true;s.currentTask={categoryId:c2.id,low:1,high:1,unit:c2.unit||'episodes',reasons:[],title:'Missing Cover Show'};s.sessionActive=true;
      return {c:String(c.id),c2:String(c2.id)};
    }''')
    if not prepared:fails.append('state setup failed')

    # Edit Title clarity + repeat cards full-width pair.
    page.evaluate("()=>App.openLibraryModal('covered')");page.wait_for_timeout(150)
    edit=page.evaluate(r'''() => {const modal=document.querySelector('.modal'),repeat=document.querySelector('.v240-repeat-panel'),cards=[...document.querySelectorAll('.v240-repeat-panel .v82-repeat-grid>div')],input=document.querySelector('#l-title');return {modalW:Math.round(modal?.getBoundingClientRect().width||0),font:parseFloat(getComputedStyle(input).fontSize||0),height:Math.round(input?.getBoundingClientRect().height||0),repeatW:Math.round(repeat?.getBoundingClientRect().width||0),cardWidths:cards.map(x=>Math.round(x.getBoundingClientRect().width))};}''')
    page.evaluate('()=>App.closeModal()')

    # Missing logging cover uses category icon and opens Title Details.
    page.evaluate("()=>App.setView('dashboard')");page.wait_for_timeout(180)
    log=page.evaluate(r'''() => {const b=document.querySelector('.v241-logged-cover-button');return {button:!!b,categoryIcon:!!b?.querySelector('.v144-cat-icon-img,.v144-cat-icon-emoji'),placeholder:!!b?.querySelector('.v241-category-cover-fallback')};}''')
    page.click('.v241-logged-cover-button');page.wait_for_timeout(60)
    log['detailsOpened']=page.locator('#v181-title-details-overlay').count()==1
    page.evaluate('()=>App.v181CloseTitleDetails()')

    # History category filter + custom dates.
    page.evaluate("()=>App.setView('history')");page.wait_for_timeout(160)
    history=page.evaluate(r'''() => ({filter:!!document.querySelector('[data-v241-history-category-filter]'),search:!!document.querySelector('[data-v241-history-category-filter] input[type="search"]'),dateInputs:document.querySelectorAll('.v241-history-date-filter input[type="date"]').length,rows:document.querySelectorAll('.hist-row').length})''')
    page.evaluate("()=>App.v241SetHistoryDate('from','2026-10-01')");page.wait_for_timeout(120)
    history['customRows']=page.locator('.hist-row').count()
    page.evaluate("()=>App.v241ToggleHistoryCategory(window.__mfState.categories[0].id,true)");page.wait_for_timeout(120)
    history['categoryRows']=page.locator('.hist-row').count()

    # Library History pagination.
    page.evaluate("()=>App.setView('libraryhistory')");page.wait_for_timeout(180)
    libhist=page.evaluate(r'''() => ({rows:document.querySelectorAll('.mf-activity-row').length,pager:document.querySelectorAll('.v241-library-history-pager').length,text:document.body.innerText.includes('125 changes')})''')
    page.evaluate('()=>App.v241SetLibraryHistoryPage(1)');page.wait_for_timeout(100)
    libhist['page2rows']=page.locator('.mf-activity-row').count()

    audit=page.evaluate(r'''() => {const a=App.v241AuditSnapshot();return {flag:!!a.backup?.backupManifest?.includes?.performance50kAuditV241,preset:!!a.preset?.presetManifest?.includes?.currentPersistentSettingsAuditV241,order:a.order?.exportAudit?.release};}''')
    runtime=page.evaluate('()=>MediaFlowRuntime.version');b.close()

if errors:fails.extend('pageerror: '+e for e in errors)
if runtime!=241:fails.append(f'runtime {runtime}')
if edit['font']<13.5 or edit['height']<46:fails.append(f'Edit Title fields still too small: {edit}')
if len(edit['cardWidths'])!=2 or min(edit['cardWidths'])<edit['repeatW']*.4:fails.append(f'Rewatch cards do not use full row: {edit}')
if not all(log.values()):fails.append(f'logging fallback/details failed: {log}')
if not history['filter'] or not history['search'] or history['dateInputs']!=2:fails.append(f'History controls missing: {history}')
if history.get('customRows')!=1 or history.get('categoryRows')!=1:fails.append(f'History custom filters wrong: {history}')
if libhist['rows']!=50 or libhist['page2rows']!=50 or not libhist['pager'] or not libhist['text']:fails.append(f'Library History pagination failed: {libhist}')
if not audit['flag'] or not audit['preset'] or audit['order']!=241:fails.append(f'audit failed: {audit}')
print(json.dumps({'runtime':runtime,'edit':edit,'log':log,'history':history,'libraryHistory':libhist,'audit':audit,'pageErrors':errors},indent=2))
if fails:
    print('v241 SMOKE FAILED');[print('-',x) for x in fails];sys.exit(1)
print('v241 SMOKE OK')
