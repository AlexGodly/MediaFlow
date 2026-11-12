/* Real quick-save exercise: the selected cover URL must survive confirmation. */
'use strict';
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const source=fs.readFileSync('src/js/components/334-v453-quick-title-recovery.js','utf8');
const rows=[{id:'anime1',title:'Saved title',categoryId:'anime',coverUrl:'https://example.org/original.jpg',modifiedAt:1}];
let committed=null,mergeFailed=false,saveCount=0;
const env={
 console,Date,Math,Number,String,Array,Object,JSON,Promise,Map,Set,Error,setTimeout,clearTimeout,
 structuredClone,AbortController,window:{},document:{getElementById:()=>null,body:{append:()=>{}}},
 App:{mf447Open:()=>{}},MF453Quick:{},MF424:{running:false},MF439:{working:false},MF442:{process:''},
 S:{library:rows,settings:{},categories:[{id:'anime',name:'Anime'}]},
 mf439Item:id=>rows.find(x=>x.id===id),mf439Account:()=> 'account',mf424Image:async()=>true,
 mf444Confirm:async()=>true,mf456QuickProgress:()=>{},mf456NotifyRecoverySaved:()=>{},
 mf456RefreshEditor:()=>{},mf456CandidateLink:()=>({canLink:true,key:'anilist',id:'1036'}),mf439DescribeValue:(k,x)=>String(x||''),mf439Apply:(item,p)=>{
  if(mergeFailed)throw Error('provider merge failed');
  item.synopsis='New verified synopsis';return {changed:1};},
 mf425Icon:()=>'<svg></svg>',mf453Esc:String,mf453Category:()=>({name:'Anime'}),
 mf453Ready:()=>[],mf453ProvidersFor:()=>[],
 mf443EnsureGateway:async()=>null,mf442ProcessLease:()=>null,
 mf451Prepare:async()=>true,mf451Restore:async()=>true,
 mf424Discover:async()=>[],mf439Discover:async()=>({preview:{proposals:[]}}),
 persistLibrary:()=>{committed=structuredClone(rows)},
 saveState:async()=>{saveCount++;committed=structuredClone(rows)},
 v53InvalidateLibraryCache:()=>{},render:()=>{},
 showToast:()=>{}
};
vm.createContext(env);vm.runInContext(source,env,{filename:'quick-recovery.js'});
function prepare(kind,coverUrl,meta){
 vm.runInContext("MF453Quick.account='account';MF453Quick.current={id:'anime1',kind:"+JSON.stringify(kind)+
 ",covers:"+JSON.stringify([{url:coverUrl,provider:'anilist',confidence:.98,idMatch:true}])+
 ",coverIndex:0,coverLoading:false,metaLoading:false,applying:false,priority:false,"+
 "controller:new AbortController(),metadata:"+JSON.stringify(meta)+",errors:[],pending:[]};",env);
}
(async()=>{
 prepare('cover','https://example.org/cover-v455.jpg',null);
 await env.App.mf453ApplyQuick();
 assert.equal(rows[0].coverUrl,'https://example.org/cover-v455.jpg');
 assert.equal(rows[0].externalIds.anilist,'1036','Selected provider ID must be saved on title');
 assert.equal(committed?.[0]?.externalIds?.anilist,'1036','Selected ID must persist with cover URL');
 assert.equal(committed?.[0]?.coverUrl,'https://example.org/cover-v455.jpg','Committed Library must store updated URL');
 assert.equal(vm.runInContext('MF453Quick.current',env),null,'Dialog should close only after confirmed write');
 rows[0].coverUrl='https://example.org/cover-v455.jpg';
 mergeFailed=true;
 const proposal={results:1,proposals:[{token:'field.synopsis',selected:true}]};
 prepare('both','https://example.org/cover-next.jpg',{preview:proposal});
 await env.App.mf453ApplyQuick();
 assert.equal(rows[0].coverUrl,'https://example.org/cover-next.jpg','Metadata failure does not undo cover');
 assert.equal(committed?.[0]?.coverUrl,'https://example.org/cover-next.jpg','Cover committed despite metadata failure');
 assert(saveCount>=2);
 console.log('PASS v455 quick-save: explicit cover confirmation writes canonical coverUrl, persists to Library, and survives metadata merge failure');
})().catch(e=>{console.error(e);process.exitCode=1});
