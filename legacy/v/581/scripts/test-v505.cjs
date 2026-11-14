#!/usr/bin/env node
/* v505 responsive navigation regression contract: checks one physical
 * breakpoint in the real nav function, CSS guard and generated PWA. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const readcss=p=>read('assets/css/'+p);
const version=JSON.parse(read('version.json'));
assert.equal(read('VERSION').trim(),'505');
for(const key of ['version','appVersion','build'])assert.equal(version[key],505);
const html=read('index.html');
assert.match(html,/<meta name="mediaflow-version" content="505">/);
assert.match(html,/assets\/js\/mediaflow-v505\.bundle\.js/);
assert.match(html,/assets\/css\/286-v505-responsive-navigation-handoff\.css/);
assert.ok(html.lastIndexOf('286-v505-responsive-navigation-handoff.css')>html.lastIndexOf('234-v423-navigation-persistence-support.css'));
const source=read('src/js/components/306-v421-adaptive-navigation-filter.js');
const profile=read('src/js/components/307-v422-adaptive-navigation-details-support.js');
const bundle=read('assets/js/mediaflow-v505.bundle.js');
assert.ok(bundle.includes(source),'Deployed bundle must contain corrected v421 navigation source');
assert.ok(bundle.includes(profile),'Deployed bundle must contain corrected v422 popup source');
const testSnippet=source.match(/const MF421_NAV_BREAKPOINT=1080;\s*function mf421DeskAllowed\(\)\s*\{[\s\S]*?\}/);
assert.ok(testSnippet,'Navigation threshold and predicate must be defined together');
const context={window:{innerWidth:1400},document:{documentElement:{dataset:{v238Layout:'desktop'}}}};
vm.createContext(context);
const allow=vm.runInContext(testSnippet[0]+';mf421DeskAllowed',context);
const samples=[
 [320,false],[760,false],[860,false],[861,false],
 [1000,false],[1079,false],[1080,false],[1081,true],
 [1280,true],[1920,true]
];
for(const [width,expected] of samples){
 context.window.innerWidth=width;
 context.document.documentElement.dataset.v238Layout=width>1080?'tablet':'desktop';
 assert.equal(allow(),expected,'viewport '+width+'px must be '+(expected?'desktop':'mobile'));
}
// The saved navigation mode is never overwritten at a breakpoint.
assert.ok(source.includes("const mode=mf421Mode(),desk=mf421DeskAllowed()"));
assert.ok(source.includes("body.classList.toggle('mf421-desktop',desk)"));
assert.ok(source.includes("bar.hidden=true;bar.inert=true;mf421DropOpen=false"));
assert.ok(source.includes("bar.hidden=false;bar.inert=false"));
assert.ok(source.includes('mf421Drag=null;mf421Zones(false)'));
assert.ok(profile.includes("!mf421DeskAllowed()||!['top','bottom'].includes(mf421Mode())"));
assert.ok(profile.includes('if(popup)popup.hidden=true'));
for(const name of [
 '232-v421-adaptive-navigation-logging-select.css',
 '233-v422-navigation-details-profile-support.css',
 '234-v423-navigation-persistence-support.css'
]){
 const stylesheet=readcss(name);
 assert.ok(!stylesheet.includes('min-width:861px'),name+' still enables desktop at 861px');
 assert.ok(!stylesheet.includes('max-width:860px'),name+' still disables desktop only at 860px');
}
const css=readcss('286-v505-responsive-navigation-handoff.css');
assert.match(css,/@media\s*\(max-width:1080px\)/);
assert.match(css,/@media\s*\(min-width:1081px\)/);
for(const token of ['.sidebar.mf421-sidebar','.mf421-dock','.mobile-tabbar','.mf421-dropzones','#app','.main','display:none!important','display:flex!important']){
 assert.ok(css.includes(token),'Missing responsive nav guard: '+token);
}
const small=css.split('@media (min-width:1081px)')[0];
assert.ok(small.includes('html[data-v238-device-preference="desktop"]'));
assert.ok(/\.mf421-dock[^{]*\{[^}]*display:none!important/s.test(small),'Desktop dock not force hidden in mobile viewport');
assert.ok(/\.mobile-tabbar[^{]*\{[^}]*display:flex!important/s.test(small),'Mobile bottom bar not force shown');
assert.ok(/\.sidebar[^{]*\{[^}]*display:none!important/s.test(small),'Desktop sidebar not force hidden');
const sw=read('sw.js');
assert.ok(sw.includes('const MEDIAFLOW_VERSION=505;'));
assert.ok(sw.includes('mediaflow-pwa-v505-shell'));
assert.ok(sw.includes('./assets/js/mediaflow-v505.bundle.js'));
assert.ok(sw.includes('./assets/css/286-v505-responsive-navigation-handoff.css'));
console.log('PASS v505: single 1080px handoff, viewport widths, dock/sidebar exclusivity, saved desktop modes, PWA and archive metadata');
