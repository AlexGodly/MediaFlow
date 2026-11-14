"""v387 regression: real v387 Logging renderer, reordering a scrolled Added
Titles list in Quick and Per Unit. Synthetic in-memory draft, no cloud writes.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import subprocess, time, re
R=Path(__file__).resolve().parents[1]
index=(R/'index.html').read_text()
css='\n'.join((R/p).read_text() for p in re.findall(r'href="(assets/css/[^"]+)"', index))
raw=(R/'test-v350-responsive.html').read_text()
html=re.sub(r'<link[^>]+>','',raw).replace('</head>','<style>'+css+'</style><base href="http://127.0.0.1:8777/"></head>')
js=(R/'assets/js/mediaflow-v389.bundle.js').read_text().rstrip()
assert js.endswith('})();')
js=js[:-5]+'''\nwindow.__v387={S,App,renderLogForm,v373OrderedEntries,v373ApplyDOMOrder,v373OrderState,v369RefreshPanels};})();'''
server=subprocess.Popen(['python','-m','http.server','8777','--bind','127.0.0.1'],cwd=R,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 time.sleep(.6)
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  for width in (320,390,820,1280,1920):
   page=browser.new_page(viewport={'width':width,'height':700})
   page.set_default_timeout(9000)
   errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(html)
   page.evaluate('''()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}''')
   page.add_script_tag(content=js)
   for mode in ('itemized','quick'):
    state=page.evaluate('''(mode)=>{
      const x=window.__v387;
      x.S.library=Array.from({length:48},(_,i)=>({id:'item-'+i,title:'Anime '+String(i+1).padStart(3,'0'),categoryId:'anime',status:'watching',priority:'medium',progress:0,total:24,createdAt:Date.now()-i*120000}));
      x.S.categories=[{id:'anime',name:'Anime',unit:'episodes',minutesPerUnit:24}];
      x.S.logDraft={entries:x.S.library.map((item,i)=>({libraryId:item.id,title:item.title,qty:1,minutes:24,v369Units:[],loggedAt:Date.now()+i*1000})),v369Interface:mode, v373Ordering:{sort:'logAdded',dir:'asc',manualIds:[],randomSeed:3}};
      x.S.logging=true;x.S.view='dashboard';
      let root=document.querySelector('#view-root');if(!root){root=document.createElement('div');root.id='view-root';document.body.appendChild(root)}
      root.innerHTML=x.renderLogForm({unit:'episodes',low:1,high:3,title:'Demo Anime',categoryId:'anime'},{id:'anime',name:'Anime',unit:'episodes'});
      // Real viewer scroll; not an isolated scroll-only fake list.
      document.body.style.margin='0';document.body.style.padding='0';
      root.style.paddingBottom='1100px';
      return {list:!!root.querySelector('.v370-panels,.v239-logged-title-list'),cards:root.querySelectorAll('.mf373-row-controls').length,scrollMax:document.documentElement.scrollHeight-innerHeight,form:!!root.querySelector('.log-form')};
    }''',mode)
    assert state['cards']>=20 and state['scrollMax']>500,(width,mode,'bad logging fixtures',state)
    for kind in ('arrow','numeric','sort','direction','drag'):
     # Return to deterministic original draft sorting and a deeper scroll location.
     page.evaluate('''()=>{const x=window.__v387;x.S.logDraft.v373Ordering={sort:'logAdded',dir:'asc',manualIds:[],randomSeed:3};x.v373ApplyDOMOrder(document.querySelector('.log-form'));}''')
     page.wait_for_timeout(45)  # let previous frame-stabilization complete before manual scrolling
     page.evaluate('''()=>{
       const els=[...document.querySelectorAll('.main,.container,#view-root,#app')].filter(el=>el.scrollHeight>el.clientHeight+200 && /(auto|scroll|overlay)/.test(getComputedStyle(el).overflowY));
       const el=els[0]; if(el)el.scrollTop=Math.min(1500,el.scrollHeight-el.clientHeight-100);
       else window.scrollTo({top:Math.min(1500,document.documentElement.scrollHeight-innerHeight-100),behavior:'instant'});
     }''')
     page.wait_for_timeout(35)
     before=page.evaluate('''()=>{const el=[...document.querySelectorAll('.main,.container,#view-root,#app')].find(x=>x.scrollHeight>x.clientHeight+200&&/(auto|scroll|overlay)/.test(getComputedStyle(x).overflowY));return el?el.scrollTop:window.scrollY}''')
     assert before>250,(width,mode,kind,'did not scroll',before)
     first_order=page.evaluate('''()=>[...document.querySelectorAll('.mf373-row-controls')].map(x=>+x.parentElement.dataset.mf373Entry)''')
     if kind=='arrow':
      page.evaluate('''()=>window.__v387.App.v373Step(19,-1)''')
     elif kind=='numeric':
      # Use actual position input onchange, and check it remains focused.
      page.evaluate('''()=>{const card=document.querySelector('[data-mf373-entry="24"]');const input=card.querySelector('.mf373-position-label input');input.focus({preventScroll:true});input.value='10';input.dispatchEvent(new Event('change',{bubbles:true}));}''')
     elif kind=='sort':
      page.evaluate('''()=>window.__v387.App.v373SetSort('added')''')
     elif kind=='direction':
      page.evaluate('''()=>window.__v387.App.v373ToggleDirection()''')
     elif kind=='drag':
      page.evaluate('''()=>window.__v387.App.v373Move(20,11)''')
     page.wait_for_timeout(80)
     after=page.evaluate('''()=>{const el=[...document.querySelectorAll('.main,.container,#view-root,#app')].find(x=>x.scrollHeight>x.clientHeight+200&&/(auto|scroll|overlay)/.test(getComputedStyle(x).overflowY));return el?el.scrollTop:window.scrollY}''')
     order=page.evaluate('''()=>[...document.querySelectorAll('.mf373-row-controls')].map(x=>+x.parentElement.dataset.mf373Entry)''')
     assert abs(after-before)<=2,(width,mode,kind,'scroll jumped',before,after)
     assert order!=first_order,(width,mode,kind,'order did not change')
     if kind=='numeric':
      focused=page.evaluate('''()=>document.activeElement?.matches?.('.mf373-position-label input')''')
      assert focused,(width,mode,'numeric input lost focus')
     # Verify draft identities remain intact, not being mutated by display order.
     draft_ids=page.evaluate('''()=>window.__v387.S.logDraft.entries.map(e=>e.libraryId)''')
     assert draft_ids==['item-'+str(i) for i in range(48)],(width,mode,kind,'draft reordered')
     print('PASS',width,mode,kind,'scroll',before,after,flush=True)
   # The actual generated onclick handler is tested through the DOM button
   # (without Playwright's automatic scroll-to-center before pointer clicking).
   page.evaluate("()=>{window.scrollTo({top:1500,behavior:'instant'})}")
   page.wait_for_timeout(40)
   clicked_before=page.evaluate('window.scrollY')
   page.evaluate('''()=>document.querySelector('.mf373-logging [data-mf373-entry="15"] .mf373-move-up').click()''')
   page.wait_for_timeout(65)
   clicked_after=page.evaluate('window.scrollY')
   assert abs(clicked_before-clicked_after)<=2,(width,'DOM button scroll changed',clicked_before,clicked_after)
   print('PASS',width,'actual DOM arrow handler stays in place',clicked_before,clicked_after,flush=True)
   # Verify a no-op DOM reorder performs zero reparenting operations on the
   # list; v386 did unnecessary appendChild() for every title on each pass.
   quiet=page.evaluate('''()=>{
     const m=window.__v387, form=document.querySelector('.log-form'),list=form.querySelector('.v239-logged-title-list')||form.querySelector('.v370-panels');
     let count=0;const observer=new MutationObserver(records=>{for(const r of records)if(r.type==='childList')count+=r.addedNodes.length+r.removedNodes.length});
     observer.observe(list,{childList:true});m.v373ApplyDOMOrder(form);m.v373ApplyDOMOrder(form);
     return new Promise(ok=>queueMicrotask(()=>{observer.disconnect();ok(count)}));
   }''')
   assert quiet==0,(width,'no-op ordering still detaches cards',quiet)
   print('PASS',width,'no-op order preserves all existing card nodes',flush=True)
   # Test a nested scrolling shell as well as window scrolling. Main MediaFlow
   # layouts can use an internal content scroller on some platforms.
   page.evaluate('''()=>{
     const root=document.querySelector('#view-root');const el=document.createElement('div');el.id='v387-scroll-shell';root.parentElement.insertBefore(el,root);el.append(root);document.documentElement.style.overflow='hidden';
     document.body.style.overflow='hidden';document.body.style.height='700px';
     el.style.height='700px';el.style.overflowY='auto';el.style.scrollBehavior='auto';
     el.scrollTop=1200;
   }''')
   nested_before=page.evaluate("document.querySelector('#v387-scroll-shell').scrollTop")
   assert nested_before>600,(width,'nested scroller setup failed',nested_before)
   page.evaluate("()=>window.__v387.App.v373Move(17,5)")
   page.wait_for_timeout(85)
   nested_after=page.evaluate("document.querySelector('#v387-scroll-shell').scrollTop")
   assert abs(nested_before-nested_after)<=2,(width,'nested scroll jumped',nested_before,nested_after)
   print('PASS',width,'nested scroll container stays stable',flush=True)
   # Repeat moves while deeply scrolled: useful for proving subsequent actions
   # don't silently reapply an older saved viewport.
   start=page.evaluate('performance.now()')
   for i in range(20):
    page.evaluate("(step)=>window.__v387.App.v373Step(20,step)",(-1 if i%2==0 else 1))
   page.wait_for_timeout(90)
   nested_final=page.evaluate("document.querySelector('#v387-scroll-shell').scrollTop")
   assert abs(nested_before-nested_final)<=2,(width,'rapid repeated moves changed scroll',nested_before,nested_final)
   print('PASS',width,'20 repeated moves, stable nested scroll',flush=True)
   assert not errors,(width,errors[:3])
   page.close()
  browser.close()
finally:
 server.terminate();server.wait(timeout=5)
