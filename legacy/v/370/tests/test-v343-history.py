"""MediaFlow v343 Recently Viewed spacing + daypart icons smoke test."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
BUNDLE=(ROOT/'assets/js/mediaflow-v343.bundle.js').read_text(encoding='utf-8')
assert BUNDLE.rstrip().endswith('})();')
BUNDLE=BUNDLE.rstrip()[:-len('})();')]+'\nwindow.__v343Test={S,App,renderHistory};\n})();\n'
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1200,'height':1000})
    errs=[]
    page.on('pageerror',lambda e: errs.append(str(e)))
    page.set_content('<main id="app"><div class="main"><div class="container"><div id="view-root"></div></div></div></main>')
    page.evaluate("() => {const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}});}")
    page.add_script_tag(content=BUNDLE)
    sessions=[]
    for sid,title,hour,qty,mins in [('n','Blue Lock: Episode Nagi',2,1,25),('m','Morning Show',8,1,22),('a','Afternoon Watch',15,2,30),('e','Evening Watch',20,1,40)]:
        ts=page.evaluate(f"() => {{ const d=new Date(); d.setHours({hour},30,0,0); return d.getTime(); }}")
        date=page.evaluate(f"() => new Date({ts}).toISOString().slice(0,10)")
        sessions.append({'id':sid,'timestamp':ts,'date':date,'categoryId':'cat1','minutes':mins,'actualAmount':1,'status':'complete','titles':[{'libraryId':sid,'title':title,'qty':qty,'loggedAt':ts}]})
    page.evaluate('''(payload)=>{
      const S=window.__v343Test.S; S.view='history'; S.v260HistoryTab='recent';
      S.categories=[{id:'cat1',name:'Seasonal Anime',unit:'episodes',color:'#77aaff'}];
      S.library=payload.map((s)=>({id:s.id,title:s.titles[0].title,categoryId:'cat1'}));
      S.sessions=payload;
      const root=document.getElementById('view-root')||document.body.appendChild(Object.assign(document.createElement('div'),{id:'view-root'}));
      root.innerHTML=window.__v343Test.renderHistory();
    }''', sessions)
    page.locator('.v260-history-tab:has-text("Recently viewed")').click()
    deco=page.locator('.v343-recent-name').first.evaluate("el=>getComputedStyle(el).textDecorationLine")
    assert deco in ('none',''), deco
    assert page.locator('.v343-daypart-icon').count() >= 4
    vals=page.locator('.v343-recent-card').first.evaluate('''card=>{const over=card.querySelector('.v343-recent-overline').getBoundingClientRect(); const title=card.querySelector('.v343-recent-name').getBoundingClientRect(); return {gap:title.top-over.bottom}; }''')
    assert vals['gap'] >= 0, vals
    assert not errs, errs[:5]
    print('PASS v343 recent-view spacing/daypart icons')
    browser.close()
