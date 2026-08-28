import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import CapturaErrores from './components/CapturaErrores.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CapturaErrores>
      <App />
    </CapturaErrores>
  </React.StrictMode>
)
