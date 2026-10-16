"""v390 Library search caret regression: real compiled Library renderer; offline synthetic account.
Exercises mid-string edits, delayed refresh, selection ranges, rapid typing, blur and both Library modes.
"""
from pathlib import Path
import re, subprocess, time
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
raw=(R/'test-v350-responsive.html').read_text()
index=(R/'index.html').read_text()
css='\n'.join((R/p).read_text() for p in re.findall(r'href="(assets/css/[^\"]+)"',index) if (R/p).exists())
html=re.sub(r'<link[^>]+>', '',raw).replace('</head>', '<style>'+css+'</style><base href="http://127.0.0.1:8791/"></head>')
js=(R/'assets/js/mediaflow-v394.bundle.js').read_text().rstrip()
assert js.endswith('})();')
js=js[:-5]+'''
window.__v390={S,App,renderShell,render,show:mode=>{
  V115_STARTUP_GUARD=false;
  S.view='library';S.logging=false;S.modal=null;S.sessionActive=true;S.sessions=[];S.activityLog=[];S.completionTimeline=[];
  S.settings=S.settings||{};
  v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS).mode=mode==='dynamic'?'dynamic':'classic';
  S.categories=[{id:'anime',name:'Anime',unit:'episodes',type:'video',target:2,weight:3,minutesPerUnit:24,color:'#55aadd',enabled:true}];
  S.library=Array.from({length:54},(_,i)=>({id:'search-'+i,title:i===4?'hotel inhumans':'library demo '+i,categoryId:'anime',status:'active',priority:'medium',progress:i,total:50}));
  S.histFilters=S.histFilters||{};S.histFilters.libSearch='';S.libPage=0;
  renderShell();
}, audit:()=>({view:S.view,query:S.histFilters?.libSearch,libPage:S.libPage,searches:document.querySelectorAll('#view-root .lib-search').length})};})();'''
server=subprocess.Popen(['python','-m','http.server','8791','--bind','127.0.0.1'],cwd=R,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 time.sleep(.6)
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  for width,mode in ((320,'normal'),(390,'normal'),(390,'dynamic'),(820,'normal'),(820,'dynamic'),(1280,'normal'),(1920,'dynamic')):
   page=b.new_page(viewport={'width':width,'height':800});page.set_default_timeout(9000)
   errors=[];page.on('pageerror',lambda x:errors.append(str(x)))
   page.set_content(html)
   page.evaluate('''()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}''')
   page.add_script_tag(content=js)
   page.evaluate('(mode)=>__v390.show(mode)',mode)
   info=page.evaluate('()=>__v390.audit()')
   assert info['searches']>=1,(width,mode,'no Library searches',info)
   # Choose the currently visible real Library search input.
   selected=page.evaluate('''()=>{const e=[...document.querySelectorAll('#view-root .lib-search')].find(el=>el.offsetParent!==null&&getComputedStyle(el).visibility!=='hidden');if(!e)return null;e.setAttribute('data-v390-target','yes');return {cls:e.className};}''')
   assert selected,(width,mode,'no visible search',info)
   inp=page.locator('[data-v390-target]')
   inp.fill('hot inhumans')
   # User clicks between hot and the space BEFORE debounce finishes.
   page.evaluate('''()=>{const e=document.querySelector('[data-v390-target]');e.focus();e.setSelectionRange(3,3)}''')
   # Let debounce plus requestIdle callback and delayed v265 restoration finish.
   page.wait_for_timeout(700)
   audit=page.evaluate('''()=>{const e=document.activeElement;return {tag:e?.tagName,cls:e?.className,value:e?.value,start:e?.selectionStart,end:e?.selectionEnd,store:__v390.S.histFilters.libSearch,focus:e?.matches?.('.lib-search')};}''')
   assert audit['value']=='hot inhumans' and audit['start']==3 and audit['end']==3 and audit['focus'],(width,mode,'caret drift after refresh',audit)
   # Editing at the old caret should yield hotel inhumans, not 'hot inhumansel'.
   page.keyboard.insert_text('el')
   page.wait_for_timeout(700)
   audit=page.evaluate('''()=>{const e=document.activeElement;return {value:e?.value,start:e?.selectionStart,end:e?.selectionEnd,store:__v390.S.histFilters.libSearch,focus:e?.matches?.('.lib-search')};}''')
   assert audit['value']=='hotel inhumans' and audit['store']=='hotel inhumans' and audit['start']==5 and audit['focus'],(width,mode,'mid-string edit',audit)
   # A range selected by the user must stay selected after the next refresh.
   page.evaluate('''()=>{const e=document.activeElement;e.setSelectionRange(0,5,'backward');}''')
   page.evaluate('()=>__v390.render()')
   page.wait_for_timeout(260)
   audit=page.evaluate('''()=>{const e=document.activeElement;return {val:e?.value,start:e?.selectionStart,end:e?.selectionEnd,dir:e?.selectionDirection,focus:e?.matches?.('.lib-search')};}''')
   assert audit['start']==0 and audit['end']==5 and audit['dir']=='backward' and audit['focus'],(width,mode,'selected range after render',audit)
   # The Library must not steal focus after user switches to another UI element.
   page.evaluate('''()=>{const b=document.createElement('button');b.id='v390-other-control';b.textContent='Other';document.body.appendChild(b);b.focus();__v390.render();}''')
   page.wait_for_timeout(260)
   assert page.evaluate('()=>document.activeElement?.id')=='v390-other-control',(width,mode,'stole focus from another control')
   assert not errors,(width,mode,'browser errors',errors[:3])
   print('PASS',width,mode,'mid-word caret, insertion, selection, blur',flush=True)
   page.close()
  b.close()
finally:
 server.terminate();server.wait(timeout=10)
