import { useRef, useState, type DragEvent } from 'react'
import type { BoardData } from '../../data/board'
import { orderedCards } from '../../data/board-mutations'
import type { RunBoardCommand } from './board-ui'

export function useBoardDrag(board: BoardData, pending: boolean, run: RunBoardCommand, parentTicketId: string | null = null) {
  const dragged = useRef<string | null>(null)
  const [target, setTarget] = useState<string | null>(null)
  const end = () => { dragged.current = null; setTarget(null) }
  const start = (event: DragEvent, id: string) => {
    if (pending) { event.preventDefault(); return }
    dragged.current = id
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', id)
  }
  const over = (event: DragEvent, columnId: string) => {
    if (!dragged.current || pending) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setTarget(columnId)
  }
  const drop = (event: DragEvent, columnId: string, beforeId?: string) => {
    event.preventDefault()
    event.stopPropagation()
    const id = dragged.current
    if (!id || pending) { end(); return }
    const others = orderedCards(board, columnId, parentTicketId).filter((card) => card.id !== id)
    let index = others.length
    if (beforeId) {
      if (beforeId === id) { end(); return }
      const rect = event.currentTarget.getBoundingClientRect()
      index = others.findIndex((card) => card.id === beforeId)
      if (event.clientY > rect.top + rect.height / 2) index++
    }
    end()
    const source = board.cards.find((card) => card.id === id)
    if (source?.columnId === columnId && orderedCards(board, columnId, parentTicketId).findIndex((card) => card.id === id) === index) return
    void run({ type: 'move-card', id, columnId, index })
  }
  return { start, end, over, drop, target }
}
