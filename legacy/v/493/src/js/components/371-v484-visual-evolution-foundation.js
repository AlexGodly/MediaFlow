/* MediaFlow v484 — Visual Evolution I.
 * Opt-in three-mode generation; real cover sampling; saved custom profiles;
 * lightweight shared Living Themes renderer. Legacy is behavior-identical.
 */
const MF484_VERSION=484;
const MF484_DEFAULT={
 mode:'legacy',expressiveness:'balanced',
 living:{mode:'off',intensity:'balanced',source:'intelligent',performance:'auto',
   effects:{gradients:true,lighting:true,particles:true,depth:true,materials:true,textures:true,organic:true,transitions:true}},
 active:'initial',
 profiles:[{id:'initial',name:'My Living Theme',source:'manual',imageUrl:'',
   colors:['#131B36','#A44BE1','#27C7D6','#F3BE76'],appearance:'dark',variation:'cinematic'}]
};
DEFAULT_SETTINGS.v484Visual=JSON.parse(JSON.stringify(MF484_DEFAULT));
const MF484_CACHE=new Map();
let MF484_CUSTOM_SEQ=0;
function mf484Hex(x,fallback='#8B5CF6'){
 const s=String(x||'').trim().toUpperCase();
 return /^#[0-9A-F]{6}$/.test(s)?s:fallback;
}
function mf484ImageUrl(x){
 const s=String(x||'').trim();
 return s.length<=2000&&/^https?:\/\/[^\s"'<>]+$/i.test(s)?s:'';
}
function mf484Clean(input){
 const v=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
 const d=MF484_DEFAULT;
 const living=v.living&&typeof v.living==='object'?v.living:{};
 const effectKeys=Object.keys(d.living.effects);
 const effects={};
 for(const k of effectKeys)effects[k]=living.effects?.[k]!==false;
 const profiles=(Array.isArray(v.profiles)?v.profiles:[]).slice(0,24).filter(x=>x&&typeof x==='object').map((x,i)=>({
  id:String(x.id||'custom-'+i).slice(0,90),
  name:String(x.name||'Untitled Theme').slice(0,80),
  source:['manual','image','hybrid'].includes(x.source)?x.source:'manual',
  imageUrl:mf484ImageUrl(x.imageUrl),
  colors:Array.from({length:4},(_,j)=>mf484Hex(x.colors?.[j],d.profiles[0].colors[j])),
  appearance:['light','dark'].includes(x.appearance)?x.appearance:'dark',
  variation:['cinematic','ethereal','futuristic','artistic'].includes(x.variation)?x.variation:'cinematic'
 }));
 if(!profiles.length)profiles.push(JSON.parse(JSON.stringify(d.profiles[0])));
 return {
  mode:['legacy','advanced','custom'].includes(v.mode)?v.mode:'legacy',
  expressiveness:['subtle','balanced','vivid'].includes(v.expressiveness)?v.expressiveness:'balanced',
  living:{
   mode:['off','basic','advanced'].includes(living.mode)?living.mode:'off',
   intensity:['subtle','balanced','vivid'].includes(living.intensity)?living.intensity:'balanced',
   source:['intelligent','custom'].includes(living.source)?living.source:'intelligent',
   performance:['auto','optimized','full'].includes(living.performance)?living.performance:'auto',
   effects
  },
  active:profiles.some(x=>x.id===v.active)?v.active:profiles[0].id,
  profiles
 };
}
function mf484Prefs(){return mf484Clean(S.settings?.v484Visual);}
function mf484Store(next){
 S.settings=S.settings||{};
 S.settings.v484Visual=mf484Clean(next);
 persistSettings();
 return S.settings.v484Visual;
}
function mf484ActiveProfile(prefs=mf484Prefs()){
 return prefs.profiles.find(x=>x.id===prefs.active)||prefs.profiles[0];
}
function mf484Rgb(hex){return v146RgbFromHex(mf484Hex(hex));}
function mf484ColorDistance(a,b){
 const x=mf484Rgb(a),y=mf484Rgb(b);
 return Math.hypot(x.r-y.r,x.g-y.g,x.b-y.b);
}
function mf484Analyze(url){
 const u=mf484ImageUrl(url);
 if(!u)return Promise.resolve(null);
 if(MF484_CACHE.has(u))return MF484_CACHE.get(u);
 const promise=new Promise(resolve=>{
  const image=new Image();image.crossOrigin='anonymous';
  let finished=false;
  const finish=x=>{if(finished)return;finished=true;clearTimeout(timer);resolve(x);};
  const timer=setTimeout(()=>finish(null),8500);
  image.onerror=()=>finish(null);
  image.onload=()=>{
   try{
    const canvas=document.createElement('canvas');canvas.width=64;canvas.height=88;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    if(!ctx)return finish(null);
    ctx.drawImage(image,0,0,64,88);
    const pixels=ctx.getImageData(0,0,64,88).data;
    const buckets=new Map();let luminance=0,n=0;
    for(let i=0;i<pixels.length;i+=16){
     if(pixels[i+3]<190)continue;
     const r=pixels[i],g=pixels[i+1],b=pixels[i+2];
     const hsl=v145RgbToHsl(r,g,b);
     const l=(r*.2126+g*.7152+b*.0722)/255;
     const center=1-Math.abs((Math.floor(i/4)%64)-31.5)/64;
     const salience=(.45+hsl.s/100*1.4)*(1+center*.35)*(.7+Math.min(l,1-l));
     const key=[r,g,b].map(c=>Math.round(c/28)).join(':');
     const old=buckets.get(key)||{r:0,g:0,b:0,n:0,weight:0};
     old.r+=r;old.g+=g;old.b+=b;old.n++;old.weight+=salience;
     buckets.set(key,old);luminance+=l;n++;
    }
    const rows=[...buckets.values()].filter(b=>b.n>=2).map(b=>({
      hex:v145RgbHex(b.r/b.n,b.g/b.n,b.b/b.n),
      score:b.weight*Math.pow(b.n,.45),count:b.n
    })).sort((a,b)=>b.score-a.score).slice(0,45);
    if(!rows.length)return finish(null);
    const chosen=[rows[0]];
    while(chosen.length<3){
      const remaining=rows.filter(r=>!chosen.includes(r));
      if(!remaining.length)break;
      remaining.sort((a,b)=>{
       const score=r=>r.score*(.35+Math.min(...chosen.map(c=>mf484ColorDistance(r.hex,c.hex)))/110);
       return score(b)-score(a);
      });
      if(Math.min(...chosen.map(c=>mf484ColorDistance(remaining[0].hex,c.hex)))<35)break;
      chosen.push(remaining[0]);
    }
    const colors=chosen.map(x=>x.hex);
    while(colors.length<3)colors.push(colors[colors.length-1]);
    finish({colors,naturalMode:n&&luminance/n>.62?'light':'dark',
     averageLuminance:n?luminance/n:.35,derived:false,visualCoverUrl:u,intelligent:true});
   }catch(_){finish(null);}
  };
  try{image.src=u;}catch(_){finish(null);}
 });
 MF484_CACHE.set(u,promise);
 // A failed cross-origin read must be retryable, not a permanent failure.
 promise.then(value=>{if(!value)MF484_CACHE.delete(u);});
 if(MF484_CACHE.size>120)MF484_CACHE.delete(MF484_CACHE.keys().next().value);
 return promise;
}
const mf484LegacyExtract=v160ExtractCoverTheme;
v160ExtractCoverTheme=function(url){
 if(mf484Prefs().mode!=='advanced')return mf484LegacyExtract(url);
 return mf484Analyze(url).then(data=>data||mf484LegacyExtract(url));
};
function mf484Compose(data,appearance,expressiveness='balanced'){
 if(!data?.colors?.length)return null;
 const raw=data.colors.map((x,i)=>mf484Hex(x,i?'#4369A7':'#9D57D6'));
 const base=v159CoverPalette({colors:raw,naturalMode:data.naturalMode},appearance);
 if(!base)return null;
 const light=appearance==='light';
 const strength=expressiveness==='subtle'?.71:expressiveness==='vivid'?1.12:1;
 const tone=(c,s,l)=>{
  const rgb=mf484Rgb(c),h=v145RgbToHsl(rgb.r,rgb.g,rgb.b);
  return v146HslHex(h.h,Math.min(92,Math.max(8,h.s*s)),l);
 };
 base.primary=tone(raw[0],Math.max(.9,strength),light?39:62);
 base.secondary=tone(raw[1],strength,light?43:61);
 base.tertiary=tone(raw[2],strength,light?44:62);
 base.flow=base.primary;
 base.flowDim=v145MixHex(base.primary,light?'#E0E5F0':'#192033',.40);
 const neutral=light?'#F4F5FB':'#080A13';
 const neutralPanel=light?'#FFFFFF':'#121524';
 base.bg=v145MixHex(raw[0],neutral,light?.065:.13);
 base.panel=v145MixHex(raw[1],neutralPanel,light?.035:.07);
 base.raised=v145MixHex(raw[2],light?'#E9EBF5':'#1D2030',light?.07:.12);
 base.border=v145MixHex(base.secondary,light?'#CDD1DC':'#384052',light?.24:.26);
 base.borderSoft=v145MixHex(base.tertiary,light?'#E1E3EB':'#242C3B',light?.12:.16);
 base.text=light?'#141822':'#F7F7FC';
 base.textDim=light?'#3B4353':'#D0D4E0';
 base.textMute=light?'#626B7D':'#9BA5B9';
 base.naturalMode=data.naturalMode;
 return base;
}
const mf484LegacySoftPalette=v162SoftPalette;
v162SoftPalette=function(data,appearance){
 if(mf484Prefs().mode!=='advanced')return mf484LegacySoftPalette(data,appearance);
 const p=mf484Compose(data,appearance,mf484Prefs().expressiveness);
 return p||mf484LegacySoftPalette(data,appearance);
};
function mf484Clear(){
 const root=document.documentElement;
 root.removeAttribute('data-mf484-mode');root.removeAttribute('data-mf484-living');
 root.removeAttribute('data-mf484-intensity');root.removeAttribute('data-mf484-motion');
 root.removeAttribute('data-mf484-transitions');
 for(const key of ['--mf484-a','--mf484-b','--mf484-c','--mf484-glow','--mf484-photo'])root.style.removeProperty(key);
 const node=document.getElementById('mf484-atmosphere');if(node)node.remove();
}
function mf484AllowMotion(living){
 if(living.mode==='off')return false;
 if(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)return false;
 if(living.performance!=='full'&&navigator.connection?.saveData)return false;
 return document.visibilityState!=='hidden';
}
function mf484ApplyAtmosphere(palette,imageUrl){
 const prefs=mf484Prefs(),live=prefs.living,root=document.documentElement;
 if(prefs.mode==='legacy'&&live.mode==='off'){mf484Clear();return;}
 root.dataset.mf484Mode=prefs.mode;
 const enabled=live.mode!=='off';
 root.dataset.mf484Living=enabled?live.mode:'off';
 root.dataset.mf484Intensity=live.intensity;
 root.dataset.mf484Motion=mf484AllowMotion(live)?'on':'off';
 const a=palette?.primary||palette?.flow||'#9F62E8';
 const b=palette?.secondary||palette?.flowDim||'#31BED1';
 const c=palette?.tertiary||a;
 root.style.setProperty('--mf484-a',a);
 root.style.setProperty('--mf484-b',b);
 root.style.setProperty('--mf484-c',c);
 root.style.setProperty('--mf484-glow',a);
 const photo=mf484ImageUrl(imageUrl);
 if(prefs.mode==='custom'&&photo)root.style.setProperty('--mf484-photo',v160CssUrl(photo));
 else root.style.removeProperty('--mf484-photo');
 let host=document.getElementById('mf484-atmosphere');
 if(!host){host=document.createElement('div');host.id='mf484-atmosphere';host.setAttribute('aria-hidden','true');document.body.insertBefore(host,document.body.firstChild);}
 // Intelligent effects are selective: artwork warmth, chroma, contrast
 // and brightness influence which atmosphere families are appropriate.
 const sample=[a,b,c].map(hex=>{
  const rgb=mf484Rgb(hex),hsl=v145RgbToHsl(rgb.r,rgb.g,rgb.b);
  return {l:hsl.l/100,s:hsl.s/100,h:hsl.h};
 });
 const vivid=sample.reduce((sum,x)=>sum+x.s,0)/sample.length;
 const luminous=sample.reduce((sum,x)=>sum+x.l,0)/sample.length;
 const contrast=Math.max(...sample.map(x=>x.l))-Math.min(...sample.map(x=>x.l));
 const coverAware=live.source!=='custom';
 const preferred=new Set(['gradients','lighting','transitions']);
 if(!coverAware){Object.keys(live.effects).forEach(k=>preferred.add(k));}
 else{
  if(vivid>.31)preferred.add('materials');
  if(vivid>.50&&contrast>.09)preferred.add('particles');
  if(luminous<.57||contrast>.20)preferred.add('depth');
  if(vivid<.46||luminous<.35)preferred.add('textures');
  if(vivid>.22&&vivid<.76)preferred.add('organic');
 }
 const allowed=(k)=>enabled&&live.effects[k]&&preferred.has(k)&&
  (live.mode==='advanced'||['gradients','lighting','transitions'].includes(k))&&
  (live.performance!=='optimized'||!['particles','organic','depth'].includes(k));
 host.innerHTML=['gradients','lighting','particles','depth','materials','textures','organic'].filter(allowed).map(k=>'<i class="mf484-fx mf484-fx-'+k+'"></i>').join('');
 root.dataset.mf484Transitions=allowed('transitions')?'on':'off';
}
const mf484LegacyApplyFull=v146ApplyFullPalette;
v146ApplyFullPalette=function(palette,source){
 const result=mf484LegacyApplyFull.apply(this,arguments);
 if(mf484Prefs().mode!=='legacy'||mf484Prefs().living.mode!=='off')
   mf484ApplyAtmosphere(palette,source?.source==='custom'?source.url:'');
 return result;
};
function mf484CustomPalette(profile,colors,sampled=null){
 const source={colors:colors.slice(0,3),naturalMode:profile.appearance,
  analysis:sampled?.analysis,atmosphereHints:sampled?.atmosphereHints,
  visualCoverUrl:sampled?.visualCoverUrl};
 const prefs=mf484Prefs();
 const p=mf484Compose(source,profile.appearance,prefs.expressiveness);
 if(!p)return null;
 if(profile.variation==='ethereal'){
  p.bg=v145MixHex(p.bg,profile.appearance==='light'?'#F9F0FF':'#18122F',.58);
 }else if(profile.variation==='futuristic'){
  p.border=v145MixHex(p.secondary,p.border,.48);
 }else if(profile.variation==='artistic'){
  p.bg=v145MixHex(p.bg,p.tertiary,.79);
 }
 return p;
}
async function mf484ApplyCustom(){
 const seq=++MF484_CUSTOM_SEQ;
 const prefs=mf484Prefs();
 if(prefs.mode!=='custom')return;
 const profile=mf484ActiveProfile(prefs);
 let colors=profile.colors.slice();
 let sampled=null;
 if(profile.source!=='manual'&&profile.imageUrl){
  sampled=await mf484Analyze(profile.imageUrl);
  if(seq!==MF484_CUSTOM_SEQ||mf484Prefs().mode!=='custom')return;
  if(sampled){
   colors=profile.source==='image'?[...sampled.colors,profile.colors[3]]:[profile.colors[0],sampled.colors[0],sampled.colors[1],profile.colors[3]];
  }
 }
 const palette=mf484CustomPalette(profile,colors,sampled);
 if(!palette)return;
 const root=document.documentElement;
 v146ApplyFullPalette(palette,{source:'custom',label:profile.name,url:''});
 // A Custom profile never uses the current title or a rotating cover.
 root.dataset.mf484Mode='custom';
 mf484ApplyAtmosphere(palette,profile.imageUrl);
}
// Preserve Custom's cover independence even if an older theme/appearance
// handler clears the dynamic accent while navigating or changing pages.
const mf484LegacyClearDynamic=v145ClearDynamicAccent;
v145ClearDynamicAccent=function(){
 if(mf484Prefs().mode==='custom'){mf484ApplyCustom();return;}
 return mf484LegacyClearDynamic.apply(this,arguments);
};
const mf484LegacyRefresh=v146RefreshDynamicTheme;
v146RefreshDynamicTheme=async function(){
 if(mf484Prefs().mode==='custom'){await mf484ApplyCustom();return;}
 return mf484LegacyRefresh.apply(this,arguments);
};
function mf484Sync(){
 const prefs=mf484Prefs();
 if(prefs.mode==='custom'){mf484ApplyCustom();return;}
 ++MF484_CUSTOM_SEQ;
 if(prefs.mode==='advanced'&&S.settings?.dynamicCoverTheme){v146ScheduleDynamicTheme();return;}
 if(prefs.mode==='legacy'&&S.settings?.dynamicCoverTheme){v146ScheduleDynamicTheme();return;}
 if(prefs.living.mode==='off')mf484Clear();
 else {
  const p=S.v146DynamicThemeState?.palette;
  mf484ApplyAtmosphere(p||{primary:getComputedStyle(document.documentElement).getPropertyValue('--flow').trim()},'');
 }
}
function mf484SetMode(mode){
 if(!['legacy','advanced','custom'].includes(mode))return;
 const p=mf484Prefs();p.mode=mode;
 mf484Store(p);
 if(mode!=='custom'){
  // Cancel obsolete custom image requests and remove custom-only vars before
  // allowing the existing cover/static collection engine to resume.
  ++MF484_CUSTOM_SEQ;
  v146ClearInlineThemeVars();
  v145ApplyThemeBase(S.settings?.theme||'dark');
 }
 mf484Sync();
 try{v365PatchSettings();}catch(_){}
}
function mf484SetOption(key,value){
 const p=mf484Prefs();
 if(key==='expressiveness'&&['subtle','balanced','vivid'].includes(value))p.expressiveness=value;
 else if(key==='living.mode'&&['off','basic','advanced'].includes(value))p.living.mode=value;
 else if(key==='living.intensity'&&['subtle','balanced','vivid'].includes(value))p.living.intensity=value;
 else if(key==='living.performance'&&['auto','optimized','full'].includes(value))p.living.performance=value;
 else if(key==='living.source'&&['intelligent','custom'].includes(value))p.living.source=value;
 else if(key.startsWith('effect.')&&Object.prototype.hasOwnProperty.call(p.living.effects,key.slice(7)))
  p.living.effects[key.slice(7)]=value===true||value==='true';
 else return;
 mf484Store(p);
 mf484Sync();
}
function mf484SelectHtml(value,options,action){
 return '<select onchange="'+action+'">'+options.map(o=>'<option value="'+o[0]+'"'+(value===o[0]?' selected':'')+'>'+o[1]+'</option>').join('')+'</select>';
}
function mf484SettingsHtml(){
 const p=mf484Prefs();
 const mode=mf484SelectHtml(p.mode,[['legacy','Legacy — Original MediaFlow'],['advanced',"Advanced — Alex Godly's Cover Intelligence Engine"],['custom',"Custom — Alex Godly's Theme Studio"]],'App.mf484SetMode(this.value)');
 const animation=mf484SelectHtml(p.living.mode,[['off','Off'],['basic','Basic'],['advanced','Advanced']],'App.mf484SetOption("living.mode",this.value)');
 const intensity=mf484SelectHtml(p.living.intensity,[['subtle','Subtle'],['balanced','Balanced'],['vivid','Vivid']],'App.mf484SetOption("living.intensity",this.value)');
 return '<div class="mf484-panel"><div class="mf484-intro"><span>VISUAL EVOLUTION</span><strong>Make MediaFlow a living artwork.</strong><p>Legacy stays untouched until you choose a new mode. Advanced intelligently follows the current cover; Custom is entirely yours.</p></div>'+
 '<div class="mf484-fields"><label class="field"><span class="field-label">Theme generation</span>'+mode+'</label>'+
 '<label class="field"><span class="field-label">Visual expressiveness</span>'+mf484SelectHtml(p.expressiveness,[['subtle','Subtle'],['balanced','Balanced'],['vivid','Vivid']],'App.mf484SetOption("expressiveness",this.value)')+'</label>'+
 '<label class="field"><span class="field-label">Living Themes atmosphere</span>'+animation+'</label>'+
 '<label class="field"><span class="field-label">Atmosphere intensity</span>'+intensity+'</label></div>'+
 '<div class="mf484-actions"><button type="button" class="btn btn-primary" onclick="App.mf484OpenStudio()">Open Theme & Atmosphere Studio</button>'+
 '<small>Original Theme Collections, cover rotations and the old custom-color controls remain available.</small></div></div>';
}
function mf484MountSettings(){
 if(String(S.view)!=='settings'||!window.MediaFlowSettingsCenter?.mountSection)return;
 if(document.querySelector('.mf484-panel'))return;
 const node=document.createElement('div');node.innerHTML=mf484SettingsHtml();
 window.MediaFlowSettingsCenter.mountSection({
  id:'mf484-visual-evolution',title:'Theme Intelligence & Living Atmospheres',
  category:'appearance',subgroup:'Theme Studio',
  keywords:['legacy','advanced','custom','cover intelligence','living themes','motion','animation','palette','image url','particles','gradients'],
  nodes:[node]
 });
}
function mf484StudioHtml(){
 const p=mf484Prefs(),profile=mf484ActiveProfile(p),fx=p.living.effects;
 const field=(id,label,val,type='text')=>'<label class="field"><span class="field-label">'+label+'</span><input id="'+id+'" type="'+type+'" value="'+escapeHtml(String(val))+'"></label>';
 const select=(id,label,value,choices)=>'<label class="field"><span class="field-label">'+label+'</span><select id="'+id+'">'+choices.map(x=>'<option value="'+x[0]+'"'+(x[0]===value?' selected':'')+'>'+x[1]+'</option>').join('')+'</select></label>';
 const swatch=profile.colors.map((c,i)=>field('mf484-color-'+i,['Base','Primary','Secondary','Highlight'][i],c,'color')).join('');
 const check=Object.keys(fx).map(k=>'<label class="mf484-check"><input data-mf484-effect="'+k+'" type="checkbox" '+(fx[k]?'checked':'')+'><span>'+k[0].toUpperCase()+k.slice(1)+'</span></label>').join('');
 return '<div class="mf484-studio-shell"><div class="mf484-studio-head"><div><small>VISUAL ATMOSPHERE STUDIO</small><h2>Alex Godly’s Theme Studio</h2><p>Build expressive custom themes and shape how MediaFlow moves.</p></div><button type="button" class="btn btn-ghost" aria-label="Close Theme Studio" onclick="App.mf484CloseStudio()">✕</button></div>'+
 '<div class="mf484-studio-body"><section class="mf484-studio-config">'+
 '<div class="mf484-profilebar"><label class="field"><span class="field-label">Saved theme profile</span>'+
 '<select id="mf484-profile-select" onchange="App.mf484SelectProfile(this.value)">'+p.profiles.map(x=>'<option value="'+escapeHtml(x.id)+'" '+(p.active===x.id?'selected':'')+'>'+escapeHtml(x.name)+'</option>').join('')+'</select></label>'+
 '<button type="button" class="btn btn-ghost" onclick="App.mf484DuplicateProfile()">Duplicate</button><button type="button" class="btn btn-ghost" onclick="App.mf484DeleteProfile()">Delete</button></div>'+
 '<h3>Theme identity</h3>'+field('mf484-name','Theme name',profile.name)+
 '<div class="mf484-fields">'+select('mf484-source','Theme source',profile.source,[['manual','My colors'],['image','My image URL'],['hybrid','Image + my colors']])+
 select('mf484-appearance','Appearance',profile.appearance,[['dark','Dark'],['light','Light']])+'</div>'+
 field('mf484-image','Custom image URL (optional)',profile.imageUrl,'url')+
 '<div class="mf484-colors">'+swatch+'</div>'+
 select('mf484-variation','Composition',profile.variation,[['cinematic','Cinematic'],['ethereal','Ethereal'],['futuristic','Futuristic'],['artistic','Artistic']])+
 '<h3>Living themes</h3><div class="mf484-fields">'+
 select('mf484-motion','Atmosphere',p.living.mode,[['off','Off'],['basic','Basic'],['advanced','Advanced']])+
 select('mf484-intensity','Intensity',p.living.intensity,[['subtle','Subtle'],['balanced','Balanced'],['vivid','Vivid']])+
 select('mf484-performance','Performance',p.living.performance,[['auto','Auto'],['optimized','Optimized'],['full','Full']])+
 select('mf484-selection','Effects',p.living.source,[['intelligent','Intelligent'],['custom','My selection']])+'</div>'+
 '<div class="mf484-checks">'+check+'</div>'+
 '<p class="mf484-help">The engine combines enabled effects selectively; heavy effects are simplified on mobile or in Optimized mode. Reduced-motion preferences always take priority.</p>'+
 '</section><section class="mf484-studio-preview"><div class="mf484-preview" id="mf484-preview">'+
 '<div class="mf484-preview-nav"><span>MEDIAFLOW</span><span>Dashboard &nbsp; Library &nbsp; Collections</span></div>'+
 '<div class="mf484-preview-card"><small>NOW IN YOUR LIBRARY</small><h3>Your next story awaits.</h3><p>Custom atmosphere, rich surfaces and cover-inspired color harmony.</p><button type="button" disabled>Preview Action</button></div>'+
 '</div><div class="mf484-preview-help">Live color composition preview. Choose Custom mode to apply your saved theme across MediaFlow.</div></section></div>'+
 '<div class="mf484-studio-actions"><button type="button" class="btn btn-ghost" onclick="App.mf484CloseStudio()">Cancel</button>'+
 '<button type="button" class="btn btn-primary" onclick="App.mf484SaveStudio()">Save Theme & Atmosphere</button></div></div>';
}
function mf484PreviewStudio(){
 const root=document.getElementById('mf484-preview');if(!root)return;
 const colors=[0,1,2,3].map(i=>mf484Hex(document.getElementById('mf484-color-'+i)?.value,MF484_DEFAULT.profiles[0].colors[i]));
 root.style.setProperty('--preview-a',colors[0]);
 root.style.setProperty('--preview-b',colors[1]);
 root.style.setProperty('--preview-c',colors[2]);
 root.style.setProperty('--preview-d',colors[3]);
}
function mf484OpenStudio(){
 mf484CloseStudio();
 const modal=document.createElement('div');modal.id='mf484-studio-root';
 modal.innerHTML='<div class="mf484-studio-overlay" onclick="if(event.target===this)App.mf484CloseStudio()"><div class="mf484-studio-dialog" role="dialog" aria-modal="true" aria-label="Alex Godly Theme Studio">'+mf484StudioHtml()+'</div></div>';
 document.body.appendChild(modal);
 modal.querySelector('.mf484-studio-dialog')?.addEventListener('input',mf484PreviewStudio);
 mf484PreviewStudio();
}
function mf484CloseStudio(){document.getElementById('mf484-studio-root')?.remove();}
function mf484SaveStudio(){
 const p=mf484Prefs(),profile=mf484ActiveProfile(p);
 const read=id=>document.getElementById('mf484-'+id)?.value;
 const name=String(read('name')||'').trim().slice(0,80);
 if(!name){showToast('Enter a theme name');return;}
 const source=read('source'),url=String(read('image')||'').trim();
 if(url&&!mf484ImageUrl(url)){showToast('Enter a valid HTTPS or HTTP image URL');return;}
 if(source!=='manual'&&!url){showToast('Enter an image URL for this theme source');return;}
 profile.name=name;profile.source=source;profile.imageUrl=mf484ImageUrl(url);
 profile.colors=[0,1,2,3].map(i=>mf484Hex(document.getElementById('mf484-color-'+i)?.value,profile.colors[i]));
 profile.appearance=read('appearance');profile.variation=read('variation');
 p.living.mode=read('motion');p.living.intensity=read('intensity');
 p.living.performance=read('performance');p.living.source=read('selection');
 document.querySelectorAll('#mf484-studio-root [data-mf484-effect]').forEach(input=>{
  p.living.effects[input.dataset.mf484Effect]=input.checked;
 });
 mf484Store(p);mf484Sync();mf484CloseStudio();
 try{v365PatchSettings();}catch(_){}
 showToast('Theme profile and atmosphere saved');
}
function mf484SelectProfile(id){
 const p=mf484Prefs();
 if(!p.profiles.some(x=>x.id===id))return;
 p.active=id;mf484Store(p);mf484Sync();mf484OpenStudio();
}
function mf484DuplicateProfile(){
 const p=mf484Prefs();
 if(p.profiles.length>=24){showToast('Maximum 24 theme profiles');return;}
 const clone=JSON.parse(JSON.stringify(mf484ActiveProfile(p)));
 clone.id='custom-'+Date.now().toString(36);
 clone.name=(clone.name+' Copy').slice(0,80);
 p.profiles.push(clone);p.active=clone.id;mf484Store(p);mf484Sync();mf484OpenStudio();
}
function mf484DeleteProfile(){
 const p=mf484Prefs();
 if(p.profiles.length<2){showToast('Keep at least one custom theme');return;}
 const existing=mf484ActiveProfile(p);
 if(!window.confirm('Delete theme profile "'+existing.name+'"?'))return;
 p.profiles=p.profiles.filter(x=>x.id!==existing.id);
 p.active=p.profiles[0].id;mf484Store(p);mf484Sync();mf484OpenStudio();
}
Object.assign(App,{mf484SetMode,mf484SetOption,mf484OpenStudio,mf484CloseStudio,
 mf484SaveStudio,mf484SelectProfile,mf484DuplicateProfile,mf484DeleteProfile});
MediaFlowRuntime.registerPageEnhancer('settings',mf484MountSettings);
document.addEventListener('visibilitychange',()=>{const p=mf484Prefs();if(p.living.mode!=='off')document.documentElement.dataset.mf484Motion=mf484AllowMotion(p.living)?'on':'off';});
try{window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',mf484Sync);}catch(_){}
try{mf484Sync();}catch(e){console.warn('[MediaFlow v484] Visual engine initialization:',e);}
window.MediaFlowV484=Object.freeze({version:484,prefs:mf484Prefs,analyze:mf484Analyze,compose:mf484Compose,refresh:mf484Sync});
MediaFlowRuntime.version=MF484_VERSION;
