import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Workspace } from '../src/app/Workspace'
import { demoUser, resetDemo, seedDemo } from './seed'
import './app.css'

seedDemo()
const root = document.getElementById('root')
if (!root) throw new Error('Root element was not found.')
createRoot(root).render(<StrictMode>
  <aside className="staging-banner" aria-label="Staging demo information">
    <span><strong>Staging demo</strong> · No login · Data stays in this browser</span>
    <button type="button" onClick={resetDemo}>Reset demo</button>
  </aside>
  <Workspace user={demoUser} persistence="local" browserRouting onSignOut={resetDemo} />
</StrictMode>)
