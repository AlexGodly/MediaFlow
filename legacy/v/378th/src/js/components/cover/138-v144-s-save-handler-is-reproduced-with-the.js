/* v144's save handler is reproduced with the v200 category cover field so the
   new value is persisted atomically with the rest of the category. */
App.saveCategoryModal=function(id,button){
  if(button?.dataset?.saving==='1')return;
  if(button){button.dataset.saving='1';button.disabled=true;}

  const iconUrl=v144SafeIconUrl(document.getElementById('m-icon-url')?.value||'');
  const icon=iconUrl?'🖼️':(String(document.getElementById('m-icon')?.value||'').trim()||'✨');
  const rawMissing=String(document.getElementById('m-missing-default-cover')?.value||'').trim();
  const missingDefaultCoverUrl=v200SafeCategoryCoverUrl(rawMissing);
  if(rawMissing&&!missingDefaultCoverUrl){
    if(button){delete button.dataset.saving;button.disabled=false;}
    showToast('Use a valid http:// or https:// Missing default cover URL.');
    return;
  }

  let color=String(document.getElementById('m-color')?.value||COLOR_CHOICES[0]).trim().toUpperCase();
  if(!/^#[0-9A-F]{6}$/.test(color))color=COLOR_CHOICES[0];

  const existing=(S.categories||[]).find(c=>String(c?.id||'')===String(id||''))||null;
  const oldMissing=v200CategoryMissingCoverUrl(existing||{});
  const missingModifiedAt=oldMissing!==missingDefaultCoverUrl?Date.now():(Number(existing?.missingDefaultCoverModifiedAt)||0);

  const data={
    id:id||uid(),
    name:document.getElementById('m-name').value.trim()||'Untitled category',
    icon,
    iconUrl:iconUrl||null,
    missingDefaultCoverUrl:missingDefaultCoverUrl||null,
    missingDefaultCoverModifiedAt:missingModifiedAt,
    type:document.getElementById('m-type').value,
    unit:document.getElementById('m-unit').value,
    target:Math.max(1,Number(document.getElementById('m-target').value)||1),
    weight:clamp(Number(document.getElementById('m-weight').value)||3,1,5),
    minutesPerUnit:Math.max(1,Number(document.getElementById('m-mpu').value)||20),
    seasonal:document.getElementById('m-seasonal').checked,
    color,
    enabled:document.getElementById('m-enabled').checked,
    custom:true
  };

  const idx=S.categories.findIndex(c=>String(c?.id||'')===String(id||''));
  if(idx>=0)S.categories[idx]=Object.assign({},S.categories[idx],data);
  else S.categories.push(data);

  persistCategories();
  S.modal=null;
  render();
};

