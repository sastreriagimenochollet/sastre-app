import { MapPin, Shirt, AlertTriangle } from 'lucide-react'
import { ESTADOS, ESTADO_COLOR_HEX, labelRubro, colorRubro, urgenciaEntrega } from '../lib/constantes'
import { ESTADOS_CAMISERIA, labelEstadoCamiseria, colorEstadoCamiseria } from '../lib/camiseriaConfig'

export default function TarjetaPedido({ pedido, onCambiarEstado, onCambiarEstadoCamiseria, onAbrir }) {
  const cliente = pedido.clientes
  const esCamiseria = pedido.rubro === 'camiseria'
  const estadoCamiseria = pedido.camiseria_seguimiento?.[0]?.estado ?? 'pasada'
  const yaEntregado = esCamiseria ? estadoCamiseria === 'entregada' : pedido.estado === 'entregado'
  const urgencia = urgenciaEntrega(pedido.fecha_entrega_estimada, yaEntregado)

  return (
    <div
      className="bg-white rounded-card border shadow-sm animar-entrada"
      style={{ borderColor: urgencia ? urgencia.color + '80' : undefined, borderWidth: urgencia ? 1.5 : undefined }}
    >
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
          {urgencia && (
            <p className="text-xs mt-1 flex items-center gap-1 font-medium" style={{ color: urgencia.color }}>
              <AlertTriangle size={12} className="shrink-0" />
              {urgencia.nivel === 'vencido'
                ? `Entrega vencida hace ${Math.abs(urgencia.dias)} día${Math.abs(urgencia.dias) === 1 ? '' : 's'}`
                : urgencia.dias === 0
                ? 'Entrega hoy'
                : `Entrega en ${urgencia.dias} día${urgencia.dias === 1 ? '' : 's'}`}
            </p>
          )}
        </div>
        {esCamiseria ? (
          <span
            className="text-xs font-medium px-3 py-1 rounded-full shrink-0"
            style={{ backgroundColor: colorEstadoCamiseria(estadoCamiseria) + '1A', color: colorEstadoCamiseria(estadoCamiseria) }}
          >
            {labelEstadoCamiseria(estadoCamiseria)}
          </span>
        ) : (
          <EstadoPill estado={pedido.estado} />
        )}
      </button>

      {esCamiseria ? (
        <div className="grid grid-cols-4 gap-1.5 px-3 pb-3">
          {ESTADOS_CAMISERIA.map((e) => {
            const activo = estadoCamiseria === e.id
            return (
              <button
                key={e.id}
                onClick={() => onCambiarEstadoCamiseria(pedido.id, e.id)}
                className={`text-[12px] font-medium py-2 rounded-lg transition-colors truncate px-1 ${
                  activo ? 'text-white' : 'bg-lino text-tinta/55 hover:bg-bronce-100'
                }`}
                style={activo ? { backgroundColor: '#B4863A' } : undefined}
              >
                {e.label}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5 px-3 pb-3">
          {ESTADOS.filter((e) => e.id !== 'entregado').map((e) => {
            const activo = pedido.estado === e.id
            return (
              <button
                key={e.id}
                onClick={() => onCambiarEstado(pedido.id, e.id)}
                className={`text-[12px] font-medium py-2 rounded-lg transition-colors truncate px-1 ${
                  activo ? 'text-white' : 'bg-lino text-tinta/55 hover:bg-bronce-100'
                }`}
                style={activo ? { backgroundColor: '#B4863A' } : undefined}
              >
                {e.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function EstadoPill({ estado }) {
  const e = ESTADOS.find((x) => x.id === estado)
  const hex = ESTADO_COLOR_HEX[estado] ?? '#8A8378'
  return (
    <span
      className="text-xs font-medium px-3 py-1 rounded-full shrink-0"
      style={{ backgroundColor: hex + '1A', color: hex }}
    >
      {e?.label ?? estado}
    </span>
  )
}
