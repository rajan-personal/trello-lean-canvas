import { readFileSync } from 'node:fs'
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { deleteApp, initializeApp, type FirebaseApp } from 'firebase/app'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { initializeWorkspace } from '../src/data/firestore-migration'
import { canvas } from '../unit/fixtures'

let environment: RulesTestEnvironment
let app: FirebaseApp
const projectId = 'lean-canvas-local-migration-test'
const parentPath = 'users/alice/workspaces/default'

beforeAll(async () => {
  environment = await initializeTestEnvironment({
    projectId,
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  })
  app = initializeApp({ projectId }, 'local-migration-test')
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

describe('local workspace migration', () => {
  it('creates verified per-canvas documents and is repeatable', async () => {
    const local = [canvas('local-a'), canvas('local-b')]
    const db = getFirestore(app)
    expect((await initializeWorkspace(db, 'alice', local)).consumedLocal).toBe(true)
    expect((await initializeWorkspace(db, 'alice', local)).consumedLocal).toBe(true)
    await environment.withSecurityRulesDisabled(async (context) => {
      const firestore = context.firestore()
      const parent = await firestore.doc(parentPath).get()
      const children = await firestore.collection(`${parentPath}/canvases`).get()
      expect(parent.data()?.canvasOrder).toEqual(['local-a', 'local-b'])
      expect(parent.data()?.canvases).toHaveLength(2)
      expect(children.docs.map(({ id }) => id).sort()).toEqual(['local-a', 'local-b'])
    })
  })
})
