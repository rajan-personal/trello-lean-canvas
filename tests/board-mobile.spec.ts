import { expect, test } from '@playwright/test'
import type { BoardData } from '../src/data/board'
import { addBoardCard, column, openBoard, openBoardCard } from './support/board-fixtures'

for (const width of [320, 390, 760]) test.describe(`${width}px mobile board`, () => {
  test.use({ viewport: { width, height: 667 }, hasTouch: true })

  test('stacks all columns in one vertical scroll surface and opens the last ticket by touch', async ({ page }) => {
    await openBoard(page)
    await page.evaluate(() => {
      const boards = JSON.parse(localStorage.getItem('lean-canvas:boards:v1')!) as Record<string, BoardData>
      const board = Object.values(boards)[0]
      board.cards = board.columns.flatMap((column, index) => Array.from({ length: index === 0 ? 15 : 1 }, (_, cardIndex) => ({
        id: `${column.id}-${cardIndex}`, columnId: column.id, title: `${column.title} ticket ${cardIndex}`,
        description: '', rank: `${cardIndex.toString(36)}h`,
      })))
      localStorage.setItem('lean-canvas:boards:v1', JSON.stringify(boards))
      window.dispatchEvent(new Event('lean-canvas-board-change'))
    })
    await expect(column(page, 'Backlog').locator('.kanban-card')).toHaveCount(15)
    const bounds = await page.locator('.kanban-column').evaluateAll((columns) => columns.map((element) => {
      const rect = element.getBoundingClientRect()
      return { x: rect.x, right: rect.right, top: rect.top, bottom: rect.bottom,
        scrollHeight: element.scrollHeight, clientHeight: element.clientHeight }
    }))
    for (const [index, box] of bounds.entries()) {
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.right).toBeLessThanOrEqual(width)
      expect(box.scrollHeight).toBeLessThanOrEqual(box.clientHeight)
      if (index) expect(box.top).toBeGreaterThan(bounds[index - 1].bottom)
    }
    const lastTicket = column(page, 'Closed').getByRole('button', { name: 'Closed ticket 0', exact: true })
    await lastTicket.scrollIntoViewIfNeeded()
    await expect(lastTicket).toBeInViewport()
    expect((await lastTicket.boundingBox())!.height).toBeGreaterThanOrEqual(44)
    await lastTicket.tap()
    const modal = page.getByRole('dialog', { name: 'Card details' })
    const status = modal.getByRole('combobox', { name: 'Status', exact: true })
    await expect(status).toHaveValue('closed')
    expect((await status.boundingBox())!.height).toBeGreaterThanOrEqual(48)
    expect(await modal.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
    await modal.getByRole('button', { name: 'Close dialog' }).tap()
    const addColumn = page.getByRole('button', { name: '+ Add another column' })
    await addColumn.scrollIntoViewIfNeeded()
    await expect(addColumn).toBeInViewport()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
    expect(await page.locator('.kanban-lists').evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
  })
})

test('status options include custom columns and cancelled changes do not move tickets', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 667 })
  await openBoard(page)
  await addBoardCard(page, 'Keep in backlog')
  await page.getByRole('button', { name: '+ Add another column' }).click()
  await page.getByLabel('Column title', { exact: true }).fill('Waiting for customer')
  await page.getByRole('button', { name: 'Add column', exact: true }).click()
  await openBoardCard(page, 'Keep in backlog')
  const modal = page.getByRole('dialog')
  const status = modal.getByRole('combobox', { name: 'Status', exact: true })
  await status.selectOption({ label: 'Waiting for customer' })
  page.once('dialog', (dialog) => dialog.accept())
  await modal.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(column(page, 'Backlog').locator('.kanban-card')).toHaveText(['Keep in backlog'])
  await openBoardCard(page, 'Keep in backlog')
  await expect(status).toHaveValue('backlog')
  await status.selectOption({ label: 'Waiting for customer' })
  await modal.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(column(page, 'Waiting for customer').locator('.kanban-card')).toHaveText(['Keep in backlog'])
})
