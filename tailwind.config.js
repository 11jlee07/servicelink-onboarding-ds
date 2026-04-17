/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        // ── EXOS semantic tokens (use these in new components) ──────────
        exos: {
          // Action (blue)
          'action-primary':   '#066dce',
          'action-dark':      '#0559a9',
          'action-light':     '#e4f2fe',
          'action-lighter':   '#eff7fe',
          // Text
          'text-primary':     '#05152a',
          'text-secondary':   '#304258',
          'text-tertiary':    '#687885',
          'text-invert':      '#ffffff',
          // Surfaces
          'bg-white':         '#ffffff',
          'bg-light':         '#f0f2f5',
          'bg-lighter':       '#f7f8fa',
          'bg-screen':        '#edf1f7',
          // Success (green)
          'success-primary':  '#1c7c35',
          'success-dark':     '#135223',
          'success-light':    '#effde1',
          'success-lighter':  '#f6fde5',
          // Danger (red)
          'danger-primary':   '#cc3115',
          'danger-dark':      '#9e2610',
          'danger-light':     '#feeae6',
          'danger-lighter':   '#fff0f0',
          // Warning (amber)
          'warning-primary':  '#f9a824',
          'warning-light':    '#feeed3',
          'warning-lighter':  '#fff4e1',
          // Borders
          'border-primary':   '#66747f',
          'border-light':     '#bfcad5',
          'border-lighter':   '#d8dfe6',
        },

        // ── Tailwind default remaps (keep existing components working) ──
        blue: {
          10:  '#eff7fe',
          20:  '#e4f2fe',
          30:  '#bfdcf6',
          40:  '#9ac6ee',
          50:  '#eff7fe',
          100: '#e4f2fe',
          200: '#bfdcf6',
          300: '#9ac6ee',
          400: '#5099de',
          500: '#2b83d6',
          600: '#066dce',
          700: '#0559a9',
          800: '#0a4884',
          900: '#0a2845',
          950: '#071b30',
        },
        emerald: {
          50:  '#f6fde5',
          100: '#effde1',
          200: '#d5f59a',
          300: '#b2ec65',
          400: '#8ede38',
          500: '#1c7c35',
          600: '#1c7c35',
          700: '#176229',
          800: '#124e21',
          900: '#0e3d1a',
          950: '#082611',
        },
        red: {
          50:  '#fff0f0',
          100: '#feeae6',
          200: '#f6cbc3',
          300: '#ffa49e',
          400: '#ff6b60',
          500: '#cc3115',
          600: '#cc3115',
          700: '#9e2610',
          800: '#8a210e',
          900: '#721f10',
          950: '#3e0c05',
        },
        amber: {
          50:  '#fff4e1',
          100: '#feeed3',
          200: '#fde2b6',
          300: '#ffb93a',
          400: '#f9a824',
          500: '#f9a824',
          600: '#e08910',
          700: '#b96a0b',
          800: '#975110',
          900: '#7c4311',
          950: '#482204',
        },
        yellow: {
          400: '#f9a824',
          500: '#f9a824',
        },
        slate: {
          50:  '#edf1f7',
          100: '#f0f2f5',
          200: '#d8dfe6',
          300: '#bfcad5',
          400: '#929faa',
          500: '#687885',
          600: '#66747f',
          700: '#304258',
          800: '#0a2845',
          900: '#05152a',
          950: '#040d1e',
        },
      },
      boxShadow: {
        'card': '0 2px 6px rgba(119,134,148,0.1)',
        'lift': '0 8px 24px rgba(10,40,69,0.08)',
      },
      borderRadius: {
        'exos-sm': '4px',
        'exos':    '8px',
        'exos-lg': '16px',
        'exos-pill': '1000px',
      },
    },
  },
  plugins: [],
}
