import { useEffect, useState } from 'react'
import { supabase } from './supabase'

// Trae TODAS las filas de una tabla, de 1000 en 1000 (Supabase corta
// en 1000 por consulta). Si la tabla no existe todavía, devuelve [].
async function traerTodo(tabla) {
  let todo = []
  let desde = 0
  const paso = 1000
  while (true) {
    const { data, error } = await supabase.from(tabla).select('*').range(desde, desde + paso - 1)
    if (error) return todo
    todo = todo.concat(data ?? [])
    if (!data || data.length < paso) break
    desde += paso
  }
  return todo
}

export function useDatosReportes() {
  const [datos, setDatos] = useState({ items: [], camisas: [], pagos: [], tejidos: [] })
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vivo = true
    Promise.all([
      traerTodo('items_trabajo'),
      traerTodo('camisas'),
      traerTodo('pagos'),
      traerTodo('tejidos'),
    ]).then(([items, camisas, pagos, tejidos]) => {
      if (!vivo) return
      setDatos({ items, camisas, pagos, tejidos })
      setCargando(false)
    })
    return () => {
      vivo = false
    }
  }, [])

  return { ...datos, cargando }
}
