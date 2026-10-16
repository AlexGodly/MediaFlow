/* ============================================================
   Global Title Details Popup
   ============================================================ */

function v181NormalizeUrl(value){
  try{
    return new URL(String(value||''),location.href).href;
  }catch(_){
    return String(value||'').trim();
  }
}

function v181ResolveCoverItem(img){
  if(!img)return null;

  const direct=String(
    img.dataset?.libraryId||
    img.closest?.('[data-library-id]')?.dataset?.libraryId||
    ''
  );

  if(direct){
    const byId=(S.library||[]).find(
      item=>String(item?.id||'')===direct
    );
    if(byId)return byId;
  }

  const src=v181NormalizeUrl(
    img.currentSrc||img.src||img.getAttribute?.('src')||''
  );

  if(src){
    const byCover=(S.library||[]).find(
      item=>item?.coverUrl&&
        v181NormalizeUrl(item.coverUrl)===src
    );
    if(byCover)return byCover;
  }

  const alt=String(img.alt||'')
    .replace(/\s+cover$/i,'')
    .trim();

  if(alt){
    const key=v165NormalizedTitle(alt);
    const matches=(S.library||[]).filter(
      item=>v165NormalizedTitle(item?.title||'')===key
    );

    if(matches.length===1)return matches[0];
  }

  return null;
}

function v181MarkClickableCovers(){
  document.querySelectorAll('img').forEach(img=>{
    if(
      img.closest('.v181-title-details-overlay')||
      img.closest('.v181-quick-detail-overlay')||
      img.closest('#modal-root')
    ){
      return;
    }

    const item=v181ResolveCoverItem(img);
    if(!item)return;

    img.classList.add('v181-title-cover-clickable');
    img.dataset.v181LibraryId=String(item.id||'');

    if(!img.title){
      img.title='Open title details';
    }
  });
}

function v181FmtDateValue(value){
  if(!value)return '—';

  const n=Number(value);
  let d;

  if(Number.isFinite(n)&&n>1000000000){
    d=new Date(n);
  }else{
    const parsed=Date.parse(String(value));
    if(!Number.isFinite(parsed))return String(value);
    d=new Date(parsed);
  }

  return Number.isNaN(d.getTime())
    ?'—'
    :d.toLocaleDateString(undefined,{
      year:'numeric',
      month:'short',
      day:'numeric'
    });
}

function v181DetailDisplay(value,fallback='—'){
  if(Array.isArray(value)){
    return value.length?value.join(', '):fallback;
  }

  if(value===null||value===undefined||value===''){
    return fallback;
  }

  return String(value);
}

function v181DetailButton(item,key,label,value,wide=false){
  return `<button type="button"
    class="v181-detail-card ${wide?'v181-wide':''}"
    onclick="App.v181QuickEditDetail('${escapeHtml(String(item.id))}','${escapeHtml(key)}')">
    <small>${escapeHtml(label)}</small>
    <b>${escapeHtml(v181DetailDisplay(value))}</b>
  </button>`;
}

function v181ReadonlyDetail(label,value,wide=false){
  return `<div class="v181-detail-card v181-detail-readonly ${wide?'v181-wide':''}">
    <small>${escapeHtml(label)}</small>
    <b>${escapeHtml(v181DetailDisplay(value))}</b>
  </div>`;
}

function v181ExternalIdsText(item){
  const ext=item?.externalIds&&typeof item.externalIds==='object'
    ?item.externalIds
    :{};

  const rows=Object.entries(ext)
    .filter(([,value])=>value!==null&&value!==undefined&&String(value)!=='')
    .map(([key,value])=>`${key.toUpperCase()}: ${value}`);

  return rows.join(' · ')||'—';
}

function v181TitleDetailsHtml(item){
  const cat=getCategory(item.categoryId);
  const progress=Math.max(0,Number(item.progress)||0);
  const total=Number(item.total)>0?Number(item.total):null;
  const pct=total
    ?Math.min(100,Math.round(progress/total*100))
    :0;

  const cover=item.coverUrl
    ?`<img class="v181-title-hero-cover"
        src="${escapeHtml(item.coverUrl)}"
        alt="${escapeHtml(cleanTitle(item.title))} cover">`
    :`<div class="v181-title-hero-placeholder">
        ${v144CategoryIconHtml(cat)}
      </div>`;

  return `<div class="v181-title-details-overlay"
      id="v181-title-details-overlay"
      onclick="if(event.target===this)App.v181CloseTitleDetails()">

    <div class="v181-title-details-modal">
      <div class="v181-title-hero">
        ${cover}

        <div class="v181-title-hero-copy">
          <h2>${escapeHtml(cleanTitle(item.title))}</h2><div class="v181-title-hero-meta">
            <span class="pill">${v144CategoryIconHtml(cat)} ${escapeHtml(cat.name)}</span>
            <span class="pill">${escapeHtml(v199StatusLabel(item.status))}</span>
            <span class="pill">${escapeHtml(item.priority||'medium')} priority</span>
            ${Number(item.rating)>0?`<span class="pill">★ ${Number(item.rating).toFixed(1)}</span>`:''}
            ${item.mediaFormat?`<span class="pill">${escapeHtml(String(item.mediaFormat))}</span>`:''}
            ${item.year?`<span class="pill">${escapeHtml(String(item.year))}</span>`:''}
          </div>

          <div class="v181-title-progress">
            <div class="v181-title-progress-head">
              <span>Progress</span>
              <b>${progress}${total?` / ${total}`:''} ${escapeHtml(unitLabel(cat.unit,total||progress||2))}</b>
            </div>
            ${
              total
                ?`<div class="progress-track">
                    <div class="progress-fill" style="width:${pct}%"></div>
                  </div>`
                :''
            }
          </div>
        </div>

        <div class="v181-detail-actions" style="margin:0;">
          <button type="button"
            class="btn btn-sm btn-primary"
            onclick="App.v181EditFullTitle('${escapeHtml(String(item.id))}')">
            Edit title
          </button>

          <button type="button"
            class="btn btn-sm btn-ghost"
            onclick="App.v181CloseTitleDetails()">
            Close
          </button>
        </div>
      </div>

      <div class="v181-title-details-body">
        <div class="v181-detail-section-label">Library</div>

        <div class="v181-detail-grid">
          ${v181DetailButton(item,'title','Title',cleanTitle(item.title),true)}
          ${v181DetailButton(item,'categoryId','Category',cat.name)}
          ${v181DetailButton(item,'status','Status',v199StatusLabel(item.status))}
          ${v181DetailButton(item,'priority','Priority',item.priority||'medium')}
          ${v181DetailButton(item,'progress','Current progress',progress)}
          ${v181DetailButton(item,'total','Total',total??'Unknown')}
          ${v181DetailButton(item,'rating','Your rating',Number(item.rating)>0?Number(item.rating).toFixed(1):'Not rated')}
          ${v181DetailButton(item,'estimatedMinutes','Estimated minutes',item.estimatedMinutes??'—')}
          ${v181DetailButton(item,'tags','Tags',item.tags||[])}
          ${v181DetailButton(item,'coverUrl','Cover URL',item.coverUrl||'No cover',true)}
        </div>

        <div class="v181-detail-section-label" style="margin-top:14px;">Title metadata</div>

        <div class="v181-detail-grid">
          ${v181DetailButton(item,'year','Year',item.year||'—')}
          ${v181DetailButton(item,'mediaFormat','Media format',item.mediaFormat||'—')}
          ${v181DetailButton(item,'durationMinutes','Runtime',item.durationMinutes?`${item.durationMinutes} min`:'—')}
          ${v181DetailButton(item,'releaseDate','Release date',v181FmtDateValue(item.releaseDate))}
          ${v181DetailButton(item,'seasonLabel','Season',item.seasonLabel||'—')}
          ${v181DetailButton(item,'ageRating','Content rating',item.ageRating||'—')}
          ${v181DetailButton(item,'communityScore','Community score',item.communityScore||'—')}
          ${v181DetailButton(item,'mediaSource','Source material',item.mediaSource||'—')}
          ${v181DetailButton(item,'demographic','Demographic',item.demographic||'—')}
          ${v181DetailButton(item,'studios','Studios',item.studios||[])}
          ${v181DetailButton(item,'producers','Producers',item.producers||[])}
          ${v181DetailButton(item,'genres','Genres',item.genres||[])}
          ${v181DetailButton(item,'themes','Themes',item.themes||[])}
          ${v181DetailButton(item,'synopsis','Synopsis / description',item.synopsis||'—',true)}
        </div>

        <div class="v181-detail-section-label" style="margin-top:14px;">Dates & source</div>

        <div class="v181-detail-grid">
          ${v181DetailButton(item,'startedAt','Started',v181FmtDateValue(item.startedAt))}
          ${v181DetailButton(item,'completedAt','Finished',v181FmtDateValue(item.completedAt))}
          ${v181ReadonlyDetail('Imported / created source',item.source||'manual')}
          ${v181ReadonlyDetail('External IDs',v181ExternalIdsText(item),true)}
        </div>

        <div class="v181-detail-actions">
          <button type="button"
            class="btn btn-primary"
            onclick="App.v181EditFullTitle('${escapeHtml(String(item.id))}')">
            Edit all title details
          </button>

          <button type="button"
            class="btn btn-ghost"
            onclick="App.v181CloseTitleDetails()">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>`;
}

function v181OpenTitleDetails(id){
  const item=(S.library||[]).find(
    row=>String(row?.id||'')===String(id)
  );

  if(!item){
    showToast('That title is no longer in your Library.');
    return;
  }

  document.getElementById('v181-title-details-overlay')?.remove();
  document.getElementById('v181-quick-detail-overlay')?.remove();

  document.body.insertAdjacentHTML(
    'beforeend',
    v181TitleDetailsHtml(item)
  );
}

function v181CloseTitleDetails(){
  document.getElementById('v181-title-details-overlay')?.remove();
  document.getElementById('v181-quick-detail-overlay')?.remove();
}

function v181EditFullTitle(id){
  v181CloseTitleDetails();
  App.openLibraryModal(id);
}

function v181QuickSchema(item,key){
  const categories=(S.categories||[]).map(c=>[
    String(c.id),
    `${v144CategoryIconText(c)} ${c.name}`
  ]);

  const status=[
    ['planned','Plan to Watch'],
    ['active','Watching'],
    ['paused','On Hold'],
    ['completed','Completed'],
    ['dropped','Dropped']
  ];

  const priority=[
    ['low','Low'],
    ['medium','Medium'],
    ['high','High']
  ];

  const text=(label,value,type='text')=>({
    label,
    input:`<input id="v181-quick-value"
      type="${type}"
      value="${escapeHtml(String(value??''))}">`
  });

  const number=(label,value,attrs='')=>({
    label,
    input:`<input id="v181-quick-value"
      type="number"
      ${attrs}
      value="${value??''}">`
  });

  const select=(label,value,options)=>({
    label,
    input:`<select id="v181-quick-value">
      ${options.map(([id,name])=>`<option value="${escapeHtml(id)}"
        ${String(value)===String(id)?'selected':''}>
        ${escapeHtml(name)}
      </option>`).join('')}
    </select>`
  });

  const list=(label,value)=>text(
    label,
    Array.isArray(value)?value.join(', '):''
  );

  const dateValue=value=>{
    if(!value)return '';
    if(/^\d{4}-\d{2}-\d{2}$/.test(String(value)))return String(value);

    const n=Number(value);
    const d=Number.isFinite(n)&&n>1000000000
      ?new Date(n)
      :new Date(String(value));

    return Number.isNaN(d.getTime())
      ?''
      :d.toISOString().slice(0,10);
  };

  switch(key){
    case 'title':return text('Title',cleanTitle(item.title));
    case 'categoryId':return select('Category',item.categoryId,categories);
    case 'status':return select('Status',item.status||'planned',status);
    case 'priority':return select('Priority',item.priority||'medium',priority);
    case 'progress':return number('Current progress',Number(item.progress)||0,'min="0" step="1"');
    case 'total':return number('Total',item.total??'','min="0" step="1"');
    case 'rating':return number('Your rating',item.rating??'','min="0" max="10" step="0.1"');
    case 'estimatedMinutes':return number('Estimated minutes',item.estimatedMinutes??'','min="0" step="1"');
    case 'tags':return list('Tags — comma separated',item.tags);
    case 'coverUrl':return text('Cover URL',item.coverUrl||'','url');
    case 'year':return number('Year',item.year??'','min="0" max="9999" step="1"');
    case 'mediaFormat':return text('Media format',item.mediaFormat||'');
    case 'durationMinutes':return number('Runtime / duration (minutes)',item.durationMinutes??'','min="0" step="1"');
    case 'releaseDate':return text('Release date',dateValue(item.releaseDate),'date');
    case 'seasonLabel':return text('Season',item.seasonLabel||'');
    case 'ageRating':return text('Content / age rating',item.ageRating||'');
    case 'communityScore':return number('Community score',item.communityScore??'','min="0" max="10" step="0.01"');
    case 'mediaSource':return text('Source material',item.mediaSource||'');
    case 'demographic':return text('Demographic',item.demographic||'');
    case 'studios':return list('Studios — comma separated',item.studios);
    case 'producers':return list('Producers — comma separated',item.producers);
    case 'genres':return list('Genres — comma separated',item.genres);
    case 'themes':return list('Themes — comma separated',item.themes);
    case 'synopsis':
      return {
        label:'Synopsis / description',
        input:`<textarea id="v181-quick-value">${escapeHtml(String(item.synopsis||''))}</textarea>`
      };
    case 'startedAt':return text('Started',dateValue(item.startedAt),'date');
    case 'completedAt':return text('Finished',dateValue(item.completedAt),'date');
    default:return null;
  }
}

function v181QuickEditDetail(id,key){
  const item=(S.library||[]).find(
    row=>String(row?.id||'')===String(id)
  );
  if(!item)return;

  const schema=v181QuickSchema(item,key);
  if(!schema)return;

  document.getElementById('v181-quick-detail-overlay')?.remove();

  document.body.insertAdjacentHTML(
    'beforeend',
    `<div class="v181-quick-detail-overlay"
        id="v181-quick-detail-overlay"
        onclick="if(event.target===this)App.v181CloseQuickDetail()">

      <div class="v181-quick-detail-modal">
        <h3>${escapeHtml(schema.label)}</h3>
        <div class="hint">
          Quick edit · changes save to the same Library title.
        </div>

        <div class="field">
          ${schema.input}
        </div>

        <div class="v181-quick-detail-actions">
          <button type="button"
            class="btn btn-ghost"
            onclick="App.v181CloseQuickDetail()">
            Cancel
          </button>

          <button type="button"
            class="btn btn-primary"
            onclick="App.v181SaveQuickDetail('${escapeHtml(String(item.id))}','${escapeHtml(key)}')">
            Save
          </button>
        </div>
      </div>
    </div>`
  );

  setTimeout(()=>{
    const input=document.getElementById('v181-quick-value');
    input?.focus?.();
    if(input?.select&&input.tagName!=='SELECT')input.select();
  },0);
}

function v181CloseQuickDetail(){
  document.getElementById('v181-quick-detail-overlay')?.remove();
}

function v181QuickList(value){
  return [...new Set(
    String(value||'')
      .split(',')
      .map(x=>v176SafeText(x,120))
      .filter(Boolean)
  )].slice(0,40);
}

function v181DateTimestamp(value){
  const raw=String(value||'').trim();
  if(!raw)return null;

  const ts=new Date(raw+'T12:00:00').getTime();
  return Number.isFinite(ts)?ts:null;
}

function v181SaveQuickDetail(id,key){
  const item=(S.library||[]).find(
    row=>String(row?.id||'')===String(id)
  );
  const input=document.getElementById('v181-quick-value');

  if(!item||!input)return;

  const value=input.value;
  v181CloseQuickDetail();

  // Use the established Library actions for fields with important side effects.
  if(key==='status'){
    App.setLibraryStatus(item.id,value);
    setTimeout(()=>v181OpenTitleDetails(item.id),0);
    return;
  }

  if(key==='priority'){
    App.setPriorityChoice(item.id,value);
    setTimeout(()=>v181OpenTitleDetails(item.id),0);
    return;
  }

  if(key==='categoryId'){
    App.setLibraryCategory(item.id,value);
    setTimeout(()=>v181OpenTitleDetails(item.id),0);
    return;
  }

  const before=JSON.stringify(item[key]??null);

  if(key==='title'){
    const title=cleanTitle(value);
    if(title)item.title=title;
  }else if(['progress','total','estimatedMinutes','year','durationMinutes','communityScore','rating'].includes(key)){
    const raw=String(value||'').trim();
    let next=raw===''?null:Number(raw);

    if(Number.isFinite(next)){
      next=Math.max(0,next);
    }else{
      next=null;
    }

    if(key==='rating'||key==='communityScore'){
      if(next!=null)next=Math.min(10,next);
    }

    if(key==='year'&&next!=null){
      next=Math.min(9999,Math.round(next));
    }

    if(['progress','total','estimatedMinutes','durationMinutes'].includes(key)&&next!=null){
      next=Math.round(next);
    }

    item[key]=next;

    if(
      key==='progress' &&
      Number(item.total)>0 &&
      Number(item.progress)>Number(item.total)
    ){
      item.progress=Number(item.total);
    }

    if(
      key==='total' &&
      Number(item.total)>0 &&
      Number(item.progress)>Number(item.total)
    ){
      item.progress=Number(item.total);
    }
  }else if(['tags','studios','producers','genres','themes'].includes(key)){
    item[key]=v181QuickList(value);
  }else if(key==='releaseDate'){
    item.releaseDate=v176DateValue(value);
  }else if(key==='startedAt'){
    item.startedAt=v181DateTimestamp(value);
  }else if(key==='completedAt'){
    item.completedAt=v181DateTimestamp(value);
  }else if(key==='synopsis'){
    item.synopsis=v176SafeText(value,6000);
  }else{
    item[key]=v176SafeText(
      value,
      key==='coverUrl'?3000:180
    );
  }

  // v178 contract: manually edited imported metadata cannot be silently
  // overwritten by a later service import.
  if(
    typeof V178_EDITABLE_RICH_FIELDS!=='undefined' &&
    V178_EDITABLE_RICH_FIELDS.includes(key)
  ){
    item.richMetadataManual=v178ManualMap(item);
    item.richMetadataManual[key]=true;
  }

  item.modifiedAt=Date.now();

  // Keep active recommendation text aligned after a quick title rename.
  if(
    key==='title' &&
    S.currentTask &&
    String(S.currentTask.libraryId||'')===String(item.id)
  ){
    S.currentTask.title=cleanTitle(item.title);
  }

  const after=JSON.stringify(item[key]??null);
  if(before!==after){
    try{v44AwardEditXP(item.id);}catch(_){}
  }

  try{v53InvalidateLibraryCache();}catch(_){}
  persistLibrary();
  render();

  setTimeout(()=>{
    v181OpenTitleDetails(item.id);
  },0);
}

Object.assign(App,{
  v181OpenTitleDetails,
  v181CloseTitleDetails,
  v181EditFullTitle,
  v181QuickEditDetail,
  v181CloseQuickDetail,
  v181SaveQuickDetail
});

// Capture-phase handler makes cover clicks work everywhere in the rendered app
// without requiring every historical renderer to be rewritten.
document.addEventListener('click',event=>{
  const img=event.target?.closest?.('img');
  if(!img)return;

  if(
    img.closest('.v181-title-details-overlay')||
    img.closest('.v181-quick-detail-overlay')||
    img.closest('#modal-root')
  ){
    return;
  }

  const item=v181ResolveCoverItem(img);
  if(!item)return;

  event.preventDefault();
  event.stopPropagation();
  v181OpenTitleDetails(item.id);
},true);

