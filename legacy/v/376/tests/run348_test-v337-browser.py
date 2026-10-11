from pathlib import Path
import re
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
source=(ROOT/'tests/test-v336-browser.py').read_text(encoding='utf-8')
match=re.search(r"base=r'''(.*?)'''",source,re.S)
assert match
base=match.group(1)
v336=(ROOT/'src/js/components/234-v336-dialogs-active-time-analytics.js').read_text()
v337=(ROOT/'src/js/components/235-v337-active-time-dual-milestones.js').read_text()
css=(ROOT/'assets/css/162-v335-stats-xp-calculator.css').read_text()+'\n'+(ROOT/'assets/css/163-v336-dialogs-active-time-analytics.css').read_text()+'\n'+(ROOT/'assets/css/164-v337-active-time-dual-milestones.css').read_text()
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1280,'height':900})
    page.set_content('<style>:root{--panel:#19202e;--panel-raised:#263143;--flow:#82a5ff;--text:#f4f6fe;--text-dim:#acb9cf;--border:#415168;--danger:#eb6969}body{background:#111827;color:var(--text);font-family:Arial;padding:28px}.card,.modal{border-radius:16px}.btn{border:1px solid var(--border);background:#243041;color:white;border-radius:999px;padding:8px 12px;cursor:pointer}.btn-primary{background:#2d4670}.btn-ghost{background:transparent}.btn-sm{padding:7px 11px;font-size:12px}</style><main id="view-root"></main>')
    page.add_style_tag(content=css)
    page.add_script_tag(content=base+'\n'+v336+'\n'+v337)
    data=page.evaluate('''() => {const host=document.createElement('div');host.innerHTML=v335ActiveTimeCard();return {card:!!host.querySelector('.v337-active-card'),bonusCount:host.querySelectorAll('.v335-active-bonuses').length,barCount:host.querySelectorAll('.v337-milestone-grid>.v336-progress-wrap').length,timeText:host.querySelector('.v337-time-milestone .v336-progress-head strong')?.textContent,xpText:host.querySelector('[data-v337-xp-next]')?.textContent,week:!!host.querySelector('.v337-active-week'),xpBonusLedger:v334Totals().firstEpisodeXP,trend:!!host.querySelector('.v336-active-grid')}}''')
    assert data['card'] and data['bonusCount']==0 and data['barCount']==2,data
    assert data['xpText']=='500 XP',data
    assert data['timeText']=='5h 0m 0s',data
    assert data['week'] and data['trend'] and data['xpBonusLedger']==20,data
    page.locator('#view-root').evaluate('(node)=>node.innerHTML=v335ActiveTimeCard()')
    page.evaluate('''() => {v334Totals=()=>({activeMs:36720000,timeXP:620,startsXP:40,collectionCreateXP:35,collectionEditXP:10,firstEpisodeXP:20,total:725});v337RefreshMilestones();}''')
    changed=page.evaluate('''() => ({time:document.querySelector('.v337-time-milestone .v336-progress-head strong')?.textContent,xp:document.querySelector('[data-v337-xp-next]')?.textContent,xpPercent:document.querySelector('[data-v337-xp-percent]')?.textContent,timePercent:document.querySelector('.v337-time-milestone .v336-progress-foot span:last-child')?.textContent})''')
    assert changed['time']=='25h 0m 0s' and changed['xp']=='1,000 XP',changed
    assert changed['xpPercent']=='24%' and changed['timePercent']=='1%',changed
    page.screenshot(path='/mnt/data/v337_active_time_preview.png',full_page=True)
    page.set_viewport_size({'width':390,'height':844})
    page.wait_for_timeout(90)
    overflow=page.evaluate('''() => ({scroll:document.documentElement.scrollWidth,width:document.documentElement.clientWidth,columns:getComputedStyle(document.querySelector('.v337-milestone-grid')).gridTemplateColumns})''')
    assert overflow['scroll']<=overflow['width']+1,overflow
    print('PASS v337: no Bonus XP panel, both milestone bars, milestone recalculation, existing analytics, mobile width')
    browser.close()
