/* MediaFlow v362 — compact responsive Collection galleries and one mobile
   Filters & Sorting disclosure for sorting, page size, and display sizing.
   DOM nodes are MOVED, never cloned, so canonical event handlers, page size,
   Collection assignments, settings persistence, and accessibility stay intact. */
const V362_RELEASE=362;
const V362_MOBILE=window.matchMedia('(max-width: 1023px)');

function v362MoveControl(element,container){
  if(!element||!container||element.parentElement===container)return;
  if(!element._mf362Home){
    const anchor=document.createComment('MediaFlow v362: original control position');
    element.parentNode?.insertBefore(anchor,element);
    element._mf362Home=anchor;
  }
  container.append(element);
}
function v362RestoreControl(element){
  const anchor=element?._mf362Home;
  if(anchor?.isConnected&&element?.parentNode!==anchor.parentNode){
    anchor.parentNode.insertBefore(element,anchor);
  }
}
function v362CollectionMobileTools(){
  const sheet=document.querySelector('.mf354-sheet-backdrop .mf359-collection-sheet');
  if(!sheet)return;
  const filters=sheet.querySelector('.mf358-collection-filters');
  const size=sheet.querySelector('.mf361-collection-size-controls');
  const page=sheet.querySelector('.mf359-page-size-field');
  if(!filters||!size||!page)return;
  let section=filters.querySelector(':scope > .mf362-display-filter-tools');
  if(!section){
    section=document.createElement('section');
    section.className='mf362-display-filter-tools';
    section.setAttribute('aria-label','Collection display and pagination tools');
    const heading=document.createElement('div');
    heading.className='mf362-tools-heading';
    heading.textContent='Display sizing & page size';
    section.appendChild(heading);
    const sizing=document.createElement('div');
    sizing.className='mf362-tools-sizing';
    const paging=document.createElement('div');
    paging.className='mf362-tools-paging';
    section.append(sizing,paging);
    filters.append(section);
  }
  if(V362_MOBILE.matches){
    v362MoveControl(size,section.querySelector('.mf362-tools-sizing'));
    v362MoveControl(page,section.querySelector('.mf362-tools-paging'));
    sheet.classList.add('mf362-mobile-tools');
    filters.querySelector(':scope > summary')?.setAttribute('aria-label','Filters, sorting, display sizing and Collections per page');
  }else{
    v362RestoreControl(size);
    v362RestoreControl(page);
    sheet.classList.remove('mf362-mobile-tools');
  }
}

/* When the user changes viewport width without reopening, relocate actual
   inputs back to their desktop positions instead of making duplicate clones. */
try{V362_MOBILE.addEventListener('change',v362CollectionMobileTools);}catch(_){ }

const v362OpenBase=App.v354OpenSheet;
App.v354OpenSheet=function(kind){
  const result=v362OpenBase.apply(this,arguments);
  if(kind==='collection')v362CollectionMobileTools();
  return result;
};

Object.assign(App,{v362CollectionMobileTools});
MediaFlowRuntime.version=V362_RELEASE;
window.MediaFlowV362={version:362,features:[
  'Responsive mobile Collection Cards and cover galleries',
  'Collection text and cover adjusters inside mobile Filters & Sorting',
  'Collections per page inside mobile Filters & Sorting',
  'Single original controls reparented without duplicate event handlers',
  'Desktop sizing, pagination, sorting and assignment behavior preserved'
]};
