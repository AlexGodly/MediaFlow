/* MediaFlow v482 — readable class assignments in the Category Library.
 * Native <select> inherited generic form-picker chrome (grid icon + arrow)
 * and v481 limited the text to 90px, clipping Anime / Unassigned to A / U.
 * Use an accessible, scoped full-label trigger plus a viewport-positioned
 * menu that cannot be clipped by the scrollable Category Library sidebar.
 */
const MF482_VERSION=482;
let MF482_ACTIVE=null;
function mf482AssignmentControl(cat,owner){
 const id=escapeHtml(String(cat?.id??''));
 const name=String(cat?.name||'Category');
 const assigned=String(owner?.name||'Unassigned');
 return '<div class="mf482-assign" data-mf482-category="'+id+'">'+
  '<button type="button" class="mf482-assign-trigger" aria-haspopup="listbox" aria-expanded="false" '+
    'aria-label="Assign '+escapeHtml(name)+' to a Category Class. Currently '+escapeHtml(assigned)+'" '+
    'title="'+escapeHtml(assigned)+'" '+
    'onclick="App.mf482ToggleAssignment(this,event)" onpointerdown="event.stopPropagation()">'+
   '<span class="mf482-assign-label">'+escapeHtml(assigned)+'</span>'+
   '<svg class="mf482-assign-chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>'+
  '</button></div>';
}
function mf482CloseAssignment(restoreFocus=false){
 const current=MF482_ACTIVE;
 MF482_ACTIVE=null;
 document.getElementById('mf482-assignment-menu')?.remove();
 if(current?.trigger?.isConnected){
  current.trigger.setAttribute('aria-expanded','false');
  if(restoreFocus)current.trigger.focus({preventScroll:true});
 }
}
function mf482PopupOptions(categoryId,ownerId){
 const classes=v480Prefs().classes;
 const entries=[{id:'',name:'Unassigned'},...classes.map(c=>({id:String(c.id),name:String(c.name)}))];
 return entries.map(({id,name})=>
  '<button type="button" role="option" class="mf482-assign-option'+(id===ownerId?' mf482-assigned':'')+'" '+
   'aria-selected="'+(id===ownerId)+'" data-mf482-class="'+escapeHtml(id)+'" '+
   'onclick="App.mf482ChooseAssignment(this.dataset.mf482Class)">'+
   '<span class="mf482-option-label">'+escapeHtml(name)+'</span>'+
   (id===ownerId?'<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 12 5 5L20 7"/></svg>':'')+
  '</button>').join('');
}
function mf482PositionAssignment(trigger,menu){
 const r=trigger.getBoundingClientRect(),w=Math.min(Math.max(r.width,214),Math.max(170,window.innerWidth-18));
 menu.style.width=w+'px';
 const left=Math.max(8,Math.min(r.left,window.innerWidth-w-8));
 menu.style.left=left+'px';
 const availableBelow=window.innerHeight-r.bottom-9;
 const availableAbove=r.top-9;
 const preferBelow=availableBelow>=150||availableBelow>=availableAbove;
 const maxHeight=Math.max(88,Math.min(304,(preferBelow?availableBelow:availableAbove)-4));
 menu.style.maxHeight=maxHeight+'px';
 // Position after adding to the DOM so actual menu height is measurable.
 const h=Math.min(menu.scrollHeight,maxHeight);
 const y=preferBelow?Math.min(window.innerHeight-h-8,r.bottom+5):Math.max(8,r.top-5-h);
 menu.style.top=Math.max(8,y)+'px';
}
function mf482ToggleAssignment(trigger,event){
 event?.stopPropagation();
 if(MF482_ACTIVE?.trigger===trigger){mf482CloseAssignment(true);return;}
 mf482CloseAssignment(false);
 const categoryId=String(trigger.closest('[data-mf482-category]')?.dataset.mf482Category||'');
 if(!S.categories?.some(c=>String(c.id)===categoryId))return;
 const owner=v480Prefs().classes.find(c=>c.categoryIds.includes(categoryId));
 const menu=document.createElement('div');
 menu.id='mf482-assignment-menu';
 menu.className='mf482-assignment-menu';
 menu.setAttribute('role','listbox');
 menu.setAttribute('aria-label','Assign category to class');
 menu.innerHTML=mf482PopupOptions(categoryId,String(owner?.id||''));
 document.body.appendChild(menu);
 trigger.setAttribute('aria-expanded','true');
 MF482_ACTIVE={trigger,categoryId,menu};
 mf482PositionAssignment(trigger,menu);
 const selected=menu.querySelector('[aria-selected="true"]')||menu.querySelector('[role="option"]');
 selected?.focus({preventScroll:true});
}
function mf482ChooseAssignment(classId){
 const current=MF482_ACTIVE;
 if(!current)return false;
 mf482CloseAssignment(false);
 const done=App.mf481AssignCategory(current.categoryId,String(classId||''));
 if(!done&&current.trigger?.isConnected)current.trigger.focus({preventScroll:true});
 return done;
}
function mf482MenuKeyDown(event){
 const current=MF482_ACTIVE;
 if(!current)return;
 if(event.key==='Escape'){event.preventDefault();mf482CloseAssignment(true);return;}
 if(event.key!=='ArrowDown'&&event.key!=='ArrowUp'&&event.key!=='Home'&&event.key!=='End')return;
 const options=[...current.menu.querySelectorAll('[role="option"]')];
 if(!options.length)return;
 event.preventDefault();
 let idx=options.indexOf(document.activeElement);
 if(event.key==='Home')idx=0;
 else if(event.key==='End')idx=options.length-1;
 else idx=(idx+(event.key==='ArrowDown'?1:-1)+options.length)%options.length;
 options[idx]?.focus({preventScroll:true});
}
document.addEventListener('pointerdown',event=>{
 const active=MF482_ACTIVE;
 if(active&&!active.menu.contains(event.target)&&!active.trigger.contains(event.target))mf482CloseAssignment();
},true);
document.addEventListener('keydown',mf482MenuKeyDown,true);
// The popup lives outside the scrolling sidebar so its options remain readable.
// Close when the sidebar/page scrolls rather than leaving a detached menu.
document.addEventListener('scroll',event=>{
 if(MF482_ACTIVE&&event.target!==MF482_ACTIVE.menu)mf482CloseAssignment();
},true);
window.addEventListener('resize',()=>{if(MF482_ACTIVE)mf482CloseAssignment();});
Object.assign(App,{mf482ToggleAssignment,mf482ChooseAssignment});
window.MediaFlowV482=Object.freeze({version:482,render:mf482AssignmentControl,close:mf482CloseAssignment});
MediaFlowRuntime.version=MF482_VERSION;
