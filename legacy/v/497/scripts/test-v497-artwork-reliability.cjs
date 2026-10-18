/* MediaFlow v495 — deterministic async cache / provenance regression. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const file='src/js/components/382-v495-artwork-reliability-cache.js';
const source=fs.readFileSync(file,'utf8');execFileSync('node',['--check',file]);
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert.equal(order.at(-1),'components/385-v497-living-visual-direction.js');
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'497');
assert.match(fs.readFileSync('index.html','utf8'),/mediaflow-v497\.bundle\.js/);
assert.match(fs.readFileSync('index.html','utf8'),/295-v495-artwork-reliability\.css/);
assert.match(fs.readFileSync('assets/css/295-v495-artwork-reliability.css','utf8'),/max-width:400px/);
let mode='advanced',applied=0,reads=0,deletes=0,refresh=0,custom=0;
let clock=1, profileUrl='https://covers.example/personal.jpg',profileSource='image';
const pending=new Map(),outcomes=new Map();
const good=(url)=>({visualCoverUrl:url,sourceIntegrity:'pixel-sampled',
 colors:['#8E40D7','#25BADA','#F0AE55'],analysisVersion:494,
 analysis:{sampledFromPixels:true,pixels:2400,dominantCoverage:.58,
 diversity:.7,separation:.33}});
const S={view:'settings',settings:{dynamicCoverTheme:true},
 v146DynamicThemeState:{url:'https://covers.example/a.jpg',
 palette:{mode:'dark'}}};
const MF487_STATE={last:null};
const ctx={
 S,MF487_STATE,V146_DYNAMIC_SEQ:1,MF484_CUSTOM_SEQ:1,
 MF485:{appliedKey:'old'},Date,Number,String,Object,Array,Map,Set,Math,JSON,Promise,console,
 mf484Prefs:()=>({mode}),
 mf484ActiveProfile:()=>({id:'profileA',source:profileSource,imageUrl:profileUrl}),
 mf487ValidUrl:val=>/^https:\/\/[a-z0-9./-]+$/i.test(String(val||''))?val:'',
 mf487Key:val=>'key-'+hash(val),
 v160HashString:val=>[hash(val),val.length],
 mf488FocusFor:()=> 'auto',mf493Settings:()=>({}),
 mf493Scope:(url,m)=>m+'-'+hash(url),
 mf489HexValid:hex=>/^#[0-9a-f]{6}$/i.test(hex||''),
 mf487CacheDelete:()=>{deletes++},
 mf484Analyze:url=>{
  reads++;
  if(outcomes.has(url)){
   const value=outcomes.get(url);
   if(value instanceof Error)throw value;
   MF487_STATE.last=value;
   return Promise.resolve(value);
  }
  return new Promise(resolve=>pending.set(url,val=>{MF487_STATE.last=val;resolve(val)}));
 },
 persistSettings:()=>{applied++},
 showToast:()=>{},escapeHtml:String,
 v146ScheduleDynamicTheme:()=>refresh++,
 mf484ApplyCustom:()=>custom++,
 window:{MediaFlowSettingsCenter:null},
 document:{getElementById:()=>null,querySelector:()=>null},
 MediaFlowRuntime:{registerPageEnhancer:()=>{},version:494},
 App:{}
};
function hash(s){let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619)>>>0;return n;}
vm.createContext(ctx);
vm.runInContext(source,ctx,{filename:'v495.js'});
const api=ctx.window.MediaFlowV495;assert.equal(api.version,495);
const A='https://covers.example/a.jpg',B='https://covers.example/b.jpg',
 C='https://covers.example/fail.jpg',D='https://covers.example/invalid.jpg';
(async()=>{
 // Pending coalescing shares a single pixel read and result.
 const p1=ctx.mf484Analyze(A),p2=ctx.mf484Analyze(A);
 assert.strictEqual(p1,p2,'Identical in-flight cover must use one promise');
 await Promise.resolve();assert.equal(reads,1);
 pending.get(A)(good(A));
 const value=await p1;assert(value&&api.verify(value,A));
 assert.strictEqual(await p2,value);
 assert.equal(api.status().successes,1);
 assert.equal(api.status().reads,1);
 assert(api.status().reused>=1);
 assert(api.status().current.confidence>0.5);
 assert(!JSON.stringify(api.status()).includes(A),'Health status cannot expose raw URL');
 // Different URLs must never accidentally receive the first URL's palette.
 const wrong=good(A);wrong.visualCoverUrl=A;
 outcomes.set(B,wrong);
 assert.strictEqual(await ctx.mf484Analyze(B),null);
 assert.equal(api.status().mismatches,1);
 assert.equal(api.status().current.lastSuccess>0,true);
 assert.equal(api.status().failures,1);
 // Missing/CORS sources return null and trigger a temporary cooldown.
 outcomes.set(C,null);
 const first=await ctx.mf484Analyze(C);assert.equal(first,null);
 const calls=reads;
 assert.strictEqual(await ctx.mf484Analyze(C),null);
 assert.equal(reads,calls,'Cooldown should skip same failing image without another request');
 assert(api.status().cooldowns>=1);
 S.v146DynamicThemeState.url=C;
 assert(api.status().current.retryRemainingMs>0,'User should see wait and reason');
 assert.equal(ctx.App.mf495ClearFailures(),true);
 assert.equal(api.status().current.retryRemainingMs,0);
 // Invalidating a particular cover retries without changing other source caches.
 assert.equal(ctx.App.mf495InvalidateCurrent(),true);
 assert.equal(refresh,1);
 assert.equal(deletes>=2,true);
 assert.equal(api.status().invalidated>=2,true);
 // Old async result from a replaced theme generation cannot replace latest.
 outcomes.delete(D);
 S.v146DynamicThemeState.url=D;
 const stale=ctx.mf484Analyze(D);await Promise.resolve();
 const oldData=MF487_STATE.last;
 ctx.V146_DYNAMIC_SEQ+=1;
 pending.get(D)(good(D));
 assert.strictEqual(await stale,null);
 assert.equal(api.status().stale,1);
 assert.notStrictEqual(MF487_STATE.last?.visualCoverUrl,D,'Stale read must not replace current sample');
 assert.strictEqual(MF487_STATE.last?.visualCoverUrl,A);
 // Explicit cache invalidation increments epoch even during pending work.
 S.v146DynamicThemeState.url=A;
 outcomes.delete(A);
 const outdated=ctx.mf484Analyze(A);
 await Promise.resolve();
 ctx.mf487CacheDelete(A);
 pending.get(A)(good(A));
 assert.strictEqual(await outdated,null,'Invalidated in-flight image cannot be applied');
 assert(api.status().stale>=2);
 // A later validated read for the same artwork succeeds safely.
 outcomes.set(A,good(A));
 assert(api.verify(await ctx.mf484Analyze(A),A));
 // Advanced and Custom health scopes remain separate.
 mode='custom';profileUrl=A;
 outcomes.set(A,good(A));
 assert(api.verify(await ctx.mf484Analyze(A),A));
 const customStatus=api.status();
 assert.equal(customStatus.mode,'custom');
 assert(customStatus.current?.successes>=1);
 assert.notEqual(api.fingerprint(A,'advanced'),api.fingerprint(A,'custom'));
 assert.equal(ctx.App.mf495InvalidateCurrent(),true);
 assert.equal(custom,1);
 profileSource='manual';
 assert.equal(api.status().currentSource,'');
 assert.equal(ctx.App.mf495InvalidateCurrent(),false);
 mode='legacy';
 const before=api.status().reads;
 assert.strictEqual(await ctx.mf484Analyze(A),outcomes.get(A),'Legacy delegates unchanged');
 assert.equal(api.status().reads,before);
 assert.equal(ctx.App.mf495ClearFailures(),false);
 // A failed requested cover never becomes fake successful pixels.
 mode='advanced';S.v146DynamicThemeState.url=D;
 outcomes.set(D,{colors:['#123456','#345678','#567890']});
 assert.equal(await ctx.mf484Analyze(D),null);
 assert.equal(api.status().verifiedCurrent,false);
 // Bounded metadata; source identity never stored as raw URL.
 assert(!/S\.library\s*=|S\.history\s*=|persistSettings\(/.test(source));
 console.log('PASS v495: deduplication, pixel provenance, invalid metadata, cooldown, stale generation/epoch, last-good, Custom/Legacy');
})().catch(e=>{console.error(e);process.exitCode=1;});
