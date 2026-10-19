from playwright.sync_api import sync_playwright
from pathlib import Path
import re,json
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text();html=re.sub(r'<script[^>]*>[^<]*</script>','',html,flags=re.I|re.S);html=re.sub(r'<link\b[^>]*>','',html,flags=re.I|re.S)
js=(root/'assets/js/mediaflow-v407.bundle.js').read_text()
hook='''\nwindow.__MF406TEST__={
 get S(){return S},get App(){return App},
 action:(kind)=>v406ActionItems(kind).map(x=>x.id),
 setFixture:()=>{S.categories=[{id:'c1',name:'Anime',icon:'🎬'},{id:'c2',name:'Movies',icon:'📽️'}];S.library=[{id:'a',title:'test alpha',categoryId:'c1',status:'planned',priority:'low'},{id:'b',title:'test beta',categoryId:'c2',status:'active',priority:'high'}];S.settings.v230ChoiceLayout={modifiedAt:0,setCategory:{source:'custom',order:['c2','c1'],hidden:[]},setStatus:{source:'custom',order:['dropped','completed','active','paused','planned'],hidden:[]},setPriority:{source:'custom',order:['high','low','medium'],hidden:[]}};v230EnsureChoiceLayout(S.settings);},
 getChoice:()=>v230VisibleIds('setStatus'),
 setupMembership:()=>{const p=v138EnsureOrderPlan();p.titleIds=['a'];S.collections=[{id:'co1',title:'test collection one',titleIds:['a'],order:['a'],createdAt:Date.now(),updatedAt:Date.now()},{id:'co2',title:'test collection two',titleIds:['b'],order:['b'],createdAt:Date.now(),updatedAt:Date.now()}];p.collectionAssignments=[{id:'as1',collectionId:'co1',categoryId:'c1'}];v287OrderUI().v287CollectionCategoryId='c1';S.logDraft={v369Interface:'itemized',entries:[{libraryId:'a',title:'test alpha'}]};S.entryDraft=S.entryDraft||{};S.entryDraft.title='test';v140EnsureOrderPickerUI().search='';v140EnsureOrderPickerUI().categories=[];return p.titleIds},
 picker:(kind,scope)=>v406PickerHtml(kind,scope),
 bulk:(scope)=>v406UpgradeBatchMarkup(scope==='library'?`<div class="mf-batchbar"><select onchange="App.batchLibraryStatus(this.value)"><option>Set status</option></select><select onchange="App.batchLibraryPriority(this.value)"></select><select onchange="App.batchLibraryCategory(this.value)"></select></div>`:v274CollectionBatchBarHtml({id:'c',titleIds:[],order:[]}),scope),
 libraryMarkup:()=>renderLibrary(),
 order:(mode)=>{v140EnsureOrderPickerUI().v406Membership=mode;return v138PickerMatches().map(x=>String(x.id))},
 collection:(mode)=>{V406_MEMBERSHIP.collections=mode;return v287CollectionMatches().map(x=>String(x.id))},
 logging:(mode)=>{V406_MEMBERSHIP.logging=mode;return logTitleCandidates('test').map(x=>String(x.id))},
 v406Mode:v406Mode,
 getMembership:(name)=>v406MembershipField(name),
 setConfig:(surf,arr)=>{const c=v230EnsureChoiceLayout(S.settings);c[surf].order=arr;c[surf].hidden=[];return v406ActionItems(surf==='setStatus'?'status':surf==='setPriority'?'priority':'category').map(x=>x.id)},
}
'''
assert js.rstrip().endswith('})();')
js=js.rstrip()[:-len('})();')]+hook+'\n})();\n'
with sync_playwright() as pl:
 browser=pl.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in (320,390,820,1280):
  page=browser.new_page(viewport={'width':width,'height':850});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html)
  page.evaluate("""(()=>{const s={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>s[k]||null,setItem:(k,v)=>s[k]=String(v),removeItem:k=>delete s[k],clear:()=>Object.keys(s).forEach(k=>delete s[k])}});})()""")
  page.add_script_tag(content=js);page.wait_for_timeout(100)
  print('width',width,'errors',errors[:2]);assert not errors, errors
  result=page.evaluate("""(()=>{const t=window.__MF406TEST__;const s=t.S;
   s.categories=[{id:'c1',name:'Anime',icon:'🎬'},{id:'c2',name:'Movies',icon:'📽️'}];
   s.library=[{id:'a',title:'test alpha',categoryId:'c1',status:'planned',priority:'low'},{id:'b',title:'test beta',categoryId:'c2',status:'active',priority:'high'}];
   s.settings.v230ChoiceLayout={modifiedAt:0,setCategory:{source:'custom',order:['c2','c1'],hidden:[]},setStatus:{source:'custom',order:['dropped','completed','active','paused','planned'],hidden:[]},setPriority:{source:'custom',order:['high','low','medium'],hidden:[]}};
   s.orderPlan=s.orderPlan||{};
   t.setFixture();
   const out={status:t.action('status'),priority:t.action('priority'),category:t.action('category'),html:t.bulk('library'),membership:['titles','collections','logging'].map(x=>t.getMembership(x).includes('Not added'))};return out;})()""")
  print('orders',result['status'][:3],result['priority'],result['category'])
  assert result['priority'][0]=='high';assert result['category'][0]=='c2';assert all(result['membership'])
  assert result['html'].count('mf406-action-picker')==3
  memberships=page.evaluate("(()=>{const t=__MF406TEST__;t.setupMembership();return {order:[t.order('all'),t.order('available'),t.order('added')],collections:[t.collection('all'),t.collection('available'),t.collection('added')],logging:[t.logging('all'),t.logging('available'),t.logging('added')]}})()")
  print('memberships',memberships)
  assert memberships['order']==[['a','b'],['b'],['a']],memberships
  assert memberships['collections']==[['co1','co2'],['co2'],['co1']],memberships
  assert memberships['logging']==[['a','b'],['b'],['a']],memberships
  mounted=page.evaluate("(()=>{const t=__MF406TEST__;let out={};try{out.library=t.libraryMarkup().match(/mf406-action-picker/g)?.length||0;}catch(e){out.libError=e.message;}try{out.collection=t.bulk('collection').match(/mf406-action-picker/g)?.length||0;}catch(e){out.colError=e.message;}return out})()")
  print('toolbar markup',mounted)
  assert mounted.get('collection')==3,mounted
  page.set_content('<div id="test"></div>')
  page.add_style_tag(content=(root/'assets/css/218-v406-smart-filters-actions.css').read_text())
  # custom standalone picker interaction after actual JS loaded (DOM stays JS realm)
  page.evaluate("document.getElementById('test').innerHTML=__MF406TEST__.picker('category','library')")
  page.locator('.mf406-action-picker summary').click()
  page.locator('.mf406-picker-panel input').fill('mov')
  visible=page.locator('.mf406-picker-option:visible').count();print('search visible',visible)
  rect=page.locator('.mf406-picker-panel').bounding_box()
  print('popup viewport',rect,'styles',page.locator('.mf406-picker-panel').evaluate('(el)=>({inline:el.style.cssText,minWidth:getComputedStyle(el).minWidth,maxWidth:getComputedStyle(el).maxWidth,width:getComputedStyle(el).width,boxSizing:getComputedStyle(el).boxSizing, parent:el.parentElement.getBoundingClientRect().width})'))
  assert rect and rect['x']>=0 and rect['x']+rect['width']<=width+1,rect
  assert visible==1
  page.close()
 browser.close()
print('ALL PASS')
