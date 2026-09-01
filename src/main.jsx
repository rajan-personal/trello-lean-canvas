import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

const Agentation = import.meta.env.DEV
  ? lazy(() => import('agentation').then((module) => ({ default: module.Agentation })))
  : null

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    {Agentation && (
      <Suspense fallback={null}>
        <Agentation />
      </Suspense>
    )}
  </StrictMode>,
)

