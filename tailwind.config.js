/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // Graphite (neutral dark)
        'bg-primary': '#16171A',
        'bg-secondary': '#202125',
        'surface-elevated': '#2F3034',
        'border-subtle': 'rgba(255,255,255,0.08)',
        'border-default': '#2A2B2F',

        // Text
        'text-primary': '#F8F8F8',
        'text-secondary': '#C8C8D0',
        'text-muted': '#8C9098',

        // Accent (green-teal)
        'primary': '#00B175',
        'primary-hover': '#009864',
        'primary-glow': 'rgba(0,177,117,0.18)',
        'primary-ring': 'rgba(0,177,117,0.35)',

        // Status Colors (badges/alerts)
        'success': '#00B175',
        'success-bg': 'rgba(0,177,117,0.15)',
        'warning': '#FBBF24',
        'warning-bg': 'rgba(251,191,36,0.14)',
        'danger': '#F84838',
        'danger-bg': 'rgba(248,72,56,0.14)',
        'info': '#60A5FA',
        'info-bg': 'rgba(96,165,250,0.14)',
      },
    },
  },
  plugins: [],
};
