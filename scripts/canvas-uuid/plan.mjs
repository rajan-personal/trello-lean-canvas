import { randomUUID, createHash } from 'node:crypto'
import { Buffer } from 'node:buffer'
import { check, equal, isUuid, keys, target, validateSnapshot } from './schema.mjs'

export const MAX_WRITES = 400
export const MAX_COMMIT_BYTES = 8 * 1024 * 1024
export const MAX_PLAN_BYTES = 32 * 1024 * 1024
const canonical = (v) => Array.isArray(v) ? v.map(canonical) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canonical(v[k])])) : v
const hash = (v) => createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex')
export const ordered = (docs) => [...docs].sort((a, b) => a.name.localeCompare(b.name))
export function createPlan(config, snapshot, uuid = randomUUID) {
  const { workspace } = validateSnapshot(snapshot, config)
  const mapping = Object.fromEntries(workspace.canvasOrder.filter((id) => !isUuid(id)).map((id) => [id, uuid()]))
  const plan = { version: 1, target: config, mapping, before: { ...snapshot, documents: ordered(snapshot.documents) } }
  plan.sha256 = hash(plan)
  validatePlan(plan, config)
  return plan
}
export function validatePlan(plan, config) {
  keys(plan, ['version', 'target', 'mapping', 'before', 'sha256'])
  target(config)
  check(plan.version === 1 && equal(plan.target, config), 'Plan target/version mismatch')
  const { sha256, ...body } = plan
  check(sha256 === hash(body), 'Plan integrity mismatch; do not edit the backup')
  const { workspace } = validateSnapshot(plan.before, config)
  keys(plan.mapping, workspace.canvasOrder.filter((id) => !isUuid(id)))
  const destinations = Object.values(plan.mapping)
  check(destinations.every(isUuid) && new Set(destinations).size === destinations.length && destinations.every((id) => !workspace.canvasOrder.includes(id)), 'Invalid/colliding UUID mapping')
  check(Buffer.byteLength(JSON.stringify(plan)) <= MAX_PLAN_BYTES, 'Plan exceeds safety limit')
  buildWrites(plan)
  return plan
}
export function expectedDocuments(plan) {
  const root = target(plan.target)
  return ordered(plan.before.documents.map((source) => {
    const doc = globalThis.structuredClone(source)
    if (doc.name === root) {
      if (Object.keys(plan.mapping).length === 0) return doc
      const fields = doc.fields
      fields.canvasOrder.arrayValue.values = fields.canvasOrder.arrayValue.values.map((v) => ({ stringValue: plan.mapping[v.stringValue] ?? v.stringValue }))
      for (const v of fields.canvases?.arrayValue.values ?? []) {
        const id = v.mapValue.fields.id.stringValue
        if (Object.hasOwn(plan.mapping, id)) v.mapValue.fields.id.stringValue = plan.mapping[id]
      }
      fields.orderRevision.integerValue = String(BigInt(fields.orderRevision.integerValue) + 1n)
      // Supplied atomically by REQUEST_TIME. Verification permits only this field to vary.
      delete fields.updatedAt
    } else {
      const parts = doc.name.slice(root.length + 1).split('/')
      if (Object.hasOwn(plan.mapping, parts[1])) {
        parts[1] = plan.mapping[parts[1]]
        doc.name = `${root}/${parts.join('/')}`
        if (parts.length > 2) doc.fields.canvasId.stringValue = parts[1]
      }
    }
    return doc
  }))
}
export function buildWrites(plan) {
  if (Object.keys(plan.mapping).length === 0) return []
  const root = target(plan.target)
  const sources = new Map(plan.before.documents.map((doc) => [doc.name, doc]))
  const expected = expectedDocuments(plan)
  const workspace = expected.find((doc) => doc.name === root)
  const writes = [{ update: { name: root, fields: workspace.fields }, currentDocument: { updateTime: sources.get(root).updateTime }, updateTransforms: [{ fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' }] }]
  for (const [oldId, newId] of Object.entries(plan.mapping)) {
    const oldPath = `${root}/canvases/${oldId}`
    const newPath = `${root}/canvases/${newId}`
    for (const source of sources.values()) {
      if (source.name !== oldPath && !source.name.startsWith(`${oldPath}/`)) continue
      const name = newPath + source.name.slice(oldPath.length)
      writes.push({ update: { name, fields: expected.find((doc) => doc.name === name).fields }, currentDocument: { exists: false } })
      writes.push({ delete: source.name, currentDocument: { updateTime: source.updateTime } })
    }
    // Guard initialization after snapshot when this canvas has no board yet.
    if (!sources.has(`${oldPath}/boards/default`)) writes.push({ delete: `${oldPath}/boards/default`, currentDocument: { exists: false } })
  }
  check(writes.length <= MAX_WRITES, 'Atomic write safety limit exceeded; do not split the migration')
  check(Buffer.byteLength(JSON.stringify({ writes })) <= MAX_COMMIT_BYTES, 'Atomic payload safety limit exceeded; do not split the migration')
  return writes
}
export function classifyLive(plan, live) {
  validateSnapshot(live, plan.target)
  const current = ordered(live.documents)
  if (equal(current, ordered(plan.before.documents))) return 'before'
  const expected = expectedDocuments(plan)
  const root = target(plan.target)
  const old = new Map(plan.before.documents.map((d) => [d.name, d]))
  if (current.length !== expected.length) return 'drift'
  for (let i = 0; i < current.length; i++) {
    const actual = current[i], wanted = expected[i]
    if (actual.name !== wanted.name) return 'drift'
    if (old.has(actual.name) && actual.name !== root) {
      if (!equal(actual, old.get(actual.name))) return 'drift'
    } else if (actual.name === root) {
      const { updatedAt, ...fields } = actual.fields
      if (!equal(fields, wanted.fields) || !updatedAt?.timestampValue || Date.parse(updatedAt.timestampValue) < Date.parse(plan.before.readTime) || Date.parse(updatedAt.timestampValue) > Date.parse(actual.updateTime) || actual.createTime !== old.get(root).createTime || actual.updateTime === old.get(root).updateTime) return 'drift'
    } else if (!equal(actual.fields, wanted.fields)) return 'drift'
  }
  return 'after'
}
export async function applyPlan(client, plan) {
  validatePlan(plan, client.target)
  const state = classifyLive(plan, await client.snapshot())
  check(state !== 'drift', 'Live state differs from both planned source and verified result; STOP')
  if (state === 'after') return 'already-applied'
  const writes = buildWrites(plan)
  if (!writes.length) return 'no-op'
  let failed = false
  try { await client.commit(writes) } catch { failed = true }
  // Never resubmit in this invocation, including a lost commit response.
  let after
  try { after = classifyLive(plan, await client.snapshot()) } catch { throw new Error('Commit outcome unverified; STOP and rerun the SAME plan for verification') }
  if (after === 'after') return failed ? 'applied-verified-after-error' : 'applied-verified'
  if (after === 'before' && failed) throw new Error('Commit did not take effect; retain SAME plan and investigate before retry')
  throw new Error('Post-commit verification mismatch; STOP all writers and retain backup')
}
