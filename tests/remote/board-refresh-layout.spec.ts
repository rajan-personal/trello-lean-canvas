import { expect, test } from '@playwright/test'
import { column, expectCardTitles } from '../support/board-fixtures'
import { expectSteadyLayout, startLayoutWatch } from '../support/board-layout-watch'
import { routingTransport } from '../support/routing-transport'

test('background refresh keeps the board in place and announces progress', async ({ context, page }) => {
  await routingTransport(context)
  await page.goto('/project/a/ticket')
  await expectCardTitles(column(page, 'Backlog').locator('.kanban-card'), ['First', 'Second'])
  await startLayoutWatch(page)
  await page.evaluate(() => {
    localStorage.setItem('test:hold-board', 'true')
    window.dispatchEvent(new Event('lean-canvas-board-change'))
  })
  await expect(page.locator('.kanban-sync-status')).toHaveText('Refreshing board…')
  await expect(column(page, 'Backlog').locator('.kanban-card').first()).toHaveCSS('opacity', '1')
  await page.evaluate(() => {
    localStorage.removeItem('test:hold-board')
    window.dispatchEvent(new Event('test:board'))
  })
  await expect(page.locator('.kanban-sync-status')).toBeHidden()
  await expectSteadyLayout(page)
})

test('a concurrent deletion is not resurrected by a pending optimistic move', async ({ context, page }) => {
  await routingTransport(context, ['hold-board-save'])
  await page.goto('/project/a/ticket')
  await column(page, 'Backlog').getByRole('button', { name: 'First', exact: true }).dragTo(column(page, 'Todo'))
  await expectCardTitles(column(page, 'Todo').locator('.kanban-card'), ['First'])
  await page.evaluate(() => {
    const boards = JSON.parse(localStorage.getItem('lean-canvas:boards:v1')!)
    boards.a.cards = boards.a.cards.filter((card: { id: string }) => card.id !== 'card-a')
    boards.a.comments = []
    localStorage.setItem('lean-canvas:boards:v1', JSON.stringify(boards))
    window.dispatchEvent(new Event('lean-canvas-board-change'))
  })
  await expect(page.getByRole('button', { name: 'First', exact: true })).toHaveCount(0)
  await page.evaluate(() => {
    localStorage.removeItem('test:hold-board-save')
    window.dispatchEvent(new Event('test:finish-board-save'))
  })
  await expect(page.getByRole('alert')).toContainText('Card no longer exists')
  await expectCardTitles(column(page, 'Backlog').locator('.kanban-card'), ['Second'])
  await expect(column(page, 'Todo').locator('.kanban-card')).toHaveCount(0)
})
