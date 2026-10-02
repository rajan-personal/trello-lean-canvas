import { expect, test } from '@playwright/test'
import { routingTransport } from '../support/routing-transport'

test('one delayed skeleton survives the Suspense handoff and only enters once', async ({ context, page }) => {
  await routingTransport(context, ['hold-board'])
  let release!: () => void
  const moduleReady = new Promise<void>((resolve) => { release = resolve })
  await context.route(/\/src\/app\/WorkspaceBoard\.tsx$/, async (route) => {
    await moduleReady
    await route.continue()
  })
  await context.addInitScript(() => {
    let started = 0
    new MutationObserver(() => {
      const column = document.querySelector<HTMLElement>('.sk-column')
      if (!column) return
      if (!started) started = performance.now()
      if (column.style.visibility === 'visible') localStorage.setItem('test:skeleton-delay', String(performance.now() - started))
    }).observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] })
  })
  await page.goto('/project/a/ticket')
  const loading = page.getByRole('status').filter({ hasText: 'Loading board' })
  await expect(loading).toHaveCount(1)
  await expect(loading.locator('.sk-column').first()).toBeVisible()
  expect(Number(await page.evaluate(() => localStorage.getItem('test:skeleton-delay')))).toBeGreaterThanOrEqual(140)
  const bounds = await loading.locator('.sk-column').first().boundingBox()
  release()
  await expect(page.locator('.kanban-area[data-syncing]')).toBeVisible()
  await expect(loading).toHaveCount(1)
  await expect(loading.locator('.sk-column').first()).toBeVisible()
  expect(await loading.locator('.sk-column').first().boundingBox()).toEqual(bounds)
  await page.evaluate(() => { localStorage.removeItem('test:hold-board'); window.dispatchEvent(new Event('test:board')) })
  const lists = page.getByLabel('Board columns')
  await expect(lists).toHaveClass(/is-entering/)
  await expect(loading).toHaveCount(0)
  await expect(lists).not.toHaveClass(/is-entering/)
  await page.evaluate(() => { localStorage.setItem('test:hold-board', 'true'); window.dispatchEvent(new Event('lean-canvas-board-change')) })
  await expect(page.locator('.kanban-sync-status')).toHaveText('Refreshing board…')
  await expect(loading).toHaveCount(0)
  await expect(lists).not.toHaveClass(/is-entering/)
})

test('reduced motion disables shimmer and column entrance', async ({ context, page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await routingTransport(context, ['hold-board'])
  await page.goto('/project/a/ticket')
  await expect(page.locator('.sk-column').first()).toBeVisible()
  await expect.poll(() => page.locator('.sk-block').first().evaluate((block) => getComputedStyle(block, '::after').animationName)).toBe('none')
  await page.evaluate(() => { localStorage.removeItem('test:hold-board'); window.dispatchEvent(new Event('test:board')) })
  await expect(page.getByLabel('Board columns')).toBeVisible()
  await expect(page.locator('.kanban-column').first()).toHaveCSS('animation-name', 'none')
})

test('mobile initial error has a centered card and a working retry', async ({ context, page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await routingTransport(context, ['fail-board-load'])
  await context.route(/\/src\/data\/board-repository\.ts$/, (route) => route.fulfill({ contentType: 'text/javascript', body: `
    import { createBoardRepository as actual } from '/src/data/board-repository.ts?actual';
    export function createBoardRepository(uid) {
      const repository = actual(uid, 'local');
      return { ...repository, load: async (id) => {
        if (localStorage.getItem('test:fail-board-load')) throw new Error('Please check your connection and try again.');
        return repository.load(id);
      } };
    }` }))
  await page.goto('/project/a/ticket')
  await expect(page.getByRole('heading', { name: "Board couldn't load" })).toBeVisible()
  await expect(page.locator('.kanban-skeleton')).toHaveCount(0)
  const card = await page.getByRole('alert').boundingBox()
  expect(card!.width).toBeLessThanOrEqual(360)
  expect(card!.x).toBeGreaterThanOrEqual(0)
  expect(card!.x + card!.width).toBeLessThanOrEqual(390)
  await page.evaluate(() => localStorage.removeItem('test:fail-board-load'))
  await page.getByRole('button', { name: 'Retry loading board' }).click()
  await expect(page.getByLabel('Board columns')).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
})
