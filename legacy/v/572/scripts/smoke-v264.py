#!/usr/bin/env python3
from pathlib import Path
import json,re,sys,shutil
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
index=(ROOT/'index.html').read_text(encoding='utf-8')
css_paths=re.findall(r'<link rel="stylesheet" href="([^"]+\.css)"',index)
css='\n'.join((ROOT/p).read_text(encoding='utf-8') for p in css_paths if (ROOT/p).exists())
bundle=(ROOT/'assets/js/mediaflow-v264.bundle.js').read_text(encoding='utf-8')
setup=r'''() => {
 const store={};const fakeStore={getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},clear:()=>{for(const k of Object.keys(store))delete store[k]},key:i=>Object.keys(store)[i]||null,get length(){return Object.keys(store).length}};
 Object.defineProperty(window,'localStorage',{value:fakeStore,configurable:true});Object.defineProperty(window,'sessionStorage',{value:fakeStore,configurable:true});
 const user={id:'v264-smoke',email:'v264@example.com',created_at:new Date().toISOString(),user_metadata:{display_name:'Alex'}};
 const db=()=>{const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:null,error:null}),upsert:async()=>({data:null,error:null}),delete(){return q}};return q};
 const client={auth:{getSession:async()=>({data:{session:{user}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),getUser:async()=>({data:{user}}),signOut:async()=>({})},from:db};
 window.supabase={createClient(){return client;}};window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>null;
}'''

chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
if not chromium:
    print('Chromium not found');sys.exit(1)

results={};errors=[]

def mount(page):
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.set_content('<!doctype html><html><head></head><body><div id="app"></div></body></html>')
    page.add_style_tag(content=css)
    page.evaluate(setup)
    page.add_script_tag(content=bundle)
    page.wait_for_timeout(1100)
    page.evaluate("()=>App.setView('library')")
    page.wait_for_timeout(220)

def active_text(page,selector):
    return ' '.join(' '.join(x.split()) for x in page.locator(selector).all_text_contents())

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])

    # Desktop mouse clicks — exact regression from v262.
    page=browser.new_page(viewport={'width':1024,'height':900})
    mount(page)
    results['runtime']=page.evaluate('()=>window.MediaFlowRuntime?.version||0')

    # v263 click/tap regression remains fixed.
    page.locator('.mf262-status-row button').filter(has_text='Completed').first.click()
    page.wait_for_timeout(180)
    results['normal_status_click']='Completed' in active_text(page,'.mf262-status-row button.active')

    normal_cats=page.locator('.mf262-category-row button')
    results['normal_category_count']=normal_cats.count()
    if normal_cats.count()>1:
        target=normal_cats.nth(1); target.click(); page.wait_for_timeout(180)
        results['normal_category_click']=page.locator('.mf262-category-row button.active').count()>=1
    else:
        results['normal_category_click']=False

    # v264 sticky search + expand control.
    results['normal_search']=page.locator('.mf262-library-filter-dock .mf264-library-search').count()==1
    results['normal_expand']=page.locator('.mf264-category-expand').count()==1
    # Capture Normal order, then compare with the Dynamic row after switching.
    normal_ids=[]
    for i in range(1,page.locator('.mf262-category-row button').count()):
        oc=page.locator('.mf262-category-row button').nth(i).get_attribute('onclick') or ''
        m=re.search(r"v262ToggleClassicCategory\('([^']+)'\)",oc); normal_ids.append(m.group(1) if m else '')

    page.evaluate("()=>App.v181SetLibraryMode('dynamic')");page.wait_for_timeout(220)
    dynamic_ids=[]
    for i in range(page.locator('.v181-dynamic-nav .mf262-category-row button').count()):
        oc=page.locator('.v181-dynamic-nav .mf262-category-row button').nth(i).get_attribute('onclick') or ''
        m=re.search(r"v181SelectDynamicCategory\('([^']+)'\)",oc); dynamic_ids.append(m.group(1) if m else '')
    results['normal_dynamic_order']=normal_ids==dynamic_ids
    results['dynamic_search']=page.locator('.v181-dynamic-nav .mf264-library-search').count()==1
    page.locator('.v181-dynamic-nav .mf262-status-row button').filter(has_text='Completed').first.click()
    page.wait_for_timeout(180)
    results['dynamic_status_click']='Completed' in active_text(page,'.v181-dynamic-nav .mf262-status-row button.active')

    dynamic_cats=page.locator('.v181-dynamic-nav .mf262-category-row button')
    if dynamic_cats.count()>1:
        target=dynamic_cats.nth(1);target.click();page.wait_for_timeout(180)
        results['dynamic_category_click']=page.locator('.v181-dynamic-nav .mf262-category-row button.active').count()==1 and page.locator('.v181-dynamic-nav .mf262-category-row button.active').first.get_attribute('aria-pressed')=='true'
    else:
        results['dynamic_category_click']=False

    # Dashboard balance redesign removes old MediaFlow mini-logo treatment.
    page.evaluate("()=>App.setView('dashboard')");page.wait_for_timeout(220)
    results['balance_redesign']=page.locator('.mf264-balance-heading').count()==1 and page.locator('.mf264-balance-row').count()>0 and page.locator('.v261-mediaflow-mini').count()==0

    # Settings rerenders should not throw the user back to the top.
    page.evaluate("()=>App.setView('settings')");page.wait_for_timeout(350)
    toggles=page.locator('.v221-settings-content .toggle:not([disabled])')
    if toggles.count():
        t=toggles.last; t.scroll_into_view_if_needed(); page.wait_for_timeout(80); before=page.evaluate('()=>window.scrollY'); t.click(); page.wait_for_timeout(320); after=page.evaluate('()=>window.scrollY'); results['settings_scroll_preserved']=abs(after-before)<180
    else:
        results['settings_scroll_preserved']=False

    page.evaluate("()=>App.setView('library')");page.wait_for_timeout(220)
    # Touch taps — verify mobile/tablet path doesn't get swallowed by pointer capture.
    context=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
    mobile=context.new_page();mount(mobile)
    mobile.locator('.mf262-status-row button').filter(has_text='Completed').first.tap();mobile.wait_for_timeout(180)
    results['mobile_status_tap']='Completed' in active_text(mobile,'.mf262-status-row button.active')
    mobile_cats=mobile.locator('.mf262-category-row button')
    if mobile_cats.count()>1:
        mobile_cats.nth(1).tap();mobile.wait_for_timeout(180)
        results['mobile_category_tap']=mobile.locator('.mf262-category-row button.active').count()>=1 and mobile.locator('.mf262-category-row button.active').first.get_attribute('aria-pressed')=='true'
    else:
        results['mobile_category_tap']=False
    context.close()

    # No layout regression across v262's supported widths.
    overflow=[]
    for w in [1440,1024,820,390,320,280]:
        page.set_viewport_size({'width':w,'height':900});page.evaluate("()=>App.setView('library')");page.wait_for_timeout(70)
        dims=page.evaluate('()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,bw:document.body.scrollWidth,iw:innerWidth})')
        if dims['sw']>dims['cw']+2 or dims['bw']>dims['iw']+2:overflow.append([w,dims])
    results['overflow']=overflow
    browser.close()

required=(results.get('runtime')==264 and results.get('normal_status_click') and results.get('normal_category_click') and results.get('normal_search') and results.get('normal_expand') and results.get('normal_dynamic_order') and results.get('dynamic_search') and results.get('dynamic_status_click') and results.get('dynamic_category_click') and results.get('balance_redesign') and results.get('settings_scroll_preserved') and results.get('mobile_status_tap') and results.get('mobile_category_tap') and not results.get('overflow'))
print(json.dumps(results,indent=2))
if errors:print('PAGE ERRORS:',errors)
if not required or errors:
    print('SMOKE V264 FAILED');sys.exit(1)
print('SMOKE V264 OK')
