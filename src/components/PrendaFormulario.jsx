import { useState } from 'react'
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { TIPOS_PRENDA, camposPorTipo, labelTipoPrenda, mapearMedidasCliente } from '../lib/prendasConfig'
import { supabase } from '../lib/supabase'

// Formulario para UNA prenda: elegir tipo, referencia, precio, y
// sus medidas + detalles de confección específicos. Se usa tanto
// al crear un pedido nuevo como al añadir/editar prendas después.
// "clienteId" (opcional) permite traer automáticamente las
// medidas ya guardadas en la ficha del cliente.
export default function PrendaFormulario({ prenda, onCambiar, onEliminar, colapsableInicial = false, clienteId }) {
  const [colapsado, setColapsado] = useState(colapsableInicial)
  const [usarMedidasCliente, setUsarMedidasCliente] = useState(false)
  const [cargandoMedidas, setCargandoMedidas] = useState(false)
  const [errorMedidas, setErrorMedidas] = useState('')
  const campos = camposPorTipo(prenda.tipo)

  function actualizarCampo(campo, valor) {
    onCambiar({ ...prenda, [campo]: valor })
  }

  function actualizarDetalle(key, valor) {
    onCambiar({ ...prenda, detalles: { ...prenda.detalles, [key]: valor } })
  }

  async function alternarUsarMedidasCliente() {
    const nuevoValor = !usarMedidasCliente
    setUsarMedidasCliente(nuevoValor)
    setErrorMedidas('')

    if (!nuevoValor) return // al desmarcar, se deja lo que haya escrito a mano

    if (!clienteId) {
      setErrorMedidas('Selecciona primero un cliente.')
      setUsarMedidasCliente(false)
      return
    }

    setCargandoMedidas(true)
    const { data, error } = await supabase
      .from('medidas')
      .select('*')
      .eq('cliente_id', clienteId)
      .maybeSingle()
    setCargandoMedidas(false)

    if (error) {
      setErrorMedidas('No se pudieron cargar las medidas del cliente.')
      setUsarMedidasCliente(false)
      return
    }
    if (!data) {
      setErrorMedidas('Este cliente aún no tiene medidas guardadas en su ficha.')
      setUsarMedidasCliente(false)
      return
    }

    const mapeadas = mapearMedidasCliente(prenda.tipo, data)
    onCambiar({ ...prenda, detalles: { ...prenda.detalles, ...mapeadas } })
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
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] uppercase tracking-wide text-tinta/45 font-medium">
                Medidas — {labelTipoPrenda(prenda.tipo)}
              </p>
              <label className="flex items-center gap-1.5 text-[11px] text-tinta/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={usarMedidasCliente}
                  onChange={alternarUsarMedidasCliente}
                  className="accent-bronce-500"
                />
                {cargandoMedidas ? 'Cargando…' : 'Usar medidas del cliente'}
              </label>
            </div>
            {errorMedidas && <p className="text-[11px] text-red-600 mb-2">{errorMedidas}</p>}
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
