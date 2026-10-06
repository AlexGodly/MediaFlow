export type MediaFlowView =
  | 'dashboard' | 'library' | 'order' | 'oldsystem' | 'libraryhistory'
  | 'history' | 'batch' | 'stats' | 'profile' | 'settings' | 'about';

export type MediaFlowBridge = {
  version: number;
  architecture: string;
  themeContract: string[];
  enhance(): void;
  toggleLibraryTools(): void;
};

declare global {
  interface Window {
    MediaFlowV260?: MediaFlowBridge;
    MediaFlowRuntime?: {
      getCurrentView(): string;
      requestRender(): void;
    };
  }
}

export function currentView(): MediaFlowView | string {
  return window.MediaFlowRuntime?.getCurrentView?.() || 'dashboard';
}

export function requestLegacyRender() {
  window.MediaFlowRuntime?.requestRender?.();
}

export function readThemeToken(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
