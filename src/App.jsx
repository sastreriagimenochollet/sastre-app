import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ListaTrabajos from './pages/ListaTrabajos'
import ListaClientes from './pages/ListaClientes'
import FichaCliente from './pages/FichaCliente'
import Reportes from './pages/Reportes'
import NavInferior from './components/NavInferior'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen textura-lino">
        <Routes>
          <Route path="/" element={<ListaTrabajos />} />
          <Route path="/clientes" element={<ListaClientes />} />
          <Route path="/clientes/:id" element={<FichaCliente />} />
          <Route path="/reportes" element={<Reportes />} />
        </Routes>
        <NavInferior />
      </div>
    </BrowserRouter>
  )
}
