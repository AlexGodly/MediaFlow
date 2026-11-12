#!/usr/bin/env python3
from pathlib import Path
import json, shutil, sys
try:
    from playwright.sync_api import sync_playwright
except Exception as e:
    print('v253 SMOKE FAILED: Playwright unavailable:',e);sys.exit(1)
ROOT=Path(__file__).resolve().parents[1]
VERSION=int((ROOT/'VERSION').read_text().strip())
errors=[];result={'version':VERSION}
bundle=(ROOT/f'assets/js/mediaflow-v{VERSION}.bundle.js').read_text()
index=(ROOT/'index.html').read_text();sw=(ROOT/'sw.js').read_text();css=(ROOT/'assets/css/120-v253-seasons-history-logging-polish.css').read_text()
for token in ['MediaFlow v253 — Seasons UI / recommended logging / History batch tools','const V253_RUNTIME_VERSION=253;','function v253UseRecommendedTitle','function v253SetHistoryPageSize','function v253OpenHistoryDeleteConfirm','MediaFlowRuntime.version=V253_RUNTIME_VERSION;']:
    if token not in bundle: errors.append('bundle missing '+token)
if 'assets/css/120-v253-seasons-history-logging-polish.css' not in index: errors.append('v253 stylesheet not wired')
if './assets/css/120-v253-seasons-history-logging-polish.css' not in sw: errors.append('v253 CSS missing from PWA shell')
if 'mediaflow-pwa-v253-shell-v1' not in sw: errors.append('PWA cache not v253')
for token in ['.v253-log-recommended','.v253-history-batchbar','.v253-season-manager-overlay']:
    if token not in css: errors.append('CSS missing '+token)
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
if not chromium: errors.append('Chromium unavailable')
else:
    all_css='\n'.join(p.read_text() for p in sorted((ROOT/'assets/css').glob('*.css')))
    page_errors=[]
    setup_js=r'''() => {
      const store={};const fakeStore={getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k],clear:()=>Object.keys(store).forEach(k=>delete store[k]),key:i=>Object.keys(store)[i]||null,get length(){return Object.keys(store).length}};
      Object.defineProperty(window,'localStorage',{value:fakeStore,configurable:true});Object.defineProperty(window,'sessionStorage',{value:fakeStore,configurable:true});
      const user={id:'v253-user',email:'v253@example.com',created_at:new Date().toISOString(),user_metadata:{display_name:'v253'}};const db=()=>{const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:null,error:null}),upsert:async()=>({data:null,error:null}),delete(){return q}};return q};
      const client={auth:{getSession:async()=>({data:{session:{user}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),getUser:async()=>({data:{user}}),signOut:async()=>({})},from:db};window.supabase={createClient(){return client;}};window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>null;
      const fakeWorker={state:'activated',postMessage(){},addEventListener(){},removeEventListener(){}};const fakeReg={scope:'https://mediaflow.test/',active:fakeWorker,waiting:null,installing:null,update:async()=>{},addEventListener(){},removeEventListener(){}};Object.defineProperty(navigator,'serviceWorker',{value:{controller:fakeWorker,register:async()=>fakeReg,getRegistration:async()=>fakeReg,ready:Promise.resolve(fakeReg),addEventListener(){},removeEventListener(){}},configurable:true});Object.defineProperty(window,'isSecureContext',{value:true,configurable:true});window.fetch=async()=>new Response('<meta name="mediaflow-version" content="253">',{status:200,headers:{'content-type':'text/html'}});
    }'''
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':1366,'height':768});page.on('pageerror',lambda exc: page_errors.append(str(exc)))
        page.set_content('<!doctype html><html><head><base href="https://mediaflow.test/"><meta name="mediaflow-version" content="253"></head><body><div id="app"></div></body></html>')
        page.evaluate(setup_js);page.add_style_tag(content=all_css);page.add_script_tag(content=bundle);page.wait_for_timeout(500)
        result['runtime']=page.evaluate('()=>MediaFlowRuntime.version')
        if result['runtime']!=253: errors.append('runtime mismatch')
        page.evaluate("()=>{MediaFlowRuntime.registerPageRenderer('__v253_probe__',({state})=>{window.__v253State=state;return '<div>probe</div>';});App.setView('__v253_probe__');}")
        page.wait_for_timeout(50)
        cat=page.evaluate("()=>window.__v253State.categories.find(c=>c.unit==='episodes')?.id||window.__v253State.categories[0]?.id")
        page.evaluate(r'''cat=>{const s=window.__v253State;s.library.push({id:'st-v253',title:'Stranger Things',categoryId:cat,progress:35,total:42,status:'active',priority:'high',coverUrl:'',createdAt:Date.now(),modifiedAt:Date.now(),seasons:[{id:'s1',number:1,name:'Season 1',progress:8,total:8,source:'manual',manual:true},{id:'s2',number:2,name:'Season 2',progress:9,total:9,source:'manual',manual:true},{id:'s3',number:3,name:'Season 3',progress:8,total:8,source:'manual',manual:true},{id:'s4',number:4,name:'Season 4',progress:9,total:9,source:'manual',manual:true},{id:'s5',number:5,name:'Season 5',progress:1,total:8,source:'manual',manual:true}]});s.settings.exactTitleRecommendations=true;s.currentTask={categoryId:cat,targetMid:3,targetLow:1,targetHigh:5,libraryId:'st-v253',title:'Stranger Things'};s.sessionActive=true;}''',cat)
        # title details scrolling + modal layering
        page.evaluate("()=>App.v181OpenTitleDetails('st-v253')");page.wait_for_timeout(50)
        detail=page.evaluate(r'''()=>{const m=document.querySelector('.v181-title-details-modal'),b=document.querySelector('.v181-title-details-body');return {modalOverflow:getComputedStyle(m).overflow,bodyOverflow:getComputedStyle(b).overflowY,bodyClient:b.clientHeight,bodyScroll:b.scrollHeight};}''')
        result['detailScroll']=detail
        if detail['bodyOverflow'] not in ('auto','scroll'): errors.append('Title Details body is not scrollable')
        page.evaluate("()=>App.v252OpenSeasonManager('st-v253')");page.wait_for_timeout(30)
        layers=page.evaluate(r'''()=>({details:Number(getComputedStyle(document.getElementById('v181-title-details-overlay')).zIndex)||0,seasons:Number(getComputedStyle(document.getElementById('v252-season-manager-overlay')).zIndex)||0})''')
        result['layers']=layers
        if layers['seasons']<=layers['details']: errors.append('season manager still stacks behind Title Details')
        page.evaluate('()=>App.v252CloseSeasonManager()');page.evaluate('()=>App.v181CloseTitleDetails()')
        # direct recommended title and clean season placement
        page.evaluate(r'''()=>{window.__v253State.settings.v181Logging={defaultMode:'progress',modifiedAt:Date.now()};App.openLogForm();const t=window.__v253State.currentTask;document.getElementById('app').innerHTML=App.v253CurrentLogFormHtml();}''');page.wait_for_timeout(80)
        if page.locator('.v253-log-recommended').count()!=1: errors.append('recommended title shortcut missing')
        page.evaluate(r'''()=>{App.v253UseRecommendedTitle();const t=window.__v253State.currentTask;document.getElementById('app').innerHTML=App.v253CurrentLogFormHtml();}''');page.wait_for_timeout(80)
        selected=page.evaluate('()=>window.__v253State.entryDraft.libraryId')
        if selected!='st-v253': errors.append('recommended title shortcut did not select title')
        placement=page.evaluate(r'''()=>{const box=document.querySelector('.v253-log-season-box'),builder=document.querySelector('.v253-log-title-builder');return {box:!!box,builder:!!builder,sameParent:box?.parentElement===builder,insideBuilder:!!builder?.contains(box),browserOpen:document.querySelector('.v238-log-library')?.open===true};}''')
        result['loggingPlacement']=placement
        if not placement['box'] or placement['insideBuilder']: errors.append('Seasons View is still squeezed inside title builder')
        if not placement['browserOpen']: errors.append('recommended shortcut did not reveal logging Library editor')
        # History data / default 10 / batch actions
        page.evaluate(r'''cat=>{const s=window.__v253State;s.logging=false;s.sessions=[];const now=Date.now();for(let i=0;i<25;i++)s.sessions.push({id:'h'+i,timestamp:now-i*60000,date:new Date(now-i*60000).toISOString().slice(0,10),categoryId:cat,assignedCategoryId:cat,targetAmount:1,actualAmount:1,minutes:20,note:'History '+i,status:'logged',unit:'episodes',xp:10,healthStatus:'healthy',source:'manual',titles:[]});s.settings.historyPageSize=10;s.histPage=0;App.setView('history');}''',cat);page.wait_for_timeout(80)
        hc=page.locator('.v253-history-row').count();result['historyRowsDefault']=hc
        if hc!=10: errors.append(f'default history page expected 10 rows, got {hc}')
        sizeval=page.locator('.v253-history-page-size input').input_value()
        if sizeval!='10': errors.append('History page size control not default 10')
        page.evaluate('()=>App.v253SelectVisibleHistory()');page.wait_for_timeout(60)
        if page.evaluate('()=>App.v253HistorySelectedCount()')!=10: errors.append('Select visible did not select current 10 rows')
        page.evaluate("()=>App.v253OpenHistoryDeleteConfirm('visible')");page.wait_for_timeout(30)
        if page.locator('.v253-history-confirm').count()!=1: errors.append('designed Delete visible confirmation missing')
        page.evaluate('()=>App.v253ConfirmHistoryDelete(document.querySelector(".v253-history-confirm .btn-danger"))');page.wait_for_timeout(90)
        remaining=page.evaluate('()=>window.__v253State.sessions.length');result['historyRemaining']=remaining
        if remaining!=15: errors.append(f'Delete visible removed wrong count: {remaining} remain')
        page.evaluate('()=>App.v253SetHistoryPageSize(7)');page.wait_for_timeout(80)
        if page.locator('.v253-history-row').count()!=7: errors.append('typed History page size 7 not applied')
        if page.evaluate('()=>window.__v253State.settings.historyPageSize')!=7: errors.append('History page size not persisted in settings state')
        page.evaluate('()=>App.v253SelectVisibleHistory()');page.wait_for_timeout(40);page.evaluate('()=>App.v253DeselectHistory()');page.wait_for_timeout(40)
        if page.evaluate('()=>App.v253HistorySelectedCount()')!=0: errors.append('Deselect did not clear History selection')
        # responsive sanity for logging + History
        for w,h in [(820,900),(390,844),(320,700),(280,653)]:
            page.set_viewport_size({'width':w,'height':h});page.evaluate("()=>{App.setView('history');}");page.wait_for_timeout(35)
            ov=page.evaluate('()=>Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth');result[f'historyOverflow{w}']=ov
            if ov>8: errors.append(f'History overflow at {w}: {ov}')
        browser.close()
    if page_errors: errors.extend('pageerror: '+x for x in page_errors)
print(json.dumps(result,indent=2))
if errors:
    print('v253 SMOKE FAILED')
    for e in errors: print('-',e)
    sys.exit(1)
print('v253 smoke: OK')
