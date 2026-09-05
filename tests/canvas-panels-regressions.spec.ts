import { expect, test } from '@playwright/test'
import { openSampleCanvas } from './support/canvas-fixtures'

for (const width of [320, 1280]) {
  test(`hidden sidebar rejects keyboard focus at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 700 })
    await openSampleCanvas(page)
    if (width > 760) await page.getByRole('button', { name: 'Collapse sidebar' }).click()
    const sidebar = page.locator('#canvas-sidebar')
    await sidebar.locator('button').last().evaluate((button) => button.focus())
    await expect(sidebar.locator('button').last()).not.toBeFocused()
    await expect(sidebar).toHaveAttribute('inert', '')
    const opener = page.getByRole('button', { name: width > 760 ? 'Expand sidebar' : 'Open sidebar' })
    await opener.click()
    const item = sidebar.getByRole('button', { name: 'Team alignment' })
    await item.focus()
    await expect(item).toBeFocused()
    if (width <= 760) {
      await item.press('Escape')
      await expect(opener).toBeFocused()
      await expect(sidebar).toHaveAttribute('inert', '')
    } else {
      await page.setViewportSize({ width: 320, height: 700 })
      await expect(sidebar).toHaveAttribute('inert', '')
      await expect(page.getByRole('button', { name: 'Open sidebar' })).toBeFocused()
    }
  })
}

test('mobile notes leave the Canvas and Board tabs clickable', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 })
  await openSampleCanvas(page)
  await page.getByRole('button', { name: 'Notepad', exact: true }).click()
  const board = page.getByRole('tab', { name: 'Board', exact: true })
  await expect.poll(() => board.evaluate((tab) => {
    const box = tab.getBoundingClientRect()
    return tab.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2))
  })).toBe(true)
  await board.click()
  await expect(board).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('textbox', { name: 'Canvas notes' })).toBeVisible()
  await page.getByRole('tab', { name: 'Canvas', exact: true }).click()
  await expect(page.getByRole('tab', { name: 'Canvas', exact: true })).toHaveAttribute('aria-selected', 'true')
})
