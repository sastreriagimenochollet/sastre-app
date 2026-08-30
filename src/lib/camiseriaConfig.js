export const PROVEEDORES_CAMISERIA = ['Repunte', 'E.Berg']
export const TEJIDO_FABRICA_CAMISERIA = ['Fábrica', 'Albini']

export const ESTADOS_CAMISERIA = [
  { id: 'pasada', label: 'Pasada', color: '#5B7C99' },
  { id: 'pagada', label: 'Pagada', color: '#C98A3E' },
  { id: 'recibida', label: 'Recibida', color: '#8E7CA8' },
  { id: 'entregada', label: 'Entregada', color: '#6E8F6B' },
]

export function labelEstadoCamiseria(id) {
  return ESTADOS_CAMISERIA.find((e) => e.id === id)?.label ?? id
}

export function colorEstadoCamiseria(id) {
  return ESTADOS_CAMISERIA.find((e) => e.id === id)?.color ?? '#8A8378'
}
