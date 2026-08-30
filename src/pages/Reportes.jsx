import { useMemo } from 'react'
import { usePedidos } from '../lib/usePedidos'
import { ESTADOS, RUBROS, labelEstado } from '../lib/constantes'

export default function Reportes() {
  const { pedidos, cargando } = usePedidos()

  const stats = useMemo(() => {
    const porEstado = {}
    const porRubro = {}
    let ingresosTotales = 0
    let ingresosPendientes = 0
    const porMes = {}

    for (const p of pedidos) {
      if (p.rubro !== 'camiseria') {
        porEstado[p.estado] = (porEstado[p.estado] ?? 0) + 1
      }
      porRubro[p.rubro] = (porRubro[p.rubro] ?? 0) + 1
      ingresosTotales += Number(p.precio_total ?? 0)
      ingresosPendientes += Math.max(0, Number(p.precio_total ?? 0) - Number(p.anticipo ?? 0))

      const mes = new Date(p.creado_en).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
      porMes[mes] = (porMes[mes] ?? 0) + 1
    }

    // Clientes más frecuentes
    const conteoClientes = {}
    for (const p of pedidos) {
      const nombre = p.clientes?.nombre ?? 'Sin cliente'
      conteoClientes[nombre] = (conteoClientes[nombre] ?? 0) + 1
    }
    const topClientes = Object.entries(conteoClientes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    // Pedidos atrasados: más de 21 días sin llegar a finalizado/entregado
    // (solo sastrería — camisería tiene su propio seguimiento de etapas)
    const ahora = Date.now()
    const atrasados = pedidos.filter((p) => {
      if (p.rubro === 'camiseria') return false
      if (p.estado === 'finalizado' || p.estado === 'entregado') return false
      const dias = (ahora - new Date(p.creado_en).getTime()) / (1000 * 60 * 60 * 24)
      return dias > 21
    })

    return { porEstado, porRubro, ingresosTotales, ingresosPendientes, porMes, topClientes, atrasados }
  }, [pedidos])

  if (cargando) return <p className="text-center text-tinta/40 text-sm py-10">Cargando reportes…</p>

  const maxMes = Math.max(1, ...Object.values(stats.porMes))

  return (
    <div className="max-w-2xl mx-auto px-4 pb-28 pt-5 scroll-suave">
      <header className="mb-5">
        <h1 className="font-serif text-2xl text-tinta">Reportes</h1>
        <p className="text-sm text-tinta/50 mt-0.5">Resumen de tu taller</p>
      </header>

      {/* Ingresos */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-card border border-bronce-100 p-4">
          <p className="text-xs uppercase tracking-wide text-tinta/40 font-medium">Facturado total</p>
          <p className="font-serif text-2xl text-tinta mt-1">{stats.ingresosTotales.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-card border border-bronce-100 p-4">
          <p className="text-xs uppercase tracking-wide text-tinta/40 font-medium">Por cobrar</p>
          <p className="font-serif text-2xl mt-1" style={{ color: '#C98A3E' }}>{stats.ingresosPendientes.toFixed(2)}</p>
        </div>
      </div>

      {/* Por estado */}
      <div className="bg-white rounded-card border border-bronce-100 p-4 mb-5">
        <p className="text-xs uppercase tracking-wide text-tinta/40 font-medium mb-3">Pedidos por estado</p>
        <div className="space-y-2">
          {ESTADOS.map((e) => {
            const cantidad = stats.porEstado[e.id] ?? 0
            const pct = pedidos.length ? (cantidad / pedidos.length) * 100 : 0
            return (
              <div key={e.id}>
                <div className="flex justify-between text-xs text-tinta/60 mb-0.5">
                  <span>{e.label}</span>
                  <span>{cantidad}</span>
                </div>
                <div className="h-1.5 bg-lino rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: '#B4863A' }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Por rubro */}
      <div className="bg-white rounded-card border border-bronce-100 p-4 mb-5">
        <p className="text-xs uppercase tracking-wide text-tinta/40 font-medium mb-3">Pedidos por rubro</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          {RUBROS.map((r) => (
            <div key={r.id}>
              <p className="font-serif text-xl text-tinta">{stats.porRubro[r.id] ?? 0}</p>
              <p className="text-[11px] text-tinta/45 mt-0.5">{r.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pedidos por mes */}
      <div className="bg-white rounded-card border border-bronce-100 p-4 mb-5">
        <p className="text-xs uppercase tracking-wide text-tinta/40 font-medium mb-3">Pedidos por mes</p>
        <div className="flex items-end gap-2 h-24">
          {Object.entries(stats.porMes).slice(-6).map(([mes, cantidad]) => (
            <div key={mes} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t"
                style={{ height: `${(cantidad / maxMes) * 100}%`, backgroundColor: '#B4863A', minHeight: 4 }}
              />
              <span className="text-[10px] text-tinta/45 whitespace-nowrap">{mes}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Clientes frecuentes */}
      <div className="bg-white rounded-card border border-bronce-100 p-4 mb-5">
        <p className="text-xs uppercase tracking-wide text-tinta/40 font-medium mb-3">Clientes más frecuentes</p>
        <div className="space-y-2">
          {stats.topClientes.map(([nombre, cantidad]) => (
            <div key={nombre} className="flex justify-between text-sm">
              <span className="text-tinta/75">{nombre}</span>
              <span className="text-tinta/45">{cantidad} pedido{cantidad > 1 ? 's' : ''}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Atrasados */}
      {stats.atrasados.length > 0 && (
        <div className="bg-white rounded-card border p-4" style={{ borderColor: '#C98A3E55' }}>
          <p className="text-xs uppercase tracking-wide font-medium mb-3" style={{ color: '#C98A3E' }}>
            Pedidos atrasados (+21 días)
          </p>
          <div className="space-y-2">
            {stats.atrasados.map((p) => (
              <div key={p.id} className="flex justify-between text-sm">
                <span className="text-tinta/75">{p.clientes?.nombre}</span>
                <span className="text-tinta/45">{labelEstado(p.estado)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
