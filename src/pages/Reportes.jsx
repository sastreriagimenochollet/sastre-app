import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { usePedidos } from '../lib/usePedidos'
import { useDatosReportes } from '../lib/useDatosReportes'
import { ESTADOS, TIPOS_TRABAJO, ACENTO_SASTRERIA, ACENTO_CAMISERIA } from '../lib/constantes'
import DetallePedidoModal from '../components/DetallePedidoModal'

const IVA = 1.21 // IVA 21 %
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const tarjeta = 'bg-white rounded-card border border-bronce-100 p-4 mb-5'
const tituloSeccion = 'text-xs uppercase tracking-wide text-tinta/40 font-medium mb-3'

function claveMes(fecha) {
  return (fecha ?? '').slice(0, 7) // 'AAAA-MM'
}
function mesDe(p) {
  return claveMes(p.fecha_pedido || p.creado_en)
}
function mesActual() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function moverMes(m, delta) {
  const [y, mm] = m.split('-').map(Number)
  const d = new Date(y, mm - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function nombreMes(m) {
  const [y, mm] = m.split('-')
  return `${MESES[Number(mm) - 1]} ${y}`
}
function formatearFecha(valor) {
  if (!valor) return ''
  return new Date(valor).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function Reportes() {
  const navigate = useNavigate()
  const { pedidos, cargando: cargandoPedidos } = usePedidos()
  const { items, camisas, pagos, tejidos, cargando: cargandoDatos } = useDatosReportes()
  const [mes, setMes] = useState(mesActual())
  const [conIva, setConIva] = useState(true)
  const [pedidoAbierto, setPedidoAbierto] = useState(null)
  const [detalle, setDetalle] = useState(null) // 'vendido' | 'caja' | 'cobrado' | 'porCobrar'

  // Los precios de los pedidos se consideran CON IVA incluido.
  // "Sin IVA" los divide entre 1,21.
  const factor = conIva ? 1 : 1 / IVA
  const eur = (n) => ((Number(n) || 0) * factor).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })

  const pedidoPorId = useMemo(() => Object.fromEntries(pedidos.map((p) => [p.id, p])), [pedidos])

  // Lo cobrado de cada pedido: anticipo + abonos
  const cobradoPorPedido = useMemo(() => {
    const m = {}
    for (const p of pedidos) m[p.id] = Number(p.anticipo || 0)
    for (const g of pagos) {
      if (m[g.pedido_id] !== undefined) m[g.pedido_id] += Number(g.monto || 0)
    }
    return m
  }, [pedidos, pagos])

  const itemsPorPedido = useMemo(() => {
    const m = {}
    for (const it of items) (m[it.pedido_id] ??= []).push(it)
    for (const k in m) m[k].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
    return m
  }, [items])
  const camisasPorPedido = useMemo(() => {
    const m = {}
    for (const c of camisas) (m[c.pedido_id] ??= []).push(c)
    for (const k in m) m[k].sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0))
    return m
  }, [camisas])

  // Qué se vendió en un pedido: cada prenda / camisa con su precio
  function partesDe(p) {
    const partes = []
    for (const it of itemsPorPedido[p.id] ?? []) partes.push({ nombre: it.tipo || 'Sin especificar', precio: Number(it.precio || 0) })
    for (const c of camisasPorPedido[p.id] ?? []) partes.push({ nombre: `Camisa ${c.numero ?? ''}`.trim(), precio: Number(c.precio || 0) })
    if (!partes.length && Array.isArray(p.tipos_trabajo)) {
      for (const t of p.tipos_trabajo) partes.push({ nombre: t, precio: null })
    }
    return partes
  }

  // ---------- Métricas del mes seleccionado ----------
  const delMes = useMemo(() => {
    const ped = pedidos.filter((p) => mesDe(p) === mes)
    const ids = new Set(ped.map((p) => p.id))

    const vendido = ped.reduce((s, p) => s + Number(p.precio_total || 0), 0)
    const cobrado = ped.reduce((s, p) => s + (cobradoPorPedido[p.id] || 0), 0)
    const porCobrar = ped.reduce((s, p) => s + Math.max(0, Number(p.precio_total || 0) - (cobradoPorPedido[p.id] || 0)), 0)

    // Caja: dinero que ha entrado de verdad durante el mes
    const pagosMes = pagos.filter((g) => claveMes(g.fecha) === mes)
    const caja =
      ped.reduce((s, p) => s + Number(p.anticipo || 0), 0) + pagosMes.reduce((s, g) => s + Number(g.monto || 0), 0)

    // Producción de sastrería por tipo de trabajo
    const porTipo = {}
    const conItems = new Set()
    for (const it of items) {
      if (!ids.has(it.pedido_id)) continue
      const tipo = it.tipo || 'Sin especificar'
      porTipo[tipo] = (porTipo[tipo] || 0) + 1
      conItems.add(it.pedido_id)
    }
    // Pedidos antiguos que solo guardaban la lista de tipos
    for (const p of ped) {
      if (p.rubro === 'camiseria' || conItems.has(p.id) || !Array.isArray(p.tipos_trabajo)) continue
      for (const t of p.tipos_trabajo) porTipo[t] = (porTipo[t] || 0) + 1
    }
    const orden = (t) => (TIPOS_TRABAJO.indexOf(t) === -1 ? 99 : TIPOS_TRABAJO.indexOf(t))
    const tipos = Object.entries(porTipo).sort((a, b) => b[1] - a[1] || orden(a[0]) - orden(b[0]))
    const totalPrendas = tipos.reduce((s, [, n]) => s + n, 0)
    const totalCamisas = camisas.filter((c) => ids.has(c.pedido_id)).length

    ped.sort((a, b) => new Date(b.fecha_pedido || b.creado_en) - new Date(a.fecha_pedido || a.creado_en))

    return { numPedidos: ped.length, ped, pagosMes, vendido, cobrado, porCobrar, caja, tipos, totalPrendas, totalCamisas }
  }, [pedidos, pagos, items, camisas, mes, cobradoPorPedido])

  // ---------- Vendido de los últimos 12 meses ----------
  const serie = useMemo(() => {
    const porMes = {}
    for (const p of pedidos) {
      const m = mesDe(p)
      porMes[m] = (porMes[m] || 0) + Number(p.precio_total || 0)
    }
    return Array.from({ length: 12 }, (_, i) => {
      const m = moverMes(mes, i - 11)
      return { mes: m, valor: porMes[m] || 0 }
    })
  }, [pedidos, mes])
  const maxSerie = Math.max(1, ...serie.map((s) => s.valor))

  // ---------- Facturas pendientes de cobrar (todos los meses) ----------
  const pendientes = useMemo(
    () =>
      pedidos
        .map((p) => ({ p, saldo: Number(p.precio_total || 0) - (cobradoPorPedido[p.id] || 0) }))
        .filter((x) => x.saldo > 0.005)
        .sort((a, b) => new Date(a.p.fecha_pedido || a.p.creado_en) - new Date(b.p.fecha_pedido || b.p.creado_en)),
    [pedidos, cobradoPorPedido]
  )
  const totalPendiente = pendientes.reduce((s, x) => s + x.saldo, 0)

  // ---------- Clientes recurrentes (2 pedidos o más) ----------
  const recurrentes = useMemo(() => {
    const por = {}
    for (const p of pedidos) {
      if (!p.cliente_id) continue
      const e = (por[p.cliente_id] ??= { id: p.cliente_id, nombre: p.clientes?.nombre ?? 'Sin nombre', n: 0, total: 0, ultimo: '' })
      e.n += 1
      e.total += Number(p.precio_total || 0)
      const f = p.fecha_pedido || p.creado_en
      if (f > e.ultimo) e.ultimo = f
    }
    return Object.values(por)
      .filter((e) => e.n >= 2)
      .sort((a, b) => b.n - a.n || b.total - a.total)
  }, [pedidos])

  // ---------- Proveedores: compras por mes y por año ----------
  const anio = mes.slice(0, 4)
  const proveedores = useMemo(() => {
    function contar(filas) {
      const por = {}
      for (const f of filas) {
        const p = pedidoPorId[f.pedido_id]
        if (!p || !f.proveedor) continue
        const m = mesDe(p)
        const r = (por[f.proveedor] ??= { nombre: f.proveedor, mes: 0, anio: 0 })
        if (m === mes) r.mes += 1
        if (m.slice(0, 4) === anio) r.anio += 1
      }
      return Object.values(por)
        .filter((r) => r.mes > 0 || r.anio > 0)
        .sort((a, b) => b.anio - a.anio || b.mes - a.mes)
    }
    return { sastreria: contar(tejidos), camiseria: contar(camisas) }
  }, [tejidos, camisas, pedidoPorId, mes, anio])

  // ---------- Seguimiento de sastrería ----------
  const seguimiento = useMemo(() => {
    const sast = pedidos.filter((p) => p.rubro !== 'camiseria')
    const porEstado = {}
    for (const p of sast) porEstado[p.estado] = (porEstado[p.estado] || 0) + 1
    const ahora = Date.now()
    const atrasados = sast.filter((p) => {
      if (p.estado === 'finalizado' || p.estado === 'entregado') return false
      return (ahora - new Date(p.creado_en).getTime()) / 86400000 > 21
    })
    return { porEstado, atrasados, total: sast.length }
  }, [pedidos])

  if (cargandoPedidos || cargandoDatos) {
    return <p className="text-center text-tinta/40 text-sm py-10">Cargando reportes…</p>
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-28 pt-5 scroll-suave">
      <header className="mb-4">
        <h1 className="font-serif text-2xl text-tinta">Reportes</h1>
        <p className="text-sm text-tinta/50 mt-0.5">Resumen de tu taller</p>
      </header>

      {/* Mes + IVA */}
      <div className="flex items-center justify-between gap-2 mb-5 flex-wrap">
        <div className="flex items-center gap-1 bg-white border border-bronce-100 rounded-full px-1 py-1">
          <button onClick={() => setMes(moverMes(mes, -1))} className="p-1.5 text-tinta/50 hover:text-tinta">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-medium text-tinta min-w-[130px] text-center">{nombreMes(mes)}</span>
          <button onClick={() => setMes(moverMes(mes, 1))} className="p-1.5 text-tinta/50 hover:text-tinta">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="flex bg-white border border-bronce-100 rounded-full p-1">
          {[
            { id: true, label: 'Con IVA' },
            { id: false, label: 'Sin IVA' },
          ].map((o) => (
            <button
              key={String(o.id)}
              onClick={() => setConIva(o.id)}
              className={`px-3.5 py-1 rounded-full text-sm font-medium transition-colors ${
                conIva === o.id ? 'text-white' : 'text-tinta/55'
              }`}
              style={conIva === o.id ? { backgroundColor: ACENTO_SASTRERIA } : undefined}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Caja y ventas del mes — pulsa una casilla para ver el detalle */}
      <div className="grid grid-cols-2 gap-3 mb-2">
        {[
          { id: 'vendido', label: 'Vendido', valor: delMes.vendido, sub: `${delMes.numPedidos} pedidos` },
          { id: 'caja', label: 'Caja del mes', valor: delMes.caja, sub: 'dinero entrado en el mes' },
          { id: 'cobrado', label: 'Cobrado', valor: delMes.cobrado, sub: 'de los pedidos del mes', color: '#6E8F6B' },
          { id: 'porCobrar', label: 'Por cobrar', valor: delMes.porCobrar, sub: 'de los pedidos del mes', color: '#C98A3E' },
        ].map((c) => (
          <button
            key={c.id}
            onClick={() => setDetalle(c.id)}
            className="text-left bg-white rounded-card border border-bronce-100 p-4 hover:border-bronce-300 transition-colors"
          >
            <p className="text-xs uppercase tracking-wide text-tinta/40 font-medium">{c.label}</p>
            <p className="font-serif text-xl mt-1" style={{ color: c.color ?? '#241F1A' }}>{eur(c.valor)}</p>
            <p className="text-[11px] text-tinta/40 mt-0.5 flex items-center justify-between">
              <span>{c.sub}</span>
              <ChevronRight size={13} className="shrink-0" />
            </p>
          </button>
        ))}
      </div>
      <p className="text-[11px] text-tinta/40 mb-5">
        Los pedidos se asignan al mes de su fecha de pedido. Los precios se consideran con IVA incluido (21 %); «Sin IVA»
        los divide entre 1,21.
      </p>

      {/* Qué se ha hecho este mes */}
      <div className={tarjeta}>
        <p className={tituloSeccion}>Producción de {nombreMes(mes)}</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <p className="text-sm font-medium" style={{ color: ACENTO_SASTRERIA }}>Sastrería</p>
              <p className="font-serif text-lg text-tinta">{delMes.totalPrendas}</p>
            </div>
            {delMes.tipos.length === 0 ? (
              <p className="text-xs text-tinta/40">Sin trabajos este mes.</p>
            ) : (
              <div className="space-y-1.5">
                {delMes.tipos.map(([tipo, n]) => (
                  <div key={tipo} className="flex justify-between text-sm">
                    <span className="text-tinta/70">{tipo}</span>
                    <span className="text-tinta/50">{n}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <p className="text-sm font-medium" style={{ color: ACENTO_CAMISERIA }}>Camisería</p>
              <p className="font-serif text-lg text-tinta">{delMes.totalCamisas}</p>
            </div>
            <p className="text-xs text-tinta/40">{delMes.totalCamisas === 1 ? 'camisa' : 'camisas'} este mes</p>
          </div>
        </div>
      </div>

      {/* Vendido últimos 12 meses */}
      <div className={tarjeta}>
        <p className={tituloSeccion}>Vendido · últimos 12 meses</p>
        <div className="flex items-end gap-1.5 h-28">
          {serie.map((s) => (
            <div key={s.mes} className="flex-1 flex flex-col items-center justify-end h-full gap-1" title={`${nombreMes(s.mes)}: ${eur(s.valor)}`}>
              <div
                className="w-full rounded-t"
                style={{
                  height: `${(s.valor / maxSerie) * 100}%`,
                  minHeight: 3,
                  backgroundColor: s.mes === mes ? ACENTO_SASTRERIA : '#B9C4AF',
                }}
              />
              <span className="text-[9px] text-tinta/45">{MESES[Number(s.mes.slice(5)) - 1].slice(0, 3)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Facturas pendientes de cobrar */}
      <div className={tarjeta}>
        <div className="flex items-baseline justify-between mb-3">
          <p className="text-xs uppercase tracking-wide text-tinta/40 font-medium">Pendiente de cobrar</p>
          <p className="font-serif text-lg" style={{ color: '#C98A3E' }}>{eur(totalPendiente)}</p>
        </div>
        {pendientes.length === 0 ? (
          <p className="text-sm text-tinta/40">No hay nada pendiente de cobro.</p>
        ) : (
          <div className="divide-y divide-bronce-100">
            {pendientes.map(({ p, saldo }) => (
              <button
                key={p.id}
                onClick={() => setPedidoAbierto(p)}
                className="w-full text-left flex items-center justify-between gap-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-tinta truncate">{p.clientes?.nombre ?? 'Sin cliente'}</p>
                  <p className="text-xs text-tinta/45 truncate">
                    {p.descripcion || (p.rubro === 'camiseria' ? 'Camisería' : 'Sastrería')} · {formatearFecha(p.fecha_pedido || p.creado_en)}
                    {' · '}total {eur(p.precio_total)}
                  </p>
                </div>
                <span className="text-sm font-medium shrink-0" style={{ color: '#C98A3E' }}>{eur(saldo)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Clientes recurrentes */}
      <div className={tarjeta}>
        <p className={tituloSeccion}>Clientes recurrentes</p>
        {recurrentes.length === 0 ? (
          <p className="text-sm text-tinta/40">Todavía no hay clientes con 2 o más pedidos.</p>
        ) : (
          <div className="divide-y divide-bronce-100">
            {recurrentes.map((c) => (
              <button
                key={c.id}
                onClick={() => navigate(`/clientes/${c.id}`)}
                className="w-full text-left flex items-center justify-between gap-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-tinta truncate">{c.nombre}</p>
                  <p className="text-xs text-tinta/45">Último pedido: {formatearFecha(c.ultimo)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm text-tinta">{c.n} pedidos</p>
                  <p className="text-xs text-tinta/45">{eur(c.total)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Proveedores: sastrería y camisería por separado */}
      {[
        { id: 'sastreria', titulo: 'Proveedores · Sastrería', color: ACENTO_SASTRERIA, nota: 'Cuenta cada tejido registrado con ese proveedor, según la fecha del pedido.' },
        { id: 'camiseria', titulo: 'Proveedores · Camisería', color: ACENTO_CAMISERIA, nota: 'Cuenta cada camisa registrada con ese proveedor, según la fecha del pedido.' },
      ].map((sec) => {
        const filas = proveedores[sec.id]
        return (
          <div key={sec.id} className={tarjeta}>
            <p className={tituloSeccion} style={{ color: sec.color }}>{sec.titulo}</p>
            {filas.length === 0 ? (
              <p className="text-sm text-tinta/40">Sin compras registradas en {anio}.</p>
            ) : (
              <>
                <div className="grid grid-cols-[1fr_auto_auto] gap-x-5 gap-y-2 items-center">
                  <span />
                  <span className="text-[11px] uppercase tracking-wide text-tinta/40 text-right">{MESES[Number(mes.slice(5)) - 1].slice(0, 3)}</span>
                  <span className="text-[11px] uppercase tracking-wide text-tinta/40 text-right">{anio}</span>
                  {filas.map((r) => (
                    <div key={r.nombre} className="contents">
                      <span className="text-sm text-tinta/80">{r.nombre}</span>
                      <span className="text-sm text-tinta/60 text-right">{r.mes}</span>
                      <span className="text-sm font-medium text-tinta text-right">{r.anio}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-tinta/40 mt-3">{sec.nota}</p>
              </>
            )}
          </div>
        )
      })}

      {/* Seguimiento de sastrería */}
      <div className={tarjeta}>
        <p className={tituloSeccion}>Sastrería · pedidos por etapa</p>
        <div className="space-y-2">
          {ESTADOS.map((e) => {
            const cantidad = seguimiento.porEstado[e.id] ?? 0
            const pct = seguimiento.total ? (cantidad / seguimiento.total) * 100 : 0
            return (
              <div key={e.id}>
                <div className="flex justify-between text-xs text-tinta/60 mb-0.5">
                  <span>{e.label}</span>
                  <span>{cantidad}</span>
                </div>
                <div className="h-1.5 bg-lino rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: ACENTO_SASTRERIA }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {seguimiento.atrasados.length > 0 && (
        <div className="bg-white rounded-card border p-4 mb-5" style={{ borderColor: '#C98A3E55' }}>
          <p className="text-xs uppercase tracking-wide font-medium mb-3" style={{ color: '#C98A3E' }}>
            Sastrería · pedidos atrasados (+21 días)
          </p>
          <div className="space-y-2">
            {seguimiento.atrasados.map((p) => (
              <button key={p.id} onClick={() => setPedidoAbierto(p)} className="w-full flex justify-between text-sm text-left">
                <span className="text-tinta/75">{p.clientes?.nombre}</span>
                <span className="text-tinta/45">{ESTADOS.find((e) => e.id === p.estado)?.label ?? p.estado}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {detalle && (
        <DetalleVentas
          tipo={detalle}
          delMes={delMes}
          titulo={nombreMes(mes)}
          cobradoPorPedido={cobradoPorPedido}
          pedidoPorId={pedidoPorId}
          partesDe={partesDe}
          eur={eur}
          onCerrar={() => setDetalle(null)}
          onAbrirPedido={setPedidoAbierto}
        />
      )}

      {pedidoAbierto && <DetallePedidoModal pedido={pedidoAbierto} onCerrar={() => setPedidoAbierto(null)} />}
    </div>
  )
}

const TITULOS = {
  vendido: 'Vendido',
  caja: 'Caja del mes',
  cobrado: 'Cobrado',
  porCobrar: 'Por cobrar',
}

function DetalleVentas({ tipo, delMes, titulo, cobradoPorPedido, pedidoPorId, partesDe, eur, onCerrar, onAbrirPedido }) {
  const total = { vendido: delMes.vendido, caja: delMes.caja, cobrado: delMes.cobrado, porCobrar: delMes.porCobrar }[tipo]
  const nombre = (p) => p?.clientes?.nombre ?? 'Sin cliente'
  const etiquetaRubro = (p) => (p?.rubro === 'camiseria' ? 'Camisería' : 'Sastrería')

  let filas = []

  if (tipo === 'vendido') {
    filas = delMes.ped.map((p) => ({
      key: p.id,
      pedido: p,
      titulo: nombre(p),
      subtitulo: `${p.descripcion || etiquetaRubro(p)} · ${formatearFecha(p.fecha_pedido || p.creado_en)}`,
      importe: Number(p.precio_total || 0),
      partes: partesDe(p),
    }))
  } else if (tipo === 'caja') {
    const entradas = [
      ...delMes.ped
        .filter((p) => Number(p.anticipo || 0) > 0)
        .map((p) => ({ key: `a-${p.id}`, pedido: p, fecha: p.fecha_pedido || p.creado_en, concepto: 'Anticipo', importe: Number(p.anticipo) })),
      ...delMes.pagosMes.map((g) => ({
        key: `g-${g.id}`,
        pedido: pedidoPorId[g.pedido_id],
        fecha: g.fecha,
        concepto: g.nota || 'Abono',
        importe: Number(g.monto || 0),
      })),
    ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    filas = entradas.map((e) => ({
      key: e.key,
      pedido: e.pedido,
      titulo: nombre(e.pedido),
      subtitulo: `${e.concepto} · ${formatearFecha(e.fecha)}`,
      importe: e.importe,
    }))
  } else if (tipo === 'cobrado') {
    filas = delMes.ped
      .filter((p) => (cobradoPorPedido[p.id] || 0) > 0)
      .map((p) => ({
        key: p.id,
        pedido: p,
        titulo: nombre(p),
        subtitulo: `${p.descripcion || etiquetaRubro(p)} · cobrado de un total de ${eur(p.precio_total)}`,
        importe: cobradoPorPedido[p.id] || 0,
      }))
  } else {
    filas = delMes.ped
      .filter((p) => Number(p.precio_total || 0) - (cobradoPorPedido[p.id] || 0) > 0.005)
      .map((p) => ({
        key: p.id,
        pedido: p,
        titulo: nombre(p),
        subtitulo: `${p.descripcion || etiquetaRubro(p)} · total ${eur(p.precio_total)}, cobrado ${eur(cobradoPorPedido[p.id] || 0)}`,
        importe: Number(p.precio_total || 0) - (cobradoPorPedido[p.id] || 0),
      }))
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-lino w-full sm:max-w-2xl sm:rounded-card rounded-t-2xl max-h-[88vh] overflow-y-auto scroll-suave">
        <div className="sticky top-0 bg-lino flex items-center justify-between px-5 py-4 border-b border-bronce-100">
          <div>
            <h2 className="font-serif text-xl text-tinta">{TITULOS[tipo]} · {titulo}</h2>
            <p className="text-sm text-tinta/50">{eur(total)}</p>
          </div>
          <button onClick={onCerrar} className="text-tinta/50 hover:text-tinta">
            <X size={22} />
          </button>
        </div>

        <div className="p-5">
          {filas.length === 0 ? (
            <p className="text-sm text-tinta/40 text-center py-6">Sin movimientos este mes.</p>
          ) : (
            <div className="space-y-2.5">
              {filas.map((f) => (
                <button
                  key={f.key}
                  onClick={() => f.pedido && onAbrirPedido(f.pedido)}
                  className="w-full text-left bg-white rounded-card border border-bronce-100 p-3.5 hover:border-bronce-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-tinta truncate">{f.titulo}</p>
                      <p className="text-xs text-tinta/45 mt-0.5">{f.subtitulo}</p>
                    </div>
                    <p className="text-sm font-medium text-tinta shrink-0">{eur(f.importe)}</p>
                  </div>
                  {f.partes && f.partes.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-bronce-100 space-y-1">
                      {f.partes.map((pt, i) => (
                        <div key={i} className="flex justify-between text-xs text-tinta/65">
                          <span>{pt.nombre}</span>
                          {pt.precio !== null && <span>{eur(pt.precio)}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
