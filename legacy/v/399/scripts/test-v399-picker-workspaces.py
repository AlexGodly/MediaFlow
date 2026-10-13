#!/usr/bin/env python3
"""v398 UI integration: real component rendering in Chromium with synthetic/offline state.
No Supabase credentials, network persistence or production writes.
"""
from pathlib import Path
import subprocess, time, re
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
index=(R/'index.html').read_text()
raw=(R/'test-v350-responsive.html').read_text()
allstyles='\n'.join((R/p).read_text() for p in re.findall(r'href="(assets/css/[^"]+)"',index) if (R/p).exists())
html=re.sub(r'<link[^>]+>','',raw).replace('</head>','<style>'+allstyles+'</style><base href="http://127.0.0.1:8898/"></head>')
js=(R/'assets/js/mediaflow-v399.bundle.js').read_text().rstrip()
assert js.endswith('})();')
js=js[:-5]+'''
window.__v398={S,App,renderShell,rec:mf395DashboardRecommendationHtml,progress:v382ProgressHtml,
  v370TitlePanelHtml,
  init:()=>{
    V115_STARTUP_GUARD=false;AUTH_USER={id:'v398-ui-test',email:'ui-test@mediaflow.local'};
    S.view='collections';S.logging=false;S.modal=null;S.sessionActive=true;
    S.settings=S.settings||{};S.settings.exactTitleRecommendations=true;
    S.categories=[{id:'anime',name:'Seasonal Anime',type:'video',unit:'episodes',target:10,weight:3,minutesPerUnit:24,color:'#dd844c',enabled:true},
                  {id:'manga',name:'Asian Comics',type:'reading',unit:'chapters',minutesPerUnit:10,color:'#88aacc',enabled:true}];
    S.library=Array.from({length:28},(_,i)=>({id:'media'+i,title:i===0?'Super Long Name of a Japanese Anime with Way Too Much Text to Fit Inside a Tiny Card':'Title '+i,
      coverUrl:'',createdAt:1000+i,categoryId:'anime',status:'active',priority:'medium',progress:2,total:12}));
    S.collections=Array.from({length:20},(_,i)=>({id:'collection'+i,title:i===0?'A Long Collection With a Really Big Name':'Collection '+i,
      createdAt:10000+i,updatedAt:10000+i,description:'',titleIds:[],order:[]}));
    S.sessions=[];S.activityLog=[];S.orderPlan={};S.orderPlannerUI={};S.collectionTombstones=[];S.librarySelection={};
    S.xpLedger={libraryAdditions:{},libraryEdits:{},manualCovers:{},logCompletions:{}};
    S.currentTask={categoryId:'anime',id:'one',low:10,high:14,targetMid:12};
    S.logDraft={v369Interface:'itemized',categoryId:'anime',entries:[{libraryId:'media0',title:S.library[0].title,loggedAt:Date.now(),qty:2,
      v369Units:[3,4].map(n=>({id:'unit'+n,number:n,seasonId:null,loggedAt:Date.now(),durationSeconds:1440})),v179StartProgress:2,v179EndProgress:4}]};
    rawSet=async()=>true;V274_UI.activeId='collection0';renderShell();
  },
  setMode:(kind,mode)=>{if(kind==='collection')App.v361CollectionMode(mode);else if(kind==='title')App.v358TitleMode(mode);else if(kind==='add')App.v352SetMode(mode);},
  recRender:()=>{document.querySelectorAll('#mf398-rec-test').forEach(e=>e.remove());const el=document.createElement('div');el.id='mf398-rec-test';
    el.style='width:min(100%,700px);margin:20px;max-width:calc(100vw - 40px)';
    el.innerHTML=mf395DashboardRecommendationHtml({title:S.library[0].title,reasons:['61 seasonal titles have fresh episodes','Appeared often in recent tasks','Underrepresented overall — catching up'],categoryId:'anime'},S.categories[0]);document.body.append(el)},
  logRender:()=>{document.querySelectorAll('#mf398-log-test').forEach(e=>e.remove());const el=document.createElement('div');el.id='mf398-log-test';
    el.className='log-form mf373-logging mf378-logging v370-logging';el.style='width:min(100%,690px);margin:20px;max-width:calc(100vw - 40px)';
    el.innerHTML='<div class="v370-panels">'+v370TitlePanelHtml(S.logDraft.entries[0],0)+'</div>';document.body.append(el);
    const card=el.querySelector('.v370-title');el.dataset.previewAlreadyRendered=card?.querySelector('.mf395-progress-preview')?'yes':'no';if(card&&!card.querySelector('.mf395-progress-preview')){
      card.querySelector('.v370-title-info').insertAdjacentHTML('beforeend',v382ProgressHtml(S.library[0],S.logDraft.entries[0]));
    }
  }
};})();'''
server=subprocess.Popen(['python','-m','http.server','8898','--bind','127.0.0.1'],cwd=R,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 time.sleep(.4)
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  for width in [320,390,430,820,1023,1280,1920]:
   page=browser.new_page(viewport={'width':width,'height':850},device_scale_factor=1,reduced_motion='reduce');page.set_default_timeout(6000)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(html)
   page.evaluate('''()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}''')
   page.add_script_tag(content=js);page.evaluate('()=>__v398.init()')
   page.evaluate("()=>__v398.App.v274OpenAddTitles('collection0')")
   info=page.evaluate("()=>{const r=document.querySelector('#mf276-add-results'),d=document.querySelector('.mf399-collection-tools'),s=document.querySelector('.mf399-collection-sidebar'),rows=r?.querySelectorAll('.mf392-picker-item');return {layout:!!s,tools:!!d,open:d?.open,results:rows?.length,columns:getComputedStyle(r).gridTemplateColumns,select:!!document.querySelector('.mf399-collection-page-size input'),search:!!s?.querySelector('#mf276-add-search'),actions:!!d?.querySelector('.mf392-picker-row')}}")
   assert info['layout'] and info['tools'] and info['select'] and info['search'] and info['actions'],(width,'Collection add workspace missing',info)
   if width<=1023:assert not info['open'],(width,'mobile tools must default collapsed',info)
   else:assert info['open'],(width,'desktop toolbar must remain open',info)
   page.evaluate("()=>{document.querySelector('.mf399-collection-tools').open=true}")
   page.wait_for_timeout(50)
   input=page.locator('.mf399-collection-page-size input');input.fill('7');input.dispatch_event('change')
   rows=page.evaluate("()=>document.querySelectorAll('#mf276-add-results .mf392-picker-item').length")
   assert rows==7,(width,'collection custom per-page failed',rows)
   assert page.evaluate('()=>__v398.S.settings.v399CollectionAddPageSize')==7,(width,'perpage not stored')
   assert page.evaluate('()=>document.querySelector(".mf399-collection-tools")?.open'),(width,'tools closed on picker rebuild')
   # Changing category/mode still uses the live DOM preferences.
   page.evaluate('()=>__v398.App.v352PickerMode("compact")')
   compact=page.evaluate("()=>{let r=document.querySelector('#mf276-add-results'),x=r.querySelector('.mf392-picker-item'),a=x.querySelector('.mf392-action');return {w:x.getBoundingClientRect().width,h:x.getBoundingClientRect().height,aw:a?.getBoundingClientRect().width,cols:getComputedStyle(r).gridTemplateColumns}}")
   page.evaluate('()=>__v398.App.v352PickerMode("cards")')
   cards=page.evaluate("()=>{let r=document.querySelector('#mf276-add-results'),x=r.querySelector('.mf392-picker-item');return {w:x.getBoundingClientRect().width,h:x.getBoundingClientRect().height,cols:getComputedStyle(r).gridTemplateColumns,display:getComputedStyle(x).display}}")
   if width<=1023:
    assert cards['display']=='flex' and cards['w']<compact['w'],(width,'Cards must be tiles, not compact list rows',compact,cards)
    assert compact['h']<cards['h'],(width,'Compact should use shorter row',compact,cards)
   if width in [390,820,1280]:
    page.screenshot(path=str(R/f'v399-collection-picker-{width}.png'),full_page=False)
   page.evaluate("()=>__v398.App.v274CloseOverlay('mf274-add-titles');__v398.S.view='order';__v398.renderShell();__v398.App.v354OpenSheet('title')")
   inp=page.locator('.mf399-title-page-field input')
   assert inp.count()==1,(width,'numeric input not present')
   if width<=1023:assert page.locator('.mf399-title-mobile-settings .mf358-size-controls').count()==1 and page.locator('.mf399-title-mobile-settings .mf399-title-page-field').count()==1,(width,'mobile settings not inside filters')
   else:assert page.locator('.mf358-title-display .mf358-size-controls').count()==1 and page.locator('.mf358-title-display .mf399-title-page-field').count()==1,(width,'desktop controls moved')
   if width<=1023:page.evaluate('()=>{const d=document.querySelector(".mf359-title-sheet .mf356-title-filters");if(d)d.open=true;}')
   inp.fill('7');inp.dispatch_event('change')
   n=page.evaluate('()=>document.querySelectorAll("#v138-order-picker-results .mf392-order-row").length')
   assert n==7,(width,'order page size did not update',n)
   for mode in ['list','compact','cards','covers','covers-title']:
    page.evaluate('m=>__v398.App.v358TitleMode(m)',mode)
    count=page.evaluate('()=>document.querySelectorAll("#v138-order-picker-results .mf392-order-row").length')
    assert count==7,(width,'mode change broke pagination',mode,count)
   page.evaluate('()=>__v398.App.v358TitleMode("compact")')
   compact2=page.evaluate("()=>{let r=document.querySelector('#v138-order-picker-results'),x=r.querySelector('.mf392-order-row');return {w:x.getBoundingClientRect().width,h:x.getBoundingClientRect().height,cols:getComputedStyle(r).gridTemplateColumns}}")
   page.evaluate('()=>__v398.App.v358TitleMode("cards")')
   cards2=page.evaluate("()=>{let r=document.querySelector('#v138-order-picker-results'),x=r.querySelector('.mf392-order-row');return {w:x.getBoundingClientRect().width,h:x.getBoundingClientRect().height,cols:getComputedStyle(r).gridTemplateColumns,display:getComputedStyle(x).display}}")
   if width<=1023:
    assert cards2['display']=='flex' and cards2['w']<compact2['w'],(width,'Personal Order cards are list',compact2,cards2)
   if width in [390,820,1280]:page.screenshot(path=str(R/f'v399-order-title-picker-{width}.png'),full_page=False)
   page.evaluate('()=>__v398.App.v354CloseSheet();__v398.App.v354OpenSheet("collection")')
   # numeric selector must show full selected value, not a clipped first digit
   page.evaluate('''()=>{const s=document.querySelector('.mf359-collection-sheet .mf359-page-size-field select');s.value='500';s.dispatchEvent(new Event('change',{bubbles:true}));}''')
   size=page.evaluate("()=>{let x=document.querySelector('.mf359-collection-sheet .mf359-page-size-field select');return {width:x?.getBoundingClientRect().width,value:x?.value,visible:!!x&&x.getBoundingClientRect().width>=99}}")
   assert size['value']=='500' and size['visible'],(width,'collection page selector clipped',size)
   if width>=1024:
    side=page.evaluate("()=>{const card=document.querySelector('.mf359-collection-sheet .mf356-browse-card'),s=card.querySelector('#mf287-collection-search'),category=card.querySelector('.mf354-assign-field');return {search:s.getBoundingClientRect().height,gap:s.getBoundingClientRect().top-category.getBoundingClientRect().bottom,rows:getComputedStyle(card).gridTemplateRows}}")
    assert 40<=side['search']<=45 and side['gap']<40,(width,'desktop sidebar stretch persists',side)
   assert not errors,(width,'JS errors',errors[:3]);print('PASS v399',width,'collection actions + sizes + modes + desktop sidebar',flush=True)
   page.close()
  browser.close()
finally:
 server.terminate();server.wait(timeout=5)
