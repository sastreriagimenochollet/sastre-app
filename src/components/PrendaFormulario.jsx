import { useState } from 'react'
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { TIPOS_PRENDA, camposPorTipo, labelTipoPrenda } from '../lib/prendasConfig'

// Formulario para UNA prenda: elegir tipo, referencia, precio, y
// sus medidas + detalles de confección específicos. Se usa tanto
// al crear un pedido nuevo como al añadir/editar prendas después.
export default function PrendaFormulario({ prenda, onCambiar, onEliminar, colapsableInicial = false }) {
  const [colapsado, setColapsado] = useState(colapsableInicial)
  const campos = camposPorTipo(prenda.tipo)

  function actualizarCampo(campo, valor) {
    onCambiar({ ...prenda, [campo]: valor })
  }

  function actualizarDetalle(key, valor) {
    onCambiar({ ...prenda, detalles: { ...prenda.detalles, [key]: valor } })
  }

  return (
    <div className="bg-white rounded-card border border-bronce-100 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3">
        <select
          value={prenda.tipo}
          onChange={(e) => onCambiar({ ...prenda, tipo: e.target.value, detalles: {} })}
          className="flex-1 min-w-0 bg-lino border border-bronce-100 rounded-lg px-2.5 py-2 text-sm font-medium outline-none"
        >
          {TIPOS_PRENDA.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
        <button
          onClick={() => setColapsado(!colapsado)}
          className="shrink-0 text-tinta/40 p-1.5"
          title={colapsado ? 'Expandir' : 'Contraer'}
        >
          {colapsado ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
        {onEliminar && (
          <button onClick={onEliminar} className="shrink-0 text-tinta/30 hover:text-red-500 p-1.5">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {!colapsado && (
        <div className="px-4 pb-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] uppercase tracking-wide text-tinta/45 font-medium">Referencia</label>
              <input
                value={prenda.referencia ?? ''}
                onChange={(e) => actualizarCampo('referencia', e.target.value)}
                placeholder="Código o descripción"
                className="mt-1 w-full bg-lino border border-bronce-100 rounded-lg px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wide text-tinta/45 font-medium">Precio</label>
              <input
                type="number"
                inputMode="decimal"
                value={prenda.precio ?? ''}
                onChange={(e) => actualizarCampo('precio', e.target.value)}
                placeholder="0.00"
                className="mt-1 w-full bg-lino border border-bronce-100 rounded-lg px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wide text-tinta/45 font-medium mb-2">
              Medidas — {labelTipoPrenda(prenda.tipo)}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {campos.medidas.map((c) => (
                <CampoDetalle key={c.key} campo={c} valor={prenda.detalles?.[c.key]} onCambiar={actualizarDetalle} />
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wide text-tinta/45 font-medium mb-2">Confección</p>
            <div className="grid grid-cols-2 gap-2">
              {campos.confeccion.map((c) => (
                <CampoDetalle key={c.key} campo={c} valor={prenda.detalles?.[c.key]} onCambiar={actualizarDetalle} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CampoDetalle({ campo, valor, onCambiar }) {
  return (
    <div>
      <label className="text-[11px] text-tinta/45">{campo.label}</label>
      {campo.tipo === 'select' ? (
        <select
          value={valor ?? ''}
          onChange={(e) => onCambiar(campo.key, e.target.value)}
          className="mt-1 w-full bg-lino border border-bronce-100 rounded-lg px-2.5 py-2 text-sm outline-none"
        >
          <option value="">—</option>
          {campo.opciones.map((op) => (
            <option key={op} value={op}>{op}</option>
          ))}
        </select>
      ) : (
        <input
          type={campo.tipo === 'numero' ? 'number' : 'text'}
          inputMode={campo.tipo === 'numero' ? 'decimal' : undefined}
          value={valor ?? ''}
          onChange={(e) => onCambiar(campo.key, e.target.value)}
          className="mt-1 w-full bg-lino border border-bronce-100 rounded-lg px-2.5 py-2 text-sm outline-none"
        />
      )}
    </div>
  )
}
