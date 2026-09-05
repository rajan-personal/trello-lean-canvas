import { applyBoardCommand } from '../src/data/board-mutations'
import { createBoard, type BoardComment } from '../src/data/board'
export const comment = (id = 'comment-a', cardId = 'card-a'): BoardComment => ({
  id, cardId, authorId: 'alice', authorName: 'Alice', text: 'A real comment',
  createdAt: '2026-09-04T10:00:00.000Z',
})
export function populatedBoard() {
  let board = applyBoardCommand(createBoard(), { type: 'create-card', id: 'card-a', columnId: 'backlog', title: 'First' })
  board = applyBoardCommand(board, { type: 'create-card', id: 'card-b', columnId: 'backlog', title: 'Second' })
  return applyBoardCommand(board, { type: 'add-comment', comment: comment() })
}
export class MemoryStorage implements Storage {
  private values = new Map<string, string>()
  failKey: string | null = null
  get length() { return this.values.size }
  clear() { this.values.clear() }
  getItem(key: string) { return this.values.get(key) ?? null }
  key(index: number) { return [...this.values.keys()][index] ?? null }
  removeItem(key: string) { this.values.delete(key) }
  setItem(key: string, value: string) {
    if (key === this.failKey) throw new Error('Storage quota exceeded')
    this.values.set(key, value)
  }
}
