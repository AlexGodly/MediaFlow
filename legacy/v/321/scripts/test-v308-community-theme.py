#!/usr/bin/env python3
"""v308 isolated browser smoke tests: guest theme isolation and signed-in palette sync.
No real Supabase network/authentication is used in this test.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
CSS='\n'.join((ROOT/'assets/css'/p).read_text(encoding='utf-8') for p in [
 '00-foundation.css','160-v302-community.css','161-v303-community-navigation.css',
 '162-v304-public-statistics.css','163-v305-community-navigation-auth.css',
 '164-v306-community-click-reliability.css','165-v308-community-theme-parity.css'])
JS=(ROOT/'src/js/components/233-v308-community-theme-parity.js').read_text(encoding='utf-8')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'],headless=True)
 checks=0
 for width in [1440,390,320]:
  page=b.new_page(viewport={'width':width,'height':840})
  errors=[]
  page.on('pageerror',lambda e: errors.append(str(e)))
  page.set_content('''<!doctype html><html data-theme="light"><head></head><body><div id="mf302-root">
   <div class="mf302-portal"><header class="mf302-top"><a class="mf302-brand">MediaFlow</a><nav class="mf302-nav"><a class="mf302-link active">Browse</a></nav><a class="mf302-btn primary">Workspace</a></header>
   <main class="mf302-content"><div class="mf302-hero"><h1>Discover more than a title.</h1><p>Theme checks</p></div><div class="mf302-grid"><article class="mf302-tile"><h3>Explore Titles</h3><p>A title card</p></article></div><input class="mf302-search" placeholder="Search"></main></div></div><div id="mf302-chat-widget"><section>Chat</section></div></body></html>''')
  page.add_style_tag(content=CSS)
  page.add_script_tag(content='''let AUTH_USER=null;const S={settings:{theme:'light'}};
    function mfShowPortal(){document.body.classList.add('mf302-public-active');}
    function mfHidePortal(){document.body.classList.remove('mf302-public-active');}
    function applyTheme(t){S.settings.theme=t;document.documentElement.dataset.theme=t;}
    async function startAuthenticatedApp(){}
    function renderAuthScreen(){};
  ''')
  page.add_script_tag(content=JS)
  page.evaluate('mfShowPortal()')
  v=page.evaluate('''() => ({signed:document.body.classList.contains('mf302-signed-in'),
    bg:getComputedStyle(document.querySelector('#mf302-root')).backgroundColor,
    top:getComputedStyle(document.querySelector('.mf302-top')).backgroundColor,
    mode:MediaFlowCommunityTheme.getState().mode})''')
  assert v['mode']=='guest' and not v['signed'] and v['bg']=='rgb(12, 16, 26)',('guest',width,v)
  checks+=1
  page.evaluate("AUTH_USER={id:'demo'};mfShowPortal();")
  colors=page.evaluate('''() => ({mode:MediaFlowCommunityTheme.getState().mode,
    bg:getComputedStyle(document.querySelector('#mf302-root')).backgroundColor,
    fg:getComputedStyle(document.querySelector('#mf302-root')).color,
    card:getComputedStyle(document.querySelector('.mf302-tile')).backgroundColor,
    chat:getComputedStyle(document.querySelector('#mf302-chat-widget>section')).backgroundColor})''')
  assert colors=={'mode':'workspace','bg':'rgb(245, 246, 248)','fg':'rgb(23, 26, 33)','card':'rgb(255, 255, 255)','chat':'rgb(255, 255, 255)'},('light',width,colors)
  checks+=1
  # Theme switches update the existing Community DOM rather than rebuilding it.
  page.evaluate("applyTheme('amoled')")
  result=page.evaluate('''() => ({bg:getComputedStyle(document.querySelector('#mf302-root')).backgroundColor,
    card:getComputedStyle(document.querySelector('.mf302-tile')).backgroundColor,
    fg:getComputedStyle(document.querySelector('#mf302-root')).color})''')
  assert result=={'bg':'rgb(0, 0, 0)','card':'rgb(5, 5, 5)','fg':'rgb(245, 245, 245)'},('amoled',width,result)
  checks+=1
  # Dynamic cover palette changes root variables without invoking new Community handlers.
  page.evaluate("document.documentElement.style.setProperty('--flow','#ff2870')")
  accent=page.evaluate("getComputedStyle(document.querySelector('.mf302-eyebrow')).color") if page.locator('.mf302-eyebrow').count() else page.evaluate("getComputedStyle(document.querySelector('.mf302-btn.primary')).borderTopColor")
  assert accent=='rgb(255, 40, 112)',('accent',width,accent)
  checks+=1
  # After signing out, guest palette stays original even while the Workspace
  # theme variables still contain the former account's AMOLED selection.
  page.evaluate("AUTH_USER=null;mfShowPortal()")
  result=page.evaluate('''() => ({signed:document.body.classList.contains('mf302-signed-in'),
    bg:getComputedStyle(document.querySelector('#mf302-root')).backgroundColor,
    mode:MediaFlowCommunityTheme.getState().mode})''')
  assert result=={'signed':False,'bg':'rgb(12, 16, 26)','mode':'guest'},('logout',width,result)
  checks+=1
  assert not errors,(width,errors)
  print(f'PASS: {width}px — guest dark unchanged, signed-in light, AMOLED, dynamic accent, sign-out isolation')
  page.close()
 b.close()
 print(f'PASS: {checks} isolated theme-browser assertions; zero JavaScript page errors')
