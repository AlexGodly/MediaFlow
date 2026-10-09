#!/usr/bin/env python3
from pathlib import Path
import json,re,sys,shutil
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
index=(ROOT/'index.html').read_text(encoding='utf-8')
css_paths=re.findall(r'<link rel="stylesheet" href="([^"]+\.css)"',index)
css='\n'.join((ROOT/p).read_text(encoding='utf-8') for p in css_paths if (ROOT/p).exists())
bundle=(ROOT/'assets/js/mediaflow-v265.bundle.js').read_text(encoding='utf-8')
setup=r'''() => {
 const store={};const fakeStore={getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},clear:()=>{for(const k of Object.keys(store))delete store[k]},key:i=>Object.keys(store)[i]||null,get length(){return Object.keys(store).length}};
 Object.defineProperty(window,'localStorage',{value:fakeStore,configurable:true});Object.defineProperty(window,'sessionStorage',{value:fakeStore,configurable:true});
 const user={id:'v265-smoke',email:'v265@example.com',created_at:new Date().toISOString(),user_metadata:{display_name:'Alex'}};
 const db=()=>{const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:null,error:null}),upsert:async()=>({data:null,error:null}),delete(){return q}};return q};
 const client={auth:{getSession:async()=>({data:{session:{user}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),getUser:async()=>({data:{user}}),signOut:async()=>({})},from:db};
 window.supabase={createClient(){return client;}};window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>null;
}'''
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
if not chromium:
    print('Chromium not found');sys.exit(1)
errors=[];results={}

def mount(page):
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.set_content('<!doctype html><html><head></head><body><div id="app"></div></body></html>')
    page.add_style_tag(content=css);page.evaluate(setup);page.add_script_tag(content=bundle);page.wait_for_timeout(1200)

def ensure_title(page):
    page.evaluate("()=>App.setView('library')");page.wait_for_timeout(250)
    page.evaluate("()=>App.openLibraryModal()")
    page.fill('#l-title','MediaFlow Smoke Title')
    page.evaluate("()=>App.saveLibraryModal('')")
    page.wait_for_timeout(300)
    edit=page.locator('.item-row button').filter(has_text='Edit').first
    if edit.count()==0:
        # Dynamic/card render fallback: locate any Edit title action and derive its id.
        edit=page.locator('button').filter(has_text='Edit').first
    onclick=edit.get_attribute('onclick') or ''
    m=re.search(r"openLibraryModal\('([^']+)'\)",onclick)
    return m.group(1) if m else ''

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1200,'height':900});mount(page)
    results['runtime']=page.evaluate('()=>window.MediaFlowRuntime?.version||0')

    # Sidebar collapse/expand.
    page.wait_for_selector('.mf265-sidebar-toggle')
    page.click('.mf265-sidebar-toggle');page.wait_for_timeout(80)
    results['sidebar_collapses']=page.locator('body.mf265-sidebar-collapsed').count()==1
    page.click('.mf265-sidebar-toggle');page.wait_for_timeout(80)
    results['sidebar_expands']=page.locator('body.mf265-sidebar-collapsed').count()==0

    title_id=ensure_title(page)
    results['created_title']=bool(title_id)

    # Edit Title has a top-level delete action and designed confirmation.
    page.evaluate(f"()=>App.openLibraryModal('{title_id}')");page.wait_for_timeout(80)
    results['edit_delete']=page.locator('.mf265-edit-title-head .btn-danger').count()==1
    page.locator('.mf265-edit-title-head .btn-danger').click();page.wait_for_timeout(80)
    results['designed_confirmation']=page.locator('.mf265-delete-title-confirm').count()==1
    page.evaluate('()=>App.closeModal()')

    # Title Details exposes delete as well.
    page.evaluate(f"()=>App.v181OpenTitleDetails('{title_id}')");page.wait_for_timeout(100)
    results['details_delete']=page.locator('.v181-title-details-overlay .mf265-delete-title-details').count()>=1
    page.locator('.v181-title-details-overlay .mf265-delete-title-details').first.click();page.wait_for_timeout(100)
    results['details_confirmation']=page.locator('.mf265-delete-title-confirm').count()==1
    page.evaluate('()=>App.closeModal()')

    # Library search remains focused through refreshes.
    page.evaluate("()=>App.setView('library')");page.wait_for_timeout(250)
    search=page.locator('.mf264-library-search:visible').first
    search.click();search.fill('M');page.wait_for_timeout(340)
    active1=page.evaluate("()=>document.activeElement?.classList?.contains('mf264-library-search')||false")
    page.keyboard.type('e');page.wait_for_timeout(340)
    active2=page.evaluate("()=>document.activeElement?.classList?.contains('mf264-library-search')||false")
    results['search_focus']=active1 and active2 and page.locator('.mf264-library-search:visible').first.input_value()=='Me'
    # Hidden legacy category filter never resurfaces.
    cats=page.locator('.mf262-category-row button')
    if cats.count()>1:
        cats.nth(1).click();page.wait_for_timeout(220)
    results['legacy_filter_hidden']=page.evaluate("()=>[...document.querySelectorAll('#view-root .lib-toolbar .v66-cat-filter')].every(el=>getComputedStyle(el).display==='none')")
    results['normal_status_icons']=page.locator('.mf262-library-filter-dock .mf262-status-row .mf265-status-icon').count()>=5

    # Today's Balance is intentionally non-interactive and clean.
    page.evaluate("()=>App.setView('dashboard')");page.wait_for_timeout(250)
    results['balance_rows']=page.locator('.mf265-balance-row').count()>0
    results['balance_noninteractive']=page.evaluate("()=>[...document.querySelectorAll('.mf265-balance-row')].every(el=>el.tagName==='ARTICLE'&&!el.hasAttribute('onclick')&&!el.querySelector('button'))")

    # Settings mutations preserve the existing Settings DOM node instead of rebuilding it.
    page.evaluate("()=>App.setView('settings')");page.wait_for_timeout(450)
    page.evaluate("()=>{const el=document.querySelector('.v221-settings-page'); if(el)el.dataset.v265Identity='keep';}")
    toggle=page.locator('.v221-settings-content .toggle:not([disabled])').first
    if toggle.count(): toggle.click();page.wait_for_timeout(300)
    results['settings_no_rebuild']=page.evaluate("()=>document.querySelector('.v221-settings-page')?.dataset?.v265Identity==='keep'")

    # Personal Order category panel must remain inside viewport.
    page.evaluate("()=>App.setView('order')");page.wait_for_timeout(350)
    details=page.locator('.v237-category-filter').first
    if details.count():
        details.locator('summary').click();page.wait_for_timeout(180)
        panel=page.locator('.mf265-order-category-panel').first
        if panel.count():
            box=panel.bounding_box();results['order_panel_inside']=bool(box and box['x']>=-1 and box['x']+box['width']<=page.viewport_size['width']+1)
        else: results['order_panel_inside']=False
    else: results['order_panel_inside']=False

    overflow=[]
    for view in ['library','dashboard','order','settings']:
        for w in [1440,1024,820,390,320,280]:
            page.set_viewport_size({'width':w,'height':900});page.evaluate(f"()=>App.setView('{view}')");page.wait_for_timeout(130)
            dims=page.evaluate('()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,bw:document.body.scrollWidth,iw:innerWidth})')
            if dims['sw']>dims['cw']+2 or dims['bw']>dims['iw']+2: overflow.append([view,w,dims])
    results['overflow']=overflow
    browser.close()

required=(results.get('runtime')==265 and results.get('sidebar_collapses') and results.get('sidebar_expands') and results.get('created_title') and results.get('edit_delete') and results.get('designed_confirmation') and results.get('details_delete') and results.get('details_confirmation') and results.get('search_focus') and results.get('legacy_filter_hidden') and results.get('normal_status_icons') and results.get('balance_rows') and results.get('balance_noninteractive') and results.get('settings_no_rebuild') and results.get('order_panel_inside') and not results.get('overflow'))
print(json.dumps(results,indent=2))
if errors: print('PAGE ERRORS:',errors)
if not required or errors:
    print('SMOKE V265 FAILED');sys.exit(1)
print('SMOKE V265 OK')
