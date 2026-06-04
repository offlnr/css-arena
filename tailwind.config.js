/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Fondos
        'dark-bg': '#0F1419',
        'dark-bg-secondary': '#1A1E27',
        'dark-bg-tertiary': '#242A35',
        'dark-card': '#2A3038',
        
        // Verdes (Brand)
        'neon-green': '#00FF88',
        'neon-green-dark': '#00CC66',
        'neon-green-light': '#33FF99',
        
        // Azules y otros
        'primary-blue': '#2563EB',
        'light-blue': '#60A5FA',
        'accent-yellow': '#FBBF24',
        'error-red': '#EF4444',
        
        // Textos
        'text-white': '#FFFFFF',
        'text-secondary': '#A0A0A0',
        'text-muted': '#707070',
        'border-color': '#3A4048',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'monospace'],
      },
      borderRadius: {
        'sm': '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
      },
      boxShadow: {
        'glow-green': '0 0 20px rgba(0, 255, 136, 0.3)',
      },
    },
  },
  plugins: [],
}

