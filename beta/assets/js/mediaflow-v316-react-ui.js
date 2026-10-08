/* MediaFlow v261 prebuilt React application chrome. */
(function(){
  'use strict';
  const PAGE={dashboard:['Dashboard','Your rotation, logging and daily focus'],library:['Library','Browse, organize and manage your media'],history:['History','Consumption, recent activity, ratings and Library changes'],batch:['Batch Log','Log multiple titles in one focused workflow'],stats:['Statistics','Patterns, progress and long-term consumption'],profile:['Account','Profile, identity and account preferences'],settings:['Settings','Customize MediaFlow to fit your workflow'],order:['Personal Order','Shape your own title priority order'],oldsystem:['Old System','Legacy scheduler views and records'],about:['About','Version, updates and MediaFlow information'],'mf302-profile':['Profile','Manage your public profile and sharing preferences'],'mf302-friends':['Friends','Your followers, following and mutual connections'],'mf302-inbox':['Inbox','Private conversations and messages'],'mf302-public':['Community','Browse and explore public media']};
  const PATHS={
    dashboard:['path','M3 12l9-9 9 9|M5 10v10h14V10'],
    library:['path','M4 19.5A2.5 2.5 0 0 1 6.5 17H20|M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'],
    history:['mixed','circle:12,12,9|path:M12 7v5l3 3'],
    batch:['path','M4 6h16M4 12h16M4 18h10|M18 16v6M15 19h6'],
    stats:['mixed','path:M3 3v18h18|rect:7,12,3,6|rect:12,8,3,10|rect:17,5,3,13'],
    profile:['mixed','circle:12,8,4|path:M4 21a8 8 0 0 1 16 0'],
    settings:['mixed','circle:12,12,3|path:M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'],
    order:['path','M8 6h13M8 12h13M8 18h13|M3 6h.01M3 12h.01M3 18h.01'],
    oldsystem:['path','M7 7h11l-3-3|m18 7-3 3|M17 17H6l3 3|m6 17 3-3'],
    'mf302-profile':['mixed','circle:12,8,4|path:M4 21a8 8 0 0 1 16 0'],
    'mf302-friends':['mixed','circle:9,8,3|circle:17,10,2|path:M2 21a7 7 0 0 1 14 0|M15 17q6 0 7 5'],
    'mf302-inbox':['path','M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-3-.4-4.2-1L3 21l2-5.1a8.5 8.5 0 1 1 16-4.4z'],
    'mf302-public':['mixed','circle:12,12,9|path:M16 8l-3 6-5 2 2-5 6-3'],
    about:['mixed','circle:12,12,10|path:M12 16v-4|M12 8h.01']
  };
  function PageIcon({kind}){const spec=PATHS[kind]||PATHS.dashboard,parts=spec[1].split('|');return React.createElement('svg',{viewBox:'0 0 24 24',width:18,height:18,fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true},parts.map((p,i)=>{if(p.startsWith('circle:')){const [cx,cy,r]=p.slice(7).split(',');return React.createElement('circle',{key:i,cx,cy,r});}if(p.startsWith('rect:')){const [x,y,w,h]=p.slice(5).split(',');return React.createElement('rect',{key:i,x,y,width:w,height:h});}const d=p.startsWith('path:')?p.slice(5):p;return React.createElement('path',{key:i,d});}));}
  function SyncIcon(){return React.createElement('svg',{viewBox:'0 0 24 24',width:15,height:15,fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true},React.createElement('path',{d:'M20 6v5h-5M4 18v-5h5M18.5 9A7 7 0 0 0 6 6.5L4 9m2 6.5A7 7 0 0 0 18 18l2-2.5'}));}
  function AppChrome(){
    const bridge=window.MediaFlowV260Bridge||window.MediaFlowV261Bridge;
    const initial=bridge?.getView?.()||'dashboard';
    const [view,setView]=React.useState(initial),[busy,setBusy]=React.useState(false);
    React.useEffect(()=>{const onUpdate=e=>setView(e?.detail?.view||bridge?.getView?.()||'dashboard');window.addEventListener('mediaflow:v260-update',onUpdate);return()=>window.removeEventListener('mediaflow:v260-update',onUpdate);},[]);
    const meta=PAGE[view]||[view?view.replace(/^./,x=>x.toUpperCase()):'MediaFlow','Professional media management'];
    const sync=async()=>{if(busy)return;setBusy(true);try{await (window.MediaFlowV260Bridge?.syncNow?.()||window.MediaFlowV261Bridge?.syncNow?.());}finally{setTimeout(()=>setBusy(false),450);}};
    return React.createElement('header',{className:'v260-topbar','aria-label':'MediaFlow application header'},
      React.createElement('div',{className:'v260-topbar-main'},React.createElement('div',{className:'v260-topbar-mark v261-page-icon'},React.createElement(PageIcon,{kind:view})),React.createElement('div',{className:'v260-topbar-copy'},React.createElement('b',null,meta[0]),React.createElement('span',null,meta[1]))),
      React.createElement('div',{className:'v260-topbar-actions'},React.createElement('button',{type:'button',className:'btn btn-sm',onClick:sync,disabled:busy,'aria-label':'Sync MediaFlow now'},React.createElement(SyncIcon),React.createElement('span',{className:'v260-sync-label'},busy?'Syncing…':'Sync Now'))));
  }
  function mount(){if(!window.React||!window.ReactDOM||!window.MediaFlowV260Bridge)return false;const host=document.getElementById('v260-react-host');if(!host)return false;if(host.__mfV260Mounted)return true;host.__mfV260Mounted=true;host.replaceChildren();const root=ReactDOM.createRoot?ReactDOM.createRoot(host):null;if(root){root.render(React.createElement(AppChrome));host.__mfV260Root=root;}else ReactDOM.render(React.createElement(AppChrome),host);return true;}
  let tries=0;const timer=setInterval(()=>{tries++;if(mount()||tries>80)clearInterval(timer);},125);window.addEventListener('mediaflow:v260-update',()=>{const host=document.getElementById('v260-react-host');if(host&&!host.__mfV260Mounted)mount();});
})();
