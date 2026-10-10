"""v352 compiled Collection Add Titles modal regressions: view modes/sizing/readability/search/selection/pages."""
from pathlib import Path
import re
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
bundle=(ROOT/'assets/js/mediaflow-v352.bundle.js').read_text(encoding='utf-8').rstrip()
page_html=(ROOT/'test-v350-responsive.html').read_text(encoding='utf-8')
css='\n'.join((ROOT / rel).read_text(encoding='utf-8') for rel in re.findall(r'href="(assets/css/[^"]+)"',page_html))
css+='\n'+(ROOT/'assets/css/177-v351-mobile-regression-repairs.css').read_text(encoding='utf-8')
css+='\n'+(ROOT/'assets/css/178-v352-collection-add-picker-views.css').read_text(encoding='utf-8')
page_html=re.sub(r'<link[^>]+>','',page_html).replace('</head>', '<style>'+css+'</style></head>')
assert bundle.endswith('})();')
bundle=bundle[:-5]+'''\nwindow.__v352={S,App,v274AddCandidates,v276AddData,v352PickerPrefs,v274AddState,V274_UI};})();'''
SETUP='''()=>{
const T=window.__v352; T.S.settings=T.S.settings||{};
T.S.categories=[{id:'anime',name:'Anime Backlog',unit:'episodes',color:'#ff55aa',icon:'🌸'}];
T.S.library=Array.from({length:60},(_,i)=>({id:'t'+i,title:(i===0?'An Incredibly Long Media Title That Must Wrap Fully Across Multiple Lines Instead Of Being Cut Off By Ellipsis':`Test Title ${String(i).padStart(3,'0')}`),categoryId:'anime',status:i%2===0?'active':'completed',priority:'medium',rating:8,progress:0,total:12}));
T.S.collections=[{id:'c1',title:'Test Collection',titleIds:[],order:[],createdAt:100,updatedAt:100}];T.V274_UI.activeId='c1';
T.App.v274OpenAddTitles('c1');
return true;
}'''
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width in [320,390,820,1280]:
  page=browser.new_page(viewport={'width':width,'height':844})
  errs=[]
  page.on('pageerror',lambda e:errs.append(str(e)))
  page.set_content(page_html)
  page.evaluate('''()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}''')
  page.add_script_tag(content=bundle)
  page.evaluate(SETUP)
  assert page.locator('#mf274-add-titles').count()==1,(width,'modal missing')
  assert page.locator('#mf274-add-titles .mf352-view-mode').count()==5,(width,'not all modes shown')
  assert page.locator('#mf274-add-titles .mf352-adjuster input').count()==2,(width,'sliders missing')
  assert page.locator('.mf352-picker-item').count()==24,(width,'24 per page')
  assert 'mf352-mode-list' in page.locator('#mf276-add-results').get_attribute('class')
  title=page.locator('.mf352-picker-title').first
  css=title.evaluate('''el=>({font:parseFloat(getComputedStyle(el).fontSize),white:getComputedStyle(el).whiteSpace,overflow:getComputedStyle(el).textOverflow})''')
  if width in (390,1280):page.screenshot(path=str(ROOT/'tests'/f'v352-picker-{width}.png'))
  assert css['font']>=15 and css['white']=='normal' and css['overflow']!='ellipsis',(width,css)
  page.locator('.mf352-view-mode').filter(has_text='Compact').click()
  assert 'mf352-mode-compact' in page.locator('#mf276-add-results').get_attribute('class')
  page.locator('.mf352-view-mode').filter(has_text='Cards').click()
  assert 'mf352-mode-cards' in page.locator('#mf276-add-results').get_attribute('class')
  page.locator('.mf352-view-mode').filter(has_text='Covers',has_not_text='Titles').click()
  assert 'mf352-mode-covers' in page.locator('#mf276-add-results').get_attribute('class')
  page.locator('.mf352-view-mode').filter(has_text='Covers + Titles').click()
  assert 'mf352-mode-covers-title' in page.locator('#mf276-add-results').get_attribute('class')
  page.locator('.mf352-view-mode').filter(has_text='List').click()
  page.locator('.mf352-adjuster input[aria-label="Title text size"]').fill('22')
  page.locator('.mf352-adjuster input[aria-label="Title cover size"]').fill('120')
  assert page.locator('#mf352-text-value').inner_text()=='22px'
  assert page.locator('#mf352-cover-value').inner_text()=='120px'
  css=page.locator('.mf352-picker-title').first.evaluate('el=>parseFloat(getComputedStyle(el).fontSize)')
  assert css==22,(width,'size slider did not apply',css)
  page.locator('.mf352-picker-item').first.locator('input[type=checkbox]').check(timeout=5000)
  assert page.locator('#mf274-add-confirm').is_enabled(),(width,'selection not working')
  page.locator('.mf352-view-mode').filter(has_text='Cards').click()
  assert page.locator('.mf352-picker-item').first.locator('input[type=checkbox]').is_checked(),(width,'selection dropped on view change')
  page.locator('#mf274-add-titles .mf274-add-pager button').last.click()
  assert 'Page 2/3' in page.locator('.mf274-add-pager').inner_text()
  assert page.locator('.mf352-picker-item').count()==24
  page.locator('#mf276-add-search').fill('Test Title 050')
  page.wait_for_timeout(220)
  assert page.locator('.mf352-picker-item').count()==1,(width,'search incorrect')
  assert page.locator('.mf352-picker-title').first.inner_text()=='Test Title 050'
  assert page.locator('.mf352-view-mode.active').count()==1
  assert page.evaluate('window.__v352.S.settings.v352CollectionPicker')=={'viewMode':'cards','textSize':22,'coverSize':120}
  page.evaluate("window.__v352.App.v274CloseOverlay('mf274-add-titles')")
  page.evaluate("window.__v352.App.v274OpenAddTitles('c1')")
  assert 'mf352-mode-cards' in page.locator('#mf276-add-results').get_attribute('class'),(width,'mode preference lost on reopen')
  assert page.locator('#mf352-cover-value').inner_text()=='120px',(width,'cover preference lost on reopen')
  assert page.locator('#mf352-text-value').inner_text()=='22px',(width,'text preference lost on reopen')
  assert not errs,(width,errs[:3])
  # The picker should not force the whole document to scroll horizontally.
  overflow=page.evaluate('document.documentElement.scrollWidth-document.documentElement.clientWidth')
  assert overflow<=2,(width,'document overflow',overflow)
  print('PASS picker viewport',width,flush=True)
  page.close()
 browser.close()
print('PASS v352 Collection Add Titles picker')
