import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import SuperAdminApp from './SuperAdminApp.tsx'

const isSuperAdminRoute = window.location.pathname.startsWith('/superadmin')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isSuperAdminRoute ? <SuperAdminApp /> : <App />}
  </StrictMode>,
)
