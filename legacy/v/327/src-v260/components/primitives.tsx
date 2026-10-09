import React from 'react';

export type ButtonTone = 'default' | 'primary' | 'danger' | 'ghost';
export function Button({tone='default',className='',...props}:React.ButtonHTMLAttributes<HTMLButtonElement>&{tone?:ButtonTone}){
  const tones={default:'border-border bg-surface-raised text-text hover:border-accent/40',primary:'border-accent bg-accent text-slate-950 shadow-glow',danger:'border-danger/50 bg-danger/10 text-danger',ghost:'border-transparent bg-transparent text-text-dim hover:bg-surface-raised/70'};
  return <button {...props} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-extrabold transition ${tones[tone]} ${className}`}/>;
}
export function Surface({className='',...props}:React.HTMLAttributes<HTMLDivElement>){return <div {...props} className={`rounded-2xl border border-border/80 bg-surface/90 shadow-panel backdrop-blur ${className}`}/>;}
export function SectionTitle({eyebrow,title,description}:{eyebrow?:string;title:string;description?:string}){return <div className="space-y-1">{eyebrow&&<div className="text-[10px] font-black uppercase tracking-[.14em] text-accent">{eyebrow}</div>}<h2 className="font-display text-3xl font-semibold tracking-tight text-text">{title}</h2>{description&&<p className="max-w-3xl text-sm leading-6 text-text-dim">{description}</p>}</div>}
