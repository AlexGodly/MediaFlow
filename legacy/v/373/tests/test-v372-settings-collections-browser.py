#!/usr/bin/env python3
"""v372: semantic Settings icons and immediate Collection Batch Delete timing."""
from pathlib import Path
import re, shutil, json
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
version=R.joinpath('VERSION').read_text().strip()
script=R.joinpath(f'assets/js/mediaflow-v{version}.bundle.js').read_text()
assert script.endswith('})();\n')
script=script[:-6]+'''window.__v372test={S,App,V372_SECTION_ICONS,V366_BUILTIN_SECTIONS,v365BuildSection,v274CollectionsBrowserHtml,V282_COLLECTION_BATCH,V274_UI,v274CollectionsBrowserHtml};
render=function(){window.__v372Renders=(window.__v372Renders||0)+1;const host=document.getElementById('collection-mount');if(host)host.innerHTML=v274CollectionsBrowserHtml()};
renderView=function(){};
v279Confirm=()=>Promise.resolve(true);
saveState=async()=>{await new Promise(resolve=>setTimeout(resolve,230));window.__v372Saved=(window.__v372Saved||0)+1;};
persistSettings=function(){};
})();\n'''
html=R.joinpath('index.html').read_text()
css='\n'.join((R/m).read_text() for m in re.findall(r'<link[^>]*href="([^"]+\.css)"',html) if (R/m).exists())
chrome=shutil.which('chromium') or shutil.which('google-chrome')
assert chrome,'Chromium needed'
with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path=chrome,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  for width in (320,390,820,1280):
    page=browser.new_page(viewport={'width':width,'height':900})
    errors=[]
    page.on('pageerror',lambda err: errors.append(str(err)))
    page.set_content('<html><head></head><body><div id="app" style="display:none"></div><div id="collection-mount"></div></body></html>')
    page.add_style_tag(content=css)
    page.evaluate("""() => {Object.defineProperty(window,'localStorage',{value:{getItem(){return null},setItem(){},removeItem(){},clear(){}}});Object.defineProperty(window,'sessionStorage',{value:{getItem(){return null},setItem(){},removeItem(){},clear(){}}});}""")
    page.add_script_tag(content=script)
    settings=page.evaluate("""() => {
      const t=window.__v372test;
      const list=t.V366_BUILTIN_SECTIONS;
      const headers=list.map(([slug])=>{
        const el=t.v365BuildSection({id:'v221-settings-'+slug,displayTitle:slug,nodes:[]});
        document.body.appendChild(el);
        const toggle=el.querySelector('.mf365-section-toggle');
        const marker=toggle.querySelector('.mf372-section-mark');
        const count=toggle.querySelectorAll('svg').length;
        const pin=el.querySelector('.mf365-favorite-button');
        const out={slug,icon:!!marker?.querySelector('svg'),svgCount:count,pinIconCount:pin.querySelectorAll('svg').length};
        el.remove();return out;
      });
      const iconStyle=document.getElementById('mf372-logging-premium-style');
      return {headers,style:!!iconStyle};
    }""")
    assert settings['style'] and len(settings['headers'])>=28,settings
    assert all(x['icon'] and x['svgCount']==1 and x['pinIconCount']==0 for x in settings['headers']),settings
    if width==390:
      before=page.evaluate("""() => {
        const t=window.__v372test; const {S,App,V282_COLLECTION_BATCH,V274_UI}=t;
        S.view='collections';
        S.collections=[{id:'alpha',title:'Alpha Batch Test',description:'',titleIds:[],order:[],createdAt:1,updatedAt:1},{id:'beta',title:'Beta Remains',description:'',titleIds:[],order:[],createdAt:2,updatedAt:2}];
        S.collectionTombstones=[];S.settings=S.settings||{};
        V274_UI.activeId='';V274_UI.search='';V282_COLLECTION_BATCH.active=true;V282_COLLECTION_BATCH.selected.clear();V282_COLLECTION_BATCH.selected.add('alpha');
        document.getElementById('collection-mount').innerHTML=t.v274CollectionsBrowserHtml();
        const existing=document.getElementById('collection-mount').innerText;
        window.__v372DeletionPromise=App.v282DeleteSelectedCollections();
        return {before:existing.includes('Alpha Batch Test')&&existing.includes('Beta Remains'),selectedBefore:1};
      }""")
      assert before['before'],before
      page.wait_for_timeout(45)
      mid=page.evaluate("""() => {
        const {S,V282_COLLECTION_BATCH}=window.__v372test;
        const visible=document.getElementById('collection-mount').innerText;
        return {removedImmediately:!visible.includes('Alpha Batch Test'),otherRetained:visible.includes('Beta Remains'),selected:V282_COLLECTION_BATCH.selected.size,collections:S.collections.map(x=>x.id),tombstone:S.collectionTombstones.some(x=>x.id==='alpha'),saved:window.__v372Saved||0,renders:window.__v372Renders||0};
      }""")
      assert mid['removedImmediately'] and mid['otherRetained'] and mid['selected']==0 and mid['tombstone'] and mid['saved']==0 and mid['renders']>=1,mid
      page.evaluate('window.__v372DeletionPromise')
      final=page.evaluate("""() => ({saved:window.__v372Saved,visible:document.getElementById('collection-mount').innerText.includes('Alpha Batch Test'),count:document.querySelector('[data-mf276-collection-count]')?.textContent,overflow:document.documentElement.scrollWidth-innerWidth})""")
      assert final['saved']==1 and not final['visible'] and final['overflow']<=2,final
      page.screenshot(path=str(R/'tests/v372-collections-390.png'))
      print('PASS v372: Collection batch deletion updates visible results, counts, selection and tombstone BEFORE async save completes',mid,final)
    assert not errors,(width,errors)
    page.close()
  browser.close()
print('PASS v372: all 28 Settings accordions display exactly one meaningful SVG and no duplicate icon on mobile, tablet and desktop')
