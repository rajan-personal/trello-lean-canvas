import { boardDataSchema, type BoardData, type BoardCard, type BoardComment } from './board'

export function orderedCards(board: BoardData, columnId: string): BoardCard[] {
  return board.cards.filter((card) => card.columnId === columnId)
    .sort((a, b) => a.rank < b.rank ? -1 : a.rank > b.rank ? 1 : a.id.localeCompare(b.id))
}
export function orderedComments(board: BoardData, cardId: string): BoardComment[] {
  return board.comments.filter((comment) => comment.cardId === cardId).sort((a, b) =>
    Date.parse(a.createdAt) - Date.parse(b.createdAt) || a.id.localeCompare(b.id))
}
// Variable-length lexical ranks move one record, without rewriting an entire column.
export function rankBetween(lower = '', upper = ''): string {
  const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz'
  let prefix = ''
  for (let index = 0; index < 2048; index++) {
    const low = index < lower.length ? alphabet.indexOf(lower[index]) : 0
    const high = index < upper.length ? alphabet.indexOf(upper[index]) : 35
    if (high - low > 1) return prefix + alphabet[Math.floor((low + high) / 2)]
    prefix += alphabet[low]
    if (low < high) upper = ''
  }
  throw new Error('Card ordering is too dense. Move the card to another position.')
}
export type BoardCommand =
  | { type: 'create-column'; id: string; title: string }
  | { type: 'rename-column'; id: string; title: string }
  | { type: 'move-column'; id: string; index: number }
  | { type: 'delete-column'; id: string }
  | { type: 'create-card'; id: string; columnId: string; title: string }
  | { type: 'edit-card'; id: string; title: string; description: string; columnId: string; expected: Pick<BoardCard, 'title' | 'description' | 'columnId'> }
  | { type: 'move-card'; id: string; columnId: string; index: number }
  | { type: 'delete-card'; id: string }
  | { type: 'add-comment'; comment: BoardComment }

export function applyBoardCommand(source: BoardData, command: BoardCommand): BoardData {
  const board = structuredClone(source)
  const column = (columnId: string) => {
    const found = board.columns.find((item) => item.id === columnId)
    if (!found) throw new Error('Column no longer exists.')
    return found
  }
  const card = (cardId: string) => {
    const found = board.cards.find((item) => item.id === cardId)
    if (!found) throw new Error('Card no longer exists.')
    return found
  }
  const move = (item: BoardCard, columnId: string, index: number) => {
    column(columnId)
    const others = orderedCards(board, columnId).filter(({ id }) => id !== item.id)
    const at = Math.max(0, Math.min(Math.trunc(index), others.length))
    if (!Number.isFinite(at)) throw new Error('Invalid move position.')
    item.columnId = columnId
    item.rank = rankBetween(others[at - 1]?.rank, others[at]?.rank)
  }
  switch (command.type) {
    case 'create-column': board.columns.push({ id: command.id, title: command.title }); break
    case 'rename-column': column(command.id).title = command.title; break
    case 'move-column': {
      const item = column(command.id)
      if (!Number.isInteger(command.index)) throw new Error('Invalid move position.')
      board.columns = board.columns.filter(({ id }) => id !== command.id)
      board.columns.splice(Math.max(0, Math.min(command.index, board.columns.length)), 0, item)
      break
    }
    case 'delete-column':
      column(command.id)
      if (board.cards.some((item) => item.columnId === command.id))
        throw new Error('Only empty columns can be deleted.')
      board.columns = board.columns.filter(({ id }) => id !== command.id)
      break
    case 'create-card': {
      column(command.columnId)
      const others = orderedCards(board, command.columnId)
      board.cards.push({ id: command.id, columnId: command.columnId, title: command.title,
        description: '', rank: rankBetween(others.at(-1)?.rank) })
      break
    }
    case 'edit-card': {
      const item = card(command.id)
      if (item.title !== command.expected.title || item.description !== command.expected.description ||
        item.columnId !== command.expected.columnId)
        throw new Error('This card changed elsewhere. Copy your draft, then close and reopen to review it.')
      item.title = command.title
      item.description = command.description
      if (item.columnId !== command.columnId) move(item, command.columnId, board.cards.length)
      break
    }
    case 'move-card': move(card(command.id), command.columnId, command.index); break
    case 'delete-card':
      card(command.id)
      board.cards = board.cards.filter(({ id }) => id !== command.id)
      board.comments = board.comments.filter(({ cardId }) => cardId !== command.id)
      break
    case 'add-comment':
      card(command.comment.cardId)
      board.comments.push(command.comment)
      break
  }
  return boardDataSchema.parse(board)
}
