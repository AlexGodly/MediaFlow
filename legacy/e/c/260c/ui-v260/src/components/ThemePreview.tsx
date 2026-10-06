import { Palette } from 'lucide-react';
import { readThemeToken } from '../bridge/mediaflow';
import { Surface } from './DesignSystem';

export function ThemePreview(){
  const tokens=['--bg','--panel','--panel-raised','--border','--text','--flow'];
  return <Surface className="p-4">
    <div className="mb-3 flex items-center gap-2 text-sm font-bold"><Palette className="h-4 w-4 text-mf-flow"/>Dynamic theme contract</div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {tokens.map(token=><div className="rounded-lg border border-mf-border/70 p-2" key={token}>
        <div className="mb-2 h-7 rounded-md border border-white/5" style={{background:readThemeToken(token)}}/>
        <code className="text-[10px] text-mf-muted">{token}</code>
      </div>)}
    </div>
  </Surface>;
}
