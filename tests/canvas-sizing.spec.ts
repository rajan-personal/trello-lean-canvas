import { expect, test } from '@playwright/test'
import { uploadCanvas } from './support/canvas-fixtures'

test('blank canvas leaves background below and long content scrolls the board', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await uploadCanvas(page, { name: 'Blank canvas' })
  await page.getByRole('tab', { name: 'Canvas', exact: true }).click()
  const grid = page.locator('.lean-grid')
  const board = page.locator('.board-scroll')
  const geometry = await grid.evaluate((element) => {
    const scroll = element.parentElement!
    const styles = getComputedStyle(scroll)
    return { grid: element.clientHeight, available: scroll.clientHeight - parseFloat(styles.paddingTop) - parseFloat(styles.paddingBottom) }
  })
  expect(geometry.grid).toBeLessThan(geometry.available)
  await expect(page.locator('.canvas-panel.solution .canvas-cell')).toHaveCSS('min-height', '160px')
  await expect(page.locator('.canvas-panel.problem .canvas-cell').last()).toHaveCSS('min-height', '112px')
  await expect(page.locator('.bottom-cell').first()).toHaveCSS('min-height', '120px')
  await uploadCanvas(page, { name: 'Long canvas', cards: { problem: Array.from({ length: 40 }, (_, index) => `Customer problem ${index + 1}`) } })
  await expect(page.getByRole('heading', { name: 'Long canvas' })).toBeVisible()
  expect(await board.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true)
  await board.evaluate((element) => { element.scrollTop = element.scrollHeight })
  await expect(page.locator('.cost .cell-heading')).toBeInViewport()
})
