/* MediaFlow v260 prebuilt React chrome. Core MediaFlow never depends on this
   network-loaded layer; if React CDN is unavailable the v260 CSS + runtime
   redesign remains fully functional. */
(function(){
  'use strict';
  const PAGE={dashboard:['Dashboard','Your rotation, logging and daily focus'],library:['Library','Browse, organize and manage your media'],history:['History','Consumption, recent activity, ratings and Library changes'],batch:['Batch Log','Log multiple titles in one focused workflow'],stats:['Statistics','Patterns, progress and long-term consumption'],profile:['Account','Profile, identity and account preferences'],settings:['Settings','Customize MediaFlow to fit your workflow'],order:['Personal Order','Shape your own title priority order'],oldsystem:['Old System','Legacy scheduler views and records']};
  function Icon({kind}){const paths={sync:'M20 6v5h-5M4 18v-5h5M18.5 9A7 7 0 0 0 6 6.5L4 9m2 6.5A7 7 0 0 0 18 18l2-2.5',spark:'m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2Z'};return React.createElement('svg',{viewBox:'0 0 24 24',width:15,height:15,fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true},React.createElement('path',{d:paths[kind]||paths.spark}));}
  function AppChrome(){
    const bridge=window.MediaFlowV260Bridge;
    const initial=bridge?.getView?.()||'dashboard';
    const [view,setView]=React.useState(initial);
    const [theme,setTheme]=React.useState(bridge?.getTheme?.()||'dark');
    const [busy,setBusy]=React.useState(false);
    React.useEffect(()=>{const onUpdate=e=>{setView(e?.detail?.view||bridge?.getView?.()||'dashboard');setTheme(e?.detail?.theme||bridge?.getTheme?.()||'dark');};window.addEventListener('mediaflow:v260-update',onUpdate);return()=>window.removeEventListener('mediaflow:v260-update',onUpdate);},[]);
    const meta=PAGE[view]||[view?view.replace(/^./,x=>x.toUpperCase()):'MediaFlow','Professional media management'];
    const sync=async()=>{if(busy)return;setBusy(true);try{await bridge?.syncNow?.();}finally{setTimeout(()=>setBusy(false),450);}};
    return React.createElement('header',{className:'v260-topbar','aria-label':'MediaFlow application header'},
      React.createElement('div',{className:'v260-topbar-main'},
        React.createElement('div',{className:'v260-topbar-mark'},React.createElement(Icon,{kind:'spark'})),
        React.createElement('div',{className:'v260-topbar-copy'},React.createElement('b',null,meta[0]),React.createElement('span',null,meta[1]))
      ),
      React.createElement('div',{className:'v260-topbar-actions'},
        React.createElement('span',{className:'v260-topbar-chip',title:'Current dynamic theme'},theme),
        React.createElement('span',{className:'v260-topbar-chip'},'v260'),
        React.createElement('button',{type:'button',className:'btn btn-sm',onClick:sync,disabled:busy,'aria-label':'Sync MediaFlow now'},React.createElement(Icon,{kind:'sync'}),React.createElement('span',{className:'v260-sync-label'},busy?'Syncing…':'Sync Now'))
      )
    );
  }
  function mount(){
    if(!window.React||!window.ReactDOM||!window.MediaFlowV260Bridge)return false;
    const host=document.getElementById('v260-react-host');if(!host)return false;
    if(host.__mfV260Mounted)return true;
    host.__mfV260Mounted=true;host.replaceChildren();
    const root=ReactDOM.createRoot?ReactDOM.createRoot(host):null;
    if(root){root.render(React.createElement(AppChrome));host.__mfV260Root=root;}else ReactDOM.render(React.createElement(AppChrome),host);
    return true;
  }
  let tries=0;const timer=setInterval(()=>{tries++;if(mount()||tries>80)clearInterval(timer);},125);
  window.addEventListener('mediaflow:v260-update',()=>{const host=document.getElementById('v260-react-host');if(host&&!host.__mfV260Mounted)mount();});
})();
