import { LegacyPageAdapter } from './pages/LegacyPageAdapter';

/**
 * React stays deliberately non-destructive in v260. The visual redesign is
 * applied to the live v259-compatible DOM, while this root is the stable mount
 * point for replacing individual pages with React in later releases.
 */
export default function App(){
  return <LegacyPageAdapter/>;
}
