/* ============================================================
   MediaFlow v157 — Direct Numeric Ordering
   ------------------------------------------------------------
   Category Settings:
   - keep drag + ↑/↓
   - add exact 1-based position input.

   Order:
   - keep drag + ↑/↓
   - add exact 1-based title position input.
   - All Titles uses global Order position.
   - By Category uses the title's position inside that category only.

   These controls mutate the SAME existing categoryOrder / orderPlan data,
   so cloud sync, Full Backup, Automatic Backup and import need no new schema.
   ============================================================ */

function v157NormalizePosition(raw,max){
  const n=Math.round(Number(raw));
  if(!Number.isFinite(n)||max<1)return null;
  return Math.max(1,Math.min(max,n));
}

function v157SetCategoryPosition(id,rawPosition){
  const sid=String(id||'');
  const current=S.categories.findIndex(c=>String(c?.id||'')===sid);
  if(current<0)return;

  const position=v157NormalizePosition(rawPosition,S.categories.length);
  if(position==null){render();return;}

  const target=position-1;
  if(target===current){render();return;}

  const [category]=S.categories.splice(current,1);
  S.categories.splice(target,0,category);

  // Existing category persistence updates explicit categoryOrder + cloud.
  persistCategories();
  render();
  showToast(`${category.name} moved to #${position}`);
}

function v157SetOrderTitlePosition(id,rawPosition,catId=''){
  const p=v138EnsureOrderPlan();
  const sid=String(id||'');
  const cid=String(catId||'');

  if(!p.titleIds.includes(sid)){render();return;}

  if(!cid){
    const current=p.titleIds.indexOf(sid);
    const position=v157NormalizePosition(rawPosition,p.titleIds.length);
    if(position==null){render();return;}

    const target=position-1;
    if(target===current){render();return;}

    p.titleIds.splice(current,1);
    p.titleIds.splice(target,0,sid);
    v138TouchOrderPlan();
    render();

    const item=v138OrderItem(sid);
    showToast(`${cleanTitle(item?.title||'Title')} moved to #${position}`);
    return;
  }

  // In grouped By Category view the visible number is category-local.
  // Preserve all global interleaving slots and only reorder titles occupying
  // this category's existing slots.
  const st=v156EnsureOrderStructure();
  const ids=(st.byCategory.get(cid)||[]).slice();
  const current=ids.indexOf(sid);
  const position=v157NormalizePosition(rawPosition,ids.length);
  if(current<0||position==null){render();return;}

  const target=position-1;
  if(target===current){render();return;}

  const positions=ids
    .map(titleId=>st.globalIndex.get(String(titleId)))
    .filter(Number.isInteger)
    .sort((a,b)=>a-b);

  ids.splice(current,1);
  ids.splice(target,0,sid);

  if(positions.length!==ids.length){render();return;}
  positions.forEach((globalPos,i)=>{p.titleIds[globalPos]=ids[i];});

  v138TouchOrderPlan();
  render();

  const item=v138OrderItem(sid);
  const cat=v138OrderCategory(cid);
  showToast(`${cleanTitle(item?.title||'Title')} moved to #${position} in ${cat?.name||'category'}`);
}

// FINAL v157 Order row renderer: the position itself is editable.
v138OrderRowHtml=function(item,position,scopeCatId=''){
  const cat=v138OrderCategory(item.categoryId);
  const st=v156EnsureOrderStructure();
  const id=String(item.id);
  const catId=String(scopeCatId||'');

  const globalIndex=st.globalIndex.get(id);
  let scopedIndex,scopedLength;
  if(catId){
    const ids=st.byCategory.get(catId)||[];
    scopedIndex=st.categoryIndex.get(`${catId}\u0000${id}`);
    scopedLength=ids.length;
  }else{
    scopedIndex=globalIndex;
    scopedLength=v138EnsureOrderPlan().titleIds.length;
  }

  const canUp=Number.isInteger(scopedIndex)&&scopedIndex>0;
  const canDown=Number.isInteger(scopedIndex)&&scopedIndex>=0&&scopedIndex<scopedLength-1;
  const status=v199StatusLabel(item.status);
  const moveFn=catId?'v138MoveTitleInCategory':'v138MoveTitle';
  const moveArgs=catId?`'${id}','${catId}'`:`'${id}'`;

  return `<div class="v138-order-row" draggable="true"
      ondragstart="App.v138OrderDragStart(event,'${id}','${catId}')"
      ondragend="App.v138OrderDragEnd(event)"
      ondragover="App.v138OrderDragOver(event)"
      ondrop="App.v138OrderDrop(event,'${id}','${catId}')">
    <div class="v138-order-pos v157-order-pos" title="${catId?'Position inside category':'Global Order position'}">
      <input class="v157-position-input" type="number" min="1" max="${Math.max(1,scopedLength)}" step="1" value="${position}"
        draggable="false"
        aria-label="Set ${escapeHtml(cleanTitle(item.title))} order position"
        onclick="event.stopPropagation()" onmousedown="event.stopPropagation()" onpointerdown="event.stopPropagation()"
        ondragstart="event.preventDefault();event.stopPropagation();"
        onkeydown="if(event.key==='Enter'){this.blur();}"
        onchange="App.v157SetOrderTitlePosition('${id}',this.value,'${catId}')">
    </div>
    <div>${v138OrderCover(item,cat)}</div>
    <div class="v138-order-copy">
      <span class="v138-order-title">${escapeHtml(cleanTitle(item.title))}</span>
      <div class="v138-order-meta">
        <span>${v144CategoryIconHtml(cat)} ${escapeHtml(cat?.name||'Unknown')}</span>
        <span>·</span>
        <span>${escapeHtml(v199StatusLabel(status))}</span>
        <span>·</span>
        <span>${escapeHtml(v138ProgressText(item))}</span>
      </div>
    </div>
    <div class="v138-order-actions">
      <span class="v138-drag-handle" title="Drag to reorder">☰</span>
      <button class="btn btn-sm btn-ghost" type="button" ${canUp?'':'disabled'} onclick="App.${moveFn}(${moveArgs},-1)" title="Move up">↑</button>
      <button class="btn btn-sm btn-ghost" type="button" ${canDown?'':'disabled'} onclick="App.${moveFn}(${moveArgs},1)" title="Move down">↓</button>
      <button class="btn btn-sm btn-ghost" type="button" onclick="App.v138RemoveOrderTitle('${id}')" title="Remove from Order only">Remove</button>
    </div>
  </div>`;
};

Object.assign(App,{
  v157SetCategoryPosition,
  v157SetOrderTitlePosition
});



