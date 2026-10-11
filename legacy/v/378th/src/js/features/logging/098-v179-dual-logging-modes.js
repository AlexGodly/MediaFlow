/* ============================================================
   MediaFlow v179 — Dual Logging Modes
   ------------------------------------------------------------
   Mode 1: Amount consumed (the original MediaFlow behavior)
   Mode 2: Final progress — enter the last watched episode / read chapter /
           read issue / final progress. MediaFlow calculates the consumed
           difference automatically from the title's starting progress.
   ============================================================ */

const V179_BACKUP_SCHEMA_VERSION=16;

const V179_LOG_MODE_DEFAULTS={
  single:'amount',
  batch:'amount',
  modifiedAt:0
};

function v179NormalizeMode(value){
  return value==='progress'?'progress':'amount';
}

function v179NormalizeLoggingModes(raw){
  const src=(raw&&typeof raw==='object')?raw:{};
  return {
    single:v179NormalizeMode(src.single),
    batch:v179NormalizeMode(src.batch),
    modifiedAt:Math.max(0,Number(src.modifiedAt)||0)
  };
}

function v179EnsureLoggingModes(settings=S.settings){
  settings=settings&&typeof settings==='object'?settings:{};
  settings.v179LoggingModes=v179NormalizeLoggingModes(
    settings.v179LoggingModes
  );
  return settings.v179LoggingModes;
}

function v179Mode(kind){
  const cfg=v179EnsureLoggingModes(S.settings||DEFAULT_SETTINGS);
  return kind==='batch'?cfg.batch:cfg.single;
}

function v179IsComplete(item){
  return !!item && (
    String(item.status||'')==='completed' ||
    (
      Number(item.total)>0 &&
      Number(item.progress)>=Number(item.total)
    )
  );
}

function v179StartProgress(item){
  if(!item)return 0;
  // Completed titles are repeat consumption. Main Library progress already
  // equals the total, so "last watched episode" for a rewatch starts at 0.
  if(v179IsComplete(item))return 0;
  return Math.max(0,Number(item.progress)||0);
}

function v179ProgressInputLabel(item){
  const cat=item?getCategory(item.categoryId):null;
  const unit=String(cat?.unit||'').toLowerCase();

  if(/episode/.test(unit))return 'Last watched episode';
  if(/chapter/.test(unit))return 'Last read chapter';
  if(/issue/.test(unit))return 'Last read issue';
  if(/volume/.test(unit))return 'Last read volume';
  if(/book/.test(unit))return 'Last read book';

  return 'Final progress';
}

function v179ProgressNoun(item,amount=2){
  const cat=item?getCategory(item.categoryId):null;
  return cat?unitLabel(cat.unit,amount):'units';
}

function v179ClampEndProgress(item,value){
  let end=Math.max(0,Number(value)||0);
  const total=Number(item?.total);

  if(Number.isFinite(total)&&total>0){
    end=Math.min(end,total);
  }

  return end;
}

function v179CalculatedQty(item,start,end){
  const safeStart=Math.max(0,Number(start)||0);
  const safeEnd=v179ClampEndProgress(item,end);
  return Math.max(0,safeEnd-safeStart);
}

function v179ModeSwitchHtml(kind){
  const mode=v179Mode(kind);
  const isBatch=kind==='batch';

  return `<div class="v179-log-mode-switch ${isBatch?'v179-batch-mode-wrap':''}">
    <span class="v179-mode-label">Logging method</span>

    <button type="button"
      class="btn btn-sm ${mode==='amount'?'active':''}"
      onclick="App.v179SetLogMode('${kind}','amount')">
      Amount consumed
    </button>

    <button type="button"
      class="btn btn-sm ${mode==='progress'?'active':''}"
      onclick="App.v179SetLogMode('${kind}','progress')">
      Last progress
    </button>

    <div class="v179-log-mode-help">${
      mode==='progress'
        ?'Select a Library title, enter the last episode/chapter/issue you reached, and MediaFlow calculates how much you consumed from the title’s starting progress.'
        :'Original logging method: enter directly how many episodes, chapters, issues, movies, or other units you consumed.'
    }</div>
  </div>`;
}

function v179SetLogMode(kind,mode){
  const safeKind=kind==='batch'?'batch':'single';
  const safeMode=v179NormalizeMode(mode);
  const cfg=v179EnsureLoggingModes(S.settings||DEFAULT_SETTINGS);

  cfg[safeKind]=safeMode;
  cfg.modifiedAt=Date.now();
  persistSettings();

  if(safeKind==='single'){
    if(S.logDraft){
      S.logDraft.v179Mode=safeMode;

      if(safeMode==='progress'){
        S.logDraft.updateLibrary=true;

        for(const entry of (S.logDraft.entries||[])){
          const item=entry.libraryId
            ?S.library.find(i=>i.id===entry.libraryId)
            :null;

          if(!item)continue;

          const start=Number.isFinite(Number(entry.v179StartProgress))
            ?Math.max(0,Number(entry.v179StartProgress))
            :v179StartProgress(item);

          entry.v179StartProgress=start;
          entry.v179EndProgress=v179ClampEndProgress(
            item,
            start+Math.max(0,Number(entry.qty)||0)
          );
          entry.qty=v179CalculatedQty(
            item,
            entry.v179StartProgress,
            entry.v179EndProgress
          );
        }

        if(S.entryDraft){
          const item=S.entryDraft.libraryId
            ?S.library.find(i=>i.id===S.entryDraft.libraryId)
            :null;

          if(item){
            const start=v179StartProgress(item);
            S.entryDraft.endProgress=v179ClampEndProgress(
              item,
              start+1
            );
          }
        }

        v179SyncSingleFromEntries();
      }
    }

    render();
    return;
  }

  ensureBatchDraft();
  S.batchDraft.v179Mode=safeMode;

  for(const row of S.batchDraft.rows){
    const item=row.libraryId
      ?S.library.find(i=>i.id===row.libraryId)
      :null;

    if(!item)continue;

    if(safeMode==='progress'){
      const start=v179StartProgress(item);
      row.v179StartProgress=start;

      if(row.v179EndProgress==null||row.v179EndProgress===''){
        row.v179EndProgress=v179ClampEndProgress(
          item,
          start+Math.max(0,Number(row.qty)||1)
        );
      }

      row.qty=v179CalculatedQty(
        item,
        row.v179StartProgress,
        row.v179EndProgress
      );

      const cat=getCategory(item.categoryId);
      if(cat){
        row.minutes=Math.round(
          row.qty*(Number(cat.minutesPerUnit)||0)
        );
      }
    }
  }

  render();
}

function v179SyncSingleFromEntries(){
  if(!S.logDraft)return;

  const entries=S.logDraft.entries||[];
  let amount=0;
  let minutes=0;

  for(const entry of entries){
    const qty=Math.max(0,Number(entry.qty)||0);
    amount+=qty;

    const item=entry.libraryId
      ?S.library.find(i=>i.id===entry.libraryId)
      :null;

    const cat=item
      ?getCategory(item.categoryId)
      :getCategory(S.currentTask?.categoryId||'');

    minutes+=Math.round(
      qty*(Number(cat?.minutesPerUnit)||0)
    );
  }

  S.logDraft.amount=amount;
  S.logDraft.minutes=minutes;
  refreshXPPreview();
}

function v179ProgressEntryEditorHtml(entries){
  if(v179Mode('single')!=='progress'||!entries.length)return '';

  return `<div class="v179-progress-entry-list">
    ${entries.map((entry,idx)=>{
      const item=entry.libraryId
        ?S.library.find(i=>i.id===entry.libraryId)
        :null;

      if(!item)return '';

      const start=Number.isFinite(Number(entry.v179StartProgress))
        ?Math.max(0,Number(entry.v179StartProgress))
        :v179StartProgress(item);

      const end=entry.v179EndProgress!=null
        ?v179ClampEndProgress(item,entry.v179EndProgress)
        :v179ClampEndProgress(item,start+Math.max(0,Number(entry.qty)||0));

      const qty=v179CalculatedQty(item,start,end);
      const total=Number(item.total)>0?` / ${Number(item.total)}`:'';

      return `<div class="v179-progress-entry-row">
        <div class="v179-progress-entry-copy">
          <b>${escapeHtml(cleanTitle(item.title))}</b>
          <small>Starting progress: ${start}${total}${entry.isRepeat?' · Rewatch/reread starts at 0':''}</small>
        </div>

        <label class="v179-progress-entry-input">
          <span>${escapeHtml(v179ProgressInputLabel(item))}</span>
          <input type="number"
            min="${start}"
            ${Number(item.total)>0?`max="${Number(item.total)}"`:''}
            step="1"
            value="${end}"
            onchange="App.v179SetLogEntryEnd(${idx},this.value)">
        </label>

        <div class="v179-consumed-chip">
          +${qty} ${escapeHtml(v179ProgressNoun(item,qty))}
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

function v179SetLogEntryEnd(index,value){
  const entry=(S.logDraft?.entries||[])[index];
  if(!entry?.libraryId)return;

  const item=S.library.find(i=>i.id===entry.libraryId);
  if(!item)return;

  const start=Number.isFinite(Number(entry.v179StartProgress))
    ?Math.max(0,Number(entry.v179StartProgress))
    :v179StartProgress(item);

  const end=v179ClampEndProgress(item,value);

  entry.v179StartProgress=start;
  entry.v179EndProgress=end;
  entry.qty=v179CalculatedQty(item,start,end);

  v179SyncSingleFromEntries();
  render();
}

