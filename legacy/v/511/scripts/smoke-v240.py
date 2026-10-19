#!/usr/bin/env python3
from pathlib import Path
import json, shutil, sys
try:
    from playwright.sync_api import sync_playwright
except Exception as e:
    print('v240 SMOKE FAILED: Playwright unavailable:', e); sys.exit(1)
ROOT=Path(__file__).resolve().parents[1]
BUNDLE=ROOT/'assets/js/mediaflow-v240.bundle.js'
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
if not chromium:
    print('v240 SMOKE FAILED: Chromium unavailable'); sys.exit(1)
css_files=sorted((ROOT/'assets/css').glob('*.css'),key=lambda p:int(p.name.split('-',1)[0]) if p.name.split('-',1)[0].isdigit() else 9999)
css='\n'.join(p.read_text(encoding='utf-8') for p in css_files)
bundle=BUNDLE.read_text(encoding='utf-8')
setup_js=r'''() => {
 const store={}; const fakeStore={getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},clear:()=>{for(const k of Object.keys(store))delete store[k]},key:i=>Object.keys(store)[i]||null,get length(){return Object.keys(store).length}};
 Object.defineProperty(window,'localStorage',{value:fakeStore,configurable:true}); Object.defineProperty(window,'sessionStorage',{value:fakeStore,configurable:true});
 const user={id:'v240-user',email:'v240@example.com',created_at:new Date().toISOString(),user_metadata:{display_name:'v240'}};
 const db=()=>{const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:null,error:null}),upsert:async()=>({data:null,error:null}),delete(){return q}};return q};
 const client={auth:{getSession:async()=>({data:{session:{user}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),getUser:async()=>({data:{user}}),signOut:async()=>({})},from:db};
 window.supabase={createClient(){return client;}}; window.confirm=()=>true; window.alert=()=>{}; window.prompt=()=>null;
}'''
fails=[]
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
    page=b.new_page(viewport={'width':1440,'height':1000}); errors=[]; page.on('pageerror',lambda exc: errors.append(str(exc)))
    page.set_content('<!doctype html><html><body><div id="app"></div></body></html>'); page.add_style_tag(content=css); page.evaluate(setup_js); page.add_script_tag(content=bundle); page.wait_for_timeout(850)
    page.evaluate(r'''() => {MediaFlowRuntime.registerPageRenderer('__v240_probe__',({state})=>{window.__mfState=state;return '<div>probe</div>';});App.setView('__v240_probe__');}'''); page.wait_for_timeout(50)
    ok=page.evaluate(r'''() => {const s=window.__mfState;if(!s||!s.categories?.length)return false;const c=s.categories[0];s.profilePicture='https://example.com/avatar.jpg';s.library=[{id:'v240-title',title:'Bleach: Sennen Kessen Hen - Kashin Tan',categoryId:c.id,status:'active',priority:'medium',progress:1,total:10,rating:10,estimatedMinutes:25,tags:['simkl','MAL-XML'],coverUrl:'https://example.com/cover.jpg',startedAt:Date.now()-86400000,year:2026,mediaFormat:'TV',durationMinutes:24,genres:['Action'],themes:['War'],synopsis:'Synopsis '.repeat(50)}];s.logDraft={entries:[],minutes:0,note:''};s.logging=false;s.currentTask={categoryId:c.id,low:1,high:1,targetMid:1,targetMin:1,targetMax:1,unit:c.unit||'episodes',reasons:[],title:null};s.settings.v181CoverSizes=s.settings.v181CoverSizes||{};return true;}''')
    if not ok:fails.append('state setup failed')

    # Edit Title requested pairings and full-width sections.
    page.evaluate("()=>App.openLibraryModal('v240-title')"); page.wait_for_timeout(160)
    edit=page.evaluate(r'''() => {const e=document.querySelector('.v240-library-editor'),m=document.querySelector('.modal');if(!e||!m)return null;const r=id=>{const x=document.querySelector(id)?.closest('.field')?.getBoundingClientRect();return x?{x:Math.round(x.x),y:Math.round(x.y),w:Math.round(x.width)}:null};const repeat=e.querySelector('.v240-repeat-panel')?.getBoundingClientRect();return {width:Math.round(m.getBoundingClientRect().width),category:r('#l-category'),status:r('#l-status'),progress:r('#l-progress'),total:r('#l-total'),repeat:repeat?Math.round(repeat.width):0,editor:Math.round(e.getBoundingClientRect().width),synopsis:!!document.querySelector('#l-rich-synopsis')};}''')
    page.evaluate('()=>App.closeModal()')

    # New cover-size setting is visible and actually changes logged title artwork.
    page.evaluate("()=>App.setView('settings')"); page.wait_for_timeout(160)
    setting=page.evaluate(r'''() => ({range:!!document.querySelector('#v181-cover-range-loggedTitles'),number:!!document.querySelector('#v181-cover-number-loggedTitles'),label:[...document.querySelectorAll('.v181-cover-setting label')].some(x=>/Logged \/ Batch selected covers/i.test(x.textContent||''))})''')
    page.evaluate("()=>App.v181SetCoverSize('loggedTitles',150)");
    page.evaluate(r'''() => {document.body.insertAdjacentHTML('beforeend','<article id="v240-cover-probe" class="v239-logged-title-card"><div class="v239-logged-cover v239-logged-cover-placeholder">X</div><div>Probe</div></article>');}'''); page.wait_for_timeout(40)
    cover=page.evaluate(r'''() => {const c=document.querySelector('#v240-cover-probe .v239-logged-cover');if(!c)return null;const r=c.getBoundingClientRect();return {w:Math.round(r.width),h:Math.round(r.height),setting:window.__mfState.settings.v181CoverSizes.loggedTitles};}''')

    # Sidebar profile button should no longer have the neutral v225 action icon.
    profile=page.evaluate(r'''() => ({icon:!!document.querySelector('.account-profile-btn .v225-btn-icon'),avatar:!!document.querySelector('.account-avatar-btn'),logout:!![...document.querySelectorAll('button')].find(x=>/log out/i.test(x.textContent||''))})''')

    # Backup/preset audit should include the new persistent setting.
    audit=page.evaluate(r'''() => {const a=App.v240AuditSnapshot(),b=a.backup,p=a.preset;return {backup:b?.settings?.v181CoverSizes?.loggedTitles,backupFlag:!!b?.backupManifest?.includes?.loggedTitleCoverSizeV240,preset:p?.settings?.v181CoverSizes?.loggedTitles,presetFlag:!!p?.presetManifest?.includes?.loggedTitleCoverSizeV240};}''')
    runtime=page.evaluate('()=>MediaFlowRuntime.version'); b.close()

if errors:fails.extend('pageerror: '+e for e in errors)
if runtime!=240:fails.append(f'runtime version {runtime}, expected 240')
if not edit:fails.append('v240 Edit Title layout missing')
else:
    if edit['width']<1100:fails.append(f'Edit Title too narrow: {edit}')
    if not edit['category'] or not edit['status'] or abs(edit['category']['y']-edit['status']['y'])>4:fails.append(f'Category + Status not paired: {edit}')
    if not edit['progress'] or not edit['total'] or abs(edit['progress']['y']-edit['total']['y'])>4:fails.append(f'Progress + Total not paired: {edit}')
    if edit['repeat']<edit['editor']*.8:fails.append(f'Repeat panel not using width: {edit}')
    if not edit['synopsis']:fails.append('Synopsis missing from editor')
if not setting or not all(setting.values()):fails.append(f'logged cover setting missing: {setting}')
if not cover or cover.get('setting')!=150 or cover.get('w',0)<65:fails.append(f'logged cover size did not apply: {cover}')
if profile.get('icon'):fails.append(f'profile action icon still present: {profile}')
if not profile.get('avatar') or not profile.get('logout'):fails.append(f'profile account controls damaged: {profile}')
if audit.get('backup')!=150 or audit.get('preset')!=150 or not audit.get('backupFlag') or not audit.get('presetFlag'):fails.append(f'backup/preset audit missing: {audit}')
print(json.dumps({'runtime':runtime,'edit':edit,'setting':setting,'cover':cover,'profile':profile,'audit':audit,'pageErrors':errors},indent=2))
if fails:
    print('v240 SMOKE FAILED'); [print('-',x) for x in fails]; sys.exit(1)
print('v240 SMOKE OK')
