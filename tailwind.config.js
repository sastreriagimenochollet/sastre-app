/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        lino: '#F6F3EC',       // fondo cálido, tela cruda
        tinta: '#241F1A',      // negro cálido para texto
        bronce: {
          50: '#FBF6EC',
          100: '#F3E6C8',
          300: '#D9B872',
          500: '#B4863A',      // acento principal (hebra dorada)
          600: '#96702E',
          700: '#785823',
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
