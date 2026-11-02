import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'

export function useTejidosGlobal() {
  const [tejidos, setTejidos] = useState([])
  const [cargando, setCargando] = useState(true)

  const cargar = useCallback(async () => {
    setCargando(true)
    const { data, error } = await supabase
      .from('tejidos')
      .select('*, pedidos(id, fecha_pedido, creado_en, clientes(nombre))')
      .order('creado_en', { ascending: false })
    if (!error) setTejidos(data ?? [])
    setCargando(false)
  }, [])

  useEffect(() => {
    cargar()
    const canal = supabase
      .channel(`tejidos-realtime-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tejidos' }, () => cargar())
      .subscribe()
    return () => supabase.removeChannel(canal)
  }, [cargar])

  async function alternarComprada(id, comprada) {
    setTejidos((prev) => prev.map((t) => (t.id === id ? { ...t, comprada: !comprada } : t)))
    await supabase.from('tejidos').update({ comprada: !comprada }).eq('id', id)
  }

  return { tejidos, cargando, alternarComprada, recargar: cargar }
}
