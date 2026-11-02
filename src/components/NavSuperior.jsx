import { NavLink } from 'react-router-dom'
import { Shirt, Users, BarChart3, Palette } from 'lucide-react'

const items = [
  { to: '/', label: 'Trabajos', icon: Shirt, fin: true },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/telas', label: 'Telas', icon: Palette },
  { to: '/reportes', label: 'Reportes', icon: BarChart3 },
]

export default function NavSuperior() {
  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-bronce-100 pt-[env(safe-area-inset-top)]">
      <div className="max-w-2xl mx-auto flex">
        {items.map(({ to, label, icon: Icon, fin }) => (
          <NavLink
            key={to}
            to={to}
            end={fin}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium border-b-2 ${
                isActive ? 'border-current' : 'border-transparent text-tinta/40'
              }`
            }
            style={({ isActive }) => (isActive ? { color: '#7C9473' } : undefined)}
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
