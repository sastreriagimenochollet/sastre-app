import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ListaTrabajos from './pages/ListaTrabajos'
import ListaClientes from './pages/ListaClientes'
import FichaCliente from './pages/FichaCliente'
import Reportes from './pages/Reportes'
import Telas from './pages/Telas'
import NavSuperior from './components/NavSuperior'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen textura-lino">
        <NavSuperior />
        <Routes>
          <Route path="/" element={<ListaTrabajos />} />
          <Route path="/clientes" element={<ListaClientes />} />
          <Route path="/clientes/:id" element={<FichaCliente />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/telas" element={<Telas />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
