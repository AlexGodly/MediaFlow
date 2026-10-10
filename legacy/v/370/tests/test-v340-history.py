from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
source=(ROOT/'src/js/components/237-v340-history-navigation-recent-titles.js').read_text()
css=(ROOT/'assets/css/167-v340-history-navigation-recent-titles.css').read_text()
bootstrap='''
const ts=Date.now();
const S={sessions:[
 {id:'recentMulti',timestamp:ts-2e6,categoryId:'anime',status:'complete',minutes:90,titles:[{title:'First Anime',libraryId:'one',qty:2,loggedAt:ts-1.9e6},{title:'Second Anime',libraryId:'two',qty:1,loggedAt:ts-1.8e6}]},
 {id:'olderSame',timestamp:ts-8e6,categoryId:'anime',status:'complete',minutes:45,titles:[{title:'First Anime',libraryId:'one',qty:1}]},
 {id:'legacyCategory',timestamp:ts-9e6,categoryId:'anime',minutes:60,status:'complete',titles:[]},
 {id:'namedNoLibrary',timestamp:ts-10e6,categoryId:'anime',minutes:22,status:'complete',titles:[{title:'Gone From Library',qty:1}]},
 {id:'skipped',timestamp:ts-9e6,categoryId:'anime',status:'skipped',titles:[{title:'Skipped Title',qty:2}]}
],library:[{id:'one',title:'First Anime',categoryId:'anime',coverUrl:'https://example.com/first.jpg'},{id:'two',title:'Second Anime',categoryId:'anime',coverUrl:'https://example.com/second.jpg'}],categories:[{id:'anime',name:'Anime',unit:'episodes',color:'#abcdef'}],v261HistoryUI:{recent:{query:'',category:'all',period:'all',page:0,pageSize:50}}};
const App={openSessionModal(id){window.__lastEdit=id},v181OpenTitleDetails(id){window.__title=id},v261SetHistoryFilter(kind,key,v){S.v261HistoryUI[kind][key]=v},v261SetHistoryPage(kind,n){S.v261HistoryUI[kind].page=n}};
const MediaFlowRuntime={version:0};
function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function cleanTitle(s){return String(s||'').trim();}
function getCategory(id){return S.categories.find(c=>c.id===id)||null;}
function v144CategoryIconHtml(cat){return '<span class="fake-cat">CAT</span>';}
function v270SortedSessions(){return S.sessions.slice().sort((a,b)=>b.timestamp-a.timestamp);}
function v241EnsureLibraryIndex(){return {byId:new Map(S.library.map(item=>[String(item.id),item]))};}
function v270LibraryByTitle(title,category){return S.library.find(item=>item.title.toLowerCase()===title.toLowerCase())||null;}
function v331ValidTimestamp(v){return Number(v)>0?Number(v):0;}
function v331HistoryTime(s,r){return new Date(Number(r?.loggedAt)||s.timestamp).toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'})}
function fmtMinutes(n){return String(Math.round(Number(n)||0))+'m'}
function unitLabel(unit,n){return n===1?'episode':'episodes'}
function v260TimeLabel(ts){return new Date(ts).toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'})}
function v260DateKey(ts){return new Date(ts).toISOString().slice(0,10)}
function v260DateLabel(ts){return 'Today'}
function v260TimeBucket(ts){return ['Afternoon','◐']}
function v261CategoryOptions(selected){return `<option value="all">All media</option><option value="anime">Anime</option>`}
function v261HistoryPager(kind,total){return '<div class="v261-history-pager">Pages</div>'}
function v260HistoryBody(tab){return tab==='consumption'?'<nav class="mf269-week-pager" aria-label="Consumption history week pages"><button type="button" class="btn btn-sm" onclick="App.v269SetWeekPage(0)">← Newer weeks</button><span>Weeks page 2 of 8</span><button type="button" class="btn btn-sm" onclick="App.v269SetWeekPage(2)">Older weeks →</button></nav>':'<div>Other tabs intact</div>'}
'''
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1100,'height':850})
    page.set_content('''<style>:root{--flow:#7d9bfb;--text:#f5f7fb;--panel:#1c2633;--panel-raised:#293443;--border:#44566c;--due:#73adfb;--text-mute:#9cabbc;--v260-line:#3c5269}body{background:#101723;color:var(--text);font:14px Arial;padding:30px}.v261-recent-timeline{position:relative;padding-left:18px}.v261-recent-timeline::before{content:"";position:absolute;left:5px;top:10px;bottom:10px;width:1px;background:var(--flow)}.v261-recent-day>header{display:flex;align-items:center;gap:8px}.v261-daypart-head{display:flex;justify-content:space-between}.v261-recent-day{margin-bottom:15px}.v261-recent-day>header>span:first-child{position:absolute;left:0;width:11px;height:11px;border-radius:50%;background:var(--flow)}.v261-history-toolbar{padding:12px;border-radius:12px;background:var(--panel);margin-bottom:15px;display:flex;justify-content:space-between}.v261-filter-group{display:flex;gap:10px}</style><main id="view-root"></main>''')
    page.add_style_tag(content=css)
    page.add_script_tag(content=bootstrap+source)
    assert page.evaluate('v340RecentRows().map(x=>x.title)')==['Second Anime','First Anime','Gone From Library']
    assert page.evaluate('v260HistoryBody("logs")')=='<div>Other tabs intact</div>'
    pager=page.evaluate('v260HistoryBody("consumption")')
    assert 'data-v340-week-nav="newer"' in pager and 'data-v340-week-nav="older"' in pager and pager.count('v340-week-icon')==2
    assert 'Weeks page 2 of 8' in pager and 'App.v269SetWeekPage(2)' in pager
    page.evaluate("document.getElementById('view-root').innerHTML=v260HistoryBody('recent')")
    assert page.locator('.v340-recent-card').count()==3
    assert page.locator('.v340-recent-card .v340-recent-edit').count()==3
    assert page.locator('.v340-recent-card .v225-btn-icon').count()==0
    assert page.locator('.v340-recent-card:has-text("First Anime") .v340-recent-cover img').count()==1
    assert page.locator('.v340-recent-card:has-text("Second Anime") .v340-recent-cover img').count()==1
    assert page.locator('.v340-recent-card:has-text("Gone From Library") .v340-recent-fallback').count()==1
    assert page.locator('.v340-recent-card:has-text("legacyCategory")').count()==0
    page.locator('.v340-recent-card:has-text("Second Anime") .v340-recent-edit').click()
    assert page.evaluate('window.__lastEdit')=='recentMulti'
    page.locator('.v340-recent-card:has-text("First Anime") .v340-recent-name').click()
    assert page.evaluate('window.__title')=='one'
    page.evaluate("S.v261HistoryUI.recent.query='second';document.getElementById('view-root').innerHTML=v260HistoryBody('recent')")
    assert page.locator('.v340-recent-card').count()==1
    page.evaluate("S.v261HistoryUI.recent.query='';S.v261HistoryUI.recent.category='no-match';document.getElementById('view-root').innerHTML=v260HistoryBody('recent')")
    assert page.locator('.v340-recent-empty').count()==1
    page.evaluate("S.v261HistoryUI.recent.category='all';document.getElementById('view-root').innerHTML=v260HistoryBody('recent')")
    page.screenshot(path='/mnt/data/v340_history_preview.png',full_page=True)
    # Small-screen layout sanity
    page.set_viewport_size({'width':390,'height':844})
    page.wait_for_timeout(60)
    dims=page.evaluate('''() => ({viewport:innerWidth,doc:document.documentElement.scrollWidth,offenders:[...document.querySelectorAll('*')].filter(el=>el.getBoundingClientRect().right>innerWidth+4).slice(0,15).map(el=>({tag:el.tagName,cls:el.className,x:Math.round(el.getBoundingClientRect().right)}))})''')
    print('mobile dims',dims)
    assert dims['doc'] <=dims['viewport']+4, 'unexpected mobile horizontal overflow'
    browser.close()
print('PASS v340 browser: title resolution, multi-title logs, edit popup action, clean icons, filters, missing legacy titles and mobile layout')
