"""v338 regression: Normal cover selections appear with Clean Covers off only.
Checks both cover layouts, both Clean Covers states, the unaffected Dynamic
selection layout, and selection events on the same DOM shape as MediaFlow.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
css=(ROOT/'assets/css/50-library-dashboard.css').read_text()+'\n'+(ROOT/'assets/css/165-v338-normal-cover-selection.css').read_text()
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1280,'height':850})
    page.set_content('''<html><head><style>:root{--flow:#81a1fb;--border-soft:#556;--panel:#1b2533;--text:#eee;--v177-library-scale:1}body{margin:0;padding:30px;background:#151b25;color:#eee;font-family:Arial}.item-row{box-sizing:border-box}.card{background:#1b2533}.mf-select{width:18px;height:18px}</style></head><body><div id="view-root"></div></body></html>''')
    page.add_style_tag(content=css)
    page.add_script_tag(content='''
      window.S={view:'library',librarySelection:{}};
      window.App={toggleLibrarySelect(id,checked){S.librarySelection[id]=checked;}};
      window.mockRender=(mode,clean,dynamic=false)=>{
        const root=document.getElementById('view-root');
        const cover='<div class="library-cover-thumb" style="width:118px;height:167px;background:#aabbdd"></div>';
        if(dynamic){
          root.innerHTML=`<div class="v191-clean-covers-scope ${clean?'v191-clean-covers':''}"><div class="v181-dynamic-${mode}"><div class="v181-cover-tile v189-selectable-cover" data-library-id="a"><label class="v189-cover-select" title="Select title"><input type="checkbox" class="mf-select" data-mf-select="a" onchange="App.toggleLibrarySelect('a',this.checked)"></label>${cover}</div></div></div>`;
        }else{
          root.innerHTML=`<div class="v191-clean-covers-scope ${clean?'v191-clean-covers':''}"><div class="library-view-${mode}"><div class="card"><div class="item-row" data-library-id="a">${cover}<div class="v176-library-copy">title</div></div></div></div></div>`;
          // Equivalent to v37's mfEnhanceLibraryDom: append checkbox at row start
          const row=root.querySelector('.item-row'),cb=document.createElement('input');
          cb.type='checkbox';cb.className='mf-select';cb.dataset.mfSelect='a';
          cb.checked=!!S.librarySelection.a;
          cb.addEventListener('change',()=>App.toggleLibrarySelect('a',cb.checked));
          row.insertBefore(cb,row.firstChild);
        }
      };
    ''')
    for mode in ('covers','covers-title'):
      for clean in (False,True):
        page.evaluate('([mode,clean])=>mockRender(mode,clean)',[mode,clean])
        cb=page.locator('#view-root .item-row > input.mf-select')
        assert cb.count()==1
        display=cb.evaluate('el=>getComputedStyle(el).display')
        assert (display=='none')==clean,(mode,clean,display)
        if not clean:
          row=page.locator('.item-row').bounding_box()
          box=cb.bounding_box()
          assert row and box and row['x']<box['x']<row['x']+row['width'],(row,box)
          cb.check()
          assert page.evaluate('S.librarySelection.a') is True
          cb.uncheck()
          assert page.evaluate('S.librarySelection.a') is False
      for clean in (False,True):
        page.evaluate('([mode,clean])=>mockRender(mode,clean,true)',[mode,clean])
        assert page.locator('.v189-cover-select .mf-select').count()==1
        # The preexisting clean-cover rule controls Dynamic Library.
        display=page.locator('.v189-cover-select').evaluate('el=>getComputedStyle(el).display')
        assert (display=='none')==clean,(mode,clean,display)
    print('PASS v338: Normal Covers/Covers+Titles checkbox visibility and clicks; Clean Covers ON; Dynamic unchanged')
    browser.close()
