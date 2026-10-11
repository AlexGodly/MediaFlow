"""MediaFlow v344 Recently Viewed icon-removal smoke test."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
BUNDLE=(ROOT/'assets/js/mediaflow-v344.bundle.js').read_text(encoding='utf-8')
assert BUNDLE.rstrip().endswith('})();')
BUNDLE=BUNDLE.rstrip()[:-len('})();')]+'\nwindow.__v344Test={S,renderHistory};\n})();\n'
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1200,'height':900})
    errs=[]
    page.on('pageerror', lambda e: errs.append(str(e)))
    page.set_content('<main id="app"><div class="main"><div class="container"><div id="view-root"></div></div></div></main>')
    page.evaluate("() => {const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}});}")
    page.add_script_tag(content=BUNDLE)
    def ts_for_hour(h):
        return page.evaluate(f"() => {{ const d=new Date(); d.setHours({h},30,0,0); return d.getTime(); }}")
    payload=[]
    for sid,title,hour in [('a','One Piece',20),('b','Morning Show',8)]:
        ts=ts_for_hour(hour)
        date=page.evaluate(f"() => new Date({ts}).toISOString().slice(0,10)")
        payload.append({'id':sid,'timestamp':ts,'date':date,'categoryId':'cat1','minutes':25,'actualAmount':1,'status':'complete','titles':[{'libraryId':sid,'title':title,'qty':1,'loggedAt':ts}]})
    page.evaluate('''(payload)=>{
      const S=window.__v344Test.S; S.view='history'; S.v260HistoryTab='recent';
      S.categories=[{id:'cat1',name:'Seasonal Anime',unit:'episodes',color:'#77aaff'}];
      S.library=payload.map((s)=>({id:s.id,title:s.titles[0].title,categoryId:'cat1'}));
      S.sessions=payload;
      (document.getElementById('view-root')||document.body.appendChild(Object.assign(document.createElement('div'),{id:'view-root'}))).innerHTML=window.__v344Test.renderHistory();
    }''', payload)
    page.locator('.v260-history-tab:has-text("Recently viewed")').click()
    # no generic auto icon in title button
    assert page.locator('.v344-recent-name .v225-btn-icon').count() == 0
    # no v343 daypart icons shown
    assert page.locator('.v343-daypart-icon').count() == 0
    # title still present and clickable control exists
    assert page.locator('.v344-recent-name:has-text("One Piece")').count() == 1
    assert not errs, errs[:5]
    print('PASS v344 recent-view icon removal')
    browser.close()
