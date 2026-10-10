// v369 itemized logging regression contract. Run with Node 20+ from repo root.
const fs=require('node:fs'),assert=require('node:assert/strict');
const core=fs.readFileSync('src/js/features/logging/008-session-flow.js','utf8');
const ext=fs.readFileSync('src/js/components/267-v369-itemized-logging.js','utf8');
const i=core.indexOf('function submitLog(){'),j=core.indexOf('\n}\n',i)+3;
assert.ok(i>=0&&j>i);
const native=core.slice(i,j);
const now=Date.now()-1000;
const title=(id,categoryId,p,total,seasons)=>({id,title:id,categoryId,progress:p,total,status:'active',...(seasons?{seasons}:{})});
const unit=(id,number,seasonId,durationSeconds)=>({id,number,seasonId,durationSeconds,loggedAt:now});
const draft=(t,units)=>({title:t.title,libraryId:t.id,qty:0,isRepeat:false,v179StartProgress:t.progress,v369Units:units});
function build(name,items,entries,mode='itemized'){
  const clone=x=>JSON.parse(JSON.stringify(x));
  const S={settings:{},library:clone(items),currentTask:{categoryId:'anime',targetMid:4},logDraft:{v369Interface:mode,v369CommitId:'test-'+name,entries:clone(entries),minutes:48,amount:2,note:'',updateLibrary:true},entryDraft:{},sessions:[],logging:true};
  const ctx={S,DEFAULT_SETTINGS:{},App:{openLogForm(){},addLogEntry(){},removeLogEntry(){}},window:{},
    MediaFlowRuntime:{registerPageRenderer(){},version:368},V219_PAGE_RENDERERS:new Map(),
    document:{head:{appendChild(){}},querySelector(){return null},createElement(){return {querySelector(){return null},set innerHTML(v){this._html=v},get innerHTML(){return this._html}}}},
    v285TouchLogging(){},v156EnsureOrderIndexes(){return {libraryById:new Map(S.library.map(x=>[x.id,x]))}},
    v252Seasons(item){return (item.seasons||[]).map(x=>({...x}))},
    v252SyncTitleFromSeasons(item){item.progress=item.seasons.reduce((n,x)=>n+x.progress,0);item.total=item.seasons.reduce((n,x)=>n+x.total,0)},
    getCategory(id){return {id,name:id,unit:id==='manga'?'chapters':'episodes',minutesPerUnit:id==='manga'?7:24}},
    v179SyncSingleFromEntries(){S.logDraft.amount=S.logDraft.entries.reduce((n,x)=>n+x.qty,0);S.logDraft.minutes=S.logDraft.amount*24},
    cleanTitle(x){return x},escapeHtml(x){return String(x)},v331ValidTimestamp(x){return Number(x)||0},v179StartProgress(x){return x.progress},
    uid(){return 'id-'+Math.random()},todayISO(){return '2026-10-10'},clamp(n,a,b){return Math.max(a,Math.min(b,n))},
    entriesNote(xs){return xs.map(x=>x.title).join(', ')},categoryStatus(){return {status:'healthy'}},
    calculateConsumptionXP(cat,qty,mins){return {xp:Math.round(mins)*2+qty*5}},
    v165ApplyRespectReward(){},normalizeSeasonalLibraryItems(){},persistLibrary(){},persistSessions(){},persistTask(){},persistSettings(){},
    generateTask(){return {categoryId:'anime',targetMid:4}},render(){},refreshXPPreview(){},v334InvalidateXP(){},v53InvalidateLibraryCache(){},
    showToast(){},renderLogForm(){return '<div class="log-form"></div>'},v155VerifyCloudState(){return {ok:true,missing:[]}}};
  const run=new Function('ctx','with(ctx){'+native+'\n App.submitLog=submitLog;\n'+ext+'\n return {sync:v369Sync,verify:v155VerifyCloudState,panel:v369PanelsHtml};}');
  return {S,ctx,api:run(ctx)};
}
const a=title('a','anime',11,20);
const gap=build('gap',[a],[draft(a,[unit('1',12,null,1440),unit('2',14,null,1500)])]);
gap.api.sync();gap.ctx.App.submitLog();
assert.equal(gap.S.library[0].progress,12);
assert.equal(gap.S.sessions[0].actualAmount,2);
assert.equal(gap.S.sessions[0].v369DurationSeconds,2940);
const before=gap.S.sessions.length;gap.ctx.App.submitLog();
assert.equal(gap.S.sessions.length,before);
assert.ok(gap.api.panel().includes('v369ToggleTitle'));
const seasonTitle=title('a','anime',11,24,[{id:'s1',name:'S1',number:1,progress:11,total:12},{id:'s2',name:'S2',number:2,progress:0,total:12}]);
const seasons=build('seasons',[seasonTitle],[draft(seasonTitle,[unit('1',12,'s1',1440),unit('2',1,'s2',1500),unit('3',2,'s2',1400)])]);
seasons.api.sync();seasons.ctx.App.submitLog();
assert.deepEqual(seasons.S.library[0].seasons.map(x=>x.progress),[12,2]);
assert.equal(seasons.S.library[0].progress,14);
assert.equal(seasons.S.sessions[0].v369DurationSeconds,4340);
assert.equal(seasons.S.sessions[0].xp,Math.round(4340/60)*2+15);
const b=title('b','manga',5,30),c=title('a','anime',3,20);
const mixed=build('mixed',[c,b],[draft(c,[unit('1',4,null,1440),unit('2',5,null,1650)]),draft(b,[unit('3',6,null,310)])]);
mixed.api.sync();mixed.ctx.App.submitLog();
assert.deepEqual(mixed.S.sessions.filter(x=>x.actualAmount>0).map(x=>x.v369DurationSeconds),[3090,310]);
const payload={resumeStateV285:{logging:{active:true,logDraft:{v369Interface:'itemized',v369CommitId:'same',
  entries:[{libraryId:'a',title:'A',v369Units:[unit('1',4,null,1440)]}]}}}};
const remote=JSON.parse(JSON.stringify(payload));
assert.equal(gap.api.verify(remote,payload).ok,true);
remote.resumeStateV285.logging.logDraft.entries[0].v369Units[0].durationSeconds++;
assert.equal(gap.api.verify(remote,payload).ok,false);
remote.resumeStateV285.logging.logDraft.entries[0].v369Units[0].durationSeconds--;
remote.resumeStateV285.logging.logDraft.entries[0].v369Units[0].loggedAt--;
assert.equal(gap.api.verify(remote,payload).ok,false);
const quick=build('quick',[title('q','anime',0,20)],[{libraryId:'q',title:'q',qty:2,isRepeat:false}],'quick');
quick.ctx.App.submitLog();
assert.equal(quick.S.library[0].progress,2);
assert.equal(quick.S.sessions[0].v369Itemized,undefined);
console.log('PASS v369 itemized contract: gaps, seasons, duration, XP, cloud, duplicate safety, Quick Logging');