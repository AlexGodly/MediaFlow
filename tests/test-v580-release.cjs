/* v580 release contract. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const version=Number(read('VERSION').trim());
assert(version>=580);
assert(JSON.parse(read('src/css-order.json')).some(r=>r.path==='assets/css/307-v580-release.css'));
assert(JSON.stringify(JSON.parse(read('src/js/runtime-order.json'))).includes('432-v580-advanced-parts.js'));
const js=read('src/js/components/432-v580-advanced-parts.js');
for(const s of ['App.mf580AdvSet','App.mf580AdvToggle','mf580SetPartUnits','mf580DecorateAdders','v370TitlePanelHtml=function','App.mf580UseTime','App.mf580BatchRuntimeToggle','renderBatchLog=function'])assert(js.includes(s),'v580 has '+s);
assert(read('src/js/components/427-v577-parts.js').includes("kind==='adv'"));
assert(JSON.stringify(JSON.parse(read('src/js/runtime-order.json'))).includes('433-v580-goal-xp.js'));
const goal=read('src/js/components/433-v580-goal-xp.js');
for(const s of ['MF580_GOAL_DEFAULT=Object.freeze({enabled:true,min:100,max:300,perExtra:10,extraCap:100})','mf580GoalXP','v150BaseSessionXP=function','mf537ProjectXP=function','mf574Project=function'])assert(goal.includes(s),'goal XP has '+s);
assert(read('index.html').includes(`mediaflow-v${version}.bundle.js`));
if(version===580){const wf=read('.github/workflows/publish-v580.yml');assert(wf.includes('gh release create 580')&&wf.includes('legacy/v/580'));}
assert(read('docs/release-v580.md').startsWith('## MediaFlow v580 Stable'));
assert(read('.github/workflows/deploy-pages.yml').includes('"Build archive and release MediaFlow v580"'));
console.log('v580 release contract passed');
