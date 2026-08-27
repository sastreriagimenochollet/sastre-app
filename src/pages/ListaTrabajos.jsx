import { useMemo, useState } from 'react'
import { Plus, Users, ListFilter, Search } from 'lucide-react'
import { usePedidos } from '../lib/usePedidos'
import TarjetaPedido from '../components/TarjetaPedido'
import FiltrosEstado from '../components/FiltrosEstado'
import NuevoPedidoModal from '../components/NuevoPedidoModal'
import DetallePedidoModal from '../components/DetallePedidoModal'

export default function ListaTrabajos() {
  const { pedidos, cargando, actualizarEstado } = usePedidos()
  const [filtro, setFiltro] = useState('todos')
  const [agrupar, setAgrupar] = useState('estado') // 'estado' | 'cliente'
  const [busqueda, setBusqueda] = useState('')
  const [modalNuevo, setModalNuevo] = useState(false)
  const [pedidoAbierto, setPedidoAbierto] = useState(null)

  const filtrados = useMemo(() => {
    let lista = pedidos
    if (filtro !== 'todos') lista = lista.filter((p) => p.estado === filtro)
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      lista = lista.filter(
        (p) =>
          p.clientes?.nombre?.toLowerCase().includes(q) ||
          p.descripcion?.toLowerCase().includes(q)
      )
    }
    return lista
  }, [pedidos, filtro, busqueda])

  const conteos = useMemo(() => {
    const c = { todos: pedidos.length }
    for (const p of pedidos) c[p.estado] = (c[p.estado] ?? 0) + 1
    return c
  }, [pedidos])

  const grupos = useMemo(() => {
    if (agrupar === 'estado') return { '': filtrados }
    const porCliente = {}
    for (const p of filtrados) {
      const nombre = p.clientes?.nombre ?? 'Sin cliente'
      if (!porCliente[nombre]) porCliente[nombre] = []
      porCliente[nombre].push(p)
    }
    return porCliente
  }, [filtrados, agrupar])

  return (
    <div className="max-w-2xl mx-auto px-4 pb-28 pt-5 scroll-suave">
      <header className="mb-5">
        <h1 className="font-serif text-2xl text-tinta">Trabajos</h1>
        <p className="text-sm text-tinta/50 mt-0.5">{pedidos.length} pedidos en total</p>
      </header>

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
        <button
          onClick={() => setAgrupar(agrupar === 'estado' ? 'cliente' : 'estado')}
          className="shrink-0 bg-white border border-bronce-100 rounded-full p-2.5 text-tinta/60 hover:border-bronce-300"
          title={agrupar === 'estado' ? 'Agrupar por cliente' : 'Agrupar por estado'}
        >
          {agrupar === 'estado' ? <Users size={17} /> : <ListFilter size={17} />}
        </button>
      </div>

      <div className="mb-4">
        <FiltrosEstado filtro={filtro} onFiltrar={setFiltro} conteos={conteos} />
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
                    onAbrir={setPedidoAbierto}
                  />
                ))}
              </div>
            </div>
          )
        )}
      </div>

      {modalNuevo && <NuevoPedidoModal onCerrar={() => setModalNuevo(false)} />}
      {pedidoAbierto && (
        <DetallePedidoModal pedido={pedidoAbierto} onCerrar={() => setPedidoAbierto(null)} />
      )}
    </div>
  )
}
