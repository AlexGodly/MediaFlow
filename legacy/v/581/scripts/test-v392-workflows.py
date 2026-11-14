#!/usr/bin/env python3
"""Synthetic browser checks for v392 picker mutations (no authenticated cloud)."""
from pathlib import Path
import re, subprocess, time
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
raw=(R/'test-v350-responsive.html').read_text()
index=(R/'index.html').read_text()
css='\n'.join((R/p).read_text() for p in re.findall(r'href="(assets/css/[^\"]+)"',index) if (R/p).exists())
html=re.sub(r'<link[^>]+>','',raw).replace('</head>','<style>'+css+'</style><base href="http://127.0.0.1:8782/"></head>')
js=(R/'assets/js/mediaflow-v392.bundle.js').read_text().rstrip()
assert js.endswith('})();')
js=js[:-5]+'''
window.__v392={S,App,remove:v392RemoveIds,init:()=>{
  V115_STARTUP_GUARD=false;AUTH_USER={id:'v392-test',email:'test@mediaflow.local'};
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
   page.add_script_tag(content=js);page.evaluate('()=>__v392.init()')
   page.evaluate("()=>__v392.App.v274OpenAddTitles('collection1')")
   init=page.evaluate('''()=>({picker:__v392.audit(),rows:[...document.querySelectorAll('#mf276-add-results .mf392-picker-item')].map(el=>el.querySelector('.mf352-picker-title')?.textContent),sort:document.querySelector('#mf274-add-titles select[aria-label="Sort titles"]')?.value})''')
   assert init['rows']==['First Library Item','Second Library Item','Third Library Item'],(width,'default sort',init)
   assert init['sort']=='added',init
   page.evaluate("()=>__v392.App.v392AddCollectionTitle('a')")
   result=page.evaluate('''()=>({state:__v392.audit(),buttons:[...document.querySelectorAll('#mf276-add-results .mf392-action')].map(el=>el.textContent.trim())})''')
   assert result['state']['open'] and result['state']['collection']==['a'] and result['buttons'][0]=='Added',(width,'instant collection add',result)
   page.evaluate("()=>__v392.App.v392AddCollectionTitle('a')")
   assert page.evaluate('()=>__v392.audit().collection.length')==1,'duplicate collection title'
   page.evaluate("()=>__v392.App.v392SetMode('collection','multi')")
   page.evaluate("()=>__v392.App.v274AddPick('b',true)")
   page.evaluate("()=>__v392.App.v274CommitAddTitles('collection1')")
   multi=page.evaluate("()=>__v392.audit()")
   assert multi['collection']==['a','b'] and multi['open'],(width,'collection multi-select',multi)
   page.evaluate("()=>__v392.App.v392SetMode('collection','direct')")
   page.evaluate('''()=>{const input=document.getElementById('mf276-add-search');input.value='Second';input.dispatchEvent(new Event('input',{bubbles:true}));input.focus()}''')
   page.wait_for_timeout(260)
   search=page.evaluate('''()=>({focused:document.activeElement?.id,rows:document.querySelectorAll('#mf276-add-results .mf392-picker-item').length,search:document.getElementById('mf276-add-search')?.value})'''); assert search['focused']=='mf276-add-search' and search['rows']==1,(width,'search focus',search)
   page.evaluate("()=>{__v392.App.v274RemoveTitle('collection1','a')}")
   page.evaluate("()=>__v392.App.v279ResolveConfirm(true)")
   page.wait_for_timeout(40)
   assert page.evaluate("()=>__v392.audit().collection")==['b'],(width,'confirmed single removal')
   page.evaluate("()=>{__v392.S.librarySelection={b:true};__v392.App.v274RemoveSelectedFromCollection()}")
   page.evaluate("()=>__v392.App.v279ResolveConfirm(true)")
   page.wait_for_timeout(40)
   assert page.evaluate("()=>__v392.audit().collection")==[],(width,'confirmed bulk removal')
   # Reset view to an Order screen and use the real modal entry point.
   page.evaluate("()=>{__v392.S.view='order';__v392.App.v274CloseOverlay('mf274-add-titles');__v392.renderShell();}")
   page.evaluate("()=>__v392.App.v354OpenSheet('title')")
   title=page.evaluate('''()=>({opened:!!document.querySelector('.mf359-title-sheet'),items:[...document.querySelectorAll('#v138-order-picker-results .mf392-order-row')].map(e=>e.querySelector('.v138-picker-copy b')?.textContent),buttons:document.querySelectorAll('#v138-order-picker-results .mf392-action').length})''')
   assert title['opened'] and title['items']==['First Library Item','Second Library Item','Third Library Item'],(width,'order title picker',title)
   assert page.evaluate("()=>document.querySelector('select[aria-label=\"Personal Order title sorting\"]')?.value")=='added-asc',(width,'default title sort control')
   page.evaluate("()=>__v392.App.v392SetOrderSort('added-desc')")
   assert page.evaluate('''()=>[...document.querySelectorAll('#v138-order-picker-results .mf392-order-row')].map(e=>e.querySelector('b')?.textContent)''')==['Third Library Item','Second Library Item','First Library Item'],(width,'descending title sorting')
   page.evaluate("()=>__v392.App.v392AddOrderTitle('b')")
   result=page.evaluate('''()=>({audit:__v392.audit(),opened:!!document.querySelector('.mf359-title-sheet'),added:[...document.querySelectorAll('#v138-order-picker-results .mf392-added')].map(e=>e.textContent.trim())})''')
   assert result['opened'] and result['audit']['order']==['b'] and result['added']==['Added'],(width,'personal order direct add',result)
   page.evaluate("()=>__v392.App.v392SetMode('titles','multi')")
   page.evaluate("()=>__v392.App.v138ToggleOrderPick('c',true)")
   page.evaluate("()=>__v392.App.v138AddSelectedOrderTitles()")
   assert page.evaluate("()=>__v392.audit().order")==['b','c'],(width,'title multi-select')
   assert page.evaluate("()=>!!document.querySelector('.mf359-title-sheet')"),'multi title popup closed'
   page.evaluate("()=>__v392.App.v354CloseSheet()")
   page.evaluate("()=>__v392.App.v354OpenSheet('collection')")
   picker=page.evaluate('''()=>({opened:!!document.querySelector('.mf359-collection-sheet'),results:document.querySelectorAll('#mf287-collection-results .mf392-collection-row').length,buttons:document.querySelectorAll('#mf287-collection-results .mf392-add').length})''')
   assert picker['opened'] and picker['results'] and picker['buttons'],(width,'collection assignment picker',picker)
   page.evaluate("()=>__v392.App.v392AddAssignment('collection1','anime')")
   assigned=page.evaluate('''()=>({opened:!!document.querySelector('.mf359-collection-sheet'),items:__v392.audit().assignments,added:document.querySelectorAll('#mf287-collection-results .mf392-added').length})''')
   assert assigned['opened'] and assigned['items']==1 and assigned['added']==1,(width,'assignment direct add',assigned)
   page.evaluate("()=>__v392.App.v392SetMode('assignments','multi')")
   # Already assigned Collections cannot be duplicated by bulk selection.
   page.evaluate("()=>__v392.App.v392SelectAssignment('collection1','anime',true)")
   page.evaluate("()=>__v392.App.v392CommitAssignments()")
   page.wait_for_timeout(60)
   assert page.evaluate("()=>__v392.audit().assignments")==1,(width,'duplicate assignment')
   assert not errors,(width,'JS errors',errors[:5])
   print('PASS',width,'instant add across 3 pickers; bulk modes; oldest-first; persistent dialogs; duplicate prevention; focus; removal',flush=True)
   page.close()
  browser.close()
finally:
 server.terminate();server.wait(timeout=5)
