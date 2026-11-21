import { useEffect, useRef, useState } from 'react'
import { Camera, Trash2 } from 'lucide-react'
import { PROVEEDORES_TEJIDO } from '../lib/constantes'
import { buscarEnCatalogo } from '../lib/catalogoTelas'

const eur0 = (n) => Number(n).toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

// Un bloque de tejido: proveedor, referencia, y lo que sale solo del
// catálogo (libro, precio por metro, precios de lista), metros y foto.
export default function TejidoFormulario({ tejido, onCambiar, onEliminar, mostrarFoto = true }) {
  const tejidoRef = useRef(tejido)
  tejidoRef.current = tejido
  const previo = useRef({ prov: tejido.proveedor ?? '', ref: tejido.referencia ?? '' })
  const autoRelleno = useRef(false)
  const [estado, setEstado] = useState('') // '' | 'encontrado' | 'no_encontrado'

  function actualizar(campo, valor) {
    onCambiar({ ...tejido, [campo]: valor })
  }

  // Al cambiar proveedor o referencia (no al abrir el pedido), busca en el catálogo
  useEffect(() => {
    const prov = tejido.proveedor ?? ''
    const ref = tejido.referencia ?? ''
    if (prov === previo.current.prov && ref === previo.current.ref) return
    previo.current = { prov, ref }

    const espera = setTimeout(async () => {
      if (!prov || !ref.trim()) {
        setEstado('')
        return
      }
      const r = await buscarEnCatalogo(prov, ref)
      // si mientras tanto cambió, descartamos este resultado
      if ((tejidoRef.current.proveedor ?? '') !== prov || (tejidoRef.current.referencia ?? '') !== ref) return
      if (r) {
        autoRelleno.current = true
        setEstado('encontrado')
        onCambiar({ ...tejidoRef.current, libro: r.libro, precio_metro: r.precio_metro, lista: r.lista })
      } else {
        setEstado('no_encontrado')
        if (autoRelleno.current) {
          autoRelleno.current = false
          onCambiar({ ...tejidoRef.current, libro: '', precio_metro: '', lista: null })
        }
      }
    }, 400)
    return () => clearTimeout(espera)
  }, [tejido.proveedor, tejido.referencia])

  const lista = tejido.lista
  const chips = lista
    ? [
        ['Traje', lista.traje_iva],
        ['Pantalón', lista.pantalon_iva],
        ['Americana', lista.americana_iva],
      ].filter(([, v]) => v !== null && v !== undefined && v !== '')
    : []

  const caja = 'min-w-0 bg-lino border border-bronce-100 rounded-lg px-2.5 py-2 text-sm outline-none'

  return (
    <div className="bg-white rounded-lg border border-bronce-100 p-3 space-y-2">
      <div className="flex items-start gap-2">
        <select
          value={tejido.proveedor ?? ''}
          onChange={(e) => actualizar('proveedor', e.target.value)}
          className={`flex-1 ${caja}`}
        >
          <option value="">Proveedor…</option>
          {PROVEEDORES_TEJIDO.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <input
          value={tejido.referencia ?? ''}
          onChange={(e) => actualizar('referencia', e.target.value)}
          placeholder="Referencia"
          className={`flex-1 ${caja}`}
        />
        {onEliminar && (
          <button onClick={onEliminar} className="shrink-0 text-tinta/30 hover:text-red-500 p-1.5">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <input
          value={tejido.libro ?? ''}
          onChange={(e) => actualizar('libro', e.target.value)}
          placeholder="Libro"
          className={caja}
        />
        <input
          type="number"
          inputMode="decimal"
          step="any"
          value={tejido.precio_metro ?? ''}
          onChange={(e) => {
            autoRelleno.current = false
            actualizar('precio_metro', e.target.value)
          }}
          placeholder="€ / metro"
          className={caja}
        />
        <input
          type="number"
          inputMode="decimal"
          step="any"
          value={tejido.metros ?? ''}
          onChange={(e) => actualizar('metros', e.target.value)}
          placeholder="Metros"
          className={caja}
        />
      </div>

      {chips.length > 0 && (
        <p className="text-[11px] text-tinta/55">
          Lista con IVA: {chips.map(([n, v]) => `${n} ${eur0(v)}`).join(' · ')}
        </p>
      )}
      {estado === 'encontrado' && <p className="text-[11px] text-tinta/45">Datos tomados del catálogo.</p>}
      {estado === 'no_encontrado' && (
        <p className="text-[11px] text-tinta/45">Esta referencia no está en el catálogo de {tejido.proveedor}.</p>
      )}

      {mostrarFoto && (
        <>
          {tejido.foto_url && (
            <img
              src={tejido.foto_url}
              alt="Tejido"
              className="w-full max-h-32 object-cover rounded-lg border border-bronce-100"
            />
          )}
          <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer w-fit" style={{ color: '#7C9473' }}>
            <Camera size={14} />
            {tejido.fotoArchivo ? tejido.fotoArchivo.name : tejido.foto_url ? 'Cambiar foto' : 'Añadir foto (opcional)'}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => actualizar('fotoArchivo', e.target.files?.[0] ?? null)}
            />
          </label>
        </>
      )}
    </div>
  )
}
