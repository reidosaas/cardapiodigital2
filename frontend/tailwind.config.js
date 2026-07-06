const path = require('path');
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    path.resolve(__dirname, 'src/pages/**/*.{js,ts,jsx,tsx,mdx}'),
    path.resolve(__dirname, 'src/components/**/*.{js,ts,jsx,tsx,mdx}'),
    path.resolve(__dirname, 'src/app/**/*.{js,ts,jsx,tsx,mdx}'),
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
  safelist: [
    'bg-background', 'bg-foreground', 'bg-card', 'bg-card-foreground', 'bg-popover', 'bg-popover-foreground',
    'bg-primary', 'bg-primary-foreground', 'bg-secondary', 'bg-secondary-foreground',
    'bg-muted', 'bg-muted-foreground', 'bg-accent', 'bg-accent-foreground', 'bg-destructive', 'bg-destructive-foreground',
    'bg-border', 'bg-input', 'bg-ring',
    'text-background', 'text-foreground', 'text-card', 'text-card-foreground', 'text-popover', 'text-popover-foreground',
    'text-primary', 'text-primary-foreground', 'text-secondary', 'text-secondary-foreground',
    'text-muted', 'text-muted-foreground', 'text-accent', 'text-accent-foreground', 'text-destructive', 'text-destructive-foreground',
    'border-background', 'border-foreground', 'border-card', 'border-card-foreground', 'border-popover', 'border-popover-foreground',
    'border-primary', 'border-primary-foreground', 'border-secondary', 'border-secondary-foreground',
    'border-muted', 'border-muted-foreground', 'border-accent', 'border-accent-foreground', 'border-destructive', 'border-destructive-foreground',
    'border-border', 'border-input', 'border-ring',
    'ring-background', 'ring-foreground', 'ring-primary', 'ring-ring',
  ],
};
