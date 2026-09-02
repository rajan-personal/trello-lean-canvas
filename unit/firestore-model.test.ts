import { describe, expect, it } from 'vitest'
import { migrationCanvases, safeCanvasId } from '../src/data/firestore-model'
import { canvas } from './fixtures'

describe('Firestore canvas identities', () => {
  it('keeps safe unique IDs and repairs unsafe or duplicate IDs deterministically', async () => {
    const input = [canvas('safe'), canvas('duplicate'), canvas('duplicate'), canvas('bad/id')]
    const first = await migrationCanvases(input)
    const second = await migrationCanvases(input)
    expect(first).toEqual(second)
    expect(first[0].id).toBe('safe')
    expect(new Set(first.map(({ id }) => id)).size).toBe(first.length)
    expect(first.every(({ id }) => safeCanvasId(id))).toBe(true)
  })
})
