export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Instrument Serif"', '"Noto Serif Devanagari"', 'Georgia', 'serif'],
        sans: ['Inter', '"Noto Sans Devanagari"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // Editorial palette
        ivory: { DEFAULT: '#FAF8F5', 50: '#FDFCFA', 100: '#FAF8F5', 200: '#F2EDE6' },
        charcoal: { DEFAULT: '#2C2C2C', light: '#4A4A4A', lighter: '#6B6B6B' },
        botanical: { DEFAULT: '#2D5A3D', light: '#3A7350', dark: '#1E3F2B', muted: '#8BAF9A' },
        sage: { DEFAULT: '#A3B8A0', light: '#C5D4C2', dark: '#7A9477' },
        terracotta: { DEFAULT: '#C4704B', light: '#D4916F', muted: '#E8C4B0' },
        coral: { DEFAULT: '#E07A5F' },
        risk: {
          green: '#3A7350',
          yellow: '#C49A3C',
          red: '#B5403A',
        },
        // Keep old medical colors so existing pages don't break
        medical: {
          'blue-light': '#0EA5E9', 'blue-dark': '#0284C7',
          'green': '#10B981', 'red': '#EF4444', 'amber': '#F59E0B',
          'white': '#FFFFFF', 'soft-white': '#F8FAFC',
          'gray-50': '#F9FAFB', 'gray-100': '#F3F4F6', 'gray-200': '#E5E7EB',
          'gray-300': '#D1D5DB', 'gray-400': '#9CA3AF', 'gray-500': '#6B7280',
          'gray-600': '#4B5563', 'gray-700': '#374151', 'gray-800': '#1F2937',
          'gray-900': '#111827',
        },
      },
      spacing: {
        '18': '4.5rem', '22': '5.5rem', '26': '6.5rem', '30': '7.5rem',
      },
      boxShadow: {
        'editorial-sm': '0 1px 3px rgba(44,44,44,0.06)',
        'editorial': '0 4px 12px rgba(44,44,44,0.08)',
        'editorial-lg': '0 12px 40px rgba(44,44,44,0.10)',
        // Keep old shadows
        'medical-sm': '0 1px 2px 0 rgba(0,0,0,0.05)',
        'medical': '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.06)',
        'medical-md': '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.05)',
        'medical-lg': '0 20px 25px -5px rgba(0,0,0,0.08), 0 10px 10px -5px rgba(0,0,0,0.04)',
        'medical-xl': '0 25px 50px -12px rgba(0,0,0,0.12)',
      },
      keyframes: {
        'fade-up': { '0%': { opacity: 0, transform: 'translateY(16px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        'fade-in': { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        'slide-in': { '0%': { opacity: 0, transform: 'translateX(-12px)' }, '100%': { opacity: 1, transform: 'translateX(0)' } },
        'count-up': { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        'fade-in': 'fade-in 0.4s ease-out both',
        'slide-in': 'slide-in 0.4s ease-out both',
        'count-up': 'count-up 0.6s ease-out both',
      },
    },
  },
  plugins: [],
};
