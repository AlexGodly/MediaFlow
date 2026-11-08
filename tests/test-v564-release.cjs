/* v564 release contract: themes use their own colours by default. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const version=Number(read('VERSION').trim());
assert(version>=564);
const runtime=JSON.parse(read('src/js/runtime-order.json'));
assert(runtime.indexOf('components/407-v564-native-theme-default.js')>runtime.indexOf('components/406-v563-fixes.js'));
assert(read('index.html').includes(`mediaflow-v${version}.bundle.js`));
assert(/globalAppearanceEnabled: false/.test(read('src/js/core/constants/001-constants.js')),'new accounts start with the theme\'s own colours');
if(version===564){const wf=read('.github/workflows/publish-v564.yml');assert(wf.includes('gh release create 564')&&wf.includes('legacy/v/564'));}
assert(read('.github/workflows/deploy-pages.yml').includes('"Build archive and release MediaFlow v564"'));
const ctx={window:{},MediaFlowRuntime:{},saved:0,applied:[]};
vm.createContext(ctx);
vm.runInContext(`var S={settings:{theme:'sakura',globalAppearanceEnabled:true,appearanceMode:'dark'}};
function applyTheme(t){applied.push([t,S.settings.globalAppearanceEnabled]);}
function persistSettings(){saved++;}
${read('src/js/components/407-v564-native-theme-default.js')}
applyTheme('sakura');applyTheme('sakura');
S.settings.globalAppearanceEnabled=true;applyTheme('sakura');`,ctx);
assert.equal(ctx.applied[0][1],false,'existing accounts move to the theme\'s own colours once');
assert.equal(ctx.saved,1,'the move is saved once');
assert.equal(ctx.applied[2][1],true,'after that the switch is the user\'s');
assert.equal(ctx.S?.settings?.appearanceMode??'dark','dark');
console.log('v564 release contract passed');
