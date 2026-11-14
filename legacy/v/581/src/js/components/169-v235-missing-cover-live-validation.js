/* ============================================================
   MediaFlow v235 — Missing Covers live preview + direct-image validation
   ------------------------------------------------------------
   - The pasted URL previews on the Dashboard poster only after it successfully
     loads as an image; preview state never writes to the Library.
   - Save Cover & Next stays disabled until the current URL is a valid http(s)
     direct image resource.
   - Invalid/non-image URLs show an inline warning and cannot be saved.
   - The title's real coverUrl is written only after the user presses Save Cover
     & Next and the exact current input has passed validation.
   ============================================================ */

const V235_RUNTIME_VERSION=235;
const V235_COVER_CHECK_DELAY=220;
const V235_COVER_CHECK_TIMEOUT=12000;
const V235_MISSING_STATE={
  itemId:'',
  value:'',
  valid:false,
  checking:false,
  token:0,
  timer:0,
  posterBase:'',
  posterTitle:''
};

function v235MissingCurrentId(){
  const item=typeof v192CurrentMissingCoverItem==='function'?v192CurrentMissingCoverItem():null;
  return String(item?.id||'');
}
function v235ResetMissingState(itemId=''){
  if(V235_MISSING_STATE.timer){clearTimeout(V235_MISSING_STATE.timer);V235_MISSING_STATE.timer=0;}
  V235_MISSING_STATE.itemId=String(itemId||'');
  V235_MISSING_STATE.value='';
  V235_MISSING_STATE.valid=false;
  V235_MISSING_STATE.checking=false;
  V235_MISSING_STATE.token+=1;
  V235_MISSING_STATE.posterBase='';
  V235_MISSING_STATE.posterTitle='';
}
function v235CoverCandidate(raw){
  const value=String(raw||'').trim();
  if(!value)return {value:'',url:'',ok:false,reason:'empty'};
  try{
    const parsed=new URL(value);
    if(parsed.protocol!=='http:'&&parsed.protocol!=='https:')return {value,url:'',ok:false,reason:'protocol'};
    return {value,url:parsed.href,ok:true,reason:''};
  }catch(_){return {value,url:'',ok:false,reason:'url'};}
}
function v235MissingNodes(){
  return {
    input:document.getElementById('v192-cover-url-input'),
    button:document.getElementById('v235-save-cover-btn'),
    notice:document.getElementById('v235-cover-url-notice'),
    poster:document.querySelector('.v192-missing-covers .v192-cover-placeholder')
  };
}
function v235CapturePosterBase(poster){
  if(!poster)return;
  const id=v235MissingCurrentId();
  if(V235_MISSING_STATE.itemId!==id){v235ResetMissingState(id);}
  if(!V235_MISSING_STATE.posterBase){
    V235_MISSING_STATE.posterBase=poster.innerHTML;
    V235_MISSING_STATE.posterTitle=poster.getAttribute('title')||'Open title details';
  }
}
function v235RestorePoster(){
  const {poster}=v235MissingNodes();
  if(!poster)return;
  v235CapturePosterBase(poster);
  if(V235_MISSING_STATE.posterBase)poster.innerHTML=V235_MISSING_STATE.posterBase;
  poster.setAttribute('title',V235_MISSING_STATE.posterTitle||'Open title details');
  poster.classList.remove('v235-cover-preview-active');
}
function v235PreviewPoster(url){
  const {poster}=v235MissingNodes();
  if(!poster)return;
  v235CapturePosterBase(poster);
  const item=typeof v192CurrentMissingCoverItem==='function'?v192CurrentMissingCoverItem():null;
  const alt=item?`${cleanTitle(item.title)} cover preview`:'Cover preview';
  poster.innerHTML=`<img class="v235-live-cover-preview" src="${escapeHtml(url)}" alt="${escapeHtml(alt)}">`;
  poster.setAttribute('title','Preview only · Save cover & Next to keep this cover');
  poster.classList.add('v235-cover-preview-active');
}
function v235SetCoverValidationUi(kind,message){
  const {input,button,notice}=v235MissingNodes();
  const valid=kind==='valid';
  if(button){
    button.disabled=!valid;
    button.setAttribute('aria-disabled',valid?'false':'true');
    button.title=valid?'Save this validated cover and continue':'Enter a valid direct image URL first';
  }
  if(input){
    input.classList.toggle('v235-cover-valid',valid);
    input.classList.toggle('v235-cover-invalid',kind==='invalid');
    input.classList.toggle('v235-cover-checking',kind==='checking');
    input.setAttribute('aria-invalid',kind==='invalid'?'true':'false');
  }
  if(notice){
    notice.className=`v235-cover-url-notice ${kind?`is-${kind}`:''}`.trim();
    notice.textContent=message||'';
  }
}
function v235InvalidateCover(value,message){
  V235_MISSING_STATE.value=String(value||'').trim();
  V235_MISSING_STATE.valid=false;
  V235_MISSING_STATE.checking=false;
  v235RestorePoster();
  v235SetCoverValidationUi('invalid',message||'Use a valid direct image URL. This cover will not be saved.');
}
function v235ValidateMissingCover(raw){
  const id=v235MissingCurrentId();
  if(V235_MISSING_STATE.itemId!==id)v235ResetMissingState(id);
  const candidate=v235CoverCandidate(raw);
  V235_MISSING_STATE.value=candidate.value;
  V235_MISSING_STATE.valid=false;
  V235_MISSING_STATE.checking=false;
  const token=++V235_MISSING_STATE.token;
  if(V235_MISSING_STATE.timer){clearTimeout(V235_MISSING_STATE.timer);V235_MISSING_STATE.timer=0;}

  if(!candidate.value){
    v235RestorePoster();
    v235SetCoverValidationUi('idle','Paste a direct image URL to preview it.');
    return;
  }
  if(!candidate.ok){
    v235InvalidateCover(candidate.value,'Enter a valid http:// or https:// direct image URL.');
    return;
  }

  v235SetCoverValidationUi('checking','Checking image URL…');
  V235_MISSING_STATE.checking=true;
  V235_MISSING_STATE.timer=setTimeout(()=>{
    V235_MISSING_STATE.timer=0;
    if(token!==V235_MISSING_STATE.token)return;
    const probe=new Image();
    let settled=false;
    const finish=(ok)=>{
      if(settled)return; settled=true;
      clearTimeout(timeout);
      if(token!==V235_MISSING_STATE.token)return;
      const nodes=v235MissingNodes();
      if(!nodes.input||String(nodes.input.value||'').trim()!==candidate.value)return;
      V235_MISSING_STATE.checking=false;
      if(ok&&probe.naturalWidth>0&&probe.naturalHeight>0){
        V235_MISSING_STATE.valid=true;
        V235_MISSING_STATE.value=candidate.value;
        v235PreviewPoster(candidate.url);
        v235SetCoverValidationUi('valid','Valid image URL · preview only. Press Save cover & Next to save it.');
      }else{
        v235InvalidateCover(candidate.value,'This URL does not load as a direct image. Use a valid direct image URL.');
      }
    };
    probe.onload=()=>finish(true);
    probe.onerror=()=>finish(false);
    const timeout=setTimeout(()=>finish(false),V235_COVER_CHECK_TIMEOUT);
    try{probe.src=candidate.url;}catch(_){finish(false);}
  },V235_COVER_CHECK_DELAY);
}

const v235MissingCoversHtmlBase=v192MissingCoversHtml;
v192MissingCoversHtml=function(){
  const html=v235MissingCoversHtmlBase.apply(this,arguments);
  if(!html||!html.includes('v192-cover-url-input'))return html;
  try{
    const host=document.createElement('div');
    host.innerHTML=html;
    const input=host.querySelector('#v192-cover-url-input');
    const field=host.querySelector('.v192-cover-url-field');
    const actionButtons=[...host.querySelectorAll('.v192-cover-actions .btn')];
    const save=actionButtons.find(el=>/save\s*cover\s*&\s*next/i.test(String(el.textContent||'')));
    if(input){
      input.setAttribute('oninput','App.v235ValidateMissingCover(this.value)');
      input.setAttribute('onkeydown',"if(event.key==='Enter'){event.preventDefault();App.v192SaveMissingCover()}");
      input.setAttribute('autocomplete','off');
      input.setAttribute('spellcheck','false');
      input.setAttribute('aria-describedby','v235-cover-url-notice');
    }
    if(field&&!host.querySelector('#v235-cover-url-notice')){
      field.insertAdjacentHTML('beforeend','<div id="v235-cover-url-notice" class="v235-cover-url-notice is-idle" role="status" aria-live="polite">Paste a direct image URL to preview it.</div>');
    }
    if(save){
      save.id='v235-save-cover-btn';
      save.disabled=true;
      save.setAttribute('aria-disabled','true');
      save.setAttribute('onclick','App.v192SaveMissingCover()');
      save.title='Enter a valid direct image URL first';
    }
    return host.innerHTML;
  }catch(_){return html;}
};

const v235SaveMissingCoverBase=App.v192SaveMissingCover||v192SaveMissingCover;
function v235GuardedSaveMissingCover(){
  const item=typeof v192CurrentMissingCoverItem==='function'?v192CurrentMissingCoverItem():null;
  const input=document.getElementById('v192-cover-url-input');
  const value=String(input?.value||'').trim();
  const id=String(item?.id||'');
  const safe=V235_MISSING_STATE.valid===true&&
    !V235_MISSING_STATE.checking&&
    V235_MISSING_STATE.itemId===id&&
    V235_MISSING_STATE.value===value;
  if(!safe){
    if(value)v235ValidateMissingCover(value);
    else v235SetCoverValidationUi('invalid','Paste a valid direct image URL before saving.');
    try{input?.focus();}catch(_){}
    showToast('Use a valid direct image URL before saving the cover.');
    return;
  }
  v235ResetMissingState('');
  return v235SaveMissingCoverBase.apply(this,arguments);
}
v192SaveMissingCover=v235GuardedSaveMissingCover;
Object.assign(App,{
  v192SaveMissingCover:v235GuardedSaveMissingCover,
  v235ValidateMissingCover
});

MediaFlowRuntime.version=V235_RUNTIME_VERSION;
