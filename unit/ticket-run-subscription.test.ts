import { beforeEach, expect, it, vi } from 'vitest'
import { Timestamp, type Firestore } from 'firebase/firestore'
import { createTicketRunClient } from '../src/data/ticket-run-firestore'

const listeners = vi.hoisted(() => [] as { next: (snapshot: unknown) => void; fail: () => void; stop: ReturnType<typeof vi.fn> }[])
vi.mock('firebase/firestore', async (original) => ({ ...await original<object>(),
  doc: vi.fn((_db, path) => path),
  onSnapshot: vi.fn((_ref, _options, next, fail) => {
    const stop = vi.fn(); listeners.push({ next, fail, stop }); return stop
  }),
}))
const snapshot = (data?: object) => ({ data: () => data, exists: () => data !== undefined,
  metadata: { fromCache: false, hasPendingWrites: false } })
const connection = () => snapshot({ enabled: true, expiresAt: Timestamp.fromMillis(Date.now() + 60000) })
beforeEach(() => { listeners.length = 0 })
it.each([0, 1])('latches listener %s failure until both subscriptions restart', (failedIndex) => {
  const client = createTicketRunClient({} as Firestore, 'alice', 'a')
  const changed = vi.fn(), error = vi.fn()
  const stop = client.subscribe('card-a', changed, error)
  listeners[0].next(connection()); listeners[1].next(snapshot())
  expect(changed).toHaveBeenCalledTimes(1)
  listeners[failedIndex].fail()
  listeners[0].next(connection()); listeners[1].next(snapshot())
  expect(error).toHaveBeenCalledTimes(1)
  expect(changed).toHaveBeenCalledTimes(1)
  stop(); expect(listeners.slice(0, 2).every((listener) => listener.stop.mock.calls.length === 1)).toBe(true)
  client.subscribe('card-a', changed, error)
  listeners[2].next(connection())
  expect(changed).toHaveBeenCalledTimes(1)
  listeners[3].next(snapshot())
  expect(changed).toHaveBeenCalledTimes(2)
})
it('does not hide malformed status data after a connection renewal', () => {
  const changed = vi.fn(), error = vi.fn()
  createTicketRunClient({} as Firestore, 'alice', 'a').subscribe('card-a', changed, error)
  listeners[0].next(connection()); listeners[1].next(snapshot())
  listeners[1].next(snapshot({ status: 'bogus' })); listeners[0].next(connection())
  expect(error).toHaveBeenCalledTimes(1); expect(changed).toHaveBeenCalledTimes(1)
})
