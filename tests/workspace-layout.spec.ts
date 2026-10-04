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

for (const width of [320, 375, 390, 760]) {
test(`keeps the canvas grid intact and scrollable on mobile at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 667 })
  await openSampleCanvas(page)

  const layout = await page.locator('.lean-grid').evaluate((grid) => ({
    display: getComputedStyle(grid).display,
    gridWidth: Math.round(grid.getBoundingClientRect().width),
    boardWidth: grid.parentElement?.clientWidth ?? 0,
    panelTops: ['problem', 'solution', 'value', 'advantage', 'segments'].map((id) =>
      Math.round(grid.querySelector(`:scope > .${id}`)!.getBoundingClientRect().top),
    ),
    scrollWidth: grid.parentElement!.scrollWidth,
    pageOverflow: document.documentElement.scrollWidth > window.innerWidth,
  }))

  expect(layout.display).toBe('grid')
  expect(layout.gridWidth).toBeGreaterThanOrEqual(1000)
  expect(layout.gridWidth).toBeGreaterThan(layout.boardWidth)
  expect(layout.scrollWidth).toBeGreaterThan(layout.boardWidth)
  expect(new Set(layout.panelTops).size).toBe(1)
  expect(layout.pageOverflow).toBe(false)
})
}

test('retains desktop grid placement at 761px', async ({ page }) => {
  await page.setViewportSize({ width: 761, height: 900 })
  await openSampleCanvas(page)
  await expect(page.locator('.lean-grid')).toHaveCSS('min-width', '1000px')
  const tops = await page.locator('.canvas-column').evaluateAll((columns) => columns.map((column) => column.getBoundingClientRect().top))
  expect(new Set(tops).size).toBe(1)
})
