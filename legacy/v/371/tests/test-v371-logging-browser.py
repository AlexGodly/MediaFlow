#!/usr/bin/env python3
"""MediaFlow v371 interactive regression and collapse render-scope benchmarks (local Chromium)."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re, shutil, json
R=Path(__file__).resolve().parents[1]
version=(R/'VERSION').read_text().strip()
source=(R/f'assets/js/mediaflow-v{version}.bundle.js').read_text()
assert source.endswith('})();\n')
source=source[:-6]+'''window.__v371test={S,App,renderLogForm,v369PanelsHtml,v370TitlePanelHtml,V219_PAGE_RENDERERS,v371LibraryStatusIcon,v365PatchSettings,v219RunPageEnhancers};
render=function(){throw new Error('Settings choice caused prohibited full rerender')};
renderView=function(){};
persistCategories=function(){};persistLibrary=function(){};persistSessions=function(){};
persistTask=function(){};persistSettings=function(){window.__savedSettings=(window.__savedSettings||0)+1};
})();\n'''
index=(R/'index.html').read_text()
css='\n'.join((R/m).read_text() for m in re.findall(r'<link[^>]*href="([^"]+\.css)"',index) if (R/m).exists())
chrome=shutil.which('chromium') or shutil.which('google-chrome')
assert chrome,'Chromium required'
results=[]
with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=chrome,args=['--no-sandbox','--disable-dev-shm-usage'])
  for width in (320,390,430,820,1280):
    page=browser.new_page(viewport={'width':width,'height':900})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content('<html><head></head><body><div id="app" style="display:none"></div><div id="view-root"></div><main id="test-mount" style="max-width:1260px;margin:auto;padding:12px"></main><div id="modal-root"></div></body></html>')
    page.add_style_tag(content=css)
    page.evaluate('''() => {
      Object.defineProperty(window,'localStorage',{value:{getItem(){return null},setItem(){},removeItem(){},clear(){}}});
      Object.defineProperty(window,'sessionStorage',{value:{getItem(){return null},setItem(){},removeItem(){},clear(){}}});
    }''')
    page.add_script_tag(content=source)
    initial=page.evaluate('''() => {
      const {S,renderLogForm}=window.__v371test;
      S.settings=S.settings||{};
      S.categories=[{id:'anime',name:'Anime',icon:'🎬',iconUrl:'',unit:'episodes',color:'#d54683',type:'video',target:2,weight:2,minutesPerUnit:24}];
      S.library=[{id:'a',title:'Sendokai Champions',categoryId:'anime',status:'active',priority:'high',progress:52,total:350,coverUrl:''}];
      S.currentTask={categoryId:'anime',targetMid:2,low:1,high:2,unit:'episodes'};
      S.sessionActive=true;S.logging=true;
      S.sessions=[];
      const units=Array.from({length:160},(_,i)=>({id:'u'+i,number:i+53,loggedAt:Date.now()-i*1000,durationSeconds:4200, isRepeat:i===0}));
      S.logDraft={v369Interface:'itemized',v369CommitId:'v371-smoke',categoryId:'anime',entries:[{title:S.library[0].title,libraryId:'a',qty:160,v369Units:units}],amount:160,minutes:160*70,note:'',updateLibrary:true};
      S.entryDraft={title:'',qty:1,libraryId:null};
      document.getElementById('test-mount').innerHTML=renderLogForm(S.currentTask,S.categories[0]);
      return {card:!!document.querySelector('.v370-title'),statusIcons:document.querySelectorAll('.v370-status .v225-btn-icon').length,
        themed:!!document.querySelector('#v371-logging-style'),unitCount:document.querySelectorAll('.v370-unit').length};
    }''')
    assert initial['card'] and initial['statusIcons']>=1 and initial['themed'] and initial['unitCount']==40,initial
    before=page.evaluate('''() => {
      const button=document.querySelector('.v370-title-actions button[aria-expanded]');
      const panel=document.querySelector('.v370-title');
      const content=panel.querySelector('.v370-title-content');
      const input=content.querySelector('input[type=number]');
      input.value='321';
      const t=performance.now();for(let i=0;i<100;i++)window.__v371test.App.v369ToggleTitle(0);
      const elapsed=performance.now()-t;
      return {elapsed,expanded:button.getAttribute('aria-expanded'),sameContent:panel.querySelector('.v370-title-content')===content,
        inputPreserved:input.value==='321',unitCount:panel.querySelectorAll('.v370-unit').length,
        selected:window.__v371test.S.logDraft.entries[0].v369Units.length,
        overflow:document.documentElement.scrollWidth-innerWidth};
    }''')
    assert before['sameContent'] and before['inputPreserved'] and before['selected']==160 and before['unitCount']==40,before
    assert before['expanded']=='true' and before['overflow']<=2,before
    assert before['elapsed']<2000,('100 toggles stalled',width,before)
    page.screenshot(path=str(R/f'tests/v371-per-unit-{width}.png'),full_page=False)
    if width==390:
      lazy=page.evaluate('''() => {
        const {S,App,renderLogForm}=window.__v371test;
        S.logDraft.entries[0].v369Collapsed=true;
        document.querySelector('#test-mount').innerHTML=renderLogForm(S.currentTask,S.categories[0]);
        const initialAbsent=!document.querySelector('.v370-title-content');
        App.v369ToggleTitle(0);
        const content=document.querySelector('.v370-title-content');
        return {initialAbsent,created:!!content,rows:content?.querySelectorAll('.v370-unit').length,expanded:document.querySelector('.v370-title-actions button').getAttribute('aria-expanded')};
      }''')
      assert lazy=={'initialAbsent':True,'created':True,'rows':40,'expanded':'true'},lazy
      page.wait_for_timeout(350)
      settings=page.evaluate('''() => {
        const {S,App,V219_PAGE_RENDERERS}=window.__v371test;
        const html=V219_PAGE_RENDERERS.get('settings')({view:'settings',state:S,settings:S.settings,defaults:{},app:App,runtime:window.MediaFlowRuntime});
        const holder=document.createElement('section');holder.innerHTML=html;
        document.body.appendChild(holder);
        const group=holder.querySelector('.v370-settings-modes');
        const ref=group;
        const before=!!group?.querySelector('button.active[aria-pressed=true]');
        App.v369SetDefaultInterface('quick');
        const afterQuick=group.querySelector('button.active')?.getAttribute('onclick')?.includes("'quick'");
        App.v369SetDefaultInterface('itemized');
        const afterUnit=group.querySelector('button.active')?.getAttribute('onclick')?.includes("'itemized'");
        return {before,afterQuick,afterUnit,same:document.querySelector('.v370-settings-modes')===ref,
          saved:window.__savedSettings,selectorPresent:!!holder.querySelector('[data-setting="v369-default-interface"]')};
      }''')
      assert all([settings['before'],settings['afterQuick'],settings['afterUnit'],settings['same'],settings['selectorPresent'],settings['saved']>=2]),settings
      # Regression for the v365 Settings Center morph: this formerly used
      # v348 directly and discarded the v369/v370 default-interface chooser.
      morph=page.evaluate('''() => {
        const {S,App,V219_PAGE_RENDERERS,v365PatchSettings,v219RunPageEnhancers}=window.__v371test;
        S.view='settings';
        const html=V219_PAGE_RENDERERS.get('settings')({view:'settings',state:S,settings:S.settings,defaults:{},app:App,runtime:window.MediaFlowRuntime});
        document.getElementById('view-root').innerHTML=html;
        v219RunPageEnhancers('settings');
        const before=!!document.querySelector('#view-root [data-setting="v369-default-interface"]');
        const done=v365PatchSettings();
        const after=!!document.querySelector('#view-root [data-setting="v369-default-interface"]');
        return {before,done,after,visibleInCenter:!!document.querySelector('.mf365-settings-center [data-setting="v369-default-interface"]')};
      }''')
      assert morph['before'] and morph['done'] and morph['after'] and morph['visibleInCenter'],morph
      print('PASS v371: Settings Center canonical rerender preserves default logging control')
      quick=page.evaluate('''() => {
        const {S,renderLogForm}=window.__v371test;
        S.logDraft={categoryId:'anime',v369Interface:'quick',v179Mode:'progress',amount:2,minutes:48,note:'',updateLibrary:true,
        entries:[{title:'Sendokai Champions',libraryId:'a',qty:2,isRepeat:false,loggedAt:Date.now()}]};
        document.querySelector('#test-mount').innerHTML=renderLogForm(S.currentTask,S.categories[0]);
        const card=document.querySelector('.v239-logged-title-card');
        return {status:card?.querySelector('.v371-quick-status')?.textContent?.includes('Watching'),
          icon:!!card?.querySelector('.v371-quick-status .v225-btn-icon'),
          selected:!!document.querySelector('.v239-log-mode-options .active[aria-pressed="true"]'),
          color:getComputedStyle(document.querySelector('.v370-mode-switch .active')).backgroundColor,
          overflow:document.documentElement.scrollWidth-innerWidth};
      }''')
      assert quick['status'] and quick['icon'] and quick['selected'] and quick['overflow']<=2,quick
      page.screenshot(path=str(R/'tests/v371-quick-progress-390.png'),full_page=False)
      page.locator('.v370-clear-btn').click()
      assert page.locator('#v336-dialog-root [data-v336-dialog-cancel] .v370-icon').count()==1
      assert page.locator('#v336-dialog-root [data-v336-dialog-cancel]').get_attribute('class').find('v371-keep-titles')>=0
      page.locator('[data-v336-dialog-cancel]').click()
      assert len(page.evaluate('window.__v371test.S.logDraft.entries'))==1
      print('PASS v371: settings selection persistence without rerender, quick-mode Library status icons, Keep titles icon, lazy expand')
    assert not errors,(width,errors)
    results.append({'width':width,**before})
    page.close()
  browser.close()
print(json.dumps(results,indent=2))
print('PASS v371: color styling and Library status icon; 100 fast no-rerender collapse toggles at every viewport, stable unsaved inputs')
