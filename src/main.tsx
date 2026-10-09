import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { store } from './store'
import VerifyScreen from './VerifyScreen'
import './index.css'

const root = ReactDOM.createRoot(document.getElementById('root')!)

root.render(
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', color: '#0D6E6E' }}>
    Cargando Gaviotas Conecta…
  </div>,
)

const verifyMatch = window.location.pathname.match(/^\/verificar\/([^/]+)/)

if (verifyMatch) {
  // Página pública de verificación de certificados (no necesita sesión).
  root.render(<VerifyScreen certId={decodeURIComponent(verifyMatch[1])} />)
} else
// Abre la sesión y carga los datos de Supabase antes de mostrar la app.
store.init().then(() => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
})

// Permite instalar la app en la pantalla de inicio del celular.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}) })
}
