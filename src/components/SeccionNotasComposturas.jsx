import { useEffect, useState } from 'react'
import { Plus, Trash2, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'

// Sección genérica de Notas (texto libre con auto-guardado) +
// Composturas (checklist). Se usa tanto a nivel de cliente como
// de pedido, apuntando a tablas distintas según las props.
export default function SeccionNotasComposturas({
  entidad, // 'clientes' | 'pedidos'
  entidadId,
  notasIniciales,
  tablaComposturas, // 'composturas_cliente' | 'composturas'
  columnaRelacion, // 'cliente_id' | 'pedido_id'
}) {
  const [notas, setNotas] = useState(notasIniciales ?? '')
  const [guardandoNotas, setGuardandoNotas] = useState(false)

  const [composturas, setComposturas] = useState([])
  const [composturaNueva, setComposturaNueva] = useState('')
  const [fechaNueva, setFechaNueva] = useState(() => new Date().toISOString().slice(0, 10))
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarComposturas()
  }, [entidadId])

  async function cargarComposturas() {
    setCargando(true)
    const { data } = await supabase
      .from(tablaComposturas)
      .select('*')
      .eq(columnaRelacion, entidadId)
      .order('creado_en', { ascending: false })
    setComposturas(data ?? [])
    setCargando(false)
  }

  async function guardarNotas() {
    setGuardandoNotas(true)
    await supabase.from(entidad).update({ notas }).eq('id', entidadId)
    setGuardandoNotas(false)
  }

  async function agregarCompostura() {
    if (!composturaNueva.trim()) return
    await supabase.from(tablaComposturas).insert({
      [columnaRelacion]: entidadId,
      descripcion: composturaNueva.trim(),
      fecha: fechaNueva,
    })
    setComposturaNueva('')
    setFechaNueva(new Date().toISOString().slice(0, 10))
    cargarComposturas()
  }

  async function actualizarFechaCompostura(id, fecha) {
    setComposturas((prev) => prev.map((c) => (c.id === id ? { ...c, fecha } : c)))
    await supabase.from(tablaComposturas).update({ fecha }).eq('id', id)
  }

  async function alternarCompostura(id, completada) {
    setComposturas((prev) => prev.map((c) => (c.id === id ? { ...c, completada: !completada } : c)))
    await supabase.from(tablaComposturas).update({ completada: !completada }).eq('id', id)
  }

  async function borrarCompostura(id) {
    setComposturas((prev) => prev.filter((c) => c.id !== id))
    await supabase.from(tablaComposturas).delete().eq('id', id)
  }

  return (
    <div className="space-y-5">
      {/* Notas */}
      <div>
        <p className="text-xs uppercase tracking-wide text-tinta/40 font-medium mb-1.5">Notas</p>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          onBlur={guardarNotas}
          placeholder="Anotaciones…"
          rows={3}
          className="w-full bg-white border border-bronce-100 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-bronce-300 resize-none"
        />
        {guardandoNotas && <p className="text-[11px] text-tinta/35 mt-1">Guardando…</p>}
      </div>

      {/* Composturas */}
      <div>
        <p className="text-xs uppercase tracking-wide text-tinta/40 font-medium mb-1.5">Composturas</p>
        {!cargando && composturas.length === 0 && (
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
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${c.completada ? 'text-tinta/35 line-through' : 'text-tinta/80'}`}>
                  {c.descripcion}
                </p>
                <input
                  type="date"
                  value={c.fecha ?? ''}
                  onChange={(e) => actualizarFechaCompostura(c.id, e.target.value)}
                  className="text-[11px] text-tinta/40 bg-transparent outline-none mt-0.5 -ml-0.5"
                />
              </div>
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
          <input
            type="date"
            value={fechaNueva}
            onChange={(e) => setFechaNueva(e.target.value)}
            className="shrink-0 bg-white border border-bronce-100 rounded-lg px-2 py-2 text-sm outline-none focus:border-bronce-300"
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
    </div>
  )
}
