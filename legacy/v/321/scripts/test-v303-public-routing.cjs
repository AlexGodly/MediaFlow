'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'src/js/components/231-v302-community.js'),'utf8');
function between(a,b){let from=source.indexOf(a);assert(from>=0,'missing '+a);let to=source.indexOf(b,from);assert(to>from,'missing '+b);return source.slice(from,to);}
const sections=[
 between('const MF302=', 'const mfEsc='),
 between('const mfRoot=', 'const mfNotice='),
 between('function mfUrlState(){','function mfShowPortal(){'),
 between('function mfGo(path){','function mfWorkspace(){'),
 ];
const context={location:{pathname:'/MediaFlow/'},window:{history:{pushState(_d,_t,url){context.location.pathname=url;}}},AUTH_USER:null,console,};
context.escapeHtml=(s)=>s;
context.mfEsc=(s)=>String(s);
let renders=0;context.mfShowPortal=()=>{renders++;};context.mfWorkspace=()=>{};context.mfLogin=()=>{};
vm.createContext(context);vm.runInContext(sections.join('\n'),context);vm.runInContext('MF302.go=mfGo;',context);
const cases={
 '/MediaFlow/':'home','/MediaFlow':'home','/MediaFlow/index.html':'home',
 '/MediaFlow/404.html':'home','/':'home','/index.html':'home',
 '/MediaFlow/browse':'browse','/MediaFlow/ratings':'ratings',
 '/MediaFlow/collections':'collections','/MediaFlow/users':'users',
 '/MediaFlow/workspace':'workspace','/MediaFlow/login':'login',
 '/MediaFlow/alexgodly':'profile','/MediaFlow/alexgodly/Collections/favorite-anime':'profile',
 '/MediaFlow/not-a-username!':'home'
};
let count=0;
for (const [uri,expected] of Object.entries(cases)){
 context.location.pathname=uri;
 const actual=vm.runInContext('mfUrlState()',context);
 assert.equal(actual,expected,`wrong initial route for ${uri}`);count++;
}
context.location.pathname='/MediaFlow/index.html';
assert.equal(vm.runInContext('mfUrlState()',context),'home');
for(const tab of ['browse','collections','ratings','users','']){
 vm.runInContext(`MF302.go(${JSON.stringify(tab)})`,context);
 const expected=tab||'home';
 assert.equal(vm.runInContext('MF302.page',context),expected,`bad page for ${tab}`);
 assert.equal(context.location.pathname,'/MediaFlow/'+tab);
 count++;
}
assert.equal(renders,5);
const html=vm.runInContext('mfPortalMarkup()',context);
assert(html.includes('assets/icons/mediaflow-192.png'),'MediaFlow brand logo missing');
assert(html.includes('MediaFlow logo'),'alt text missing');
for(const tab of ['browse','collections','ratings','users']){
 assert(html.includes(`data-mf303-target="${tab}"`),`missing public tab ${tab}`);
 assert(html.includes(`onclick="MF302.go('${tab}')"`),`broken handler for ${tab}`);
}
assert(/<svg\b/.test(html),'missing SVG icons');
assert(!/[◈◉♧♡✉]/.test(html),'placeholder glyph still in portal');
assert(html.includes('Log in'),'guest header does not show Log in');
context.AUTH_USER={id:'demo'};
const signedHTML=vm.runInContext('mfPortalMarkup()',context);
assert(signedHTML.includes('Workspace'),'authenticated header does not show Workspace');
for(const filename of ['index.html','404.html']){
 const h=fs.readFileSync(path.join(root,filename),'utf8');
 assert(h.includes('<base href="/MediaFlow/">'),`${filename} missing GitHub Pages asset base`);
 assert(h.includes('161-v303-community-navigation.css'),`${filename} missing v303 CSS`);
}
const css=fs.readFileSync(path.join(root,'assets/css/161-v303-community-navigation.css'),'utf8');
assert(css.includes('.mf302-brand img'),'missing logo styling');
console.log(`PASS: ${count} public route/navigation assertions; header/logo/icons, auth state, base href and assets verified.`);
