import type { BoardComment, BoardData } from './board'

export function orderedComments(board: BoardData, cardId: string): BoardComment[] {
  return board.comments.filter((comment) => comment.cardId === cardId).sort((a, b) =>
    Date.parse(a.createdAt) - Date.parse(b.createdAt) || a.id.localeCompare(b.id))
}
export function appendComment(comments: BoardComment[], comment: BoardComment): BoardComment[] {
  const existing = comments.find(({ id }) => id === comment.id)
  if (existing && !sameComment(existing, comment)) throw new Error('Comment id already used for different content.')
  return existing ? comments : [...comments, comment]
}
export function sameComment(a: BoardComment, b: BoardComment): boolean {
  return a.id === b.id && a.cardId === b.cardId && a.authorId === b.authorId &&
    a.authorName === b.authorName && (a.authorType ?? 'user') === (b.authorType ?? 'user') && a.text === b.text
}
