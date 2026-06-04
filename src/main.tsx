import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.tsx'
import { loader } from '@monaco-editor/react'

// Cargar Monaco desde CDN con versión fija.
// Esto garantiza que los workers de CSS y HTML (IntelliSense) estén disponibles.
loader.config({
  paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.0/min/vs' },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
