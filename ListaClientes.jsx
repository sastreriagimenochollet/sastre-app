import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Phone } from 'lucide-react'
import { useClientes } from '../lib/useClientes'

export default function ListaClientes() {
  const { clientes, cargando } = useClientes()
  const [busqueda, setBusqueda] = useState('')
  const navigate = useNavigate()

  const filtrados = useMemo(() => {
    if (!busqueda.trim()) return clientes
    const q = busqueda.toLowerCase()
    return clientes.filter((c) => c.nombre?.toLowerCase().includes(q))
  }, [clientes, busqueda])

  return (
    <div className="max-w-2xl mx-auto px-4 pb-28 pt-5 scroll-suave">
      <header className="mb-5">
        <h1 className="font-serif text-2xl text-tinta">Clientes</h1>
        <p className="text-sm text-tinta/50 mt-0.5">{clientes.length} en total</p>
      </header>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tinta/35" />
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar cliente…"
          className="w-full bg-white border border-bronce-100 rounded-full pl-9 pr-3 py-2.5 text-sm outline-none focus:border-bronce-300"
        />
      </div>

      {cargando && <p className="text-center text-tinta/40 text-sm py-10">Cargando…</p>}

      <div className="space-y-2.5">
        {filtrados.map((c) => (
          <button
            key={c.id}
            onClick={() => navigate(`/clientes/${c.id}`)}
            className="w-full bg-white rounded-card border border-bronce-100 p-4 flex items-center gap-3 text-left"
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center font-serif text-white shrink-0"
              style={{ backgroundColor: '#B4863A' }}
            >
              {c.nombre?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-tinta truncate">{c.nombre}</p>
              {c.telefono && (
                <p className="text-xs text-tinta/45 flex items-center gap-1"><Phone size={11} /> {c.telefono}</p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
