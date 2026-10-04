/* ============================================================
   MediaFlow v144 — Reusable Category Icon & Color Palettes
   ============================================================ */

function v144SafeIconUrl(raw){
  const value=String(raw||'').trim();
  if(!value)return '';
  try{
    const u=new URL(value);
    if(u.protocol!=='http:'&&u.protocol!=='https:')return '';
    return value;
  }catch(_){
    return '';
  }
}

function v144CategoryIconText(cat){
  if(cat?.iconUrl && v144SafeIconUrl(cat.iconUrl))return '🖼️';
  return String(cat?.icon||'📚');
}

function v144CategoryIconHtml(cat){
  const url=v144SafeIconUrl(cat?.iconUrl);
  if(url){
    return `<img class="v144-cat-icon-img" src="${escapeHtml(url)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none';this.nextElementSibling.style.display='inline-block'"><span class="v144-cat-icon-emoji" style="display:none">🖼️</span>`;
  }
  return `<span class="v144-cat-icon-emoji">${escapeHtml(cat?.icon||'📚')}</span>`;
}

function v144NormalizeCustomCategoryIcons(){
  const raw=Array.isArray(S.settings?.customCategoryIcons)?S.settings.customCategoryIcons:[];
  const out=[],seen=new Set();

  for(const row of raw){
    if(!row||typeof row!=='object')continue;
    const type=row.type==='url'?'url':'emoji';
    let value=String(row.value||'').trim();

    if(type==='url'){
      value=v144SafeIconUrl(value);
      if(!value)continue;
    }else{
      if(!value)continue;
      value=Array.from(value).slice(0,12).join('');
    }

    const key=`${type}:${value}`;
    if(seen.has(key))continue;
    seen.add(key);
    out.push({type,value});
  }

  S.settings.customCategoryIcons=out;
  return out;
}

function v144NormalizeCustomCategoryColors(){
  const raw=Array.isArray(S.settings?.customCategoryColors)?S.settings.customCategoryColors:[];
  const out=[],seen=new Set();

  for(let value of raw){
    value=String(value||'').trim().toUpperCase();
    if(/^#[0-9A-F]{3}$/.test(value)){
      value='#'+value.slice(1).split('').map(x=>x+x).join('');
    }
    if(!/^#[0-9A-F]{6}$/.test(value)||seen.has(value))continue;
    seen.add(value);
    out.push(value);
  }

  S.settings.customCategoryColors=out;
  return out;
}

function v144IconSwatchHtml(type,value,selectedEmoji,selectedUrl,customIndex=null){
  const isUrl=type==='url';
  const selected=isUrl
    ? String(selectedUrl||'')===String(value)
    : !selectedUrl && String(selectedEmoji||'')===String(value);

  const visual=isUrl
    ? `<img src="${escapeHtml(value)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'"><span style="display:none">🖼️</span>`
    : escapeHtml(value);

  const dataAttr=isUrl
    ? `data-v144-icon-url="${escapeHtml(value)}"`
    : `data-v144-icon-emoji="${escapeHtml(value)}"`;

  const click=isUrl
    ? `App.v144PickCategoryIconUrl(this.dataset.v144IconUrl)`
    : `App.v144PickCategoryEmoji(this.dataset.v144IconEmoji)`;

  return `<span class="v144-icon-swatch">
    <button type="button" class="v144-swatch-main ${selected?'selected':''}" ${dataAttr} onclick="${click}" data-v144-icon-swatch="1" title="${isUrl?'URL icon':escapeHtml(value)}">${visual}</button>
    ${customIndex!==null?`<button type="button" class="v144-remove-swatch" onclick="event.stopPropagation();App.v144RemoveCustomCategoryIcon(${customIndex})" title="Remove saved icon">×</button>`:''}
  </span>`;
}

function v144CustomIconsHtml(selectedEmoji,selectedUrl,current){
  const custom=v144NormalizeCustomCategoryIcons();
  const rows=custom.map((x,i)=>v144IconSwatchHtml(x.type,x.value,selectedEmoji,selectedUrl,i));

  // If an edited category uses a custom icon that is not in the saved palette,
  // keep it visible as a current swatch without silently saving it.
  if(current?.iconUrl){
    const url=v144SafeIconUrl(current.iconUrl);
    if(url&&!custom.some(x=>x.type==='url'&&x.value===url)){
      rows.unshift(v144IconSwatchHtml('url',url,selectedEmoji,selectedUrl,null));
    }
  }else if(current?.icon && !ICON_CHOICES.includes(current.icon)){
    if(!custom.some(x=>x.type==='emoji'&&x.value===current.icon)){
      rows.unshift(v144IconSwatchHtml('emoji',current.icon,selectedEmoji,selectedUrl,null));
    }
  }

  return rows.length
    ? rows.join('')
    : `<span class="hint">No custom icons saved yet.</span>`;
}

function v144ColorSwatchHtml(color,selected,customIndex=null){
  return `<span class="v144-color-swatch">
    <button type="button" class="v144-color-main ${String(color).toUpperCase()===String(selected||'').toUpperCase()?'selected':''}" style="background:${escapeHtml(color)}" data-v144-color="${escapeHtml(color)}" onclick="App.pickColor(this.dataset.v144Color)" data-color-swatch title="${escapeHtml(color)}"></button>
    ${customIndex!==null?`<button type="button" class="v144-remove-swatch" onclick="event.stopPropagation();App.v144RemoveCustomCategoryColor(${customIndex})" title="Remove saved color">×</button>`:''}
  </span>`;
}

function v144CustomColorsHtml(selected,currentColor){
  const custom=v144NormalizeCustomCategoryColors();
  const rows=custom.map((c,i)=>v144ColorSwatchHtml(c,selected,i));
  const current=String(currentColor||'').toUpperCase();

  if(current && /^#[0-9A-F]{6}$/.test(current) &&
     !COLOR_CHOICES.some(c=>c.toUpperCase()===current) &&
     !custom.includes(current)){
    rows.unshift(v144ColorSwatchHtml(current,selected,null));
  }

  return rows.length
    ? rows.join('')
    : `<span class="hint">No custom colors saved yet.</span>`;
}

function v144RefreshCategoryIconSelection(){
  const emoji=String(document.getElementById('m-icon')?.value||'');
  const url=String(document.getElementById('m-icon-url')?.value||'');

  document.querySelectorAll('#modal-root [data-v144-icon-swatch]').forEach(el=>{
    const e=el.dataset.v144IconEmoji||'';
    const u=el.dataset.v144IconUrl||'';
    const selected=u?u===url:(!url&&e===emoji);
    el.classList.toggle('selected',selected);
  });

  const preview=document.getElementById('v144-current-icon-preview');
  if(preview){
    preview.innerHTML=url
      ? `<img src="${escapeHtml(url)}" alt="" referrerpolicy="no-referrer" onerror="this.outerHTML='🖼️'">`
      : escapeHtml(emoji||'✨');
  }
}

function v144RefreshCategoryColorSelection(){
  const color=String(document.getElementById('m-color')?.value||'').toUpperCase();
  document.querySelectorAll('#modal-root [data-color-swatch]').forEach(el=>{
    const c=String(el.dataset.v144Color||el.style.backgroundColor||'').toUpperCase();
    el.classList.toggle('selected',c===color);
  });

  const preview=document.getElementById('v144-current-color-preview');
  if(preview)preview.style.background=color||COLOR_CHOICES[0];
}

function v144RefreshCustomIconPalette(){
  const box=document.getElementById('v144-custom-icon-palette');
  if(!box)return;
  const emoji=String(document.getElementById('m-icon')?.value||'');
  const url=String(document.getElementById('m-icon-url')?.value||'');
  box.innerHTML=v144CustomIconsHtml(emoji,url,S.modal?.data||{});
  v144RefreshCategoryIconSelection();
}

function v144RefreshCustomColorPalette(){
  const box=document.getElementById('v144-custom-color-palette');
  if(!box)return;
  const color=String(document.getElementById('m-color')?.value||COLOR_CHOICES[0]).toUpperCase();
  box.innerHTML=v144CustomColorsHtml(color,S.modal?.data?.color||color);
  v144RefreshCategoryColorSelection();
}

categoryModalHtml=function(d){
  const isNew=!d.id;
  const selectedUrl=v144SafeIconUrl(d.iconUrl||'');
  const selectedEmoji=selectedUrl?'🖼️':String(d.icon||'✨');
  const selectedColor=String(d.color||COLOR_CHOICES[0]).toUpperCase();

  const defaultIcons=ICON_CHOICES
    .map(ic=>v144IconSwatchHtml('emoji',ic,selectedEmoji,selectedUrl,null))
    .join('');

  const defaultColors=COLOR_CHOICES
    .map(c=>v144ColorSwatchHtml(c,selectedColor,null))
    .join('');

  return `
    <div class="modal-title">${isNew?'Add category':'Edit category'}</div>

    <div class="field"><label class="field-label">Name</label><input type="text" id="m-name" value="${escapeHtml(d.name||'')}"></div>

    <div class="field">
      <label class="field-label">Icon</label>

      <div class="v144-palette">${defaultIcons}</div>

      <div class="v144-palette-title">Your saved icons</div>
      <div id="v144-custom-icon-palette" class="v144-palette">${v144CustomIconsHtml(selectedEmoji,selectedUrl,d)}</div>

      <div class="v144-custom-add-grid">
        <div class="v144-custom-add">
          <label>Add emoji / symbol</label>
          <div class="v144-custom-add-row">
            <input type="text" id="v144-custom-emoji" maxlength="32" placeholder="🧠">
            <button class="btn btn-sm" type="button" onclick="App.v144AddCustomCategoryEmoji()">Add</button>
          </div>
        </div>

        <div class="v144-custom-add">
          <label>Add icon URL</label>
          <div class="v144-custom-add-row">
            <input type="url" id="v144-custom-icon-url" placeholder="https://example.com/icon.png">
            <button class="btn btn-sm" type="button" onclick="App.v144AddCustomCategoryUrl()">Add</button>
          </div>
        </div>
      </div>

      <div class="v144-current-preview">
        <span>Selected:</span>
        <span id="v144-current-icon-preview" class="preview-box">${selectedUrl?`<img src="${escapeHtml(selectedUrl)}" alt="" referrerpolicy="no-referrer" onerror="this.outerHTML='🖼️'">`:escapeHtml(selectedEmoji)}</span>
        <span>${selectedUrl?'URL image':'Emoji / symbol'}</span>
      </div>

      <input type="hidden" id="m-icon" value="${escapeHtml(selectedEmoji||'✨')}">
      <input type="hidden" id="m-icon-url" value="${escapeHtml(selectedUrl)}">
    </div>

    <div class="field-row">
      <div class="field"><label class="field-label">Type</label>
        <select id="m-type"><option value="video" ${d.type==='video'?'selected':''}>Video</option><option value="reading" ${d.type==='reading'?'selected':''}>Reading</option></select>
      </div>
      <div class="field"><label class="field-label">Unit</label>
        <select id="m-unit">${Object.keys(UNITS).map(u=>`<option value="${u}" ${d.unit===u?'selected':''}>${UNITS[u].label}</option>`).join('')}</select>
      </div>
    </div>

    <div class="field-row">
      <div class="field"><label class="field-label">Suggested target</label><input type="number" id="m-target" min="1" value="${d.target||1}"></div>
      <div class="field"><label class="field-label">Weight (1–5)</label><input type="number" id="m-weight" min="1" max="5" value="${d.weight||3}"></div>
    </div>

    <div class="field-row">
      <div class="field"><label class="field-label">Minutes per unit</label><input type="number" id="m-mpu" min="1" value="${d.minutesPerUnit||20}"></div>
      <div class="field" style="display:flex; align-items:flex-end; gap:16px; padding-bottom:9px;">
        <label style="display:flex; align-items:center; gap:6px; font-size:13px;"><input type="checkbox" id="m-seasonal" ${d.seasonal?'checked':''}> Time-sensitive (seasonal)</label>
      </div>
    </div>

    <div class="field">
      <label class="field-label">Color</label>

      <div class="v144-palette">${defaultColors}</div>

      <div class="v144-palette-title">Your saved colors</div>
      <div id="v144-custom-color-palette" class="v144-palette">${v144CustomColorsHtml(selectedColor,d.color||selectedColor)}</div>

      <div class="v144-custom-add">
        <label>Add custom color</label>
        <div class="v144-color-picker-row">
          <input type="color" id="v144-custom-color-picker" value="${escapeHtml(selectedColor)}" oninput="document.getElementById('v144-custom-color-hex').value=this.value.toUpperCase()">
          <input type="text" id="v144-custom-color-hex" value="${escapeHtml(selectedColor)}" maxlength="7" placeholder="#AABBCC">
          <button class="btn btn-sm" type="button" onclick="App.v144AddCustomCategoryColor()">Add color</button>
        </div>
      </div>

      <div class="v144-current-preview">
        <span>Selected:</span>
        <span id="v144-current-color-preview" class="preview-box" style="background:${escapeHtml(selectedColor)}"></span>
        <span>${escapeHtml(selectedColor)}</span>
      </div>

      <input type="hidden" id="m-color" value="${escapeHtml(selectedColor)}">
    </div>

    <label style="display:flex; align-items:center; gap:6px; font-size:13px; margin-bottom:6px;"><input type="checkbox" id="m-enabled" ${d.enabled!==false?'checked':''}> Enabled</label>

    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
      <button type="button" class="btn btn-primary" onclick="App.saveCategoryModal('${d.id||''}',this)">Save category</button>
    </div>
  `;
};

App.v144PickCategoryEmoji=function(value){
  const emoji=String(value||'').trim();
  if(!emoji)return;

  const icon=document.getElementById('m-icon');
  const url=document.getElementById('m-icon-url');
  if(icon)icon.value=emoji;
  if(url)url.value='';

  if(S.modal?.type==='category'){
    S.modal.data.icon=emoji;
    S.modal.data.iconUrl='';
  }

  v144RefreshCategoryIconSelection();
};

App.v144PickCategoryIconUrl=function(raw){
  const url=v144SafeIconUrl(raw);
  if(!url){
    showToast('Use a valid http:// or https:// icon URL.');
    return;
  }

  const icon=document.getElementById('m-icon');
  const inputUrl=document.getElementById('m-icon-url');
  if(icon)icon.value='🖼️';
  if(inputUrl)inputUrl.value=url;

  if(S.modal?.type==='category'){
    S.modal.data.icon='🖼️';
    S.modal.data.iconUrl=url;
  }

  v144RefreshCategoryIconSelection();
};

// Keep the old App.pickIcon entry point working for all default emoji swatches.
App.pickIcon=function(value){
  App.v144PickCategoryEmoji(value);
};

App.pickColor=function(raw){
  let color=String(raw||'').trim().toUpperCase();
  if(/^#[0-9A-F]{3}$/.test(color))color='#'+color.slice(1).split('').map(x=>x+x).join('');
  if(!/^#[0-9A-F]{6}$/.test(color))return;

  const input=document.getElementById('m-color');
  if(input)input.value=color;
  if(S.modal?.type==='category')S.modal.data.color=color;

  const hex=document.getElementById('v144-custom-color-hex');
  const picker=document.getElementById('v144-custom-color-picker');
  if(hex)hex.value=color;
  if(picker)picker.value=color.toLowerCase();

  v144RefreshCategoryColorSelection();

  const previewText=document.querySelector('#v144-current-color-preview + span');
  if(previewText)previewText.textContent=color;
};

App.v144AddCustomCategoryEmoji=function(){
  const input=document.getElementById('v144-custom-emoji');
  let value=String(input?.value||'').trim();
  if(!value){
    showToast('Enter an emoji or symbol first.');
    return;
  }

  value=Array.from(value).slice(0,12).join('');
  const rows=v144NormalizeCustomCategoryIcons();
  if(!rows.some(x=>x.type==='emoji'&&x.value===value)){
    S.settings.customCategoryIcons=[...rows,{type:'emoji',value}];
    persistSettings();
  }

  if(input)input.value='';
  App.v144PickCategoryEmoji(value);
  v144RefreshCustomIconPalette();
  showToast('Custom icon saved ✓');
};

App.v144AddCustomCategoryUrl=function(){
  const input=document.getElementById('v144-custom-icon-url');
  const value=v144SafeIconUrl(input?.value||'');
  if(!value){
    showToast('Use a valid http:// or https:// icon URL.');
    return;
  }

  const rows=v144NormalizeCustomCategoryIcons();
  if(!rows.some(x=>x.type==='url'&&x.value===value)){
    S.settings.customCategoryIcons=[...rows,{type:'url',value}];
    persistSettings();
  }

  if(input)input.value='';
  App.v144PickCategoryIconUrl(value);
  v144RefreshCustomIconPalette();
  showToast('URL icon saved ✓');
};

App.v144RemoveCustomCategoryIcon=function(index){
  const rows=v144NormalizeCustomCategoryIcons();
  const i=Number(index);
  if(!Number.isInteger(i)||i<0||i>=rows.length)return;

  const removed=rows[i];
  S.settings.customCategoryIcons=rows.filter((_,n)=>n!==i);
  persistSettings();
  v144RefreshCustomIconPalette();
  showToast(`${removed.type==='url'?'URL icon':'Custom icon'} removed from saved palette`);
};

App.v144AddCustomCategoryColor=function(){
  const hex=document.getElementById('v144-custom-color-hex');
  let value=String(hex?.value||'').trim().toUpperCase();

  if(/^#[0-9A-F]{3}$/.test(value)){
    value='#'+value.slice(1).split('').map(x=>x+x).join('');
  }

  if(!/^#[0-9A-F]{6}$/.test(value)){
    showToast('Enter a valid hex color such as #7C5CFC.');
    return;
  }

  const rows=v144NormalizeCustomCategoryColors();
  if(!rows.includes(value)){
    S.settings.customCategoryColors=[...rows,value];
    persistSettings();
  }

  App.pickColor(value);
  v144RefreshCustomColorPalette();
  showToast('Custom color saved ✓');
};

App.v144RemoveCustomCategoryColor=function(index){
  const rows=v144NormalizeCustomCategoryColors();
  const i=Number(index);
  if(!Number.isInteger(i)||i<0||i>=rows.length)return;

  S.settings.customCategoryColors=rows.filter((_,n)=>n!==i);
  persistSettings();
  v144RefreshCustomColorPalette();
  showToast('Custom color removed from saved palette');
};

// v144 save: URL icon is now a first-class category field.
App.saveCategoryModal=function(id,button){
  if(button?.dataset?.saving==='1')return;
  if(button){button.dataset.saving='1';button.disabled=true;}

  const iconUrl=v144SafeIconUrl(document.getElementById('m-icon-url')?.value||'');
  const icon=iconUrl?'🖼️':(String(document.getElementById('m-icon')?.value||'').trim()||'✨');

  let color=String(document.getElementById('m-color')?.value||COLOR_CHOICES[0]).trim().toUpperCase();
  if(!/^#[0-9A-F]{6}$/.test(color))color=COLOR_CHOICES[0];

  const data={
    id:id||uid(),
    name:document.getElementById('m-name').value.trim()||'Untitled category',
    icon,
    iconUrl:iconUrl||null,
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

  const idx=S.categories.findIndex(c=>c.id===id);
  if(idx>=0)S.categories[idx]=Object.assign({},S.categories[idx],data);
  else S.categories.push(data);

  persistCategories();
  S.modal=null;
  render();
};

// Ensure old/new settings always have normalized arrays after loading/resetting.
const v144RenderSettingsBase=renderSettings;
renderSettings=function(){
  S.settings=S.settings||{};
  if(!Array.isArray(S.settings.customCategoryIcons))S.settings.customCategoryIcons=[];
  if(!Array.isArray(S.settings.customCategoryColors))S.settings.customCategoryColors=[];
  v144NormalizeCustomCategoryIcons();
  v144NormalizeCustomCategoryColors();
  return v144RenderSettingsBase();
};



