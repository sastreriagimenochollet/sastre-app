import { useState, useEffect } from 'react'
import {
  CAMPOS_AMERICANA,
  FORMULAS_AMERICANA,
  CAMPOS_PANTALON,
  CAMPOS_CAMISERIA,
  OPCIONES_HOLGURA_CAMISERIA,
  formatearResultado,
} from '../lib/medidasConfig'

const SECCIONES = [
  { id: 'americana', label: 'Americana' },
  { id: 'pantalon', label: 'Pantalón' },
  { id: 'camiseria', label: 'Camisería' },
]

export default function SeccionMedidas({ medidas, guardarMedidas }) {
  const [seccion, setSeccion] = useState('americana')
  const [valores, setValores] = useState({})

  useEffect(() => {
    if (medidas) setValores(medidas)
  }, [medidas])

  function onCambiarCampo(key, valor) {
    setValores((prev) => ({ ...prev, [key]: valor }))
  }

  async function onBlurCampo(key, valor) {
    await guardarMedidas({ [key]: valor === '' ? null : Number(valor) })
  }

  async function onCambiarHolgura(valor) {
    setValores((prev) => ({ ...prev, ca_holgura: valor }))
    await guardarMedidas({ ca_holgura: valor })
  }

  return (
    <div>
      <h2 className="font-serif text-lg text-tinta mb-3">Medidas</h2>

      <div className="flex gap-2 mb-4 flex-wrap">
        {SECCIONES.map((s) => (
          <button
            key={s.id}
            onClick={() => setSeccion(s.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              seccion === s.id ? 'text-white' : 'bg-white border border-bronce-100 text-tinta/60'
            }`}
            style={seccion === s.id ? { backgroundColor: '#B4863A' } : undefined}
          >
            {s.label}
          </button>
        ))}
      </div>

      {seccion === 'americana' && (
        <CamposMedida
          campos={CAMPOS_AMERICANA}
          valores={valores}
          onCambiar={onCambiarCampo}
          onBlur={onBlurCampo}
          formulas={FORMULAS_AMERICANA}
        />
      )}

      {seccion === 'pantalon' && (
        <CamposMedida campos={CAMPOS_PANTALON} valores={valores} onCambiar={onCambiarCampo} onBlur={onBlurCampo} />
      )}

      {seccion === 'camiseria' && (
        <>
          <CamposMedida campos={CAMPOS_CAMISERIA} valores={valores} onCambiar={onCambiarCampo} onBlur={onBlurCampo} />
          <div className="mt-3">
            <label className="text-[11px] uppercase tracking-wide text-tinta/45 font-medium">Holgura</label>
            <select
              value={valores.ca_holgura ?? ''}
              onChange={(e) => onCambiarHolgura(e.target.value)}
              className="mt-1 w-full bg-white border border-bronce-100 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-bronce-300"
            >
              <option value="">Selecciona…</option>
              {OPCIONES_HOLGURA_CAMISERIA.map((op) => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
          </div>
        </>
      )}
    </div>
  )
}

function CamposMedida({ campos, valores, onCambiar, onBlur, formulas }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {campos.map((c) => (
          <div key={c.key}>
            <label className="text-[11px] uppercase tracking-wide text-tinta/45 font-medium">{c.label}</label>
            <input
              type="number"
              inputMode="decimal"
              value={valores[c.key] ?? ''}
              onChange={(e) => onCambiar(c.key, e.target.value)}
              onBlur={(e) => onBlur(c.key, e.target.value)}
              placeholder="cm"
              className="mt-1 w-full bg-white border border-bronce-100 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-bronce-300"
            />
          </div>
        ))}
      </div>

      {formulas && (
        <div className="mt-5">
          <p className="text-[11px] uppercase tracking-wide text-tinta/45 font-medium mb-2">
            Cálculos automáticos
          </p>
          <div className="bg-white rounded-card border border-bronce-100 divide-y divide-bronce-100">
            {formulas.map((f) => {
              const resultado = f.calcular(valores)
              return (
                <div key={f.key} className="flex items-center justify-between px-4 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-tinta">{f.label}</p>
                    <p className="text-[11px] text-tinta/40">{f.formula}</p>
                  </div>
                  <p
                    className="font-serif text-lg"
                    style={{ color: resultado === null ? '#8A8378' : '#96702E' }}
                  >
                    {formatearResultado(resultado)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
