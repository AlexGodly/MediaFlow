/* MediaFlow v421 — adaptive desktop navigation and the Logging membership select.
 * Runs last, inside the canonical MediaFlow application closure. */
const MF421_MODES=new Set(['sidebar','mini','top','bottom']);
function mf421Mode(){
  const value=String(S.settings?.navDockStyle||'');
  return MF421_MODES.has(value)?value:(S.settings?.sidebarCollapsed?'mini':'sidebar');
}
DEFAULT_SETTINGS.navDockStyle='sidebar';
let mf421DropOpen=false,mf421DockSignature='',mf421ResizeFrame=0,mf421Drag=null,mf421SuppressClick=0;
function mf421SetNavStyle(mode){
  if(!MF421_MODES.has(mode))return;
  S.settings=S.settings||{};
  const previous=mf421Mode();
  S.settings.navDockStyle=mode;
  S.settings.sidebarCollapsed=mode==='mini';
  try{persistSettings();}catch(_){ }
  mf421DropOpen=false;
  mf421Apply(true);
  if(previous!==mode&&S.view==='settings')render();
}
// Keep the original width preference, but do not auto-expand and undo a manual resize.
autoFitSidebarToProfile=function(){};
applySidebarWidth=function(raw){
  const width=Math.max(82,Math.min(380,Math.round(Number(raw)||236)));
  if(width<139){
    if(mf421Mode()==='sidebar')mf421SetNavStyle('mini');
    document.documentElement.style.setProperty('--sidebar-width','82px');
    return 82;
  }
  if(mf421Mode()==='mini')mf421SetNavStyle('sidebar');
  document.documentElement.style.setProperty('--sidebar-width',width+'px');
  try{localStorage.setItem(SIDEBAR_WIDTH_KEY,String(width));}catch(_){ }
  return width;
};
// The existing brand click/keyboard support is preserved; docking is additional.
App.v265ToggleSidebar=function(){mf421SetNavStyle(mf421Mode()==='mini'?'sidebar':'mini');};

function mf421InjectSettings(){
  const page=document.querySelector('.v220-settings-page');
  if(!page||String(S.view||'')!=='settings')return;
  const groups=[...page.querySelectorAll('.section-label')];
  const section=groups.find(el=>String(el.textContent||'').trim().toUpperCase().startsWith('NAVIGATION'));
  if(!section||page.querySelector('.mf421-nav-settings-card'))return;
  const mode=mf421Mode();
  const modes=[['sidebar','Sidebar','Resizable left navigation'],['mini','Mini','Icons-only navigation'],['top','Top bar','Responsive top navigation'],['bottom','Bottom bar','Responsive bottom navigation']];
  const card=document.createElement('div');card.className='mf421-nav-settings-card card';
  card.innerHTML=`<strong>Navigation style</strong><p class="hint">Select a style or drag the MediaFlow logo to the top, bottom, or left docking zone. Desktop only.</p><div class="mf421-style-tabs" role="group" aria-label="Desktop navigation style">${modes.map(([key,name,desc])=>`<button type="button" class="mf421-style-tab ${mode===key?'active':''}" aria-pressed="${mode===key}" title="${desc}" onclick="App.mf421SetNavStyle('${key}')"><span class="mf421-style-symbol" aria-hidden="true">${key==='mini'?'▥':key==='sidebar'?'▤':key==='top'?'▔':'▁'}</span><span>${name}</span></button>`).join('')}</div><p class="hint">Your sidebar width and navigation page order are preserved when changing styles.</p>`;
  section.insertAdjacentElement('afterend',card);
}
try{MediaFlowRuntime.registerPageEnhancer('settings',mf421InjectSettings);}catch(_){ }

function mf421DeskAllowed(){
  return window.innerWidth>860&&!['mobile','tablet'].includes(document.documentElement.dataset.v238Layout||'');
}
function mf421AddDock(){
  let bar=document.querySelector('.mf421-dock');
  if(bar)return bar;
  bar=document.createElement('nav');bar.className='mf421-dock';bar.setAttribute('aria-label','MediaFlow desktop navigation');
  bar.innerHTML=`<div class="mf421-dock-brand" tabindex="0" role="button" aria-label="Drag MediaFlow navigation to left, top or bottom" title="Drag to change navigation position"><span class="mf421-dock-mark" aria-hidden="true">◉</span><span class="mf421-dock-name">MediaFlow</span></div><div class="mf421-dock-links"></div><div class="mf421-dock-more-wrap"><button type="button" class="mf421-dock-more" aria-expanded="false" aria-label="More navigation pages">${ICONS.more||'⋯'}<span>More</span></button><div class="mf421-dock-menu" hidden></div></div><button type="button" class="mf421-dock-progress" aria-label="Level and streak details" title="View profile and progression" onclick="App.openProfile()"><span class="mf421-level">Level</span><span class="mf421-streak"></span></button><button type="button" class="mf421-dock-account" aria-label="Open account settings" title="Account" onclick="App.openProfile()">${ICONS.profile||'♙'}</button>`;
  document.body.appendChild(bar);
  bar.querySelector('.mf421-dock-more').addEventListener('click',e=>{e.stopPropagation();mf421DropOpen=!mf421DropOpen;mf421UpdateMore(bar);});
  bar.querySelector('.mf421-dock-menu').addEventListener('click',e=>{const btn=e.target.closest('[data-mf421-view]');if(btn){mf421DropOpen=false;App.setView(btn.dataset.mf421View);mf421Apply(true);}});
  bar.querySelector('.mf421-dock-links').addEventListener('click',e=>{const btn=e.target.closest('[data-mf421-view]');if(btn)App.setView(btn.dataset.mf421View);});
  mf421WireDrag(bar.querySelector('.mf421-dock-brand'));
  return bar;
}
function mf421UpdateMore(bar){
  const more=bar.querySelector('.mf421-dock-more');
  const panel=bar.querySelector('.mf421-dock-menu');
  const enabled=mf421DropOpen&&!bar.querySelector('.mf421-dock-more-wrap').hidden;
  panel.hidden=!enabled;more.setAttribute('aria-expanded',String(enabled));
}
function mf421NavButton(n,more=false){
  const text=escapeHtml(String(n.label||n.id));
  return `<button type="button" class="mf421-dock-link ${S.view===n.id?'active':''} ${more?'in-more':''}" data-mf421-view="${escapeHtml(String(n.id))}" aria-label="${text}" title="${text}" ${S.view===n.id?'aria-current="page"':''}>${ICONS[n.id]||ICONS.more}<span>${text}</span></button>`;
}
function mf421RefreshDock(bar,force=false){
  const list=[...document.querySelectorAll('.sidebar .nav-item[data-view]')].map(el=>({id:String(el.dataset.view),label:el.querySelector('span')?.textContent?.trim()||el.title||String(el.dataset.view)}));
  const sig=JSON.stringify([mf421Mode(),list.map(n=>[n.id,n.label]),S.view,Math.round(bar.clientWidth)]);
  if(!force&&sig===mf421DockSignature)return;
  mf421DockSignature=sig;
  const links=bar.querySelector('.mf421-dock-links'),moreWrap=bar.querySelector('.mf421-dock-more-wrap'),menu=bar.querySelector('.mf421-dock-menu');
  // Measure real intrinsic button widths, then reserve More before placing buttons.
  links.innerHTML=list.map(n=>mf421NavButton(n)).join('');
  const all=[...links.children];
  const width=links.clientWidth||Math.max(120,bar.clientWidth-210);
  const used=[];let taken=0;
  const required=all.map(el=>Math.ceil(el.getBoundingClientRect().width+6));
  const needMore=required.reduce((a,b)=>a+b,0)>width;
  const budget=Math.max(0,width-(needMore?80:0));
  for(let i=0;i<all.length;i++){
    if(taken+required[i]<=budget||!used.length){used.push(i);taken+=required[i];}
    else break;
  }
  const hidden=list.filter((_,i)=>!used.includes(i));
  links.innerHTML=list.filter((_,i)=>used.includes(i)).map(n=>mf421NavButton(n)).join('');
  menu.innerHTML=hidden.map(n=>mf421NavButton(n,true)).join('');
  moreWrap.hidden=hidden.length===0;
  if(!hidden.length)mf421DropOpen=false;
  moreWrap.classList.toggle('active',hidden.some(n=>n.id===S.view));
  mf421UpdateMore(bar);
}
function mf421Apply(force=false){
  const mode=mf421Mode(),desk=mf421DeskAllowed(),body=document.body;
  body.classList.toggle('mf421-desktop',desk);
  for(const key of MF421_MODES)body.classList.toggle('mf421-'+key,desk&&mode===key);
  body.classList.toggle('mf265-sidebar-collapsed',desk&&mode==='mini');
  if(String(S.view||'')==='settings')mf421InjectSettings();
  const sidebar=document.querySelector('.sidebar');
  if(sidebar){
    sidebar.classList.add('mf421-sidebar');
    const brand=sidebar.querySelector('.brand');
    if(brand)mf421WireDrag(brand);
    sidebar.querySelectorAll('.nav-item').forEach(el=>{const label=el.querySelector('span')?.textContent?.trim();if(label){el.title=label;el.setAttribute('aria-label',label);el.setAttribute('tabindex','0');}});
  }
  let bar=document.querySelector('.mf421-dock');
  if(desk&&(mode==='top'||mode==='bottom')){
    bar=mf421AddDock();bar.hidden=false;
    const progress=bar.querySelector('.mf421-dock-progress');
    if(progress){
      try{
        const level=mediaFlowLevelInfo(),streak=computeDayStreak();
        progress.querySelector('.mf421-level').textContent='Lv. '+level.level;
        progress.querySelector('.mf421-streak').textContent='🔥 '+streak;
        progress.title='Level '+level.level+' · '+streak+'-day streak · View profile';
      }catch(_){progress.hidden=true;}
    }
    mf421RefreshDock(bar,force);
  }else if(bar){bar.hidden=true;mf421DropOpen=false;mf421UpdateMore(bar);}
}
function mf421Target(e){
  if(e.clientY<Math.max(96,window.innerHeight*.13))return 'top';
  if(e.clientY>window.innerHeight-Math.max(96,window.innerHeight*.13))return 'bottom';
  if(e.clientX<Math.max(130,window.innerWidth*.12))return 'sidebar';
  return null;
}
function mf421Zones(show,target){
  let overlay=document.querySelector('.mf421-dropzones');
  if(!show){overlay?.remove();return;}
  if(!overlay){overlay=document.createElement('div');overlay.className='mf421-dropzones';overlay.innerHTML='<div data-target="top">Top navigation</div><div data-target="sidebar">Sidebar</div><div data-target="bottom">Bottom navigation</div>';document.body.appendChild(overlay);}
  overlay.querySelectorAll('[data-target]').forEach(el=>el.classList.toggle('active',el.dataset.target===target));
}
function mf421WireDrag(handle){
  if(!handle||handle.dataset.mf421DragBound)return;
  handle.dataset.mf421DragBound='1';
  handle.title='Click to collapse or expand · Drag to top, bottom, or left to dock navigation';
  handle.addEventListener('click',event=>{
    if(Date.now()<mf421SuppressClick){event.preventDefault();event.stopImmediatePropagation();}
  },true);
  handle.addEventListener('pointerdown',event=>{
    if(!mf421DeskAllowed()||event.button!==0||event.target.closest('button,a,input,select,textarea'))return;
    mf421Drag={id:event.pointerId,x:event.clientX,y:event.clientY,origin:handle,moved:false};
  });
  // capture handlers attached just once on document below
}
document.addEventListener('pointermove',event=>{
  const d=mf421Drag;if(!d||d.id!==event.pointerId)return;
  if(!d.moved&&Math.hypot(event.clientX-d.x,event.clientY-d.y)<12)return;
  d.moved=true;mf421Zones(true,mf421Target(event));event.preventDefault();
},{passive:false});
function mf421EndDrag(event){
  const d=mf421Drag;if(!d||d.id!==event.pointerId)return;
  mf421Drag=null;
  mf421Zones(false);
  if(d.moved){
    mf421SuppressClick=Date.now()+500;
    if(event.type==='pointerup'){
      const target=mf421Target(event);
      if(target)mf421SetNavStyle(target);
    }
  }
}
document.addEventListener('pointerup',mf421EndDrag);
document.addEventListener('pointercancel',mf421EndDrag);
document.addEventListener('click',event=>{
  if(!event.target.closest('.mf421-dock-more-wrap')){
    const bar=document.querySelector('.mf421-dock');if(bar&&mf421DropOpen){mf421DropOpen=false;mf421UpdateMore(bar);}
  }
});
window.addEventListener('resize',()=>{
  if(mf421ResizeFrame)return;
  mf421ResizeFrame=requestAnimationFrame(()=>{mf421ResizeFrame=0;mf421DockSignature='';mf421Apply(true);});
},{passive:true});
const mf421BaseRender=render;
render=function(){const out=mf421BaseRender.apply(this,arguments);queueMicrotask(()=>mf421Apply());return out;};
// Update on shell initialization too; never rerender the whole current page.
queueMicrotask(()=>mf421Apply(true));
Object.assign(App,{mf421SetNavStyle});
