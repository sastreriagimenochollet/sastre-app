import { useEffect, useState } from 'react'
import { X, Trash2, Plus, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { usePedidos } from '../lib/usePedidos'
import { EstadoPill } from './TarjetaPedido'
import { labelRubro } from '../lib/constantes'
import PrendaFormulario from './PrendaFormulario'
import TejidoFormulario from './TejidoFormulario'
import SeccionNotasComposturas from './SeccionNotasComposturas'

export default function DetallePedidoModal({ pedido, onCerrar }) {
  const { eliminarPedido, actualizarEstado, actualizarPedido } = usePedidos()
  const [pagos, setPagos] = useState([])
  const [montoNuevo, setMontoNuevo] = useState('')
  const [notaNueva, setNotaNueva] = useState('')
  const [cargandoPagos, setCargandoPagos] = useState(true)

  const [prendas, setPrendas] = useState([])
  const [cargandoPrendas, setCargandoPrendas] = useState(true)

  const [tejidos, setTejidos] = useState([])
  const [cargandoTejidos, setCargandoTejidos] = useState(true)
  const [subiendoFotoId, setSubiendoFotoId] = useState(null)

  const [fechaPedido, setFechaPedido] = useState(pedido.fecha_pedido ?? '')
  const [fechaEntrega, setFechaEntrega] = useState(pedido.fecha_entrega_estimada ?? '')
  const [fechaBoda, setFechaBoda] = useState(pedido.fecha_boda ?? '')

  async function guardarFecha(campo, valor) {
    await actualizarPedido(pedido.id, { [campo]: valor || null })
  }

  useEffect(() => {
    cargarPagos()
    cargarPrendas()
    cargarTejidos()
  }, [pedido.id])

  async function cargarTejidos() {
    setCargandoTejidos(true)
    const { data } = await supabase
      .from('tejidos')
      .select('*')
      .eq('pedido_id', pedido.id)
      .order('creado_en', { ascending: true })
    setTejidos(data ?? [])
    setCargandoTejidos(false)
  }

  async function agregarTejidoVacio() {
    const { data, error } = await supabase
      .from('tejidos')
      .insert({ pedido_id: pedido.id })
      .select()
      .single()
    if (!error && data) setTejidos((prev) => [...prev, data])
  }

  async function actualizarTejido(id, cambios) {
    setTejidos((prev) => prev.map((t) => (t.id === id ? { ...t, ...cambios } : t)))

    // Si hay una foto nueva seleccionada, subirla primero
    let fotoUrl = cambios.foto_url
    if (cambios.fotoArchivo) {
      setSubiendoFotoId(id)
      const ext = cambios.fotoArchivo.name.split('.').pop()
      const ruta = `${id}.${ext}`
      const { error: errorSubida } = await supabase.storage
        .from('tejidos')
        .upload(ruta, cambios.fotoArchivo, { upsert: true })
      if (!errorSubida) {
        const { data } = supabase.storage.from('tejidos').getPublicUrl(ruta)
        fotoUrl = data.publicUrl
        setTejidos((prev) => prev.map((t) => (t.id === id ? { ...t, foto_url: fotoUrl } : t)))
      }
      setSubiendoFotoId(null)
    }

    await supabase
      .from('tejidos')
      .update({
        proveedor: cambios.proveedor,
        referencia: cambios.referencia,
        foto_url: fotoUrl,
      })
      .eq('id', id)
  }

  async function alternarComprada(id, comprada) {
    setTejidos((prev) => prev.map((t) => (t.id === id ? { ...t, comprada: !comprada } : t)))
    await supabase.from('tejidos').update({ comprada: !comprada }).eq('id', id)
  }

  async function eliminarTejido(id) {
    setTejidos((prev) => prev.filter((t) => t.id !== id))
    await supabase.from('tejidos').delete().eq('id', id)
  }

  async function cargarPrendas() {
    setCargandoPrendas(true)
    const { data } = await supabase
      .from('prendas')
      .select('*')
      .eq('pedido_id', pedido.id)
      .order('creado_en', { ascending: true })
    setPrendas(data ?? [])
    setCargandoPrendas(false)
  }

  async function agregarPrendaVacia() {
    const { data, error } = await supabase
      .from('prendas')
      .insert({ pedido_id: pedido.id, tipo: 'chaqueta', detalles: {} })
      .select()
      .single()
    if (!error && data) setPrendas((prev) => [...prev, data])
  }

  async function actualizarPrenda(id, cambios) {
    // Actualización optimista: se refleja al instante en pantalla
    setPrendas((prev) => prev.map((p) => (p.id === id ? { ...p, ...cambios } : p)))
    await supabase
      .from('prendas')
      .update({
        tipo: cambios.tipo,
        referencia: cambios.referencia,
        precio: cambios.precio === '' ? 0 : Number(cambios.precio),
        detalles: cambios.detalles,
      })
      .eq('id', id)
  }

  async function eliminarPrenda(id) {
    setPrendas((prev) => prev.filter((p) => p.id !== id))
    await supabase.from('prendas').delete().eq('id', id)
  }

  async function cargarPagos() {
    setCargandoPagos(true)
    const { data } = await supabase
      .from('pagos')
      .select('*')
      .eq('pedido_id', pedido.id)
      .order('fecha', { ascending: false })
    setPagos(data ?? [])
    setCargandoPagos(false)
  }

  async function agregarPago() {
    if (!montoNuevo || Number(montoNuevo) <= 0) return
    await supabase.from('pagos').insert({
      pedido_id: pedido.id,
      monto: Number(montoNuevo),
      nota: notaNueva.trim() || null,
    })
    setMontoNuevo('')
    setNotaNueva('')
    cargarPagos()
  }

  async function borrarPedido() {
    if (!confirm('¿Eliminar este pedido? Esta acción no se puede deshacer.')) return
    await eliminarPedido(pedido.id)
    onCerrar()
  }

  const totalPagado = pedido.anticipo + pagos.reduce((s, p) => s + Number(p.monto), 0)
  const saldo = Math.max(0, (pedido.precio_total ?? 0) - totalPagado)

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-lino w-full sm:max-w-4xl sm:rounded-card rounded-t-2xl max-h-[92vh] overflow-y-auto scroll-suave">
        <div className="sticky top-0 bg-lino flex items-center justify-between px-5 py-4 border-b border-bronce-100">
          <div>
            <h2 className="font-serif text-xl text-tinta">{pedido.clientes?.nombre}</h2>
            <p className="text-xs text-tinta/45">{labelRubro(pedido.rubro)}</p>
          </div>
          <button onClick={onCerrar} className="text-tinta/50 hover:text-tinta">
            <X size={22} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Fechas — siempre visibles */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] uppercase tracking-wide text-tinta/45 font-medium">Fecha pedido</label>
              <input
                type="date"
                value={fechaPedido}
                onChange={(e) => setFechaPedido(e.target.value)}
                onBlur={(e) => guardarFecha('fecha_pedido', e.target.value)}
                className="mt-1 w-full bg-white border border-bronce-100 rounded-lg px-2 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wide text-tinta/45 font-medium">Fecha entrega</label>
              <input
                type="date"
                value={fechaEntrega}
                onChange={(e) => setFechaEntrega(e.target.value)}
                onBlur={(e) => guardarFecha('fecha_entrega_estimada', e.target.value)}
                className="mt-1 w-full bg-white border border-bronce-100 rounded-lg px-2 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wide text-tinta/45 font-medium">Fecha boda</label>
              <input
                type="date"
                value={fechaBoda}
                onChange={(e) => setFechaBoda(e.target.value)}
                onBlur={(e) => guardarFecha('fecha_boda', e.target.value)}
                placeholder="Solo novios"
                className="mt-1 w-full bg-white border border-bronce-100 rounded-lg px-2 py-2 text-sm outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <EstadoPill estado={pedido.estado} />
            <select
              value={pedido.estado}
              onChange={(e) => actualizarEstado(pedido.id, e.target.value)}
              className="text-sm bg-white border border-bronce-100 rounded-lg px-2.5 py-1.5 outline-none"
            >
              <option value="pendiente">Pendiente</option>
              <option value="en_corte">Corte</option>
              <option value="primera_prueba">1ª Prueba</option>
              <option value="segunda_prueba">2ª Prueba</option>
              <option value="tercera_prueba">3ª Prueba</option>
              <option value="finalizado">Terminado</option>
              <option value="entregado">Entregado</option>
            </select>
          </div>

          {pedido.descripcion && (
            <div>
              <p className="text-xs uppercase tracking-wide text-tinta/40 font-medium mb-1">Descripción</p>
              <p className="text-sm text-tinta/80">{pedido.descripcion}</p>
            </div>
          )}

          {/* Tejidos */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs uppercase tracking-wide text-tinta/40 font-medium">Tejidos</p>
              <button
                onClick={agregarTejidoVacio}
                className="text-sm text-bronce-600 font-medium flex items-center gap-1.5"
              >
                <Plus size={15} /> Añadir tejido
              </button>
            </div>
            {!cargandoTejidos && tejidos.length === 0 && (
              <p className="text-sm text-tinta/40 mb-2">Sin tejidos registrados.</p>
            )}
            <div className="space-y-2">
              {tejidos.map((t) => (
                <div key={t.id} className="flex items-start gap-2">
                  <button
                    onClick={() => alternarComprada(t.id, t.comprada)}
                    className="shrink-0 w-5 h-5 mt-3 rounded-full border flex items-center justify-center"
                    style={{
                      borderColor: t.comprada ? '#6E8F6B' : '#D9B872',
                      backgroundColor: t.comprada ? '#6E8F6B' : 'transparent',
                    }}
                    title={t.comprada ? 'Comprada' : 'Marcar como comprada'}
                  >
                    {t.comprada && <Check size={12} className="text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <TejidoFormulario
                      tejido={t}
                      onCambiar={(actualizado) => actualizarTejido(t.id, actualizado)}
                      onEliminar={() => eliminarTejido(t.id)}
                    />
                    {subiendoFotoId === t.id && <p className="text-[11px] text-tinta/40 mt-1">Subiendo foto…</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tejido antiguo (pedidos creados antes de este cambio) */}
          {(pedido.tejido_referencia || pedido.tejido_foto_url) && (
            <div>
              <p className="text-xs uppercase tracking-wide text-tinta/40 font-medium mb-1.5">Tejido (registro anterior)</p>
              {pedido.tejido_foto_url && (
                <img
                  src={pedido.tejido_foto_url}
                  alt="Tejido"
                  className="w-full max-h-48 object-cover rounded-lg border border-bronce-100 mb-2"
                />
              )}
              {pedido.tejido_referencia && (
                <p className="text-sm text-tinta/70">{pedido.tejido_referencia}</p>
              )}
            </div>
          )}

          {/* Prendas */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs uppercase tracking-wide text-tinta/40 font-medium">Prendas</p>
              <button
                onClick={agregarPrendaVacia}
                className="text-sm text-bronce-600 font-medium flex items-center gap-1.5"
              >
                <Plus size={15} /> Añadir prenda
              </button>
            </div>
            {!cargandoPrendas && prendas.length === 0 && (
              <p className="text-sm text-tinta/40">Sin prendas registradas.</p>
            )}
            <div className="space-y-3">
              {prendas.map((p) => (
                <PrendaFormulario
                  key={p.id}
                  prenda={p}
                  onCambiar={(actualizada) => actualizarPrenda(p.id, actualizada)}
                  onEliminar={() => eliminarPrenda(p.id)}
                  colapsableInicial={true}
                  clienteId={pedido.cliente_id}
                />
              ))}
            </div>
          </div>

          {/* Notas y composturas del pedido */}
          <SeccionNotasComposturas
            entidad="pedidos"
            entidadId={pedido.id}
            notasIniciales={pedido.notas}
            tablaComposturas="composturas"
            columnaRelacion="pedido_id"
          />

          {/* Cobros */}
          <div className="bg-white rounded-card border border-bronce-100 p-4">
            <p className="text-xs uppercase tracking-wide text-tinta/40 font-medium mb-3">Cobros</p>
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div>
                <p className="text-[11px] text-tinta/45">Total</p>
                <p className="font-serif text-lg text-tinta">{Number(pedido.precio_total ?? 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[11px] text-tinta/45">Pagado</p>
                <p className="font-serif text-lg text-carrete-verde" style={{ color: '#6E8F6B' }}>
                  {totalPagado.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-tinta/45">Saldo</p>
                <p className="font-serif text-lg" style={{ color: saldo > 0 ? '#C98A3E' : '#6E8F6B' }}>
                  {saldo.toFixed(2)}
                </p>
              </div>
            </div>

            {pedido.anticipo > 0 && (
              <div className="flex justify-between text-sm text-tinta/60 py-1.5 border-t border-bronce-100">
                <span>Anticipo inicial</span>
                <span>{Number(pedido.anticipo).toFixed(2)}</span>
              </div>
            )}
            {!cargandoPagos && pagos.map((p) => (
              <div key={p.id} className="flex justify-between text-sm text-tinta/60 py-1.5 border-t border-bronce-100">
                <span>{p.nota || 'Abono'} · {new Date(p.fecha).toLocaleDateString('es-ES')}</span>
                <span>{Number(p.monto).toFixed(2)}</span>
              </div>
            ))}

            <div className="flex gap-2 mt-3 pt-3 border-t border-bronce-100">
              <input
                type="number"
                inputMode="decimal"
                value={montoNuevo}
                onChange={(e) => setMontoNuevo(e.target.value)}
                placeholder="Monto"
                className="flex-1 min-w-0 bg-lino border border-bronce-100 rounded-lg px-3 py-2 text-sm outline-none"
              />
              <input
                value={notaNueva}
                onChange={(e) => setNotaNueva(e.target.value)}
                placeholder="Nota (opcional)"
                className="flex-1 min-w-0 bg-lino border border-bronce-100 rounded-lg px-3 py-2 text-sm outline-none"
              />
              <button
                onClick={agregarPago}
                className="shrink-0 bg-bronce-500 text-white rounded-lg px-3"
                style={{ backgroundColor: '#B4863A' }}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <button
            onClick={borrarPedido}
            className="w-full py-3 rounded-card font-medium text-red-600 border border-red-200 flex items-center justify-center gap-2"
          >
            <Trash2 size={16} /> Eliminar pedido
          </button>
        </div>
      </div>
    </div>
  )
}
