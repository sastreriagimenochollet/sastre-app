import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'

export function usePedidos() {
  const [pedidos, setPedidos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [errorGuardado, setErrorGuardado] = useState(null)

  function mensajeGuardado(err) {
    const pista = err.message?.includes('estado_check')
      ? ' Falta ejecutar migracion-etapas-entregados.sql en Supabase.'
      : ''
    return 'No se pudo guardar el cambio de etapa: ' + err.message + pista
  }

  const cargar = useCallback(async () => {
    setCargando(true)
    const { data, error } = await supabase
      .from('pedidos')
      .select('*, clientes(id, nombre, telefono, poblacion), camiseria_seguimiento(*)')
      .order('creado_en', { ascending: false })

    if (error) setError(error.message)
    else {
      // El seguimiento de camisería es 1 a 1 con el pedido, así que Supabase lo
      // devuelve como un objeto. Lo dejamos siempre como lista para leerlo igual.
      setPedidos(
        (data ?? []).map((p) => ({
          ...p,
          camiseria_seguimiento: Array.isArray(p.camiseria_seguimiento)
            ? p.camiseria_seguimiento
            : p.camiseria_seguimiento
            ? [p.camiseria_seguimiento]
            : [],
        }))
      )
    }
    setCargando(false)
  }, [])

  useEffect(() => {
    cargar()

    // Suscripción en tiempo real: si cambias algo en el iPad,
    // la compu lo ve reflejado sin recargar la página.
    // Nombre de canal único por montaje para evitar conflictos
    // si el componente se vuelve a montar rápido (StrictMode).
    const canal = supabase
      .channel(`pedidos-realtime-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => {
        cargar()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'camiseria_seguimiento' }, () => {
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
      setErrorGuardado(mensajeGuardado(error))
      setError(error.message)
      cargar() // revertir si falló
    }
    else setErrorGuardado(null)
  }

  async function actualizarEstadoCamiseria(pedidoId, nuevoEstado) {
    // Actualización optimista sobre el registro de seguimiento
    // anidado en el pedido.
    setPedidos((prev) =>
      prev.map((p) => {
        if (p.id !== pedidoId) return p
        const existente = p.camiseria_seguimiento?.[0]
        const actualizado = existente ? { ...existente, estado: nuevoEstado } : { estado: nuevoEstado }
        return { ...p, camiseria_seguimiento: [actualizado] }
      })
    )
    // "upsert" con pedido_id como clave: crea el registro si no
    // existe, o solo actualiza el estado si ya existe (sin tocar
    // proveedor/referencia/tejido que ya tuviera guardados).
    const { error } = await supabase
      .from('camiseria_seguimiento')
      .upsert({ pedido_id: pedidoId, estado: nuevoEstado }, { onConflict: 'pedido_id' })
    if (error) {
      setErrorGuardado(mensajeGuardado(error))
      setError(error.message)
      cargar()
    }
    else setErrorGuardado(null)
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

  return { pedidos, cargando, error, errorGuardado, limpiarErrorGuardado: () => setErrorGuardado(null), actualizarEstado, actualizarEstadoCamiseria, crearPedido, actualizarPedido, eliminarPedido, recargar: cargar }
}
