import type { BoardVersion } from './board-remote-cache'
import type { BoardSummarySnapshot } from './board-firestore-read'

interface Source {
  load: () => Promise<BoardSummarySnapshot>
  subscribe: (changed: (version: BoardVersion | undefined) => void, error: (cause: Error) => void) => () => void
}

export function createBoardSummaryRemoteCache(source: Source) {
  let cached: BoardSummarySnapshot | undefined
  let reading: Promise<BoardSummarySnapshot> | undefined
  let version: BoardVersion | null | undefined
  let epoch = 0
  let healthy = true
  const invalidate = () => { cached = undefined; epoch++ }
  const load = async () => {
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
    subscribe(changed: () => void, error: (cause: Error) => void) {
      const stop = source.subscribe((next) => {
        if (next && version?.revision === next.revision && version.status === next.status) return
        version = next ?? null
        if (!(next?.status === 'active' && cached && next.revision <= cached.revision)) invalidate()
        changed()
      }, (cause) => { healthy = false; invalidate(); error(cause) })
      return () => { healthy = false; invalidate(); stop() }
    },
  }
}
