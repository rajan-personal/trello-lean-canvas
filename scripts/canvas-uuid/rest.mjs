import { Buffer } from 'node:buffer'
import { check, target, allowedCollections, validateSnapshot } from './schema.mjs'
import { MAX_PLAN_BYTES, ordered } from './plan.mjs'

// IAM OAuth bearer token stays only in memory. No endpoint override in the production CLI.
export class FirestoreRest {
  constructor(config, token, fetchImpl = globalThis.fetch) {
    this.target = config
    this.root = target(config)
    this.database = this.root.split('/documents/')[0]
    check(typeof token === 'string' && token.length > 0 && token.length < 16384 && !/\s/.test(token), 'Invalid access token on stdin')
    this.token = token
    this.fetch = fetchImpl
  }
  async request(resource, body, query) {
    const url = new globalThis.URL(`https://firestore.googleapis.com/v1/${resource.split('/').map(encodeURIComponent).join('/').replace(/%3A/g, ':')}`)
    if (query) for (const [k, v] of Object.entries(query)) if (v !== undefined) url.searchParams.set(k, String(v))
    let response
    try {
      response = await this.fetch(url, { method: body === undefined ? 'GET' : 'POST', headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: globalThis.AbortSignal.timeout(30000), redirect: 'error' })
    } catch { throw new Error('Firestore request failed; response may be ambiguous for commit') }
    if (!response.ok) {
      await response.body?.cancel()
      throw new Error(`Firestore HTTP ${response.status}; response content redacted`)
    }
    let size = 0
    const chunks = []
    for await (const chunk of response.body) {
      size += chunk.length
      check(size <= MAX_PLAN_BYTES, 'REST response exceeds safety limit')
      chunks.push(chunk)
    }
    try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) } catch { throw new Error('Invalid REST JSON response') }
  }
  async snapshot() {
    const response = await this.request(`${this.database}/documents:batchGet`, { documents: [this.root] })
    check(Array.isArray(response) && response.length === 1 && response[0].found?.name === this.root && typeof response[0].readTime === 'string', 'Workspace missing or invalid snapshot response')
    const { readTime } = response[0]
    const documents = [response[0].found]
    let requests = 0
    let total = Buffer.byteLength(JSON.stringify(documents))
    const walk = async (parent) => {
      const relative = parent === this.root ? '' : parent.slice(this.root.length + 1)
      const allowed = allowedCollections(relative)
      let pageToken
      const seenPages = new Set(), collections = new Set()
      do {
        check(++requests <= 3000, 'Enumeration request limit exceeded')
        const page = await this.request(`${parent}:listCollectionIds`, { readTime, pageSize: 100, ...(pageToken ? { pageToken } : {}) })
        check(page.collectionIds === undefined || Array.isArray(page.collectionIds))
        for (const collection of page.collectionIds ?? []) {
          check(allowed.includes(collection) && !collections.has(collection), 'Unknown/duplicate descendant collection; STOP')
          collections.add(collection)
        }
        pageToken = page.nextPageToken
        check(!pageToken || typeof pageToken === 'string' && !seenPages.has(pageToken)); seenPages.add(pageToken)
      } while (pageToken)
      for (const collection of [...collections].sort()) {
        pageToken = undefined
        const seen = new Set()
        do {
          check(++requests <= 3000, 'Enumeration request limit exceeded')
          const page = await this.request(`${parent}/${collection}`, undefined, { readTime, showMissing: true, pageSize: 100, pageToken })
          check(page.documents === undefined || Array.isArray(page.documents))
          for (const doc of page.documents ?? []) {
            check(typeof doc.name === 'string' && doc.name.startsWith(`${parent}/${collection}/`) && !doc.name.slice(`${parent}/${collection}/`.length).includes('/'), 'Invalid enumerated document path')
            check(doc.fields && doc.updateTime && doc.createTime, 'Missing ancestor with orphan descendants; STOP')
            documents.push(doc)
            total += Buffer.byteLength(JSON.stringify(doc))
            check(documents.length <= 1000 && total <= MAX_PLAN_BYTES, 'Snapshot safety limit exceeded')
            await walk(doc.name)
          }
          pageToken = page.nextPageToken
          check(!pageToken || typeof pageToken === 'string' && !seen.has(pageToken)); seen.add(pageToken)
        } while (pageToken)
      }
    }
    await walk(this.root)
    const snapshot = { readTime, documents: ordered(documents) }
    validateSnapshot(snapshot, this.target)
    return snapshot
  }
  async commit(writes) { return this.request(`${this.database}/documents:commit`, { writes }) }
}
