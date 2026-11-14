#!/usr/bin/env python3
from pathlib import Path
import json,re,sys,shutil
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
index=(ROOT/'index.html').read_text(encoding='utf-8')
css_paths=re.findall(r'<link rel="stylesheet" href="([^"]+\.css)"',index)
css='\n'.join((ROOT/p).read_text(encoding='utf-8') for p in css_paths if (ROOT/p).exists())
bundle=(ROOT/'assets/js/mediaflow-v263.bundle.js').read_text(encoding='utf-8')
setup=r'''() => {
 const store={};const fakeStore={getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},clear:()=>{for(const k of Object.keys(store))delete store[k]},key:i=>Object.keys(store)[i]||null,get length(){return Object.keys(store).length}};
 Object.defineProperty(window,'localStorage',{value:fakeStore,configurable:true});Object.defineProperty(window,'sessionStorage',{value:fakeStore,configurable:true});
 const user={id:'v263-smoke',email:'v263@example.com',created_at:new Date().toISOString(),user_metadata:{display_name:'Alex'}};
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

    page.locator('.mf262-status-row button').filter(has_text='Completed').first.click()
    page.wait_for_timeout(180)
    results['normal_status_click']='Completed' in active_text(page,'.mf262-status-row button.active')

    normal_cats=page.locator('.mf262-category-row button')
    results['normal_category_count']=normal_cats.count()
    if normal_cats.count()>1:
        target=normal_cats.nth(1)
        target_text=' '.join(target.inner_text().split())
        target.click();page.wait_for_timeout(180)
        results['normal_category_click']=target_text.split('0')[0].strip().split('\n')[0] in active_text(page,'.mf262-category-row button.active') or normal_cats.nth(1).get_attribute('aria-pressed')=='true'
    else:
        results['normal_category_click']=False

    page.evaluate("()=>App.v181SetLibraryMode('dynamic')");page.wait_for_timeout(220)
    page.locator('.v181-dynamic-nav .mf262-status-row button').filter(has_text='Completed').first.click()
    page.wait_for_timeout(180)
    results['dynamic_status_click']='Completed' in active_text(page,'.v181-dynamic-nav .mf262-status-row button.active')

    dynamic_cats=page.locator('.v181-dynamic-nav .mf262-category-row button')
    if dynamic_cats.count()>1:
        target=dynamic_cats.nth(1);target.click();page.wait_for_timeout(180)
        results['dynamic_category_click']=page.locator('.v181-dynamic-nav .mf262-category-row button.active').count()==1 and page.locator('.v181-dynamic-nav .mf262-category-row button.active').first.get_attribute('aria-pressed')=='true'
    else:
        results['dynamic_category_click']=False

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

required=(results.get('runtime')==263 and results.get('normal_status_click') and results.get('normal_category_click') and results.get('dynamic_status_click') and results.get('dynamic_category_click') and results.get('mobile_status_tap') and results.get('mobile_category_tap') and not results.get('overflow'))
print(json.dumps(results,indent=2))
if errors:print('PAGE ERRORS:',errors)
if not required or errors:
    print('SMOKE V263 FAILED');sys.exit(1)
print('SMOKE V263 OK')
