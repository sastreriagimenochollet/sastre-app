import { Camera, Trash2 } from 'lucide-react'
import { PROVEEDORES_TEJIDO } from '../lib/constantes'

// Un bloque de tejido: proveedor (lista), referencia (manual),
// foto opcional. Se usa tanto al crear el pedido (varios tejidos
// a la vez) como dentro del detalle de un pedido ya existente.
export default function TejidoFormulario({ tejido, onCambiar, onEliminar, mostrarFoto = true }) {
  function actualizar(campo, valor) {
    onCambiar({ ...tejido, [campo]: valor })
  }

  return (
    <div className="bg-white rounded-lg border border-bronce-100 p-3 space-y-2">
      <div className="flex items-start gap-2">
        <select
          value={tejido.proveedor ?? ''}
          onChange={(e) => actualizar('proveedor', e.target.value)}
          className="flex-1 min-w-0 bg-lino border border-bronce-100 rounded-lg px-2.5 py-2 text-sm outline-none"
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
          className="flex-1 min-w-0 bg-lino border border-bronce-100 rounded-lg px-2.5 py-2 text-sm outline-none"
        />
        {onEliminar && (
          <button onClick={onEliminar} className="shrink-0 text-tinta/30 hover:text-red-500 p-1.5">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {mostrarFoto && (
        <>
          {tejido.foto_url && (
            <img
              src={tejido.foto_url}
              alt="Tejido"
              className="w-full max-h-32 object-cover rounded-lg border border-bronce-100"
            />
          )}
          <label className="flex items-center gap-1.5 text-xs text-bronce-600 font-medium cursor-pointer w-fit">
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
