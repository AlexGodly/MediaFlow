import React from 'react';
import {Surface,Button} from './primitives';

type Bridge={getView:()=>string;getTheme:()=>string;syncNow:()=>Promise<unknown>|unknown};
declare global { interface Window { MediaFlowV260Bridge?:Bridge } }
const pages:Record<string,[string,string]>={dashboard:['Dashboard','Your rotation, logging and daily focus'],library:['Library','Browse, organize and manage your media'],history:['History','Consumption, recent activity, ratings and Library changes'],batch:['Batch Log','Log multiple titles in one focused workflow'],stats:['Statistics','Patterns, progress and long-term consumption'],settings:['Settings','Customize MediaFlow to fit your workflow'],'mf302-profile':['Profile','Manage your public profile and sharing preferences'],'mf302-friends':['Friends','Your followers, following and mutual connections'],'mf302-inbox':['Inbox','Private conversations and messages'],'mf302-public':['Community','Browse and explore public media']};
export function AppChrome(){
  const bridge=window.MediaFlowV260Bridge;
  const [view,setView]=React.useState(bridge?.getView()??'dashboard');
  const [theme,setTheme]=React.useState(bridge?.getTheme()??'dark');
  React.useEffect(()=>{const handler=(event:Event)=>{const detail=(event as CustomEvent).detail??{};setView(detail.view??bridge?.getView()??'dashboard');setTheme(detail.theme??bridge?.getTheme()??'dark');};window.addEventListener('mediaflow:v260-update',handler);return()=>window.removeEventListener('mediaflow:v260-update',handler)},[bridge]);
  const meta=pages[view]??[view,'MediaFlow'];
  return <Surface className="flex min-h-14 items-center gap-3 px-3 py-2"><div className="grid size-8 place-items-center rounded-xl bg-accent text-slate-950">✦</div><div className="min-w-0 flex-1"><strong className="block truncate text-sm">{meta[0]}</strong><span className="block truncate text-[11px] text-text-dim">{meta[1]}</span></div><span className="rounded-xl border border-border px-2 py-1 text-[10px] font-bold text-text-dim">{theme}</span><Button onClick={()=>bridge?.syncNow()}>Sync Now</Button></Surface>;
}
