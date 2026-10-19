/* v528: prevent recursive XP-settings DOM insertion through MutationObserver. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const rootDir=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(rootDir,'src/js/components/378-v527-universal-media.js'),'utf8');
const start=src.indexOf('function v527AddUnitXPControls(root){');
const end=src.indexOf('function v527EnhanceNode(',start);
assert(start>=0&&end>start,'XP insertion helper remains discoverable');
const helper=src.slice(start,end);
assert(helper.includes("root.closest?.('.mf527-unit-xp')"),'Skip the injected frame itself');
assert(helper.includes("anchor.closest?.('.mf527-unit-xp')"),'Skip already-inserted input descendants');
const UNITS={sessions:{label:'sessions'},tracks:{label:'tracks'}};
const context=vm.createContext({
  UNITS,V527_NEW_UNITS:['sessions','tracks'],
  levelings:0,
  levelingSettings(){return {unitXP:{sessions:12,tracks:2}};},
  escapeHtml:x=>String(x),
  document:{createElement(){
    context.insertsCreated++;
    return {className:'',setAttribute(){},innerHTML:''};
  }},
  insertsCreated:0
});
vm.runInContext(helper,context);
function invoke(root){context.r=root;vm.runInContext('v527AddUnitXPControls(r)',context);}
const container={children:[],querySelector(s){return this.children.find(x=>x.className==='mf527-unit-xp')||null}};
const anchor={
  parentElement:container,
  closest:()=>null,
  insertAdjacentElement(_at,frame){container.children.push(frame);}
};
const originalInput={closest:()=>anchor};
const originalRoot={matches:()=>false,closest:()=>null,querySelectorAll:()=>[originalInput]};
invoke(originalRoot);
assert.equal(context.insertsCreated,1,'Original XP settings get precisely one extra block');
assert.equal(container.children.length,1);
const injectedFrame={...container.children[0],matches:()=>true,closest:()=>null,querySelectorAll:()=>[{closest:()=>anchor}]};
invoke(injectedFrame);
assert.equal(context.insertsCreated,1,'Observer must not recursively insert into its own added frame');
const nestedRoot={matches:()=>false,closest:()=>injectedFrame,querySelectorAll:()=>[{closest:()=>anchor}]};
invoke(nestedRoot);
assert.equal(context.insertsCreated,1,'Observer must not insert inside descendants of the added frame');
const injectedAnchor={parentElement:container,closest:()=>injectedFrame};
const laterRoot={matches:()=>false,closest:()=>null,querySelectorAll:()=>[originalInput,{closest:()=>injectedAnchor}]};
invoke(laterRoot);
assert.equal(context.insertsCreated,1,'Later body scans must not recurse through the extra XP fields');
const duplicateOriginalRoot={matches:()=>false,closest:()=>null,querySelectorAll:()=>[originalInput]};
invoke(duplicateOriginalRoot);
assert.equal(context.insertsCreated,1,'Existing extra settings block prevents duplicate creation');
console.log('PASS v528: XP controls added once; observer, nested re-renders and body scans cannot recursively multiply them.');
