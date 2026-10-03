import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import { boardDataSchema, createBoard, type BoardData } from '../src/data/board'
import { KanbanBoard } from '../src/components/board/KanbanBoard'

const render = (board: BoardData) => renderToStaticMarkup(createElement(KanbanBoard, {
  board, user: { uid: 'alice', email: null, displayName: 'Alice', photoURL: null },
  pending: false, error: null, run: async () => true, register: () => () => {},
}))

it.each(['constructor', '__proto__', 'toString', 'hasOwnProperty'])(
  'counts only immediate children for imported parent ID %s without mutating inherited objects', (id) => {
    const inherited = id === '__proto__' ? Object.prototype :
      Object.getOwnPropertyDescriptor(Object.prototype, id)!.value as object
    const before = Object.getOwnPropertyDescriptors(inherited)
    const board = boardDataSchema.parse({ ...createBoard(), cards: [
      { id, title: 'Parent', columnId: 'todo', description: '', rank: 'h' },
      { id: 'done-child', parentTicketId: id, title: 'Done child', columnId: 'done', description: '', rank: 'h' },
      { id: 'open-child', parentTicketId: id, title: 'Open child', columnId: 'todo', description: '', rank: 'h' },
      { id: 'grandchild', parentTicketId: 'open-child', title: 'Grandchild', columnId: 'done', description: '', rank: 'h' },
    ] })
    // Rendering again must not accumulate counts from the previous render.
    for (let attempt = 0; attempt < 2; attempt++) {
      const html = render(board)
      expect(html).toContain('1/2 done')
      expect(html).toContain('1/2 child tickets done.')
      expect(html).not.toContain('NaN')
    }
    expect(Object.getOwnPropertyDescriptors(inherited)).toEqual(before)
  },
)

it.each(['constructor', '__proto__', 'toString', 'hasOwnProperty'])(
  'does not show a progress badge for leaf ID %s', (id) => {
    const board = boardDataSchema.parse({ ...createBoard(), cards: [
      { id, title: 'Leaf', columnId: 'todo', description: '', rank: 'h' },
    ] })
    expect(render(board)).not.toContain('child tickets done')
    expect(render(board)).not.toContain(' done</span>')
  },
)
