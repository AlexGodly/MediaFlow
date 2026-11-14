/* MediaFlow v358 — rebuild the Personal Order picker presentation around a
 * stable DOM, native canonical actions, and space-aware responsive browsing.
 * No changes to title queues, Collection assignments, XP or cloud schemas. */
const V358_RELEASE=358;
const V358_TITLE_MODES=['list','compact','cards','covers','covers-title'];
const V358_COLLECTION_SORTS=[
  ['name','Name'],['created','Date created'],['updated','Last edited'],
  ['count','Number of titles'],['completed','Completed titles'],
  ['completion','Completion percentage'],['rating','Average rating'],
  ['progress','Total progress'],['activity','Recently active'],
  ['category','Category'],['manual','Manual order'],['viewed','Recently viewed']
];
let V358_SAVE_TIMER=0;
function v358Prefs(){
  const cfg=S.settings||(S.settings={});
  const raw=cfg.v358OrderPicker&&typeof cfg.v358OrderPicker==='object'?cfg.v358OrderPicker:{};
  const mode=V358_TITLE_MODES.includes(raw.mode)?raw.mode:(window.innerWidth>=900?'cards':'list');
  const text=Number(raw.text),cover=Number(raw.cover);
  const prefs={mode,text:Number.isFinite(text)?Math.max(12,Math.min(24,Math.round(text))):15,
    cover:Number.isFinite(cover)?Math.max(36,Math.min(170,Math.round(cover))):64};
  cfg.v358OrderPicker=prefs;return prefs;
}
function v358SaveLater(){
  clearTimeout(V358_SAVE_TIMER);
  V358_SAVE_TIMER=setTimeout(()=>{try{Promise.resolve(persistSettings()).catch(()=>{});}catch(_){ }},400);
}
function v358CollectionControlsHtml(){
  const cats=v354CategoryIds('categoryFilter');
  const priorities=v354PriorityIds();
  const current=V354_COLLECTION_PICK.category;
  const selected=v138OrderCategory(current);
  const catHtml=selected?v144CategoryIconHtml(selected):'<svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>';
  const title=selected?.name||'All title categories';
  const previous=String(V354_COLLECTION_PICK.sort||'name');
  const sort=previous==='title'||previous==='alphabetic'?'name':previous==='recent'?'updated':previous;
  if(V358_COLLECTION_SORTS.some(([id])=>id===sort))V354_COLLECTION_PICK.sort=sort;
  const dir=V354_COLLECTION_PICK.dir==='desc'?'desc':'asc';
  const categories=`<button type="button" class="mf358-cat-choice ${current==='all'?'active':''}" data-v225-iconified="1" data-search="all title categories" onclick="App.v358CategoryPick('all')"><span class="mf358-cat-icon">${!selected?catHtml:'▦'}</span><span>All title categories</span></button>`+
    cats.map(id=>{const cat=v138OrderCategory(id);return cat?`<button type="button" class="mf358-cat-choice ${current===id?'active':''}" data-v225-iconified="1" data-search="${escapeHtml(v291NormalizeCategorySearch(cat.name))}" onclick="App.v358CategoryPick('${escapeHtml(id)}')"><span class="mf358-cat-icon">${v144CategoryIconHtml(cat)}</span><span>${escapeHtml(cat.name)}</span></button>`:'';}).join('');
  return `<details class="mf354-collection-filter-disclosure mf358-collection-filters"><summary data-v225-iconified="1">Filters & sorting <span class="mf358-summary-chevron" aria-hidden="true">⌄</span></summary>
    <div class="mf354-collection-picker-controls mf358-filters-grid">
      <div class="mf358-filter-control mf358-category-field"><span class="mf358-filter-label">Filter titles by category</span>
        <details class="mf358-cat-menu"><summary data-v225-iconified="1"><span class="mf358-current-category">${catHtml}<span>${escapeHtml(title)}</span></span><span aria-hidden="true">⌄</span></summary>
          <div class="mf358-cat-panel"><input type="search" autocomplete="off" aria-label="Search Collection categories" placeholder="Search categories…" oninput="App.v358CategorySearch(this)"><div class="mf358-cat-options">${categories}</div><p class="mf358-cat-empty" hidden>No matching categories.</p></div>
        </details>
      </div>
      <label class="mf358-filter-control"><span>Filter by priority</span><select aria-label="Collection priority filter" onchange="App.v354SetCollectionPicker('priority',this.value)"><option value="all">All priorities</option>${priorities.map(id=>`<option value="${escapeHtml(id)}" ${V354_COLLECTION_PICK.priority===id?'selected':''}>${escapeHtml(id.charAt(0).toUpperCase()+id.slice(1))}</option>`).join('')}</select></label>
      <label class="mf358-filter-control"><span>Sort Collections</span><select data-mf357-sort-ready="1" aria-label="Collection sort filter" onchange="App.v354SetCollectionPicker('sort',this.value)">${V358_COLLECTION_SORTS.map(([id,label])=>`<option value="${id}" ${sort===id?'selected':''}>${label}</option>`).join('')}</select></label>
      <div class="mf358-filter-control"><span class="mf358-filter-label">Direction</span><button type="button" class="mf358-sort-direction" aria-label="Toggle Collection sort direction" onclick="App.v358Direction()" data-v225-iconified="1">${dir==='asc'?V357_INLINE_ICONS.ascending:V357_INLINE_ICONS.descending}<span>${dir==='asc'?'Ascending':'Descending'}</span></button></div>
    </div>
  </details>`;
}

/* Render the Collection filters in the same initial HTML as the dialog. This
 * avoids v357's fragile enhancement-after-opening/hidden native dropdowns. */
const v358CollectionHtmlBase=v287CollectionPickerHtml;
v287CollectionPickerHtml=function(){
  let html=String(v358CollectionHtmlBase.apply(this,arguments));
  html=html.replace(/<details class="mf354-collection-filter-disclosure"[\s\S]*?<\/details>/,v358CollectionControlsHtml());
  return html;
};
function v358CategorySearch(input){
  const panel=input?.closest('.mf358-cat-panel');if(!panel)return;
  const q=v291NormalizeCategorySearch(input.value);
  let count=0;
  panel.querySelectorAll('.mf358-cat-choice').forEach(el=>{
    el.hidden=!!q&&!String(el.dataset.search||'').includes(q);if(!el.hidden)count++;
  });
  const none=panel.querySelector('.mf358-cat-empty');if(none)none.hidden=count>0;
}
function v358CategoryPick(id){
  V354_COLLECTION_PICK.category=String(id||'all');
  const box=document.querySelector('.mf358-cat-menu');
  if(box){
    const cat=v138OrderCategory(id);
    const summary=box.querySelector('.mf358-current-category');
    if(summary){
      const all=box.querySelector('.mf358-cat-choice[data-search="all title categories"] .mf358-cat-icon')?.innerHTML||'▦';
      summary.innerHTML=`${cat?v144CategoryIconHtml(cat):all}<span>${escapeHtml(cat?.name||'All title categories')}</span>`;
    }
    box.querySelectorAll('.mf358-cat-choice').forEach(el=>el.classList.toggle('active',el.getAttribute('onclick')?.includes(`'${id}'`)));
    const input=box.querySelector('input[type=search]');if(input){input.value='';v358CategorySearch(input);}
    box.open=false;
  }
  v287RefreshCollectionPicker();
}
function v358Direction(){
  V354_COLLECTION_PICK.dir=V354_COLLECTION_PICK.dir==='desc'?'asc':'desc';
  const btn=document.querySelector('.mf358-sort-direction');
  if(btn)btn.innerHTML=`${V357_INLINE_ICONS[V354_COLLECTION_PICK.dir==='asc'?'ascending':'descending']}<span>${V354_COLLECTION_PICK.dir==='asc'?'Ascending':'Descending'}</span>`;
  v287RefreshCollectionPicker();
}

/* All requested Collection sort dimensions derive from actual stored fields
 * or the titles currently in the Collection. Absent timestamps/ratings sort
 * last, rather than inventing meaningful dates or scores. */
v287CollectionMatches=function(){
  const ui=v287OrderUI(),q=v291NormalizeCategorySearch(ui.v287CollectionSearch||'');
  const cfg=V354_COLLECTION_PICK,dir=cfg.dir==='desc'?-1:1,kind=cfg.sort||'name';
  const originals=v287Collections();
  const library=new Map((S.library||[]).filter(i=>i?.id).map(i=>[String(i.id),i]));
  const order=v354CategoryIds('categoryFilter');
  const categories=new Map((S.categories||[]).filter(c=>c?.id).map(c=>[String(c.id),c]));
  // History's per-title loggedAt is authoritative for Recently active;
  // do not silently equate editing or opening a title with consuming it.
  const loggedById=new Map();
  if(kind==='activity')for(const session of S.sessions||[]){
    if(!session||session.status==='skipped')continue;
    const entries=Array.isArray(session.titles)&&session.titles.length?session.titles:[{libraryId:session.libraryId,loggedAt:session.timestamp}];
    for(const entry of entries){
      const id=String(entry?.libraryId||'');if(!id)continue;
      const stamp=Number(entry?.loggedAt)||Number(session?.timestamp)||0;
      if(stamp>0&&stamp>(loggedById.get(id)||0))loggedById.set(id,stamp);
    }
  }
  const getDate=x=>{if(!x)return null;const num=Number(x);if(Number.isFinite(num)&&num>0)return num;const parsed=Date.parse(String(x));return Number.isFinite(parsed)?parsed:null;};
  const values=originals.map((c,index)=>{
    const ids=v287CollectionTitleIds(c),items=ids.map(id=>library.get(String(id))).filter(Boolean);
    const cats=items.map(i=>String(i.categoryId||''));
    const priorities=items.map(i=>String(i.priority||'medium').toLowerCase());
    const completed=items.filter(v287IsCompleted).length;
    const rated=items.filter(i=>Number(i.rating)>0);
    const statusProgress=items.reduce((acc,i)=>acc+(Number(i.progress)||0),0);
    const total=items.reduce((acc,i)=>acc+Math.max(0,Number(i.total)||0),0);
    const progress=total>0?items.reduce((acc,i)=>acc+Math.min(Math.max(0,Number(i.progress)||0),Math.max(0,Number(i.total)||0)),0)/total*100:(items.length?completed/items.length*100:0);
    const activity=kind==='activity'?(ids.reduce((acc,id)=>Math.max(acc,loggedById.get(String(id))||0),0)||null):null;
    const primaryCat=order.find(id=>cats.includes(id))||cats[0]||null;
    return {c,index,ids,cats,priorities,completed,avg:rated.length?rated.reduce((a,i)=>a+Number(i.rating),0)/rated.length:null,totalProgress:statusProgress,progress,
      updated:getDate(c.updatedAt||c.modifiedAt),created:getDate(c.createdAt),viewed:getDate(c.lastViewedAt),activity,category:primaryCat,categoryName:categories.get(primaryCat)?.name||null};
  });
  const filtered=values.filter(row=>{
    if(q&&!v291NormalizeCategorySearch(`${row.c.title||''} ${row.c.description||''}`).includes(q))return false;
    if(cfg.category!=='all'&&!row.cats.includes(cfg.category))return false;
    if(cfg.priority!=='all'&&!row.priorities.includes(String(cfg.priority).toLowerCase()))return false;
    return true;
  });
  const cmp=(a,b)=>String(a||'').localeCompare(String(b||''),undefined,{sensitivity:'base',numeric:true});
  const byValue=(a,b)=>{
    if(a===null||a===undefined||!Number.isFinite(Number(a)))return b===null||b===undefined||!Number.isFinite(Number(b))?0:1;
    if(b===null||b===undefined||!Number.isFinite(Number(b)))return -1;
    return (a-b)*dir;
  };
  filtered.sort((a,b)=>{
    let d=0;
    if(kind==='name'||kind==='title'||kind==='alphabetic')d=cmp(a.c.title,b.c.title)*dir;
    else if(kind==='category')d=(a.categoryName===null?(b.categoryName===null?0:1):b.categoryName===null?-1:cmp(a.categoryName,b.categoryName)*dir);
    else if(kind==='manual')d=(a.index-b.index)*dir;
    else {
      const field=({count:'ids',created:'created',updated:'updated',recent:'updated',completed:'completed',completion:'progress',rating:'avg',progress:'totalProgress',activity:'activity',viewed:'viewed'})[kind]||'updated';
      d=byValue(field==='ids'?a.ids.length:a[field],field==='ids'?b.ids.length:b[field]);
    }
    return d||cmp(a.c.title,b.c.title)||a.index-b.index;
  });
  return filtered.map(x=>x.c);
};

function v358TitleControls(){
  const p=v358Prefs(),types=[['list','List'],['compact','Compact'],['cards','Cards'],['covers','Covers'],['covers-title','Covers+Titles']];
  return `<div class="mf358-title-display"><div class="mf358-mode-buttons" role="group" aria-label="Add Titles display mode">${types.map(([mode,label])=>`<button type="button" class="mf358-mode-btn ${mode===p.mode?'active':''}" aria-pressed="${mode===p.mode}" data-v225-iconified="1" onclick="App.v358TitleMode('${mode}')">${label}</button>`).join('')}</div>
    <div class="mf358-size-controls"><label>Text <input type="range" aria-label="Add Titles text size" min="12" max="24" value="${p.text}" oninput="App.v358TitleSize('text',this.value)"><output data-size="text">${p.text}px</output></label>
    <label>Cover <input type="range" aria-label="Add Titles cover size" min="36" max="170" value="${p.cover}" oninput="App.v358TitleSize('cover',this.value)"><output data-size="cover">${p.cover}px</output></label></div></div>`;
}
function v358TitleMode(mode){
  if(!V358_TITLE_MODES.includes(mode))return;
  const p=v358Prefs();p.mode=mode;
  const results=document.querySelector('.mf358-title-sheet #v138-order-picker-results');
  if(results){V358_TITLE_MODES.forEach(m=>results.classList.remove('mf358-mode-'+m));results.classList.add('mf358-mode-'+mode);}
  document.querySelectorAll('.mf358-mode-btn').forEach(btn=>{
    const active=btn.getAttribute('onclick')?.includes(`'${mode}'`);
    btn.classList.toggle('active',!!active);btn.setAttribute('aria-pressed',String(!!active));
  });
  v358SaveLater();
}
function v358TitleSize(key,value){
  if(!['text','cover'].includes(key))return;
  const n=Number(value);if(!Number.isFinite(n))return;
  const p=v358Prefs();p[key]=Math.max(key==='text'?12:36,Math.min(key==='text'?24:170,Math.round(n)));
  const results=document.querySelector('.mf358-title-sheet #v138-order-picker-results');
  if(results)results.style.setProperty(key==='text'?'--mf358-text':'--mf358-cover',p[key]+'px');
  document.querySelectorAll(`.mf358-size-controls output[data-size="${key}"]`).forEach(o=>o.textContent=p[key]+'px');
  v358SaveLater();
}
function v358UpgradeSheet(){
  const sheet=document.querySelector('.mf354-sheet-backdrop .mf356-browse-sheet');
  if(!sheet)return;
  const kind=sheet.dataset.kind;
  if(kind==='title'){
    sheet.classList.add('mf358-title-sheet');
    const card=sheet.querySelector('.mf356-browse-card');
    const result=card?.querySelector('#v138-order-picker-results'),pager=card?.querySelector('#v140-order-picker-pager');
    if(card&&result&&pager){
      let panel=card.querySelector(':scope > .mf358-results-panel');
      if(!panel){
        panel=document.createElement('div');panel.className='mf358-results-panel';
        result.before(panel);
        panel.innerHTML=v358TitleControls();
        panel.append(result,pager);
      }
      const p=v358Prefs();
      result.className='v138-picker-results mf358-title-results mf358-mode-'+p.mode;
      result.style.setProperty('--mf358-text',p.text+'px');
      result.style.setProperty('--mf358-cover',p.cover+'px');
    }
    // This assertion identifies unexpected legacy wrapper duplication rather
    // than hiding several nested copies in CSS. Reuse the oldest actual holder.
    const wrappers=[...card.querySelectorAll('.mf356-title-filters')];
    if(wrappers.length)wrappers[0].open=false;
    if(wrappers.length>1){
      const tools=card.querySelector('#v140-order-picker-tools');
      const first=wrappers[0];
      if(tools&&!first.contains(tools))first.appendChild(tools);
      wrappers.slice(1).forEach(node=>node.remove());
    }
  } else if(kind==='collection'){
    sheet.classList.add('mf358-collection-sheet');
    const old=sheet.querySelector('select[aria-label="Collection category filter"]');
    // Defensive replacement for already-rendered v357 picker cards.
    const disclosure=sheet.querySelector('.mf354-collection-filter-disclosure');
    if(disclosure&&!disclosure.matches('.mf358-collection-filters')){
      const repl=document.createElement('div');repl.innerHTML=v358CollectionControlsHtml();
      disclosure.replaceWith(repl.firstElementChild);
    }
    sheet.querySelectorAll('.mf357-inline-picker-popover').forEach(el=>el.remove());
  }
}
const v358OpenBase=App.v354OpenSheet;
App.v354OpenSheet=function(kind){
  const out=v358OpenBase.apply(this,arguments);
  v358UpgradeSheet();
  return out;
};
const v358BtnIconsBase=v225ButtonIconName;
v225ButtonIconName=function(el){
  if(el?.matches?.('.mf358-cat-choice,.mf358-mode-btn,.mf358-cat-menu>summary,.mf358-sort-direction'))return null;
  return v358BtnIconsBase.apply(this,arguments);
};
Object.assign(App,{v358CategorySearch,v358CategoryPick,v358Direction,v358TitleMode,v358TitleSize});
MediaFlowRuntime.version=V358_RELEASE;
window.MediaFlowV358={version:358,features:['Stable filters on repeated dialog reopen','5 Personal Order title views with text and cover sizing','Full-width desktop dialogs and multicolumn browsing','Searchable icon-based Collection category filter','One-click sort direction and 12 Collection sort modes','Unclipped title/Collection artwork']};
