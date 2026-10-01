import { useMemo, useState } from 'react'
import type { TicketRun, TicketRunClient, TicketRunView } from '../../data/ticket-run'
import { BoardCardDialog } from './BoardCardDialog'
import { TicketRunContext } from './ticket-run-context'
import { boardStoryData, boardStoryUser } from './board-story-fixtures'

const runPreview = (status: TicketRun['status'], now: number): TicketRun => ({
  runId: 'e45b8e81-5c0a-4a5c-9ea7-e42834e6c2a2', cardId: 'plan', requestedBy: boardStoryUser.uid,
  title: 'Keep editor tools in one row', description: 'On mobile, keep formatting tools in one row and allow horizontal scrolling.',
  status, message: status === 'running' ? 'Checking toolbar scrolling at mobile widths.' :
    status === 'blocked' ? 'Please clarify whether this should also apply to Notepad.' :
    status === 'failed' ? 'Could not access the repository. Reconnect GitHub in Work and try again.' : '',
  summary: status === 'ready_for_review' ? 'Toolbar stays in one row. All formatting tools are reachable on mobile. Tests pass.' : '',
  prUrl: status === 'ready_for_review' ? 'https://github.com/rajan-personal/trello-lean-canvas/pull/28' : '',
  createdAt: now - 180000, updatedAt: now,
})

interface PreviewOptions { status?: TicketRun['status']; connected?: boolean; stale?: boolean; fail?: boolean }
// Isolated Storybook client: it cannot submit work or write production Firebase data.
function createPreviewClient({ status, connected, stale, fail }: PreviewOptions, now: number): TicketRunClient {
  let view: TicketRunView = { run: status ? runPreview(status, now) : null,
    connectedUntil: connected ? now + 3600000 : 0, fromCache: false }
  if (stale && view.run) view.run.updatedAt -= 11 * 60000
  let changed: ((value: TicketRunView) => void) | undefined
  return {
    subscribe(_cardId, listener) { changed = listener; listener(view); return () => { changed = undefined } },
    async request(_card, runId) {
      if (fail) throw new Error('Couldn’t queue this run. Try again.')
      view = { ...view, run: { ...runPreview('queued', now), runId } }; changed?.(view)
    },
  }
}
export function TicketRunStory({ status, connected = true, stale = false, fail = false }: PreviewOptions) {
  const [now] = useState(Date.now)
  const client = useMemo(() => createPreviewClient({ status, connected, stale, fail }, now), [status, connected, stale, fail, now])
  const card = { ...boardStoryData.cards[0], title: 'Keep editor tools in one row', storyPoints: 3 as const,
    description: 'On mobile, keep formatting tools in one row and allow horizontal scrolling.\n\nUse the existing theme. All tools should remain accessible.' }
  return <TicketRunContext value={client}>
    <BoardCardDialog card={card} board={{ ...boardStoryData, cards: [card], comments: [] }} user={boardStoryUser}
      pending={false} error={null} run={async () => true} register={() => () => undefined} onClose={() => undefined} />
  </TicketRunContext>
}
