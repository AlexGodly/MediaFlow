/* ---------- Batch Log state + UI ----------------------------- */

const v179EnsureBatchDraftBase=ensureBatchDraft;
ensureBatchDraft=function(){
  v179EnsureBatchDraftBase();

  S.batchDraft.v179Mode=v179NormalizeMode(
    S.batchDraft.v179Mode||v179Mode('batch')
  );

  for(const row of S.batchDraft.rows){
    if(row.v179EndProgress===undefined)row.v179EndProgress='';
    if(row.v179StartProgress===undefined)row.v179StartProgress=null;
  }
};

const v179AddBatchRowBase=App.addBatchRow;
App.addBatchRow=function(){
  const result=v179AddBatchRowBase.apply(this,arguments);

  ensureBatchDraft();
  const row=S.batchDraft.rows[S.batchDraft.rows.length-1];

  if(row){
    row.v179EndProgress='';
    row.v179StartProgress=null;
  }

  return result;
};

const v179SelectBatchTitleBase=App.selectBatchTitle;
App.selectBatchTitle=function(i,id){
  ensureBatchDraft();

  if(v179Mode('batch')==='progress'){
    const duplicate=S.batchDraft.rows.findIndex(
      (row,index)=>
        index!==Number(i)&&
        String(row?.libraryId||'')===String(id)
    );

    if(duplicate>=0){
      showToast('That title is already in this progress-mode batch.');
      return;
    }
  }

  const result=v179SelectBatchTitleBase.apply(this,arguments);

  if(v179Mode('batch')==='progress'){
    ensureBatchDraft();
    const row=S.batchDraft.rows[i];
    const item=S.library.find(x=>x.id===id);

    if(row&&item){
      const start=v179StartProgress(item);
      const end=v179ClampEndProgress(item,start+1);

      row.v179StartProgress=start;
      row.v179EndProgress=end;
      row.qty=v179CalculatedQty(item,start,end);

      const cat=getCategory(item.categoryId);
      if(cat){
        row.minutes=Math.round(
          row.qty*(Number(cat.minutesPerUnit)||0)
        );
      }

      render();
    }
  }

  return result;
};

function v179UpdateBatchProgress(i,value){
  ensureBatchDraft();

  const row=S.batchDraft.rows[i];
  if(!row?.libraryId)return;

  const item=S.library.find(x=>x.id===row.libraryId);
  if(!item)return;

  const start=Number.isFinite(Number(row.v179StartProgress))
    ?Math.max(0,Number(row.v179StartProgress))
    :v179StartProgress(item);

  const end=v179ClampEndProgress(item,value);
  const qty=v179CalculatedQty(item,start,end);

  row.v179StartProgress=start;
  row.v179EndProgress=end;
  row.qty=qty;

  const cat=getCategory(item.categoryId);
  if(cat){
    row.minutes=Math.round(
      qty*(Number(cat.minutesPerUnit)||0)
    );
  }

  const hint=document.getElementById(
    `batch-progress-calc-${i}`
  );
  if(hint){
    hint.innerHTML=`Starting ${start} → <b>+${qty} ${escapeHtml(v179ProgressNoun(item,qty))}</b>`;
  }

  const minutesInput=document.getElementById(
    `batch-minutes-${i}`
  );
  if(minutesInput){
    minutesInput.value=row.minutes;
  }

  const total=document.getElementById('batch-total-summary');
  if(total){
    const mins=S.batchDraft.rows.reduce(
      (n,x)=>n+(Number(x.minutes)||0),
      0
    );
    total.textContent=`${S.batchDraft.rows.length} rows · ${fmtMinutes(mins)}`;
  }
}

/* Final Batch Log renderer. It preserves v175's complete Library-browser
   filters/pagination while changing only the quantity-entry method. */
renderBatchLog=function(){
  ensureBatchDraft();
  const mode=v179Mode('batch');

  const rows=S.batchDraft.rows.map((r,i)=>{
    const item=S.library.find(x=>x.id===r.libraryId);
    const cat=item&&getCategory(item.categoryId);
    const query=r.query!=null
      ?r.query
      :(item?cleanTitle(item.title):'');

    let amountField='';

    if(mode==='progress'){
      const start=item
        ?(
          Number.isFinite(Number(r.v179StartProgress))
            ?Math.max(0,Number(r.v179StartProgress))
            :v179StartProgress(item)
        )
        :0;

      const end=item
        ?v179ClampEndProgress(
            item,
            r.v179EndProgress==null||r.v179EndProgress===''
              ?start+1
              :r.v179EndProgress
          )
        :'';

      const qty=item
        ?v179CalculatedQty(item,start,end)
        :0;

      amountField=`<div class="field">
        <label class="field-label">${
          item
            ?escapeHtml(v179ProgressInputLabel(item))
            :'Last progress'
        }</label>

        <input id="batch-progress-${i}"
          type="number"
          min="${start}"
          ${item&&Number(item.total)>0?`max="${Number(item.total)}"`:''}
          step="1"
          inputmode="numeric"
          ${item?'':'disabled'}
          value="${end}"
          placeholder="${item?'':'Select a title first'}"
          oninput="App.v179UpdateBatchProgress(${i},this.value)">

        <small id="batch-progress-calc-${i}" class="v179-batch-progress-hint">
          ${
            item
              ?`Starting ${start} → <b>+${qty} ${escapeHtml(v179ProgressNoun(item,qty))}</b>`
              :'Select a Library title first.'
          }
        </small>
      </div>`;
    }else{
      amountField=`<div class="field">
        <label class="field-label">Amount ${cat?`(${escapeHtml(unitLabel(cat.unit,2))})`:''}</label>
        <input id="batch-qty-${i}"
          type="number"
          min="0"
          inputmode="decimal"
          value="${r.qty}"
          oninput="App.updateBatchRow(${i},'qty',this.value)">
      </div>`;
    }

    return `<div class="card batch-log-row">
      <div class="batch-title-field field">
        <label class="field-label">Title</label>

        <div class="batch-search-wrap">
          <input id="batch-title-${i}"
            type="text"
            autocomplete="off"
            value="${escapeHtml(query)}"
            placeholder="Search or browse your Library…"
            oninput="App.updateBatchSearch(${i},this.value)"
            onfocus="App.renderBatchSuggestions(${i})">

          <div id="batch-suggestions-${i}" class="batch-suggestions"></div>
        </div>

        ${
          item&&cat
            ?`<div class="batch-selected-title">
                ${v144CategoryIconHtml(cat)}
                <b>${escapeHtml(cleanTitle(item.title))}</b>
                <span>${escapeHtml(cat.name)}${item.total!=null?` · ${Number(item.progress)||0}/${item.total}`:` · progress ${Number(item.progress)||0}`}${v179IsComplete(item)?' · ↻ repeat':''}</span>
              </div>`
            :`<small class="hint">Search across every category, then select the title you consumed.</small>`
        }
      </div>

      <div class="batch-number-fields">
        ${amountField}

        <div class="field">
          <label class="field-label">Minutes</label>
          <input id="batch-minutes-${i}"
            type="number"
            min="0"
            inputmode="numeric"
            value="${r.minutes}"
            oninput="App.updateBatchRow(${i},'minutes',this.value)">
        </div>
      </div>

      <button class="btn btn-danger batch-remove"
        onclick="App.removeBatchRow(${i})">
        Remove
      </button>

      ${
        cat
          ?`<small class="hint batch-counts-note">
              ${v144CategoryIconHtml(cat)} ${escapeHtml(cat.name)} · ${
                mode==='progress'
                  ?'MediaFlow calculates the consumed difference and updates Library progress to your entered final progress.'
                  :'Updates Library progress and counts toward scheduler balance, health, Statistics and XP.'
              }
            </small>`
          :''
      }
    </div>`;
  }).join('');

  const totalMinutes=S.batchDraft.rows.reduce(
    (n,r)=>n+(Number(r.minutes)||0),
    0
  );

  return `<div class="view-head">
      <div>
        <div class="view-title">Batch Log</div>
        <div class="view-desc">
          Search your entire Library and record multiple titles at once.
        </div>
      </div>
    </div>

    <div class="card batch-log-meta">
      <div class="field-row">
        <div class="field">
          <label class="field-label">Consumption date</label>
          <input type="date"
            value="${escapeHtml(S.batchDraft.date||todayISO())}"
            onchange="S.batchDraft.date=this.value">
        </div>

        <div class="field">
          <label class="field-label">Batch note (optional)</label>
          <input type="text"
            value="${escapeHtml(S.batchDraft.note||'')}"
            placeholder="What did you consume?"
            onchange="S.batchDraft.note=this.value">
        </div>
      </div>

      <div class="health-note">
        Batch entries use <b>Logged</b>. Their actual categories, amounts and minutes still fully count throughout MediaFlow.
      </div>
    </div>

    ${v179ModeSwitchHtml('batch')}
    ${v175BatchLibraryToolsHtml()}

    <div class="batch-log-list">
      ${
        rows||
        `<div class="empty-state card">
          <div class="em-icon">🧾</div>
          <div class="em-title">No batch rows yet</div>
          <div>Add a title, search your Library, and select what you consumed.</div>
        </div>`
      }
    </div>

    <div class="batch-log-actions">
      <button class="btn" onclick="App.addBatchRow()">+ Add title</button>

      <button class="btn btn-primary"
        ${S.batchDraft.rows.length?'':'disabled'}
        onclick="App.submitBatchLog()">
        Log batch
      </button>

      ${
        S.batchDraft.rows.length
          ?`<button class="btn btn-ghost" onclick="App.clearBatchLog()">Clear</button>`
          :''
      }

      <span id="batch-total-summary" class="hint">
        ${S.batchDraft.rows.length} rows · ${fmtMinutes(totalMinutes)}
      </span>
    </div>`;
};

const v179SubmitBatchLogBase=App.submitBatchLog;
App.submitBatchLog=function(){
  if(v179Mode('batch')==='progress'){
    ensureBatchDraft();

    const selected=S.batchDraft.rows.filter(r=>r.libraryId);
    if(!selected.length){
      showToast('Select at least one Library title.');
      return;
    }

    const seen=new Set();

    for(const row of selected){
      const item=S.library.find(x=>x.id===row.libraryId);
      if(!item)continue;

      if(seen.has(String(item.id))){
        showToast(`${cleanTitle(item.title)} appears more than once in this progress-mode batch.`);
        return;
      }
      seen.add(String(item.id));

      const start=Number.isFinite(Number(row.v179StartProgress))
        ?Math.max(0,Number(row.v179StartProgress))
        :v179StartProgress(item);

      const end=v179ClampEndProgress(
        item,
        row.v179EndProgress
      );

      const qty=v179CalculatedQty(
        item,
        start,
        end
      );

      if(!(qty>0)){
        showToast(
          `${cleanTitle(item.title)}: final progress must be higher than ${start}.`
        );
        return;
      }

      row.v179StartProgress=start;
      row.v179EndProgress=end;
      row.qty=qty;

      const cat=getCategory(item.categoryId);
      if(cat&&!(Number(row.minutes)>0)){
        row.minutes=Math.round(
          qty*(Number(cat.minutesPerUnit)||0)
        );
      }
    }
  }

  return v179SubmitBatchLogBase.apply(this,arguments);
};

Object.assign(App,{
  v179SetLogMode,
  v179UpdateEntryProgressDraft,
  v179SetLogEntryEnd,
  v179UpdateBatchProgress
});

