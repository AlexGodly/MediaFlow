#!/usr/bin/env python3
"""v408 controlled real-module browser tests; not an authenticated app session."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text()
html=re.sub(r'<script[^>]*>[^<]*</script>','',html,flags=re.S|re.I)
html=re.sub(r'<link\b[^>]*>','',html,flags=re.I|re.S)
src=(root/'assets/js/mediaflow-v408.bundle.js').read_text()
assert src.rstrip().endswith('})();')
bridge='''
window.__MF408__={
 setData(){
   S.categories=[{id:'c1',name:'Seasonal Anime',icon:'🌸',color:'#f66',unit:'episodes'},
     {id:'c2',name:'Anime Movies',icon:'🎬',color:'#f80',unit:'movies'},
     {id:'c3',name:'Books',icon:'📚',color:'#8bf',unit:'chapters'}];
   S.library=[{id:'a',title:'Test Anime',categoryId:'c1',status:'active',priority:'high',total:12,progress:2,createdAt:1234},{id:'b',title:'Movie One',categoryId:'c2',status:'planned',priority:'low',total:1,progress:0,createdAt:345}];
   S.collections=[{id:'cl',title:'Collection 1',description:'',coverUrl:'',titleIds:['a'],order:['a'],createdAt:1,updatedAt:2,lastViewedAt:0,autoBackground:false}];
   V274_UI.activeId='cl';V274_UI.filters.categories=[];
   if(!S.settings)S.settings={};
   S.settings.v230ChoiceLayout={modifiedAt:0,categoryFilter:{source:'custom',order:['c3','c1','c2'],hidden:[]}};
   v230EnsureChoiceLayout(S.settings);
   V408_CAT_UI.collection={query:'',open:false};V408_CAT_UI.add={query:'',open:false};
   v53InvalidateLibraryCache();
 },
 renderCollection(){return v274CollectionToolsHtml(v274CollectionById('cl'))},
 renderAdd(){return v274AddModalBody(v274CollectionById('cl'))},
 renderLog(){
   S.entryDraft={title:''};S.logDraft={entries:[]};return v224LogToolsHtml(S.library,1);
 },
 repeats:()=>v81RepeatTotals(),
 audit:()=>window.MediaFlowV408.audit(),
 get show(){return S.settings}
};
'''
src=src.rstrip()[:-len('})();')]+bridge+'\n})();\n'
css=(root/'assets/css/220-v408-performance-logging-category.css').read_text()
with sync_playwright() as p:
  b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  for width in [320,390,820,1280]:
    page=b.new_page(viewport={'width':width,'height':850})
    errors=[]
    page.on('pageerror',lambda err: errors.append(str(err)))
    page.set_content(html)
    page.add_style_tag(content=css)
    page.evaluate("""(()=>{let data={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>data[k]||null,setItem:(k,v)=>data[k]=String(v),removeItem:k=>delete data[k]}})})()""")
    page.add_script_tag(content=src)
    page.evaluate('__MF408__.setData()')
    if width==1280:
      print('LIBRARY RENDER TRY',page.evaluate("(()=>{try { S.view='library';S.histFilters={libCategory:'all',libStatus:'all',libPriority:'all',libSearch:'',libSort:'priority-desc'};let t=performance.now();let html=renderLibrary();return {ms:(performance.now()-t).toFixed(1),size:html.length};}catch(e){return String(e)}})()"))
    for surface in ('collection','add'):
      page.evaluate('surface=>{document.body.innerHTML=`<div id="test">${surface==="collection"?__MF408__.renderCollection():__MF408__.renderAdd()}</div>`}',surface)
      category=page.locator('.mf408-searchable-categories').first
      assert category.count()==1,(width,surface,'missing searchable menu')
      page.evaluate("document.querySelector('.mf408-searchable-categories').open=true")
      search=category.locator('.mf408-category-search')
      assert search.count()==1
      opts=category.locator('.v66-cat-option')
      assert opts.count()==3,(width,surface,opts.count())
      # Check all categories are still shown according to current filter state.
      labels=opts.all_text_contents()
      assert 'Books' in labels[0],(surface,labels)
      page.evaluate("el=>{el.value='anime';el.dispatchEvent(new Event('input',{bubbles:true}))}",search.element_handle())
      assert category.locator('.v66-cat-option:not([hidden])').count()==2,(width,surface)
      page.evaluate("el=>{el.value='xyz';el.dispatchEvent(new Event('input',{bubbles:true}))}",search.element_handle())
      assert category.locator('.v66-cat-option:not([hidden])').count()==0
      assert category.locator('.mf408-category-empty:not([hidden])').count()==1
      page.evaluate("el=>{el.value='books';el.dispatchEvent(new Event('input',{bubbles:true}))}",search.element_handle())
      assert category.locator('.v66-cat-option:not([hidden])').count()==1
      # Search must not mutate any category checkbox selection.
      assert not category.locator('.v66-cat-option:not([hidden]) input').first.is_checked()
      # No query-triggered mass unchecks; category checkbox handlers remain active.
    page.evaluate('''()=>{document.body.innerHTML=`<div class="log-form"><details class="mf383-logging-library" open><div class="mf383-logging-body" style="width:min(100%,900px)">${__MF408__.renderLog()}</div></details></div>`}''')
    page.wait_for_timeout(100)
    member=page.locator('.v224-log-tools .mf406-membership select')
    assert member.count()==1,(width,'missing logging Show')
    assert member.locator('option').all_text_contents()==['All titles','Not added','Already added']
    log=page.locator('.v224-log-tools')
    assert log.count()==1
    print('PASS v408 at',width,'category search both surfaces, log membership, errors:',errors)
    assert not errors,(width,errors)
    page.close()
  b.close()
print('v408 browser tests passed')
