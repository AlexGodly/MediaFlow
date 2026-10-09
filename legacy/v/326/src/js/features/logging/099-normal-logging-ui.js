/* ---------- Normal logging UI ------------------------------- */

const v179RenderLogFormBase=renderLogForm;
renderLogForm=function(t,cat){
  let h=v179RenderLogFormBase(t,cat);
  const mode=v179Mode('single');

  h=h.replace(
    '<div class="log-form">',
    `<div class="log-form">${v179ModeSwitchHtml('single')}`
  );

  if(mode!=='progress')return h;

  const selected=S.entryDraft?.libraryId
    ?S.library.find(i=>i.id===S.entryDraft.libraryId)
    :null;

  const inputLabel=selected
    ?v179ProgressInputLabel(selected)
    :'Last progress';

  const start=selected?v179StartProgress(selected):0;
  const suggested=selected
    ?v179ClampEndProgress(
        selected,
        S.entryDraft?.endProgress==null||S.entryDraft?.endProgress===''
          ?start+1
          :S.entryDraft.endProgress
      )
    :(Math.max(1,Number(S.entryDraft?.endProgress)||1));

  const progressInput=`<label class="v179-inline-progress">
    <span>${escapeHtml(inputLabel)}</span>
    <input type="number"
      id="entry-progress"
      min="${start}"
      ${selected&&Number(selected.total)>0?`max="${Number(selected.total)}"`:''}
      step="1"
      value="${suggested}"
      oninput="App.v179UpdateEntryProgressDraft(this.value)">
  </label>`;

  h=h.replace(
    /<input type="number" id="entry-qty"[\s\S]*?style="width:74px;">/,
    progressInput
  );

  const editors=v179ProgressEntryEditorHtml(
    S.logDraft?.entries||[]
  );

  h=h.replace(
    /(<div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">)/,
    `${editors}$1`
  );

  h=h.replace(
    /<label style="display:flex; align-items:center; gap:6px; font-size:12\.5px; color:var\(--text-dim\); margin-bottom:10px;">[\s\S]*?Update Library progress automatically[\s\S]*?<\/label>/,
    `<div class="v179-auto-progress-note">
      Library progress updates automatically to the final progress you enter. MediaFlow logs only the difference as consumed.
    </div>`
  );

  h=h.replace(
    '<label class="field-label">Actual amount (',
    '<label class="field-label">Consumed automatically ('
  );

  h=h.replace(
    /<input type="number" min="0" id="log-amount" value="([^"]*)" oninput="App\.updateLogDraft\('amount', this\.value\)">/,
    `<input type="number" min="0" id="log-amount" value="$1" readonly>`
  );

  h=h.replace(
    '<div class="field">\n\n        <label class="field-label">Consumed automatically',
    '<div class="field v179-readonly-amount">\n\n        <label class="field-label">Consumed automatically'
  );

  return h;
};

function v179UpdateEntryProgressDraft(value){
  S.entryDraft=S.entryDraft||{title:'',qty:1,libraryId:null};
  S.entryDraft.endProgress=Math.max(0,Number(value)||0);
}

const v179SelectLogTitleBase=App.selectLogTitle;
App.selectLogTitle=function(id){
  const result=v179SelectLogTitleBase.apply(this,arguments);

  if(v179Mode('single')==='progress'){
    const item=S.library.find(i=>i.id===id);

    if(item){
      const start=v179StartProgress(item);
      S.entryDraft.endProgress=v179ClampEndProgress(
        item,
        start+1
      );
      render();
    }
  }

  return result;
};

const v179AddLogEntryBase=App.addLogEntry;
App.addLogEntry=function(){
  if(v179Mode('single')!=='progress'){
    return v179AddLogEntryBase.apply(this,arguments);
  }

  const title=String(S.entryDraft?.title||'').trim();
  if(!title)return;

  const assignedCat=getCategory(S.currentTask?.categoryId||'');
  let item=S.entryDraft?.libraryId
    ?S.library.find(i=>i.id===S.entryDraft.libraryId)
    :null;

  if(!item&&assignedCat){
    item=findLibraryMatch(assignedCat.id,title);
  }

  if(!item){
    const key=cleanTitle(title).toLowerCase();
    item=S.library.find(
      i=>i&&i.status!=='dropped'&&
      cleanTitle(i.title).toLowerCase()===key
    )||null;
  }

  const start=item?v179StartProgress(item):0;
  let end=Math.max(
    start,
    Number(S.entryDraft?.endProgress)||0
  );

  if(item)end=v179ClampEndProgress(item,end);

  const qty=Math.max(0,end-start);

  if(qty<=0){
    showToast(
      item
        ?`Enter a ${v179ProgressInputLabel(item).toLowerCase()} higher than ${start}.`
        :'Enter the final progress you reached.'
    );
    return;
  }

  // Avoid two progress-mode rows for the same Library title, because each
  // final-progress entry is defined relative to one starting progress value.
  if(item?.id){
    const existing=(S.logDraft?.entries||[]).findIndex(
      e=>String(e?.libraryId||'')===String(item.id)
    );

    if(existing>=0){
      const entry=S.logDraft.entries[existing];
      entry.v179StartProgress=Number.isFinite(Number(entry.v179StartProgress))
        ?Math.max(0,Number(entry.v179StartProgress))
        :start;
      entry.v179EndProgress=end;
      entry.qty=v179CalculatedQty(
        item,
        entry.v179StartProgress,
        entry.v179EndProgress
      );

      S.entryDraft={title:'',qty:1,libraryId:null,endProgress:''};
      v179SyncSingleFromEntries();
      render();
      showToast('Updated final progress for that title.');
      return;
    }
  }

  const beforeLength=(S.logDraft?.entries||[]).length;

  S.entryDraft.qty=qty;
  S.logDraft.updateLibrary=true;

  const result=v179AddLogEntryBase.apply(this,arguments);

  const entry=(S.logDraft?.entries||[])[beforeLength];
  if(entry){
    const savedItem=entry.libraryId
      ?S.library.find(i=>i.id===entry.libraryId)
      :item;

    const savedStart=savedItem
      ?v179StartProgress(savedItem)
      :start;

    entry.v179StartProgress=savedStart;
    entry.v179EndProgress=savedItem
      ?v179ClampEndProgress(savedItem,end)
      :end;
    entry.qty=savedItem
      ?v179CalculatedQty(
          savedItem,
          entry.v179StartProgress,
          entry.v179EndProgress
        )
      :qty;
  }

  S.entryDraft=S.entryDraft||{};S.entryDraft.endProgress='';

  v179SyncSingleFromEntries();
  render();

  return result;
};

const v179OpenLogFormBase=App.openLogForm;
App.openLogForm=function(){
  const result=v179OpenLogFormBase.apply(this,arguments);

  if(S.logDraft){
    S.logDraft.v179Mode=v179Mode('single');

    if(v179Mode('single')==='progress'){
      S.logDraft.amount=0;
      S.logDraft.minutes=0;
      S.logDraft.updateLibrary=true;
      S.entryDraft=S.entryDraft||{title:'',qty:1};
      S.entryDraft.endProgress='';
      render();
    }
  }

  return result;
};

/* Final wrapper over the complete existing submit chain (XP, completion,
   repeat, Start Date, undo/activity, etc.). We only prepare quantities first. */
const v179SubmitLogBase=App.submitLog;
App.submitLog=function(){
  if(v179Mode('single')==='progress'){
    const entries=S.logDraft?.entries||[];

    if(!entries.length){
      showToast('Select at least one Library title and enter its final progress.');
      return;
    }

    for(const entry of entries){
      const item=entry.libraryId
        ?S.library.find(i=>i.id===entry.libraryId)
        :null;

      if(!item){
        if(!(Number(entry.qty)>0)){
          showToast('One of the progress entries has no consumed amount.');
          return;
        }
        continue;
      }

      const start=Number.isFinite(Number(entry.v179StartProgress))
        ?Math.max(0,Number(entry.v179StartProgress))
        :v179StartProgress(item);

      const end=v179ClampEndProgress(
        item,
        entry.v179EndProgress
      );

      entry.v179StartProgress=start;
      entry.v179EndProgress=end;
      entry.qty=v179CalculatedQty(item,start,end);

      if(!(entry.qty>0)){
        showToast(
          `${cleanTitle(item.title)}: final progress must be higher than ${start}.`
        );
        return;
      }
    }

    S.logDraft.updateLibrary=true;
    v179SyncSingleFromEntries();
  }

  return v179SubmitLogBase.apply(this,arguments);
};

