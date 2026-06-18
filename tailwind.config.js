/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bus: {
          50: '#EAF7FF',
          100: '#CFEFFF',
          300: '#5EC7F4',
          500: '#0878BE',
          600: '#0567A4',
          700: '#074F80',
          900: '#072B50',
        },
        star: {
          100: '#FFF3B8',
          300: '#FFE169',
          400: '#FFD43B',
          500: '#F9B800',
        },
        ink: {
          50: '#F8FAFC',
          100: '#EEF4F8',
          300: '#C7D6E3',
          500: '#64748B',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        cream: '#FFF8E6',
        coral: '#FF7A45',
      },
      borderRadius: {
        card: '28px',
        panel: '36px',
      },
      boxShadow: {
        soft: '0 20px 60px rgba(7, 43, 80, 0.14)',
        card: '0 16px 38px rgba(8, 120, 190, 0.12)',
        lift: '0 16px 28px rgba(7, 43, 80, 0.20)',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans TC', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
