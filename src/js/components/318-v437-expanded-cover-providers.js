/* MediaFlow v437 — credential-free cover providers for games, visual novels and music.
 * Sources without a verified, functioning cover adapter are cataloged but disabled.
 * All candidate URLs still pass the existing cover validation, matching and review rules. */
const MF437_COVER_CATALOG=[
 ['steamstore','Steam Storefront','Video games / visual novels'],
 ['libretro','Libretro Thumbnails','Retro game box art'],
 ['gametdb','GameTDB','Console game box art · permission review'],
 ['wikidata','Wikidata','Cross-media image references'],
 ['wikimedia-commons','Wikimedia Commons','Cross-media file collection'],
 ['pcgamingwiki','PCGamingWiki','PC game artwork · access review'],
 ['vndb','VNDB','Visual novel artwork'],
 ['coverartarchive','Cover Art Archive','Album / single covers'],
 ['theaudiodb','TheAudioDB','Album / artist artwork'],
 ['itunes','Apple iTunes Search','Albums / movies / books'],
 ['deezer','Deezer','Music artwork · access review'],
 ['ifdb','IFDB','Interactive fiction artwork · adapter review']
];
function mf437CoverRegister(id,name,adapter){
 const current=mf424Provider(id);
 if(current){if(current.limit&&MF424_EXTRA_COVER_ADAPTERS.has(id))return;current.limit=adapter?20:0;current.gap=adapter?2500:0;current.level=adapter?'Public metadata and cover endpoint':'Pending technical or permission verification';}
 else if(adapter)mf424RegisterCoverProvider({id,name,types:['other'],limit:20,gap:2500,credentials:false,level:'Public artwork'},adapter);
 else MF424_PROVIDER_META.push({id,name,types:['other'],limit:0,gap:0,credentials:false,level:'Pending verification'});
 if(adapter&&!MF424_EXTRA_COVER_ADAPTERS.has(id))MF424_EXTRA_COVER_ADAPTERS.set(id,adapter);
 if(adapter){
  if(!MF424_DEFAULT.enabled.includes(id))MF424_DEFAULT.enabled.push(id);
  if(!MF424_DEFAULT.priorities.includes(id))MF424_DEFAULT.priorities.push(id);
 }
}
function mf437CoverCandidate(entry,url,provider,source,id,matched){
 if(!/^https:\/\//.test(String(url||'')))return null;
 const score=mf424Match(entry,{title:matched||entry.title},Boolean(id));
 // Extra cover providers return the same candidate shape as existing v424 adapters.
 return {url,provider,title:matched||entry.title,confidence:id?1:score.confidence,
  idMatch:Boolean(id),reason:id?'Verified external identifier':'Title match; review artwork',
  recordId:String(id||''),recordUrl:source||'',externalIdKey:provider==='steamstore'?'steam':provider,externalIdValue:String(id||'')};
}
async function mf437CoverVNDB(item,{request}){
 const id=String(item.externalIds?.vndb||'').trim(),title=String(item.title||'').trim();
 const body=JSON.stringify({filters:id?['id','=',id]:['search','=',title],fields:'id,title,alttitle,image.url,image.sexual,image.violence',results:8});
 const data=await request('vndb','https://api.vndb.org/kana/vn',{body}),rows=data?.results||[];
 return rows.filter(row=>row.image?.url&&Number(row.image.sexual||0)<1.3).map(row=>{
  const matched=mf424Match(item,{title:row.title,titles:[row.alttitle]},Boolean(id&&id===row.id));
  return {...mf437CoverCandidate(item,row.image.url,'vndb','https://vndb.org/'+row.id,row.id,row.title),confidence:matched.confidence,idMatch:Boolean(id&&id===row.id)};
 }).filter(x=>x?.url);
}
async function mf437CoverITunes(item,{request}){
 const kind=mf437Kind(item),media=/album|music|song|soundtrack|single|ep\b/.test(kind)?'music':/novel|book/.test(kind)?'ebook':/movie|film|tv/.test(kind)?'movie':'all';
 const rows=(await request('itunes','https://itunes.apple.com/search?term='+encodeURIComponent(item.title)+'&media='+media+'&limit=10'))?.results||[];
 return rows.filter(row=>row.artworkUrl100||row.artworkUrl60).map(row=>{
  const name=row.collectionName||row.trackName;
  const u=String(row.artworkUrl100||row.artworkUrl60).replace(/(?:100x100|60x60)bb/,'600x600bb');
  const m=mf424Match(item,{title:name},false);
  const c=mf437CoverCandidate(item,u,'itunes',row.collectionViewUrl||row.trackViewUrl,row.collectionId||row.trackId||'',name);
  return c?{...c,confidence:m.confidence,idMatch:false,reason:'iTunes collection title search; verify edition'}:null;
 }).filter(Boolean);
}
async function mf437CoverArchive(item,{request}){
 const id=String(item.externalIds?.musicbrainz_release||item.externalIds?.musicbrainz||'').trim();
 if(!/^[0-9a-f]{8}-[0-9a-f-]{27,40}$/i.test(id))return [];
 const data=await request('coverartarchive','https://coverartarchive.org/release/'+encodeURIComponent(id));
 const rows=(data?.images||[]).filter(row=>row.front&&row.image);
 return rows.map(row=>mf437CoverCandidate(item,row.thumbnails?.['500']||row.image,'coverartarchive','https://musicbrainz.org/release/'+id,id,item.title)).filter(Boolean);
}
async function mf437CoverSteam(item){
 const id=String(item.externalIds?.steam||item.externalIds?.steam_app||'').trim();
 if(!/^\d{1,12}$/.test(id))return [];
 const url='https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/'+id+'/library_600x900.jpg';
 // Do not manufacture a cover candidate from a guessed title or an unverified URL.
 return new Promise(resolve=>{
  const image=new Image();const timer=setTimeout(()=>{image.onload=null;image.onerror=null;resolve([]);},8000);
  image.onload=()=>{clearTimeout(timer);resolve([mf437CoverCandidate(item,url,'steamstore','https://store.steampowered.com/app/'+id,id,item.title)]);};
  image.onerror=()=>{clearTimeout(timer);resolve([]);};
  image.src=url;
 });
}
async function mf437CoverAudioDB(item,{request}){
 const title=String(item.title||''),artist=String(item.artist||item.producers?.[0]||item.mediaMetadata?.artists?.[0]||'').trim();
 if(!artist||!title)return [];
 const data=await request('theaudiodb','https://www.theaudiodb.com/api/v1/json/123/searchalbum.php?s='+encodeURIComponent(artist)+'&a='+encodeURIComponent(title));
 return (data?.album||[]).filter(row=>row.strAlbumThumb).map(row=>{
  const m=mf424Match(item,{title:row.strAlbum},false);
  const c=mf437CoverCandidate(item,row.strAlbumThumb,'theaudiodb','https://www.theaudiodb.com/album/'+row.idAlbum,row.idAlbum,row.strAlbum);
  return c?{...c,confidence:m.confidence,idMatch:false}:null;
 }).filter(Boolean);
}
for(const [id,name] of MF437_COVER_CATALOG){
 const adapter={steamstore:mf437CoverSteam,vndb:mf437CoverVNDB,itunes:mf437CoverITunes,
  coverartarchive:mf437CoverArchive,theaudiodb:mf437CoverAudioDB}[id]||null;
 mf437CoverRegister(id,name,adapter);
}
// Keep options visible but never represent a registered name as a verified connection.
const mf437PreviousReadiness=mf433ReadinessMarkup;
mf433ReadinessMarkup=function(){
 return mf437PreviousReadiness()+'<details class="mf433-provider-readiness" data-mf-setting-id="cover-extended-providers"><summary><strong>Additional v437 cover sources</strong><small>Credential-free sources and those pending access or technical review</small></summary>'+
 '<div class="mf433-readiness-grid">'+MF437_COVER_CATALOG.map(([id,name])=>{
 const enabled=Boolean(mf424Provider(id)?.limit);return '<span><b>'+mf437Escape(name)+'</b> · '+(enabled?'public adapter':'not yet active')+'</span>';
 }).join('')+'</div></details>';
};
window.MediaFlowV437Covers=Object.freeze({catalog:MF437_COVER_CATALOG.map(x=>x.slice()),active:()=>MF437_COVER_CATALOG.filter(([id])=>Boolean(mf424Provider(id)?.limit)).map(x=>x[0])});
