/** @type {import('tailwindcss').Config} */
// Loaded explicitly by globals.css. Preflight is omitted there so the existing
// styles keep control of resets. These tokens follow the active UI theme.
const tailwindConfig = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
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
