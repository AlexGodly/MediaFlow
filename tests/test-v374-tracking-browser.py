#!/usr/bin/env python3
from pathlib import Path
from playwright.sync_api import sync_playwright
import re, shutil, json
R=Path(__file__).resolve().parents[1]
source=(R/'assets/js/mediaflow-v374.bundle.js').read_text()
assert source.endswith('})();\n')
source=source[:-6]+'''window.__v374test={S,App,V374_SESSION,v374TrackingHtml,v374CardRows,v374SettingsSection,libraryModalHtml,v181TitleDetailsHtml,v374Refresh};
render=function(){};renderView=function(){};persistLibrary=function(){};persistSettings=function(){};
AUTH_USER={id:'00000000-0000-0000-0000-000000000001',email:'test@example.com'};
supabase={functions:{invoke:async (_name,{body})=>{
 const T=window.__v374test;
 if(body.action==='accounts')return {data:{accounts:[{provider:'mal'},{provider:'simkl'}],links:T.V374_SESSION.links},error:null};
 if(body.action==='search')return {data:{results:[{id:'16498',title:'Shingeki no Kyojin',type:body.type,year:'2013',cover:'',count:25}]},error:null};
 if(body.action==='assign') {T.V374_SESSION.links.push({id:'assign-1',library_id:body.libraryId,season_id:body.seasonId,provider:body.provider,remote_id:body.remoteId,remote_type:body.remoteType,remote_title:body.remoteTitle,enabled:false,sync_progress:true,sync_status:false,sync_rating:false});return {data:{linked:true},error:null};}
 if(body.action==='options'){const l=T.V374_SESSION.links.find(x=>x.id===body.linkId);if(l)l.enabled=body.enabled;return {data:{updated:true},error:null};}
 return {data:{processed:0},error:null};
}}};
})();\n'''
html=(R/'index.html').read_text()
css='\n'.join((R/m).read_text() for m in re.findall(r'<link[^>]*href="([^"]+\.css)"',html) if (R/m).exists())
assert shutil.which('chromium')
report=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=shutil.which('chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in (320,390,820,1280):
  page=browser.new_page(viewport={'width':width,'height':920})
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content('<html><head></head><body><div id="app" style="display:none"></div><div id="view-root"></div><main id="test-mount"></main></body></html>')
  page.add_style_tag(content=css)
  page.evaluate("""() => {Object.defineProperty(window,'localStorage',{value:{getItem(){return null},setItem(){},removeItem(){},clear(){}}});Object.defineProperty(window,'sessionStorage',{value:{getItem(){return null},setItem(){},removeItem(){},clear(){}}});}""")
  page.add_script_tag(content=source)
  page.evaluate('''() => {
    const t=window.__v374test;
    t.S.settings=t.S.settings||{};
    t.S.categories=[{id:'anime',name:'Anime',unit:'episodes',icon:'🎬'}];
    t.S.library=[{id:'title-001',title:"Attack on Titan's Beginning",categoryId:'anime',progress:5,total:25,status:'active',priority:'medium',createdAt:Date.now(),seasons:[{id:'s1',name:'Season 1',progress:3,total:12}]}];
    t.V374_SESSION.accounts=[{provider:'mal'},{provider:'simkl'}];t.V374_SESSION.links=[];t.V374_SESSION.loaded=true;t.V374_SESSION.stamp=Date.now();
    document.getElementById('test-mount').innerHTML=t.v374TrackingHtml(t.S.library[0],false);
  }''')
  assert page.locator('.mf374-service').count()==2,(width,'two provider cards')
  page.locator('.mf374-service').first.get_by_role('button',name='Assign title').click()
  page.wait_for_timeout(90)
  assert page.locator('.mf374-result').count()==1,(width,'title search')
  page.locator('.mf374-result').first.click()
  assert page.get_by_role('button',name='Confirm & keep both unchanged').count()==1
  page.get_by_role('button',name='Confirm & keep both unchanged').click()
  page.wait_for_timeout(110)
  assert page.locator('.mf374-service').first.get_by_text('Paused').count()==1
  page.locator('.mf374-service').first.get_by_role('button',name='Enable / Settings').click()
  assert page.locator('#mf374-enabled').count()==1
  page.locator('#mf374-enabled').check()
  page.get_by_role('button',name='Save tracking preferences').click()
  page.wait_for_timeout(110)
  assert page.locator('.mf374-service').first.get_by_text('Auto tracking').count()==1
  extra=page.evaluate('''() => {
   const t=window.__v374test;
   const edit=new DOMParser().parseFromString(t.libraryModalHtml(t.S.library[0]),'text/html');
   const add=new DOMParser().parseFromString(t.libraryModalHtml({categoryId:'anime'}),'text/html');
   const details=new DOMParser().parseFromString(t.v181TitleDetailsHtml(t.S.library[0]),'text/html');
   const section=new DOMParser().parseFromString(t.v374SettingsSection(),'text/html');
   return {edit:edit.querySelectorAll('[data-v374-tracking]').length,add:add.querySelectorAll('[data-v374-tracking]').length,details:details.querySelectorAll('.v181-title-details-body [data-v374-tracking]').length,settings:!!section.querySelector('#mf374-accounts-content'),overflow:document.documentElement.scrollWidth-innerWidth};
  }''')
  assert extra['edit']==1 and extra['add']==1 and extra['details']==1 and extra['settings'],(width,extra)
  assert extra['overflow']<=2,(width,'horizontal overflow',extra)
  assert not errors,(width,errors)
  if width==390:page.screenshot(path=str(R/'tests/v374-tracking-mobile-390.png'),full_page=True)
  report.append({'viewport':width,'connections':2,'linked':1,'popup':'passed','overflow':extra['overflow']})
  page.close()
 browser.close()
print('PASS v374 mocked browser flow',json.dumps(report))
