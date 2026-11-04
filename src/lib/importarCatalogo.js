import { PROVEEDORES_TEJIDO } from './constantes'
import { claveDe, refNumerica } from './catalogoTelas'

const PROVEEDORES = PROVEEDORES_TEJIDO.filter((p) => p !== 'Otro')
const IVA = 1.21

export const norm = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

function distancia(a, b) {
  const m = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) m[0][j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return m[a.length][b.length]
}

// El nombre de la hoja es el del proveedor (tolera pequeñas diferencias: "Drapers" ↔ "Drappers")
export function proveedorDeHoja(hoja) {
  const h = norm(hoja)
  return (
    PROVEEDORES.find((p) => norm(p) === h) ??
    PROVEEDORES.find((p) => h.includes(norm(p))) ??
    (h.length >= 4 ? PROVEEDORES.find((p) => distancia(norm(p), h) <= 2) : undefined) ??
    null
  )
}

export function parsePrecio(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  if (v === '' || v == null) return null
  let s = String(v).replace(/[€\s]/g, '')
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.')
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

// Convierte las filas de una hoja en registros del catálogo.
// Formato: BOOK | No. | REF | REF | METRO | TRAJE | TRAJE+IVA | PANTALON | PANTALON+IVA | AMERICANA | AMERICANA+IVA
// (puede haber filas de título encima de los encabezados)
export function parsearHoja(datos, proveedor) {
  let fTit = -1
  for (let i = 0; i < Math.min(datos.length, 40); i++) {
    const celdas = datos[i].map(norm)
    if (celdas.some((c) => c.startsWith('ref')) && celdas.some((c) => /traj|metro|pant|americ/.test(c))) {
      fTit = i
      break
    }
  }
  if (fTit === -1) return { error: 'no encuentro la fila de títulos (BOOK, REF, METRO, TRAJE…)' }

  const cab = datos[fTit].map(norm)
  const iBook = cab.findIndex((c) => c.includes('book') || c.includes('libro'))
  const iRefs = cab.map((c, i) => (c.startsWith('ref') ? i : -1)).filter((i) => i >= 0)
  const iMetro = cab.findIndex((c) => c.includes('metro'))
  const col = (k) => [
    cab.findIndex((c) => c.includes(k) && !c.includes('iva')),
    cab.findIndex((c) => c.includes(k) && c.includes('iva')),
  ]
  const [iTraje, iTrajeIva] = col('traj')
  const [iPant, iPantIva] = col('pant')
  const [iAme, iAmeIva] = col('americ')

  const leer = (f, i) => (i >= 0 ? parsePrecio(f[i]) : null)
  const par = (sin, con) => {
    if (sin === null && con !== null) sin = Math.round(con / IVA)
    if (con === null && sin !== null) con = Math.round(sin * IVA)
    return [sin, con]
  }

  const porClave = new Map()
  let libroActual = ''
  for (let r = fTit + 1; r < datos.length; r++) {
    const f = datos[r]
    // si las celdas del libro están combinadas, las filas siguientes llegan vacías: se arrastra el último
    const libro = iBook >= 0 ? String(f[iBook] ?? '').trim() : ''
    if (libro) libroActual = libro

    const desde = String(f[iRefs[0]] ?? '').trim()
    if (!desde) continue
    let hasta = iRefs.length > 1 ? String(f[iRefs[1]] ?? '').trim() : ''
    if (!hasta) hasta = desde

    const metro = leer(f, iMetro)
    const [traje, trajeIva] = par(leer(f, iTraje), leer(f, iTrajeIva))
    const [pantalon, pantalonIva] = par(leer(f, iPant), leer(f, iPantIva))
    const [americana, americanaIva] = par(leer(f, iAme), leer(f, iAmeIva))
    if ([metro, traje, pantalon, americana].every((v) => v === null)) continue

    let dn = refNumerica(desde)
    let hn = refNumerica(hasta)
    if (dn !== null && hn === null) hn = dn
    if (dn === null) hn = null
    if (dn !== null && hn !== null && dn > hn) [dn, hn] = [hn, dn]

    porClave.set(claveDe(desde), {
      proveedor,
      libro: libroActual || null,
      ref_desde: desde,
      ref_hasta: hasta,
      clave: claveDe(desde),
      desde_num: dn,
      hasta_num: hn,
      precio_metro: metro,
      traje,
      traje_iva: trajeIva,
      pantalon,
      pantalon_iva: pantalonIva,
      americana,
      americana_iva: americanaIva,
      actualizado_en: new Date().toISOString(),
    })
  }
  return { registros: [...porClave.values()] }
}
