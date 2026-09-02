import { readFileSync } from 'node:fs'
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { deleteApp, initializeApp, type FirebaseApp } from 'firebase/app'
import firebase from 'firebase/compat/app'
import 'firebase/compat/firestore'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { canvasPayload, type WorkspaceValue } from '../src/data/firestore-model'
import { saveCanvasDiff } from '../src/data/firestore-writes'
import { canvas } from '../unit/fixtures'

let environment: RulesTestEnvironment
let app: FirebaseApp
const projectId = 'lean-canvas-writes-test'
const parentPath = 'users/alice/workspaces/default'
const timestamp = () => firebase.firestore.Timestamp.now()
const canvasDocument = (id: string) => ({
  schemaVersion: 1,
  ...canvasPayload(canvas(id)),
  revision: 1,
  updatedAt: timestamp(),
})

beforeAll(async () => {
  environment = await initializeTestEnvironment({
    projectId,
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  })
  await environment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    await db.doc(parentPath).set({
      schemaVersion: 2,
      canvasOrder: ['a', 'b'],
      orderRevision: 1,
      updatedAt: timestamp(),
    })
    await db.doc(`${parentPath}/canvases/a`).set(canvasDocument('a'))
    await db.doc(`${parentPath}/canvases/b`).set(canvasDocument('b'))
  })
  app = initializeApp({ projectId }, 'writes-test')
  const db = getFirestore(app)
  const [host, port = '8080'] =
    (process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080').split(':')
  connectFirestoreEmulator(db, host, Number(port), {
    mockUserToken: { sub: 'alice' },
  })
})
afterAll(async () => {
  await deleteApp(app)
  await environment.cleanup()
})

describe('saveCanvasDiff', () => {
  it('updates only changed topology and canvas documents', async () => {
    const a = canvas('a')
    const base: WorkspaceValue = {
      canvases: [a, canvas('b')],
      revisions: { a: 1, b: 1 },
      orderRevision: 1,
    }
    const next = [canvas('c'), { ...a, notes: 'updated' }]
    const result = await saveCanvasDiff(getFirestore(app), 'alice', base, next)
    expect(result.orderRevision).toBe(2)
    await environment.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore()
      const parent = await db.doc(parentPath).get()
      const updated = await db.doc(`${parentPath}/canvases/a`).get()
      const created = await db.doc(`${parentPath}/canvases/c`).get()
      const removed = await db.doc(`${parentPath}/canvases/b`).get()
      expect(parent.data()?.canvasOrder).toEqual(['c', 'a'])
      expect(updated.data()?.revision).toBe(2)
      expect(created.data()?.revision).toBe(1)
      expect(removed.exists).toBe(false)
    })
  })
})
