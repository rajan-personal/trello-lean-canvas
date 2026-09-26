import { describe, expect, it } from 'vitest'
import { boardCommentSchema } from '../src/data/board'
import { applyBoardCommand, orderedComments } from '../src/data/board-mutations'
import { comment, populatedBoard } from './board-fixtures'

describe('comment identity and retries', () => {
  it('preserves legacy user comments and accepts explicit user/agent attribution', () => {
    expect(boardCommentSchema.parse(comment())).toEqual(comment())
    for (const authorType of ['user', 'agent'])
      expect(boardCommentSchema.parse({ ...comment(), authorType }).authorType).toBe(authorType)
    expect(boardCommentSchema.safeParse({ ...comment(), authorType: 'unknown' }).success).toBe(false)
  })
  it('deduplicates identical retries but refuses id reuse with different content', () => {
    const board = populatedBoard()
    expect(applyBoardCommand(board, { type: 'add-comment', comment: comment() })).toEqual(board)
    expect(() => applyBoardCommand(board, { type: 'add-comment', comment: { ...comment(), text: 'Changed' } })).toThrow('different content')
  })
  it('keeps chronology deterministic and separates task threads', () => {
    const board = populatedBoard()
    board.comments.push({ ...comment('earlier'), createdAt: '2026-09-01T00:00:00.000Z', authorType: 'agent' }, comment('other', 'card-b'))
    expect(orderedComments(board, 'card-a').map(({ id }) => id)).toEqual(['earlier', 'comment-a'])
  })
  it.each(['', ' \n\t ', 'x'.repeat(10001)])('rejects empty or oversized content', (text) => {
    expect(boardCommentSchema.safeParse({ ...comment(), text }).success).toBe(false)
  })
})
