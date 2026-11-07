#!/usr/bin/env python3
from pathlib import Path
import json, shutil, sys
try:
    from playwright.sync_api import sync_playwright
except Exception as e:
    print('v243 SMOKE FAILED: Playwright unavailable:',e);sys.exit(1)
ROOT=Path(__file__).resolve().parents[1]
BUNDLE=ROOT/'assets/js/mediaflow-v243.bundle.js'
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
if not chromium:
    print('v243 SMOKE FAILED: Chromium unavailable');sys.exit(1)
css_files=sorted((ROOT/'assets/css').glob('*.css'),key=lambda p:int(p.name.split('-',1)[0]) if p.name.split('-',1)[0].isdigit() else 9999)
css='\n'.join(p.read_text(encoding='utf-8') for p in css_files);bundle=BUNDLE.read_text(encoding='utf-8')
setup_js=r'''() => {
 const store={}; const fakeStore={getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},clear:()=>{for(const k of Object.keys(store))delete store[k]},key:i=>Object.keys(store)[i]||null,get length(){return Object.keys(store).length}};
 Object.defineProperty(window,'localStorage',{value:fakeStore,configurable:true});Object.defineProperty(window,'sessionStorage',{value:fakeStore,configurable:true});
 const user={id:'v243-user',email:'v243@example.com',created_at:new Date().toISOString(),user_metadata:{display_name:'v243'}};
 const db=()=>{const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:null,error:null}),upsert:async()=>({data:null,error:null}),delete(){return q}};return q};
 const client={auth:{getSession:async()=>({data:{session:{user}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),getUser:async()=>({data:{user}}),signOut:async()=>({})},from:db};
 window.supabase={createClient(){return client;}};window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>null;
}'''
fails=[]
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
    page=b.new_page(viewport={'width':1360,'height':900});errors=[];page.on('pageerror',lambda exc: errors.append(str(exc)))
    page.set_content('<!doctype html><html><body><div id="app"></div></body></html>');page.add_style_tag(content=css);page.evaluate(setup_js);page.add_script_tag(content=bundle);page.wait_for_timeout(850)
    page.evaluate(r'''() => {MediaFlowRuntime.registerPageRenderer('__v243_probe__',({state})=>{window.__mfState=state;return '<div>probe</div>';});App.setView('__v243_probe__');}''');page.wait_for_timeout(60)
    ok=page.evaluate(r'''() => {const s=window.__mfState;if(!s||!s.categories?.length)return false;const c=s.categories[0];c.icon='📚';
      const px='data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="120"%3E%3Crect width="80" height="120" fill="%2300aaff"/%3E%3C/svg%3E';
      s.library=[
        {id:'covered',title:'Covered Title',categoryId:c.id,status:'active',priority:'medium',progress:1,total:12,coverUrl:px},
        {id:'missing',title:'Missing Title',categoryId:c.id,status:'active',priority:'medium',progress:1,total:12,coverUrl:''}
      ];
      s.logDraft={entries:[{libraryId:'covered',title:'Covered Title',qty:1,v179StartProgress:1,v179EndProgress:2}],minutes:0,note:'',v179Mode:'progress',updateLibrary:true};
      s.entryDraft={title:'',qty:1,libraryId:null,endProgress:1};s.logging=true;s.sessionActive=true;s.currentTask={categoryId:c.id,low:1,high:1,unit:c.unit||'episodes',reasons:[],title:'Covered Title'};
      s.settings.v179LoggingModes={single:'progress',batch:'amount',modifiedAt:Date.now()};
      // make enough categories for the searchable/paginated Batch filter
      for(let i=1;i<=24;i++)s.categories.push({id:'v243-cat-'+i,name:'Category '+i,type:'anime',unit:'episodes',target:1,minutesPerUnit:24,weight:3,enabled:true,icon:'📘'});
      return true;
    }''')
    if not ok:fails.append('state setup failed')

    # Covered logging title: real image visible, category fallback hidden.
    page.evaluate("()=>App.setView('dashboard')");page.wait_for_timeout(170)
    art=page.evaluate(r'''() => {const b=document.querySelector('.v241-logged-cover-button');const img=b?.querySelector('img');const fb=b?.querySelector('.v241-category-cover-fallback');return {button:!!b,img:!!img,imgDisplay:img?getComputedStyle(img).display:'',fallback:!!fb,fallbackDisplay:fb?getComputedStyle(fb).display:'',fallbackClass:fb?.className||'',height:b?Math.round(b.getBoundingClientRect().height):0};}''')
    if page.locator('.v241-logged-cover-button').count():
        page.click('.v241-logged-cover-button');page.wait_for_timeout(50);art['details']=page.locator('#v181-title-details-overlay').count()==1;page.evaluate('()=>App.v181CloseTitleDetails()')

    # Missing cover still gets category artwork fallback. Mount the current helper
    # directly so this check does not depend on Dashboard view-state transitions.
    missing=page.evaluate(r'''() => {const item=window.__mfState.library.find(x=>x.id==='missing');const wrap=document.createElement('div');wrap.id='v243-missing-probe';wrap.innerHTML=App.v243LoggedCoverMarkup(item,item.title);document.body.appendChild(wrap);const b=wrap.querySelector('.v241-logged-cover-button');const fb=b?.querySelector('.v241-category-cover-fallback');const out={button:!!b,img:!!b?.querySelector('img'),fallback:!!fb,fallbackDisplay:fb?getComputedStyle(fb).display:''};wrap.remove();return out;}''')

    # Batch filter must overlay the following content instead of being hidden.
    page.evaluate("()=>App.setView('batch')");page.wait_for_timeout(220)
    page.evaluate(r'''() => {const d=document.querySelector('[data-v237-category-filter="batch"]');if(d){d.open=true;d.dispatchEvent(new Event('toggle'));}}''');page.wait_for_timeout(100)
    batch=page.evaluate(r'''() => {const host=document.getElementById('v175-batch-library-tools'),d=host?.querySelector('[data-v237-category-filter="batch"]'),p=d?.querySelector('.v237-category-filter-panel');if(!host||!d||!p)return null;const hr=host.getBoundingClientRect(),pr=p.getBoundingClientRect();const y=Math.min(pr.bottom-8,Math.max(hr.bottom+10,pr.top+20)),x=pr.left+20;const el=document.elementFromPoint(x,y);return {open:d.open,hostOverflow:getComputedStyle(host).overflow,hostZ:getComputedStyle(host).zIndex,panelZ:getComputedStyle(p).zIndex,panelTop:Math.round(pr.top),panelBottom:Math.round(pr.bottom),hostBottom:Math.round(hr.bottom),extends:pr.bottom>hr.bottom+20,probeX:Math.round(x),probeY:Math.round(y),topElement:el?.tagName+'.'+(el?.className||''),topElementInside:!!el&&p.contains(el)};}''')

    audit=page.evaluate(r'''() => {const a=App.v243AuditSnapshot();return {backup:!!a.backup?.backupManifest?.includes?.loggingSingleArtworkSourceV243,batch:!!a.backup?.backupManifest?.includes?.batchCategoryFilterPopoverV243,preset:!!a.preset?.presetManifest?.includes?.currentPersistentSettingsAuditV243,release:a.order?.exportAudit?.release};}''')
    runtime=page.evaluate('()=>MediaFlowRuntime.version');b.close()

if errors:fails.extend('pageerror: '+e for e in errors)
if runtime!=243:fails.append(f'runtime {runtime}')
if not art.get('button') or not art.get('img') or art.get('imgDisplay')=='none':fails.append(f'real cover missing: {art}')
if not art.get('fallback') or art.get('fallbackDisplay')!='none':fails.append(f'category fallback visible under real cover: {art}')
if not art.get('details'):fails.append(f'logged cover no longer opens Title Details: {art}')
if not missing.get('button') or missing.get('img') or not missing.get('fallback') or missing.get('fallbackDisplay')=='none':fails.append(f'missing-cover category fallback failed: {missing}')
if not batch or not batch.get('open') or not batch.get('extends') or not batch.get('topElementInside'):fails.append(f'Batch category filter still hidden/clipped: {batch}')
if not all([audit.get('backup'),audit.get('batch'),audit.get('preset')]) or audit.get('release')!=243:fails.append(f'audit failed: {audit}')
print(json.dumps({'runtime':runtime,'coveredArtwork':art,'missingArtwork':missing,'batchFilter':batch,'audit':audit,'pageErrors':errors},indent=2))
if fails:
    print('v243 SMOKE FAILED');[print('-',x) for x in fails];sys.exit(1)
print('v243 SMOKE OK')
