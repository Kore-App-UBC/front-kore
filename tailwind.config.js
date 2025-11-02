/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'midnight-900': '#04060F',
        'midnight-800': '#080D1A',
        accent: '#7F5AF0',
        'accent-soft': '#9A84FF',
        muted: '#A0ABC6',
        surface: 'rgba(18, 24, 37, 0.72)',
        'surface-strong': 'rgba(20, 28, 44, 0.82)',
        'surface-transparent': 'rgba(9, 13, 25, 0.35)',
        outline: 'rgba(255, 255, 255, 0.08)',
        'outline-strong': 'rgba(255, 255, 255, 0.16)',
        success: '#2CB67D',
        danger: '#EF4565',
        warning: '#F2A74B',
      },
      borderRadius: {
        '3xl': '28px',
        '4xl': '36px',
      },
      spacing: {
        18: '4.5rem',
      },
    },
  },
  plugins: [],
}

