from pathlib import Path
from playwright.sync_api import sync_playwright
x=Path(__file__).with_name('test-v354-personal-order.py').read_text()
ns={"__file__":str(Path(__file__).with_name("test-v354-personal-order.py"))}
exec(x.split('with sync_playwright() as pw:')[0],ns)
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for width,height in [(390,844),(1280,900)]:
  page=b.new_page(viewport={'width':width,'height':height})
  page.set_content(ns['html'])
  page.evaluate("()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}")
  page.add_script_tag(content=ns['js']);page.evaluate(ns['fixture'])
  page.screenshot(path=str(ns['R']/'tests'/f'v354-order-{width}.png'),full_page=False)
  page.locator('.mf354-quickbar .btn').filter(has_text='Add Collection').click()
  page.screenshot(path=str(ns['R']/'tests'/f'v354-add-collection-{width}.png'),full_page=False)
  page.close()
 b.close()
