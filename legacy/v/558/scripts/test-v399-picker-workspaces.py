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
  b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  page=b.new_page(viewport={'width':1280,'height':850});page.set_content(html);page.add_script_tag(content=js);page.evaluate('()=>__v398.init()')
  page.evaluate('()=>{__v398.S.view="order";__v398.renderShell();__v398.App.v354OpenSheet("title")}')
  print('TITLE
'+page.evaluate('()=>{let x=document.querySelector(".mf359-title-sheet .mf356-browse-card");return x? [...x.children].map(e=>e.tagName+" "+e.className+" "+e.id+" -> "+[...e.children].map(c=>c.className+"#"+c.id).join(", ")).join("\n") : "MISSING"}'))
  page.evaluate('()=>{__v398.App.v354CloseSheet();__v398.App.v354OpenSheet("collection")}')
  print('COLLECTION
'+page.evaluate('()=>{let x=document.querySelector(".mf359-collection-sheet .mf356-browse-card");return x? [...x.children].map(e=>e.tagName+" "+e.className+" "+e.id+" -> "+[...e.children].map(c=>c.className+"#"+c.id).join(", ")).join("\n") : "MISSING"}'))
  b.close()
finally:server.terminate();server.wait()
