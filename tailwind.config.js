/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],
  theme: {
    extend: {
      colors: {
        border: 'var(--color-border)', /* slate-200 / slate-700 */
        input: 'var(--color-input)', /* slate-200 / slate-700 */
        ring: 'var(--color-ring)', /* blue-600 / blue-700 */
        background: 'var(--color-background)', /* slate-50 / custom-dark */
        foreground: 'var(--color-foreground)', /* slate-900 / gray-200 */
        primary: {
          DEFAULT: 'var(--color-primary)', /* blue-600 / blue-700 */
          foreground: 'var(--color-primary-foreground)', /* white */
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)', /* slate-500 / slate-600 */
          foreground: 'var(--color-secondary-foreground)', /* white */
        },
        accent: {
          DEFAULT: 'var(--color-accent)', /* emerald-500 / emerald-600 */
          foreground: 'var(--color-accent-foreground)', /* white */
        },
        destructive: {
          DEFAULT: 'var(--color-destructive)', /* red-500 / red-600 */
          foreground: 'var(--color-destructive-foreground)', /* white */
        },
        success: {
          DEFAULT: 'var(--color-success)', /* emerald-500 / emerald-600 */
          foreground: 'var(--color-success-foreground)', /* white */
        },
        warning: {
          DEFAULT: 'var(--color-warning)', /* amber-500 / amber-600 */
          foreground: 'var(--color-warning-foreground)', /* white */
        },
        error: {
          DEFAULT: 'var(--color-error)', /* red-500 / red-600 */
          foreground: 'var(--color-error-foreground)', /* white */
        },
        muted: {
          DEFAULT: 'var(--color-muted)', /* slate-100 / slate-700 */
          foreground: 'var(--color-muted-foreground)', /* slate-500 / slate-400 */
        },
        card: {
          DEFAULT: 'var(--color-card)', /* white / slate-800 */
          foreground: 'var(--color-card-foreground)', /* slate-700 / slate-200 */
        },
        popover: {
          DEFAULT: 'var(--color-popover)', /* white / slate-800 */
          foreground: 'var(--color-popover-foreground)', /* slate-700 / slate-200 */
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)', /* 4px */
        md: 'var(--radius-md)', /* 8px */
        lg: 'var(--radius-lg)', /* 12px */
        xl: 'var(--radius-xl)', /* 16px */
      },
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        caption: ['Source Sans 3', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        '4': '4px',
        '8': '8px',
        '12': '12px',
        '16': '16px',
        '24': '24px',
        '32': '32px',
        '48': '48px',
        '64': '64px',
        '96': '96px',
      },
      maxWidth: {
        'prose': '75ch',
      },
      transitionDuration: {
        'smooth': '250ms',
      },
      transitionTimingFunction: {
        'smooth': 'ease-out',
      },
      zIndex: {
        'base': '0',
        'card': '1',
        'dropdown': '50',
        'overlay': '75',
        'modal': '200',
        'toast': '300',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('tailwindcss-animate'),
  ],
}