import type { WorkspaceView } from '../data/workspace-view'

export type WorkspaceRoute =
  | { kind: 'root' }
  | { kind: 'tickets' }
  | { kind: 'project'; projectId: string; view: WorkspaceView; ticketId?: string }
  | { kind: 'missing' }

export function parseWorkspaceRoute(pathname: string): WorkspaceRoute {
  if (pathname === '/') return { kind: 'root' }
  if (/^\/tickets\/?$/.test(pathname)) return { kind: 'tickets' }
  const match = /^\/project\/([^/]+)(?:\/(ticket|about)(?:\/([^/]+))?)?\/?$/.exec(pathname)
  if (!match) return { kind: 'missing' }
  if (match[2] === 'about' && match[3] !== undefined) return { kind: 'missing' }
  try {
    const projectId = decodeURIComponent(match[1])
    const ticketId = match[3] === undefined ? undefined : decodeURIComponent(match[3])
    if ([projectId, ticketId].some((id) => id !== undefined && (!id || (/[/\\]/.test(id) || [...id].some((character) => character.charCodeAt(0) < 32)) || id === '.' || id === '..')))
      return { kind: 'missing' }
    return { kind: 'project', projectId, view: match[2] === 'about' ? 'about' : match[2] ? 'board' : 'canvas', ...(ticketId ? { ticketId } : {}) }
  } catch { return { kind: 'missing' } }
}

export function ticketsPath(): string { return '/tickets' }

export function projectPath(projectId: string, view: WorkspaceView = 'canvas', ticketId?: string): string {
  return `/project/${encodeURIComponent(projectId)}${view === 'about' ? '/about' : view === 'board' ? `/ticket${ticketId ? `/${encodeURIComponent(ticketId)}` : ''}` : ''}`
}
