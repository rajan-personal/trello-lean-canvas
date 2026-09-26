import { lazy } from 'react'

// Build-time split: demo login is absent from production builds.
const EntryApp = import.meta.env.MODE === 'demo'
  ? lazy(() => import('./demo/DemoApp'))
  : lazy(() => import('./app/App'))

export default EntryApp
