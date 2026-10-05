// Opt-in LOCAL demo-project only. Never accepts a real project or cloud endpoint.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import process from 'node:process'
import { randomUUID } from 'node:crypto'
import { FirestoreRest } from './rest.mjs'
import { target } from './schema.mjs'
import { createPlan, buildWrites, applyPlan, classifyLive } from './plan.mjs'
import { config, fixture, newId, oldId, keptId } from './fixtures.mjs'
const host = process.env.FIRESTORE_EMULATOR_HOST
const options = { skip: !host }
async function seeded(board, customize = () => {}) {
  assert.match(host, /^(127\.0\.0\.1|localhost):8080$/)
  const localConfig = { ...config, uid: `test-${randomUUID()}` }
  const localFetch = (url, init) => {
    assert.equal(url.origin, 'https://firestore.googleapis.com')
    const local = new globalThis.URL(url)
    local.protocol = 'http:'; local.host = host
    // Emulator 1.22.0 rejects valid listDocuments readTime timestamps. These tests
    // exercise commit semantics, not snapshot isolation; production never omits it.
    local.searchParams.delete('readTime')
    return globalThis.fetch(local, init)
  }
  const client = new FirestoreRest(localConfig, 'owner', localFetch)
  const source = fixture({ board })
  customize(source)
  await client.commit(source.documents.map((d) => ({ update: { name: d.name.replace(target(config), target(localConfig)), fields: d.fields }, currentDocument: { exists: false } })))
  return client
}

test('emulator: full atomic move, typed payload readback and idempotent retry', options, async () => {
  const client = await seeded(true)
  const plan = createPlan(client.target, await client.snapshot(), () => newId)
  assert.equal(await applyPlan(client, plan), 'applied-verified')
  assert.equal(classifyLive(plan, await client.snapshot()), 'after')
  assert.equal(await applyPlan(client, plan), 'already-applied')
})

test('emulator: deleted history and nullable storyPoints survive without changing UUID subtrees', options, async () => {
  const client = await seeded(true, (source) => {
    const historical = globalThis.structuredClone(source.documents[0].fields.canvases.arrayValue.values[0])
    historical.mapValue.fields.id.stringValue = 'deleted-project'
    source.documents[0].fields.canvases.arrayValue.values.push(historical)
    source.documents[4].fields.storyPoints = { nullValue: null }
    const card = source.documents[4]
    for (const n of [1, 3, 5, 8, 13]) for (const type of ['integerValue', 'doubleValue']) {
      const copy = globalThis.structuredClone(card)
      copy.name += `-${type}-${n}`
      copy.fields.storyPoints = { [type]: type === 'integerValue' ? String(n) : n }
      source.documents.push(copy)
    }
    source.documents.push(...source.documents.slice(3).map((d) => {
      const copy = globalThis.structuredClone(d)
      copy.name = copy.name.replace(`/canvases/${oldId}/`, `/canvases/${keptId}/`)
      copy.fields.canvasId.stringValue = keptId
      return copy
    }))
  })
  const plan = createPlan(client.target, await client.snapshot(), () => newId)
  assert.equal(await applyPlan(client, plan), 'applied-verified')
  const live = await client.snapshot()
  assert.equal(classifyLive(plan, live), 'after')
  assert.ok(!live.documents.some((d) => d.name.includes('/canvases/deleted-project')))
  assert.equal(await applyPlan(client, createPlan(client.target, live)), 'no-op')
})

test('emulator: exists:false delete guard accepts absent board and rejects concurrent creation atomically', options, async () => {
  const success = await seeded(false)
  const successPlan = createPlan(success.target, await success.snapshot(), () => newId)
  assert.equal(await applyPlan(success, successPlan), 'applied-verified')
  const client = await seeded(false)
  const plan = createPlan(client.target, await client.snapshot(), () => newId)
  const root = target(client.target)
  const board = fixture().documents.find((d) => d.name.endsWith('boards/default'))
  await client.commit([{ update: { name: `${root}/canvases/${oldId}/boards/default`, fields: board.fields }, currentDocument: { exists: false } }])
  await assert.rejects(client.commit(buildWrites(plan)), /HTTP (400|409|412)/)
  const live = await client.snapshot()
  assert.equal(live.documents.find((d) => d.name === root).fields.orderRevision.integerValue, '16')
  assert.ok(live.documents.some((d) => d.name === `${root}/canvases/${oldId}`))
  assert.ok(!live.documents.some((d) => d.name === `${root}/canvases/${newId}`))
})

test('emulator: target collision and stale source updateTime reject entire commit', options, async () => {
  for (const collision of [false, true]) {
    const client = await seeded(true)
    const plan = createPlan(client.target, await client.snapshot(), () => newId)
    const root = target(client.target)
    const source = plan.before.documents.find((d) => d.name === `${root}/canvases/${oldId}`)
    await client.commit([{ update: { name: collision ? `${root}/canvases/${newId}` : source.name, fields: { ...source.fields, notes: { stringValue: 'Concurrent edit' } } }, currentDocument: collision ? { exists: false } : { updateTime: source.updateTime } }])
    await assert.rejects(client.commit(buildWrites(plan)), /HTTP (400|409|412)/)
    const response = await client.request(`${client.database}/documents:batchGet`, { documents: [root, source.name, `${root}/canvases/${newId}`] })
    assert.equal(response.find((r) => r.found?.name === root).found.fields.orderRevision.integerValue, '16')
    assert.ok(response.some((r) => r.found?.name === source.name))
    if (!collision) assert.ok(response.some((r) => r.missing === `${root}/canvases/${newId}`))
  }
})
