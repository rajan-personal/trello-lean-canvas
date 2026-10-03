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
    expect(parseWorkspaceRoute('/project/a/about/')).toEqual({ kind: 'project', projectId: 'a', view: 'about' })
    expect(parseWorkspaceRoute(projectPath('my project', 'about'))).toEqual({ kind: 'project', projectId: 'my project', view: 'about' })
  })
  it('round-trips encoded IDs without treating them as paths', () => {
    expect(parseWorkspaceRoute(projectPath('my project', 'board', 'task #1'))).toEqual({
      kind: 'project', projectId: 'my project', view: 'board', ticketId: 'task #1',
    })
  })
  it.each(['/project/a/about/extra', '/canvases/a', '/tickets//', '/project', '/project/', '/project/a/tickets', '/project/a/ticket/b/extra',
    '/project/a//ticket', '/project/%', '/project/%2f', '/project/%5c', '/project/%00', '/project/..',
    '/project/a/ticket/%E0%A4%A', '//project/a', '/project/a/ticket/%2E'])('rejects malformed/unsupported route %s', (path) => {
    expect(parseWorkspaceRoute(path)).toEqual({ kind: 'missing' })
  })
})

it('parses nested board links independently of ticket detail links', () => {
  expect(parseWorkspaceRoute('/project/a/ticket/child/board')).toEqual({
    kind: 'project', projectId: 'a', view: 'board', parentTicketId: 'child',
  })
  expect(parseWorkspaceRoute('/project/a/ticket/child/board/')).toEqual({
    kind: 'project', projectId: 'a', view: 'board', parentTicketId: 'child',
  })
  expect(parseWorkspaceRoute('/project/a/about/child/board')).toEqual({ kind: 'missing' })
  expect(parseWorkspaceRoute('/project/a/ticket/child/board/extra')).toEqual({ kind: 'missing' })
})
