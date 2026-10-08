#!/usr/bin/env python3
from pathlib import Path
import json,re,shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
index=(ROOT/'index.html').read_text(encoding='utf-8')
css='\n'.join((ROOT/m.group(1)).read_text(encoding='utf-8') for m in re.finditer(r'<link rel="stylesheet" href="([^"]+\.css)">',index) if (ROOT/m.group(1)).exists())
bundle=(ROOT/'assets/js/mediaflow-v296.bundle.js').read_text(encoding='utf-8')
state={}
def setup(st):
    return f'''() => {{
      const store={{}};const fake={{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k],clear(){{}},key:i=>Object.keys(store)[i]||null,get length(){{return Object.keys(store).length}}}};
      Object.defineProperty(window,'localStorage',{{configurable:true,value:fake}});Object.defineProperty(window,'sessionStorage',{{configurable:true,value:fake}});
      const user={{id:'u',email:'a@b.test',created_at:new Date().toISOString(),user_metadata:{{display_name:'Alex'}}}};let cloud={json.dumps(st,separators=(',',':'))};
      const q={{select(){{return q}},eq(){{return q}},maybeSingle:async()=>({{data:{{state_data:cloud,updated_at:new Date().toISOString()}},error:null}}),upsert:async row=>{{cloud=row.state_data;return {{error:null}}}},delete(){{return q}}}};
      window.supabase={{createClient:()=>({{auth:{{getSession:()=>Promise.resolve({{data:{{session:{{user}}}}}}),onAuthStateChange:()=>({{data:{{subscription:{{unsubscribe(){{}}}}}}}}),getUser:async()=>({{data:{{user}},error:null}})}},from:()=>q}})}};
      window.confirm=()=>true;window.alert=()=>{{}};window.fetch=async()=>({{ok:false,status:503,json:async()=>({{}}),text:async()=>''}});
    }}'''
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
    results=[]
    for width in (963,760,600,430,360):
        page=b.new_page(viewport={'width':width,'height':780});errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
        page.set_content(f'<!doctype html><html><head><style>{css}</style></head><body><div id="app"></div></body></html>')
        page.evaluate(setup(state));page.add_script_tag(content=bundle);page.wait_for_timeout(1300)
        audit=page.evaluate("() => App.v296AuditState()")
        if audit.get('version')!=296: raise AssertionError((width,'audit version',audit))
        tabs=page.locator('.mobile-tabbar .mtab'); count=tabs.count()
        more=page.locator('.mobile-more-wrap>.mtab')
        box=None
        if more.count():
            more.click();page.wait_for_timeout(100)
            menu=page.locator('#mobile-more-menu')
            box=menu.bounding_box()
            if not box: raise AssertionError((width,'More menu not visible'))
            if box['x'] < -1 or box['x']+box['width'] > width+1: raise AssertionError((width,'More menu overflow',box))
            if menu.locator('.v296-more-head').count()!=1: raise AssertionError((width,'new More header missing'))
            if menu.locator('.v296-more-item').count()<1: raise AssertionError((width,'More items missing'))
            page.locator('.v296-more-close').click();page.wait_for_timeout(50)
            if not menu.evaluate('(el)=>el.classList.contains("hide")'): raise AssertionError((width,'More close failed'))
        metric=page.evaluate("""() => ({iw:innerWidth,body:document.body.scrollWidth,doc:document.documentElement.scrollWidth})""")
        if metric['doc']>metric['iw']+2 or metric['body']>metric['iw']+2: raise AssertionError((width,'horizontal overflow',metric))
        if errs: raise AssertionError((width,errs))
        if width==963:
            more.click();page.wait_for_timeout(100);page.screenshot(path=str(ROOT/'v296-responsive-more-963.png'),full_page=False)
        results.append({'width':width,'tabs':count,'moreBox':box,'docWidth':metric['doc']})
        page.close()

    # Confirmation-flow test in Settings.
    page=b.new_page(viewport={'width':760,'height':900});errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
    page.set_content(f'<!doctype html><html><head><style>{css}</style></head><body><div id="app"></div></body></html>')
    page.evaluate(setup(state));page.add_script_tag(content=bundle);page.wait_for_timeout(1300)
    page.evaluate("() => App.mobileNav('settings')");page.wait_for_timeout(200)
    first_delete=page.locator('.settings-categories-full .cat-delete-btn').first
    if first_delete.count()!=1: raise AssertionError('No Category delete button')
    first_delete.click();page.wait_for_timeout(100)
    delete_confirm=page.locator('#modal-root .btn-danger').filter(has_text='Delete category')
    if delete_confirm.count()!=1: raise AssertionError('Delete category confirm missing')
    delete_confirm.click();page.wait_for_timeout(300)
    restore_missing=page.get_by_role('button',name=re.compile(r'Restore missing defaults'))
    if restore_missing.count()!=1: raise AssertionError('Restore missing defaults button missing')
    restore_missing.click();page.wait_for_timeout(100)
    modal=page.locator('.v296-recovery-modal')
    if modal.count()!=1: raise AssertionError('Missing-default recovery confirmation did not open')
    if 'Restore missing default categories?' not in modal.inner_text(): raise AssertionError('Missing-default modal copy incorrect')
    page.screenshot(path=str(ROOT/'v296-category-recovery-confirm-760.png'),full_page=False)
    page.get_by_role('button',name='Cancel').click();page.wait_for_timeout(100)
    restore_last=page.get_by_role('button',name=re.compile(r'Restore last deleted'))
    if restore_last.count()!=1: raise AssertionError('Restore last deleted button missing')
    restore_last.click();page.wait_for_timeout(100)
    modal=page.locator('.v296-recovery-modal')
    if modal.count()!=1 or 'Restore the last deleted category?' not in modal.inner_text(): raise AssertionError('Last-deleted modal incorrect')
    if errs: raise AssertionError(errs)
    page.close();b.close()
print(json.dumps(results,indent=2));print('RESPONSIVE / CONFIRMATION V296 OK')
