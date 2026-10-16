/* MediaFlow v440 — Universal Cover Recovery expansion.
 * Reuses v424's queue, image validation, duplicate handling, account locks,
 * external-ID conflict safety and rate policy. New adapters do not write data.
 * The user's custom Category is NEVER used to prevent a provider search. */
const MF440_VERSION=440;
const MF440_SOURCES=[
 {id:'steam',name:'Steam Store Artwork',types:['game','visual_novel'],key:'steam_app',limit:8,gap:1900,level:'Public · storefront best effort'},
 {id:'itunes',name:'Apple iTunes Album Art',types:['music','album'],key:'apple_music_album',limit:14,gap:1600,level:'Public · albums'},
 {id:'musicbrainz',name:'MusicBrainz / Cover Art Archive',types:['music','album'],key:'musicbrainz_release_group',limit:10,gap:1900,level:'Public · curated front artwork'},
 {id:'vndb',name:'VNDB Visual Novel Covers',types:['visual_novel'],key:'vndb',limit:10,gap:2600,level:'Public · explicit imagery excluded'},
 {id:'ifdb',name:'IFDB Interactive Fiction Covers',types:['interactive_fiction'],key:'ifdb',limit:9,gap:2300,level:'Public · IFDB game covers'},
 {id:'gutendex-public',name:'Gutendex / Gutenberg Covers',types:['book','comic','reading'],key:'gutendex',limit:10,gap:1900,level:'Public · Gutenberg book art'},
 {id:'googlebooks',name:'Google Books Cover Art',types:['book','comic','reading'],key:'googlebooks',limit:8,gap:2500,level:'Public · unauthenticated quota'}
];
const MF440_ACTIVE=new Set(),MF440_REASONS=new Map();
const mf440Title=item=>String((typeof cleanTitle==='function'?cleanTitle(item?.title||''):item?.title)||'').trim().slice(0,180);
const mf440Text=(value,max=220)=>String(value??'').trim().slice(0,max);
const mf440Year=value=>Number(String(value||'').slice(0,4))||0;
const mf440StringId=(value,expression)=>{const v=mf440Text(value,110);return expression.test(v)?v:'';};
const mf440UUID=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
function mf440Id(item,provider){
 const external=item?.externalIds||{},key=MF440_SOURCES.find(p=>p.id===provider)?.key;
 const raw=external[key]||'';
 switch(provider){
 case 'steam':case 'itunes':case 'gutendex-public':return mf440StringId(raw,/^[1-9]\d{0,15}$/);
 case 'musicbrainz':return mf440StringId(raw,mf440UUID);
 case 'vndb':return mf440StringId(raw,/^v[1-9]\d{0,10}$/i);
 case 'ifdb':return mf440StringId(raw,/^[a-z0-9]{6,32}$/i);
 case 'googlebooks':return mf440StringId(raw,/^[A-Za-z0-9_-]{6,50}$/);
 }
 return '';
}
function mf440Record(item,provider,key,id,title,year,cover,link,aliases=[],exactId=false){
 id=mf440Text(id,100);title=mf440Text(title);
 if(!id||!title)return null;
 const record={id,title,titles:(Array.isArray(aliases)?aliases:[]).map(x=>mf440Text(x)).filter(Boolean),year:mf440Year(year)};
 const direct=Boolean(exactId&&mf440Id(item,provider)===id);
 const match=mf424Match(item,record,direct);
 if(match.confidence<0.35)return null;
 // The standard v424 helper also passes the candidate through the v433
 // external-ID provenance mapper; only the provider's actual record ID may
 // be linked to the selected cover, never an invented title-based ID.
 const candidate=mf424AsCandidate(record,cover,provider,direct,link,match.reason,match.confidence);
 if(!candidate)return null;
 if(key&&mf433ValidId(key,id)){
  candidate.externalIdKey=key;candidate.externalIdValue=id;candidate.recordId=id;
  candidate.externalIdCandidates=[{key,value:id,evidence:'Actual provider record',source:provider}];
 }
 return candidate;
}
function mf440Candidates(rows){
 const seen=new Set();
 return (rows||[]).filter(row=>{if(!row||seen.has(row.url))return false;seen.add(row.url);return true;}).slice(0,16);
}
async function mf440Steam(item,ops){
 const title=mf440Title(item),id=mf440Id(item,'steam');
 const q='https://store.steampowered.com/api/storesearch/?term='+encodeURIComponent(title)+'&l=english&cc=us';
 const data=await ops.request('steam',q);
 const rows=(data?.items||[]).slice(0,12),out=[];
 // Public Store Search returns actual app IDs, but only a standard artwork
 // path is derivable. v424 image validation rejects unavailable URLs.
 if(id&&!rows.some(r=>String(r.id)===id))
  rows.unshift({id:Number(id),name:title,idOnly:true});
 for(const row of rows){
  const app=mf440StringId(row.id,/^[1-9]\d{0,15}$/);
  if(!app)continue;
  const name=row.name||title;
  const stem='https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/'+app+'/';
  const link='https://store.steampowered.com/app/'+app+'/';
  const vertical=mf440Record(item,'steam','steam_app',app,name,0,stem+'library_600x900_2x.jpg',link,[],Boolean(id&&id===app));
  if(vertical)out.push(vertical);
  // Landscape storefront image remains manual-only when uncertain; v424
  // validates minimum dimensions. Prefer portrait when the provider has it.
  if(row.tiny_image&&!id){
   const cover=mf424Cover(String(row.tiny_image).replace(/^http:/,'https:'));
   const fallback=mf440Record(item,'steam','steam_app',app,name,0,cover,link,[],false);
   if(fallback){fallback.confidence=Math.min(fallback.confidence,0.75);fallback.reason+=' · storefront thumbnail';out.push(fallback);}
  }
 }
 return mf440Candidates(out);
}
async function mf440Itunes(item,ops){
 const title=mf440Title(item),id=mf440Id(item,'itunes');
 const base='https://itunes.apple.com/'+(id?'lookup?id='+id+'&entity=album':'search?term='+encodeURIComponent(title)+'&entity=album&limit=12');
 const data=await ops.request('itunes',base),results=(data?.results||[]).filter(r=>r.collectionId&&r.collectionName);
 const out=[];
 for(const row of results.slice(0,12)){
  const album=String(row.collectionId);
  const art=String(row.artworkUrl100||row.artworkUrl60||'').replace(/^http:/,'https:');
  if(!art)continue;
  const hiRes=art.replace(/\/\d+x\d+bb\.(jpg|png)(?:\?.*)?$/i,'/600x600bb.$1');
  const c=mf440Record(item,'itunes','apple_music_album',album,row.collectionName,row.releaseDate,
   hiRes,row.collectionViewUrl||'https://music.apple.com/',[],Boolean(id&&id===album));
  if(c)out.push(c);
 }
 return mf440Candidates(out);
}
async function mf440MusicBrainz(item,ops){
 const title=mf440Title(item),id=mf440Id(item,'musicbrainz'),list=[];
 if(id)list.push({id,title,'first-release-date':String(item.year||'')});
 const url='https://musicbrainz.org/ws/2/release-group/?'+new URLSearchParams({query:'releasegroup:"'+title.replace(/"/g,'')+'"',fmt:'json',limit:'6'}).toString();
 if(!id||!list.length){
  const data=await ops.request('musicbrainz',url);
  list.push(...(data?.['release-groups']||[]).slice(0,7));
 }
 const rows=[];
 for(const r of list){
  const mbid=mf440StringId(r.id,mf440UUID);
  if(!mbid)continue;
  // Cover Art Archive fronts are 307 image redirects; the current v424
  // image checker verifies the actual picture without consuming an extra
  // MusicBrainz REST request for a listing.
  const art='https://coverartarchive.org/release-group/'+mbid+'/front-500';
  const c=mf440Record(item,'musicbrainz','musicbrainz_release_group',mbid,r.title,r['first-release-date'],art,
    'https://musicbrainz.org/release-group/'+mbid,[],Boolean(id&&id===mbid));
  if(c)rows.push(c);
 }
 return mf440Candidates(rows);
}
async function mf440VNDB(item,ops){
 const title=mf440Title(item),id=mf440Id(item,'vndb');
 const request={filters:id?['id','=',id]:['search','=',title],
  fields:'title,alttitle,released,image.url,image.thumbnail,image.sexual,image.violence',results:10};
 const data=await ops.request('vndb','https://api.vndb.org/kana/vn',{body:JSON.stringify(request)});
 const out=[];
 for(const r of (data?.results||[]).slice(0,10)){
  const vid=mf440StringId(r.id,/^v[1-9]\d{0,10}$/i);
  if(!vid||!r.image?.url)continue;
  // Do not automatically surface content flagged as sexually explicit or
  // strongly violent from a visual-novel image API.
  if(Number(r.image.sexual)>0||Number(r.image.violence)>1)continue;
  const link='https://vndb.org/'+vid;
  const c=mf440Record(item,'vndb','vndb',vid,r.title,r.released,r.image.url,link,[r.alttitle],
   Boolean(id&&id.toLowerCase()===vid.toLowerCase()));
  if(c)out.push(c);
 }
 return mf440Candidates(out);
}
async function mf440IFDB(item,ops){
 const title=mf440Title(item),id=mf440Id(item,'ifdb');
 const url='https://ifdb.org/search?json&game&searchfor='+encodeURIComponent(title);
 const data=await ops.request('ifdb',url),out=[];
 for(const r of (data?.games||[]).slice(0,14)){
  const tuid=mf440StringId(r.tuid,/^[a-z0-9]{6,32}$/i);
  if(!tuid||!r.coverArtLink)continue;
  const c=mf440Record(item,'ifdb','ifdb',tuid,r.title,r.published?.machine,r.coverArtLink,
    r.link||'https://ifdb.org/viewgame?id='+tuid,[],Boolean(id&&id===tuid));
  if(c)out.push(c);
 }
 return mf440Candidates(out);
}
async function mf440Gutendex(item,ops){
 const title=mf440Title(item),id=mf440Id(item,'gutendex-public');
 const url='https://gutendex.com/books?'+(id?'ids='+encodeURIComponent(id):'search='+encodeURIComponent(title));
 const d=await ops.request('gutendex-public',url),out=[];
 for(const r of (d?.results||[]).slice(0,14)){
  const gid=mf440StringId(r.id,/^[1-9]\d{0,15}$/);
  const cover=String(r.formats?.['image/jpeg']||r.formats?.['image/png']||'').replace(/^http:/,'https:');
  if(!gid||!cover)continue;
  const c=mf440Record(item,'gutendex-public','gutendex',gid,r.title,0,cover,
   'https://www.gutenberg.org/ebooks/'+gid,[],Boolean(id&&id===gid));
  if(c)out.push(c);
 }
 return mf440Candidates(out);
}
async function mf440GoogleBooks(item,ops){
 const title=mf440Title(item),id=mf440Id(item,'googlebooks');
 const isbn=String(item?.externalIds?.isbn13||item?.externalIds?.isbn||'').replace(/[^0-9X]/gi,'');
 const q=id?'':isbn?'isbn:'+isbn:'intitle:'+title;
 const url=id?'https://www.googleapis.com/books/v1/volumes/'+encodeURIComponent(id):
  'https://www.googleapis.com/books/v1/volumes?'+new URLSearchParams({q,maxResults:'10',printType:'all'}).toString();
 const d=await ops.request('googlebooks',url),out=[];
 for(const r of (id?[d]:(d?.items||[])).slice(0,10)){
  if(!r?.id||!r.volumeInfo?.title)continue;
  const titleMatch=r.volumeInfo;
  const ids=titleMatch.industryIdentifiers||[];
  const isbnMatched=Boolean(isbn&&ids.some(row=>String(row.identifier||'').replace(/[^0-9X]/gi,'')===isbn));
  const img=String(titleMatch.imageLinks?.large||titleMatch.imageLinks?.medium||
   titleMatch.imageLinks?.small||titleMatch.imageLinks?.thumbnail||'').replace(/^http:/,'https:');
  if(!img)continue;
  const c=mf440Record(item,'googlebooks','googlebooks',String(r.id),titleMatch.title,
   titleMatch.publishedDate,img,titleMatch.infoLink||'https://books.google.com/',[],
   Boolean((id&&id===String(r.id))||isbnMatched));
  if(c)out.push(c);
 }
 return mf440Candidates(out);
}
const MF440_ADAPTERS={steam:mf440Steam,itunes:mf440Itunes,musicbrainz:mf440MusicBrainz,
 vndb:mf440VNDB,ifdb:mf440IFDB,'gutendex-public':mf440Gutendex,googlebooks:mf440GoogleBooks};
function mf440Activate(){
 for(const def of MF440_SOURCES){
  let record=mf424Provider(def.id);
  if(!record){
   mf424RegisterCoverProvider({...def,credentials:false},MF440_ADAPTERS[def.id]);
   record=mf424Provider(def.id);
  }else if(!MF424_EXTRA_COVER_ADAPTERS.has(def.id)){
   // Google Books was a configured-key placeholder. The low-quota public
   // Books lookup now has an actual keyless artwork adapter.
   record.name=def.name;record.limit=def.limit;record.gap=def.gap;
   record.types=def.types;record.credentials=false;record.level=def.level;
   MF424_EXTRA_COVER_ADAPTERS.set(def.id,MF440_ADAPTERS[def.id]);
  }
  MF440_ACTIVE.add(def.id);
 }
 // Existing users keep their exact enabled list. Fresh installs include the
 // extra free sources, but never silently enable added services in older
 // workspaces with custom quotas or preferences.
 MF424_DEFAULT.enabled=[...new Set([...MF424_DEFAULT.enabled,...MF440_SOURCES.map(x=>x.id)])];
 MF424_DEFAULT.priorities=[...new Set([...MF424_DEFAULT.priorities,...MF440_SOURCES.map(x=>x.id)])];
 for(const p of MF440_SOURCES){
  // Cover adapters are real; update the shared v438 capability directory
  // without changing registered-only metadata or ratings statuses.
  const entry=MF438_EXTRA_CATALOG.find(x=>x[0]===p.id);
  if(entry){entry[4]='public';if(!entry[3].includes('cover'))entry[3]+= ',cover';}
 }
 return MF440_ACTIVE.size;
}
mf440Activate();
// Manual API testing stays in the independent v438 Settings directory;
// all probes are fixed read-only endpoints and never activate anything else.
Object.assign(MF438_PUBLIC_PROBES,{
 steam:{url:'https://store.steampowered.com/api/storesearch/?term=portal&l=english&cc=us',
  valid:d=>Array.isArray(d?.items)},
 vndb:{url:'https://api.vndb.org/kana/vn',method:'POST',
  body:JSON.stringify({filters:['id','=','v17'],fields:'title,image.url',results:1}),
  valid:d=>Array.isArray(d?.results)},
 ifdb:{url:'https://ifdb.org/search?json&game&searchfor=Zork',
  valid:d=>Array.isArray(d?.games)},
 'gutendex-public':{url:'https://gutendex.com/books?search=frankenstein',
  valid:d=>Array.isArray(d?.results)},
 googlebooks:{url:'https://www.googleapis.com/books/v1/volumes?q=intitle%3AFrankenstein&maxResults=1',
  valid:d=>Array.isArray(d?.items)||Number(d?.totalItems)===0}
});
const mf440PriorHasId=mf424HasID;
mf424HasID=function(item,provider){
 if(MF440_ACTIVE.has(provider))return Boolean(mf440Id(item,provider));
 return mf440PriorHasId(item,provider);
};
const mf440RegistryBase=mf438Catalog;
mf438Catalog=function(){
 const rows=mf440RegistryBase.apply(this,arguments);
 for(const row of rows){
  if(!MF440_ACTIVE.has(row.id))continue;
  const p=mf424Provider(row.id);
  row.coverAdapter=Boolean(p?.limit&&MF424_EXTRA_COVER_ADAPTERS.has(row.id));
  row.coverEnabled=row.coverAdapter&&mf424Defaults().enabled.includes(row.id);
  row.state=row.coverEnabled?'cover':row.state;
  row.source='active-cover';
 }
 return rows;
};
const mf440BackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
 const out=mf440BackupBase.apply(this,arguments);
 if(out){
  out.mediaFlowVersion=MF440_VERSION;out.backupVersion=MF440_VERSION;
  const manifest=out.backupManifest||(out.backupManifest={});
  manifest.includes={...(manifest.includes||{}),v440UniversalCoverAdapters:true};
  manifest.v440={release:440,additionalActiveCoverProviders:[...MF440_ACTIVE],
   preservesPreviousCoverSettings:true,externalIdConflictsProtected:true};
 }
 return out;
};
window.MediaFlowV440=Object.freeze({
 version:440,registered:()=>[...MF440_ACTIVE],providers:()=>MF440_SOURCES.map(x=>({...x})),
 find:(item,provider)=>MF440_ADAPTERS[provider]?MF440_ADAPTERS[provider](item,{request:mf424Request}):Promise.resolve([]),
 match:mf440Record,probeId:mf440Id
});
