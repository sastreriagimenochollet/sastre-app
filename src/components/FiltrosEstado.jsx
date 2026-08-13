import { ESTADOS } from '../lib/constantes'

export default function FiltrosEstado({ filtro, onFiltrar, conteos }) {
  const opciones = [{ id: 'todos', label: 'Todos' }, ...ESTADOS]

  return (
    <div className="flex gap-2 overflow-x-auto sin-scrollbar pb-1 -mx-1 px-1">
      {opciones.map((o) => {
        const activo = filtro === o.id
        return (
          <button
            key={o.id}
            onClick={() => onFiltrar(o.id)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              activo
                ? 'bg-tinta text-white border-tinta'
                : 'bg-white text-tinta/70 border-bronce-100 hover:border-bronce-300'
            }`}
          >
            {o.label}
            {conteos && conteos[o.id] ? (
              <span className={`ml-1.5 text-xs ${activo ? 'text-white/70' : 'text-tinta/40'}`}>
                {conteos[o.id]}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
