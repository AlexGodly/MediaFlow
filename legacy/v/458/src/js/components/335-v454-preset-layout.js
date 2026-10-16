/* MediaFlow v454 — safe quick recovery lifecycle and compact, scroll-stable presets.
 * All three quick modes share the same scan, confirmation, and cleanup path.
 * Provider access is never fabricated; only registered ready adapters execute.
 */
const MF454_VERSION=454;
const MF454={query:'',providerQuery:{cover:'',metadata:''},focus:null,quickOpening:false,restoreTask:null};
function mf454Icon(cat){
 return '<span class="mf454-category-art" aria-hidden="true">'+mf445CategoryIcon(cat)+'</span>';
}
function mf454Arg(x){return mf453Esc(JSON.stringify(String(x)));}
function mf454PresetCounter(cat,mode){
 const selected=new Set(mf453ProvidersFor(mode,cat));
 const ready=mf445Providers(mode).filter(p=>p.available&&selected.has(p.id)).length;
 return {selected:selected.size,ready};
}
function mf454ProviderRows(cat,mode){
 const selected=new Set(mf453ProvidersFor(mode,cat));
 return mf445Providers(mode).map(p=>{
  const id=mf454Arg(p.id),code=mf454Arg(cat),type=mf454Arg(mode);
  return '<label class="mf454-provider-row" data-mf454-provider-name="'+mf453Esc(p.name.toLowerCase())+'">'+
   '<input type="checkbox" '+(selected.has(p.id)?'checked ':'')+
   'onchange="App.mf453PresetToggle('+code+','+type+','+id+',this.checked)">'+
   '<span class="mf454-provider-label"><strong>'+mf453Esc(p.name)+'</strong>'+
   '<small class="'+(p.available?'mf454-ready':'mf454-pending')+'">'+
   (p.available?'Ready':'Needs setup or a live adapter')+'</small></span></label>';
 }).join('');
}
function mf454PresetGroup(cat,mode){
 const count=mf454PresetCounter(cat,mode);
 const own=Array.isArray(mf453Presets()[cat]?.[mode]);
 const catArg=mf454Arg(cat),modeArg=mf454Arg(mode);
 const kind=mode==='cover'?'Cover':'Metadata';
 const controls=[['available','Select available','selectAll'],['none','Deselect all','deselectAll'],
  ['global','Use global','stopPart']].map(([value,label,icon])=>
  '<button type="button" data-v225-iconified="1" onclick="App.mf453PresetBulk('+catArg+','+modeArg+','+
  mf454Arg(value)+')">'+mf452Icon(icon,15)+' '+label+'</button>').join('');
 return '<section class="mf454-provider-group" data-mf454-group="'+mode+'">'+
  '<div class="mf454-group-top"><span>'+mf425Icon(mode==='cover'?'images':'database',18)+
  '<strong>'+kind+' providers</strong></span><small data-mf454-count>'+
  count.selected+' selected · '+count.ready+' ready</small></div>'+
  '<div class="mf454-provider-tools">'+controls+'</div>'+
  '<label class="mf454-provider-search">'+mf425Icon('search',14)+
  '<input type="search" placeholder="Find '+kind.toLowerCase()+' provider..." aria-label="Filter '+kind+
  ' providers" value="'+mf453Esc(MF454.providerQuery[mode]||'')+'" oninput="App.mf454FindProviders(this,'+
   modeArg+')"></label>'+
  '<div class="mf454-provider-list" data-mf454-list>'+mf454ProviderRows(cat,mode)+'</div>'+
  '<small data-mf454-inherit>'+(own?'Custom category preset':'Inherits global settings')+'</small></section>';
}
function mf454CategoryList(){
 const categories=(S.categories||[]).filter(c=>c?.id!=null);
 const needle=MF454.query.trim().toLowerCase();
 return categories.filter(c=>String(c.name||c.title||c.id).toLowerCase().includes(needle)).map(cat=>
  '<button type="button" class="mf454-category-button '+(String(cat.id)===MF453.category?'active':'')+
  '" data-mf454-category="'+mf453Esc(cat.id)+'" data-v225-iconified="1" aria-pressed="'+
  (String(cat.id)===MF453.category)+'" onclick="App.mf453ChooseCategory('+mf454Arg(cat.id)+')">'+
  mf454Icon(cat)+'<span>'+mf453Esc(cat.name||cat.title||cat.id)+'</span></button>').join('')||
  '<small class="mf454-no-matches">No categories match this search.</small>';
}
function mf454CategoryPanel(){
 const cat=mf453Category(MF453.category);
 if(!cat)return '<p>Add Library categories to configure presets.</p>';
 const options=(S.categories||[]).filter(c=>c?.id!=null&&String(c.id)!==String(cat.id));
 return '<div class="mf454-category-head">'+mf454Icon(cat)+'<span><strong>'+mf453Esc(cat.name||cat.title||cat.id)+
  '</strong><small>Independently assign Cover and Metadata providers</small></span></div>'+
  '<div class="mf454-provider-columns">'+mf454PresetGroup(String(cat.id),'cover')+
  mf454PresetGroup(String(cat.id),'metadata')+'</div>'+
  '<div class="mf454-copy-preset"><label>Copy these presets to another category<select id="mf454-copy-target" aria-label="Category to copy preset to">'+
  '<option value="">Choose destination…</option>'+options.map(c=>'<option value="'+mf453Esc(c.id)+'">'+
  mf453Esc(c.name||c.title||c.id)+'</option>').join('')+'</select></label>'+
  '<button type="button" data-v225-iconified="1" onclick="App.mf454CopyPreset()">'+mf425Icon('check',15)+
  ' Copy cover + metadata selections</button></div>';
}
function mf454PresetsHtml(){
 const list=(S.categories||[]).filter(c=>c?.id!=null);
 if(!list.some(c=>String(c.id)===String(MF453.category)))MF453.category=String(list[0]?.id||'');
 return '<section class="mf453-presets mf454-presets" data-mf-setting-id="recovery-presets">'+
  '<header class="mf454-presets-head"><span>'+mf425Icon('settings',19)+'</span><div>'+
  '<h3>Recovery Presets</h3><p>Set up Cover and Metadata provider groups once per category. Selections are saved immediately and reused during quick title recovery.</p></div></header>'+
  '<div class="mf454-presets-layout">'+
  '<aside class="mf454-category-rail"><label>'+mf425Icon('search',14)+
   '<input type="search" value="'+mf453Esc(MF454.query)+'" placeholder="Search categories" aria-label="Search recovery categories" '+
   'oninput="App.mf454FindCategories(this)"></label>'+
  '<div class="mf454-category-list" data-mf454-category-list>'+mf454CategoryList()+'</div></aside>'+
  '<div class="mf454-presets-main" data-mf454-current-panel>'+mf454CategoryPanel()+'</div></div>'+
  '<p class="mf453-note">Pending selections are saved but never run without a real available adapter and valid credentials. Configured providers do not need a separate manual test.</p></section>';
}
function mf454FindCategories(input){
 MF454.query=String(input.value||'');
 const rail=input.closest('.mf454-category-rail');
 const list=rail?.querySelector('[data-mf454-category-list]');
 if(list){const scroll=list.scrollTop;list.innerHTML=mf454CategoryList();list.scrollTop=scroll;}
}
function mf454FindProviders(input,mode){
 MF454.providerQuery[mode]=String(input.value||'');
 const group=input.closest('[data-mf454-group]');
 const needle=MF454.providerQuery[mode].trim().toLowerCase();
 for(const row of group?.querySelectorAll('[data-mf454-provider-name]')||[]){
  row.hidden=!String(row.dataset.mf454ProviderName||'').includes(needle);
 }
}
function mf454RefreshGroup(mode){
 const group=document.querySelector('[data-mf454-current-panel] [data-mf454-group="'+mode+'"]');
 if(!group)return;
 const cat=MF453.category,selected=new Set(mf453ProvidersFor(mode,cat));
 for(const p of group.querySelectorAll('input[type="checkbox"]')){
  const source=p.closest('[data-mf454-provider-name]');
  // Rows are in exactly the registered order; reading the checked state is
  // cheaper than a full workspace rerender and never changes scroll.
  if(!source)continue;
 }
 const count=mf454PresetCounter(cat,mode);
 const label=group.querySelector('[data-mf454-count]');
 if(label)label.textContent=count.selected+' selected · '+count.ready+' ready';
 const inherited=group.querySelector('[data-mf454-inherit]');
 if(inherited)inherited.textContent=Array.isArray(mf453Presets()[cat]?.[mode])?
  'Custom category preset':'Inherits global settings';
}
mf453PresetHtml=mf454PresetsHtml;
mf453PresetToggle=function(cat,mode,id,checked){
 if(!mf453Category(cat)||!mf445Providers(mode).some(p=>p.id===id))return;
 const ids=new Set(mf453ProvidersFor(mode,cat));
 if(checked)ids.add(id);else ids.delete(id);
 mf453SavePreset(cat,mode,[...ids]);mf454RefreshGroup(mode);
};
mf453PresetBulk=function(cat,mode,choice){
 if(!mf453Category(cat))return;
 const available=mf445Providers(mode);
 const ids=choice==='available'?available.filter(p=>p.available).map(p=>p.id):
  choice==='none'?[]:null;
 mf453SavePreset(cat,mode,ids);
 const group=document.querySelector('[data-mf454-group="'+mode+'"]');
 if(group){
  const selected=new Set(mf453ProvidersFor(mode,cat));
  [...group.querySelectorAll('[data-mf454-provider-name]')].forEach((row,i)=>{
   const cb=row.querySelector('input');if(cb)cb.checked=selected.has(available[i]?.id);
  });
 }
 mf454RefreshGroup(mode);
};
mf453ChooseCategory=function(id){
 if(!mf453Category(id))return;
 MF453.category=String(id);
 const pane=document.querySelector('[data-mf454-current-panel]');
 if(pane){pane.innerHTML=mf454CategoryPanel();
  document.querySelectorAll('[data-mf454-category]').forEach(button=>{
   const active=String(button.dataset.mf454Category)===MF453.category;
   button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));
  });
 }else mf453PaintPresets();
};
function mf454CopyPreset(){
 const other=document.getElementById('mf454-copy-target')?.value;
 if(!mf453Category(other)||other===String(MF453.category))return;
 for(const mode of ['cover','metadata'])mf453SavePreset(other,mode,mf453ProvidersFor(mode,MF453.category));
 showToast('Copied both provider groups. Existing global provider preferences were not changed.');
}
Object.assign(App,{mf453PresetToggle,mf453PresetBulk,mf453ChooseCategory,
 mf454CopyPreset,mf454FindCategories,mf454FindProviders});
window.MediaFlowV454Presets=Object.freeze({version:454,html:mf454PresetsHtml,copy:mf454CopyPreset});
