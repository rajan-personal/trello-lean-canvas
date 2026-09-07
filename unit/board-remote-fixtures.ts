import { beforeEach, vi } from 'vitest'
import { createBoardRepository } from '../src/data/board-repository'
import * as remote from '../src/data/board-firestore'
import { MemoryStorage, populatedBoard } from './board-fixtures'

vi.mock('../src/data/board-firestore', () => ({
  initializeBoard: vi.fn(), readBoard: vi.fn(), mutateBoard: vi.fn(), subscribeBoard: vi.fn(),
  importBoard: vi.fn(), deletingBoardIds: vi.fn(),
}))
export const snapshot = (revision = 1) => ({ data: populatedBoard(), revision })
let next: (value: { revision: number; status: string } | undefined) => void
let error: (cause: Error) => void
export const changed = (value: { revision: number; status: string } | undefined) => next(value)
export const failed = (cause: Error) => error(cause)
export const repository = (uid = 'alice') => createBoardRepository(uid, 'firestore', new MemoryStorage())
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(remote.readBoard).mockResolvedValue(snapshot())
  vi.mocked(remote.subscribeBoard).mockImplementation((_db, _uid, _id, onValue, onError) => {
    next = onValue
    error = onError
    return vi.fn()
  })
})
