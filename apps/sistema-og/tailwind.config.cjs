/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './app.js'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        og: {
          brand: '#ffde17',
          brandDark: '#f4c900',
          dark: '#070707',
          card: '#15171b',
          border: '#30343a',
        },
      },
    },
  },
  safelist: [
    'bg-amber-500', 'bg-amber-500/10', 'text-slate-950', 'shadow-md',
    'bg-slate-900', 'hover:bg-slate-800', 'text-slate-300', 'border',
    'border-slate-700', 'border-b', 'border-slate-800/50', 'hover:bg-slate-800/40',
    'active-vehicle',
  ],
  plugins: [],
};
