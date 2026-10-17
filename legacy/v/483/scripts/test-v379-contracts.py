from pathlib import Path
import re,json
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
raw=(R/'test-v350-responsive.html').read_text();css='\n'.join((R/p).read_text() for p in re.findall(r'href="(assets/css/[^"]+)"',(R/'index.html').read_text()))
html=re.sub(r'<link[^>]+>','',raw).replace('</head>','<style>'+css+'</style></head>')
js=(R/'assets/js/mediaflow-v379.bundle.js').read_text().rstrip()
assert js.endswith('})();')
js=js[:-5]+'''\nwindow.__v379={S,App,renderLogForm,renderLogSuggestions,renderOrder,V378_LOG_UI,v287Queue,v379MoveQueueToken,v138OrderRowHtml,v288AssignmentRowHtml,v379FixLoggingMarkup};})();'''
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in [390,1280]:
  page=browser.new_page(viewport={'width':width,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html)
  page.evaluate("()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}")
  page.add_script_tag(content=js)
  page.evaluate('''()=>{
    const d=window.__v379,S=d.S;
    S.settings=S.settings||{}; S.sessions=[]; S.history=[];
    S.categories=[{id:'anime',name:'Anime',status:'active',icon:'🌸',unit:'episodes',type:'video',minutesPerUnit:24}];
    S.library=Array.from({length:30},(_,i)=>({id:'l'+i,title:'Anime '+i,categoryId:'anime',status:'active',priority:'medium',progress:3,total:12,createdAt:Date.now()}));
    S.logging=true;S.currentTask={categoryId:'anime',targetMid:2,targetMin:1,targetMax:3};
    S.logDraft={entries:[],amount:0,minutes:0,updateLibrary:true,v369Interface:'itemized',v179Mode:'amount',v369CommitId:'abcd',v378CollapsedIds:[]};
    S.entryDraft={title:'',libraryId:null,qty:1};
    document.querySelector('#app').innerHTML='<div class="main"><div class="container"><div id="view-root"></div><div id="modal-root"></div></div></div>';
    document.querySelector('#view-root').innerHTML=d.renderLogForm(S.currentTask,S.categories[0]);
    const details=document.querySelector('[data-v238-log-library]');if(details)details.open=true;
    d.renderLogSuggestions();
  }''')
  assert page.locator('.mf378-library-actions').count()==1,(width,'tools missing',errors)
  assert 'Clean Covers' not in page.locator('.mf378-library-actions').inner_text(),(width,'clean covers remains')
  assert page.locator('.mf378-picker .mf378-check input').count()>0,(width,'no checkboxes')
  # Simulate direct checkbox click, not Select Visible.
  page.locator('.mf378-picker .mf378-check input').first.check()
  assert page.locator('button[onclick*="v378BulkAdd"]').is_enabled(),(width,'manual selection failed')
  assert 'Add Selected (1)' in page.locator('button[onclick*="v378BulkAdd"]').inner_text(),(width,'counter stale')
  page.locator('.mf378-picker .mf378-check input').first.uncheck()
  assert not page.locator('button[onclick*="v378BulkAdd"]').is_enabled(),(width,'uncheck failed')
  page.evaluate('''()=>window.__v379.App.v378SelectVisible()''')
  assert page.evaluate('window.__v379.V378_LOG_UI.selected.size')==20
  page.evaluate('''()=>{window.__v379.App.v378BulkAdd();document.querySelector('#view-root').innerHTML=window.__v379.renderLogForm(window.__v379.S.currentTask,window.__v379.S.categories[0]);}''')
  assert page.evaluate('window.__v379.S.logDraft.entries.length')==20
  assert page.locator('.mf378-collapse-one').count()==0,(width,'duplicate expand')
  assert page.locator('.mf378-collapse-toolbar').count()==0,(width,'global collapse')
  assert page.locator('button.v379-toggle-list').count()==1,(width,'show-hide missing')
  assert page.locator('button[onclick*="v369ToggleTitle"]').count()==20,(width,'right expand missing')
  assert page.locator('.v370-title-content').count()==20,(width,'unit forms missing')
  assert page.locator('.v370-title-content').first.is_visible(),(width,'first unit form still hidden')
  page.locator('button[onclick*="v369ToggleTitle"]').first.click()
  # Live refresh path must keep other unit panels usable
  assert page.evaluate('window.__v379.S.logDraft.entries[0].v369Collapsed') is True
  page.evaluate('''()=>{window.__v379.App.v379ToggleAddedTitles()}''')
  assert page.evaluate('window.__v379.S.logDraft.v379HideAddedTitles') is True
  assert page.locator('.v370-panels.mf379-added-panels').is_hidden()
  page.evaluate('''()=>{window.__v379.App.v379ToggleAddedTitles()}''')
  assert page.locator('.v370-panels.mf379-added-panels').is_visible()
  # Re-entered previously collapsed title must be reopenable
  page.locator('button[onclick*="v369ToggleTitle"]').first.click()
  assert page.evaluate('window.__v379.S.logDraft.entries[0].v369Collapsed') is False
  assert page.locator('.v370-title-content').count()>=1
  # Quick Logging has its own right-side expander and still permits amount editing.
  page.evaluate('''()=>{
    const d=window.__v379,S=d.S;
    S.logDraft.v369Interface='quick';S.logDraft.entries=[];
    S.settings.v179LoggingModes={single:'amount',batch:'amount',modifiedAt:0};
    d.App.v378QuickAdd('l0',{quiet:true,defer:true});
    document.querySelector('#view-root').innerHTML=d.renderLogForm(S.currentTask,S.categories[0]);
  }''')
  assert page.locator('.mf379-quick-expand').count()>=1,(width,'quick right-side button missing')
  assert page.locator('.mf378-quick-amount input').count()>=1,(width,'quick quantity missing')
  page.locator('.mf379-quick-expand').first.click()
  assert page.evaluate('window.__v379.S.logDraft.entries[0].v379QuickCollapsed') is True
  assert page.locator('.mf378-quick-amount').first.is_hidden()
  page.locator('.mf379-quick-expand').first.click()
  assert page.evaluate('window.__v379.S.logDraft.entries[0].v379QuickCollapsed') is False
  assert page.locator('.mf378-quick-amount').first.is_visible()
  page.evaluate('window.__v379.App.v378QuickQuantity(0,3)')
  assert page.evaluate('window.__v379.S.logDraft.entries[0].qty')==3
  # exact mixed order regression, independent of expensive whole-page render
  res=page.evaluate('''()=>{
    const x=window.__v379,S=x.S;
    S.library=[{id:'anime1',title:'Anime 1',categoryId:'anime',status:'active'},{id:'anime2',title:'Anime 2',categoryId:'anime',status:'active'}];
    S.orderPlan={titleIds:['anime1','anime2'],categoryQueues:{anime:['t:anime1','c:collect1','t:anime2']},collectionAssignments:[{id:'collect1',collectionId:'col1',categoryId:'anime',categoryRule:'match',completedRule:'skip',createdAt:1,modifiedAt:1}],viewMode:'category'};
    S.collections=[{id:'col1',title:'Test Collection',titleIds:[]}];
    const original=x.v287Queue('anime').join('|');
    x.v379MoveQueueToken('anime','t:anime2',1,{save:false});
    const after=x.v287Queue('anime').join('|');
    x.v379MoveQueueToken('anime','c:collect1',0,{save:false});
    const reverse=x.v287Queue('anime').join('|');
    const t=x.v138OrderRowHtml(S.library[0],1,'anime');
    const a=x.v288AssignmentRowHtml(S.orderPlan.collectionAssignments[0],1,3,'regular');
    return {original,after,reverse,titleToken:t.includes('data-mf379-token="t:anime1"'),collectionToken:a.includes('data-mf379-token="c:collect1"'),collectionGrip:a.includes('mf379-collection-grip')};
  }''')
  assert res['original']=='t:anime1|c:collect1|t:anime2',res
  assert res['after']=='t:anime1|t:anime2|c:collect1',res
  assert res['reverse']=='c:collect1|t:anime1|t:anime2',res
  assert res['titleToken'] and res['collectionToken'] and res['collectionGrip'],res
  # Drag title across Collection using the actual browser drag events.
  page.evaluate('''()=>{
    const d=window.__v379,S=d.S;
    S.orderPlan.categoryQueues.anime=['t:anime1','c:collect1','t:anime2'];
    S.orderPlan.titleIds=['anime1','anime2'];
    document.querySelector('#view-root').innerHTML='<div class="v138-order-view"><div class="v138-order-list">'+
       d.v138OrderRowHtml(S.library[0],1,'anime')+
       d.v288AssignmentRowHtml(S.orderPlan.collectionAssignments[0],2,3,'collection')+
       d.v138OrderRowHtml(S.library[1],3,'anime')+'</div></div>';
  }''')
  page.drag_and_drop('[data-mf379-token="t:anime2"]','[data-mf379-token="c:collect1"]',force=True,target_position={'x':20,'y':5})
  assert page.evaluate('window.__v379.v287Queue("anime").join("|")')=='t:anime1|t:anime2|c:collect1',(width,'browser drag reordered wrong')
  assert not errors,(width,errors[:4])
  print('PASS',width,'manual selection, draft visibility, unit expansion, mixed order',flush=True)
  page.close()
 browser.close()
