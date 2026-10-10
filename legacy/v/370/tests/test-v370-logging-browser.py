#!/usr/bin/env python3
"""v370 responsive logging UI, icon, cover, clear modal and Settings smoke (isolated local state)."""
from pathlib import Path
import json, re, shutil
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
version=(R/'VERSION').read_text().strip()
source=(R/f'assets/js/mediaflow-v{version}.bundle.js').read_text()
assert source.endswith('})();\n')
source=source[:-6]+'''window.__v370test={S,App,renderLogForm, v369PanelsHtml, v181CoverSize, v370CoverWidth, v181CoverSettingsHtml, V219_PAGE_RENDERERS, v336Confirm};
render=function(){};renderView=function(){};
persistCategories=function(){};persistLibrary=function(){};persistSessions=function(){};
persistTask=function(){};persistSettings=function(){};
})();\n'''
index=(R/'index.html').read_text()
css='\n'.join((R/m).read_text() for m in re.findall(r'<link[^>]*href="([^"]+\.css)"',index) if (R/m).is_file())
chrome=shutil.which('chromium') or shutil.which('google-chrome')
results=[]
with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True, executable_path=chrome,args=['--no-sandbox','--disable-dev-shm-usage'])
  for width in [320,390,430,820,1280]:
    page=browser.new_page(viewport={'width':width,'height':860},device_scale_factor=1)
    errors=[]
    page.on('pageerror',lambda err:errors.append(str(err)+': '+str(getattr(err, 'stack', '') )[:500]))
    page.set_content('<html><head></head><body><div id="app" style="display:none"></div><div id="view-root"></div><main id="test-mount" style="padding:12px;max-width:1260px;margin:auto"></main><div id="modal-root"></div></body></html>')
    page.add_style_tag(content=css)
    page.evaluate("""() => {
      Object.defineProperty(window,'localStorage',{value:{getItem(){return null},setItem(){},removeItem(){},clear(){}}});
      Object.defineProperty(window,'sessionStorage',{value:{getItem(){return null},setItem(){},removeItem(){},clear(){}}});
    }""")
    page.add_script_tag(content=source)
    init=page.evaluate('''() => {
      const {S,renderLogForm,App}=window.__v370test;
      S.settings=S.settings||{};
      S.categories=[{id:'anime',name:'Anime',icon:'🎬',iconUrl:'',unit:'episodes',color:'#d54683',type:'video',target:2,weight:2,minutesPerUnit:24}];
      S.library=[{id:'a',title:'Sendokai Champions and the Very Long Title',categoryId:'anime',status:'active',priority:'high',progress:52,total:70,coverUrl:''}];
      S.currentTask={categoryId:'anime',targetMid:2,low:1,high:2,unit:'episodes'};
      S.sessionActive=true;S.logging=true;
      S.sessions=[];
      S.logDraft={v369Interface:'itemized',v369CommitId:'v370-smoke',categoryId:'anime',entries:[{title:S.library[0].title,libraryId:'a',qty:2,v179StartProgress:52,v369Units:[
       {id:'u1',number:53,loggedAt:Date.now()-50000,durationSeconds:4200},
       {id:'u2',number:54,loggedAt:Date.now()-10000,durationSeconds:4200}]}],amount:2,minutes:140,note:'',updateLibrary:true};
      S.entryDraft={title:'',qty:1,libraryId:null};
      const html=renderLogForm(S.currentTask,S.categories[0]);
      document.getElementById('test-mount').innerHTML=html;
      return {modeLabels:html.includes('Per unit')&&html.includes('Quick logging'), coverFallback:html.includes('Missing cover'), iconMarkup:html.includes('v370-icon'), runtimeLabels:html.includes('Hours')&&html.includes('Minutes')&&html.includes('Seconds'), settingsSizeDefault:window.__v370test.v181CoverSize('v370Itemized')};
    }''')
    page.screenshot(path=str(R/f'tests/v370-preview-{width}.png'),full_page=True)
    metrics=page.evaluate('''() => {
      const root=document.getElementById('test-mount'), units=[...root.querySelectorAll('.v370-unit')];
      const runtime=units[0]?.querySelector('.v370-unit-runtime'), fields=[...runtime.querySelectorAll('input')];
      return {documentWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth,
        rootWidth:root.getBoundingClientRect().width,formWidth:root.querySelector('.log-form')?.getBoundingClientRect().width,
        unitCount:units.length,unitHeight:units[0]?.getBoundingClientRect().height,
        runtimeWidths:fields.map(x=>Math.round(x.getBoundingClientRect().width)),
        runtimeY:fields.map(x=>Math.round(x.getBoundingClientRect().top)),
        cover:!!root.querySelector('.v370-title-cover.is-missing'),
        tagCount:root.querySelectorAll('.v370-title-tags .v370-tag').length,
        clearButton:!!root.querySelector('.v370-clear-btn'),
        totals:!!root.querySelector('.v370-auto-totals')};
    }''')
    assert init['modeLabels'] and init['coverFallback'] and init['iconMarkup'] and init['runtimeLabels'],init
    assert metrics['documentWidth']<=width+2,('mobile horizontal overflow',width,metrics)
    assert metrics['runtimeY'][0]==metrics['runtimeY'][1]==metrics['runtimeY'][2],('runtime controls not in one row',width,metrics)
    assert metrics['tagCount']==3 and metrics['unitCount']==2 and metrics['clearButton'] and metrics['totals'],metrics
    assert not errors,(width,errors)
    if width==430:
      settings=page.evaluate('''() => {
        const {S,App,V219_PAGE_RENDERERS,v181CoverSize,v181CoverSettingsHtml,v370CoverWidth}=window.__v370test;
        const html=V219_PAGE_RENDERERS.get('settings')({view:'settings',state:S,settings:S.settings,defaults:{},app:App,runtime:window.MediaFlowRuntime});
        const covers=v181CoverSettingsHtml();
        const before=v370CoverWidth();
        App.v181SetCoverSize('v370Itemized',160);
        const after=v370CoverWidth();
        const exported=JSON.parse(JSON.stringify(S.settings));
        App.v181ResetCoverSizes();
        const reset=v181CoverSize('v370Itemized');
        return {perUnit:html.includes('>Per unit'),quick:html.includes('Quick logging'),
          sameIcons:html.includes('v370-icon'),noOldName:!html.includes('Per Episode / Chapter / Issue'),
          coverRow:covers.includes('v181-cover-range-v370Itemized'),before,after,
          exportedSize:exported.v181CoverSizes?.v370Itemized,reset};
      }''')
      assert settings['perUnit'] and settings['quick'] and settings['sameIcons'] and settings['noOldName'],settings
      assert settings['coverRow'] and settings['before']==74 and settings['after']>settings['before'] and settings['exportedSize']==160 and settings['reset']==100,settings
      print('PASS v370 browser: Settings naming/icons, independent cover-size setting, reset and settings persistence')
    if width==390:
      page.locator('.v370-clear-btn').click()
      assert page.locator('#v336-dialog-root').count()==1,('confirmation not found',page.locator('body').inner_text()[-600:])
      page.locator('[data-v336-dialog-cancel]').click()
      assert len(page.evaluate('window.__v370test.S.logDraft.entries'))==1,'cancel deleted titles'
      page.locator('.v370-clear-btn').click()
      page.locator('[data-v336-dialog-confirm]').click()
      page.wait_for_timeout(180)
      assert len(page.evaluate('window.__v370test.S.logDraft.entries'))==0,'confirm did not clear'
      # Test Quick Logging as well, including its amount/progress modes.
      for log_mode in ['amount','progress']:
        result=page.evaluate('''(mode) => {
          const {S,renderLogForm}=window.__v370test;
          S.logDraft={categoryId:'anime',v369Interface:'quick',v179Mode:mode,amount:2,minutes:48,note:'',updateLibrary:true,
            entries:[{title:'Sendokai Champions',libraryId:'a',qty:2,isRepeat:false,loggedAt:Date.now()}]};
          document.getElementById('test-mount').innerHTML=renderLogForm(S.currentTask,S.categories[0]);
          return {clear:!!document.querySelector('.v370-clear-btn'),mode:!!document.querySelector('.v370-mode-switch'),amount:!!document.querySelector('#log-amount'),totals:!!document.querySelector('.v370-auto-totals')};
        }''',log_mode)
        assert result['clear'] and result['mode'] and result['amount'] and not result['totals'],result
        page.wait_for_timeout(230)
        page.screenshot(path=str(R/f'tests/v370-quick-{log_mode}-390.png'),full_page=True)
        page.locator('.v370-clear-btn').click()
        page.locator('[data-v336-dialog-confirm]').click()
        assert len(page.evaluate('window.__v370test.S.logDraft.entries'))==0,'quick clear failed'
      print('PASS v370 browser: confirmation cancel/accept, Quick Logging amount/progress')
    results.append({'width':width,**metrics})
    page.close()
  browser.close()
print(json.dumps(results,indent=2))
print('PASS v370 browser: responsive Per unit, icons, title metadata, missing cover, runtime columns, no horizontal overflow')
