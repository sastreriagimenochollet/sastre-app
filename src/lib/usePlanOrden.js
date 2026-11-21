import { useEffect, useState } from 'react'
import { supabase } from './supabase'

// Orden manual de cada columna del tablero Plan (se sincroniza entre dispositivos)
export function usePlanOrden() {
  const [ordenes, setOrdenes] = useState({})
  const [errorOrden, setErrorOrden] = useState('')

  function mensaje(err) {
    return (
      'No se pudo guardar el orden: ' +
      err.message +
      (err.message.includes('plan_orden') ? ' Falta ejecutar migracion-industrial-arreglos-plan.sql en Supabase.' : '')
    )
  }

  useEffect(() => {
    supabase
      .from('plan_orden')
      .select('*')
      .then(({ data, error }) => {
        if (error) return // sin la tabla, el plan funciona igual (por fecha de entrega)
        setOrdenes(Object.fromEntries((data ?? []).map((r) => [r.columna, r.orden ?? []])))
      })
  }, [])

  async function guardarOrden(columna, claves) {
    setOrdenes((o) => ({ ...o, [columna]: claves }))
    const { error } = await supabase
      .from('plan_orden')
      .upsert({ columna, orden: claves, actualizado_en: new Date().toISOString() }, { onConflict: 'columna' })
    setErrorOrden(error ? mensaje(error) : '')
  }

  async function restablecer(columna) {
    setOrdenes((o) => {
      const n = { ...o }
      delete n[columna]
      return n
    })
    const { error } = await supabase.from('plan_orden').delete().eq('columna', columna)
    setErrorOrden(error ? mensaje(error) : '')
  }

  return { ordenes, errorOrden, guardarOrden, restablecer }
}
