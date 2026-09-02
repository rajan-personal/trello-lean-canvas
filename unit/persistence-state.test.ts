import { describe, expect, it } from 'vitest'
import { acceptSaveResult, reconcileRemote } from '../src/data/persistence-state'
import type { WorkspaceValue } from '../src/data/firestore-model'
import { canvas } from './fixtures'

const workspace = (canvases: ReturnType<typeof canvas>[]): WorkspaceValue => ({
  canvases,
  revisions: Object.fromEntries(canvases.map(({ id }) => [id, 1])),
  orderRevision: 1,
})

describe('reconcileRemote', () => {
  it('does not let a stale save completion replace a newer snapshot base', () => {
    const used = workspace([canvas('a')])
    const newer = { ...workspace([canvas('a')]), orderRevision: 2 }
    const saved = { ...workspace([canvas('a')]), orderRevision: 1 }
    expect(acceptSaveResult(newer, used, saved)).toBe(newer)
    expect(acceptSaveResult(used, used, saved)).toBe(saved)
  })
  it('keeps dirty local canvases while accepting unrelated remote changes', () => {
    const originalA = canvas('a')
    const originalB = canvas('b')
    const localA = { ...originalA, notes: 'local edit' }
    const remoteB = { ...originalB, notes: 'remote edit' }
    const result = reconcileRemote(
      workspace([originalA, originalB]),
      [localA, originalB],
      workspace([originalA, remoteB]),
    )
    expect(result.canvases).toEqual([localA, remoteB])
    expect(result.conflictedIds).toEqual([])
  })

  it('reports same-canvas conflicts without discarding the local edit', () => {
    const original = canvas('a')
    const local = { ...original, notes: 'local edit' }
    const remote = { ...original, notes: 'remote edit' }
    const result = reconcileRemote(
      workspace([original]),
      [local],
      workspace([remote]),
    )
    expect(result.canvases).toEqual([local])
    expect(result.conflictedIds).toEqual(['a'])
  })

  it('preserves a dirty local order and appends remote additions', () => {
    const a = canvas('a')
    const b = canvas('b')
    const base = workspace([a, b])
    const remote = { ...workspace([a, b, canvas('c')]), orderRevision: 2 }
    const result = reconcileRemote(base, [b, a], remote)
    expect(result.canvases.map(({ id }) => id)).toEqual(['b', 'a', 'c'])
    expect(result.conflictedIds).toContain('__order__')
  })
})
