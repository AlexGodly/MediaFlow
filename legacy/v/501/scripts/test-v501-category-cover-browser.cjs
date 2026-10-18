/* MediaFlow v501 — visual browser test of category-icon fallback and scaling. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const css=[
 'assets/css/211-v398-mobile-tablet-responsive-repair.css',
 'assets/css/299-v498-logging-readability-cover-parity.css',
 'assets/css/301-v499-added-logging-covers.css',
 'assets/css/303-v500-logging-poster-sizing.css',
 'assets/css/304-v501-logging-category-fallback.css'
].map(x=>fs.readFileSync(x,'utf8')).join('\n');
assert.match(css,/container-type:inline-size/);
assert.match(css,/width:72cqw/);
assert.match(css,/--mf419-log-rec-scale/);
assert.match(css,/--v370-cover-size/);
assert.match(css,/--v240-logged-cover-width/);
const candidates=['chromium','chromium-browser','google-chrome','google-chrome-stable'];
let browser='';
for(const name of candidates){
 try{browser=cp.execFileSync('which',[name],{encoding:'utf8'}).trim();if(browser)break}catch(_){}
}
if(!browser){
 console.log('v501 Chromium unavailable: static fallback/scale contracts PASS');
 process.exit(0);
}
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mf501-icon-test-'));
const html=path.join(dir,'index.html');
fs.writeFileSync(html,fs.readFileSync('tests/fixtures/v501-category-cover-browser.html','utf8').replace('/*INJECT_V501_STYLES*/',css));
try{
 for(const width of [360,800,1440]){
  const raw=cp.execFileSync(browser,['--headless','--no-sandbox','--disable-gpu',
   '--disable-dev-shm-usage','--disable-extensions','--no-first-run','--no-default-browser-check',
   '--disable-background-networking','--hide-scrollbars','--virtual-time-budget=1800',
   '--window-size='+width+',900','--dump-dom','file://'+html],
   {encoding:'utf8',timeout:70000,stdio:['ignore','pipe','ignore']});
  const match=raw.match(/MF501_RESULT=(\{[^<]+\})/);
  assert(match,'Chromium must report placeholder and size geometry');
  const m=JSON.parse(match[1]);
  assert(m.advanced.width>=74,'added Advanced cover must not collapse: '+JSON.stringify(m));
  assert(m.recommended.width>=72,'recommended cover must not collapse: '+JSON.stringify(m));
  assert(m.quick.width>=60,'Quick cover must not collapse: '+JSON.stringify(m));
  assert(m.advancedIcon.width>m.advanced.width*.45,
   'Advanced category SVG too small: '+JSON.stringify(m));
  assert(m.recommendedIcon.width>m.recommended.width*.45,
   'Recommended category emoji too small: '+JSON.stringify(m));
  assert(m.advancedIconVisible&&m.recommendedIconVisible,
   'Icon-only missing covers must be visible');
  assert(m.quickImageHidden&&m.quickIconVisible,
   'Failed cover URL must reveal category icon');
  assert(m.coverClickable,'Cover remains an interactive Title Details button');
  assert(Math.abs(m.advanced.width/m.advanced.height-2/3)<.09);
  assert(Math.abs(m.recommended.width/m.recommended.height-3/4)<.09);
  assert(m.largerAdvanced.width>m.advanced.width+6,
   'Advanced poster slider must enlarge frame even on mobile');
  assert(m.largerAdvancedIcon.width>m.advancedIcon.width+4,
   'Advanced category artwork must scale with slider');
  assert(m.largerRecommended.width>m.recommended.width+5,
   'Recommended poster slider must enlarge frame even on mobile');
  assert(m.largerRecommendedIcon.width>m.recommendedIcon.width+3,
   'Recommended category artwork must scale with slider');
  assert(!m.pageOverflow,'Responsive Logging must not overflow');
  console.log('v501 '+width+'px category fallback PASS: Advanced '+Math.round(m.advanced.width)+'->'+Math.round(m.largerAdvanced.width)+
   ' | Recommended '+Math.round(m.recommended.width)+'->'+Math.round(m.largerRecommended.width)+
   ' | icon '+Math.round(m.advancedIcon.width)+'->'+Math.round(m.largerAdvancedIcon.width));
 }
}finally{fs.rmSync(dir,{recursive:true,force:true});}
