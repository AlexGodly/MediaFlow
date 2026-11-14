#!/usr/bin/env python3
"""MediaFlow v397 isolated Chromium integration contracts; no production Supabase."""
from pathlib import Path
import re,subprocess,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
raw=(ROOT/'test-v350-responsive.html').read_text()
styles=(ROOT/'assets/css/210-v397-floating-task-quick-actions.css').read_text()
html=re.sub(r'<link[^>]+>','',raw).replace('</head>','<style>'+styles+'</style></head>')
js=(ROOT/'assets/js/mediaflow-v398.bundle.js').read_text().rstrip()
assert js.endswith('})();')
js=js[:-5]+'''
window.__mf397={S,App,stub:()=>{render=()=>{};saveState=()=>Promise.resolve();showToast=()=>{};persistTask=()=>{};renderLogSuggestions=()=>{};},MODEL:mf397ReadState,UPDATE:mf397Update,CLOSE:mf397SetMenu, ACTION:mf397Action,init:()=>{
  AUTH_USER={id:'v397-browser-test',email:'test@mediaflow.local'};
  S.view='dashboard';S.sessionActive=true;S.logging=true;S.modal=null;
  S.categories=[{id:'seasonal',name:'Seasonal Anime',type:'video',unit:'episodes',target:10,minutesPerUnit:25,enabled:true,color:'#99ccff'},
                {id:'manga',name:'Asian Comics',type:'reading',unit:'chapters',target:8,minutesPerUnit:10,enabled:true,color:'#aabbcc'}];
  S.library=[{id:'a',title:'Anime One',categoryId:'seasonal',progress:2,total:20,status:'active'},
             {id:'b',title:'Manga One',categoryId:'manga',progress:5,total:40,status:'active'},
             {id:'c',title:'Anime Two',categoryId:'seasonal',progress:1,total:20,status:'active'}];
  S.currentTask={id:'task1',categoryId:'seasonal',unit:'episodes',low:10,high:14,targetMid:12};
  S.logDraft={v369Interface:'itemized',categoryId:'seasonal',entries:[
    {libraryId:'a',title:'Anime One',v369Units:Array.from({length:7},(_,i)=>({id:'a'+i,number:i+3}))},
    {libraryId:'b',title:'Manga One',v369Units:Array.from({length:20},(_,i)=>({id:'b'+i,number:i+6}))}]};
  if(!document.querySelector('#app'))document.body.insertAdjacentHTML('afterbegin','<div id="app"></div>');
  document.getElementById('app').innerHTML='<div class="sidebar"></div><div class="main"><div id="view-root"></div></div>';
  mf397Update();
 },set:(n,mode='itemized')=>{
   S.logDraft.v369Interface=mode;
   if(mode==='itemized')S.logDraft.entries[0].v369Units=Array.from({length:n},(_,i)=>({id:'a'+i,number:i+3}));
   else S.logDraft.entries[0].qty=n;
   mf397Update();
 },setOther:n=>{S.logDraft.entries[1].v369Units=Array.from({length:n},(_,i)=>({id:'b'+i,number:i+6}));mf397Update()},
 setSession:v=>{S.sessionActive=v;mf397Update()},
 setLogging:v=>{S.logging=v;mf397Update()},
 addMatching:()=>{S.logDraft.entries.push({libraryId:'c',qty:3,v369Units:Array.from({length:3},(_,i)=>({id:'c'+i,number:i+2}))});mf397Update();},
 clearMatching:()=>{S.logDraft.entries=S.logDraft.entries.filter(e=>e.libraryId==='b');mf397Update();},
 setTarget:(low,high)=>{S.currentTask.low=low;S.currentTask.high=high;mf397Update();}
};})();'''
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in [375,430,820,1280]:
  page=browser.new_page(viewport={'width':width,'height':850},reduced_motion='reduce')
  errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
  page.set_content(html)
  page.evaluate('''()=>{const storage=new Map();Object.defineProperty(window,"localStorage",{configurable:true,value:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)}})}''')
  page.add_script_tag(content=js)
  page.evaluate('()=>__mf397.init()')
  assert page.locator('#mf397-fab').is_visible(),(width,'+ button should always show')
  assert page.locator('#mf397-progress').is_visible(),(width,'expected matching title progress')
  assert page.locator('#mf397-count').inner_text()=='7 / 10'
  assert page.locator('#mf397-percent').inner_text().endswith('%')
  assert page.locator('#mf397-category').inner_text().endswith('SEASONAL ANIME')
  page.evaluate('()=>__mf397.setOther(100)')
  assert page.locator('#mf397-count').inner_text()=='7 / 10',(width,'other category polluted task progress')
  page.evaluate('()=>__mf397.set(10)')
  assert page.locator('#mf397-count').inner_text()=='10 / 10'
  assert 'Goal reached' in page.locator('#mf397-status').inner_text()
  page.evaluate('()=>__mf397.set(13)')
  assert page.locator('#mf397-count').inner_text()=='13 / 13'
  assert 'Within target range' in page.locator('#mf397-status').inner_text()
  page.evaluate('()=>__mf397.set(16)')
  assert page.locator('#mf397-count').inner_text()=='16 / 14'
  assert 'Overwatched' in page.locator('#mf397-status').inner_text()
  page.evaluate('()=>__mf397.set(2)')
  assert page.locator('#mf397-count').inner_text()=='2 / 10'
  page.evaluate('()=>__mf397.set(4,"quick")')
  assert page.locator('#mf397-count').inner_text()=='4 / 10'
  page.evaluate('()=>__mf397.set(7,"itemized")')
  page.evaluate('()=>__mf397.addMatching()')
  assert page.locator('#mf397-count').inner_text()=='10 / 10'
  page.locator('#mf397-fab').click(force=True)
  assert page.locator('#mf397-fab').get_attribute('aria-expanded')=='true'
  assert page.locator('.mf397-fan-action').count()==3
  page.keyboard.press('Escape')
  assert page.locator('#mf397-fab').get_attribute('aria-expanded')=='false'
  page.locator('#mf397-collapse').click(force=True)
  assert 'compact' in page.locator('#mf397-progress').get_attribute('class')
  page.locator('#mf397-collapse').click(force=True)
  page.evaluate('()=>__mf397.clearMatching()')
  assert page.locator('#mf397-progress').is_hidden(),(width,'bar should disappear when no matching titles')
  assert page.locator('#mf397-fab').is_visible(),(width,'+ should persist regardless of task titles')
  page.evaluate('()=>__mf397.setSession(false)')
  assert page.locator('#mf397-fab').is_visible()
  # The quick actions must invoke the established MediaFlow editors/workflows,
  # not merely display decorative fan items.
  page.evaluate("""()=>{
    __mf397.stub();
    __mf397.S.collections=[];
    __mf397.ACTION('library');
  }""")
  assert page.evaluate('()=>__mf397.S.modal?.type')=='library',(width,'Add to Library did not open existing editor')
  page.evaluate('()=>__mf397.ACTION("collection")')
  assert page.locator('#mf274-collection-editor').count()==1,(width,'Collection creation editor not opened')
  page.locator('#mf274-col-title').fill('Fresh Collection')
  page.evaluate('()=>__mf397.App.v274SaveCollection("")')
  page.wait_for_timeout(90)
  assert page.evaluate('()=>__mf397.S.collections.length')==1,(width,'collection not created')
  assert page.evaluate('()=>__mf397.S.view')=='collections',(width,'new collection not automatically opened')
  page.evaluate('()=>{__mf397.S.logging=false;__mf397.S.sessionActive=true;__mf397.ACTION("logging")}')
  assert page.evaluate('()=>__mf397.S.view')=='dashboard',(width,'Logging action did not navigate to dashboard')
  assert page.evaluate('()=>__mf397.S.logging') is True,(width,'Logging action did not open draft form')
  assert not errors,(width,'JavaScript errors',errors[:3])
  print('PASS',width,'progress, category scope, ranged goal, all methods, menu, compact, visibility')
  page.close()
 browser.close()
