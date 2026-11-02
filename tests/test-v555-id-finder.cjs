/* v555 External ID finder in the real title editor: loads provider status on
 * demand (no false "needs configuration"), searches all set-up sites with
 * every name, groups results per ID with a choice when several match, keeps
 * saved IDs, shows real reasons for failures, and fills the editor draft. */
'use strict';
const assert=require('node:assert/strict');
const {openApp,generate}=require('./harness/app.cjs');
const norm=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
let statusCalls=0;
function gateway(body){
  if(body.action==='status'){statusCalls++;return {version:555,ready:true,providers:[
    {id:'tmdb',configured:true,mode:'cover',testable:true},{id:'omdb',configured:true,mode:'cover',testable:true},
    {id:'trakt',configured:false,mode:'mapping',testable:true}]};}
  if(body.action==='search'&&body.provider==='omdb'){
    if(!body.loose)return {status:400,body:{error:'loose expected'}};
    if(norm(body.title)!=='fright night')return {results:[]};
    return {results:[
      {provider:'omdb',recordId:'tt0089175',title:'Fright Night',year:1985,exact:true,externalIdCandidates:[{key:'imdb',value:'tt0089175'}]},
      {provider:'omdb',recordId:'tt1438176',title:'Fright Night',year:2011,exact:true,externalIdCandidates:[{key:'imdb',value:'tt1438176'}]},
      {provider:'omdb',recordId:'tt0093036',title:'Fright Night Part 2',year:1988,exact:false,externalIdCandidates:[{key:'imdb',value:'tt0093036'}]}]};
  }
  if(body.action==='search'&&body.provider==='tmdb'){
    return {status:429,body:{error:'Safe daily provider quota reached'}};
  }
  return {results:[]};
}
async function network(url){
  const u=new URL(url);
  if(u.hostname==='api.tvmaze.com')return {status:200,contentType:'application/json',body:JSON.stringify([
    {show:{id:1234,name:'Fright Night',premiered:'2020-01-01',externals:{imdb:null}}}])};
  if(['api.jikan.moe','graphql.anilist.co','kitsu.io'].includes(u.hostname))
    return {status:200,contentType:'application/json',body:JSON.stringify(u.hostname==='graphql.anilist.co'?{data:{Page:{media:[]}}}:{data:[]})};
  return null;
}
(async()=>{
  const state=generate({titles:10});
  state.library.push({id:'fn',title:'Fright Night',categoryId:'movies',status:'planned',priority:'medium',externalIds:{tvmaze:'999'},universalMetadata:{}});
  const app=await openApp({state,gateway,network});
  const p=app.page;
  try{
    await p.evaluate(()=>App.openLibraryModal('fn'));
    await p.waitForSelector('.mf555-id-finder',{state:'attached',timeout:20000});
    await p.evaluate(()=>{const d=document.querySelector('.mf555-id-finder').closest('details');if(d)d.open=true;});
    statusCalls=0;
    await p.evaluate(()=>{__MF.get('MF434').status=null;});   // as before visiting Provider Management
    await p.click('.mf555-id-finder .mf436-find-ids');
    await p.waitForFunction(()=>window.MediaFlowV555IdFinder.busy(),null,{timeout:10000}).catch(()=>{});
    await p.waitForFunction(()=>!window.MediaFlowV555IdFinder.busy(),null,{timeout:90000});
    await p.waitForTimeout(300);
    const r=await p.evaluate(()=>{
      const groups=[...document.querySelectorAll('.mf555-id-group')].map(g=>({key:g.dataset.mf555Key||'kept',text:g.textContent,
        options:[...g.querySelectorAll('input[type=radio]')].map(i=>({v:i.value,checked:i.checked}))}));
      const sites=[...document.querySelectorAll('.mf555-id-site')].map(s=>s.textContent);
      return {groups,sites,toastless:true};
    });
    assert(statusCalls>=1,'provider status must be loaded on demand');
    assert(!r.sites.some(s=>/needs an available, configured/i.test(s)),'no false configuration message');
    const imdb=r.groups.find(g=>g.key==='imdb');
    assert(imdb,'IMDb results grouped: '+JSON.stringify(r.groups.map(g=>g.key)));
    assert.equal(imdb.options.filter(o=>o.v).length,3,'all matching IMDb records offered');
    assert(!imdb.options.some(o=>o.v&&o.checked),'two exact matches: nothing preselected, the user chooses');
    assert(/check this/.test(imdb.text),'close matches are marked');
    assert(r.groups.some(g=>g.key==='kept'&&/999/.test(g.text)),'saved TVmaze ID is kept, not replaceable');
    assert(r.sites.some(s=>/TMDB: Daily limit reached/.test(s)),'real reason shown for a failing site: '+r.sites.join(' | '));
    assert(!r.sites.some(s=>/Trakt/.test(s)),'sites that are not set up are not searched under All sites');
    if(process.env.MF555_SHOT){await p.evaluate(()=>document.querySelector('.mf555-id-finder').scrollIntoView());await p.screenshot({path:process.env.MF555_SHOT});}
    // Choose the 2011 film and add it to the draft.
    await p.check('input[name="mf555-id-imdb"][value="tt1438176"]');
    await p.click('.mf555-id-link');
    const draft=await p.evaluate(()=>[...document.querySelectorAll('[data-v377-ids-editor] [data-v377-id]')].map(i=>[i.dataset.v377Id,i.value]).filter(([,v])=>v));
    assert(draft.some(([k,v])=>k==='imdb'&&v==='tt1438176'),'chosen IMDb ID filled into the draft');
    assert(draft.some(([k,v])=>k==='tvmaze'&&v==='999'),'saved ID untouched');
    const saved=await p.evaluate(()=>__MF.S().library.find(x=>x.id==='fn').externalIds.imdb);
    assert(!saved,'nothing is saved until the title is saved');
    // A single site that is not set up explains why.
    await p.selectOption('#mf434-lookup-provider','trakt');
    await p.click('.mf555-id-finder .mf436-find-ids');
    await p.waitForFunction(()=>!window.MediaFlowV555IdFinder.busy(),null,{timeout:30000});
    const trakt=await p.evaluate(()=>document.querySelector('.mf555-id-status')?.textContent||'');
    assert(/Not set up/.test(trakt),'not-set-up site explains itself: '+trakt);
    assert.deepEqual(app.errors.filter(e=>!/Failed to load resource/.test(e)),[],'no page errors');
    console.log('PASS v555 ID finder: on-demand status, all sites, per-ID choices, kept IDs, real errors, draft-only linking.');
  }finally{await app.close();}
})().catch(e=>{console.error(e);process.exit(1);});
