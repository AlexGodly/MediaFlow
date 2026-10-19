#!/usr/bin/env node
/* v506: execute the actual auth coordinator / guard in an isolated VM.
 * Never uses a real account, network, token, or cloud writes. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const core=read('src/js/core/rendering/035-render-loop-init.js');
const stateGuard=read('src/js/services/cloud-sync/004-v115-cloud-data-loss-prevention-recovery-guard.js');
const constants=read('src/js/core/constants/001-constants.js');
const header=core.indexOf('/* MediaFlow v506 — verified authentication continuity.');
const end=core.indexOf('\ninit();',header);
assert.ok(header>0&&end>header);
const coordinator=core.slice(header,end);
assert.match(constants,/V475_AUTH\.logoutRequested=true/);
assert.match(constants,/v506CompleteExplicitLogout/);
assert.match(core,/setTimeout\(\(\)=>v475HandleAuthEvent\(event,session\),0\)/);
assert.ok(!coordinator.includes('await supabase.auth.getUser()'));
assert.ok(!coordinator.includes('localStorage.removeItem'));
assert.match(stateGuard,/if\(String\(AUTH_USER\?\.id\|\|''\)!==userId\|\|V475_AUTH\.logoutRequested\)/);
assert.match(stateGuard,/return await v115StartWithData\(cloud.state\)===true;/);
const version=JSON.parse(read('version.json'));
assert.equal(read('VERSION').trim(),'506');
for(const key of ['version','appVersion','build'])assert.equal(version[key],506);
assert.match(read('index.html'),/mediaflow-v506\.bundle\.js/);
const bundle=read('assets/js/mediaflow-v506.bundle.js');
assert.ok(bundle.includes(coordinator));
assert.match(read('sw.js'),/const MEDIAFLOW_VERSION=506;/);
assert.match(read('sw.js'),/mediaflow-pwa-v506-shell/);
assert.match(read('sw.js'),/\.\/assets\/js\/mediaflow-v506\.bundle\.js/);

function setup({getSession,hasStoredSession=false,bootstrap}={}){
 let logins=0,boots=0,workspaces=0;
 const app={innerHTML:'',querySelector(){return null;}};
 const page={getElementById(){return app;}};
 const sessionUser={id:'acct1',email:'user@example.invalid'};
 const client={auth:{getSession:getSession||(async()=>({data:{session:{user:sessionUser}},error:null})),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}},error:null})}};
 const sandbox={
  AUTH_USER:null,AUTH_READY:false,V115_STARTUP_GUARD:true,
  SUPABASE_URL:'https://testproj.supabase.co',
  localStorage:{getItem(key){return hasStoredSession&&key==='sb-testproj-auth-token'?'present':null}},
  URL,supabase:client,window:{},document:page,
  escapeHtml:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;'),
  renderAuthScreen(){logins++},v115SafeBootstrap:async()=>{boots++;const ok=bootstrap?await bootstrap(sandbox):true;if(ok)sandbox.V115_STARTUP_GUARD=false;return ok;},
  console:{error(){},warn(){}},
  setTimeout:fn=>{queueMicrotask(fn);return 1;},
  Date,Promise
 };
 vm.createContext(sandbox);
 vm.runInContext(coordinator,sandbox,{filename:'035-render-loop-init.js'});
 return {sandbox,app,sessionUser,loginCount:()=>logins,bootCount:()=>boots,workspaceCount:()=>workspaces,
  state:()=>vm.runInContext('V475_AUTH',sandbox),eval:code=>vm.runInContext(code,sandbox)};
}
async function run(){
 // 1. Transient null getSession values and a SIGNED_OUT callback during
 //    startup must not present a blank workspace or force another login.
 let attempts=0;
 let env=setup({hasStoredSession:true,getSession:async()=>{
   attempts++;
   return {data:{session:attempts<3?null:{user:{id:'acct1'}}},error:null};
 }});
 const restore=env.eval('v475RestoreSavedSession()');
 env.eval("v475HandleAuthEvent('SIGNED_OUT',null)");
 assert.equal(await restore,true);
 assert.equal(attempts,3);
 assert.equal(env.loginCount(),0);
 assert.equal(env.bootCount(),1);
 assert.equal(env.state().hydrated,true);
 assert.equal(env.sandbox.AUTH_USER.id,'acct1');
 assert.equal(env.sandbox.V115_STARTUP_GUARD,false);

 // 2. Supabase returns null but a persisted session hint remains:
 //    never treat this as a new/empty cloud account or delete storage.
 env=setup({hasStoredSession:true,getSession:async()=>({data:{session:null},error:null})});
 assert.equal(await env.eval('v475RestoreSavedSession()'),false);
 assert.equal(env.loginCount(),0);
 assert.equal(env.sandbox.V115_STARTUP_GUARD,true);
 assert.match(env.app.innerHTML,/temporarily unavailable/);
 assert.match(env.app.innerHTML,/Retry restoring my account/);

 // 3. Fresh login, no local session and no saved hint should open login
 //    (without calling the cloud bootstrap with undefined account).
 env=setup({getSession:async()=>({data:{session:null},error:null})});
 assert.equal(await env.eval('v475RestoreSavedSession()'),false);
 assert.equal(env.loginCount(),1);
 assert.equal(env.bootCount(),0);
 assert.equal(env.sandbox.V115_STARTUP_GUARD,true);

 // 4. A transient SIGNED_OUT after prior hydration revalidates instead of
 //    immediately rendering Log In or overwriting the account with defaults.
 env=setup();
 assert.equal(await env.eval('v475RestoreSavedSession()'),true);
 assert.equal(env.loginCount(),0);
 env.eval("v475HandleAuthEvent('SIGNED_OUT',null)");
 const recoveryPromise=env.state().restorePromise;
 if(recoveryPromise)assert.equal(await recoveryPromise,true);
 assert.equal(env.loginCount(),0);
 assert.equal(env.sandbox.AUTH_USER.id,'acct1');
 assert.equal(env.state().hydrated,true);

 // 5. Only a user initiated sign out is immediate, and delayed duplicate
 //    SIGNED_OUT events cannot re-open session recovery.
 env=setup();
 assert.equal(await env.eval('v475RestoreSavedSession()'),true);
 env.state().logoutRequested=true;
 env.eval("v475HandleAuthEvent('SIGNED_OUT',null)");
 assert.equal(env.loginCount(),1);
 assert.equal(env.sandbox.AUTH_USER,null);
 assert.equal(env.sandbox.V115_STARTUP_GUARD,true);
 env.eval("v475HandleAuthEvent('SIGNED_OUT',null)");
 assert.equal(env.loginCount(),1);
 assert.equal(env.state().restorePromise,null);

 // 6. Valid user event during the restore loop should settle exactly once.
 env=setup({getSession:async()=>({data:{session:null},error:null})});
 const waiting=env.eval('v475RestoreSavedSession()');
 env.eval("v475HandleAuthEvent('INITIAL_SESSION',{user:{id:'acct1'}})");
 assert.equal(await waiting,true);
 assert.equal(env.bootCount(),1);
 assert.equal(env.loginCount(),0);

 // 7. The actual v115 account guard must leave startup protection enabled
 //    when authentication changes during asynchronous loadAll().
 const beginning=stateGuard.indexOf('async function v115StartWithData(data){');
 const ending=stateGuard.indexOf('\nasync function v115SafeBootstrap()',beginning);
 assert.ok(beginning>=0&&ending>beginning);
 const guardCode=stateGuard.slice(beginning,ending);
 let rendered=0,cacheWrites=0;
 const cloudSandbox={
   AUTH_USER:{id:'acct1'},V475_AUTH:{logoutRequested:false},
   V115_STARTUP_GUARD:true,V115_BOOTSTRAP_DATA:null,V115_BOOTSTRAP_OVERRIDE:false,
   loadAll:async()=>{cloudSandbox.AUTH_USER={id:'acct2'};},
   v115WriteRecoveryCache:()=>{cacheWrites++},renderShell:()=>{rendered++}
 };
 vm.createContext(cloudSandbox);
 vm.runInContext(guardCode,cloudSandbox);
 assert.equal(await vm.runInContext('v115StartWithData({library:[1]})',cloudSandbox),false);
 assert.equal(cloudSandbox.V115_STARTUP_GUARD,true);
 assert.equal(rendered,0);
 assert.equal(cacheWrites,0);
 assert.equal(cloudSandbox.V115_BOOTSTRAP_OVERRIDE,false);
 assert.equal(cloudSandbox.V115_BOOTSTRAP_DATA,undefined);
 console.log('PASS v506: authenticated reload recovery, transient sign-out, explicit logout, guarded cloud hydration, PWA and version');
}
run().catch(err=>{console.error(err);process.exitCode=1;});
