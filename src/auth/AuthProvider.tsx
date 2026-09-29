import { useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { firebaseApp } from '../firebase'
import { AuthContext, type AppUser } from './auth-context'
import { authMessage } from './auth-errors'
import { hasPassword, saveAccountPassword } from './password-account'

const auth = getAuth(firebaseApp)
const provider = new GoogleAuthProvider()
provider.setCustomParameters({ prompt: 'select_account' })

function toAppUser(user: typeof auth.currentUser): AppUser | null {
  if (!user) return null
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    hasPassword: hasPassword(user),
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
      if (nextUser && !nextUser.providerData.some(({ providerId }) => providerId === 'google.com')) {
        setUser(null)
        setError('Please create your account with Google first.')
        void firebaseSignOut(auth).catch(() => setError('Please sign out and continue with Google.'))
      } else setUser(toAppUser(nextUser))
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
      signInWithEmail: async (email: string, password: string) => {
        setBusy(true)
        setError(null)
        try { await signInWithEmailAndPassword(auth, email.trim(), password) }
        catch (cause) { setError(authMessage(cause)) }
        finally { setBusy(false) }
      },
      setPassword: async (password: string) => {
        const current = auth.currentUser
        if (!current) throw new Error('Please sign in again.')
        await saveAccountPassword(current, password)
        setUser(toAppUser(current))
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
