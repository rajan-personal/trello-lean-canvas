import { readFileSync } from 'node:fs'
import {
  assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { deleteApp, initializeApp, type FirebaseApp } from 'firebase/app'
import firebase from 'firebase/compat/app'
import 'firebase/compat/firestore'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { initializeWorkspace } from '../src/data/firestore-migration'
import { canvasPayload } from '../src/data/firestore-model'
import { canvas } from '../unit/fixtures'

let environment: RulesTestEnvironment
const apps: FirebaseApp[] = []
const workspace = (uid: string) => `users/${uid}/workspaces/default`
const timestamp = () => firebase.firestore.FieldValue.serverTimestamp()
const canvasDoc = (id: string, revision = 1) => ({ schemaVersion: 1,
  ...canvasPayload(canvas(id)), revision, updatedAt: timestamp() })
async function createWorkspace(uid: string, order: string[]) {
  const db = environment.authenticatedContext(uid).firestore()
  await db.doc(workspace(uid)).set({ schemaVersion: 2, canvasOrder: order,
    orderRevision: 1, updatedAt: timestamp() })
  return db
}
function authenticatedFirestore(uid: string) {
  const app = initializeApp({ projectId: 'lean-canvas-rules-test' }, `rules-${uid}-${apps.length}`)
  apps.push(app)
  const db = getFirestore(app)
  const [host, port = '8080'] = (process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080').split(':')
  connectFirestoreEmulator(db, host, Number(port), { mockUserToken: { sub: uid } })
  return db
}
beforeAll(async () => {
  environment = await initializeTestEnvironment({
    projectId: 'lean-canvas-rules-test',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  })
})
beforeEach(async () => environment.clearFirestore())
afterAll(async () => {
  await environment.cleanup()
  await Promise.all(apps.map(deleteApp))
})

describe('Firestore ownership and schemas', () => {
  it('allows owner documents and denies cross-user access', async () => {
    const owner = await createWorkspace('alice', ['a'])
    await assertSucceeds(owner.doc(`${workspace('alice')}/canvases/a`).set(canvasDoc('a')))
    const other = environment.authenticatedContext('bob').firestore()
    await assertFails(other.doc(workspace('alice')).get())
    await assertFails(other.doc(`${workspace('alice')}/canvases/x`).set(canvasDoc('x')))
  })
  it('rejects invalid metadata and canvas documents', async () => {
    const db = environment.authenticatedContext('alice').firestore()
    await assertFails(db.doc(workspace('alice')).set({ schemaVersion: 2,
      canvasOrder: [], orderRevision: 1, updatedAt: timestamp(), extra: true }))
    await createWorkspace('alice', ['bad'])
    await assertFails(db.doc(`${workspace('alice')}/canvases/bad`)
      .set({ ...canvasDoc('bad'), favorite: 'yes' }))
  })
  it('stores canvases as separate documents', async () => {
    const db = await createWorkspace('alice', ['a', 'b'])
    await db.doc(`${workspace('alice')}/canvases/a`).set(canvasDoc('a'))
    await db.doc(`${workspace('alice')}/canvases/b`).set(canvasDoc('b'))
    const result = await db.collection(`${workspace('alice')}/canvases`).get()
    expect(result.docs.map((item) => item.id).sort()).toEqual(['a', 'b'])
  })
})

describe('legacy migration', () => {
  it('allows transition writes but blocks a schema downgrade', async () => {
    const db = environment.authenticatedContext('alice').firestore()
    const legacy = { canvases: [canvas('legacy')], updatedAt: timestamp() }
    await assertSucceeds(db.doc(workspace('alice')).set(legacy))
    await assertSucceeds(db.doc(workspace('alice')).set(legacy))
    await initializeWorkspace(authenticatedFirestore('alice'), 'alice', [])
    await assertFails(db.doc(workspace('alice')).set(legacy))
  })
  it('resumes existing child copies and finalizes idempotently', async () => {
    const legacy = canvas('legacy-a')
    await environment.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore()
      await db.doc(workspace('alice')).set({ canvases: [legacy],
        updatedAt: firebase.firestore.Timestamp.now() })
      await db.doc(`${workspace('alice')}/canvases/legacy-a`).set({ schemaVersion: 1,
        ...canvasPayload(legacy), revision: 1, updatedAt: firebase.firestore.Timestamp.now() })
    })
    const db = authenticatedFirestore('alice')
    expect((await initializeWorkspace(db, 'alice', [])).consumedLocal).toBe(false)
    expect((await initializeWorkspace(db, 'alice', [])).consumedLocal).toBe(false)
    const verify = environment.authenticatedContext('alice').firestore()
    const parent = await verify.doc(workspace('alice')).get()
    expect(parent.data()?.canvasOrder).toEqual(['legacy-a'])
    const children = await verify.collection(`${workspace('alice')}/canvases`).get()
    expect(children.size).toBe(1)
  })
})
