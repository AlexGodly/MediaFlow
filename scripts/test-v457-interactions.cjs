/* v457: confirmed quick saves dismiss the matching Edit Title, never Cancel. */
'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const s=fs.readFileSync('src/js/components/341-v457-recovery-interaction-fixes.js','utf8');
assert(['457','458','459'].includes(fs.readFileSync('VERSION','utf8').trim()));
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert(order.includes('components/341-v457-recovery-interaction-fixes.js'));
const listeners={};let closes=0,quickCloses=0;
const state={type:'library',data:{id:'media-1'}};
const env={
 console,Promise,Number,String,Date,Error,
 window:{scrollX:0,scrollY:0,scrollTo:()=>{}},
 document:{addEventListener:(name,fn)=>{listeners[name]=fn;},getElementById:()=>null},
 MF453Quick:{current:null},MF447:{active:'cover'},MF445:{mode:'cover'},
 MF455:{launching:false},S:{modal:state},
 mf453CloseQuick:async function(){quickCloses++;env.MF453Quick.current=null;},
 mf445Panel:()=>{},mf455UpdateProviderUI:()=>{},
 mf425Icon:()=>'<svg></svg>',mf456LaunchStage:()=>{},showToast:()=>{},
 App:{closeModal(){closes++;env.S.modal=null;},mf447Open:()=>{}},
};
vm.createContext(env);vm.runInContext(s,env,{filename:'v457-interactions.js'});
assert.equal(env.window.MediaFlowV457.version,457);
assert.equal(typeof listeners['mediaflow:title-recovered'],'function');
(async()=>{
 env.S.modal={type:'library',data:{id:'media-1'}};
 env.MF453Quick.current={id:'media-1',closed:false};
 await env.App.mf453CloseQuick();
 assert.equal(closes,0,'Cancel must keep Edit Title open');
 env.MF453Quick.current={id:'media-1',closed:false};
 listeners['mediaflow:title-recovered']({detail:{id:'media-1',coverCount:1,metadataCount:0}});
 await env.App.mf453CloseQuick();
 assert.equal(closes,1,'Confirmed cover save must close Edit Title');
 env.S.modal={type:'library',data:{id:'media-2'}};
 env.MF453Quick.current={id:'media-1',closed:false};
 listeners['mediaflow:title-recovered']({detail:{id:'media-1',coverCount:0,metadataCount:2}});
 await env.App.mf453CloseQuick();
 assert.equal(closes,1,'Never close a different title');
 env.S.modal={type:'library',data:{id:'media-1'}};
 env.MF453Quick.current={id:'media-1',closed:false};
 listeners['mediaflow:title-recovered']({detail:{id:'media-1',coverCount:0,metadataCount:1}});
 await env.App.mf453CloseQuick();
 assert.equal(closes,2,'Metadata-only confirmed save must close editor');
 console.log('PASS v457: matching editor closed only on committed Quick Cover, Metadata and Both saves');
})().catch(e=>{console.error(e);process.exitCode=1;});
