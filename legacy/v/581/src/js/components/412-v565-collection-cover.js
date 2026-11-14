/* MediaFlow v565 — a collection's cover can be a title's cover.
 *
 * Collection fields
 *   coverUrl           unchanged: the picture shown (also what older versions use)
 *   mf565CoverTitleId  the title whose cover this is; the collection follows
 *                      that title when its cover changes (e.g. Cover Recovery).
 * Choices in the collection editor: Automatic (empty), From this collection,
 * From the Library, or an image link (typing a link clears the title).
 * If the title is deleted, the collection keeps its last cover.
 * The collection model also keeps versioned fields it doesn't know (mf… / v123…),
 * so fields written by the MediaFlow app survive a save here.
 */
const MF565_COL={picker:null};
const MF565_VERSIONED_KEY=/^(mf|v)\d{3}/;

const mf565NormalizeCollectionBase=v274NormalizeCollection;
v274NormalizeCollection=function(raw){
  const c=mf565NormalizeCollectionBase.apply(this,arguments);
  if(raw&&typeof raw==='object')for(const k of Object.keys(raw))if(MF565_VERSIONED_KEY.test(k)&&!(k in c))c[k]=raw[k];
  return c;
};

function mf565TitleById(id){
  const sid=String(id||'');if(!sid)return null;
  try{const idx=v156EnsureOrderIndexes?.()?.libraryById;const hit=idx?.get(sid);if(hit)return hit;}catch(_){}
  return (S.library||[]).find(x=>String(x?.id)===sid)||null;
}
// The cover a collection shows: its title's current cover, else the saved link.
function mf565CollectionCoverUrl(c){
  const t=c?.mf565CoverTitleId?mf565TitleById(c.mf565CoverTitleId):null;
  const live=t?v274CoverUrl(t):'';
  return live||v274Text(c?.coverUrl);
}
const mf565CollectionCoverHtmlBase=v274CollectionCoverHtml;
v274CollectionCoverHtml=function(c){
  if(c&&c.mf565CoverTitleId){
    const url=mf565CollectionCoverUrl(c);
    if(url&&url!==c.coverUrl)mf565SyncCover(c,url);
    const args=[...arguments];args[0]=Object.assign({},c,{coverUrl:url});
    return mf565CollectionCoverHtmlBase.apply(this,args);
  }
  return mf565CollectionCoverHtmlBase.apply(this,arguments);
};
// Keep the saved link in step with the title, so older versions see it too.
let MF565_COVER_SYNC=0;
function mf565SyncCover(c,url){
  c.coverUrl=url;
  clearTimeout(MF565_COVER_SYNC);
  MF565_COVER_SYNC=setTimeout(()=>{try{saveState();}catch(_){}},4000);
}

/* ---------- editor ---------- */
const mf565CollectionFormBase=v279CollectionFormHtml;
v279CollectionFormHtml=function(c){
  let html=String(mf565CollectionFormBase.apply(this,arguments)||'');
  const titleId=String(c?.mf565CoverTitleId||'');
  const t=titleId?mf565TitleById(titleId):null;
  const picked='<div class="mf565-col-cover" data-mf565-col-cover>'+
    '<input type="hidden" id="mf565-col-cover-title" value="'+escapeHtml(titleId)+'">'+
    '<span class="mf565-col-cover-now" id="mf565-col-cover-now">'+(t?'Cover of '+escapeHtml(cleanTitle(t.title)):titleId?'Last cover of a deleted title':c?.coverUrl?'Image link':'Automatic: covers from the collection\'s titles')+'</span>'+
    '<div class="mf565-col-cover-actions">'+
      (c?'<button type="button" class="btn btn-sm" onclick="App.mf565PickCollectionCover(\'collection\',\''+escapeHtml(String(c.id))+'\')">From this collection</button>':'')+
      '<button type="button" class="btn btn-sm" onclick="App.mf565PickCollectionCover(\'library\',\''+escapeHtml(String(c?.id||''))+'\')">From the Library</button>'+
      '<button type="button" class="btn btn-sm btn-ghost" onclick="App.mf565ClearCollectionCover()">Automatic</button>'+
    '</div></div>';
  html=html.replace('<input id="mf274-col-cover" type="url"','<input id="mf274-col-cover" oninput="App.mf565CoverLinkTyped()" type="url"');
  const anchor='placeholder="https://…"></div>';
  return html.includes(anchor)?html.replace(anchor,'placeholder="https://…">'+picked+'</div>'):html;
};
v274CollectionFormHtml=v279CollectionFormHtml;
function mf565CoverLinkTyped(){
  const hidden=document.getElementById('mf565-col-cover-title');
  if(hidden&&hidden.value){hidden.value='';const now=document.getElementById('mf565-col-cover-now');if(now)now.textContent='Image link';}
}
function mf565ClearCollectionCover(){
  const input=document.getElementById('mf274-col-cover'),hidden=document.getElementById('mf565-col-cover-title'),now=document.getElementById('mf565-col-cover-now');
  if(input)input.value='';if(hidden)hidden.value='';if(now)now.textContent='Automatic: covers from the collection\'s titles';
}
function mf565PickerItems(){
  const p=MF565_COL.picker;if(!p)return [];
  const q=String(p.query||'').trim();
  let items=p.scope==='collection'?v274CollectionItems(v274CollectionById(p.collectionId)):(S.library||[]);
  items=items.filter(i=>i&&v274CoverUrl(i)&&(!q||mf565NameMatches(i,q)));
  return items.slice(0,p.scope==='collection'?400:120);
}
function mf565PaintPicker(){
  const p=MF565_COL.picker;
  document.getElementById('mf565-cover-picker')?.remove();
  if(!p)return;
  const items=mf565PickerItems();
  const el=document.createElement('div');
  el.id='mf565-cover-picker';el.className='modal-overlay mf274-overlay mf565-cover-picker';
  el.addEventListener('click',e=>{if(e.target===el)mf565ClosePicker();});
  el.innerHTML='<div class="modal mf565-picker-box" role="dialog" aria-modal="true" aria-label="Choose a cover">'+
    '<div class="modal-title">'+(p.scope==='collection'?'Cover from this collection':'Cover from the Library')+'</div>'+
    '<input type="search" class="mf565-picker-search" placeholder="Search titles (any name)…" value="'+escapeHtml(p.query||'')+'">'+
    '<div class="mf565-picker-grid">'+(items.length?items.map(i=>'<button type="button" class="mf565-picker-cover" data-id="'+escapeHtml(String(i.id))+'" title="'+escapeHtml(cleanTitle(i.title))+'">'+
      '<img src="'+escapeHtml(v274CoverUrl(i))+'" alt="" loading="lazy" onerror="this.parentElement.remove()"><span>'+escapeHtml(cleanTitle(i.title))+'</span></button>').join(''):
      '<p class="hint">No titles with a cover'+(p.query?' match this search':'')+'.</p>')+'</div>'+
    '<div class="modal-actions"><button type="button" class="btn btn-ghost" onclick="App.mf565ClosePicker()">Cancel</button></div></div>';
  document.body.appendChild(el);
  const search=el.querySelector('.mf565-picker-search');
  search.addEventListener('input',()=>{p.query=search.value;clearTimeout(p.timer);p.timer=setTimeout(()=>{const pos=search.selectionStart;mf565PaintPicker();const s=document.querySelector('#mf565-cover-picker .mf565-picker-search');s?.focus();try{s?.setSelectionRange(pos,pos);}catch(_){}},180);});
  el.querySelectorAll('.mf565-picker-cover').forEach(b=>b.addEventListener('click',()=>mf565ChooseCover(b.dataset.id)));
  if(!p.query)search.focus();
}
function mf565PickCollectionCover(scope,collectionId){
  MF565_COL.picker={scope:scope==='collection'?'collection':'library',collectionId:String(collectionId||''),query:''};
  mf565PaintPicker();
}
function mf565ClosePicker(){MF565_COL.picker=null;mf565PaintPicker();}
function mf565ChooseCover(titleId){
  const t=mf565TitleById(titleId);if(!t)return;
  const input=document.getElementById('mf274-col-cover'),hidden=document.getElementById('mf565-col-cover-title'),now=document.getElementById('mf565-col-cover-now');
  if(input)input.value=v274CoverUrl(t);
  if(hidden)hidden.value=String(t.id);
  if(now)now.textContent='Cover of '+cleanTitle(t.title);
  mf565ClosePicker();
}
// Wraps the public action, keeping the XP and floating-dock wrappers around it.
const mf565SaveCollectionBase=App.v274SaveCollection;
App.v274SaveCollection=async function(id){
  const titleId=String(document.getElementById('mf565-col-cover-title')?.value||'');
  const before=new Set((S.collections||[]).map(c=>String(c?.id)));
  const result=await mf565SaveCollectionBase.apply(this,arguments);
  const c=id?v274CollectionById(id):(S.collections||[]).find(x=>x&&!before.has(String(x.id)));
  if(c&&String(c.mf565CoverTitleId||'')!==titleId){
    if(titleId)c.mf565CoverTitleId=titleId;else delete c.mf565CoverTitleId;
    try{v274TouchCollection(c);await saveState();render();}catch(_){}
  }
  return result;
};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&MF565_COL.picker){e.preventDefault();e.stopImmediatePropagation();mf565ClosePicker();}},true);

Object.assign(App,{mf565PickCollectionCover,mf565ClosePicker,mf565ClearCollectionCover,mf565CoverLinkTyped});
window.MediaFlowV565=Object.assign(window.MediaFlowV565||{},{collectionCoverUrl:mf565CollectionCoverUrl});
