/* ============================================================
   MediaFlow v190 — Shared Normal / Dynamic Library batch toolbar
   v189 added the full toolbar to Dynamic Library. v190 exposes the
   same workflow in Normal Library without changing selection data.
   ============================================================ */
function v190NormalLibraryBatchBarHtml(){
  const n=mfSelectedIds().length;
  return `<div class="mf-batchbar v189-dynamic-batchbar v190-normal-batchbar">
    <div class="v189-batch-left">
      <button type="button" class="btn btn-sm" onclick="App.selectVisibleLibrary(true)">Select visible</button>
      <button type="button" class="btn btn-sm" onclick="App.selectAllLibrary()">Select all matching</button>
      <button type="button" class="btn btn-sm" onclick="App.deselectAllLibrary()">Deselect all</button>
      <button type="button" class="btn btn-sm" ${n?'':'disabled'} onclick="App.v69RepairSelectedCompleted()">Fix completed progress</button>
    </div>
    <b>${n.toLocaleString()} selected</b><span class="spacer"></span>
    <select style="width:auto" onchange="if(this.value){App.batchLibraryStatus(this.value);this.value=''}"><option value="">Set status…</option><option value="planned">Plan to Watch</option><option value="active">Watching</option><option value="paused">On Hold</option><option value="completed">Completed</option><option value="dropped">Dropped</option></select>
    <select style="width:auto" onchange="if(this.value){App.batchLibraryPriority(this.value);this.value=''}"><option value="">Set priority…</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select>
    <select style="width:auto" onchange="if(this.value){App.batchLibraryCategory(this.value);this.value=''}"><option value="">Move to…</option>${(S.categories||[]).map(c=>`<option value="${escapeHtml(String(c.id))}">${v144CategoryIconText(c)} ${escapeHtml(c.name)}</option>`).join('')}</select>
    <button type="button" class="btn btn-sm btn-danger" ${n?'':'disabled'} onclick="App.batchDeleteLibrary()">Delete selected</button>
  </div>`;
}

const v190RenderLibraryBase=renderLibrary;
renderLibrary=function(){
  let h=v190RenderLibraryBase.apply(this,arguments);
  const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);

  if(cfg.mode==='classic'&&!h.includes('v190-normal-batchbar')){
    const overviewToggle=v183LibraryOverviewToggleHtml();
    const batch=v190NormalLibraryBatchBarHtml();

    // Place the toolbar immediately before the shared Library Overview control,
    // matching Dynamic Library's prominent management position.
    if(h.includes(overviewToggle)){
      h=h.replace(overviewToggle,batch+overviewToggle);
    }else if(h.includes('<div class="lib-toolbar">')){
      h=h.replace('<div class="lib-toolbar">',batch+'<div class="lib-toolbar">');
    }else{
      h=batch+h;
    }
  }

  return h;
};

