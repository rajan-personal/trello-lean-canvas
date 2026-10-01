import { describe, expect, it } from 'vitest'
import { activeRun, safePullRequestUrl, ticketRunSchema } from '../src/data/ticket-run'

describe('ticket run boundary', () => {
  it('never renders unsafe or unrelated result links', () => {
    expect(safePullRequestUrl('https://github.com/rajan-personal/trello-lean-canvas/pull/29'))
      .toBe('https://github.com/rajan-personal/trello-lean-canvas/pull/29')
    for (const url of ['javascript:alert(1)', 'https://github.com.evil.test/a/b/pull/1',
      'https://name:password@github.com/a/b/pull/1', 'http://github.com/a/b/pull/1',
      'https://github.com/login', 'https://github.com:444/a/b/pull/1']) expect(safePullRequestUrl(url)).toBeUndefined()
  })
  it('keeps blocked work active and rejects invalid status payloads', () => {
    const run = ticketRunSchema.parse({ runId: 'e45b8e81-5c0a-4a5c-9ea7-e42834e6c2a2', cardId: 'card-a',
      requestedBy: 'alice', title: 'Fix login', description: '', status: 'blocked', message: 'Need clarification',
      summary: '', prUrl: '', createdAt: 1, updatedAt: 2 })
    expect(activeRun(run)).toBe(true)
    expect(activeRun({ ...run, status: 'ready_for_review' })).toBe(false)
    expect(ticketRunSchema.safeParse({ ...run, status: 'done' }).success).toBe(false)
    expect(ticketRunSchema.safeParse({ ...run, callbackSecret: 'not-for-clients' }).success).toBe(false)
  })
})
