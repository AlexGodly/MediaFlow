"""MediaFlow v341 compiled-bundle History regression and large-data smoke test."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
BUNDLE=(ROOT/'assets/js/mediaflow-v341.bundle.js').read_text(encoding='utf-8')
assert BUNDLE.rstrip().endswith('})();')
BUNDLE=BUNDLE.rstrip()[:-len('})();')]+'''\nwindow.__v341Test={S,App,renderHistory,v260HistoryTab};\n})();\n'''
with sync_playwright() as playwright:
    browser=playwright.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1150,'height':900})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content('<main id="app"><div class="main"><div class="container"><div id="view-root"></div></div></div></main>')
    # sandboxed about:blank has no localStorage; give app a minimal mock.
    page.evaluate('''() => {const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}});}''')
    page.add_script_tag(content=BUNDLE)
    assert page.evaluate('!!window.__v341Test'),'compiled bundle did not initialize'
    page.evaluate('''() => {
       const S=__v341Test.S,now=Date.now();
       S.view='history';S.v260HistoryTab='consumption';
       S.categories=[{id:'anime',name:'Anime',unit:'episodes',color:'#78aaff',status:'active'}];
       S.library=[{id:'one',title:'First title',categoryId:'anime',status:'active',priority:'medium',coverUrl:''},{id:'two',title:'Second title',categoryId:'anime',status:'active',priority:'medium',coverUrl:''}];
       S.sessions=[{id:'log',timestamp:now-500000,date:new Date(now).toISOString().slice(0,10),categoryId:'anime',actualAmount:2,minutes:60,status:'complete',titles:[{libraryId:'one',title:'First title',qty:1},{libraryId:'two',title:'Second title',qty:1}]}];
       S.activityLog=Array.from({length:130},(_,i)=>({id:'change'+i,timestamp:now-i*1000,action:i%2?'Edit':'Create',detail:'Title '+i}));
       (document.getElementById('view-root')||document.body.appendChild(Object.assign(document.createElement('div'),{id:'view-root'}))).innerHTML=__v341Test.renderHistory();
    }''')
    page.locator('.v260-history-tab:has-text("Recently viewed")').click()
    assert page.locator('[data-history-view="recent"]').count()==1,'Recently Viewed failed to switch'
    assert page.locator('.v340-recent-card').count()==2,'Multi-title log not expanded'
    assert page.locator('.v260-history-tab.active:has-text("Recently viewed")').count()==1
    page.locator('.v340-recent-toolbar input[type="search"]').fill('Second')
    assert page.locator('.v340-recent-card').count()==1,'Recent search filter failed'
    assert page.locator('.v340-recent-toolbar input[type="search"]').input_value()=='Second'
    page.locator('.v260-history-tab:has-text("Library")').click()
    assert page.locator('[data-history-view="library"]').count()==1
    assert page.locator('.v341-lib-history-toolbar').count()==1
    assert page.locator('.mf-activity-row').count()==50
    assert 'Page 1 of 3' in page.locator('.v241-library-history-pager').first.inner_text()
    page.locator('.v241-library-history-pager').first.get_by_text('Next').click()
    assert page.locator('.mf-activity-row').count()==50
    assert 'Page 2 of 3' in page.locator('.v241-library-history-pager').first.inner_text()
    page.locator('#v341-lib-history-size').select_option('25')
    assert page.locator('.mf-activity-row').count()==25
    assert 'Page 1 of 6' in page.locator('.v241-library-history-pager').first.inner_text()
    page.locator('#v341-lib-history-query').fill('Title 12')
    assert page.locator('.mf-activity-row').count()==11
    assert page.locator('#v341-lib-history-query').input_value()=='Title 12'
    page.locator('.v260-history-tab:has-text("Recently viewed")').click()
    assert page.locator('[data-history-view="recent"]').count()==1
    # Realistic high-volume exercise. Only a page of DOM rows should render.
    perf=page.evaluate('''() => {
      const S=__v341Test.S,now=Date.now();
      S.library=Array.from({length:18000},(_,i)=>({id:'l'+i,title:'Title '+i,categoryId:'anime',status:'active',priority:'medium'}));
      S.sessions=Array.from({length:15000},(_,i)=>({id:'s'+i,timestamp:now-i*60000,date:new Date(now-i*60000).toISOString().slice(0,10),categoryId:'anime',status:'complete',minutes:30,titles:[{title:'Title '+(i%9000),libraryId:'l'+(i%9000),qty:1,loggedAt:now-i*60000}]}));
      S.v261HistoryUI.recent.query='';S.v261HistoryUI.recent.category='all';S.v261HistoryUI.recent.period='all';S.v261HistoryUI.recent.page=0;
      __v341Test.App.v260SetHistoryTab('consumption');
      const a=performance.now();__v341Test.App.v260SetHistoryTab('recent');const first=performance.now()-a;
      const b=performance.now();__v341Test.App.v261SetHistoryPage('recent',1);const paging=performance.now()-b;
      return {first,paging,cards:document.querySelectorAll('.v340-recent-card').length,pager:document.querySelector('.v261-history-pager')?.textContent};
    }''')
    assert perf['cards']==50,perf
    assert 'Page 2 of 180' in perf['pager'],perf
    assert perf['first']<5000 and perf['paging']<1000,perf
    assert not errors,errors[:5]
    print('PASS v341 actual compiled app bundle: clickable tabs, multi-title recent, search focus, Library History pagination/filter, 15k logs and 18k Library titles')
    print('Large-data timing (ms): initial recent',round(perf['first']),'page change',round(perf['paging']))
    browser.close()
