import { expect, test } from '@playwright/test'
import { openSampleCanvas } from './support/canvas-fixtures'

test('renames the canvas inline from the board header', async ({ page }) => {
  await page.setViewportSize({ width: 1424, height: 797 })
  await openSampleCanvas(page)

  await page.getByRole('button', { name: 'Pulse', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)

  const titleInput = page.getByRole('textbox', { name: 'Rename canvas' })
  await expect(titleInput).toBeFocused()
  await titleInput.fill('Signal')
  await titleInput.press('Enter')

  await expect(page.getByRole('heading', { name: 'Signal' })).toBeVisible()
  await expect(
    page
      .getByRole('navigation', { name: 'Lean canvases' })
      .getByRole('button', { name: 'Signal', exact: true }),
  ).toBeVisible()
})

test('collapses and restores the desktop sidebar from the main header', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1424, height: 797 })
  await openSampleCanvas(page)

  const menuBox = await page
    .getByRole('button', { name: 'Collapse sidebar' })
    .boundingBox()
  const brandBox = await page.locator('.topbar-brand').boundingBox()
  expect(menuBox).not.toBeNull()
  expect(brandBox).not.toBeNull()
  expect(menuBox!.x + menuBox!.width).toBeLessThanOrEqual(brandBox!.x)

  await page.getByRole('button', { name: 'Collapse sidebar' }).click()
  await expect(
    page.getByRole('button', { name: 'Expand sidebar' }),
  ).toBeVisible()
  await expect
    .poll(async () =>
      page
        .locator('#canvas-sidebar')
        .evaluate((element) => element.getBoundingClientRect().width),
    )
    .toBe(0)
  await expect
    .poll(async () =>
      page
        .locator('.main-area')
        .evaluate((element) => element.getBoundingClientRect().left),
    )
    .toBe(0)

  await page.getByRole('button', { name: 'Expand sidebar' }).click()
  await expect
    .poll(async () =>
      page
        .locator('#canvas-sidebar')
        .evaluate((element) => element.getBoundingClientRect().width),
    )
    .toBe(248)
})
