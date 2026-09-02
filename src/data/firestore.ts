import {
  doc,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore'
import { firebaseApp } from '../firebase'
import type { LeanCanvas } from './types'

const db = getFirestore(firebaseApp)

interface WorkspaceDocument {
  canvases?: unknown
}

const workspaceRef = (uid: string) =>
  doc(db, 'users', uid, 'workspaces', 'default')

function normalizeCanvases(value: unknown): LeanCanvas[] {
  if (!Array.isArray(value)) return []
  return (value as LeanCanvas[]).map((canvas) => ({
    ...canvas,
    notes: typeof canvas.notes === 'string' ? canvas.notes : '',
  }))
}

export function subscribeToWorkspace(
  uid: string,
  onValue: (canvases: LeanCanvas[], exists: boolean) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    workspaceRef(uid),
    (snapshot) => {
      const data = snapshot.data() as WorkspaceDocument | undefined
      onValue(normalizeCanvases(data?.canvases), snapshot.exists())
    },
    onError,
  )
}

export async function saveWorkspace(
  uid: string,
  canvases: LeanCanvas[],
): Promise<void> {
  await setDoc(workspaceRef(uid), { canvases, updatedAt: serverTimestamp() })
}
