import { lazy, Suspense } from 'react'
import { AuthProvider } from '../auth/AuthProvider'
import { LoginScreen } from '../auth/LoginScreen'
import { type AppUser, useAuth } from '../auth/auth-context'
import { AppStatus } from '../components/AppStatus'
import { SyncError } from '../components/SyncError'

const Workspace = lazy(() =>
  import('./Workspace').then((module) => ({ default: module.Workspace })),
)

interface Props {
  previewUser?: AppUser
  browserRouting?: boolean
}

const testUser: AppUser = {
  uid: 'playwright-user',
  displayName: 'Test User',
  email: 'test@example.com',
  photoURL: null,
}

function WorkspaceScreen({
  user,
  local = false,
  browserRouting = false,
  onSignOut,
}: {
  user: AppUser
  local?: boolean
  browserRouting?: boolean
  onSignOut: () => void | Promise<void>
}) {
  return (
    <Suspense fallback={<AppStatus />}>
      <Workspace
        user={user}
        browserRouting={browserRouting}
        onSignOut={onSignOut}
        persistence={local ? 'local' : 'firestore'}
      />
    </Suspense>
  )
}

export function AuthenticatedApp({ local = false, browserRouting = false }: { local?: boolean; browserRouting?: boolean }) {
  const auth = useAuth()
  if (auth.loading) return <AppStatus />
  if (!auth.user)
    return (
      <LoginScreen
        busy={auth.busy}
        error={auth.error}
        onSignIn={() => void auth.signIn()}
      />
    )
  return (
    <><WorkspaceScreen
      key={auth.user.uid}
      user={auth.user}
      local={local}
      browserRouting={browserRouting}
      onSignOut={() => auth.signOut()}
    />
    {auth.error && <SyncError message={auth.error} />}</>
  )
}

export default function App({ previewUser, browserRouting = false }: Props) {
  const loopback = ['localhost', '127.0.0.1', '::1'].includes(
    globalThis.location?.hostname,
  )
  const e2eUser =
    import.meta.env.MODE === 'test' &&
    import.meta.env.VITE_TEST_AUTH_BYPASS === 'true' &&
    loopback
      ? testUser
      : undefined
  const localUser = previewUser ?? e2eUser
  if (localUser)
    return <WorkspaceScreen browserRouting={browserRouting} user={localUser} local onSignOut={() => {}} />
  return (
    <AuthProvider>
      <AuthenticatedApp browserRouting={browserRouting} />
    </AuthProvider>
  )
}
