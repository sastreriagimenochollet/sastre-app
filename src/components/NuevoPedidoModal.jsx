import { useState } from 'react'
import { X, UserPlus, Camera, Plus } from 'lucide-react'
import { useClientes } from '../lib/useClientes'
import { usePedidos } from '../lib/usePedidos'
import { RUBROS } from '../lib/constantes'
import { supabase } from '../lib/supabase'
import PrendaFormulario from './PrendaFormulario'

export default function NuevoPedidoModal({ onCerrar }) {
  const { clientes, crearCliente } = useClientes()
  const { crearPedido } = usePedidos()

  const [clienteId, setClienteId] = useState('')
  const [creandoCliente, setCreandoCliente] = useState(false)
  const [nombreNuevo, setNombreNuevo] = useState('')
  const [telefonoNuevo, setTelefonoNuevo] = useState('')
  const [poblacionNueva, setPoblacionNueva] = useState('')

  const [rubro, setRubro] = useState('sastreria')
  const [descripcion, setDescripcion] = useState('')
  const [tejidoReferencia, setTejidoReferencia] = useState('')
  const [foto, setFoto] = useState(null)
  const [precioTotal, setPrecioTotal] = useState('')
  const [anticipo, setAnticipo] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [prendas, setPrendas] = useState([])
  const [fechaPedido, setFechaPedido] = useState(() => new Date().toISOString().slice(0, 10))
  const [fechaEntrega, setFechaEntrega] = useState('')
  const [fechaBoda, setFechaBoda] = useState('')

  function agregarPrenda() {
    setPrendas((prev) => [...prev, { tipo: 'chaqueta', referencia: '', precio: '', detalles: {} }])
  }

  function actualizarPrenda(indice, prendaActualizada) {
    setPrendas((prev) => prev.map((p, i) => (i === indice ? prendaActualizada : p)))
  }

  function eliminarPrenda(indice) {
    setPrendas((prev) => prev.filter((_, i) => i !== indice))
  }

  async function subirFoto(pedidoId) {
    if (!foto) return null
    const ext = foto.name.split('.').pop()
    const ruta = `${pedidoId}.${ext}`
    const { error } = await supabase.storage.from('tejidos').upload(ruta, foto, { upsert: true })
    if (error) {
      console.error('Error subiendo foto:', error.message)
      return null
    }
    const { data } = supabase.storage.from('tejidos').getPublicUrl(ruta)
    return data.publicUrl
  }

  async function guardar() {
    setErrorMsg('')
    let idCliente = clienteId

    if (creandoCliente) {
      if (!nombreNuevo.trim()) {
        setErrorMsg('Escribe el nombre del cliente.')
        return
      }
      setGuardando(true)
      try {
        const nuevo = await crearCliente({
          nombre: nombreNuevo.trim(),
          telefono: telefonoNuevo.trim() || null,
          poblacion: poblacionNueva.trim() || null,
        })
        idCliente = nuevo.id
      } catch (e) {
        setErrorMsg('No se pudo crear el cliente: ' + e.message)
        setGuardando(false)
        return
      }
    }

    if (!idCliente) {
      setErrorMsg('Selecciona o crea un cliente.')
      return
    }

    setGuardando(true)
    try {
      const nuevoPedido = await crearPedido({
        cliente_id: idCliente,
        rubro,
        descripcion: descripcion.trim() || null,
        tejido_referencia: tejidoReferencia.trim() || null,
        precio_total: precioTotal ? Number(precioTotal) : 0,
        anticipo: anticipo ? Number(anticipo) : 0,
        fecha_pedido: fechaPedido || null,
        fecha_entrega_estimada: fechaEntrega || null,
        fecha_boda: fechaBoda || null,
      })

      if (foto) {
        const url = await subirFoto(nuevoPedido.id)
        if (url) {
          await supabase.from('pedidos').update({ tejido_foto_url: url }).eq('id', nuevoPedido.id)
        }
      }

      if (prendas.length > 0) {
        const filasPrendas = prendas.map((p) => ({
          pedido_id: nuevoPedido.id,
          tipo: p.tipo,
          referencia: p.referencia?.trim() || null,
          precio: p.precio ? Number(p.precio) : 0,
          detalles: p.detalles ?? {},
        }))
        const { error: errorPrendas } = await supabase.from('prendas').insert(filasPrendas)
        if (errorPrendas) throw errorPrendas
      }

      onCerrar()
    } catch (e) {
      setErrorMsg('No se pudo guardar el pedido: ' + e.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-lino w-full sm:max-w-4xl sm:rounded-card rounded-t-2xl max-h-[92vh] overflow-y-auto scroll-suave">
        <div className="sticky top-0 bg-lino flex items-center justify-between px-5 py-4 border-b border-bronce-100">
          <h2 className="font-serif text-xl text-tinta">Nuevo Trabajo</h2>
          <button onClick={onCerrar} className="text-tinta/50 hover:text-tinta">
            <X size={22} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Cliente */}
          <div>
            <label className="text-xs uppercase tracking-wide text-tinta/50 font-medium">Cliente</label>
            {!creandoCliente ? (
              <div className="mt-1.5 space-y-2">
                <select
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  className="w-full bg-white border border-bronce-100 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-bronce-300"
                >
                  <option value="">Selecciona un cliente…</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
                <button
                  onClick={() => setCreandoCliente(true)}
                  className="text-sm text-bronce-600 font-medium flex items-center gap-1.5"
                >
                  <UserPlus size={15} /> Crear cliente nuevo
                </button>
              </div>
            ) : (
              <div className="mt-1.5 space-y-2">
                <input
                  value={nombreNuevo}
                  onChange={(e) => setNombreNuevo(e.target.value)}
                  placeholder="Nombre completo"
                  className="w-full bg-white border border-bronce-100 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-bronce-300"
                />
                <input
                  value={telefonoNuevo}
                  onChange={(e) => setTelefonoNuevo(e.target.value)}
                  placeholder="Teléfono (opcional)"
                  className="w-full bg-white border border-bronce-100 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-bronce-300"
                />
                <input
                  value={poblacionNueva}
                  onChange={(e) => setPoblacionNueva(e.target.value)}
                  placeholder="Población (opcional)"
                  className="w-full bg-white border border-bronce-100 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-bronce-300"
                />
                <button
                  onClick={() => setCreandoCliente(false)}
                  className="text-sm text-tinta/50"
                >
                  Usar cliente existente
                </button>
              </div>
            )}
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs uppercase tracking-wide text-tinta/50 font-medium">Fecha pedido</label>
              <input
                type="date"
                value={fechaPedido}
                onChange={(e) => setFechaPedido(e.target.value)}
                className="mt-1.5 w-full bg-white border border-bronce-100 rounded-lg px-2 py-2.5 text-sm outline-none focus:border-bronce-300"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-tinta/50 font-medium">Fecha entrega</label>
              <input
                type="date"
                value={fechaEntrega}
                onChange={(e) => setFechaEntrega(e.target.value)}
                className="mt-1.5 w-full bg-white border border-bronce-100 rounded-lg px-2 py-2.5 text-sm outline-none focus:border-bronce-300"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-tinta/50 font-medium">Fecha boda</label>
              <input
                type="date"
                value={fechaBoda}
                onChange={(e) => setFechaBoda(e.target.value)}
                className="mt-1.5 w-full bg-white border border-bronce-100 rounded-lg px-2 py-2.5 text-sm outline-none focus:border-bronce-300"
              />
            </div>
          </div>

          {/* Rubro */}
          <div>
            <label className="text-xs uppercase tracking-wide text-tinta/50 font-medium">Rubro</label>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {RUBROS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRubro(r.id)}
                  className={`py-2.5 rounded-lg text-xs font-medium border transition-colors ${
                    rubro === r.id ? 'text-white border-transparent' : 'bg-white text-tinta/60 border-bronce-100'
                  }`}
                  style={rubro === r.id ? { backgroundColor: r.color } : undefined}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="text-xs uppercase tracking-wide text-tinta/50 font-medium">Descripción</label>
            <input
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej. Traje 2 piezas azul marino"
              className="mt-1.5 w-full bg-white border border-bronce-100 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-bronce-300"
            />
          </div>

          {/* Tejido */}
          <div>
            <label className="text-xs uppercase tracking-wide text-tinta/50 font-medium">Referencia de tejido</label>
            <input
              value={tejidoReferencia}
              onChange={(e) => setTejidoReferencia(e.target.value)}
              placeholder="Código, proveedor o descripción de la tela"
              className="mt-1.5 w-full bg-white border border-bronce-100 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-bronce-300"
            />
            <label className="mt-2 flex items-center gap-2 text-sm text-bronce-600 font-medium cursor-pointer w-fit">
              <Camera size={16} />
              {foto ? foto.name : 'Añadir foto de la tela (opcional)'}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          {/* Precio */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wide text-tinta/50 font-medium">Precio total</label>
              <input
                type="number"
                inputMode="decimal"
                value={precioTotal}
                onChange={(e) => setPrecioTotal(e.target.value)}
                placeholder="0.00"
                className="mt-1.5 w-full bg-white border border-bronce-100 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-bronce-300"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-tinta/50 font-medium">Anticipo</label>
              <input
                type="number"
                inputMode="decimal"
                value={anticipo}
                onChange={(e) => setAnticipo(e.target.value)}
                placeholder="0.00"
                className="mt-1.5 w-full bg-white border border-bronce-100 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-bronce-300"
              />
            </div>
          </div>

          {/* Prendas */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs uppercase tracking-wide text-tinta/50 font-medium">Prendas</label>
              <button
                onClick={agregarPrenda}
                className="text-sm text-bronce-600 font-medium flex items-center gap-1.5"
              >
                <Plus size={15} /> Añadir prenda
              </button>
            </div>
            {prendas.length === 0 ? (
              <p className="text-sm text-tinta/40">
                Opcional — añade una prenda si quieres registrar sus medidas y detalles de confección.
              </p>
            ) : (
              <div className="space-y-3">
                {prendas.map((p, i) => (
                  <PrendaFormulario
                    key={i}
                    prenda={p}
                    onCambiar={(actualizada) => actualizarPrenda(i, actualizada)}
                    onEliminar={() => eliminarPrenda(i)}
                    clienteId={!creandoCliente ? clienteId : null}
                  />
                ))}
              </div>
            )}
          </div>

          {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

          <button
            onClick={guardar}
            disabled={guardando}
            className="w-full py-3.5 rounded-card font-medium text-white disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #C9A15A, #96702E)' }}
          >
            {guardando ? 'Guardando…' : 'Guardar pedido'}
          </button>
        </div>
      </div>
    </div>
  )
}
