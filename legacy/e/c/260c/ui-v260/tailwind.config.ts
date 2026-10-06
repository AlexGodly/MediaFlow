import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        mf: {
          bg: 'var(--bg)',
          panel: 'var(--panel)',
          raised: 'var(--panel-raised)',
          border: 'var(--border)',
          text: 'var(--text)',
          dim: 'var(--text-dim)',
          muted: 'var(--text-mute)',
          flow: 'var(--flow)'
        }
      },
      borderRadius: {
        mf: '15px',
        'mf-lg': '20px'
      },
      fontFamily: {
        body: ['var(--font-body)'],
        display: ['var(--font-display)']
      }
    }
  },
  plugins: []
} satisfies Config;
