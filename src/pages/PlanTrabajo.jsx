import { useMemo, useRef, useState } from 'react'
import { AlertTriangle, Check, ArrowRight, X, RotateCcw } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { usePedidos } from '../lib/usePedidos'
import { usePlanTrabajo } from '../lib/usePlanTrabajo'
import { usePlanOrden } from '../lib/usePlanOrden'
import { calcularPlan, etapasDe, siguienteEtapa, aplicarOrden } from '../lib/planTrabajo'
import {
  ACENTO_SASTRERIA,
  ACENTO_CAMISERIA,
  ACENTO_ARREGLOS,
  labelRubro,
  urgenciaEntrega,
} from '../lib/constantes'
import { estaEntregado } from '../lib/planTrabajo'
import DetallePedidoModal from '../components/DetallePedidoModal'

const AMBAR = '#C98A3E'

const fechaCorta = (f) => new Date(f + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })

function AvisoEntrega({ pedido }) {
  const u = urgenciaEntrega(pedido.fecha_entrega_estimada, estaEntregado(pedido))
  if (u) {
    return (
      <span className="text-xs font-medium inline-flex items-center gap-1" style={{ color: u.color }}>
        <AlertTriangle size={12} />
        {u.nivel === 'vencido'
          ? `Vencida hace ${Math.abs(u.dias)} d`
          : u.dias === 0
          ? 'Entrega hoy'
          : `Entrega en ${u.dias} d`}
      </span>
    )
  }
  if (pedido.fecha_entrega_estimada) {
    return <span className="text-xs text-tinta/45">Entrega {fechaCorta(pedido.fecha_entrega_estimada)}</span>
  }
  return <span className="text-xs text-tinta/30">Sin fecha de entrega</span>
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

// Tarjeta del tablero. La barra de la izquierda se pone roja/ámbar según lo cerca que esté la entrega.
function Tarjeta({ pedido, color, chip, titulo, subtitulo, extra, onAbrir, acciones }) {
  const u = urgenciaEntrega(pedido.fecha_entrega_estimada, estaEntregado(pedido))
  return (
    <div
      className="bg-white rounded-lg border border-bronce-100 shadow-sm p-3 select-none"
      style={{ borderLeft: `4px solid ${u ? u.color : color + '66'}` }}
    >
      {chip && (
        <span
          className="inline-block text-[10px] font-medium rounded-full px-2 py-0.5 mb-1.5"
          style={{ backgroundColor: color + '1A', color }}
        >
          {chip}
        </span>
      )}
      <button onClick={() => onAbrir(pedido)} className="w-full text-left">
        <p className="text-sm font-medium text-tinta leading-snug">{titulo}</p>
        {subtitulo && <p className="text-xs text-tinta/60 mt-0.5 break-words">{subtitulo}</p>}
        {extra}
        <div className="mt-1">
          <AvisoEntrega pedido={pedido} />
        </div>
      </button>
      {acciones && <div className="mt-2.5 flex flex-wrap gap-2">{acciones}</div>}
    </div>
  )
}

function Ordenable({ id, deshabilitado, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: deshabilitado,
  })
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.55 : 1,
        position: 'relative',
        zIndex: isDragging ? 20 : 'auto',
      }}
    >
      {children}
    </div>
  )
}

function Columna({
  id,
  titulo,
  nota,
  color,
  filas,
  claveDe,
  orden,
  onOrden,
  onRestablecer,
  renderTarjeta,
  ordenable = true,
  cabeceraExtra,
  pie,
  arrastrando,
}) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } })
  )
  const visibles = ordenable ? aplicarOrden(filas, claveDe, orden) : filas
  const ids = visibles.map(claveDe)
  const manual = ordenable && orden && orden.length > 0

  function alSoltar({ active, over }) {
    // el clic que sigue a un arrastre no debe abrir ni ejecutar nada
    setTimeout(() => {
      arrastrando.current = false
    }, 100)
    if (!over || active.id === over.id) return
    onOrden(id, arrayMove(ids, ids.indexOf(active.id), ids.indexOf(over.id)))
  }

  return (
    <div className="w-[300px] shrink-0 snap-start bg-lino/70 border border-bronce-100 rounded-card overflow-hidden">
      <div className="px-3.5 py-3 bg-white border-b border-bronce-100" style={{ borderTop: `4px solid ${color}` }}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-serif text-lg text-tinta leading-tight">{titulo}</p>
            {nota && <p className="text-[11px] text-tinta/45 mt-0.5">{nota}</p>}
          </div>
          <span
            className="shrink-0 text-sm font-medium rounded-full px-2.5 py-0.5"
            style={{ backgroundColor: color + '1A', color }}
          >
            {filas.length}
          </span>
        </div>
        {(cabeceraExtra || manual) && (
          <div className="flex items-center justify-between gap-2 mt-2">
            <div>{cabeceraExtra}</div>
            {manual && (
              <button
                onClick={() => onRestablecer(id)}
                className="flex items-center gap-1 text-[11px] text-tinta/50 hover:text-tinta"
                title="Volver al orden por fecha de entrega"
              >
                <RotateCcw size={11} /> Orden por fecha
              </button>
            )}
          </div>
        )}
      </div>

      <div className="p-2.5 space-y-2.5 max-h-[calc(100vh-250px)] overflow-y-auto">
        {visibles.length === 0 ? (
          <p className="text-sm text-tinta/40 text-center py-6">Nada pendiente.</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={() => {
              arrastrando.current = true
            }}
            onDragEnd={alSoltar}
            onDragCancel={() => {
              setTimeout(() => {
                arrastrando.current = false
              }, 100)
            }}
          >
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              {visibles.map((f) => (
                <Ordenable key={claveDe(f)} id={claveDe(f)} deshabilitado={!ordenable}>
                  {renderTarjeta(f)}
                </Ordenable>
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
      {pie && <p className="text-xs text-tinta/45 px-3.5 py-2.5 border-t border-bronce-100 bg-white">{pie}</p>}
    </div>
  )
}

export default function PlanTrabajo() {
  const {
    pedidos,
    cargando: cargandoPedidos,
    errorGuardado,
    limpiarErrorGuardado,
    actualizarEstado,
    actualizarEstadoCamiseria,
  } = usePedidos()
  const { tejidos, composturas, camisas, items, cargando: cargandoPlan, marcarTejido, marcarCompostura } = usePlanTrabajo()
  const { ordenes, errorOrden, guardarOrden, restablecer } = usePlanOrden()
  const [pedidoAbierto, setPedidoAbierto] = useState(null)
  const [telasPorProveedor, setTelasPorProveedor] = useState(false)
  const arrastrando = useRef(false)

  const plan = useMemo(
    () => calcularPlan({ pedidos, tejidos, composturas, camisas, items }),
    [pedidos, tejidos, composturas, camisas, items]
  )

  // Nada se abre ni se ejecuta justo después de arrastrar una tarjeta
  const abrir = (p) => {
    if (!arrastrando.current) setPedidoAbierto(p)
  }
  const seguro = (fn) => () => {
    if (!arrastrando.current) fn()
  }
  const moverEtapa = (pedido, etapa) =>
    pedido.rubro === 'camiseria' ? actualizarEstadoCamiseria(pedido.id, etapa.id) : actualizarEstado(pedido.id, etapa.id)

  const telasFilas = useMemo(() => {
    const todas = plan.telas.flatMap((g) => g.filas)
    if (!telasPorProveedor) {
      return [...todas].sort((a, b) =>
        (a.p.fecha_entrega_estimada || '9999').localeCompare(b.p.fecha_entrega_estimada || '9999')
      )
    }
    return [...todas].sort(
      (a, b) =>
        (a.t.proveedor || 'zzz').localeCompare(b.t.proveedor || 'zzz') ||
        (a.p.fecha_entrega_estimada || '9999').localeCompare(b.p.fecha_entrega_estimada || '9999')
    )
  }, [plan.telas, telasPorProveedor])

  if (cargandoPedidos || cargandoPlan) {
    return <p className="text-center text-tinta/40 text-sm py-10">Cargando el plan de trabajo…</p>
  }

  const comunes = { orden: undefined, onOrden: guardarOrden, onRestablecer: restablecer, arrastrando }

  return (
    <div className="px-4 pb-10 pt-5 scroll-suave">
      <header className="mb-4 max-w-2xl mx-auto md:mx-0">
        <h1 className="font-serif text-2xl text-tinta">Plan de trabajo</h1>
        <p className="text-sm text-tinta/50 mt-0.5">
          Por defecto, por fecha de entrega. Mueve las tarjetas dentro de cada columna a tu manera (en iPad, mantén
          pulsada una tarjeta para arrastrarla).
        </p>
      </header>

      {(errorGuardado || errorOrden) && (
        <div className="mb-4 max-w-2xl bg-white border border-red-200 rounded-lg p-3 text-sm text-red-600 flex items-start justify-between gap-3">
          <span>{errorGuardado || errorOrden}</span>
          {errorGuardado && (
            <button onClick={limpiarErrorGuardado} className="shrink-0 text-red-400">
              <X size={16} />
            </button>
          )}
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-6 items-start snap-x">
        {/* 1. Camisas por pasar */}
        <Columna
          {...comunes}
          id="camisas"
          orden={ordenes.camisas}
          titulo="Camisas por pasar"
          nota="Creadas, sin pasar al proveedor"
          color={ACENTO_CAMISERIA}
          filas={plan.camisasPorPasar}
          claveDe={(f) => f.p.id}
          renderTarjeta={({ p, camisas: cs }) => {
            const proveedores = [...new Set(cs.map((c) => c.proveedor).filter(Boolean))]
            return (
              <Tarjeta
                pedido={p}
                color={ACENTO_CAMISERIA}
                titulo={p.clientes?.nombre ?? 'Sin cliente'}
                subtitulo={[
                  cs.length ? `${cs.length} ${cs.length === 1 ? 'camisa' : 'camisas'}` : p.descripcion || 'Camisería',
                  proveedores.join(' · '),
                ]
                  .filter(Boolean)
                  .join(' · ')}
                onAbrir={abrir}
                acciones={
                  <Boton color={ACENTO_CAMISERIA} onClick={seguro(() => actualizarEstadoCamiseria(p.id, 'pasada'))}>
                    <Check size={13} /> Pasada
                  </Boton>
                }
              />
            )
          }}
        />

        {/* 2. Telas por pedir */}
        <Columna
          {...comunes}
          id="telas"
          orden={ordenes.telas}
          titulo="Telas por pedir"
          nota={telasPorProveedor ? 'Agrupadas por proveedor' : 'Por fecha de entrega'}
          color={ACENTO_SASTRERIA}
          filas={telasFilas}
          claveDe={(f) => f.t.id}
          ordenable={!telasPorProveedor}
          cabeceraExtra={
            <button
              onClick={() => setTelasPorProveedor((v) => !v)}
              className="text-[11px] font-medium underline"
              style={{ color: ACENTO_SASTRERIA }}
            >
              {telasPorProveedor ? 'Ordenar por fecha' : 'Agrupar por proveedor'}
            </button>
          }
          renderTarjeta={({ t, p }) => (
            <Tarjeta
              pedido={p}
              color={ACENTO_SASTRERIA}
              chip={t.proveedor || 'Sin proveedor'}
              titulo={p.clientes?.nombre ?? 'Sin cliente'}
              subtitulo={[t.referencia, t.libro, t.metros ? `${Number(t.metros).toLocaleString('es-ES')} m` : '']
                .filter(Boolean)
                .join(' · ')}
              onAbrir={abrir}
              acciones={
                <Boton color={ACENTO_SASTRERIA} onClick={seguro(() => marcarTejido(t.id, true))}>
                  <Check size={13} /> Pedida
                </Boton>
              }
            />
          )}
        />

        {/* 3. Sastrería por cortar */}
        <Columna
          {...comunes}
          id="cortar"
          orden={ordenes.cortar}
          titulo="Por cortar"
          nota="Tela pedida, pendiente de pasar a Corte"
          color={ACENTO_SASTRERIA}
          filas={plan.porCortar}
          claveDe={(f) => f.p.id}
          pie={
            plan.esperandoTela > 0
              ? `${plan.esperandoTela} ${plan.esperandoTela === 1 ? 'pedido espera' : 'pedidos esperan'} a que pidas la tela.`
              : null
          }
          renderTarjeta={({ p, tejidos: tj, sinTela, items: its }) => (
            <Tarjeta
              pedido={p}
              color={ACENTO_SASTRERIA}
              chip={p.rubro === 'medida_industrial' ? 'Industrial' : null}
              titulo={p.clientes?.nombre ?? 'Sin cliente'}
              subtitulo={its.length ? its.map((i) => i.tipo).filter(Boolean).join(' · ') : p.descripcion}
              extra={
                sinTela ? (
                  <p className="text-xs mt-0.5" style={{ color: AMBAR }}>Sin tela registrada</p>
                ) : (
                  <p className="text-xs text-tinta/45 mt-0.5">
                    {tj.map((t) => [t.proveedor, t.referencia].filter(Boolean).join(' ')).join(' · ')}
                  </p>
                )
              }
              onAbrir={abrir}
              acciones={
                <Boton color={ACENTO_SASTRERIA} onClick={seguro(() => actualizarEstado(p.id, 'en_corte'))}>
                  <ArrowRight size={13} /> A Corte
                </Boton>
              }
            />
          )}
        />

        {/* 4. Arreglos por hacer */}
        <Columna
          {...comunes}
          id="arreglos"
          orden={ordenes.arreglos}
          titulo="Arreglos por hacer"
          nota="Pendientes"
          color={ACENTO_ARREGLOS}
          filas={plan.arreglosPorHacer}
          claveDe={(f) => f.p.id}
          renderTarjeta={({ p }) => (
            <Tarjeta
              pedido={p}
              color={ACENTO_ARREGLOS}
              titulo={p.clientes?.nombre ?? 'Sin cliente'}
              subtitulo={p.tipo_prenda || 'Arreglo'}
              extra={
                p.notas ? <p className="text-xs text-tinta/45 mt-0.5 italic line-clamp-2">{p.notas}</p> : null
              }
              onAbrir={abrir}
              acciones={
                <Boton color={ACENTO_ARREGLOS} onClick={seguro(() => actualizarEstado(p.id, 'finalizado'))}>
                  <Check size={13} /> Hecho
                </Boton>
              }
            />
          )}
        />

        {/* 5. Composturas pendientes */}
        <Columna
          {...comunes}
          id="composturas"
          orden={ordenes.composturas}
          titulo="Composturas"
          nota="Hasta marcarlas o pasar el pedido de fase"
          color={AMBAR}
          filas={plan.composturasPendientes}
          claveDe={(f) => f.c.id}
          renderTarjeta={({ c, p }) => {
            const siguiente = siguienteEtapa(p)
            const anotada = c.estado_al_crear ? etapasDe(p).find((e) => e.id === c.estado_al_crear)?.label : null
            return (
              <Tarjeta
                pedido={p}
                color={AMBAR}
                chip={labelRubro(p.rubro)}
                titulo={c.descripcion}
                subtitulo={[p.clientes?.nombre ?? 'Sin cliente', p.descripcion, anotada ? `anotada en ${anotada}` : null]
                  .filter(Boolean)
                  .join(' · ')}
                onAbrir={abrir}
                acciones={
                  <>
                    <Boton color={AMBAR} onClick={seguro(() => marcarCompostura(c.id))}>
                      <Check size={13} /> Hecha
                    </Boton>
                    {siguiente && (
                      <Boton color={AMBAR} suave onClick={seguro(() => moverEtapa(p, siguiente))}>
                        <ArrowRight size={13} /> {siguiente.label}
                      </Boton>
                    )}
                  </>
                }
              />
            )
          }}
        />
      </div>

      {pedidoAbierto && <DetallePedidoModal pedido={pedidoAbierto} onCerrar={() => setPedidoAbierto(null)} />}
    </div>
  )
}
