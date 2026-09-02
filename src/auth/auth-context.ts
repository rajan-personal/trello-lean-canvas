import { createContext, useContext } from 'react'

export interface AppUser {
  uid: string
  displayName: string | null
  email: string | null
  photoURL: string | null
}

export interface AuthState {
  user: AppUser | null
  loading: boolean
  busy: boolean
  error: string | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const state = useContext(AuthContext)
  if (!state) throw new Error('useAuth must be used inside AuthProvider')
  return state
}
