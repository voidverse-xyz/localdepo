/** @type {import('tailwindcss').Config} */
// ESM config ("type": "module"). Preflight is OFF during the migration so the
// existing hand-written CSS in globals.css keeps rendering unchanged; it will
// be re-enabled once components are fully migrated to utilities. The theme
// mirrors the CSS custom properties in globals.css so utilities use the same
// design tokens (e.g. `bg-surface`, `text-muted`, `border-line`, `rounded`).
const tailwindConfig = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  corePlugins: {
    preflight: false,
  },
  // `hover:` utilities only apply on devices with a real pointer, so taps on
  // touchscreens don't get stuck in a hover state (matches our CSS fix).
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      colors: {
        fg: 'var(--color-text)',
        muted: 'var(--color-text-dim)',
        surface: 'var(--color-surface)',
        'surface-solid': 'var(--color-surface-solid)',
        line: 'var(--color-border)',
        accent: 'var(--color-accent)',
        danger: 'var(--color-danger)',
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        sm: 'var(--radius-sm)',
      },
      boxShadow: {
        card: 'var(--shadow)',
      },
      fontFamily: {
        sans: 'var(--font)',
      },
    },
  },
  plugins: [],
};

export default tailwindConfig;
