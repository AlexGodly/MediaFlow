/* v351: mobile-only DOM corrections. Never touches desktop layout or cloud. */
const V351_MOBILE=window.matchMedia('(max-width: 1023px)');
const V351_LOCAL={selectionOpen:false};
function v351UpgradeMobile(){
  if(!V351_MOBILE.matches)return;
  const root=document.getElementById('view-root');if(!root)return;
  // Batch Log selected title information is one flex item, not separate grid
  // siblings that can collapse into a one-character-wide column.
  for(const selection of root.querySelectorAll('.batch-log-row .batch-selected-title')){
    if(selection.querySelector(':scope > .mf351-batch-copy'))continue;
    const cover=selection.querySelector(':scope > .v241-logged-cover-button, :scope > .v239-batch-cover');
    const copy=document.createElement('div');copy.className='mf351-batch-copy';
    for(const node of [...selection.childNodes]){
      if(node!==cover)copy.appendChild(node);
    }
    selection.appendChild(copy);
  }
  // Collapsible Collection selection actions: all existing event handlers and
  // the selected count stay intact, controls just become disclosed on phones.
  for(const bar of root.querySelectorAll('.mf274-collection-batchbar')){
    let toggle=bar.querySelector(':scope > .mf351-batch-actions-toggle');
    if(!toggle){
      toggle=document.createElement('button');toggle.type='button';
      toggle.className='mf350-mobile-toggle mf351-batch-actions-toggle';
      toggle.dataset.v225Iconified='1';bar.prepend(toggle);
      toggle.addEventListener('click',()=>{V351_LOCAL.selectionOpen=!V351_LOCAL.selectionOpen;v351UpgradeMobile();});
    }
    const count=bar.querySelector(':scope > b')?.textContent?.trim()||'0 selected';
    const selected=Number(count.replace(/[^0-9]/g,''))||0;
    const expanded=V351_LOCAL.selectionOpen||selected>0;
    bar.classList.toggle('mf351-batch-collapsed',!expanded);
    toggle.setAttribute('aria-expanded',String(expanded));
    toggle.textContent=`Selection actions · ${count} ${expanded?'▴':'▾'}`;
  }
}
const v351BaseEnhance=v350EnhanceMobile;
v350EnhanceMobile=function(){v351BaseEnhance();v351UpgradeMobile();};
App.v350MobileEnhance=v350EnhanceMobile;
function v351RestoreOnDesktop(){
  const root=document.getElementById('view-root');if(!root)return;
  for(const bar of root.querySelectorAll('.mf274-collection-batchbar')){
    bar.querySelector(':scope > .mf351-batch-actions-toggle')?.remove();
    bar.classList.remove('mf351-batch-collapsed');
  }
  for(const selected of root.querySelectorAll('.batch-selected-title')){
    const copy=selected.querySelector(':scope > .mf351-batch-copy');
    if(copy){while(copy.firstChild)selected.insertBefore(copy.firstChild,copy);copy.remove();}
  }
}
try{V351_MOBILE.addEventListener('change',()=>{if(!V351_MOBILE.matches)v351RestoreOnDesktop();else requestAnimationFrame(v351UpgradeMobile);});}catch(_){ }
Object.assign(App,{v351MobileEnhance:v351UpgradeMobile});
MediaFlowRuntime.version=351;
