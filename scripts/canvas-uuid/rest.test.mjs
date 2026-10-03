import { test } from 'node:test'
import assert from 'node:assert/strict'
import { FirestoreRest } from './rest.mjs'
import { config, fixture, time } from './fixtures.mjs'
import { target } from './schema.mjs'

function fakeRest(snapshot, requests, alter = () => {}) {
  return async (url, options) => {
    const resource = decodeURIComponent(url.pathname.slice(4))
    const body = options.body ? JSON.parse(options.body) : undefined
    requests.push({ resource, options, body, query: Object.fromEntries(url.searchParams) })
    let result
    if (resource.endsWith(':batchGet')) result = [{ found: snapshot.documents[0], readTime: time }]
    else if (resource.endsWith(':listCollectionIds')) {
      const parent = resource.slice(0, -':listCollectionIds'.length)
      const collectionIds = [...new Set(snapshot.documents.filter((d) => d.name.startsWith(`${parent}/`)).map((d) => d.name.slice(parent.length + 1).split('/')[0]))]
      // Force collection pagination at the board (cards then comments).
      result = body.pageToken ? { collectionIds: collectionIds.slice(1) } : { collectionIds: collectionIds.slice(0, 1), ...(collectionIds.length > 1 ? { nextPageToken: 'next' } : {}) }
    } else {
      const docs = snapshot.documents.filter((d) => d.name.startsWith(`${resource}/`) && !d.name.slice(resource.length + 1).includes('/'))
      result = url.searchParams.has('pageToken') ? { documents: docs.slice(1) } : { documents: docs.slice(0, 1), ...(docs.length > 1 ? { nextPageToken: 'next' } : {}) }
    }
    alter(result, resource)
    return new globalThis.Response(JSON.stringify(result), { status: 200 })
  }
}

test('REST enumerates all nested docs and leaf collections with one fixed readTime and pagination', async () => {
  const requests = [], snapshot = fixture()
  const client = new FirestoreRest(config, 'synthetic-test-token', fakeRest(snapshot, requests))
  const actual = await client.snapshot()
  assert.deepEqual(new Set(actual.documents.map((d) => d.name)), new Set(snapshot.documents.map((d) => d.name)))
  for (const r of requests) {
    assert.equal(r.options.headers.Authorization, 'Bearer synthetic-test-token')
    assert.equal(r.options.redirect, 'error')
    if (!r.resource.endsWith(':batchGet')) assert.equal(r.body?.readTime ?? r.query.readTime, time)
    if (!r.body) assert.equal(r.query.showMissing, 'true')
  }
  assert.ok(requests.some((r) => r.resource.endsWith('comment-9:listCollectionIds')))
  assert.ok(requests.some((r) => r.query.pageToken === 'next'))
  assert.ok(requests.some((r) => r.body?.pageToken === 'next'))
})

test('unknown collections, including below leaf and orphan targets, abort discovery', async () => {
  for (const mutate of [
    (result, resource) => { if (resource.endsWith('comment-9:listCollectionIds')) result.collectionIds = ['attachments'] },
    (result, resource) => { if (resource === `${target(config)}/canvases`) result.documents.push({ name: `${resource}/orphan` }) },
    (result, resource) => { if (resource.endsWith(':listCollectionIds')) result.collectionIds = ['unknown'] },
  ]) {
    const client = new FirestoreRest(config, 'synthetic-test-token', fakeRest(fixture(), [], mutate))
    await assert.rejects(client.snapshot(), /Unknown|orphan/)
  }
})

test('REST sends documents:commit, never batchWrite; sensitive errors redacted', async () => {
  const writes = [{ delete: `${target(config)}/canvases/synthetic`, currentDocument: { exists: false } }]
  const client = new FirestoreRest(config, 'synthetic-test-token', async (url, options) => {
    assert.ok(url.pathname.endsWith('/documents:commit'))
    assert.deepEqual(JSON.parse(options.body), { writes })
    return new globalThis.Response('{"private":"SECRET DOCUMENT AND TOKEN"}', { status: 403 })
  })
  await assert.rejects(client.commit(writes), (e) => e.message === 'Firestore HTTP 403; response content redacted')
  const failed = new FirestoreRest(config, 'synthetic-test-token', async () => { throw new Error('SECRET') })
  await assert.rejects(failed.snapshot(), (e) => !e.message.includes('SECRET'))
})
