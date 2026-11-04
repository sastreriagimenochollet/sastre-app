import { useMemo, useState } from 'react'
import { AlertTriangle, Check, ArrowRight, X } from 'lucide-react'
import { usePedidos } from '../lib/usePedidos'
import { usePlanTrabajo } from '../lib/usePlanTrabajo'
import { calcularPlan, estadoDe, etapasDe, siguienteEtapa } from '../lib/planTrabajo'
import { ACENTO_SASTRERIA, ACENTO_CAMISERIA, urgenciaEntrega } from '../lib/constantes'
import DetallePedidoModal from '../components/DetallePedidoModal'

const fechaCorta = (f) =>
  new Date(f + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })

function AvisoEntrega({ pedido, yaEntregado }) {
  const u = urgenciaEntrega(pedido.fecha_entrega_estimada, yaEntregado)
  if (u) {
    return (
      <span className="text-xs font-medium inline-flex items-center gap-1" style={{ color: u.color }}>
        <AlertTriangle size={12} />
        {u.nivel === 'vencido'
          ? `Entrega vencida hace ${Math.abs(u.dias)} d`
          : u.dias === 0
          ? 'Entrega hoy'
          : `Entrega en ${u.dias} d`}
      </span>
    )
  }
  if (pedido.fecha_entrega_estimada) {
    return <span className="text-xs text-tinta/45">Entrega {fechaCorta(pedido.fecha_entrega_estimada)}</span>
  }
  return null
}

function Seccion({ id, titulo, nota, color, total, children, pie }) {
  return (
    <section id={id} className="bg-white rounded-card border border-bronce-100 mb-5 overflow-hidden scroll-mt-24">
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 border-b border-bronce-100"
        style={{ borderLeft: `4px solid ${color}` }}
      >
        <div className="min-w-0">
          <p className="font-serif text-lg text-tinta">{titulo}</p>
          {nota && <p className="text-xs text-tinta/45">{nota}</p>}
        </div>
        <span className="shrink-0 text-sm font-medium rounded-full px-3 py-0.5" style={{ backgroundColor: color + '1A', color }}>
          {total}
        </span>
      </div>
      {total === 0 ? <p className="text-sm text-tinta/40 px-4 py-4">Nada pendiente.</p> : children}
      {pie && <p className="text-xs text-tinta/45 px-4 py-2.5 border-t border-bronce-100 bg-lino/60">{pie}</p>}
    </section>
  )
}

function Fila({ pedido, titulo, subtitulo, extra, onAbrir, acciones, yaEntregado = false }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-bronce-100 last:border-b-0">
      <button onClick={() => onAbrir(pedido)} className="flex-1 min-w-0 text-left">
        <p className="text-sm font-medium text-tinta truncate">{titulo}</p>
        {subtitulo && <p className="text-xs text-tinta/60 truncate mt-0.5">{subtitulo}</p>}
        {extra}
        <div className="mt-0.5">
          <AvisoEntrega pedido={pedido} yaEntregado={yaEntregado} />
        </div>
      </button>
      <div className="shrink-0 flex items-center gap-2">{acciones}</div>
    </div>
  )
}

function Boton({ color, onClick, children, suave = false }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-xs font-medium rounded-full px-3 py-1.5 border transition-colors"
      style={suave ? { color, borderColor: color + '66' } : { color: '#fff', backgroundColor: color, borderColor: color }}
    >
      {children}
    </button>
  )
}

export default function PlanTrabajo() {
  const { pedidos, cargando: cargandoPedidos, errorGuardado, limpiarErrorGuardado, actualizarEstado, actualizarEstadoCamiseria } =
    usePedidos()
  const { tejidos, composturas, camisas, items, cargando: cargandoPlan, marcarTejido, marcarCompostura } = usePlanTrabajo()
  const [pedidoAbierto, setPedidoAbierto] = useState(null)

  const plan = useMemo(
    () => calcularPlan({ pedidos, tejidos, composturas, camisas, items }),
    [pedidos, tejidos, composturas, camisas, items]
  )

  function moverEtapa(pedido, etapa) {
    return pedido.rubro === 'camiseria' ? actualizarEstadoCamiseria(pedido.id, etapa.id) : actualizarEstado(pedido.id, etapa.id)
  }

  if (cargandoPedidos || cargandoPlan) {
    return <p className="text-center text-tinta/40 text-sm py-10">Cargando el plan de trabajo…</p>
  }

  const resumen = [
    { id: 'plan-camisas', label: 'Camisas', n: plan.camisasPorPasar.length, color: ACENTO_CAMISERIA },
    { id: 'plan-telas', label: 'Telas', n: plan.totalTelas, color: ACENTO_SASTRERIA },
    { id: 'plan-cortar', label: 'Por cortar', n: plan.porCortar.length, color: ACENTO_SASTRERIA },
    { id: 'plan-composturas', label: 'Composturas', n: plan.composturasPendientes.length, color: '#C98A3E' },
  ]
  const todoAlDia = resumen.every((r) => r.n === 0)

  return (
    <div className="max-w-2xl mx-auto px-4 pb-16 pt-5 scroll-suave">
      <header className="mb-4">
        <h1 className="font-serif text-2xl text-tinta">Plan de trabajo</h1>
        <p className="text-sm text-tinta/50 mt-0.5">Lo que hay que hacer, por orden</p>
      </header>

      {errorGuardado && (
        <div className="mb-4 bg-white border border-red-200 rounded-lg p-3 text-sm text-red-600 flex items-start justify-between gap-3">
          <span>{errorGuardado}</span>
          <button onClick={limpiarErrorGuardado} className="shrink-0 text-red-400">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Resumen: pulsa para ir a cada bloque */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {resumen.map((r) => (
          <button
            key={r.id}
            onClick={() => document.getElementById(r.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="bg-white rounded-card border border-bronce-100 py-3 text-center"
          >
            <p className="font-serif text-2xl" style={{ color: r.n > 0 ? r.color : '#B9C4AF' }}>{r.n}</p>
            <p className="text-[11px] text-tinta/55">{r.label}</p>
          </button>
        ))}
      </div>

      {todoAlDia && <p className="text-center text-tinta/45 text-sm mb-5">No hay nada pendiente. Todo al día.</p>}

      {/* 1. Camisas por pasar */}
      <Seccion
        id="plan-camisas"
        titulo="Camisas por pasar"
        nota="Creadas y aún sin pasar al proveedor"
        color={ACENTO_CAMISERIA}
        total={plan.camisasPorPasar.length}
      >
        {plan.camisasPorPasar.map(({ p, camisas: cs }) => {
          const proveedores = [...new Set(cs.map((c) => c.proveedor).filter(Boolean))]
          return (
            <Fila
              key={p.id}
              pedido={p}
              titulo={p.clientes?.nombre ?? 'Sin cliente'}
              subtitulo={[
                cs.length ? `${cs.length} ${cs.length === 1 ? 'camisa' : 'camisas'}` : p.descripcion || 'Camisería',
                proveedores.join(' · '),
              ]
                .filter(Boolean)
                .join(' · ')}
              onAbrir={setPedidoAbierto}
              acciones={
                <Boton color={ACENTO_CAMISERIA} onClick={() => actualizarEstadoCamiseria(p.id, 'pasada')}>
                  <Check size={13} /> Pasada
                </Boton>
              }
            />
          )
        })}
      </Seccion>

      {/* 2. Telas por pedir */}
      <Seccion
        id="plan-telas"
        titulo="Telas por pedir"
        nota="Agrupadas por proveedor"
        color={ACENTO_SASTRERIA}
        total={plan.totalTelas}
      >
        {plan.telas.map((g) => (
          <div key={g.proveedor}>
            <p className="text-[11px] uppercase tracking-wide text-tinta/45 font-medium px-4 pt-3 pb-1 bg-lino/60">
              {g.proveedor} · {g.filas.length}
            </p>
            {g.filas.map(({ t, p }) => (
              <Fila
                key={t.id}
                pedido={p}
                titulo={p.clientes?.nombre ?? 'Sin cliente'}
                subtitulo={[t.referencia, t.libro, t.metros ? `${Number(t.metros).toLocaleString('es-ES')} m` : '']
                  .filter(Boolean)
                  .join(' · ')}
                onAbrir={setPedidoAbierto}
                acciones={
                  <Boton color={ACENTO_SASTRERIA} onClick={() => marcarTejido(t.id, true)}>
                    <Check size={13} /> Pedida
                  </Boton>
                }
              />
            ))}
          </div>
        ))}
      </Seccion>

      {/* 3. Sastrería por cortar */}
      <Seccion
        id="plan-cortar"
        titulo="Sastrería por cortar"
        nota="Con la tela ya pedida, a la espera de pasar a Corte"
        color={ACENTO_SASTRERIA}
        total={plan.porCortar.length}
        pie={
          plan.esperandoTela > 0
            ? `${plan.esperandoTela} ${plan.esperandoTela === 1 ? 'pedido espera' : 'pedidos esperan'} a que pidas la tela.`
            : null
        }
      >
        {plan.porCortar.map(({ p, tejidos: tj, sinTela, items: its }) => (
          <Fila
            key={p.id}
            pedido={p}
            titulo={p.clientes?.nombre ?? 'Sin cliente'}
            subtitulo={its.length ? its.map((i) => i.tipo).filter(Boolean).join(' · ') : p.descripcion}
            extra={
              sinTela ? (
                <p className="text-xs mt-0.5" style={{ color: '#C98A3E' }}>Sin tela registrada</p>
              ) : (
                <p className="text-xs text-tinta/45 mt-0.5 truncate">
                  {tj.map((t) => [t.proveedor, t.referencia].filter(Boolean).join(' ')).join(' · ')}
                </p>
              )
            }
            onAbrir={setPedidoAbierto}
            acciones={
              <Boton color={ACENTO_SASTRERIA} onClick={() => actualizarEstado(p.id, 'en_corte')}>
                <ArrowRight size={13} /> A Corte
              </Boton>
            }
          />
        ))}
      </Seccion>

      {/* 4. Composturas pendientes */}
      <Seccion
        id="plan-composturas"
        titulo="Composturas pendientes"
        nota="Hasta que las marques como hechas o el pedido pase de fase"
        color="#C98A3E"
        total={plan.composturasPendientes.length}
      >
        {plan.composturasPendientes.map(({ c, p }) => {
          const siguiente = siguienteEtapa(p)
          const anotada = c.estado_al_crear ? etapasDe(p).find((e) => e.id === c.estado_al_crear)?.label : null
          return (
            <Fila
              key={c.id}
              pedido={p}
              titulo={c.descripcion}
              subtitulo={[p.clientes?.nombre ?? 'Sin cliente', p.descripcion, anotada ? `anotada en ${anotada}` : null]
                .filter(Boolean)
                .join(' · ')}
              onAbrir={setPedidoAbierto}
              acciones={
                <>
                  {siguiente && (
                    <Boton color="#C98A3E" suave onClick={() => moverEtapa(p, siguiente)}>
                      <ArrowRight size={13} /> {siguiente.label}
                    </Boton>
                  )}
                  <Boton color="#C98A3E" onClick={() => marcarCompostura(c.id)}>
                    <Check size={13} /> Hecha
                  </Boton>
                </>
              }
            />
          )
        })}
      </Seccion>

      {pedidoAbierto && <DetallePedidoModal pedido={pedidoAbierto} onCerrar={() => setPedidoAbierto(null)} />}
    </div>
  )
}
