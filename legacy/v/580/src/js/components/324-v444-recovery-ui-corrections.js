/* MediaFlow v444 — accessible themed confirmations shared by both recovery engines.
 * The native browser confirm() blocks rendering and cannot inherit MediaFlow themes.
 * Only user-initiated actions show this dialog; no recovery writes occur here. */
const MF444_VERSION=444;
const MF444={current:null};
function mf444Confirm(title,detail,action='Continue',destructive=false,count=0,kind='metadata'){
 if(MF444.current)return Promise.resolve(false);
 if(typeof mf397SetMenu==='function')mf397SetMenu(false);
 return new Promise(resolve=>{
  const opener=document.activeElement;
  const root=document.createElement('div');
  root.id='mf444-confirm';
  root.className='mf444-overlay mf425-themed';
  const esc=value=>mf424Escape(String(value??''));
  const number=Number.isSafeInteger(Number(count))&&Number(count)>0?Number(count):0;
  const graphic=destructive?'shield':kind==='cover'?'images':'database';
  const kindName=kind==='cover'?'COVER RECOVERY':'METADATA RECOVERY';
  root.innerHTML='<div class="mf444-backdrop" aria-hidden="true"></div>'+
   '<section class="mf444-dialog" role="alertdialog" aria-modal="true" aria-labelledby="mf444-title" aria-describedby="mf444-description" tabindex="-1">'+
   '<header class="mf444-head"><span class="mf444-symbol">'+mf425Icon(graphic,24)+'</span>'+
   '<div class="mf444-heading"><small>'+esc(kindName)+'</small><h2 id="mf444-title">'+esc(title)+'</h2></div>'+
   '<button class="mf444-close" type="button" data-mf444-dismiss aria-label="Close confirmation">'+mf425Icon('x',20)+'</button></header>'+
   '<div class="mf444-body"><p id="mf444-description">'+esc(detail)+'</p>'+
   (number?'<div class="mf444-count"><strong>'+number.toLocaleString()+'</strong><span>Selected title'+(number===1?'':'s')+'</span></div>':'')+
   '<div class="mf444-info"><span>'+mf425Icon('shield',19)+'</span><p><strong>Existing Library data stays protected.</strong><small>Recovery safeguards, confirmed changes and saved progress remain in place.</small></p></div>'+
   '</div><footer class="mf444-actions"><button class="btn btn-ghost" type="button" data-mf444-dismiss>Cancel</button>'+
   '<button class="btn '+(destructive?'btn-danger':'btn-primary')+'" type="button" data-mf444-approve>'+mf425Icon(destructive?'shield':'check',17)+esc(action)+'</button></footer>'+
   '</section>';
  const dialog=root.querySelector('.mf444-dialog');
  const dismiss=approved=>{
   if(MF444.current?.root!==root)return;
   document.removeEventListener('keydown',key,true);
   root.remove();MF444.current=null;
   if(opener?.isConnected&&typeof opener.focus==='function')opener.focus();
   resolve(Boolean(approved));
  };
  const key=event=>{
   if(event.key==='Escape'){event.preventDefault();event.stopPropagation();dismiss(false);return;}
   if(event.key!=='Tab')return;
   const focusables=[...root.querySelectorAll('button:not([disabled])')];
   if(!focusables.length)return;
   if(event.shiftKey&&document.activeElement===focusables[0]){event.preventDefault();focusables.at(-1).focus();}
   else if(!event.shiftKey&&document.activeElement===focusables.at(-1)){event.preventDefault();focusables[0].focus();}
  };
  root.querySelectorAll('[data-mf444-dismiss]').forEach(button=>button.addEventListener('click',()=>dismiss(false)));
  root.querySelector('[data-mf444-approve]').addEventListener('click',()=>dismiss(true));
  document.body.appendChild(root);
  document.addEventListener('keydown',key,true);
  MF444.current={root,dismiss};
  root.querySelector('[data-mf444-dismiss]')?.focus();
 });
}
// v427 cover confirmations retain their safety/approval semantics, now sharing
// exactly the same UI as Metadata Recovery.
mf427Confirm=function(title,detail,action='Continue',destructive=false){
 return mf444Confirm(title,detail,action,destructive,0,'cover');
};
// Decide which side has room each time the FAB opens. When task progress is
// visible on a narrow screen the + button moves left; otherwise it sits right.
const mf444PreviousSetMenu=mf397SetMenu;
mf397SetMenu=function(open){
 const result=mf444PreviousSetMenu.apply(this,arguments);
 const menu=document.getElementById('mf397-fan'),fab=document.getElementById('mf397-fab');
 if(open&&menu&&fab){
  const rect=fab.getBoundingClientRect(),viewport=window.innerWidth||document.documentElement.clientWidth;
  const width=Math.min(310,Math.max(1,viewport-24));
  menu.classList.toggle('mf444-align-right',rect.right-width<12&&rect.left+width<viewport-12);
 }
 return result;
};
window.MediaFlowV444=Object.freeze({version:444,confirm:mf444Confirm,open:()=>!!MF444.current});
