/* ============================================================
   MediaFlow v266 — Title actions, Library cover fidelity,
   Personal Order popup, Balance readability & Settings stability
   ============================================================ */
(function(){
'use strict';
const V266_RUNTIME_VERSION=266;
let V266_SETTINGS_LOCK_ID='';
let V266_SETTINGS_LOCK_UNTIL=0;

function v266Esc(value){
  return typeof escapeHtml==='function'
    ?escapeHtml(String(value??''))
    :String(value??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function v266AfterPaint(fn){requestAnimationFrame(()=>requestAnimationFrame(()=>{try{fn();}catch(err){console.error('MediaFlow v266 post-paint task failed',err);}}));}

/* ---------------------------------------------------------------------
   Title Details / Edit Title action wording and layout
   --------------------------------------------------------------------- */
const v266LibraryModalBase=libraryModalHtml;
libraryModalHtml=function(d){
  const html=String(v266LibraryModalBase.apply(this,arguments)||'');
  if(!d?.id)return html;
  try{
    const tpl=document.createElement('template');tpl.innerHTML=html;
    const head=tpl.content.querySelector('.mf265-edit-title-head');
    if(head){
      head.classList.add('mf266-edit-title-head');
      const del=head.querySelector('.btn-danger');
      if(del){
        del.textContent='Delete title';
        del.classList.add('mf266-edit-title-delete');
        del.dataset.v225Iconified='1';
        del.setAttribute('aria-label','Delete title');
      }
    }
    return tpl.innerHTML;
  }catch(_){return html;}
};

const v266TitleDetailsBase=v181TitleDetailsHtml;
v181TitleDetailsHtml=function(item){
  const html=String(v266TitleDetailsBase.apply(this,arguments)||'');
  try{
    const tpl=document.createElement('template');tpl.innerHTML=html;
    tpl.content.querySelectorAll('.v181-detail-actions button').forEach(btn=>{
      const click=String(btn.getAttribute('onclick')||'');
      if(click.includes('v181EditFullTitle')){
        btn.textContent='Edit all title details';
        btn.setAttribute('aria-label','Edit all title details');
        btn.classList.add('mf266-edit-all-title-details');
      }
      if(btn.classList.contains('mf265-delete-title-details')){
        btn.textContent='Delete title';
        btn.setAttribute('aria-label','Delete title');
        btn.dataset.v225Iconified='1';
        btn.classList.add('mf266-delete-title-details');
      }
    });
    return tpl.innerHTML;
  }catch(_){return html;}
};

/* ---------------------------------------------------------------------
   Normal Library: real cover URL means real cover. Category default cover
   fallbacks must not masquerade as title artwork in List/Compact/Cards.
   Dynamic Library behavior remains untouched.
   --------------------------------------------------------------------- */
const v266RenderLibraryBase=renderLibrary;
renderLibrary=function(){
  let restored=[];
  try{
    const cfg=typeof v181EnsureLibrarySettings==='function'?v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS):null;
    const mode=String(S.settings?.libraryView||'list');
    const normal=!cfg||String(cfg.mode||'normal')!=='dynamic';
    const noDisplayFallback=normal&&['list','compact','cards'].includes(mode)&&typeof V200_TEMP_ORIGINAL_COVER!=='undefined';
    if(noDisplayFallback){
      for(const item of (S.library||[])){
        if(!item||!Object.prototype.hasOwnProperty.call(item,V200_TEMP_ORIGINAL_COVER))continue;
        restored.push([item,item.coverUrl]);
        item.coverUrl=String(item[V200_TEMP_ORIGINAL_COVER]??'');
      }
    }
    return v266RenderLibraryBase.apply(this,arguments);
  }finally{
    for(const [item,value] of restored)item.coverUrl=value;
  }
};

/* ---------------------------------------------------------------------
   Sidebar: brand/logo itself is the collapse/expand control.
   --------------------------------------------------------------------- */
function v266BindBrandToggle(){
  const sidebar=document.querySelector('.sidebar');
  const brand=sidebar?.querySelector('.brand');
  if(!sidebar||!brand)return;
  sidebar.querySelectorAll('.mf265-sidebar-toggle').forEach(el=>el.remove());
  brand.classList.add('mf266-brand-toggle');
  brand.setAttribute('role','button');
  brand.setAttribute('tabindex','0');
  const collapsed=!!S.settings?.sidebarCollapsed;
  brand.setAttribute('aria-label',collapsed?'Expand MediaFlow menu':'Collapse MediaFlow menu');
  brand.title=collapsed?'Expand MediaFlow menu':'Collapse MediaFlow menu';
  if(brand.dataset.mf266Bound==='1')return;
  brand.dataset.mf266Bound='1';
  brand.addEventListener('click',event=>{
    if(event.target.closest?.('button,a,input,select,textarea'))return;
    App.v265ToggleSidebar();
    const collapsed=!!S.settings?.sidebarCollapsed;
    brand.setAttribute('aria-label',collapsed?'Expand MediaFlow menu':'Collapse MediaFlow menu');
    brand.title=collapsed?'Expand MediaFlow menu':'Collapse MediaFlow menu';
  });
  brand.addEventListener('keydown',event=>{
    if(event.key!=='Enter'&&event.key!==' ')return;
    event.preventDefault();App.v265ToggleSidebar();
    const collapsed=!!S.settings?.sidebarCollapsed;
    brand.setAttribute('aria-label',collapsed?'Expand MediaFlow menu':'Collapse MediaFlow menu');
    brand.title=collapsed?'Expand MediaFlow menu':'Collapse MediaFlow menu';
  });
}
/* ---------------------------------------------------------------------
   Personal Order category filter: clamp to usable content viewport,
   including the desktop sidebar, so neither edge can hide behind chrome.
   --------------------------------------------------------------------- */
function v266OrderSafeLeft(vw){
  const sidebar=document.querySelector('.sidebar');
  if(!sidebar||vw<=760||getComputedStyle(sidebar).display==='none')return 10;
  const r=sidebar.getBoundingClientRect();
  return Math.max(10,Math.min(vw-10,Math.ceil(r.right)+10));
}
function v266PositionOrderCategoryPanel(details){
  if(!details?.open)return;
  const panel=details.querySelector('.v237-category-filter-panel');
  const summary=details.querySelector('summary');
  if(!panel||!summary)return;
  const vw=document.documentElement.clientWidth||innerWidth;
  const vh=document.documentElement.clientHeight||innerHeight;
  const safeLeft=v266OrderSafeLeft(vw),margin=10,safeRight=vw-margin;
  const available=Math.max(230,safeRight-safeLeft);
  const width=Math.min(440,available);
  const sr=summary.getBoundingClientRect();
  panel.classList.add('mf265-order-category-panel','mf266-order-category-panel');
  Object.assign(panel.style,{position:'fixed',right:'auto',bottom:'auto',transform:'none',margin:'0',width:`${Math.round(width)}px`,maxWidth:`${Math.round(width)}px`});
  let left=Math.min(Math.max(sr.right-width,safeLeft),Math.max(safeLeft,safeRight-width));
  if(vw<=760)left=Math.min(Math.max(sr.left,margin),Math.max(margin,safeRight-width));
  panel.style.left=`${Math.round(left)}px`;
  const maxH=Math.max(220,Math.min(620,vh-margin*2));
  panel.style.maxHeight=`${Math.round(maxH)}px`;
  const natural=Math.min(panel.scrollHeight,maxH);
  let top=sr.bottom+7;
  if(top+natural>vh-margin)top=Math.max(margin,sr.top-natural-7);
  panel.style.top=`${Math.round(top)}px`;
}
function v266EnhanceOrder(){
  if(String(S.view||'')!=='order')return;
  const root=document.getElementById('view-root');if(!root)return;
  const filters=root.querySelectorAll('.v225-order-filter-category .v237-category-filter,.v138-order-view .v237-category-filter');
  filters.forEach(details=>{
    details.classList.add('mf266-order-category-filter');
    if(details.dataset.mf266Bound!=='1'){
      details.dataset.mf266Bound='1';
      details.addEventListener('toggle',()=>{if(details.open)v266AfterPaint(()=>v266PositionOrderCategoryPanel(details));});
    }
    v266PositionOrderCategoryPanel(details);
  });
}
window.addEventListener('resize',()=>{if(String(S.view||'')==='order')document.querySelectorAll('.mf266-order-category-filter[open]').forEach(v266PositionOrderCategoryPanel);},{passive:true});
window.addEventListener('scroll',()=>{if(String(S.view||'')==='order')document.querySelectorAll('.mf266-order-category-filter[open]').forEach(v266PositionOrderCategoryPanel);},{passive:true,capture:true});

/* ---------------------------------------------------------------------
   Settings: keep the exact active section locked during in-place morphs.
   --------------------------------------------------------------------- */
function v266CaptureSettingsStay(){
  if(String(S.view||'')!=='settings')return null;
  const labels=[...document.querySelectorAll('.v221-settings-content .section-label[id]')];
  const focused=document.activeElement&&document.querySelector('.v221-settings-content')?.contains(document.activeElement)?document.activeElement:null;
  let anchor=null;
  if(focused&&labels.length){
    const y=focused.getBoundingClientRect().top+8;
    for(const label of labels){
      const top=label.getBoundingClientRect().top;
      if(top<=y)anchor=label;
      else if(anchor)break;
    }
  }
  const activeNav=document.querySelector('#v221-settings-nav .v221-settings-nav-item.v231-active');
  let id=String(anchor?.id||activeNav?.dataset?.settingsTarget||'');
  if(!id){
    anchor=labels.find(el=>el.getBoundingClientRect().bottom>120)||labels[0]||null;
    id=String(anchor?.id||'');
  }
  const target=id?document.getElementById(id):null;
  const scroller=document.scrollingElement||document.documentElement;
  return {id,scrollTop:scroller.scrollTop,targetTop:target?.getBoundingClientRect?.().top??null};
}
function v266RestoreSettingsStay(snapshot){
  if(!snapshot||String(S.view||'')!=='settings')return;
  const scroller=document.scrollingElement||document.documentElement;
  const apply=()=>{
    if(String(S.view||'')!=='settings')return;
    const target=snapshot.id?document.getElementById(snapshot.id):null;
    if(target&&Number.isFinite(snapshot.targetTop)){
      scroller.scrollTop+=target.getBoundingClientRect().top-snapshot.targetTop;
    }else scroller.scrollTop=snapshot.scrollTop;
    if(snapshot.id){
      try{v231SetActiveSettingsNav(snapshot.id,false);}catch(_){ }
    }
  };
  apply();requestAnimationFrame(apply);requestAnimationFrame(()=>requestAnimationFrame(apply));setTimeout(apply,60);setTimeout(apply,180);
}
if(typeof v231UpdateSettingsActiveNav==='function'){
  const v266SettingsActiveBase=v231UpdateSettingsActiveNav;
  v231UpdateSettingsActiveNav=function(ensureVisible=false){
    if(V266_SETTINGS_LOCK_ID&&Date.now()<V266_SETTINGS_LOCK_UNTIL){
      try{v231SetActiveSettingsNav(V266_SETTINGS_LOCK_ID,false);}catch(_){ }
      return;
    }
    if(V266_SETTINGS_LOCK_ID&&Date.now()>=V266_SETTINGS_LOCK_UNTIL){V266_SETTINGS_LOCK_ID='';V266_SETTINGS_LOCK_UNTIL=0;}
    return v266SettingsActiveBase.apply(this,arguments);
  };
}
/* v265 already morphs Settings in place. v266 wraps the final render call so
   the section that was active before a mutation remains authoritative after
   every older Settings enhancer has finished. */

/* ---------------------------------------------------------------------
   Version / post-render integration
   --------------------------------------------------------------------- */
function v266UpdateVersionChrome(){
  document.querySelectorAll('.v260-topbar-chip').forEach(chip=>{if(/^v\d+$/i.test((chip.textContent||'').trim()))chip.textContent='v266';});
  document.querySelectorAll('.v260-topbar-copy span').forEach(span=>{if(/MediaFlow v\d+/i.test(span.textContent||''))span.textContent=(span.textContent||'').replace(/MediaFlow v\d+/ig,'MediaFlow v266');});
}
function v266PostRender(){
  try{v266BindBrandToggle();v266EnhanceOrder();v266UpdateVersionChrome();}catch(err){console.error('MediaFlow v266 enhancement failed',err);}
}

const v266RenderBase=render;
render=function(){
  const settingsSnapshot=v266CaptureSettingsStay();
  if(settingsSnapshot?.id){V266_SETTINGS_LOCK_ID=settingsSnapshot.id;V266_SETTINGS_LOCK_UNTIL=Date.now()+900;}
  const out=v266RenderBase.apply(this,arguments);
  v266AfterPaint(()=>{
    v266PostRender();
    v266RestoreSettingsStay(settingsSnapshot);
    if(settingsSnapshot?.id)setTimeout(()=>{if(V266_SETTINGS_LOCK_ID===settingsSnapshot.id){V266_SETTINGS_LOCK_ID='';V266_SETTINGS_LOCK_UNTIL=0;}},950);
  });
  return out;
};

try{
  MediaFlowRuntime.registerPageEnhancer('order',()=>requestAnimationFrame(v266EnhanceOrder));
  MediaFlowRuntime.registerPageEnhancer('settings',()=>requestAnimationFrame(v266BindBrandToggle));
}catch(_){ }

Object.assign(App,{v266EnhanceOrder,v266BindBrandToggle});
window.MediaFlowV266={version:266,focus:'title actions, real cover fidelity, Personal Order popup, Balance readability, exact Settings continuity and logo sidebar toggle'};
MediaFlowRuntime.version=V266_RUNTIME_VERSION;
v266AfterPaint(v266PostRender);
})();
