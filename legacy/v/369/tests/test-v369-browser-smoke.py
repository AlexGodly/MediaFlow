#!/usr/bin/env python3
"""Browser-level itemized logging and Category HH:MM:SS smoke; no Supabase writes."""
from pathlib import Path
import json, shutil
from playwright.sync_api import sync_playwright
ROOT = Path(__file__).resolve().parents[1]
VERSION = (ROOT/'VERSION').read_text().strip()
bundle = (ROOT/f'assets/js/mediaflow-v{VERSION}.bundle.js').read_text()
assert bundle.endswith('})();\n')
bundle = bundle[:-6]+'''window.__v369test={S,App,renderLogForm,categoryModalHtml};
render=function(){};renderView=function(){};
persistCategories=function(){return Promise.resolve()};persistLibrary=function(){};
persistSessions=function(){};persistTask=function(){};
})();\n'''
chrome = shutil.which('chromium') or shutil.which('google-chrome') or shutil.which('chromium-browser')
assert chrome, 'Chromium/Chrome not installed'
with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True, executable_path=chrome, args=['--no-sandbox','--disable-dev-shm-usage'])
    page = browser.new_page()
    page.set_content('<html><head></head><body><div id="view-root"></div><div id="modal-root"></div></body></html>')
    page.evaluate("""() => {
      Object.defineProperty(window,'localStorage',{value:{getItem(){return null},setItem(){},removeItem(){},clear(){}}});
      Object.defineProperty(window,'sessionStorage',{value:{getItem(){return null},setItem(){},removeItem(){},clear(){}}});
    }""")
    page.add_script_tag(content=bundle)
    result=page.evaluate('''() => {
      const {S,App,renderLogForm,categoryModalHtml}=window.__v369test;
      const category={id:'anime',name:'Anime',icon:'⭐',unit:'episodes',type:'video',target:2,weight:3,
        minutesPerUnit:24.25,secondsPerUnit:1455,enabled:true,color:'#FF5D9E'};
      S.settings=S.settings||{};S.settings.leveling=S.settings.leveling||{};
      S.categories=[category];
      S.library=[{id:'a',title:'Example Anime',categoryId:'anime',status:'active',priority:'medium',progress:11,total:24}];
      S.sessions=[];S.currentTask={categoryId:'anime',targetMid:1};S.sessionActive=true;S.logging=true;
      S.logDraft={v369Interface:'itemized',v369CommitId:'browser-smoke',categoryId:'anime',
        entries:[{title:'Example Anime',libraryId:'a',qty:0,v179StartProgress:11,v369Units:[]}],
        amount:0,minutes:0,note:'',updateLibrary:true};
      S.entryDraft={title:'',qty:1,libraryId:null};
      const markup=renderLogForm(S.currentTask,category);
      App.v369AddUnit(0);
      const unit=S.logDraft.entries[0].v369Units[0];
      const loggedAt=unit.loggedAt;
      App.v369EditUnit(0,0,'duration-2','7');
      const unitSeconds=S.logDraft.entries[0].v369Units[0].durationSeconds;
      const timestampUnchanged=S.logDraft.entries[0].v369Units[0].loggedAt===loggedAt;
      const editor=categoryModalHtml(category);
      document.body.insertAdjacentHTML('beforeend','<section id="category-fixture">'+editor+'</section>');
      const controls=!!document.getElementById('m-runtime-hours') && !!document.getElementById('m-runtime-minutes') && !!document.getElementById('m-runtime-seconds');
      if(controls){
        document.getElementById('m-runtime-hours').value='1';
        document.getElementById('m-runtime-minutes').value='1';
        document.getElementById('m-runtime-seconds').value='1';
        App.saveCategoryModal('anime');
      }
      return {version:window.MediaFlowV369?.version||0,markupPresent:markup.includes('v369-title'),
        loggedUnit:unit.number,originalDuration:1455,editedSeconds:unitSeconds,
        timestampUnchanged,controls,categorySeconds:S.categories[0].secondsPerUnit,
        categoryMinutes:S.categories[0].minutesPerUnit};
    }''')
    print(json.dumps(result,indent=2))
    assert result['version']==369
    assert result['markupPresent'] and result['loggedUnit']==12
    assert result['editedSeconds']==1447 and result['timestampUnchanged']
    assert result['controls'], 'Final category editor lacks HH:MM:SS fields'
    assert result['categorySeconds']==3661, 'Final category saver lost second-precision runtime'
    assert abs(result['categoryMinutes']-3661/60)<0.001
    browser.close()
print('PASS v369 browser: itemized UI, seconds precision, and final Category modal/save')
