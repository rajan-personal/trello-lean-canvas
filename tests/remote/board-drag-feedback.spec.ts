import { expect, test, type Page } from '@playwright/test'
import { column } from '../support/board-fixtures'
import { expectSteadyLayout, startLayoutWatch } from '../support/board-layout-watch'
import { routingTransport } from '../support/routing-transport'

const saving = (page: Page) => page.locator('.kanban-sync-status')
async function finishSave(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('test:hold-board-save')
    window.dispatchEvent(new Event('test:finish-board-save'))
  })
  await expect(saving(page)).toBeHidden()
}
test('drop moves immediately without a white bar, fading, or refresh snapback', async ({ context, page }) => {
  await routingTransport(context, ['hold-board-save'])
  await page.goto('/project/a/ticket')
  const first = column(page, 'Backlog').getByRole('button', { name: 'First', exact: true })
  await expect(first).toBeVisible()
  await startLayoutWatch(page)
  await first.dragTo(column(page, 'Todo'))
  await expect(column(page, 'Todo').locator('.kanban-card')).toHaveText(['First'])
  await expect(saving(page)).toHaveText('Saving board…')
  await expect(saving(page)).toHaveCSS('position', 'absolute')
  await expect(column(page, 'Todo').locator('.kanban-card')).toHaveCSS('opacity', '1')
  await expect(column(page, 'Todo').locator('.kanban-card')).toBeDisabled()
  // Persisted data is deliberately still old; a subscription refresh must not undo the preview.
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('lean-canvas:boards:v1')!).a.cards[0].columnId)).toBe('backlog')
  await page.evaluate(() => {
    localStorage.setItem('test:hold-board', 'true')
    window.dispatchEvent(new Event('lean-canvas-board-change'))
  })
  await expect(column(page, 'Todo').locator('.kanban-card')).toHaveText(['First'])
  await page.evaluate(() => {
    localStorage.removeItem('test:hold-board')
    window.dispatchEvent(new Event('test:board'))
  })
  await finishSave(page)
  await expect(column(page, 'Todo').locator('.kanban-card')).toBeEnabled()
  await expectSteadyLayout(page)
  await page.reload()
  await expect(column(page, 'Todo').locator('.kanban-card')).toHaveText(['First'])
})

test('same-column reorder previews immediately and persists', async ({ context, page }) => {
  await routingTransport(context, ['hold-board-save'])
  await page.goto('/project/a/ticket')
  const backlog = column(page, 'Backlog')
  await expect(backlog.locator('.kanban-card')).toHaveText(['First', 'Second'])
  await startLayoutWatch(page)
  await backlog.getByRole('button', { name: 'Second', exact: true }).dragTo(
    backlog.getByRole('button', { name: 'First', exact: true }), { targetPosition: { x: 20, y: 3 } })
  await expect(backlog.locator('.kanban-card')).toHaveText(['Second', 'First'])
  await expect(saving(page)).toBeVisible()
  await finishSave(page)
  await expectSteadyLayout(page)
  await page.reload()
  await expect(backlog.locator('.kanban-card')).toHaveText(['Second', 'First'])
})

test('failed move rolls back, surfaces the error, and can be retried', async ({ context, page }) => {
  await routingTransport(context, ['hold-board-save', 'fail-board-save'])
  await page.goto('/project/a/ticket')
  await column(page, 'Backlog').getByRole('button', { name: 'First', exact: true }).dragTo(column(page, 'Todo'))
  await expect(column(page, 'Todo').locator('.kanban-card')).toHaveText(['First'])
  await finishSave(page)
  await expect(page.getByRole('alert')).toContainText('Test board save failed')
  await expect(column(page, 'Backlog').locator('.kanban-card')).toHaveText(['First', 'Second'])
  await expect(column(page, 'Todo').locator('.kanban-card')).toHaveCount(0)
  await page.evaluate(() => localStorage.removeItem('test:fail-board-save'))
  await column(page, 'Backlog').getByRole('button', { name: 'First', exact: true }).dragTo(column(page, 'Todo'))
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(column(page, 'Todo').locator('.kanban-card')).toHaveText(['First'])
})

test('a no-op drop does not write or show saving feedback', async ({ context, page }) => {
  await routingTransport(context)
  await page.goto('/project/a/ticket')
  const backlog = column(page, 'Backlog')
  await backlog.getByRole('button', { name: 'Second', exact: true }).dragTo(backlog)
  await expect(backlog.locator('.kanban-card')).toHaveText(['First', 'Second'])
  expect(await page.evaluate(() => localStorage.getItem('test:board-save-started'))).toBeNull()
  await expect(saving(page)).toBeHidden()
})
