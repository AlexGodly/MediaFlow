#!/usr/bin/env python3
from pathlib import Path
import json, shutil, sys
try:
    from playwright.sync_api import sync_playwright
except Exception as e:
    print('v242 SMOKE FAILED: Playwright unavailable:',e);sys.exit(1)
ROOT=Path(__file__).resolve().parents[1]
BUNDLE=ROOT/'assets/js/mediaflow-v242.bundle.js'
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
if not chromium:
    print('v242 SMOKE FAILED: Chromium unavailable');sys.exit(1)
css_files=sorted((ROOT/'assets/css').glob('*.css'),key=lambda p:int(p.name.split('-',1)[0]) if p.name.split('-',1)[0].isdigit() else 9999)
css='\n'.join(p.read_text(encoding='utf-8') for p in css_files);bundle=BUNDLE.read_text(encoding='utf-8')
setup_js=r'''() => {
 const store={}; const fakeStore={getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},clear:()=>{for(const k of Object.keys(store))delete store[k]},key:i=>Object.keys(store)[i]||null,get length(){return Object.keys(store).length}};
 Object.defineProperty(window,'localStorage',{value:fakeStore,configurable:true});Object.defineProperty(window,'sessionStorage',{value:fakeStore,configurable:true});
 const user={id:'v242-user',email:'v242@example.com',created_at:new Date().toISOString(),user_metadata:{display_name:'v242'}};
 const db=()=>{const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:null,error:null}),upsert:async()=>({data:null,error:null}),delete(){return q}};return q};
 const client={auth:{getSession:async()=>({data:{session:{user}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),getUser:async()=>({data:{user}}),signOut:async()=>({})},from:db};
 window.supabase={createClient(){return client;}};window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>null;
}'''
fails=[]
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
    page=b.new_page(viewport={'width':1180,'height':860});errors=[];page.on('pageerror',lambda exc: errors.append(str(exc)))
    page.set_content('<!doctype html><html><body><div id="app"></div></body></html>');page.add_style_tag(content=css);page.evaluate(setup_js);page.add_script_tag(content=bundle);page.wait_for_timeout(850)
    page.evaluate(r'''() => {MediaFlowRuntime.registerPageRenderer('__v242_probe__',({state})=>{window.__mfState=state;return '<div>probe</div>';});App.setView('__v242_probe__');}''');page.wait_for_timeout(50)
    prepared=page.evaluate(r'''() => {const s=window.__mfState;if(!s||!s.categories?.length)return false;const c=s.categories[0];
      s.library=[{id:'show1',title:'Alpha Show',categoryId:c.id,status:'active',priority:'medium',progress:1,total:12,rating:8,coverUrl:'',manualRepeatAmount:0},{id:'show2',title:'Beta Show',categoryId:c.id,status:'active',priority:'high',progress:2,total:10,rating:9,coverUrl:'https://example.com/beta.jpg',manualRepeatAmount:0}];
      s.sessions=[{id:'h1',timestamp:Date.parse('2026-10-04T10:00:00Z'),date:'2026-10-04',categoryId:c.id,targetAmount:1,actualAmount:1,minutes:24,status:'logged',unit:c.unit||'episodes',titles:[{title:'Alpha Show',libraryId:'show1',qty:1}]}];
      s.histFilters={category:'all',type:'all',range:'all',historyCategories:[],dateFrom:'',dateTo:'',libSearch:'',libCategory:'all',libCategories:[],libStatus:'all',libPriority:'all',libCover:'all',libSortBase:'title',libSortDir:'asc',libSort:'title-asc'};
      s.histPage=0;s.histPageSize=50;
      s.logDraft={entries:[{libraryId:'show1',title:'Alpha Show',qty:1,v179StartProgress:1,v179EndProgress:2}],minutes:10,note:'',v179Mode:'progress',updateLibrary:true};
      s.entryDraft={title:'',qty:1,libraryId:null,endProgress:1};s.logging=true;s.currentTask={categoryId:c.id,low:1,high:1,unit:c.unit||'episodes',reasons:[],title:'Alpha Show'};s.sessionActive=true;
      s.settings.v179LoggingModes={single:'progress',batch:'amount',modifiedAt:Date.now()};
      return true;
    }''')
    if not prepared:fails.append('state setup failed')

    page.evaluate("()=>App.setView('dashboard')");page.wait_for_timeout(180)
    log=page.evaluate(r'''() => {const inline=document.querySelector('.v179-inline-progress span'),card=document.querySelector('.v239-logged-progress span'),cover=document.querySelector('.v241-logged-cover-button');return {inlineFont:parseFloat(getComputedStyle(inline).fontSize||0),cardFont:parseFloat(getComputedStyle(card).fontSize||0),cover:!!cover,overlay:!!cover?.querySelector('.v225-btn-icon'),optout:cover?.dataset?.v225Iconified||''};}''')
    if page.locator('.v241-logged-cover-button').count():
        page.click('.v241-logged-cover-button');page.wait_for_timeout(50)
        log['detailsOpened']=page.locator('#v181-title-details-overlay').count()==1
        page.evaluate('()=>App.v181CloseTitleDetails()')

    page.evaluate("()=>App.setView('history')");page.wait_for_timeout(150)
    history=page.evaluate(r'''() => {const tb=document.querySelector('.v242-history-toolbar'),filters=tb?.querySelector('.lib-filters'),dates=tb?.querySelector('.v241-history-date-filter'),exp=tb?.querySelector('.v242-history-export'),undo=document.querySelector('.v242-history-undo');const r=x=>x?x.getBoundingClientRect():null;return {toolbar:!!tb,filters:!!filters,dates:!!dates,export:!!exp,undo:!!undo,exportX:Math.round(r(exp)?.x||0),filterX:Math.round(r(filters)?.x||0),dateY:Math.round(r(dates)?.y||0),filterY:Math.round(r(filters)?.y||0)};}''')
    audit=page.evaluate(r'''() => {const a=App.v242AuditSnapshot();return {flag:!!a.backup?.backupManifest?.includes?.loggingCandidateCacheV242,preset:!!a.preset?.presetManifest?.includes?.currentPersistentSettingsAuditV242,order:a.order?.exportAudit?.release};}''')
    runtime=page.evaluate('()=>MediaFlowRuntime.version');b.close()

if errors:fails.extend('pageerror: '+e for e in errors)
if runtime!=242:fails.append(f'runtime {runtime}')
if log.get('inlineFont',0)<11 or log.get('cardFont',0)<11:fails.append(f'logging labels still too small: {log}')
if not log.get('cover') or log.get('overlay') or log.get('optout')!='1' or not log.get('detailsOpened'):fails.append(f'cover cleanup/details failed: {log}')
if not all(history.get(k) for k in ['toolbar','filters','dates','export','undo']):fails.append(f'History toolbar missing: {history}')
if history.get('exportX',0)<=history.get('filterX',0):fails.append(f'History export not positioned cleanly: {history}')
if not audit['flag'] or not audit['preset'] or audit['order']!=242:fails.append(f'audit failed: {audit}')
print(json.dumps({'runtime':runtime,'logging':log,'history':history,'audit':audit,'pageErrors':errors},indent=2))
if fails:
    print('v242 SMOKE FAILED');[print('-',x) for x in fails];sys.exit(1)
print('v242 SMOKE OK')
