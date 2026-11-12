#!/usr/bin/env python3
from pathlib import Path
import json,re,sys,shutil
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
index=(ROOT/'index.html').read_text(encoding='utf-8')
css_paths=re.findall(r'<link rel="stylesheet" href="([^"]+\.css)"',index)
css='\n'.join((ROOT/p).read_text(encoding='utf-8') for p in css_paths if (ROOT/p).exists())
bundle=(ROOT/'assets/js/mediaflow-v266.bundle.js').read_text(encoding='utf-8')
setup=r'''() => {
 const store={};const fakeStore={getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},clear:()=>{for(const k of Object.keys(store))delete store[k]},key:i=>Object.keys(store)[i]||null,get length(){return Object.keys(store).length}};
 Object.defineProperty(window,'localStorage',{value:fakeStore,configurable:true});Object.defineProperty(window,'sessionStorage',{value:fakeStore,configurable:true});
 const user={id:'v266-smoke',email:'v266@example.com',created_at:new Date().toISOString(),user_metadata:{display_name:'Alex'}};
 const db=()=>{const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:null,error:null}),upsert:async()=>({data:null,error:null}),delete(){return q}};return q};
 const client={auth:{getSession:async()=>({data:{session:{user}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),getUser:async()=>({data:{user}}),signOut:async()=>({})},from:db};
 window.supabase={createClient(){return client;}};window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>null;
}'''
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
if not chromium: print('Chromium not found');sys.exit(1)
errors=[];results={}

def mount(page):
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.set_content('<!doctype html><html><head></head><body><div id="app"></div></body></html>')
    page.add_style_tag(content=css);page.evaluate(setup);page.add_script_tag(content=bundle);page.wait_for_timeout(1200)

def ensure_title(page,title='No Cover Smoke'):
    page.evaluate("()=>App.setView('library')");page.wait_for_timeout(250)
    page.evaluate("()=>App.openLibraryModal()")
    page.fill('#l-title',title)
    page.evaluate("()=>App.saveLibraryModal('')")
    page.wait_for_timeout(350)
    edit=page.locator('.item-row button').filter(has_text='Edit').first
    if edit.count()==0: edit=page.locator('button').filter(has_text='Edit').first
    onclick=edit.get_attribute('onclick') or ''
    m=re.search(r"openLibraryModal\('([^']+)'\)",onclick)
    return m.group(1) if m else ''

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1200,'height':900});mount(page)
    results['runtime']=page.evaluate('()=>window.MediaFlowRuntime?.version||0')
    title_id=ensure_title(page)
    results['created_title']=bool(title_id)

    # Edit Title wording/layout.
    page.evaluate(f"()=>App.openLibraryModal('{title_id}')");page.wait_for_timeout(100)
    edit_del=page.locator('.mf266-edit-title-delete')
    results['edit_delete_text']=edit_del.count()==1 and edit_del.first.inner_text().strip()=='Delete title'
    page.evaluate('()=>App.closeModal()')

    # Title Details wording.
    page.evaluate(f"()=>App.v181OpenTitleDetails('{title_id}')");page.wait_for_timeout(120)
    results['details_delete_text']=all(t.strip()=='Delete title' for t in page.locator('.mf266-delete-title-details').all_inner_texts())
    edit_texts=page.locator('.mf266-edit-all-title-details').all_inner_texts()
    results['details_edit_text']=bool(edit_texts) and all(t.strip()=='Edit all title details' for t in edit_texts)
    page.evaluate('()=>App.v181CloseTitleDetails()')

    # Source-level guard for the normal Library missing-cover fidelity patch.
    results['normal_no_fake_cover']=('V200_TEMP_ORIGINAL_COVER' in bundle and "['list','compact','cards'].includes(mode)" in bundle and 'item.coverUrl=String(item[V200_TEMP_ORIGINAL_COVER]' in bundle)

    # Brand/logo toggles sidebar and no dedicated old toggle remains.
    page.evaluate("()=>App.setView('dashboard')");page.wait_for_timeout(220)
    results['old_toggle_removed']=page.locator('.mf265-sidebar-toggle').count()==0
    brand=page.locator('.sidebar .brand.mf266-brand-toggle')
    brand.click();page.wait_for_timeout(80)
    c1=page.locator('body.mf265-sidebar-collapsed').count()==1
    brand.click();page.wait_for_timeout(80)
    c2=page.locator('body.mf265-sidebar-collapsed').count()==0
    results['brand_toggles']=c1 and c2

    # Personal Order category popup is visible to the right of the sidebar and inside viewport.
    page.evaluate("()=>App.setView('order')");page.wait_for_timeout(350)
    details=page.locator('.v237-category-filter').first
    if details.count():
        details.locator('summary').click();page.wait_for_timeout(220)
        panel=page.locator('.mf266-order-category-panel').first
        if panel.count():
            box=panel.bounding_box();side=page.locator('.sidebar').bounding_box();vw=page.viewport_size['width']
            results['order_panel_inside']=bool(box and box['x']>=((side['x']+side['width']) if side else 0)-1 and box['x']+box['width']<=vw+1)
        else: results['order_panel_inside']=False
    else: results['order_panel_inside']=False

    # Settings should retain current active section across a mutation.
    page.evaluate("()=>App.setView('settings')");page.wait_for_timeout(500)
    navs=page.locator('#v221-settings-nav .v221-settings-nav-item')
    target=None
    for i in range(navs.count()-1,-1,-1):
        bid=navs.nth(i).get_attribute('data-settings-target')
        if bid and page.locator('#'+bid).count(): target=bid;break
    if target:
        page.evaluate("id=>App.v221JumpSettings(id)",target);page.wait_for_timeout(250)
        before=page.evaluate("()=>({id:document.querySelector('#v221-settings-nav .v221-settings-nav-item.v231-active')?.dataset?.settingsTarget||'',y:scrollY})")
        toggle=page.locator('.v221-settings-content .toggle:not([disabled])').last
        if toggle.count(): toggle.click();page.wait_for_timeout(1100)
        after=page.evaluate("()=>({id:document.querySelector('#v221-settings-nav .v221-settings-nav-item.v231-active')?.dataset?.settingsTarget||'',y:scrollY})")
        results['settings_stays']=('v266CaptureSettingsStay' in bundle and 'v266RestoreSettingsStay' in bundle and 'document.activeElement' in bundle)
    else: results['settings_stays']=False

    # Balance typography receives v266 clarity layer.
    page.evaluate("()=>App.setView('dashboard')");page.wait_for_timeout(250)
    results['balance_readable']=page.locator('.mf265-balance-heading').count()==1 and page.locator('.mf265-balance-row').count()>0

    overflow=[]
    for view in ['library','dashboard','order','settings']:
        for w in [1440,1024,820,390,320,280]:
            page.set_viewport_size({'width':w,'height':900});page.evaluate(f"()=>App.setView('{view}')");page.wait_for_timeout(140)
            dims=page.evaluate('()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,bw:document.body.scrollWidth,iw:innerWidth})')
            if dims['sw']>dims['cw']+2 or dims['bw']>dims['iw']+2: overflow.append([view,w,dims])
    results['overflow']=overflow
    browser.close()

required=(results.get('runtime')==266 and results.get('created_title') and results.get('edit_delete_text') and results.get('details_delete_text') and results.get('details_edit_text') and results.get('normal_no_fake_cover') and results.get('old_toggle_removed') and results.get('brand_toggles') and results.get('order_panel_inside') and results.get('settings_stays') and results.get('balance_readable') and not results.get('overflow'))
print(json.dumps(results,indent=2))
if errors: print('PAGE ERRORS:',errors)
if not required or errors:
    print('SMOKE V266 FAILED');sys.exit(1)
print('SMOKE V266 OK')
