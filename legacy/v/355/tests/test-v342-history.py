"""MediaFlow v342 Recently Viewed UI polish smoke test."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
BUNDLE=(ROOT/'assets/js/mediaflow-v342.bundle.js').read_text(encoding='utf-8')
assert BUNDLE.rstrip().endswith('})();')
BUNDLE=BUNDLE.rstrip()[:-len('})();')]+'''\nwindow.__v342Test={S,App,renderHistory,v260HistoryTab};\n})();\n'''
with sync_playwright() as playwright:
    browser=playwright.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1400,'height':1000})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content('<main id="app"><div class="main"><div class="container"><div id="view-root"></div></div></div></main>')
    page.evaluate('''() => {const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}});}''')
    page.add_script_tag(content=BUNDLE)
    now=page.evaluate('Date.now()')
    page.evaluate('''(now) => {
       const S=window.__v342Test.S;
       S.view='history';S.v260HistoryTab='recent';
       S.categories=[{id:'sa',name:'Seasonal Anime',unit:'episodes',color:'#78aaff'},{id:'am',name:'Anime Movies',unit:'movies',color:'#ff9a3e'}];
       S.library=[
         {id:'one',title:'Tokyo Revengers: Santen Sensou-hen',categoryId:'sa',status:'active',priority:'medium',coverUrl:'https://example.com/a.jpg'},
         {id:'two',title:'Meitantei Conan: 30-gou Satsujin Jiken',categoryId:'am',status:'active',priority:'medium',coverUrl:'https://example.com/b.jpg'}
       ];
       S.sessions=[
         {id:'log1',timestamp:now-500000,date:new Date(now).toISOString().slice(0,10),categoryId:'sa',actualAmount:1,minutes:25,status:'complete',titles:[{libraryId:'one',title:'Tokyo Revengers: Santen Sensou-hen',qty:1,loggedAt:now-500000}]},
         {id:'log2',timestamp:now-400000,date:new Date(now).toISOString().slice(0,10),categoryId:'am',actualAmount:1,minutes:25,status:'complete',titles:[{libraryId:'two',title:'Meitantei Conan: 30-gou Satsujin Jiken',qty:1,loggedAt:now-400000}]}
       ];
       (document.getElementById('view-root')||document.body.appendChild(Object.assign(document.createElement('div'),{id:'view-root'}))).innerHTML=window.__v342Test.renderHistory();
    }''', now)
    page.locator('.v260-history-tab:has-text("Recently viewed")').click()
    assert page.locator('.v342-recent-card').count()==2
    assert page.locator('.v342-recent-name svg').count()==0
    assert page.locator('.v342-recent-category').count()==2
    assert page.locator('.v342-recent-actions .v342-recent-edit').count()==2
    assert page.locator('.v342-recent-day-badge').count()>=1
    assert not errors,errors[:5]
    print('PASS v342 recent-view UI polish')
    browser.close()
