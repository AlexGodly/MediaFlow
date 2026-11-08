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
js=(R/'assets/js/mediaflow-v403.bundle.js').read_text().rstrip()
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
  for width in [320,390,820,1023,1280,1920]:
   page=browser.new_page(viewport={'width':width,'height':860},device_scale_factor=1,reduced_motion='reduce');page.set_default_timeout(12000)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(html)
   page.evaluate("()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}")
   page.add_script_tag(content=js);page.evaluate('()=>__v398.init()')
   page.evaluate('()=>{__v398.S.view="order";__v398.renderShell();__v398.App.v354OpenSheet("title")}')
   info=page.evaluate("""()=>{let s=document.querySelector('.mf400-order-workspace'),d=s?.querySelector('.mf356-title-filters'),shell=s?.querySelector('.mf400-order-shell'),r=s?.querySelector('#v138-order-picker-results');return {shell:!!shell,open:d?.open,search:!!s?.querySelector('.mf400-order-sidebar .v138-picker-search'),pager:!!s?.querySelector('.mf400-order-main #v140-order-picker-pager'),direct:!!d?.querySelector('.mf392-order-tools'),modes:!!d?.querySelector('.mf358-mode-buttons'),numeric:!!d?.querySelector('.mf399-title-page-field'),sizes:!!d?.querySelector('.mf358-size-controls'),result:!!r?.querySelector('.mf392-order-row'),cols:shell?getComputedStyle(shell).gridTemplateColumns:"MISSING"};}""")
   assert all(info.get(key) for key in ['shell','search','pager','direct','modes','numeric','sizes','result']),(width,'order workspace',info)
   assert info['open']==(width>1023),(width,'responsive title tools',info)
   inp=page.locator('.mf400-order-workspace .mf399-title-page-field input')
   if width<=1023:page.evaluate('()=>document.querySelector(".mf400-order-workspace .mf356-title-filters").open=true')
   inp.fill('9');inp.dispatch_event('change')
   count=page.evaluate('()=>document.querySelectorAll(".mf400-order-workspace #v138-order-picker-results .mf392-order-row").length')
   assert count==9,(width,'title paging',count)
   for mode in ['list','compact','cards','covers','covers-title']:
    page.evaluate('m=>__v398.App.v358TitleMode(m)',mode)
    assert page.evaluate('()=>document.querySelectorAll(".mf400-order-workspace #v138-order-picker-results .mf392-order-row").length')==9,(width,mode)
   if width in [390,820,1280]:page.screenshot(path=str(R/f'v400-order-picker-{width}.png'))
   page.evaluate('()=>__v398.App.v354CloseSheet();__v398.App.v354OpenSheet("collection")')
   cc=page.evaluate("""()=>{let s=document.querySelector('.mf400-collection-tools-sheet'),d=s?.querySelector('.mf358-collection-filters');return {found:!!s,summary:d?.querySelector('summary')?.textContent,page:!!d?.querySelector('.mf359-page-size-field'),modes:!!d?.querySelector('.mf361-collection-mode-buttons'),size:!!d?.querySelector('.mf361-collection-size-controls'),actionsIn:!!d?.querySelector('.mf392-assignment-tools'),actionsOutside:!!s?.querySelector('.mf392-assignment-tools')}}""")
   assert cc['found'] and 'Tools & Filters' in cc['summary'] and cc['page'] and cc['modes'] and cc['size'],(width,'Collection Tools & Filters',cc)
   if width<=650:assert cc['actionsIn'],(width,'mobile selection toggles absent')
   page.evaluate('()=>__v398.App.v361CollectionMode("list")')
   if width<=650:
    dim=page.evaluate("""()=>{let c=document.querySelector('.mf400-collection-tools-sheet .mf361-mode-list .mf287-picker-cover');return c?{w:c.getBoundingClientRect().width,h:c.getBoundingClientRect().height}:null}""")
    assert dim and dim['w']>=60 and dim['h']>=80,(width,'Collection cover distorted',dim)
   if width in [390,820,1280]:page.screenshot(path=str(R/f'v400-collections-order-picker-{width}.png'))
   page.evaluate('()=>__v398.App.v354CloseSheet();__v398.S.view="collections";__v398.renderShell();__v398.App.v274OpenAddTitles("collection0")')
   assert page.evaluate('()=>!!document.querySelector(".mf399-collection-tools")'),(width,'Collections Add Titles missing')
   if width<=1023:
    page.evaluate('()=>document.querySelector(".mf399-collection-tools").open=false')
    page.set_viewport_size({'width':1280,'height':860});page.wait_for_timeout(100)
    visible=page.evaluate("""()=>{let d=document.querySelector('.mf399-collection-tools');return {open:d.open,rect:d.querySelector('.mf399-collection-tool-content').getBoundingClientRect().height}}""")
    assert visible['open'] and visible['rect']>80,(width,'sidebar vanished after growing viewport',visible)
    page.set_viewport_size({'width':width,'height':860});page.wait_for_timeout(100)
    assert page.evaluate('()=>!document.querySelector(".mf399-collection-tools").open'),(width,'narrow collapsed state not restored')
   page.close()
   print('PASS',width,'Personal Order title modes, Tools and collection resize')
  browser.close()
finally:
 server.terminate();server.wait()
