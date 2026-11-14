"""Local compiled-app browser contracts. Synthetic data only; no real cloud or API."""
from pathlib import Path
import re
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
raw=(R/'test-v350-responsive.html').read_text()
css='\n'.join((R/p).read_text() for p in re.findall(r'href="(assets/css/[^\"]+)"',(R/'index.html').read_text()))
html=re.sub(r'<link[^>]+>','',raw).replace('</head>','<style>'+css+'</style></head>')
js=(R/'assets/js/mediaflow-v378.bundle.js').read_text().rstrip()
assert js.endswith('})();')
js=js[:-5]+'''
window.__v378={S,App,renderLogForm,renderLogSuggestions,v224LogSuggestionsHtml,v378ExtractIds,v378NormalizeId,v158NormalizeExternalIds,v158ApplyNormalizedRecord,v158NormalizeRecord,v158ImportIndex,renderOrder,v288EnsureQueueView,v287Queue,v138AllTitlesHtml,v378Collapsed,V378_LOG_UI};})();'''
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in [390,1280]:
  page=browser.new_page(viewport={'width':width,'height':900});errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html)
  page.evaluate("()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}")
  page.add_script_tag(content=js)
  page.evaluate('''()=>{
    const {S}=window.__v378;
    S.settings=S.settings||{}; S.sessions=[]; S.history=[];
    S.categories=[{id:'anime',name:'Anime',status:'active',icon:'🌸',unit:'episodes',type:'video',minutesPerUnit:24},{id:'manga',name:'Manga',icon:'📖',unit:'chapters',type:'reading'}];
    S.library=Array.from({length:30},(_,i)=>({id:'l'+i,title:'Example Anime '+i,categoryId:'anime',status:'active',priority:'medium',progress:3,total:12,createdAt:Date.now()}));
    S.logging=true; S.currentTask={categoryId:'anime',targetMid:2,targetMin:1,targetMax:3};
    S.logDraft={entries:[],amount:0,minutes:0,updateLibrary:true,v369Interface:'itemized',v179Mode:'amount',v369CommitId:'abcd'};
    S.entryDraft={title:'',libraryId:null,qty:1};
    document.querySelector('#app').innerHTML='<div class="main"><div class="container"><div id="view-root"></div><div id="modal-root"></div></div></div>';
  }''')
  results=page.evaluate('''()=>{
   const d=window.__v378;
   return {mal:d.v378NormalizeId('mal','https://myanimelist.net/anime/5114/FMA'),badMal:d.v378NormalizeId('mal','bad'),imdb:d.v378NormalizeId('imdb','https://www.imdb.com/title/tt0944947/'),nested:d.v378ExtractIds({show:{ids:{mal:5114,simkl:333}},title:'A'}),normalized:d.v158NormalizeExternalIds({ids:{mal:'https://myanimelist.net/anime/5114/',imdb:'tt0944947'}})};
  }''')
  assert results['mal']=='5114' and not results['badMal'] and results['imdb']=='tt0944947',results
  assert results['nested']['mal']=='5114' and results['nested']['simkl']=='333',results
  assert results['normalized']['mal']=='5114',results
  page.evaluate('''()=>{document.querySelector('#view-root').innerHTML=window.__v378.renderLogForm(window.__v378.S.currentTask,window.__v378.S.categories[0]);const details=document.querySelector('[data-v238-log-library]');if(details){details.open=true;window.__v378.App.v238ToggleLogLibrary(details)}window.__v378.renderLogSuggestions();}''')
  assert page.locator('.mf378-library-actions').count()==1,(width,'picker tools missing',errors)
  assert page.locator('.mf378-picker .mf378-add-btn').count()>=1,(width,'add title controls missing',errors)
  page.evaluate("()=>window.__v378.App.v378SelectVisible()")
  assert page.evaluate('window.__v378.V378_LOG_UI.selected.size')==20,(width,'select visible wrong')
  page.evaluate('''()=>{window.__v378.App.v378BulkAdd();document.querySelector('#view-root').innerHTML=window.__v378.renderLogForm(window.__v378.S.currentTask,window.__v378.S.categories[0]);const details=document.querySelector('[data-v238-log-library]');if(details){details.open=true;window.__v378.App.v238ToggleLogLibrary(details)}window.__v378.renderLogSuggestions();}''')
  assert page.evaluate('window.__v378.S.logDraft.entries.length')==20,(width,'bulk add not 20')
  assert page.evaluate('window.__v378.S.logDraft.entries.every(e=>e.qty===0&&e.v369Units.length===0)'),(width,'unit placeholder consumed data')
  page.evaluate('''()=>window.__v378.App.v378CollapseAll(true)''')
  assert page.evaluate('window.__v378.S.logDraft.v378CollapsedIds.length')==20,(width,'collapse all draft state')
  page.evaluate('''()=>{window.__v378.S.logDraft.v369Interface='quick';window.__v378.S.logDraft.entries=[];window.__v378.S.settings.v179LoggingModes={single:'amount',batch:'amount',modifiedAt:0};window.__v378.App.v378QuickAdd('l0',{quiet:true,defer:true});document.querySelector('#view-root').innerHTML=window.__v378.renderLogForm(window.__v378.S.currentTask,window.__v378.S.categories[0]);const details=document.querySelector('[data-v238-log-library]');if(details){details.open=true;window.__v378.App.v238ToggleLogLibrary(details)}window.__v378.renderLogSuggestions();}''')
  assert page.locator('.mf378-quick-amount input').count()>0,(width,'quick amount editor missing',errors)
  assert page.evaluate('window.__v378.S.logDraft.entries[0].qty')==0
  page.evaluate('''()=>window.__v378.App.v378QuickQuantity(0,3)''')
  assert page.evaluate('window.__v378.S.logDraft.entries[0].qty')==3
  assert not errors,(width,'browser errors',errors[:4])
  print('PASS',width,'ID normalization, logging picker modes/tools, selection, itemized bulk add, collapse, Quick draft editing',flush=True)
  page.close()
 browser.close()
