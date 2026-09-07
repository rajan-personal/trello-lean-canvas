export type WorkspaceRoute =
  | { kind: 'root' }
  | { kind: 'tickets' }
  | { kind: 'project'; projectId: string; view: 'canvas' | 'board'; ticketId?: string }
  | { kind: 'missing' }

export function parseWorkspaceRoute(pathname: string): WorkspaceRoute {
  if (pathname === '/') return { kind: 'root' }
  if (/^\/tickets\/?$/.test(pathname)) return { kind: 'tickets' }
  const match = /^\/project\/([^/]+)(?:\/(ticket)(?:\/([^/]+))?)?\/?$/.exec(pathname)
  if (!match) return { kind: 'missing' }
  try {
    const projectId = decodeURIComponent(match[1])
    const ticketId = match[3] === undefined ? undefined : decodeURIComponent(match[3])
    if ([projectId, ticketId].some((id) => id !== undefined && (!id || (/[/\\]/.test(id) || [...id].some((character) => character.charCodeAt(0) < 32)) || id === '.' || id === '..')))
      return { kind: 'missing' }
    return { kind: 'project', projectId, view: match[2] ? 'board' : 'canvas', ...(ticketId ? { ticketId } : {}) }
  } catch { return { kind: 'missing' } }
}

export function ticketsPath(): string { return '/tickets' }

export function projectPath(projectId: string, view: 'canvas' | 'board' = 'canvas', ticketId?: string): string {
  return `/project/${encodeURIComponent(projectId)}${view === 'board' ? `/ticket${ticketId ? `/${encodeURIComponent(ticketId)}` : ''}` : ''}`
}
