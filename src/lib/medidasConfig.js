// ------------------------------------------------------------
// AMERICANA
// ------------------------------------------------------------
export const CAMPOS_AMERICANA = [
  { key: 'am_largo', label: 'Largo' },
  { key: 'am_talle', label: 'Talle' },
  { key: 'am_pecho', label: 'Pecho' },
  { key: 'am_cintura', label: 'Cintura' },
  { key: 'am_cadera', label: 'Cadera' },
  { key: 'am_hombro', label: 'Hombro' },
  { key: 'am_cuadro', label: 'Cuadro' },
  { key: 'am_profundidad_sisa', label: 'Profundidad de sisa' },
  { key: 'am_largo_manga_ext', label: 'Largo manga ext.' },
  { key: 'am_largo_manga_int', label: 'Largo manga int.' },
]

// Fórmulas automáticas de Americana. Cada una toma el objeto de
// valores actuales y devuelve el resultado (o null si faltan datos).
export const FORMULAS_AMERICANA = [
  {
    key: 'c1_c2',
    label: 'C1-C2',
    formula: 'Pecho / 6 + 1',
    calcular: (v) => valorValido(v.am_pecho) ? v.am_pecho / 6 + 1 : null,
  },
  {
    key: 'c_c5',
    label: 'C-C5',
    formula: 'Cuadro + 1',
    calcular: (v) => valorValido(v.am_cuadro) ? v.am_cuadro + 1 : null,
  },
  {
    key: 'h_h1',
    label: 'H-H1',
    formula: 'Cadera / 3',
    calcular: (v) => valorValido(v.am_cadera) ? v.am_cadera / 3 : null,
  },
  {
    key: 'd4_d5',
    label: 'D4-D5',
    formula: '(Pecho / 6) × 2 + 5',
    calcular: (v) => valorValido(v.am_pecho) ? (v.am_pecho / 6) * 2 + 5 : null,
  },
  {
    key: 'd5_d6',
    label: 'D5-D6',
    formula: 'Pecho / 4 + 5',
    calcular: (v) => valorValido(v.am_pecho) ? v.am_pecho / 4 + 5 : null,
  },
  {
    key: 'j1_j2',
    label: 'J1-J2',
    formula: 'Pecho / 6 + 2',
    calcular: (v) => valorValido(v.am_pecho) ? v.am_pecho / 6 + 2 : null,
  },
  {
    key: 'k',
    label: 'K',
    formula: 'Profundidad de sisa / 3 − 2',
    calcular: (v) => valorValido(v.am_profundidad_sisa) ? v.am_profundidad_sisa / 3 - 2 : null,
  },
  {
    key: 'h2_h3',
    label: 'H2-H3',
    formula: 'Cadera − (H-H1) + 6',
    // Depende del resultado de H-H1, calculado en el mismo momento.
    calcular: (v) => {
      if (!valorValido(v.am_cadera)) return null
      const hh1 = v.am_cadera / 3
      return v.am_cadera - hh1 + 6
    },
  },
]

// ------------------------------------------------------------
// PANTALÓN
// ------------------------------------------------------------
export const CAMPOS_PANTALON = [
  { key: 'pa_largo', label: 'Largo' },
  { key: 'pa_entrepierna', label: 'Entrepierna' },
  { key: 'pa_caja', label: 'Caja' },
  { key: 'pa_cadera', label: 'Cadera' },
  { key: 'pa_cintura', label: 'Cintura' },
  { key: 'pa_rodilla', label: 'Rodilla' },
  { key: 'pa_bajo', label: 'Bajo' },
]

// ------------------------------------------------------------
// CAMISERÍA
// ------------------------------------------------------------
export const CAMPOS_CAMISERIA = [
  { key: 'ca_cuello', label: 'Cuello' },
  { key: 'ca_espalda', label: 'Espalda' },
  { key: 'ca_pecho', label: 'Pecho' },
  { key: 'ca_cintura', label: 'Cintura' },
  { key: 'ca_cadera', label: 'Cadera' },
  { key: 'ca_largo', label: 'Largo' },
  { key: 'ca_bicep', label: 'Bíceps' },
  { key: 'ca_puno', label: 'Puño' },
  { key: 'ca_largo_manga', label: 'Largo manga' },
]

export const OPCIONES_HOLGURA_CAMISERIA = ['+8', '+10', '+12']

function valorValido(v) {
  return v !== null && v !== undefined && v !== '' && !Number.isNaN(Number(v))
}

export function formatearResultado(n) {
  if (n === null || n === undefined) return '—'
  return Number(n.toFixed(2)).toString()
}
