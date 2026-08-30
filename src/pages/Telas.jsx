import { useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import { useTejidosGlobal } from '../lib/useTejidosGlobal'

export default function Telas() {
  const { tejidos, cargando, alternarComprada } = useTejidosGlobal()
  const [filtro, setFiltro] = useState('todas') // 'todas' | 'pendientes' | 'compradas'

  const filtradas = useMemo(() => {
    if (filtro === 'pendientes') return tejidos.filter((t) => !t.comprada)
    if (filtro === 'compradas') return tejidos.filter((t) => t.comprada)
    return tejidos
  }, [tejidos, filtro])

  return (
    <div className="max-w-2xl mx-auto px-4 pb-28 pt-5 scroll-suave">
      <header className="mb-5">
        <h1 className="font-serif text-2xl text-tinta">Telas</h1>
        <p className="text-sm text-tinta/50 mt-0.5">{tejidos.length} tejidos registrados</p>
      </header>

      <div className="flex gap-2 mb-4">
        {[
          { id: 'todas', label: 'Todas' },
          { id: 'pendientes', label: 'Pendientes' },
          { id: 'compradas', label: 'Compradas' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium border ${
              filtro === f.id ? 'bg-tinta text-white border-tinta' : 'bg-white text-tinta/70 border-bronce-100'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {cargando && <p className="text-center text-tinta/40 text-sm py-10">Cargando…</p>}

      {!cargando && filtradas.length === 0 && (
        <p className="text-center text-tinta/40 text-sm py-10">No hay tejidos que coincidan.</p>
      )}

      <div className="space-y-2.5">
        {filtradas.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-card border border-bronce-100 p-4 flex items-center gap-3"
          >
            <button
              onClick={() => alternarComprada(t.id, t.comprada)}
              className="shrink-0 w-6 h-6 rounded-full border flex items-center justify-center"
              style={{
                borderColor: t.comprada ? '#6E8F6B' : '#D9B872',
                backgroundColor: t.comprada ? '#6E8F6B' : 'transparent',
              }}
            >
              {t.comprada && <Check size={14} className="text-white" />}
            </button>
            <div className="min-w-0 flex-1">
              <p className={`font-medium truncate ${t.comprada ? 'text-tinta/40 line-through' : 'text-tinta'}`}>
                {t.pedidos?.clientes?.nombre ?? 'Sin cliente'}
              </p>
              <p className="text-xs text-tinta/50 mt-0.5">
                {t.proveedor || 'Sin proveedor'}
                {t.referencia ? ` · ${t.referencia}` : ''}
              </p>
              <p className="text-[11px] text-tinta/35 mt-0.5">
                {formatearFecha(t.pedidos?.fecha_pedido || t.pedidos?.creado_en)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatearFecha(valor) {
  if (!valor) return ''
  const fecha = new Date(valor)
  return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}
