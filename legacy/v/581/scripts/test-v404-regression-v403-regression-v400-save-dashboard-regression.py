"""v388 guarded save/re-render and dashboard-return regression in real compiled app.
Synthetic state, no live account; no remote calls or writes.
"""
from pathlib import Path
import subprocess,time,re
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
raw=(R/'test-v350-responsive.html').read_text()
index=(R/'index.html').read_text()
css='\n'.join((R/p).read_text() for p in re.findall(r'href="(assets/css/[^\"]+)"',index) if (R/p).exists())
html=re.sub(r'<link[^>]+>', '', raw).replace('</head>', '<style>'+css+'</style><base href="http://127.0.0.1:8788/"></head>')
js=(R/'assets/js/mediaflow-v404.bundle.js').read_text().rstrip()
assert js.endswith('})();')
js=js[:-5]+'''\n
window.__v388={S,App,initTest:()=>{
  V115_STARTUP_GUARD=false;AUTH_USER={id:'v388-test',email:'testing@mediaflow.local'};
  S.view='dashboard';S.logging=false;S.modal=null;S.sessionActive=true;
  S.categories=[{id:'anime',name:'Anime',type:'video',unit:'episodes',target:2,weight:3,minutesPerUnit:24,color:'#55aadd',enabled:true}];
  S.library=[];S.sessions=[];S.activityLog=[];S.orderPlan={};S.completionTimeline=[];
  S.currentTask={categoryId:'anime',targetMid:2,targetLow:1,targetHigh:3,title:'Test title',reasons:[]};
  S.settings=S.settings||{};S.settings.exactTitleRecommendations=false;
  S.xpLedger={libraryAdditions:{},libraryEdits:{},manualCovers:{},logCompletions:{}};
  const tbase=showToast;showToast=function(msg){window.__v388Toast=String(msg);return tbase.apply(this,arguments);};
  window.__v388SaveCallStacks=[]; const sbase=saveState;saveState=function(){window.__v388SaveCallStacks.push(new Error().stack);return sbase.apply(this,arguments);};
  window.__v388Saves=0;window.__v388SaveStacks=[];rawSet=async()=>{window.__v388Saves++;window.__v388SaveStacks.push(new Error().stack);return true;};
  renderShell();
}, audit:()=>({saves:window.__v388Saves,view:S.view,logging:S.logging,modal:S.modal?.type||null,library:S.library.length,history:S.sessions.length,commits:App.v388ActionAudit().commits}),
renderDashboard,renderShell,v369Sync
};})();'''
server=subprocess.Popen(['python','-m','http.server','8788','--bind','127.0.0.1'],cwd=R,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 time.sleep(.6)
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  for width in [390,1280,320,820,1920]:
   page=browser.new_page(viewport={'width':width,'height':720});page.set_default_timeout(8000)
   errors=[];page.on('pageerror',lambda x:errors.append(str(x)))
   page.set_content(html)
   page.evaluate('''()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}''')
   page.add_script_tag(content=js)
   page.evaluate('()=>__v388.initTest()')
   page.evaluate('()=>__v388.App.openLogForm()')
   page.evaluate('''()=>{const f=document.querySelector('.log-form');if(f)f.style.minHeight='2600px';window.scrollTo({top:1200,behavior:'instant'});const main=document.querySelector('.main');if(main)main.scrollTop=1000;}''')
   page.wait_for_timeout(50)
   # The close action should always show the new Dashboard at its beginning.
   page.evaluate('()=>__v388.App.cancelLogForm()')
   page.wait_for_timeout(120)
   out=page.evaluate('''()=>({scroll:window.scrollY,main:document.querySelector('.main')?.scrollTop||0,...__v388.audit()})''')
   assert not out['logging'] and out['scroll']==0 and out['main']==0,(width,'cancel return scroll',out)
   print('PASS',width,'Cancel Logging Dashboard scroll',flush=True)
   page.wait_for_timeout(720)  # settle unrelated debounced portable-state saves
   # Save & get next task must stay on dashboard, preserve records and give a next task.
   page.evaluate('()=>__v388.App.openLogForm()')
   page.evaluate("()=>{__v388.S.logDraft.v369Interface='quick';__v388.S.logDraft.amount=2;__v388.S.logDraft.minutes=48;}")
   page.evaluate('''()=>{const f=document.querySelector('.log-form');if(f)f.style.minHeight='2600px';window.scrollTo({top:1200,behavior:'instant'});}''')
   old=page.evaluate('()=>__v388.audit()')
   # let open-form's own resume save settle before counting this submit
   page.wait_for_timeout(720)
   page.evaluate('()=>__v388.App.submitLog()')
   page.wait_for_timeout(150)
   out=page.evaluate('''()=>({scroll:window.scrollY,main:document.querySelector('.main')?.scrollTop||0,...__v388.audit(),hasTask:!!__v388.S.currentTask,toast:window.__v388Toast})''')
   assert out['logging']==False and out['history']>old['history'] and out['scroll']==0 and out['main']==0 and out['hasTask'],(width,'submit',out,old)
   # The submit action performs multiple logical persists, but only one final cloud snapshot.
   assert out['saves']-old['saves']<=2,(width,'submit saves',old,out)
   print('PASS',width,'Save & Get Next Dashboard scroll and coalesced save',flush=True)
   # Also verify Per Unit submission, consecutive Library progress and Dashboard return.
   page.evaluate('''()=>{
     const x=__v388;
     x.S.library.push({id:'unit-'+Date.now(),title:'Per Unit Demo',categoryId:'anime',progress:0,total:12,status:'active',priority:'medium',createdAt:Date.now()});
     x.App.openLogForm();
     const item=x.S.library[x.S.library.length-1];
     x.S.logDraft.v369Interface='itemized';
     x.S.logDraft.entries=[{libraryId:item.id,title:item.title,qty:1,loggedAt:Date.now(),v369Units:[{id:'unit-'+Date.now(),number:1,seasonId:null,loggedAt:Date.now(),durationSeconds:1440,isRepeat:false}]}];
     x.v369Sync();
     window.scrollTo({top:900,behavior:'instant'});
   }''')
   old=page.evaluate('()=>__v388.audit()')
   page.evaluate('()=>__v388.App.submitLog()')
   page.wait_for_timeout(120)
   out=page.evaluate('''()=>({scroll:window.scrollY,...__v388.audit(),progress:__v388.S.library.at(-1).progress})''')
   assert not out['logging'] and out['history']>old['history'] and out['progress']==1 and out['scroll']==0,(width,'Per Unit save',out,old)
   print('PASS',width,'Per Unit Save & Get Next progress and Dashboard scroll',flush=True)
   # v394 real History submission with custom total runtime and last-watched draft.
   page.evaluate('''()=>{
     const x=__v388;
     x.S.library.push({id:'advanced-'+Date.now(),title:'Advanced Demo',categoryId:'anime',progress:3,total:20,status:'active',priority:'medium',createdAt:Date.now()});
     x.App.openLogForm();
     const item=x.S.library.at(-1),at=Date.now()-3600000;
     x.S.logDraft.v369Interface='itemized';
     x.S.logDraft.entries=[{libraryId:item.id,title:item.title,qty:0,loggedAt:at,v369Units:[4,5,6].map(number=>({id:'advanced-'+number,number,seasonId:null,loggedAt:at,durationSeconds:1440,isRepeat:false})),v394Method:'last',v400LastWhen:at-1800000,v394RuntimeManual:true,v394RuntimeSeconds:7201,v179StartProgress:3,v179EndProgress:6}];
     x.v369Sync();
   }''')
   page.evaluate('()=>__v388.App.submitLog()')
   page.wait_for_timeout(120)
   advancedOut=page.evaluate('''()=>({logged:__v388.S.logging,progress:__v388.S.library.at(-1).progress,entries:__v388.S.sessions.slice(-2).flatMap(s=>s.titles||[]).filter(t=>String(t.libraryId).startsWith('advanced-')).map(t=>({duration:t.v369DurationSeconds,total:(t.v369Units||[]).reduce((n,u)=>n+u.durationSeconds,0),count:t.v369Units?.length,stamps:(t.v369Units||[]).map(u=>u.loggedAt),titleStamp: t.loggedAt}))})''')
   assert not advancedOut['logged'] and advancedOut['progress']==6 and any(r['total']==7201 and r['count']==3 for r in advancedOut['entries']),(width,'Advanced custom runtime submission',advancedOut)
   # v400: submitted bulk method must write the selected bulk date into History's unit records.
   assert all(len(set(r['stamps']))==1 and r['stamps'][0] <= r['titleStamp'] for r in advancedOut['entries'] if r['stamps']),(width,'bulk History timestamps not materialized',advancedOut)
   print('PASS',width,'Advanced Last Watched submission with manual total runtime',flush=True)
   # Test real Add Title editor and Edit Title editor, including nested metadata wrappers.
   page.evaluate('()=>__v388.App.openLibraryModal()')
   assert page.locator('#l-title').count()==1,(width,'add modal missing')
   page.locator('#l-title').fill('v388 Test Anime')
   old=page.evaluate('()=>__v388.audit()')
   page.evaluate('()=>__v388.App.saveLibraryModal(\'\')')
   page.wait_for_timeout(100)
   out=page.evaluate('()=>__v388.audit()')
   assert out['library']==old['library']+1 and out['modal'] is None and out['saves']-old['saves']==1,(width,'add title',old,out)
   print('PASS',width,'Add Title closes and saves once',flush=True)
   page.evaluate('()=>__v388.App.openLibraryModal(__v388.S.library[0].id)')
   page.locator('#l-title').fill('v388 Test Anime Edited')
   old=page.evaluate('()=>__v388.audit()')
   page.evaluate('()=>__v388.App.saveLibraryModal(__v388.S.library[0].id)')
   page.wait_for_timeout(100)
   out=page.evaluate('()=>__v388.audit()')
   assert out['modal'] is None and out['saves']-old['saves']==1 and page.evaluate('()=>__v388.S.library[0].title')=='v388 Test Anime Edited',(width,'edit title',out)
   print('PASS',width,'Edit Title closes and saves once',flush=True)
   # A failed ID validation must NOT close the modal or enqueue a save.
   page.evaluate('()=>__v388.App.openLibraryModal(__v388.S.library[0].id)')
   fields=page.locator('[data-v377-id]')
   if fields.count():
    page.evaluate("()=>document.querySelector('[data-v377-id]').value='%%%INVALID%%%'")
    old=page.evaluate('()=>__v388.audit()')
    page.evaluate('()=>__v388.App.saveLibraryModal(__v388.S.library[0].id)')
    page.wait_for_timeout(75)
    out=page.evaluate('()=>__v388.audit()')
    assert out['modal']=='library' and out['saves']==old['saves'],(width,'validation must preserve form',out,old)
    print('PASS',width,'Invalid media ID preserves editor',flush=True)
   assert not errors,(width,'page errors',errors[:5])
   page.close()
  browser.close()
finally:
 server.terminate();server.wait()
