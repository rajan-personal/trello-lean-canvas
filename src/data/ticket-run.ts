import { z } from 'zod'
import type { BoardCard } from './board'

export const ticketRunSchema = z.strictObject({
  runId: z.string().uuid(), cardId: z.string().min(1), requestedBy: z.string().min(1),
  title: z.string().min(1).max(500), description: z.string().max(100000),
  status: z.enum(['queued', 'running', 'blocked', 'ready_for_review', 'failed']),
  message: z.string().max(2000), summary: z.string().max(10000),
  prUrl: z.string().max(2000), createdAt: z.number().finite(), updatedAt: z.number().finite(),
})
export type TicketRun = z.infer<typeof ticketRunSchema>
export interface TicketRunView {
  run: TicketRun | null
  connectedUntil: number
  fromCache: boolean
}
export interface TicketRunClient {
  subscribe(cardId: string, changed: (view: TicketRunView) => void, error: () => void): () => void
  request(card: BoardCard, runId: string): Promise<void>
}
export const activeRun = (run: TicketRun | null) => !!run && ['queued', 'running', 'blocked'].includes(run.status)
export const runLabels: Record<TicketRun['status'], string> = {
  queued: 'Queued', running: 'Running', blocked: 'Needs input', ready_for_review: 'Ready for review', failed: 'Failed',
}
export function safePullRequestUrl(value: string): string | undefined {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname === 'github.com' && !url.port &&
      !url.username && !url.password && /^\/[^/]+\/[^/]+\/pull\/\d+\/?$/.test(url.pathname)
      ? url.href : undefined
  } catch { return undefined }
}
