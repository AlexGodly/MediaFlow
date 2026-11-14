/* MediaFlow v579 — Select all in a title's own recovery; History in each
 * title's own unit.
 *
 * - A title's recovery (Quick Title Recovery: details, or cover + details)
 *   gets Select all / Deselect all above its fields, with "N of M selected",
 *   like the Library-wide review (v566).
 * - Consumption history, Recently viewed and Most consumed titles count each
 *   title in its own unit ("1,470 matches"), not its category's ("sessions").
 *   Titles without their own unit keep their category's.
 * - A by-parts log shows one short line per part; the kind ("Mode") once.
 * The MediaFlow app (10.0.0.579) does the same.
 */
function mf579Selectable(p){return !!p&&!p.protected&&!p.hasOriginal&&!p.same;}
App.mf579QuickSelect=function(on){
  const props=MF453Quick.current?.metadata?.preview?.proposals||[];
  for(const p of props)if(mf579Selectable(p))p.selected=Boolean(on);
  mf453PaintQuick();
};
const mf579QuickHtmlBase=mf453QuickHtml;
mf453QuickHtml=function(){
  const html=String(mf579QuickHtmlBase.apply(this,arguments)||'');
  const props=MF453Quick.current?.metadata?.preview?.proposals||[];
  const open=props.filter(mf579Selectable);
  if(open.length<2||!html.includes('<div class="mf454-metadata-list">'))return html;
  const tools='<div class="mf566-select-tools mf579-quick-select" role="group" aria-label="Select fields">'+
    '<button type="button" class="btn btn-sm btn-ghost" data-v225-iconified="1" onclick="App.mf579QuickSelect(true)">'+mf425Icon('check',15)+' Select all</button>'+
    '<button type="button" class="btn btn-sm btn-ghost" data-v225-iconified="1" onclick="App.mf579QuickSelect(false)">'+mf425Icon('x',15)+' Deselect all</button>'+
    '<small>'+open.filter(p=>p.selected).length+' of '+open.length+' selected</small></div>';
  return html.replace('<div class="mf454-metadata-list">',tools+'<div class="mf454-metadata-list">');
};

/* ---------- History: the title's own unit ---------- */
let MF579_NOUN_EVENT=null;
function mf579UnitFor(ev){
  const item=ev?.item,cat=ev?.cat;
  return typeof mf565UnitKey==='function'&&item?mf565UnitKey(item,cat):String(cat?.unit||'units');
}
const MF579H=window.MediaFlowV269Hooks;
if(MF579H){
  MF579H.wrap('consumedLabel',function(base,ev){
    const q=Math.max(0,Number(ev?.qty)||0);
    if(q>0)return q.toLocaleString()+' '+unitLabel(mf579UnitFor(ev),q);
    return base(ev);
  });
  MF579H.wrap('latestLabel',function(base,ev){
    const out=String(base(ev)||'');
    const q=Math.max(0,Number(ev?.qty)||0);
    const catNoun=unitLabel(String(ev?.cat?.unit||''),q),own=unitLabel(mf579UnitFor(ev),q);
    return catNoun&&own&&catNoun!==own?out.replace(' '+catNoun,' '+own):out;
  });
  /* Most consumed titles: "N <units>" right after that title's cover. */
  MF579H.wrap('progressNoun',function(base,cat,qty=2){
    const ev=MF579_NOUN_EVENT;
    if(ev&&ev.cat===cat)return unitLabel(mf579UnitFor(ev),qty);
    return base(cat,qty);
  });
  MF579H.wrap('coverMarkup',function(base,ev,cls){MF579_NOUN_EVENT=ev||null;return base(ev,cls);});
}
/* ---------- History: one short line per part ---------- */
function mf579PartLines(row){
  const list=Array.isArray(row?.mf577Parts)?row.mf577Parts:[];
  if(!list.length)return '';
  const kinds=new Set(list.map(p=>String(p.kind||'')));
  const kind=kinds.size===1?[...kinds][0]:'';
  const line=p=>{
    const k=!kind&&p.kind?p.kind+' · ':'',u=unitLabel(p.unit||'units',1);
    return k+(p.name||'Part')+(Number.isFinite(Number(p.to))?' · '+u.charAt(0).toUpperCase()+u.slice(1)+' '+Number(p.from).toLocaleString()+' → '+Number(p.to).toLocaleString()+' (+'+p.qty+')':' · +'+p.qty);
  };
  return '<span class="mf579-parts">'+(kind?'<small>'+escapeHtml(kind)+'</small>':'')+list.map(p=>'<span>'+escapeHtml(line(p))+'</span>').join('')+'</span>';
}
if(MF579H){
  /* The part lines replace the one-line text from v577. */
  MF579H.wrap('progressMeta',function(base,ev){
    if(Array.isArray(ev?.row?.mf577Parts)&&ev.row.mf577Parts.length)return '';
    return base(ev);
  });
  MF579H.wrap('cardHtml',function(base,ev){
    const html=String(base(ev)||'');
    const parts=mf579PartLines(ev?.row);
    if(!parts)return html;
    return html.replace('<span class="mf269-card-time">',parts+'<span class="mf269-card-time">');
  });
}

/* Recently viewed: "N <units>" in the title's own unit; by-parts logs list the parts. */
if(typeof v340RecentCard==='function'){
  const mf579RecentBase=v340RecentCard;
  v340RecentCard=function(entry){
    let html=String(mf579RecentBase.apply(this,arguments)||'');
    const qty=Math.max(0,Number(entry?.qty)||0),cat=getCategory(entry?.categoryId)||getCategory(entry?.session?.categoryId);
    if(qty>0&&entry?.item){
      const from=escapeHtml(qty.toLocaleString()+' '+unitLabel(cat?.unit,qty)),to=escapeHtml(qty.toLocaleString()+' '+unitLabel(mf579UnitFor({item:entry.item,cat}),qty));
      if(from!==to)html=html.replace('<span>'+from+'</span>','<span>'+to+'</span>');
    }
    const parts=mf579PartLines(entry?.row);
    if(parts)html=html.replace('<div class="v340-recent-facts','<div class="mf579-recent-parts">'+parts+'</div><div class="v340-recent-facts');
    return html;
  };
}

/* ---------- Logging: by-parts titles added from the picker or a recommendation ---------- */
/* Quick-adding a by-parts title (the Logging picker, "Use recommended title")
 * left it without parts, so it logged nothing; it now starts on its default
 * part (the one logged last), one unit, like adding it by hand (v577). */
function mf579EnsureParts(id){
  if(!S.logDraft||S.logDraft.v369Interface==='itemized')return;
  const item=S.library.find(x=>String(x.id)===String(id));
  if(!item||!mf577IsParts(item))return;
  const e=(S.logDraft.entries||[]).find(x=>String(x?.libraryId||'')===String(id));
  if(!e||(Array.isArray(e.mf577Parts)&&mf577Clean(item,e.mf577Parts).length))return;
  const part=mf577Default(item);if(!part)return;
  e.mf577Parts=[{id:String(part.id),qty:1}];
  mf577ApplyEntry(e,item);
}
if(typeof App.v378QuickAdd==='function'){
  const mf579QuickAddBase=App.v378QuickAdd;
  App.v378QuickAdd=function(id){
    const out=mf579QuickAddBase.apply(this,arguments);
    if(out){try{mf579EnsureParts(id);if(typeof render==='function')render();}catch(_){}}
    return out;
  };
}
/* "Next: Mode · Live · Match 5" for a recommended by-parts title. */
function mf579NextPartText(item){
  if(!item||!mf577IsParts(item))return '';
  const part=mf577Default(item);if(!part)return '';
  const cat=getCategory(item.categoryId),u=unitLabel(mf577PartUnitKey(part,item,cat),1);
  const next=(Number(part.progress)||0)+1,total=Number(part.total)>0?Number(part.total):0;
  return mf577PartName(part)+' · '+u.charAt(0).toUpperCase()+u.slice(1)+' '+(total&&next>total?total:next)+(total?' of '+total:'');
}
if(typeof v253RecommendedLogCardHtml==='function'){
  const mf579RecCardBase=v253RecommendedLogCardHtml;
  v253RecommendedLogCardHtml=function(item){
    let html=String(mf579RecCardBase.apply(this,arguments)||'');
    if(!item||!mf577IsParts(item))return html;
    const n=mf577Parts(item).length,next=mf579NextPartText(item);
    html=html.replace(/ · \d+ seasons<\/small>/,' · '+n+' part'+(n===1?'':'s')+'</small>');
    return next?html.replace('</small></div></div>','</small><small class="mf579-next-part">Next: '+escapeHtml(next)+'</small></div></div>'):html;
  };
}
if(typeof mf395DashboardRecommendationHtml==='function'){
  const mf579DashRecBase=mf395DashboardRecommendationHtml;
  mf395DashboardRecommendationHtml=function(task){
    const html=String(mf579DashRecBase.apply(this,arguments)||'');
    const item=task?.libraryId?S.library.find(x=>String(x.id)===String(task.libraryId)):null;
    let out=html;
    /* Title progress in the title's own unit ("6 matches logged"). */
    const cat=item?getCategory(item.categoryId):null,catUnit=String(cat?.unit||'units'),own=item?mf579UnitFor({item,cat}):catUnit;
    if(item&&own!==catUnit){
      const a=out.indexOf('mf419-progress-numbers'),b=a<0?-1:out.indexOf('</div>',a);
      if(a>=0&&b>a)out=out.slice(0,a)+out.slice(a,b).split('</b> '+escapeHtml(catUnit)).join('</b> '+escapeHtml(own))+out.slice(b);
    }
    const next=mf579NextPartText(item);
    if(!next||!out.includes('<p>Here'))return out;
    return out.replace('<p>Here','<div class="mf579-next-part">Next: '+escapeHtml(next)+'</div><p>Here');
  };
}
window.MediaFlowV579History=Object.freeze({unitFor:mf579UnitFor,partLines:mf579PartLines});
