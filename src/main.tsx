import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import './styles.css'

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => {
      // A falha no registro do PWA não deve impedir o uso do site.
    })
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)
