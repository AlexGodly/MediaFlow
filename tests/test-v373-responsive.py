"""Static v373 toolbar/row responsive layout regression at phone/tablet/desktop widths.
Not a live authentication or Supabase test.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
style=(root/'assets/css/193-v373-logging-browser-ordering.css').read_text()
rows=''.join(f'''<div class="log-suggestion v373-title-row" role="listitem">
<span class="v373-rank">{i+1}</span>
<div class="v86-log-result v373-result"><img class="v86-log-cover" src="data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=" alt=""><div><b>Very long anime title with season labels — The Story That Never Ends {i+1}</b><small>Anime · Watching · high priority · {i}/24</small></div></div>
<button class="btn btn-sm v373-use">Use</button>
<div class="v373-reorder"><button class="v373-grip">⠿</button><button class="v373-move">↑</button><button class="v373-move">↓</button><label class="v373-position"><span>Position</span><input type="number" value="{i+1}"></label></div></div>''' for i in range(15))
html=f'''<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>
:root{{--flow:#8faaff;--panel:#151b28;--surface:#121725;--border:#333d50;--text:#edf4ff;--text-dim:#b5c3d9}}
*{{box-sizing:border-box}}body{{margin:0;background:#0c111b;color:var(--text);font:13px Arial,sans-serif}}
.mf372-logging{{padding:12px;max-width:1280px;margin:auto}}
.v373-log-tools{{padding:8px;display:flex;gap:7px;flex-wrap:wrap}}
.v373-log-tools > select, .v224-sort-pair select{{background:#1d2638;color:var(--text);padding:8px;border-radius:8px;border:1px solid var(--border)}}
.btn{{background:#202b40;border:1px solid #53617f;padding:8px;border-radius:8px;color:#fff}}
.log-suggestion-list{{max-width:100%}}
</style><style>{style}</style></head><body><main class="mf372-logging">
<div class="v87-log-tools v89-log-tools v224-log-tools v373-log-tools">
<details><summary>Categories</summary></details><div class="v224-sort-pair"><select><option>Recently added to logging</option></select><button class="btn v224-sort-direction">DESC</button></div>
<select><option>All statuses</option></select><select><option>All priorities</option></select><select><option>15 per page</option></select><button class="btn">Clear filters</button><span class="v87-log-count">50,000 matches • Page 1/3334</span></div>
<div class="v373-order-summary"><span class="v373-order-emblem">⇅</span><span class="v373-order-copy"><strong>Custom title order</strong><small>Drag, use arrows or enter a position to organize the whole Library</small></span><button class="btn">Restore added order</button></div>
<div class="log-suggestion-list v373-title-list">{rows}</div></main></body></html>'''
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    for width in [320,390,430,820,1280]:
        page=browser.new_page(viewport={'width':width,'height':850},device_scale_factor=1)
        page.set_content(html)
        info=page.evaluate('''() => ({scroll:document.documentElement.scrollWidth,viewport:innerWidth,
         result:document.querySelector('.v373-title-row').getBoundingClientRect().width,
         reorder:document.querySelector('.v373-reorder').getBoundingClientRect().width})''')
        assert info['scroll']<=width+1, (width,info)
        assert info['result']>0 and info['reorder']>0
        print('v373 responsive PASS',width,'px',info)
        page.close()
    browser.close()