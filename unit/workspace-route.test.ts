import { describe, expect, it } from 'vitest'
import { parseWorkspaceRoute, projectPath, ticketsPath } from '../src/app/workspace-route'

describe('workspace-route', () => {
  it('parses root, project, Board, and ticket routes', () => {
    expect(parseWorkspaceRoute('/')).toEqual({ kind: 'root' })
    expect(parseWorkspaceRoute(ticketsPath())).toEqual({ kind: 'tickets' })
    expect(parseWorkspaceRoute('/tickets/')).toEqual({ kind: 'tickets' })
    expect(parseWorkspaceRoute('/project/a')).toEqual({ kind: 'project', projectId: 'a', view: 'canvas' })
    expect(parseWorkspaceRoute('/project/a/ticket')).toEqual({ kind: 'project', projectId: 'a', view: 'board' })
    expect(parseWorkspaceRoute('/project/a/ticket/b')).toEqual({ kind: 'project', projectId: 'a', view: 'board', ticketId: 'b' })
    expect(parseWorkspaceRoute('/project/a/ticket/')).toEqual({ kind: 'project', projectId: 'a', view: 'board' })
  })
  it('round-trips encoded IDs without treating them as paths', () => {
    expect(parseWorkspaceRoute(projectPath('my project', 'board', 'task #1'))).toEqual({
      kind: 'project', projectId: 'my project', view: 'board', ticketId: 'task #1',
    })
  })
  it.each(['/canvases/a', '/tickets//', '/project', '/project/', '/project/a/tickets', '/project/a/ticket/b/extra',
    '/project/a//ticket', '/project/%', '/project/%2f', '/project/%5c', '/project/%00', '/project/..',
    '/project/a/ticket/%E0%A4%A', '//project/a', '/project/a/ticket/%2E'])('rejects malformed/unsupported route %s', (path) => {
    expect(parseWorkspaceRoute(path)).toEqual({ kind: 'missing' })
  })
})
