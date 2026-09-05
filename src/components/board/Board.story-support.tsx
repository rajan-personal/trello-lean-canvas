import { useState, type ComponentProps } from 'react'
import { BoardCardDialog } from './BoardCardDialog'
import { KanbanBoard } from './KanbanBoard'
import { useBoardStory } from './useBoardStory'

export function BoardStory(args: ComponentProps<typeof KanbanBoard>) {
  const state = useBoardStory(args.board, args.run)
  return <KanbanBoard {...args} {...state} pending={args.pending || state.pending} error={state.error ?? args.error} />
}
export function CardDialogStory(args: ComponentProps<typeof BoardCardDialog>) {
  const initial = { ...args.board, cards: args.board.cards.map((card) => card.id === args.card.id ? args.card : card) }
  const state = useBoardStory(initial, args.run)
  const [open, setOpen] = useState(true)
  const card = state.board.cards.find(({ id }) => id === args.card.id)
  return <>
    {!open && (card ? <button onClick={() => setOpen(true)}>{card.title}</button> : <p>Card deleted</p>)}
    {open && <BoardCardDialog {...args} {...state} card={card ?? args.card}
      pending={args.pending || state.pending} error={state.error ?? args.error}
      onClose={() => { args.onClose(); setOpen(false) }} />}
  </>
}
