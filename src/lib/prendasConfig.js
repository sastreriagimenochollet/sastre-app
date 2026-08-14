// Definición de campos por tipo de prenda, tal como en la ficha
// de pedido en papel: medidas propias de la prenda + detalles de
// confección. Cada campo puede ser texto libre, número, o una
// lista de opciones (select).

export const TIPOS_PRENDA = [
  { id: 'chaqueta', label: 'Chaqueta / Americana' },
  { id: 'pantalon', label: 'Pantalón' },
  { id: 'chaleco', label: 'Chaleco' },
]

export function labelTipoPrenda(id) {
  return TIPOS_PRENDA.find((t) => t.id === id)?.label ?? id
}

// ------------------------------------------------------------
// CHAQUETA / AMERICANA
// ------------------------------------------------------------
export const CAMPOS_CHAQUETA = {
  medidas: [
    { key: 'pecho', label: 'Pecho', tipo: 'numero' },
    { key: 'cintura', label: 'Cintura', tipo: 'numero' },
    { key: 'cadera', label: 'Cadera', tipo: 'numero' },
    { key: 'talle', label: 'Talle', tipo: 'numero' },
    { key: 'largo', label: 'Largo', tipo: 'numero' },
    { key: 'cuadro', label: 'Cuadro', tipo: 'numero' },
    { key: 'manga_l', label: 'Manga L', tipo: 'numero' },
    { key: 'manga_i', label: 'Manga I', tipo: 'numero' },
    { key: 'puno', label: 'Puño', tipo: 'numero' },
    { key: 'hombro', label: 'Hombro', tipo: 'numero' },
    { key: 'prof_sisa', label: 'Prof. sisa', tipo: 'numero' },
  ],
  confeccion: [
    { key: 'delantero', label: 'Delantero', tipo: 'select', opciones: ['Recto', 'Cruzado'] },
    { key: 'solapa', label: 'Solapa', tipo: 'select', opciones: ['Pico', 'Recto'] },
    { key: 'aberturas', label: 'Aberturas', tipo: 'texto' },
    { key: 'botones', label: 'Botones', tipo: 'texto' },
    { key: 'bolsillos', label: 'Bolsillos', tipo: 'texto' },
    { key: 'forro', label: 'Forro', tipo: 'select', opciones: ['Entero', 'Medio'] },
    { key: 'ref_forro', label: 'Referencia forro', tipo: 'texto' },
    { key: 'otros', label: 'Otros', tipo: 'texto' },
  ],
}

// ------------------------------------------------------------
// PANTALÓN
// ------------------------------------------------------------
export const CAMPOS_PANTALON = {
  medidas: [
    { key: 'largo', label: 'Largo', tipo: 'numero' },
    { key: 'entrepierna', label: 'Entrepierna', tipo: 'numero' },
    { key: 'caja', label: 'Caja', tipo: 'numero' },
    { key: 'cadera', label: 'Cadera', tipo: 'numero' },
    { key: 'cintura', label: 'Cintura', tipo: 'numero' },
    { key: 'muslo', label: 'Muslo', tipo: 'numero' },
    { key: 'rodilla', label: 'Rodilla', tipo: 'numero' },
    { key: 'bajo', label: 'Bajo', tipo: 'numero' },
  ],
  confeccion: [
    { key: 'bragueta', label: 'Bragueta', tipo: 'select', opciones: ['Cremallera', 'Botones'] },
    { key: 'trincha', label: 'Trincha (cm)', tipo: 'texto' },
    { key: 'pasadores', label: 'Pasadores', tipo: 'texto' },
    { key: 'bolsillo', label: 'Bolsillo', tipo: 'select', opciones: ['Italiano', 'Americano', 'Cartera'] },
    { key: 'revolvera', label: 'Revolvera', tipo: 'select', opciones: ['Sí', 'No'] },
    { key: 'relojera', label: 'Relojera', tipo: 'select', opciones: ['Sí', 'No'] },
    { key: 'delantero', label: 'Delantero', tipo: 'texto' },
    { key: 'ardillon', label: 'Ardillón', tipo: 'select', opciones: ['Sí', 'No'] },
    { key: 'bajo_tipo', label: 'Tipo de bajo', tipo: 'select', opciones: ['Recto', 'Vuelta'] },
    { key: 'forro', label: 'Forro', tipo: 'texto' },
    { key: 'otros', label: 'Otros', tipo: 'texto' },
  ],
}

// ------------------------------------------------------------
// CHALECO
// ------------------------------------------------------------
export const CAMPOS_CHALECO = {
  medidas: [
    { key: 'pecho', label: 'Pecho', tipo: 'numero' },
    { key: 'cintura', label: 'Cintura', tipo: 'numero' },
    { key: 'cadera', label: 'Cadera', tipo: 'numero' },
    { key: 'primer_boton', label: '1er botón', tipo: 'numero' },
    { key: 'ultimo_boton', label: 'Último botón', tipo: 'numero' },
    { key: 'largo_delantero', label: 'Largo delantero', tipo: 'numero' },
    { key: 'talle', label: 'Talle', tipo: 'numero' },
    { key: 'largo_espalda', label: 'Largo espalda', tipo: 'numero' },
  ],
  confeccion: [
    { key: 'cruzado', label: 'Cruzado', tipo: 'select', opciones: ['Sí', 'No'] },
    { key: 'solapa', label: 'Solapa', tipo: 'select', opciones: ['Pico', 'Recto', 'Sin solapa'] },
    { key: 'espalda', label: 'Espalda', tipo: 'texto' },
    { key: 'forro', label: 'Forro', tipo: 'texto' },
    { key: 'ref_forro', label: 'Referencia forro', tipo: 'texto' },
  ],
}

export function camposPorTipo(tipo) {
  if (tipo === 'chaqueta') return CAMPOS_CHAQUETA
  if (tipo === 'pantalon') return CAMPOS_PANTALON
  if (tipo === 'chaleco') return CAMPOS_CHALECO
  return { medidas: [], confeccion: [] }
}
