import { expect, test } from '@playwright/test'
import { openSampleCanvas } from './support/canvas-fixtures'

// Above phone size the canvas keeps its full-size classic grid and scrolls
// horizontally inside the board when the available width is narrower.
for (const viewport of [
  { width: 761, height: 900, columns: 10 },
  { width: 800, height: 1192, columns: 10 },
  { width: 1024, height: 768, columns: 10 },
  { width: 1200, height: 800, columns: 10 },
  { width: 1280, height: 712, columns: 10 },
  { width: 844, height: 390, columns: 1 },
]) {
  test.describe(`${viewport.width}×${viewport.height}`, () => {
    test.use({ hasTouch: true })
    test('canvas keeps its layout with every section reachable', async ({ page }, testInfo) => {
      await page.setViewportSize(viewport)
      await openSampleCanvas(page)
      await expect(page.locator('.canvas-cell')).toHaveCount(12)
      const layout = await page.locator('.lean-grid').evaluate((grid) => ({
        columns: getComputedStyle(grid).gridTemplateColumns.split(' ').length,
        width: grid.getBoundingClientRect().width,
        pageOverflow: document.documentElement.scrollWidth > window.innerWidth,
      }))
      expect(layout.columns).toBe(viewport.columns)
      expect(layout.pageOverflow).toBe(false)
      if (viewport.columns === 10) {
        expect(layout.width).toBeGreaterThanOrEqual(1000)
        const tops = await page.locator('.canvas-column').evaluateAll((columns) => columns.map((column) => Math.round(column.getBoundingClientRect().top)))
        expect(new Set(tops).size).toBe(1)
      }
      for (const section of await page.locator('.canvas-cell').all()) {
        await section.scrollIntoViewIfNeeded()
        await expect(section.getByRole('button', { name: 'Add a card', exact: true })).toBeInViewport()
      }
      await page.locator('.board-scroll').evaluate((board) => { board.scrollTo(0, 0) })
      const path = testInfo.outputPath('responsive-canvas.png')
      await page.screenshot({ path })
      await testInfo.attach('responsive-canvas', { path, contentType: 'image/png' })
    })
  })
}

test('canvas scrolls beside wide notes and returns to full width when they close', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await openSampleCanvas(page)
  const board = page.locator('.board-scroll')
  const scrolls = () => board.evaluate((element) => element.scrollWidth > element.clientWidth)
  await expect.poll(scrolls).toBe(false)
  await page.getByRole('button', { name: 'Notepad', exact: true }).click()
  const handle = page.getByRole('separator', { name: 'Resize notepad' })
  // Wait for the sidebar collapse before resizing, not an intermediate animation frame.
  await expect(handle).toHaveAttribute('aria-valuemax', '1440')
  await handle.focus()
  for (let index = 0; index < 20; index++) await handle.press('ArrowLeft')
  await expect.poll(scrolls).toBe(true)
  await expect(page.locator('.lean-grid')).toHaveCSS('min-width', '1000px')
  await page.getByRole('button', { name: 'Close notepad', exact: true }).click()
  await expect.poll(scrolls).toBe(false)
})
