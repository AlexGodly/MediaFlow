/* ============================================================
   v37: Simkl JSON + bulk library tools + activity + undo/redo
   ============================================================ */
S.librarySelection=S.librarySelection||{};
S.activityLog=S.activityLog||[];
S.undoStack=S.undoStack||[];
S.redoStack=S.redoStack||[];

function mfDeep(v){return JSON.parse(JSON.stringify(v));}
function mfCoreSnapshot(){return {library:mfDeep(S.library||[]),sessions:mfDeep(S.sessions||[]),completionTimeline:mfDeep(S.completionTimeline||[]),xpLedger:mfDeep(S.xpLedger||{libraryAdditions:{}})};}
function mfRestoreCore(x){S.library=sanitizeLibrary(mfDeep(x.library||[]));S.sessions=mfDeep(x.sessions||[]);S.completionTimeline=mfDeep(x.completionTimeline||[]);S.xpLedger=mfDeep(x.xpLedger||{libraryAdditions:{}});normalizeSeasonalLibraryItems();}
function mfActivity(action,detail){S.activityLog=S.activityLog||[];S.activityLog.unshift({id:uid(),timestamp:Date.now(),action:String(action||'Change'),detail:String(detail||'')});if(S.activityLog.length>1000)S.activityLog.length=1000;}
function mfBegin(action,detail){S.undoStack=S.undoStack||[];S.redoStack=[];S.undoStack.push({action,detail,before:mfCoreSnapshot()});if(S.undoStack.length>40)S.undoStack.shift();}
function mfCommit(action,detail){const x=S.undoStack[S.undoStack.length-1];if(x&&!x.after)x.after=mfCoreSnapshot();mfActivity(action,detail);saveState();}
async function mfUndo(){const x=(S.undoStack||[]).pop();if(!x){showToast('Nothing to undo');return;}x.after=x.after||mfCoreSnapshot();S.redoStack=S.redoStack||[];S.redoStack.push(x);mfRestoreCore(x.before);mfActivity('Undo',x.action+(x.detail?' · '+x.detail:''));await saveState();render();showToast('Undid '+x.action);}
async function mfRedo(){const x=(S.redoStack||[]).pop();if(!x){showToast('Nothing to redo');return;}S.undoStack=S.undoStack||[];S.undoStack.push(x);mfRestoreCore(x.after);mfActivity('Redo',x.action+(x.detail?' · '+x.detail:''));await saveState();render();showToast('Redid '+x.action);}
function mfSelectedIds(){return Object.keys(S.librarySelection||{}).filter(id=>S.librarySelection[id]&&S.library.some(i=>i.id===id));}
function mfToggleSelect(id,on){S.librarySelection=S.librarySelection||{};S.librarySelection[id]=!!on;render();}
function mfSelectVisible(on){document.querySelectorAll('.item-row [data-mf-select]').forEach(cb=>{cb.checked=!!on;S.librarySelection[cb.dataset.mfSelect]=!!on;});mfEnhanceLibraryDom();}
function mfClearSelection(){S.librarySelection={};render();}
function mfBatchStatus(v){const ids=mfSelectedIds();if(!ids.length)return;mfBegin('Batch status',ids.length+' titles → '+v);ids.forEach(id=>{const i=S.library.find(x=>x.id===id);if(i){i.status=v;if(v==='completed'){i.completedAt=i.completedAt||Date.now();}else i.completedAt=null;}});normalizeSeasonalLibraryItems();mfCommit('Batch status',ids.length+' titles → '+v);render();}
function mfBatchPriority(v){const ids=mfSelectedIds();if(!ids.length)return;mfBegin('Batch priority',ids.length+' titles → '+v);ids.forEach(id=>{const i=S.library.find(x=>x.id===id);if(i)i.priority=v;});mfCommit('Batch priority',ids.length+' titles → '+v);render();}
function mfBatchCategory(v){const ids=mfSelectedIds();if(!ids.length||!S.categories.some(c=>c.id===v))return;mfBegin('Batch move',ids.length+' titles → '+getCategory(v).name);ids.forEach(id=>{const i=S.library.find(x=>x.id===id);if(i)i.categoryId=v;});normalizeSeasonalLibraryItems();mfCommit('Batch move',ids.length+' titles → '+getCategory(v).name);render();}
function mfBatchDelete(){const ids=mfSelectedIds();if(!ids.length)return;mfBegin('Batch delete',ids.length+' titles');S.library=S.library.filter(i=>!ids.includes(i.id));S.librarySelection={};mfCommit('Batch delete',ids.length+' titles');render();showToast(ids.length+' titles deleted');}
function mfClearCategory(id){const cat=S.categories.find(c=>c.id===id);if(!cat)return;const n=S.library.filter(i=>i.categoryId===id).length;if(!n){showToast('That category is already empty');return;}mfBegin('Clear category',cat.name+' · '+n+' titles');S.library=S.library.filter(i=>i.categoryId!==id);mfCommit('Clear category',cat.name+' · '+n+' titles');render();showToast(cat.name+' cleared');}
