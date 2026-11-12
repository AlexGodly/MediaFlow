/* v567 release contract (runs in CI without a browser). */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const version=Number(read('VERSION').trim());
assert(version>=567);
// Official platform logos, used as masks and filled with the theme colour.
for(const f of ['windows','android','ios','web'])assert(fs.existsSync(path.join(root,'assets/icons/platforms/'+f+'.png')),f+' logo is in the repo');
const get=read('src/js/components/416-v566-get-mediaflow.js');
for(const f of ['windows','android','ios','web'])assert(get.includes("assets/icons/platforms/"+f+".png"),f+' logo is used');
assert(get.includes('mf567-logo'),'logos render as theme-tinted masks');
const css=read('assets/css/299-v567-release.css');
assert(/\.mf567-logo\{[^}]*mask:var\(--mf567-logo\)/.test(css)&&/background:var\(--flow/.test(css),'mask filled with the theme colour');
assert(JSON.parse(read('src/css-order.json')).some(r=>r.path==='assets/css/299-v567-release.css'));
// Same-day logs keep their save time; other days are re-dated (website and app).
assert(/if\(session\.date!==key\)\{/.test(read('src/js/components/418-v566-log-times.js')),'single-day logs only change when the day differs');
assert(read('index.html').includes(`mediaflow-v${version}.bundle.js`));
if(version===567){const wf=read('.github/workflows/publish-v567.yml');assert(wf.includes('gh release create 567')&&wf.includes('legacy/v/567'));}
assert(read('docs/release-v567.md').startsWith('## MediaFlow v567 Stable'),'release notes exist for the publish step');
assert(read('.github/workflows/deploy-pages.yml').includes('"Build archive and release MediaFlow v567"'));
console.log('v567 release contract passed');
