import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { watchPwaUpdates } from '../src/lib/pwa-updates'

describe('mobile service worker update checks', () => {
  let page: EventTarget & { visibilityState: string }
  let browser: EventTarget
  let network: { onLine: boolean }
  let stop: () => void
  let update: ReturnType<typeof vi.fn>
  let registration: ServiceWorkerRegistration
  beforeEach(() => {
    vi.useFakeTimers()
    page = Object.assign(new EventTarget(), { visibilityState: 'visible' })
    browser = Object.assign(new EventTarget(), { setInterval, clearInterval })
    network = { onLine: true }
    vi.stubGlobal('document', page)
    vi.stubGlobal('window', browser)
    vi.stubGlobal('navigator', network)
    update = vi.fn().mockResolvedValue(undefined)
    registration = { update, installing: null } as unknown as ServiceWorkerRegistration
  })
  afterEach(() => {
    stop?.()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })
  it('checks on startup, mobile resume, reconnect, and periodically', async () => {
    stop = watchPwaUpdates(registration)
    expect(update).toHaveBeenCalledTimes(1)
    for (const event of ['visibilitychange', 'pageshow', 'online']) {
      await vi.advanceTimersByTimeAsync(60_000)
      ;(event === 'visibilitychange' ? page : browser).dispatchEvent(new Event(event))
    }
    expect(update).toHaveBeenCalledTimes(4)
    await vi.advanceTimersByTimeAsync(3_600_000)
    expect(update).toHaveBeenCalledTimes(5)
  })
  it('skips hidden, offline, and installing sessions', async () => {
    page.visibilityState = 'hidden'
    stop = watchPwaUpdates(registration)
    expect(update).not.toHaveBeenCalled()
    page.visibilityState = 'visible'
    network.onLine = false
    page.dispatchEvent(new Event('visibilitychange'))
    expect(update).not.toHaveBeenCalled()
    network.onLine = true
    Object.assign(registration, { installing: {} })
    browser.dispatchEvent(new Event('online'))
    expect(update).not.toHaveBeenCalled()
    Object.assign(registration, { installing: null })
    browser.dispatchEvent(new Event('online'))
    expect(update).toHaveBeenCalledTimes(1)
  })
  it('reports a waiting worker again when the app resumes', async () => {
    const onWaiting = vi.fn()
    Object.assign(registration, { waiting: {} })
    stop = watchPwaUpdates(registration, onWaiting)
    expect(update).not.toHaveBeenCalled()
    expect(onWaiting).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(60_000)
    browser.dispatchEvent(new Event('pageshow'))
    expect(onWaiting).toHaveBeenCalledTimes(2)
  })
  it('reports a worker that starts waiting after an update check', async () => {
    const onWaiting = vi.fn()
    update.mockImplementation(async () => {
      Object.assign(registration, { waiting: {} })
    })
    stop = watchPwaUpdates(registration, onWaiting)
    await Promise.resolve()
    expect(onWaiting).toHaveBeenCalledTimes(1)
  })
  it('contains network failures and throttles event bursts', async () => {
    update.mockRejectedValue(new Error('offline'))
    stop = watchPwaUpdates(registration)
    await Promise.resolve()
    browser.dispatchEvent(new Event('pageshow'))
    expect(update).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(60_000)
    browser.dispatchEvent(new Event('online'))
    expect(update).toHaveBeenCalledTimes(2)
  })
  it('does not overlap checks and removes listeners and timers on cleanup', async () => {
    update.mockReturnValue(new Promise(() => {}))
    stop = watchPwaUpdates(registration)
    await vi.advanceTimersByTimeAsync(60_000)
    browser.dispatchEvent(new Event('pageshow'))
    expect(update).toHaveBeenCalledTimes(1)
    stop()
    await vi.advanceTimersByTimeAsync(3_600_000)
    browser.dispatchEvent(new Event('online'))
    page.dispatchEvent(new Event('visibilitychange'))
    expect(update).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(0)
  })
})
