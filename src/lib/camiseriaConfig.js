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

// ------------------------------------------------------------
// Campos de confección de una camisa (estilo/construcción,
// texto libre — no hay opciones fijas por ahora)
// ------------------------------------------------------------
export const CAMPOS_CONFECCION_CAMISA = [
  { key: 'cuello', label: 'Cuello' },
  { key: 'puno', label: 'Puño' },
  { key: 'tapeta', label: 'Tapeta' },
  { key: 'espalda', label: 'Espalda' },
  { key: 'manga', label: 'Manga' },
  { key: 'sardineta', label: 'Sardineta' },
  { key: 'canesu', label: 'Canesú' },
  { key: 'bolsillo', label: 'Bolsillo' },
  { key: 'bajo', label: 'Bajo' },
]

// ------------------------------------------------------------
// Medidas propias de la camisa (distintas de los campos de
// confección de arriba — aquí van números). Coinciden con los
// campos de Camisería en la ficha del cliente para poder
// traerlas o guardarlas ahí con un botón.
// ------------------------------------------------------------
export const CAMPOS_MEDIDAS_CAMISA = [
  { key: 'medida_cuello', label: 'Cuello', campoCliente: 'ca_cuello' },
  { key: 'medida_espalda', label: 'Espalda', campoCliente: 'ca_espalda' },
  { key: 'medida_pecho', label: 'Pecho', campoCliente: 'ca_pecho' },
  { key: 'medida_cintura', label: 'Cintura', campoCliente: 'ca_cintura' },
  { key: 'medida_cadera', label: 'Cadera', campoCliente: 'ca_cadera' },
  { key: 'medida_largo', label: 'Largo', campoCliente: 'ca_largo' },
  { key: 'medida_bicep', label: 'Bíceps', campoCliente: 'ca_bicep' },
  { key: 'medida_puno', label: 'Puño', campoCliente: 'ca_puno' },
  { key: 'medida_largo_manga', label: 'Largo manga', campoCliente: 'ca_largo_manga' },
]

export const OPCIONES_HOLGURA_CAMISA = ['+8', '+10', '+12']

// Trae las medidas ya guardadas del cliente hacia una camisa nueva
export function mapearMedidasClienteACamisa(medidasCliente) {
  if (!medidasCliente) return {}
  const resultado = {}
  for (const c of CAMPOS_MEDIDAS_CAMISA) {
    const valor = medidasCliente[c.campoCliente]
    if (valor !== null && valor !== undefined) resultado[c.key] = valor
  }
  if (medidasCliente.ca_holgura) resultado.medida_holgura = medidasCliente.ca_holgura
  return resultado
}

// Guarda las medidas escritas en una camisa hacia la ficha del
// cliente (botón "Guardar en ficha" / "Añadir a master")
export function mapearMedidasCamisaACliente(detalles) {
  const resultado = {}
  for (const c of CAMPOS_MEDIDAS_CAMISA) {
    const valor = detalles?.[c.key]
    if (valor !== null && valor !== undefined && valor !== '') resultado[c.campoCliente] = valor
  }
  if (detalles?.medida_holgura) resultado.ca_holgura = detalles.medida_holgura
  return resultado
}
