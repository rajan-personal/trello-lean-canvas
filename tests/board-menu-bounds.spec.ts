import { expect, test } from '@playwright/test'
import { column, openBoard } from './support/board-fixtures'

for (const fallback of [false, true]) test(`menu stays bounded when its header scrolls out of view (fallback=${fallback})`, async ({ page }) => {
  if (fallback) await page.addInitScript(() => { delete (HTMLElement.prototype as { popover?: string }).popover })
  await page.setViewportSize({ width: 390, height: 500 })
  await openBoard(page)
  await page.evaluate(() => {
    const boards = JSON.parse(localStorage.getItem('lean-canvas:boards:v1')!)
    const board = Object.values(boards)[0] as { cards: unknown[] }
    board.cards = Array.from({ length: 20 }, (_, index) => ({ id: `card-${index}`, columnId: 'backlog',
      title: `Scrollable task ${index}`, description: '', rank: `${index.toString(36)}h` }))
    localStorage.setItem('lean-canvas:boards:v1', JSON.stringify(boards))
    window.dispatchEvent(new Event('lean-canvas-board-change'))
  })
  const backlog = column(page, 'Backlog')
  await expect(backlog.locator('.kanban-card')).toHaveCount(20)
  await backlog.getByRole('button', { name: 'Column actions for Backlog' }).click()
  const panel = page.getByRole('group', { name: 'Column actions for Backlog' })
  await backlog.evaluate((element) => { element.scrollTop = 250 })
  await expect.poll(async () => (await panel.boundingBox())!.y).toBeGreaterThanOrEqual(8)
  await expect.poll(async () => { const box = (await panel.boundingBox())!; return box.y + box.height }).toBeLessThanOrEqual(492)
  await expect(panel.getByRole('button', { name: 'Rename column' })).toBeInViewport()
  await page.keyboard.press('Escape')
  await expect(panel).toHaveCount(0)
  await expect(backlog.getByRole('button', { name: 'Column actions for Backlog' })).toBeFocused()
})
