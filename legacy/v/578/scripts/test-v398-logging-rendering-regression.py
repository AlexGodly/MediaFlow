#!/usr/bin/env python3
"""Focused offline browser contract checks for v394. No authenticated Supabase."""
from pathlib import Path
import re,subprocess,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
raw=(ROOT/'test-v350-responsive.html').read_text()
index=(ROOT/'index.html').read_text()
styles='\n'.join((ROOT/p).read_text() for p in re.findall(r'href="(assets/css/[^"]+)"',index) if (ROOT/p).exists())
html=re.sub(r'<link[^>]+>','',raw).replace('</head>','<style>'+styles+'</style><base href="http://127.0.0.1:8796/"></head>')
js=(ROOT/'assets/js/mediaflow-v398.bundle.js').read_text().rstrip()
assert js.endswith('})();')
js=js[:-5]+'''\nwindow.__v394={S,App,NAV_ITEMS, v369TotalSeconds,renderLogForm, v394TitlePanelHtml:v370TitlePanelHtml, Sdata:()=>S.logDraft, init:()=>{
 V115_STARTUP_GUARD=false; AUTH_USER={id:'v396-test',email:'test@mediaflow.local'};
 S.view='collections';S.logging=true;S.modal=null;S.sessionActive=true;
 S.categories=[{id:'anime',name:'Anime',type:'video',unit:'episodes',target:2,weight:3,minutesPerUnit:24,color:'#55aadd',enabled:true},{id:'manga',name:'Manga',unit:'chapters',minutesPerUnit:0,color:'#aabbcc',enabled:true}];
 S.library=[{id:'a',title:'Anime Test',createdAt:1000,categoryId:'anime',status:'active',priority:'medium',progress:10,total:25},{id:'b',title:'Manga Test',createdAt:2000,categoryId:'manga',status:'active',priority:'medium',progress:20,total:100}];
 S.sessions=[];S.activityLog=[];S.settings=S.settings||{};S.entryDraft={title:''};S.currentTask={categoryId:'anime',id:'task-test'};
 S.logDraft={entries:[{title:'Anime Test',libraryId:'a',qty:0,loggedAt:Date.now()-60000,v369Units:[],v179StartProgress:10,v179EndProgress:10,v369SelectedSeasonId:''},{title:'Manga Test',libraryId:'b',qty:0,loggedAt:Date.now()-120000,v369Units:[],v179StartProgress:20,v179EndProgress:20,v369SelectedSeasonId:''}],v369Interface:'itemized',v369CommitId:'test-draft',categoryId:'anime'};
 S.orderPlan={};S.orderPlannerUI={};S.collectionTombstones=[];S.librarySelection={};S.collections=[];
 document.body.insertAdjacentHTML('beforeend','<section id="v396-test"></section>');
 document.getElementById('v396-test').innerHTML=renderLogForm(S.currentTask,S.categories[0]);
 },paint:(i)=>document.querySelector('.v370-panels [data-v369-title="'+i+'"]')?.outerHTML,
 audit:()=>({entries:S.logDraft.entries.map(e=>({method:e.v394Method,qty:e.qty,units:e.v369Units?.map(u=>({id:u.id,number:u.number,loggedAt:u.loggedAt,durationSeconds:u.durationSeconds,seasonId:u.seasonId})),runtime:e.v394RuntimeSeconds,runtimeManual:e.v394RuntimeManual})),navigation:NAV_ITEMS.map(x=>x.id),total:v369TotalSeconds()})};})();'''
server=subprocess.Popen(['python','-m','http.server','8796','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 time.sleep(.5)
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  for width in (320,390,820,1280,1920):
   page=browser.new_page(viewport={'width':width,'height':820});errors=[]
   page.on('pageerror',lambda e: errors.append(str(e)))
   page.set_content(html)
   page.evaluate('''()=>{const storage=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)}})}''')
   page.add_script_tag(content=js)
   page.evaluate('()=>__v394.init()')
   init=page.evaluate('()=>({html:__v394.paint(0),audit:__v394.audit()})')
   # v396: Actual visible DOM contract, not only the calculation helper.
   assert page.locator('.v370-title').count()==2,(width,'expected two title cards')
   assert page.locator('.mf395-progress-preview').count()==2,(width,'progress panel missing entirely')
   assert page.locator('.mf395-progress-stack').count()==2,(width,'merged progress bar missing')
   assert page.locator('.mf373-row-controls').count()==2,(width,'ordering tools missing initially')
   assert page.locator('.mf373-drag-handle').count()==2,(width,'drag handles missing')
   assert page.locator('.mf373-position-label input').count()==2,(width,'numeric positions missing')
   assert page.locator('.mf373-move-up').count()==2,(width,'up arrows missing')
   assert page.locator('.mf373-move-down').count()==2,(width,'down arrows missing')
   assert page.locator('.v370-title').first.locator('.mf395-progress-stack').is_visible(),(width,'progress bar hidden on card')
   page.evaluate('()=>__v394.App.v369ToggleTitle(0)')
   assert page.locator('.v370-title').first.locator('.mf395-progress-stack').is_visible(),(width,'preview missing when collapsed')
   assert page.locator('.mf373-row-controls').count()==2,(width,'order controls missing when collapsed')
   page.evaluate('()=>__v394.App.v369ToggleTitle(0)')
   assert page.locator('.mf395-progress-preview').count()==2,(width,'preview missing when expanded')
   page.evaluate("()=>__v394.App.v394Switch(0,'amount')")
   assert page.locator('.mf373-row-controls').count()==2,(width,'ordering disappears on method change')
   assert page.locator('.mf395-progress-preview').count()==2,(width,'progress disappears on method change')
   page.evaluate("()=>__v394.App.v394SetQuantity(0,'4')")
   assert page.locator('.mf373-row-controls').count()==2,(width,'ordering disappears on quantity edit')
   assert '14' in page.locator('.v370-title').first.locator('.mf395-progress-preview').inner_text(),(width,'merged projection stale')
   page.evaluate("()=>__v394.App.v394Switch(0,'unit')")
   assert page.locator('.mf373-row-controls').count()==2,(width,'ordering disappears switching to Per Unit')
   # Simulate user adding the next title then complete form re-render.
   page.evaluate("""()=>{__v394.S.library.push({id:'c',title:'Newest Test',categoryId:'anime',progress:2,total:12,status:'active',priority:'medium'});__v394.S.logDraft.entries.push({title:'Newest Test',libraryId:'c',loggedAt:Date.now(),v369Units:[],v369SelectedSeasonId:''});document.getElementById('v396-test').innerHTML=__v394.renderLogForm(__v394.S.currentTask,__v394.S.categories[0]);}""")
   assert page.locator('.v370-title').count()==3,(width,'newest title missing')
   assert page.locator('.mf373-row-controls').count()==3,(width,'newest title ordering controls missing')
   assert page.locator('.mf395-progress-preview').count()==3,(width,'newest title progress missing')
   assert page.locator('.v370-title').last.locator('.mf373-position-label input').input_value()=='3',(width,'new title number not initialized')
   page.evaluate("()=>__v394.App.v394Switch(2,'last')")
   assert page.locator('.mf373-row-controls').count()==3,(width,'newest order tools lost after toggle')
   assert page.locator('.mf395-progress-preview').count()==3,(width,'newest preview lost after toggle')
   # Real ordering actions must remain live, not just decorative icons.
   page.locator('.v370-title[data-mf373-entry="2"] .mf373-move-up').click()
   order=page.locator('.v370-panels > .v370-title').evaluate_all('(rows)=>rows.map(el=>Number(el.dataset.mf373Entry))')
   assert order==[0,2,1],(width,'up arrow does not reorder',order)
   page.locator('.v370-title[data-mf373-entry="2"] .mf373-position-label input').fill('1')
   page.locator('.v370-title[data-mf373-entry="2"] .mf373-position-label input').dispatch_event('change')
   order=page.locator('.v370-panels > .v370-title').evaluate_all('(rows)=>rows.map(el=>Number(el.dataset.mf373Entry))')
   assert order==[2,0,1],(width,'numeric position did not reorder',order)
   assert page.locator('.mf373-row-controls').count()==3,(width,'controls duplicated/lost after reorder')
   # Unknown totals must display valid text and no made-up completion percent.
   page.evaluate("""()=>{__v394.S.library.find(x=>x.id==='c').total=null;document.getElementById('v396-test').innerHTML=__v394.renderLogForm(__v394.S.currentTask,__v394.S.categories[0]);}""")
   preview=page.locator('.v370-title[data-mf373-entry="2"] .mf395-progress-preview')
   assert 'Total unknown' in preview.inner_text(),(width,'unknown-total handling')
   assert preview.locator('.mf395-progress-stack').count()==1 and preview.locator('[role=progressbar]').count()==0,(width,'invented percentage')
   assert page.locator('.mf373-row-controls').count()==3,(width,'ordering lost on unknown-total refresh')
   # Return to original two-title fixture for the original v394 contract tests.
   page.evaluate("""()=>{__v394.S.logDraft.entries.pop();__v394.S.logDraft.entries[0].v369Units=[];__v394.S.logDraft.entries[0].v394Method='unit';document.getElementById('v396-test').innerHTML=__v394.renderLogForm(__v394.S.currentTask,__v394.S.categories[0]);}""")

   assert init['html'] and 'mf394-tabs' in init['html'],(width,'missing method tabs',str(init)[:500])
   assert 'batch' not in init['audit']['navigation'],(width,'Batch nav remains')
   assert page.locator('.v370-mode-switch').first.inner_text().find('Advanced Logging')>=0,(width,'mode label')
   # Existing per-unit UI must be present in the DEFAULT method.
   assert page.locator('.v370-title').first.locator('.v370-add-row').is_visible(),(width,'default per unit hidden')
   # Title addition timestamp is canonical for all newly logged individual units.
   page.evaluate('''()=>{__v394.App.v369AddUnit(0);__v394.App.v369AddUnit(0);__v394.App.v369AddUnit(0);__v394.App.v369AddUnit(0)}''')
   state=page.evaluate('()=>__v394.audit()')
   assert [u['number'] for u in state['entries'][0]['units']]==[11,12,13,14],(width,'per-unit numbers',state)
   stamp=page.evaluate('()=>__v394.S.logDraft.entries[0].loggedAt')
   assert all(x['loggedAt']==stamp for x in state['entries'][0]['units']),(width,'per-unit timestamp should be draft added time')
   page.evaluate("()=>__v394.App.v394Switch(0,'amount')")
   assert page.locator('.v370-title').first.locator('.mf394-bulk').is_visible(),(width,'amount controls missing')
   assert page.locator('.v370-title').first.locator('.mf394-bulk input[type=number]').input_value()=='4',(width,'amount not synced')
   page.evaluate("()=>__v394.App.v394Switch(0,'last')")
   assert page.locator('.v370-title').first.locator('.mf394-bulk input[type=number]').input_value()=='14',(width,'last watched not synced')
   page.evaluate("()=>__v394.App.v394SetQuantity(0,'16')")
   assert [u['number'] for u in page.evaluate('()=>__v394.audit()')['entries'][0]['units']]==[11,12,13,14,15,16],(width,'last->per conversion')
   page.evaluate("()=>__v394.App.v394Switch(0,'amount')")
   assert page.locator('.v370-title').first.locator('.mf394-bulk input[type=number]').input_value()=='6',(width,'amount after last change')
   page.evaluate("()=>__v394.App.v394SetQuantity(0,'3')")
   assert [u['number'] for u in page.evaluate('()=>__v394.audit()')['entries'][0]['units']]==[11,12,13],(width,'amount->per conversion')
   # Runtime only applied to canonical units on SUBMIT (not method switch).
   previous=page.evaluate('()=>__v394.audit()')['entries'][0]['units']
   page.evaluate('()=>__v394.App.v394ToggleRuntime(0,true)')
   page.evaluate("()=>__v394.App.v394SetRuntime(0,'02:00:01')")
   audit=page.evaluate('()=>__v394.audit()')
   assert audit['entries'][0]['runtimeManual'] and audit['entries'][0]['runtime']==7201,(width,'runtime manual')
   assert audit['entries'][0]['units']==previous,(width,'runtime override destroyed original units')
   assert audit['total']==7201,(width,'runtime not reflected in totals')
   # custom when watched applies only to corresponding title; other title unaffected.
   page.evaluate("()=>__v394.App.v394SetWhen(0,'2026-10-11T18:30:00')")
   newstamp=page.evaluate('()=>new Date("2026-10-11T18:30:00").getTime()')
   assert all(u['loggedAt']==newstamp for u in page.evaluate('()=>__v394.audit()')['entries'][0]['units']),(width,'custom watched time')
   # Switching tabs preserves unit identities, when & total runtime.
   before=page.evaluate('()=>__v394.audit()')
   page.evaluate("()=>__v394.App.v394Switch(0,'unit')")
   page.evaluate("()=>__v394.App.v394Switch(0,'last')")
   after=page.evaluate('()=>__v394.audit()')
   assert before['entries'][0]['units']==after['entries'][0]['units'] and after['entries'][0]['runtimeManual'],(width,'method switch mutated canonical units')
   assert page.locator('.v370-title').nth(1).locator('.mf394-tabs').is_visible(),(width,'missing independent second-title tabs')
   page.evaluate("()=>__v394.App.v394Switch(1,'amount')")
   assert page.locator('.v370-title').nth(1).locator('.mf394-bulk').inner_text().find('Chapter')>=0,(width,'category-aware chapter label')
   assert page.evaluate('()=>__v394.audit()')['entries'][0]['method']=='last',(width,'title modes shared unexpectedly')
   assert page.evaluate('()=>__v394.S.sessions.length')==0,(width,'changing tabs committed sessions')
   # Quick Logging still uses the original v373 toolbar for every title.
   page.evaluate("""()=>{__v394.S.logDraft.v369Interface='quick';__v394.S.logDraft.entries.forEach(e=>{e.qty=Math.max(1,e.qty||1);});document.getElementById('v396-test').innerHTML=__v394.renderLogForm(__v394.S.currentTask,__v394.S.categories[0]);}""")
   assert page.locator('.v239-logged-title-card').count()==2,(width,'Quick Logging title cards missing')
   assert page.locator('.v239-logged-title-card .mf373-row-controls').count()==2,(width,'Quick Logging ordering missing')
   assert not errors,(width,'page errors',errors[:5])
   print('PASS',width,'Advanced Logging tabs; 4->6->3 conversion; timestamps; runtime; independent methods; Batch Log nav removed',flush=True)
   page.close()
  browser.close()
finally:
 server.terminate();server.wait(timeout=5)
