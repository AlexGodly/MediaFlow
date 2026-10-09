/* MediaFlow v315 — Workspace Community navigation and fixed sidebar account dock.
   The legacy v161 main-page menu remains authoritative. Only this Community subtree
   has its own saved order/visibility/collapse settings. */
const MF315_LINKS=[
 {id:'community',name:'Community',icon:'browse',kind:'home'},
 {id:'browse',name:'Browse Titles',icon:'browse',kind:'child'},
 {id:'collections',name:'Collections',icon:'collections',kind:'child'},
 {id:'ratings',name:'Ratings',icon:'ratings',kind:'child'},
 {id:'users',name:'Users',icon:'users',kind:'child'},
 {id:'profile',name:'Public Profile',icon:'profile',kind:'workspace',view:'mf302-profile'},
 {id:'friends',name:'Friends',icon:'friends',kind:'workspace',view:'mf302-friends'},
 {id:'inbox',name:'Inbox',icon:'inbox',kind:'workspace',view:'mf302-inbox'}
];
const MF315_DEFAULT_ORDER=MF315_LINKS.map(x=>x.id);
function mf315Prefs(){
 S.settings=S.settings||{};
 const raw=S.settings.mf315CommunityNav||{};
 const order=[...new Set((Array.isArray(raw.order)?raw.order:[]).filter(id=>MF315_DEFAULT_ORDER.includes(id)))];
 MF315_DEFAULT_ORDER.forEach(id=>{if(!order.includes(id))order.push(id);});
 const hidden=[...new Set((Array.isArray(raw.hidden)?raw.hidden:[]).filter(id=>MF315_DEFAULT_ORDER.includes(id)))];
 return {order,hidden,visible:raw.visible!==false,expanded:raw.expanded!==false,childrenExpanded:raw.childrenExpanded===true};
}
function mf315Save(p){
 S.settings=S.settings||{};
 S.settings.mf315CommunityNav=p;
 try{persistSettings();}catch(e){console.warn('[v315] Could not persist Community navigation',e);}
}
const mf315SvgChevron='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
function mf315Icon(id){
 try{return mfIcon(id==='community'?'browse':id==='profile'?'profile':id)||mfIcon('profile');}catch(_){return ICONS.profile||'';}
}
function mf315NavButton(link,sub=false){
 const active=(link.kind==='workspace'&&S.view===link.view)||false;
 const title=link.name;
 const action=link.kind==='workspace'?`data-mf315-workspace="${link.view}"`:`data-mf315-public="${link.id==='community'?'':link.id}"`;
 return `<button type="button" class="nav-item mf315-menu-link ${sub?'mf315-sub-link':''} ${active?'active':''}" ${action} title="${title}" aria-label="${title}"><span class="mf315-menu-icon">${mf315Icon(link.icon)}</span><span class="mf315-menu-text">${title}</span></button>`;
}
function mf315NavHtml(){
 const p=mf315Prefs();
 if(!p.visible)return '';
 const children=p.order.map(id=>MF315_LINKS.find(x=>x.id===id)).filter(x=>x?.kind==='child'&&!p.hidden.includes(x.id));
 const social=p.order.map(id=>MF315_LINKS.find(x=>x.id===id)).filter(x=>x?.kind==='workspace'&&!p.hidden.includes(x.id));
 const home=!p.hidden.includes('community');
 return `<section class="mf302-side mf315-community-nav ${p.expanded?'':'mf315-group-closed'}" aria-label="Community pages">
   <button type="button" class="mf315-group-toggle" data-mf315-toggle="expanded" aria-expanded="${p.expanded}" title="${p.expanded?'Collapse':'Expand'} Community section"><span class="mf315-group-caption">COMMUNITY</span><span class="mf315-group-chevron">${mf315SvgChevron}</span></button>
   <div class="mf315-group-body" ${p.expanded?'':'hidden'}>
    ${home?`<div class="mf315-home-row">${mf315NavButton(MF315_LINKS[0])}${children.length?`<button type="button" class="mf315-children-toggle" data-mf315-toggle="childrenExpanded" aria-expanded="${p.childrenExpanded}" aria-label="${p.childrenExpanded?'Hide':'Show'} Community destinations" title="${p.childrenExpanded?'Hide':'Show'} Browse, Collections, Ratings and Users">${mf315SvgChevron}</button>`:''}</div>`:''}
    ${children.length?`<div class="mf315-children ${(p.childrenExpanded||!home)?'mf315-children-open':''}" ${(p.childrenExpanded||!home)?'':'hidden'}>${children.map(x=>mf315NavButton(x,true)).join('')}</div>`:''}
    <div class="mf315-social-links">${social.map(x=>mf315NavButton(x)).join('')}</div>
   </div>
  </section>`;
}
function mf315EnhanceSidebar(){
 if(!AUTH_USER)return;
 const sidebar=document.querySelector('#app .sidebar');const nav=sidebar?.querySelector('.nav');
 if(!nav)return;
 sidebar.classList.add('mf315-sidebar');
 let section=nav.querySelector('.mf302-side');
 const desired=mf315NavHtml();
 const key=JSON.stringify([mf315Prefs(),S.view]);
 if(!desired){section?.remove();}
 else if(section){if(section.dataset.mf315Key!==key){const node=document.createElement('div');node.innerHTML=desired;node.firstElementChild.dataset.mf315Key=key;section.replaceWith(node.firstElementChild);}}
 else{nav.insertAdjacentHTML('beforeend',desired);nav.lastElementChild.dataset.mf315Key=key;}
 // Keep Community entries visually nested and collapsed sidebar compact.
 const footer=sidebar.querySelector('.sidebar-foot');
 if(footer&&!footer.querySelector('.mf315-min-level')){
  footer.insertAdjacentHTML('beforeend','<div class="mf315-min-level" aria-label="Account level"></div>');
 }
 const level=footer?.querySelector('.mf315-min-level');
 if(level){try{level.textContent=`Lv ${mediaFlowLevelInfo()?.level||1}`;}catch(_){level.textContent='Lv 1';}}
}
function mf315RefreshSettings(){
 const el=document.querySelector('.mf315-community-settings');if(el)el.outerHTML=mf315SettingsHtml();
}
function mf315Toggle(name){
 const p=mf315Prefs();p[name]=!p[name];mf315Save(p);mf315EnhanceSidebar();mf315RefreshMobile();mf315RefreshSettings();
}
function mf315Hide(id,visible){
 const p=mf315Prefs();if(visible)p.hidden=p.hidden.filter(x=>x!==id);else if(!p.hidden.includes(id))p.hidden.push(id);
 mf315Save(p);mf315EnhanceSidebar();mf315RefreshMobile();mf315RefreshSettings();
}
function mf315Move(id,delta){
 const p=mf315Prefs();const i=p.order.indexOf(id);if(i<0)return;
 const group=MF315_LINKS.find(x=>x.id===id)?.kind;
 // Within the submenu or social list, preserve nesting and actual order.
 const list=p.order.filter(x=>MF315_LINKS.find(y=>y.id===x)?.kind===group);
 const current=list.indexOf(id),other=list[current+delta];if(!other)return;
 const j=p.order.indexOf(other);[p.order[i],p.order[j]]=[p.order[j],p.order[i]];
 mf315Save(p);mf315EnhanceSidebar();mf315RefreshMobile();mf315RefreshSettings();
}
function mf315Reset(){S.settings=S.settings||{};delete S.settings.mf315CommunityNav;try{persistSettings();}catch(_){}mf315EnhanceSidebar();mf315RefreshMobile();mf315RefreshSettings();}
function mf315SettingsHtml(){
 const p=mf315Prefs(),icons={community:'Home & submenu',browse:'Browse titles',collections:'Collections',ratings:'Ratings',users:'Users',profile:'Public Profile',friends:'Friends',inbox:'Inbox'};
 const category=(kind)=>p.order.filter(id=>MF315_LINKS.find(x=>x.id===id)?.kind===kind);
 const rows=(arr)=>arr.map((id,i)=>{
  const link=MF315_LINKS.find(x=>x.id===id),on=!p.hidden.includes(id);
  return `<div class="mf315-settings-row"><span class="mf315-settings-icon">${mf315Icon(link.icon)}</span><span class="mf315-settings-name">${link.name}</span><div class="mf315-settings-order"><button type="button" aria-label="Move ${link.name} up" onclick="App.mf315Move('${id}',-1)" ${i===0?'disabled':''}>↑</button><button type="button" aria-label="Move ${link.name} down" onclick="App.mf315Move('${id}',1)" ${i===arr.length-1?'disabled':''}>↓</button></div><label class="mf315-settings-check"><input type="checkbox" ${on?'checked':''} onchange="App.mf315Hide('${id}',this.checked)"><span>Show</span></label></div>`;
 }).join('');
 return `<section class="mf315-community-settings" aria-label="Community navigation settings"><div class="mf315-settings-head"><div><h3>Community navigation</h3><p>Choose which Community pages appear in Workspace, change their order, and manage both collapsible menus. Hidden pages remain available through direct links.</p></div><button type="button" class="btn btn-sm" onclick="App.mf315Reset()">Restore Community defaults</button></div>
 <label class="mf315-section-switch"><input type="checkbox" ${p.visible?'checked':''} onchange="App.mf315Toggle('visible')"><span>Show Community section in sidebar</span></label>
 <div class="mf315-settings-flags"><label><input type="checkbox" ${p.expanded?'checked':''} onchange="App.mf315Toggle('expanded')"> Expand Community section by default</label><label><input type="checkbox" ${p.childrenExpanded?'checked':''} onchange="App.mf315Toggle('childrenExpanded')"> Expand Community destination links by default</label></div>
 <h4>Community homepage and destinations</h4>${rows(category('home'))}${rows(category('child'))}
 <h4>Community workspace pages</h4>${rows(category('workspace'))}
 </section>`;
}
// Extension to existing Navigation Settings section, rather than a second Settings page.
const mf315OriginalNavSettings=v161NavigationSettingsHtml;
v161NavigationSettingsHtml=function(){return mf315OriginalNavSettings.apply(this,arguments)+mf315SettingsHtml();};
function mf315FixTopbar(){
 const config={'mf302-profile':['Profile','Manage your public profile and sharing preferences','profile'],'mf302-friends':['Friends','Your followers, following and mutual connections','friends'],'mf302-inbox':['Inbox','Private conversations and messages','inbox'],'mf302-public':['Community','Browse and explore public media','browse']};
 const info=config[S.view];if(!info||!AUTH_USER)return;
 const top=document.querySelector('.v260-topbar');if(!top)return;
 const title=top.querySelector('.v260-topbar-copy b');const sub=top.querySelector('.v260-topbar-copy span');const mark=top.querySelector('.v260-topbar-mark');
 if(title&&title.textContent!==info[0])title.textContent=info[0];
 if(sub&&sub.textContent!==info[1])sub.textContent=info[1];
 if(mark&&mark.dataset.mf315Icon!==info[2]){mark.innerHTML=mf315Icon(info[2]);mark.dataset.mf315Icon=info[2];mark.classList.add('mf315-topbar-icon');}
}
function mf315Decorate(){if(!AUTH_USER)return;mf315EnhanceSidebar();mf315FixTopbar();}
// Replace the old static Community nav creation, while preserving chat initialization.
mfWorkspaceNav=mf315EnhanceSidebar;
const mf315OriginalRender=render;
render=function(){
 const nav=document.querySelector('#app .sidebar .nav');const oldScroll=nav?.scrollTop||0;
 const result=mf315OriginalRender.apply(this,arguments);
 const fresh=document.querySelector('#app .sidebar .nav');if(fresh&&fresh!==nav)fresh.scrollTop=oldScroll;
 queueMicrotask(mf315Decorate);
 requestAnimationFrame(mf315Decorate);
 return result;
};
// The v260 React chrome renders on its own cycle; update it when that cycle completes.
if(typeof v260SignalReact==='function'){
 const mf315OriginalSignal=v260SignalReact;
 v260SignalReact=function(){const r=mf315OriginalSignal.apply(this,arguments);requestAnimationFrame(mf315FixTopbar);return r;};
}
// Localized observer only on the topbar host, with no full-app DOM observer.
let mf315Observed=null;
function mf315ObserveChrome(){
 const host=document.querySelector('.v260-react-host');if(!host||host===mf315Observed)return;
 mf315Observed=host;
 const ob=new MutationObserver(()=>{if(['mf302-profile','mf302-friends','mf302-inbox','mf302-public'].includes(S.view))requestAnimationFrame(mf315FixTopbar);});
 ob.observe(host,{childList:true,subtree:true});
}
const mf315OriginalNavDecorator=mfDecorateWorkspace;
mfDecorateWorkspace=function(){const r=mf315OriginalNavDecorator.apply(this,arguments);mf315Decorate();mf315ObserveChrome();return r;};
// Mobile More uses the same visibility/order preferences instead of the old
// unconditional Community buttons. Two collapsible levels match the desktop menu.
const mf315BaseMobileTabs=renderMobileTabs;
renderMobileTabs=function(){
 let html=mf315BaseMobileTabs.apply(this,arguments);
 html=html.replace(/<button type="button" class="mobile-more-item v296-more-item" onclick="MF302\.workspaceView\('mf302-(?:public|profile|friends|inbox)'\)">[\s\S]*?<\/button>/g,'');
 const p=mf315Prefs();if(!p.visible)return html;
 const links=p.order.map(id=>MF315_LINKS.find(x=>x.id===id)).filter(x=>x&&!p.hidden.includes(x.id));
 const children=links.filter(x=>x.kind==='child');const own=links.filter(x=>x.kind==='workspace');
 const navButton=x=>`<button type="button" class="mf315-mobile-link" ${x.kind==='workspace'?`data-mf315-workspace="${x.view}"`:`data-mf315-public="${x.id==='community'?'':x.id}"`}><span class="mf315-mobile-icon">${mf315Icon(x.icon)}</span><span>${x.name}</span></button>`;
 const group=`<section class="mf315-mobile-nav" aria-label="Community navigation"><button type="button" class="mf315-mobile-head" data-mf315-toggle="expanded" aria-expanded="${p.expanded}">Community <span>${mf315SvgChevron}</span></button><div class="mf315-mobile-body" ${p.expanded?'':'hidden'}>
 ${links.some(x=>x.id==='community')?`<div class="mf315-mobile-home">${navButton(MF315_LINKS[0])}${children.length?`<button type="button" class="mf315-mobile-expand" data-mf315-toggle="childrenExpanded" aria-expanded="${p.childrenExpanded}" aria-label="Expand Community pages">${mf315SvgChevron}</button>`:''}</div>`:''}
 ${children.length?`<div class="mf315-mobile-children" ${(p.childrenExpanded||!links.some(x=>x.id==='community'))?'':'hidden'}>${children.map(navButton).join('')}</div>`:''}
 ${own.map(navButton).join('')}</div></section>`;
 return html.replace(/(<div id="mobile-more-menu"[^>]*>)/,'$1'+group);
};
function mf315RefreshMobile(){
 const menu=document.getElementById('mobile-more-menu');if(!menu)return;
 const host=document.createElement('div');host.innerHTML=renderMobileTabs();
 const newer=host.querySelector('.mf315-mobile-nav');
 const current=menu.querySelector('.mf315-mobile-nav');
 if(current){if(newer)current.replaceWith(newer);else current.remove();}
 else if(newer)menu.insertAdjacentElement('afterbegin',newer);
}
// Delegated listeners remain active even when renderShell replaces sidebar nodes.
document.addEventListener('click',function(e){
 const btn=e.target.closest('[data-mf315-toggle],[data-mf315-workspace],[data-mf315-public]');
 if(!btn||!btn.closest('.mf315-community-nav,.mf315-mobile-nav'))return;
 e.preventDefault();e.stopPropagation();
 if(btn.hasAttribute('data-mf315-toggle')){mf315Toggle(btn.dataset.mf315Toggle);return;}
 if(btn.hasAttribute('data-mf315-workspace'))MF302.workspaceView(btn.dataset.mf315Workspace);
 else if(btn.hasAttribute('data-mf315-public'))MF302.go(btn.dataset.mf315Public);
},true);
Object.assign(App,{mf315Toggle,mf315Hide,mf315Move,mf315Reset});
window.MediaFlowCommunity=Object.assign(window.MediaFlowCommunity||{},{version:315,workspaceCommunityNavigation:true});
