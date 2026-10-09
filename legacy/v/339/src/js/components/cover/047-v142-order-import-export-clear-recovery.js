/* ============================================================
   MediaFlow v142 — Order import/export + clear recovery
   ============================================================ */

function v142OrderSnapshotFrom(plan){
  const p=plan||v138EnsureOrderPlan();
  return {
    titleIds:Array.isArray(p.titleIds)?p.titleIds.map(String):[],
    viewMode:p.viewMode==='category'?'category':'all',
    categoryMode:p.categoryMode==='custom'?'custom':'default',
    categoryOrder:Array.isArray(p.categoryOrder)?p.categoryOrder.map(String):[],
    hiddenCategories:Array.isArray(p.hiddenCategories)?p.hiddenCategories.map(String):[],
    savedAt:Date.now()
  };
}

function v142NormalizeSavedOrderSnapshot(raw,library,categories){
  if(!raw || typeof raw!=='object' || Array.isArray(raw))return null;

  const lib=Array.isArray(library)?library:(S.library||[]);
  const cats=Array.isArray(categories)?categories:(S.categories||[]);
  const libIds=new Set(lib.filter(i=>i?.id).map(i=>String(i.id)));
  const catIds=new Set(cats.filter(c=>c?.id).map(c=>String(c.id)));

  const unique=(arr,allowed)=>{
    const out=[],seen=new Set();
    for(const value of (Array.isArray(arr)?arr:[])){
      const id=String(value||'');
      if(!id||seen.has(id)||(allowed&&!allowed.has(id)))continue;
      seen.add(id);out.push(id);
    }
    return out;
  };

  const titleIds=unique(raw.titleIds,libIds);
  if(!titleIds.length)return null;

  let categoryOrder=unique(raw.categoryOrder,catIds);
  for(const c of cats){
    const id=String(c?.id||'');
    if(id&&!categoryOrder.includes(id))categoryOrder.push(id);
  }

  return {
    titleIds,
    viewMode:raw.viewMode==='category'?'category':'all',
    categoryMode:raw.categoryMode==='custom'?'custom':'default',
    categoryOrder,
    hiddenCategories:unique(raw.hiddenCategories,catIds),
    savedAt:Math.max(0,Number(raw.savedAt)||Date.now())
  };
}

// Preserve the recovery snapshot through every existing Order normalize/save/
// cloud-sync/full-backup path without changing v138's canonical planner format.
const v142NormalizeOrderPlanBase=v138NormalizeOrderPlan;
v138NormalizeOrderPlan=function(plan,library,categories){
  const out=v142NormalizeOrderPlanBase(plan,library,categories);
  out.lastClearedOrder=v142NormalizeSavedOrderSnapshot(
    plan?.lastClearedOrder,
    Array.isArray(library)?library:(S.library||[]),
    Array.isArray(categories)?categories:(S.categories||[])
  );
  return out;
};

function v142OrderExportPayload(){
  const p=v138EnsureOrderPlan();
  const titleSet=new Set(p.titleIds.map(String));
  const titles=[];

  for(const id of p.titleIds){
    const item=v138OrderItem(id);
    if(!item)continue;
    const cat=v138OrderCategory(item.categoryId);
    titles.push({
      id:String(item.id),
      title:cleanTitle(item.title),
      categoryId:String(item.categoryId||''),
      categoryName:cat?.name||'',
      externalIds:Object.assign({},item.externalIds||{})
    });
  }

  const categories=(S.categories||[]).map(c=>({
    id:String(c?.id||''),
    name:String(c?.name||'')
  })).filter(c=>c.id);

  return {
    format:'MediaFlowOrder',
    formatVersion:1,
    mediaFlowVersion:142,
    exportedAt:new Date().toISOString(),
    orderPlan:{
      titleIds:[...titleSet],
      viewMode:p.viewMode,
      categoryMode:p.categoryMode,
      categoryOrder:[...(p.categoryOrder||[])],
      hiddenCategories:[...(p.hiddenCategories||[])]
    },
    titles,
    categories
  };
}

function v142ExportOrder(){
  const p=v138EnsureOrderPlan();
  if(!p.titleIds.length){
    showToast('Your Order is empty.');
    return;
  }

  const payload=v142OrderExportPayload();
  const stamp=new Date().toISOString().slice(0,10);
  triggerDownload(
    new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),
    `MediaFlow_Order_${stamp}.json`
  );
  showToast(`${payload.titles.length.toLocaleString()} ordered title${payload.titles.length===1?'':'s'} exported ✓`);
}

function v142PickOrderImport(){
  document.getElementById('v142-order-import-file')?.click();
}

function v142NormalizeTitleKey(value){
  return cleanTitle(value||'').trim().toLowerCase();
}

function v142MapImportedCategoryId(importedId,importedCategories){
  const id=String(importedId||'');
  if(id && (S.categories||[]).some(c=>String(c?.id||'')===id))return id;

  const source=(importedCategories||[]).find(c=>String(c?.id||'')===id);
  const name=String(source?.name||'').trim().toLowerCase();
  if(!name)return '';
  return String((S.categories||[]).find(c=>String(c?.name||'').trim().toLowerCase()===name)?.id||'');
}

function v142FindImportedOrderItem(descriptor){
  if(!descriptor)return null;

  const direct=(S.library||[]).find(i=>String(i?.id||'')===String(descriptor.id||''));
  if(direct)return direct;

  const ext=descriptor.externalIds&&typeof descriptor.externalIds==='object'?descriptor.externalIds:{};
  const extEntries=Object.entries(ext).filter(([,v])=>v!==null&&v!==undefined&&String(v)!=='');
  if(extEntries.length){
    const byExt=(S.library||[]).find(item=>
      extEntries.some(([k,v])=>item?.externalIds?.[k]!=null && String(item.externalIds[k])===String(v))
    );
    if(byExt)return byExt;
  }

  const titleKey=v142NormalizeTitleKey(descriptor.title);
  if(!titleKey)return null;

  const all=(S.library||[]).filter(i=>v142NormalizeTitleKey(i?.title)===titleKey);
  if(!all.length)return null;

  const mappedCategory=v142MapImportedCategoryId(descriptor.categoryId,descriptor._categories||[]);
  if(mappedCategory){
    const byCategory=all.find(i=>String(i?.categoryId||'')===mappedCategory);
    if(byCategory)return byCategory;
  }

  if(descriptor.categoryName){
    const name=String(descriptor.categoryName).trim().toLowerCase();
    const byName=all.find(i=>String(v138OrderCategory(i?.categoryId)?.name||'').trim().toLowerCase()===name);
    if(byName)return byName;
  }

  return all.length===1?all[0]:null;
}

async function v142ImportOrder(file){
  if(!file)return;

  try{
    const text=await file.text();
    const data=JSON.parse(text);

    const rawPlan=(data?.orderPlan&&typeof data.orderPlan==='object')
      ? data.orderPlan
      : (Array.isArray(data?.titleIds)?data:null);if(!rawPlan || !Array.isArray(rawPlan.titleIds)){
      throw new Error('This is not a MediaFlow Order export.');
    }

    const importedCategories=Array.isArray(data?.categories)?data.categories:[];
    const descriptors=Array.isArray(data?.titles)?data.titles:[];
    const descById=new Map(
      descriptors
        .filter(x=>x&&x.id!=null)
        .map(x=>[String(x.id),Object.assign({_categories:importedCategories},x)])
    );

    const currentById=new Map(
      (S.library||[]).filter(i=>i?.id).map(i=>[String(i.id),i])
    );

    const resolved=[],seen=new Set();
    let skipped=0;

    for(const rawId of rawPlan.titleIds){
      const id=String(rawId||'');
      let item=currentById.get(id)||null;

      if(!item){
        const descriptor=descById.get(id);
        if(descriptor)item=v142FindImportedOrderItem(descriptor);
      }

      if(!item?.id){
        skipped++;
        continue;
      }

      const itemId=String(item.id);
      if(seen.has(itemId))continue;
      seen.add(itemId);
      resolved.push(itemId);
    }

    if(!resolved.length){
      throw new Error('None of the exported titles could be matched to your current Library.');
    }

    const p=v138EnsureOrderPlan();

    // Keep one recoverable copy of the current plan before replacing it.
    if(p.titleIds.length){
      p.lastClearedOrder=v142OrderSnapshotFrom(p);
    }

    const mapCatList=(arr)=>{
      const out=[],used=new Set();
      for(const rawId of (Array.isArray(arr)?arr:[])){
        const mapped=v142MapImportedCategoryId(rawId,importedCategories);
        if(mapped&&!used.has(mapped)){used.add(mapped);out.push(mapped);}
      }
      return out;
    };

    const currentCatIds=(S.categories||[]).map(c=>String(c.id));
    let categoryOrder=mapCatList(rawPlan.categoryOrder);
    for(const id of currentCatIds)if(!categoryOrder.includes(id))categoryOrder.push(id);

    p.titleIds=resolved;
    p.viewMode=rawPlan.viewMode==='category'?'category':'all';
    p.categoryMode=rawPlan.categoryMode==='custom'?'custom':'default';
    p.categoryOrder=categoryOrder;
    p.hiddenCategories=mapCatList(rawPlan.hiddenCategories);
    p.modifiedAt=Date.now();

    S.orderPlannerUI?.picks?.clear?.();
    if(S.orderPlannerUI){
      S.orderPlannerUI.search='';
      S.orderPlannerUI.page=0;
    }

    await saveState();
    render();
    if(lastSaveFailed||V115_STARTUP_GUARD)throw new Error('Order applied locally, but cloud save is unconfirmed. Retry Sync Now when connected.');

    showToast(
      `Order imported: ${resolved.length.toLocaleString()} title${resolved.length===1?'':'s'}${skipped?` · ${skipped.toLocaleString()} unmatched skipped`:''} ✓`
    );
  }catch(err){
    console.error('Order import failed',err);
    showToast(err?.message||'Could not import that Order file.');
  }
}

function v142OrderClearConfirmHtml(){
  const p=v138EnsureOrderPlan();
  const count=p.titleIds.length;
  return `<div class="priority-modal">
    <div class="v142-order-confirm-icon">🧹</div>
    <div class="modal-title">Clear Personal Order?</div>
    <div class="v142-order-confirm-copy">
      You're about to remove <b>${count.toLocaleString()} title${count===1?'':'s'}</b> from your Personal Order.
    </div>
    <div class="v142-order-confirm-box">
      <b>Your Library will not be changed.</b><br>
      Titles, progress, History, XP and scheduler data stay untouched. MediaFlow will keep one recovery copy so you can restore this exact Order afterward.
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" type="button" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-danger" type="button" onclick="App.v142ConfirmClearOrder(this)">Clear Order</button>
    </div>
  </div>`;
}

function v142OpenClearOrderConfirm(){
  const p=v138EnsureOrderPlan();
  if(!p.titleIds.length){
    showToast('Your Order is already empty.');
    return;
  }

  const existing=document.getElementById('modal-root');
  if(existing)existing.remove();

  const wrap=document.createElement('div');
  wrap.id='modal-root';
  wrap.innerHTML=`<div class="modal-overlay" onclick="if(event.target===this) App.closeModal()"><div class="modal">${v142OrderClearConfirmHtml()}</div></div>`;
  document.body.appendChild(wrap);
}

async function v142ConfirmClearOrder(button){
  if(button?.dataset?.clearing==='1')return;
  if(button){button.dataset.clearing='1';button.disabled=true;}

  const p=v138EnsureOrderPlan();
  if(!p.titleIds.length){
    App.closeModal();
    return;
  }

  p.lastClearedOrder=v142OrderSnapshotFrom(p);
  p.titleIds=[];
  p.modifiedAt=Date.now();
  S.orderPlannerUI?.picks?.clear?.();

  const modal=document.getElementById('modal-root');
  if(modal)modal.remove();
  S.modal=null;

  await saveState();
  render();
  showToast('Order cleared · Restore Last Order is available');
}

async function v142RestoreLastOrder(){
  const p=v138EnsureOrderPlan();
  const last=v142NormalizeSavedOrderSnapshot(p.lastClearedOrder,S.library,S.categories);
  if(!last?.titleIds?.length){
    p.lastClearedOrder=null;
    render();
    showToast('No cleared Order is available to restore.');
    return;
  }

  p.titleIds=[...last.titleIds];
  p.viewMode=last.viewMode;
  p.categoryMode=last.categoryMode;
  p.categoryOrder=[...last.categoryOrder];
  p.hiddenCategories=[...last.hiddenCategories];
  p.lastClearedOrder=null;
  p.modifiedAt=Date.now();

  S.orderPlannerUI?.picks?.clear?.();
  await saveState();
  render();
  showToast(`${p.titleIds.length.toLocaleString()} ordered title${p.titleIds.length===1?'':'s'} restored ✓`);
}

// Replace the old browser confirm() clear action with the designed MediaFlow modal.
v138ClearOrder=v142OpenClearOrderConfirm;
App.v138ClearOrder=v142OpenClearOrderConfirm;

// Add Order portability/recovery controls without disturbing v141's picker.
const v142RenderOrderBase=renderOrder;
renderOrder=function(){
  let h=v142RenderOrderBase();
  const p=v138EnsureOrderPlan();
  const count=p.titleIds.length;
  const canRestore=!!(p.lastClearedOrder?.titleIds?.length);

  const oldHead=`${count?`<button class="btn btn-ghost" type="button" onclick="App.v138ClearOrder()">Clear Order</button>`:''}`;
  const actions=`<div class="v142-order-head-actions">
    <button class="btn btn-ghost" type="button" onclick="App.v142ExportOrder()" ${count?'':'disabled'}>Export Order</button>
    <button class="btn btn-ghost" type="button" onclick="App.v142PickOrderImport()">Import Order</button>
    ${canRestore?`<button class="btn btn-ghost v142-order-restore" type="button" onclick="App.v142RestoreLastOrder()">Restore Last Order</button>`:''}
    ${count?`<button class="btn btn-ghost" type="button" onclick="App.v138ClearOrder()">Clear Order</button>`:''}
    <input id="v142-order-import-file" type="file" accept=".json,application/json" hidden onchange="App.v142ImportOrder(this.files?.[0]);this.value=''">
  </div>`;

  if(oldHead && h.includes(oldHead)){
    h=h.replace(oldHead,actions);
  }else{
    h=h.replace('</div>\n\n    <div class="v138-order-note">',actions+'</div>\n\n    <div class="v138-order-note">');
  }

  return h;
};

Object.assign(App,{
  v142ExportOrder,
  v142PickOrderImport,
  v142ImportOrder,
  v142ConfirmClearOrder,
  v142RestoreLastOrder
});



