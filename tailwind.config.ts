import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

export default {
  content: [
    './src/**/*.{ts,tsx}',
    './index.html',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#1A1D27',
          dark: '#0F1117',
          light: '#242736',
          border: '#2A2D3A',
        },
        accent: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
          muted: 'rgba(59, 130, 246, 0.125)',
        },
        priority: {
          low: '#6B7280',
          medium: '#3B82F6',
          high: '#F59E0B',
          urgent: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        mono: ['JetBrains Mono', ...defaultTheme.fontFamily.mono],
      },
    },
  },
  plugins: [],
} satisfies Config
