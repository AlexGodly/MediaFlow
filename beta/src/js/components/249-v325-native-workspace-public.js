/* MediaFlow v325 — real Workspace-renderer bridge for owner-published read-only pages.
 * Public pages are rendered using the same source functions as the private Workspace.
 * Never borrow the visitor's S for the owner; temporarily scoped public data is restored
 * synchronously. All executable handlers and mutations are removed from public HTML.
 */
const MF325={version:325,cache:new Map(),current:null,owner:'',native:true,busy:false,seq:0,ui:{},pending:false};
function mf325N(v,max=200){return String(v??'').slice(0,max);}
function mf325Url(v){return typeof mf323URL==='function'?mf323URL(v):'';}
function mf325Color(v){return /^#[a-f0-9]{3,8}$/i.test(String(v||''))?String(v):'#36b4d6';}
function mf325Category(c){return {id:mf325N(c.id,120),name:mf325N(c.name),color:mf325Color(c.color),icon:mf325N(c.icon,128),iconUrl:mf325Url(c.iconUrl),iconType:mf325N(c.iconType,32),type:mf325N(c.type,40),unit:mf325N(c.unit,40),target:Number(c.target)||1,enabled:c.enabled!==false};}
function mf325Title(t){return {id:mf325N(t.id,120),title:mf325N(t.title,350),categoryId:mf325N(t.categoryId,120),coverUrl:mf325Url(t.coverUrl),status:mf325N(t.status,40),priority:mf325N(t.priority,32),progress:Math.max(0,Number(t.progress)||0),total:Math.max(0,Number(t.total)||0),rating:t.rating==null?null:Number(t.rating),createdAt:Number(t.createdAt)||0,completedAt:Number(t.completedAt)||0,seasons:Array.isArray(t.seasons)?t.seasons.slice(0,150).map(x=>({name:mf325N(x.name,120),number:Number(x.number)||0,progress:Number(x.progress)||0,total:Number(x.total)||0})):[],runtimeMinutes:Number(t.runtimeMinutes)||0,year:Number(t.year)||0,genre:mf325N(t.genre,120),source:mf325N(t.source,40),tags:(Array.isArray(t.tags)?t.tags:[]).slice(0,60).map(x=>mf325N(x,100)),genres:(Array.isArray(t.genres)?t.genres:[]).slice(0,60).map(x=>mf325N(x,100)),format:mf325N(t.format,60),type:mf325N(t.type,60),releaseYear:Number(t.releaseYear)||0,notes:mf325N(t.notes,1000),description:mf325N(t.description,1500),synopsis:mf325N(t.synopsis,1500),lastViewedAt:Number(t.lastViewedAt)||0,updatedAt:Number(t.updatedAt)||0,externalIds:t.externalIds&&typeof t.externalIds==='object'?Object.fromEntries(Object.entries(t.externalIds).filter(([k,v])=>/^(mal|simkl|anilist|kitsu|tmdb|tvdb|imdb)$/i.test(k)).map(([k,v])=>[k,mf325N(v,120)])):{} };}
function mf325Session(x){return {id:mf325N(x.id,120),title:mf325N(x.title||x.entries?.[0]?.title,350),categoryId:mf325N(x.categoryId,120),assignedCategoryId:mf325N(x.assignedCategoryId,120),timestamp:Number(x.timestamp)||0,date:mf325N(x.date,20),actualAmount:Number(x.actualAmount)||0,targetAmount:Number(x.targetAmount)||0,minutes:Number(x.minutes)||0,status:mf325N(x.status,40),unit:mf325N(x.unit,30),source:mf325N(x.source,30),note:mf325N(x.note,700),healthStatus:mf325N(x.healthStatus,40),xp:Number(x.xp)||0,entries:(Array.isArray(x.entries)?x.entries:[]).slice(0,150).map(e=>({title:mf325N(e.title,300),categoryId:mf325N(e.categoryId,120),amount:Number(e.amount)||0,actualAmount:Number(e.actualAmount)||0,minutes:Number(e.minutes)||0,unit:mf325N(e.unit,30),status:mf325N(e.status,30)}))};}
function mf325Collection(c){return {id:mf325N(c.id,120),title:mf325N(c.title,220),description:mf325N(c.description,1200),coverUrl:mf325Url(c.coverUrl),titleIds:(c.titleIds||[]).slice(0,100000).map(id=>mf325N(id,120)),order:(c.order||c.titleIds||[]).slice(0,100000).map(id=>mf325N(id,120)),autoBackground:!!c.autoBackground,createdAt:Number(c.createdAt)||0,updatedAt:Number(c.updatedAt)||0,lastViewedAt:0};}
function mf325SanitizedSettings(){const s=S.settings||{},keys=['v175PageSizes','historyPageSize','v177CoverSizes','v181Library','v181CoverSizes','v274Collections','v254Overlays','v288PersonalOrder','v289PersonalOrder','v270History','v273History','v281Collections','v285Library','v287PersonalOrder','v291CategoryPicker'];const out={};for(const k of keys){if(s[k]!=null){try{out[k]=JSON.parse(JSON.stringify(s[k]));}catch(_){}}}return out;}
function mf325Meta(){return {categories:(S.categories||[]).map(mf325Category),settings:mf325SanitizedSettings(),publishedAt:Date.now()};}
async function mf325PublishPages(section,items,owner){const count=Math.max(1,Math.ceil(items.length/150));for(let p=0;p<count;p++){if(AUTH_USER?.id!==owner)throw Error('Account switched while publishing Workspace data');const {error}=await supabase.from('mf_public_workspace_v325').upsert({user_id:owner,section,page:p,items:items.slice(p*150,p*150+150),published_at:new Date().toISOString()},{onConflict:'user_id,section,page'});if(error)throw error;}const {error}=await supabase.from('mf_public_workspace_v325').delete().eq('user_id',owner).eq('section',section).gte('page',count);if(error)throw error;}
async function mf325Publish(){
 if(!AUTH_USER)return false;
 const owner=AUTH_USER.id,profile=await mfMyProfile();
 if(!profile?.is_public)return false;
 const tabs=mf323Tabs(mf323Meta(profile)),visible=id=>tabs.some(t=>t.id===id&&t.visible);
 const probe=await supabase.from('mf_public_workspace_v325').select('page').eq('user_id',owner).limit(1);
 if(probe.error)throw Error('Install SQL_v325_workspace_public_state.sql before publishing: '+probe.error.message);
 mf323Status('Publishing native Workspace data…');
 await mf325PublishPages('meta',[mf325Meta()],owner);
 const byId=new Map((S.library||[]).map(t=>[String(t.id),t]));
 const titlesFor=ids=>[...new Set((ids||[]).map(String))].map(id=>byId.get(id)).filter(Boolean).map(mf325Title);
 const order=S.orderPlan||{},col=S.collections||[],old=S.oldSystem||{};
 const assigned=col.filter(c=>(order.collectionAssignments||[]).some(a=>String(a.collectionId)===String(c.id)));
 const orderIds=[...(order.titleIds||[]),...assigned.flatMap(c=>c.titleIds||[])];
 const sectionSources={
  library:()=> (S.library||[]).map(mf325Title),
  history:()=> (S.sessions||[]).map(mf325Session),
  collections:()=>col.map(mf325Collection),
  collection_titles:()=>titlesFor(col.flatMap(c=>c.titleIds||[])),
  order:()=>[{orderPlan:{titleIds:(order.titleIds||[]).map(String),viewMode:'all',categoryMode:order.categoryMode||'default',categoryOrder:(order.categoryOrder||[]).map(String),hiddenCategories:(order.hiddenCategories||[]).map(String),collectionAssignments:(order.collectionAssignments||[]).map(a=>({collectionId:String(a.collectionId||''),categoryId:String(a.categoryId||'')}))}}],
  order_titles:()=>titlesFor(orderIds),
  order_collections:()=>assigned.map(mf325Collection),
  old:()=>[{enabledCategoryIds:(old.enabledCategoryIds||[]).map(String),balances:old.balances||{},rules:(old.rules||[]).map(x=>({id:String(x.id||''),fromCategoryId:String(x.fromCategoryId||''),toCategoryId:String(x.toCategoryId||''),fromAmount:Number(x.fromAmount)||1,toAmount:Number(x.toAmount)||1,createdAt:Number(x.createdAt)||0})),mode:'system'}],
  old_transactions:()=> (old.transactions||[]).map(t=>({id:String(t.id||''),timestamp:Number(t.timestamp)||0,type:mf325N(t.type,40),categoryId:mf325N(t.categoryId,120),amount:Number(t.amount)||0,label:mf325N(t.label,250),deltas:Array.isArray(t.deltas)?t.deltas.map(d=>({categoryId:mf325N(d.categoryId,120),delta:Number(d.delta)||0})):[]}))
 };
 const sourceTab={collection_titles:'collections',order_titles:'order',order_collections:'order',old_transactions:'old'};
 for(const [section,factory] of Object.entries(sectionSources)){
  if(AUTH_USER?.id!==owner)throw Error('Account changed during publishing');
  if(visible(sourceTab[section]||section)){
   const rows=factory();mf323Status('Publishing '+section+' ('+rows.length.toLocaleString()+' entries)…');
   await mf325PublishPages(section,rows,owner);
  }else{
   const {error}=await supabase.from('mf_public_workspace_v325').delete().eq('user_id',owner).eq('section',section);
   if(error)throw error;
  }
 }
 mf323Status('Original Workspace data published successfully.');
 return true;
}
async function mf325ReadAll(section,owner){const out=[];for(let offset=0;offset<2000;offset+=100){if(MF323.profile?.user_id!==owner)throw Error('Profile changed');const {data,error}=await supabase.from('mf_public_workspace_v325').select('items,page').eq('user_id',owner).eq('section',section).order('page',{ascending:true}).range(offset,offset+99);if(error)throw error;for(const row of data||[])out.push(...(Array.isArray(row.items)?row.items:[]));if((data||[]).length<100)break;}return out;}
async function mf325LoadState(id){
 const owner=MF323.profile.user_id;
 if(MF325.owner!==owner){MF325.cache.clear();MF325.owner=owner;MF325.ui={collectionState:{search:'',sort:'updated',dir:'desc',page:0,activeId:'',orderView:false,detailPage:0}};}
 let meta=MF325.cache.get('meta');
 if(!meta){const rows=await mf325ReadAll('meta',owner);meta=rows[0];if(!meta||!Array.isArray(meta.categories))throw Error('The owner has not yet republished their Workspace with v325.');MF325.cache.set('meta',meta);}
 const dependencies=id==='collections'?['collections','collection_titles']:
                    id==='order'?['order','order_titles','order_collections']:
                    id==='old'?['old','old_transactions']:[id];
 for(const section of dependencies)if(!MF325.cache.has(section))MF325.cache.set(section,await mf325ReadAll(section,owner));
 const order=MF325.cache.get('order')?.[0]?.orderPlan||{titleIds:[],viewMode:'all'};
 const old=MF325.cache.get('old')?.[0]||{};
 const titles=id==='library'?MF325.cache.get('library'):
              id==='collections'?MF325.cache.get('collection_titles'):
              id==='order'?MF325.cache.get('order_titles'):[];
 return {
  categories:meta.categories,library:titles||[],sessions:MF325.cache.get('history')||[],
  collections:id==='collections'?(MF325.cache.get('collections')||[]):id==='order'?(MF325.cache.get('order_collections')||[]):[],
  settings:{...DEFAULT_SETTINGS,...meta.settings},orderPlan:order,
  oldSystem:{...old,transactions:MF325.cache.get('old_transactions')||[]},
  histFilters:{category:'all',type:'all',range:'all',libCategory:'all',libStatus:'all',libPriority:'all',libSearch:'',libSort:'priority-desc'},
  histPage:0,histPageSize:50,libPage:0,view:id==='old'?'oldsystem':id,
  profileName:MF323.profile.display_name||MF323.profile.username,completionTimeline:[],xpLedger:{},activityLog:[],lastRecommendation:null
 };
}
function mf325WithState(publicState,cb){
 const orig=S,oldPersist=persistLibrary,oldSave=saveState,oldSettings=persistSettings,oldRender=render;
 const oldUi=typeof structuredClone==='function'?structuredClone(V274_UI):{...V274_UI};
 let value;
 try{
  S=publicState;
  persistLibrary=()=>Promise.resolve();persistSettings=()=>Promise.resolve();saveState=()=>Promise.resolve();render=()=>{};
  if(MF325.ui.collectionState)Object.assign(V274_UI,structuredClone(MF325.ui.collectionState));
  if(typeof v53InvalidateLibraryCache==='function')v53InvalidateLibraryCache();
  value=cb();
  MF325.ui.collectionState=structuredClone(V274_UI);
 }finally{
  S=orig;persistLibrary=oldPersist;persistSettings=oldSettings;saveState=oldSave;render=oldRender;
  Object.assign(V274_UI,oldUi);
  if(typeof v53InvalidateLibraryCache==='function')v53InvalidateLibraryCache();
 }
 return value;
}
function mf325OriginalMarkup(id,state){return mf325WithState(state,()=>{if(id==='library')return renderLibrary();if(id==='collections')return v274RenderCollectionsPage();if(id==='order')return typeof v287RenderOrder==='function'?v287RenderOrder():renderOrder();if(id==='old')return renderOldSystem();if(id==='history')return renderHistory();return '';});}
const MF325_READ_ACTIONS=new Set([
 'setLibPage','setLibraryView','v181SetLibraryMode','setLibraryFilter','setLibFilter','setLibSearch','searchLibrary','v236SearchLibraryCategories','v236ToggleLibraryCategory','v236ClearLibraryCategories','v69SetLibrarySort','v224SetLibrarySort','v230SetLibrarySort','v175SetPageSize','v188PreviewTitleTextSize','v181PreviewCoverSize','v189ToggleUnfinishedOnly',
 'setHistFilter','setHistPage','v260SetHistoryTab','v269SetYear','v269SetMonth','v269ResetViewFilters','v241SearchHistoryCategories','v241ToggleHistoryCategory','v241ClearHistoryCategories','v241SetHistoryDate','v269SetWeeksPerPage',
 'v274SetCollectionSort','v274ToggleCollectionSortDir','v274SetBrowserView','v274SetDetailView','v276CollectionSearchInput','v274SetCollectionSearch','v274SetCollectionPage','v274OpenCollection','v274BackToCollections',
 'v138SetOrderView','v138OrderSearch','v138SetOrderPage','v175SetOrderPageSize','v181PreviewCoverSize','v140OrderSetFilter','v224OrderToggleSortDirection','v288SetQueueView','v289PreviewQueueCoverScale','v237SearchCategoryFilter','v237ToggleCategoryFilter','v237ClearCategoryFilter',
 'v153SetOldSystemMode','v153ToggleOldSystemCategory'
]);
function mf325Action(attr){const src=String(attr||'').trim().replace(/^event\.(?:preventDefault|stopPropagation)\(\);\s*/g,'').replace(/;\s*$/,'');const m=src.match(/^App\.([A-Za-z]\w*)\((.*)\)$/s);if(!m||!MF325_READ_ACTIONS.has(m[1]))return null;const args=[],raw=m[2].trim();if(raw){const tokens=raw.match(/(?:'[^'\\]*(?:\\.[^'\\]*)*'|"[^"\\]*(?:\\.[^"\\]*)*"|this\.value|this\.checked|this|true|false|\d+)(?:\s*,\s*|$)/g)||[];if(tokens.join('').replace(/\s+/g,'')!==raw.replace(/\s+/g,''))return null;for(const item of tokens){const token=item.replace(/,\s*$/,'').trim();if(token==='this.value')args.push('$value');else if(token==='this.checked')args.push('$checked');else if(token==='this')args.push('$element');else if(token==='true'||token==='false')args.push(token==='true');else if(/^\d+$/.test(token))args.push(Number(token));else if(token.startsWith("'")||token.startsWith('"'))args.push(token.slice(1,-1));else return null;}}return {method:m[1],args};}
function mf325SafeDom(html,id){const template=document.createElement('template');template.innerHTML=String(html||'');template.content.querySelectorAll('script,iframe,object,embed,style,link,form,textarea,[contenteditable],canvas,video,audio').forEach(el=>el.remove());template.content.querySelectorAll('*').forEach(el=>{if(['BUTTON','INPUT','SELECT'].includes(el.tagName)){let action=mf325Action(el.getAttribute('oninput'))||mf325Action(el.getAttribute('onchange'))||mf325Action(el.getAttribute('onclick'));if(action){el.dataset.mf325Action=action.method;el.dataset.mf325Args=JSON.stringify(action.args);if(el.tagName==='INPUT'&&el.type==='file'){el.remove();return;}}else{if(el.tagName==='BUTTON'){const label=el.textContent?.trim()||'';const handler=(el.getAttribute('onclick')||'').toLowerCase();if(/^(edit|delete|add|remove|clear|log|import|export|select visible|select all|deselect all|fix completed|reset|save|create|batch|unsend)/i.test(label)||/(delete|edit|add|clear|create|import|export|selectall|deselectall|batch|fixselected|openlibrarymodal)/i.test(handler)){el.remove();return;}const passive=document.createElement('span');passive.className=el.className;passive.innerHTML=el.innerHTML;for(const key of ['style','title','aria-label'])if(el.hasAttribute(key))passive.setAttribute(key,el.getAttribute(key));passive.classList.add('mf325-passive');el.replaceWith(passive);return;}if(el.tagName==='INPUT'||el.tagName==='SELECT'){el.remove();return;}}}for(const a of [...el.attributes]){const k=a.name.toLowerCase(),v=a.value.trim();if(k.startsWith('on')||(k.startsWith('data-')&&k.endsWith('-action')&&k!=='data-mf325-action')||['contenteditable','formaction','srcdoc','href','action','srcset','xlink:href'].includes(k))el.removeAttribute(a.name);if(k==='src'&&!/^https:\/\//i.test(v))el.removeAttribute(a.name);if(k==='style'&&/(?:url\s*\(|expression\s*\(|@import)/i.test(v))el.removeAttribute(a.name);}});return template.innerHTML;}
function mf325ViewRender(id,host,focus){const html=mf325SafeDom(mf325OriginalMarkup(id,MF325.current),id);host.querySelector('.mf325-native-page').innerHTML=html;if(focus){const same=Array.from(host.querySelectorAll('[data-mf325-action]')).filter(x=>x.dataset.mf325Action===focus.action);const input=same[focus.index];if(input){input.focus({preventScroll:true});try{input.setSelectionRange(focus.start,focus.end);}catch(_){}}}}
function mf325Interaction(ev){const root=ev.currentTarget;if(ev.target.closest?.('.mf325-refresh'))return;const el=ev.target.closest?.('[data-mf325-action]');if(!el){ev.stopPropagation();}if(!el&&ev.type==='click'&&MF325.current){const row=ev.target.closest?.('[data-library-id],.mf274-item-row,.v138-order-item');const id=row?.getAttribute('data-library-id');const t=id?MF325.current.library?.find(x=>String(x.id)===id):null;if(t&&typeof mf324OpenDetails==='function'){MF324.detailsMap.set('mf325-readonly',t);mf324OpenDetails('mf325-readonly');}return;}if(!el||!root.contains(el)||!MF325.current)return;const kind=el.tagName==='INPUT'?(el.type==='checkbox'||el.type==='radio'?'change':'input'):el.tagName==='SELECT'?'change':'click';if(ev.type!==kind)return;ev.preventDefault();ev.stopPropagation();const method=el.dataset.mf325Action;let args=[];try{args=JSON.parse(el.dataset.mf325Args||'[]');}catch(_){return;}if(!MF325_READ_ACTIONS.has(method)||typeof App[method]!=='function')return;args=args.map(x=>x==='$value'?el.value:x==='$checked'?el.checked:x==='$element'?el:x);const id=MF323.selected;const selector='[data-mf325-action]',matches=Array.from(root.querySelectorAll(selector)).filter(x=>x.dataset.mf325Action===method);const focus=(ev.type==='input')?{action:method,index:matches.indexOf(el),start:el.selectionStart,end:el.selectionEnd}:null;try{mf325WithState(MF325.current,()=>App[method](...args));if(!root.isConnected)return;mf325ViewRender(id,root,focus);}catch(e){console.warn('Public read-only control unavailable',method,e);}}
async function mf325LoadTab(){const host=document.getElementById('mf323-tab-body');if(!host||!MF323.profile||!MF323.selected)return;const id=MF323.selected,owner=MF323.profile.user_id,seq=++MF323.seq;if(id==='statistics')return mf324LoadTab();host.innerHTML='<div class="mf324-loading" role="status">Loading original Workspace '+mf323E(MF323.labels[id]||id)+'…</div>';try{const state=await mf325LoadState(id);if(seq!==MF323.seq||owner!==MF323.profile.user_id)return;MF325.current=state;let content=mf325OriginalMarkup(id,state);content=mf325SafeDom(content,id);host.innerHTML='<div class="mf325-native" data-public-workspace="'+mf323E(id)+'"><div class="mf325-public-notice"><span>Viewing '+mf323E(MF323.profile.display_name||MF323.profile.username)+'’s Workspace</span><strong>Read only · Last published '+new Date(MF325.cache.get('meta').publishedAt).toLocaleString()+'</strong><button type="button" class="mf325-refresh" onclick="MF325.refresh()">Refresh published view</button></div><div class="mf325-native-page">'+content+'</div></div>'; const nativeRoot=host.querySelector('.mf325-native');for(const name of ['click','change','input'])nativeRoot.addEventListener(name,mf325Interaction,true); }catch(e){if(seq!==MF323.seq)return;host.innerHTML='<div class="mf323-error" role="alert">'+mf323E(e.message||e)+'<p>For profiles not yet republished in v325, the earlier public page can still be viewed.</p><button type="button" onclick="MF325.previous()">Open previous public view</button></div>';}}
const mf325PriorPublish=mf323Publish;mf323Publish=async function(){const ok=await mf325PriorPublish();if(!ok)return false;try{return await mf325Publish();}catch(e){mf323Status('v325 publication error: '+e.message);mfNotice('v325 publication failed: '+e.message);return false;}};
const mf325PriorLoad=mf323LoadTab;mf323LoadTab=mf325LoadTab;
MF323.publish=mf323Publish;
MF325.previous=()=>mf325PriorLoad();
MF325.refresh=()=>{MF325.cache.clear();mf325LoadTab();};
MF325.publish=mf325Publish;
window.MF325=MF325;
window.MediaFlowCommunity={...(window.MediaFlowCommunity||{}),version:325,nativeWorkspacePublicTabs:true};
