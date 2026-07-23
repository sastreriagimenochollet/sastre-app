import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'

export function useClientes() {
  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('nombre', { ascending: true })
    if (error) setError(error.message)
    else setClientes(data)
    setCargando(false)
  }, [])

  useEffect(() => {
    cargar()
    const canal = supabase
      .channel('clientes-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, () => cargar())
      .subscribe()
    return () => supabase.removeChannel(canal)
  }, [cargar])

  async function crearCliente(datos) {
    const { data, error } = await supabase.from('clientes').insert(datos).select().single()
    if (error) throw error
    await cargar()
    return data
  }

  async function actualizarCliente(id, cambios) {
    const { error } = await supabase.from('clientes').update(cambios).eq('id', id)
    if (error) throw error
    await cargar()
  }

  async function eliminarCliente(id) {
    const { error } = await supabase.from('clientes').delete().eq('id', id)
    if (error) throw error
    await cargar()
  }

  return { clientes, cargando, error, crearCliente, actualizarCliente, eliminarCliente, recargar: cargar }
}

export function useCliente(id) {
  const [cliente, setCliente] = useState(null)
  const [medidas, setMedidas] = useState(null)
  const [cargando, setCargando] = useState(true)

  const cargar = useCallback(async () => {
    if (!id) return
    setCargando(true)
    const [{ data: c }, { data: m }] = await Promise.all([
      supabase.from('clientes').select('*').eq('id', id).single(),
      supabase.from('medidas').select('*').eq('cliente_id', id).maybeSingle(),
    ])
    setCliente(c)
    setMedidas(m)
    setCargando(false)
  }, [id])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function guardarMedidas(cambios) {
    if (medidas) {
      const { error } = await supabase.from('medidas').update(cambios).eq('cliente_id', id)
      if (error) throw error
    } else {
      const { error } = await supabase.from('medidas').insert({ cliente_id: id, ...cambios })
      if (error) throw error
    }
    await cargar()
  }

  return { cliente, medidas, cargando, guardarMedidas, recargar: cargar }
}
