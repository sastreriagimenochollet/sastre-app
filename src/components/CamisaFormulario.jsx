import { useState } from 'react'
import { ChevronDown, ChevronUp, Trash2, Save } from 'lucide-react'
import { supabase } from '../lib/supabase'
import {
  PROVEEDORES_CAMISERIA,
  TEJIDO_FABRICA_CAMISERIA,
  CAMPOS_CONFECCION_CAMISA,
  CAMPOS_MEDIDAS_CAMISA,
  OPCIONES_HOLGURA_CAMISA,
  mapearMedidasClienteACamisa,
  mapearMedidasCamisaACliente,
} from '../lib/camiseriaConfig'

// Formulario para UNA camisa dentro de un pedido de camisería:
// proveedor/tejido/referencia/precio, confección, iniciales,
// otros, y sus propias medidas (con opción de traerlas del
// cliente o guardarlas en su ficha).
export default function CamisaFormulario({ camisa, numero, onCambiar, onEliminar, colapsableInicial = false, clienteId, acento = '#5B7C99' }) {
  const [colapsado, setColapsado] = useState(colapsableInicial)
  const [usarMedidasCliente, setUsarMedidasCliente] = useState(false)
  const [cargandoMedidas, setCargandoMedidas] = useState(false)
  const [errorMedidas, setErrorMedidas] = useState('')
  const [guardandoFicha, setGuardandoFicha] = useState(false)
  const [mensajeFicha, setMensajeFicha] = useState('')

  function actualizarCampo(campo, valor) {
    onCambiar({ ...camisa, [campo]: valor })
  }

  function actualizarDetalle(key, valor) {
    onCambiar({ ...camisa, detalles: { ...camisa.detalles, [key]: valor } })
  }

  async function alternarUsarMedidasCliente() {
    const nuevoValor = !usarMedidasCliente
    setUsarMedidasCliente(nuevoValor)
    setErrorMedidas('')
    if (!nuevoValor) return

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

    const mapeadas = mapearMedidasClienteACamisa(data)
    onCambiar({ ...camisa, detalles: { ...camisa.detalles, ...mapeadas } })
  }

  async function guardarEnFicha() {
    setMensajeFicha('')
    if (!clienteId) {
      setMensajeFicha('Selecciona primero un cliente.')
      return
    }
    const cambios = mapearMedidasCamisaACliente(camisa.detalles)
    if (Object.keys(cambios).length === 0) {
      setMensajeFicha('No hay medidas para guardar todavía.')
      return
    }

    setGuardandoFicha(true)
    const { data: existente } = await supabase
      .from('medidas')
      .select('id')
      .eq('cliente_id', clienteId)
      .maybeSingle()

    const { error } = existente
      ? await supabase.from('medidas').update(cambios).eq('cliente_id', clienteId)
      : await supabase.from('medidas').insert({ cliente_id: clienteId, ...cambios })

    setGuardandoFicha(false)
    setMensajeFicha(error ? 'No se pudo guardar: ' + error.message : 'Guardado en la ficha del cliente.')
  }

  return (
    <div className="bg-white rounded-card border overflow-hidden" style={{ borderColor: acento + '55' }}>
      <div className="flex items-center gap-2 px-4 py-3" style={{ backgroundColor: acento + '0F' }}>
        <p className="flex-1 text-sm font-medium" style={{ color: acento }}>Camisa {numero}</p>
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
        <div className="px-4 pb-4 pt-3 space-y-4">
          {/* Proveedor / Tejido / Referencia / Precio */}
          <div className="grid grid-cols-2 gap-2">
            <select
              value={camisa.proveedor ?? ''}
              onChange={(e) => actualizarCampo('proveedor', e.target.value)}
              className="bg-lino border border-bronce-100 rounded-lg px-2.5 py-2 text-sm outline-none"
            >
              <option value="">Proveedor…</option>
              {PROVEEDORES_CAMISERIA.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <select
              value={camisa.tejido ?? ''}
              onChange={(e) => actualizarCampo('tejido', e.target.value)}
              className="bg-lino border border-bronce-100 rounded-lg px-2.5 py-2 text-sm outline-none"
            >
              <option value="">Tejido…</option>
              {TEJIDO_FABRICA_CAMISERIA.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <input
              value={camisa.referencia ?? ''}
              onChange={(e) => actualizarCampo('referencia', e.target.value)}
              placeholder="Referencia de tejido"
              className="bg-lino border border-bronce-100 rounded-lg px-2.5 py-2 text-sm outline-none"
            />
            <input
              type="number"
              inputMode="decimal"
              value={camisa.precio ?? ''}
              onChange={(e) => actualizarCampo('precio', e.target.value)}
              placeholder="Precio"
              className="bg-lino border border-bronce-100 rounded-lg px-2.5 py-2 text-sm outline-none"
            />
          </div>

          {/* Confección */}
          <div>
            <p className="text-[11px] uppercase tracking-wide text-tinta/45 font-medium mb-2">Confección</p>
            <div className="grid grid-cols-2 gap-2">
              {CAMPOS_CONFECCION_CAMISA.map((c) => (
                <div key={c.key}>
                  <label className="text-[11px] text-tinta/45">{c.label}</label>
                  <input
                    value={camisa.detalles?.[c.key] ?? ''}
                    onChange={(e) => actualizarDetalle(c.key, e.target.value)}
                    className="mt-1 w-full bg-lino border border-bronce-100 rounded-lg px-2.5 py-2 text-sm outline-none"
                  />
                </div>
              ))}

              {/* Iniciales */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] text-tinta/45 mt-1.5">
                  <input
                    type="checkbox"
                    checked={!!camisa.detalles?.iniciales_activo}
                    onChange={(e) => actualizarDetalle('iniciales_activo', e.target.checked)}
                    style={{ accentColor: acento }}
                  />
                  Iniciales
                </label>
              </div>
              {camisa.detalles?.iniciales_activo && (
                <>
                  <div>
                    <label className="text-[11px] text-tinta/45">Letras</label>
                    <input
                      value={camisa.detalles?.iniciales_letras ?? ''}
                      onChange={(e) => actualizarDetalle('iniciales_letras', e.target.value)}
                      className="mt-1 w-full bg-lino border border-bronce-100 rounded-lg px-2.5 py-2 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-tinta/45">Tipografía</label>
                    <input
                      value={camisa.detalles?.iniciales_tipografia ?? ''}
                      onChange={(e) => actualizarDetalle('iniciales_tipografia', e.target.value)}
                      className="mt-1 w-full bg-lino border border-bronce-100 rounded-lg px-2.5 py-2 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-tinta/45">Color</label>
                    <input
                      value={camisa.detalles?.iniciales_color ?? ''}
                      onChange={(e) => actualizarDetalle('iniciales_color', e.target.value)}
                      className="mt-1 w-full bg-lino border border-bronce-100 rounded-lg px-2.5 py-2 text-sm outline-none"
                    />
                  </div>
                </>
              )}

              <div className="col-span-2">
                <label className="text-[11px] text-tinta/45">Otros</label>
                <input
                  value={camisa.detalles?.otros ?? ''}
                  onChange={(e) => actualizarDetalle('otros', e.target.value)}
                  className="mt-1 w-full bg-lino border border-bronce-100 rounded-lg px-2.5 py-2 text-sm outline-none"
                />
              </div>
            </div>
          </div>

          {/* Medidas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] uppercase tracking-wide text-tinta/45 font-medium">Medidas</p>
              <label className="flex items-center gap-1.5 text-[11px] text-tinta/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={usarMedidasCliente}
                  onChange={alternarUsarMedidasCliente}
                  style={{ accentColor: acento }}
                />
                {cargandoMedidas ? 'Cargando…' : 'Usar medidas del cliente'}
              </label>
            </div>
            {errorMedidas && <p className="text-[11px] text-red-600 mb-2">{errorMedidas}</p>}
            <div className="grid grid-cols-2 gap-2">
              {CAMPOS_MEDIDAS_CAMISA.map((c) => (
                <div key={c.key}>
                  <label className="text-[11px] text-tinta/45">{c.label}</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={camisa.detalles?.[c.key] ?? ''}
                    onChange={(e) => actualizarDetalle(c.key, e.target.value)}
                    className="mt-1 w-full bg-lino border border-bronce-100 rounded-lg px-2.5 py-2 text-sm outline-none"
                  />
                </div>
              ))}
              <div>
                <label className="text-[11px] text-tinta/45">Holgura</label>
                <select
                  value={camisa.detalles?.medida_holgura ?? ''}
                  onChange={(e) => actualizarDetalle('medida_holgura', e.target.value)}
                  className="mt-1 w-full bg-lino border border-bronce-100 rounded-lg px-2.5 py-2 text-sm outline-none"
                >
                  <option value="">—</option>
                  {OPCIONES_HOLGURA_CAMISA.map((op) => (
                    <option key={op} value={op}>{op}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={guardarEnFicha}
              disabled={guardandoFicha}
              className="mt-2 flex items-center gap-1.5 text-[11px] font-medium disabled:opacity-60"
              style={{ color: acento }}
            >
              <Save size={13} />
              {guardandoFicha ? 'Guardando…' : 'Guardar en ficha del cliente'}
            </button>
            {mensajeFicha && <p className="text-[11px] text-tinta/45 mt-1">{mensajeFicha}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
