import { createRoot } from 'react-dom/client'
import { Workspace } from '../../src/app/Workspace'
import '../../src/styles.css'

// Browser-only integration harness: the test replaces transport, not workspace/editor code.
createRoot(document.getElementById('root')!).render(<Workspace user={{ uid: 'alice',
  displayName: 'Alice', email: 'alice@example.test', photoURL: null }} onSignOut={() => undefined} />)
