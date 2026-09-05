import { readLocalBoards, readPendingImports, stageBoardImport, writeLocalBoards, LOCAL_BOARD_EVENT, type PendingImport } from './board-storage'
import { applyBoardCommand, type BoardCommand } from './board-mutations'
import { getFirestore } from 'firebase/firestore'
import { firebaseApp } from '../firebase'
import { createBoard, type BoardData } from './board'
import * as remote from './board-firestore'
import type { LeanCanvas } from './types'

export interface BoardRepository {
  load(canvasId: string): Promise<BoardData>
  initialize(canvasId: string): Promise<void>
  dispatch(canvasId: string, command: BoardCommand): Promise<void>
  subscribe(canvasId: string, changed: () => void, error: (cause: Error) => void): () => void
  stageImport(canvas: LeanCanvas, board: BoardData, importId?: string): void
  pendingImports(): PendingImport[]
  sync(canvases: LeanCanvas[]): Promise<void>
  removeLocal(canvasIds: string[]): void
  deletingCanvasIds(canvasIds: string[]): Promise<string[]>
}
export function createBoardRepository(uid: string, persistence: 'local' | 'firestore', storage: Storage = globalThis.localStorage): BoardRepository {
  const isLocal = persistence === 'local'
  const db = () => getFirestore(firebaseApp)
  const pendingKey = `lean-canvas:board-imports:${isLocal ? 'local' : uid}`
  const initialized = new Set<string>()
  const pendingImports = () => readPendingImports(storage, pendingKey)
  const writeLocal = (boards: Record<string, BoardData>) => writeLocalBoards(storage, boards)
  const repository: BoardRepository = {
    pendingImports,
    stageImport: (canvas, board, importId) => stageBoardImport(storage, pendingKey, canvas, board, importId),
    async initialize(canvasId) {
      if (initialized.has(canvasId)) return
      if (!isLocal) await remote.initializeBoard(db(), uid, canvasId)
      else {
        const boards = readLocalBoards(storage)
        if (!Object.hasOwn(boards, canvasId)) writeLocal({ ...boards, [canvasId]: createBoard() })
      }
      initialized.add(canvasId)
    },
    async load(canvasId) {
      if (!isLocal) return (await remote.readBoard(db(), uid, canvasId)).data
      const board = readLocalBoards(storage)[canvasId]
      if (!board) throw new Error('Board has not been initialized.')
      return board
    },
    async dispatch(canvasId, command) {
      if (command.type === 'add-comment' && command.comment.authorId !== uid)
        throw new Error('Comments must use the current author.')
      if (!isLocal) return remote.mutateBoard(db(), uid, canvasId, command)
      const boards = readLocalBoards(storage)
      if (!boards[canvasId]) throw new Error('Board has not been initialized.')
      writeLocal({ ...boards, [canvasId]: applyBoardCommand(boards[canvasId], command) })
    },
    subscribe(canvasId, changed, error) {
      if (!isLocal) return remote.subscribeBoard(db(), uid, canvasId, changed, error)
      const listener = () => changed()
      changed()
      globalThis.addEventListener?.('storage', listener)
      globalThis.addEventListener?.(LOCAL_BOARD_EVENT, listener)
      return () => {
        globalThis.removeEventListener?.('storage', listener)
        globalThis.removeEventListener?.(LOCAL_BOARD_EVENT, listener)
      }
    },
    async sync(canvases) {
      if (isLocal) {
        const ids = new Set(canvases.map(({ id }) => id))
        repository.removeLocal(Object.keys(readLocalBoards(storage)).filter((id) => !ids.has(id)))
      }
      await Promise.all(canvases.map(async (canvas) => {
        const pending = pendingImports().find((entry) => entry.canvas.id === canvas.id)
        if (!pending) { await repository.initialize(canvas.id); return }
        if (isLocal) writeLocal({ ...readLocalBoards(storage), [canvas.id]: pending.board })
        else await remote.importBoard(db(), uid, canvas.id, pending.board, pending.importId)
        initialized.add(canvas.id)
        storage.setItem(pendingKey, JSON.stringify(pendingImports().filter((entry) => entry.importId !== pending.importId)))
      }))
    },
    removeLocal(canvasIds) {
      if (!canvasIds.length) return
      canvasIds.forEach((id) => initialized.delete(id))
      if (isLocal) {
        const boards = readLocalBoards(storage)
        canvasIds.forEach((id) => { delete boards[id] })
        writeLocal(boards)
      }
      const removed = new Set(canvasIds)
      storage.setItem(pendingKey, JSON.stringify(pendingImports().filter((entry) => !removed.has(entry.canvas.id))))
    },
    async deletingCanvasIds(canvasIds) {
      return isLocal ? [] : remote.deletingBoardIds(db(), uid, canvasIds)
    },
  }
  return repository
}
