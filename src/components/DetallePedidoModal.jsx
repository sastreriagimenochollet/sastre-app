import { useEffect, useState } from 'react'
import { X, Trash2, Plus, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { usePedidos } from '../lib/usePedidos'
import { EstadoPill } from './TarjetaPedido'
import { labelRubro } from '../lib/constantes'
import PrendaFormulario from './PrendaFormulario'

export default function DetallePedidoModal({ pedido, onCerrar }) {
  const { eliminarPedido, actualizarEstado } = usePedidos()
  const [pagos, setPagos] = useState([])
  const [montoNuevo, setMontoNuevo] = useState('')
  const [notaNueva, setNotaNueva] = useState('')
  const [cargandoPagos, setCargandoPagos] = useState(true)

  const [notas, setNotas] = useState(pedido.notas ?? '')
  const [guardandoNotas, setGuardandoNotas] = useState(false)

  const [composturas, setComposturas] = useState([])
  const [composturaNueva, setComposturaNueva] = useState('')
  const [cargandoComposturas, setCargandoComposturas] = useState(true)

  const [prendas, setPrendas] = useState([])
  const [cargandoPrendas, setCargandoPrendas] = useState(true)

  useEffect(() => {
    cargarPagos()
    cargarComposturas()
    cargarPrendas()
  }, [pedido.id])

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

  async function cargarComposturas() {
    setCargandoComposturas(true)
    const { data } = await supabase
      .from('composturas')
      .select('*')
      .eq('pedido_id', pedido.id)
      .order('creado_en', { ascending: false })
    setComposturas(data ?? [])
    setCargandoComposturas(false)
  }

  async function guardarNotas() {
    setGuardandoNotas(true)
    await supabase.from('pedidos').update({ notas }).eq('id', pedido.id)
    setGuardandoNotas(false)
  }

  async function agregarCompostura() {
    if (!composturaNueva.trim()) return
    await supabase.from('composturas').insert({
      pedido_id: pedido.id,
      descripcion: composturaNueva.trim(),
    })
    setComposturaNueva('')
    cargarComposturas()
  }

  async function alternarCompostura(id, completada) {
    // Actualización optimista para que se sienta instantáneo
    setComposturas((prev) => prev.map((c) => (c.id === id ? { ...c, completada: !completada } : c)))
    await supabase.from('composturas').update({ completada: !completada }).eq('id', id)
  }

  async function borrarCompostura(id) {
    setComposturas((prev) => prev.filter((c) => c.id !== id))
    await supabase.from('composturas').delete().eq('id', id)
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
      <div className="bg-lino w-full sm:max-w-md sm:rounded-card rounded-t-2xl max-h-[92vh] overflow-y-auto scroll-suave">
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
          <div className="flex items-center justify-between">
            <EstadoPill estado={pedido.estado} />
            <select
              value={pedido.estado}
              onChange={(e) => actualizarEstado(pedido.id, e.target.value)}
              className="text-sm bg-white border border-bronce-100 rounded-lg px-2.5 py-1.5 outline-none"
            >
              <option value="pendiente">Pendiente</option>
              <option value="en_corte">En Corte</option>
              <option value="primera_prueba">1ª Prueba</option>
              <option value="finalizado">Finalizado</option>
              <option value="entregado">Entregado</option>
            </select>
          </div>

          {pedido.descripcion && (
            <div>
              <p className="text-xs uppercase tracking-wide text-tinta/40 font-medium mb-1">Descripción</p>
              <p className="text-sm text-tinta/80">{pedido.descripcion}</p>
            </div>
          )}

          {(pedido.tejido_referencia || pedido.tejido_foto_url) && (
            <div>
              <p className="text-xs uppercase tracking-wide text-tinta/40 font-medium mb-1.5">Tejido</p>
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
                />
              ))}
            </div>
          </div>

          {/* Notas */}
          <div>
            <p className="text-xs uppercase tracking-wide text-tinta/40 font-medium mb-1.5">Notas</p>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              onBlur={guardarNotas}
              placeholder="Anotaciones sobre este pedido…"
              rows={3}
              className="w-full bg-white border border-bronce-100 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-bronce-300 resize-none"
            />
            {guardandoNotas && <p className="text-[11px] text-tinta/35 mt-1">Guardando…</p>}
          </div>

          {/* Composturas */}
          <div>
            <p className="text-xs uppercase tracking-wide text-tinta/40 font-medium mb-1.5">Composturas</p>
            {!cargandoComposturas && composturas.length === 0 && (
              <p className="text-sm text-tinta/40 mb-2">Sin composturas registradas.</p>
            )}
            <div className="space-y-2 mb-2">
              {composturas.map((c) => (
                <div
                  key={c.id}
                  className="bg-white rounded-lg border border-bronce-100 px-3 py-2.5 flex items-center gap-2.5"
                >
                  <button
                    onClick={() => alternarCompostura(c.id, c.completada)}
                    className="shrink-0 w-5 h-5 rounded-full border flex items-center justify-center"
                    style={{
                      borderColor: c.completada ? '#6E8F6B' : '#D9B872',
                      backgroundColor: c.completada ? '#6E8F6B' : 'transparent',
                    }}
                  >
                    {c.completada && <Check size={12} className="text-white" />}
                  </button>
                  <span
                    className={`flex-1 text-sm ${c.completada ? 'text-tinta/35 line-through' : 'text-tinta/80'}`}
                  >
                    {c.descripcion}
                  </span>
                  <button onClick={() => borrarCompostura(c.id)} className="shrink-0 text-tinta/30 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={composturaNueva}
                onChange={(e) => setComposturaNueva(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && agregarCompostura()}
                placeholder="Añadir compostura…"
                className="flex-1 min-w-0 bg-white border border-bronce-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-bronce-300"
              />
              <button
                onClick={agregarCompostura}
                className="shrink-0 text-white rounded-lg px-3"
                style={{ backgroundColor: '#B4863A' }}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

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
