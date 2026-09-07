/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        lino: '#F6F3EC',       // fondo cálido, tela cruda
        tinta: '#241F1A',      // negro cálido para texto
        bronce: {
          50: '#F7F8F5',
          100: '#E7EAE2',    // borde neutro (antes dorado claro)
          300: '#B9C4AF',    // borde de foco (antes dorado)
          500: '#7C9473',    // verde salvia (antes dorado)
          600: '#64785C',
          700: '#4F5F49',
        },
        carrete: {
          azul: '#5B7C99',     // pendiente
          ambar: '#C98A3E',    // en corte
          lila: '#8E7CA8',     // primera prueba
          verde: '#6E8F6B',    // finalizado
          gris: '#8A8378',     // entregado
        },
      },
      fontFamily: {
        serif: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
      },
    },
  },
  plugins: [],
}
