import { ESTADOS } from './constantes'
import { ESTADOS_CAMISERIA } from './camiseriaConfig'

const FIN = '9999-12-31'

export function estadoDe(p) {
  return p.rubro === 'camiseria' ? p.camiseria_seguimiento?.[0]?.estado ?? 'creada' : p.estado
}

export function estaEntregado(p) {
  return estadoDe(p) === (p.rubro === 'camiseria' ? 'entregada' : 'entregado')
}

export function etapasDe(p) {
  return p.rubro === 'camiseria' ? ESTADOS_CAMISERIA : ESTADOS
}

export function siguienteEtapa(p) {
  const lista = etapasDe(p)
  const i = lista.findIndex((e) => e.id === estadoDe(p))
  return i >= 0 && i < lista.length - 1 ? lista[i + 1] : null
}

const porEntrega = (a, b) => (a.p.fecha_entrega_estimada || FIN).localeCompare(b.p.fecha_entrega_estimada || FIN)

// Calcula todo lo que hay pendiente de hacer, listo para pintar.
export function calcularPlan({ pedidos, tejidos, composturas, camisas, items }) {
  const pedidoPorId = Object.fromEntries(pedidos.map((p) => [p.id, p]))
  const agrupar = (filas) => {
    const m = {}
    for (const f of filas) (m[f.pedido_id] ??= []).push(f)
    return m
  }
  const tejidosPorPedido = agrupar(tejidos)
  const camisasPorPedido = agrupar(camisas)
  const itemsPorPedido = agrupar(items)
  for (const k in itemsPorPedido) itemsPorPedido[k].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))

  // 1. Camisas creadas que todavía no se han pasado al proveedor
  const camisasPorPasar = pedidos
    .filter((p) => p.rubro === 'camiseria' && estadoDe(p) === 'creada')
    .map((p) => ({ p, camisas: camisasPorPedido[p.id] ?? [] }))
    .sort(porEntrega)

  // 2. Telas por pedir (tejidos sin marcar como pedidos), agrupadas por proveedor
  const telasPorProveedor = {}
  let totalTelas = 0
  for (const t of tejidos) {
    const p = pedidoPorId[t.pedido_id]
    if (!p || p.rubro === 'camiseria' || estaEntregado(p) || t.comprada) continue
    if (!t.proveedor && !(t.referencia ?? '').trim()) continue // fila vacía
    const nombre = t.proveedor || 'Sin proveedor'
    ;(telasPorProveedor[nombre] ??= []).push({ t, p })
    totalTelas += 1
  }
  const telas = Object.entries(telasPorProveedor)
    .map(([proveedor, filas]) => ({ proveedor, filas: filas.sort((a, b) => porEntrega({ p: a.p }, { p: b.p })) }))
    .sort((a, b) => b.filas.length - a.filas.length || a.proveedor.localeCompare(b.proveedor))

  // 3. Sastrería por cortar: en la etapa previa al corte y con la tela ya pedida
  const porCortar = []
  let esperandoTela = 0
  for (const p of pedidos) {
    if (p.rubro === 'camiseria' || p.estado !== 'primera_prueba') continue
    const tj = (tejidosPorPedido[p.id] ?? []).filter((t) => t.proveedor || (t.referencia ?? '').trim())
    if (tj.length > 0 && !tj.every((t) => t.comprada)) {
      esperandoTela += 1
      continue
    }
    porCortar.push({ p, tejidos: tj, sinTela: tj.length === 0, items: itemsPorPedido[p.id] ?? [] })
  }
  porCortar.sort(porEntrega)

  // 4. Composturas pendientes: hasta que se marquen como hechas o el pedido pase de fase
  const composturasPendientes = composturas
    .map((c) => ({ c, p: pedidoPorId[c.pedido_id] }))
    .filter(
      ({ c, p }) =>
        p &&
        !c.completada &&
        !estaEntregado(p) &&
        (c.estado_al_crear == null || c.estado_al_crear === estadoDe(p))
    )
    .sort(porEntrega)

  return { camisasPorPasar, telas, totalTelas, porCortar, esperandoTela, composturasPendientes }
}
