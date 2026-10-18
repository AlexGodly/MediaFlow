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
js=(R/'assets/js/mediaflow-v398.bundle.js').read_text().rstrip()
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
 time.sleep(.45)
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  for width in [320,375,430,768,820,1023,1280]:
   page=browser.new_page(viewport={'width':width,'height':840}, device_scale_factor=1, reduced_motion='reduce');page.set_default_timeout(6500)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(html)
   page.evaluate('''()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}''')
   page.add_script_tag(content=js)
   page.evaluate('()=>__v398.init()')
   page.evaluate('()=>__v398.recRender()')
   rec=page.evaluate('''()=>{const c=document.querySelector('#mf398-rec-test .mf395-rec-card');let r=c.getBoundingClientRect();return {width:r.width,scroll:c.scrollWidth,columns:getComputedStyle(c).gridTemplateColumns,cover:document.querySelector('.mf395-rec-cover')?.getBoundingClientRect().height||0,why:getComputedStyle(document.querySelector('.mf398-rec-mobile-reasons')).display,actions:[...document.querySelectorAll('.mf395-rec-actions button')].map(b=>b.getBoundingClientRect().width)};}''')
   assert page.evaluate("()=>getComputedStyle(document.querySelector('#mf398-rec-test .mf395-rec-card')).overflow")=='hidden',(width,'recommendation lacks clipping')
   if width<=600:assert rec['cover']<200,(width,'unreasonably tall cover',rec)
   if width>=1024:assert rec['why']=='none',(width,'desktop mobile detail leaked',rec)
   page.evaluate('()=>__v398.logRender()')
   log=page.evaluate('''()=>{let p=document.querySelector('#mf398-log-test .mf395-progress-preview');let bar=p?.querySelector('.mf395-progress-stack');let b=bar?.getBoundingClientRect();return {exists:!!p,display:p&&getComputedStyle(p).display,height:b?.height||0,width:b?.width||0,visible:bar&&getComputedStyle(bar).display,segments:p?.querySelectorAll('.mf395-progress-segment').length,html:p?.outerHTML.slice(0,130)}}''')
   assert log['exists'] and log['height']>=10 and log['width']>60 and log['segments']==2,(width,'unified logging bar absent',log)
   assert page.evaluate("()=>document.querySelector('#mf398-log-test').dataset.previewAlreadyRendered")=='yes',(width,'progress renderer did not inject unified bar')
   if width<=1023:
    cardw=page.evaluate("()=>document.querySelector('#mf398-log-test .v370-title-head').getBoundingClientRect().width")
    assert log['width']>cardw*.76,(width,'progress bar squeezed into info column',log,cardw)
   if width in [375,820]:
    page.screenshot(path=str(R/f'v398-rec-logging-{width}.png'),full_page=True)
   page.evaluate("()=>__v398.App.v274OpenAddTitles('collection0')")
   for mode in ['list','compact','cards','covers','covers-title']:
    # Call through real view buttons which preserve state, not an invented method.
    page.evaluate('''mode=>{const button=[...document.querySelectorAll('#mf274-add-titles .mf352-view-mode')].find(b=>b.getAttribute('onclick')?.includes("'"+mode+"'"));if(button)button.click()}''',mode)
    dimensions=page.evaluate('''()=>{const root=document.querySelector('#mf276-add-results'),rows=[...root.querySelectorAll('.mf392-picker-item')];return {mode:root.className,width:root.getBoundingClientRect().width,scroll:root.scrollWidth,rowWidth:rows[0]?.getBoundingClientRect().width||0,buttons:rows.filter(e=>e.querySelector('.mf392-action')).length}}''')
    assert dimensions['buttons']>0,(width,mode,'collection title picker actions absent',dimensions)
    if width<=1023:assert dimensions['scroll']<=dimensions['width']+6,(width,mode,'collection title picker horizontal overflow',dimensions)
   page.evaluate("()=>__v398.App.v274CloseOverlay('mf274-add-titles');__v398.S.view='order';__v398.renderShell();__v398.App.v354OpenSheet('title')")
   for mode in ['list','compact','cards','covers','covers-title']:
    page.evaluate('''m=>__v398.App.v358TitleMode(m)''',mode)
    dimensions=page.evaluate('''()=>{const el=document.querySelector('.mf358-title-results');const row=el?.querySelector('.mf392-order-row');const title=row?.querySelector('.v138-picker-copy b');return {width:el?.getBoundingClientRect().width||0,scroll:el?.scrollWidth||0,grid:getComputedStyle(el).gridTemplateColumns,rows:el?.children.length||0,row:row?.getBoundingClientRect().width||0,title: title?.getBoundingClientRect().width||0,button:!!row?.querySelector('.mf392-action')}}''')
    assert dimensions['rows']>0 and dimensions['button'],(width,'title view broken',mode,dimensions)
    if width<=1023:assert dimensions['scroll']<=dimensions['width']+6,(width,'title picker overflow',mode,dimensions)
   page.evaluate("()=>__v398.App.v354CloseSheet();__v398.App.v354OpenSheet('collection')")
   for mode in ['list','compact','cards','covers','covers-title']:
    page.evaluate('''m=>__v398.App.v361CollectionMode(m)''',mode)
    dimensions=page.evaluate('''()=>{const el=document.querySelector('.mf361-collection-results');const row=el?.querySelector('.mf287-picker-row');return {width:el?.getBoundingClientRect().width||0,scroll:el?.scrollWidth||0,grid:getComputedStyle(el).gridTemplateColumns,rows:el?.children.length||0,row:row?.getBoundingClientRect().width||0,button:!!row?.querySelector('.mf392-action')}}''')
    assert dimensions['rows']>0 and dimensions['button'],(width,'collection view broken',mode,dimensions)
    if width<=1023:assert dimensions['scroll']<=dimensions['width']+6,(width,'collection picker overflow',mode,dimensions)
   if width in [375,820,1280]:
    page.evaluate('()=>__v398.App.v354CloseSheet()')
    page.screenshot(path=str(R/f'v398-ui-preview-{width}.png'),full_page=False)
   assert not errors,(width,'page errors',errors[:5])
   print('PASS',width,'recommendation, unified progress, 3 dialogs × 5 display modes, overflow',flush=True)
   page.close()
  browser.close()
finally:
 server.terminate();server.wait(timeout=5)
