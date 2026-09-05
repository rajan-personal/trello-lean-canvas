import { readFileSync } from 'node:fs'
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { deleteApp, initializeApp } from 'firebase/app'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import { canvasPayload, type WorkspaceValue } from '../src/data/firestore-model'
import { canvas, timestamp } from '../unit/fixtures'

export async function boardTestEnvironment(projectId: string) {
  const environment = await initializeTestEnvironment({ projectId,
    firestore: { rules: readFileSync('firestore.rules', 'utf8') } })
  const app = initializeApp({ projectId }, projectId)
  const db = getFirestore(app)
  const [host, port = '8080'] = (process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080').split(':')
  connectFirestoreEmulator(db, host, Number(port), { mockUserToken: { sub: 'alice' } })
  const seed = async (ids = ['a', 'b']): Promise<WorkspaceValue> => {
    await environment.clearFirestore()
    await environment.withSecurityRulesDisabled(async (context) => {
      const firestore = context.firestore()
      await firestore.doc('users/alice/workspaces/default').set({ schemaVersion: 2,
        canvasOrder: ids, orderRevision: 1, updatedAt: timestamp })
      await Promise.all(ids.map((id) => firestore.doc(`users/alice/workspaces/default/canvases/${id}`).set({
        schemaVersion: 1, ...canvasPayload(canvas(id)), revision: 1, updatedAt: timestamp,
      })))
    })
    return { canvases: ids.map(canvas), revisions: Object.fromEntries(ids.map((id) => [id, 1])), orderRevision: 1 }
  }
  return { db, environment, seed, async cleanup() { await deleteApp(app); await environment.cleanup() } }
}
