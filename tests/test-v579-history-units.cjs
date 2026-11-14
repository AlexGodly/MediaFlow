/* v579, in the real app: History counts titles in their own unit, by-parts
 * logs show one line per part, and a title's recovery has Select all. */
'use strict';
const assert=require('node:assert/strict');
const {openApp,generate}=require('./harness/app.cjs');
(async()=>{
  const app=await openApp({state:generate({titles:20})});
  const p=app.page;
  try{
    await p.waitForTimeout(700);
    const r=await p.evaluate(()=>{
      const S=__MF.S(),get=__MF.get;
      const it=S.library[0];const cat=get('getCategory')(it.categoryId);
      it.mf565Unit='matches';it.mf565SecondsPerUnit=900;
      const ev={item:it,cat,qty:3,minutes:45,row:{libraryId:it.id,qty:3,mf577Parts:[{id:'a',name:'Career',kind:'Mode',unit:'matches',qty:2,from:1,to:3},{id:'b',name:'Live',kind:'Mode',unit:'matches',qty:1,from:0,to:1}]},session:{id:'s',timestamp:Date.now(),titles:[]}};
      const H=window.MediaFlowV269Hooks;const consumed=H.call('consumedLabel',ev);
      H.call('coverMarkup',ev,'x');const noun=H.call('progressNoun',cat,3);
      const card=H.call('cardHtml',ev);
      // The real page: a log of the title shows its own unit.
      const s=S.sessions.filter(x=>x.titles&&x.titles[0]&&x.titles[0].libraryId).sort((a,b)=>(b.timestamp||0)-(a.timestamp||0))[0];const t=S.library.find(i=>i.id===s.titles[0].libraryId);t.mf565Unit='matches';
      const body=get('v260HistoryBody')('consumption');const own=(body.match(/\d+ match(es)?/g)||[]).length;
      const recent=String(get('v260HistoryBody')('recent')||'');const recentOwn=/\d+ match(es)?</.test(recent);
      const parts=window.MediaFlowV579History.partLines(ev.row);
      // Quick recovery: Select all.
      const Q=get('MF453Quick');Q.current={metadata:{preview:{proposals:[{label:'A',options:[{value:'x'}],selected:false},{label:'B',options:[{value:'y'}],selected:false},{label:'C',hasOriginal:true,options:[{value:'z'}]}]}},covers:[],errors:[]};
      App.mf579QuickSelect(true);
      const sel=Q.current.metadata.preview.proposals.map(p=>!!p.selected);
      return {consumed,noun,parts,sel,catUnit:cat.unit,card,own,recentOwn};
    });
    assert.equal(r.consumed,'3 matches');
    assert.equal(r.noun,'matches','Most consumed uses the title\'s unit (category: '+r.catUnit+')');
    assert(r.parts.includes('<small>Mode</small>')&&r.parts.includes('Career · Match 1 → 3 (+2)')&&r.parts.includes('Live · Match 0 → 1 (+1)'),r.parts);
    assert(r.card.includes('mf579-parts')&&!r.card.includes('Mode · Career · Match'),'the card shows the part lines, not the v577 one-liner');
    assert(r.own>=2,'the History page shows the title in its own unit: '+r.own);
    assert(r.recentOwn,'Recently viewed shows the title\'s own unit');
    assert.deepEqual(r.sel,[true,true,false],'Select all skips fields that already have a value');
    console.log('PASS v579 History units, part lines, quick Select all');
  }finally{await app.close();}
})().catch(e=>{console.error(e);process.exit(1);});
