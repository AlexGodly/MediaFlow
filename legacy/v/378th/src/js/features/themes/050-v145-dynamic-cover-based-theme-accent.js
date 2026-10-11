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



