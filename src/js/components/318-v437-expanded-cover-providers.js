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
const MF437_COVER_NEEDS_PERMISSION=new Set(['gametdb','deezer']); // Artwork-use terms require explicit authorization.
function mf437CoverRegister(id,name,adapter){
 const permitted=Boolean(adapter)&&!MF437_COVER_NEEDS_PERMISSION.has(id);
 const current=mf424Provider(id);
 if(current){if(current.limit&&MF424_EXTRA_COVER_ADAPTERS.has(id))return;current.limit=permitted?20:0;current.gap=permitted?2500:0;current.level=permitted?'Public metadata and cover endpoint':'Pending technical or permission verification';}
 else if(adapter)mf424RegisterCoverProvider({id,name,types:['other'],limit:permitted?20:0,gap:permitted?2500:0,credentials:false,level:permitted?'Public artwork':'Permission required'},adapter);
 else MF424_PROVIDER_META.push({id,name,types:['other'],limit:0,gap:0,credentials:false,level:'Pending verification'});
 if(adapter&&!MF424_EXTRA_COVER_ADAPTERS.has(id))MF424_EXTRA_COVER_ADAPTERS.set(id,adapter);
 if(permitted){
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

async function mf437CoverIFDB(item,{request}){
 const known=String(item.externalIds?.ifdb||'').trim();
 const rows=known?[{tuid:known,title:item.title,link:'https://ifdb.org/viewgame?id='+encodeURIComponent(known),coverArtLink:'https://ifdb.org/coverart?id='+encodeURIComponent(known)}]:
  (await request('ifdb','https://ifdb.org/search?json&game&searchfor='+encodeURIComponent(item.title))).games||[];
 return rows.slice(0,8).filter(x=>x.coverArtLink).map(row=>{
  const match=mf424Match(item,{title:row.title},Boolean(known&&row.tuid===known));
  const c=mf437CoverCandidate(item,String(row.coverArtLink).replace(/^http:/,'https:'),'ifdb',row.link,row.tuid,row.title);
  return c?{...c,confidence:match.confidence,idMatch:Boolean(known&&row.tuid===known)}:null;
 }).filter(Boolean);
}
async function mf437CoverWikidata(item,{request}){
 const id=String(item.externalIds?.wikidata||'');
 if(!/^Q[1-9]\d{0,12}$/.test(id))return [];
 const raw=await request('wikidata','https://www.wikidata.org/w/api.php?action=wbgetentities&ids='+id+'&props=claims%7Clabels&languages=en&format=json&origin=*');
 const row=raw.entities?.[id],claims=row?.claims?.P18||[];
 const title=row?.labels?.en?.value||item.title;
 return claims.slice(0,5).map(x=>{
  const name=String(x.mainsnak?.datavalue?.value||'').trim();
  if(!name)return null;
  const url='https://commons.wikimedia.org/wiki/Special:FilePath/'+encodeURIComponent(name);
  const c=mf437CoverCandidate(item,url,'wikidata','https://www.wikidata.org/wiki/'+id,id,title);
  return c?{...c,confidence:1,idMatch:true,externalIdKey:'wikidata',externalIdValue:id}:null;
 }).filter(Boolean);
}
async function mf437CoverCommons(item,{request}){
 const raw=await request('wikimedia-commons','https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch='+encodeURIComponent(item.title+' cover art')+'&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url&format=json&origin=*');
 return Object.values(raw.query?.pages||{}).filter(x=>x?.imageinfo?.[0]?.url).slice(0,8).map(row=>{
  const guessed=String(row.title||'').replace(/^File:/,'').replace(/\.[^.]+$/,'').replace(/[_-]/g,' ');
  const candidate=mf437CoverCandidate(item,row.imageinfo[0].url,'wikimedia-commons','https://commons.wikimedia.org/wiki/'+encodeURIComponent(row.title||''),String(row.pageid||''),guessed);
  return candidate?{...candidate,confidence:.58,idMatch:false,reason:'Unverified Commons search result — manually confirm'}:null;
 }).filter(Boolean);
}
async function mf437CoverLibretro(item){
 const platforms=(item.mediaMetadata?.platforms||[]).map(x=>String(x).toLowerCase());
 const map={nes:'Nintendo - Nintendo Entertainment System',snes:'Nintendo - Super Nintendo Entertainment System',
  n64:'Nintendo - Nintendo 64',gba:'Nintendo - Game Boy Advance',gb:'Nintendo - Game Boy',
  gbc:'Nintendo - Game Boy Color',ps1:'Sony - PlayStation',psp:'Sony - PlayStation Portable',
  genesis:'Sega - Mega Drive - Genesis',nds:'Nintendo - Nintendo DS'};
 const known=platforms.map(x=>map[x]).find(Boolean);
 if(!known)return [];
 const name=String(item.title||'').replace(/[<>:"\/\\|?*]/g,'').trim();
 if(!name)return [];
 const url='https://raw.githubusercontent.com/libretro-thumbnails/'+encodeURIComponent(known)+'/master/Named_Boxarts/'+encodeURIComponent(name+'.png');
 return new Promise(resolve=>{
  const image=new Image(),timer=setTimeout(()=>{image.onload=null;image.onerror=null;resolve([]);},6500);
  image.onload=()=>{clearTimeout(timer);const row=mf437CoverCandidate(item,url,'libretro','https://github.com/libretro-thumbnails/libretro-thumbnails','',item.title);resolve(row?[{...row,confidence:.62,idMatch:false,reason:'Named box art found; confirm exact game edition'}]:[]);};
  image.onerror=()=>{clearTimeout(timer);resolve([]);};
  image.src=url;
 });
}


async function mf437CoverDeezer(item){
 if(typeof mf434Call!=='function'||!AUTH_USER)return [];
 try{
  if(!MF434?.status)MF434.status=await mf434Call('status');
  if(!MF434.status?.providers?.some(row=>row.id==='deezer'&&row.testable))return [];
  const response=await mf434Call('search',{provider:'deezer',title:String(item.title||'').slice(0,110),externalIds:item.externalIds||{}});
  return (response.results||[]).slice(0,8).map(row=>{
   if(!row?.url||!row?.recordId)return null;
   const c=mf437CoverCandidate(item,row.url,'deezer',row.recordUrl,row.recordId,row.title);
   if(!c)return null;
   const confirmed=String(item.externalIds?.deezer||'')===String(row.recordId);
   const match=mf424Match(item,{title:row.title},confirmed);
   return {...c,confidence:match.confidence,idMatch:confirmed};
  }).filter(Boolean);
 }catch(e){console.warn('Deezer public cover lookup unavailable:',String(e.message||e));return [];}
}
async function mf437CoverPCGamingWiki(item,{request}){
 // The public MediaWiki API remains accessible without the authenticated Cargo API.
 // A wiki thumbnail is NOT guaranteed to be official box art, so keep manual-review confidence.
 const raw=await request('pcgamingwiki','https://www.pcgamingwiki.com/w/api.php?action=query&generator=search&gsrsearch='+encodeURIComponent(item.title)+'&gsrlimit=4&prop=pageimages&pithumbsize=600&format=json&origin=*');
 return Object.values(raw?.query?.pages||{}).filter(x=>x.thumbnail?.source).slice(0,4).map(row=>{
  const c=mf437CoverCandidate(item,String(row.thumbnail.source).replace(/^http:/,'https:'),
   'pcgamingwiki','https://www.pcgamingwiki.com/wiki/'+encodeURIComponent(row.title),row.pageid,row.title);
  return c?{...c,confidence:.56,idMatch:false,reason:'PCGamingWiki thumbnail — manual review required'}:null;
 }).filter(Boolean);
}

async function mf437CoverGameTDB(item){
 const id=String(item.externalIds?.gametdb||'').trim().toUpperCase();
 if(!/^[A-Z0-9]{4,12}$/.test(id))return [];
 const platforms=(item.mediaMetadata?.platforms||[]).map(x=>String(x).toLowerCase());
 const map={'nintendo wii':'wii',wii:'wii','nintendo switch':'switch',switch:'switch',
   'playstation 2':'ps2',ps2:'ps2','playstation 3':'ps3',ps3:'ps3','nintendo ds':'ds',ds:'ds',
   'nintendo 3ds':'3ds','3ds':'3ds','wii u':'wiiu',wiiu:'wiiu'};
 const consoleName=platforms.map(x=>map[x]).find(Boolean);
 if(!consoleName)return [];
 const prefix='https://art.gametdb.com/'+consoleName+'/cover/US/'+encodeURIComponent(id);
 const urls=[prefix+'.png',prefix+'.jpg'];
 for(const url of urls){
  const loaded=await new Promise(resolve=>{const image=new Image(),timer=setTimeout(()=>resolve(false),4000);
   image.onload=()=>{clearTimeout(timer);resolve(image.naturalWidth>90&&image.naturalHeight>90);};
   image.onerror=()=>{clearTimeout(timer);resolve(false);};image.src=url;});
  if(loaded){
   const c=mf437CoverCandidate(item,url,'gametdb','https://www.gametdb.com/',id,item.title);
   return c?[{...c,confidence:.87,idMatch:true,reason:'GameTDB console artwork found for saved game serial; confirm edition'}]:[];
  }
 }
 return [];
}
for(const [id,name] of MF437_COVER_CATALOG){
 const adapter={steamstore:mf437CoverSteam,vndb:mf437CoverVNDB,itunes:mf437CoverITunes,
  coverartarchive:mf437CoverArchive,theaudiodb:mf437CoverAudioDB,ifdb:mf437CoverIFDB,
  wikidata:mf437CoverWikidata,'wikimedia-commons':mf437CoverCommons,libretro:mf437CoverLibretro,
  deezer:mf437CoverDeezer,pcgamingwiki:mf437CoverPCGamingWiki,gametdb:mf437CoverGameTDB}[id]||null;
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
