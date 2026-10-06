import type { ButtonHTMLAttributes, HTMLAttributes, PropsWithChildren, ReactNode } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';

export function Surface({children,className='',...props}:PropsWithChildren<HTMLAttributes<HTMLDivElement>>){
  return <div className={`mf260-surface ${className}`} {...props}>{children}</div>;
}

export function PageHeader({title,description,actions}:{title:string;description?:string;actions?:ReactNode}){
  return <header className="flex flex-wrap items-end justify-between gap-4 border-b border-mf-border/70 pb-4">
    <div className="min-w-0 flex-1">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-mf-text md:text-4xl">{title}</h1>
      {description ? <p className="mt-1.5 max-w-3xl text-sm leading-6 text-mf-dim">{description}</p> : null}
    </div>
    {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
  </header>;
}

type ButtonProps=ButtonHTMLAttributes<HTMLButtonElement>&{tone?:'default'|'primary'|'ghost'|'danger'};
export function Button({tone='default',className='',children,...props}:ButtonProps){
  const tones={
    default:'border-mf-border bg-mf-raised text-mf-text hover:border-mf-flow/40',
    primary:'border-mf-flow/60 bg-mf-flow text-mf-bg hover:brightness-105',
    ghost:'border-transparent bg-transparent text-mf-dim hover:bg-mf-raised hover:text-mf-text',
    danger:'border-red-400/30 bg-red-400/10 text-red-300 hover:bg-red-400/15'
  };
  return <button className={`mf260-focus inline-flex min-h-9 items-center justify-center gap-2 rounded-[10px] border px-3 text-xs font-bold transition ${tones[tone]} ${className}`} {...props}>{children}</button>;
}

export function FilterChip({active,children,count,onClick}:{active?:boolean;children:ReactNode;count?:number;onClick?:()=>void}){
  return <button type="button" aria-pressed={active} onClick={onClick} className={`mf260-focus inline-flex shrink-0 items-center gap-1.5 rounded-[9px] border px-2.5 py-1.5 text-xs font-bold transition ${active?'border-mf-flow/40 bg-mf-flow/10 text-mf-text':'border-transparent text-mf-dim hover:border-mf-border hover:bg-mf-raised hover:text-mf-text'}`}>
    {children}{typeof count==='number'?<span className="rounded-full bg-mf-text/5 px-1.5 py-0.5 text-[10px] text-mf-muted">{count.toLocaleString()}</span>:null}
  </button>;
}

export function ToolPanel({collapsed,onToggle,children}:{collapsed:boolean;onToggle():void;children:ReactNode}){
  return <Surface className="overflow-hidden">
    <div className="flex min-h-11 items-center gap-2 border-b border-mf-border/70 px-3 py-2">
      <SlidersHorizontal className="h-4 w-4 text-mf-flow"/>
      <span className="text-[11px] font-extrabold uppercase tracking-[.08em] text-mf-dim">Library tools</span>
      <div className="flex-1"/>
      <Button tone="ghost" onClick={onToggle}>{collapsed?'Show':'Hide'} tools <ChevronDown className={`h-4 w-4 transition ${collapsed?'-rotate-90':''}`}/></Button>
    </div>
    {!collapsed?<div className="p-3">{children}</div>:null}
  </Surface>;
}
