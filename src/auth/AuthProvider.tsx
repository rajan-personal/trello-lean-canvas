import { useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { firebaseApp } from '../firebase'
import { AuthContext, type AppUser } from './auth-context'

const auth = getAuth(firebaseApp)
const provider = new GoogleAuthProvider()
provider.setCustomParameters({ prompt: 'select_account' })

function authMessage(error: unknown): string {
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String(error.code)
      : ''
  if (code.includes('popup-closed')) return 'Google sign-in was cancelled.'
  if (code.includes('popup-blocked')) return 'Allow pop-ups and try again.'
  if (code.includes('unauthorized-domain'))
    return 'This site is not authorized for Google sign-in.'
  return 'Google sign-in failed. Please try again.'
}

function toAppUser(user: typeof auth.currentUser): AppUser | null {
  if (!user) return null
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    void setPersistence(auth, browserLocalPersistence)
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(toAppUser(nextUser))
      setLoading(false)
    })
  }, [])
  const value = useMemo(
    () => ({
      user,
      loading,
      busy,
      error,
      signIn: async () => {
        setBusy(true)
        setError(null)
        try {
          await signInWithPopup(auth, provider)
        } catch (cause) {
          setError(authMessage(cause))
        } finally {
          setBusy(false)
        }
      },
      signOut: async () => {
        setBusy(true)
        setError(null)
        try {
          await firebaseSignOut(auth)
        } catch {
          setError('Sign out failed. Please try again.')
        } finally {
          setBusy(false)
        }
      },
    }),
    [busy, error, loading, user],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
