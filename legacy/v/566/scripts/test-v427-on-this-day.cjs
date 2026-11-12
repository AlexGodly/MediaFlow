/* v427 Dashboard On This Day return-to-Dashboard regression.
 * Covers the actual renderer output and explicit visibility toggle. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const dashboard=fs.readFileSync('src/js/pages/dashboard/011-view-dashboard.js','utf8');
const anniversary=fs.readFileSync('src/js/pages/dashboard/062-v159-rotating-on-this-day-adaptive-cover-themes.js','utf8');
const visibility=fs.readFileSync('src/js/pages/dashboard/148-v223-on-this-day-dashboard-visibility.js','utf8');
const css=fs.readFileSync('assets/css/239-v427-on-this-day-restoration.css','utf8');
const index=fs.readFileSync('index.html','utf8');
const a=dashboard.indexOf('function mf427OnThisDayDashboardHtml(){'),b=dashboard.indexOf('\nfunction renderDashboard(){',a);
assert(a>=0&&b>a,'Canonical Dashboard must define the On This Day renderer');
const fn=dashboard.slice(a,b);
assert(dashboard.includes('${mf427OnThisDayDashboardHtml()}'),'Dashboard must explicitly render the On This Day section');
assert.equal(dashboard.split('${mf427OnThisDayDashboardHtml()}').length-1,1,'Only one On This Day card per Dashboard render');
assert(index.includes('assets/css/239-v427-on-this-day-restoration.css'),'Stylesheet must be loaded by GitHub Pages and the PWA');
assert(css.includes('var(--panel)')&&css.includes('var(--text)')&&css.includes('var(--flow)'),'Match MediaFlow dynamic theme');
assert(anniversary.includes('v159BuildOnThisDayModel()'),'Original History/lifecycle model is reused');
assert(anniversary.includes('v159ScheduleOtdRotation()'),'Rotating title and cover remain intact');
assert(visibility.includes('showOnThisDay===false'),'Original Dashboard setting is retained');
const state={settings:{v192Dashboard:{showOnThisDay:true}}};
let calls=0;const ctx={S:state,DEFAULT_SETTINGS:{},console,Date,
 escapeHtml:s=>String(s).replaceAll('<','&lt;'),
 renderOnThisDay:()=>{calls++;return '<details class="on-this-day v126-otd" data-mf-on-this-day-version="159"><summary>Past anniversary</summary></details>';},
 v192EnsureDashboardSettings:s=>s.v192Dashboard};
vm.createContext(ctx);vm.runInContext(fn,ctx);
const render=()=>vm.runInContext('mf427OnThisDayDashboardHtml()',ctx);
let html=render();
assert.match(html,/ON THIS DAY/);
assert.match(html,/Past anniversary/);
assert.equal(calls,1);
assert.equal(state.settings.v192Dashboard.showOnThisDay,true,'Nothing mutates saved user settings');
ctx.renderOnThisDay=()=>{calls++;return ''};
html=render();
assert.match(html,/No anniversaries for/,'Never silently disappear when today has no matching anniversary');
assert.match(html,/Browse History/,'Users can navigate to genuine History');
assert(!html.includes('Past anniversary'),'A blank day does not invent memories');
state.settings.v192Dashboard.showOnThisDay=false;
assert.equal(render(),'','Respect explicit Dashboard visibility preference');
assert.equal(calls,2,'Hidden cards must not query the expensive History model');
state.settings.v192Dashboard.showOnThisDay=true;
ctx.renderOnThisDay=()=>{throw new Error('provider/test synthetic failure')};
html=render();assert.match(html,/No anniversaries for/,'A rendering failure never removes the entire Dashboard section');
console.log('PASS: v427 On This Day visible with historical data, empty-day fallback, visibility opt-out, theme and v159 rotation contracts');
