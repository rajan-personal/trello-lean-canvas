// Strictly supported persisted schemas; transformations retain the original REST Values.
import { isDeepStrictEqual } from 'node:util'

export function check(condition, message = 'Unsupported or malformed migration data') {
  if (!condition) throw new Error(message)
}
export const equal = isDeepStrictEqual
export const isUuid = (id) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
export const safeId = (id) => typeof id === 'string' && id.length > 0 && id !== '.' && id !== '..' && !id.includes('/') && !/^__.*__$/.test(id) && Buffer.byteLength(id) <= 1500
import { Buffer } from 'node:buffer'
const timestamp = (s) => typeof s === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,9})?Z$/.test(s) && Number.isFinite(Date.parse(s))
const object = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
export function keys(value, required, optional = []) {
  check(object(value) && required.every((k) => Object.hasOwn(value, k)) && Object.keys(value).every((k) => [...required, ...optional].includes(k)))
}
export function decode(value) {
  check(object(value) && Object.keys(value).length === 1)
  const [type] = Object.keys(value)
  const v = value[type]
  switch (type) {
    case 'nullValue': check(v === null); return null
    case 'stringValue': check(typeof v === 'string'); return v
    case 'booleanValue': check(typeof v === 'boolean'); return v
    case 'integerValue': check(typeof v === 'string' && /^-?(0|[1-9]\d*)$/.test(v) && BigInt(v) >= -(2n ** 63n) && BigInt(v) < 2n ** 63n); return BigInt(v)
    case 'doubleValue': check(typeof v === 'number' && Number.isFinite(v)); return v
    case 'timestampValue': check(timestamp(v)); return { timestamp: v }
    case 'arrayValue': keys(v, [], ['values']); check(v.values === undefined || Array.isArray(v.values)); return (v.values ?? []).map(decode)
    case 'mapValue': keys(v, [], ['fields']); return decodeFields(v.fields ?? {})
    default: throw new Error('Unsupported Firestore Value/reference type')
  }
}
function decodeFields(fields) {
  check(object(fields))
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, decode(v)]))
}
const strings = (v, names) => names.forEach((k) => check(typeof v[k] === 'string'))
const positive = (n) => check(typeof n === 'bigint' && n > 0n && n < BigInt(Number.MAX_SAFE_INTEGER))
const unique = (ids) => check(new Set(ids).size === ids.length)
const ids = (values) => { check(Array.isArray(values) && values.every(safeId)); unique(values) }
const sections = ['problem', 'alternatives', 'solution', 'metrics', 'value', 'concept', 'advantage', 'channels', 'segments', 'adopters', 'cost', 'revenue']
function canvas(v, legacy = false) {
  keys(v, [...(legacy ? ['id'] : ['schemaVersion', 'revision', 'updatedAt']), 'name', 'title', 'favorite', 'sections'], legacy ? ['notes'] : ['notes', 'legacyId'])
  strings(v, ['name', 'title', ...(v.notes === undefined ? [] : ['notes'])])
  check(typeof v.favorite === 'boolean' && Array.isArray(v.sections) && v.sections.length === 12)
  v.sections.forEach((s, i) => {
    keys(s, ['id', 'title', 'hint', 'cards'], ['number']); strings(s, ['title', 'hint'])
    check(s.id === sections[i] && Array.isArray(s.cards) && s.cards.every((c) => typeof c === 'string'))
    if (s.number !== undefined) check(typeof s.number === 'bigint' || Number.isSafeInteger(s.number))
  })
  if (legacy) check(safeId(v.id))
  else {
    check(v.schemaVersion === 1n && v.updatedAt?.timestamp && typeof v.notes === 'string'); positive(v.revision)
    if (v.legacyId !== undefined) check(typeof v.legacyId === 'string') // Historical metadata, not a live path reference.
  }
}
export function target(value) {
  keys(value, ['project', 'database', 'uid', 'workspace'])
  check(typeof value.project === 'string' && /^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(value.project) && safeId(value.uid) && typeof value.database === 'string' && /^(\(default\)|[a-z][a-z0-9-]{2,61}[a-z0-9])$/.test(value.database) && value.workspace === 'default', 'Invalid target; only workspace default is supported')
  return `projects/${value.project}/databases/${value.database}/documents/users/${value.uid}/workspaces/default`
}
export function allowedCollections(relative) {
  if (relative === '') return ['canvases']
  const p = relative.split('/')
  if (p.length === 2 && p[0] === 'canvases' && safeId(p[1])) return ['boards']
  if (p.length === 4 && p[0] === 'canvases' && safeId(p[1]) && p[2] === 'boards' && p[3] === 'default') return ['cards', 'comments']
  if (p.length === 6 && p[0] === 'canvases' && safeId(p[1]) && p[2] === 'boards' && p[3] === 'default' && ['cards', 'comments'].includes(p[4]) && safeId(p[5])) return []
  throw new Error('Unsupported descendant path')
}
export function validateSnapshot(snapshot, config) {
  keys(snapshot, ['readTime', 'documents'])
  check(timestamp(snapshot.readTime) && Array.isArray(snapshot.documents) && snapshot.documents.length <= 1000)
  const root = target(config)
  const docs = new Map()
  for (const doc of snapshot.documents) {
    keys(doc, ['name', 'fields', 'createTime', 'updateTime'])
    check(typeof doc.name === 'string' && (doc.name === root || doc.name.startsWith(`${root}/`)) && timestamp(doc.createTime) && timestamp(doc.updateTime))
    check(!docs.has(doc.name)); docs.set(doc.name, decodeFields(doc.fields))
    allowedCollections(doc.name === root ? '' : doc.name.slice(root.length + 1))
  }
  const workspace = docs.get(root)
  keys(workspace, ['schemaVersion', 'canvasOrder', 'orderRevision', 'updatedAt'], ['canvases'])
  check(workspace.schemaVersion === 2n && workspace.updatedAt?.timestamp); positive(workspace.orderRevision); ids(workspace.canvasOrder)
  check(workspace.canvasOrder.length <= 5000)
  if (workspace.canvases !== undefined) {
    check(Array.isArray(workspace.canvases)); workspace.canvases.forEach((c) => canvas(c, true)); unique(workspace.canvases.map((c) => c.id))
    // Deleted canvases may remain here as historical snapshots, not live membership.
  }
  for (const [name, v] of docs) {
    if (name === root) continue
    const p = name.slice(root.length + 1).split('/')
    check(workspace.canvasOrder.includes(p[1]), 'Canvas outside workspace order')
    if (p.length === 2) { canvas(v); continue }
    check(docs.has(`${root}/canvases/${p[1]}`), 'Orphan board')
    check(v.schemaVersion === 1n && v.canvasId === p[1] && v.updatedAt?.timestamp, 'Invalid board linkage')
    if (p.length === 4) {
      keys(v, ['schemaVersion', 'canvasId', 'revision', 'columns', 'status', 'importId', 'deletingCardId', 'updatedAt'])
      positive(v.revision); strings(v, ['importId', 'deletingCardId'])
      check(v.status === 'active' && v.deletingCardId === '', 'In-progress board operation; finish recovery first')
      check(Array.isArray(v.columns) && v.columns.length <= 100)
      v.columns.forEach((c) => { keys(c, ['id', 'title']); check(safeId(c.id) && typeof c.title === 'string') })
      unique(v.columns.map((c) => c.id))
    } else {
      const boardName = `${root}/canvases/${p[1]}/boards/default`
      const board = docs.get(boardName); check(board, 'Orphan board child')
      if (p[4] === 'cards') {
        keys(v, ['schemaVersion', 'canvasId', 'columnId', 'title', 'description', 'rank', 'updatedAt'], ['storyPoints'])
        if (v.storyPoints !== undefined && v.storyPoints !== null) check([1n, 3n, 5n, 8n, 13n, 1, 3, 5, 8, 13].includes(v.storyPoints), 'Invalid card storyPoints')
        strings(v, ['columnId', 'title', 'description', 'rank'])
        check(board.columns.some((c) => c.id === v.columnId) && /^[0-9a-z]*[1-9a-z]$/.test(v.rank), 'Invalid card linkage/rank')
      } else {
        keys(v, ['schemaVersion', 'canvasId', 'cardId', 'authorId', 'authorName', 'text', 'createdAt', 'updatedAt'])
        strings(v, ['cardId', 'authorId', 'authorName', 'text', 'createdAt'])
        check(safeId(v.cardId) && docs.has(`${boardName}/cards/${v.cardId}`), 'Dangling comment')
      }
    }
  }
  check(workspace.canvasOrder.every((id) => docs.has(`${root}/canvases/${id}`)), 'Missing ordered canvas')
  return { root, workspace, docs }
}
