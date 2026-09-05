import { fireEvent } from 'storybook/test'
import { canvasStoryAct } from '../canvas-story-act'
import type { BoardCommand } from '../../data/board-mutations'

export const remoteBoardChange = (command: BoardCommand) => canvasStoryAct(() => {
  window.dispatchEvent(new CustomEvent('kanban-story:remote', { detail: command }))
})
export const setBoardInput = (input: HTMLElement, value: string) => canvasStoryAct(() => {
  fireEvent.change(input, { target: { value } })
})
export const submitBoardForm = (form: HTMLFormElement) => canvasStoryAct(() => { fireEvent.submit(form) })
export const dragBoardCard = (source: HTMLElement, target: HTMLElement, lowerHalf = false) => canvasStoryAct(async () => {
  const dataTransfer = new DataTransfer()
  const rect = target.getBoundingClientRect()
  fireEvent.dragStart(source, { dataTransfer })
  fireEvent.dragOver(target, { dataTransfer })
  fireEvent.drop(target, { dataTransfer, clientY: lowerHalf ? rect.bottom - 2 : rect.top + 2 })
  fireEvent.dragEnd(source, { dataTransfer })
})
