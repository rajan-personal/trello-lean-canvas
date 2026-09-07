import { useEffect, useEffectEvent, useState, useSyncExternalStore } from 'react'
import { parseWorkspaceRoute } from './workspace-route'

const indexKey = 'leanWorkspaceIndex'
const historyIndex = () => typeof window.history.state?.[indexKey] === 'number'
  ? window.history.state[indexKey] as number : 0

/** One instance per workspace; previews never read or mutate browser history. */
class WorkspaceHistory {
  private path: string
  private index = 0
  private checking = false
  private deferredClose: string | null = null
  private restoring = false
  private listeners = new Set<() => void>()
  constructor(private browser: boolean) {
    this.path = browser ? window.location.pathname : '/'
  }
  snapshot = () => this.path
  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }
  private publish(path: string) {
    this.deferredClose = null
    this.path = path
    this.listeners.forEach((listener) => listener())
  }
  allow = (check: () => boolean) => {
    if (this.restoring) return false
    this.checking = true
    try {
      const accepted = check()
      if (!accepted) this.deferredClose = null
      else queueMicrotask(() => {
        // Non-routing actions still close approved editors. A route change wins instead.
        if (this.deferredClose) this.navigate(this.deferredClose)
      })
      return accepted
    } finally { this.checking = false }
  }
  navigate = (path: string, replace = false) => {
    // Closing registered editors during an exit must not add intermediate routes.
    if (this.checking) { this.deferredClose = path; return }
    if (this.restoring || path === this.path) return
    if (this.browser) {
      if (!replace) this.index++
      window.history[replace ? 'replaceState' : 'pushState'](
        { ...window.history.state, [indexKey]: this.index }, '', path)
    }
    this.publish(path)
  }
  listen(check: () => boolean) {
    if (!this.browser) return
    this.index = historyIndex()
    window.history.replaceState({ ...window.history.state, [indexKey]: this.index }, '')
    const pop = () => {
      const nextIndex = historyIndex()
      if (this.restoring) {
        if (nextIndex === this.index) this.restoring = false
        else window.history.go(this.index - nextIndex)
        return
      }
      if (!this.allow(check)) {
        const delta = this.index - nextIndex
        if (delta) {
          this.restoring = true
          window.history.go(delta)
        } else {
          // Unmanaged same-document entries (e.g. a fragment link).
          window.history.replaceState({ ...window.history.state, [indexKey]: this.index }, '', this.path)
        }
        return
      }
      this.index = nextIndex
      this.publish(window.location.pathname)
    }
    window.addEventListener('popstate', pop)
    return () => window.removeEventListener('popstate', pop)
  }
}

export function useWorkspaceRoute(browser: boolean) {
  const [history] = useState(() => new WorkspaceHistory(browser))
  const pathname = useSyncExternalStore(history.subscribe, history.snapshot)
  const route = parseWorkspaceRoute(pathname)
  return { history, route,
    view: route.kind === 'project' ? route.view : 'canvas',
    projectId: route.kind === 'project' ? route.projectId : null,
    ticketId: route.kind === 'project' ? route.ticketId ?? null : null,
  } as const
}

export function useWorkspaceHistory(history: WorkspaceHistory, check: () => boolean, browserCheck = check) {
  const checkCurrent = useEffectEvent(browserCheck)
  useEffect(() => history.listen(() => checkCurrent()), [history])
  return () => history.allow(check)
}
