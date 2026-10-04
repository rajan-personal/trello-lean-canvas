import { expect, test } from '@playwright/test'
import { openSampleCanvas } from './support/canvas-fixtures'

for (const viewport of [
  { width: 761, height: 900, columns: 2 },
  { width: 800, height: 1192, columns: 2 },
  { width: 1024, height: 768, columns: 10 },
  { width: 1200, height: 800, columns: 2 },
  { width: 1280, height: 712, columns: 10 },
  { width: 844, height: 390, columns: 1 },
]) {
  test.describe(`${viewport.width}×${viewport.height}`, () => {
    test.use({ hasTouch: true })
    test('canvas fits available space with every section reachable', async ({ page }, testInfo) => {
      await page.setViewportSize(viewport)
      await openSampleCanvas(page)
      await expect(page.locator('.canvas-cell')).toHaveCount(12)
      const layout = await page.locator('.lean-grid').evaluate((grid) => ({
        columns: getComputedStyle(grid).gridTemplateColumns.split(' ').length,
        scrollWidth: grid.parentElement!.scrollWidth,
        boardWidth: grid.parentElement!.clientWidth,
        panelsFit: [...grid.children].every((panel) => {
          const rect = panel.getBoundingClientRect()
          const board = grid.parentElement!.getBoundingClientRect()
          return rect.left >= board.left && rect.right <= board.right
        }),
      }))
      expect(layout.columns).toBe(viewport.columns)
      expect(layout.scrollWidth).toBeLessThanOrEqual(layout.boardWidth)
      expect(layout.panelsFit).toBe(true)
      for (const section of await page.locator('.canvas-cell').all()) {
        await section.scrollIntoViewIfNeeded()
        await expect(section.getByRole('button', { name: 'Add a card', exact: true })).toBeVisible()
      }
      await page.locator('.board-scroll').evaluate((board) => { board.scrollTop = 0 })
      const path = testInfo.outputPath('responsive-canvas.png')
      await page.screenshot({ path })
      await testInfo.attach('responsive-canvas', { path, contentType: 'image/png' })
    })
  })
}

test('canvas adapts to notes and restores its wide layout when they close', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await openSampleCanvas(page)
  const columns = () => page.locator('.lean-grid').evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(' ').length)
  const noOverflow = () => page.locator('.board-scroll').evaluate((board) => board.scrollWidth <= board.clientWidth)
  await expect.poll(columns).toBe(10)
  await page.getByRole('button', { name: 'Notepad', exact: true }).click()
  const handle = page.getByRole('separator', { name: 'Resize notepad' })
  // Wait for the sidebar collapse before resizing, not an intermediate animation frame.
  await expect(handle).toHaveAttribute('aria-valuemax', '1440')
  await handle.focus()
  for (let index = 0; index < 20; index++) await handle.press('ArrowLeft')
  await expect.poll(columns).toBe(2)
  await expect.poll(noOverflow).toBe(true)
  await page.getByRole('button', { name: 'Close notepad', exact: true }).click()
  await expect.poll(columns).toBe(10)
  await expect.poll(noOverflow).toBe(true)
})
