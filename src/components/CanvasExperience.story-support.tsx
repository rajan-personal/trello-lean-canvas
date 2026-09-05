import { useState } from 'react'
import { Workspace } from '../app/Workspace'
import { WorkspaceSeed } from '../app/SeededWorkspace.story-support'
import { favoriteCanvas, storyCanvas } from './component-story-fixtures'

const canvases = [storyCanvas, favoriteCanvas]
const user = { uid: 'canvas-audit-user', displayName: 'Canvas reviewer', email: 'canvas@example.test', photoURL: null }
export function CanvasExperience() {
  const [signedOut, setSignedOut] = useState(false)
  if (signedOut) return <p className="text-white">Signed out</p>
  return <WorkspaceSeed canvases={canvases}>
    <Workspace user={user} persistence="local" onSignOut={() => setSignedOut(true)} />
  </WorkspaceSeed>
}
