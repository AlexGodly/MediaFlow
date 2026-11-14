/* MediaFlow v427 — Unified Cover Recovery UX & Stability.
   Works with v424/v425 storage, matching, XP and title IDs; no schema change. */
const MF427_VERSION = 427;
const MF427 = {dialog:null,returnFocus:null,source:'',draft:null,providerIds:null,requestSerial:0,busySave:false,activeSingle:false};
function mf427Icon(name,size=16){const paths={
  recovered:'<path d="m5 12 4 4L19 6"/><circle cx="12" cy="12" r="9"/>',
  unresolved:'<path d="M12 3a9 9 0 1 0 9 9"/><path d="M12 8v5M12 17h.01"/>',
  reviews:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4M8.5 10.5l1.5 1.5 3-3"/>',
  error:'<path d="M12 3 2 20h20L12 3Z"/><path d="M12 9v5m0 3h.01"/>',
  json:'<path d="M8 3H5v18h14V7l-4-4H8Z"/><path d="m9 12-2 2 2 2m6-4 2 2-2 2"/>',
  csv:'<path d="M8 3H5v18h14V7l-4-4H8Z"/><path d="M8 12h8M8 16h8M12 9v10"/>',
  wrench:'<path d="M14 7a5 5 0 0 0 6 6l-9 9-4-4 9-9M7 3l4 4-4 4-4-4 4-4Z"/>',
  server:'<rect x="3" y="3" width="18" height="8" rx="2"/><rect x="3" y="13" width="18" height="8" rx="2"/><path d="M7 7h.01M7 17h.01"/>',
  spark:'<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z"/>',
  pause:'<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
  play:'<path d="m8 5 11 7-11 7Z"/>',
  stop:'<rect x="5" y="5" width="14" height="14" rx="2"/>',
  flag:'<path d="M5 21V4M5 5h13l-3 4 3 4H5"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  download:'<path d="M12 3v12m-4-4 4 4 4-4M5 17v4h14v-4"/>',
  image:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="9" r="2"/><path d="m3 17 6-6 4 4 3-3 5 5"/>',
  sliders:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2"/><circle cx="16" cy="17" r="2"/>',
  close:'<path d="M5 5 19 19M19 5 5 19"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  alert:'<path d="M12 3 2 20h20L12 3Z"/><path d="M12 9v5m0 3h.01"/>'
};return '<svg class="mf427-icon" viewBox="0 0 24 24" width="'+size+'" height="'+size+'" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[name]||paths.image)+'</svg>';}
function mf427Escape(value){return mf424Escape(value);}
function mf427CurrentSaved(entry,id=''){
  const target=String(id|| (entry==='dashboard'?v192CurrentMissingCoverItem()?.id:entry==='details'?MF425.oneId:S.modal?.data?.id)||'');
  return target?mf424Lookup(target):null;
}
function mf427CurrentDraft(entry){
  const saved=mf427CurrentSaved(entry);
  if(entry==='dashboard'||entry==='details')return saved?{...saved,externalIds:{...(saved.externalIds||{})}}:null;
  const d=S.modal?.data||{};
  const original=saved||d;
  const title=document.getElementById('l-title')?.value||original.title||'';
  const categoryId=document.getElementById('l-category')?.value||original.categoryId||'';
  const ids={...(original.externalIds||{})};
  document.querySelectorAll('#modal-root [data-v377-id]').forEach(el=>{const k=el.dataset.v377Id;if(k&&String(el.value||'').trim())ids[k]=el.value.trim();});
  return {...original,id:saved?.id||'draft',title:String(title).trim(),categoryId,externalIds:ids};
}
function mf427PrefConfirm(){return S.settings?.v427CoverRecovery?.confirmBeforeApply===true;}
function mf427SetConfirmation(on){
  S.settings=S.settings||{};
  S.settings.v427CoverRecovery={...(S.settings.v427CoverRecovery||{}),confirmBeforeApply:Boolean(on)};
  Promise.resolve(saveState()).catch(e=>{console.warn('Cover confirmation setting could not sync',e);showToast('Unable to sync cover confirmation setting.');});
}
function mf427DialogDismiss(approved){
  const d=MF427.dialog;if(!d)return;
  MF427.dialog=null;document.getElementById('mf427-confirm')?.remove();
  document.removeEventListener('keydown',mf427DialogKey,true);
  try{d.focus?.focus?.()}catch(_){};
  d.resolve(Boolean(approved));
}
function mf427DialogKey(ev){if(ev.key==='Escape'){ev.preventDefault();ev.stopPropagation();mf427DialogDismiss(false);} }
function mf427Confirm(title,detail,action='Continue',destructive=false){
  if(MF427.dialog)return Promise.resolve(false);
  const focus=document.activeElement;
  return new Promise(resolve=>{
    MF427.dialog={resolve,focus};
    const el=document.createElement('div');el.id='mf427-confirm';el.className='mf427-confirm mf425-themed';
    el.innerHTML='<div class="mf427-confirm-shade"></div><section class="mf427-confirm-panel" role="alertdialog" aria-modal="true" aria-labelledby="mf427-confirm-title" aria-describedby="mf427-confirm-detail">'+
    '<div class="mf427-confirm-head">'+mf427Icon(destructive?'alert':'check',24)+'<div><h2 id="mf427-confirm-title">'+mf427Escape(title)+'</h2><p id="mf427-confirm-detail">'+mf427Escape(detail)+'</p></div></div>'+
    '<div class="mf427-confirm-actions"><button type="button" class="btn btn-ghost" onclick="App.mf427DialogDismiss(false)">Cancel</button><button type="button" class="btn '+(destructive?'btn-danger':'btn-primary')+'" onclick="App.mf427DialogDismiss(true)">'+mf427Icon(destructive?'alert':'check')+' '+mf427Escape(action)+'</button></div></section>';
    document.body.appendChild(el);document.addEventListener('keydown',mf427DialogKey,true);
    el.querySelector('.mf427-confirm-actions .btn-ghost')?.focus();
  });
}
App.mf427DialogDismiss=mf427DialogDismiss;
App.mf427SetConfirmation=mf427SetConfirmation;
// v424 start/retry now await this themed replacement for native confirm().
async function mf427ConfirmJobReplace(){return mf427Confirm('Replace existing recovery?',
  'Completed covers and earned XP stay saved. Pending cover confirmations from the existing job will be lost.',
  'Replace recovery',true);}
async function mf427ConfirmRetryPending(){return mf427Confirm('Discard pending reviews?',
  'Unresolved confirmations from the previous job are kept only in its exported report.',
  'Continue with retry',true);}
async function mf427ConfirmRetry(count){return mf427Confirm('Retry unresolved titles?',
  'Create a new safe recovery job for '+Number(count).toLocaleString()+' unresolved title(s).',
  'Retry unresolved',false);}
function mf427SingleContext(entry,explicitId){
  const selected=String(explicitId|| (entry==='details'?MF425.oneId:entry==='dashboard'?v192CurrentMissingCoverItem()?.id:S.modal?.data?.id)||'');
  const saved=selected?mf424Lookup(selected):null;
  if(entry==='details'&&saved)MF425.oneId=String(saved.id);
  return {entry,id:saved?.id||'',item:mf427CurrentDraft(entry)};
}
const mf427OldOpenConfig=App.mf425OpenConfig;
App.mf425OpenConfig=function(entry='settings',id=''){
  const single=['editor','details','dashboard'].includes(entry);
  if(!single)return mf427OldOpenConfig.apply(this,arguments);
  const ctx=mf427SingleContext(entry,id);
  if(!ctx.item?.title){showToast('Enter a title first to search for its cover.');return;}
  MF427.source=entry;MF427.draft=ctx.item;
  MF427.activeSingle=true;
  // Use exactly the existing v424 provider / selection configuration UI.
  // For a saved uncovered title the current v425 scoped background engine remains available.
  if(ctx.id&&mf424Missing(mf424Lookup(ctx.id))){
    const res=mf427OldOpenConfig.call(this,entry,ctx.id);
    const modal=document.getElementById('mf424-modal');modal?.classList.add('mf427-above-editor');
    mf427CleanAdvancedIcons(modal);
    return res;
  }
  // An unsaved draft or already-covered title must never start a Library-wide job.
  MF425.oneId=ctx.id||'draft';MF425.locked=true;MF425.selected=[];MF425.startMode='single';
  mf425OldConfig();mf425DecorateConfig();
  const modal=document.getElementById('mf424-modal');if(!modal)return;
  modal.classList.add('mf427-above-editor','mf427-single-config');
  const start=modal.querySelector('.mf424-actions .btn-primary');if(start){start.disabled=false;start.title='Search only this title';start.innerHTML=mf427Icon('image')+' Find cover candidates';start.setAttribute('onclick','App.mf427StartSingle()');}
  const count=modal.querySelector('#mf425-scope-count');if(count)count.innerHTML=mf427Icon('image')+' Searching <strong>'+mf427Escape(ctx.item.title)+'</strong> only — no new Library title or bulk job will be created.';
  mf427CleanAdvancedIcons(modal);
};
// Keep the existing Settings / Library controls routed to the new single-title dispatcher.
App.mf424OpenConfig=()=>App.mf425OpenConfig('settings');
function mf427CleanAdvancedIcons(root=document){
  if(!root)return;
  root.querySelectorAll('button').forEach(btn=>{
    if(!/Advanced Recovery/.test(btn.textContent||''))return;
    btn.querySelectorAll(':scope > .v225-btn-icon').forEach(x=>x.remove());
    const icons=[...btn.querySelectorAll(':scope > svg')];
    if(icons.length>1)icons.slice(1).forEach(n=>n.remove());
    if(!icons.length)btn.insertAdjacentHTML('afterbegin',mf427Icon('sliders'));
    btn.dataset.v225Iconified='1';btn.dataset.v226SemanticIcon='';
  });
}
function mf427ProvidersFromForm(){const form=document.getElementById('mf424-config');return [...(form?.querySelectorAll('[data-mf424-provider]')||[])].filter(x=>x.checked).map(x=>x.value);}
App.mf427StartSingle=async function(){
  if(!MF427.draft?.title)return;
  const providers=mf427ProvidersFromForm();
  if(!providers.length){showToast('Enable at least one compatible cover provider.');return;}
  const entry=MF427.source||'editor',item={...MF427.draft};
  document.getElementById('mf424-modal')?.remove();
  await mf427OpenSearch(entry,item,providers);
};
// Show the same modern picker from all entry points, preserving existing editor drafts.
async function mf427OpenSearch(entry='editor',item=null,providers=null){
  const current=item||mf427CurrentDraft(entry);
  if(!current?.title){showToast('Enter a title first to find cover artwork.');return;}
  if(MF425.quickBusy){showToast('Cover search is already running.');return;}
  MF425.quickBusy=true;MF425.quick=null;MF425.quickEntry=entry;
  MF425.draft={...current,externalIds:{...(current.externalIds||{})}};
  const serial=++MF427.requestSerial;
  // Use the live shared Recovery registry, including provider modules added
  // later. Saved bulk preferences determine "All enabled", but users can
  // search any supported public source individually without rewriting prefs.
  const catalog=mf424CoverProviderChoices(current),eligible=catalog.filter(p=>p.usable);
  const enabled=eligible.filter(p=>p.enabled),chosen=providers?new Set(providers):null;
  const allowed=(chosen?eligible.filter(p=>chosen.has(p.id)):(enabled.length?enabled:eligible)).map(p=>p.id);
  const sourceOptions=catalog.map(p=>{
    const reason=!p.usable?(p.credentials?'requires configuration':p.level||'unavailable in browser'):p.enabled?'':'off for background recovery';
    return '<option value="'+mf427Escape(p.id)+'" '+(!p.usable?'disabled':'')+'>'+mf427Escape(p.name+(reason?' — '+reason:''))+'</option>';
  }).join('');
  document.getElementById('mf425-instant-modal')?.remove();
  const root=document.createElement('div');root.id='mf425-instant-modal';root.className='mf424-modal mf425-themed mf425-instant-modal mf427-above-editor mf427-search';
  root.innerHTML='<div class="mf424-shade" onclick="App.mf425CloseInstant()"></div><section class="mf424-dialog" role="dialog" aria-modal="true" aria-label="Instant cover search">'+
    '<header class="mf425-instant-head"><div><small>COVER SEARCH</small><h2>'+mf427Icon('image',23)+' Cover matches for '+mf427Escape(current.title)+'</h2><p>Library title: <strong>'+mf427Escape(current.title)+'</strong> · Verify matched titles and external IDs before selecting.</p></div><button type="button" class="btn btn-ghost" onclick="App.mf425CloseInstant()">Close</button></header>'+
    '<div class="mf427-provider-picker"><label for="mf427-provider-select">Cover source</label><select id="mf427-provider-select"><option value="">'+(enabled.length?'All enabled compatible providers':'All compatible public providers')+'</option>'+sourceOptions+'</select><button type="button" class="btn btn-ghost" onclick="App.mf427RetryProvider()">Search source</button><p class="mf427-provider-hint">'+(eligible.length?eligible.length+' supported source'+(eligible.length===1?'':'s')+' across all categories. Disabled background sources can be searched individually.':'No browser-ready source is available. Providers needing keys or restricted browser access cannot be queried.')+'</p></div>'+ 
    '<div id="mf425-instant-results" class="mf425-instant-results" role="status" aria-live="polite"><p class="mf425-loading">Checking permitted cover providers safely…</p></div>'+ 
    '<div class="mf424-actions"><button type="button" class="btn btn-ghost" onclick="App.mf425CloseInstant()">Cancel</button></div></section>';
  document.body.appendChild(root);mf427CleanAdvancedIcons(root);
  const found=[],seen=new Set(),outcomes=[];let exhausted=false;
  const ordered=allowed.filter(p=>mf424HasID(current,p)).concat(allowed.filter(p=>!mf424HasID(current,p)));
  try{
    for(const provider of ordered){
      if(!root.isConnected||serial!==MF427.requestSerial)break;
      let checked=0,validated=0,failed='';
      try{
        const candidates=await mf424Discover(current,provider);checked=candidates.length;
        for(const c of candidates){
          if(!root.isConnected||serial!==MF427.requestSerial)break;
          if(!c||seen.has(c.url))continue;
          seen.add(c.url);
          if(await mf424Image(c.url,c.provider)){if(found.length<64)found.push(c);validated++;}
        }
      }catch(e){failed=String(e?.message||e).slice(0,160);console.warn('Cover search provider temporarily unavailable',provider,e);}
      outcomes.push({name:mf424Provider(provider)?.name||provider,checked,validated,failed});
      if(!root.isConnected||serial!==MF427.requestSerial)break;
      MF425.quick={candidates:found};
      const display=root.querySelector('#mf425-instant-results');if(display)display.innerHTML=mf425CandidatesHtml(found,current)+mf427ProviderSummary(outcomes);
      // Continue checking all eligible sources even after the results view is full.
    }
    exhausted=true;
  }finally{
    if(serial===MF427.requestSerial){
      MF425.quick={candidates:found};MF425.quickBusy=false;
      const display=root.querySelector('#mf425-instant-results');if(display)display.innerHTML=mf425CandidatesHtml(found,current)+mf427ProviderSummary(outcomes);
      // Opt-in: auto-apply only one uniquely ID-verified image across ALL checked
      // providers. A title-only match, provider error, conflicting artwork,
      // cancellation, or changed Dashboard title ALWAYS falls back to review.
      if(exhausted&&entry==='dashboard'&&S.settings?.v430MissingCoversAutoSave&&found.length===1){
        const selected=found[0],live=v192CurrentMissingCoverItem();
        const stillSame=live&&String(live.id)===String(current.id);
        if(stillSame&&selected.idMatch&&Number(selected.confidence)>=.95){
          const input=document.getElementById('v192-cover-url-input');
          if(input){
            // v431: the v235 image probe is asynchronous. Never invoke the
            // guarded Save action until it reports that this URL actually loaded.
            input.value=selected.url;
            App.v235ValidateMissingCover?.(selected.url);
            App.mf425CloseInstant();
          }
        }
      }
    }
  }
}
function mf427ProviderSummary(rows){return '<details class="mf427-provider-summary"><summary>Provider checks ('+rows.length+')</summary><div>'+rows.map(r=>'<p><strong>'+mf427Escape(r.name)+'</strong> — '+(r.failed?'Unavailable: '+mf427Escape(r.failed):r.validated?r.validated+' verified image'+(r.validated===1?'':'s'):r.checked?'Records found, but images did not validate':'No matching records')+'</p>').join('')+'</div></details>';}
App.mf427RetryProvider=function(){if(MF425.quickBusy){showToast('Current cover-source checks are still running.');return;}
 const choice=document.getElementById('mf427-provider-select')?.value||'';
 if(choice&&!mf424CoverProviderChoices(MF425.draft||{}).some(p=>p.id===choice&&p.usable)){
   showToast('This source requires setup or is not accessible from the website.');return;
 }
 return mf427OpenSearch(MF425.quickEntry||'editor',MF425.draft,choice?[choice]:null);
};
const mf427OldCloseInstant=App.mf425CloseInstant;
App.mf425CloseInstant=function(){++MF427.requestSerial;MF425.quickBusy=false;return mf427OldCloseInstant.apply(this,arguments);};
App.mf425Instant=function(entry='editor'){return mf427OpenSearch(entry);};
// The existing legacy Add/Edit picker button is intercepted in capture phase,
// before inline handlers open the old dark, low-contrast modal.
document.addEventListener('click',function(ev){
  const btn=ev.target?.closest?.('button');if(!btn||!btn.isConnected)return;
  if(!btn.closest('#modal-root')||btn.closest('#mf425-instant-modal,#mf424-modal'))return;
  if(!/Find cover automatically/i.test(btn.textContent||'')&&!/Find cover automatically/i.test(btn.title||''))return;
  ev.preventDefault();ev.stopImmediatePropagation();App.mf425Instant('editor');
},true);
// Explicit modern picker replaces old cover-picker modal rendering on all legacy flows.
const mf427LegacyPicker=coverPickerModalHtml;
coverPickerModalHtml=function(data){return mf427LegacyPicker.apply(this,arguments);};
function mf427FillEditor(url){
  const inputs=[...document.querySelectorAll('#modal-root input')];
  const input=inputs.find(x=>x.type!=='file'&&/cover|image/i.test(x.id+' '+x.placeholder+' '+x.name))||inputs.find(x=>x.type==='url');
  if(!input)return false;
  input.value=url;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));return true;
}
function mf427SelectedLinkId(index){
  return document.querySelector('#mf425-instant-modal [data-mf425-cover-link-id="'+Number(index)+'"]')?.checked===true;
}
function mf427FillDraftExternalId(candidate){
  if(typeof mf433FillDraftExternalIds==='function')
    return mf433FillDraftExternalIds(candidate);
  const live=MF425.draft||{},link=mf424LinkableCoverId(live,candidate);
  if(!link||link.conflict||link.existing===link.value)return false;
  const root=document.querySelector('#modal-root [data-v377-ids-editor]');
  const grid=root?.querySelector('.mf377-ids-grid');
  if(!grid)return false;
  let input=[...grid.querySelectorAll('[data-v377-id]')].find(el=>el.dataset.v377Id===link.key);
  if(!input){
    const row=document.createElement('label');row.className='field';row.dataset.v377IdRow=link.key;
    row.innerHTML='<span class="field-label">'+mf427Escape(link.key.toUpperCase())+'</span><span class="mf377-id-control"><input type="text" data-v377-id="'+mf427Escape(link.key)+'" autocomplete="off"></span>';
    grid.appendChild(row);input=row.querySelector('input');
  }
  if(input&&(!input.value||input.value.trim()===link.value)){
    input.value=link.value;input.dispatchEvent(new Event('input',{bubbles:true}));
    return true;
  }
  return false;
}
async function mf427SaveExisting(item,url,candidate,linkId=false){
  if(!item||!url)return false;
  const provider=candidate?.provider||'unknown',before=String(item.coverUrl||'');
  const link=linkId?mf424LinkableCoverId(item,candidate):null;
  const shouldLink=!!(linkId&&(typeof mf433CandidateLinks==='function'
    ?mf433CandidateLinks(item,candidate).some(x=>!x.conflict&&x.existing!==x.value)
    :link&&!link.conflict&&link.existing!==link.value));
  if(before===url&&!shouldLink){showToast('This cover and its provider ID are already saved.');return true;}
  if(MF427.busySave)return false;
  MF427.busySave=true;
  const old={coverUrl:item.coverUrl,coverSource:item.coverSource,modifiedAt:item.modifiedAt,
    externalIds:{...(item.externalIds||{})},v377ManualExternalIds:{...(item.v377ManualExternalIds||{})},
    richMetadataManual:item.richMetadataManual?{...item.richMetadataManual}:null};
  try{
    if(mf424Account()!==String((typeof AUTH_USER!=='undefined'&&AUTH_USER?.id)||'local'))throw new Error('Account changed');
    if(before!==url){
      item.coverUrl=url;item.coverSource='manual:instant:'+provider;
      if(typeof V178_EDITABLE_RICH_FIELDS!=='undefined'&&V178_EDITABLE_RICH_FIELDS.includes('coverUrl')){
        item.richMetadataManual=typeof v178ManualMap==='function'?v178ManualMap(item):(item.richMetadataManual||{});
        item.richMetadataManual.coverUrl=true;
      }
    }
    const linked=shouldLink&&mf424LinkSelectedCoverId(item,candidate,{manual:true});
    item.modifiedAt=Date.now();
    const earned=before!==url?mf425Credit(item,before,url,'instant:'+provider):0;
    if(typeof v53InvalidateLibraryCache==='function')v53InvalidateLibraryCache();
    await saveState();
    mf427FillEditor(url);
    showToast('Cover saved'+(linked?' · verified External IDs linked':'')+(earned?' · +'+earned.toLocaleString()+' XP':'')+' ✓');
    return true;
  }catch(e){
    item.coverUrl=old.coverUrl;item.coverSource=old.coverSource;item.modifiedAt=old.modifiedAt;
    item.externalIds=old.externalIds;item.v377ManualExternalIds=old.v377ManualExternalIds;
    item.richMetadataManual=old.richMetadataManual;
    console.error('Instant cover save failed',e);showToast('Cover could not be saved. Please try again.');return false;
  }finally{MF427.busySave=false;}
}
async function mf427LinkAfterExternalSave(item,candidate,url,linkId){
  if(!linkId||!item||String(item.coverUrl||'')!==String(url))return false;
  const link=mf424LinkableCoverId(item,candidate);
  if(!(typeof mf433CandidateLinks==='function'
    ?mf433CandidateLinks(item,candidate).some(x=>!x.conflict&&x.existing!==x.value)
    :link&&!link.conflict&&link.existing!==link.value))return false;
  const oldIds={...(item.externalIds||{})},oldOverrides={...(item.v377ManualExternalIds||{})},oldModified=item.modifiedAt;
  if(!mf424LinkSelectedCoverId(item,candidate,{manual:true}))return false;
  item.modifiedAt=Date.now();
  try{await saveState();showToast('Verified provider External IDs linked');return true;}
  catch(e){
    item.externalIds=oldIds;item.v377ManualExternalIds=oldOverrides;item.modifiedAt=oldModified;
    console.error('Cover provider ID sync failed',e);
    showToast('Cover saved, but provider ID could not be linked. Try again.');
    return false;
  }
}
App.mf425ChooseInstant=async function(index){
  const candidate=MF425.quick?.candidates?.[Number(index)];
  if(!candidate){showToast('Cover result no longer available. Retry search.');return;}
  const entry=MF425.quickEntry||'editor',url=candidate.url;
  const linkId=mf427SelectedLinkId(index);
  const item=MF425.draft||mf427CurrentDraft(entry);
  const title=item?.title||candidate.title;
  if(mf427PrefConfirm()){
    const ok=await mf427Confirm('Use this cover?',
      'Use '+candidate.provider+' artwork matched to "'+(candidate.title||title)+'" for "'+title+'"?',
      'Use this cover',false);
    if(!ok)return;
  }
  if(entry==='dashboard'){
    const input=document.getElementById('v192-cover-url-input');
    if(!input){showToast('Missing Covers panel changed. Reopen the title.');return;}
    const before=v192CurrentMissingCoverItem()?.id;
    if(before&&String(before)!==String(item.id)){showToast('The queue changed. Please reopen cover search.');return;}
    const live=mf424Lookup(String(item.id||''));
    try{
      // v431 waits for direct-image validation instead of calling the
      // v235 guarded saver prematurely and silently leaving a URL in the bar.
      const saved=await App.mf431UseDashboardCover(url,String(item.id));
      if(saved){await mf427LinkAfterExternalSave(live,candidate,url,linkId);App.mf425CloseInstant();}
      else showToast('The selected cover was not saved. Check its URL or try again.');
    }catch(e){console.error('Dashboard cover selection',e);showToast('Unable to save the selected cover.');}
    return;
  }
  if(entry==='details'){
    const field=document.getElementById('v181-quick-value');
    if(!field){showToast('Quick Cover Edit has closed. Reopen the editor.');return;}
    const live=mf424Lookup(String(item.id||''));
    if(!live){showToast('The Library title has changed.');return;}
    field.value=url;field.dispatchEvent(new Event('input',{bubbles:true}));
    await Promise.resolve(App.v181SaveQuickDetail(live.id,'coverUrl'));
    await mf427LinkAfterExternalSave(live,candidate,url,linkId);
    App.mf425CloseInstant();
    return;
  }
  if(item?.id&&item.id!=='draft'){
    const live=mf424Lookup(String(item.id));
    if(!live){showToast('Could not locate this Library title.');return;}
    if(await mf427SaveExisting(live,url,candidate,linkId))App.mf425CloseInstant();
    return;
  }
  // Unsaved Add Title is intentionally a draft: never create cloud data early.
  if(!mf427FillEditor(url)){showToast('Cover URL field could not be found in the Add Title draft.');return;}
  const linked=linkId&&mf427FillDraftExternalId(candidate);
  showToast(linked?'Cover and verified provider IDs added to the draft. Save the title when ready.':'Cover added to the draft. Save the title when ready.');
  App.mf425CloseInstant();
};
App.mf425InstantAdvanced=function(){
  const entry=MF425.quickEntry||'editor',item=MF425.draft;
  App.mf425CloseInstant();App.mf425OpenConfig(entry,item?.id==='draft'?'':item?.id||'');
};
// Confirm only when the user enabled confirmation, including background review queue selections.
const mf427PreviousReviewConfirm=App.mf424Confirm;
App.mf424Confirm=async function(index){
  const candidate=MF424.job?.reviews?.[0]?.candidates?.[index];
  if(candidate&&mf427PrefConfirm()&&!await mf427Confirm('Apply reviewed cover?',
    'Save the '+candidate.provider+' cover for "'+(MF424.job?.reviews?.[0]?.title||'this title')+'"?',
    'Use this cover'))return;
  return mf427PreviousReviewConfirm.apply(this,arguments);
};
const mf427PreviousSettings=mf425SettingsMarkup;
mf425SettingsMarkup=function(){return mf427PreviousSettings()+
  '<label class="mf427-settings-confirm" data-mf-setting-id="cover-confirm"><input type="checkbox" '+(mf427PrefConfirm()?'checked':'')+' onchange="App.mf427SetConfirmation(this.checked)"><span><b>Confirm before applying a selected cover</b><small>Off by default: Use This Cover saves immediately. Turn on to review each selection before saving.</small></span></label>';};
// The v425 painter is the single source for counts and actions. Reorganize its elements only.
const mf427PreviousPaint=mf424Paint;
mf424Paint=function(){mf427PreviousPaint.apply(this,arguments);
  const root=document.getElementById('mf424-indicator');if(!root)return;
  const stats=root.querySelector('.mf424-stats');
  if(stats){const icons=['recovered','unresolved','reviews','error'];
    [...stats.children].slice(0,4).forEach((el,i)=>{el.classList.add('mf427-stat');el.insertAdjacentHTML('afterbegin',mf427Icon(icons[i]));});}
  const controls=root.querySelector('.mf424-controls');
  if(!controls)return;
  const buttons=[...controls.querySelectorAll(':scope > button')];
  const group=(name,className,matcher)=>{const matched=buttons.filter(b=>matcher.test(b.textContent||''));if(!matched.length)return;
    const section=document.createElement('div');section.className='mf427-action-group '+className;
    section.insertAdjacentHTML('beforeend','<small>'+name+'</small>');matched.forEach(b=>{b.querySelectorAll(':scope > .v225-btn-icon').forEach(x=>x.remove());section.appendChild(b);});controls.appendChild(section);};
  group('CURRENT RECOVERY','mf427-main-controls',/^(Pause|Continue|Resume|Stop after title|Finish part & stop|Review)/i);
  group('EXPORT & RETRY','mf427-export-controls',/^(JSON report|CSV report|Retry unresolved)/i);
  group('NEW JOB','mf427-new-controls',/^New Recovery/i);
  controls.querySelectorAll('button').forEach(btn=>{
    const label=(btn.textContent||'').trim();
    const name=/^New Recovery/i.test(label)?'plus':/^(Pause)/i.test(label)?'pause':/^(Continue|Resume)/i.test(label)?'play':/Stop after title/i.test(label)?'stop':/Finish part/i.test(label)?'flag':/JSON/i.test(label)?'json':/CSV/i.test(label)?'csv':/Review/i.test(label)?'reviews':/Retry/i.test(label)?'play':'image';
    btn.querySelectorAll(':scope > svg, :scope > .v225-btn-icon').forEach(x=>x.remove());
    btn.insertAdjacentHTML('afterbegin',mf427Icon(name));btn.dataset.v225Iconified='1';
  });
};
// Remove text glyphs in Support chips and keep one inline icon per label.
const mf427OriginalPolishSupport=mf425PolishSupport;
mf425PolishSupport=function(){mf427OriginalPolishSupport();
  document.querySelectorAll('.mf423-support-benefits span').forEach(node=>{
    const text=(node.textContent||'').replace(/[✧☁♡♥✦↗◉]/g,'').replace(/\s+/g,' ').trim();
    const icon=/More possibilities/i.test(text)?'spark':/Hosting & storage/i.test(text)?'server':/Ongoing improvements/i.test(text)?'wrench':null;
    if(!icon)return;
    if(node.dataset.mf427Icon===icon&&node.querySelectorAll(':scope > svg').length===1)return;
    node.dataset.mf427Icon=icon;node.textContent='';node.insertAdjacentHTML('afterbegin',mf427Icon(icon)+' '+mf427Escape(text));
  });
};
function mf427PolishControls(){
  document.querySelectorAll('.mf425-editor-tools,.mf425-dashboard-cover-actions,.mf425-instant-modal .mf424-actions').forEach(mf427CleanAdvancedIcons);
  mf425PolishSupport();
}
// Only observe relevant surfaces, batch cleanup into one microtask.
let mf427PolishQueued=false;
const mf427Observer=new MutationObserver(mutations=>{
  if(mf427PolishQueued)return;
  if(!mutations.some(m=>{const n=m.target;return n instanceof Element&&
     (n.closest('.mf425-editor-tools,.mf425-instant-modal,.mf423-support-benefits,.mf425-dashboard-cover-actions')||n.matches('.mf425-editor-tools,.mf425-instant-modal,.mf423-support-benefits,.mf425-dashboard-cover-actions'));}))return;
  mf427PolishQueued=true;queueMicrotask(()=>{mf427PolishQueued=false;mf427PolishControls();});
});
if(document.body)mf427Observer.observe(document.body,{childList:true,subtree:true});
queueMicrotask(mf427PolishControls);
MediaFlowRuntime.version=MF427_VERSION;
