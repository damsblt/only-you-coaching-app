/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Couleurs inspirées du site Chamica - palette rose/mauve
        primary: {
          50: '#F5E6E0',   // Beige/crème (fond principal)
          100: '#F0DDD5',
          200: '#EBD4CA',
          300: '#E6CBBF',
          400: '#E1C2B4',
          500: '#F5E6E0',  // Main primary color (fond)
          600: '#DCC3B5',
          700: '#D3BAA0',
          800: '#CAB18B',
          900: '#C1A876',
        },
        secondary: {
          50: '#EDD4D7',   // Rose poudré clair
          100: '#E6C4C8',
          200: '#DFB4B9',
          300: '#D8A4AA',
          400: '#D1949B',
          500: '#C8A0A0',  // Rose poudré principal
          600: '#BF8A8A',
          700: '#B67474',
          800: '#AD5E5E',
          900: '#A44848',
        },
        accent: {
          50: '#F4D8DC',   // Rose corail clair
          100: '#EEC4C9',
          200: '#E8B0B6',
          300: '#E29CA3',
          400: '#DC8890',
          500: '#D4888C',  // Rose corail (accents)
          600: '#CE7478',
          700: '#C86064',
          800: '#C24C50',
          900: '#BC383C',
        },
        burgundy: {
          50: '#E8D3D5',
          100: '#DFC0C2',
          200: '#D6ADAF',
          300: '#CD9A9C',
          400: '#C48789',
          500: '#A65959',  // Bordeaux/burgundy (barre supérieure)
          600: '#9D4F4F',
          700: '#944545',
          800: '#8B3B3B',
          900: '#823131',
        },
        neutral: {
          50: '#F9F9F8',
          100: '#F3F3F2',
          200: '#EDEDED',
          300: '#E7E7E6',
          400: '#E1E1E0',
          500: '#DBDBDA',  // Gris neutre
          600: '#C5C5C4',
          700: '#AFAFAE',
          800: '#999998',
          900: '#838382',
        },
        // Keep original colors for compatibility
        rose: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
        purple: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
        '6xl': '3rem',
        '7xl': '3.5rem',
        '8xl': '4rem',
        '9xl': '4.5rem',
        '10xl': '5rem',
        'custom': '1.5rem 3rem 1.5rem 3rem',
        'wave': '50% 50% 50% 50%',
        'organic': '60% 40% 30% 70% / 60% 30% 70% 40%',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'wave': 'wave 3s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 3s infinite',
        'gradient': 'gradient 15s ease infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(5deg)' },
        },
        wave: {
          '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '50%': { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
        },
        gradient: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'curved-gradient': 'linear-gradient(135deg, #F5E6E0 0%, #C8A0A0 50%, #A65959 100%)',
        'organic-gradient': 'linear-gradient(45deg, #F5E6E0 0%, #C8A0A0 25%, #D4888C 50%, #F5E6E0 75%, #C8A0A0 100%)',
        'soft-gradient': 'linear-gradient(135deg, #F5E6E0 0%, #EDD4D7 50%, #C8A0A0 100%)',
        'warm-gradient': 'linear-gradient(45deg, #F5E6E0 0%, #D4888C 100%)',
        'elegant-gradient': 'linear-gradient(135deg, #A65959 0%, #C8A0A0 50%, #F5E6E0 100%)',
        'hero-gradient': 'linear-gradient(135deg, #F5E6E0 0%, #EDD4D7 100%)',
        'burgundy-gradient': 'linear-gradient(90deg, #A65959 0%, #C48789 100%)',
      },
      boxShadow: {
        'curved': '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        'floating': '0 20px 40px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        'organic': '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
      },
    },
  },
  plugins: [],
}