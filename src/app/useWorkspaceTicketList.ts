import { useCallback, useEffect, useRef, useState } from 'react'
import type { BoardRepository } from '../data/board-repository'
import type { BoardSummary } from '../data/board'
import type { LeanCanvas } from '../data/types'

interface Entry { loading: boolean; summary?: BoardSummary; error: string | null }
export interface TicketListProject { canvas: LeanCanvas; loading: boolean; summary?: BoardSummary; error: string | null }

export function useWorkspaceTicketList(enabled: boolean, canvases: LeanCanvas[], repository: BoardRepository) {
  const [entries, setEntries] = useState<Record<string, Entry>>({})
  const generation = useRef(0)
  const requests = useRef(new Map<string, number>())
  const reloaders = useRef(new Map<string, () => void>())
  useEffect(() => {
    const scope = ++generation.current
    const currentReloaders = reloaders.current
    currentReloaders.clear()
    if (!enabled) { setEntries({}); return }
    const ids = new Set(canvases.map(({ id }) => id))
    const current = (id: string) => scope === generation.current && ids.has(id)
    setEntries((previous) => Object.fromEntries(canvases.map(({ id }) => {
      const entry = previous[id]
      return [id, { loading: entry?.summary ? false : true, summary: entry?.summary, error: null }]
    })))
    const load = async (id: string) => {
      const token = (requests.current.get(id) ?? 0) + 1
      requests.current.set(id, token)
      if (current(id)) setEntries((previous) => ({ ...previous, [id]: { ...previous[id], loading: true, error: null } }))
      try {
        const summary = await repository.loadSummary(id)
        if (!current(id) || requests.current.get(id) !== token) return
        setEntries((previous) => ({ ...previous, [id]: { loading: false, summary, error: null } }))
      } catch (cause) {
        if (!current(id) || requests.current.get(id) !== token) return
        setEntries((previous) => ({ ...previous, [id]: { loading: false, summary: previous[id]?.summary, error: cause instanceof Error ? cause.message : 'Tickets could not be loaded.' } }))
      }
    }
    canvases.forEach(({ id }) => currentReloaders.set(id, () => { void load(id) }))
    const stops = canvases.map(({ id }) => repository.subscribeSummary(id, () => { void load(id) }, (cause) => {
      if (current(id)) setEntries((previous) => ({ ...previous, [id]: { loading: false, summary: previous[id]?.summary, error: cause.message } }))
    }))
    canvases.forEach(({ id }) => { void load(id) })
    return () => { generation.current = scope + 1; stops.forEach((stop) => stop()); currentReloaders.clear() }
  }, [canvases, enabled, repository])
  const retry = useCallback((id: string) => reloaders.current.get(id)?.(), [])
  const projects = canvases.map((canvas) => ({ canvas, loading: entries[canvas.id]?.loading ?? true,
    summary: entries[canvas.id]?.summary, error: entries[canvas.id]?.error ?? null }))
  return { projects, retry }
}
