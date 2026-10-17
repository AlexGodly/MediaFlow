/* MediaFlow v481 — Category Class Editor + visual assignment manager.
 * Do not touch the v480 scheduler, class scoring, account data schema or
 * existing Category editor. Reuse Category's real palettes/handlers only.
 */
const MF481_VERSION=481;
let MF481_SIDEBAR_QUERY='';
function mf481SafeId(value){return String(value==null?'':value);}
function mf481IconMarkup(target){return v144CategoryIconHtml(target||{icon:'✨'});}
function mf481ClassOptions(selectedId){
 const prefs=v480Prefs();
 return '<option value="">Unassigned</option>'+prefs.classes.map(g=>'<option value="'+escapeHtml(g.id)+'" '+
  (g.id===selectedId?'selected':'')+'>'+escapeHtml(g.name)+'</option>').join('');
}
function mf481ClassOf(categoryId){
 return v480Prefs().classes.find(c=>c.categoryIds.includes(String(categoryId)))||null;
}
function mf481SidebarHtml(){
 const all=S.categories||[];
 return '<aside class="mf481-sidebar" aria-label="Category assignment sidebar">'+
  '<div class="mf481-sidebar-head"><div><strong>Category Library</strong><small>Search and drag into a class, or use Assign</small></div>'+
  '<span class="mf481-sidebar-count">'+all.length+'</span></div>'+
  '<div class="mf481-search-field"><span aria-hidden="true">⌕</span>'+
  '<input type="search" id="mf481-manager-search" aria-label="Search categories to assign" placeholder="Search categories…" autocomplete="off" value="'+escapeHtml(MF481_SIDEBAR_QUERY)+'" oninput="App.mf481FilterSidebar(this.value)"></div>'+
  '<div class="mf481-sidebar-scroll" aria-label="All categories">'+
  all.map(cat=>{
   const owner=mf481ClassOf(cat.id),id=escapeHtml(String(cat.id));
   return '<div class="mf481-category-line'+(cat.enabled===false?' mf481-is-disabled':'')+'" draggable="true" '+
    'data-mf481-sidebar-category="'+id+'" data-mf481-filter="'+escapeHtml(String(cat.name||'').toLowerCase())+'" '+
    'ondragstart="App.mf481DragStart(event,this.dataset.mf481SidebarCategory)" ondragend="App.mf481DragEnd()">'+
    '<span class="mf481-grip" aria-hidden="true">⋮⋮</span><span class="mf481-category-art">'+mf481IconMarkup(cat)+'</span>'+
    '<div class="mf481-category-info"><b>'+escapeHtml(cat.name)+'</b>'+
    '<small>'+escapeHtml(owner?.name||'Unassigned')+(cat.enabled===false?' · Disabled':'')+'</small></div>'+
    '<select class="mf481-category-assign" aria-label="Assign '+escapeHtml(cat.name)+' to a class" '+
    'onchange="App.mf481AssignCategory(this.closest(\'[data-mf481-sidebar-category]\').dataset.mf481SidebarCategory,this.value)" '+
    'onpointerdown="event.stopPropagation()" onclick="event.stopPropagation()">'+mf481ClassOptions(owner?.id||'')+'</select></div>';
  }).join('')+
  '</div><div class="mf481-sidebar-foot">Drag categories onto a class or choose from the Assign dropdown. Disabled categories can be organized but never recommended.</div></aside>';
}
function mf481EnhancePanel(host=document){
 const panel=host.querySelector?.('.mf480-panel')||(host.matches?.('.mf480-panel')?host:null);
 if(!panel||panel.dataset.mf481Managed==='1')return false;
 const existing=panel.querySelector('.mf480-list,.mf480-empty');
 if(!existing)return false;
 const manager=document.createElement('div');manager.className='mf481-manager';
 manager.innerHTML=mf481SidebarHtml()+
  '<div class="mf481-class-drops" aria-label="Category Class drop targets">'+
  '<div class="mf481-unassign-zone" role="group" aria-label="Unassign category" data-mf481-drop-class="" '+
  'ondragover="App.mf481DragOver(event)" ondragleave="App.mf481DragLeave(event)" ondrop="App.mf481Drop(event,this.dataset.mf481DropClass)">'+
  '<span aria-hidden="true">↩</span> Drop here to unassign <small>Retains the category and its History</small></div></div>';
 existing.replaceWith(manager);
 const destination=manager.querySelector('.mf481-class-drops');
 destination.appendChild(existing);
 existing.querySelectorAll('[data-mf480-id]').forEach(card=>{
  card.classList.add('mf481-drop-class');card.dataset.mf481DropClass=card.dataset.mf480Id;
  card.setAttribute('aria-label',String(card.querySelector('.mf480-class-title b')?.textContent||'Class')+' · drop categories to assign');
  card.addEventListener('dragover',App.mf481DragOver);
  card.addEventListener('dragleave',App.mf481DragLeave);
  card.addEventListener('drop',e=>App.mf481Drop(e,card.dataset.mf481DropClass));
  const note=document.createElement('small');note.className='mf481-drop-help';note.textContent='Drop a category here to assign it';
  card.appendChild(note);
 });
 panel.dataset.mf481Managed='1';
 mf481FilterSidebar(MF481_SIDEBAR_QUERY,manager);
 return true;
}
// v480 replaces the panel after writing settings. Restore search, focus and
// independent scroll offsets so assignment never jumps to the top.
const mf481PanelRefreshBase=v480RefreshPanel;
v480RefreshPanel=function(){
 const panel=document.querySelector('.mf480-panel');
 const sidebar=panel?.querySelector('.mf481-sidebar-scroll');
 const search=panel?.querySelector('#mf481-manager-search');
 const scrollTop=sidebar?.scrollTop||0;
 const focused=document.activeElement===search;
 const cursor=focused?search.selectionStart:0;
 const pageY=window.scrollY||0;
 mf481PanelRefreshBase.apply(this,arguments);
 mf481EnhancePanel();
 const restored=document.querySelector('.mf481-sidebar-scroll');
 if(restored)restored.scrollTop=scrollTop;
 if(focused){
  const input=document.getElementById('mf481-manager-search');
  input?.focus({preventScroll:true});
  try{input?.setSelectionRange(cursor,cursor);}catch(_){}
 }
 if(Math.abs((window.scrollY||0)-pageY)>1)window.scrollTo({top:pageY,behavior:'instant'});
};
function mf481FilterSidebar(value,root=document){
 MF481_SIDEBAR_QUERY=String(value||'');
 const q=MF481_SIDEBAR_QUERY.trim().toLocaleLowerCase();
 root.querySelectorAll('[data-mf481-sidebar-category]').forEach(row=>{
  row.hidden=!!q&&!String(row.dataset.mf481Filter||'').includes(q);
 });
 const count=root.querySelector('.mf481-sidebar-count');
 if(count)count.textContent=String([...root.querySelectorAll('[data-mf481-sidebar-category]')].filter(x=>!x.hidden).length);
}
let MF481_DRAG_ID='';
function mf481DragStart(event,id){
 if(event.target?.closest('select,input,button')){event.preventDefault();return;}
 MF481_DRAG_ID=mf481SafeId(id);
 event.dataTransfer.effectAllowed='move';
 event.dataTransfer.setData('text/plain',MF481_DRAG_ID);
 document.querySelector('.mf481-manager')?.classList.add('mf481-dragging');
}
function mf481DragEnd(){
 MF481_DRAG_ID='';
 document.querySelector('.mf481-manager')?.classList.remove('mf481-dragging');
 document.querySelectorAll('.mf481-drag-over').forEach(e=>e.classList.remove('mf481-drag-over'));
}
function mf481DragOver(e){
 if(!MF481_DRAG_ID)return;
 e.preventDefault();e.dataTransfer.dropEffect='move';
 e.currentTarget.classList.add('mf481-drag-over');
}
function mf481DragLeave(e){
 if(!e.currentTarget.contains(e.relatedTarget))e.currentTarget.classList.remove('mf481-drag-over');
}
function mf481Drop(e,targetId){
 e.preventDefault();
 const id=MF481_DRAG_ID||e.dataTransfer?.getData('text/plain')||'';
 mf481DragEnd();
 mf481AssignCategory(id,targetId);
}
function mf481AssignCategory(categoryId,classId){
 const category=S.categories?.find(c=>String(c.id)===String(categoryId));
 const nextId=String(classId||''),prefs=v480Prefs();
 if(!category||nextId&&!prefs.classes.some(c=>c.id===nextId)){
  showToast('Category or Class no longer exists.');return false;
 }
 const current=prefs.classes.find(g=>g.categoryIds.includes(String(categoryId)));
 if((current?.id||'')===nextId)return true;
 for(const group of prefs.classes){
  group.categoryIds=group.categoryIds.filter(id=>String(id)!==String(categoryId));
  if(group.id===nextId)group.categoryIds.push(String(categoryId));
 }
 v480Write(prefs);
 showToast(nextId?'Category assigned to '+prefs.classes.find(g=>g.id===nextId).name:'Category unassigned');
 return true;
}
function mf481ModalIconSection(target){
 const url=v144SafeIconUrl(target.iconUrl||'');
 const emoji=url?'🖼️':String(target.icon||'✨');
 const defaultIcons=ICON_CHOICES.map(ic=>v144IconSwatchHtml('emoji',ic,emoji,url,null)).join('');
 const builtin=v258BuiltInCategoryIconPalette(url);
 return '<section class="mf481-editor-section" aria-label="Class icon">'+
  '<h3>Icon</h3><div class="v258-category-editor">'+
  '<div class="v258-palette-heading"><div><b>MediaFlow icons</b><span>Built-in artwork</span></div><small>Choose one of the packaged icons</small></div>'+builtin+
  '<div class="v258-palette-heading v258-emoji-heading"><div><b>Emoji &amp; symbols</b><span>Classic icons</span></div><small>Use the same palette as Categories</small></div>'+
  '<div class="v144-palette">'+defaultIcons+'</div>'+
  '<div class="v144-palette-title">Your saved icons</div>'+
  '<div class="v144-palette" id="v144-custom-icon-palette">'+v144CustomIconsHtml(emoji,url,target)+'</div>'+
  '<div class="v144-custom-add-grid"><div class="v144-custom-add"><label for="v144-custom-emoji">Add emoji / symbol</label>'+
  '<div class="v144-custom-add-row"><input type="text" id="v144-custom-emoji" maxlength="32" placeholder="🧠">'+
  '<button type="button" class="btn btn-sm" onclick="App.v144AddCustomCategoryEmoji()">Add</button></div></div>'+
  '<div class="v144-custom-add"><label for="v144-custom-icon-url">Add icon URL</label>'+
  '<div class="v144-custom-add-row"><input type="url" id="v144-custom-icon-url" placeholder="https://example.com/icon.png">'+
  '<button type="button" class="btn btn-sm" onclick="App.v144AddCustomCategoryUrl()">Add</button></div></div></div>'+
  '<div class="v144-current-preview"><span>Selected</span><span id="v144-current-icon-preview" class="preview-box">'+
  (url?'<img src="'+escapeHtml(url)+'" alt="" referrerpolicy="no-referrer">':escapeHtml(emoji))+'</span></div>'+
  '<input type="hidden" id="m-icon" value="'+escapeHtml(emoji)+'">'+
  '<input type="hidden" id="m-icon-url" value="'+escapeHtml(url)+'"></div></section>';
}
function mf481ModalColorSection(target){
 const selected=String(target.color||'#A78BFA').toUpperCase();
 return '<section class="mf481-editor-section" aria-label="Class color"><h3>Color</h3>'+
  '<div class="v144-palette">'+COLOR_CHOICES.map(c=>v144ColorSwatchHtml(c,selected,null)).join('')+'</div>'+
  '<div class="v144-palette-title">Your saved colors</div>'+
  '<div class="v144-palette" id="v144-custom-color-palette">'+v144CustomColorsHtml(selected,selected)+'</div>'+
  '<div class="v144-custom-add"><label for="v144-custom-color-hex">Add custom color</label>'+
  '<div class="v144-color-picker-row"><input type="color" id="v144-custom-color-picker" value="'+escapeHtml(selected)+'" oninput="document.getElementById(\'v144-custom-color-hex\').value=this.value.toUpperCase()">'+
  '<input type="text" id="v144-custom-color-hex" value="'+escapeHtml(selected)+'" maxlength="7" placeholder="#AABBCC">'+
  '<button type="button" class="btn btn-sm" onclick="App.v144AddCustomCategoryColor()">Add color</button></div></div>'+
  '<div class="v144-current-preview"><span>Selected</span><span id="v144-current-color-preview" class="preview-box" style="background:'+escapeHtml(selected)+'"></span>'+
  '<span>'+escapeHtml(selected)+'</span></div><input type="hidden" id="m-color" value="'+escapeHtml(selected)+'"></section>';
}
function mf481MembersHtml(target,prefs){
 const owners=new Map();
 prefs.classes.forEach(g=>g.categoryIds.forEach(id=>owners.set(String(id),g)));
 return (S.categories||[]).map(cat=>{
  const id=escapeHtml(String(cat.id)),owner=owners.get(String(cat.id));
  const assigned=target.categoryIds?.includes(String(cat.id));
  return '<label class="mf480-member mf481-member" data-mf481-member-name="'+escapeHtml(String(cat.name||'').toLocaleLowerCase())+'">'+
   '<input type="checkbox" data-mf480-member="'+id+'" '+(assigned?'checked':'')+
   ' onchange="App.mf481SelectionChanged()" aria-label="Assign '+escapeHtml(cat.name)+'">'+
   '<span class="mf481-member-art">'+mf481IconMarkup(cat)+'</span>'+
   '<span class="mf481-member-copy"><b>'+escapeHtml(cat.name)+'</b>'+
   (cat.enabled===false?'<small>Disabled · not eligible for recommendations</small>':'')+
   (owner&&owner.id!==target.id?'<small>Currently in '+escapeHtml(owner.name)+' · selection transfers it</small>':'')+
   '</span></label>';
 }).join('');
}
function mf481OpenEditor(id){
 if(!S.settings||!Array.isArray(S.categories)){
  showToast('Wait for your MediaFlow account to finish loading.');return;
 }
 const prefs=v480Prefs();
 const existing=prefs.classes.find(c=>c.id===String(id))||null;
 const target=existing||{name:'',icon:'✨',iconUrl:'',color:'#A78BFA',weight:1,enabled:true,categoryIds:[]};
 const previous=document.getElementById('modal-root');if(previous)previous.remove();
 const root=document.createElement('div');root.id='modal-root';root.dataset.mf480Modal='1';root.dataset.mf481Modal='1';
 const title=existing?'Edit Category Class':'Add Category Class';
 root.innerHTML='<div class="modal-overlay mf481-overlay" onclick="if(event.target===this)App.mf481CloseEditor()">'+
  '<div class="modal mf480-modal mf481-modal" id="mf480-modal" role="dialog" aria-modal="true" aria-labelledby="mf481-title">'+
   '<header class="mf481-modal-header"><div><h2 id="mf481-title">'+title+'</h2><p>Customize the class and assign categories</p></div>'+
    '<button type="button" class="mf481-close" aria-label="Close" onclick="App.mf481CloseEditor()">×</button></header>'+
   '<main class="mf481-modal-body" id="mf481-modal-body">'+
    '<section class="mf481-editor-section"><label class="field" for="mf480-name"><span class="field-label">Class name</span>'+
    '<input id="mf480-name" type="text" maxlength="80" autocomplete="off" value="'+escapeHtml(target.name)+'" placeholder="e.g. Anime"></label></section>'+
    mf481ModalIconSection(target)+mf481ModalColorSection(target)+
    '<section class="mf481-editor-section mf481-class-settings"><h3>Class settings</h3>'+
      '<div class="mf480-modal-row"><label class="field" for="mf480-weight"><span class="field-label">Class weight (1–5)</span>'+
      '<input id="mf480-weight" type="number" min="1" max="5" step="1" value="'+target.weight+'"></label>'+
      '<label class="mf480-enabled"><input id="mf480-enabled" type="checkbox" '+(target.enabled!==false?'checked':'')+'> Enabled</label></div></section>'+
    '<section class="mf481-editor-section mf481-assignment"><div class="mf481-assignment-head"><div><h3>Assigned categories</h3>'+
     '<p>Search and select; category assignments are independent of category eligibility.</p></div>'+
     '<span class="mf481-selected-count" id="mf481-selected-count">0 selected</span></div>'+
     '<div class="mf481-search-field"><span aria-hidden="true">⌕</span>'+
      '<input type="search" id="mf481-member-search" aria-label="Search categories in this class" placeholder="Search categories…" autocomplete="off" oninput="App.mf481FilterModal(this.value)"></div>'+
     '<label class="mf481-only-selected"><input type="checkbox" id="mf481-only-selected" onchange="App.mf481FilterModal()"><span>Show selected only</span></label>'+
     '<div class="mf480-members mf481-members" id="mf481-members">'+mf481MembersHtml(target,prefs)+'</div>'+
     '<p class="mf481-member-empty" id="mf481-member-empty" hidden>No matching categories.</p></section>'+
   '</main>'+
   '<footer class="mf481-modal-footer"><button type="button" class="btn btn-ghost" onclick="App.mf481CloseEditor()">Cancel</button>'+
    '<button type="button" class="btn btn-primary" onclick="App.mf481SaveClass('+escapeHtml(JSON.stringify(existing?.id||''))+',this)">Save Class</button></footer>'+
  '</div></div>';
 document.body.appendChild(root);
 mf481SelectionChanged();
 root.querySelector('#mf480-name')?.focus({preventScroll:true});
}
function mf481CloseEditor(){document.querySelector('#modal-root[data-mf481-modal="1"]')?.remove();}
function mf481SelectionChanged(){
 const modal=document.getElementById('mf480-modal');if(!modal)return;
 const count=modal.querySelectorAll('[data-mf480-member]:checked').length;
 const label=modal.querySelector('#mf481-selected-count');if(label)label.textContent=count+' selected';
 if(modal.querySelector('#mf481-only-selected')?.checked)mf481FilterModal();
}
function mf481FilterModal(value){
 const modal=document.getElementById('mf480-modal');if(!modal)return;
 const input=modal.querySelector('#mf481-member-search');
 if(typeof value==='string'&&input&&input.value!==value)input.value=value;
 const q=String(input?.value||'').trim().toLocaleLowerCase();
 const selectedOnly=modal.querySelector('#mf481-only-selected')?.checked===true;
 let visible=0;
 modal.querySelectorAll('[data-mf481-member-name]').forEach(row=>{
  const matches=(!q||String(row.dataset.mf481MemberName).includes(q))&&
    (!selectedOnly||row.querySelector('[data-mf480-member]')?.checked);
  row.hidden=!matches;if(matches)visible++;
 });
 const empty=modal.querySelector('#mf481-member-empty');if(empty)empty.hidden=visible!==0;
}
function mf481SaveClass(id,button){
 // Preserve all selections including filtered-out categories; v480's save
 // reads [data-mf480-member]:checked from the persistent modal DOM.
 return v480SaveClass(id,button);
}
App.v480OpenClassEditor=mf481OpenEditor;
App.v480CloseClassEditor=mf481CloseEditor;
App.v480SaveClass=mf481SaveClass;
Object.assign(App,{
 mf481FilterSidebar,mf481AssignCategory,mf481DragStart,mf481DragEnd,mf481DragOver,mf481DragLeave,mf481Drop,
 mf481OpenEditor,mf481CloseEditor,mf481SelectionChanged,mf481FilterModal,mf481SaveClass
});
MediaFlowRuntime.registerPageEnhancer('settings',mf481EnhancePanel);
window.MediaFlowV481=Object.freeze({version:481,editor:mf481OpenEditor,close:mf481CloseEditor,
 enhance:mf481EnhancePanel,filter:mf481FilterSidebar,assign:mf481AssignCategory});
MediaFlowRuntime.version=481;
