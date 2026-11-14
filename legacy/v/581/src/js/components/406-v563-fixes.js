/* MediaFlow v563 — three fixes.
 *
 * 1. On This Day no longer shows logs of titles that were deleted from the
 *    Library. Logs stay in History; only the anniversary card hides them.
 * 2. Old System: Consume applies the conversion rules and can be undone.
 *    v153EnsureOldSystem swapped S.oldSystem for a fresh copy on every call;
 *    v153ApplyConsumption held the old copy while it looked up the rules (which
 *    calls Ensure again), so the rule costs and the Undo entry it wrote
 *    afterwards were lost. Ensure now keeps the same object.
 * 3. Deleting a category keeps it in the recovery slot again, so
 *    Settings → Categories → Restore deleted category works. (v171's wrapper
 *    was replaced by the later v283 delete, so the slot was never filled.)
 */
const V563_RELEASE=563;

/* ---------- 1. On This Day: only titles still in the Library ---------- */
function mf563LibraryIds(){
  const ids=new Set();
  for(const item of (S.library||[]))if(item&&item.id!=null)ids.add(String(item.id));
  return ids;
}
function mf563OtdRowAlive(row,ids){
  if(!row||row.kind!=='logged')return true; // started/finished come from Library titles
  const id=row.item?.id!=null?String(row.item.id):'';
  return !!id&&ids.has(id);
}
const mf563BuildOnThisDayBase=v159BuildOnThisDayModel;
v159BuildOnThisDayModel=function(){
  const model=mf563BuildOnThisDayBase.apply(this,arguments);
  if(!model||!Array.isArray(model.groups))return model;
  const ids=mf563LibraryIds();
  const groups=[];
  for(const g of model.groups){
    const rows=(g.rows||[]).filter(r=>mf563OtdRowAlive(r,ids));
    if(rows.length)groups.push(Object.assign({},g,{rows}));
  }
  const flat=(model.flat||[]).filter(r=>mf563OtdRowAlive(r,ids));
  return Object.assign({},model,{groups,flat});
};

/* ---------- 2. Old System: one object per account ---------- */
const mf563EnsureOldSystemBase=v153EnsureOldSystem;
v153EnsureOldSystem=function(){
  const current=S.oldSystem;
  const next=mf563EnsureOldSystemBase.apply(this,arguments);
  if(current&&typeof current==='object'&&!Array.isArray(current)&&current!==next){
    for(const key of Object.keys(current))delete current[key];
    Object.assign(current,next);
    S.oldSystem=current;
    return current;
  }
  return next;
};

/* ---------- 3. Category delete fills the recovery slot ---------- */
const mf563ConfirmDeleteCategoryBase=App.confirmDeleteCategory;
App.confirmDeleteCategory=function(id,button){
  if(button?.dataset?.deleting!=='1'){
    const index=(S.categories||[]).findIndex(c=>String(c?.id||'')===String(id||''));
    const cat=index>=0?S.categories[index]:null;
    if(cat){
      S.categoryRecovery={
        lastDeletedCategory:JSON.parse(JSON.stringify(cat)),
        lastDeletedIndex:index,
        modifiedAt:Date.now()
      };
    }
  }
  return mf563ConfirmDeleteCategoryBase.apply(this,arguments);
};

MediaFlowRuntime.version=V563_RELEASE;
window.MediaFlowV563={version:563,fixes:['On This Day hides deleted titles','Old System consumption keeps rules and Undo','Deleted categories can be restored']};
