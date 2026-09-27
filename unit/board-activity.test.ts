import { afterEach, describe, expect, it, vi } from 'vitest'
import { activityDays, boardActivitySchema, DAY_MS, incrementActivity, activityDay, ACTIVITY_TIME_ZONE } from '../src/data/board-activity'
import { createBoardRepository } from '../src/data/board-repository'
import { boardSummary, createBoard } from '../src/data/board'
import { MemoryStorage, comment } from './board-fixtures'
import { canvas } from './fixtures'

afterEach(() => vi.useRealTimers())
describe('seven-day ticket activity', () => {
  it('aligns IST days, fills gaps, expires old counts, and never mutates history', () => {
    const day = activityDay(Date.parse('2026-09-27T18:29:59Z'))
    const history = { timeZone: ACTIVITY_TIME_ZONE, throughDay: day, counts: [1, 2, 3, 4, 5, 6, 7] }
    expect(activityDays(history, day).map(({ count }) => count)).toEqual(history.counts)
    expect(activityDays(history, day + 2).map(({ count }) => count)).toEqual([3, 4, 5, 6, 7, 0, 0])
    expect(incrementActivity(history, day + 2).counts).toEqual([3, 4, 5, 6, 7, 0, 1])
    expect(incrementActivity(history, day + 7).counts).toEqual([0, 0, 0, 0, 0, 0, 1])
    expect(history.counts).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(activityDays(undefined, day).map(({ date }) => date)).toEqual(['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25', '2026-09-26', '2026-09-27'])
    expect(activityDay((day + 1) * DAY_MS)).toBe(day + 1)
    expect(activityDay(Date.parse('2026-09-27T18:30:00Z'))).toBe(day + 1)
    expect(activityDay(Date.parse('2026-09-28T00:00:00Z'))).toBe(day + 1)
  })
  it('supports old boards and rejects invalid history', () => {
    expect(boardSummary(createBoard()).activity).toBeUndefined()
    expect(boardActivitySchema.safeParse({ throughDay: 1, counts: [-1, 0, 0, 0, 0, 0, 0] }).success).toBe(false)
    expect(boardActivitySchema.safeParse({ throughDay: 1, counts: [1] }).success).toBe(false)
    expect(boardActivitySchema.safeParse({ throughDay: 1, counts: [1.5, 0, 0, 0, 0, 0, 0] }).success).toBe(false)
  })
  it('does not relabel legacy UTC totals as IST activity', () => {
    const legacy = { throughDay: activityDay(), counts: [1, 2, 3, 4, 5, 6, 7] }
    expect(boardActivitySchema.safeParse(legacy).success).toBe(true)
    expect(activityDays(legacy, activityDay()).map(({ count }) => count)).toEqual([0, 0, 0, 0, 0, 0, 0])
    expect(incrementActivity(legacy)).toEqual({ timeZone: ACTIVITY_TIME_ZONE, throughDay: activityDay(), counts: [0, 0, 0, 0, 0, 0, 1] })
    expect(legacy.counts).toEqual([1, 2, 3, 4, 5, 6, 7])
  })
  it('persists successful ticket changes only, across reloads and IST midnight', async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-27T18:29:00Z'))
    const storage = new MemoryStorage()
    const repo = createBoardRepository('alice', 'local', storage)
    await repo.sync([canvas('a'), canvas('b')])
    await repo.dispatch('a', { type: 'create-card', id: 'card-a', title: 'Task', columnId: 'backlog' })
    const original = (await repo.load('a')).cards[0]
    await repo.dispatch('a', { type: 'edit-card', ...original, expected: original })
    await repo.dispatch('a', { type: 'add-comment', comment: comment() })
    await repo.dispatch('a', { type: 'rename-column', id: 'backlog', title: 'Ideas' })
    await expect(repo.dispatch('a', { type: 'create-card', id: 'bad', title: 'Task', columnId: 'missing' })).rejects.toThrow()
    expect((await repo.loadSummary('a')).activity?.counts).toEqual([0, 0, 0, 0, 0, 0, 1])
    await repo.dispatch('a', { type: 'edit-card', ...original, title: 'Edited', expected: original })
    await repo.dispatch('a', { type: 'move-card', id: 'card-a', columnId: 'todo', index: 0 })
    vi.setSystemTime(new Date('2026-09-27T18:31:00Z'))
    await repo.dispatch('a', { type: 'delete-card', id: 'card-a' })
    const reloaded = createBoardRepository('alice', 'local', storage)
    expect((await reloaded.loadSummary('a')).activity?.counts).toEqual([0, 0, 0, 0, 0, 3, 1])
    expect((await reloaded.loadSummary('b')).activity).toBeUndefined()
    expect((await reloaded.loadSummary('a')).cards).toEqual([])
  })
  it('does not save activity when local persistence fails', async () => {
    const storage = new MemoryStorage()
    const repo = createBoardRepository('alice', 'local', storage)
    await repo.initialize('a')
    storage.failKey = 'lean-canvas:boards:v1'
    await expect(repo.dispatch('a', { type: 'create-card', id: 'a', title: 'Task', columnId: 'backlog' })).rejects.toThrow()
    expect((await repo.loadSummary('a')).activity).toBeUndefined()
    expect((await repo.loadSummary('a')).cards).toEqual([])
  })
})
