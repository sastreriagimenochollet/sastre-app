import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Phone, MapPin, MessageCircle } from 'lucide-react'
import { useCliente } from '../lib/useClientes'
import { usePedidos } from '../lib/usePedidos'
import { EstadoPill } from '../components/TarjetaPedido'
import { CAMPOS_MEDIDAS_BASICAS, CAMPOS_MEDIDAS_AVANZADAS, labelRubro } from '../lib/constantes'

export default function FichaCliente() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { cliente, medidas, cargando, guardarMedidas } = useCliente(id)
  const { pedidos } = usePedidos()
  const [genero, setGenero] = useState('hombre')
  const [tab, setTab] = useState('basicas')
  const [valores, setValores] = useState({})

  useEffect(() => {
    if (medidas) {
      setGenero(medidas.genero ?? 'hombre')
      setValores(medidas)
    }
  }, [medidas])

  const pedidosCliente = pedidos.filter((p) => p.cliente_id === id)

  function onCambiarCampo(key, valor) {
    setValores((prev) => ({ ...prev, [key]: valor }))
  }

  async function onBlurCampo(key, valor) {
    // Auto-guardado al salir del campo, como en la app original
    await guardarMedidas({ [key]: valor === '' ? null : Number(valor), genero })
  }

  async function cambiarGenero(g) {
    setGenero(g)
    await guardarMedidas({ genero: g })
  }

  if (cargando) return <p className="text-center text-tinta/40 text-sm py-10">Cargando…</p>
  if (!cliente) return <p className="text-center text-tinta/40 text-sm py-10">Cliente no encontrado.</p>

  const campos = tab === 'basicas' ? CAMPOS_MEDIDAS_BASICAS : CAMPOS_MEDIDAS_AVANZADAS

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

      {/* Medidas */}
      <h2 className="font-serif text-lg text-tinta mb-2">Medidas</h2>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {['hombre', 'mujer'].map((g) => (
          <button
            key={g}
            onClick={() => cambiarGenero(g)}
            className={`py-2.5 rounded-lg text-sm font-medium capitalize ${
              genero === g ? 'text-white' : 'bg-white border border-bronce-100 text-tinta/60'
            }`}
            style={genero === g ? { backgroundColor: '#B4863A' } : undefined}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        {[
          { id: 'basicas', label: 'Básicas' },
          { id: 'avanzadas', label: 'Avanzadas' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              tab === t.id ? 'text-white' : 'bg-white border border-bronce-100 text-tinta/60'
            }`}
            style={tab === t.id ? { backgroundColor: '#B4863A' } : undefined}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {campos.map((c) => (
          <div key={c.key}>
            <label className="text-[11px] uppercase tracking-wide text-tinta/45 font-medium">{c.label}</label>
            <div className="relative mt-1">
              <input
                type="number"
                inputMode="decimal"
                value={valores[c.key] ?? ''}
                onChange={(e) => onCambiarCampo(c.key, e.target.value)}
                onBlur={(e) => onBlurCampo(c.key, e.target.value)}
                placeholder={c.unidad}
                className="w-full bg-white border border-bronce-100 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-bronce-300"
              />
            </div>
          </div>
        ))}
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
