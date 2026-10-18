#!/usr/bin/env python3
from pathlib import Path
import shutil, sys
try:
    from playwright.sync_api import sync_playwright
except Exception as e:
    print('v234 SMOKE FAILED: Playwright unavailable:', e); sys.exit(1)
ROOT=Path(__file__).resolve().parents[1]
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
if not chromium:
    print('v234 SMOKE FAILED: Chromium unavailable'); sys.exit(1)
css_order=['00-foundation.css','10-navigation-core-ui.css','20-dashboard-personal-order.css','30-categories-themes-navigation.css','40-system-import-tools.css','50-library-dashboard.css','60-statistics.css','70-full-style-themes.css','80-late-control-center.css','92-v221-settings-polish.css','93-v222-dashboard-rendering-stability.css','94-v224-library-sorting-actions.css','95-v225-icons-personal-order.css','96-v226-semantic-ui-library.css','97-v227-ui-icon-corrections.css','98-v228-library-priority-dynamic-row.css','99-v229-library-choice-modals.css','100-v230-choice-filter-layout.css','101-v231-settings-layout-inheritance.css','102-v232-performance-details-settings.css','103-v233-dynamic-settings-title-details-cover.css','104-v234-dashboard-quick-inputs.css']
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
    page=b.new_page(viewport={'width':1280,'height':800})
    page.set_content('''<!doctype html><html data-theme="light"><body>
      <div class="card v123-rating-queue"><div class="v123-rating-control"><div class="field"><label class="field-label">YOUR RATING / 10</label><input id="v123-rating-input" type="number" placeholder="e.g. 8.5"></div><div class="v123-rating-actions"><button class="btn">Edit</button></div></div></div>
      <div class="card v123-rating-queue v192-missing-covers"><div class="v192-cover-control"><div class="field v192-cover-url-field"><label class="field-label">COVER URL</label><input id="v192-cover-url-input" type="url" placeholder="Paste cover image URL"></div></div></div>
    </body></html>''')
    for name in css_order:
        page.add_style_tag(content=(ROOT/'assets/css'/name).read_text(encoding='utf-8'))
    data=page.evaluate("""() => {
      const r=document.getElementById('v123-rating-input'),u=document.getElementById('v192-cover-url-input');
      const rr=r.getBoundingClientRect(),ur=u.getBoundingClientRect(),rs=getComputedStyle(r),us=getComputedStyle(u);
      return {ratingWidth:rr.width,ratingHeight:rr.height,urlWidth:ur.width,urlHeight:ur.height,ratingRadius:rs.borderRadius,urlRadius:us.borderRadius,ratingBg:rs.backgroundColor,urlBg:us.backgroundColor};
    }""")
    b.close()
fail=[]
if data['ratingWidth'] < 180: fail.append(f"rating width too small: {data['ratingWidth']}")
if data['ratingHeight'] < 46: fail.append(f"rating height too small: {data['ratingHeight']}")
if data['urlWidth'] < 300: fail.append(f"cover URL width too small: {data['urlWidth']}")
if data['urlHeight'] < 46: fail.append(f"cover URL height too small: {data['urlHeight']}")
if data['ratingRadius'] != data['urlRadius']: fail.append(f"input radius mismatch: {data['ratingRadius']} vs {data['urlRadius']}")
if data['ratingBg'] != data['urlBg']: fail.append(f"input background mismatch: {data['ratingBg']} vs {data['urlBg']}")
if fail:
    print('v234 SMOKE FAILED'); [print('-',x) for x in fail]; sys.exit(1)
print('v234 SMOKE OK')
print('Rating input:', round(data['ratingWidth']), 'x', round(data['ratingHeight']))
print('Cover URL input:', round(data['urlWidth']), 'x', round(data['urlHeight']))
