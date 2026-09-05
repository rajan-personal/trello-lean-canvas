import { useState, type ComponentProps } from 'react'
import { KanbanColumn } from './KanbanColumn'
import { useBoardDrag } from './useBoardDrag'
import { useBoardStory } from './useBoardStory'
import { orderedCards } from '../../data/board-mutations'

export function ColumnStory(args: ComponentProps<typeof KanbanColumn>) {
  const state = useBoardStory({ columns: [args.column], cards: args.cards, comments: [] }, args.run)
  const [adding, setAdding] = useState(args.adding)
  const drag = useBoardDrag(state.board, args.pending || state.pending, state.run)
  return <div className="kanban-area"><KanbanColumn {...args} drag={drag} adding={adding}
    onAddingChange={(value) => { args.onAddingChange(value); setAdding(value) }} run={state.run}
    pending={args.pending || state.pending} error={state.error ?? args.error}
    cards={orderedCards(state.board, args.column.id)} /></div>
}
