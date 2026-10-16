/* MediaFlow v432 — explicit regression for the REAL source of the
   circled-chevron: the account/avatar BUTTON, not the Level/Streak badge. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=path=>fs.readFileSync(path,'utf8');
assert(['432','433','434','435','436','437','438','439','440','441','442','443','444','445','446','447','448','449'].includes(read('VERSION').trim()));
const old=read('src/js/components/157-v225-global-button-icons.js');
const semantic=read('src/js/components/158-v226-semantic-icons-dropdowns.js');
const avatar=read('src/js/components/308-v423-navigation-restore-donation-polish.js');
const css=read('assets/css/242-v432-account-avatar-icon-cleanup.css');
const extract=(text,start,end)=>{const a=text.indexOf(start),b=text.indexOf(end,a+start.length);assert(a>=0&&b>a,'Missing function '+start);return text.slice(a,b)};
const eligible=extract(old,'function v225IconEligible(el){','\nfunction v225StripLegacyActionGlyphs');
const classifier=extract(old,'function v225ButtonIconName(el){','\nfunction v225IconEligible');
const semanticClassification=extract(semantic,'v225ButtonIconName=function(el){','\n/* ---------- Native dropdown icons');
assert(eligible.includes("'.mf421-dock-progress,.mf421-dock-account'"));
assert(classifier.includes("'.mf421-dock-progress,.mf421-dock-account'"));
assert(semanticClassification.includes("'.mf421-dock-progress,.mf421-dock-account'"));
const sandbox={};vm.createContext(sandbox);
vm.runInContext(eligible,sandbox);
vm.runInContext(classifier,sandbox);
for(const name of ['mf421-dock-account','mf421-dock-progress']){
  const el={nodeType:1,dataset:{},matches:query=>query.split(',').some(k=>k.trim()==='.'+name)};
  assert.equal(sandbox.v225IconEligible(el),false,name+' cannot get v225 generic action icon');
  assert.equal(sandbox.v225ButtonIconName(el),null,name+' cannot be assigned action icon');
}
assert(semantic.includes("if(el.matches?.('.mf421-dock-progress,.mf421-dock-account')){"),'v226 must remove stale icon wrappers');
assert(avatar.includes("button.querySelectorAll(':scope > .v225-btn-icon').forEach(icon=>icon.remove())"),'Avatar cleanup removes actual extra node');
assert(avatar.includes("child?.matches('img.mf423-dock-avatar')"),'Renderer checks that one real image remains');
assert(avatar.includes("mf423UpdateAvatar(document.querySelector('.mf421-dock-account'))"),'Mutation observer handles avatar insertions');
assert(css.includes('.mf421-dock-account > .v225-btn-icon'),'CSS fallback covers the actual avatar button');
assert(!css.includes('.mf421-dock-progress'),'v432 targets the correct button');
console.log('PASS v432 root cause: Account avatar excluded from generic+semantic icon pass, stale wrappers cleaned, fallback CSS');
