import type { BoardCommand } from './board-mutations'
import type { BoardSnapshot } from './board-firestore-read'

export interface BoardVersion { revision: number; status: string }
interface Source {
  load(): Promise<BoardSnapshot>
  mutate(command: BoardCommand, source?: BoardSnapshot): Promise<BoardSnapshot | undefined>
  subscribe(changed: (version: BoardVersion | undefined) => void, error: (cause: Error) => void): () => void
}

// One cache per live board subscription, never shared between accounts or retained on navigation.
// Reusing a write baseline is safe only because mutate checks its revision in a transaction.
export function createBoardRemoteCache(source: Source) {
  let cached: BoardSnapshot | undefined
  let reading: Promise<BoardSnapshot> | undefined
  let writing: Promise<void> | undefined
  // undefined means not yet observed; null is a confirmed missing board.
  let version: BoardVersion | null | undefined
  let epoch = 0
  let healthy = true
  const invalidate = () => { cached = undefined; epoch++ }
  const load = async (): Promise<BoardSnapshot> => {
    if (writing) await writing.catch(() => undefined)
    if (healthy && cached) return cached
    if (reading) return reading
    reading = (async () => {
      for (let attempt = 0; attempt < 4; attempt++) {
        const started = epoch
        const value = await source.load()
        if (started !== epoch) continue
        if (healthy) cached = value
        return value
      }
      throw new Error('Board changed while loading. Please retry.')
    })()
    try { return await reading } finally { reading = undefined }
  }
  return {
    load,
    async dispatch(command: BoardCommand) {
      // Serialize writes and let listener-triggered reads wait for the acknowledged result.
      const previous = writing
      const work = (previous ?? Promise.resolve()).catch(() => undefined).then(async () => {
        try {
          const value = await source.mutate(command, healthy ? cached : undefined)
          invalidate()
          if (healthy && value && (version === undefined || (version?.status === 'active' && version.revision <= value.revision)))
            cached = value
        } catch (cause) { invalidate(); throw cause }
      })
      writing = work
      try { await work } finally { if (writing === work) writing = undefined }
    },
    subscribe(changed: () => void, error: (cause: Error) => void) {
      const stop = source.subscribe((next) => {
        if (next && version && next.revision === version.revision && next.status === version.status) return
        version = next ?? null
        if (!(next?.status === 'active' && cached && next.revision <= cached.revision)) invalidate()
        changed()
      }, (cause) => { healthy = false; invalidate(); error(cause) })
      return () => { healthy = false; invalidate(); stop() }
    },
  }
}
