/* MediaFlow v475 — persistent login recovery on PWA upgrade.
 * Tests actual source-level auth init and update gate in an isolated VM. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'475');
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert.equal(order.at(-1),'components/362-v475-pwa-auth-transition-guard.js');
const core=fs.readFileSync('src/js/core/rendering/035-render-loop-init.js','utf8');
const begin=core.indexOf('const V475_AUTH='),end=core.indexOf('init();',begin);
assert(begin>=0&&end>begin,'Missing auth bootstrap fix');
const snippet=core.slice(begin,end+'init();'.length);
assert(!snippet.includes('onAuthStateChange(async'),'Must never await Supabase in auth-state callback');
assert(!snippet.includes("renderShell()"),'Auth bootstrap must delegate to protected Cloud loader');
const wait=async()=>new Promise(resolve=>setTimeout(resolve,20));
const tick=(fn)=>setTimeout(fn,0);
const userA={id:'owner-a',email:'a@example.test'};
function createAuthHarness(sessions=[userA],options={}){
 let callback=null,bootCount=0,getSessionCount=0,screenCount=0;
 const app={
   innerHTML:'<p>Booting</p>',
   querySelector(){return null;}
 };
 const harness={
  window:{},document:{getElementById:id=>id==='app'?app:null},
  escapeHtml:x=>String(x),AUTH_USER:null,AUTH_READY:false,V115_STARTUP_GUARD:true,
  supabase:{auth:{
    onAuthStateChange:fn=>{
      callback=fn;
      const ret=fn('INITIAL_SESSION',null);
      assert.equal(ret,undefined,'Supabase callback must synchronously return without awaiting');
      return {data:{subscription:{unsubscribe(){}}},error:null};
    },
    getSession:async()=>{
      const candidate=sessions[Math.min(getSessionCount,sessions.length-1)];
      getSessionCount++;
      return candidate?.id?{data:{session:{user:candidate}},error:null}:{data:{session:null},error:null};
    }
  }},
  v115SafeBootstrap:async()=>{
    bootCount++;
    assert(harness.AUTH_USER?.id,'Cloud must never load a null user');
    if(options.blockCloud)return false;
    harness.V115_STARTUP_GUARD=false;
    return true;
  },
  renderAuthScreen:()=>{screenCount++;app.innerHTML='<div class="auth-screen">Sign in</div>';},
  friendlyAuthError:x=>String(x),console:{error:()=>{},warn:()=>{}},
  setTimeout:fn=>tick(fn),Promise
 };
 const context=vm.createContext(harness);
 vm.runInContext(snippet,context,{filename:'v475-auth-runtime.js',timeout:5000});
 return {
  emit:(event,session)=>callback(event,session),
  get bootCount(){return bootCount;},
  get getSessionCount(){return getSessionCount;},
  get screenCount(){return screenCount;},
  app,context,get state(){return harness.window.MediaFlowAuthContinuity.state}
 };
}
(async()=>{
 // Initial persisted session arrives after two temporary null reads. No fake
 // empty Library, no login screen and never a second cloud bootstrap.
 const h=createAuthHarness([null,null,userA]);
 await wait();await wait();
 assert.equal(h.bootCount,1,'A restored account should bootstrap exactly once');
 assert.equal(h.context.AUTH_USER.id,userA.id);
 assert.equal(h.state.hydrated,true);
 assert.equal(h.context.V115_STARTUP_GUARD,false);
 assert.equal(h.screenCount,0,'Do not flash login while auth is restoring');
 h.emit('TOKEN_REFRESHED',{user:userA});
 h.emit('SIGNED_IN',{user:userA});
 await wait();
 assert.equal(h.bootCount,1,'Duplicate auth events must not reload cloud');
 // Explicit signout must guard writes and show login, not zero titles.
 h.emit('SIGNED_OUT',null);await wait();
 assert.equal(h.context.AUTH_READY,false);
 assert.equal(h.context.V115_STARTUP_GUARD,true);
 assert.equal(h.context.AUTH_USER,null);
 assert.equal(h.screenCount,1);
 h.emit('SIGNED_IN',{user:userA});await wait();
 assert.equal(h.bootCount,2,'Signing back in loads authenticated account');
 assert.equal(h.context.AUTH_USER.id,userA.id);
 assert.equal(h.context.V115_STARTUP_GUARD,false);
 // A blocked or failed cloud fetch never enables an empty workspace.
 const failed=createAuthHarness([userA],{blockCloud:true});
 await wait();
 assert.equal(failed.bootCount,1);
 assert.equal(failed.state.hydrated,false);
 assert.equal(failed.context.V115_STARTUP_GUARD,true);
 // Truly absent persisted sessions produce a login screen only after retries.
 const noSession=createAuthHarness([null,null,null,null,null]);
 await wait();await wait();
 assert.equal(noSession.bootCount,0);
 assert.equal(noSession.context.AUTH_READY,false);
 assert.equal(noSession.context.V115_STARTUP_GUARD,true);
 assert.equal(noSession.screenCount,1);
 // Update installer guard must not use an anonymous/partial account.
 const source=fs.readFileSync('src/js/components/362-v475-pwa-auth-transition-guard.js','utf8');
 let active=0,checked=0,saveOk=true;
 const ctx={
  AUTH_USER:null,AUTH_READY:false,V475_AUTH:{hydrated:false,restoring:true,bootPromise:null},
  V115_STARTUP_GUARD:true,App:{},window:{MediaFlowPWA:{}},MediaFlowRuntime:{},
  v246ReloadPwa:async()=>{active++;return true;},
  v244ApplyPwaUpdate:async()=>{active++;return true;},
  v248InstallLatestUpdate:async()=>{active++;return true;},
  v250SaveStateBeforeAppTransition:async()=>{checked++;return saveOk;},
  showToast:()=>{},console
 };
 vm.runInNewContext(source,ctx,{filename:'v475-guard.js'});
 assert.equal(await ctx.App.v246ReloadPwa(),false);
 assert.equal(await ctx.App.v244ApplyPwaUpdate(),false);
 assert.equal(await ctx.App.v248InstallLatestUpdate(false),false);
 assert.equal(active,0);
 assert.equal(checked,0);
 Object.assign(ctx,{AUTH_USER:userA,AUTH_READY:true,V115_STARTUP_GUARD:false});
 Object.assign(ctx.V475_AUTH,{hydrated:true,restoring:false,bootPromise:null});
 saveOk=false;
 assert.equal(await ctx.App.v246ReloadPwa(),false,'Failed cloud save must block PWA reload');
 assert.equal(active,0);
 saveOk=true;
 assert.equal(await ctx.App.v246ReloadPwa(),true);
 assert.equal(await ctx.App.v244ApplyPwaUpdate(),true);
 assert.equal(await ctx.App.v248InstallLatestUpdate(false),true);
 assert.equal(active,3);
 assert.equal(ctx.MediaFlowRuntime.version,475);
 console.log('PASS v475: delayed login restored, no blank workspace, single-flight cloud hydration, no auth deadlock, re-login safe, guard and update pre-save');
})().catch(err=>{console.error(err);process.exitCode=1;});
