#!/usr/bin/env python3
from pathlib import Path
import shutil, sys
try:
    from playwright.sync_api import sync_playwright
except Exception as e:
    print('v233 SMOKE FAILED: Playwright unavailable:', e); sys.exit(1)
ROOT=Path(__file__).resolve().parents[1]
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
if not chromium:
    print('v233 SMOKE FAILED: Chromium unavailable'); sys.exit(1)
css_order=['00-foundation.css','10-navigation-core-ui.css','20-dashboard-personal-order.css','30-categories-themes-navigation.css','40-system-import-tools.css','50-library-dashboard.css','60-statistics.css','70-full-style-themes.css','80-late-control-center.css','92-v221-settings-polish.css','93-v222-dashboard-rendering-stability.css','94-v224-library-sorting-actions.css','95-v225-icons-personal-order.css','96-v226-semantic-ui-library.css','97-v227-ui-icon-corrections.css','98-v228-library-priority-dynamic-row.css','99-v229-library-choice-modals.css','100-v230-choice-filter-layout.css','101-v231-settings-layout-inheritance.css','102-v232-performance-details-settings.css','103-v233-dynamic-settings-title-details-cover.css','104-v234-dashboard-quick-inputs.css']
setup=r'''() => {const store={};const fake={getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k],clear:()=>Object.keys(store).forEach(k=>delete store[k]),key:i=>Object.keys(store)[i]||null,get length(){return Object.keys(store).length}};Object.defineProperty(window,'localStorage',{value:fake,configurable:true});Object.defineProperty(window,'sessionStorage',{value:fake,configurable:true});const user={id:'v233',email:'v233@example.com',created_at:new Date().toISOString(),user_metadata:{display_name:'v233'}};const db=()=>{const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:null,error:null}),upsert:async()=>({data:null,error:null}),delete(){return q}};return q};window.supabase={createClient(){return {auth:{getSession:async()=>({data:{session:{user}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),getUser:async()=>({data:{user}}),signOut:async()=>({})},from:db}}};window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>null;}'''
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
    page=b.new_page(viewport={'width':1600,'height':1100})
    errors=[]; page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content('<!doctype html><html><body><div id="app"></div></body></html>')
    for name in css_order: page.add_style_tag(content=(ROOT/'assets/css'/name).read_text(encoding='utf-8'))
    page.evaluate(setup); page.add_script_tag(content=(ROOT/'assets/js/mediaflow-v234.bundle.js').read_text(encoding='utf-8')); page.wait_for_timeout(900)
    page.evaluate("()=>App.setView('settings')"); page.wait_for_timeout(350)
    settings=page.evaluate(r'''() => {const g=[...document.querySelectorAll('.v221-settings-nav-group')].find(x=>x.querySelector('.v221-settings-nav-title')?.textContent.trim()==='Library');const items=[...(g?.querySelectorAll('.v221-settings-nav-item')||[])];const names=items.map(x=>x.textContent.trim());const d=items.find(x=>x.textContent.trim()==='DYNAMIC SETTINGS');const labels=[...document.querySelectorAll('.v221-settings-content .section-label')].filter(x=>!x.closest('.card'));const dl=labels.find(x=>{const c=x.cloneNode(true);c.querySelectorAll('button').forEach(b=>b.remove());return c.textContent.trim().replace(/\s+/g,' ')==='DYNAMIC SETTINGS'});const card=dl?.nextElementSibling;return {names:names.slice(0,3),icon:d?.dataset.v226SemanticIcon||'',card:!!card,icons:!!card?.querySelector('select[aria-label="Dynamic Library category row icons"]'),order:!!card?.querySelector('select[aria-label="Dynamic Library category row order"]'),status:/DYNAMIC STATUS ROW/.test(card?.textContent||''),cover:!!document.getElementById('v181-cover-number-titleDetails')};}''')
    cover=page.evaluate(r'''() => {App.v181SetCoverSize('titleDetails',100);const p=document.createElement('div');p.className='v181-title-details-modal';p.innerHTML='<div class="v181-title-hero"><img class="v181-title-hero-cover"></div>';document.body.appendChild(p);const i=p.querySelector('img');const a=i.getBoundingClientRect().width;App.v181SetCoverSize('titleDetails',150);const z=i.getBoundingClientRect().width;p.remove();return {a,z,stored:MediaFlowRuntime.getSettings().v181CoverSizes.titleDetails};}''')
    b.close()
fail=[]
if settings['names']!=['LIBRARY MODE','DYNAMIC SETTINGS','CATEGORIES']: fail.append(f"Library Settings order: {settings['names']}")
if settings['icon']!='dynamicSettings': fail.append(f"Dynamic Settings icon: {settings['icon']}")
for k in ['card','icons','order','status','cover']:
    if not settings[k]: fail.append(f"Missing v233 Settings behavior: {k}")
if cover['a']!=92 or cover['z']!=138 or cover['stored']!=150: fail.append(f"Title Details cover scaling failed: {cover}")
if errors: fail += ['browser error: '+e for e in errors]
if fail:
    print('v233 SMOKE FAILED'); [print('-',x) for x in fail]; sys.exit(1)
print('v233 SMOKE OK')
print('Library Settings order:', ' → '.join(settings['names']))
print('Title Details cover:', cover['a'], 'px →', cover['z'], 'px at 150%')
