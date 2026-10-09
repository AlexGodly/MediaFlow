import fs from 'node:fs';import vm from 'node:vm';import zlib from 'node:zlib';import assert from 'node:assert/strict';
let code=fs.readFileSync(new URL('../_tmp/index.js',import.meta.url),'utf8').replace(/import \{ createClient \} from 'jsr:[^']+';/,'');
const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
const lib=[{id:'an',title:'REAL OWNER MEDIA',status:'active',rating:8.5,coverUrl:'https://example.com/a.jpg',externalIds:{mal:'1001'},total:12}];
const stateA={library:lib,sessions:[{id:'s',status:'logged',xp:100}],xpLedger:{libraryAdditions:{an:50}},collections:[{id:'collection-1',title:'REAL OWNER COLLECTION',titleIds:['an'],updatedAt:Date.now()}]},stateB={library:[{id:'pr',title:'PRIVATE ANIME',rating:1,externalIds:{mal:'1001'}}],sessions:[],collections:[]};
const compressed=s=>({__mediaflowCompressed:'gzip',data:zlib.gzipSync(Buffer.from(JSON.stringify(s))).toString('base64')});
const data={mf_public_profiles:[{user_id:a,username:'auser',display_name:'A',is_public:true,show_library:true,show_xp:true,show_usage_time:true,profile_v323:{favorites:[{id:'an'}]}},{user_id:b,username:'buser',display_name:'B',is_public:true,show_library:false,show_xp:false,profile_v323:{favorites:[]}}],mediaflow_states:[{user_id:a,state_data:compressed(stateA),updated_at:new Date().toISOString()},{user_id:b,state_data:compressed(stateB),updated_at:new Date().toISOString()}],mf_collection_shares_v328:[{user_id:a,collection_id:'collection-1'}],mf_time_xp_v316:[{user_id:a,xp_total:25}],mf_app_usage:[{user_id:a,seconds:300}]};
const calls=[];let handler;
function query(table){let rows=[...(data[table]||[])],filters=[];const o={select(){return o},eq(k,v){filters.push(x=>x[k]===v);return o},in(k,ids){filters.push(x=>ids.includes(x[k]));return o},range(start,end){calls.push(table);const t=rows.filter(x=>filters.every(f=>f(x)));return Promise.resolve({data:t.slice(start,end+1),error:null})},maybeSingle(){calls.push(table);return Promise.resolve({data:rows.filter(x=>filters.every(f=>f(x)))[0]||null,error:null})},then(resolve,reject){calls.push(table);return Promise.resolve({data:rows.filter(x=>filters.every(f=>f(x))),error:null}).then(resolve,reject)}};return o;}
const context={Deno:{env:{get:()=>''},serve:fn=>handler=fn},createClient:()=>({from:query}),Request,Response,Blob,DecompressionStream,Uint8Array,URL,atob,console};
vm.runInNewContext(code,context,{timeout:25000});
async function ask(action,p={}){const qs=new URLSearchParams({action,...p});const response=await handler(new Request('https://example.test/?'+qs));return {status:response.status,body:await response.json()};}
let n=0;const test=(truth,label)=>{assert.ok(truth,label);n++};
let r=await ask('count');test(r.status===200&&r.body.count===1,'only opted-in public Library in catalog');
r=await ask('browse');test(r.body.items.length===1,'one canonical id');test(r.body.items[0].users_count===1,'hidden owner not counted');test(r.body.items[0].title==='REAL OWNER MEDIA','real live title');test(!JSON.stringify(r.body).includes('PRIVATE ANIME'),'no private media leaks');
r=await ask('ratings');test(r.body.items.length===1&&r.body.items[0].average_rating===8.5,'live-only ratings');
r=await ask('collections');test(r.body.items.length===1,'only explicitly shared collection');test(r.body.items[0].title==='REAL OWNER COLLECTION','live collection name');test(r.body.items[0].items[0].title==='REAL OWNER MEDIA','live collection item');
r=await ask('collection',{owner:a,id:'collection-1'});test(r.status===200&&r.body.collection.items.length===1,'live collection detail');
r=await ask('collection',{owner:b,id:'unshared'});test(r.status===404,'private collection refused');
r=await ask('users');test(r.body.items.length===2,'public people visible');let pu=r.body.items.find(x=>x.user_id===a);let pr=r.body.items.find(x=>x.user_id===b);test(pu.xp_total===175,'owner xp includes original sessions additions and time ledger');test(pr.xp_total===null,'hidden xp denied');test(pu.library_titles===1&&pr.library_titles===null,'library count privacy');
r=await ask('profile_metrics',{owner:a});test(r.body.xp_total===175,'live XP profile');r=await ask('profile_metrics',{owner:b});test(r.body.xp_total===undefined,'XP-private profile denied');
r=await ask('favorites',{owner:a});test(r.body.items.length===1&&r.body.items[0].title==='REAL OWNER MEDIA','favorite ID resolves from original');
r=await ask('invalid');test(r.status===400,'invalid route forbidden');
test(calls.filter(x=>x==='mf_public_library'||x==='mf_public_collections'||x==='mf_public_statistics').length===0,'no duplicated media table queries');
console.log('v328 Community Edge API mocked original source:',n,'checks PASS');
