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
  it.each([
    [null], [123], ['Goals'], [{}],
    [{ id: '', title: 'Goals', content: '' }],
    [{ id: 'overview', title: 'Goals', content: '' }],
    [{ id: 'x'.repeat(101), title: 'Goals', content: '' }],
    [{ id: 'goals', title: 123, content: '' }],
    [{ id: 'goals', title: 'x'.repeat(61), content: '' }],
    [{ id: 'goals', title: 'Goals' }],
    [{ id: 'goals', title: 'Goals', content: 123 }],
    [{ id: 'goals', title: 'Goals', content: 'x'.repeat(100001) }],
    [{ id: 'goals', title: 'Goals', content: '', extra: true }],
    [{ id: 'goals', title: 'Goals', content: '' }, { id: 'goals', title: 'Duplicate', content: '' }],
  ].map((aboutTabs, index) => ({ aboutTabs, index })))('rejects malformed tab entries ($index)', async ({ aboutTabs, index }) => {
    const uid = `invalid-tabs-${index}`
    const db = await createWorkspace(uid, ['a'])
    const ref = db.doc(`${workspace(uid)}/canvases/a`)
    const initial = { schemaVersion: 1, ...canvasPayload(canvas('a')), revision: 1, updatedAt: timestamp() }
    await assertFails(ref.set({ ...initial, aboutTabs }))
    await assertSucceeds(ref.set(initial))
    await assertFails(ref.update({ aboutTabs, revision: 2, updatedAt: timestamp() }))
  })
  it.each([0, 1, 2, 3, 4])('validates the tab at slot %i in a full list', async (index) => {
    const uid = `tab-slot-${index}`
    const db = await createWorkspace(uid, ['a'])
    const ref = db.doc(`${workspace(uid)}/canvases/a`)
    const tabs = Array.from({ length: 5 }, (_, slot) => ({ id: `t${slot}`, title: 'x'.repeat(60), content: '' }))
    tabs[index] = { id: 'x'.repeat(100), title: 'Limit', content: 'x'.repeat(100000) }
    await assertSucceeds(ref.set({ schemaVersion: 1, ...canvasPayload(canvas('a')), aboutTabs: tabs, revision: 1, updatedAt: timestamp() }))
    await assertFails(ref.update({ aboutTabs: tabs.map((tab, slot) => slot === index ? { ...tab, content: null } : tab), revision: 2, updatedAt: timestamp() }))
    if (index > 0) await assertFails(ref.update({ aboutTabs: tabs.map((tab, slot) => slot === index ? { ...tab, id: tabs[0].id } : tab), revision: 2, updatedAt: timestamp() }))
  })
  it('validates About tabs on update', async () => {
    const db = await createWorkspace('bob', ['b'])
    const ref = db.doc(`${workspace('bob')}/canvases/b`)
    await assertSucceeds(ref.set({ schemaVersion: 1, ...canvasPayload(canvas('b')), revision: 1, updatedAt: timestamp() }))
    const tabs = Array.from({ length: 5 }, (_, index) => ({ id: `t${index}`, title: `Tab ${index}`, content: '' }))
    await assertSucceeds(ref.update({ aboutTabs: tabs, revision: 2, updatedAt: timestamp() }))
    await assertFails(ref.update({ aboutTabs: [...tabs, { id: 't5', title: 'Tab 5', content: '' }], revision: 3, updatedAt: timestamp() }))
    await assertFails(ref.update({ aboutTabs: 'Goals', revision: 3, updatedAt: timestamp() }))
    await assertSucceeds(ref.update({ aboutTabs: [], revision: 3, updatedAt: timestamp() }))
    await assertSucceeds(ref.update({ aboutTabs: firebase.firestore.FieldValue.delete(), revision: 4, updatedAt: timestamp() }))
  })
})
