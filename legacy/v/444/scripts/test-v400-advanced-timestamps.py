#!/usr/bin/env python3
"""Focused offline browser contract checks for v394. No authenticated Supabase."""
from pathlib import Path
import re,subprocess,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
raw=(ROOT/'test-v350-responsive.html').read_text()
index=(ROOT/'index.html').read_text()
styles='\n'.join((ROOT/p).read_text() for p in re.findall(r'href="(assets/css/[^"]+)"',index) if (ROOT/p).exists())
html=re.sub(r'<link[^>]+>','',raw).replace('</head>','<style>'+styles+'</style><base href="http://127.0.0.1:8784/"></head>')
js=(ROOT/'assets/js/mediaflow-v400.bundle.js').read_text().rstrip()
assert js.endswith('})();')
js=js[:-5]+'''\nwindow.__v394={S,App,NAV_ITEMS, v369TotalSeconds,renderLogForm, v394TitlePanelHtml:v370TitlePanelHtml, Sdata:()=>S.logDraft, init:()=>{
 V115_STARTUP_GUARD=false; AUTH_USER={id:'v394-test',email:'test@mediaflow.local'};
 S.view='collections';S.logging=true;S.modal=null;S.sessionActive=true;
 S.categories=[{id:'anime',name:'Anime',type:'video',unit:'episodes',target:2,weight:3,minutesPerUnit:24,color:'#55aadd',enabled:true},{id:'manga',name:'Manga',unit:'chapters',minutesPerUnit:0,color:'#aabbcc',enabled:true}];
 S.library=[{id:'a',title:'Anime Test',createdAt:1000,categoryId:'anime',status:'active',priority:'medium',progress:10,total:25},{id:'b',title:'Manga Test',createdAt:2000,categoryId:'manga',status:'active',priority:'medium',progress:20,total:100}];
 S.sessions=[];S.activityLog=[];S.settings=S.settings||{};S.entryDraft={title:''};S.currentTask={categoryId:'anime',id:'task-test'};
 S.logDraft={entries:[{title:'Anime Test',libraryId:'a',qty:0,loggedAt:Date.now()-60000,v369Units:[],v179StartProgress:10,v179EndProgress:10,v369SelectedSeasonId:''},{title:'Manga Test',libraryId:'b',qty:0,loggedAt:Date.now()-120000,v369Units:[],v179StartProgress:20,v179EndProgress:20,v369SelectedSeasonId:''}],v369Interface:'itemized',v369CommitId:'test-draft',categoryId:'anime'};
 S.orderPlan={};S.orderPlannerUI={};S.collectionTombstones=[];S.librarySelection={};S.collections=[];
 document.body.insertAdjacentHTML('beforeend','<section id="v394-test"></section>');
 document.getElementById('v394-test').innerHTML=renderLogForm(S.currentTask,S.categories[0]);
 },paint:(i)=>document.querySelector('.v370-panels [data-v369-title="'+i+'"]')?.outerHTML,
 audit:()=>({entries:S.logDraft.entries.map(e=>({method:e.v394Method,qty:e.qty,units:e.v369Units?.map(u=>({id:u.id,number:u.number,loggedAt:u.loggedAt,durationSeconds:u.durationSeconds,seasonId:u.seasonId})),runtime:e.v394RuntimeSeconds,runtimeManual:e.v394RuntimeManual})),navigation:NAV_ITEMS.map(x=>x.id),total:v369TotalSeconds()})};})();'''

server=subprocess.Popen(['python','-m','http.server','8784','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 time.sleep(.4)
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  for width in [390,1280]:
   page=browser.new_page(viewport={'width':width,'height':850});errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.on('dialog',lambda d:d.accept())
   page.set_content(html)
   page.evaluate("()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}})}")
   page.add_script_tag(content=js)
   page.evaluate('()=>__v394.init()')
   title_stamp=page.evaluate('()=>__v394.S.logDraft.entries[0].loggedAt')
   base=page.evaluate('()=>Date.now()')
   stamps=[]
   for seconds in [5,12,25]:
    now=base+seconds*1000
    page.evaluate('(stamp)=>{const old=Date.now;Date.now=()=>stamp;__v394.App.v369AddUnit(0);Date.now=old}',now)
    stamps.append(now)
   before=page.evaluate('()=>__v394.audit()')['entries'][0]['units']
   assert [u['loggedAt'] for u in before]==stamps,(width,'unit time must equal individual Add clicks',before,stamps)
   assert title_stamp not in stamps,(width,'title-added stamp reused')
   # User edit of an individual Per Unit entry must be isolated from all others.
   edit_time='2026-10-11T13:30:00'
   page.evaluate('(v)=>__v394.App.v369EditUnit(0,1,"time",v)',edit_time)
   edited=page.evaluate('()=>__v394.audit()')['entries'][0]['units']
   assert edited[0]['loggedAt']==stamps[0] and edited[2]['loggedAt']==stamps[2],(width,'editing one unit modified others')
   changed=edited[1]['loggedAt'];assert changed!=stamps[1]
   # Every bulk mode defaults to title-added, not the first Per Unit entry.
   for mode in ['amount','last']:
    page.evaluate('(m)=>__v394.App.v394Switch(0,m)',mode)
    value=page.locator('.v370-title').first.locator('.mf394-bulk input[type=datetime-local]').input_value()
    assert value==page.evaluate('(v)=>{const d=new Date(v),pad=x=>String(x).padStart(2,"0");return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())+"T"+pad(d.getHours())+":"+pad(d.getMinutes())+":"+pad(d.getSeconds())}',title_stamp),(width,'bulk initial stamp',mode,value,title_stamp)
   page.evaluate("()=>__v394.App.v394Switch(0,'amount')")
   page.evaluate("()=>__v394.App.v394SetWhen(0,'2026-10-11T18:30:00')")
   post_edit=page.evaluate('()=>__v394.audit()')['entries'][0]['units']
   assert post_edit==edited,(width,'bulk edited individual timestamps',post_edit,edited)
   page.evaluate("()=>__v394.App.v394Switch(0,'last')")
   assert page.evaluate('()=>__v394.S.logDraft.entries[0].v400AmountWhen')!=title_stamp
   # Last Watched has an independent user-edited bulk timestamp.
   page.evaluate("()=>__v394.App.v394SetWhen(0,'2026-10-11T20:15:00')")
   page.evaluate("()=>__v394.App.v394Switch(0,'amount')")
   assert '18:30' in page.locator('.v370-title').first.locator('.mf394-bulk input[type=datetime-local]').input_value()
   page.evaluate("()=>__v394.App.v394Switch(0,'last')")
   assert '20:15' in page.locator('.v370-title').first.locator('.mf394-bulk input[type=datetime-local]').input_value()
   page.evaluate("()=>__v394.App.v394Switch(0,'unit')")
   assert page.evaluate('()=>__v394.audit()')['entries'][0]['units']==edited,(width,'method switch mutated original entries')
   # A new episode added after bulk editing gets a NEW timestamp.
   newstamp=base+48000
   page.evaluate('(stamp)=>{const old=Date.now;Date.now=()=>stamp;__v394.App.v369AddUnit(0);Date.now=old}',newstamp)
   stamps4=page.evaluate('()=>__v394.audit()')['entries'][0]['units']
   assert [u['loggedAt'] for u in stamps4]==[edited[0]['loggedAt'],changed,edited[2]['loggedAt'],newstamp],(width,'new unit contaminated by bulk time',stamps4)
   page.evaluate('()=>__v394.App.v369RemoveUnit(0,1)')
   assert [u['loggedAt'] for u in page.evaluate('()=>__v394.audit()')['entries'][0]['units']]==[stamps[0],stamps[2],newstamp]
   assert not errors,(width,'JS errors',errors[:6])
   print('PASS',width,'independent Per Unit creation/edit dates, bulk defaults/overrides, tab switches and unit removal')
   page.close()
  browser.close()
finally:
 server.terminate();server.wait(timeout=5)
