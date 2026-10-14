import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { store } from './store'
import VerifyScreen from './VerifyScreen'
import './index.css'

const root = ReactDOM.createRoot(document.getElementById('root')!)

// Completa la barra de carga (definida en index.html) y la desvanece.
function hideLoader() {
  const el = document.getElementById('gc-loader')
  if (!el) return
  el.classList.add('gc-full')
  setTimeout(() => {
    el.classList.add('gc-done')
    setTimeout(() => el.remove(), 350)
  }, 280)
}

const verifyMatch = window.location.pathname.match(/^\/verificar\/([^/]+)/)

if (verifyMatch) {
  // Página pública de verificación de certificados (no necesita sesión).
  root.render(<VerifyScreen certId={decodeURIComponent(verifyMatch[1])} />)
  hideLoader()
} else
// Abre la sesión y carga los datos de Supabase antes de mostrar la app.
store.init().then(() => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
  hideLoader()
})

// Permite instalar la app en la pantalla de inicio del celular.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}) })
}
