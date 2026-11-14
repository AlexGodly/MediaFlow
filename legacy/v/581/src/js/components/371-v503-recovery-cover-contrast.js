/* MediaFlow v503 — targeted recovery controls, theme contrast, Library cover parity.
 * Additive runtime extension on the restored v483 source; no persistence changes. */
const MF503_VERSION=503;

/* Library is the authority for actual cover/default-cover/category-icon selection. */
function mf503CoverHtml(item, extraClass=''){
 const source=v417LibraryCoverSource(item);
 const cat=getCategory(item?.categoryId);
 const title=escapeHtml(cleanTitle(item?.title||'title'));
 const id=item?.id==null?'':escapeHtml(String(item.id));
 const categoryIcon=cat?v144CategoryIconHtml(cat):mf419Icon('layers',28);
 const fallback='<span class="mf419-cover-fallback mf417-cover-placeholder mf503-cover-fallback" role="img" aria-label="Category icon for '+title+'" style="'+(source.url?'display:none;':'')+'">'+categoryIcon+'</span>';
 const cover=source.url?'<img src="'+escapeHtml(source.url)+'" alt="'+title+' cover" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'grid\'">':'';
 return '<span class="mf419-cover-art mf503-cover-art '+extraClass+'" data-mf419-cover-source="'+escapeHtml(source.type)+'"'+(id?' data-mf503-title-id="'+id+'" role="button" tabindex="0" aria-label="Open '+title+' details"':'')+'>'+cover+fallback+'</span>';
}
/* v419's Dashboard, Logging Library picker and Recommended Title call this by name. */
mf419MissingCoverHtml=mf503CoverHtml;
/* Advanced Logging used to render a different fallback with a fixed 32px icon
 * and a "Missing cover" caption. Use the exact same shared renderer. */
v370CoverHtml=function(item){
 return '<div class="v370-title-cover mf503-title-cover">'+mf503CoverHtml(item,'mf503-advanced-cover')+'</div>';
};

/* Keep the whole card functional, including a missing or broken cover.
 * Use delegated events because Logging cards are replaced during filtering. */
document.addEventListener('click',function(event){
 const cover=event.target.closest?.('.mf503-cover-art[data-mf503-title-id]');
 if(!cover)return;
 event.preventDefault();
 event.stopPropagation();
 App.v181OpenTitleDetails(cover.dataset.mf503TitleId);
});
document.addEventListener('keydown',function(event){
 if((event.key!=='Enter'&&event.key!==' ')||!event.target.matches?.('.mf503-cover-art[data-mf503-title-id]'))return;
 event.preventDefault();
 event.stopPropagation();
 App.v181OpenTitleDetails(event.target.dataset.mf503TitleId);
});

/* Correct only visible label text and accessibility descriptions, never HTML
 * attributes containing JavaScript or unrelated recovery engine identifiers. */
function mf503FixMetadataSpacing(host){
 const walker=document.createTreeWalker(host,NodeFilter.SHOW_TEXT);
 let textNode;
 while((textNode=walker.nextNode())){
  if(textNode.nodeValue.includes('MetadataRecovery'))
   textNode.nodeValue=textNode.nodeValue.replace(/\bMetadataRecovery\b/g,'Metadata Recovery');
 }
 host.querySelectorAll('[title],[aria-label]').forEach(el=>{
  for(const key of ['title','aria-label']){
   const value=el.getAttribute(key);
   if(value?.includes('MetadataRecovery'))el.setAttribute(key,value.replace(/\bMetadataRecovery\b/g,'Metadata Recovery'));
  }
 });
}
/* Replace only the three redundant recovery actions in Title Details.
 * Preserve Edit Title, Logging, Personal Order, and all non-recovery buttons. */
const mf503OriginalTitleDetails=v181TitleDetailsHtml;
v181TitleDetailsHtml=function(item){
 const html=String(mf503OriginalTitleDetails.apply(this,arguments)||'');
 const host=document.createElement('div');
 host.innerHTML=html;
 const actions=host.querySelector('.v181-detail-actions');
 if(actions&&item?.id!=null&&mf447Prefs().details){
  actions.querySelectorAll('button,a').forEach(el=>{
   const action=String(el.getAttribute('onclick')||'');
   if(/App\.(?:mf439Open|mf447Open|mf445Open|mf424Open)\s*\(/.test(action))el.remove();
  });
  actions.querySelectorAll('.mf447-shortcut-group,.mf425-detail-actions').forEach(el=>{
   if(!el.querySelector('button,a'))el.remove();
  });
  const group=document.createElement('div');
  group.className='mf503-detail-recovery';
  group.setAttribute('role','group');
  group.setAttribute('aria-label','Title recovery actions');
  group.innerHTML=mf447Buttons({id:String(item.id)});
  actions.prepend(group);
 }
 mf503FixMetadataSpacing(host);
 return host.innerHTML;
};
/* Edit Title: correct both disabled draft controls and saved recovery labels. */
const mf503OriginalEditor=libraryModalHtml;
libraryModalHtml=function(){
 const html=String(mf503OriginalEditor.apply(this,arguments)||'');
 if(!html.includes('MetadataRecovery'))return html;
 const host=document.createElement('div');host.innerHTML=html;
 mf503FixMetadataSpacing(host);
 return host.innerHTML;
};

/* Resolve the actual selected row background, not the current accent alone:
 * a cover-derived theme may be dark even with a near-black --text value. */
function mf503Rgb(raw){
 raw=String(raw||'').trim().toLowerCase();
 const srgb=raw.match(/^color\(srgb\s+([^)]+)\)$/);
 if(srgb){
  const values=srgb[1].replace(/\s*\/\s*/g,' ').trim().split(/\s+/).map(Number);
  if(values.length>=3&&values.slice(0,3).every(Number.isFinite))
   return [values[0]*255,values[1]*255,values[2]*255];
 }
 const rgb=raw.match(/^rgba?\(\s*([^)]+)\)$/);
 if(rgb){
  const values=rgb[1].replace(/\s*\/\s*/g,' ').replace(/,/g,' ').trim().split(/\s+/).map(Number);
  if(values.length>=3&&values.slice(0,3).every(Number.isFinite))
   return values.slice(0,3).map((n,i)=>raw.includes('%')?n*2.55:n);
 }
 if(/^#[0-9a-f]{6}$/i.test(raw))
  return [1,3,5].map(i=>parseInt(raw.slice(i,i+2),16));
 if(/^#[0-9a-f]{3}$/i.test(raw))
  return [1,2,3].map(i=>parseInt(raw[i]+raw[i],16));
 return null;
}
function mf503Luminance(rgb){
 const channels=rgb.map(x=>{
  const c=Math.max(0,Math.min(1,x/255));
  return c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4);
 });
 return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
}
function mf503PaintSelectedContrast(){
 const rows=document.querySelectorAll('.mf379-picker .log-suggestion.mf379-picked');
 rows.forEach(row=>{
  let rgb=mf503Rgb(getComputedStyle(row).backgroundColor);
  if(!rgb){
   let parent=row.parentElement;
   while(parent&&!rgb){rgb=mf503Rgb(getComputedStyle(parent).backgroundColor);parent=parent.parentElement;}
  }
  // WCAG relative luminance: choose the foreground with higher contrast.
  const lum=mf503Luminance(rgb||[24,33,44]);
  const white=1.05/(lum+.05),dark=(lum+.05)/.05;
  row.style.setProperty('--mf503-selected-ink',white>=dark?'#ffffff':'#101820');
 });
}
let mf503ContrastQueued=false;
function mf503ScheduleContrast(){
 if(mf503ContrastQueued)return;
 mf503ContrastQueued=true;
 requestAnimationFrame(()=>{mf503ContrastQueued=false;mf503PaintSelectedContrast();});
}
const mf503PreviousPickerUpdate=v379UpdatePickerActions;
v379UpdatePickerActions=function(){
 const result=mf503PreviousPickerUpdate.apply(this,arguments);
 mf503ScheduleContrast();
 return result;
};
const mf503PreviousLogSuggestions=renderLogSuggestions;
renderLogSuggestions=function(){
 const result=mf503PreviousLogSuggestions.apply(this,arguments);
 mf503ScheduleContrast();
 return result;
};
const mf503PreviousRender=render;
render=function(){
 const result=mf503PreviousRender.apply(this,arguments);
 if(S.logging)mf503ScheduleContrast();
 return result;
};
const mf503ThemeObserver=new MutationObserver(()=>{
 if(document.querySelector('.mf379-picker .log-suggestion.mf379-picked'))mf503ScheduleContrast();
});
mf503ThemeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['style','class','data-theme']});
if(document.body)mf503ThemeObserver.observe(document.body,{attributes:true,attributeFilter:['style','class','data-theme']});
window.MediaFlowV503=Object.freeze({version:503,cover:mf503CoverHtml,contrast:mf503PaintSelectedContrast});
