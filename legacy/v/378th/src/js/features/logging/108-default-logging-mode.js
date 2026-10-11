/* ============================================================
   Default Logging Mode
   ============================================================ */

function v181DefaultLoggingMode(){
  return v181EnsureLogging(S.settings||DEFAULT_SETTINGS).defaultMode;
}

// v179 originally remembered one choice for normal Logging and a second for
// Batch Log. v181 changes that contract: there is ONE Settings default.
// A switch inside an open Logging / Batch Log page is temporary only.
v179Mode=function(kind){
  if(kind==='batch'){
    if(S.view==='batch'&&S.batchDraft?.v179Mode){
      return v179NormalizeMode(S.batchDraft.v179Mode);
    }
    return v181DefaultLoggingMode();
  }

  if(S.logging&&S.logDraft?.v179Mode){
    return v179NormalizeMode(S.logDraft.v179Mode);
  }

  return v181DefaultLoggingMode();
};

v179SetLogMode=function(kind,mode){
  const safeKind=kind==='batch'?'batch':'single';
  const safeMode=v179NormalizeMode(mode);

  if(safeKind==='single'){
    if(!S.logDraft)return;

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

        if(entry.v179EndProgress==null||entry.v179EndProgress===''){
          entry.v179EndProgress=v179ClampEndProgress(
            item,
            start+Math.max(0,Number(entry.qty)||1)
          );
        }

        entry.qty=v179CalculatedQty(
          item,
          entry.v179StartProgress,
          entry.v179EndProgress
        );
      }

      const selected=S.entryDraft?.libraryId
        ?S.library.find(i=>i.id===S.entryDraft.libraryId)
        :null;

      if(selected){
        const start=v179StartProgress(selected);
        S.entryDraft.endProgress=v179ClampEndProgress(
          selected,
          start+1
        );
      }

      v179SyncSingleFromEntries();
    }

    render();
    return;
  }

  ensureBatchDraft();
  S.batchDraft.v179Mode=safeMode;

  if(safeMode==='progress'){
    for(const row of S.batchDraft.rows){
      const item=row.libraryId
        ?S.library.find(i=>i.id===row.libraryId)
        :null;

      if(!item)continue;

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
};
App.v179SetLogMode=v179SetLogMode;

// Opening Dashboard Logging always starts from the Settings default.
const v181OpenLogFormBase=App.openLogForm;
App.openLogForm=function(){
  const result=v181OpenLogFormBase.apply(this,arguments);

  if(S.logDraft){
    S.logDraft.v179Mode=v181DefaultLoggingMode();

    if(S.logDraft.v179Mode==='progress'){
      S.logDraft.updateLibrary=true;
      S.logDraft.amount=0;
      S.logDraft.minutes=0;
      S.entryDraft=S.entryDraft||{title:'',qty:1,libraryId:null};
      S.entryDraft.endProgress='';
    }

    render();
  }

  return result;
};

function v181PrepareBatchDefault(){
  ensureBatchDraft();
  S.batchDraft.v179Mode=v181DefaultLoggingMode();
}

// Desktop/sidebar navigation.
const v181SetViewBase=App.setView;
App.setView=function(v){
  if(v==='batch'&&S.view!=='batch'){
    v181PrepareBatchDefault();
  }
  return v181SetViewBase.call(this,v);
};

// Mobile navigation.
const v181MobileNavBase=App.mobileNav;
App.mobileNav=function(v){
  if(v==='batch'&&S.view!=='batch'){
    v181PrepareBatchDefault();
  }
  return v181MobileNavBase.call(this,v);
};

function v181SetDefaultLoggingMode(mode){
  const cfg=v181EnsureLogging(S.settings||DEFAULT_SETTINGS);
  cfg.defaultMode=mode==='amount'?'amount':'progress';
  cfg.modifiedAt=Date.now();
  persistSettings();
  render();

  showToast(
    cfg.defaultMode==='progress'
      ?'Default logging mode: Last progress'
      :'Default logging mode: Amount consumed'
  );
}

