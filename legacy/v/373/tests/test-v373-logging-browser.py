#!/usr/bin/env python3
"""v373 selected Logging order/controls, picker, responsive layout and persistence UI."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re, shutil, json
R=Path(__file__).resolve().parents[1]
source=(R/'assets/js/mediaflow-v373.bundle.js').read_text()
assert source.endswith('})();\n')
source=source[:-6]+'''window.__v373test={S,App,renderLogForm,v369RefreshPanels,v373OrderedEntries,v373OrderState,logTitleCandidates,v224LogToolsHtml};
render=function(){};renderView=function(){};
persistCategories=function(){};persistLibrary=function(){};persistSessions=function(){};
persistTask=function(){};persistSettings=function(){};
})();\n'''
index=(R/'index.html').read_text()
css='\n'.join((R/m).read_text() for m in re.findall(r'<link[^>]*href="([^"]+\.css)"',index) if (R/m).exists())
chrome=shutil.which('chromium')
assert chrome
results=[]
with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=chrome,args=['--no-sandbox','--disable-dev-shm-usage'])
  for width in (320,390,430,820,1280):
    page=browser.new_page(viewport={'width':width,'height':950})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content('<html><head></head><body><div id="app" style="display:none"></div><div id="view-root"></div><main id="test-mount" style="max-width:1200px;margin:auto;padding:10px"></main><div id="modal-root"></div></body></html>')
    page.add_style_tag(content=css)
    page.evaluate('''() => {
      Object.defineProperty(window,'localStorage',{value:{getItem(){return null},setItem(){},removeItem(){},clear(){}}});
      Object.defineProperty(window,'sessionStorage',{value:{getItem(){return null},setItem(){},removeItem(){},clear(){}}});
    }''')
    page.add_script_tag(content=source)
    page.evaluate('''() => {
      const {S,renderLogForm}=window.__v373test,now=Date.now();
      S.settings=S.settings||{};
      S.categories=[{id:'anime',name:'Anime',icon:'🎬',unit:'episodes',target:2,minutesPerUnit:24}];
      S.library=[
       {id:'b',title:'Gamma',categoryId:'anime',status:'active',priority:'low',progress:6,total:50,createdAt:now-300000},
       {id:'c',title:'Beta',categoryId:'anime',status:'active',priority:'high',progress:9,total:10,createdAt:now-200000},
       {id:'a',title:'Alpha',categoryId:'anime',status:'active',priority:'medium',progress:2,total:25,createdAt:now-100000}];
      S.currentTask={categoryId:'anime',targetMid:2,low:1,high:2,unit:'episodes'};S.logging=true;S.sessions=[];
      S.logDraft={v369Interface:'itemized',v369CommitId:'v373-fixture',categoryId:'anime',entries:S.library.map((item,i)=>({
        title:item.title,libraryId:item.id,qty:1,loggedAt:now-30000+i*10000,
        v179StartProgress:item.progress,v369Collapsed:true,v369Units:[{id:'u'+i,number:item.progress+1,loggedAt:now,durationSeconds:1400}]
      })),amount:3,minutes:70,note:'',updateLibrary:true};
      S.entryDraft={title:'',qty:1,libraryId:null};
      document.getElementById('test-mount').innerHTML=renderLogForm(S.currentTask,S.categories[0]);
    }''')
    state=page.evaluate('''() => {
       const t=window.__v373test;
       const get=()=>[...document.querySelectorAll('.v370-panels>.v370-title')].map(e=>Number(e.dataset.mf373Entry));
       const defaultOrder=get();
       t.App.v373SetSort('title');const alphabet=get();
       t.App.v373SetSort('progress');const progress=get();
       t.App.v373Step(1,-1);const moved=get(),sort=t.S.logDraft.v373Ordering.sort;
       t.App.v373SetSort('title');t.App.v373SetSort('custom');const restored=get();
       t.App.v373Position(0,1);const numeric=get();
       t.App.v373SetSort('random');const random1=get();t.App.v373SetSort('title');t.App.v373SetSort('random');const random2=get();
       t.App.v373Reshuffle();const seed=t.S.logDraft.v373Ordering.randomSeed;
       const inputs=document.querySelectorAll('.mf373-position-label input');
       const picker=[...(new DOMParser().parseFromString(t.v224LogToolsHtml([],1),'text/html')).querySelectorAll('select[aria-label="Dashboard logging sort field"] option')].map(x=>x.value);
       t.App.v224LogSetSort('logAdded');const newestPicker=t.logTitleCandidates('a').slice(0,3).map(x=>x.title);
       t.App.v224LogSetSort('title');const alphaPicker=t.logTitleCandidates('a').slice(0,3).map(x=>x.title);
       const dims={width:document.documentElement.scrollWidth,viewport:innerWidth,sort:!!document.querySelector('#mf373-sort'),handles:document.querySelectorAll('.mf373-drag-handle').length,inputs:inputs.length};
       return {defaultOrder,alphabet,progress,moved,sort,restored,numeric,randomStable:JSON.stringify(random1)===JSON.stringify(random2),seed,dims,picker,newestPicker,alphaPicker,draftCount:t.S.logDraft.entries.length};
    }''')
    assert state['defaultOrder']==[0,1,2],state
    assert state['alphabet']==[2,1,0],state
    assert state['progress']==[2,0,1],state
    assert state['moved']==[2,1,0] and state['sort']=='custom',state
    assert state['restored']==[2,1,0] and state['numeric']==[0,2,1],state
    assert state['randomStable'] and state['draftCount']==3,state
    assert 'logAdded' in state['picker'] and 'random' in state['picker'] and 'seen' in state['picker'],state
    assert state['newestPicker']==['Alpha','Beta','Gamma'] and state['alphaPicker']==['Gamma','Beta','Alpha'],state
    assert state['dims']['sort'] and state['dims']['handles']==3 and state['dims']['inputs']==3,state
    assert state['dims']['width']<=width+2,('itemized overflow',width,state)
    if width==430:
      row=page.locator('.v370-panels>.v370-title')
      initial=[int(x.get_attribute('data-mf373-entry')) for x in row.all()]
      row.first.locator('.mf373-drag-handle').drag_to(row.last.locator('.mf373-drag-handle'),steps=15)
      after=[int(x.get_attribute('data-mf373-entry')) for x in row.all()]
      assert after!=initial,(initial,after,'desktop drag did not move the title')
      assert page.evaluate('window.__v373test.S.logDraft.v373Ordering.sort')=='custom'
    if width in (320,390,820):
      page.evaluate('''() => {
        const t=window.__v373test;
        t.S.logDraft.v369Interface='quick';t.S.logDraft.v179Mode='amount';
        t.S.logDraft.entries.forEach(e=>{e.qty=2;delete e.v369Units;});
        t.S.logDraft.v373Ordering={sort:'logAdded',dir:'asc',manualIds:[],randomSeed:1};
        document.getElementById('test-mount').innerHTML=t.renderLogForm(t.S.currentTask,t.S.categories[0]);
      }''')
      quick=page.evaluate('''() => {
        const t=window.__v373test;
        const get=()=>[...document.querySelectorAll('.v239-logged-title-list>.v239-logged-title-card')].map(e=>Number(e.dataset.mf373Entry));
        const original=get();t.App.v373SetSort('title');const alpha=get();
        t.App.v373Move(2,2);const custom=get();
        return {original,alpha,custom,mode:document.querySelector('.mf372-logging').dataset.mf372Mode,
          controls:document.querySelectorAll('.v239-logged-title-card .mf373-row-controls').length,
          width:document.documentElement.scrollWidth,viewport:innerWidth};
      }''')
      assert quick['original']==[0,1,2] and quick['alpha']==[2,1,0] and quick['custom']==[1,0,2],quick
      assert quick['controls']==3 and quick['mode']=='quick' and quick['width']<=width+2,quick
      page.screenshot(path=str(R/f'tests/v373-quick-{width}.png'),full_page=True)
      page.evaluate('''() => {
        const t=window.__v373test;t.S.logDraft.v179Mode='progress';
        document.getElementById('test-mount').innerHTML=t.renderLogForm(t.S.currentTask,t.S.categories[0]);
      }''')
      assert page.locator('.v239-logged-progress').count()==3
      # The displayed first item points to original entry index 1 after moving.
      first=page.locator('.v239-logged-title-card').first
      assert first.get_attribute('data-mf373-entry')=='1'
      assert first.locator('.v239-logged-progress input').get_attribute('onchange').find('(1,')>=0
      page.screenshot(path=str(R/f'tests/v373-progress-{width}.png'),full_page=True)
    else:
      page.screenshot(path=str(R/f'tests/v373-itemized-{width}.png'),full_page=True)
    assert not errors,(width,errors)
    results.append({'width':width,'overflow':state['dims']['width']-width,'mode':'itemized'})
    page.close()
  browser.close()
print('PASS v373 browser test',json.dumps(results))
