/* MediaFlow v540: exercise rendered confirmation HTML and real v394 text.
 * Prevent literal slash-n sequences and identical circle-arrow button icons. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
const version=Number(read('VERSION').trim());
assert(version>=540,'This is a v540+ regression');
const dialog=read('src/js/components/234-v336-dialogs-active-time-analytics.js');
const bulk=read('src/js/components/288-v394-advanced-logging.js');
const iconSystem=read('src/js/components/157-v225-global-button-icons.js');
const bundle=read('assets/js/mediaflow-v'+version+'.bundle.js');
const css=read('assets/css/163-v336-dialogs-active-time-analytics.css');
assert(bundle.includes("confirmIcon:'replace'")&&bundle.includes("cancelIcon:'keep'"));
assert(iconSystem.includes("if([...el.querySelectorAll?.('svg')||[]].some(svg=>!svg.closest('.v225-btn-icon')))return null;"),
 'Auto icon detector must respect hand-authored SVG');
assert(css.includes('v336-dialog-semantic-actions')&&css.includes('max-width:390px'));
assert(dialog.includes('v336-dialog-action-icon'));
assert(dialog.includes('V336_DIALOG_ACTION_ICONS'));
const s=bulk.slice(bulk.indexOf('const titleName=cleanTitle(item.title'),bulk.indexOf('V539_SEASON_REPLACE_CONFIRM_PENDING=true;'));
assert(!s.includes('confirmIcon'),'Icon options should be outside message builder');
assert(!s.includes('\\\\n\\\\n'),'No double-escaped source newlines');
assert(s.includes('\\n\\n'),'Message must use normal JS newline escapes');
assert(s.includes("const subject=season?seasonName+' in '+titleName:titleName"),'Seasonless titles should not be labeled This title in Title');
assert(s.includes("(season?'Units in other seasons"),'No-season dialogs should not mention other seasons');
const helpers=dialog.slice(dialog.indexOf('function v336Icon('),dialog.indexOf('function v336CleanupDialog()'));
const runtime=dialog.slice(dialog.indexOf('function v336Dialog(options={}){'),dialog.indexOf('// Replace the browser confirm/alert'));
assert(helpers.includes('function v336ActionIcon('));
let root=null,cleanup=0;
const nodes=new Map();
const fakeButton={
  addEventListener(event,cb){this.listeners=this.listeners||{};this.listeners[event]=cb;},
  focus(){this.focused=true;}
};
const document={
 body:{appendChild(el){root=el;}},
 createElement(tag){
   assert.equal(tag,'div');
   return {
     id:null,innerHTML:'',
     querySelector(selector){
       if(selector==='.v336-dialog-overlay'){
         return {dataset:{v336CloseOverlay:'1'},addEventListener(){}};
       }
       if(!nodes.has(selector))nodes.set(selector,Object.create(fakeButton));
       return nodes.get(selector);
     }
   };
 },
 addEventListener(){},removeEventListener(){},
 getElementById(){return null;}
};
const ctx=vm.createContext({
 document,window:{},V336_DIALOG_ROOT_ID:'v336-dialog-root',requestAnimationFrame:()=>{},
 v336CleanupDialog:()=>{cleanup++;},v336HandleDialogEscape:()=>{},
 escapeHtml:s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'),
 Date,Number,String,Promise,Object,console
});
vm.runInContext(helpers+'\n'+runtime,ctx);
async function openTest(withIcons){
 const opts={title:'Replace detailed season entries?',
    cancelText:'Keep detailed entries',confirmText:'Replace season entries',tone:'warning'};
 if(withIcons){opts.cancelIcon='keep';opts.confirmIcon='replace';}
 const start=vm.runInContext('v336Confirm',ctx);
 const promise=start('You are changing detailed entries for VALORANT.\n\nOnly draft entries will change.',opts);
 assert(root?.innerHTML?.includes('VALORANT.'));
 assert(root.innerHTML.includes('VALORANT.<br><br>Only draft'), 'Real newlines must render as paragraphs');
 assert(!root.innerHTML.includes('\\n\\n'),'Literal backslash-n must never appear in dialog');
 if(withIcons){
   assert(root.innerHTML.includes('v336-dialog-semantic-actions'),'Scoped styled buttons required');
   const cancel=root.innerHTML.match(/<button[^>]*data-v336-dialog-cancel[^>]*>([\s\S]*?)<\/button>/)?.[1];
   const confirm=root.innerHTML.match(/<button[^>]*data-v336-dialog-confirm[^>]*>([\s\S]*?)<\/button>/)?.[1];
   assert(cancel?.includes('v336-dialog-action-icon')&&confirm?.includes('v336-dialog-action-icon'));
   assert(cancel.includes('M12 22s8-4'),'Keep action must show a shield-check');
   assert(confirm.includes('M4 6h12'),'Replace action must show list-edit icon');
   assert(!cancel.includes('v225-btn-icon')&&!confirm.includes('v225-btn-icon'),'No generic circle-arrow artwork');
   assert.equal((cancel.match(/<svg/g)||[]).length,1,'Keep must have exactly one icon');
   assert.equal((confirm.match(/<svg/g)||[]).length,1,'Replace must have exactly one icon');
 }else{
   assert(!root.innerHTML.includes('v336-dialog-semantic-actions'),'Other dialog layouts remain unchanged');
 }
 nodes.get('[data-v336-dialog-cancel]').listeners.click();
 assert.equal(await promise,false,'Cancel resolves safely');
}
(async()=>{
 await openTest(true);
 await openTest(false);
 assert(cleanup>=2);
 console.log('PASS v540: real paragraph spacing, safe VALORANT wording, meaningful keep/replace icons, no circle arrows or duplicate icons, mobile layout and cancel safety.');
})().catch(e=>{console.error(e);process.exitCode=1});
