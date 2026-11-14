"""v377 real compiled app + synthetic Library, mocked Jikan (no live API or cloud)."""
from pathlib import Path
import re
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
raw=(R/'test-v350-responsive.html').read_text()
stylefiles=re.findall(r'href="(assets/css/[^\"]+)"',(R/'index.html').read_text())
css='\n'.join((R/p).read_text() for p in stylefiles)
html=re.sub(r'<link[^>]+>','',raw).replace('</head>','<style>'+css+'</style></head>')
js=(R/'assets/js/mediaflow-v377.bundle.js').read_text().rstrip()
assert js.endswith('})();')
js=js[:-5]+'''\nwindow.__v377={S,App,v377RunJikan,v377ShowUnmatchedReport,v377EnsureJikanState,v166SeasonalSettingsHtml,v377IdValid,renderModal,setRender:fn=>{render=fn},setSaveState:fn=>{saveState=fn},setPersistLibrary:fn=>{persistLibrary=fn}};})();'''
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in [390,1280]:
  page=browser.new_page(viewport={'width':width,'height':900})
  errors=[];page.on('pageerror', lambda e:errors.append(str(e)))
  page.set_content(html)
  page.evaluate("()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}")
  page.add_script_tag(content=js)
  prep='''()=>{
    const {S}=window.__v377;
    S.view='library';
    S.categories=[{id:'seasonal',name:'Seasonal Anime',seasonal:true,icon:'🌸',color:'#eeaaff',type:'video',unit:'episodes'}, {id:'manga',name:'Manga',icon:'📚',type:'reading',unit:'chapters'}];
    S.library=[
      {id:'test-a',title:'Test Anime A',categoryId:'seasonal',status:'active',progress:3,total:12,externalIds:{mal:'111',simkl:'1234'},createdAt:Date.now()},
      {id:'test-b',title:'Test Anime B',categoryId:'seasonal',status:'active',progress:5,total:12,externalIds:{mal:'222'},createdAt:Date.now()},
      {id:'test-c',title:'Test Anime C',categoryId:'seasonal',status:'active',progress:0,total:12,externalIds:{},createdAt:Date.now()}
    ];
    S.settings=S.settings||{}; S.settings.seasonalFreshAuto=true; S.settings.seasonalFreshCount=70;
    window.__jikanCalls=[];
    window.fetch=async url=>{
      url=String(url);window.__jikanCalls.push(url);
      if(url.includes('/anime?q=Test%20Anime%20C'))return {ok:true,json:async()=>({data:[]})};
      if(url.includes('/anime/111/episodes'))return {ok:true,json:async()=>({data:Array.from({length:10},(_,i)=>({mal_id:i+1,aired:'2026-01-01'})),pagination:{last_visible_page:1}})};
      if(url.includes('/anime/222/episodes'))return {ok:true,json:async()=>({data:[],pagination:{last_visible_page:1}})};
      return {ok:false,status:404,headers:{get:()=>null}};
    };
    document.querySelector('#app').innerHTML='<div class="main"><div class="container"><div id="view-root"></div><div id="modal-root"></div></div></div>';
    // Prevent service callbacks from touching cloud while verifying local UI.
    window.__v377.setSaveState(async()=>{});window.__v377.setPersistLibrary(()=>{});window.__v377.setRender(()=>{window.__v377.renderModal();});
    return true;
  }'''
  page.evaluate(prep)
  page.evaluate("()=>window.__v377.App.openLibraryModal('test-a')")
  assert page.locator('[data-v377-ids-editor]').count()==1,(width,'IDs editor absent',errors)
  assert page.locator('[data-v377-id=\"mal\"]').input_value()=='111'
  assert page.locator('[data-v377-id=\"simkl\"]').input_value()=='1234'
  details=page.locator('[data-v377-ids-editor] details')
  details.evaluate('(el)=>el.open=true')
  # Validate placement, not just DOM source order: Seasons must render last in core details.
  order=page.evaluate('''() => {const a=document.querySelector('.v252-seasons-editor'),b=document.querySelector('.mf377-external-ids'),c=document.querySelector('.v240-section-artwork');return [a,b,c].map(x=>x?Number(getComputedStyle(x).order):null)}''')
  assert order==[17,18,20],(width,'Seasons/external section placement',order)
  page.locator('[data-v377-id="mal"]').fill('333')
  page.locator('[data-v377-id="simkl"]').fill('765')
  page.evaluate("()=>window.__v377.App.saveLibraryModal('test-a')")
  ids=page.evaluate("window.__v377.S.library.find(i=>i.id==='test-a')?.externalIds")
  assert ids and str(ids.get('mal'))=='333' and ids.get('simkl')=='765',(width,'saved external IDs',ids,errors)
  manual=page.evaluate("window.__v377.S.library.find(i=>i.id==='test-a')?.v377ManualExternalIds")
  assert manual and manual.get('mal')=='333',(width,'manual source protection',manual)
  # restore saved MAL ID to scenario fixture for mocked Jikan scan.
  page.evaluate("()=>{let a=window.__v377.S.library.find(i=>i.id==='test-a');a.externalIds.mal='111';a.v377ManualExternalIds.mal='111'}")
  result=page.evaluate('''async()=>await window.__v377.v377RunJikan({force:false,notify:false})''')
  report=page.evaluate('''() => {const s=window.__v377.S.settings;return {count:s.seasonalFreshCount,r:s.v377JikanResults,l:s.v377JikanLedger}}''')
  assert result and not result['complete'],(width,'partial missing-data scan must not be marked complete',result)
  assert report['count']==70,(width,'last good count lost',report)
  assert 'View Unmatched Titles' in page.evaluate('window.__v377.v166SeasonalSettingsHtml()'),(width,'Jikan button missing')
  assert 'test-c' in [x['id'] for x in report['r']['unmatched']],(width,'unmatched report',report)
  assert 'test-b' in [x['id'] for x in report['r']['failures']],(width,'empty episode data must be failure',report)
  page.evaluate('window.__v377.v377ShowUnmatchedReport()')
  assert page.locator('#mf377-report-overlay').count()==1
  assert page.locator('.mf377-report-row').count()==2
  assert page.locator('.mf377-report-cover').count()==2
  assert 'Test Anime C' in page.locator('#mf377-report-overlay').inner_text()
  assert 'Retry API Failures' in page.locator('#mf377-report-overlay').inner_text()
  if width==1280:
   page.screenshot(path=str(R/'v377-report-preview-1280.png'))
  # Recovery: a previously unmatched title gains a MAL ID and usable episode data.
  page.evaluate("""() => {
   window.__jikanCalls=[];
   window.fetch=async url=>{
    url=String(url);window.__jikanCalls.push(url);
    if(url.includes('/anime?q=Test%20Anime%20C'))return {ok:true,json:async()=>({data:[{title:'Test Anime C',mal_id:333,type:'TV'}]})};
    if(url.includes('/anime/333/episodes'))return {ok:true,json:async()=>({data:Array.from({length:7},(_,i)=>({mal_id:i+1,aired:'2026-01-01'})),pagination:{last_visible_page:1}})};
    if(url.includes('/anime/222/episodes'))return {ok:true,json:async()=>({data:Array.from({length:8},(_,i)=>({mal_id:i+1,aired:'2026-01-01'})),pagination:{last_visible_page:1}})};
    throw Error('Unexpected Jikan URL '+url);
   };
  }""")
  one=page.evaluate("async()=>await window.__v377.App.v377RetryOne('test-c')")
  assert one and not one['complete'],(width,'API failure should prevent promotion',one)
  assert page.evaluate("window.__v377.S.settings.seasonalFreshCount")==70,(width,'partial retry overwrote prior count')
  two=page.evaluate("async()=>await window.__v377.App.v377RetryUnmatched('failed')")
  result_count=page.evaluate("window.__v377.S.settings.seasonalFreshCount")
  assert two and two['complete'] and result_count==3,(width,'retries did not promote verified aggregate',two,result_count)
  assert page.evaluate('window.__v377.S.settings.seasonalFreshLastEpisodeTotal')==17,(width,'wrong unwatched episodes total')
  assert page.evaluate('window.__v377.S.settings.v377JikanResults.unmatched.length')==0
  assert page.evaluate('window.__v377.S.settings.v377JikanResults.failures.length')==0
  assert not errors,(width,'browser errors',errors[:5])
  print('PASS',width,'editor/save, manual source, Seasons placement, partial Jikan, report, legacy count protection',flush=True)
  page.close()
 browser.close()
