/* v579, in the real app: by-parts titles in the logging workspace and in
 * Batch Log use the Log any title layout: a "Parts · N parts · N in all"
 * header, one card per part with its full "Match reached" box, the move line
 * with minutes, the bar, and "+N in all · time" — at desktop and phone widths. */
'use strict';
const assert=require('node:assert/strict');
const {openApp,generate}=require('./harness/app.cjs');
(async()=>{
  for(const W of [1280,390]){
    const app=await openApp({state:generate({titles:30})});
    const p=app.page;
    try{
      await p.setViewportSize({width:W,height:900});await p.waitForTimeout(700);
      const r=await p.evaluate(()=>{
        const S=__MF.S(),get=__MF.get;
        const item=S.library.find(i=>i.status!=='completed'&&i.status!=='dropped');
        Object.assign(item,{status:'active',mf577LogMode:'parts',mf565Unit:'matches',mf565SecondsPerUnit:900,seasons:[
          {id:'a',name:'Career',progress:0,mf577Kind:'Mode'},{id:'b',name:'Live',progress:0,total:10,mf577Kind:'Mode'},
          {id:'c',name:'Ranked',progress:3,mf577Kind:'Mode'},{id:'d',name:'Arcade',progress:0,mf577Kind:'Mode'}]});
        get('v252SyncTitleFromSeasons')(item);
        App.startSession?.();if(!S.currentTask)S.currentTask=get('generateTask')();
        S.currentTask.categoryId=item.categoryId;App.openLogForm();
        S.logging=true;S.logDraft.v369Interface='quick';S.logDraft.v179Mode='progress';
        S.logDraft.entries=[{libraryId:item.id,title:item.title,qty:0,mf577Parts:[{id:'a',qty:1}]}];
        App.mf577TogglePart(0,'b');
        const host=document.createElement('div');host.style.width=Math.min(560,innerWidth-32)+'px';host.innerHTML=get('v239LoggedTitlesHtml')(S.logDraft.entries);document.body.appendChild(host);
        const look=root=>{
          const parts=root.querySelector('.mf577-parts');
          const labels=[...parts.querySelectorAll('.mf579-part-head label>span')].map(s=>({t:s.textContent,cut:s.scrollWidth>s.clientWidth+1}));
          return {head:parts.querySelector('.mf579-parts-head')?.textContent||'',cards:parts.querySelectorAll('.mf579-part-card').length,labels,
            lines:[...parts.querySelectorAll('.mf579-part-card>small')].map(s=>s.textContent),sum:parts.querySelector('.mf577-sum').textContent,
            box:Math.round(parts.querySelector('.mf579-part-head input').getBoundingClientRect().width)};
        };
        const ws=look(host);host.remove();
        S.batchDraft={rows:[{libraryId:'',qty:1,minutes:0}],note:'',date:'',v179Mode:'progress'};
        App.mf565OpenBatch();App.selectBatchTitle(0,item.id);App.mf577BatchToggle(0,'b');
        const batch=look(document.querySelector('#mf565-batch .batch-log-row'));
        batch.stray=[...document.querySelectorAll('#mf565-batch .batch-selected-title>.v144-cat-icon-emoji,#mf565-batch .batch-selected-title>.v144-cat-icon-img')].filter(e=>getComputedStyle(e).display!=='none').length;
        return {ws,batch};
      });
      for(const [k,x] of Object.entries(r)){
        assert(/Parts\s*4 parts · 2 in all/.test(x.head),W+' '+k+' header: '+x.head);
        assert.equal(x.cards,2,W+' '+k);
        for(const l of x.labels){assert.equal(l.t,'Match reached',W+' '+k);assert(!l.cut,W+' '+k+': the box label is not cut');}
        assert(x.box>=120,W+' '+k+': a wide box '+x.box);
        assert(x.lines.some(t=>/Match 0 → 1 \(\+1 match\).*15m/.test(t)),W+' '+k+': '+x.lines.join(' | '));
        assert(/\+2 in all · 30m/.test(x.sum),W+' '+k+': '+x.sum);
      }
      assert.equal(r.batch.stray,0,W+': no stray category icon beside the Batch Log title');
      if(process.env.MF_SHOT){const el=await p.$('#mf565-batch .batch-log-row');await el.scrollIntoViewIfNeeded();await el.screenshot({path:process.env.MF_SHOT.replace('.png','-'+W+'.png')});}
    }finally{await app.close();}
  }
  console.log('PASS v579 parts layout: workspace and Batch Log, 1280 and 390');
})().catch(e=>{console.error(e);process.exit(1);});
