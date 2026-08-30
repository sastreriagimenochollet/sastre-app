import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { usePedidos } from '../lib/usePedidos'
import { ESTADOS } from '../lib/constantes'
import { ESTADOS_CAMISERIA } from '../lib/camiseriaConfig'
import TarjetaPedido from '../components/TarjetaPedido'
import FiltrosEstado from '../components/FiltrosEstado'
import NuevoPedidoModal from '../components/NuevoPedidoModal'
import DetallePedidoModal from '../components/DetallePedidoModal'

export default function ListaTrabajos() {
  const { pedidos, cargando, actualizarEstado, actualizarEstadoCamiseria, recargar } = usePedidos()
  const [tab, setTab] = useState('sastreria') // 'sastreria' | 'camiseria'
  const [filtro, setFiltro] = useState('todos')
  const [agrupar, setAgrupar] = useState('estado') // 'estado' | 'cliente' | 'fecha'
  const [busqueda, setBusqueda] = useState('')
  const [modalNuevo, setModalNuevo] = useState(false)
  const [pedidoAbierto, setPedidoAbierto] = useState(null)

  // Separamos por rubro: Sastrería agrupa sastrería + medida industrial
  // (ambas usan el mismo tablero de 7 etapas); Camisería tiene su
  // propio tablero y estados independientes.
  const pedidosDelTab = useMemo(() => {
    if (tab === 'camiseria') return pedidos.filter((p) => p.rubro === 'camiseria')
    return pedidos.filter((p) => p.rubro !== 'camiseria')
  }, [pedidos, tab])

  function estadoDe(pedido) {
    if (tab === 'camiseria') return pedido.camiseria_seguimiento?.[0]?.estado ?? 'pasada'
    return pedido.estado
  }

  const filtrados = useMemo(() => {
    let lista = pedidosDelTab
    if (filtro !== 'todos') lista = lista.filter((p) => estadoDe(p) === filtro)
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      lista = lista.filter(
        (p) =>
          p.clientes?.nombre?.toLowerCase().includes(q) ||
          p.descripcion?.toLowerCase().includes(q)
      )
    }
    return lista
  }, [pedidosDelTab, filtro, busqueda, tab])

  const conteos = useMemo(() => {
    const c = { todos: pedidosDelTab.length }
    for (const p of pedidosDelTab) {
      const e = estadoDe(p)
      c[e] = (c[e] ?? 0) + 1
    }
    return c
  }, [pedidosDelTab, tab])

  const grupos = useMemo(() => {
    if (agrupar === 'fecha') {
      // Los pedidos con fecha de entrega más próxima van primero;
      // los que no tienen fecha, al final.
      const ordenados = [...filtrados].sort((a, b) => {
        if (!a.fecha_entrega_estimada && !b.fecha_entrega_estimada) return 0
        if (!a.fecha_entrega_estimada) return 1
        if (!b.fecha_entrega_estimada) return -1
        return a.fecha_entrega_estimada.localeCompare(b.fecha_entrega_estimada)
      })
      return { '': ordenados }
    }
    if (agrupar === 'estado') return { '': filtrados }
    const porCliente = {}
    for (const p of filtrados) {
      const nombre = p.clientes?.nombre ?? 'Sin cliente'
      if (!porCliente[nombre]) porCliente[nombre] = []
      porCliente[nombre].push(p)
    }
    return porCliente
  }, [filtrados, agrupar])

  function cambiarTab(nuevoTab) {
    setTab(nuevoTab)
    setFiltro('todos')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-28 pt-5 scroll-suave">
      <header className="mb-5">
        <h1 className="font-serif text-2xl text-tinta">Trabajos</h1>
        <p className="text-sm text-tinta/50 mt-0.5">{pedidosDelTab.length} pedidos en total</p>
      </header>

      {/* Pestañas Sastrería / Camisería */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { id: 'sastreria', label: 'Sastrería' },
          { id: 'camiseria', label: 'Camisería' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => cambiarTab(t.id)}
            className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? 'text-white' : 'bg-white border border-bronce-100 text-tinta/60'
            }`}
            style={tab === t.id ? { backgroundColor: '#B4863A' } : undefined}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tinta/35" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar cliente o descripción…"
            className="w-full bg-white border border-bronce-100 rounded-full pl-9 pr-3 py-2 text-sm outline-none focus:border-bronce-300"
          />
        </div>
        <select
          value={agrupar}
          onChange={(e) => setAgrupar(e.target.value)}
          className="shrink-0 bg-white border border-bronce-100 rounded-full px-3 py-2 text-sm text-tinta/70 outline-none"
        >
          <option value="estado">Más recientes</option>
          <option value="cliente">Por cliente</option>
          <option value="fecha">Por fecha de entrega</option>
        </select>
      </div>

      <div className="mb-4">
        <FiltrosEstado
          filtro={filtro}
          onFiltrar={setFiltro}
          conteos={conteos}
          estados={tab === 'camiseria' ? ESTADOS_CAMISERIA : ESTADOS}
        />
      </div>

      <button
        onClick={() => setModalNuevo(true)}
        className="w-full py-3.5 rounded-card font-medium text-white mb-5 flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-transform"
        style={{ background: 'linear-gradient(135deg, #C9A15A, #96702E)' }}
      >
        <Plus size={18} /> Nuevo Trabajo
      </button>

      {cargando && <p className="text-center text-tinta/40 text-sm py-10">Cargando pedidos…</p>}

      {!cargando && filtrados.length === 0 && (
        <div className="text-center py-14 text-tinta/40">
          <p className="text-sm">No hay pedidos que coincidan.</p>
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(grupos).map(([nombreGrupo, lista]) =>
          lista.length === 0 ? null : (
            <div key={nombreGrupo || 'todos'}>
              {agrupar === 'cliente' && (
                <h2 className="text-xs uppercase tracking-wide text-tinta/40 font-medium mb-2 px-1">
                  {nombreGrupo} · {lista.length}
                </h2>
              )}
              <div className="space-y-3">
                {lista.map((p) => (
                  <TarjetaPedido
                    key={p.id}
                    pedido={p}
                    onCambiarEstado={actualizarEstado}
                    onCambiarEstadoCamiseria={actualizarEstadoCamiseria}
                    onAbrir={setPedidoAbierto}
                  />
                ))}
              </div>
            </div>
          )
        )}
      </div>

      {modalNuevo && (
        <NuevoPedidoModal
          onCerrar={() => setModalNuevo(false)}
          onCreado={recargar}
        />
      )}
      {pedidoAbierto && (
        <DetallePedidoModal pedido={pedidoAbierto} onCerrar={() => setPedidoAbierto(null)} />
      )}
    </div>
  )
}
