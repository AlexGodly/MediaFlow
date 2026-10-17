#!/usr/bin/env python3
"""Synthetic browser checks for v393 picker mutations (no authenticated cloud)."""
from pathlib import Path
import re, subprocess, time
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
raw=(R/'test-v350-responsive.html').read_text()
index=(R/'index.html').read_text()
css='\n'.join((R/p).read_text() for p in re.findall(r'href="(assets/css/[^\"]+)"',index) if (R/p).exists())
html=re.sub(r'<link[^>]+>','',raw).replace('</head>','<style>'+css+'</style><base href="http://127.0.0.1:8782/"></head>')
js=(R/'assets/js/mediaflow-v403.bundle.js').read_text().rstrip()
assert js.endswith('})();')
js=js[:-5]+'''
window.__v393={S,App,remove:v392RemoveIds,logHtml:()=>v224LogSuggestionsHtml(),openLog:()=>{V238_LOG_LIBRARY_OPEN=true;},init:()=>{
  V115_STARTUP_GUARD=false;AUTH_USER={id:'v393-test',email:'test@mediaflow.local'};
  S.view='collections';S.logging=false;S.modal=null;S.sessionActive=true;
  S.settings=S.settings||{};S.categories=[{id:'anime',name:'Anime',type:'video',unit:'episodes',target:2,weight:3,minutesPerUnit:24,color:'#55aadd',enabled:true}];
  S.library=[{id:'a',title:'First Library Item',createdAt:1000,categoryId:'anime',status:'planned',priority:'medium',progress:0,total:12},{id:'b',title:'Second Library Item',createdAt:2000,categoryId:'anime',status:'active',priority:'high',progress:2,total:12},{id:'c',title:'Third Library Item',createdAt:3000,categoryId:'anime',status:'planned',priority:'low',progress:0,total:12}];
  S.collections=[{id:'collection1',title:'Demo Collection',createdAt:10000,updatedAt:10000,description:'',titleIds:[],order:[]}];
  S.sessions=[];S.activityLog=[];S.orderPlan={};S.orderPlannerUI={};S.collectionTombstones=[];S.librarySelection={};
  S.xpLedger={libraryAdditions:{},libraryEdits:{},manualCovers:{},logCompletions:{}};
  rawSet=async()=>true;V274_UI.activeId='collection1';
  renderShell();
},renderShell, audit:()=>({collection:(S.collections||[])[0]?.titleIds,order:S.orderPlan?.titleIds,assignments:S.orderPlan?.collectionAssignments?.length||0,open:!!document.getElementById('mf274-add-titles'),picker:document.querySelectorAll('#mf276-add-results .mf392-action').length})};})();'''
server=subprocess.Popen(['python','-m','http.server','8782','--bind','127.0.0.1'],cwd=R,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 time.sleep(.5)
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  for width in [390,1280]:
   page=browser.new_page(viewport={'width':width,'height':820});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(html);page.evaluate('''()=>{let m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}''')
   page.add_script_tag(content=js);page.evaluate('()=>__v393.init()')
   page.evaluate("()=>__v393.App.v274OpenAddTitles('collection1')")
   init=page.evaluate('''()=>({picker:__v393.audit(),rows:[...document.querySelectorAll('#mf276-add-results .mf392-picker-item')].map(el=>el.querySelector('.mf352-picker-title')?.textContent),sort:document.querySelector('#mf274-add-titles select[aria-label="Sort titles"]')?.value})''')
   assert init['rows']==['First Library Item','Second Library Item','Third Library Item'],(width,'default sort',init)
   assert init['sort']=='added',init
   page.evaluate("()=>__v393.App.v392AddCollectionTitle('a')")
   result=page.evaluate('''()=>({state:__v393.audit(),buttons:[...document.querySelectorAll('#mf276-add-results .mf392-action')].map(el=>el.textContent.trim())})''')
   assert result['state']['open'] and result['state']['collection']==['a'] and result['buttons'][0]=='Added',(width,'instant collection add',result)
   assert page.locator('#mf276-add-results [data-mf392-id="a"] .mf392-added').is_enabled(),(width,'added must be clickable')
   page.locator('#mf276-add-results [data-mf392-id="a"] .mf392-added').click()
   assert page.evaluate('()=>__v393.audit().collection.length')==0,'collection added toggle did not remove' 
   page.evaluate("()=>__v393.App.v392AddCollectionTitle('a')")
   page.evaluate("()=>__v393.App.v392SetMode('collection','multi')")
   page.evaluate("()=>__v393.App.v274AddPick('b',true)")
   page.evaluate("()=>__v393.App.v274CommitAddTitles('collection1')")
   multi=page.evaluate("()=>__v393.audit()")
   assert multi['collection']==['a','b'] and multi['open'],(width,'collection multi-select',multi)
   page.evaluate("()=>__v393.App.v392SetMode('collection','direct')")
   page.evaluate('''()=>{const input=document.getElementById('mf276-add-search');input.value='Second';input.dispatchEvent(new Event('input',{bubbles:true}));input.focus()}''')
   page.wait_for_timeout(260)
   search=page.evaluate('''()=>({focused:document.activeElement?.id,rows:document.querySelectorAll('#mf276-add-results .mf392-picker-item').length,search:document.getElementById('mf276-add-search')?.value})'''); assert search['focused']=='mf276-add-search' and search['rows']==1,(width,'search focus',search)
   page.evaluate("()=>{__v393.App.v274RemoveTitle('collection1','a')}")
   page.evaluate("()=>__v393.App.v279ResolveConfirm(true)")
   page.wait_for_timeout(40)
   assert page.evaluate("()=>__v393.audit().collection")==['b'],(width,'confirmed single removal')
   page.evaluate("()=>{__v393.S.librarySelection={b:true};__v393.App.v274RemoveSelectedFromCollection()}")
   page.evaluate("()=>__v393.App.v279ResolveConfirm(true)")
   page.wait_for_timeout(40)
   assert page.evaluate("()=>__v393.audit().collection")==[],(width,'confirmed bulk removal')
   # Reset view to an Order screen and use the real modal entry point.
   page.evaluate("()=>{__v393.S.view='order';__v393.App.v274CloseOverlay('mf274-add-titles');__v393.renderShell();}")
   page.evaluate("()=>__v393.App.v354OpenSheet('title')")
   title=page.evaluate('''()=>({opened:!!document.querySelector('.mf359-title-sheet'),items:[...document.querySelectorAll('#v138-order-picker-results .mf392-order-row')].map(e=>e.querySelector('.v138-picker-copy b')?.textContent),buttons:document.querySelectorAll('#v138-order-picker-results .mf392-action').length})''')
   assert title['opened'] and title['items']==['First Library Item','Second Library Item','Third Library Item'],(width,'order title picker',title)
   assert page.evaluate("()=>document.querySelector('select[aria-label=\"Personal Order title sorting\"]')?.value")=='added-asc',(width,'default title sort control')
   page.evaluate("()=>__v393.App.v392SetOrderSort('added-desc')")
   assert page.evaluate('''()=>[...document.querySelectorAll('#v138-order-picker-results .mf392-order-row')].map(e=>e.querySelector('b')?.textContent)''')==['Third Library Item','Second Library Item','First Library Item'],(width,'descending title sorting')
   page.evaluate("()=>__v393.App.v392AddOrderTitle('b')")
   result=page.evaluate('''()=>({audit:__v393.audit(),opened:!!document.querySelector('.mf359-title-sheet'),added:[...document.querySelectorAll('#v138-order-picker-results .mf392-added')].map(e=>e.textContent.trim())})''')
   assert result['opened'] and result['audit']['order']==['b'] and result['added']==['Added'],(width,'personal order direct add',result)
   assert page.locator('#v138-order-picker-results [data-mf392-id="b"] .mf392-added').is_enabled(),(width,'Personal Order Added is disabled')
   page.locator('#v138-order-picker-results [data-mf392-id="b"] .mf392-added').click()
   assert page.evaluate("()=>__v393.audit().order")==[],(width,'order title removal toggle')
   page.evaluate("()=>__v393.App.v392AddOrderTitle('b')")
   page.evaluate("()=>__v393.App.v392SetMode('titles','multi')")
   page.evaluate("()=>__v393.App.v138ToggleOrderPick('c',true)")
   page.evaluate("()=>__v393.App.v138AddSelectedOrderTitles()")
   assert page.evaluate("()=>__v393.audit().order")==['b','c'],(width,'title multi-select')
   assert page.evaluate("()=>!!document.querySelector('.mf359-title-sheet')"),'multi title popup closed'
   page.evaluate("()=>__v393.App.v354CloseSheet()")
   page.evaluate("()=>__v393.App.v354OpenSheet('collection')")
   picker=page.evaluate('''()=>({opened:!!document.querySelector('.mf359-collection-sheet'),results:document.querySelectorAll('#mf287-collection-results .mf392-collection-row').length,buttons:document.querySelectorAll('#mf287-collection-results .mf392-add').length})''')
   assert picker['opened'] and picker['results'] and picker['buttons'],(width,'collection assignment picker',picker)
   page.evaluate("()=>__v393.App.v392AddAssignment('collection1','anime')")
   assigned=page.evaluate('''()=>({opened:!!document.querySelector('.mf359-collection-sheet'),items:__v393.audit().assignments,added:document.querySelectorAll('#mf287-collection-results .mf392-added').length})''')
   assert assigned['opened'] and assigned['items']==1 and assigned['added']==1,(width,'assignment direct add',assigned)
   page.evaluate("()=>__v393.App.v392AddAssignment('collection1','anime')")
   assert page.evaluate('()=>__v393.audit().assignments')==0,(width,'assignment remove toggle')
   page.evaluate("()=>__v393.App.v392AddAssignment('collection1','anime')")
   page.evaluate("()=>__v393.App.v392SetMode('assignments','multi')")
   # Already assigned Collections cannot be duplicated by bulk selection.
   page.evaluate("()=>__v393.App.v392SelectAssignment('collection1','anime',true)")
   page.evaluate("()=>__v393.App.v392CommitAssignments()")
   page.wait_for_timeout(60)
   assert page.evaluate("()=>__v393.audit().assignments")==1,(width,'duplicate assignment')
   # Scrolling: multiple selected checkboxes must preserve the *same* scroll
   # container and its scroll offset rather than recreating the popup.
   page.evaluate("()=>{__v393.App.v354CloseSheet();__v393.S.view='collections';__v393.App.v274OpenAddTitles('collection1')}")
   page.evaluate("""()=>{
     __v393.S.library=__v393.S.library.concat(Array.from({length:90},(_,i)=>({id:'test-'+i,title:'Library Test '+String(i).padStart(3,'0'),createdAt:10000+i,categoryId:'anime',status:'planned',priority:'low',progress:0,total:12})));
     __v393.App.v274CloseOverlay('mf274-add-titles');__v393.App.v274OpenAddTitles('collection1');
     __v393.App.v392SetMode('collection','multi');
     document.getElementById('mf276-add-results').scrollTop=180;
   }""")
   before=page.evaluate("""()=>{const el=document.getElementById('mf276-add-results');return {scroll:el.scrollTop,html:el,viewport:document.querySelector('#mf274-add-titles .mf274-add-modal')?.getBoundingClientRect().width}}""")
   page.evaluate("()=>__v393.App.v274AddPick('test-6',true)")
   after=page.evaluate("""()=>({scroll:document.getElementById('mf276-add-results').scrollTop,checked:document.querySelector('#mf276-add-results [data-mf392-id="test-6"] input')?.checked,count:__v393.S.library.length})""")
   assert after['checked'] is True and abs(after['scroll']-before['scroll'])<2,(width,'checkbox scroll stability',before,after)
   assert before['viewport']>width*.87,(width,'expanded popup width',before)
   page.locator('#mf276-add-results [data-mf392-id="test-7"] .mf352-picker-check').evaluate('(el)=>el.click()')
   assert abs(page.evaluate("()=>document.getElementById('mf276-add-results').scrollTop")-before['scroll'])<2,(width,'second selection scroll reset')
   page.evaluate("()=>__v393.App.v274CloseOverlay('mf274-add-titles')")
   # Personal Order edit: capture a deep scroll position across edit/cancel.
   page.evaluate("""()=>{
     __v393.S.view='order';__v393.S.orderPlan.titleIds=__v393.S.library.map(x=>x.id);
     __v393.renderShell();
     document.body.insertAdjacentHTML('beforeend','<div id="v393-test-spacer" style="height:5000px;pointer-events:none"></div>');
     document.documentElement.style.setProperty('overflow-y','auto','important');document.body.style.setProperty('overflow-y','auto','important');
     window.scrollTo({top:450,behavior:"instant"});
   }""")
   original=page.evaluate('()=>window.scrollY')
   if original<100: print('scroll diagnostic',width,page.evaluate("""()=>({doc:document.documentElement.scrollHeight,inner:window.innerHeight,body:document.body.scrollHeight,scroll:window.scrollY,bodyOverflow:getComputedStyle(document.body).overflow,htmlOverflow:getComputedStyle(document.documentElement).overflow,scrollers:[...document.querySelectorAll('*')].filter(el=>el.scrollHeight>el.clientHeight+40&&/auto|scroll/.test(getComputedStyle(el).overflowY)).slice(0,12).map(el=>({tag:el.tagName,cls:String(el.className).slice(0,100),id:el.id,scroll:el.scrollHeight,client:el.clientHeight}))})"""),flush=True)
   assert original>100,(width,'test page could not scroll',original)
   page.evaluate("()=>__v393.App.openLibraryModal('a')")
   page.wait_for_timeout(80)
   current=page.evaluate('()=>window.scrollY')
   assert abs(current-original)<3,(width,'edit opened with scroll jump',original,current)
   page.evaluate('()=>__v393.App.closeModal()')
   page.wait_for_timeout(60)
   current=page.evaluate('()=>window.scrollY')
   assert abs(current-original)<3,(width,'edit closed with scroll jump',original,current)
   page.evaluate("()=>__v393.App.openLibraryModal('a')")
   page.wait_for_timeout(40)
   page.evaluate("()=>__v393.App.saveLibraryModal('a')")
   page.wait_for_timeout(80)
   current=page.evaluate('()=>window.scrollY')
   assert abs(current-original)<3,(width,'edit save caused scroll jump',original,current)
   # Logging should remove only draft membership (no Library or History deletion).
   log=page.evaluate("""()=>{
     __v393.S.view='dashboard';__v393.S.logging=true;
     __v393.S.entryDraft={title:''};__v393.openLog();
     __v393.S.logDraft={entries:[{title:'First Library Item',libraryId:'a',qty:0,loggedAt:Date.now(),v369Units:[],v179StartProgress:0,v179EndProgress:0}],v369Interface:'itemized'};
     return {html:__v393.logHtml(),before:__v393.S.logDraft.entries.length};
   }""")
   assert 'v393ToggleLoggingTitle' in log['html'] and log['before']==1,(width,'logging interactive Added missing',log['html'][:300])
   libCount=page.evaluate('()=>__v393.S.library.length')
   page.evaluate("()=>__v393.App.v393ToggleLoggingTitle('a')")
   remaining=page.evaluate("()=>({count:__v393.S.logDraft?.entries?.length,lib:__v393.S.library.length})")
   assert remaining['count']==0 and remaining['lib']==libCount,(width,'logging draft removal data integrity',remaining)
   assert not errors,(width,'JS errors',errors[:5])
   print('PASS',width,'instant add across 3 pickers; bulk modes; oldest-first; persistent dialogs; duplicate prevention; focus; removal',flush=True)
   page.close()
  browser.close()
finally:
 server.terminate();server.wait(timeout=5)
