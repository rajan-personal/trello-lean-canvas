import type { Firestore } from 'firebase/firestore'
import type { BoardCommand } from './board-mutations'
import * as remote from './board-firestore'
import { createBoardRemoteCache } from './board-remote-cache'

export function createRemoteBoardAccess(db: () => Firestore, uid: string, initialize: (id: string) => Promise<void>) {
  const live = new Map<string, ReturnType<typeof createBoardRemoteCache>>()
  return {
    async load(id: string) {
      const cache = live.get(id)
      if (cache) return structuredClone((await cache.load()).data)
      await initialize(id)
      return (await remote.readBoard(db(), uid, id)).data
    },
    async dispatch(id: string, command: BoardCommand) {
      const cache = live.get(id)
      if (cache) await cache.dispatch(command)
      else { await initialize(id); await remote.mutateBoard(db(), uid, id, command) }
    },
    subscribe(id: string, changed: () => void, error: (cause: Error) => void) {
      const cache = createBoardRemoteCache({
        load: async () => { await initialize(id); return remote.readBoard(db(), uid, id) },
        mutate: (command, source) => remote.mutateBoard(db(), uid, id, command, source),
        subscribe: (next, failed) => remote.subscribeBoard(db(), uid, id, next, failed),
      })
      live.set(id, cache)
      const stop = cache.subscribe(changed, error)
      return () => { stop(); if (live.get(id) === cache) live.delete(id) }
    },
  }
}
