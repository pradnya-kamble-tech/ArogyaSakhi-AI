export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        medical: {
          'blue-light': '#0EA5E9',   // Sky blue for primary actions
          'blue-dark': '#0284C7',    // Hospital blue for headers & accents
          'green': '#10B981',         // Emerald green for health/positive
          'red': '#EF4444',           // Medical red for warnings/emergency
          'amber': '#F59E0B',         // Warning amber for caution
          'white': '#FFFFFF',         // Pure white for backgrounds
          'soft-white': '#F8FAFC',   // Soft white for secondary backgrounds
          'gray-50': '#F9FAFB',       // Almost white
          'gray-100': '#F3F4F6',      // Very light gray
          'gray-200': '#E5E7EB',      // Light gray
          'gray-300': '#D1D5DB',      // Medium light gray
          'gray-400': '#9CA3AF',      // Medium gray
          'gray-500': '#6B7280',      // Gray for secondary text
          'gray-600': '#4B5563',      // Dark gray for tertiary text
          'gray-700': '#374151',      // Darker gray
          'gray-800': '#1F2937',      // Very dark gray
          'gray-900': '#111827'       // Almost black
        }
      },
      boxShadow: {
        'medical-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'medical': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'medical-md': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'medical-lg': '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'medical-xl': '0 25px 50px -12px rgba(0, 0, 0, 0.12)'
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem'
      }
    }
  },
  plugins: []
};
