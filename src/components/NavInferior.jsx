import { NavLink } from 'react-router-dom'
import { Shirt, Users, BarChart3, Palette } from 'lucide-react'

const items = [
  { to: '/', label: 'Trabajos', icon: Shirt, fin: true },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/telas', label: 'Telas', icon: Palette },
  { to: '/reportes', label: 'Reportes', icon: BarChart3 },
]

export default function NavInferior() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-bronce-100 z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-2xl mx-auto flex">
        {items.map(({ to, label, icon: Icon, fin }) => (
          <NavLink
            key={to}
            to={to}
            end={fin}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${
                isActive ? 'text-bronce-600' : 'text-tinta/40'
              }`
            }
            style={({ isActive }) => (isActive ? { color: '#96702E' } : undefined)}
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
