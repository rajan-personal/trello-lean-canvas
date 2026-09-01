import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App'
import './styles.css'

const Agentation = import.meta.env.DEV
  ? lazy(() => import('agentation').then((module) => ({ default: module.Agentation })))
  : null

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element was not found.')

createRoot(rootElement).render(
  <StrictMode>
    <App />
    {Agentation && (
      <Suspense fallback={null}>
        <Agentation />
      </Suspense>
    )}
  </StrictMode>,
)

