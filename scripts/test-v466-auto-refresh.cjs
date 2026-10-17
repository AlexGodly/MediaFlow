/* v466 behavior contracts: schedule, verified changes, IDs, guarded cloud writes. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'466');
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert.equal(order.at(-1),'components/350-v466-auto-recommended-metadata-refresh.js');
const src=fs.readFileSync('src/js/components/350-v466-auto-recommended-metadata-refresh.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('assets/css/270-v466-auto-recommended-refresh.css','utf8');
const title={
 id:'anime-1',categoryId:'seasonal',title:'Example Anime',year:2026,status:'active',
 externalIds:{mal:'123'},
 universalMetadata:{updatedAt:1,
  externalRatings:{mal:{score:8.5,scale:10,votes:100,source:'jikan'},
   anilist:{score:80,scale:100,source:'manual'}},
  fields:{animeSeason:'Fall 2026'},
  provenance:{'rating.mal':{verified:true,source:'jikan',recordId:'123'},
   'rating.anilist':{verified:false,source:'manual'},
   'field.animeSeason':{verified:true,source:'anilist',recordId:'701'}},
  locks:{'rating.anilist':true}}
};
let saved=0,settingsSaved=0,requests=0,rendered=false,refreshCount=0,lease=false;
const S={settings:{exactTitleRecommendations:true},library:[title],currentTask:{libraryId:'anime-1',title:'Example Anime'},sessionActive:true,loading:false,view:'dashboard'};
const noop=()=>{};
const x={
 window:{addEventListener:noop},document:{querySelector:()=>null},navigator:{onLine:true},
 setInterval:()=>3,clearInterval:noop,setTimeout:()=>3,clearTimeout:noop,
 structuredClone:value=>JSON.parse(JSON.stringify(value)),
 Date,Math,Number,Object,Array,String,Promise,console,AbortController,
 AUTH_USER:{id:'test-account'},AUTH_READY:true,S,App:{},MediaFlowRuntime:{version:465,registerPageRenderer:noop},
 V219_PAGE_RENDERERS:new Map([['settings',()=>'<div class="mf404-recommendations-card"></div>']]),
 MF439:{working:false,account:''},MF424:{running:false},MF442:{process:'',owner:'test-owner'},MF453Quick:{current:null},
 MF439_PUBLIC:{jikan:{},anilist:{},kitsu:{}},MF439_GATEWAY:['tmdb'],V377_ID_PROVIDERS:[['mal'],['anilist'],['kitsu']],
 mf439Account:()=>x.AUTH_USER.id,
 mf439Item:id=>S.library.find(i=>String(i.id)===String(id)),
 mf395DashboardRecommendedItem:()=>S.library.find(i=>i.id===S.currentTask.libraryId),
 mf395DashboardRecommendationHtml:()=>'<section class="mf419-recommend-card"><div class="mf419-category-stats">Stats</div></section>',
 mf419Icon:()=>'<svg></svg>',escapeHtml:value=>String(value),
 mf464RatingsHtml:()=>'<section class="mf464-recommend-ratings">ratings</section>',
 mf439Preferences:()=>({enabled:['jikan','anilist','kitsu'],minimumConfidence:.94}),
 mf453Ready:()=>['jikan','anilist','kitsu'],
 mf442TitleSignature:item=>String(item.title)+'|'+String(item.categoryId)+'|'+String(item.externalIds.mal),
 mf442CoverLockIsActive:()=>false,mf442MetadataLockIsActive:()=>false,
 mf442AcquireProcess:()=>{x.MF442.process='metadata';return true},
 mf442ReleaseProcess:()=>{x.MF442.process=''},
 mf442ProcessOwned:()=>x.MF442.process==='metadata',
 mf439AcquireLease:()=>{lease=true;return true},
 mf439ReleaseLease:()=>{lease=false},
 mf442MetadataLeaseOwned:()=>lease,mf442RenewMetadataLease:()=>lease,
 mf439Evidence:(item,row)=>({confidence:row.confidence??1}),
 mf439Proposals:()=>({titleId:title.id,proposals:[]}),
 mf439Apply:()=>({changed:0,legacy:0,fields:0,ratings:0}),
 mf439Value:(token,val)=>token.startsWith('rating.')?val:val,
 mf439ValueKey:val=>val&&typeof val==='object'?JSON.stringify([val.score,val.scale,val.votes??null]):String(val),
 mf439FieldValue:(item,token)=>{
  const [kind,key]=token.split('.');
  return kind==='rating'?item.universalMetadata?.externalRatings?.[key]:
   kind==='field'?item.universalMetadata?.fields?.[key]:item[key];
 },
 mf439IsProtected:(item,token)=>item.universalMetadata?.locks?.[token]===true||
  item.universalMetadata?.provenance?.[token]?.source==='manual',
 mf439Has:value=>value!=null&&value!=='',
 mf437Normalized:env=>JSON.parse(JSON.stringify(env||{fields:{},externalRatings:{},provenance:{},locks:{}})),
 mf437SetRating:(env,key,val,opt)=>{
  if(env.locks['rating.'+key]||!opt.verified)return false;
  env.externalRatings[key]={...val,source:opt.source};return true;
 },
 mf437SetField:(env,key,val,opt)=>{
  if(env.locks['field.'+key]||!opt.verified)return false;
  env.fields[key]=val;return true;
 },
 MF439_LEGACY_FIELDS:{synopsis:true,genres:true},
 mf439Discover:async()=>{requests++;return {results:[],failures:[]}},
 saveState:async()=>{saved++;return true},
 persistSettings:()=>{settingsSaved++;return Promise.resolve()},
 v53InvalidateLibraryCache:noop,showToast:noop,
 renderShell:()=>{rendered=true;return 'shell'},
 v366RegisterSetting:noop
};
vm.createContext(x);vm.runInContext(src,x,{filename:'v466.js'});
const api=x.window.MediaFlowV466;
assert.equal(api.version,466);
assert.equal(x.MediaFlowRuntime.version,466);
assert.equal(api.prefs().hours,24);
assert(api.prefs().ratings&&api.prefs().metadata&&api.prefs().ids);
assert(api.autoDue(title));
S.settings.v466RecommendedRefreshState={['anime-1']:{lastAttempt:Date.now(),lastSuccess:Date.now(),success:1}};
assert(!api.autoDue(title),'Recent successful check is not due');
S.settings.v466RecommendedRefreshState['anime-1']={lastAttempt:Date.now()-3e6,lastSuccess:0,success:0};
assert(!api.autoDue(title),'Failed check backs off for at least an hour');
S.settings.v466RecommendedRefreshState['anime-1']={lastAttempt:Date.now()-5e6,lastSuccess:0,success:0};
assert(api.autoDue(title),'Failed check retries after an hour');
x.App.mf466Set('hours',6);assert.equal(api.prefs().hours,6);
x.App.mf466Set('hours',0);assert(!api.autoDue(title),'Off skips automatic schedule');
x.App.mf466Set('hours',24);
const prefHtml=api.settings();
assert(prefHtml.includes('Every 6 hours')&&prefHtml.includes('Every 24 hours'));
assert(prefHtml.includes('Refresh verified external ratings'));
assert(prefHtml.includes('completely closed'),'Clearly disclose open-tab limitation');
assert(api.status(title).includes('Refresh now'));
assert(api.providers(title).includes('jikan'));
assert(!api.providers(title).includes('tmdb'),'Not enabled or configured for this title');
const row=(provider,recordId,rating,extra={})=>({
 provider,recordId,title:title.title,year:2026,confidence:1,ratings:rating,
 fields:{},legacy:{},externalIds:{},...extra
});
const latest=row('jikan','123',{mal:{score:9.2,scale:10,votes:600}},
 {externalIds:{mal:'123',kitsu:'k55'}});
const before=title.rating;
let counts=api.apply(title,[latest],{ratings:true,metadata:true,ids:true});
assert.equal(counts.ratings,1);
assert.equal(counts.ids,1);
assert.equal(title.universalMetadata.externalRatings.mal.score,9.2,'Same verified provider can update score');
assert.equal(title.externalIds.kitsu,'k55','Missing verified ID was recovered');
assert.equal(title.externalIds.mal,'123','Existing external ID never replaced');
assert.equal(title.rating,before,'Personal score is never changed');
counts=api.apply(title,[row('jikan','wrong',{mal:{score:1,scale:10}})],{ratings:true,metadata:true,ids:false});
assert.equal(counts.ratings,0,'Existing source record ID mismatch must be ignored');
counts=api.apply(title,[row('anilist','701',{anilist:{score:95,scale:100}})],{ratings:true,metadata:false,ids:false});
assert.equal(counts.ratings,0,'Manually entered score may not be refreshed');
counts=api.apply(title,[row('jikan','123',{mal:{score:5,scale:10}},
 {externalIds:{kitsu:'other'}}),row('jikan','123',{mal:{score:9,scale:10}},
 {externalIds:{kitsu:'another'}})],{ratings:true,metadata:false,ids:true});
assert.equal(counts.ratings,0,'Conflicting provider scores skip auto-update');
assert.equal(title.externalIds.kitsu,'k55','Existing external ID never changed');
const legacy=row('anilist','701',{}, {fields:{animeSeason:'Winter 2027'}});
counts=api.apply(title,[legacy],{ratings:false,metadata:true,ids:false});
assert.equal(counts.metadata,1,'Provider-owned verified metadata can refresh from same record');
assert.equal(title.universalMetadata.fields.animeSeason,'Winter 2027');
const old=title.universalMetadata.fields.animeSeason;
counts=api.apply(title,[row('anilist','different',{}, {fields:{animeSeason:'Summer 2028'}})],
 {ratings:false,metadata:true,ids:false});
assert.equal(counts.metadata,0);
assert.equal(title.universalMetadata.fields.animeSeason,old,'Provider record ID mismatch preserves value');
(async()=>{
 S.settings.v466RecommendedRefreshState={};
 x.mf439Discover=async()=>{requests++;return {results:[latest],failures:[]}};
 const result=await api.refresh(true);
 assert(result.ok&&result.changed>=0,'Verified title gets successful check');
 assert.equal(saved,1,'Refresh checkpoints through one cloud save');
 assert.equal(x.MF442.process,'','Released shared process lock');
 assert.equal(lease,false,'Released metadata lease');
 assert.equal(x.MF439.working,false,'No stuck background worker');
 assert.equal(x.MF439.account,'','Recovery account state restored');
 assert(S.settings.v466RecommendedRefreshState['anime-1'].lastAttempt>0,'Cloud check timestamp stored');
 assert(!api.autoDue(title),'Scheduled refresh not repeated immediately');
 x.navigator.onLine=false;
 assert.equal((await api.refresh(true)).reason,'Offline; will retry when connected');
 assert.equal(saved,1,'Offline refresh makes no writes');
 assert.equal(title.rating,before);
 assert(html.includes('mediaflow-v466.bundle.js')&&html.includes('270-v466-auto-recommended-refresh.css'));
 assert.equal(JSON.parse(fs.readFileSync('version.json','utf8')).version,466);
 assert(css.includes('var(--flow)')&&css.includes('@media(max-width:390px)'));
 assert(!src.includes('item.rating='),'Never overwrite personal rating');
 console.log('PASS v466: automatic schedule, 1h backoff, per-title proof, rating updates, manual locks, IDs, cloud commit, offline');
})().catch(err=>{console.error(err);process.exitCode=1});
