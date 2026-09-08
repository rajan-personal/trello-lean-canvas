import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, chmod, readFile, stat, symlink, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createPlan, validatePlan, buildWrites, classifyLive, applyPlan, expectedDocuments, MAX_COMMIT_BYTES } from './plan.mjs'
import { validateSnapshot, isUuid, target } from './schema.mjs'
import { parseArgs, writePlan, readPlan } from '../migrate-canvas-ids.mjs'
import { config, fixture, oldId, keptId, newId, nextTime, FakeClient } from './fixtures.mjs'
const plan = (snapshot = fixture()) => createPlan(config, snapshot, () => newId)

test('maps only non-UUID IDs and exact board references, never stale content or child IDs', () => {
  const p = plan()
  assert.deepEqual(p.mapping, { [oldId]: newId })
  const before = globalThis.structuredClone(p.before)
  const after = expectedDocuments(p)
  const root = target(config)
  const canvas = after.find((d) => d.name === `${root}/canvases/${newId}`)
  assert.equal(canvas.fields.title.stringValue, 'Current title')
  assert.equal(canvas.fields.revision.integerValue, '7')
  assert.equal(canvas.fields.legacyId.stringValue, oldId)
  assert.equal(canvas.fields.notes.stringValue, `literal ${oldId} is not a reference`)
  assert.deepEqual(canvas.fields.updatedAt, p.before.documents.find((d) => d.name.endsWith(oldId)).fields.updatedAt)
  const workspace = after.find((d) => d.name === root)
  assert.equal(workspace.fields.orderRevision.integerValue, '17')
  assert.deepEqual(workspace.fields.canvasOrder.arrayValue.values.map((v) => v.stringValue), [newId, keptId])
  assert.equal(workspace.fields.canvases.arrayValue.values[0].mapValue.fields.id.stringValue, newId)
  assert.equal(workspace.fields.canvases.arrayValue.values[0].mapValue.fields.title.stringValue, 'STALE historical title')
  assert.deepEqual(after.find((d) => d.name.endsWith(keptId)), before.documents.find((d) => d.name.endsWith(keptId)))
  const comment = after.find((d) => d.name.endsWith('comments/comment-9'))
  assert.equal(comment.fields.canvasId.stringValue, newId)
  assert.equal(comment.fields.cardId.stringValue, 'ticket-7')
  assert.deepEqual(p.before, before)
})

test('deleted historical compatibility entries remain unchanged without resurrecting documents or order', async () => {
  const snapshot = fixture(), root = target(config)
  const historical = globalThis.structuredClone(snapshot.documents[0].fields.canvases.arrayValue.values[0])
  historical.mapValue.fields.id.stringValue = 'deleted-project'
  snapshot.documents[0].fields.canvases.arrayValue.values.push(historical)
  const p = plan(snapshot), client = new FakeClient(snapshot)
  assert.deepEqual(p.mapping, { [oldId]: newId })
  assert.equal(await applyPlan(client, p), 'applied-verified')
  const live = await client.snapshot()
  const workspace = live.documents.find((d) => d.name === root)
  assert.deepEqual(workspace.fields.canvases.arrayValue.values[1], historical)
  assert.equal(workspace.fields.canvases.arrayValue.values[0].mapValue.fields.id.stringValue, newId)
  assert.deepEqual(workspace.fields.canvasOrder.arrayValue.values.map((v) => v.stringValue), [newId, keptId])
  assert.equal(live.documents.length, snapshot.documents.length)
  assert.ok(!live.documents.some((d) => d.name.includes('/canvases/deleted-project')))
  assert.ok(!buildWrites(p).some((w) => (w.delete ?? w.update.name).includes('/canvases/deleted-project')))
  assert.equal(await applyPlan(client, createPlan(config, live)), 'no-op')
})

test('optional nullable storyPoints preserves absent, null and every integer/double estimate, including UUID subtrees', async () => {
  const estimates = [undefined, { nullValue: null }, ...[1, 3, 5, 8, 13].flatMap((n) => [{ integerValue: String(n) }, { doubleValue: n }])]
  const root = target(config), oldPath = `${root}/canvases/${oldId}`, keptPath = `${root}/canvases/${keptId}`
  for (const estimate of estimates) {
    const snapshot = fixture()
    if (estimate !== undefined) snapshot.documents[4].fields.storyPoints = estimate
    const keptSubtree = snapshot.documents.slice(3).map((source) => {
      const doc = globalThis.structuredClone(source)
      doc.name = doc.name.replace(oldPath, keptPath)
      doc.fields.canvasId.stringValue = keptId
      return doc
    })
    snapshot.documents.push(...keptSubtree)
    const before = globalThis.structuredClone(snapshot), p = plan(snapshot), client = new FakeClient(snapshot)
    const movedCard = buildWrites(p).find((w) => w.update?.name.endsWith(`${newId}/boards/default/cards/ticket-7`)).update
    assert.deepEqual(movedCard.fields, { ...snapshot.documents[4].fields, canvasId: { stringValue: newId } })
    assert.ok(!buildWrites(p).some((w) => (w.delete ?? w.update.name).startsWith(keptPath)))
    assert.equal(await applyPlan(client, p), 'applied-verified')
    assert.equal(await applyPlan(client, p), 'already-applied')
    const live = await client.snapshot()
    assert.deepEqual(live.documents.filter((d) => d.name.startsWith(`${keptPath}/`)), keptSubtree)
    const card = live.documents.find((d) => d.name.endsWith(`${newId}/boards/default/cards/ticket-7`))
    assert.deepEqual(card.fields, movedCard.fields)
    assert.equal(Object.hasOwn(card.fields, 'storyPoints'), estimate !== undefined)
    card.fields.storyPoints = { integerValue: estimate?.integerValue === '1' ? '3' : '1' }
    assert.equal(classifyLive(p, live), 'drift')
    assert.deepEqual(snapshot, before)
  }
})

test('storyPoints rejects unsupported estimates and malformed typed values on moved and UUID cards', () => {
  const invalid = [
    ...[-1, 0, 2, 4, 6, 7, 9, 10, 12, 14, 100].flatMap((n) => [{ integerValue: String(n) }, { doubleValue: n }]),
    { doubleValue: 1.5 }, { doubleValue: Number.NaN }, { doubleValue: Infinity },
    { integerValue: '1.0' }, { integerValue: 1 }, { doubleValue: '1' },
    { stringValue: '1' }, { booleanValue: false }, { nullValue: false },
    { arrayValue: {} }, { mapValue: {} }, { nullValue: null, integerValue: '1' },
  ]
  for (const estimate of invalid) for (const id of [oldId, keptId]) {
    const snapshot = fixture()
    snapshot.documents[4].fields.storyPoints = estimate
    if (id === keptId) for (const doc of snapshot.documents.slice(3)) {
      doc.name = doc.name.replace(`/canvases/${oldId}/`, `/canvases/${keptId}/`)
      doc.fields.canvasId.stringValue = keptId
    }
    assert.throws(() => plan(snapshot))
  }
})

test('UUID forms preserved; mapping generated once, validates target and integrity', () => {
  for (const id of [keptId, keptId.toUpperCase(), '00000000-0000-0000-0000-000000000000']) assert.ok(isUuid(id))
  let calls = 0
  const p = createPlan(config, fixture(), () => { calls++; return newId })
  validatePlan(JSON.parse(JSON.stringify(p)), config)
  assert.equal(calls, 1)
  for (const field of ['project', 'database', 'uid', 'workspace']) assert.throws(() => validatePlan(p, { ...config, [field]: 'different' }))
  const edited = globalThis.structuredClone(p); edited.mapping[oldId] = keptId
  assert.throws(() => validatePlan(edited, config), /integrity/)
  assert.throws(() => createPlan(config, fixture(), () => keptId), /colliding/)
  assert.throws(() => createPlan(config, fixture(), () => 'not-a-uuid'), /mapping/)
})

test('every move has create-only target and source version precondition; missing board guarded', () => {
  const p = plan(), writes = buildWrites(p)
  assert.equal(writes.length, 9)
  assert.equal(writes[0].currentDocument.updateTime, p.before.documents[0].updateTime)
  assert.deepEqual(writes[0].updateTransforms, [{ fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' }])
  for (const w of writes.slice(1)) assert.deepEqual(w.currentDocument, w.delete ? { updateTime: p.before.documents.find((d) => d.name === w.delete).updateTime } : { exists: false })
  const guard = buildWrites(plan(fixture({ board: false }))).find((w) => w.delete?.endsWith('boards/default'))
  assert.deepEqual(guard.currentDocument, { exists: false })
})

test('apply, successful retry and ambiguous response verify without duplicate commit', async () => {
  for (const loseResponse of [false, true]) {
    const client = new FakeClient(fixture()); client.loseResponse = loseResponse
    const p = plan()
    assert.match(await applyPlan(client, p), /^applied/)
    assert.equal(classifyLive(p, await client.snapshot()), 'after')
    assert.equal(await applyPlan(client, p), 'already-applied')
    assert.equal(client.commits, 1)
    const fresh = createPlan(config, await client.snapshot())
    assert.deepEqual(fresh.mapping, {})
    assert.deepEqual(buildWrites(fresh), [])
    assert.equal(await applyPlan(client, fresh), 'no-op')
    assert.equal(client.commits, 1)
  }
})

test('drift before apply aborts without a write', async () => {
  for (const suffix of ['', `/canvases/${oldId}`, `/canvases/${oldId}/boards/default/cards/ticket-7`]) {
    const client = new FakeClient(fixture())
    client.live.documents.find((d) => d.name === target(config) + suffix).updateTime = nextTime
    await assert.rejects(applyPlan(client, plan()), /differs/)
    assert.equal(client.commits, 0)
  }
})

test('late source/board edits, target collision and absent-board initialization fail atomically', async () => {
  for (const kind of ['source', 'board', 'target', 'absent-board']) {
    const initial = fixture({ board: kind !== 'absent-board' }), client = new FakeClient(initial), p = plan(initial)
    client.beforeCommit = () => {
      if (kind === 'target') {
        const doc = globalThis.structuredClone(client.live.documents[1]); doc.name = `${target(config)}/canvases/${newId}`; client.live.documents.push(doc)
      } else if (kind === 'absent-board') client.live.documents.push(fixture().documents[3])
      else client.live.documents.find((d) => d.name.endsWith(kind === 'board' ? 'boards/default' : oldId)).updateTime = nextTime
    }
    await assert.rejects(applyPlan(client, p))
    assert.equal(client.commits, 1)
    assert.equal(client.live.documents[0].fields.orderRevision.integerValue, '16')
    assert.ok(client.live.documents.some((d) => d.name.endsWith(`/canvases/${oldId}`)))
  }
})

test('post-commit content, order, old-source reappearance and unchanged-document edits fail verification', async () => {
  const p = plan()
  for (const mutate of [
    (s) => { s.documents.find((d) => d.name.endsWith(`/canvases/${newId}`)).fields.notes.stringValue = 'lost' },
    (s) => { s.documents.find((d) => d.name === target(config)).fields.canvasOrder.arrayValue.values.reverse() },
    (s) => { s.documents.find((d) => d.name.endsWith(keptId)).updateTime = nextTime },
    (s) => { s.documents.push(fixture().documents[1]) },
    (s) => { s.documents = s.documents.filter((d) => !d.name.endsWith('comment-9')) },
  ]) {
    const client = new FakeClient(fixture()); client.afterCommit = () => mutate(client.live)
    await assert.rejects(applyPlan(client, p), /verification|unverified/)
  }
})

test('malformed, unknown descendants/fields/references and in-progress operations fail closed', () => {
  for (const mutate of [
    (s) => { s.documents[0].fields.canvasOrder.arrayValue.values.push({ stringValue: oldId }) },
    (s) => { s.documents[0].fields.schemaVersion.integerValue = '1' },
    (s) => { s.documents[1].fields.reference = { referenceValue: target(config) } },
    (s) => { s.documents[1].fields.notes = { referenceValue: target(config) } },
    (s) => { s.documents[1].fields.revision.integerValue = '2.5' },
    (s) => { s.documents[1].fields.updatedAt.timestampValue = 'not-a-timestamp' },
    (s) => { s.documents[3].name = s.documents[3].name.replace('boards/default', 'boards/unknown') },
    (s) => { s.documents[5].fields.cardId.stringValue = 'missing' },
    (s) => { s.documents[4].fields.canvasId.stringValue = keptId },
    (s) => { s.documents.splice(1, 1) },
    (s) => { s.documents[5].name += '/unknown/child' },
    ...['importing', 'deleting', 'deleting-card'].map((status) => (s) => { s.documents[3].fields.status.stringValue = status }),
  ]) { const s = fixture(); mutate(s); assert.throws(() => validateSnapshot(s, config)) }
  assert.throws(() => createPlan(config, {}))
})

test('bounded atomic write count and payload, never chunked', () => {
  const many = fixture()
  for (let i = 0; i < 200; i++) { const doc = globalThis.structuredClone(many.documents[4]); doc.name += `-${i}`; many.documents.push(doc) }
  assert.throws(() => plan(many), /write safety limit/)
  const large = fixture(); large.documents[1].fields.notes.stringValue = 'x'.repeat(MAX_COMMIT_BYTES)
  assert.throws(() => plan(large), /payload safety limit/)
})

test('CLI requires exact explicit target, stdin, private backup and paused-writer attestation', () => {
  const args = ['--project', config.project, '--uid', config.uid, '--plan', '/tmp/private/plan.json', '--access-token-stdin']
  assert.equal(parseArgs(args).apply, false)
  assert.throws(() => parseArgs([...args, '--apply']), /paused/)
  assert.equal(parseArgs([...args, '--apply', '--confirm-writers-paused']).apply, true)
  for (const extra of [['--token', 'secret'], ['--workspace', 'other'], ['--project', 'other'], ['--unknown']]) assert.throws(() => parseArgs([...args, ...extra]))
  assert.throws(() => parseArgs(args.slice(2)))
  assert.throws(() => parseArgs(args.slice(0, -1)))
})

test('plan private exclusive durable creation, no overwrite/symlink and integrity read', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'canvas-uuid-test-'))
  try {
    await chmod(dir, 0o700)
    const destination = path.join(dir, 'plan.json'), p = plan()
    await writePlan(destination, p)
    assert.equal((await stat(destination)).mode & 0o777, 0o600)
    assert.deepEqual(await readPlan(destination, config), p)
    const bytes = await readFile(destination)
    await assert.rejects(writePlan(destination, p), /EEXIST/)
    assert.deepEqual(await readFile(destination), bytes)
    const link = path.join(dir, 'link.json'); await symlink(destination, link)
    await assert.rejects(readPlan(link, config))
    await chmod(destination, 0o644); await assert.rejects(readPlan(destination, config), /private/)
    await chmod(dir, 0o755); await assert.rejects(writePlan(path.join(dir, 'new.json'), p), /private/)
  } finally { await rm(dir, { recursive: true, force: true }) }
})
