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



/* ============================================================
   MediaFlow v145 — Dynamic cover-based theme accent
   Source order: recommended title cover -> On This Day cover -> selected theme.
   Only --flow / --flow-dim are overlaid; the selected theme itself is unchanged.
   ============================================================ */

let V145_DYNAMIC_THEME_SEQ=0;
const V145_COVER_COLOR_CACHE=new Map();
S.v145DynamicThemeState=S.v145DynamicThemeState||{source:'theme',label:'Selected theme',url:'',color:''};

function v145Hex(n){return Math.max(0,Math.min(255,Math.round(n))).toString(16).padStart(2,'0').toUpperCase();}
function v145RgbHex(r,g,b){return `#${v145Hex(r)}${v145Hex(g)}${v145Hex(b)}`;}

function v145RgbToHsl(r,g,b){
  r/=255;g/=255;b/=255;
  const max=Math.max(r,g,b),min=Math.min(r,g,b),l=(max+min)/2,d=max-min;
  let h=0,s=0;
  if(d){
    s=l>.5?d/(2-max-min):d/(max+min);
    if(max===r)h=((g-b)/d+(g<b?6:0))/6;
    else if(max===g)h=((b-r)/d+2)/6;
    else h=((r-g)/d+4)/6;
  }
  return{h:h*360,s:s*100,l:l*100};
}
function v145HslToRgb(h,s,l){
  h=((Number(h)%360)+360)%360/360;s=Math.max(0,Math.min(100,Number(s)))/100;l=Math.max(0,Math.min(100,Number(l)))/100;
  if(!s){const v=Math.round(l*255);return{r:v,g:v,b:v};}
  const hue=(p,q,t)=>{if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;};
  const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q;
  return{r:Math.round(hue(p,q,h+1/3)*255),g:Math.round(hue(p,q,h)*255),b:Math.round(hue(p,q,h-1/3)*255)};
}
function v145CssColorToRgb(value){
  const v=String(value||'').trim();let m=v.match(/^#([0-9a-f]{6})$/i);
  if(m){const n=parseInt(m[1],16);return{r:(n>>16)&255,g:(n>>8)&255,b:n&255};}
  m=v.match(/^#([0-9a-f]{3})$/i);
  if(m)return{r:parseInt(m[1][0]+m[1][0],16),g:parseInt(m[1][1]+m[1][1],16),b:parseInt(m[1][2]+m[1][2],16)};
  m=v.match(/rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)/i);
  return m?{r:Number(m[1]),g:Number(m[2]),b:Number(m[3])}:null;
}
function v145Luminance(rgb){
  if(!rgb)return 0;
  const c=[rgb.r,rgb.g,rgb.b].map(v=>{v=Math.max(0,Math.min(255,v))/255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);});
  return .2126*c[0]+.7152*c[1]+.0722*c[2];
}
function v145TuneAccent(r,g,b){
  const hsl=v145RgbToHsl(r,g,b);
  const bg=v145CssColorToRgb(getComputedStyle(document.documentElement).getPropertyValue('--bg'));
  const dark=v145Luminance(bg)<.36;
  const s=Math.max(48,Math.min(88,hsl.s*1.12));
  const l=dark?Math.max(50,Math.min(65,hsl.l)):Math.max(34,Math.min(50,hsl.l));
  const rgb=v145HslToRgb(hsl.h,s,l);
  return v145RgbHex(rgb.r,rgb.g,rgb.b);
}
function v145MixHex(a,b,w=.58){
  const p=hex=>{const m=String(hex||'').match(/^#([0-9A-F]{6})$/i);if(!m)return null;const n=parseInt(m[1],16);return{r:(n>>16)&255,g:(n>>8)&255,b:n&255};};
  const x=p(a),y=p(b);if(!x||!y)return a;w=Math.max(0,Math.min(1,Number(w)||0));
  return v145RgbHex(x.r*w+y.r*(1-w),x.g*w+y.g*(1-w),x.b*w+y.b*(1-w));
}

function v145ExtractCoverAccent(url){
  url=String(url||'').trim();
  if(!url)return Promise.resolve(null);
  if(V145_COVER_COLOR_CACHE.has(url))return Promise.resolve(V145_COVER_COLOR_CACHE.get(url));
  return new Promise(resolve=>{
    const img=new Image();img.crossOrigin='anonymous';img.referrerPolicy='no-referrer';
    const done=v=>{V145_COVER_COLOR_CACHE.set(url,v||null);resolve(v||null);};
    img.onerror=()=>done(null);
    img.onload=()=>{
      try{
        const cv=document.createElement('canvas');cv.width=48;cv.height=64;
        const ctx=cv.getContext('2d',{willReadFrequently:true});if(!ctx)return done(null);
        ctx.drawImage(img,0,0,48,64);
        const data=ctx.getImageData(0,0,48,64).data,buckets=new Map();
        let fr=0,fg=0,fb=0,fn=0;
        for(let i=0;i<data.length;i+=16){
          const r=data[i],g=data[i+1],b=data[i+2],a=data[i+3];if(a<180)continue;
          const max=Math.max(r,g,b),min=Math.min(r,g,b),chroma=max-min,lum=(.2126*r+.7152*g+.0722*b)/255;if(lum>.08&&lum<.94){fr+=r;fg+=g;fb+=b;fn++;}
          const sat=max?chroma/max:0;if(sat<.18||lum<.10||lum>.90)continue;
          const key=`${Math.round(r/32)*32},${Math.round(g/32)*32},${Math.round(b/32)*32}`;
          const weight=(.35+sat)*(1-Math.abs(lum-.52)*.65),row=buckets.get(key)||{score:0,r:0,g:0,b:0,n:0};
          row.score+=weight;row.r+=r;row.g+=g;row.b+=b;row.n++;buckets.set(key,row);
        }
        let best=null;for(const row of buckets.values())if(!best||row.score>best.score)best=row;
        if(best?.n)return done(v145TuneAccent(best.r/best.n,best.g/best.n,best.b/best.n));
        if(fn)return done(v145TuneAccent(fr/fn,fg/fn,fb/fn));
        done(null);
      }catch(_){done(null);}
    };
    try{img.src=url;}catch(_){done(null);}
  });
}

function v145RecommendedCoverSource(){
  if(!S.settings?.exactTitleRecommendations)return null;
  const t=S.currentTask;if(!t?.title)return null;
  const item=v50FindLibraryItem(t.libraryId,t.title);
  return item?.coverUrl?{source:'recommended',label:`Recommended: ${cleanTitle(item.title)}`,url:String(item.coverUrl)}:null;
}

function v145OnThisDayCoverSources(){
  const now=new Date(),rows=[];
  const sameDay=d=>{
    if(!(d instanceof Date)||Number.isNaN(d.getTime()))return 0;
    const y=now.getFullYear()-d.getFullYear();
    return y>=1&&d.getMonth()===now.getMonth()&&d.getDate()===now.getDate()?y:0;
  };
  for(const s of(S.sessions||[])){
    if(!s||s.status==='skipped')continue;
    let d=null,key=typeof v119SessionDateKey==='function'?v119SessionDateKey(s):'';
    if(key){const x=new Date(key+'T12:00:00');if(!Number.isNaN(x.getTime()))d=x;}
    if(!d&&Number(s.timestamp)>0){const x=new Date(Number(s.timestamp));if(!Number.isNaN(x.getTime()))d=x;}
    const years=sameDay(d);if(!years)continue;
    for(const t of(s.titles||[])){
      const item=v50FindLibraryItem(t?.libraryId,t?.title);
      if(item?.coverUrl)rows.push({years,priority:1,timestamp:d.getTime(),label:`On This Day: ${cleanTitle(item.title)}`,url:String(item.coverUrl)});
    }
  }
  for(const item of(S.library||[])){
    if(!item?.coverUrl)continue;
    const start=Number(item.startedAt)>0?new Date(Number(item.startedAt)):null,sy=sameDay(start);
    if(sy)rows.push({years:sy,priority:0,timestamp:start.getTime(),label:`On This Day: ${cleanTitle(item.title)}`,url:String(item.coverUrl)});
    const finish=Number(item.completedAt)>0?new Date(Number(item.completedAt)):null,fy=sameDay(finish);
    if(fy)rows.push({years:fy,priority:2,timestamp:finish.getTime(),label:`On This Day: ${cleanTitle(item.title)}`,url:String(item.coverUrl)});
  }
  rows.sort((a,b)=>a.years-b.years||a.priority-b.priority||a.timestamp-b.timestamp);
  const seen=new Set();return rows.filter(x=>seen.has(x.url)?false:(seen.add(x.url),true));
}

function v145UpdateDynamicThemeStatus(){
  const el=document.getElementById('v145-cover-theme-status');if(!el)return;
  const st=S.v145DynamicThemeState||{},enabled=!!S.settings?.dynamicCoverTheme;
  const label=!enabled?'Off — using the selected theme':
    st.source==='recommended'||st.source==='onthisday'?`${st.label} · ${st.color||'cover color'}`:
    'No usable cover right now — using the selected theme';
  el.innerHTML=`<span class="v145-cover-theme-dot" ${st.color?`style="background:${escapeHtml(st.color)}"`:''}></span><span>${escapeHtml(label)}</span>`;
}
function v145ClearDynamicAccent(){
  const root=document.documentElement;root.style.removeProperty('--flow');root.style.removeProperty('--flow-dim');root.removeAttribute('data-v145-cover-theme');
  S.v145DynamicThemeState={source:'theme',label:'Selected theme',url:'',color:''};v145UpdateDynamicThemeStatus();
}
function v145ApplyDynamicAccent(color,source){
  const root=document.documentElement,bg=v145CssColorToRgb(getComputedStyle(root).getPropertyValue('--bg'));
  const bgHex=bg?v145RgbHex(bg.r,bg.g,bg.b):'#0E111A';
  root.style.setProperty('--flow',color);root.style.setProperty('--flow-dim',v145MixHex(color,bgHex,.58));root.dataset.v145CoverTheme=source.source;
  S.v145DynamicThemeState={source:source.source,label:source.label,url:source.url,color};v145UpdateDynamicThemeStatus();
}

async function v145RefreshDynamicCoverAccent(){
  const seq=++V145_DYNAMIC_THEME_SEQ;
  if(!S.settings?.dynamicCoverTheme){v145ClearDynamicAccent();return;}
  const sources=[],rec=v145RecommendedCoverSource();if(rec)sources.push(rec);
  v145OnThisDayCoverSources().forEach(x=>sources.push({source:'onthisday',label:x.label,url:x.url}));
  for(const source of sources){
    const color=await v145ExtractCoverAccent(source.url);
    if(seq!==V145_DYNAMIC_THEME_SEQ)return;
    if(color){v145ApplyDynamicAccent(color,source);return;}
  }
  if(seq===V145_DYNAMIC_THEME_SEQ)v145ClearDynamicAccent();
}
function v145ScheduleDynamicCoverAccent(){
  const gate=++V145_DYNAMIC_THEME_SEQ;
  Promise.resolve().then(()=>{if(gate===V145_DYNAMIC_THEME_SEQ)v145RefreshDynamicCoverAccent();});
}

App.toggleDynamicCoverTheme=function(){
  S.settings=S.settings||{};S.settings.dynamicCoverTheme=!S.settings.dynamicCoverTheme;
  if(!S.settings.dynamicCoverTheme){++V145_DYNAMIC_THEME_SEQ;v145ClearDynamicAccent();}
  persistSettings();render();
  if(S.settings.dynamicCoverTheme)v145ScheduleDynamicCoverAccent();
};

const v145RenderSettingsBase=renderSettings;
renderSettings=function(){
  let out=v145RenderSettingsBase(),enabled=!!S.settings?.dynamicCoverTheme;
  const panel=`<div class="v145-cover-theme-row"><div class="v145-cover-theme-copy"><b>Dynamic cover theme color</b><small>Use the recommended title cover as MediaFlow's accent color. If that title has no usable cover, MediaFlow tries an On This Day cover. If neither is available, your selected theme stays unchanged.</small><div id="v145-cover-theme-status" class="v145-cover-theme-status"><span class="v145-cover-theme-dot"></span><span>${enabled?'Looking for a cover color…':'Off — using the selected theme'}</span></div></div><button class="toggle ${enabled?'on':''}" type="button" onclick="App.toggleDynamicCoverTheme()" aria-label="Toggle dynamic cover theme color"></button></div>`;
  const needle='<div class="section-label">THEMES & CUSTOMIZATION</div><div class="card" style="margin-bottom:22px">';
  if(out.includes(needle))out=out.replace(needle,needle+panel);
  return out;
};

const v145ApplyThemeBase=applyTheme;
applyTheme=function(theme){
  v145ApplyThemeBase(theme);
  if(S.settings?.dynamicCoverTheme)v145ScheduleDynamicCoverAccent();else v145ClearDynamicAccent();
};

const v145RenderBase=render;
render=function(){
  const result=v145RenderBase.apply(this,arguments);v145ScheduleDynamicCoverAccent();return result;
};

const v145RenderShellBase=renderShell;
renderShell=function(){
  const result=v145RenderShellBase.apply(this,arguments);v145ScheduleDynamicCoverAccent();return result;
};



/* ============================================================
   MediaFlow v146 — Dynamic Full Cover Theme
   ------------------------------------------------------------
   Theme mode is now mutually exclusive:
     • MediaFlow / Platform / Full Style theme collections
     • Dynamic Cover Theme

   Dynamic source priority stays:
     1. current MediaFlow-recommended title cover
     2. On This Day cover
     3. stored selected theme as fallback

   Unlike v145, v146 derives the complete color system:
   background, panels, raised surfaces, borders, text and accent.
   ============================================================ */

let V146_DYNAMIC_SEQ=0;
const V146_THEME_VARS=[
  '--bg','--panel','--panel-raised','--border','--border-soft',
  '--text','--text-dim','--text-mute','--flow','--flow-dim'
];

S.v146DynamicThemeState=S.v146DynamicThemeState||{
  source:'theme',
  label:'Selected theme fallback',
  url:'',
  palette:null
};

function v146RgbFromHex(hex){
  const m=String(hex||'').match(/^#([0-9A-F]{6})$/i);
  if(!m)return null;
  const n=parseInt(m[1],16);
  return {r:(n>>16)&255,g:(n>>8)&255,b:n&255};
}

function v146HslHex(h,s,l){
  const rgb=v145HslToRgb(h,s,l);
  return v145RgbHex(rgb.r,rgb.g,rgb.b);
}

function v146PaletteFromAccent(accent,mode){
  const rgb=v146RgbFromHex(accent);
  if(!rgb)return null;

  const hsl=v145RgbToHsl(rgb.r,rgb.g,rgb.b);
  const h=hsl.h;
  const chroma=Math.max(42,Math.min(82,hsl.s*1.10 || 58));

  if(mode==='light'){
    const flow=v146HslHex(h,Math.max(58,chroma),42);
    return {
      mode:'light',
      bg:v146HslHex(h,Math.min(28,chroma*.30),97),
      panel:v146HslHex(h,Math.min(22,chroma*.24),99),
      raised:v146HslHex(h,Math.min(34,chroma*.38),93),
      border:v146HslHex(h,Math.min(32,chroma*.34),78),
      borderSoft:v146HslHex(h,Math.min(26,chroma*.28),87),
      text:v146HslHex(h,Math.min(28,chroma*.26),14),
      textDim:v146HslHex(h,Math.min(30,chroma*.30),34),
      textMute:v146HslHex(h,Math.min(26,chroma*.25),50),
      flow,
      flowDim:v146HslHex(h,Math.max(36,chroma*.68),78)
    };
  }

  const flow=v146HslHex(h,Math.max(58,chroma),58);
  return {
    mode:'dark',
    bg:v146HslHex(h,Math.min(34,chroma*.36),7),
    panel:v146HslHex(h,Math.min(38,chroma*.40),11),
    raised:v146HslHex(h,Math.min(42,chroma*.45),16),
    border:v146HslHex(h,Math.min(36,chroma*.36),29),
    borderSoft:v146HslHex(h,Math.min(34,chroma*.34),21),
    text:v146HslHex(h,Math.min(18,chroma*.16),95),
    textDim:v146HslHex(h,Math.min(22,chroma*.20),73),
    textMute:v146HslHex(h,Math.min(24,chroma*.22),53),
    flow,
    flowDim:v146HslHex(h,Math.max(34,chroma*.62),31)
  };
}

function v146ClearInlineThemeVars(){
  const root=document.documentElement;
  for(const key of V146_THEME_VARS)root.style.removeProperty(key);
  root.removeAttribute('data-v146-dynamic-active');
}

function v146RestoreSelectedThemeFallback(){
  const root=document.documentElement;

  v146ClearInlineThemeVars();
  root.dataset.v146ThemeMode=S.settings?.dynamicCoverTheme?'dynamic':'collection';

  // Apply the user's stored static theme without invoking v145/v146 scheduling.
  // This is the exact fallback when no usable cover exists.
  v145ApplyThemeBase(S.settings?.theme||'dark');

  S.v146DynamicThemeState={
    source:'theme',
    label:'Selected theme fallback',
    url:'',
    palette:null
  };

  v146UpdateThemeStatus();
}

function v146ApplyFullPalette(palette,source){
  if(!palette)return;

  const root=document.documentElement;

  // Dynamic Cover Theme uses the normal MediaFlow structural skin and supplies
  // every important theme color itself. The saved static theme remains intact
  // in S.settings.theme for instant fallback / later return to collections.
  root.dataset.theme='dark';
  root.dataset.v146ThemeMode='dynamic';
  root.dataset.v146DynamicActive='1';

  // Global Appearance's neutral !important layer would otherwise mask the
  // dynamic surfaces. We still honor its Light/Dark preference when generating
  // the palette, but the actual dynamic palette owns the surfaces.
  root.removeAttribute('data-appearance');
  root.removeAttribute('data-native-scheme');
  root.style.colorScheme=palette.mode;

  root.style.setProperty('--bg',palette.bg);
  root.style.setProperty('--panel',palette.panel);
  root.style.setProperty('--panel-raised',palette.raised);
  root.style.setProperty('--border',palette.border);
  root.style.setProperty('--border-soft',palette.borderSoft);
  root.style.setProperty('--text',palette.text);
  root.style.setProperty('--text-dim',palette.textDim);
  root.style.setProperty('--text-mute',palette.textMute);
  root.style.setProperty('--flow',palette.flow);
  root.style.setProperty('--flow-dim',palette.flowDim);

  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta)meta.setAttribute('content',palette.bg);

  S.v146DynamicThemeState={
    source:source.source,
    label:source.label,
    url:source.url,
    palette
  };

  v146UpdateThemeStatus();
}

function v146DynamicAppearanceMode(){
  // Keep the user's existing Light/Dark preference meaningful in Dynamic mode.
  // If it has never been chosen explicitly, v106 resolves it from the stored
  // fallback theme once and saves the result.
  try{return v106AppearanceMode()==='light'?'light':'dark';}
  catch(_){return 'dark';}
}

function v146UpdateThemeStatus(){
  const el=document.getElementById('v146-dynamic-theme-status');
  if(!el)return;

  const st=S.v146DynamicThemeState||{};
  const enabled=!!S.settings?.dynamicCoverTheme;
  const p=st.palette;

  let text='Theme collections are active.';
  if(enabled){
    if(st.source==='recommended'||st.source==='onthisday'){
      text=`${st.label} · full ${p?.mode||'dynamic'} palette`;
    }else{
      text='No usable cover right now — using your selected theme as fallback.';
    }
  }

  const colors=p
    ? [p.bg,p.panel,p.raised,p.flow,p.text]
    : [];

  el.innerHTML=`<span>${escapeHtml(text)}</span>${colors.length?`<span class="v146-theme-swatches">${colors.map(c=>`<span class="v146-theme-swatch" style="background:${escapeHtml(c)}"></span>`).join('')}</span>`:''}`;
}

async function v146RefreshDynamicTheme(){
  const seq=++V146_DYNAMIC_SEQ;

  if(!S.settings?.dynamicCoverTheme){
    v146RestoreSelectedThemeFallback();
    document.documentElement.dataset.v146ThemeMode='collection';
    return;
  }

  document.documentElement.dataset.v146ThemeMode='dynamic';

  const sources=[];
  const rec=v145RecommendedCoverSource();
  if(rec)sources.push(rec);

  for(const row of v145OnThisDayCoverSources()){
    sources.push({
      source:'onthisday',
      label:row.label,
      url:row.url
    });
  }

  for(const source of sources){
    const accent=await v145ExtractCoverAccent(source.url);
    if(seq!==V146_DYNAMIC_SEQ)return;

    if(accent){
      const palette=v146PaletteFromAccent(accent,v146DynamicAppearanceMode());
      if(palette){
        v146ApplyFullPalette(palette,source);
        return;
      }
    }
  }

  if(seq===V146_DYNAMIC_SEQ)v146RestoreSelectedThemeFallback();
}

function v146ScheduleDynamicTheme(){
  const gate=++V146_DYNAMIC_SEQ;
  Promise.resolve().then(()=>{
    if(gate===V146_DYNAMIC_SEQ)v146RefreshDynamicTheme();
  });
}

// v145's final render/applyTheme wrappers call these variables at runtime.
// Redirect them to the v146 full-theme engine instead of the accent-only engine.
v145ScheduleDynamicCoverAccent=v146ScheduleDynamicTheme;
v145ClearDynamicAccent=function(){
  ++V146_DYNAMIC_SEQ;
  v146RestoreSelectedThemeFallback();
};

// Theme collection selector now includes Dynamic Cover Theme as a mutually
// exclusive mode. The stored static theme is never destroyed.
const v146StaticThemeCollectionSetter=App.setThemeCollection;
App.setThemeCollection=function(kind){
  if(kind==='dynamic'){
    S.settings.dynamicCoverTheme=true;
    document.documentElement.dataset.v146ThemeMode='dynamic';
    persistSettings();
    render();
    v146ScheduleDynamicTheme();
    return;
  }

  if(['mediaflow','platform','fullstyle'].includes(kind)){
    S.settings.dynamicCoverTheme=false;
    ++V146_DYNAMIC_SEQ;
    v146ClearInlineThemeVars();
    document.documentElement.dataset.v146ThemeMode='collection';

    // Restore appearance before handing control back to the existing collection
    // implementation. It may choose a default theme when changing collections.
    try{v132ApplyAppearancePreference();}catch(_){}
    persistSettings();
    return v146StaticThemeCollectionSetter.call(App,kind);
  }

  return v146StaticThemeCollectionSetter.call(App,kind);
};

// Keep the old v145 public toggle harmless/compatible if any stale UI calls it.
App.toggleDynamicCoverTheme=function(){
  App.setThemeCollection(S.settings?.dynamicCoverTheme?'mediaflow':'dynamic');
};

const v146RenderSettingsBase=renderSettings;
renderSettings=function(){
  let out=v146RenderSettingsBase();
  const dynamic=!!S.settings?.dynamicCoverTheme;

  // Remove v145's old accent-only toggle. v146 replaces it with an actual
  // Theme Collection mode.
  out=out.replace(
    /<div class="v145-cover-theme-row">[\s\S]*?aria-label="Toggle dynamic cover theme color"><\/button><\/div>/,
    ''
  );

  const current=S.settings?.theme||'dark';
  const isPlatform=V55_PLATFORM_THEMES.includes(current);
  const isFull=FULL_STYLE_THEMES.includes(current);
  const collection=dynamic?'dynamic':isFull?'fullstyle':isPlatform?'platform':'mediaflow';

  const collectionSelect=`<select onchange="App.setThemeCollection(this.value)">
    <option value="mediaflow" ${collection==='mediaflow'?'selected':''}>MediaFlow Themes</option>
    <option value="platform" ${collection==='platform'?'selected':''}>Platform Themes</option>
    <option value="fullstyle" ${collection==='fullstyle'?'selected':''}>Full Style Themes</option>
    <option value="dynamic" ${collection==='dynamic'?'selected':''}>Dynamic Cover Theme</option>
  </select>`;

  out=out.replace(
    /<select onchange="App\.setThemeCollection\(this\.value\)">[\s\S]*?<\/select>/,
    collectionSelect
  );

  if(dynamic){
    // The visible static theme picker becomes the fallback picker while Dynamic
    // Cover Theme is selected.
    out=out.replace(
      /<label class="field-label">(MediaFlow theme|Platform theme|Full style theme)<\/label>/,
      '<label class="field-label">Fallback theme</label>'
    );

    const note=`<div class="v146-static-fallback-note">Your selected static theme is kept as the fallback. Dynamic Cover Theme uses the recommended title cover first, then On This Day. If neither cover can be used, MediaFlow returns to this fallback automatically.</div>`;
    const panel=`<div class="v146-theme-mode-panel">
      <div class="v146-theme-mode-title"><b>Dynamic Cover Theme</b><span class="v146-theme-mode-badge">Full theme</span></div>
      <small>The cover now controls the whole MediaFlow color system — background, panels, raised surfaces, borders, text and accent — not only the accent color.</small>
      <div id="v146-dynamic-theme-status" class="v146-theme-status"><span>Analyzing cover…</span></div>
    </div>`;

    const needle='<div class="section-label">THEMES & CUSTOMIZATION</div><div class="card" style="margin-bottom:22px">';
    if(out.includes(needle))out=out.replace(needle,needle+panel);

    // Add the fallback explanation immediately after the collection selector's field.
    out=out.replace(
      /(<div class="field"><label class="field-label">Theme collection<\/label>[\s\S]*?<\/div>)/,
      '$1'+note
    );
  }

  return out;
};

// The v145 applyTheme wrapper remains the final selected-theme entry point.
// When Dynamic mode is active it now schedules the v146 full palette via the
// redirected v145ScheduleDynamicCoverAccent binding.

// Refresh settings status after async palette application.
const v146RenderBase=render;
render=function(){
  const result=v146RenderBase.apply(this,arguments);
  if(S.settings?.dynamicCoverTheme)v146ScheduleDynamicTheme();
  else{
    document.documentElement.dataset.v146ThemeMode='collection';
    v146ClearInlineThemeVars();
  }
  return result;
};



/* ============================================================
   MediaFlow v147 — Dynamic Settings version/copyright footer
   ------------------------------------------------------------
   Version is read from <meta name="mediaflow-version"> so future releases
   only need to update normal MediaFlow version metadata.
   Copyright year comes from the user's current system year.
   ============================================================ */

function v147CurrentMediaFlowVersion(){
  const meta=document.querySelector('meta[name="mediaflow-version"]');
  const value=String(meta?.getAttribute('content')||'').trim();
  return value||'147';
}

function v147SettingsFooterHtml(){
  const version=v147CurrentMediaFlowVersion();
  const year=new Date().getFullYear();

  return `<footer class="v147-settings-footer" aria-label="MediaFlow version information">
    <div class="v147-settings-footer-brand">MediaFlow v${escapeHtml(version)}</div>
    <div class="v147-settings-footer-meta">by <b>Alex Godly</b> · © ${year} Alex Godly</div>
  </footer>`;
}

const v147RenderSettingsBase=renderSettings;
renderSettings=function(){
  const html=v147RenderSettingsBase();
  return html+v147SettingsFooterHtml();
};



/* ============================================================
   MediaFlow v148 — Complete-data Backup Audit + Full Restore
   ------------------------------------------------------------
   Audit result for v147:
   snapshot() already covered the large account state through its wrapper chain:
   categories/order, Library (including cover/rating/date metadata), History,
   Settings, task/session, profile picture/name, stopwatch, MAL link, XP ledgers,
   completion timeline, Library History/migrations and Personal Order.

   The persistent Rating Queue lived separately in localStorage and therefore was
   NOT inside v147's JSON backup. Device UI preferences such as sidebar width
   were also outside the backup. v148 makes the full backup explicitly include
   those portable extras and adds stricter validation/runtime restoration.

   Transient unsaved UI (open modal, in-progress form drafts, current filter page,
   undo/redo stacks) is intentionally not portable app data.
   ============================================================ */

function v148CurrentVersion(){
  const meta=document.querySelector('meta[name="mediaflow-version"]');
  return Number(meta?.getAttribute('content'))||148;
}

function v148SafeClone(value,fallback=null){
  try{return JSON.parse(JSON.stringify(value));}
  catch(_){return fallback;}
}

function v148PortableRatingQueue(){
  try{
    v125LoadRatingQueue();
    v123SyncRatingQueue();
    return V123_RATING_QUEUE.map(String).filter(Boolean);
  }catch(_){
    return [];
  }
}

function v148PortableSidebarWidth(){
  try{
    const value=Number(localStorage.getItem(SIDEBAR_WIDTH_KEY));
    return Number.isFinite(value)&&value>0?value:null;
  }catch(_){
    return null;
  }
}

function v148BackupManifest(state,extras){
  const ledger=state?.xpLedger||{};
  const order=state?.orderPlan||{};
  return {
    schemaVersion:2,
    completeAccountState:true,
    counts:{
      categories:Array.isArray(state?.categories)?state.categories.length:0,
      libraryTitles:Array.isArray(state?.library)?state.library.length:0,
      historyLogs:Array.isArray(state?.sessions)?state.sessions.length:0,
      libraryHistory:Array.isArray(state?.activityLog)?state.activityLog.length:0,
      completionTimeline:Array.isArray(state?.completionTimeline)?state.completionTimeline.length:0,
      personalOrderTitles:Array.isArray(order?.titleIds)?order.titleIds.length:0,
      ratingQueue:Array.isArray(extras?.ratingQueue)?extras.ratingQueue.length:0,
      xpRatingRewards:Object.keys(ledger?.ratings||{}).length
    },
    includes:{
      categories:true,
      categoryOrder:true,
      library:true,
      history:true,
      settings:true,
      currentTask:true,
      activeSession:true,
      profileName:true,
      profilePicture:true,
      stopwatch:true,
      malLink:true,
      xpLedgers:true,
      completionTimeline:true,
      libraryHistory:true,
      migrations:true,
      personalOrder:true,
      personalOrderRecovery:true,
      customCategoryIcons:true,
      customCategoryColors:true,
      dynamicThemeSettings:true,
      ratingQueue:true,
      portableUiPreferences:true
    },
    note:'Browser-granted filesystem folder handles and authentication credentials are intentionally not portable JSON data.'
  };
}

function v148BuildFullBackup(){
  // snapshot() is the canonical MediaFlow account state and already includes all
  // late-version wrappers (profileName, activityLog, orderPlan, settings, etc.).
  const state=v148SafeClone(snapshot(),{})||{};

  // Be explicit about modern fields so future refactors cannot silently omit them.
  state.profileName=String(S.profileName||'').trim();
  state.profilePicture=String(S.profilePicture||'').trim();
  state.activityLog=v148SafeClone(Array.isArray(S.activityLog)?S.activityLog:[],[]);
  state.migrations=v148SafeClone(S.migrations||{}, {});
  state.orderPlan=v148SafeClone(v138NormalizeOrderPlan(S.orderPlan,S.library,S.categories),{});
  state.completionTimeline=v148SafeClone(Array.isArray(S.completionTimeline)?S.completionTimeline:[],[]);
  state.xpLedger=v148SafeClone(S.xpLedger||{libraryAdditions:{}},{libraryAdditions:{}});
  state.stopwatch=v148SafeClone(S.stopwatch||{running:false,startedAt:0,elapsed:0,resetValue:0},{running:false,startedAt:0,elapsed:0,resetValue:0});
  state.malLink=v148SafeClone(S.malLink||{username:'',mode:'anime'},{username:'',mode:'anime'});
  state.settings=v148SafeClone(S.settings||DEFAULT_SETTINGS,{});
  state.categoryOrder=v74SyncCategoryOrder().slice();

  const extras={
    ratingQueue:v148PortableRatingQueue(),
    uiPreferences:{
      sidebarWidth:v148PortableSidebarWidth(),
      statsRecapMonth:String(S.statsRecapMonth||''),
      statsHeatmapYear:String(S.statsHeatmapYear||'')
    }
  };

  const now=new Date();
  return Object.assign({},state,{
    backupFormat:'MediaFlow_Full_Backup',
    backupSchemaVersion:2,
    backupVersion:v148CurrentVersion(),
    mediaFlowVersion:v148CurrentVersion(),
    exportedAt:now.toISOString(),
    portableExtras:extras,
    backupManifest:v148BackupManifest(state,extras),
    progression:mediaFlowLevelInfo(),
    progressionBreakdown:v120XPBreakdown()
  });
}

function v148ValidateBackup(data){
  if(!data||typeof data!=='object'||Array.isArray(data)){
    return {ok:false,message:'The selected file is not a MediaFlow backup object.'};
  }

  const format=String(data.backupFormat||'');
  const hasCore=
    Array.isArray(data.categories) &&
    Array.isArray(data.library) &&
    Array.isArray(data.sessions) &&
    data.settings && typeof data.settings==='object';

  // Modern full backup.
  if(format==='MediaFlow_Full_Backup'){
    if(!hasCore){
      return {ok:false,message:'This MediaFlow full backup is incomplete or corrupted.'};
    }
    return {ok:true,legacy:false};
  }

  // Backward compatibility for older MediaFlow JSON backups that predate the
  // backupFormat marker but still contain the canonical core account state.
  if(hasCore){
    return {ok:true,legacy:true};
  }

  return {
    ok:false,
    message:'This JSON does not contain the required MediaFlow categories, Library, History and Settings data.'
  };
}

function v148RestorePortableExtras(data){
  const extras=data?.portableExtras&&typeof data.portableExtras==='object'
    ? data.portableExtras
    : {};

  // v148 Rating Queue portability. v147 and older backups simply rebuild the
  // queue from unrated Library titles because the field did not exist.
  if(Array.isArray(extras.ratingQueue)){
    V123_RATING_QUEUE=extras.ratingQueue.map(String).filter(Boolean);
    V125_RATING_QUEUE_LOADED=true;
    try{v125SaveRatingQueue();}catch(_){}
    try{v123SyncRatingQueue();}catch(_){}
  }else{
    // Do not keep a stale queue from the pre-import Library.
    V123_RATING_QUEUE=[];
    V125_RATING_QUEUE_LOADED=true;
    try{v125SaveRatingQueue();v123SyncRatingQueue();}catch(_){}
  }

  const ui=extras.uiPreferences&&typeof extras.uiPreferences==='object'
    ? extras.uiPreferences
    : {};

  const width=Number(ui.sidebarWidth);
  if(Number.isFinite(width)&&width>0){
    try{
      localStorage.setItem(SIDEBAR_WIDTH_KEY,String(width));
      applySidebarWidth(width);
    }catch(_){}
  }

  if(Object.prototype.hasOwnProperty.call(ui,'statsRecapMonth')){
    S.statsRecapMonth=String(ui.statsRecapMonth||'');
  }
  if(Object.prototype.hasOwnProperty.call(ui,'statsHeatmapYear')){
    S.statsHeatmapYear=String(ui.statsHeatmapYear||'');
  }

  // Keep the fast local theme cache aligned with imported Settings.
  try{localStorage.setItem('mf_theme',String(S.settings?.theme||'dark'));}catch(_){}
}

function v148FinalizeImportedRuntime(){
  // Full backups replace the profile picture too, including intentionally empty.
  // v46's legacy fallback kept the pre-import picture when the imported value
  // was empty, so v148 explicitly honors the backup value.
  try{applyTheme(S.settings?.theme||'dark');}catch(_){}

  try{
    clearInterval(window.__sw);
    window.__sw=null;
    if(S.stopwatch?.running)window.__sw=setInterval(stopwatchTick,250);
  }catch(_){}

  try{restartBackupTimer();}catch(_){}
  try{v53InvalidateLibraryCache();}catch(_){}
  try{v53InvalidateSessionCache();}catch(_){}
}

function v148ImportSummary(){
  const orderCount=Array.isArray(S.orderPlan?.titleIds)?S.orderPlan.titleIds.length:0;
  const queueCount=Array.isArray(V123_RATING_QUEUE)?V123_RATING_QUEUE.length:0;
  return `${(S.library||[]).length.toLocaleString()} titles · ${(S.sessions||[]).length.toLocaleString()} logs · ${(S.activityLog||[]).length.toLocaleString()} Library History · ${orderCount.toLocaleString()} ordered · ${queueCount.toLocaleString()} rating queue`;
}

// FINAL full export used at runtime.
App.exportJSON=function(){
  showDataProgress('Exporting complete MediaFlow backup','Auditing and packing all persistent MediaFlow data…',8);

  setTimeout(()=>{
    try{
      const payload=v148BuildFullBackup();
      const now=new Date(payload.exportedAt);
      const pad=n=>String(n).padStart(2,'0');
      const stamp=`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

      updateDataProgress(55,'Packing Library, History, progression, Order, themes and local queues…');
      const json=JSON.stringify(payload,null,2);
      const blob=new Blob([json],{type:'application/json'});

      updateDataProgress(88,'Creating complete backup download…');
      triggerDownload(blob,`MediaFlow_Backup_${stamp}.json`);

      const c=payload.backupManifest?.counts||{};
      finishDataProgress(
        true,
        'Export successful',
        `Complete v${payload.mediaFlowVersion} backup · ${(c.libraryTitles||0).toLocaleString()} titles · ${(c.historyLogs||0).toLocaleString()} logs · ${(c.personalOrderTitles||0).toLocaleString()} ordered · ${(c.ratingQueue||0).toLocaleString()} rating queue`
      );
    }catch(e){
      console.error(e);
      finishDataProgress(false,'Export failed','MediaFlow could not create the complete backup file.');
    }
  },40);
};

// FINAL full import used at runtime.
App.importJSON=function(file){
  if(!file)return;

  showDataProgress('Importing complete MediaFlow backup','Reading and validating backup file…',5);

  const reader=new FileReader();
  reader.onprogress=e=>{
    if(e.lengthComputable){
      updateDataProgress(
        Math.min(22,5+Math.round((e.loaded/e.total)*17)),
        'Reading backup…'
      );
    }
  };

  reader.onload=async()=>{
    try{
      const data=JSON.parse(reader.result);
      const validation=v148ValidateBackup(data);
      if(!validation.ok){
        finishDataProgress(false,'Import rejected',validation.message);
        return;
      }

      updateDataProgress(26,'Restoring complete account state…');

      // Existing wrapper chain restores all modern account fields:
      // v120 Library History/profile, v121 nested repeat settings, v138 Order.
      v46ApplyState(data);

      // Honor exact full-backup replacement semantics for fields whose older
      // apply code intentionally used non-empty fallbacks.
      if(Object.prototype.hasOwnProperty.call(data,'profilePicture')){
        S.profilePicture=String(data.profilePicture||'').trim();
      }
      if(Object.prototype.hasOwnProperty.call(data,'profileName')){
        S.profileName=String(data.profileName||'').trim();
      }

      v148RestorePortableExtras(data);

      updateDataProgress(42,'Checking restored progression and completion data…');
      const info=await v46RecalculateXP(false);

      updateDataProgress(66,'Refreshing scheduler and runtime state…');
      await v46RefreshSchedulerProgress();
      v148FinalizeImportedRuntime();

      updateDataProgress(84,'Saving restored complete state to protected cloud storage…');
      await saveState();
      await saveQueue;

      render();

      finishDataProgress(
        true,
        validation.legacy?'Legacy backup imported':'Import successful',
        `${v148ImportSummary()} · Level ${info.level} · ${info.xp.toLocaleString()} XP`
      );
    }catch(e){
      console.error(e);
      finishDataProgress(
        false,
        'Import failed',
        'Could not restore that MediaFlow JSON backup. The file may be invalid or corrupted.'
      );
    }
  };

  reader.onerror=()=>finishDataProgress(false,'Import failed','The file could not be read.');
  reader.readAsText(file);
};

// Explain exactly what Full Backup now means in Settings without adding another
// exporter or import path.
const v148RenderSettingsBase=renderSettings;
renderSettings=function(){
  let out=v148RenderSettingsBase();
  const note=`<div class="v148-backup-note"><b>Full Backup:</b> exports/restores all persistent MediaFlow account data — categories, Library metadata/covers/dates, consumption History, Settings/themes, XP ledgers, completion timeline, Library History, profile data, stopwatch, MAL link, Personal Order + recovery state and the saved Rating Queue. Browser authentication and filesystem folder permissions are not portable JSON data.</div>`;

  const exportButton='<button class="btn" onclick="App.exportJSON()">Export JSON backup</button>';
  if(out.includes(exportButton))out=out.replace(exportButton,exportButton+note);
  return out;
};



/* ============================================================
   MediaFlow v149 — Day-Streak XP Multiplier
   ------------------------------------------------------------
   Rules:
   - streaks are built from genuine, non-skipped History activity days;
   - every History/log XP gain on that day is multiplied by that day's streak;
   - repeat XP is inside the session XP and is multiplied too;
   - logged-completion bonus XP also receives the streak multiplier;
   - Library maintenance / rating rewards remain their configured fixed rewards;
   - the multiplier grows continuously with streak length:
       1 + 0.10 * log2(streak)
     Day 1 = 1.00x, Day 2 = 1.10x, Day 7 ≈ 1.28x,
     Day 30 ≈ 1.49x, Day 100 ≈ 1.66x.
   ============================================================ */

const V149_STREAK_XP_VERSION=1;
let V149_STREAK_DIRTY=true;
let V149_STREAK_MAP=new Map();

function v149DateKeyFromSession(s){
  const raw=String(s?.date||'').trim();
  if(/^\d{4}-\d{2}-\d{2}$/.test(raw))return raw;
  const ts=Number(s?.timestamp)||0;
  if(ts>0){
    const d=new Date(ts);
    if(!Number.isNaN(d.getTime()))return d.toISOString().slice(0,10);
  }
  return '';
}

function v149ShiftDateKey(key,delta){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(key||'')))return '';
  const d=new Date(`${key}T12:00:00Z`);
  if(Number.isNaN(d.getTime()))return '';
  d.setUTCDate(d.getUTCDate()+Number(delta||0));
  return d.toISOString().slice(0,10);
}

function v149BuildStreakMap(sessions){
  const days=new Set();
  for(const s of (Array.isArray(sessions)?sessions:[])){
    if(!s||s.status==='skipped')continue;
    const key=v149DateKeyFromSession(s);
    if(key)days.add(key);
  }

  const map=new Map();
  for(const key of [...days].sort()){
    const prev=v149ShiftDateKey(key,-1);
    map.set(key,(map.get(prev)||0)+1);
  }
  return map;
}

function v149MarkStreakDirty(){
  V149_STREAK_DIRTY=true;
}

function v149StreakMultiplier(streak){
  if(levelingSettings().enabled===false)return 1;
  const n=Math.max(0,Math.floor(Number(streak)||0));
  if(n<=1)return 1;
  return Math.round((1+0.10*Math.log2(n))*100)/100;
}

const v149SessionStoredXPBase=sessionStoredXP;

function v149AnnotateSessionStreakXP(){
  V149_STREAK_MAP=v149BuildStreakMap(S.sessions||[]);

  for(const s of (S.sessions||[])){
    if(!s||typeof s!=='object')continue;

    if(s.status==='skipped'){
      s.streakAtLog=0;
      s.streakMultiplier=1;
      s.streakBaseXP=0;
      s.streakBonusXP=0;
      s.xpWithStreak=0;
      s.streakXPVersion=V149_STREAK_XP_VERSION;
      continue;
    }

    const key=v149DateKeyFromSession(s);
    const streak=key?(V149_STREAK_MAP.get(key)||1):1;
    const multiplier=v149StreakMultiplier(streak);
    const raw=Math.max(0,Math.round(Number(v149SessionStoredXPBase(s))||0));
    const total=Math.max(0,Math.round(raw*multiplier));

    s.streakAtLog=streak;
    s.streakMultiplier=multiplier;
    s.streakBaseXP=raw;
    s.streakBonusXP=Math.max(0,total-raw);
    s.xpWithStreak=total;
    s.streakXPVersion=V149_STREAK_XP_VERSION;
  }

  V149_STREAK_DIRTY=false;
  return V149_STREAK_MAP;
}

function v149EnsureStreakXP(){
  if(V149_STREAK_DIRTY)v149AnnotateSessionStreakXP();
  return V149_STREAK_MAP;
}

function v149StreakForDateKey(key){
  const map=v149EnsureStreakXP();
  return map.get(String(key||''))||0;
}

function v149ProspectiveTodayStreak(){
  const map=v149EnsureStreakXP();
  const today=todayISO();
  if(map.has(today))return map.get(today)||1;
  const yesterday=v149ShiftDateKey(today,-1);
  return (map.get(yesterday)||0)+1;
}

function v149SessionStreakLabel(s){
  v149EnsureStreakXP();
  const streak=Math.max(0,Number(s?.streakAtLog)||0);
  const mult=Math.max(1,Number(s?.streakMultiplier)||1);
  return `${streak}d ×${mult.toFixed(2)}`;
}

// Final History XP source of truth: base History XP + streak multiplier.
// The stored s.xp remains the pre-streak amount so old backups and existing
// repeat-XP reconstruction continue to work without double multiplication.
sessionStoredXP=function(s){
  if(!s||s.status==='skipped')return 0;
  v149EnsureStreakXP();
  if(Number.isFinite(Number(s.xpWithStreak)))return Math.max(0,Number(s.xpWithStreak));
  return Math.max(0,Number(v149SessionStoredXPBase(s))||0);
};

// Existing sidebar streak now shares the exact same historical day engine.
computeDayStreak=function(){
  return v149StreakForDateKey(todayISO());
};

// The log form previews the XP that will actually be worth after today's
// prospective streak is included.
const v149EstimateCurrentLogXPBase=estimateCurrentLogXP;
estimateCurrentLogXP=function(){
  const base=v149EstimateCurrentLogXPBase();
  const streak=v149ProspectiveTodayStreak();
  const streakMultiplier=v149StreakMultiplier(streak);
  return Object.assign({},base,{
    preStreakXP:Math.max(0,Number(base.xp)||0),
    streak,
    streakMultiplier,xp:Math.max(0,Math.round((Number(base.xp)||0)*streakMultiplier))
  });
};

function v149SessionRawXPTotal(sessions){
  return (Array.isArray(sessions)?sessions:[]).reduce((sum,s)=>{
    if(!s||s.status==='skipped')return sum;
    const stored=Number(s.xp);
    if(Number.isFinite(stored)&&stored>0)return sum+Math.max(0,stored);
    const cat=getCategory(s.categoryId);
    return sum+Math.max(0,Number(calculateConsumptionXP(
      cat,
      Number(s.actualAmount)||0,
      Number(s.minutes)||0,
      s.healthStatus||'healthy'
    ).xp)||0);
  },0);
}

function v149SessionStreakBonusForState(state){
  const sessions=Array.isArray(state?.sessions)?state.sessions:[];
  const map=v149BuildStreakMap(sessions);
  let bonus=0;

  for(const s of sessions){
    if(!s||s.status==='skipped')continue;
    const stored=Number(s.xp);
    let raw=0;
    if(Number.isFinite(stored)&&stored>0)raw=Math.max(0,stored);
    else{
      const cat=getCategory(s.categoryId);
      raw=Math.max(0,Number(calculateConsumptionXP(
        cat,
        Number(s.actualAmount)||0,
        Number(s.minutes)||0,
        s.healthStatus||'healthy'
      ).xp)||0);
    }

    const streak=map.get(v149DateKeyFromSession(s))||1;
    const total=Math.max(0,Math.round(raw*v149StreakMultiplier(streak)));
    bonus+=Math.max(0,total-raw);
  }

  return Math.round(bonus);
}

function v149CompletionDateKeyForState(item,state){
  const ts=Number(item?.completedAt)||0;
  if(ts>0){
    const d=new Date(ts);
    if(!Number.isNaN(d.getTime()))return d.toISOString().slice(0,10);
  }

  const id=String(item?.id||'');
  if(!id)return '';

  let best='';
  let bestTs=0;
  for(const s of (state?.sessions||[])){
    if(!s||s.status==='skipped')continue;
    if(!(s.titles||[]).some(t=>String(t?.libraryId||'')===id))continue;
    const st=Number(s.timestamp)||0;
    if(st>=bestTs){
      bestTs=st;
      best=v149DateKeyFromSession(s);
    }
  }
  return best;
}

function v149LoggedCompletionStreakBonusForState(state){
  const ledger=state?.xpLedger?.logCompletions||{};
  const library=Array.isArray(state?.library)?state.library:[];
  const map=v149BuildStreakMap(state?.sessions||[]);
  const byId=new Map(library.filter(i=>i?.id).map(i=>[String(i.id),i]));
  let bonus=0;

  for(const [id,value] of Object.entries(ledger)){
    const raw=Math.max(0,Number(value)||0);
    if(raw<=0)continue;
    const item=byId.get(String(id));
    if(!item)continue;
    const key=v149CompletionDateKeyForState(item,state);
    const streak=map.get(key)||0;
    const mult=v149StreakMultiplier(streak);
    bonus+=Math.max(0,Math.round(raw*mult)-raw);
  }

  return Math.round(bonus);
}

function v149LoggedCompletionStreakBonus(){
  return v149LoggedCompletionStreakBonusForState({
    sessions:S.sessions||[],
    library:S.library||[],
    xpLedger:S.xpLedger||{}
  });
}

// Logged-completion bonus is XP earned through a genuine consumption log, so it
// participates in the same day-streak multiplier.
const v149LibraryXPTotalBase=libraryXPTotal;
libraryXPTotal=function(){
  return v149LibraryXPTotalBase()+v149LoggedCompletionStreakBonus();
};

// Keep Library History before/after XP deltas accurate with the new multiplier.
const v149SnapshotXPBase=v50SnapshotXP;
v50SnapshotXP=function(x){
  const base=v149SnapshotXPBase(x);
  if(base==null)return base;
  return base
    +v149SessionStreakBonusForState(x||{})
    +v149LoggedCompletionStreakBonusForState(x||{});
};

// Progression breakdown/export now describes the streak contribution explicitly.
const v149XPBreakdownBase=v120XPBreakdown;
v120XPBreakdown=function(){
  const b=v149XPBreakdownBase();
  const rawHistoryXP=Math.round(v149SessionRawXPTotal(S.sessions||[]));
  const streakedHistoryXP=Math.round((S.sessions||[]).reduce((a,s)=>a+sessionStoredXP(s),0));
  const sessionStreakBonusXP=Math.max(0,streakedHistoryXP-rawHistoryXP);
  const loggedCompletionStreakBonusXP=v149LoggedCompletionStreakBonus();
  const streakBonusXP=sessionStreakBonusXP+loggedCompletionStreakBonusXP;

  return Object.assign({},b,{
    total:(Number(b.total)||0)+loggedCompletionStreakBonusXP,
    historyXP:streakedHistoryXP,
    preStreakHistoryXP:rawHistoryXP,
    sessionStreakBonusXP,
    loggedCompletionStreakBonusXP,
    streakBonusXP,
    currentDayStreak:computeDayStreak(),
    currentStreakMultiplier:v149StreakMultiplier(computeDayStreak()),
    prospectiveTodayStreak:v149ProspectiveTodayStreak(),
    prospectiveTodayMultiplier:v149StreakMultiplier(v149ProspectiveTodayStreak()),
    streakXPFormulaVersion:V149_STREAK_XP_VERSION
  });
};

// Mark streak annotations dirty whenever History can change.
const v149PersistSessionsBase=persistSessions;
persistSessions=function(){
  v149MarkStreakDirty();
  return v149PersistSessionsBase.apply(this,arguments);
};

const v149MfCommitBase=mfCommit;
mfCommit=function(){
  v149MarkStreakDirty();
  return v149MfCommitBase.apply(this,arguments);
};

const v149RestoreCoreBase=mfRestoreCore;
mfRestoreCore=function(){
  const result=v149RestoreCoreBase.apply(this,arguments);
  v149MarkStreakDirty();
  return result;
};

const v149ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v149ApplyStateBase.apply(this,arguments);
  v149MarkStreakDirty();
  return result;
};

// v134 is the final optimized progression repair engine. Mark the streak cache
// dirty before it rewrites base/repeat session XP so its final mediaFlowLevelInfo()
// uses freshly rebuilt streak totals.
const v149RecalculateXPOptimizedBase=v134RecalculateXPOptimized;
v134RecalculateXPOptimized=async function(){
  v149MarkStreakDirty();
  const result=await v149RecalculateXPOptimizedBase.apply(this,arguments);
  v149MarkStreakDirty();
  v149EnsureStreakXP();
  return mediaFlowLevelInfo();
};
v46RecalculateXP=v134RecalculateXPOptimized;

// v149 Settings panel.
const v149RenderSettingsBase=renderSettings;
renderSettings=function(){
  v149EnsureStreakXP();
  let h=v149RenderSettingsBase();

  const current=computeDayStreak();
  const prospective=v149ProspectiveTodayStreak();
  const currentMult=v149StreakMultiplier(current);
  const nextMult=v149StreakMultiplier(prospective);
  const b=v120XPBreakdown();

  const marker='<div style="font-weight:700;font-size:12px;margin:14px 0 8px;">ROTATION XP MULTIPLIERS</div>';
  const card=`<div style="font-weight:700;font-size:12px;margin:14px 0 8px;">DAY-STREAK XP</div>
    <div class="v149-streak-xp-card">
      <div class="v149-streak-xp-head">
        <div><b>Higher streak → higher daily log XP</b><div class="hint" style="margin-top:3px">Your genuine non-skipped History days build the multiplier.</div></div>
        <div class="v149-streak-xp-mult">×${(current>0?currentMult:nextMult).toFixed(2)}</div>
      </div>
      <div class="v149-streak-xp-grid">
        <div><b>${current.toLocaleString()} day${current===1?'':'s'}</b><small>current streak</small></div>
        <div><b>${prospective.toLocaleString()} day${prospective===1?'':'s'} · ×${nextMult.toFixed(2)}</b><small>your next log today</small></div>
        <div><b>+${Math.round(b.streakBonusXP||0).toLocaleString()} XP</b><small>lifetime streak bonus</small></div>
      </div>
      <div class="v149-streak-xp-note">Formula: <b>1 + 0.10 × log₂(streak)</b>. Day 1 = ×1.00, Day 2 = ×1.10, Day 7 ≈ ×1.28, Day 30 ≈ ×1.49. The multiplier applies to consumption/History XP, repeat XP and logged-completion bonus XP. Fixed Library maintenance and Rating XP keep their configured values.</div>
    </div>`;

  if(h.includes(marker) && !h.includes('DAY-STREAK XP')){
    h=h.replace(marker,card+marker);
  }

  h=h.replace('Full Backup:','Full Backup:');
  h=h.replace(
    'XP ledgers, completion timeline, Library History, profile data, stopwatch, MAL link, Personal Order + recovery state and the saved Rating Queue.',
    'XP ledgers, day-streak XP metadata, completion timeline, Library History, profile data, stopwatch, MAL link, Personal Order + recovery state and the saved Rating Queue.'
  );

  return h;
};

// ------------------------------------------------------------
// v149 Full Backup / Import compatibility audit
// ------------------------------------------------------------

const v149BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v149BackupManifestBase(state,extras);
  manifest.schemaVersion=3;
  manifest.includes=Object.assign({},manifest.includes||{},{
    streakXP:true,
    streakSessionMetadata:true
  });

  const sessions=Array.isArray(state?.sessions)?state.sessions:[];
  const streakMap=v149BuildStreakMap(sessions);
  const maxStreak=streakMap.size?Math.max(...streakMap.values()):0;
  manifest.counts=Object.assign({},manifest.counts||{},{
    activeStreakDays:streakMap.size,
    longestReconstructedStreak:maxStreak
  });

  manifest.note='Complete MediaFlow v149 backup. Day-streak XP is reconstructable from History dates and also exports per-session streak metadata. Browser authentication credentials and filesystem permission handles are intentionally non-portable.';
  return manifest;
};

const v149BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  // Ensure exported sessions contain current streak/multiplier/bonus metadata.
  v149MarkStreakDirty();
  v149EnsureStreakXP();

  const payload=v149BuildFullBackupBase();
  payload.backupSchemaVersion=3;
  payload.backupVersion=v148CurrentVersion();
  payload.mediaFlowVersion=v148CurrentVersion();
  payload.streakXP={
    version:V149_STREAK_XP_VERSION,
    formula:'1 + 0.10 * log2(streak)',
    appliesTo:[
      'consumption History XP',
      'repeat XP',
      'logged-completion bonus XP'
    ],
    breakdown:v120XPBreakdown()
  };
  payload.backupManifest=v148BackupManifest(payload,payload.portableExtras||{});
  return payload;
};

// v148 import already validates the canonical state, applies it through the full
// state wrapper chain and calls v46RecalculateXP(). Because v149 redirects that
// recalculation engine above, v148/v149/older backups automatically reconstruct
// streak XP from imported History. No separate fragile import path is needed.



/* ============================================================
   MediaFlow v150 — v149 Streak XP Performance Fix
   ------------------------------------------------------------
   Root causes fixed:
   1) mediaFlowXP() still reduced the full History on every level read/render;
   2) v149 logged-completion streak bonus rebuilt maps repeatedly;
   3) completion-date fallback could scan all History once per completion
      (O(completions × history));
   4) the XP breakdown repeated several full History scans.

   v150 builds one shared live XP/streak cache after relevant data changes.
   Normal renders now read totals in O(1). Library History before/after snapshots
   use a single linear indexed scan instead of nested History scans.
   ============================================================ */

let V150_XP_CACHE_DIRTY=true;
let V150_XP_CACHE={
  historyXP:0,
  rawHistoryXP:0,
  sessionStreakBonusXP:0,
  loggedCompletionStreakBonusXP:0,
  fixedLibraryXP:0,
  totalXP:0,
  completedTitles:0,
  libraryTitleXP:0,
  completedTitleXP:0,
  libraryEditXP:0,
  manualCoverXP:0,
  loggedCompletionBonusXP:0,
  ratingXP:0,
  ratingRewards:0
};

function v150LedgerSum(ledger,name){
  return Object.values(ledger?.[name]||{}).reduce((a,v)=>a+(Number(v)||0),0);
}

function v150BaseSessionXP(s){
  if(!s||s.status==='skipped')return 0;
  const stored=Number(s.xp);
  if(Number.isFinite(stored)&&stored>0)return Math.max(0,stored);
  if((Number(s.actualAmount)||0)>0&&(Number(s.minutes)||0)>0){
    const cat=getCategory(s.categoryId);
    return Math.max(0,Number(calculateConsumptionXP(
      cat,
      Number(s.actualAmount)||0,
      Number(s.minutes)||0,
      s.healthStatus||'healthy'
    ).xp)||0);
  }
  return 0;
}

function v150CompletionDateKey(item,latestSessionDateByLibraryId){
  const ts=Number(item?.completedAt)||0;
  if(ts>0){
    const d=new Date(ts);
    if(!Number.isNaN(d.getTime()))return d.toISOString().slice(0,10);
  }
  return latestSessionDateByLibraryId.get(String(item?.id||''))?.key||'';
}

function v150ComputeStateMetrics(state,mutateSessions=false){
  const sessions=Array.isArray(state?.sessions)?state.sessions:[];
  const library=Array.isArray(state?.library)?state.library:[];
  const ledger=state?.xpLedger||{};
  const streakMap=v149BuildStreakMap(sessions);
  const latestSessionDateByLibraryId=new Map();

  let rawHistoryXP=0;
  let historyXP=0;

  for(const s of sessions){
    if(!s||s.status==='skipped'){
      if(mutateSessions&&s){
        s.streakAtLog=0;
        s.streakMultiplier=1;
        s.streakBaseXP=0;
        s.streakBonusXP=0;
        s.xpWithStreak=0;
        s.streakXPVersion=V149_STREAK_XP_VERSION;
      }
      continue;
    }

    const key=v149DateKeyFromSession(s);
    const streak=key?(streakMap.get(key)||1):1;
    const multiplier=v149StreakMultiplier(streak);
    const raw=Math.max(0,Math.round(v150BaseSessionXP(s)));
    const total=Math.max(0,Math.round(raw*multiplier));

    rawHistoryXP+=raw;
    historyXP+=total;

    if(mutateSessions){
      s.streakAtLog=streak;
      s.streakMultiplier=multiplier;
      s.streakBaseXP=raw;
      s.streakBonusXP=Math.max(0,total-raw);
      s.xpWithStreak=total;
      s.streakXPVersion=V149_STREAK_XP_VERSION;
    }

    const ts=Number(s.timestamp)||0;
    for(const t of (s.titles||[])){
      const id=String(t?.libraryId||'');
      if(!id)continue;
      const prev=latestSessionDateByLibraryId.get(id);
      if(!prev||ts>=prev.ts){
        latestSessionDateByLibraryId.set(id,{ts,key});
      }
    }
  }

  const completionLedger=ledger?.logCompletions||{};
  const completionIds=new Set(Object.keys(completionLedger));
  const libraryByCompletionId=new Map();
  let completedTitles=0;

  for(const item of library){
    if(v120IsCompleted(item))completedTitles++;
    const id=String(item?.id||'');
    if(id&&completionIds.has(id))libraryByCompletionId.set(id,item);
  }

  let loggedCompletionStreakBonusXP=0;
  for(const [id,value] of Object.entries(completionLedger)){
    const raw=Math.max(0,Number(value)||0);
    if(raw<=0)continue;
    const item=libraryByCompletionId.get(String(id));
    if(!item)continue;

    const key=v150CompletionDateKey(item,latestSessionDateByLibraryId);
    const streak=streakMap.get(key)||0;
    const total=Math.max(0,Math.round(raw*v149StreakMultiplier(streak)));
    loggedCompletionStreakBonusXP+=Math.max(0,total-raw);
  }

  const l=levelingSettings();
  const enabled=l.enabled!==false;
  const libraryTitleXP=enabled
    ? library.length*Math.max(0,Math.round(Number(l.libraryAdditionXP)||0))
    : 0;
  const completedTitleXP=enabled
    ? completedTitles*Math.max(0,Math.round(Number(l.completionXP)||0))
    : 0;

  const libraryEditXP=v150LedgerSum(ledger,'libraryEdits');
  const manualCoverXP=v150LedgerSum(ledger,'manualCovers');
  const loggedCompletionBonusXP=v150LedgerSum(ledger,'logCompletions');
  const ratingXP=v150LedgerSum(ledger,'ratings');
  const ratingRewards=Object.keys(ledger?.ratings||{}).length;

  const fixedLibraryXP=
    libraryTitleXP+
    completedTitleXP+
    libraryEditXP+
    manualCoverXP+
    loggedCompletionBonusXP+
    ratingXP;

  return {
    streakMap,
    rawHistoryXP:Math.round(rawHistoryXP),
    historyXP:Math.round(historyXP),
    sessionStreakBonusXP:Math.max(0,Math.round(historyXP-rawHistoryXP)),
    loggedCompletionStreakBonusXP:Math.round(loggedCompletionStreakBonusXP),
    fixedLibraryXP:Math.round(fixedLibraryXP),
    totalXP:Math.round(historyXP+fixedLibraryXP+loggedCompletionStreakBonusXP),
    completedTitles,
    libraryTitleXP:Math.round(libraryTitleXP),
    completedTitleXP:Math.round(completedTitleXP),
    libraryEditXP:Math.round(libraryEditXP),
    manualCoverXP:Math.round(manualCoverXP),
    loggedCompletionBonusXP:Math.round(loggedCompletionBonusXP),
    ratingXP:Math.round(ratingXP),
    ratingRewards
  };
}

function v150BuildLiveXPCache(){
  const metrics=v150ComputeStateMetrics({
    sessions:S.sessions||[],
    library:S.library||[],
    xpLedger:S.xpLedger||{}
  },true);

  V149_STREAK_MAP=metrics.streakMap;
  V149_STREAK_DIRTY=false;
  V150_XP_CACHE=metrics;
  V150_XP_CACHE_DIRTY=false;
  return V150_XP_CACHE;
}

function v150EnsureLiveXPCache(){
  if(V150_XP_CACHE_DIRTY||V149_STREAK_DIRTY)return v150BuildLiveXPCache();
  return V150_XP_CACHE;
}

// All existing v149 dirty paths call this binding at runtime.
v149MarkStreakDirty=function(){
  V149_STREAK_DIRTY=true;
  V150_XP_CACHE_DIRTY=true;
};

// Reuse the same single pass for streak annotations and aggregates.
v149AnnotateSessionStreakXP=function(){
  v150BuildLiveXPCache();
  return V149_STREAK_MAP;
};
v149EnsureStreakXP=function(){
  v150EnsureLiveXPCache();
  return V149_STREAK_MAP;
};

// O(1) normal History XP read after the cache is built.
sessionStoredXP=function(s){
  if(!s||s.status==='skipped')return 0;
  v150EnsureLiveXPCache();
  if(Number.isFinite(Number(s.xpWithStreak)))return Math.max(0,Number(s.xpWithStreak));
  return Math.max(0,v150BaseSessionXP(s));
};

// O(1) progression totals during normal rendering.
mediaFlowXP=function(){
  return v150EnsureLiveXPCache().totalXP;
};

libraryXPTotal=function(){
  const c=v150EnsureLiveXPCache();
  return c.fixedLibraryXP+c.loggedCompletionStreakBonusXP;
};

v149LoggedCompletionStreakBonus=function(){
  return v150EnsureLiveXPCache().loggedCompletionStreakBonusXP;
};

v149SessionRawXPTotal=function(sessions){
  if(sessions===S.sessions)return v150EnsureLiveXPCache().rawHistoryXP;
  return v150ComputeStateMetrics({sessions:Array.isArray(sessions)?sessions:[],library:[],xpLedger:{}},false).rawHistoryXP;
};

v149SessionStreakBonusForState=function(state){
  if(state?.sessions===S.sessions&&state?.library===S.library&&state?.xpLedger===S.xpLedger){
    return v150EnsureLiveXPCache().sessionStreakBonusXP;
  }
  return v150ComputeStateMetrics(state||{},false).sessionStreakBonusXP;
};

v149LoggedCompletionStreakBonusForState=function(state){
  if(state?.sessions===S.sessions&&state?.library===S.library&&state?.xpLedger===S.xpLedger){
    return v150EnsureLiveXPCache().loggedCompletionStreakBonusXP;
  }
  return v150ComputeStateMetrics(state||{},false).loggedCompletionStreakBonusXP;
};

// Replace the multi-pass v149 breakdown with one cached read.
v120XPBreakdown=function(){
  v120EnsureXPState();
  const c=v150EnsureLiveXPCache();
  const currentDayStreak=v149StreakForDateKey(todayISO());
  const prospectiveTodayStreak=v149ProspectiveTodayStreak();

  return {
    total:c.totalXP,
    historyXP:c.historyXP,
    preStreakHistoryXP:c.rawHistoryXP,
    sessionStreakBonusXP:c.sessionStreakBonusXP,
    loggedCompletionStreakBonusXP:c.loggedCompletionStreakBonusXP,
    streakBonusXP:c.sessionStreakBonusXP+c.loggedCompletionStreakBonusXP,
    libraryTitleXP:c.libraryTitleXP,
    completedTitleXP:c.completedTitleXP,
    libraryEditXP:c.libraryEditXP,
    manualCoverXP:c.manualCoverXP,
    loggedCompletionBonusXP:c.loggedCompletionBonusXP,
    ratingXP:c.ratingXP,
    ratingRewards:c.ratingRewards,
    completedTitles:c.completedTitles,
    currentDayStreak,
    currentStreakMultiplier:v149StreakMultiplier(currentDayStreak),
    prospectiveTodayStreak,
    prospectiveTodayMultiplier:v149StreakMultiplier(prospectiveTodayStreak),
    streakXPFormulaVersion:V149_STREAK_XP_VERSION
  };
};

// Library History before/after XP comparisons stay exact, but are now linear
// O(history + library) instead of v149's potential O(completions × history).
v50SnapshotXP=function(x){
  if(!x)return null;
  return v150ComputeStateMetrics({
    sessions:Array.isArray(x.sessions)?x.sessions:[],
    library:Array.isArray(x.library)?x.library:[],
    xpLedger:x.xpLedger||{}
  },false).totalXP;
};

// Invalidate the aggregate cache for every persistent source that can affect XP.
const v150PersistLibraryBase=persistLibrary;
persistLibrary=function(){
  v149MarkStreakDirty();
  return v150PersistLibraryBase.apply(this,arguments);
};

const v150PersistSettingsBase=persistSettings;
persistSettings=function(){
  v149MarkStreakDirty();
  return v150PersistSettingsBase.apply(this,arguments);
};

// The v149 wrappers already invalidate on persistSessions, mfCommit,
// restoreCore and applyState. Calculate XP also marks dirty before/after.

// Backup/export compatibility: there is no new persistent v150 data.
// Schema v3 remains valid; the runtime cache is intentionally reconstructed.
const v150BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v150EnsureLiveXPCache();
  const payload=v150BuildFullBackupBase();
  if(payload?.streakXP){
    payload.streakXP.performanceModel='v150 cached aggregate; reconstructed from History on import';
  }
  if(payload?.backupManifest){
    payload.backupManifest.note='Complete MediaFlow backup. v150 XP performance caches are runtime-only and are rebuilt from imported History/Library/XP ledgers; no user data depends on the cache.';
  }
  return payload;
};



/* ============================================================
   MediaFlow v152 — Automatic Backup = Full Backup
   ------------------------------------------------------------
   Before v152, automatic folder backups still serialized snapshot()
   directly. That covered the core account state but skipped newer
   portable extras introduced by the modern Full Backup pipeline,
   such as the saved Rating Queue and portable UI preferences.

   v152 routes BOTH scheduled automatic backups and the manual
   "Save backup now" folder backup through the FINAL full-backup
   builder chain (v148 -> v149 -> v150), so folder backups and the
   normal Export JSON backup now carry the same complete data model.
   ============================================================ */

backupSnapshot=function(){
  // v148BuildFullBackup is intentionally resolved at call time.
  // At this point it is the FINAL wrapped builder, including:
  // - v148 complete-data backup + Rating Queue / portable UI prefs
  // - v149 streak-XP schema/metadata
  // - v150 performance-model compatibility metadata
  return v148BuildFullBackup();
};



