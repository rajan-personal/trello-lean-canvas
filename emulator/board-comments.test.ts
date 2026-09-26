import { execFileSync } from 'node:child_process'
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import { deleteApp, initializeApp } from 'firebase/app'
import { connectFirestoreEmulator, doc, getFirestore, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { boardTestEnvironment } from './board-fixtures'
import { importBoard, mutateBoard, readBoard, boardPath } from '../src/data/board-firestore'
import { childPayload } from '../src/data/board-firestore-model'
import { comment, populatedBoard } from '../unit/board-fixtures'
import { postAgentComment } from '../scripts/comment-agent'

const project = 'lean-comments-test'
const claims = { sub: 'review-agent', leanRole: 'commenter', leanOwnerId: 'alice', leanCanvasId: 'a', leanAgentName: 'Review agent' }
let test: Awaited<ReturnType<typeof boardTestEnvironment>>
const app = initializeApp({ projectId: project }, 'comment-agent')
const agentDb = getFirestore(app)
const host = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080'
connectFirestoreEmulator(agentDb, host.split(':')[0], Number(host.split(':')[1]), { mockUserToken: claims })
const agentComment = (id: string) => ({ ...comment(id), authorId: claims.sub, authorName: claims.leanAgentName, authorType: 'agent' as const })
beforeAll(async () => { test = await boardTestEnvironment(project) })
beforeEach(async () => { await test.seed(); await importBoard(test.db, 'alice', 'a', populatedBoard(), 'comments') })
afterAll(async () => { await deleteApp(app); await test.cleanup() })

describe('task comments', () => {
  it('preserves concurrent user/agent posts and retries exactly once without stale baselines', async () => {
    const baseline = await readBoard(test.db, 'alice', 'a')
    const commands = [
      { db: test.db, value: { ...comment('user-new'), authorType: 'user' as const } },
      { db: agentDb, value: agentComment('agent-new') },
    ]
    const results = await Promise.allSettled(commands.map(({ db, value }) => mutateBoard(db, 'alice', 'a', { type: 'add-comment', comment: value }, baseline)))
    for (const result of results) { if (result.status === 'rejected') throw result.reason }
    const first = await readBoard(test.db, 'alice', 'a')
    expect(first.data.comments).toHaveLength(3)
    await mutateBoard(agentDb, 'alice', 'a', { type: 'add-comment', comment: commands[1].value }, baseline)
    expect(await readBoard(test.db, 'alice', 'a')).toEqual(first)
    await expect(mutateBoard(agentDb, 'alice', 'a', { type: 'add-comment', comment: { ...commands[1].value, text: 'Changed' } }))
      .rejects.toThrow('different content')
  })
  it('restricts agents to their assigned board and disallows task edits or author impersonation', async () => {
    const { sub, ...customClaims } = claims
    const context = test.environment.authenticatedContext(sub, customClaims).firestore()
    await assertSucceeds(context.doc(`${boardPath('alice', 'a')}/cards/card-a`).get())
    await assertFails(context.doc(boardPath('alice', 'b')).get())
    await assertFails(context.doc(boardPath('bob', 'a')).get())
    await assertFails(context.doc('users/alice/workspaces/default').get())
    await assertFails(context.doc(`${boardPath('alice', 'a')}/cards/card-a`).delete())
    await expect(mutateBoard(agentDb, 'alice', 'a', { type: 'rename-column', id: 'backlog', title: 'Attack' })).rejects.toThrow()
    for (const forged of [ { authorId: 'alice' }, { authorType: 'user' as const }, { authorName: 'Someone else' } ]) {
      await expect(mutateBoard(agentDb, 'alice', 'a', { type: 'add-comment', comment: { ...agentComment('forged'), ...forged } })).rejects.toThrow()
    }
    await assertFails(test.environment.authenticatedContext('unprovisioned').firestore().doc(boardPath('alice', 'a')).get())
  })
  it('does not let an agent use the owner-only import path to bypass attribution or revision checks', async () => {
    await test.environment.withSecurityRulesDisabled((context) =>
      context.firestore().doc(boardPath('alice', 'a')).update({ status: 'importing' }))
    const forged = { ...agentComment('import-attack'), authorId: 'alice' }
    await assertFails(setDoc(doc(agentDb, `${boardPath('alice', 'a')}/comments/import-attack`),
      childPayload(forged, 'a')))
    await assertFails(setDoc(doc(agentDb, `${boardPath('alice', 'a')}/comments/import-attack`),
      childPayload(agentComment('import-attack'), 'a')))
  })
  it('rejects malformed comments at the rules boundary, even bypassing client validation', async () => {
    for (const fields of [{ text: ' \n\t ' }, { text: 'a'.repeat(10001) }, { authorType: 'robot' }, { cardId: 'missing' }]) {
      const snapshot = await readBoard(test.db, 'alice', 'a')
      const batch = writeBatch(test.db)
      const path = boardPath('alice', 'a')
      batch.update(doc(test.db, path), { revision: snapshot.revision + 1, updatedAt: serverTimestamp() })
      batch.set(doc(test.db, `${path}/comments/invalid`), childPayload({ ...comment('invalid'), ...fields }, 'a'))
      await assertFails(batch.commit())
    }
  })
  it('posts via the real REST agent tool and safely repeats the same id', async () => {
    const now = Math.floor(Date.now() / 1000)
    const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url')
    const token = `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ ...claims, aud: project,
      iss: `https://securetoken.google.com/${project}`, iat: now, exp: now + 3600,
      auth_time: now, firebase: { sign_in_provider: 'custom', identities: {} } })}.`
    const input = { project, owner: 'alice', canvas: 'a', card: 'card-a', id: 'cli-comment', name: claims.leanAgentName, text: 'Agent via REST\nSecond line' }
    expect(await postAgentComment(input, token, host)).toEqual({ id: input.id, duplicate: false })
    expect(await postAgentComment(input, token, host)).toEqual({ id: input.id, duplicate: true })
    const args = Object.entries(input).filter(([key]) => key !== 'text').flatMap(([key, value]) => [`--${key}`, value])
    const output = execFileSync(process.execPath, ['--experimental-strip-types', 'scripts/comment-agent.ts', ...args], {
      input: input.text, encoding: 'utf8', timeout: 10000,
      env: { ...process.env, FIREBASE_ID_TOKEN: token, FIRESTORE_EMULATOR_HOST: host },
    })
    expect(JSON.parse(output)).toEqual({ id: input.id, duplicate: true })
    const loaded = await readBoard(test.db, 'alice', 'a')
    expect(loaded.data.comments.find(({ id }) => id === input.id)).toMatchObject({ authorType: 'agent', authorId: claims.sub, text: input.text })
    await expect(postAgentComment({ ...input, text: 'different' }, token, host)).rejects.toThrow('different content')
    await expect(postAgentComment({ ...input, owner: 'bob' }, token, host)).rejects.toThrow('403')
  }, 30000)
  it('refuses a deleted card and keeps other task threads intact', async () => {
    await mutateBoard(test.db, 'alice', 'a', { type: 'add-comment', comment: comment('other', 'card-b') })
    await mutateBoard(test.db, 'alice', 'a', { type: 'delete-card', id: 'card-a' })
    await expect(mutateBoard(agentDb, 'alice', 'a', { type: 'add-comment', comment: agentComment('late') })).rejects.toThrow('unavailable')
    expect((await readBoard(test.db, 'alice', 'a')).data.comments.map(({ id }) => id)).toEqual(['other'])
  })
})
