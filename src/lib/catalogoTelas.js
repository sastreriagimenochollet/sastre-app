import { supabase } from './supabase'

export const claveDe = (ref) => String(ref ?? '').trim().toLowerCase()

// "10120" → 10120 ; "LP-88" → null (referencia con letras)
export function refNumerica(ref) {
  const t = String(ref ?? '').replace(/\s/g, '').replace(',', '.')
  return /^\d+(\.\d+)?$/.test(t) ? Number(t) : null
}

// Busca en el catálogo el libro cuyo rango contiene la referencia.
// Devuelve { libro, precio_metro, lista } o null si no está.
export async function buscarEnCatalogo(proveedor, referencia) {
  if (!proveedor || !claveDe(referencia)) return null
  const n = refNumerica(referencia)
  let q = supabase.from('catalogo_telas').select('*').eq('proveedor', proveedor)
  q = n !== null ? q.lte('desde_num', n).gte('hasta_num', n) : q.eq('clave', claveDe(referencia))
  const { data, error } = await q.limit(1)
  if (error || !data?.length) return null
  const r = data[0]
  return {
    libro: r.libro ?? '',
    precio_metro: r.precio_metro ?? '',
    lista: {
      traje: r.traje,
      traje_iva: r.traje_iva,
      pantalon: r.pantalon,
      pantalon_iva: r.pantalon_iva,
      americana: r.americana,
      americana_iva: r.americana_iva,
    },
  }
}

const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v))

// Precio de lista (con IVA) de un tipo de trabajo, según la lista de un tejido
export function precioListaPara(tipo, lista) {
  if (!lista || !tipo) return null
  switch (tipo) {
    case 'Traje':
      return num(lista.traje_iva)
    case 'Americana':
      return num(lista.americana_iva)
    case 'Pantalón':
      return num(lista.pantalon_iva)
    case 'Americana-Pantalón': {
      const a = num(lista.americana_iva)
      const p = num(lista.pantalon_iva)
      return a !== null && p !== null ? a + p : null
    }
    default:
      return null
  }
}

// El tejido con el mismo número que la prenda va primero (prenda 2 ↔ tejido 2);
// si no tiene lista, se usa el primer tejido que la tenga.
export function sugerirPrecio(tipo, tejidos, indice) {
  const orden = [tejidos[indice], ...tejidos]
  for (const t of orden) {
    const p = precioListaPara(tipo, t?.lista)
    if (p !== null) return p
  }
  return null
}
