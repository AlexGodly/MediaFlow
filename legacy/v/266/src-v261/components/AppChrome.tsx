import React from 'react';
import {Surface,Button} from './primitives';

type Bridge={getView:()=>string;getTheme:()=>string;syncNow?:()=>Promise<unknown>|unknown};
declare global { interface Window { MediaFlowV260Bridge?:Bridge; MediaFlowV261Bridge?:Bridge } }
const pages:Record<string,[string,string]>={dashboard:['Dashboard','Your rotation, logging and daily focus'],library:['Library','Browse, organize and manage your media'],history:['History','Consumption, recent activity, ratings and Library changes'],batch:['Batch Log','Log multiple titles in one focused workflow'],stats:['Statistics','Patterns, progress and long-term consumption'],profile:['Account','Profile, identity and account preferences'],settings:['Settings','Customize MediaFlow to fit your workflow'],order:['Personal Order','Shape your own title priority order'],oldsystem:['Old System','Legacy scheduler views and records'],about:['About','Version, updates and MediaFlow information']};
const paths:Record<string,string>={dashboard:'M3 12l9-9 9 9 M5 10v10h14V10',library:'M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z',history:'M12 7v5l3 3',batch:'M4 6h16M4 12h16M4 18h10 M18 16v6M15 19h6',stats:'M3 3v18h18 M8 18v-6 M13 18V8 M18 18V5',order:'M8 6h13M8 12h13M8 18h13 M3 6h.01M3 12h.01M3 18h.01',profile:'M4 21a8 8 0 0 1 16 0',settings:'M12 9a3 3 0 1 0 0 6a3 3 0 0 0 0-6',about:'M12 16v-4 M12 8h.01'};
function PageIcon({view}:{view:string}){return <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{view==='history'&&<circle cx="12" cy="12" r="9"/>}{view==='profile'&&<circle cx="12" cy="8" r="4"/>}{view==='settings'&&<circle cx="12" cy="12" r="9"/>}{view==='about'&&<circle cx="12" cy="12" r="10"/>}<path d={paths[view]??paths.dashboard}/></svg>}
export function AppChrome(){
  const bridge=window.MediaFlowV260Bridge??window.MediaFlowV261Bridge;
  const [view,setView]=React.useState(bridge?.getView()??'dashboard');
  React.useEffect(()=>{const handler=(event:Event)=>{const detail=(event as CustomEvent).detail??{};setView(detail.view??bridge?.getView()??'dashboard');};window.addEventListener('mediaflow:v260-update',handler);return()=>window.removeEventListener('mediaflow:v260-update',handler)},[bridge]);
  const meta=pages[view]??[view,'MediaFlow'];
  return <Surface className="flex min-h-14 items-center gap-3 px-3 py-2"><div className="grid size-9 place-items-center rounded-xl border border-accent/30 bg-accent/10 text-accent"><PageIcon view={view}/></div><div className="min-w-0 flex-1"><strong className="block truncate text-sm">{meta[0]}</strong><span className="block truncate text-[11px] text-text-dim">{meta[1]}</span></div><span className="rounded-xl border border-border px-2 py-1 text-[10px] font-bold text-text-dim">v261</span><Button onClick={()=>bridge?.syncNow?.()}>Sync Now</Button></Surface>;
}
