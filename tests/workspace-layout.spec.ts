import { expect, test } from '@playwright/test'
import { openSampleCanvas } from './support/canvas-fixtures'

test('keeps the white canvas columns coherent and evenly sized', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1424, height: 797 })
  await openSampleCanvas(page)

  const columnHeights = await page
    .locator('.canvas-column')
    .evaluateAll((columns) =>
      columns.map((column) =>
        Math.round(column.getBoundingClientRect().height),
      ),
    )
  await expect(page.locator('.canvas-column')).toHaveCount(3)
  await expect(page.locator('.canvas-panel:not(.canvas-column):not(.bottom-panel)')).toHaveCount(4)
  await expect(page.locator('.lean-grid > .canvas-panel')).toHaveCount(9)
  const firstRowTops = await page
    .locator('.canvas-column, .canvas-panel.solution, .canvas-panel.advantage')
    .evaluateAll((columns) =>
      columns.map((column) =>
        Math.round(column.getBoundingClientRect().top),
      ),
    )
  const bottomPanelHeights = await page
    .locator('.bottom-panel')
    .evaluateAll((panels) =>
      panels.map((panel) => Math.round(panel.getBoundingClientRect().height)),
    )

  expect(new Set(columnHeights).size).toBe(1)
  expect(new Set(firstRowTops).size).toBe(1)
  expect(new Set(bottomPanelHeights).size).toBe(1)
  for (const section of await page.locator('.canvas-panel:not(.bottom-panel) .canvas-cell').all()) {
    expect(await section.evaluate((element) => element.getBoundingClientRect().width <= element.parentElement!.getBoundingClientRect().width)).toBe(true)
  }
  await expect(page.locator('.canvas-panel.value')).toHaveCSS('border-top-width', '4px')
  await expect(page.locator('.canvas-panel.value')).toHaveCSS('border-top-color', 'rgb(12, 102, 228)')
  await expect(page.locator('.canvas-panel.value strong').first()).toHaveCSS('font-size', '15px')
  for (const column of await page.locator('.canvas-column').all()) {
    await expect(column.locator('section').first()).toHaveCSS('flex-grow', '1')
    await expect(column.locator('section').last()).toHaveCSS('flex-grow', '0')
    await expect(column.locator('strong').last()).toHaveCSS('font-size', '13px')
  }
})

test('keeps the canvas grid intact and scrollable on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await openSampleCanvas(page)

  const layout = await page.locator('.lean-grid').evaluate((grid) => ({
    display: getComputedStyle(grid).display,
    gridWidth: Math.round(grid.getBoundingClientRect().width),
    boardWidth: grid.parentElement?.clientWidth ?? 0,
    columnTops: [...grid.querySelectorAll('.canvas-column')].map((column) =>
      Math.round(column.getBoundingClientRect().top),
    ),
  }))

  expect(layout.display).toBe('grid')
  expect(layout.gridWidth).toBeGreaterThan(layout.boardWidth)
  expect(new Set(layout.columnTops).size).toBe(1)
})
