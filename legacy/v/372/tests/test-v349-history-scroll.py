"""v349: entering History from another view resets scroll, internal redraws do not."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
source=(ROOT/'assets/js/mediaflow-v349.bundle.js').read_text(encoding='utf-8').rstrip()
assert source.endswith('})();')
source=source[:-len('})();')]+'''\nwindow.__v349Test={S,App,render,renderView,v349HistoryScrollTop};\n})();\n'''
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1200,'height':780})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content('<div id="app"></div>')
    page.evaluate("() => {const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}});}")
    page.add_script_tag(content=source)
    page.evaluate('''()=>{
      document.body.innerHTML='<div id="app"><aside class="sidebar"></aside><main class="main" style="min-height:3600px"><div class="container"><div id="view-root"></div></div></main></div>';
      const S=window.__v349Test.S;
      S.view='library';S.sessions=[];S.library=[];S.collections=[];
      S.categories=[{id:'anime',name:'Anime',unit:'episodes',color:'#a1baff',target:1}];
      S.xpLedger=S.xpLedger||{};
      window.scrollTo(0,1250);
    }''')
    assert page.evaluate('window.scrollY')>1000,'failed to make scrollable test page'
    page.evaluate("()=>window.__v349Test.App.setView('history')")
    page.wait_for_timeout(80)
    assert page.evaluate('window.scrollY')==0,'History should open at top on desktop navigation'
    assert page.locator('.v260-history-page').count()==1,'History page missing'
    assert page.evaluate('window.__v349Test.S.v260HistoryTab||"consumption"') in ['consumption','xp','recent','ratings','library','logs']
    page.evaluate('window.scrollTo(0,1100)')
    page.evaluate('window.__v349Test.render()')
    assert page.evaluate('window.scrollY')>1000,'internal History rerender should retain scroll'
    page.evaluate("()=>window.__v349Test.App.setView('history')")
    assert page.evaluate('window.scrollY')>1000,'re-clicking History should not reset existing History position'
    page.evaluate("()=>{window.__v349Test.S.view='library';window.scrollTo(0,1300);window.__v349Test.App.mobileNav('history')}")
    page.wait_for_timeout(80)
    assert page.evaluate('window.scrollY')==0,'History should open at top on mobile navigation'
    assert not errors, errors[:8]
    print('PASS v349: desktop/mobile initial History scroll reset, internal redraw/re-click preserve scroll')
    browser.close()
