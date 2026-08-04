import { MapPin, Shirt } from 'lucide-react'
import { ESTADOS, labelRubro, colorRubro } from '../lib/constantes'

export default function TarjetaPedido({ pedido, onCambiarEstado, onAbrir }) {
  const cliente = pedido.clientes

  return (
    <div className="bg-white rounded-card border border-bronce-100 shadow-sm animar-entrada">
      <button
        onClick={() => onAbrir(pedido)}
        className="w-full text-left px-5 pt-4 pb-3 flex items-start justify-between gap-3"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-serif text-lg text-tinta truncate">{cliente?.nombre ?? 'Sin cliente'}</h3>
            <span
              className="text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0"
              style={{ backgroundColor: colorRubro(pedido.rubro) + '1A', color: colorRubro(pedido.rubro) }}
            >
              {labelRubro(pedido.rubro)}
            </span>
          </div>
          {pedido.descripcion && (
            <p className="text-sm text-tinta/60 mt-0.5 truncate flex items-center gap-1">
              <Shirt size={13} className="shrink-0" /> {pedido.descripcion}
            </p>
          )}
          {cliente?.poblacion && (
            <p className="text-xs text-tinta/45 mt-1 flex items-center gap-1">
              <MapPin size={12} className="shrink-0" /> {cliente.poblacion}
            </p>
          )}
        </div>
        <EstadoPill estado={pedido.estado} />
      </button>

      <div className="grid grid-cols-4 gap-1.5 px-3 pb-3">
        {ESTADOS.filter((e) => e.id !== 'entregado').map((e) => {
          const activo = pedido.estado === e.id
          return (
            <button
              key={e.id}
              onClick={() => onCambiarEstado(pedido.id, e.id)}
              className={`text-[13px] font-medium py-2 rounded-lg transition-colors truncate px-1 ${
                activo ? 'text-white' : 'bg-lino text-tinta/55 hover:bg-bronce-100'
              }`}
              style={activo ? { backgroundColor: '#B4863A' } : undefined}
            >
              {e.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function EstadoPill({ estado }) {
  const e = ESTADOS.find((x) => x.id === estado)
  const colores = {
    'carrete-azul': '#5B7C99',
    'carrete-ambar': '#C98A3E',
    'carrete-lila': '#8E7CA8',
    'carrete-verde': '#6E8F6B',
    'carrete-gris': '#8A8378',
  }
  const hex = colores[e?.color] ?? '#8A8378'
  return (
    <span
      className="text-xs font-medium px-3 py-1 rounded-full shrink-0"
      style={{ backgroundColor: hex + '1A', color: hex }}
    >
      {e?.label ?? estado}
    </span>
  )
}
