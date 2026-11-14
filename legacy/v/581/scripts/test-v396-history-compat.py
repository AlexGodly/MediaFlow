#!/usr/bin/env python3
"""Exercise v391 History itemized renderer + real CSS in Chromium."""
from pathlib import Path
import re
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
index=(R/'index.html').read_text()
css='\n'.join((R/p).read_text() for p in re.findall(r'href="(assets/css/[^"]+)"',index) if (R/p).exists())
js=(R/'assets/js/mediaflow-v396.bundle.js').read_text().rstrip()
assert js.endswith('})();')
assert js.count('function v269WeekHistoryHtml(g){')==1
js=js.replace('function v269WeekHistoryHtml(g){','''window.__history391={html:()=>{
  const units=Array.from({length:5},(_,i)=>({number:i+1,loggedAt:1791685800000+i*40000,durationSeconds:i===4?1089:3600,seasonName:'Season 1'}));
  const ev={item:{id:'sendokai',title:'Sendokai Champions'},cat:{id:'anime',name:'TV Series',unit:'episodes',type:'video'},row:{title:'Sendokai Champions',v369Units:units,qty:5},session:{id:'history-test',timestamp:1791685800000,minutes:298},minutes:298,qty:5,date:new Date(1791685800000)};
  return v269HistoryCardHtml(ev);
}};
function v269WeekHistoryHtml(g){''',1)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in [320,390,820,1280,1920]:
  page=b.new_page(viewport={'width':width,'height':900})
  page.set_content('<!DOCTYPE html><html><head><style>'+css+'</style></head><body style="margin:0;background:#13151b;color:white"><div id="app"></div><div class="v269-history-page"><div class="mf269-day-grid" id="grid"></div></div></body></html>')
  page.evaluate('''()=>{let m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}''')
  page.add_script_tag(content=js)
  page.evaluate('''()=>{const html=__history391.html(); const grid=document.querySelector('#grid');grid.innerHTML=html+'<article class="mf269-history-card"><button class="mf269-card-main">Other title</button></article>'; grid.querySelector('.v369-history-units').open=true;}''')
  result=page.evaluate('''()=>{const card=document.querySelector('.mf269-history-card'),details=card.querySelector('.v369-history-units'),main=card.querySelector('.mf269-card-main'),rows=[...card.querySelectorAll('.v369-history-unit')];const rect=e=>{let r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}};const d=rect(details),m=rect(main),c=rect(card);let fail=[];if (d.y<m.bottom-1)fail.push('details overlaps main');if(d.right>c.right+1||d.x<c.x-1)fail.push('details overflows card');for(const [i,r] of rows.entries()){let rr=rect(r),parts=[...r.children].map(rect);if(rr.h<32)fail.push('short row');if(i>0&&rr.y<rect(rows[i-1]).bottom)fail.push('overlapping rows');if(parts[0].right>parts[2].x+1&&parts[0].bottom>parts[2].y+1)fail.push('unit/duration overlap');if(parts[1].right>parts[2].x+1&&parts[1].y<parts[2].bottom&&parts[1].bottom>parts[2].y)fail.push('timestamp/duration overlap');}return {w:innerWidth,c,main:m,details:d,rows:rows.length,issues:fail,cols:getComputedStyle(document.querySelector('.mf269-day-grid')).gridTemplateColumns}}''')
  assert not result['issues'],result
  assert result['rows']==5,result
  print('PASS',result['w'],{k:result[k] for k in ('rows','cols','issues')},flush=True)
  if width==1280:
   (R/'docs').mkdir(exist_ok=True)
   page.locator("#grid").screenshot(path=str(R/'docs/v393-history-layout-1280.png'))
  page.close()
 b.close()
