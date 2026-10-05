// Synthetic data only; shared by the migration's Node unit and emulator tests.
import { target } from './schema.mjs'
export const config = { project: 'demo-canvas-uuid', database: '(default)', uid: 'migration-test-user', workspace: 'default' }
export const oldId = 'harness-123'
export const keptId = '12345678-1234-4234-8234-123456789abc'
export const newId = 'abcdef01-1234-4567-8123-abcdef012345'
export const time = '2026-01-01T00:00:00.123456Z'
export const nextTime = '2026-01-01T00:01:00.456789Z'
export function value(v) {
  if (typeof v === 'string') return { stringValue: v }
  if (typeof v === 'boolean') return { booleanValue: v }
  if (typeof v === 'number' || typeof v === 'bigint') return { integerValue: String(v) }
  if (Array.isArray(v)) return { arrayValue: { values: v.map(value) } }
  return { mapValue: { fields: fields(v) } }
}
export const fields = (v) => Object.fromEntries(Object.entries(v).map(([k, v]) => [k, value(v)]))
export function fixture({ board = true } = {}) {
  const root = target(config)
  const canvas = { name: 'Latest name', title: 'Current title', favorite: false, notes: `literal ${oldId} is not a reference`, sections: ['problem', 'alternatives', 'solution', 'metrics', 'value', 'concept', 'advantage', 'channels', 'segments', 'adopters', 'cost', 'revenue'].map((id) => ({ id, title: 'Title', hint: '', cards: ['Content'], number: 1 })) }
  const doc = (path, payload) => ({ name: root + path, fields: { ...fields(payload), updatedAt: { timestampValue: time } }, createTime: time, updateTime: time })
  const documents = [
    doc('', { schemaVersion: 2, orderRevision: 16, canvasOrder: [oldId, keptId], canvases: [{ ...canvas, id: oldId, title: 'STALE historical title' }] }),
    doc(`/canvases/${oldId}`, { ...canvas, schemaVersion: 1, revision: 7, legacyId: oldId }),
    doc(`/canvases/${keptId}`, { ...canvas, schemaVersion: 1, revision: 2 }),
  ]
  const path = `/canvases/${oldId}/boards/default`
  if (board) documents.push(
    doc(path, { schemaVersion: 1, canvasId: oldId, revision: 42, columns: [{ id: 'todo', title: 'Todo' }], status: 'active', importId: 'historical-import', deletingCardId: '' }),
    doc(`${path}/cards/ticket-7`, { schemaVersion: 1, canvasId: oldId, columnId: 'todo', title: 'Ticket', description: 'Unchanged', rank: 'a' }),
    doc(`${path}/comments/comment-9`, { schemaVersion: 1, canvasId: oldId, cardId: 'ticket-7', authorId: config.uid, authorName: 'Test User', text: 'Preserve', createdAt: time }),
  )
  return { readTime: time, documents }
}
export class FakeClient {
  constructor(snapshot) { this.target = config; this.live = globalThis.structuredClone(snapshot); this.commits = 0 }
  async snapshot() { return globalThis.structuredClone(this.live) }
  async commit(writes) {
    this.commits++
    this.beforeCommit?.()
    const docs = new Map(this.live.documents.map((d) => [d.name, d]))
    for (const write of writes) {
      const current = docs.get(write.delete ?? write.update.name)
      const pre = write.currentDocument
      if (pre.exists === false && current || pre.updateTime && current?.updateTime !== pre.updateTime) throw new Error('FAILED_PRECONDITION')
    }
    for (const write of writes) {
      if (write.delete) docs.delete(write.delete)
      else {
        const doc = globalThis.structuredClone(write.update)
        doc.createTime = docs.get(doc.name)?.createTime ?? nextTime
        doc.updateTime = nextTime
        if (write.updateTransforms) doc.fields.updatedAt = { timestampValue: '2026-01-01T00:01:00.456Z' }
        docs.set(doc.name, doc)
      }
    }
    this.live = { readTime: nextTime, documents: [...docs.values()] }
    this.afterCommit?.()
    if (this.loseResponse) throw new Error('Synthetic network loss')
  }
}
