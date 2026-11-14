/* MediaFlow v453 — category recovery presets + provider controls.
 * Enabled-but-pending never becomes falsely "configured". */
const MF453_VERSION=453;
const MF453={category:'',quick:null,session:0,scanning:false,refreshing:false};
const mf453Esc=x=>mf424Escape(String(x??''));
function mf453Category(id){return(S.categories||[]).find(c=>String(c?.id)===String(id))||null;}
function mf453Presets(){return S.settings?.v453RecoveryPresets||{};}
function mf453ProvidersFor(mode,category){
 const ids=mf453Presets()[String(category)]?.[mode];
 return Array.isArray(ids)?[...new Set(ids.filter(x=>typeof x==='string'))]:
 (mode==='cover'?mf424Defaults():mf439Preferences()).enabled.slice();
}
function mf453SavePreset(cat,mode,providers){
 if(!mf453Category(cat)||!['cover','metadata'].includes(mode))return;
 const registered=new Set(mf445Providers(mode).map(p=>p.id));
 const preset={...mf453Presets()},row={...(preset[cat]||{})};
 if(providers===null)delete row[mode];
 else row[mode]=[...new Set(providers.filter(p=>registered.has(p)))];
 if(Object.keys(row).length)preset[cat]=row;else delete preset[cat];
 S.settings=S.settings||{};S.settings.v453RecoveryPresets=preset;
 Promise.resolve(saveState()).catch(e=>console.warn('Recovery preset save failed',e));
}
function mf453PresetToggle(cat,mode,id,enabled){
 if(!mf453Category(cat)||!mf445Providers(mode).some(p=>p.id===id))return;
 const ids=new Set(mf453ProvidersFor(mode,cat));
 if(enabled)ids.add(id);else ids.delete(id);
 mf453SavePreset(cat,mode,[...ids]);mf453PaintPresets();
}
function mf453PresetBulk(cat,mode,choice){
 if(!mf453Category(cat)||!['cover','metadata'].includes(mode))return;
 const values=choice==='available'?mf445Providers(mode).filter(p=>p.available).map(p=>p.id):
  choice==='none'?[]:null;
 mf453SavePreset(cat,mode,values);mf453PaintPresets();
}
function mf453PresetFields(cat,mode){
 const keys=new Set(mf453ProvidersFor(mode,cat));
 const personal=Array.isArray(mf453Presets()[cat]?.[mode]);
 const arg=x=>mf453Esc(JSON.stringify(x));
 return '<section class="mf453-preset-group"><header><strong>'+mf425Icon(mode==='cover'?'images':'database',18)+
  (mode==='cover'?' Cover providers':' Metadata providers')+'</strong><small>'+
  (personal?'Custom preset':'Global defaults')+' · '+keys.size+' selected</small></header>'+
 '<div class="mf453-preset-tools">'+[
 ['available','Select available',mf452Icon('selectAll',15)],
 ['none','Deselect all',mf452Icon('deselectAll',15)],
 ['global','Use global',mf425Icon('settings',15)]
 ].map(([v,label,icon])=>'<button type="button" data-v225-iconified="1" onclick="App.mf453PresetBulk('+
 arg(String(cat))+','+arg(mode)+','+arg(v)+')">'+icon+' '+label+'</button>').join('')+'</div>'+
 '<div class="mf453-preset-list">'+mf445Providers(mode).map(p=>'<label class="mf453-preset-provider"><input type="checkbox" '+
 (keys.has(p.id)?'checked ':'')+'onchange="App.mf453PresetToggle('+arg(String(cat))+','+arg(mode)+','+arg(p.id)+
 ',this.checked)"><span><strong>'+mf453Esc(p.name)+'</strong><small>'+
 (p.available?'Ready':'Pending setup / adapter')+'</small></span></label>').join('')+'</div></section>';
}
function mf453PresetHtml(){
 const cats=(S.categories||[]).filter(c=>c?.id!=null);
 if(!cats.some(c=>String(c.id)===String(MF453.category)))MF453.category=String(cats[0]?.id||'');
 const cat=mf453Category(MF453.category);
 return '<section class="mf453-presets" data-mf-setting-id="recovery-presets"><header><h3>'+
 mf425Icon('settings',20)+' Recovery Presets</h3><p>Assign Cover and Metadata providers to each category. Quick title recovery will automatically use these selections.</p></header>'+
 (cat?'<label class="mf453-category-select">Category<select onchange="App.mf453ChooseCategory(this.value)">'+
 cats.map(c=>'<option value="'+mf453Esc(c.id)+'" '+(String(c.id)===MF453.category?'selected':'')+'>'+
 mf453Esc(c.name||c.title||c.id)+'</option>').join('')+'</select></label>'+
 '<div class="mf453-category-title">'+mf445CategoryIcon(cat)+' <strong>'+mf453Esc(cat.name||cat.title||cat.id)+
 '</strong></div><div class="mf453-preset-columns">'+
 mf453PresetFields(String(cat.id),'cover')+mf453PresetFields(String(cat.id),'metadata')+'</div>':
 '<p>Add Library categories first to configure their presets.</p>')+
 '<p class="mf453-note">Selecting an unconfigured provider saves your preference but never bypasses missing credentials, licensing or an unimplemented adapter. Configured providers do not need manual testing.</p></section>';
}
function mf453PaintPresets(){
 const old=document.querySelector('[data-mf-setting-id="recovery-presets"]');if(!old)return;
 const wrap=document.createElement('div');wrap.innerHTML=mf453PresetHtml();
 old.replaceWith(wrap.firstElementChild);
}
function mf453ChooseCategory(id){MF453.category=String(id);mf453PaintPresets();}
function mf453MountSettings(){
 if(String(S.view||'')!=='settings'||!window.MediaFlowSettingsCenter?.mountSection||
 document.querySelector('.mf365-section[data-mf365-section="v221-settings-recovery-presets"]'))return;
 const body=document.createElement('div');body.innerHTML=mf453PresetHtml();
 window.MediaFlowSettingsRegistry?.registerSetting?.({
 id:'recovery-presets',section:'v221-settings-recovery-presets',
 selector:'[data-mf-setting-id="recovery-presets"]',label:'Recovery Presets',
 keywords:['recovery','presets','category','cover','metadata','providers']});
 window.MediaFlowSettingsCenter.mountSection({
 id:'v221-settings-recovery-presets',title:'RECOVERY PRESETS',
 category:'library',subgroup:'Library maintenance',
 keywords:['category recovery presets','covers','metadata','quick title'],
 nodes:[body]});
}
MediaFlowRuntime.registerPageEnhancer('settings',mf453MountSettings);
const mf453OldWorkspace=mf441WorkspaceHtml;
mf441WorkspaceHtml=function(){
 const html=String(mf453OldWorkspace.apply(this,arguments)||'');
 const link='<button type="button" onclick="App.mf441Settings(&#39;v221-settings-recovery-presets&#39;)">'+
 mf425Icon('settings',19)+' <span><strong>Recovery Presets</strong><small>Category-specific cover and metadata providers</small></span>'+
 mf425Icon('chevronRight',16)+'</button>';
 return html.replace('</div><fieldset class="mf441-widget-preferences">',link+'</div><fieldset class="mf441-widget-preferences">');
};
// v452 bulk buttons were fixed in-place (escaped handlers), and the v446
// individual checkbox handler is also escaped. Preserve selections for pending
// connections but only actual working adapters may execute recovery calls.
const mf453OldSource=mf446SourceHtml;
mf446SourceHtml=function(mode){
 const wrap=document.createElement('div');
 wrap.innerHTML=String(mf453OldSource.apply(this,arguments)||'');
 const states=new Map(mf445Providers(mode).map(p=>[p.id,p]));
 for(const row of wrap.querySelectorAll('[data-mf446-provider]')){
  const provider=states.get(row.dataset.mf446Provider);
  const input=row.querySelector('input[data-mf446-toggle]');
  if(!provider||!input)continue;
  input.disabled=false;input.checked=provider.enabled;
  if(!provider.available){
   row.dataset.status=provider.enabled?'pending':'unavailable';
   const status=row.querySelector('.mf445-provider-status');
   if(status)status.textContent=provider.enabled?'Selected · needs setup':'Needs setup';
  }
 }
 const section=wrap.querySelector('.mf446-providers');
 if(section){
  const button=document.createElement('button');button.type='button';
  button.className='btn btn-ghost mf453-refresh-providers';button.dataset.v225Iconified='1';
  button.setAttribute('onclick','App.mf453RefreshProviders()');
  button.innerHTML=mf425Icon('retry',15)+' Refresh API access';
  section.querySelector('header')?.appendChild(button);
  const note=section.querySelector('.mf445-provider-note');
  if(note)note.textContent='You can preselect an unconfigured provider. It is never used until a real adapter, credentials and permissions are ready. Refresh access here without closing your recovery setup.';
 }
 return wrap.innerHTML;
};
mf446ToggleProvider=function(mode,id,on){
 if(!['cover','metadata'].includes(mode)||!mf445Providers(mode).some(p=>p.id===id))return;
 const prefs=mode==='cover'?mf424Defaults():mf439Preferences();
 const ids=new Set(prefs.enabled);
 if(on)ids.add(id);else ids.delete(id);
 mf452SaveProviders(mode,[...ids]);
};
App.mf446ToggleProvider=mf446ToggleProvider;
async function mf453RefreshProviders(){
 if(MF453.refreshing)return;MF453.refreshing=true;
 document.querySelectorAll('.mf453-refresh-providers').forEach(b=>{b.disabled=true;b.textContent='Checking…';});
 try{if(typeof mf443EnsureGateway==='function')await mf443EnsureGateway(true);
  showToast('API readiness refreshed. Your provider selections were kept.');
 }finally{
  MF453.refreshing=false;
  if(document.getElementById('mf445-workspace'))
   mf445Panel(MF447.active==='both'?'both':MF445.mode);
 }
}
function mf453Ready(mode,item){
 const selected=new Set(mf453ProvidersFor(mode,item?.categoryId||''));
 return mf445Providers(mode).filter(p=>p.available&&selected.has(p.id)).map(p=>p.id);
}
Object.assign(App,{mf453ChooseCategory,mf453PresetToggle,mf453PresetBulk,mf453RefreshProviders});
window.MediaFlowV453Presets=Object.freeze({
 version:453,configured:mf453ProvidersFor,save:mf453SavePreset,
 html:mf453PresetHtml,ready:mf453Ready
});
