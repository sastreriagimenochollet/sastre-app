import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { traerTodo } from './useDatosReportes'

async function composturasSinHacer() {
  const { data, error } = await supabase.from('composturas').select('*').eq('completada', false).limit(1000)
  return error ? [] : data ?? []
}

export function usePlanTrabajo() {
  const [datos, setDatos] = useState({ tejidos: [], composturas: [], camisas: [], items: [] })
  const [cargando, setCargando] = useState(true)

  const cargar = useCallback(async () => {
    const [tejidos, camisas, items, composturas] = await Promise.all([
      traerTodo('tejidos'),
      traerTodo('camisas'),
      traerTodo('items_trabajo'),
      composturasSinHacer(),
    ])
    setDatos({ tejidos, camisas, items, composturas })
    setCargando(false)
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function marcarTejido(id, comprada) {
    setDatos((d) => ({ ...d, tejidos: d.tejidos.map((t) => (t.id === id ? { ...t, comprada } : t)) }))
    const { error } = await supabase.from('tejidos').update({ comprada }).eq('id', id)
    if (error) cargar()
  }

  async function marcarCompostura(id) {
    setDatos((d) => ({ ...d, composturas: d.composturas.filter((c) => c.id !== id) }))
    const { error } = await supabase.from('composturas').update({ completada: true }).eq('id', id)
    if (error) cargar()
  }

  return { ...datos, cargando, marcarTejido, marcarCompostura }
}
