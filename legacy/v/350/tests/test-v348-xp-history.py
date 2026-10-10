"""v348 integration: active Settings fields, XP tab/pagination, new action XP, multiplier and exports."""
from pathlib import Path
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
source=(R/'assets/js/mediaflow-v348.bundle.js').read_text(encoding='utf-8').rstrip()
assert source.endswith('})();')
source=source[:-len('})();')]+'''\nwindow.__v348Test={S,App,v348RenderSettingsPage,renderHistory,v348HistoryEntries,v348XpHistoryHtml,v348Award,v348Multiplier,v348CompareOrder,v348SeedOrder,v334Totals,mergeStates,renderView};\n})();\n'''
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1200,'height':1000},accept_downloads=True)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content('<main id="app"><div class="main"><div class="container"><div id="view-root"></div></div></div></main>')
    page.evaluate("() => {const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}});}")
    page.add_script_tag(content=source)
    got=page.evaluate('''() => {
      const {S,App}=__v348Test;
      S.view='settings'; S.settings=S.settings||{};S.settings.leveling={enabled:true,firstEpisodeXP:20,globalStreakMultiplierEnabled:true};
      S.categories=[{id:'anime',name:'Anime',unit:'episodes',color:'#88aaff',minutesPerUnit:24,target:2}];
      S.library=[{id:'a',title:'Test Anime',categoryId:'anime',status:'active',progress:0,total:12}];
      S.sessions=[];S.collections=[];S.xpLedger={};
      S.orderPlan={titleIds:[],viewMode:'all',categoryMode:'default',categoryOrder:[],hiddenCategories:[],collectionAssignments:[],categoryQueues:{}};
      const settings=__v348Test.v348RenderSettingsPage();
      return {settings,historyTabs:App.v260HistoryTabs()};
    }''')
    assert 'v348-setting-collectionAddTitleXP' in got['settings'],got['settings'][-1000:]
    assert 'v348-setting-orderAddTitleXP' in got['settings']
    assert 'v348-setting-orderAddCollectionXP' in got['settings']
    assert 'v348-setting-orderReorderTitleXP' in got['settings']
    assert 'v348-setting-orderReorderCollectionXP' in got['settings']
    assert 'v348-setting-collectionReorderTitleXP' in got['settings']
    assert 'v348-setting-batchLogXP' in got['settings']
    assert 'v348-setting-globalStreakMultiplierEnabled' in got['settings']
    assert 'xp' in got['historyTabs'],got['historyTabs']
    live=page.evaluate("()=>{const T=__v348Test;T.S.view='settings';const root=document.getElementById('view-root')||document.body.appendChild(Object.assign(document.createElement('div'),{id:'view-root'}));T.renderView();return {reward:!!root.querySelector('#v348-setting-orderAddTitleXP'),streak:!!root.querySelector('#v348-setting-globalStreakMultiplierEnabled'),fields:root.querySelectorAll('.v348-xp-field').length};}")
    assert live['reward'] and live['streak'] and live['fields']==7,('Active Settings renderer did not show all v348 rewards',live)
    data=page.evaluate('''()=>{
      const {S,App,v348Award,v348HistoryEntries,v348SeedOrder,v348CompareOrder}=__v348Test;
      const before=App.v348HistoryPage;
      const reward=v348Award('collectionAddTitleXP',2);
      S.view='order';v348SeedOrder();S.orderPlan.titleIds=['a'];v348CompareOrder();
      const entries=v348HistoryEntries();
      S.view='history'; S.v260HistoryTab='xp';
      const root=document.getElementById('view-root')||document.body.appendChild(Object.assign(document.createElement('div'),{id:'view-root'}));root.innerHTML=__v348Test.renderHistory();
      return {reward,entries:entries.length,xp:entries.filter(x=>x.kind==='collectionAddTitleXP').length,action:entries.find(x=>x.kind==='orderAddTitleXP'),hasTab:[...root.querySelectorAll('.v260-history-tabs button')].some(x=>x.getAttribute('onclick')?.includes("'xp'"))};
    }''')
    assert data['reward']>=0,data
    assert data['xp']==1,data
    assert data['action'],data
    assert data['hasTab'],data
    assert page.locator('.v348-xp-page').count()==1
    assert page.locator('.v260-history-tab:has-text("XP") svg').count()==1, 'XP History tab needs a semantic icon'
    assert page.locator('.v348-xp-entry').count()>=2
    # filter and show source; export is a user-visible download
    page.locator('#v348-xp-search').fill('Collection')
    assert page.locator('.v348-xp-entry').count()>=1
    with page.expect_download(timeout=15000) as down:
        page.get_by_text('Export JSON').click()
    assert down.value.suggested_filename.endswith('.json')
    assert not errors,errors[:6]
    print('PASS v348 compiled app: visible settings fields, History XP tab, actual awards, search and JSON export')
    browser.close()
