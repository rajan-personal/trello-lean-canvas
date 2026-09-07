import { boardSummary, type BoardSummary } from './board'
import { LOCAL_BOARD_EVENT, readLocalBoards } from './board-storage'

export function createLocalBoardSummaryAccess(storage: Storage) {
  const load = async (canvasId: string): Promise<BoardSummary> => {
    const board = readLocalBoards(storage)[canvasId]
    if (!board) throw new Error('Board has not been initialized.')
    return boardSummary(board)
  }
  const subscribe = (canvasId: string, changed: () => void, error: (cause: Error) => void) => {
    const listener = () => changed()
    void canvasId
    void error
    changed()
    globalThis.addEventListener?.('storage', listener)
    globalThis.addEventListener?.(LOCAL_BOARD_EVENT, listener)
    return () => {
      globalThis.removeEventListener?.('storage', listener)
      globalThis.removeEventListener?.(LOCAL_BOARD_EVENT, listener)
    }
  }
  return { load, subscribe }
}
