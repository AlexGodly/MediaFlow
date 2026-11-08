/* MediaFlow v562 — Library History: every changed title can be opened.
 * Before v562 an entry showed at most five "Edit <title>" buttons inline, and
 * long names pushed some out of view; titles past those could not be edited
 * from Library History. Now each entry shows up to three title chips (cover,
 * name, what changed) and a More button that lists every title of that change
 * with its cover, full name, change kind/fields and Edit, with a search box.
 * Presentation only: Library History entries, restore, XP and sync are unchanged. */
const V562_RELEASE=562;
const V562_INLINE=3;
const MF562={open:null,query:''};
function mf562Esc(v){return escapeHtml(String(v==null?'':v));}
function mf562Cover(item){return typeof v260ItemCover==='function'?v260ItemCover(item):String(item?.coverUrl||'').trim();}
function mf562Icon(item){
 const cat=typeof getCategory==='function'?getCategory(item?.categoryId):null;
 return cat&&typeof v144CategoryIconHtml==='function'?v144CategoryIconHtml(cat):'◫';
}
function mf562Change(entry,item){
 const name=cleanTitle(item?.title||'');
 const c=(Array.isArray(entry?.changes)?entry.changes:[]).find(x=>cleanTitle(x?.title||'')===name);
 return {kind:String(c?.kind||'edited'),fields:Array.isArray(c?.fields)?c.fields.map(String):[]};
}
function mf562Sign(kind){return /add|creat|import/i.test(kind)?'＋':/delet|remov/i.test(kind)?'－':'✎';}
function mf562Chip(entry,item){
 const id=String(item.id),cover=mf562Cover(item),ch=mf562Change(entry,item);
 return '<button type="button" class="mf562-chip" title="'+mf562Esc(cleanTitle(item.title))+'" onclick="App.openLibraryModal(\''+mf562Esc(id)+'\')">'+
  '<span class="mf562-chip-cover">'+(cover?'<img src="'+mf562Esc(cover)+'" alt="" loading="lazy">':'<span>'+mf562Icon(item)+'</span>')+'</span>'+
  '<span class="mf562-chip-text"><b>'+mf562Esc(cleanTitle(item.title))+'</b><small>'+mf562Sign(ch.kind)+' '+mf562Esc(ch.kind)+'</small></span></button>';
}
function mf562Actions(entry,ids,idx){
 const items=ids.map(id=>idx.byId.get(String(id))).filter(Boolean);
 if(!items.length)return '';
 const more=items.length>V562_INLINE?'<button type="button" class="btn btn-sm mf562-more" onclick="App.mf562OpenMore(\''+mf562Esc(String(entry?.id||''))+'\')">More · '+items.length.toLocaleString()+' titles</button>':'';
 return '<div class="v43-log-actions mf562-actions">'+items.slice(0,V562_INLINE).map(i=>mf562Chip(entry,i)).join('')+more+'</div>';
}
/* Runs the existing renderer, then swaps each entry's action row for v562's.
 * The renderer's own title lookup is wrapped for the duration of the call. */
function mf562Render(base){
 const original=v43FindLogTitles,queue=[];
 v43FindLogTitles=function(x,lookup){
  const ids=original.call(this,x,lookup);
  if(!ids.length)return ids;
  queue.push({entry:x,ids});
  return ['\u0000mf562'];
 };
 let html;
 try{html=base();}finally{v43FindLogTitles=original;}
 const idx=typeof v241EnsureLibraryIndex==='function'?v241EnsureLibraryIndex():{byId:new Map((S.library||[]).map(i=>[String(i?.id),i]))};
 let k=0;
 html=String(html).replace(/<div class="v43-log-actions"><\/div>/g,()=>{const q=queue[k++];return q?mf562Actions(q.entry,q.ids,idx):'';});
 if(MF562.open)setTimeout(mf562PaintMore,0);
 return html;
}
const mf562ActivityBase=v241ActivityHtml;
function mf562ActivityHtml(){return mf562Render(mf562ActivityBase);}
if(typeof v341LibraryHistoryToolbar==='function'){
 mfActivityHtml=function(){return '<div class="v341-lib-history-shell">'+v341LibraryHistoryToolbar()+'<div class="v341-lib-history-results">'+mf562ActivityHtml()+'</div></div>';};
 v341LibraryPanelRefresh=function({keepSearch=false}={}){
  if(S.view!=='history'||v260HistoryTab()!=='library')return false;
  const host=document.querySelector('.v341-lib-history-shell');if(!host)return false;
  const previous=keepSearch?document.getElementById('v341-lib-history-query'):null;
  const start=previous?.selectionStart??null,end=previous?.selectionEnd??null;
  host.innerHTML=v341LibraryHistoryToolbar()+'<div class="v341-lib-history-results">'+mf562ActivityHtml()+'</div>';
  if(keepSearch){const next=host.querySelector('#v341-lib-history-query');if(next){next.focus({preventScroll:true});try{next.setSelectionRange(start,end);}catch(_){}}}
  return true;
 };
}else{
 mfActivityHtml=mf562ActivityHtml;
}
// ---- the More popup --------------------------------------------------------
function mf562Entry(id){return (Array.isArray(S.activityLog)?S.activityLog:[]).find(x=>String(x?.id||'')===String(id))||null;}
function mf562MoreRows(){
 const entry=mf562Entry(MF562.open);if(!entry)return null;
 const lookup=typeof v50LibraryLookup==='function'?v50LibraryLookup():undefined;
 const idx=typeof v241EnsureLibraryIndex==='function'?v241EnsureLibraryIndex():{byId:new Map((S.library||[]).map(i=>[String(i?.id),i]))};
 const items=v43FindLogTitles(entry,lookup).map(id=>idx.byId.get(String(id))).filter(Boolean);
 const q=MF562.query.trim().toLocaleLowerCase();
 return {entry,items,shown:q?items.filter(i=>cleanTitle(i.title).toLocaleLowerCase().includes(q)):items};
}
function mf562MoreHtml(){
 const d=mf562MoreRows();
 if(!d)return '<p class="mf562-empty">This change is no longer in Library History.</p>';
 const rows=d.shown.map(item=>{
  const cover=mf562Cover(item),ch=mf562Change(d.entry,item),cat=typeof getCategory==='function'?getCategory(item.categoryId):null;
  return '<article class="mf562-row"><span class="mf562-row-cover">'+(cover?'<img src="'+mf562Esc(cover)+'" alt="" loading="lazy">':'<span>'+mf562Icon(item)+'</span>')+'</span>'+
   '<div class="mf562-row-text"><b>'+mf562Esc(cleanTitle(item.title))+'</b><small>'+mf562Esc(cat?.name||'')+' · '+mf562Sign(ch.kind)+' '+mf562Esc(ch.kind)+'</small>'+
   (ch.fields.length?'<small class="mf562-fields">'+ch.fields.map(mf562Esc).join(' · ')+'</small>':'')+'</div>'+
   '<button type="button" class="btn btn-sm btn-primary" onclick="App.openLibraryModal(\''+mf562Esc(String(item.id))+'\')">Edit</button></article>';
 }).join('');
 return '<div class="mf562-more-head"><div><small>LIBRARY HISTORY</small><h3>'+mf562Esc(d.entry.action||'Change')+'</h3><span>'+
  new Date(Number(d.entry.timestamp)||Date.now()).toLocaleString()+' · '+d.items.length.toLocaleString()+' titles</span></div>'+
  '<button type="button" class="btn btn-sm btn-ghost" onclick="App.mf562CloseMore()">Close</button></div>'+
  '<input type="search" class="mf562-search" placeholder="Search these titles…" value="'+mf562Esc(MF562.query)+'" oninput="App.mf562SearchMore(this.value)">'+
  '<div class="mf562-list">'+(rows||'<p class="mf562-empty">No title matches.</p>')+'</div>';
}
function mf562PaintMore(){
 const box=document.querySelector('#mf562-more .mf562-more-box');if(!box)return;
 const input=box.querySelector('.mf562-search'),focused=document.activeElement===input,pos=input?.selectionStart;
 box.innerHTML=mf562MoreHtml();
 if(focused){const next=box.querySelector('.mf562-search');next?.focus({preventScroll:true});try{next?.setSelectionRange(pos,pos);}catch(_){}}
}
function mf562OpenMore(id){
 MF562.open=String(id||'');MF562.query='';
 document.getElementById('mf562-more')?.remove();
 const root=document.createElement('div');root.id='mf562-more';root.className='mf562-more';
 root.innerHTML='<div class="mf562-shade" onclick="App.mf562CloseMore()"></div><section class="mf562-more-box" role="dialog" aria-modal="true" aria-label="All titles in this change"></section>';
 document.body.append(root);mf562PaintMore();
}
function mf562CloseMore(){MF562.open=null;document.getElementById('mf562-more')?.remove();}
function mf562SearchMore(v){MF562.query=String(v||'');mf562PaintMore();}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&MF562.open&&!document.querySelector('.modal-overlay:not([hidden])'))mf562CloseMore();});
Object.assign(App,{mf562OpenMore,mf562CloseMore,mf562SearchMore});
MediaFlowRuntime.version=V562_RELEASE;
window.MediaFlowV562=Object.freeze({version:562,open:mf562OpenMore,close:mf562CloseMore});
