import { expect, test } from '@playwright/test'
import { addBoardCard, openBoard, openBoardCard } from './support/board-fixtures'

for (const width of [1200, 390]) test(`delete sits beside Close, without a footer row (${width}px)`, async ({ page }) => {
  await page.setViewportSize({ width, height: 710 })
  await openBoard(page)
  await addBoardCard(page, 'Compact details')
  await openBoardCard(page, 'Compact details')
  const modal = page.getByRole('dialog')
  const remove = modal.locator('header').getByRole('button', { name: 'Delete card' })
  const close = modal.getByRole('button', { name: 'Close dialog' })
  await expect(remove).toBeVisible()
  await expect(remove).toHaveText('')
  await expect(remove).toHaveAttribute('title', 'Delete card')
  await expect(modal.locator('.kanban-card-tools')).toHaveCount(0)
  const deleteBox = (await remove.boundingBox())!
  const closeBox = (await close.boundingBox())!
  expect(deleteBox.y).toBe(closeBox.y)
  expect(deleteBox.x + deleteBox.width).toBeLessThan(closeBox.x)
  expect(deleteBox.width).toBeGreaterThanOrEqual(width === 390 ? 44 : 36)
  await expect(modal.getByRole('textbox', { name: 'Title', exact: true })).toBeFocused()
  page.once('dialog', (dialog) => dialog.dismiss())
  await remove.click()
  await expect(modal).toBeVisible()
  await expect(remove).toBeFocused()
})
