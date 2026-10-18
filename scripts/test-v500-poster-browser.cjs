/* MediaFlow v500 — browser geometry regression for added Logging covers.
 * Uses installed Chromium/Chrome when available; no npm dependency, network,
 * account, real Library data or application-side persistence.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const cp=require('node:child_process');
const styles=[
 'assets/css/211-v398-mobile-tablet-responsive-repair.css',
 'assets/css/299-v498-logging-readability-cover-parity.css',
 'assets/css/301-v500-added-logging-covers.css',
 'assets/css/302-v500-ambient-motion-corrections.css'
].map(name=>fs.readFileSync(name,'utf8')).join('\n');
assert.match(styles,/align-self:start!important/);
assert.match(styles,/min-height:0!important/);
assert.match(styles,/mf500-advanced-poster/);
assert.match(styles,/mf500-quick-poster/);
assert.match(styles,/mf500-recommended-poster/);
assert.match(styles,/object-fit:contain!important/);
assert.match(styles,/v370-cover-size/);
assert.match(styles,/v240-logged-cover-width/);
const browsers=['chromium','chromium-browser','google-chrome','google-chrome-stable'];
let browser='';
for(const name of browsers){
 try{browser=cp.execFileSync('which',[name],{encoding:'utf8'}).trim();if(browser)break;}catch(_){}
}
if(!browser){
 console.log('v500 browser geometry check unavailable (no installed Chromium); CSS contracts PASS');
 process.exit(0);
}
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mf499-geometry-'));
const html=path.join(dir,'index.html');
const source=fs.readFileSync('tests/fixtures/v500-logging-poster-geometry.html','utf8');
fs.writeFileSync(html,source.replace('/*INJECT_V500_STYLES*/',styles));
try{
 for(const width of [340,600,1000]){
  const output=cp.execFileSync(browser,[
    '--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
    '--disable-background-networking','--hide-scrollbars',
    '--virtual-time-budget=1000','--window-size='+width+',900','--dump-dom','file://'+html
  ],{encoding:'utf8',timeout:25000,stdio:['ignore','pipe','ignore']});
  const match=output.match(/MF499_RESULT=(\{[^<]+\})/);
  assert(match,'Chromium must return measured card geometry');
  const m=JSON.parse(match[1]);
  const ratio=m.advanced.width/m.advanced.height;
  const quickRatio=m.quick.width/m.quick.height;
  assert(Math.abs(ratio-(2/3))<.08,'Advanced '+width+': distorted aspect '+ratio+' '+JSON.stringify(m.advanced));
  assert(Math.abs(quickRatio-(2/3))<.08,'Quick '+width+': distorted aspect '+quickRatio);
  assert(m.advanced.width >= (width<440?75:width<1020?100:116),'Advanced cover is too small at '+width+': '+JSON.stringify(m.advanced));
  assert(m.advanced.height<330,'Advanced '+width+': poster stretched to grid preview');
  assert(m.quick.width >= (width<440?65:width<1020?72:76),'Quick cover too small at '+width+': '+JSON.stringify(m.quick));
  assert(m.recommended.width >= (width<440?72:85),'Recommended cover too small at '+width+': '+JSON.stringify(m.recommended));
  assert(Math.abs(m.recommended.width/m.recommended.height-3/4)<.09,'Recommended cover ratio incorrect');
  assert.equal(m.iconOverlay,false,'No circled action icon may overlay the cover');
  assert(m.gridHeight>m.advanced.height+40,'Fixture must challenge cover with taller progress rows');
  assert.equal(m.objectFit,'contain','Full artwork must remain visible');
  assert.equal(m.clickable,true,'Advanced cover retains Title Details button semantics');
  assert.equal(m.hasOverflow,false,'No horizontal overflow on responsive Logging stage');
  console.log('v500 browser '+width+'px PASS: advanced '+Math.round(m.advanced.width)+'x'+Math.round(m.advanced.height)+
   ', quick '+Math.round(m.quick.width)+'x'+Math.round(m.quick.height)+', recommended '+Math.round(m.recommended.width)+'x'+Math.round(m.recommended.height));
 }
}finally{fs.rmSync(dir,{recursive:true,force:true});}
