#!/usr/bin/env python3
from pathlib import Path
import json,re,shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
index=(ROOT/'index.html').read_text(encoding='utf-8')
css='\n'.join((ROOT/m.group(1)).read_text(encoding='utf-8') for m in re.finditer(r'<link rel="stylesheet" href="([^"]+\.css)">',index) if (ROOT/m.group(1)).exists())
bundle=(ROOT/'assets/js/mediaflow-v295.bundle.js').read_text(encoding='utf-8')
# Empty cloud state = fresh account path, so DEFAULT_CATEGORIES must be used.
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
        page.evaluate(setup(state));page.add_script_tag(content=bundle);page.wait_for_timeout(1200)
        category_names=page.evaluate("() => window.MediaFlowV295 ? App.v295DefaultCategoryAudit().map(x=>x.name) : []")
        if len(category_names)!=22: raise AssertionError((width,'category count',len(category_names)))
        tabs=page.locator('.mobile-tabbar .mtab')
        count=tabs.count()
        if width==963 and count!=7: raise AssertionError((width,'expected 7 visible nav buttons including More',count))
        more=page.locator('.mobile-more-wrap>.mtab')
        if more.count():
            more.click();page.wait_for_timeout(100)
            box=page.locator('#mobile-more-menu').bounding_box()
            if not box: raise AssertionError((width,'More menu not visible'))
            if box['x'] < -1 or box['x']+box['width'] > width+1: raise AssertionError((width,'More menu overflow',box))
        metric=page.evaluate("""() => ({iw:innerWidth,body:document.body.scrollWidth,doc:document.documentElement.scrollWidth,bar:document.querySelector('.mobile-tabbar')?.getBoundingClientRect().toJSON?.()||null})""")
        if metric['doc']>metric['iw']+2 or metric['body']>metric['iw']+2: raise AssertionError((width,'horizontal overflow',metric))
        if errs: raise AssertionError((width,errs))
        if width==963: page.screenshot(path=str(ROOT/'v295-responsive-963.png'),full_page=False)
        results.append({'width':width,'tabs':count,'moreBox':box if more.count() else None,'docWidth':metric['doc']})
        page.close()
    b.close()
print(json.dumps(results,indent=2));print('RESPONSIVE V295 OK')
