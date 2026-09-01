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
  const secondRowTops = await page
    .locator('.canvas-column')
    .evaluateAll((columns) =>
      columns.map((column) =>
        Math.round(column.children[1].getBoundingClientRect().top),
      ),
    )
  const bottomPanelHeights = await page
    .locator('.bottom-panel')
    .evaluateAll((panels) =>
      panels.map((panel) => Math.round(panel.getBoundingClientRect().height)),
    )

  expect(new Set(columnHeights).size).toBe(1)
  expect(new Set(secondRowTops).size).toBe(1)
  expect(new Set(bottomPanelHeights).size).toBe(1)
})
