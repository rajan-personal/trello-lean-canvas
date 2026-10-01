import { assertFails } from '@firebase/rules-unit-testing'
import { doc, getDoc, serverTimestamp, setDoc, Timestamp, updateDoc } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { boardTestEnvironment } from './board-fixtures'
import { importBoard, mutateBoard, boardPath, prepareBoardDeletion } from '../src/data/board-firestore'
import { createTicketRunClient } from '../src/data/ticket-run-firestore'
import { populatedBoard } from '../unit/board-fixtures'

let test: Awaited<ReturnType<typeof boardTestEnvironment>>
const path = boardPath('alice', 'a'), runPath = `${path}/codexRuns/card-a`
const card = populatedBoard().cards[0]
const firstId = 'e45b8e81-5c0a-4a5c-9ea7-e42834e6c2a2'
const secondId = 'c5a836ff-692a-4312-930b-ab038293de27'
const trustedWrite = (target: string, data: object) => test.environment.withSecurityRulesDisabled(async (context) => {
  await context.firestore().doc(target).set(data, { merge: true })
})
const ready = (expiresAt = Date.now() + 60000) => trustedWrite(`${path}/integrations/codex`, {
  enabled: true, expiresAt: Timestamp.fromMillis(expiresAt),
})
beforeAll(async () => { test = await boardTestEnvironment('lean-ticket-runs-test') })
beforeEach(async () => {
  await test.seed(); await importBoard(test.db, 'alice', 'a', populatedBoard(), 'runs'); await ready()
})
afterAll(async () => { await test.cleanup() })
describe('Codex run requests', () => {
  it('queues one immutable snapshot across concurrent starts and acknowledgement retries', async () => {
    const client = createTicketRunClient(test.db, 'alice', 'a')
    await Promise.all([client.request(card, firstId), client.request(card, secondId)])
    const stored = (await getDoc(doc(test.db, runPath))).data()!
    expect(stored).toMatchObject({ status: 'queued', title: card.title, description: card.description, requestedBy: 'alice' })
    await client.request(card, stored.runId)
    expect((await getDoc(doc(test.db, runPath))).data()).toEqual(stored)
    await trustedWrite(runPath, { status: 'ready_for_review' })
    await client.request(card, stored.runId)
    expect((await getDoc(doc(test.db, runPath))).data()?.status).toBe('ready_for_review')
    await client.request(card, stored.runId === firstId ? secondId : firstId)
    expect((await getDoc(doc(test.db, runPath))).data()?.status).toBe('queued')
  })
  it('refuses disconnected, expired, changed and deleted tickets', async () => {
    const client = createTicketRunClient(test.db, 'alice', 'a')
    await ready(Date.now() - 1000)
    await expect(client.request(card, firstId)).rejects.toThrow('Connect Lean')
    await ready()
    await expect(client.request({ ...card, title: 'Unsaved title' }, firstId)).rejects.toThrow('changed')
    await mutateBoard(test.db, 'alice', 'a', { type: 'delete-card', id: card.id })
    await expect(client.request(card, firstId)).rejects.toThrow('unavailable')
  })
  it('enforces ownership and disallows client-written progress, secrets and forged snapshots', async () => {
    const ref = doc(test.db, runPath)
    await createTicketRunClient(test.db, 'alice', 'a').request(card, firstId)
    const stored = (await getDoc(ref)).data()!
    await assertFails(setDoc(ref, { ...stored, status: 'ready_for_review' }))
    await assertFails(setDoc(doc(test.db, `${path}/integrations/codex`), { enabled: true, expiresAt: Timestamp.fromMillis(Date.now() + 60000) }))
    await assertFails(test.environment.authenticatedContext('bob').firestore().doc(runPath).get())
    await assertFails(test.environment.unauthenticatedContext().firestore().doc(runPath).get())
    await trustedWrite(runPath, { status: 'failed' })
    for (const extra of [{ title: 'Forged' }, { requestedBy: 'bob' }, { callbackSecret: 'secret' }]) {
      await assertFails(setDoc(ref, { ...stored, runId: secondId, ...extra, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }))
    }
    await ready(Date.now() - 1000)
    await assertFails(setDoc(ref, { ...stored, runId: secondId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }))
  })
  it('requests a stop once, fences old requests and waits for trusted confirmation', async () => {
    const client = createTicketRunClient(test.db, 'alice', 'a'), ref = doc(test.db, runPath)
    await client.request(card, firstId)
    await expect(client.requestStop(card.id, secondId)).rejects.toThrow('changed')
    await assertFails(updateDoc(ref, { stopRequestedAt: serverTimestamp(), runId: secondId }))
    await assertFails(test.environment.authenticatedContext('bob').firestore().doc(runPath).update({ stopRequestedAt: Timestamp.now() }))
    await client.requestStop(card.id, firstId)
    const stopped = (await getDoc(ref)).data()!
    expect(stopped.stopRequestedAt).toBeInstanceOf(Timestamp)
    await client.requestStop(card.id, firstId)
    expect((await getDoc(ref)).data()).toEqual(stopped)
    await client.request(card, secondId)
    expect((await getDoc(ref)).data()?.runId).toBe(firstId)
    await assertFails(updateDoc(ref, { status: 'cancelled' }))
    await assertFails(updateDoc(ref, { stopRequestedAt: serverTimestamp() }))
    await trustedWrite(runPath, { status: 'cancelled' })
    await client.request(card, secondId)
    expect((await getDoc(ref)).data()).toMatchObject({ runId: secondId, status: 'queued' })
    expect((await getDoc(ref)).data()).not.toHaveProperty('stopRequestedAt')
  })
  it('receives trusted MCP updates live and cleans run data up on deletion', async () => {
    const client = createTicketRunClient(test.db, 'alice', 'a')
    await client.request(card, firstId)
    let status = ''
    const stop = client.subscribe(card.id, (view) => { status = view.run?.status ?? '' }, () => { throw new Error('Listener failed') })
    await trustedWrite(runPath, { status: 'running', message: 'Testing', updatedAt: Timestamp.now() })
    await expect.poll(() => status).toBe('running'); stop()
    await mutateBoard(test.db, 'alice', 'a', { type: 'delete-card', id: card.id })
    expect((await getDoc(doc(test.db, runPath))).exists()).toBe(false)
    await prepareBoardDeletion(test.db, 'alice', 'a')
    expect((await getDoc(doc(test.db, `${path}/integrations/codex`))).exists()).toBe(false)
  })
})
