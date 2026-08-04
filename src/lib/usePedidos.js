import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'

export function usePedidos() {
  const [pedidos, setPedidos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    const { data, error } = await supabase
      .from('pedidos')
      .select('*, clientes(id, nombre, telefono, poblacion)')
      .order('creado_en', { ascending: false })

    if (error) setError(error.message)
    else setPedidos(data)
    setCargando(false)
  }, [])

  useEffect(() => {
    cargar()

    // Suscripción en tiempo real: si cambias algo en el iPad,
    // la compu lo ve reflejado sin recargar la página.
    const canal = supabase
      .channel('pedidos-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => {
        cargar()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [cargar])

  async function actualizarEstado(pedidoId, nuevoEstado) {
    // Actualización optimista: se ve al instante en pantalla,
    // y luego confirma con el servidor.
    setPedidos((prev) =>
      prev.map((p) => (p.id === pedidoId ? { ...p, estado: nuevoEstado } : p))
    )
    const { error } = await supabase
      .from('pedidos')
      .update({ estado: nuevoEstado, actualizado_en: new Date().toISOString() })
      .eq('id', pedidoId)
    if (error) {
      setError(error.message)
      cargar() // revertir si falló
    }
  }

  async function crearPedido(datos) {
    const { data, error } = await supabase.from('pedidos').insert(datos).select().single()
    if (error) throw error
    await cargar()
    return data
  }

  async function actualizarPedido(pedidoId, cambios) {
    const { error } = await supabase
      .from('pedidos')
      .update({ ...cambios, actualizado_en: new Date().toISOString() })
      .eq('id', pedidoId)
    if (error) throw error
    await cargar()
  }

  async function eliminarPedido(pedidoId) {
    const { error } = await supabase.from('pedidos').delete().eq('id', pedidoId)
    if (error) throw error
    await cargar()
  }

  return { pedidos, cargando, error, actualizarEstado, crearPedido, actualizarPedido, eliminarPedido, recargar: cargar }
}
