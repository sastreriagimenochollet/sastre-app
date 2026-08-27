export const ESTADOS = [
  { id: 'pendiente', label: 'Pendiente', color: 'carrete-azul' },
  { id: 'en_corte', label: 'Corte', color: 'carrete-ambar' },
  { id: 'primera_prueba', label: '1ª Prueba', color: 'carrete-lila' },
  { id: 'segunda_prueba', label: '2ª Prueba', color: 'carrete-morado' },
  { id: 'tercera_prueba', label: '3ª Prueba', color: 'carrete-rosa' },
  { id: 'finalizado', label: 'Terminado', color: 'carrete-verde' },
  { id: 'entregado', label: 'Entregado', color: 'carrete-gris' },
]

export const ESTADO_COLOR_HEX = {
  pendiente: '#5B7C99',
  en_corte: '#C98A3E',
  primera_prueba: '#8E7CA8',
  segunda_prueba: '#A868A0',
  tercera_prueba: '#C9748F',
  finalizado: '#6E8F6B',
  entregado: '#8A8378',
}

export const RUBROS = [
  { id: 'sastreria', label: 'Sastrería', color: '#B4863A' },
  { id: 'camiseria', label: 'Camisería', color: '#5B7C99' },
  { id: 'medida_industrial', label: 'Medida Industrial', color: '#6E8F6B' },
]

export function labelEstado(id) {
  return ESTADOS.find((e) => e.id === id)?.label ?? id
}

export function colorEstado(id) {
  return ESTADO_COLOR_HEX[id] ?? '#8A8378'
}

export function labelRubro(id) {
  return RUBROS.find((r) => r.id === id)?.label ?? id
}

export function colorRubro(id) {
  return RUBROS.find((r) => r.id === id)?.color ?? '#B4863A'
}

export const CAMPOS_MEDIDAS_BASICAS = [
  { key: 'altura', label: 'Altura', unidad: 'cm' },
  { key: 'cuello', label: 'Cuello', unidad: 'cm' },
  { key: 'pecho', label: 'Pecho', unidad: 'cm' },
  { key: 'cintura_natural', label: 'Cintura natural', unidad: 'cm' },
  { key: 'cadera', label: 'Cadera', unidad: 'cm' },
  { key: 'largo_manga', label: 'Largo de manga', unidad: 'cm' },
  { key: 'entrepierna', label: 'Entrepierna', unidad: 'cm' },
  { key: 'largo_exterior', label: 'Largo exterior (cintura-suelo)', unidad: 'cm' },
]

export const CAMPOS_MEDIDAS_AVANZADAS = [
  { key: 'hombro', label: 'Hombro', unidad: 'cm' },
  { key: 'espalda_ancho', label: 'Ancho de espalda', unidad: 'cm' },
  { key: 'bicep', label: 'Bíceps', unidad: 'cm' },
  { key: 'muneca', label: 'Muñeca', unidad: 'cm' },
  { key: 'muslo', label: 'Muslo', unidad: 'cm' },
  { key: 'rodilla', label: 'Rodilla', unidad: 'cm' },
  { key: 'bajo_pantalon', label: 'Bajo de pantalón', unidad: 'cm' },
  { key: 'talle_espalda', label: 'Talle espalda', unidad: 'cm' },
  { key: 'talle_delantero', label: 'Talle delantero', unidad: 'cm' },
]
