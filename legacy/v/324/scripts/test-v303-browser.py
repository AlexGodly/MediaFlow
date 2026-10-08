#!/usr/bin/env python3
"""Isolated, offline DOM integration smoke test for the public v303 guest UI.
Uses a mocked Supabase client. Network and full authenticated flows are not exercised.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT = Path(__file__).resolve().parents[1]
JS = (ROOT/'assets/js/mediaflow-v303.bundle.js').read_text()
CSS = (ROOT/'assets/css/160-v302-community.css').read_text() + '\n' + (ROOT/'assets/css/161-v303-community-navigation.css').read_text()
with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox','--disable-dev-shm-usage'])
    page = browser.new_page(viewport={'width':1200,'height':800})
    errors=[]
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.set_content('<!doctype html><html><head><title>MediaFlow</title></head><body><div id="app">Loading…</div></body></html>')
    page.evaluate('''() => {
      window.history.pushState=()=>{};
      const memory=new Map();
      Object.defineProperty(window,'localStorage',{configurable:true,value:{
       getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v)),
       removeItem:k=>memory.delete(k),clear:()=>memory.clear(),
       key:i=>[...memory.keys()][i]||null,get length(){return memory.size}
      }});
      window.supabase={createClient:()=>({
       auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe:()=>{}}}})},
       from:()=>({select:()=>({eq(){return this},limit:async()=>({data:[],error:null})})}),
       rpc:async()=>({data:[],error:null})
      })};
    }''')
    page.add_style_tag(content=CSS)
    page.add_script_tag(content=JS)
    page.wait_for_timeout(120)
    passed=0
    for width in (1200,390):
        page.set_viewport_size({'width':width,'height':800})
        page.evaluate("window.MF302.go('')")
        assert 'Discover more than a title' in page.locator('#mf302-content h1').inner_text()
        assert page.locator('.mf302-brand img').get_attribute('src')=='assets/icons/mediaflow-192.png'
        assert page.locator('.mf302-mark').count()==0
        assert 'Log in' in page.locator('.mf303-workspace-button').inner_text()
        passed+=1
        for target,title in [('browse','Browse titles'),('collections','Public Collections'),('ratings','Community ratings'),('users','Explore people')]:
            selector=('.mf302-nav ' if width>850 else '.mf302-mobile-nav ')+f'[data-mf303-target="{target}"]'
            page.locator(selector).click()
            page.wait_for_timeout(100)
            assert page.locator('#mf302-content h1').inner_text()==title,(width,target)
            assert page.evaluate('window.MF302.page')==target
            passed+=1
        page.locator('.mf302-brand').click()
        assert 'Discover more than a title' in page.locator('#mf302-content h1').inner_text()
        passed+=1
        page.locator('.mf303-workspace-button').click()
        assert page.evaluate('!document.body.classList.contains("mf302-public-active")')
        assert 'Log in' in page.locator('#app').inner_text()
        passed+=1
    assert not errors,errors
    print(f'PASS: {passed} isolated guest browser interaction tests across 1200px and 390px; zero page errors.')
    browser.close()
