import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import '@/lib/ag-grid-setup'
import App from './App.tsx'

function initApp() {
  const rootElement = document.getElementById('root')

  if (!rootElement) {
    throw new Error('Root element not found. Make sure there is a <div id="root"></div> in your HTML.')
  }

  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

// Ensure DOM is ready before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp)
} else {
  // DOM is already ready
  initApp()
}

