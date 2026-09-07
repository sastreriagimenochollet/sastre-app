import { useState, useMemo } from 'react'
import { X, UserPlus, Plus } from 'lucide-react'
import { useClientes } from '../lib/useClientes'
import { usePedidos } from '../lib/usePedidos'
import { RUBROS, TIPOS_TRABAJO, acentoDeRubro } from '../lib/constantes'
import { supabase } from '../lib/supabase'
import PrendaFormulario from './PrendaFormulario'
import TejidoFormulario from './TejidoFormulario'
import CamisaFormulario from './CamisaFormulario'

export default function NuevoPedidoModal({ onCerrar, onCreado, tabActual = 'sastreria' }) {
  const { clientes, crearCliente } = useClientes()
  const { crearPedido } = usePedidos()

  const [clienteId, setClienteId] = useState('')
  const [creandoCliente, setCreandoCliente] = useState(false)
  const [nombreNuevo, setNombreNuevo] = useState('')
  const [telefonoNuevo, setTelefonoNuevo] = useState('')
  const [poblacionNueva, setPoblacionNueva] = useState('')

  const [rubro, setRubro] = useState(tabActual === 'camiseria' ? 'camiseria' : 'sastreria')
  const rubrosDisponibles =
    tabActual === 'camiseria' ? RUBROS.filter((r) => r.id === 'camiseria') : RUBROS.filter((r) => r.id !== 'camiseria')
  const acento = acentoDeRubro(rubro)

  const [descripcion, setDescripcion] = useState('')
  // Cada tipo de trabajo lleva su propio precio (Traje, Pantalón…)
  const [tiposTrabajo, setTiposTrabajo] = useState([{ tipo: '', precio: '' }])
  const [tejidos, setTejidos] = useState([{ proveedor: '', referencia: '', fotoArchivo: null }])
  const [anticipo, setAnticipo] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [prendas, setPrendas] = useState([])
  const [fechaPedido, setFechaPedido] = useState(() => new Date().toISOString().slice(0, 10))
  const [fechaEntrega, setFechaEntrega] = useState('')
  const [fechaBoda, setFechaBoda] = useState('')

  // Camisería: varias camisas por pedido, cada una con su propio precio
  const [camisas, setCamisas] = useState([{ proveedor: '', tejido: '', referencia: '', precio: '', detalles: {} }])

  const esCamiseria = rubro === 'camiseria'

  const precioTotal = useMemo(() => {
    const lista = esCamiseria ? camisas : tiposTrabajo
    return lista.reduce((suma, item) => suma + (Number(item.precio) || 0), 0)
  }, [esCamiseria, camisas, tiposTrabajo])

  function agregarTipoTrabajo() {
    setTiposTrabajo((prev) => [...prev, { tipo: '', precio: '' }])
  }

  function actualizarTipoTrabajo(indice, cambios) {
    setTiposTrabajo((prev) => prev.map((t, i) => (i === indice ? { ...t, ...cambios } : t)))
  }

  function eliminarTipoTrabajo(indice) {
    setTiposTrabajo((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== indice) : prev))
  }

  function agregarTejido() {
    setTejidos((prev) => [...prev, { proveedor: '', referencia: '', fotoArchivo: null }])
  }

  function actualizarTejido(indice, tejidoActualizado) {
    setTejidos((prev) => prev.map((t, i) => (i === indice ? tejidoActualizado : t)))
  }

  function eliminarTejido(indice) {
    setTejidos((prev) => prev.filter((_, i) => i !== indice))
  }

  function agregarPrenda() {
    setPrendas((prev) => [...prev, { tipo: 'chaqueta', referencia: '', precio: '', detalles: {} }])
  }

  function actualizarPrenda(indice, prendaActualizada) {
    setPrendas((prev) => prev.map((p, i) => (i === indice ? prendaActualizada : p)))
  }

  function eliminarPrenda(indice) {
    setPrendas((prev) => prev.filter((_, i) => i !== indice))
  }

  function agregarCamisa() {
    setCamisas((prev) => [...prev, { proveedor: '', tejido: '', referencia: '', precio: '', detalles: {} }])
  }

  function actualizarCamisa(indice, camisaActualizada) {
    setCamisas((prev) => prev.map((c, i) => (i === indice ? camisaActualizada : c)))
  }

  function eliminarCamisa(indice) {
    setCamisas((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== indice) : prev))
  }

  async function subirFotoTejido(archivo, ruta) {
    if (!archivo) return null
    const { error } = await supabase.storage.from('tejidos').upload(ruta, archivo, { upsert: true })
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
        tipos_trabajo: esCamiseria ? [] : tiposTrabajo.filter((t) => t.tipo).map((t) => t.tipo),
        precio_total: precioTotal,
        anticipo: anticipo ? Number(anticipo) : 0,
        fecha_pedido: fechaPedido || null,
        fecha_entrega_estimada: fechaEntrega || null,
        fecha_boda: fechaBoda || null,
      })

      const tejidosConDatos = esCamiseria ? [] : tejidos.filter((t) => t.proveedor || t.referencia?.trim() || t.fotoArchivo)
      for (let i = 0; i < tejidosConDatos.length; i++) {
        const t = tejidosConDatos[i]
        let fotoUrl = null
        if (t.fotoArchivo) {
          const ext = t.fotoArchivo.name.split('.').pop()
          fotoUrl = await subirFotoTejido(t.fotoArchivo, `${nuevoPedido.id}-${i}.${ext}`)
        }
        const { error: errorTejido } = await supabase.from('tejidos').insert({
          pedido_id: nuevoPedido.id,
          proveedor: t.proveedor || null,
          referencia: t.referencia?.trim() || null,
          foto_url: fotoUrl,
        })
        if (errorTejido) throw errorTejido
      }

      if (esCamiseria) {
        const { error: errorSeguimiento } = await supabase.from('camiseria_seguimiento').insert({
          pedido_id: nuevoPedido.id,
          estado: 'pasada',
        })
        if (errorSeguimiento) throw errorSeguimiento

        const camisasConDatos = camisas.filter((c) => c.proveedor || c.tejido || c.referencia?.trim() || c.precio)
        const filasCamisas = camisasConDatos.map((c, i) => ({
          pedido_id: nuevoPedido.id,
          numero: i + 1,
          proveedor: c.proveedor || null,
          tejido: c.tejido || null,
          referencia: c.referencia?.trim() || null,
          precio: c.precio ? Number(c.precio) : 0,
          detalles: c.detalles ?? {},
        }))
        if (filasCamisas.length > 0) {
          const { error: errorCamisas } = await supabase.from('camisas').insert(filasCamisas)
          if (errorCamisas) throw errorCamisas
        }
      } else {
        const itemsConDatos = tiposTrabajo.filter((t) => t.tipo || t.precio)
        const filasItems = itemsConDatos.map((t, i) => ({
          pedido_id: nuevoPedido.id,
          tipo: t.tipo || null,
          precio: t.precio ? Number(t.precio) : 0,
          orden: i,
        }))
        if (filasItems.length > 0) {
          const { error: errorItems } = await supabase.from('items_trabajo').insert(filasItems)
          if (errorItems) throw errorItems
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
      }

      onCreado?.()
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
        <div className="sticky top-0 bg-lino flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: acento + '33' }}>
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
                  className="w-full bg-white border border-bronce-100 rounded-lg px-3 py-2.5 text-sm outline-none"
                  style={{ borderColor: undefined }}
                >
                  <option value="">Selecciona un cliente…</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
                <button
                  onClick={() => setCreandoCliente(true)}
                  className="text-sm font-medium flex items-center gap-1.5"
                  style={{ color: acento }}
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
                  className="w-full bg-white border border-bronce-100 rounded-lg px-3 py-2.5 text-sm outline-none"
                />
                <input
                  value={telefonoNuevo}
                  onChange={(e) => setTelefonoNuevo(e.target.value)}
                  placeholder="Teléfono (opcional)"
                  className="w-full bg-white border border-bronce-100 rounded-lg px-3 py-2.5 text-sm outline-none"
                />
                <input
                  value={poblacionNueva}
                  onChange={(e) => setPoblacionNueva(e.target.value)}
                  placeholder="Población (opcional)"
                  className="w-full bg-white border border-bronce-100 rounded-lg px-3 py-2.5 text-sm outline-none"
                />
                <button onClick={() => setCreandoCliente(false)} className="text-sm text-tinta/50">
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
                className="mt-1.5 w-full bg-white border border-bronce-100 rounded-lg px-2 py-2.5 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-tinta/50 font-medium">Fecha entrega</label>
              <input
                type="date"
                value={fechaEntrega}
                onChange={(e) => setFechaEntrega(e.target.value)}
                className="mt-1.5 w-full bg-white border border-bronce-100 rounded-lg px-2 py-2.5 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-tinta/50 font-medium">Fecha boda</label>
              <input
                type="date"
                value={fechaBoda}
                onChange={(e) => setFechaBoda(e.target.value)}
                className="mt-1.5 w-full bg-white border border-bronce-100 rounded-lg px-2 py-2.5 text-sm outline-none"
              />
            </div>
          </div>

          {/* Rubro */}
          <div>
            <label className="text-xs uppercase tracking-wide text-tinta/50 font-medium">Rubro</label>
            <div className={`mt-1.5 grid gap-2 ${rubrosDisponibles.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {rubrosDisponibles.map((r) => (
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
              className="mt-1.5 w-full bg-white border border-bronce-100 rounded-lg px-3 py-2.5 text-sm outline-none"
            />
          </div>

          {esCamiseria ? (
            <>
              {/* Camisas */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs uppercase tracking-wide text-tinta/50 font-medium">Camisas</label>
                  <button
                    onClick={agregarCamisa}
                    className="text-sm font-medium flex items-center gap-1.5"
                    style={{ color: acento }}
                  >
                    <Plus size={15} /> Añadir camisa
                  </button>
                </div>
                <div className="space-y-3">
                  {camisas.map((c, i) => (
                    <CamisaFormulario
                      key={i}
                      camisa={c}
                      numero={i + 1}
                      onCambiar={(actualizada) => actualizarCamisa(i, actualizada)}
                      onEliminar={camisas.length > 1 ? () => eliminarCamisa(i) : undefined}
                      clienteId={!creandoCliente ? clienteId : null}
                      acento={acento}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Tipo de trabajo (con precio por prenda) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs uppercase tracking-wide text-tinta/50 font-medium">Tipo de trabajo</label>
                  <button
                    onClick={agregarTipoTrabajo}
                    className="text-sm font-medium flex items-center gap-1.5"
                    style={{ color: acento }}
                  >
                    <Plus size={15} /> Añadir tipo
                  </button>
                </div>
                <div className="space-y-2">
                  {tiposTrabajo.map((t, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <select
                        value={t.tipo}
                        onChange={(e) => actualizarTipoTrabajo(i, { tipo: e.target.value })}
                        className="flex-1 min-w-0 bg-white border border-bronce-100 rounded-lg px-2.5 py-2.5 text-sm outline-none"
                      >
                        <option value="">Selecciona…</option>
                        {TIPOS_TRABAJO.map((op) => (
                          <option key={op} value={op}>{op}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={t.precio}
                        onChange={(e) => actualizarTipoTrabajo(i, { precio: e.target.value })}
                        placeholder="Precio"
                        className="w-28 shrink-0 bg-white border border-bronce-100 rounded-lg px-2.5 py-2.5 text-sm outline-none"
                      />
                      {tiposTrabajo.length > 1 && (
                        <button
                          onClick={() => eliminarTipoTrabajo(i)}
                          className="shrink-0 text-tinta/30 hover:text-red-500 p-1.5"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tejidos */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs uppercase tracking-wide text-tinta/50 font-medium">Tejidos</label>
                  <button
                    onClick={agregarTejido}
                    className="text-sm font-medium flex items-center gap-1.5"
                    style={{ color: acento }}
                  >
                    <Plus size={15} /> Añadir tejido
                  </button>
                </div>
                <div className="space-y-2">
                  {tejidos.map((t, i) => (
                    <TejidoFormulario
                      key={i}
                      tejido={t}
                      onCambiar={(actualizado) => actualizarTejido(i, actualizado)}
                      onEliminar={tejidos.length > 1 ? () => eliminarTejido(i) : undefined}
                    />
                  ))}
                </div>
              </div>

              {/* Prendas */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs uppercase tracking-wide text-tinta/50 font-medium">Prendas</label>
                  <button
                    onClick={agregarPrenda}
                    className="text-sm font-medium flex items-center gap-1.5"
                    style={{ color: acento }}
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
                        acento={acento}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Precio */}
          <div className="bg-white rounded-card border border-bronce-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-wide text-tinta/40 font-medium">Precio total</p>
              <p className="font-serif text-xl text-tinta">{precioTotal.toFixed(2)}</p>
            </div>
            <p className="text-[11px] text-tinta/40 mb-3">
              Se calcula sumando el precio de cada {esCamiseria ? 'camisa' : 'tipo de trabajo'} indicado arriba.
            </p>
            <div>
              <label className="text-xs uppercase tracking-wide text-tinta/50 font-medium">Anticipo</label>
              <input
                type="number"
                inputMode="decimal"
                value={anticipo}
                onChange={(e) => setAnticipo(e.target.value)}
                placeholder="0.00"
                className="mt-1.5 w-full bg-lino border border-bronce-100 rounded-lg px-3 py-2.5 text-sm outline-none"
              />
            </div>
          </div>

          {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

          <button
            onClick={guardar}
            disabled={guardando}
            className="w-full py-3.5 rounded-card font-medium text-white disabled:opacity-60"
            style={{ backgroundColor: acento }}
          >
            {guardando ? 'Guardando…' : 'Guardar pedido'}
          </button>
        </div>
      </div>
    </div>
  )
}
