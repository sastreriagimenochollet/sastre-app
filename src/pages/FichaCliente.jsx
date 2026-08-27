import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Phone, MapPin, MessageCircle } from 'lucide-react'
import { useCliente } from '../lib/useClientes'
import { usePedidos } from '../lib/usePedidos'
import { EstadoPill } from '../components/TarjetaPedido'
import SeccionMedidas from '../components/SeccionMedidas'
import SeccionNotasComposturas from '../components/SeccionNotasComposturas'
import { labelRubro } from '../lib/constantes'

export default function FichaCliente() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { cliente, medidas, cargando, guardarMedidas } = useCliente(id)
  const { pedidos } = usePedidos()

  const pedidosCliente = pedidos.filter((p) => p.cliente_id === id)

  if (cargando) return <p className="text-center text-tinta/40 text-sm py-10">Cargando…</p>
  if (!cliente) return <p className="text-center text-tinta/40 text-sm py-10">Cliente no encontrado.</p>

  return (
    <div className="max-w-2xl mx-auto px-4 pb-28 pt-5 scroll-suave">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-tinta/60 text-sm mb-4">
        <ArrowLeft size={16} /> Volver
      </button>

      {/* Cabecera cliente */}
      <div className="bg-white rounded-card border border-bronce-100 p-5 mb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center font-serif text-xl text-white shrink-0"
            style={{ backgroundColor: '#B4863A' }}
          >
            {cliente.nombre?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <h1 className="font-serif text-xl text-tinta truncate">{cliente.nombre}</h1>
            {cliente.telefono && (
              <p className="text-sm text-tinta/55 flex items-center gap-1"><Phone size={13} /> {cliente.telefono}</p>
            )}
            {cliente.poblacion && (
              <p className="text-sm text-tinta/55 flex items-center gap-1"><MapPin size={13} /> {cliente.poblacion}</p>
            )}
          </div>
        </div>

        {cliente.telefono && (
          <div className="grid grid-cols-2 gap-2 mt-4">
            <a
              href={`https://wa.me/${cliente.telefono.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-bronce-100 text-sm font-medium text-tinta/70"
            >
              <MessageCircle size={16} /> WhatsApp
            </a>
            <a
              href={`tel:${cliente.telefono}`}
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-bronce-100 text-sm font-medium text-tinta/70"
            >
              <Phone size={16} /> Llamar
            </a>
          </div>
        )}
      </div>

      {/* Notas y composturas del cliente */}
      <div className="mb-8">
        <SeccionNotasComposturas
          entidad="clientes"
          entidadId={cliente.id}
          notasIniciales={cliente.notas}
          tablaComposturas="composturas_cliente"
          columnaRelacion="cliente_id"
        />
      </div>

      {/* Medidas */}
      <div className="mb-8">
        <SeccionMedidas medidas={medidas} guardarMedidas={guardarMedidas} />
      </div>

      {/* Historial de pedidos */}
      <h2 className="font-serif text-lg text-tinta mb-3">Historial de pedidos</h2>
      {pedidosCliente.length === 0 ? (
        <p className="text-sm text-tinta/40">Este cliente aún no tiene pedidos.</p>
      ) : (
        <div className="space-y-2.5">
          {pedidosCliente.map((p) => (
            <div key={p.id} className="bg-white rounded-card border border-bronce-100 p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-tinta truncate">{p.descripcion || labelRubro(p.rubro)}</p>
                <p className="text-xs text-tinta/45 mt-0.5">
                  {new Date(p.creado_en).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <EstadoPill estado={p.estado} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
