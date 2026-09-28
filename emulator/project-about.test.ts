import { readFileSync } from 'node:fs'
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import firebase from 'firebase/compat/app'
import 'firebase/compat/firestore'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { canvasPayload } from '../src/data/firestore-model'
import { canvas } from '../unit/fixtures'

let environment: RulesTestEnvironment
const workspace = (uid: string) => `users/${uid}/workspaces/default`
const timestamp = () => firebase.firestore.FieldValue.serverTimestamp()
async function createWorkspace(uid: string, order: string[]) {
  const db = environment.authenticatedContext(uid).firestore()
  await db.doc(workspace(uid)).set({ schemaVersion: 2, canvasOrder: order, orderRevision: 1, updatedAt: timestamp() })
  return db
}
beforeAll(async () => {
  environment = await initializeTestEnvironment({ projectId: 'lean-about-rules-test',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') } })
  await environment.clearFirestore()
})
afterAll(async () => environment.cleanup())

describe('project About rules', () => {
  it('accepts legacy canvases and validates About details on update', async () => {
    const db = await createWorkspace('alice', ['a'])
    const ref = db.doc(`${workspace('alice')}/canvases/a`)
    const legacy = { schemaVersion: 1, ...canvasPayload(canvas('a')), revision: 1, updatedAt: timestamp() }
    Reflect.deleteProperty(legacy, 'about')
    await assertSucceeds(ref.set(legacy))
    await assertSucceeds(ref.update({ about: 'Project goals\nUseful links', revision: 2, updatedAt: timestamp() }))
    expect((await ref.get()).data()?.about).toBe('Project goals\nUseful links')
    for (const about of [123, 'x'.repeat(100001)]) {
      await assertFails(ref.update({ about, revision: 3, updatedAt: timestamp() }))
    }
  })
})
