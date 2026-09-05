import { useState } from 'react'
import { AuthContext, type AuthState } from '../auth/auth-context'
import { AuthenticatedApp } from './App'
import { WorkspaceSeed } from './SeededWorkspace.story-support'
import { blankCanvas } from './App.story-support'

const canvases = [blankCanvas]
export function SessionFixture({ state }: { state: AuthState }) {
  const [session, setSession] = useState(state)
  return <WorkspaceSeed canvases={canvases}>
    <AuthContext.Provider value={{ ...session,
      signOut: async () => {
        setSession((value) => ({ ...value, busy: true, error: null }))
        try {
          await state.signOut()
          setSession((value) => ({ ...value, busy: false, user: null }))
        } catch {
          setSession((value) => ({ ...value, busy: false, error: 'Sign out failed. Please try again.' }))
        }
      },
    }}><AuthenticatedApp local /></AuthContext.Provider>
  </WorkspaceSeed>
}
